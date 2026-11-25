/**
 * Fake transaksional untuk tes service rekonsiliasi SRS-29. BUKAN pengganti tes PostgreSQL.
 *
 * Ditiru: draft per transaksi (rollback = dibuang); unique identity_hash dan unique
 * (actor, key) yang menahan transaksi paralel sampai pemegang pertama selesai, lalu
 * menolak dengan *TakenError bila pemegang pertama COMMIT; COMMIT yang hasilnya tidak diketahui.
 * Tidak ditiru: isolasi PostgreSQL, FOR SHARE, deadlock, FK/CHECK, trigger append-only.
 */
import type { CountLineInput, ReconciliationContext, StockLineInput } from '../../modules/reconciliation/reconciliation-engine.js';
import {
  ReconciliationOutcomeUnknownError,
  RunIdentityTakenError,
  RunKeyTakenError,
  type CountSessionReader,
  type CountSessionSource,
  type NewReconciliationRun,
  type ReconciliationActor,
  type ReconciliationAuditEvent,
  type ReconciliationAuditWriter,
  type ReconciliationAuthorizer,
  type ReconciliationRunStore,
  type ReconciliationScope,
  type ReconciliationUnitOfWork,
  type RunIdGenerator,
  type RunKeyStore,
  type StockSnapshotReader,
  type StockSnapshotSource,
} from '../../modules/reconciliation/reconciliation-ports.js';
import type { KeyRecord } from '../../modules/reconciliation/run-identity.js';

export type ReconciliationFaultStep =
  | 'snapshot.read' | 'session.read' | 'authorize' | 'key.find' | 'run.find' | 'run.insert' | 'key.record' | 'audit.append';

export const RECONCILIATION_FAULT_STEPS: readonly ReconciliationFaultStep[] = [
  'snapshot.read', 'session.read', 'authorize', 'key.find', 'run.find', 'run.insert', 'key.record', 'audit.append',
];

export const PRIVATE_SENTINEL = 'PRIVATE_DRIVER_SENTINEL duplicate key value';

interface State {
  runs: Map<string, NewReconciliationRun>;
  byIdentity: Map<string, string>;
  keys: Map<string, KeyRecord>;
  audit: ReconciliationAuditEvent[];
}

export interface FakeRecTx {
  id: number;
  draft: State;
  ended: Promise<void>;
  end: () => void;
}

const keyOf = (actor: string, key: string) => JSON.stringify([actor, key]);

function clone(state: State): State {
  return {
    runs: new Map(state.runs),
    byIdentity: new Map(state.byIdentity),
    keys: new Map([...state.keys].map(([k, v]) => [k, { ...v }])),
    // Draft hanya menampung audit baru transaksi ini agar penggabungan paralel tetap benar.
    audit: [],
  };
}

export class FakeReconciliationDatabase {
  committed: State = { runs: new Map(), byIdentity: new Map(), keys: new Map(), audit: [] };
  auditAfterRollback: ReconciliationAuditEvent[] = [];
  snapshots = new Map<string, StockSnapshotSource>();
  sessions = new Map<string, CountSessionSource>();
  faultAt: ReconciliationFaultStep | null = null;
  commitFault: 'lost-after-apply' | 'lost-before-apply' | null = null;
  auditAfterRollbackFails = false;
  deniedWarehouses = new Set<string>();
  calls: string[] = [];

  private nextTx = 1;
  private nextRun = 1;
  private readonly pendingIdentity = new Map<string, FakeRecTx>();
  private readonly pendingKey = new Map<string, FakeRecTx>();

  private fault(step: ReconciliationFaultStep): void {
    this.calls.push(step);
    if (this.faultAt === step) throw new Error(PRIVATE_SENTINEL);
  }

  readonly unitOfWork: ReconciliationUnitOfWork<FakeRecTx> = {
    transaction: async <T>(work: (tx: FakeRecTx) => Promise<T>): Promise<T> => {
      let end!: () => void;
      const ended = new Promise<void>((resolve) => { end = resolve; });
      const tx: FakeRecTx = { id: this.nextTx++, draft: clone(this.committed), ended, end };
      const release = () => {
        for (const map of [this.pendingIdentity, this.pendingKey]) {
          for (const [key, owner] of map) if (owner === tx) map.delete(key);
        }
        tx.end();
      };
      let result: T;
      try {
        result = await work(tx);
      } catch (error) {
        release();
        throw error;
      }
      const fault = this.commitFault;
      this.commitFault = null;
      if (fault !== 'lost-before-apply') this.apply(tx.draft);
      release();
      if (fault !== null) throw new ReconciliationOutcomeUnknownError();
      return result;
    },
  };

  /** Menggabungkan perubahan draft ke data committed (append-only). */
  private apply(draft: State): void {
    for (const [id, run] of draft.runs) if (!this.committed.runs.has(id)) this.committed.runs.set(id, run);
    for (const [hash, id] of draft.byIdentity) if (!this.committed.byIdentity.has(hash)) this.committed.byIdentity.set(hash, id);
    for (const [key, record] of draft.keys) if (!this.committed.keys.has(key)) this.committed.keys.set(key, record);
    for (const event of draft.audit) this.committed.audit.push(event);
  }

  readonly snapshotReader: StockSnapshotReader<FakeRecTx> = {
    readForShare: async (_tx, id) => {
      this.fault('snapshot.read');
      const found = this.snapshots.get(id);
      return found ? { ...found, lines: found.lines.map((line) => ({ ...line })) } : null;
    },
  };

  readonly sessionReader: CountSessionReader<FakeRecTx> = {
    readForShare: async (_tx, id) => {
      this.fault('session.read');
      const found = this.sessions.get(id);
      return found ? { ...found, lines: found.lines.map((line) => ({ ...line })) } : null;
    },
  };

  readonly authorizer: ReconciliationAuthorizer<FakeRecTx> = {
    authorize: async (_tx, _actor: ReconciliationActor, scope: ReconciliationScope) => {
      this.fault('authorize');
      return !this.deniedWarehouses.has(scope.warehouse_id);
    },
  };

  private async uniqueWait(map: Map<string, FakeRecTx>, key: string, tx: FakeRecTx, taken: () => boolean): Promise<boolean> {
    if (taken()) return true;
    const owner = map.get(key);
    if (owner !== undefined && owner !== tx) {
      await owner.ended;
      if (taken()) return true;
    }
    map.set(key, tx);
    return false;
  }

  readonly runStore: ReconciliationRunStore<FakeRecTx> = {
    findByIdentity: async (tx, hash) => {
      this.fault('run.find');
      const id = tx.draft.byIdentity.get(hash);
      return id ? { run_id: id } : null;
    },
    insertRun: async (tx, run) => {
      this.fault('run.insert');
      if (await this.uniqueWait(this.pendingIdentity, run.identity_hash, tx, () => this.committed.byIdentity.has(run.identity_hash))) {
        throw new RunIdentityTakenError();
      }
      tx.draft.runs.set(run.id, Object.freeze({ ...run, lines: Object.freeze(run.lines.map((line) => Object.freeze({ ...line }))) }));
      tx.draft.byIdentity.set(run.identity_hash, run.id);
    },
  };

  readonly keyStore: RunKeyStore<FakeRecTx> = {
    find: async (tx, actor, key) => {
      this.fault('key.find');
      const found = tx.draft.keys.get(keyOf(actor, key));
      return found ? { ...found } : null;
    },
    record: async (tx, actor, key, record) => {
      this.fault('key.record');
      const k = keyOf(actor, key);
      if (await this.uniqueWait(this.pendingKey, k, tx, () => this.committed.keys.has(k))) throw new RunKeyTakenError();
      tx.draft.keys.set(k, { ...record });
    },
  };

  readonly audit: ReconciliationAuditWriter<FakeRecTx> = {
    appendInTransaction: async (tx, event) => {
      this.fault('audit.append');
      tx.draft.audit.push({ ...event, context_safe: { ...event.context_safe } });
    },
    recordAfterRollback: async (event) => {
      if (this.auditAfterRollbackFails) throw new Error(PRIVATE_SENTINEL);
      this.auditAfterRollback.push({ ...event, context_safe: { ...event.context_safe } });
    },
  };

  readonly ids: RunIdGenerator = {
    next: () => `60000000-0000-4000-8000-${String(this.nextRun++).padStart(12, '0')}`,
  };
}

export class RecordingRecLogger {
  readonly entries: unknown[] = [];
  error(entry: { code: string; correlation_id: string }): void {
    this.entries.push(entry);
  }
}

export const REC_ACTOR: ReconciliationActor = {
  actor_id: '10000000-0000-4000-8000-000000000002',
  role: 'WAREHOUSE',
  warehouse_ids: ['20000000-0000-4000-8000-000000000001'],
};
export const REC_WAREHOUSE = '20000000-0000-4000-8000-000000000001';
export const REC_OTHER_WAREHOUSE = '20000000-0000-4000-8000-000000000009';
export const REC_CUTOFF = '40000000-0000-4000-8000-000000000001';
export const SNAPSHOT_ID = '70000000-0000-4000-8000-000000000001';
export const SESSION_ID = '80000000-0000-4000-8000-000000000001';
export const REC_CORRELATION = '50000000-0000-4000-8000-000000000002';

export function ujiContext(overrides: Partial<ReconciliationContext> = {}): ReconciliationContext {
  return { warehouse_id: REC_WAREHOUSE, mode: 'UJI', cutoff_id: REC_CUTOFF, ...overrides };
}

/** Data UJI sintetis; bukan data operasional mitra. */
export function ujiStockLines(): StockLineInput[] {
  return [
    { id: 'S-1', material_id: 'MAT-A', uom: 'KG', system_quantity: '10.000000' },
    { id: 'S-2', material_id: 'MAT-B', uom: 'KG', system_quantity: '10.000000' },
    { id: 'S-3', material_id: 'MAT-C', uom: 'KG', system_quantity: '5.000000' },
  ];
}

export function ujiCountLines(): CountLineInput[] {
  return [
    { id: 'C-1', material_id: 'MAT-A', uom: 'KG', is_counted: true, physical_quantity: '8.000000' },
    { id: 'C-2', material_id: 'MAT-B', uom: 'KG', is_counted: true, physical_quantity: '10.000000' },
    { id: 'C-3', material_id: 'MAT-C', uom: 'KG', is_counted: false, physical_quantity: null },
  ];
}
