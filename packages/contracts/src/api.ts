/**
 * Kontrak standar REST API SIRIS.
 * Berdasarkan DOC-09 §4 (Spesifikasi REST API).
 */

export interface ApiMeta {
  correlation_id: string;
  timestamp?: string;
  total_count?: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorDetail {
  field?: string;
  code: string;
  message?: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  correlation_id: string;
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
}

export interface PaginatedData<T> {
  items: T[];
  next_cursor: string | null;
}

export interface PaginatedResponse<T> {
  data: PaginatedData<T>;
  meta?: ApiMeta;
}

export interface PaginationQuery {
  limit?: number;
  cursor?: string;
}

