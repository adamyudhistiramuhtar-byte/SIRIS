import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';

/**
 * SRS-44: migrasi, reapply, dan pemisahan ACTUAL/UJI pada database UJI terisolasi.
 * Seluruh pemeriksaan migrasi berjalan dalam satu transaksi yang di-ROLLBACK,
 * sehingga tidak meninggalkan perubahan. Tanpa DATABASE_MIGRATION_URL/DATABASE_URL
 * test ini di-skip (dilaporkan sebagai skipped, bukan PASS).
 */
const migrationUrl = process.env.DATABASE_MIGRATION_URL ?? '';
const runtimeUrl = process.env.DATABASE_URL ?? '';
const databaseDir = fileURLToPath(new URL('../../../database/', import.meta.url));

function sqlFiles(folder: 'migrations' | 'seeds'): string[] {
  return readdirSync(`${databaseDir}${folder}`)
    .filter((name) => /^\d{3}_.+\.sql$/.test(name))
    .sort()
    .map((name) => readFileSync(`${databaseDir}${folder}/${name}`, 'utf8'));
}

async function expectSqlState(client: pg.Client, sql: string, code: string): Promise<void> {
  await client.query('SAVEPOINT expected_failure');
  try {
    await client.query(sql);
    throw new Error(`Query seharusnya gagal dengan SQLSTATE ${code}: ${sql}`);
  } catch (error) {
    expect((error as { code?: string }).code).toBe(code);
  } finally {
    await client.query('ROLLBACK TO SAVEPOINT expected_failure');
  }
}

describe.skipIf(!migrationUrl)('SRS-44 migrasi referensi dan pemisahan ACTUAL/UJI', () => {
  const client = new pg.Client({ connectionString: migrationUrl });
  const scripts = [...sqlFiles('migrations'), ...sqlFiles('seeds')];

  beforeAll(async () => {
    await client.connect();
    await client.query('BEGIN');
  });

  afterAll(async () => {
    await client.query('ROLLBACK').catch(() => undefined);
    await client.end();
  });

  it('menerapkan seluruh migrasi dan seed tanpa error', async () => {
    for (const script of scripts) await client.query(script);
  });

  it('dapat diterapkan ulang (reapply) tanpa error dan tanpa duplikasi seed', async () => {
    const count = async () =>
      (
        await client.query<{ total: string }>(
          "SELECT (SELECT count(*) FROM materials WHERE mode = 'UJI') + (SELECT count(*) FROM suppliers WHERE mode = 'UJI') AS total",
        )
      ).rows[0].total;
    const before = await count();
    for (const script of scripts) await client.query(script);
    expect(await count()).toBe(before);
  });

  it('membuat tabel referensi yang diwajibkan SRS-44', async () => {
    const { rows } = await client.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    );
    const names = rows.map((row) => row.tablename);
    for (const table of ['users', 'warehouses', 'user_warehouses', 'materials', 'suppliers']) {
      expect(names).toContain(table);
    }
  });

  it('memakai nama kind DOC-07/08/09 (keputusan F-01) dan menolak nama lama', async () => {
    const insertBatch = (kind: string) =>
      `INSERT INTO import_batches (warehouse_id, kind, mode, file_name, file_size_bytes)
       VALUES ('00000000-0000-0000-0000-000000000001', '${kind}', 'UJI', 'UJI-test.csv', 1)`;
    for (const kind of ['EXPECTED', 'COMMITMENT', 'RECEIVING', 'STOCK', 'COUNT']) {
      await client.query(insertBatch(kind));
    }
    for (const legacy of ['INBOUND_REFERENCE', 'SUPPLIER_COMMITMENT', 'PHYSICAL_COUNT']) {
      await expectSqlState(client, insertBatch(legacy), '23514');
    }
  });

  it('memisahkan referensi ACTUAL dan UJI: kode sama boleh lintas mode, unik dalam mode', async () => {
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

  it('seed referensi sintetis hanya berisi mode UJI', async () => {
    const { rows } = await client.query<{ mode: string }>(
      `SELECT DISTINCT mode FROM materials WHERE id::text LIKE '20000000-%'
       UNION SELECT DISTINCT mode FROM suppliers WHERE id::text LIKE '30000000-%'`,
    );
    expect(rows.map((row) => row.mode)).toEqual(['UJI']);
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
