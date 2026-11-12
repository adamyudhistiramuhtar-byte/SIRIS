/** Boundary UC-01 untuk ditinjau; implementasi API dan izin tetap otoritas backend. */
export type ImportMode = 'UJI' | 'ACTUAL';
export interface ImportContext { warehouseId: string; mode: ImportMode }
export interface Preview { batchId: string; fingerprint: string; warnings: string[]; expiresAt?: string }
export interface CommitReceipt { batchId: string; state: 'COMMITTED' }
export interface ReferenceImportAdapter {
  upload(file: File, context: ImportContext): Promise<{ batchId: string }>;
  validate(batchId: string, context: ImportContext): Promise<Preview>;
  commit(preview: Preview, context: ImportContext, idempotencyKey: string): Promise<CommitReceipt>;
}
export type ImportState =
  | { phase: 'initial' }
  | { phase: 'uploading' | 'validating' | 'committing' }
  | { phase: 'preview'; preview: Preview }
  | { phase: 'expired'; batchId: string }
  | { phase: 'success'; receipt: CommitReceipt }
  | { phase: 'error'; message: string }
  | { phase: 'unknown'; batchId: string; idempotencyKey: string }
  | { phase: 'preparation-unknown'; batchId?: string };

/** State sengaja tidak memiliki sesi atau mock produksi bawaan. */
export class ReferenceImportFlow {
  state: ImportState = { phase: 'initial' };
  private context: ImportContext | undefined;
  private generation = 0;
  constructor(private readonly adapter: ReferenceImportAdapter) {}

  async prepare(file: File | undefined, context: ImportContext, sessionVerified: boolean): Promise<void> {
    if (this.state.phase === 'committing' || this.state.phase === 'unknown' || this.state.phase === 'preparation-unknown') return;
    const generation = ++this.generation;
    this.context = undefined;
    if (!sessionVerified || !context.warehouseId || !['UJI', 'ACTUAL'].includes(context.mode) || !file) {
      this.state = { phase: 'error', message: 'Sesi, gudang, mode, dan file diperlukan.' };
      return;
    }
    this.context = { ...context };
    let batchId: string | undefined;
    try {
      this.state = { phase: 'uploading' };
      const batch = await this.adapter.upload(file, this.context);
      if (generation !== this.generation) return;
      batchId = batch.batchId;
      this.state = { phase: 'validating' };
      const preview = await this.adapter.validate(batch.batchId, this.context);
      if (generation !== this.generation) return;
      if (!preview.batchId || preview.batchId !== batch.batchId || !preview.fingerprint) throw new Error('invalid preview');
      this.state = { phase: 'preview', preview };
    } catch (error) {
      if (generation !== this.generation) return;
      if (typeof error === 'object' && error !== null && 'outcome' in error && error.outcome === 'unknown') {
        this.state = { phase: 'preparation-unknown', ...(batchId ? { batchId } : {}) };
        return;
      }
      this.state = { phase: 'error', message: 'Impor belum siap. Periksa hasil server dan coba kembali.' };
    }
  }

  async confirm(idempotencyKey: string): Promise<void> {
    if (this.state.phase !== 'preview' || !this.context || !idempotencyKey) return;
    const preview = this.state.preview;
    if (preview.expiresAt && (!Number.isFinite(Date.parse(preview.expiresAt)) || Date.parse(preview.expiresAt) <= Date.now())) {
      this.state = { phase: 'expired', batchId: preview.batchId };
      return;
    }
    const generation = this.generation;
    this.state = { phase: 'committing' };
    try {
      const receipt = await this.adapter.commit(preview, this.context, idempotencyKey);
      if (generation !== this.generation) return;
      if (receipt.state !== 'COMMITTED' || receipt.batchId !== preview.batchId) throw new Error('unconfirmed outcome');
      this.state = { phase: 'success', receipt };
    } catch {
      if (generation !== this.generation) return;
      this.state = { phase: 'unknown', batchId: preview.batchId, idempotencyKey };
    }
  }

  reset(): void {
    if (this.state.phase === 'committing' || this.state.phase === 'unknown' || this.state.phase === 'preparation-unknown') return;
    this.generation++; this.context = undefined; this.state = { phase: 'initial' };
  }
}
