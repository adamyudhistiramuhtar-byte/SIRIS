import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { AuditService, AuditedTransactionError } from '../../../apps/api/src/modules/audit/audit.service.js';
import { auditCorrelationId, createAuditRecord, type AuditInput } from '../../../apps/api/src/modules/audit/audit-event.js';
import { appendAuditEvent } from '../../../apps/api/src/modules/audit/audit.repository.js';
import { applyUjiMigrations, createUjiDatabase, UjiClock, ujiConnection, ujiFixture } from '../../helpers/uji-database.js';

const baseEvent: AuditInput = {
  actor_id: ujiFixture.actors[0].id, warehouse_id: ujiFixture.warehouses[0].id,
  mode: 'UJI', action: 'import.commit', outcome: 'SUCCESS', correlation_id: '30000000-0000-4000-8000-000000000001',
};

describe('pengaman dan redaksi audit tanpa database', () => {
  it('mempertahankan cause konflik domain untuk SRS-52 tanpa menyalinnya ke JSON', async () => {
    const cause = Object.assign(new Error('PRIVATE_CONFLICT_SENTINEL'), {code:'IDEMPOTENCY_CONFLICT'});
    const client = {query:vi.fn().mockResolvedValue({rowCount:1,rows:[]}),release:vi.fn()};
    const service = new AuditService({connect:async()=>client} as unknown as pg.Pool,{error:vi.fn()},new UjiClock());
    const error = await service.transaction({...baseEvent,outcome:'SUCCESS'},async()=>{throw cause;}).catch((error)=>error);
    expect(error.cause).toBe(cause);
    expect(error.code).toBe('TRANSACTION_FAILED');
    expect(JSON.stringify(error)).not.toContain('PRIVATE_CONFLICT_SENTINEL');
  });
  it('menolak raw/credential/storage key dan action bebas sebelum koneksi', () => {
    const input = {...baseEvent, context_safe: {raw:'PRIVATE_SENTINEL'}} as unknown as AuditInput;
    expect(() => createAuditRecord(input)).toThrow('INVALID_AUDIT_EVENT');
    expect(() => createAuditRecord({...baseEvent, action:'PRIVATE_SENTINEL'} as unknown as AuditInput)).toThrow('INVALID_AUDIT_EVENT');
  });
  it('mengganti header correlation non-UUID dengan UUID tanpa menyimpan raw', () => {
    expect(auditCorrelationId(baseEvent.correlation_id)).toBe(baseEvent.correlation_id);
    expect(auditCorrelationId('PRIVATE_SENTINEL')).toMatch(/^[0-9a-f-]{36}$/);
  });
  it('outage total hanya menulis kode aman, bukan audit sukses', async () => {
    const logger = {error:vi.fn()};
    const pool = {connect:vi.fn().mockRejectedValue(new Error('RAW_PASSWORD_STORAGE_SENTINEL'))};
    const service = new AuditService(pool as unknown as pg.Pool, logger, new UjiClock());
    const error = await service.transaction({...baseEvent, outcome:'SUCCESS'}, async () => 1).catch((failure) => failure);
    expect(error).toBeInstanceOf(AuditedTransactionError);
    expect(error.audit_recorded).toBe(false);
    expect(pool.connect).toHaveBeenCalledTimes(3);
    expect(logger.error).toHaveBeenCalledExactlyOnceWith({code:'AUDIT_UNAVAILABLE',correlation_id:baseEvent.correlation_id});
    expect(JSON.stringify(error)+JSON.stringify(logger.error.mock.calls)).not.toContain('SENTINEL');
  });
  it('guard UJI menolak database ACTUAL, role bootstrap dan URL remote tanpa mengungkap credential', () => {
    for (const value of [undefined,'postgresql://postgres@127.0.0.1:55432/siris_uji','postgresql://siris_app@127.0.0.1:55432/actual','postgresql://siris_app@example.invalid:55432/siris_uji']) {
      expect(() => ujiConnection(value,'siris_app')).toThrow('BLOCKED:');
    }
  });
});

describe.skipIf(!process.env.DATABASE_URL || !process.env.DATABASE_MIGRATION_URL)('SRS-49/54 PostgreSQL16.6 UJI', () => {
  let database: Awaited<ReturnType<typeof createUjiDatabase>>;
  const logger = {error:vi.fn()};
  let audit: AuditService;
  beforeEach(async () => {
    database = await createUjiDatabase();
    logger.error.mockClear();
    audit = new AuditService(database.pool, logger, new UjiClock());
  });
  afterEach(async () => { await database?.dispose(); });

  async function batch() {
    const id = randomUUID();
    const field = (await database.pool.query("SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='import_batches' AND column_name='kind'")).rowCount ? 'kind' : 'import_type';
    await database.pool.query(`INSERT INTO import_batches(id,warehouse_id,${field},mode,file_name,file_size_bytes,created_by) VALUES($1,$2,$3,'UJI','UJI-synthetic',1,$4)`, [id,baseEvent.warehouse_id,field==='kind'?'EXPECTED':'INBOUND_REFERENCE',baseEvent.actor_id]);
    const row = (await database.pool.query("INSERT INTO staging_rows(batch_id,row_number,raw_payload) VALUES($1,1,'{\"fixture\":\"UJI\"}') RETURNING id",[id])).rows[0].id;
    return {id,row};
  }

  it('fixture empat role/dua gudang, runtime non-admin dan append-only tersedia', async () => {
    expect((await database.pool.query('SELECT role FROM users ORDER BY role')).rows.map((row) => row.role)).toEqual(['MANAGEMENT','PRODUCTION','PURCHASING','WAREHOUSE']);
    expect((await database.pool.query('SELECT count(*)::int AS count FROM warehouses')).rows[0].count).toBe(2);
    const access = (await database.pool.query("SELECT current_user AS role, has_schema_privilege(current_user,current_schema(),'CREATE') AS ddl, has_table_privilege(current_user,'audit_events','UPDATE') AS edit")).rows[0];
    expect(access).toEqual({role:'siris_app',ddl:false,edit:false});
  });

  it('trigger menolak UPDATE DELETE dan TRUNCATE oleh pemilik tabel, bukan hanya privilege runtime', async () => {
    await audit.recordOutcome({...baseEvent,outcome:'DENIED'});
    const owner=new pg.Client({connectionString:ujiConnection(process.env.DATABASE_MIGRATION_URL,'siris_migrator')});
    await owner.connect();
    try {
      await owner.query(`SET search_path TO ${database.schema},public`);
      for(const sql of ["UPDATE audit_events SET outcome='FAILURE'",'DELETE FROM audit_events','TRUNCATE audit_events']) {
        await expect(owner.query(sql)).rejects.toMatchObject({code:'42501',message:'Audit bersifat append-only'});
      }
      expect((await owner.query('SELECT count(*)::int AS n FROM audit_events')).rows[0].n).toBe(1);
    } finally {await owner.end();}
  });

  it('domain dan audit SUCCESS dengan source row/scope yang sama committed atomik', async () => {
    const item = await batch();
    const value = await audit.transaction({...baseEvent,outcome:'SUCCESS',batch_id:item.id,source_row_id:item.row,context_safe:{row_count:1}}, async (client) => {
      await client.query('UPDATE import_batches SET row_count=1 WHERE id=$1',[item.id]); return 'ok';
    });
    expect(value).toBe('ok');
    const rows = (await database.pool.query('SELECT b.row_count,a.outcome,a.source_row_id,a.created_at FROM import_batches b JOIN audit_events a ON a.batch_id=b.id WHERE b.id=$1',[item.id])).rows;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({row_count:1,outcome:'SUCCESS',source_row_id:item.row});
    expect(rows[0].created_at.toISOString()).toBe(ujiFixture.clock);
  });

  it('kegagalan mutasi rollback domain, lalu audit FAILURE ditulis terpisah tanpa raw', async () => {
    const item = await batch();
    await expect(audit.transaction({...baseEvent,outcome:'SUCCESS',batch_id:item.id,source_row_id:item.row},async (client) => {
      await client.query('UPDATE import_batches SET row_count=9 WHERE id=$1',[item.id]); throw new Error('RAW_PASSWORD_STORAGE_SENTINEL');
    })).rejects.toMatchObject({code:'TRANSACTION_FAILED',audit_recorded:true});
    expect((await database.pool.query('SELECT row_count FROM import_batches WHERE id=$1',[item.id])).rows[0].row_count).toBe(0);
    const events = (await database.pool.query('SELECT * FROM audit_events')).rows;
    expect(events).toHaveLength(1); expect(events[0]).toMatchObject({outcome:'FAILURE',batch_id:null,source_row_id:null});
    expect(JSON.stringify(events)).not.toContain('SENTINEL');
  });

  it('kegagalan audit SUCCESS juga rollback mutasi domain', async () => {
    const item = await batch();
    await expect(audit.transaction({...baseEvent,outcome:'SUCCESS',batch_id:item.id,warehouse_id:ujiFixture.warehouses[1].id},async (client) => {
      await client.query('UPDATE import_batches SET row_count=9 WHERE id=$1',[item.id]);
    })).rejects.toMatchObject({code:'TRANSACTION_FAILED',audit_recorded:true});
    expect((await database.pool.query('SELECT row_count FROM import_batches WHERE id=$1',[item.id])).rows[0].row_count).toBe(0);
    expect((await database.pool.query("SELECT count(*)::int AS count FROM audit_events WHERE outcome='SUCCESS'")).rows[0].count).toBe(0);
  });

  it('CANCELLED atomik dan DENIED tersedia tanpa perubahan domain', async () => {
    const item = await batch();
    await audit.transaction({...baseEvent,outcome:'CANCELLED',action:'import.cancel',batch_id:item.id},async (client) => {
      await client.query("UPDATE import_batches SET status='CANCELLED' WHERE id=$1",[item.id]);
    });
    expect(await audit.recordOutcome({...baseEvent,outcome:'DENIED',action:'authorization.check',context_safe:{reason_code:'ACCESS_DENIED'}})).toBe(true);
    expect((await database.pool.query('SELECT outcome FROM audit_events ORDER BY outcome')).rows.map((row) => row.outcome)).toEqual(['CANCELLED','DENIED']);
  });

  it('source row dari batch lain ditolak oleh FK komposit dan audit immutable', async () => {
    const first = await batch(); const second = await batch();
    const client = await database.pool.connect();
    try {
      await expect(appendAuditEvent(client,createAuditRecord({...baseEvent,batch_id:first.id,source_row_id:second.row}))).rejects.toMatchObject({code:'23503'});
      await appendAuditEvent(client,createAuditRecord({...baseEvent,batch_id:first.id,source_row_id:first.row}));
      await expect(client.query('UPDATE audit_events SET outcome=\'FAILURE\'')).rejects.toMatchObject({code:'42501'});
      await expect(client.query('DELETE FROM audit_events')).rejects.toMatchObject({code:'42501'});
    } finally { client.release(); }
  });

  it('koneksi audit sempat gagal lalu pulih; event hanya tercatat sekali', async () => {
    const connect = vi.fn().mockRejectedValueOnce(new Error('PRIVATE')).mockImplementation(() => database.pool.connect());
    const service = new AuditService({connect} as unknown as pg.Pool,logger,new UjiClock());
    expect(await service.recordOutcome({...baseEvent,outcome:'FAILURE'})).toBe(true);
    expect(connect).toHaveBeenCalledTimes(2);
    expect((await database.pool.query('SELECT count(*)::int AS count FROM audit_events')).rows[0].count).toBe(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('INSERT audit sukses tetapi response hilang diretry dengan ID sama tanpa duplikasi', async () => {
    const real = await database.pool.connect();
    const proxy = new Proxy(real,{get(target,key) {
      if (key==='query') return async (sql: string, values?: unknown[]) => {
        await target.query(sql,values); throw new Error('PRIVATE_RESPONSE_LOST');
      };
      const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;
    }});
    const connect = vi.fn().mockResolvedValueOnce(proxy).mockImplementation(() => database.pool.connect());
    const service = new AuditService({connect} as unknown as pg.Pool,logger,new UjiClock());
    expect(await service.recordOutcome({...baseEvent,outcome:'DENIED'})).toBe(true);
    expect((await database.pool.query('SELECT count(*)::int AS count FROM audit_events')).rows[0].count).toBe(1);
  });

  it('ledger UJI membuat reapply aman dan menolak checksum migrasi berubah', async () => {
    const client = new pg.Client({connectionString:ujiConnection(process.env.DATABASE_MIGRATION_URL,'siris_migrator')});
    await client.connect();
    try {
      await client.query(`SET search_path TO ${database.schema},public`);
      await applyUjiMigrations(client);
      await applyUjiMigrations(client);
      expect((await client.query('SELECT count(*)::int AS count FROM users')).rows[0].count).toBe(4);
      await client.query("UPDATE _uji_schema_versions SET sha256='INVALID' WHERE name='001_initial_schema.sql'");
      await expect(applyUjiMigrations(client)).rejects.toThrow('BLOCKED: checksum migrasi berubah.');
    } finally { await client.end(); }
  });

  it('migrasi audit dapat direapply langsung dan menolak drift tanpa mengubah event', async () => {
    const sql=await readFile(new URL('../../../database/migrations/004_audit_lineage.sql',import.meta.url),'utf8');
    await audit.recordOutcome({...baseEvent,outcome:'DENIED'});
    const client=new pg.Client({connectionString:ujiConnection(process.env.DATABASE_MIGRATION_URL,'siris_migrator')});
    await client.connect();
    try {
      await client.query(`SET search_path TO ${database.schema},public`);
      await client.query(sql);await client.query(sql);
      const before=(await client.query('SELECT * FROM audit_events ORDER BY id')).rows;
      await client.query('ALTER TABLE audit_events ADD COLUMN unexpected text');
      await expect(client.query(sql)).rejects.toMatchObject({code:'P0001'});
      const after=(await client.query('SELECT id,outcome FROM audit_events ORDER BY id')).rows;
      expect(after).toEqual(before.map(({id,outcome})=>({id,outcome})));
    } finally {await client.end();}
  });

  it('response COMMIT hilang setelah sukses menghasilkan UNKNOWN tanpa FAILURE palsu', async () => {
    const item = await batch();
    const real = await database.pool.connect();
    const proxy = new Proxy(real, {get(target,key) {
      if (key==='query') return async (sql: string, values?: unknown[]) => {
        const result = await target.query(sql,values);
        if (sql==='COMMIT') throw new Error('PRIVATE_CONNECTION_LOST');
        return result;
      };
      const value = Reflect.get(target,key); return typeof value==='function' ? value.bind(target) : value;
    }});
    const service = new AuditService({connect:async () => proxy} as unknown as pg.Pool,logger,new UjiClock());
    await expect(service.transaction({...baseEvent,outcome:'SUCCESS',batch_id:item.id},async (client) => {
      await client.query('UPDATE import_batches SET row_count=1 WHERE id=$1',[item.id]);
    })).rejects.toMatchObject({code:'TRANSACTION_OUTCOME_UNKNOWN',audit_recorded:false});
    expect((await database.pool.query('SELECT outcome FROM audit_events')).rows).toEqual([{outcome:'SUCCESS'}]);
    expect((await database.pool.query('SELECT row_count FROM import_batches WHERE id=$1',[item.id])).rows[0].row_count).toBe(1);
    expect(logger.error).toHaveBeenCalledExactlyOnceWith({code:'AUDIT_TRANSACTION_UNKNOWN',correlation_id:baseEvent.correlation_id});
  });

  it('schema dan storage terpisah antar pengguna harness', async () => {
    const other = await createUjiDatabase();
    try {
      const item = await batch();
      expect(database.schema).not.toBe(other.schema);
      expect(database.storagePath).not.toBe(other.storagePath);
      expect((await other.pool.query('SELECT count(*)::int AS count FROM import_batches WHERE id=$1',[item.id])).rows[0].count).toBe(0);
    } finally { await other.dispose(); }
  });
});
