import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createPreviewService, PREVIEW_TTL_MS, PREVIEW_VALIDATION_VERSION } from '../validation/preview-service.js';
import type { BuildPreviewInput, PreviewActor, PreviewAuthorizer, StagingRow } from '../validation/preview-types.js';

const fixturePath = path.resolve(process.cwd(), 'apps/api/src/tests/fixtures/srs51/preview-valid-uji.fixture.json');
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
  fixtureVersion: string;
  label: string;
  batch: {
    batchId: string;
    warehouseId: string;
    mode: 'UJI';
    importType: string;
    batchOwnerId: string;
    sourceHash: string;
    contractVersion: string;
    metadata: Record<string, unknown>;
  };
  rows: StagingRow[];
};

const allowAuthorizer: PreviewAuthorizer = {
  authorize: ({ actor }) => (actor ? { allowed: true, reason: 'ALLOWED' } : { allowed: false, reason: 'DENY_NO_ACTOR' }),
};
const denyAuthorizer: PreviewAuthorizer = { authorize: () => ({ allowed: false, reason: 'DENY_ROLE' }) };
const actor: PreviewActor = { accountId: fixture.batch.batchOwnerId, role: 'WAREHOUSE', warehouseIds: [fixture.batch.warehouseId], active: true };

function makeService(overrides: Partial<Parameters<typeof createPreviewService>[0]> = {}, rows = fixture.rows) {
  return createPreviewService({
    readOwnedStaging: async () => structuredClone(rows),
    authorizer: allowAuthorizer,
    now: () => Date.parse('2026-11-25T00:00:00.000Z'),
    ...overrides,
  });
}

describe('SRS-51 preview tervalidasi (terisolasi, fixture UJI)', () => {
  it('PENDING row memblokir commit (fail-closed) namun fingerprint/expiry/issue ID tetap stabil', async () => {
    const svc = makeService();
    const result = await svc.buildPreview({ ...fixture.batch, actor });
    expect(fixture.label).toBe('UJI');
    expect(result.status).toBe('INVALID');
    expect(result.canCommit).toBe(false);
    expect(result.validationVersion).toBe(PREVIEW_VALIDATION_VERSION);
    expect(result.expiresInMs).toBe(PREVIEW_TTL_MS);
    expect(result.expiresAt).toBe('2026-11-25T00:30:00.000Z');
    expect(result.errors.some((e) => e.code === 'ROW_PENDING')).toBe(true);
    expect(result.warnings.some((w) => w.code === 'ROW_PENDING')).toBe(false);
    const pending = result.issues.find((i) => i.code === 'ROW_PENDING');
    expect(pending?.id).toMatch(/^warn_[a-f0-9]{16}$/);

    const again = await svc.buildPreview({ ...fixture.batch, actor });
    expect(again.fingerprint).toBe(result.fingerprint);
    expect(again.issues.find((i) => i.code === 'ROW_PENDING')?.id).toBe(pending?.id);
  });

  it('menolak preview tanpa aktor/sesi (deny-by-default)', async () => {
    const svc = makeService({ authorizer: denyAuthorizer });
    await expect(svc.buildPreview({ ...fixture.batch, actor })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('preview menjadi INVALID saat ada error baris dan tidak dapat commit', async () => {
    const badRows = structuredClone(fixture.rows);
    badRows[0].normalized_payload.quantity = -1;
    const svc = makeService({}, badRows);
    const result = await svc.buildPreview({ ...fixture.batch, actor });
    expect(result.status).toBe('INVALID');
    expect(result.canCommit).toBe(false);
    expect(result.errors.some((e) => e.code === 'NEGATIVE_QUANTITY')).toBe(true);
  });

  it('fingerprint berubah saat metadata/scope/data berubah (invalidasi)', async () => {
    const svc = makeService();
    const base = await svc.buildPreview({ ...fixture.batch, actor });
    const metadataChanged = await svc.buildPreview({ ...fixture.batch, actor, metadata: { ...fixture.batch.metadata, cutoff_id: 'CUT-UJI-002' } });
    const scopeChanged = await svc.buildPreview({ ...fixture.batch, actor, warehouseId: 'WH-UJI-02' });
    const rowsChanged = await makeService({}, [{ ...fixture.rows[0] }, { ...fixture.rows[1], normalized_payload: { sku: 'SKU-002', quantity: 6 } }]).buildPreview({ ...fixture.batch, actor });

    expect(metadataChanged.fingerprint).not.toBe(base.fingerprint);
    expect(scopeChanged.fingerprint).not.toBe(base.fingerprint);
    expect(rowsChanged.fingerprint).not.toBe(base.fingerprint);

    expect(() => svc.assertPreviewFresh(base, metadataChanged.fingerprint, Date.parse('2026-11-25T00:10:00.000Z'))).toThrowError(/tidak lagi valid/);
  });

  it('preview kedaluwarsa tepat pada/ setelah expiresAt ditolak', async () => {
    const svc = makeService();
    const preview = await svc.buildPreview({ ...fixture.batch, actor });
    expect(() => svc.assertPreviewFresh(preview, preview.fingerprint, Date.parse('2026-11-25T00:29:59.000Z'))).not.toThrow();
    expect(() => svc.assertPreviewFresh(preview, preview.fingerprint, Date.parse('2026-11-25T00:30:00.000Z'))).toThrowError(/kedaluwarsa/);
  });

  it('mode ACTUAL ditolak', async () => {
    const svc = makeService();
    await expect(svc.buildPreview({ ...fixture.batch, actor, mode: 'ACTUAL' as BuildPreviewInput['mode'] })).rejects.toMatchObject({ code: 'MODE_NOT_ENABLED' });
  });

  it('single PENDING staging row tidak boleh VALID/canCommit', async () => {
    const rows: StagingRow[] = [{
      id: 'row-001', component: 'balance', row_number: 1,
      raw_payload: { sku: 'SKU-001', quantity: '10' },
      normalized_payload: { sku: 'SKU-001', quantity: 10 },
      validation_status: 'PENDING',
    }];
    const svc = makeService({}, rows);
    const result = await svc.buildPreview({ ...fixture.batch, actor });
    expect(result.status).toBe('INVALID');
    expect(result.canCommit).toBe(false);
    expect(result.errors.some((e) => e.code === 'ROW_PENDING')).toBe(true);
  });

  it('multiple components dengan PENDING tetap memblokir commit', async () => {
    const rows: StagingRow[] = [
      { id: 'r1', component: 'balance', row_number: 1, raw_payload: {}, normalized_payload: { sku: 'A', quantity: 1 }, validation_status: 'VALID' },
      { id: 'r2', component: 'movement', row_number: 2, raw_payload: {}, normalized_payload: { sku: 'B', quantity: 2 }, validation_status: 'PENDING' },
      { id: 'r3', component: 'reference', row_number: 3, raw_payload: {}, normalized_payload: { sku: 'C', quantity: 3 }, validation_status: 'PENDING' },
    ];
    const svc = makeService({}, rows);
    const result = await svc.buildPreview({ ...fixture.batch, actor });
    expect(result.status).toBe('INVALID');
    expect(result.canCommit).toBe(false);
    expect(result.errors.filter((e) => e.code === 'ROW_PENDING')).toHaveLength(2);
  });

  it('PENDING tidak dapat dibypass lewat mekanisme lain (termasuk warning/acknowledgment)', async () => {
    const rows: StagingRow[] = [
      { id: 'r1', component: 'balance', row_number: 1, raw_payload: {}, normalized_payload: { sku: 'A', quantity: 1 }, validation_status: 'PENDING' },
      { id: 'r2', component: 'balance', row_number: 2, raw_payload: {}, normalized_payload: { sku: 'B', quantity: 2 }, validation_status: 'VALID' },
    ];
    const svc = makeService({}, rows);
    const result = await svc.buildPreview({ ...fixture.batch, actor });
    // Tidak ada jalur (warning/acknowledgment) yang boleh mengubah gate commit; PENDING tetap blocking.
    expect(result.warnings.some((w) => w.code === 'ROW_PENDING')).toBe(false);
    expect(result.errors.some((e) => e.code === 'ROW_PENDING')).toBe(true);
    expect(result.canCommit).toBe(false);
    expect(result.status).toBe('INVALID');
    expect(() => svc.assertPreviewFresh(result, result.fingerprint, Date.parse('2026-11-25T00:10:00.000Z'))).not.toThrow();
    expect(result.canCommit).toBe(false);
  });

  it('PENDING mixed dengan ERROR tetap INVALID/canCommit false', async () => {
    const rows: StagingRow[] = [
      { id: 'r1', component: 'balance', row_number: 1, raw_payload: {}, normalized_payload: { sku: 'A', quantity: -1 }, validation_status: 'VALID' },
      { id: 'r2', component: 'balance', row_number: 2, raw_payload: {}, normalized_payload: { sku: 'B', quantity: 2 }, validation_status: 'PENDING' },
    ];
    const svc = makeService({}, rows);
    const result = await svc.buildPreview({ ...fixture.batch, actor });
    expect(result.status).toBe('INVALID');
    expect(result.canCommit).toBe(false);
    expect(result.errors.some((e) => e.code === 'NEGATIVE_QUANTITY')).toBe(true);
    expect(result.errors.some((e) => e.code === 'ROW_PENDING')).toBe(true);
  });

  it('preview fully validated (tanpa PENDING/ERROR) tetap VALID dan dapat commit', async () => {
    const rows: StagingRow[] = [
      { id: 'r1', component: 'balance', row_number: 1, raw_payload: {}, normalized_payload: { sku: 'A', quantity: 1 }, validation_status: 'VALID' },
      { id: 'r2', component: 'balance', row_number: 2, raw_payload: {}, normalized_payload: { sku: 'B', quantity: 2 }, validation_status: 'VALID' },
    ];
    const svc = makeService({}, rows);
    const result = await svc.buildPreview({ ...fixture.batch, actor });
    expect(result.status).toBe('VALID');
    expect(result.canCommit).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('safeguard SRS-51 tetap: fingerprint, expiry, dan penolakan mode ACTUAL tidak berubah', async () => {
    const rows: StagingRow[] = [
      { id: 'r1', component: 'balance', row_number: 1, raw_payload: {}, normalized_payload: { sku: 'A', quantity: 1 }, validation_status: 'VALID' },
    ];
    const svc = makeService({}, rows);
    const result = await svc.buildPreview({ ...fixture.batch, actor });
    expect(result.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(result.expiresAt).toBe('2026-11-25T00:30:00.000Z');
    expect(() => svc.assertPreviewFresh(result, result.fingerprint, Date.parse('2026-11-25T00:30:00.000Z'))).toThrowError(/kedaluwarsa/);
    await expect(svc.buildPreview({ ...fixture.batch, actor, mode: 'ACTUAL' as BuildPreviewInput['mode'] })).rejects.toMatchObject({ code: 'MODE_NOT_ENABLED' });
  });
});
