import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile, readdir, stat, chmod } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import pg from 'pg';
import { createUjiDatabase, ujiFixture, ujiConnection, UjiClock } from '../../helpers/uji-database.js';
import { StagingService } from '../../../apps/api/src/modules/imports/staging.service.js';
import { FixtureSourceAdapter } from '../../../apps/api/src/modules/imports/fixture-source-adapter.js';
import { PrivateSourceStorage } from '../../../apps/api/src/modules/imports/private-source-storage.js';
import { readOwnedStaging } from '../../../apps/api/src/modules/imports/staging.repository.js';
import { importKinds, type ImportKind, type StageActor } from '../../../apps/api/src/modules/imports/staging-contract.js';

const adapters = importKinds.map((kind) => new FixtureSourceAdapter(kind));
const actor = (index: number): StageActor => ({actor_id: ujiFixture.actors[index].id,
  role: ujiFixture.actors[index].role as StageActor['role'], warehouse_ids: ujiFixture.actors[index].warehouse_ids});
const limits = {max_bytes: 20000, max_rows: 100, max_files: 1}; // Kebijakan fixture UJI, bukan limit operasional.
const cutoffId = '40000000-0000-4000-8000-000000000001';
const metadata = (kind: ImportKind = 'EXPECTED') => ({kind, warehouse_id: ujiFixture.warehouses[0].id,
  mode: 'UJI', source_name: 'UJI-fixture.json', source_reference: 'UJI-SRS37', contract_version: adapters[0].version,
  ...(['COUNT', 'STOCK'].includes(kind) ? {cutoff_id: cutoffId} : {})});
async function fixture(kind: ImportKind): Promise<Buffer> {
  return readFile(new URL(`../../../database/fixtures/uji/${kind.toLowerCase()}.proposed-0.1.json`, import.meta.url));
}
function parts(kind: ImportKind, bytes: Buffer) {
  return [{component: kind === 'STOCK' ? 'balance' : 'file', content: (async function* () {yield bytes;})()}];
}

describe.skipIf(!process.env.DATABASE_URL || !process.env.DATABASE_MIGRATION_URL)('SRS-50 staging UJI / PostgreSQL16.6', () => {
  let db: Awaited<ReturnType<typeof createUjiDatabase>>;
  let logger: {error: ReturnType<typeof vi.fn>};
  beforeEach(async () => {
    db = await createUjiDatabase(); logger = {error: vi.fn()};
    await db.pool.query(`INSERT INTO cutoff_contexts (id,warehouse_id,cutoff_date,cutoff_time,mode,status)
      VALUES ($1,$2,'2026-11-22','12:30','UJI','SIMULATED')`, [cutoffId, ujiFixture.warehouses[0].id]);
  });
  afterEach(async () => {await db?.dispose();});
  function service(context = actor(0), pool: Pick<pg.Pool, 'connect'> = db.pool, policy = limits) {
    return new StagingService(pool, {authorizeStage: async () => context}, new PrivateSourceStorage(db.storagePath), adapters, policy, logger, new UjiClock());
  }
  async function stage(kind: ImportKind = 'EXPECTED') {
    return service(actor(['EXPECTED', 'COMMITMENT'].includes(kind) ? 0 : 1)).stage(metadata(kind), parts(kind, await fixture(kind)));
  }
  it.each(importKinds)('%s menyimpan raw fixture, normalisasi, hash, lineage dan audit tanpa mutasi domain', async (kind) => {
    const bytes = await fixture(kind);
    const result = await stage(kind);
    const context = actor(['EXPECTED', 'COMMITMENT'].includes(kind) ? 0 : 1);
    const rows = await readOwnedStaging(db.pool, context, result.batch_id);
    const input = JSON.parse(bytes.toString());
    expect(result).toMatchObject({kind, row_count: input.rows.length, status: 'STAGED', contract_version: adapters[0].version});
    expect(rows.map((r) => r.raw_payload)).toEqual(input.rows);
    expect(rows.map((r) => r.normalized_payload)).toEqual(input.rows.map((r: {normalized: unknown}) => r.normalized));
    expect(rows.map((r) => r.row_number)).toEqual([1, 2]);
    expect(new Set(rows.map((r) => r.id)).size).toBe(2);
    const source = (await db.pool.query('SELECT * FROM import_source_files WHERE batch_id=$1', [result.batch_id])).rows[0];
    expect(source.source_hash).toBe(createHash('sha256').update(bytes).digest('hex'));
    expect((await stat(`${db.storagePath}/${source.storage_key}`)).mode & 0o777).toBe(0o600);
    expect((await db.pool.query('SELECT action,outcome,created_at FROM audit_events')).rows).toEqual([
      {action: 'import.stage', outcome: 'SUCCESS', created_at: new UjiClock().now()}]);
    for (const table of ['materials', 'suppliers']) expect((await db.pool.query(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n).toBe(0);
    expect(JSON.stringify(result)).not.toContain(source.storage_key);
    expect(JSON.stringify(result)).not.toContain(db.storagePath);
  });
  it.each([2, 3])('menolak role fixture %s dan mencatat DENIED tanpa file', async (index) => {
    await expect(service(actor(index)).stage(metadata(), parts('EXPECTED', await fixture('EXPECTED')))).rejects.toMatchObject({code: 'ACCESS_DENIED'});
    expect(await readdir(db.storagePath)).toEqual([]);
    expect((await db.pool.query('SELECT outcome FROM audit_events')).rows).toEqual([{outcome: 'DENIED'}]);
  });
  it('menolak kind milik role lain, gudang di luar assignment dan sesi tidak valid', async () => {
    await expect(service(actor(1)).stage(metadata(), parts('EXPECTED', await fixture('EXPECTED')))).rejects.toMatchObject({code: 'ACCESS_DENIED'});
    await expect(service().stage({...metadata(), warehouse_id: ujiFixture.warehouses[1].id}, parts('EXPECTED', await fixture('EXPECTED')))).rejects.toMatchObject({code: 'ACCESS_DENIED'});
    const expired = new StagingService(db.pool, {authorizeStage: async () => {throw new Error('PRIVATE_SESSION');}}, new PrivateSourceStorage(db.storagePath), adapters, limits, logger);
    await expect(expired.stage(metadata(), parts('EXPECTED', await fixture('EXPECTED')))).rejects.toMatchObject({code: 'ACCESS_DENIED'});
    expect(await readdir(db.storagePath)).toEqual([]);
  });
  it('menolak ACTUAL, actor dari metadata, path sumber dan versi parser yang tidak ada', async () => {
    for (const changes of [{mode: 'ACTUAL'}, {actor_id: actor(0).actor_id}, {source_name: '../private.json'}, {cutoff_id: 'invalid'}]) {
      await expect(service().stage({...metadata(), ...changes}, parts('EXPECTED', await fixture('EXPECTED')))).rejects.toMatchObject({code: 'INVALID_METADATA'});
    }
    await expect(service().stage({...metadata(), contract_version: 'partner-unknown'}, parts('EXPECTED', await fixture('EXPECTED')))).rejects.toMatchObject({code: 'SOURCE_REQUIRED'});
    expect(await readdir(db.storagePath)).toEqual([]);
  });
  it('menolak assignment stale dan aktif=false pada DB walaupun provider lama masih mengizinkan', async () => {
    await db.pool.query('DELETE FROM user_warehouses WHERE user_id=$1', [actor(0).actor_id]);
    await expect(service().stage(metadata(), parts('EXPECTED', await fixture('EXPECTED')))).rejects.toMatchObject({code: 'ACCESS_DENIED'});
    await db.pool.query('UPDATE users SET is_active=false WHERE id=$1', [actor(1).actor_id]);
    await expect(service(actor(1)).stage(metadata('COUNT'), parts('COUNT', await fixture('COUNT')))).rejects.toMatchObject({code: 'ACCESS_DENIED'});
  });
  it('membedakan fisik nol, belum dihitung, dan menolak null pada pasangan terhitung', async () => {
    const result = await stage('COUNT');
    const rows = await readOwnedStaging(db.pool, actor(1), result.batch_id);
    expect(rows[0].normalized_payload).toMatchObject({is_counted: true, physical_quantity: '0.000000'});
    expect(rows[1].normalized_payload).toMatchObject({is_counted: false, physical_quantity: null});
    const invalid = JSON.parse((await fixture('COUNT')).toString()); invalid.rows[0].normalized.physical_quantity = null;
    await expect(service(actor(1)).stage(metadata('COUNT'), parts('COUNT', Buffer.from(JSON.stringify(invalid))))).rejects.toMatchObject({code: 'INVALID_FILE'});
  });
  it('menolak locale ambigu, precision berlebih, tanggal kalender salah dan nomor baris duplikat', async () => {
    const original = JSON.parse((await fixture('EXPECTED')).toString());
    for (const changes of [{expected_quantity: '1.234,5'}, {expected_quantity: '1.0000001'}, {requested_date: '2026-02-30'}]) {
      const input = structuredClone(original); Object.assign(input.rows[0].normalized, changes);
      await expect(service().stage(metadata(), parts('EXPECTED', Buffer.from(JSON.stringify(input))))).rejects.toMatchObject({code: 'INVALID_FILE'});
    }
    original.rows[1].row_number = 1;
    await expect(service().stage(metadata(), parts('EXPECTED', Buffer.from(JSON.stringify(original))))).rejects.toMatchObject({code: 'INVALID_FILE'});
    expect(await readdir(db.storagePath)).toEqual([]);
  });
  it('membatasi byte/row sebelum menyimpan batch dan membersihkan file parsial', async () => {
    const bytes = await fixture('EXPECTED');
    await expect(service(actor(0), db.pool, {...limits, max_bytes: 10}).stage(metadata(), parts('EXPECTED', bytes))).rejects.toMatchObject({code: 'LIMIT_EXCEEDED'});
    await expect(service(actor(0), db.pool, {...limits, max_rows: 1}).stage(metadata(), parts('EXPECTED', bytes))).rejects.toMatchObject({code: 'LIMIT_EXCEEDED'});
    expect(await readdir(db.storagePath)).toEqual([]);
    expect((await db.pool.query('SELECT count(*)::int AS n FROM import_batches')).rows[0].n).toBe(0);
  });
  it('ownership, role dan assignment diperiksa ulang ketika preview membaca batch', async () => {
    const result = await stage();
    await expect(readOwnedStaging(db.pool, actor(1), result.batch_id)).rejects.toMatchObject({code: 'ACCESS_DENIED'});
    await db.pool.query('DELETE FROM user_warehouses WHERE user_id=$1', [actor(0).actor_id]);
    await expect(readOwnedStaging(db.pool, actor(0), result.batch_id)).rejects.toMatchObject({code: 'ACCESS_DENIED'});
  });
  it('kegagalan audit sukses menggulung batch/rows/files; FAILURE memakai jalur terpisah dan pesan aman', async () => {
    let connections = 0;
    const pool = {connect: async () => {
      const real = await db.pool.connect(); connections += 1; const fail = connections === 2;
      return new Proxy(real, {get(target, key) {
        if (key === 'query' && fail) return async (sql: string, values?: unknown[]) => {
          if (sql.includes('INSERT INTO audit_events')) throw new Error('PRIVATE_RAW_PASSWORD_STORAGE_KEY');
          return target.query(sql, values);
        };
        const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value;
      }});
    }};
    const error = await service(actor(0), pool).stage(metadata(), parts('EXPECTED', await fixture('EXPECTED'))).catch((e) => e);
    expect(error).toMatchObject({code: 'STAGING_FAILED'});
    expect((await db.pool.query('SELECT count(*)::int AS n FROM import_batches')).rows[0].n).toBe(0);
    expect((await db.pool.query('SELECT count(*)::int AS n FROM staging_rows')).rows[0].n).toBe(0);
    expect((await db.pool.query('SELECT outcome,batch_id FROM audit_events')).rows).toEqual([{outcome: 'FAILURE', batch_id: null}]);
    expect(await readdir(db.storagePath)).toEqual([]);
    expect(JSON.stringify(error) + JSON.stringify(logger.error.mock.calls)).not.toContain('PRIVATE_');
  });
  it('respons COMMIT hilang mempertahankan file dan batch SUCCESS; tidak mengklaim FAILURE/reupload aman', async () => {
    let connections = 0;
    const pool = {connect: async () => {
      const real = await db.pool.connect(); connections += 1; const lose = connections === 2;
      return new Proxy(real, {get(target, key) {
        if (key === 'query' && lose) return async (sql: string, values?: unknown[]) => {
          const response = await target.query(sql, values); if (sql === 'COMMIT') throw new Error('PRIVATE_LOST'); return response;
        };
        const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value;
      }});
    }};
    const error = await service(actor(0), pool).stage(metadata(), parts('EXPECTED', await fixture('EXPECTED'))).catch((e) => e);
    expect(error).toMatchObject({code: 'OUTCOME_UNKNOWN'});
    expect((await db.pool.query('SELECT id FROM import_batches')).rows).toEqual([{id: error.batch_id}]);
    expect((await db.pool.query('SELECT outcome FROM audit_events')).rows).toEqual([{outcome: 'SUCCESS'}]);
    expect(await readdir(db.storagePath)).toHaveLength(1);
    expect(await readOwnedStaging(db.pool, actor(0), error.batch_id)).toHaveLength(2);
  });
  it('upload konkuren tidak menimpa file/baris; hash sama bukan deduplikasi atau idempotency', async () => {
    const results = await Promise.all([stage(), stage()]);
    expect(results[0].batch_id).not.toBe(results[1].batch_id);
    expect(results[0].source_hash).toBe(results[1].source_hash);
    expect(await readdir(db.storagePath)).toHaveLength(2);
    expect((await db.pool.query('SELECT count(*)::int AS n FROM staging_rows')).rows[0].n).toBe(4);
  });
  it('root storage publik/tidak privat ditolak tanpa membocorkan path', async () => {
    await chmod(db.storagePath, 0o755);
    await expect(service().stage(metadata(), parts('EXPECTED', await fixture('EXPECTED')))).rejects.toMatchObject({code: 'STAGING_FAILED'});
    expect(await readdir(db.storagePath)).toEqual([]);
  });
  it('pencabutan assignment selama streaming upload ditolak pada transaksi final', async () => {
    const bytes = await fixture('EXPECTED');
    const content = (async function* () {
      yield bytes;
      await db.pool.query('DELETE FROM user_warehouses WHERE user_id=$1', [actor(0).actor_id]);
    })();
    await expect(service().stage(metadata(), [{component: 'file', content}])).rejects.toMatchObject({code: 'ACCESS_DENIED'});
    expect(await readdir(db.storagePath)).toEqual([]);
    expect((await db.pool.query('SELECT count(*)::int AS n FROM import_batches')).rows[0].n).toBe(0);
  });
  it('outage database hanya menghasilkan kode aman dan tidak mengakses file', async () => {
    const pool = {connect: vi.fn().mockRejectedValue(new Error('PRIVATE_PASSWORD_STORAGE_RAW'))};
    const error = await service(actor(0), pool).stage(metadata(), parts('EXPECTED', await fixture('EXPECTED'))).catch((e) => e);
    expect(error).toMatchObject({code: 'STAGING_FAILED'});
    expect(logger.error).toHaveBeenCalledWith({code: 'AUDIT_UNAVAILABLE', correlation_id: error.correlation_id});
    expect(JSON.stringify(error) + JSON.stringify(logger.error.mock.calls)).not.toContain('PRIVATE_');
    expect(await readdir(db.storagePath)).toEqual([]);
  });
  it('upgrade 001–004 berisi data mempertahankan batch/row legacy tanpa mengarang normalized', async () => {
    const client = new pg.Client({connectionString: ujiConnection(process.env.DATABASE_MIGRATION_URL, 'siris_migrator')});
    await client.connect();
    const legacy = `${db.schema}_legacy`;
    try {
      await client.query('BEGIN'); await client.query(`CREATE SCHEMA ${legacy}`);
      await client.query(`SET LOCAL search_path TO ${legacy},public`);
      for (const file of ['001_initial_schema.sql','002_reference_masters.sql','003_import_batches_kind.sql','004_audit_lineage.sql']) {
        await client.query(await readFile(new URL(`../../../database/migrations/${file}`, import.meta.url), 'utf8'));
      }
      const warehouse = (await client.query("INSERT INTO warehouses(code,name) VALUES ('UJI-legacy','UJI') RETURNING id")).rows[0].id;
      const batch = (await client.query("INSERT INTO import_batches(warehouse_id,kind,mode,file_name,file_size_bytes) VALUES ($1,'EXPECTED','UJI','UJI-legacy',1) RETURNING id", [warehouse])).rows[0].id;
      await client.query("INSERT INTO staging_rows(batch_id,row_number,raw_payload) VALUES($1,1,'{\"UJI\":true}')", [batch]);
      const sql = await readFile(new URL('../../../database/migrations/006_import_staging_sources.sql', import.meta.url), 'utf8');
      await client.query(sql); await client.query(sql);
      expect((await client.query('SELECT batch_id,row_number,raw_payload,normalized_payload,component FROM staging_rows')).rows).toEqual([
        {batch_id: batch, row_number: 1, raw_payload: {UJI: true}, normalized_payload: null, component: null}]);
      expect((await client.query('SELECT contract_version,source_hash FROM import_batches')).rows).toEqual([{contract_version: null, source_hash: null}]);
    } finally {await client.query('ROLLBACK'); await client.end();}
  });
  it('migrasi 006 reapply menjaga baris legacy dan menolak schema drift secara atomik', async () => {
    const client = new pg.Client({connectionString: ujiConnection(process.env.DATABASE_MIGRATION_URL, 'siris_migrator')});
    await client.connect();
    try {
      await client.query(`SET search_path TO ${db.schema},public`);
      await client.query(`INSERT INTO import_batches(warehouse_id,kind,mode,file_name,file_size_bytes) VALUES ($1,'EXPECTED','UJI','UJI-legacy',10)`, [ujiFixture.warehouses[0].id]);
      const before = (await client.query('SELECT * FROM import_batches')).rows;
      const sql = await readFile(new URL('../../../database/migrations/006_import_staging_sources.sql', import.meta.url), 'utf8');
      await client.query(sql); await client.query(sql);
      expect((await client.query('SELECT * FROM import_batches')).rows).toEqual(before);
      await client.query('ALTER TABLE import_source_files ADD COLUMN unexpected text');
      await expect(client.query(sql)).rejects.toMatchObject({code: 'P0001'});
      expect((await client.query('SELECT * FROM import_batches')).rows).toEqual(before);
    } finally {await client.end();}
  });
});
