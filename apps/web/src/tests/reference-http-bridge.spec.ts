import { describe, expect, it, vi } from 'vitest';
import { ProposedReferenceHttpBridge } from '../features/inbound/reference-http-bridge';
import type { ProposedImportHttpTransport } from '../features/inbound/http-import-adapter';

const context = { warehouseId: 'gudang-uji', mode: 'UJI' as const };
const source = { batch_id: 'batch-uji', fingerprint: 'fingerprint-uji', expires_at: '2099-01-01T00:00:00Z', error_count: 0, warning_count: 0 };
function setup() {
  const transport = { stage: vi.fn().mockResolvedValue('batch-uji'), validate: vi.fn().mockResolvedValue(undefined), preview: vi.fn().mockResolvedValue(source), commit: vi.fn().mockResolvedValue('batch-uji') };
  const form = new FormData();
  const bridge = new ProposedReferenceHttpBridge(transport as unknown as ProposedImportHttpTransport, () => form);
  return { transport, bridge, form };
}
describe('Jembatan usulan boundary ke transport', () => {
  it('mempertahankan context, fingerprint dan idempotency key melalui port', async () => {
    const { bridge, transport } = setup();
    const batch = await bridge.upload(new File(['UJI'], 'uji.csv'), context);
    const preview = await bridge.validate(batch.batchId, context);
    await expect(bridge.commit(preview, context, 'key-uji')).resolves.toEqual({ batchId: 'batch-uji', state: 'COMMITTED' });
    expect(transport.commit).toHaveBeenCalledWith(source, context, 'key-uji', []);
  });
  it('menahan warning dan preview yang tidak berasal dari adapter', async () => {
    const { bridge, transport } = setup();
    transport.preview.mockResolvedValue({ ...source, warning_count: 1 });
    await expect(bridge.validate('batch-uji', context)).rejects.toThrow();
    await expect(bridge.commit({ batchId: 'batch-uji', fingerprint: 'uji', warnings: [] }, context, 'key-uji')).rejects.toThrow();
    expect(transport.commit).not.toHaveBeenCalled();
  });
});
