import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { MAX_EVIDENCE_BYTES } from '../modules/evidence/evidence-policy.js';
import { PrivateEvidenceStorage } from '../modules/evidence/private-evidence-storage.js';

const roots: string[] = [];
async function makeStorage() {
  const root = await mkdtemp(join(tmpdir(), 'siris-evidence-uji-'));
  roots.push(root);
  return { root, storage: new PrivateEvidenceStorage(root, vi.fn()) };
}
async function* chunks(...values: Uint8Array[]) { for (const value of values) yield value; }
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });

describe('Penyimpanan evidence privat UJI', () => {
  it('menghasilkan key acak dan membaca ulang data yang cocok dengan hash', async () => {
    const { root, storage } = await makeStorage();
    const data = Buffer.from('SIRIS UJI');
    const saved = await storage.write(chunks(data));
    expect(saved.key).not.toContain('SIRIS');
    expect((await stat(join(root, saved.key))).mode & 0o077).toBe(0);
    expect(await storage.read(saved)).toEqual(data);
    await storage.remove(saved.key);
    expect(await readdir(root)).toEqual([]);
  });

  it('menolak file kosong dan stream terlalu besar tanpa meninggalkan file', async () => {
    const { root, storage } = await makeStorage();
    await expect(storage.write(chunks())).rejects.toThrow('INVALID_FILE');
    await expect(storage.write(chunks(new Uint8Array(MAX_EVIDENCE_BYTES), new Uint8Array(1)))).rejects.toThrow('LIMIT_EXCEEDED');
    expect(await readdir(root)).toEqual([]);
  });

  it('menerima ukuran tepat pada batas', async () => {
    const { storage } = await makeStorage();
    expect((await storage.write(chunks(new Uint8Array(MAX_EVIDENCE_BYTES)))).size).toBe(MAX_EVIDENCE_BYTES);
  });

  it('tidak mengungkap path ketika berkas tidak tersedia', async () => {
    const { storage } = await makeStorage();
    const missing = { key: '10000000-0000-4000-8000-000000000001', sha256: 'a'.repeat(64), size: 1 };
    await expect(storage.read(missing)).rejects.toThrow(/^EVIDENCE_STORAGE_FAILED$/);
  });

  it('menolak traversal, symlink dan perubahan data', async () => {
    const { root, storage } = await makeStorage();
    await expect(storage.remove('../private')).rejects.toThrow('INVALID_STORAGE_KEY');
    const saved = await storage.write(chunks(Buffer.from('UJI')));
    await writeFile(join(root, saved.key), 'XXX');
    await expect(storage.read(saved)).rejects.toThrow('EVIDENCE_INTEGRITY_FAILED');
    await storage.remove(saved.key);
    await symlink('/etc/passwd', join(root, saved.key));
    await expect(storage.read(saved)).rejects.toThrow();
  });
});
