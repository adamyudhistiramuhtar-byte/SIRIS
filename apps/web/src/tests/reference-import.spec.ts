import { describe, expect, it, vi } from 'vitest';
import { ReferenceImportFlow, type ReferenceImportAdapter } from '../features/inbound/reference-import.js';

const context = { warehouseId: 'gudang-uji', mode: 'UJI' as const };
const file = new File(['UJI'], 'fixture.csv', { type: 'text/csv' });
function adapter(): ReferenceImportAdapter {
  return {
    upload: vi.fn().mockResolvedValue({ batchId: 'batch-uji' }),
    validate: vi.fn().mockResolvedValue({ batchId: 'batch-uji', fingerprint: 'uji', warnings: [] }),
    commit: vi.fn().mockResolvedValue({ batchId: 'batch-uji', state: 'COMMITTED' }),
  };
}
describe('Boundary impor referensi UJI', () => {
  it('tidak mengunggah tanpa file atau sesi terverifikasi', async () => {
    const api = adapter(); const flow = new ReferenceImportFlow(api);
    await flow.prepare(undefined, context, true);
    await flow.prepare(file, context, false);
    expect(api.upload).not.toHaveBeenCalled();
    expect(flow.state.phase).toBe('error');
  });
  it('mempertahankan context dan hanya menerima sukses dari receipt API yang sesuai', async () => {
    const api = adapter(); const flow = new ReferenceImportFlow(api);
    await flow.prepare(file, context, true);
    expect(flow.state.phase).toBe('preview');
    await flow.confirm('key-uji');
    expect(api.commit).toHaveBeenCalledWith(expect.objectContaining({ batchId: 'batch-uji' }), context, 'key-uji');
    expect(flow.state.phase).toBe('success');
  });
  it('menyimpan key saat hasil commit tidak diketahui tanpa retry otomatis', async () => {
    const api = adapter(); vi.mocked(api.commit).mockRejectedValue(new Error('offline'));
    const flow = new ReferenceImportFlow(api); await flow.prepare(file, context, true);
    await flow.confirm('key-uji'); await flow.confirm('key-uji');
    expect(flow.state).toEqual({ phase: 'unknown', batchId: 'batch-uji', idempotencyKey: 'key-uji' });
    expect(api.commit).toHaveBeenCalledTimes(1);
  });
  it('tidak menerima preview untuk batch lain', async () => {
    const api = adapter(); vi.mocked(api.validate).mockResolvedValue({ batchId: 'lain', fingerprint: 'uji', warnings: [] });
    const flow = new ReferenceImportFlow(api); await flow.prepare(file, context, true);
    expect(flow.state.phase).toBe('error');
    expect(api.commit).not.toHaveBeenCalled();
  });
});
