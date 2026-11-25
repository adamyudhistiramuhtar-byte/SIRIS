import pg from 'pg';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { applyUjiMigrations, recoverUjiCutoff005, createUjiDatabase, ujiConnection, ujiFixture } from '../../helpers/uji-database.js';

const migration = await readFile(new URL('../../../database/migrations/005_cutoff_time_nullable.sql', import.meta.url), 'utf8');
const recovery = await readFile(new URL('../../../database/migrations/recovery/005_restore_cutoff_time_required.sql', import.meta.url), 'utf8');
describe.skipIf(!process.env.DATABASE_MIGRATION_URL || !process.env.DATABASE_URL)('SRS-38 F3-1 kandidat UJI', () => {
  let database: Awaited<ReturnType<typeof createUjiDatabase>>;
  let client: pg.Client;
  beforeEach(async () => {
    database = await createUjiDatabase();
    client = new pg.Client({connectionString:ujiConnection(process.env.DATABASE_MIGRATION_URL,'siris_migrator')});
    await client.connect();
    await client.query(`SET search_path TO ${database.schema},public`);
  });
  afterEach(async () => { await client?.end(); await database?.dispose(); });
  const nullable = async () => !(await client.query("SELECT attnotnull FROM pg_attribute WHERE attrelid='cutoff_contexts'::regclass AND attname='cutoff_time'")).rows[0].attnotnull;
  async function insert(time: string | null) {
    const id = randomUUID();
    await client.query("INSERT INTO cutoff_contexts(id,warehouse_id,cutoff_date,cutoff_time,mode,status) VALUES($1,$2,'2026-11-22',$3,'UJI','SIMULATED')",[id,ujiFixture.warehouses[0].id,time]);
    return id;
  }
  it('menerima tanggal-saja dengan NULL tanpa membuat jam', async () => {
    const id = await insert(null);
    expect((await client.query('SELECT cutoff_time FROM cutoff_contexts WHERE id=$1',[id])).rows[0].cutoff_time).toBeNull();
    expect(await nullable()).toBe(true);
  });
  it('upgrade schema berisi data menjaga jam lama, termasuk00:00', async () => {
    await client.query('ALTER TABLE cutoff_contexts ALTER COLUMN cutoff_time SET NOT NULL');
    await insert('00:00:00');await insert('23:45:12');
    const before=(await client.query('SELECT to_jsonb(c) AS row FROM cutoff_contexts c ORDER BY id')).rows;
    await client.query(migration);
    expect((await client.query('SELECT to_jsonb(c) AS row FROM cutoff_contexts c ORDER BY id')).rows).toEqual(before);
    expect(await nullable()).toBe(true);
  });
  it('reapply tidak mengubah data, tanggal-saja maupun waktu', async () => {
    await insert(null);await insert('12:34:00');
    const before=(await client.query('SELECT to_jsonb(c) AS row FROM cutoff_contexts c ORDER BY id')).rows;
    await client.query(migration);await client.query(migration);
    expect((await client.query('SELECT to_jsonb(c) AS row FROM cutoff_contexts c ORDER BY id')).rows).toEqual(before);
  });
  it('schema tidak dikenal ditolak atomik tanpa perubahan waktu/data', async () => {
    await client.query('ALTER TABLE cutoff_contexts ALTER COLUMN cutoff_time SET NOT NULL');
    await insert('08:15:00');
    await client.query('ALTER TABLE cutoff_contexts ALTER COLUMN cutoff_date TYPE text USING cutoff_date::text');
    const before=(await client.query('SELECT to_jsonb(c) AS row FROM cutoff_contexts c')).rows;
    await expect(client.query(migration)).rejects.toMatchObject({code:'P0001'});
    expect(await nullable()).toBe(false);
    expect((await client.query('SELECT to_jsonb(c) AS row FROM cutoff_contexts c')).rows).toEqual(before);
  });
  it('pemulihan menolak NULL yang masih ada dan mempertahankan schema/data', async () => {
    const id=await insert(null);
    await expect(client.query(recovery)).rejects.toMatchObject({code:'P0001'});
    expect(await nullable()).toBe(true);
    expect((await client.query('SELECT cutoff_time FROM cutoff_contexts WHERE id=$1',[id])).rows[0].cutoff_time).toBeNull();
  });
  it('pemulihan NOT NULL hanya berjalan bila semua baris memiliki waktu sumber', async () => {
    await insert('09:30:00');
    await client.query(recovery);
    expect(await nullable()).toBe(false);
    await client.query(migration);
    expect(await nullable()).toBe(true);
  });
  it('recovery UJI dan ledger005 sinkron, lalu roll-forward benar-benar menerapkan005 lagi', async()=>{
    await insert('09:30:00');
    await recoverUjiCutoff005(client);
    expect(await nullable()).toBe(false);
    expect((await client.query("SELECT 1 FROM _uji_schema_versions WHERE name='005_cutoff_time_nullable.sql'")).rowCount).toBe(0);
    await applyUjiMigrations(client);
    expect(await nullable()).toBe(true);
    expect((await client.query("SELECT 1 FROM _uji_schema_versions WHERE name='005_cutoff_time_nullable.sql'")).rowCount).toBe(1);
  });
  it('CHECK008 menolak ACTUAL tanpa waktu dan UJI bukanSIMULATED tanpa mengubah waktu sumber',async()=>{
    for(const values of [['ACTUAL',null,'OPEN'],['UJI','09:30','OPEN']]) {
      await expect(client.query("INSERT INTO cutoff_contexts(id,warehouse_id,cutoff_date,cutoff_time,mode,status) VALUES($1,$2,'2026-11-22',$3,$4,$5)",
        [randomUUID(),ujiFixture.warehouses[0].id,values[1],values[0],values[2]])).rejects.toMatchObject({code:'23514'});
    }
    const id=await insert(null);
    expect((await client.query('SELECT cutoff_time,status FROM cutoff_contexts WHERE id=$1',[id])).rows[0]).toEqual({cutoff_time:null,status:'SIMULATED'});
  });
});
