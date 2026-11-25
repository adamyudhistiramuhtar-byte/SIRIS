/**
 * Kanonisasi request dan request_hash idempotency SRS-52. Status: PROPOSED.
 *
 * DOC-07 §15 menetapkan `request_hash` = "payload canonical + scope". Rancangan
 * komposisinya ada di development-docs/KONTRAK_SCHEMA_012_IDEMPOTENCY_SRS-52.md §4.
 * Scope dan reference revision ikut terikat melalui `preview_fingerprint` (milik SRS-51);
 * sumber reference revision masih OPEN (komentar Jira SRS-52 nomor 10198 butir 7).
 */
import { createHash } from 'node:crypto';
import { ImportCommitError } from './commit-errors.js';

export const REQUEST_HASH_VERSION = 'SRS-52/request-hash/proposed-0.1';

export type ImportOperation = 'import.commit' | 'import.cancel';
export type ImportMode = 'ACTUAL' | 'UJI';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Batas panjang mengikuti kolom idempotency_key VARCHAR(128) pada migrasi 001. */
export const IDEMPOTENCY_KEY_MAX_LENGTH = 128;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value);
}

/** Key dipakai apa adanya (tidak di-trim). Kosong atau hanya spasi ditolak (DOC-07: tidak kosong). */
export function assertIdempotencyKey(value: unknown): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > IDEMPOTENCY_KEY_MAX_LENGTH) {
    throw new ImportCommitError('BAD_REQUEST');
  }
}

/**
 * JSON kanonik: key objek diurutkan, tanpa spasi. Hanya menerima null, boolean,
 * string, number berhingga, array, dan objek biasa; selain itu ditolak agar hash tidak ambigu.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('CANONICAL_JSON_UNSUPPORTED');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const entries = Object.keys(value as Record<string, unknown>).sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`);
    return `{${entries.join(',')}}`;
  }
  throw new TypeError('CANONICAL_JSON_UNSUPPORTED');
}

export interface CommitHashInput {
  actor_id: string;
  batch_id: string;
  warehouse_id: string;
  mode: ImportMode;
  preview_fingerprint: string;
  acknowledged_warnings: readonly string[];
}

/**
 * Hash SHA-256 hex untuk operasi commit. Urutan acknowledged_warnings tidak berpengaruh;
 * duplikat ditolak karena maknanya ambigu.
 */
export function commitRequestHash(input: CommitHashInput): string {
  const warnings = [...input.acknowledged_warnings].sort();
  if (new Set(warnings).size !== warnings.length) throw new ImportCommitError('BAD_REQUEST');
  const canonical = canonicalJson({
    version: REQUEST_HASH_VERSION,
    operation: 'import.commit',
    actor_id: input.actor_id,
    batch_id: input.batch_id,
    scope: { warehouse_id: input.warehouse_id, mode: input.mode },
    preview_fingerprint: input.preview_fingerprint,
    acknowledged_warnings: warnings,
  });
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}
