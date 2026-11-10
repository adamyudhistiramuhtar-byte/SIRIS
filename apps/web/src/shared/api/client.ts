import type { ApiResponse, ApiErrorResponse } from '@siris/contracts';

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly correlationId: string;
  public readonly details?: Array<{ field?: string; code: string; message?: string }>;

  constructor(
    statusCode: number,
    errorPayload: ApiErrorResponse['error'],
  ) {
    super(errorPayload.message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.code = errorPayload.code;
    this.correlationId = errorPayload.correlation_id;
    this.details = errorPayload.details;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  public async get<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    let url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    if (options.params) {
      const searchParams = new URLSearchParams();
      for (const [key, val] of Object.entries(options.params)) {
        if (val !== undefined) {
          searchParams.append(key, String(val));
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        url += `${url.includes('?') ? '&' : '?'}${qs}`;
      }
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      let errorPayload: ApiErrorResponse['error'];
      try {
        const json = (await response.json()) as ApiErrorResponse;
        errorPayload = json.error;
      } catch {
        errorPayload = {
          code: 'NETWORK_ERROR',
          message: `Permintaan HTTP gagal dengan status ${response.status}`,
          correlation_id: response.headers.get('x-correlation-id') || 'unknown',
        };
      }
      throw new ApiClientError(response.status, errorPayload);
    }

    return (await response.json()) as ApiResponse<T>;
  }
}

export const apiClient = new ApiClient();
