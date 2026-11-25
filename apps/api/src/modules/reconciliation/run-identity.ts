/**
 * Identitas run dan keputusan reuse rekonsiliasi SRS-29. Status: PROPOSED.
 *
 * Keputusan PM teknis UJI (Adam, komentar Jira SRS-38 nomor 10153 butir 4, D-05):
 * input identik (snapshot, count, rule, scope) memakai ulang run yang ada, termasuk ketika
 * Idempotency-Key berbeda. Komposisi hash dan bentuk respons masih usulan
 * (development-docs/KONTRAK_SCHEMA_011_RECONCILIATION_SRS-29.md §4).
 */
import { createHash } from 'node:crypto';

export const RUN_IDENTITY_VERSION = 'SRS-29/run-identity/proposed-0.1';

export interface RunIdentityInput {
  stock_snapshot_id: string;
  count_session_id: string;
  rule_version: string;
  warehouse_id: string;
  mode: 'ACTUAL' | 'UJI';
}

/**
 * SHA-256 hex atas array berurutan tetap (bukan objek) sehingga tidak bergantung
 * pada urutan key. Actor sengaja tidak masuk: input identik dari aktor mana pun dalam
 * scope yang sama memakai run yang sama (D-05 menyebut snapshot/count/rule/scope).
 */
export function runIdentityHash(input: RunIdentityInput): string {
  const parts = [
    RUN_IDENTITY_VERSION,
    input.stock_snapshot_id,
    input.count_session_id,
    input.rule_version,
    input.warehouse_id,
    input.mode,
  ];
  if (parts.some((part) => typeof part !== 'string' || part.length === 0)) throw new TypeError('RUN_IDENTITY_INVALID');
  return createHash('sha256').update(JSON.stringify(parts), 'utf8').digest('hex');
}

/** Pemetaan Idempotency-Key aktor ke run yang pernah dikembalikan. */
export interface KeyRecord {
  identity_hash: string;
  run_id: string;
}

export interface IdentityRun {
  run_id: string;
}

export type RunDecision =
  | { kind: 'CONFLICT' }
  | { kind: 'REUSE'; run_id: string; record_key: boolean }
  | { kind: 'CREATE' };

/**
 * Tabel keputusan:
 * - key pernah dipakai untuk input lain → CONFLICT;
 * - key pernah dipakai untuk input sama → REUSE (tanpa mencatat key lagi);
 * - key baru, run identik sudah ada → REUSE dan catat key (D-05);
 * - key baru, run belum ada → CREATE.
 */
export function decideRun(keyRecord: KeyRecord | null, identityRun: IdentityRun | null, identityHash: string): RunDecision {
  if (keyRecord !== null) {
    return keyRecord.identity_hash === identityHash
      ? { kind: 'REUSE', run_id: keyRecord.run_id, record_key: false }
      : { kind: 'CONFLICT' };
  }
  if (identityRun !== null) return { kind: 'REUSE', run_id: identityRun.run_id, record_key: true };
  return { kind: 'CREATE' };
}
