/** Boundary UC-01 untuk ditinjau; implementasi API dan izin tetap otoritas backend. */
export type ImportMode = 'UJI' | 'ACTUAL';
export interface ImportContext { warehouseId: string; mode: ImportMode }
export interface Preview { batchId: string; fingerprint: string; warnings: string[] }
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
  | { phase: 'success'; receipt: CommitReceipt }
  | { phase: 'error'; message: string }
  | { phase: 'unknown'; batchId: string; idempotencyKey: string };

/** State sengaja tidak memiliki sesi atau mock produksi bawaan. */
export class ReferenceImportFlow {
  state: ImportState = { phase: 'initial' };
  private context: ImportContext | undefined;
  private generation = 0;
  constructor(private readonly adapter: ReferenceImportAdapter) {}

  async prepare(file: File | undefined, context: ImportContext, sessionVerified: boolean): Promise<void> {
    if (this.state.phase === 'committing' || this.state.phase === 'unknown') return;
    const generation = ++this.generation;
    this.context = undefined;
    if (!sessionVerified || !context.warehouseId || !['UJI', 'ACTUAL'].includes(context.mode) || !file) {
      this.state = { phase: 'error', message: 'Sesi, gudang, mode, dan file diperlukan.' };
      return;
    }
    this.context = { ...context };
    try {
      this.state = { phase: 'uploading' };
      const batch = await this.adapter.upload(file, this.context);
      if (generation !== this.generation) return;
      this.state = { phase: 'validating' };
      const preview = await this.adapter.validate(batch.batchId, this.context);
      if (generation !== this.generation) return;
      if (!preview.batchId || preview.batchId !== batch.batchId || !preview.fingerprint) throw new Error('invalid preview');
      this.state = { phase: 'preview', preview };
    } catch {
      if (generation !== this.generation) return;
      this.state = { phase: 'error', message: 'Impor belum siap. Periksa hasil server dan coba kembali.' };
    }
  }

  async confirm(idempotencyKey: string): Promise<void> {
    if (this.state.phase !== 'preview' || !this.context || !idempotencyKey) return;
    const preview = this.state.preview;
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
    if (this.state.phase === 'committing' || this.state.phase === 'unknown') return;
    this.generation++; this.context = undefined; this.state = { phase: 'initial' };
  }
}
