import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
export async function applyUjiMigrations(client: pg.Client): Promise<void> {
  await client.query('CREATE TABLE IF NOT EXISTS _uji_schema_versions (name text PRIMARY KEY, sha256 text NOT NULL)');
  const migrations = (await readdir(resolve(root, 'database/migrations'))).filter((name) => /^\d{3}_.+\.sql$/.test(name)).sort();
  if (new Set(migrations.map((name) => name.slice(0, 3))).size !== migrations.length) throw new Error('BLOCKED: nomor migrasi bertabrakan.');
  for (const migration of migrations) {
    const sql = await readFile(resolve(root, 'database/migrations', migration), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const previous = (await client.query('SELECT sha256 FROM _uji_schema_versions WHERE name=$1', [migration])).rows[0];
    if (previous) {
      if (previous.sha256 !== checksum) throw new Error('BLOCKED: checksum migrasi berubah.');
    } else {
      await client.query(sql);
      await client.query('INSERT INTO _uji_schema_versions VALUES ($1,$2)', [migration, checksum]);
    }
  }
}
export const ujiFixture = JSON.parse(await readFile(resolve(root, 'database/fixtures/uji/actors.proposed-0.1.json'), 'utf8')) as {
  mode: 'UJI'; clock: string;
  warehouses: {id: string; code: string; name: string}[];
  actors: {id: string; username: string; role: string; warehouse_ids: string[]}[];
};

/** Guard ini wajib sebelum DDL. Tidak menerima database bersama/ACTUAL atau URL opsi bebas. */
export function ujiConnection(value: string | undefined, role: 'siris_app' | 'siris_migrator'): string {
  try {
    const url = new URL(value ?? '');
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.hostname !== '127.0.0.1' ||
      url.port !== '55432' || url.pathname !== '/siris_uji' || url.username !== role || url.search || url.hash) throw new Error();
    return value!;
  } catch { throw new Error('BLOCKED: koneksi harus memakai role UJI yang benar pada 127.0.0.1:55432/siris_uji.'); }
}

export async function createUjiDatabase() {
  const migrationUrl = ujiConnection(process.env.DATABASE_MIGRATION_URL, 'siris_migrator');
  const runtimeUrl = ujiConnection(process.env.DATABASE_URL, 'siris_app');
  const schema = `srs_test_${randomUUID().replaceAll('-', '')}`;
  const migrator = new pg.Client({ connectionString: migrationUrl });
  await migrator.connect();
  let runtime: pg.Pool | undefined;
  let storage: string | undefined;
  try {
    const identity = (await migrator.query('SELECT current_user AS role, current_database() AS db, current_setting(\'server_version_num\') AS version')).rows[0];
    if (identity.role !== 'siris_migrator' || identity.db !== 'siris_uji' || identity.version !== '160006') throw new Error('BLOCKED: baseline PostgreSQL16.6/role UJI tidak sesuai.');
    const roles = (await migrator.query("SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolbypassrls FROM pg_roles WHERE rolname IN ('siris_migrator','siris_app')")).rows;
    if (roles.length !== 2 || roles.some((role) => role.rolsuper || role.rolcreatedb || role.rolcreaterole || role.rolbypassrls)) throw new Error('BLOCKED: role UJI memiliki hak administratif.');
    await migrator.query('BEGIN');
    await migrator.query(`CREATE SCHEMA ${schema}`);
    await migrator.query(`SET LOCAL search_path TO ${schema}, public`);
    await applyUjiMigrations(migrator);
    for (const warehouse of ujiFixture.warehouses) await migrator.query('INSERT INTO warehouses(id,code,name) VALUES($1,$2,$3)', [warehouse.id, warehouse.code, warehouse.name]);
    for (const actor of ujiFixture.actors) {
      await migrator.query('INSERT INTO users(id,username,password_hash,full_name,role) VALUES($1,$2,$3,$4,$5)', [actor.id, actor.username, 'UJI_DISABLED_AUTH', actor.username, actor.role]);
      for (const warehouse of actor.warehouse_ids) await migrator.query('INSERT INTO user_warehouses(user_id,warehouse_id) VALUES($1,$2)', [actor.id, warehouse]);
    }
    await migrator.query(`GRANT USAGE ON SCHEMA ${schema} TO siris_app`);
    await migrator.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO siris_app`);
    await migrator.query(`GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA ${schema} TO siris_app`);
    await migrator.query(`REVOKE UPDATE,DELETE,TRUNCATE ON ${schema}.audit_events FROM siris_app`);
    await migrator.query('COMMIT');
    runtime = new pg.Pool({connectionString: runtimeUrl, max: 4, options: `-c search_path=${schema},public`, connectionTimeoutMillis: 2000});
    storage = await mkdtemp(resolve(tmpdir(), 'siris-uji-storage-'));
    const pool = runtime;
    const storagePath = storage;
    return {
      schema, pool, storagePath,
      async dispose() {
        await pool.end();
        try { await migrator.query(`DROP SCHEMA ${schema} CASCADE`); }
        finally { await migrator.end(); await rm(storagePath, {recursive: true, force: true}); }
      },
    };
  } catch (error) {
    try { await migrator.query('ROLLBACK'); await migrator.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); }
    finally { await runtime?.end(); await migrator.end(); if (storage) await rm(storage, {recursive: true, force: true}); }
    // Jangan mengeluarkan error driver/connection string dari helper.
    if (error instanceof Error && error.message.startsWith('BLOCKED:')) throw error;
    throw new Error('UJI_DATABASE_SETUP_FAILED');
  }
}

export class UjiClock {
  private instant = Date.parse(ujiFixture.clock);
  now(): Date { return new Date(this.instant); }
  advance(milliseconds: number): void { this.instant += milliseconds; }
}
