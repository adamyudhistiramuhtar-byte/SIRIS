import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';

/**
 * SRS-44: migrasi, reapply, upgrade dari schema lama, dan pemisahan ACTUAL/UJI.
 * Setiap skenario berjalan pada schema sementara di dalam transaksi yang di-ROLLBACK,
 * sehingga terisolasi dari schema public dan tidak meninggalkan perubahan.
 * Tanpa DATABASE_MIGRATION_URL/DATABASE_URL test di-skip (skipped, bukan PASS).
 */
const migrationUrl = process.env.DATABASE_MIGRATION_URL ?? '';
const runtimeUrl = process.env.DATABASE_URL ?? '';
const databaseDir = fileURLToPath(new URL('../../../database/', import.meta.url));

const NEW_KINDS = ['EXPECTED', 'COMMITMENT', 'RECEIVING', 'STOCK', 'COUNT'];
const LEGACY_TO_NEW: Record<string, string> = {
  INBOUND_REFERENCE: 'EXPECTED',
  SUPPLIER_COMMITMENT: 'COMMITMENT',
  RECEIVING: 'RECEIVING',
  STOCK: 'STOCK',
  PHYSICAL_COUNT: 'COUNT',
};
const UJI_WAREHOUSE = '00000000-0000-0000-0000-000000000001';

function sqlFileNames(folder: 'migrations' | 'seeds'): string[] {
  return readdirSync(`${databaseDir}${folder}`)
    .filter((name) => /^\d{3}_.+\.sql$/.test(name))
    .sort();
}

function sql(folder: 'migrations' | 'seeds', name: string): string {
  return readFileSync(`${databaseDir}${folder}/${name}`, 'utf8');
}

async function applyAll(client: pg.Client): Promise<void> {
  for (const name of sqlFileNames('migrations')) await client.query(sql('migrations', name));
  for (const name of sqlFileNames('seeds')) await client.query(sql('seeds', name));
}

async function expectSqlState(client: pg.Client, statement: string, code: string): Promise<void> {
  await client.query('SAVEPOINT expected_failure');
  try {
    await client.query(statement);
    throw new Error(`Query seharusnya gagal dengan SQLSTATE ${code}`);
  } catch (error) {
    expect((error as { code?: string }).code).toBe(code);
  } finally {
    await client.query('ROLLBACK TO SAVEPOINT expected_failure');
  }
}

async function columns(client: pg.Client, table: string): Promise<string[]> {
  const { rows } = await client.query<{ attname: string }>(
    `SELECT attname FROM pg_attribute
     WHERE attrelid = to_regclass($1) AND attnum > 0 AND NOT attisdropped
     ORDER BY attnum`,
    [table],
  );
  return rows.map((row) => row.attname);
}

describe.skipIf(!migrationUrl)('SRS-44 migrasi database', () => {
  const client = new pg.Client({ connectionString: migrationUrl });
  let schemaCounter = 0;

  /** Menjalankan skenario pada schema baru di dalam transaksi yang selalu di-ROLLBACK. */
  async function isolated(scenario: () => Promise<void>): Promise<void> {
    schemaCounter += 1;
    const schema = `srs44_test_${process.pid}_${schemaCounter}`;
    await client.query('BEGIN');
    try {
      await client.query(`CREATE SCHEMA ${schema}`);
      await client.query(`SET LOCAL search_path TO ${schema}, public`);
      await scenario();
    } finally {
      await client.query('ROLLBACK');
    }
  }

  async function insertLegacyBatches(): Promise<Map<string, string>> {
    const ids = new Map<string, string>();
    let index = 0;
    for (const legacy of Object.keys(LEGACY_TO_NEW)) {
      index += 1;
      const id = `40000000-0000-4000-8000-00000000000${index}`;
      await client.query(
        `INSERT INTO import_batches (id, warehouse_id, import_type, mode, file_name, file_size_bytes)
         VALUES ($1, $2, $3, 'UJI', $4, 1)`,
        [id, UJI_WAREHOUSE, legacy, `UJI-legacy-${index}.csv`],
      );
      ids.set(id, legacy);
    }
    return ids;
  }

  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  describe('instalasi bersih', () => {
    it('menerapkan seluruh migrasi dan seed, lalu reapply tanpa error dan tanpa duplikasi', async () => {
      await isolated(async () => {
        await applyAll(client);
        const count = async () =>
          (
            await client.query<{ total: string }>(
              "SELECT (SELECT count(*) FROM materials WHERE mode = 'UJI') + (SELECT count(*) FROM suppliers WHERE mode = 'UJI') AS total",
            )
          ).rows[0].total;
        const before = await count();
        await applyAll(client);
        expect(await count()).toBe(before);

        const batchColumns = await columns(client, 'import_batches');
        expect(batchColumns).toContain('kind');
        expect(batchColumns).not.toContain('import_type');
        for (const table of ['users', 'warehouses', 'user_warehouses', 'materials', 'suppliers']) {
          expect(await columns(client, table)).not.toHaveLength(0);
        }
      });
    });

    it('menerima nama kind DOC-07/08/09 dan menolak nama lama', async () => {
      await isolated(async () => {
        await applyAll(client);
        const insert = (kind: string) =>
          `INSERT INTO import_batches (warehouse_id, kind, mode, file_name, file_size_bytes)
           VALUES ('${UJI_WAREHOUSE}', '${kind}', 'UJI', 'UJI-test.csv', 1)`;
        for (const kind of NEW_KINDS) await client.query(insert(kind));
        for (const legacy of ['INBOUND_REFERENCE', 'SUPPLIER_COMMITMENT', 'PHYSICAL_COUNT']) {
          await expectSqlState(client, insert(legacy), '23514');
        }
      });
    });

    it('memisahkan referensi ACTUAL dan UJI: kode sama boleh lintas mode, unik dalam mode', async () => {
      await isolated(async () => {
        await applyAll(client);
        for (const table of ['materials', 'suppliers']) {
          await client.query(
            `INSERT INTO ${table} (code, mode, name) VALUES ('ISOLASI-01', 'UJI', 'Isolasi (UJI)'), ('ISOLASI-01', 'ACTUAL', 'Isolasi (ACTUAL)')`,
          );
          const { rows } = await client.query<{ mode: string }>(
            `SELECT mode FROM ${table} WHERE code = 'ISOLASI-01' ORDER BY mode`,
          );
          expect(rows.map((row) => row.mode)).toEqual(['ACTUAL', 'UJI']);
          await expectSqlState(
            client,
            `INSERT INTO ${table} (code, mode, name) VALUES ('ISOLASI-01', 'UJI', 'Duplikat (UJI)')`,
            '23505',
          );
          await expectSqlState(
            client,
            `INSERT INTO ${table} (code, mode, name) VALUES ('ISOLASI-02', 'PRODUKSI', 'Mode tidak sah')`,
            '23514',
          );
          await expectSqlState(
            client,
            `INSERT INTO ${table} (code, mode, name) VALUES ('  ', 'UJI', 'Kode kosong')`,
            '23514',
          );
        }
      });
    });

    it('seed referensi sintetis hanya berisi mode UJI', async () => {
      await isolated(async () => {
        await applyAll(client);
        const { rows } = await client.query<{ mode: string }>(
          `SELECT DISTINCT mode FROM materials WHERE id::text LIKE '20000000-%'
           UNION SELECT DISTINCT mode FROM suppliers WHERE id::text LIKE '30000000-%'`,
        );
        expect(rows.map((row) => row.mode)).toEqual(['UJI']);
      });
    });
  });

  describe('upgrade dari migrasi 001 lama (import_type)', () => {
    it('memetakan nilai lama, mempertahankan data dan FK, serta aman di-reapply', async () => {
      await isolated(async () => {
        await client.query(sql('migrations', '001_initial_schema.sql'));
        await client.query(sql('seeds', '001_initial_seed.sql'));
        const legacy = await insertLegacyBatches();
        const firstBatch = [...legacy.keys()][0];
        const { rows: stagingRows } = await client.query<{ id: string }>(
          `INSERT INTO staging_rows (batch_id, row_number, raw_payload) VALUES ($1, 1, '{"UJI": true}') RETURNING id`,
          [firstBatch],
        );
        await client.query(
          `INSERT INTO validation_issues (batch_id, staging_row_id, severity, code, message)
           VALUES ($1, $2, 'WARNING', 'OPTIONAL_COMPONENT_ABSENT', 'UJI')`,
          [firstBatch, stagingRows[0].id],
        );

        await applyAll(client);

        const batchColumns = await columns(client, 'import_batches');
        expect(batchColumns).toContain('kind');
        expect(batchColumns).not.toContain('import_type');
        const { rows } = await client.query<{ id: string; kind: string }>(
          'SELECT id, kind FROM import_batches ORDER BY id',
        );
        expect(rows).toHaveLength(legacy.size);
        for (const row of rows) expect(row.kind).toBe(LEGACY_TO_NEW[legacy.get(row.id) ?? '']);

        const { rows: linked } = await client.query<{ total: string }>(
          `SELECT count(*) AS total FROM validation_issues v
           JOIN staging_rows s ON s.id = v.staging_row_id
           JOIN import_batches b ON b.id = s.batch_id AND b.id = v.batch_id`,
        );
        expect(linked[0].total).toBe('1');
        await expectSqlState(
          client,
          `INSERT INTO staging_rows (batch_id, row_number, raw_payload)
           VALUES ('49999999-0000-4000-8000-000000000000', 1, '{}')`,
          '23503',
        );
        await expectSqlState(
          client,
          `INSERT INTO import_batches (warehouse_id, kind, mode, file_name, file_size_bytes)
           VALUES ('${UJI_WAREHOUSE}', 'INBOUND_REFERENCE', 'UJI', 'UJI-x.csv', 1)`,
          '23514',
        );

        await applyAll(client);
        const { rows: again } = await client.query<{ id: string; kind: string }>(
          'SELECT id, kind FROM import_batches ORDER BY id',
        );
        expect(again).toEqual(rows);
      });
    });
  });

  describe('fail-closed pada kondisi tidak dikenal', () => {
    it('menolak kondisi parsial (import_type dan kind sama-sama ada) tanpa mengubah data', async () => {
      await isolated(async () => {
        await client.query(sql('migrations', '001_initial_schema.sql'));
        await client.query(sql('seeds', '001_initial_seed.sql'));
        const legacy = await insertLegacyBatches();
        await client.query('ALTER TABLE import_batches ADD COLUMN kind text');

        await expectSqlState(client, sql('migrations', '003_import_batches_kind.sql'), 'P0001');

        const { rows } = await client.query<{
          id: string;
          import_type: string;
          kind: string | null;
        }>('SELECT id, import_type, kind FROM import_batches ORDER BY id');
        for (const row of rows) {
          expect(row.import_type).toBe(legacy.get(row.id));
          expect(row.kind).toBeNull();
        }
      });
    });

    it('menolak kolom kind tanpa CHECK yang dikenal', async () => {
      await isolated(async () => {
        await client.query(
          `CREATE TABLE import_batches (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), kind text NOT NULL)`,
        );
        await expectSqlState(client, sql('migrations', '003_import_batches_kind.sql'), 'P0001');
      });
    });

    it('menolak bila tabel import_batches belum ada', async () => {
      await isolated(async () => {
        // Hanya schema sementara, agar tabel pada schema public tidak ikut terbaca.
        const { rows } = await client.query<{ schema: string }>(
          'SELECT current_schema() AS schema',
        );
        await client.query(`SET LOCAL search_path TO ${rows[0].schema}`);
        await expectSqlState(client, sql('migrations', '003_import_batches_kind.sql'), 'P0001');
      });
    });
  });
});

describe.skipIf(!runtimeUrl)('SRS-44 role runtime database bukan superuser', () => {
  const client = new pg.Client({ connectionString: runtimeUrl });

  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it('tidak memiliki atribut superuser, createdb, atau createrole', async () => {
    const { rows } = await client.query<{
      rolsuper: boolean;
      rolcreatedb: boolean;
      rolcreaterole: boolean;
    }>('SELECT rolsuper, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname = current_user');
    expect(rows[0]).toEqual({ rolsuper: false, rolcreatedb: false, rolcreaterole: false });
  });

  it('tidak dapat membuat objek pada schema public', async () => {
    const { rows } = await client.query<{ allowed: boolean }>(
      "SELECT has_schema_privilege(current_user, 'public', 'CREATE') AS allowed",
    );
    expect(rows[0].allowed).toBe(false);
  });
});
