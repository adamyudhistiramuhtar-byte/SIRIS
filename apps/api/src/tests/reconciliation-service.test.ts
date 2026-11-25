import { inspect } from 'node:util';
import { beforeEach, describe, expect, it } from 'vitest';
import { RECONCILIATION_RULE_VERSION } from '../modules/reconciliation/reconciliation-engine.js';
import { isReconciliationServiceError } from '../modules/reconciliation/reconciliation-errors.js';
import { ReconciliationService, type CreateRunCommand } from '../modules/reconciliation/reconciliation.service.js';
import {
  FakeReconciliationDatabase,
  PRIVATE_SENTINEL,
  RECONCILIATION_FAULT_STEPS,
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

let db: FakeReconciliationDatabase;
let logger: RecordingRecLogger;

function service(): ReconciliationService<FakeRecTx> {
  return new ReconciliationService<FakeRecTx>({
    unitOfWork: db.unitOfWork, snapshots: db.snapshotReader, sessions: db.sessionReader, authorizer: db.authorizer,
    runs: db.runStore, keys: db.keyStore, audit: db.audit, ids: db.ids, logger,
  });
}

function command(overrides: Partial<CreateRunCommand> = {}): CreateRunCommand {
  return {
    actor: REC_ACTOR,
    idempotency_key: 'rec-key-1',
    correlation_id: REC_CORRELATION,
    body: { stock_snapshot_id: SNAPSHOT_ID, count_session_id: SESSION_ID },
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

function expectNothingStored() {
  expect(db.committed.runs.size).toBe(0);
  expect(db.committed.keys.size).toBe(0);
  expect(db.committed.audit).toHaveLength(0);
}

function expectSafeLogs() {
  for (const entry of logger.entries) {
    expect(Object.keys(entry as object).sort()).toEqual(['code', 'correlation_id']);
    expect(JSON.stringify(entry)).not.toContain('PRIVATE');
  }
}

beforeEach(() => {
  db = new FakeReconciliationDatabase();
  db.snapshots.set(SNAPSHOT_ID, { id: SNAPSHOT_ID, context: ujiContext(), lines: ujiStockLines() });
  db.sessions.set(SESSION_ID, { id: SESSION_ID, context: ujiContext(), lines: ujiCountLines() });
  logger = new RecordingRecLogger();
});

describe('SRS-29 run baru', () => {
  it('menyimpan run + lines dari engine, mencatat key, dan audit SUCCESS dalam satu transaksi', async () => {
    const result = await service().createRun(command());
    expect(result).toEqual({ run_id: expect.any(String), rule_version: RECONCILIATION_RULE_VERSION, reused: false });
    const run = db.committed.runs.get(result.run_id)!;
    expect(run.lines.map((line) => [line.material_id, line.status, line.variance])).toEqual([
      ['MAT-A', 'DISCREPANCY', '-2.000000'],
      ['MAT-B', 'MATCHED', '0.000000'],
      ['MAT-C', 'NOT_COUNTED', null],
    ]);
    expect([run.stock_snapshot_id, run.count_session_id, run.cutoff_id, run.created_by]).toEqual([SNAPSHOT_ID, SESSION_ID, ujiContext().cutoff_id, REC_ACTOR.actor_id]);
    expect(db.committed.keys.size).toBe(1);
    expect(db.committed.audit.map((event) => [event.action, event.outcome, event.context_safe.line_count])).toEqual([['reconciliation.create', 'SUCCESS', 3]]);
    expect(db.auditAfterRollback).toHaveLength(0);
  });

  it('run yang tersimpan immutable (fake membekukan objek; port tidak punya update/delete)', async () => {
    const { run_id: runId } = await service().createRun(command());
    const run = db.committed.runs.get(runId)!;
    expect(Object.isFrozen(run) && Object.isFrozen(run.lines) && Object.isFrozen(run.lines[0])).toBe(true);
    expect(Object.keys(db.runStore).sort()).toEqual(['findByIdentity', 'insertRun']);
  });
});

describe('SRS-29 reuse run (D-05)', () => {
  it('key sama + input sama → run yang sama, tanpa run, key, atau audit tambahan', async () => {
    const first = await service().createRun(command());
    const second = await service().createRun(command());
    expect(second).toEqual({ ...first, reused: true });
    expect(db.committed.runs.size).toBe(1);
    expect(db.committed.keys.size).toBe(1);
    expect(db.committed.audit).toHaveLength(1);
  });

  it('key berbeda + input identik → run yang sama dipakai ulang dan key baru dicatat', async () => {
    const first = await service().createRun(command());
    const second = await service().createRun(command({ idempotency_key: 'rec-key-2' }));
    expect(second.run_id).toBe(first.run_id);
    expect(second.reused).toBe(true);
    expect(db.committed.runs.size).toBe(1);
    expect(db.committed.keys.size).toBe(2);
  });

  it('aktor lain dengan input identik pada scope yang sama memakai run yang sama', async () => {
    const first = await service().createRun(command());
    const other = { ...REC_ACTOR, actor_id: '10000000-0000-4000-8000-000000000003' };
    expect((await service().createRun(command({ actor: other }))).run_id).toBe(first.run_id);
  });

  it('key sama + input berbeda → IDEMPOTENCY_CONFLICT tanpa run baru', async () => {
    await service().createRun(command());
    const otherSession = '80000000-0000-4000-8000-000000000002';
    db.sessions.set(otherSession, { id: otherSession, context: ujiContext(), lines: ujiCountLines() });
    const code = await errorCode(service().createRun(command({ body: { stock_snapshot_id: SNAPSHOT_ID, count_session_id: otherSession } })));
    expect(code).toBe('IDEMPOTENCY_CONFLICT');
    expect(db.committed.runs.size).toBe(1);
    expect(db.auditAfterRollback.map((event) => [event.outcome, event.context_safe.reason_code])).toEqual([['FAILURE', 'TRANSACTION_FAILED']]);
  });

  it('input berbeda dengan key baru → run baru; histori lama tetap ada', async () => {
    const first = await service().createRun(command());
    const otherSession = '80000000-0000-4000-8000-000000000002';
    db.sessions.set(otherSession, { id: otherSession, context: ujiContext(), lines: ujiCountLines() });
    const second = await service().createRun(command({ idempotency_key: 'rec-key-2', body: { stock_snapshot_id: SNAPSHOT_ID, count_session_id: otherSession } }));
    expect(second.run_id).not.toBe(first.run_id);
    expect(db.committed.runs.has(first.run_id)).toBe(true);
    expect(db.committed.runs.size).toBe(2);
  });
});

describe('SRS-29 penolakan seluruh permintaan (E-1, D-04)', () => {
  it.each([
    ['gudang berbeda', () => db.sessions.set(SESSION_ID, { id: SESSION_ID, context: ujiContext({ warehouse_id: '20000000-0000-4000-8000-000000000002' }), lines: ujiCountLines() }), 'WAREHOUSE_MISMATCH'],
    ['cutoff berbeda', () => db.sessions.set(SESSION_ID, { id: SESSION_ID, context: ujiContext({ cutoff_id: '40000000-0000-4000-8000-000000000002' }), lines: ujiCountLines() }), 'CUTOFF_MISMATCH'],
    ['ACTUAL ditahan', () => {
      db.snapshots.set(SNAPSHOT_ID, { id: SNAPSHOT_ID, context: ujiContext({ mode: 'ACTUAL' }), lines: ujiStockLines() });
      db.sessions.set(SESSION_ID, { id: SESSION_ID, context: ujiContext({ mode: 'ACTUAL' }), lines: ujiCountLines() });
    }, 'CUTOFF_UNVERIFIED'],
    ['dua baris material sama di satu sisi (satu material per sisi per run)', () => db.snapshots.set(SNAPSHOT_ID, {
      id: SNAPSHOT_ID, context: ujiContext(),
      lines: [...ujiStockLines(), { id: 'S-4', material_id: 'MAT-A', uom: 'PCS', system_quantity: '1.000000' }],
    }), 'AMBIGUOUS_PAIR'],
    ['is_counted=false dengan nilai', () => db.sessions.set(SESSION_ID, {
      id: SESSION_ID, context: ujiContext(),
      lines: [{ id: 'C-9', material_id: 'MAT-A', uom: 'KG', is_counted: false, physical_quantity: '0.000000' }],
    }), 'NOT_COUNTED_VALUE'],
  ])('%s → %s tanpa menyimpan run', async (_label, arrange, expected) => {
    arrange();
    expect(await errorCode(service().createRun(command()))).toBe(expected);
    expectNothingStored();
    expect(db.auditAfterRollback.map((event) => event.outcome)).toEqual(['FAILURE']);
  });

  it('snapshot atau sesi tidak ada → NOT_FOUND tanpa merujuk scope', async () => {
    db.snapshots.clear();
    expect(await errorCode(service().createRun(command()))).toBe('NOT_FOUND');
    expect(db.auditAfterRollback.map((event) => [event.outcome, event.warehouse_id])).toEqual([['DENIED', null]]);
  });

  it('otorisasi diperiksa untuk scope kedua sumber', async () => {
    db.sessions.set(SESSION_ID, { id: SESSION_ID, context: ujiContext({ warehouse_id: REC_OTHER_WAREHOUSE }), lines: ujiCountLines() });
    db.deniedWarehouses.add(REC_OTHER_WAREHOUSE);
    expect(await errorCode(service().createRun(command()))).toBe('FORBIDDEN');
    expect(db.calls.filter((step) => step === 'authorize')).toHaveLength(2);
    expectNothingStored();
  });

  it.each([
    ['key kosong', { idempotency_key: ' ' }],
    ['key terlalu panjang', { idempotency_key: 'k'.repeat(129) }],
    ['correlation bukan UUID', { correlation_id: 'x' }],
    ['body tanpa sesi', { body: { stock_snapshot_id: SNAPSHOT_ID } }],
    ['body dengan field tambahan', { body: { stock_snapshot_id: SNAPSHOT_ID, count_session_id: SESSION_ID, rule_version: 'x' } }],
    ['snapshot bukan UUID', { body: { stock_snapshot_id: 'SNAP-1', count_session_id: SESSION_ID } }],
  ])('%s → BAD_REQUEST tanpa membuka transaksi', async (_label, overrides) => {
    expect(await errorCode(service().createRun(command(overrides as Partial<CreateRunCommand>)))).toBe('BAD_REQUEST');
    expect(db.calls).toHaveLength(0);
  });
});

describe('SRS-29 fault injection setiap langkah', () => {
  it.each(RECONCILIATION_FAULT_STEPS)('kegagalan pada %s → rollback penuh, TRANSACTION_FAILED, audit FAILURE terpisah, log aman', async (step) => {
    db.faultAt = step;
    let caught: unknown;
    try { await service().createRun(command()); } catch (error) { caught = error; }
    expect(isReconciliationServiceError(caught) && caught.code).toBe('TRANSACTION_FAILED');
    expectNothingStored();
    expect(db.auditAfterRollback.map((event) => [event.outcome, event.context_safe.reason_code])).toEqual([['FAILURE', 'TRANSACTION_FAILED']]);
    expect(logger.entries).toEqual([{ code: 'RECONCILIATION_FAILED', correlation_id: REC_CORRELATION }]);
    expect(inspect(caught)).not.toContain('PRIVATE');
    expectSafeLogs();
  });

  it('audit FAILURE yang gagal ditulis tidak menutupi error asli', async () => {
    db.faultAt = 'run.insert';
    db.auditAfterRollbackFails = true;
    expect(await errorCode(service().createRun(command()))).toBe('TRANSACTION_FAILED');
    expect(logger.entries.map((entry) => (entry as { code: string }).code)).toEqual(['RECONCILIATION_FAILED', 'AUDIT_UNAVAILABLE']);
    expect(JSON.stringify(logger.entries)).not.toContain(PRIVATE_SENTINEL);
  });
});

describe('SRS-29 COMMIT dengan hasil tidak diketahui', () => {
  it('tersimpan tetapi respons hilang → OUTCOME_UNKNOWN tanpa FAILURE palsu; retry key sama memakai ulang run', async () => {
    db.commitFault = 'lost-after-apply';
    expect(await errorCode(service().createRun(command()))).toBe('TRANSACTION_OUTCOME_UNKNOWN');
    expect(db.auditAfterRollback).toHaveLength(0);
    const retry = await service().createRun(command());
    expect(retry.reused).toBe(true);
    expect(db.committed.runs.size).toBe(1);
  });

  it('tidak tersimpan → retry key sama membuat run sekali', async () => {
    db.commitFault = 'lost-before-apply';
    expect(await errorCode(service().createRun(command()))).toBe('TRANSACTION_OUTCOME_UNKNOWN');
    expectNothingStored();
    expect((await service().createRun(command())).reused).toBe(false);
    expect(db.committed.runs.size).toBe(1);
  });
});

describe('SRS-29 konkurensi (fake unique index, bukan bukti PostgreSQL)', () => {
  it('dua permintaan paralel input identik dengan key berbeda → satu run; yang kalah diulang sekali lalu reuse', async () => {
    const [a, b] = await Promise.all([
      service().createRun(command()),
      service().createRun(command({ idempotency_key: 'rec-key-2' })),
    ]);
    expect(a.run_id).toBe(b.run_id);
    expect([a.reused, b.reused].sort()).toEqual([false, true]);
    expect(db.committed.runs.size).toBe(1);
    expect(db.committed.keys.size).toBe(2);
    expect(db.auditAfterRollback).toHaveLength(0);
  });

  it('dua permintaan paralel key sama + input berbeda → satu run, satu IDEMPOTENCY_CONFLICT', async () => {
    const otherSession = '80000000-0000-4000-8000-000000000002';
    db.sessions.set(otherSession, { id: otherSession, context: ujiContext(), lines: ujiCountLines() });
    const codes = await Promise.all([
      errorCode(service().createRun(command())),
      errorCode(service().createRun(command({ body: { stock_snapshot_id: SNAPSHOT_ID, count_session_id: otherSession } }))),
    ]);
    expect(codes.sort()).toEqual(['IDEMPOTENCY_CONFLICT', 'NONE']);
    expect(db.committed.runs.size).toBe(1);
  });
});
