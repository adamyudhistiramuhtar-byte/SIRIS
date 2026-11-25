/**
 * Aturan murni SRS-52: keputusan idempotency, guard state batch, dan batas expiry.
 * Status: PROPOSED.
 *
 * State memakai domain migrasi 001 (`import_batches.status`): STAGED, VALIDATED,
 * COMMITTED, CANCELLED. Daftar state final C58-03 masih OPEN (komentar Jira SRS-52
 * nomor 10198 butir 3); state yang tidak dikenal ditolak (fail-closed).
 */
import { ImportCommitError } from './commit-errors.js';

export type IdempotencyDecision<R> =
  | { kind: 'EXECUTE' }
  | { kind: 'REPLAY'; response: R }
  | { kind: 'CONFLICT' };

export interface ExistingIdempotency<R> {
  request_hash: string;
  response: R;
}

/** Tabel keputusan: tidak ada record → EXECUTE; hash sama → REPLAY; hash beda → CONFLICT. */
export function decideIdempotency<R>(existing: ExistingIdempotency<R> | null, requestHash: string): IdempotencyDecision<R> {
  if (existing === null) return { kind: 'EXECUTE' };
  return existing.request_hash === requestHash ? { kind: 'REPLAY', response: existing.response } : { kind: 'CONFLICT' };
}

export type BatchState = 'STAGED' | 'VALIDATED' | 'COMMITTED' | 'CANCELLED';
export const TERMINAL_BATCH_STATES: readonly BatchState[] = Object.freeze(['COMMITTED', 'CANCELLED']);

/** Commit hanya dari VALIDATED (setara PREVIEW_READY DOC-08 sebelum C58-03 diputuskan). */
export function assertCanCommit(state: string): void {
  if (state !== 'VALIDATED') throw new ImportCommitError('STATE_CONFLICT');
}

/** Pembatalan hanya sebelum terminal (DOC-08: STAGED/…/PREVIEW_READY → CANCELLED). */
export function assertCanCancel(state: string): void {
  if (state !== 'STAGED' && state !== 'VALIDATED') throw new ImportCommitError('STATE_CONFLICT');
}

/** DOC-08: jam server >= expires_at berarti kedaluwarsa. Tanggal tidak valid dianggap kedaluwarsa. */
export function isPreviewExpired(now: Date, expiresAt: Date): boolean {
  const nowMs = now.getTime();
  const expiresMs = expiresAt.getTime();
  if (Number.isNaN(nowMs) || Number.isNaN(expiresMs)) return true;
  return nowMs >= expiresMs;
}

/** Retensi record idempotency belum diputuskan (butir 3); nilainya wajib diberikan pemanggil. */
export function assertRetentionMs(value: number): void {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('INVALID_IDEMPOTENCY_RETENTION');
}
