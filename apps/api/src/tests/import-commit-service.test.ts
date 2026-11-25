import { inspect } from 'node:util';
import { beforeEach, describe, expect, it } from 'vitest';
import { isImportCommitError } from '../modules/import-commit/commit-errors.js';
import { CancelService, CommitService, type CommitCommand } from '../modules/import-commit/commit.service.js';
import {
  FAULT_STEPS,
  FakeClock,
  FakeImportDatabase,
  PRIVATE_SENTINEL,
  RecordingLogger,
  UJI_ACTOR,
  UJI_BATCH_ID,
  UJI_BATCH_ID_2,
  UJI_CORRELATION,
  ujiBatch,
  ujiPreview,
  type FakeTx,
} from './fakes/import-commit-fakes.js';

const RETENTION_MS = 24 * 60 * 60 * 1000; // nilai tes saja; retensi final menunggu keputusan Adam
let db: FakeImportDatabase;
let clock: FakeClock;
let logger: RecordingLogger;

function commitService(): CommitService<FakeTx> {
  return new CommitService<FakeTx>({
    unitOfWork: db.unitOfWork, batches: db.batches, authorizer: db.authorizer, previews: db.previews,
    references: db.references, writers: [db.writer('COUNT')], idempotency: db.idempotency, audit: db.audit,
    clock, logger,
  }, { idempotencyRetentionMs: RETENTION_MS });
}

function cancelService(): CancelService<FakeTx> {
  return new CancelService<FakeTx>({
    unitOfWork: db.unitOfWork, batches: db.batches, authorizer: db.authorizer, audit: db.audit, clock, logger,
  });
}

function command(overrides: Partial<CommitCommand> = {}): CommitCommand {
  return {
    actor: UJI_ACTOR,
    batch_id: UJI_BATCH_ID,
    idempotency_key: 'uji-key-1',
    correlation_id: UJI_CORRELATION,
    body: { preview_fingerprint: 'UJI-fingerprint-1', acknowledged_warnings: [] },
    ...overrides,
  };
}

async function errorCode(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return 'NONE';
  } catch (error) {
    return isImportCommitError(error) ? error.code : `NON_DOMAIN:${String((error as Error)?.name)}`;
  }
}

function committedBatchState(id = UJI_BATCH_ID) {
  return db.committed.batches.get(id)?.state;
}

function expectNoPartialCommit() {
  expect(db.committed.domainRows).toHaveLength(0);
  expect(db.committed.idempotency.size).toBe(0);
  expect(db.committed.auditInTx.filter((event) => event.outcome === 'SUCCESS')).toHaveLength(0);
  expect(committedBatchState()).toBe('VALIDATED');
}

function expectSafeLogs() {
  for (const entry of logger.entries) {
    expect(Object.keys(entry as object).sort()).toEqual(['code', 'correlation_id']);
    expect(JSON.stringify(entry)).not.toContain('PRIVATE');
  }
}

beforeEach(() => {
  db = new FakeImportDatabase();
  db.addBatch(ujiBatch());
  db.preview = ujiPreview();
  clock = new FakeClock(new Date('2026-11-25T10:00:00+07:00'));
  logger = new RecordingLogger();
});

describe('SRS-52 commit: jalur sukses dan replay', () => {
  it('commit menulis domain, audit SUCCESS, state COMMITTED, dan record idempotency dalam satu transaksi', async () => {
    const result = await commitService().commit(command());
    expect(result).toEqual({ batch_id: UJI_BATCH_ID, state: 'COMMITTED', committed_count: 3 });
    expect(db.committed.domainRows).toEqual([{ batch_id: UJI_BATCH_ID, kind: 'COUNT', count: 3 }]);
    expect(committedBatchState()).toBe('COMMITTED');
    expect(db.committed.auditInTx.map((event) => [event.action, event.outcome])).toEqual([['import.commit', 'SUCCESS']]);
    const [record] = [...db.committed.idempotency.values()];
    expect(record.request_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(record.expires_at.getTime() - clock.current.getTime()).toBe(RETENTION_MS);
    expect(db.auditAfterRollback).toHaveLength(0);
    expect(db.calls).toEqual(['batch.lock', 'idempotency.find', 'authorize', 'preview.read', 'reference.current',
      'domain.write', 'audit.append', 'batch.mark', 'idempotency.insert']);
  });

  it('key sama + body sama mengembalikan respons lama tanpa menulis domain atau audit kedua', async () => {
    const service = commitService();
    const first = await service.commit(command());
    const second = await service.commit(command());
    expect(second).toEqual(first);
    expect(db.writerCalls).toBe(1);
    expect(db.committed.auditInTx).toHaveLength(1);
  });

  it('replay tetap dikembalikan setelah preview kedaluwarsa atau berubah', async () => {
    const service = commitService();
    const first = await service.commit(command());
    clock.current = new Date('2026-11-26T10:00:00+07:00');
    db.preview = null;
    db.referenceRevision = 'REF-UJI-2';
    expect(await service.commit(command())).toEqual(first);
  });

  it('replay tetap memerlukan otorisasi ulang', async () => {
    const service = commitService();
    await service.commit(command());
    db.authorizeResult = false;
    expect(await errorCode(service.commit(command()))).toBe('FORBIDDEN');
  });
});

describe('SRS-52 commit: konflik idempotency', () => {
  it('key sama + body beda → IDEMPOTENCY_CONFLICT tanpa menulis domain', async () => {
    const service = commitService();
    await service.commit(command());
    const code = await errorCode(service.commit(command({ body: { preview_fingerprint: 'UJI-fingerprint-2', acknowledged_warnings: [] } })));
    expect(code).toBe('IDEMPOTENCY_CONFLICT');
    expect(db.writerCalls).toBe(1);
    expect(db.auditAfterRollback.map((event) => [event.outcome, event.context_safe.reason_code])).toEqual([['FAILURE', 'TRANSACTION_FAILED']]);
  });

  it('key sama untuk batch lain → IDEMPOTENCY_CONFLICT (hash mengikat batch)', async () => {
    const service = commitService();
    await service.commit(command());
    db.addBatch(ujiBatch({ id: UJI_BATCH_ID_2 }));
    expect(await errorCode(service.commit(command({ batch_id: UJI_BATCH_ID_2 })))).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('unique (actor, operation, key) yang terlanjur dipakai saat insert → IDEMPOTENCY_CONFLICT dan rollback', async () => {
    db.idempotencyTakenOnInsert = true;
    expect(await errorCode(commitService().commit(command()))).toBe('IDEMPOTENCY_CONFLICT');
    expectNoPartialCommit();
  });
});

describe('SRS-52 commit: state, preview, expiry, referensi, warning', () => {
  it.each(['COMMITTED', 'CANCELLED', 'STAGED', 'UNKNOWN_STATE'])('batch %s dengan key baru → STATE_CONFLICT', async (state) => {
    db.addBatch(ujiBatch({ state }));
    expect(await errorCode(commitService().commit(command({ idempotency_key: 'uji-key-baru' })))).toBe('STATE_CONFLICT');
    expect(db.writerCalls).toBe(0);
  });

  it('jam server tepat expires_at → PREVIEW_EXPIRED; 1 ms sebelumnya masih boleh', async () => {
    clock.current = new Date(db.preview!.expires_at.getTime());
    expect(await errorCode(commitService().commit(command()))).toBe('PREVIEW_EXPIRED');
    clock.current = new Date(db.preview!.expires_at.getTime() - 1);
    expect(await errorCode(commitService().commit(command()))).toBe('NONE');
  });

  it.each([
    ['fingerprint berbeda', () => { db.preview = ujiPreview({ fingerprint: 'UJI-fingerprint-lain' }); }, 'PREVIEW_CHANGED'],
    ['reference revision berubah', () => { db.referenceRevision = 'REF-UJI-2'; }, 'PREVIEW_CHANGED'],
    ['preview tidak tersedia', () => { db.preview = null; }, 'PREVIEW_CHANGED'],
    ['preview milik batch lain', () => { db.preview = ujiPreview({ batch_id: UJI_BATCH_ID_2 }); }, 'PREVIEW_CHANGED'],
    ['preview memiliki error', () => { db.preview = ujiPreview({ error_count: 1 }); }, 'STATE_CONFLICT'],
    ['preview memiliki warning (C58-04 OPEN)', () => { db.preview = ujiPreview({ warning_issue_ids: ['w-1'] }); }, 'WARNING_ACKNOWLEDGEMENT_OPEN'],
  ])('%s → %s tanpa commit parsial', async (_label, arrange, expected) => {
    arrange();
    expect(await errorCode(commitService().commit(command()))).toBe(expected);
    expectNoPartialCommit();
  });

  it('acknowledged_warnings tidak kosong ditolak selama C58-04 OPEN', async () => {
    const code = await errorCode(commitService().commit(command({ body: { preview_fingerprint: 'UJI-fingerprint-1', acknowledged_warnings: ['w-1'] } })));
    expect(code).toBe('WARNING_ACKNOWLEDGEMENT_OPEN');
    expectNoPartialCommit();
  });

  it('kind tanpa DomainCommitWriter → SOURCE_REQUIRED', async () => {
    db.addBatch(ujiBatch({ kind: 'STOCK' }));
    expect(await errorCode(commitService().commit(command()))).toBe('SOURCE_REQUIRED');
    expectNoPartialCommit();
  });

  it('otorisasi ditolak → FORBIDDEN dengan audit DENIED; batch tidak ada → NOT_FOUND tanpa merujuk batch', async () => {
    db.authorizeResult = false;
    expect(await errorCode(commitService().commit(command()))).toBe('FORBIDDEN');
    expect(await errorCode(commitService().commit(command({ batch_id: UJI_BATCH_ID_2 })))).toBe('NOT_FOUND');
    expect(db.auditAfterRollback.map((event) => [event.outcome, event.context_safe.reason_code, event.batch_id])).toEqual([
      ['DENIED', 'ACCESS_DENIED', UJI_BATCH_ID],
      ['DENIED', 'ACCESS_DENIED', null],
    ]);
  });
});

describe('SRS-52 commit: validasi request sebelum transaksi', () => {
  it.each([
    ['key kosong', { idempotency_key: '' }],
    ['batch bukan UUID', { batch_id: 'WH-01' }],
    ['correlation bukan UUID', { correlation_id: 'uji-client' }],
    ['body tanpa acknowledged_warnings', { body: { preview_fingerprint: 'x' } }],
    ['body dengan field tambahan', { body: { preview_fingerprint: 'x', acknowledged_warnings: [], extra: 1 } }],
    ['fingerprint kosong', { body: { preview_fingerprint: '', acknowledged_warnings: [] } }],
    ['warning bukan string', { body: { preview_fingerprint: 'x', acknowledged_warnings: [1] } }],
  ])('%s → BAD_REQUEST tanpa membuka transaksi', async (_label, overrides) => {
    expect(await errorCode(commitService().commit(command(overrides as Partial<CommitCommand>)))).toBe('BAD_REQUEST');
    expect(db.calls).toHaveLength(0);
  });
});

describe('SRS-52 commit: fault injection setiap langkah', () => {
  it.each(FAULT_STEPS)('kegagalan pada %s → rollback penuh, TRANSACTION_FAILED, audit FAILURE terpisah, log aman', async (step) => {
    db.faultAt = step;
    let caught: unknown;
    try { await commitService().commit(command()); } catch (error) { caught = error; }
    expect(isImportCommitError(caught) && caught.code).toBe('TRANSACTION_FAILED');
    expectNoPartialCommit();
    expect(db.auditAfterRollback.map((event) => [event.outcome, event.context_safe.reason_code])).toEqual([['FAILURE', 'TRANSACTION_FAILED']]);
    expect(logger.entries).toEqual([{ code: 'IMPORT_MUTATION_FAILED', correlation_id: UJI_CORRELATION }]);
    expect(inspect(caught)).not.toContain('PRIVATE');
    expect(JSON.stringify(db.auditAfterRollback)).not.toContain('PRIVATE');
    expectSafeLogs();
  });

  it('audit FAILURE yang gagal ditulis tidak menutupi error asli dan hanya mencatat kode konstan', async () => {
    db.faultAt = 'domain.write';
    db.auditAfterRollbackFails = true;
    expect(await errorCode(commitService().commit(command()))).toBe('TRANSACTION_FAILED');
    expect(logger.entries).toEqual([
      { code: 'IMPORT_MUTATION_FAILED', correlation_id: UJI_CORRELATION },
      { code: 'AUDIT_UNAVAILABLE', correlation_id: UJI_CORRELATION },
    ]);
    expectSafeLogs();
  });

  it('committed_count dari writer yang tidak valid diperlakukan sebagai kegagalan transaksi', async () => {
    const service = new CommitService<FakeTx>({
      unitOfWork: db.unitOfWork, batches: db.batches, authorizer: db.authorizer, previews: db.previews,
      references: db.references, idempotency: db.idempotency, audit: db.audit, clock, logger,
      writers: [{ kind: 'COUNT', write: async () => ({ committed_count: -1 }) }],
    }, { idempotencyRetentionMs: RETENTION_MS });
    expect(await errorCode(service.commit(command()))).toBe('TRANSACTION_FAILED');
    expectNoPartialCommit();
  });
});

describe('SRS-52 commit: COMMIT dengan hasil tidak diketahui', () => {
  it('COMMIT tersimpan tetapi respons hilang → OUTCOME_UNKNOWN tanpa FAILURE palsu; retry key sama → replay', async () => {
    db.commitFault = 'lost-after-apply';
    const service = commitService();
    expect(await errorCode(service.commit(command()))).toBe('TRANSACTION_OUTCOME_UNKNOWN');
    expect(db.auditAfterRollback).toHaveLength(0);
    expect(logger.entries).toEqual([{ code: 'IMPORT_MUTATION_OUTCOME_UNKNOWN', correlation_id: UJI_CORRELATION }]);
    const retry = await service.commit(command());
    expect(retry).toEqual({ batch_id: UJI_BATCH_ID, state: 'COMMITTED', committed_count: 3 });
    expect(db.writerCalls).toBe(1);
  });

  it('COMMIT tidak tersimpan dan respons hilang → retry key sama menjalankan commit sekali', async () => {
    db.commitFault = 'lost-before-apply';
    const service = commitService();
    expect(await errorCode(service.commit(command()))).toBe('TRANSACTION_OUTCOME_UNKNOWN');
    expectNoPartialCommit();
    await service.commit(command());
    expect(db.committed.domainRows).toHaveLength(1);
    expect(committedBatchState()).toBe('COMMITTED');
  });
});

describe('SRS-52 konkurensi (fake kunci batch, bukan bukti PostgreSQL)', () => {
  it('dua commit paralel key sama + body sama → satu penulisan, dua respons identik', async () => {
    const service = commitService();
    const [a, b] = await Promise.all([service.commit(command()), service.commit(command())]);
    expect(a).toEqual(b);
    expect(db.writerCalls).toBe(1);
  });

  it('dua commit paralel key sama + body beda → satu sukses, satu IDEMPOTENCY_CONFLICT', async () => {
    const service = commitService();
    const codes = await Promise.all([
      errorCode(service.commit(command())),
      errorCode(service.commit(command({ body: { preview_fingerprint: 'UJI-fingerprint-2', acknowledged_warnings: [] } }))),
    ]);
    expect(codes.sort()).toEqual(['IDEMPOTENCY_CONFLICT', 'NONE']);
    expect(db.writerCalls).toBe(1);
  });

  it('dua key berbeda pada batch sama → satu sukses, satu STATE_CONFLICT', async () => {
    const service = commitService();
    const codes = await Promise.all([
      errorCode(service.commit(command())),
      errorCode(service.commit(command({ idempotency_key: 'uji-key-2' }))),
    ]);
    expect(codes.sort()).toEqual(['NONE', 'STATE_CONFLICT']);
    expect(db.writerCalls).toBe(1);
  });

  it.each(['commit-dulu', 'cancel-dulu'])('commit vs cancel paralel (%s) → tepat satu state terminal', async (order) => {
    const commit = () => errorCode(commitService().commit(command()));
    const cancel = () => errorCode(cancelService().cancel({ actor: UJI_ACTOR, batch_id: UJI_BATCH_ID, correlation_id: UJI_CORRELATION, body: { reason: 'UJI' } }));
    const [first, second] = order === 'commit-dulu' ? await Promise.all([commit(), cancel()]) : await Promise.all([cancel(), commit()]);
    expect([first, second].sort()).toEqual(['NONE', 'STATE_CONFLICT']);
    const state = committedBatchState();
    expect(state === 'COMMITTED' || state === 'CANCELLED').toBe(true);
    expect(db.committed.domainRows).toHaveLength(state === 'COMMITTED' ? 1 : 0);
  });
});

describe('SRS-52 cancel', () => {
  const cancelCommand = (body: unknown = { reason: `alasan bebas ${PRIVATE_SENTINEL}` }) => ({
    actor: UJI_ACTOR, batch_id: UJI_BATCH_ID, correlation_id: UJI_CORRELATION, body,
  });

  it('membatalkan batch VALIDATED, audit CANCELLED tanpa menyalin alasan', async () => {
    expect(await cancelService().cancel(cancelCommand())).toEqual({ batch_id: UJI_BATCH_ID, state: 'CANCELLED' });
    expect(committedBatchState()).toBe('CANCELLED');
    expect(db.committed.auditInTx.map((event) => [event.action, event.outcome, event.context_safe.reason_code]))
      .toEqual([['import.cancel', 'CANCELLED', 'USER_CANCELLED']]);
    expect(JSON.stringify(db.committed.auditInTx)).not.toContain('PRIVATE');
  });

  it('batch CANCELLED tidak dapat di-commit, batch COMMITTED tidak dapat dibatalkan', async () => {
    await cancelService().cancel(cancelCommand());
    expect(await errorCode(commitService().commit(command()))).toBe('STATE_CONFLICT');
    db.addBatch(ujiBatch({ id: UJI_BATCH_ID_2, state: 'COMMITTED' }));
    expect(await errorCode(cancelService().cancel({ ...cancelCommand(), batch_id: UJI_BATCH_ID_2 }))).toBe('STATE_CONFLICT');
  });

  it('pembatalan ulang batch CANCELLED ditolak (cancel belum memakai idempotency, butir 4)', async () => {
    await cancelService().cancel(cancelCommand());
    expect(await errorCode(cancelService().cancel(cancelCommand()))).toBe('STATE_CONFLICT');
  });

  it.each([[{}], [{ reason: '  ' }], [{ reason: 1 }], [{ reason: 'x', extra: 1 }], [null]])('body %j → BAD_REQUEST', async (body) => {
    expect(await errorCode(cancelService().cancel(cancelCommand(body)))).toBe('BAD_REQUEST');
    expect(db.calls).toHaveLength(0);
  });

  it('otorisasi ditolak → FORBIDDEN; kegagalan mark → rollback dan TRANSACTION_FAILED', async () => {
    db.authorizeResult = false;
    expect(await errorCode(cancelService().cancel(cancelCommand()))).toBe('FORBIDDEN');
    db.authorizeResult = true;
    db.faultAt = 'batch.mark';
    expect(await errorCode(cancelService().cancel(cancelCommand()))).toBe('TRANSACTION_FAILED');
    expect(committedBatchState()).toBe('VALIDATED');
    expectSafeLogs();
  });
});
