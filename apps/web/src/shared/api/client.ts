import type { ApiErrorPayload, ApiMeta, ApiResponse } from '@siris/contracts';

const DEFAULT_BASE_URL = '/api/v1';

/** Konfigurasi publik frontend; jangan masukkan credential atau secret. */
export function validateApiBaseUrl(value: string): string {
  const base = value.trim();
  if (!base || /[\\\s?#]/.test(base) || base.startsWith('//') || /%(?:2e|2f|5c|25)/i.test(base) || /\/(?:\.{1,2})(?:\/|$)/.test(base)) {
    throw new Error('VITE_API_BASE_URL tidak valid');
  }
  if (base.startsWith('/')) {
    if (base.split('/').some((part) => part === '.' || part === '..')) {
      throw new Error('VITE_API_BASE_URL tidak valid');
    }
    return base.replace(/\/+$/, '') || '/';
  }
  try {
    const url = new URL(base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new Error('invalid');
    }
    return base.replace(/\/+$/, '');
  } catch {
    throw new Error('VITE_API_BASE_URL tidak valid');
  }
}

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly correlationId: string;
  public readonly details?: ApiErrorPayload['details'];
  public readonly outcome: 'failed' | 'unknown';

  constructor(statusCode: number, payload: ApiErrorPayload, outcome: 'failed' | 'unknown' = 'failed') {
    super(payload.message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.code = payload.code;
    this.correlationId = payload.correlation_id;
    this.details = payload.details;
    this.outcome = outcome;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isErrorPayload(value: unknown): value is ApiErrorPayload {
  if (!isRecord(value) || typeof value.code !== 'string' || typeof value.message !== 'string' || typeof value.correlation_id !== 'string') return false;
  return value.details === undefined || (Array.isArray(value.details) && value.details.every(
    (detail: unknown) => isRecord(detail) && typeof detail.code === 'string' &&
      (detail.field === undefined || typeof detail.field === 'string') &&
      (detail.message === undefined || typeof detail.message === 'string'),
  ));
}

function clientError(status: number, code: string, message: string, correlationId = 'unknown', outcome: 'failed' | 'unknown' = code === 'UNKNOWN_OUTCOME' ? 'unknown' : 'failed'): ApiClientError {
  return new ApiClientError(status, { code, message, correlation_id: correlationId }, outcome);
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL) {
    this.baseUrl = validateApiBaseUrl(baseUrl);
  }

  public async get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    const headers = new Headers(options?.headers);
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    if (body !== undefined && !isFormData && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      headers,
    });
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    let decodedPath: string;
    try {
      decodedPath = decodeURIComponent(path.split(/[?#]/, 1)[0]);
    } catch {
      throw clientError(0, 'INVALID_PATH', 'Alamat permintaan tidak valid');
    }
    if (path.includes('#') || /%(?:2f|5c|25)/i.test(path) || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(decodedPath) || decodedPath.includes('\\') || decodedPath.split('/').some((part) => part === '..' || part === '.')) {
      throw clientError(0, 'INVALID_PATH', 'Alamat permintaan tidak valid');
    }
    const { params, ...requestOptions } = options;
    const suffix = path.startsWith('/') ? path : `/${path}`;
    let url = `${this.baseUrl === '/' ? '' : this.baseUrl}${suffix}`;
    if (params) {
      const query = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) query.append(key, String(value));
      }
      const encoded = query.toString();
      if (encoded) url += `${url.includes('?') ? '&' : '?'}${encoded}`;
    }

    const mutation = !['GET', 'HEAD'].includes((requestOptions.method ?? 'GET').toUpperCase());
    let response: Response;
    try {
      response = await fetch(url, requestOptions);
    } catch (error) {
      const cancelled = requestOptions.signal?.aborted || (isRecord(error) && error.name === 'AbortError');
      if (mutation) throw clientError(0, 'UNKNOWN_OUTCOME', 'Hasil mutasi tidak diketahui. Periksa status sebelum mencoba kembali.');
      if (cancelled) throw clientError(0, 'REQUEST_CANCELLED', 'Permintaan dibatalkan.');
      throw clientError(0, 'NETWORK_ERROR', 'Jaringan tidak tersedia. Coba kembali.');
    }

    const correlationHeader = response.headers?.get('x-correlation-id');
    const correlationId = correlationHeader ?? 'unknown';
    const uncertainHttpOutcome = mutation && (response.status === 408 || response.status >= 500);
    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      const cancelled = requestOptions.signal?.aborted || (isRecord(error) && error.name === 'AbortError');
      if (cancelled) {
        throw clientError(response.status, mutation ? 'UNKNOWN_OUTCOME' : 'REQUEST_CANCELLED', mutation ? 'Hasil mutasi tidak diketahui. Periksa status sebelum mencoba kembali.' : 'Permintaan dibatalkan.', correlationId);
      }
      if (!response.ok) throw clientError(response.status, 'HTTP_ERROR', `Permintaan gagal (HTTP ${response.status}).`, correlationId, uncertainHttpOutcome ? 'unknown' : 'failed');
      throw clientError(response.status, mutation ? 'UNKNOWN_OUTCOME' : 'INVALID_RESPONSE', 'Respons API tidak sesuai kontrak.', correlationId);
    }

    if (!response.ok) {
      const outcome = uncertainHttpOutcome ? 'unknown' : 'failed';
      if (isRecord(payload) && isErrorPayload(payload.error)) throw new ApiClientError(response.status, payload.error, outcome);
      throw clientError(response.status, 'HTTP_ERROR', `Permintaan gagal (HTTP ${response.status}).`, correlationId, outcome);
    }
    if (!isRecord(payload) || 'error' in payload) {
      throw clientError(response.status, mutation ? 'UNKNOWN_OUTCOME' : 'INVALID_RESPONSE', 'Respons API tidak sesuai kontrak.', correlationId);
    }
    // Scaffold memakai envelope ApiResponse; DOC-09 juga menggambarkan DTO object langsung.
    // Validasi bentuk domain tetap menjadi tanggung jawab adapter endpoint yang ditinjau.
    if ('data' in payload) {
      if ('meta' in payload && (!isRecord(payload.meta) || typeof payload.meta.correlation_id !== 'string')) {
        throw clientError(response.status, mutation ? 'UNKNOWN_OUTCOME' : 'INVALID_RESPONSE', 'Metadata respons tidak valid.', correlationId);
      }
      return { data: payload.data as T, ...(payload.meta ? { meta: payload.meta as unknown as ApiMeta } : correlationHeader ? { meta: { correlation_id: correlationHeader } } : {}) };
    }
    return { data: payload as T, ...(correlationHeader ? { meta: { correlation_id: correlationHeader } } : {}) };
  }
}

export const apiClient = new ApiClient();
