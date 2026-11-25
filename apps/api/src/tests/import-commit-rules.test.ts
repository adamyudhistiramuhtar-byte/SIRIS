import { describe, expect, it } from 'vitest';
import { ImportCommitError, IMPORT_COMMIT_HTTP_STATUS, isImportCommitError } from '../modules/import-commit/commit-errors.js';
import { assertCanCancel, assertCanCommit, assertRetentionMs, decideIdempotency, isPreviewExpired } from '../modules/import-commit/commit-rules.js';
import {
  IDEMPOTENCY_KEY_MAX_LENGTH,
  REQUEST_HASH_VERSION,
  assertIdempotencyKey,
  canonicalJson,
  commitRequestHash,
  type CommitHashInput,
} from '../modules/import-commit/request-hash.js';

const base: CommitHashInput = {
  actor_id: '10000000-0000-4000-8000-000000000001',
  batch_id: '30000000-0000-4000-8000-000000000001',
  warehouse_id: '20000000-0000-4000-8000-000000000001',
  mode: 'UJI',
  preview_fingerprint: 'UJI-fingerprint-1',
  acknowledged_warnings: [],
};

const codeOf = (fn: () => unknown) => {
  try { fn(); } catch (error) { return isImportCommitError(error) ? error.code : 'OTHER'; }
  return 'NONE';
};

describe('SRS-52 kanonisasi JSON', () => {
  it('mengurutkan key objek secara rekursif dan tidak mengubah urutan array', () => {
    expect(canonicalJson({ b: 1, a: { d: [3, 1], c: null } })).toBe('{"a":{"c":null,"d":[3,1]},"b":1}');
    expect(canonicalJson({ a: 1, b: 2 })).toBe(canonicalJson({ b: 2, a: 1 }));
  });
  it('menolak nilai yang membuat hash ambigu', () => {
    for (const value of [undefined, Number.NaN, Number.POSITIVE_INFINITY, () => 1, new Date(0), new Map(), 1n]) {
      expect(() => canonicalJson({ value })).toThrow('CANONICAL_JSON_UNSUPPORTED');
    }
  });
});

describe('SRS-52 request_hash commit', () => {
  it('deterministik, SHA-256 hex, dan memuat versi kanonisasi', () => {
    const hash = commitRequestHash(base);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(commitRequestHash({ ...base })).toBe(hash);
    expect(REQUEST_HASH_VERSION).toBe('SRS-52/request-hash/proposed-0.1');
  });
  it('urutan acknowledged_warnings tidak berpengaruh, duplikat ditolak', () => {
    const a = commitRequestHash({ ...base, acknowledged_warnings: ['w-2', 'w-1'] });
    expect(commitRequestHash({ ...base, acknowledged_warnings: ['w-1', 'w-2'] })).toBe(a);
    expect(codeOf(() => commitRequestHash({ ...base, acknowledged_warnings: ['w-1', 'w-1'] }))).toBe('BAD_REQUEST');
  });
  it('setiap unsur payload, actor, dan scope mengubah hash', () => {
    const hash = commitRequestHash(base);
    const variants: Partial<CommitHashInput>[] = [
      { actor_id: '10000000-0000-4000-8000-000000000002' },
      { batch_id: '30000000-0000-4000-8000-000000000002' },
      { warehouse_id: '20000000-0000-4000-8000-000000000002' },
      { mode: 'ACTUAL' },
      { preview_fingerprint: 'UJI-fingerprint-2' },
      { acknowledged_warnings: ['w-1'] },
    ];
    for (const variant of variants) expect(commitRequestHash({ ...base, ...variant })).not.toBe(hash);
  });
});

describe('SRS-52 validasi Idempotency-Key', () => {
  it('menerima key 1..128 karakter apa adanya', () => {
    expect(codeOf(() => assertIdempotencyKey('k'))).toBe('NONE');
    expect(codeOf(() => assertIdempotencyKey('x'.repeat(IDEMPOTENCY_KEY_MAX_LENGTH)))).toBe('NONE');
  });
  it('menolak kosong, hanya spasi, terlalu panjang, dan bukan string', () => {
    for (const value of ['', '   ', 'x'.repeat(IDEMPOTENCY_KEY_MAX_LENGTH + 1), undefined, 42]) {
      expect(codeOf(() => assertIdempotencyKey(value))).toBe('BAD_REQUEST');
    }
  });
});

describe('SRS-52 tabel keputusan idempotency', () => {
  const response = { batch_id: base.batch_id, state: 'COMMITTED' as const, committed_count: 3 };
  it.each([
    ['tidak ada record', null, 'h1', 'EXECUTE'],
    ['hash sama', { request_hash: 'h1', response }, 'h1', 'REPLAY'],
    ['hash beda', { request_hash: 'h1', response }, 'h2', 'CONFLICT'],
  ] as const)('%s → %s', (_label, existing, hash, expected) => {
    const decision = decideIdempotency(existing, hash);
    expect(decision.kind).toBe(expected);
    if (decision.kind === 'REPLAY') expect(decision.response).toBe(response);
  });
});

describe('SRS-52 guard state batch (domain 001, C58-03 masih OPEN)', () => {
  it.each([
    ['VALIDATED', 'NONE', 'NONE'],
    ['STAGED', 'STATE_CONFLICT', 'NONE'],
    ['COMMITTED', 'STATE_CONFLICT', 'STATE_CONFLICT'],
    ['CANCELLED', 'STATE_CONFLICT', 'STATE_CONFLICT'],
    ['validated', 'STATE_CONFLICT', 'STATE_CONFLICT'],
    ['EXPIRED', 'STATE_CONFLICT', 'STATE_CONFLICT'],
    ['', 'STATE_CONFLICT', 'STATE_CONFLICT'],
  ])('state %s: commit %s, cancel %s', (state, commit, cancel) => {
    expect(codeOf(() => assertCanCommit(state))).toBe(commit);
    expect(codeOf(() => assertCanCancel(state))).toBe(cancel);
  });
});

describe('SRS-52 batas expiry preview (jam server >= expires_at)', () => {
  const expires = new Date('2026-11-25T10:30:00.000+07:00');
  it.each([
    ['1 ms sebelum', -1, false],
    ['tepat sama', 0, true],
    ['1 ms sesudah', 1, true],
  ])('%s expires_at → kedaluwarsa=%s', (_label, delta, expected) => {
    expect(isPreviewExpired(new Date(expires.getTime() + delta), expires)).toBe(expected);
  });
  it('tanggal tidak valid dianggap kedaluwarsa (fail-closed)', () => {
    expect(isPreviewExpired(new Date('invalid'), expires)).toBe(true);
    expect(isPreviewExpired(expires, new Date('invalid'))).toBe(true);
  });
  it('retensi idempotency wajib bilangan bulat positif; tidak ada default', () => {
    for (const value of [0, -1, 1.5, Number.NaN]) expect(() => assertRetentionMs(value)).toThrow('INVALID_IDEMPOTENCY_RETENTION');
    expect(() => assertRetentionMs(60_000)).not.toThrow();
  });
});

describe('SRS-52 error domain', () => {
  it('membawa kode dan HTTP dari allowlist tanpa cause', () => {
    const error = new ImportCommitError('IDEMPOTENCY_CONFLICT');
    expect(error.httpStatus).toBe(409);
    expect(error.message).toBe('IDEMPOTENCY_CONFLICT');
    expect('cause' in error).toBe(false);
    expect(IMPORT_COMMIT_HTTP_STATUS.PREVIEW_EXPIRED).toBe(410);
    expect(isImportCommitError(Object.assign(new Error('x'), { code: 'IDEMPOTENCY_CONFLICT' }))).toBe(false);
  });
});
