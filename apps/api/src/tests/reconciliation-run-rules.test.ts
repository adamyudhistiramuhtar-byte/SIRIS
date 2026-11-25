import { describe, expect, it } from 'vitest';
import { resolveEvidenceTarget } from '../modules/evidence/evidence-target.js';
import { ReconciliationServiceError, RECONCILIATION_HTTP_STATUS, isReconciliationServiceError } from '../modules/reconciliation/reconciliation-errors.js';
import { RUN_IDENTITY_VERSION, decideRun, runIdentityHash, type RunIdentityInput } from '../modules/reconciliation/run-identity.js';

const base: RunIdentityInput = {
  stock_snapshot_id: '70000000-0000-4000-8000-000000000001',
  count_session_id: '80000000-0000-4000-8000-000000000001',
  rule_version: 'uji-engine/proposed-0.1',
  warehouse_id: '20000000-0000-4000-8000-000000000001',
  mode: 'UJI',
};

describe('SRS-29 identitas run (D-05: snapshot + count + rule + scope)', () => {
  it('deterministik, SHA-256 hex, dan berversi', () => {
    const hash = runIdentityHash(base);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(runIdentityHash({ ...base })).toBe(hash);
    expect(RUN_IDENTITY_VERSION).toBe('SRS-29/run-identity/proposed-0.1');
  });
  it.each([
    ['snapshot', { stock_snapshot_id: '70000000-0000-4000-8000-000000000002' }],
    ['sesi hitung', { count_session_id: '80000000-0000-4000-8000-000000000002' }],
    ['rule_version', { rule_version: 'uji-engine/proposed-0.2' }],
    ['gudang', { warehouse_id: '20000000-0000-4000-8000-000000000002' }],
    ['mode', { mode: 'ACTUAL' as const }],
  ])('%s berbeda menghasilkan identitas berbeda (run baru, histori tetap)', (_label, change) => {
    expect(runIdentityHash({ ...base, ...change })).not.toBe(runIdentityHash(base));
  });
  it('tidak ambigu terhadap penggabungan string', () => {
    const a = runIdentityHash({ ...base, stock_snapshot_id: 'ab', count_session_id: 'c' });
    const b = runIdentityHash({ ...base, stock_snapshot_id: 'a', count_session_id: 'bc' });
    expect(a).not.toBe(b);
  });
  it('menolak unsur kosong', () => {
    expect(() => runIdentityHash({ ...base, rule_version: '' })).toThrow('RUN_IDENTITY_INVALID');
  });
});

describe('SRS-29 tabel keputusan run', () => {
  const run = { run_id: 'run-1' };
  it.each([
    ['key baru, run belum ada', null, null, 'h1', { kind: 'CREATE' }],
    ['key baru, run identik ada (key berbeda, D-05)', null, run, 'h1', { kind: 'REUSE', run_id: 'run-1', record_key: true }],
    ['key lama, input sama', { identity_hash: 'h1', run_id: 'run-1' }, run, 'h1', { kind: 'REUSE', run_id: 'run-1', record_key: false }],
    ['key lama, input beda', { identity_hash: 'h1', run_id: 'run-1' }, null, 'h2', { kind: 'CONFLICT' }],
  ] as const)('%s', (_label, keyRecord, identityRun, hash, expected) => {
    expect(decideRun(keyRecord, identityRun, hash)).toEqual(expected);
  });
});

describe('SRS-29 error domain', () => {
  it('kode engine dipetakan ke 422, konflik ke 409, tanpa cause', () => {
    const error = new ReconciliationServiceError('AMBIGUOUS_PAIR');
    expect(error.httpStatus).toBe(422);
    expect(RECONCILIATION_HTTP_STATUS.IDEMPOTENCY_CONFLICT).toBe(409);
    expect('cause' in error).toBe(false);
    expect(isReconciliationServiceError(Object.assign(new Error('x'), { code: 'AMBIGUOUS_PAIR' }))).toBe(false);
  });
});

describe('D-03 target evidence XOR (UC-11, aturan murni)', () => {
  const snapshot = '70000000-0000-4000-8000-000000000001';
  const session = '80000000-0000-4000-8000-000000000001';
  it.each([
    ['hanya snapshot', { stock_snapshot_id: snapshot }, 'STOCK_SNAPSHOT'],
    ['hanya sesi hitung', { count_session_id: session }, 'COUNT_SESSION'],
    ['snapshot dengan sesi null', { stock_snapshot_id: snapshot, count_session_id: null }, 'STOCK_SNAPSHOT'],
  ])('%s diterima', (_label, input, kind) => {
    const result = resolveEvidenceTarget(input);
    expect(result.ok && result.target.kind).toBe(kind);
  });
  it.each([
    ['dua target', { stock_snapshot_id: snapshot, count_session_id: session }],
    ['tanpa target', {}],
    ['keduanya null', { stock_snapshot_id: null, count_session_id: null }],
    ['bukan UUID', { stock_snapshot_id: 'SNAP-1' }],
    ['stock_line_id lama DOC-07', { stock_line_id: snapshot }],
    ['bukan objek', null],
  ])('%s → INVALID_TARGET', (_label, input) => {
    expect(resolveEvidenceTarget(input)).toEqual({ ok: false, code: 'INVALID_TARGET' });
  });
});
