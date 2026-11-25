/**
 * Port service rekonsiliasi SRS-29. Status: PROPOSED.
 *
 * Port tidak bergantung pada kode yang belum merged (audit #22, staging #27, migrasi 009–011).
 * Adapter PostgreSQL dibuat setelah dependensi tersedia; lihat
 * development-docs/KONTRAK_SCHEMA_011_RECONCILIATION_SRS-29.md §6.
 * Semua port yang menerima `tx` wajib memakai client transaksi yang sama.
 */
import type { CountLineInput, ReconciliationContext, ReconciliationLineResult, StockLineInput } from './reconciliation-engine.js';
import type { KeyRecord } from './run-identity.js';

export interface ReconciliationActor {
  actor_id: string;
  role: string;
  warehouse_ids: readonly string[];
}

/** Snapshot STOCK yang sudah COMMITTED beserta konteks dan barisnya (migrasi 009). */
export interface StockSnapshotSource {
  id: string;
  context: ReconciliationContext;
  lines: readonly StockLineInput[];
}

/** Sesi COUNT yang sudah COMMITTED beserta konteks dan barisnya (migrasi 010). */
export interface CountSessionSource {
  id: string;
  context: ReconciliationContext;
  lines: readonly CountLineInput[];
}

export interface StockSnapshotReader<Tx> {
  /** SELECT … FOR SHARE; null bila tidak ada, tersembunyi, atau belum COMMITTED. */
  readForShare(tx: Tx, snapshotId: string): Promise<StockSnapshotSource | null>;
}

export interface CountSessionReader<Tx> {
  readForShare(tx: Tx, sessionId: string): Promise<CountSessionSource | null>;
}

export interface ReconciliationScope {
  warehouse_id: string;
  mode: 'ACTUAL' | 'UJI';
}

/** Mengulang pemeriksaan sesi/role/assignment di dalam transaksi (SRS-47/48). */
export interface ReconciliationAuthorizer<Tx> {
  authorize(tx: Tx, actor: ReconciliationActor, scope: ReconciliationScope): Promise<boolean>;
}

export interface NewReconciliationRun {
  id: string;
  identity_hash: string;
  stock_snapshot_id: string;
  count_session_id: string;
  rule_version: string;
  warehouse_id: string;
  mode: 'ACTUAL' | 'UJI';
  cutoff_id: string;
  created_by: string;
  lines: readonly ReconciliationLineResult[];
}

/** Unique identity_hash (migrasi 011) terlanjur dipakai transaksi lain. */
export class RunIdentityTakenError extends Error {
  constructor() {
    super('RUN_IDENTITY_TAKEN');
    this.name = 'RunIdentityTakenError';
  }
}

/** Run immutable: port sengaja tidak menyediakan update atau delete. */
export interface ReconciliationRunStore<Tx> {
  findByIdentity(tx: Tx, identityHash: string): Promise<{ run_id: string } | null>;
  insertRun(tx: Tx, run: NewReconciliationRun): Promise<void>;
}

/** Unique (actor, operation, key) terlanjur dipakai transaksi lain. */
export class RunKeyTakenError extends Error {
  constructor() {
    super('RUN_KEY_TAKEN');
    this.name = 'RunKeyTakenError';
  }
}

/** Pemetaan Idempotency-Key → run; adapter direncanakan memakai idempotency_records (012). */
export interface RunKeyStore<Tx> {
  find(tx: Tx, actorId: string, idempotencyKey: string): Promise<KeyRecord | null>;
  record(tx: Tx, actorId: string, idempotencyKey: string, record: KeyRecord): Promise<void>;
}

/** reason_code dibatasi ke nilai audit-event #22 yang sudah ada. */
export interface ReconciliationAuditEvent {
  action: 'reconciliation.create';
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
  correlation_id: string;
  actor_id: string;
  warehouse_id: string | null;
  mode: 'ACTUAL' | 'UJI' | null;
  context_safe: { line_count?: number; reason_code?: 'TRANSACTION_FAILED' | 'ACCESS_DENIED' };
}

export interface ReconciliationAuditWriter<Tx> {
  appendInTransaction(tx: Tx, event: ReconciliationAuditEvent): Promise<void>;
  recordAfterRollback(event: ReconciliationAuditEvent): Promise<void>;
}

/** COMMIT terkirim tetapi hasilnya tidak diketahui. */
export class ReconciliationOutcomeUnknownError extends Error {
  constructor() {
    super('UNIT_OF_WORK_OUTCOME_UNKNOWN');
    this.name = 'ReconciliationOutcomeUnknownError';
  }
}

export interface ReconciliationUnitOfWork<Tx> {
  /** BEGIN → work → COMMIT; error work → ROLLBACK lalu dilempar ulang; COMMIT terputus → ReconciliationOutcomeUnknownError. */
  transaction<T>(work: (tx: Tx) => Promise<T>): Promise<T>;
}

export interface RunIdGenerator {
  next(): string;
}

/** Hanya kode konstan dan correlation_id; objek error tidak pernah diterima. */
export interface SafeReconciliationLogger {
  error(entry: { code: string; correlation_id: string }): void;
}
