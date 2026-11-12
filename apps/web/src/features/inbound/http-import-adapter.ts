import type { ApiResponse } from '@siris/contracts';
import type { ImportContext } from './reference-import';

/** Mapping DOC-09 PROPOSED, belum terhubung ke halaman atau diaktifkan otomatis. */
export interface ImportHttpClient {
  get<T>(path: string, options?: { headers?: HeadersInit }): Promise<ApiResponse<T>>;
  post<T>(path: string, body?: unknown, options?: { headers?: HeadersInit }): Promise<ApiResponse<T>>;
}
export interface ProposedPreview {
  batch_id: string;
  warehouse_id: string;
  mode: 'UJI' | 'ACTUAL';
  state: 'PREVIEW_READY';
  fingerprint: string;
  expires_at: string;
  error_count: number;
  warning_count: number;
  issues: unknown[];
  rows: unknown[];
}
export class ImportOutcomeUnknownError extends Error {
  readonly outcome = 'unknown';
  constructor(message: string) { super(message); this.name = 'ImportOutcomeUnknownError'; }
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Respons impor tidak valid');
  return value as Record<string, unknown>;
}
function batchPath(batchId: string): string {
  if (!uuid.test(batchId)) throw new Error('ID batch tidak valid');
  return `/imports/${batchId}`;
}
function count(value: unknown): value is number { return Number.isInteger(value) && Number(value) >= 0; }
function previewData(value: unknown, batchId: string, context: ImportContext): ProposedPreview {
  const p = object(value);
  if (p.batch_id !== batchId || p.warehouse_id !== context.warehouseId || p.mode !== context.mode ||
      p.state !== 'PREVIEW_READY' || typeof p.fingerprint !== 'string' || !p.fingerprint.trim() ||
      typeof p.expires_at !== 'string' || !Number.isFinite(Date.parse(p.expires_at)) ||
      !count(p.error_count) || !count(p.warning_count) || !Array.isArray(p.issues) || !Array.isArray(p.rows)) {
    throw new Error('Preview impor tidak sesuai konteks atau kontrak');
  }
  return p as unknown as ProposedPreview;
}

/** Pemanggil menyediakan multipart dan header sesi/CSRF sesuai kontrak yang telah ditinjau. */
export class ProposedImportHttpTransport {
  constructor(private readonly client: ImportHttpClient, private readonly headers: HeadersInit = {}) {}

  async stage(form: FormData, context: ImportContext): Promise<string> {
    if (!uuid.test(context.warehouseId) || !['UJI', 'ACTUAL'].includes(context.mode) ||
        form.get('kind') !== 'EXPECTED' || form.get('warehouse_id') !== context.warehouseId ||
        form.get('mode') !== context.mode || !(form.get('file') instanceof File)) {
      throw new Error('Konteks atau file staging tidak valid');
    }
    const response = await this.client.post<unknown>('/imports', form, { headers: this.headers });
    let result: Record<string, unknown>;
    try { result = object(response.data); } catch { throw new ImportOutcomeUnknownError('Hasil staging tidak dapat dipastikan'); }
    if (typeof result.batch_id !== 'string' || !uuid.test(result.batch_id) || result.state !== 'STAGED') throw new ImportOutcomeUnknownError('Hasil staging tidak dapat dipastikan');
    return result.batch_id;
  }

  async validate(batchId: string): Promise<void> {
    const response = await this.client.post<unknown>(`${batchPath(batchId)}/validation`, {}, { headers: this.headers });
    let result: Record<string, unknown>;
    try { result = object(response.data); } catch { throw new ImportOutcomeUnknownError('Hasil validasi tidak dapat dipastikan'); }
    if (result.batch_id !== batchId || result.state !== 'PREVIEW_READY' || !count(result.error_count) || !count(result.warning_count) || !Array.isArray(result.issues)) {
      throw new ImportOutcomeUnknownError('Hasil validasi tidak dapat dipastikan');
    }
    if (result.error_count !== 0) throw new Error('Validasi belum menghasilkan preview yang layak');
  }

  async preview(batchId: string, context: ImportContext): Promise<ProposedPreview> {
    return previewData((await this.client.get<unknown>(`${batchPath(batchId)}/preview`, { headers: this.headers })).data, batchId, context);
  }

  async commit(preview: ProposedPreview, context: ImportContext, key: string, acknowledgedWarnings: string[]): Promise<string> {
    const checked = previewData(preview, preview.batch_id, context);
    if (!uuid.test(checked.batch_id) || checked.error_count !== 0 || Date.parse(checked.expires_at) <= Date.now() ||
        !key.trim() || !Array.isArray(acknowledgedWarnings) || !acknowledgedWarnings.every((x) => typeof x === 'string')) {
      throw new Error('Preview tidak layak dikonfirmasi');
    }
    // Mapping identitas warning masih terbuka; jangan menganggap warning telah diakui.
    if (checked.warning_count !== 0 || acknowledgedWarnings.length !== 0) throw new Error('Pengakuan warning memerlukan kontrak yang ditinjau');
    const headers = new Headers(this.headers);
    headers.set('Idempotency-Key', key);
    const result = object((await this.client.post<unknown>(`${batchPath(checked.batch_id)}/commit`, {
      preview_fingerprint: checked.fingerprint,
      acknowledged_warnings: acknowledgedWarnings,
    }, { headers })).data);
    if (result.batch_id !== checked.batch_id || result.state !== 'COMMITTED') throw new ImportOutcomeUnknownError('Hasil commit tidak dapat dipastikan');
    return checked.batch_id;
  }

  async cancel(batchId: string, reason: string): Promise<void> {
    const result = object((await this.client.post<unknown>(`${batchPath(batchId)}/cancellation`, { reason }, { headers: this.headers })).data);
    if (result.batch_id !== batchId || result.state !== 'CANCELLED') throw new ImportOutcomeUnknownError('Hasil pembatalan tidak dapat dipastikan');
  }
}
