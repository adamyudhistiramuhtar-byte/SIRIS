/**
 * Port yang disuntik ke CommitService/CancelService SRS-52. Status: PROPOSED.
 *
 * Port ini sengaja tidak bergantung pada kode yang belum merged (#22 audit, #27 staging,
 * SRS-51 preview). Adapter PostgreSQL dibuat pada Fase B setelah dependensi tersebut
 * tersedia; lihat development-docs/KONTRAK_SCHEMA_012_IDEMPOTENCY_SRS-52.md §6.
 *
 * Semua port yang menerima `tx` wajib memakai client transaksi yang sama dengan pemanggil.
 */
import type { ImportMode, ImportOperation } from './request-hash.js';

export type ImportKind = 'EXPECTED' | 'COMMITMENT' | 'RECEIVING' | 'STOCK' | 'COUNT';

export interface CommitActor {
  actor_id: string;
  role: string;
  warehouse_ids: readonly string[];
}

/** Baris import_batches yang sudah dikunci FOR UPDATE di dalam transaksi. */
export interface LockedBatch {
  id: string;
  kind: ImportKind;
  warehouse_id: string;
  mode: ImportMode;
  state: string;
  created_by: string | null;
}

export interface BatchStore<Tx> {
  /** SELECT … FOR UPDATE; null bila batch tidak ada atau tersembunyi. */
  lockForUpdate(tx: Tx, batchId: string): Promise<LockedBatch | null>;
  markCommitted(tx: Tx, batchId: string, at: Date): Promise<void>;
  markCancelled(tx: Tx, batchId: string, at: Date): Promise<void>;
}

/** Mengulang pemeriksaan sesi/role/assignment di dalam transaksi (SRS-47/48). */
export interface CommitAuthorizer<Tx> {
  authorize(tx: Tx, actor: CommitActor, batch: LockedBatch, operation: ImportOperation): Promise<boolean>;
}

/** Snapshot preview dari SRS-51. Bentuk final mengikuti kontrak SRS-51 yang belum tersedia. */
export interface PreviewSnapshot {
  batch_id: string;
  fingerprint: string;
  expires_at: Date;
  reference_revision: string;
  error_count: number;
  warning_issue_ids: readonly string[];
}

export interface PreviewReader<Tx> {
  read(tx: Tx, actor: CommitActor, batch: LockedBatch): Promise<PreviewSnapshot | null>;
}

/** Sumber reference revision masih OPEN (komentar Jira SRS-52 nomor 10198 butir 7). */
export interface ReferenceRevisionReader<Tx> {
  current(tx: Tx, batch: LockedBatch): Promise<string>;
}

/** Penulis domain + source_row per kind (DOC-09 API-04 Storage). */
export interface DomainCommitWriter<Tx> {
  readonly kind: ImportKind;
  write(tx: Tx, batch: LockedBatch, preview: PreviewSnapshot, actor: CommitActor): Promise<{ committed_count: number }>;
}

export interface CommitResult {
  batch_id: string;
  state: 'COMMITTED';
  committed_count: number;
}

export interface CancelResult {
  batch_id: string;
  state: 'CANCELLED';
}

export interface IdempotencyScope {
  actor_id: string;
  operation: ImportOperation;
  idempotency_key: string;
}

export interface StoredIdempotency {
  request_hash: string;
  batch_id: string;
  response: CommitResult;
}

export interface NewIdempotencyRecord extends IdempotencyScope {
  request_hash: string;
  batch_id: string;
  response: CommitResult;
  expires_at: Date;
}

/** Adapter memetakan unique violation (actor, operation, key) menjadi error ini. */
export class IdempotencyKeyTakenError extends Error {
  constructor() {
    super('IDEMPOTENCY_KEY_TAKEN');
    this.name = 'IdempotencyKeyTakenError';
  }
}

export interface IdempotencyStore<Tx> {
  find(tx: Tx, scope: IdempotencyScope): Promise<StoredIdempotency | null>;
  /** Hanya hasil sukses yang disimpan, di transaksi yang sama dengan domain. */
  insertSucceeded(tx: Tx, record: NewIdempotencyRecord): Promise<void>;
}

/** reason_code dibatasi ke nilai yang sudah ada pada audit-event #22; kode baru menunggu butir 1. */
export type CommitAuditReason = 'TRANSACTION_FAILED' | 'ACCESS_DENIED' | 'USER_CANCELLED';

export interface CommitAuditEvent {
  action: ImportOperation;
  outcome: 'SUCCESS' | 'FAILURE' | 'CANCELLED' | 'DENIED';
  correlation_id: string;
  actor_id: string;
  batch_id: string | null;
  warehouse_id: string | null;
  mode: ImportMode | null;
  context_safe: { kind?: ImportKind; committed_count?: number; reason_code?: CommitAuditReason };
}

export interface CommitAuditWriter<Tx> {
  /** Audit SUCCESS/CANCELLED di dalam transaksi yang sama dengan domain. */
  appendInTransaction(tx: Tx, event: CommitAuditEvent): Promise<void>;
  /** Audit FAILURE/DENIED pada koneksi/transaksi baru setelah rollback. */
  recordAfterRollback(event: CommitAuditEvent): Promise<void>;
}

/** COMMIT terkirim tetapi hasilnya tidak diketahui; bukan bukti rollback. */
export class UnitOfWorkOutcomeUnknownError extends Error {
  constructor() {
    super('UNIT_OF_WORK_OUTCOME_UNKNOWN');
    this.name = 'UnitOfWorkOutcomeUnknownError';
  }
}

/**
 * BEGIN → work(tx) → COMMIT. Bila work melempar: ROLLBACK lalu error yang sama dilempar ulang.
 * Bila COMMIT gagal/terputus: lempar UnitOfWorkOutcomeUnknownError.
 */
export interface UnitOfWork<Tx> {
  transaction<T>(work: (tx: Tx) => Promise<T>): Promise<T>;
}

export interface Clock {
  now(): Date;
}

/** Hanya kode konstan dan correlation_id; objek error tidak pernah diterima. */
export interface SafeCommitLogger {
  error(entry: { code: string; correlation_id: string }): void;
}
