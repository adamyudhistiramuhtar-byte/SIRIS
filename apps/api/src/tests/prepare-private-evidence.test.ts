import { afterEach, expect, it, vi } from 'vitest';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { preparePrivateEvidence } from '../modules/evidence/prepare-private-evidence.js';
import { PrivateEvidenceStorage } from '../modules/evidence/private-evidence-storage.js';

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });
async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'siris-evidence-prepare-'));
  roots.push(root);
  const onCleanupFailure = vi.fn();
  return { root, onCleanupFailure, storage: new PrivateEvidenceStorage(root, onCleanupFailure) };
}
const actor = { id: 'uji-actor', role: 'WAREHOUSE' as const, warehouse_ids: ['gudang-1'] };
const target = { id: 'uji-target', warehouse_id: 'gudang-1', mode: 'UJI' as const };
async function* stream(bytes: Uint8Array) { yield bytes; }

it('menyimpan PNG valid setelah pemeriksaan scope dan struktur', async () => {
  const ctx = await setup();
  const bytes = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#abcdef' } }).png().toBuffer();
  const saved = await preparePrivateEvidence({ ...ctx, actor, target, uploadAuthorized: true, mime: 'image/png', content: stream(bytes) });
  expect(await ctx.storage.read(saved)).toEqual(bytes);
});

it('menolak mutasi sebelum menyimpan file bila izin backend tidak tersedia', async () => {
  const ctx = await setup();
  await expect(preparePrivateEvidence({ ...ctx, actor, target, uploadAuthorized: false, mime: 'image/png', content: stream(Buffer.from('uji')) }))
    .rejects.toThrow('ACCESS_DENIED');
  expect(await readdir(ctx.root)).toEqual([]);
});

it('membersihkan file dengan signature PNG tetapi struktur rusak', async () => {
  const ctx = await setup();
  const corrupt = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  await expect(preparePrivateEvidence({ ...ctx, actor, target, uploadAuthorized: true, mime: 'image/png', content: stream(corrupt) }))
    .rejects.toThrow('INVALID_FILE');
  expect(await readdir(ctx.root)).toEqual([]);
});

it('mencatat kegagalan cleanup tanpa mengganti alasan file tidak valid', async () => {
  const ctx = await setup();
  vi.spyOn(ctx.storage, 'remove').mockRejectedValue(new Error('PRIVATE_PATH'));
  const corrupt = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  await expect(preparePrivateEvidence({ ...ctx, actor, target, uploadAuthorized: true, mime: 'image/png', content: stream(corrupt) }))
    .rejects.toThrow(/^INVALID_FILE$/);
  expect(ctx.onCleanupFailure).toHaveBeenCalledOnce();
});
