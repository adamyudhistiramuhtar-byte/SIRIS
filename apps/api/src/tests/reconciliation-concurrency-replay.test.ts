/**
 * SRS-87 — konkurensi dan replay hasil rekonsiliasi (CF-05) di atas service #47.
 * Status: PROPOSED. Memakai fake #47 dengan unique index tiruan; ini BUKAN bukti PostgreSQL.
 * Kasus yang butuh koneksi paralel nyata ditulis sebagai `it.todo`.
 *
 * Acceptance criteria SRS-87: tidak ada duplikasi di luar kebijakan; run dan audit konsisten;
 * evidence menyebut rule version. Melengkapi dua kasus paralel #47 dengan N>2, campuran,
 * dan replay lintas key.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { RECONCILIATION_RULE_VERSION } from '../modules/reconciliation/reconciliation-engine.js';
import { isReconciliationServiceError } from '../modules/reconciliation/reconciliation-errors.js';
import { ReconciliationService, type CreateRunCommand } from '../modules/reconciliation/reconciliation.service.js';
import {
  FakeReconciliationDatabase,
  REC_ACTOR,
  REC_CORRELATION,
  RecordingRecLogger,
  SESSION_ID,
  SNAPSHOT_ID,
  ujiContext,
  ujiCountLines,
  ujiStockLines,
  type FakeRecTx,
} from './fakes/reconciliation-fakes.js';

let db: FakeReconciliationDatabase;

function service(): ReconciliationService<FakeRecTx> {
  return new ReconciliationService<FakeRecTx>({
    unitOfWork: db.unitOfWork, snapshots: db.snapshotReader, sessions: db.sessionReader, authorizer: db.authorizer,
    runs: db.runStore, keys: db.keyStore, audit: db.audit, ids: db.ids, logger: new RecordingRecLogger(),
  });
}

const sessionId = (n: number) => `80000000-0000-4000-8000-0000000001${String(n).padStart(2, '0')}`;

function command(key: string, session = SESSION_ID): CreateRunCommand {
  return {
    actor: REC_ACTOR,
    idempotency_key: key,
    correlation_id: REC_CORRELATION,
    body: { stock_snapshot_id: SNAPSHOT_ID, count_session_id: session },
  };
}

async function outcome(promise: Promise<{ run_id: string; reused: boolean }>) {
  try {
    const result = await promise;
    return { code: 'NONE', run_id: result.run_id, reused: result.reused };
  } catch (error) {
    return { code: isReconciliationServiceError(error) ? error.code : 'NON_DOMAIN', run_id: null, reused: null };
  }
}

const successAudits = () => db.committed.audit.filter((e) => e.outcome === 'SUCCESS');

beforeEach(() => {
  db = new FakeReconciliationDatabase();
  db.snapshots.set(SNAPSHOT_ID, { id: SNAPSHOT_ID, context: ujiContext(), lines: ujiStockLines() });
  db.sessions.set(SESSION_ID, { id: SESSION_ID, context: ujiContext(), lines: ujiCountLines() });
  for (let n = 1; n <= 4; n += 1) {
    db.sessions.set(sessionId(n), { id: sessionId(n), context: ujiContext(), lines: ujiCountLines().map((l) => ({ ...l, id: `${l.id}-${n}` })) });
  }
});

describe('SRS-87 konkurensi (fake, bukan PostgreSQL)', () => {
  it('lima request paralel input identik dengan key berbeda → satu run, lima key, satu audit SUCCESS', async () => {
    const results = await Promise.all([1, 2, 3, 4, 5].map((n) => outcome(service().createRun(command(`k-${n}`)))));
    expect(results.every((r) => r.code === 'NONE')).toBe(true);
    expect(new Set(results.map((r) => r.run_id)).size).toBe(1);
    expect(results.filter((r) => r.reused === false)).toHaveLength(1);
    expect(db.committed.runs.size).toBe(1);
    expect(db.committed.keys.size).toBe(5);
    expect(successAudits()).toHaveLength(1);
    expect(db.auditAfterRollback).toHaveLength(0);
  });

  it('empat request paralel key sama dan input sama → satu run, satu key, run_id sama', async () => {
    const results = await Promise.all([1, 2, 3, 4].map(() => outcome(service().createRun(command('k-sama')))));
    expect(results.every((r) => r.code === 'NONE')).toBe(true);
    expect(new Set(results.map((r) => r.run_id)).size).toBe(1);
    expect(db.committed.runs.size).toBe(1);
    expect(db.committed.keys.size).toBe(1);
    expect(successAudits()).toHaveLength(1);
  });

  it('empat request paralel key sama dengan input berbeda → satu run, tiga IDEMPOTENCY_CONFLICT diaudit FAILURE', async () => {
    const results = await Promise.all([1, 2, 3, 4].map((n) => outcome(service().createRun(command('k-sama', sessionId(n))))));
    expect(results.filter((r) => r.code === 'NONE')).toHaveLength(1);
    expect(results.filter((r) => r.code === 'IDEMPOTENCY_CONFLICT')).toHaveLength(3);
    expect(db.committed.runs.size).toBe(1);
    expect(successAudits()).toHaveLength(1);
    expect(db.auditAfterRollback.map((e) => e.outcome)).toEqual(['FAILURE', 'FAILURE', 'FAILURE']);
  });

  it('campuran paralel: dua key untuk input A dan satu key untuk input B → tepat dua run', async () => {
    const results = await Promise.all([
      outcome(service().createRun(command('k-a1'))),
      outcome(service().createRun(command('k-a2'))),
      outcome(service().createRun(command('k-b1', sessionId(1)))),
    ]);
    expect(results.every((r) => r.code === 'NONE')).toBe(true);
    expect(results[0].run_id).toBe(results[1].run_id);
    expect(results[2].run_id).not.toBe(results[0].run_id);
    expect(db.committed.runs.size).toBe(2);
    expect(successAudits()).toHaveLength(2);
  });
});

describe('SRS-87 replay', () => {
  it('replay key sama setelah sukses mengembalikan run yang sama tanpa audit kedua', async () => {
    const first = await service().createRun(command('k-1'));
    const replay = await service().createRun(command('k-1'));
    expect(replay).toEqual({ ...first, reused: true });
    expect(successAudits()).toHaveLength(1);
  });

  it('replay lintas key (D-05) memakai ulang run tanpa audit kedua dan mencatat key baru', async () => {
    const first = await service().createRun(command('k-1'));
    const other = await service().createRun(command('k-2'));
    expect(other.run_id).toBe(first.run_id);
    expect(other.reused).toBe(true);
    expect(db.committed.keys.size).toBe(2);
    expect(successAudits()).toHaveLength(1);
  });

  it('setiap respons dan run tersimpan menyebut rule_version yang sama', async () => {
    const results = await Promise.all([1, 2, 3].map((n) => service().createRun(command(`k-${n}`))));
    for (const result of results) expect(result.rule_version).toBe(RECONCILIATION_RULE_VERSION);
    for (const run of db.committed.runs.values()) expect(run.rule_version).toBe(RECONCILIATION_RULE_VERSION);
  });
});

describe('SRS-87 butuh PostgreSQL (belum dijalankan)', () => {
  it.todo('N koneksi paralel input identik: UNIQUE identity_hash (011) menghasilkan satu run; yang kalah 23505 lalu reuse');
  it.todo('N koneksi paralel key sama input berbeda: UNIQUE (actor, key) (012) menghasilkan satu run dan sisanya 409');
  it.todo('ulangan kedua yang juga kalah (retry habis) gagal TRANSACTION_FAILED tanpa run parsial');
  it.todo('isolasi READ COMMITTED vs SERIALIZABLE: perilaku 40001/deadlock dan retry yang disepakati');
  it.todo('audit SUCCESS satu per run dan FAILURE terpisah setelah ROLLBACK nyata (#22/#50)');
});
