import { describe, expect, it, vi } from 'vitest';
import { ProposedImportHttpTransport, type ImportHttpClient } from '../features/inbound/http-import-adapter';

const batch = '00000000-0000-4000-8000-000000000001';
const warehouse = '00000000-0000-4000-8000-000000000002';
const context = { warehouseId: warehouse, mode: 'UJI' as const };
const preview = { batch_id: batch, warehouse_id: warehouse, mode: 'UJI' as const, state: 'PREVIEW_READY' as const,
  fingerprint: 'UJI-fingerprint', expires_at: '2099-01-01T00:00:00Z', error_count: 0, warning_count: 0, issues: [], rows: [] };
function mockClient() {
  return { get: vi.fn().mockResolvedValue({ data: preview }), post: vi.fn() };
}

describe('Transport DOC-09 usulan, hanya mock UJI', () => {
  it('mengirim multipart yang scope-nya sesuai dan memeriksa batch STAGED', async () => {
    const client = mockClient(); client.post.mockResolvedValue({ data: { batch_id: batch, state: 'STAGED' } });
    const form = new FormData(); form.set('kind', 'EXPECTED'); form.set('warehouse_id', warehouse); form.set('mode', 'UJI'); form.set('file', new File(['UJI'], 'uji.csv'));
    const transport = new ProposedImportHttpTransport(client as unknown as ImportHttpClient);
    await expect(transport.stage(form, context)).resolves.toBe(batch);
    expect(client.post).toHaveBeenCalledWith('/imports', form, expect.any(Object));
    form.set('mode', 'ACTUAL');
    await expect(transport.stage(form, context)).rejects.toThrow();
    expect(client.post).toHaveBeenCalledTimes(1);
  });
  it('menandai respons staging sukses yang tidak dapat dibuktikan sebagai hasil tidak diketahui', async () => {
    const client = mockClient(); client.post.mockResolvedValue({ data: {} });
    const form = new FormData(); form.set('kind', 'EXPECTED'); form.set('warehouse_id', warehouse); form.set('mode', 'UJI'); form.set('file', new File(['UJI'], 'uji.csv'));
    await expect(new ProposedImportHttpTransport(client as unknown as ImportHttpClient).stage(form, context)).rejects.toMatchObject({ outcome: 'unknown' });
    expect(client.post).toHaveBeenCalledTimes(1);
  });
  it('memeriksa validasi dan preview yang cocok dengan konteks', async () => {
    const client = mockClient(); client.post.mockResolvedValue({ data: { batch_id: batch, state: 'PREVIEW_READY', error_count: 0, warning_count: 0, issues: [] } });
    const transport = new ProposedImportHttpTransport(client as unknown as ImportHttpClient);
    await transport.validate(batch);
    await expect(transport.preview(batch, context)).resolves.toEqual(preview);
    client.get.mockResolvedValue({ data: { ...preview, mode: 'ACTUAL' } });
    await expect(transport.preview(batch, context)).rejects.toThrow();
  });
  it('menandai respons validasi yang tidak sesuai sebagai hasil tidak diketahui', async () => {
    const client = mockClient(); client.post.mockResolvedValue({ data: {} });
    await expect(new ProposedImportHttpTransport(client as unknown as ImportHttpClient).validate(batch)).rejects.toMatchObject({ outcome: 'unknown' });
    expect(client.post).toHaveBeenCalledTimes(1);
  });
  it('commit mengirim fingerprint dan idempotency key tepat sekali', async () => {
    const client = mockClient(); client.post.mockResolvedValue({ data: { batch_id: batch, state: 'COMMITTED' } });
    const transport = new ProposedImportHttpTransport(client as unknown as ImportHttpClient);
    await expect(transport.commit(preview, context, 'key-uji', [])).resolves.toBe(batch);
    const [path, body, options] = client.post.mock.calls[0];
    expect(path).toBe(`/imports/${batch}/commit`);
    expect(body).toEqual({ preview_fingerprint: preview.fingerprint, acknowledged_warnings: [] });
    expect(new Headers(options.headers).get('Idempotency-Key')).toBe('key-uji');
    expect(client.post).toHaveBeenCalledTimes(1);
  });
  it('memblokir preview expired, errors dan warning belum disepakati', async () => {
    const client = mockClient(); const transport = new ProposedImportHttpTransport(client as unknown as ImportHttpClient);
    for (const invalid of [{ ...preview, expires_at: '2000-01-01T00:00:00Z' }, { ...preview, error_count: 1 }, { ...preview, warning_count: 1 }]) {
      await expect(transport.commit(invalid, context, 'key-uji', [])).rejects.toThrow();
    }
    expect(client.post).not.toHaveBeenCalled();
  });
  it('cancellation hanya berhasil jika receipt server cocok', async () => {
    const client = mockClient(); client.post.mockResolvedValue({ data: { batch_id: batch, state: 'CANCELLED' } });
    const transport = new ProposedImportHttpTransport(client as unknown as ImportHttpClient);
    await expect(transport.cancel(batch, 'UJI')).resolves.toBeUndefined();
    client.post.mockResolvedValue({ data: { batch_id: batch, state: 'COMMITTED' } });
    await expect(transport.cancel(batch, 'UJI')).rejects.toMatchObject({ outcome: 'unknown' });
  });
});
