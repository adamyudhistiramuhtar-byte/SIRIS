import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiClientError, validateApiBaseUrl } from '../shared/api/client.js';

// Fixture dan response berikut hanya untuk UJI. Tidak memanggil server atau database.
function jsonResponse(payload: unknown, status = 200, correlationId = 'uji-correlation') {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json', 'x-correlation-id': correlationId }),
    json: async () => payload,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('Konfigurasi API', () => {
  it('menerima path API relatif yang valid', () => {
    expect(validateApiBaseUrl('/api/v1')).toBe('/api/v1');
  });

  it('menggunakan VITE_API_BASE_URL untuk request yang dibuat dari konfigurasi', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '/uji-api/v1');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [], next_cursor: null }));
    vi.stubGlobal('fetch', fetchMock);
    await new ApiClient().get('/uji');
    expect(fetchMock).toHaveBeenCalledWith('/uji-api/v1/uji', expect.objectContaining({ method: 'GET' }));
  });

  it.each(['javascript:alert(1)', '//example.invalid/api', 'https://user' + ':password@example.invalid/api'])(
    'menolak konfigurasi yang tidak aman: %s',
    (value) => {
      expect(() => validateApiBaseUrl(value)).toThrow();
    },
  );
});

describe('ApiClient: respons dan kegagalan', () => {
  it('mempertahankan data dan metadata dari shared response contract', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      data: { id: 'uji-1' },
      meta: { correlation_id: 'uji-correlation' },
    })));

    const result = await new ApiClient('/api/v1').get<{ id: string }>('/uji');
    expect(result.data.id).toBe('uji-1');
    expect(result.meta?.correlation_id).toBe('uji-correlation');
  });

  it('mempertahankan koleksi kosong DOC-09 sebagai hasil sukses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ items: [], next_cursor: null })));

    const result = await new ApiClient('/api/v1').get<{ items: unknown[]; next_cursor: string | null }>('/uji');
    expect(result.data).toEqual({ items: [], next_cursor: null });
  });

  it('menolak respons sukses malformed dengan INVALID_RESPONSE', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ...jsonResponse(null),
      json: async () => { throw new SyntaxError('fixture invalid'); },
    }));

    await expect(new ApiClient('/api/v1').get('/uji')).rejects.toMatchObject({
      name: 'ApiClientError', code: 'INVALID_RESPONSE',
    });
  });

  it('mengubah error HTTP di luar envelope menjadi HTTP_ERROR, tanpa TypeError mentah', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'fixture upstream' }, 502)));

    await expect(new ApiClient('/api/v1').get('/uji')).rejects.toMatchObject({
      name: 'ApiClientError', code: 'HTTP_ERROR', statusCode: 502, correlationId: 'uji-correlation',
    });
  });

  it('mempertahankan kode, details dan correlation ID error terstruktur', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      error: {
        code: 'VALIDATION_ERROR', message: 'Data UJI tidak valid', correlation_id: 'uji-error',
        details: [{ field: 'file', code: 'REQUIRED' }],
      },
    }, 422)));

    const request = new ApiClient('/api/v1').post('/uji', {});
    await expect(request).rejects.toBeInstanceOf(ApiClientError);
    await expect(request).rejects.toMatchObject({
      code: 'VALIDATION_ERROR', statusCode: 422, correlationId: 'uji-error',
      details: [{ field: 'file', code: 'REQUIRED' }],
    });
  });

  it('mengklasifikasikan kegagalan jaringan GET tanpa membocorkan TypeError mentah', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fixture offline')));

    await expect(new ApiClient('/api/v1').get('/uji')).rejects.toMatchObject({
      name: 'ApiClientError', code: 'NETWORK_ERROR',
    });
  });

  it('mengklasifikasikan mutasi yang terputus UNKNOWN_OUTCOME tanpa retry otomatis', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('fixture offline'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new ApiClient('/api/v1').post('/uji', { id: 'uji-1' })).rejects.toMatchObject({
      name: 'ApiClientError', code: 'UNKNOWN_OUTCOME',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('menganggap hasil mutasi tidak diketahui jika body sukses tidak dapat dibaca', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ...jsonResponse(null),
      json: async () => { throw new SyntaxError('fixture invalid'); },
    }));
    await expect(new ApiClient('/api/v1').post('/uji', {})).rejects.toMatchObject({ code: 'UNKNOWN_OUTCOME' });
  });

  it('menandai hasil mutasi HTTP 5xx tidak pasti tanpa menghapus kode error server', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      error: { code: 'INTERNAL_ERROR', message: 'Gagal', correlation_id: 'uji-error' },
    }, 500));
    vi.stubGlobal('fetch', fetchMock);
    await expect(new ApiClient('/api/v1').post('/uji', {})).rejects.toMatchObject({
      code: 'INTERNAL_ERROR', statusCode: 500, outcome: 'unknown',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('meneruskan Headers dan signal ke fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { id: 'uji-1' } }));
    vi.stubGlobal('fetch', fetchMock);
    const headers = new Headers({ 'X-Correlation-ID': 'uji-client', 'Idempotency-Key': 'uji-key' });
    const controller = new AbortController();

    await new ApiClient('/api/v1').post('/uji', { id: 'uji-1' }, { headers, signal: controller.signal });
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(options.headers).get('X-Correlation-ID')).toBe('uji-client');
    expect(new Headers(options.headers).get('Idempotency-Key')).toBe('uji-key');
    expect(options.signal).toBe(controller.signal);
  });

  it('meneruskan FormData tanpa memaksa content type JSON atau menyimpan file', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'uji-1' }));
    vi.stubGlobal('fetch', fetchMock);
    const body = new FormData();
    body.set('uji', 'fixture');
    const result = await new ApiClient('/api/v1').post('/uji', body);
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.body).toBe(body);
    expect(new Headers(options.headers).has('Content-Type')).toBe(false);
    expect(result.meta?.correlation_id).toBe('uji-correlation');
  });

  it('membedakan pembatalan GET dari hasil mutasi yang tidak diketahui', async () => {
    const abort = new DOMException('UJI dibatalkan', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort));
    const client = new ApiClient('/api/v1');

    await expect(client.get('/uji')).rejects.toMatchObject({ code: 'REQUEST_CANCELLED' });
    await expect(client.post('/uji', {})).rejects.toMatchObject({ code: 'UNKNOWN_OUTCOME' });
  });

  it.each(['/%2e%2e/admin', '/%2E./admin', '/..%2fadmin'])(
    'menolak path traversal ter-encode %s sebelum mengirim request', async (path) => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      await expect(new ApiClient('/api/v1').get(path)).rejects.toMatchObject({
        name: 'ApiClientError', code: 'INVALID_PATH',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});
