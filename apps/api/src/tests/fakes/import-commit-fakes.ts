/**
 * Fake transaksional untuk tes SRS-52 Fase A. BUKAN pengganti tes PostgreSQL.
 *
 * Perilaku yang ditiru: draft per transaksi (rollback = draft dibuang), kunci batch
 * FOR UPDATE yang diserialkan per batch sampai transaksi selesai, pembacaan ulang data
 * committed setelah kunci didapat (mirip READ COMMITTED), unique (actor, operation, key)
 * terhadap data committed, dan COMMIT yang hasilnya tidak diketahui.
 * Yang TIDAK ditiru: isolasi PostgreSQL sebenarnya, deadlock, FK/CHECK, dan trigger audit.
 */
import {
  IdempotencyKeyTakenError,
  UnitOfWorkOutcomeUnknownError,
  type BatchStore,
  type CommitActor,
  type CommitAuditEvent,
  type CommitAuditWriter,
  type CommitAuthorizer,
  type DomainCommitWriter,
  type IdempotencyStore,
  type ImportKind,
  type LockedBatch,
  type NewIdempotencyRecord,
  type PreviewReader,
  type PreviewSnapshot,
  type ReferenceRevisionReader,
  type StoredIdempotency,
  type UnitOfWork,
} from '../../modules/import-commit/commit-ports.js';

export type FaultStep =
  | 'batch.lock'
  | 'idempotency.find'
  | 'authorize'
  | 'preview.read'
  | 'reference.current'
  | 'domain.write'
  | 'audit.append'
  | 'batch.mark'
  | 'idempotency.insert';

export const FAULT_STEPS: readonly FaultStep[] = [
  'batch.lock', 'idempotency.find', 'authorize', 'preview.read', 'reference.current',
  'domain.write', 'audit.append', 'batch.mark', 'idempotency.insert',
];

/** Sentinel yang meniru pesan driver privat; tes memastikan ia tidak pernah bocor. */
export const PRIVATE_SENTINEL = 'PRIVATE_DRIVER_SENTINEL select * from secret';

interface DbState {
  batches: Map<string, LockedBatch>;
  idempotency: Map<string, StoredIdempotency & { expires_at: Date }>;
  domainRows: { batch_id: string; kind: ImportKind; count: number }[];
  auditInTx: CommitAuditEvent[];
}

export interface FakeTx {
  readonly id: number;
  draft: DbState;
  locks: string[];
  done: boolean;
}

function clone(state: DbState): DbState {
  return {
    batches: new Map([...state.batches].map(([k, v]) => [k, { ...v }])),
    idempotency: new Map([...state.idempotency].map(([k, v]) => [k, { ...v, response: { ...v.response } }])),
    domainRows: state.domainRows.map((row) => ({ ...row })),
    auditInTx: state.auditInTx.map((event) => ({ ...event, context_safe: { ...event.context_safe } })),
  };
}

const scopeKey = (actor: string, operation: string, key: string) => JSON.stringify([actor, operation, key]);

export class FakeImportDatabase {
  committed: DbState = { batches: new Map(), idempotency: new Map(), domainRows: [], auditInTx: [] };
  auditAfterRollback: CommitAuditEvent[] = [];
  faultAt: FaultStep | null = null;
  /** 'lost-after-apply': COMMIT tersimpan tetapi respons hilang; 'lost-before-apply': tidak tersimpan. */
  commitFault: 'lost-after-apply' | 'lost-before-apply' | null = null;
  auditAfterRollbackFails = false;
  idempotencyTakenOnInsert = false;
  authorizeResult = true;
  referenceRevision = 'REF-UJI-1';
  preview: PreviewSnapshot | null = null;
  writerCalls = 0;
  calls: string[] = [];

  private nextTx = 1;
  private readonly lockQueue = new Map<string, Promise<void>>();
  private readonly lockRelease = new Map<number, (() => void)[]>();

  addBatch(batch: LockedBatch): void {
    this.committed.batches.set(batch.id, { ...batch });
  }

  private fault(step: FaultStep): void {
    this.calls.push(step);
    if (this.faultAt === step) throw new Error(PRIVATE_SENTINEL);
  }

  private async acquire(tx: FakeTx, batchId: string): Promise<void> {
    const previous = this.lockQueue.get(batchId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => { release = resolve; });
    this.lockQueue.set(batchId, previous.then(() => current));
    await previous;
    tx.locks.push(batchId);
    const list = this.lockRelease.get(tx.id) ?? [];
    list.push(release);
    this.lockRelease.set(tx.id, list);
  }

  private releaseAll(tx: FakeTx): void {
    for (const release of this.lockRelease.get(tx.id) ?? []) release();
    this.lockRelease.delete(tx.id);
  }

  readonly unitOfWork: UnitOfWork<FakeTx> = {
    transaction: async <T>(work: (tx: FakeTx) => Promise<T>): Promise<T> => {
      const tx: FakeTx = { id: this.nextTx++, draft: clone(this.committed), locks: [], done: false };
      let result: T;
      try {
        result = await work(tx);
      } catch (error) {
        tx.done = true;
        this.releaseAll(tx);
        throw error;
      }
      tx.done = true;
      const fault = this.commitFault;
      this.commitFault = null;
      if (fault !== 'lost-before-apply') this.committed = tx.draft;
      this.releaseAll(tx);
      if (fault !== null) throw new UnitOfWorkOutcomeUnknownError();
      return result;
    },
  };

  readonly batches: BatchStore<FakeTx> = {
    lockForUpdate: async (tx, batchId) => {
      this.fault('batch.lock');
      await this.acquire(tx, batchId);
      // Setelah kunci didapat, baca ulang data committed terbaru (tx belum menulis apa pun).
      tx.draft = clone(this.committed);
      const batch = tx.draft.batches.get(batchId);
      return batch ? { ...batch } : null;
    },
    markCommitted: async (tx, batchId) => {
      this.fault('batch.mark');
      const batch = tx.draft.batches.get(batchId);
      if (batch) batch.state = 'COMMITTED';
    },
    markCancelled: async (tx, batchId) => {
      this.fault('batch.mark');
      const batch = tx.draft.batches.get(batchId);
      if (batch) batch.state = 'CANCELLED';
    },
  };

  readonly authorizer: CommitAuthorizer<FakeTx> = {
    authorize: async () => {
      this.fault('authorize');
      return this.authorizeResult;
    },
  };

  readonly previews: PreviewReader<FakeTx> = {
    read: async () => {
      this.fault('preview.read');
      return this.preview ? { ...this.preview, warning_issue_ids: [...this.preview.warning_issue_ids] } : null;
    },
  };

  readonly references: ReferenceRevisionReader<FakeTx> = {
    current: async () => {
      this.fault('reference.current');
      return this.referenceRevision;
    },
  };

  writer(kind: ImportKind, count = 3): DomainCommitWriter<FakeTx> {
    return {
      kind,
      write: async (tx, batch) => {
        this.fault('domain.write');
        this.writerCalls += 1;
        tx.draft.domainRows.push({ batch_id: batch.id, kind, count });
        return { committed_count: count };
      },
    };
  }

  readonly idempotency: IdempotencyStore<FakeTx> = {
    find: async (tx, scope) => {
      this.fault('idempotency.find');
      const found = tx.draft.idempotency.get(scopeKey(scope.actor_id, scope.operation, scope.idempotency_key));
      return found ? { request_hash: found.request_hash, batch_id: found.batch_id, response: { ...found.response } } : null;
    },
    insertSucceeded: async (tx, record: NewIdempotencyRecord) => {
      this.fault('idempotency.insert');
      const key = scopeKey(record.actor_id, record.operation, record.idempotency_key);
      if (this.idempotencyTakenOnInsert || tx.draft.idempotency.has(key) || this.committed.idempotency.has(key)) {
        throw new IdempotencyKeyTakenError();
      }
      tx.draft.idempotency.set(key, {
        request_hash: record.request_hash, batch_id: record.batch_id, response: { ...record.response }, expires_at: record.expires_at,
      });
    },
  };

  readonly audit: CommitAuditWriter<FakeTx> = {
    appendInTransaction: async (tx, event) => {
      this.fault('audit.append');
      tx.draft.auditInTx.push({ ...event, context_safe: { ...event.context_safe } });
    },
    recordAfterRollback: async (event) => {
      if (this.auditAfterRollbackFails) throw new Error(PRIVATE_SENTINEL);
      this.auditAfterRollback.push({ ...event, context_safe: { ...event.context_safe } });
    },
  };
}

export class FakeClock {
  constructor(public current: Date) {}
  now(): Date {
    return new Date(this.current.getTime());
  }
}

export class RecordingLogger {
  readonly entries: unknown[] = [];
  error(entry: { code: string; correlation_id: string }): void {
    this.entries.push(entry);
  }
}

export const UJI_ACTOR: CommitActor = {
  actor_id: '10000000-0000-4000-8000-000000000001',
  role: 'WAREHOUSE',
  warehouse_ids: ['20000000-0000-4000-8000-000000000001'],
};
export const UJI_BATCH_ID = '30000000-0000-4000-8000-000000000001';
export const UJI_BATCH_ID_2 = '30000000-0000-4000-8000-000000000002';
export const UJI_CORRELATION = '50000000-0000-4000-8000-000000000001';

export function ujiBatch(overrides: Partial<LockedBatch> = {}): LockedBatch {
  return {
    id: UJI_BATCH_ID,
    kind: 'COUNT',
    warehouse_id: UJI_ACTOR.warehouse_ids[0],
    mode: 'UJI',
    state: 'VALIDATED',
    created_by: UJI_ACTOR.actor_id,
    ...overrides,
  };
}

export function ujiPreview(overrides: Partial<PreviewSnapshot> = {}): PreviewSnapshot {
  return {
    batch_id: UJI_BATCH_ID,
    fingerprint: 'UJI-fingerprint-1',
    expires_at: new Date('2026-11-25T10:30:00+07:00'),
    reference_revision: 'REF-UJI-1',
    error_count: 0,
    warning_issue_ids: [],
    ...overrides,
  };
}
