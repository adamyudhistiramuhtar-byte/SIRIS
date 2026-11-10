import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient, ApiClientError } from '../shared/api/client.js';

describe('ApiClient Unit Tests', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient('/api/v1');
    vi.restoreAllMocks();
  });

  it('Harus berhasil memanggil GET dan mem-parse ApiResponse', async () => {
    const mockData = { status: 'ok', service: 'SIRIS API' };
    const mockResponse = {
      data: mockData,
      meta: { correlation_id: 'test-uuid-123' },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const res = await client.get<{ status: string; service: string }>('/health');

    expect(global.fetch).toHaveBeenCalledWith('/api/v1/health', expect.objectContaining({ method: 'GET' }));
    expect(res.data.status).toBe('ok');
    expect(res.meta?.correlation_id).toBe('test-uuid-123');
  });

  it('Harus melempar ApiClientError dengan correlation_id saat response gagal', async () => {
    const mockErrorPayload = {
      error: {
        code: 'NOT_FOUND',
        message: 'Data tidak ditemukan',
        correlation_id: 'err-correlation-999',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => mockErrorPayload,
      headers: {
        get: () => 'err-correlation-999',
      },
    });

    await expect(client.get('/invalid-path')).rejects.toThrow(ApiClientError);

    try {
      await client.get('/invalid-path');
    } catch (err) {
      const apiErr = err as ApiClientError;
      expect(apiErr.statusCode).toBe(404);
      expect(apiErr.code).toBe('NOT_FOUND');
      expect(apiErr.correlationId).toBe('err-correlation-999');
      expect(apiErr.message).toBe('Data tidak ditemukan');
    }
  });
});
