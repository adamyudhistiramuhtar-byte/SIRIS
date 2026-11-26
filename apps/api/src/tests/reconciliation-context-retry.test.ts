/**
 * SRS-30 — keamanan konteks, retry, dan versi hasil rekonsiliasi di atas service #47.
 * Status: PROPOSED. Memakai fake #47 (bukan bukti PostgreSQL); kasus yang butuh database
 * nyata ditulis sebagai `it.todo`.
 *
 * Melengkapi tes #47 tanpa mengulanginya. Fokus:
 * - penolakan konteks dan kegagalan transaksi tidak "membakar" Idempotency-Key;
 * - retry setelah hasil COMMIT tidak diketahui tidak menggandakan run, juga dengan key lain (D-05);
 * - run lama tidak berubah ketika run baru dibuat (histori immutable);
 * - identitas run memuat rule_version dan scope, sehingga versi aturan lain tidak memakai ulang run.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { RECONCILIATION_RULE_VERSION } from '../modules/reconciliation/reconciliation-engine.js';
import { isReconciliationServiceError } from '../modules/reconciliation/reconciliation-errors.js';
import { ReconciliationService, type CreateRunCommand } from '../modules/reconciliation/reconciliation.service.js';
import { runIdentityHash, type RunIdentityInput } from '../modules/reconciliation/run-identity.js';
import {
  FakeReconciliationDatabase,
  REC_ACTOR,
  REC_CORRELATION,
  REC_OTHER_WAREHOUSE,
  RecordingRecLogger,
  SESSION_ID,
  SNAPSHOT_ID,
  ujiContext,
  ujiCountLines,
  ujiStockLines,
  type FakeRecTx,
} from './fakes/reconciliation-fakes.js';

const OTHER_SESSION = '80000000-0000-4000-8000-000000000003';
let db: FakeReconciliationDatabase;

function service(): ReconciliationService<FakeRecTx> {
  return new ReconciliationService<FakeRecTx>({
    unitOfWork: db.unitOfWork, snapshots: db.snapshotReader, sessions: db.sessionReader, authorizer: db.authorizer,
    runs: db.runStore, keys: db.keyStore, audit: db.audit, ids: db.ids, logger: new RecordingRecLogger(),
  });
}

function command(overrides: Partial<CreateRunCommand> = {}, session = SESSION_ID): CreateRunCommand {
  return {
    actor: REC_ACTOR,
    idempotency_key: 'srs30-key-1',
    correlation_id: REC_CORRELATION,
    body: { stock_snapshot_id: SNAPSHOT_ID, count_session_id: session },
    ...overrides,
  };
}

async function errorCode(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return 'NONE';
  } catch (error) {
    return isReconciliationServiceError(error) ? error.code : 'NON_DOMAIN';
  }
}

beforeEach(() => {
  db = new FakeReconciliationDatabase();
  db.snapshots.set(SNAPSHOT_ID, { id: SNAPSHOT_ID, context: ujiContext(), lines: ujiStockLines() });
  db.sessions.set(SESSION_ID, { id: SESSION_ID, context: ujiContext(), lines: ujiCountLines() });
});

describe('SRS-30 identitas run memuat rule_version dan scope', () => {
  const base: RunIdentityInput = {
    stock_snapshot_id: SNAPSHOT_ID, count_session_id: SESSION_ID, rule_version: RECONCILIATION_RULE_VERSION,
    warehouse_id: ujiContext().warehouse_id, mode: 'UJI',
  };

  it('input sama menghasilkan hash yang sama', () => {
    expect(runIdentityHash({ ...base })).toBe(runIdentityHash(base));
  });

  it.each([
    ['rule_version', { rule_version: 'uji-engine/proposed-0.2' }],
    ['stock_snapshot_id', { stock_snapshot_id: '70000000-0000-4000-8000-000000000009' }],
    ['count_session_id', { count_session_id: OTHER_SESSION }],
    ['warehouse_id', { warehouse_id: REC_OTHER_WAREHOUSE }],
    ['mode', { mode: 'ACTUAL' as const }],
  ])('perubahan %s menghasilkan identitas lain (tidak memakai ulang run)', (_field, change) => {
    expect(runIdentityHash({ ...base, ...change })).not.toBe(runIdentityHash(base));
  });

  it('run tersimpan mencatat rule_version yang sama dengan respons', async () => {
    const result = await service().createRun(command());
    expect(result.rule_version).toBe(RECONCILIATION_RULE_VERSION);
    expect(db.committed.runs.get(result.run_id)?.rule_version).toBe(result.rule_version);
  });
});

describe('SRS-30 penolakan konteks tidak membakar Idempotency-Key', () => {
  it.each([
    ['gudang berbeda', { warehouse_id: REC_OTHER_WAREHOUSE }, 'WAREHOUSE_MISMATCH'],
    ['cutoff berbeda', { cutoff_id: '40000000-0000-4000-8000-000000000009' }, 'CUTOFF_MISMATCH'],
  ])('%s ditolak tanpa run atau key; retry key sama dengan sesi yang benar berhasil', async (_label, override, code) => {
    db.sessions.set(OTHER_SESSION, { id: OTHER_SESSION, context: ujiContext(override), lines: ujiCountLines() });
    expect(await errorCode(service().createRun(command({}, OTHER_SESSION)))).toBe(code);
    expect(db.committed.runs.size).toBe(0);
    expect(db.committed.keys.size).toBe(0);

    const retry = await service().createRun(command());
    expect(retry.reused).toBe(false);
    expect(db.committed.runs.size).toBe(1);
  });

  it('ACTUAL ditahan: CUTOFF_UNVERIFIED tanpa run atau key', async () => {
    db.snapshots.set(SNAPSHOT_ID, { id: SNAPSHOT_ID, context: ujiContext({ mode: 'ACTUAL' }), lines: ujiStockLines() });
    db.sessions.set(SESSION_ID, { id: SESSION_ID, context: ujiContext({ mode: 'ACTUAL' }), lines: ujiCountLines() });
    expect(await errorCode(service().createRun(command()))).toBe('CUTOFF_UNVERIFIED');
    expect(db.committed.runs.size).toBe(0);
    expect(db.committed.keys.size).toBe(0);
  });
});

describe('SRS-30 retry setelah kegagalan', () => {
  it('kegagalan transaksi tidak membakar key; retry key sama membuat tepat satu run', async () => {
    db.faultAt = 'audit.append';
    expect(await errorCode(service().createRun(command()))).toBe('TRANSACTION_FAILED');
    db.faultAt = null;
    const retry = await service().createRun(command());
    expect(retry.reused).toBe(false);
    expect(db.committed.runs.size).toBe(1);
    expect(db.committed.audit.filter((e) => e.outcome === 'SUCCESS')).toHaveLength(1);
  });

  it('COMMIT tersimpan tetapi respons hilang; retry dengan key LAIN memakai ulang run (D-05), bukan run kedua', async () => {
    db.commitFault = 'lost-after-apply';
    expect(await errorCode(service().createRun(command()))).toBe('TRANSACTION_OUTCOME_UNKNOWN');
    const retry = await service().createRun(command({ idempotency_key: 'srs30-key-2' }));
    expect(retry.reused).toBe(true);
    expect(db.committed.runs.size).toBe(1);
    expect(db.committed.audit.filter((e) => e.outcome === 'SUCCESS')).toHaveLength(1);
    expect(db.auditAfterRollback).toHaveLength(0);
  });
});

describe('SRS-30 histori run immutable', () => {
  it('membuat run baru dengan input lain tidak mengubah run lama', async () => {
    const first = await service().createRun(command());
    const snapshot = structuredClone(db.committed.runs.get(first.run_id));

    db.sessions.set(OTHER_SESSION, { id: OTHER_SESSION, context: ujiContext(), lines: ujiCountLines().map((l) => ({ ...l, id: `${l.id}-b` })) });
    const second = await service().createRun(command({ idempotency_key: 'srs30-key-3' }, OTHER_SESSION));

    expect(second.run_id).not.toBe(first.run_id);
    expect(db.committed.runs.get(first.run_id)).toEqual(snapshot);
    expect(db.committed.runs.size).toBe(2);
  });
});

describe('SRS-30 butuh PostgreSQL (belum dijalankan)', () => {
  it.todo('snapshot/sesi dikunci FOR SHARE: perubahan sumber oleh transaksi lain tidak terlihat sebelum run selesai');
  it.todo('rule_version baru setelah deploy membuat run baru, run lama tetap terbaca dengan rule_version lamanya');
  it.todo('key yang gagal karena konteks tidak tercatat di idempotency_records (012) setelah ROLLBACK nyata');
  it.todo('retry setelah koneksi putus saat COMMIT memakai ulang run lewat UNIQUE identity_hash (011)');
});
