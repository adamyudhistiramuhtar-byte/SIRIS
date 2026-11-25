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
  it('membangun preview VALID dengan fingerprint, expiry 30 menit, dan warning ID stabil', async () => {
    const svc = makeService();
    const result = await svc.buildPreview({ ...fixture.batch, actor });
    expect(fixture.label).toBe('UJI');
    expect(result.status).toBe('VALID');
    expect(result.canCommit).toBe(true);
    expect(result.validationVersion).toBe(PREVIEW_VALIDATION_VERSION);
    expect(result.expiresInMs).toBe(PREVIEW_TTL_MS);
    expect(result.expiresAt).toBe('2026-11-25T00:30:00.000Z');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].code).toBe('ROW_PENDING');
    expect(result.warnings[0].id).toMatch(/^warn_[a-f0-9]{16}$/);

    const again = await svc.buildPreview({ ...fixture.batch, actor });
    expect(again.fingerprint).toBe(result.fingerprint);
    expect(again.warnings[0].id).toBe(result.warnings[0].id);
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
});
