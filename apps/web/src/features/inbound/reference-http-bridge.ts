import type { ImportContext, Preview, ReferenceImportAdapter } from './reference-import';
import type { ProposedImportHttpTransport, ProposedPreview } from './http-import-adapter';

/** Jembatan usulan; pembentuk multipart harus disediakan setelah kontrak ditinjau. */
export class ProposedReferenceHttpBridge implements ReferenceImportAdapter {
  private readonly previews = new Map<string, ProposedPreview>();

  constructor(
    private readonly transport: ProposedImportHttpTransport,
    private readonly createForm: (file: File, context: ImportContext) => FormData,
  ) {}

  async upload(file: File, context: ImportContext): Promise<{ batchId: string }> {
    return { batchId: await this.transport.stage(this.createForm(file, context), context) };
  }

  async validate(batchId: string, context: ImportContext): Promise<Preview> {
    await this.transport.validate(batchId);
    const source = await this.transport.preview(batchId, context);
    // Bentuk pengakuan warning belum disepakati; jangan menciptakan preview layak commit.
    if (source.error_count !== 0 || source.warning_count !== 0) throw new Error('Hasil validasi memerlukan tinjauan');
    const result: Preview = { batchId: source.batch_id, fingerprint: source.fingerprint, warnings: [], expiresAt: source.expires_at };
    this.previews.set(result.batchId, source);
    return result;
  }

  async commit(preview: Preview, context: ImportContext, idempotencyKey: string) {
    const source = this.previews.get(preview.batchId);
    if (!source || source.fingerprint !== preview.fingerprint || source.expires_at !== preview.expiresAt) throw new Error('Preview tidak dikenali');
    const batchId = await this.transport.commit(source, context, idempotencyKey, []);
    return { batchId, state: 'COMMITTED' as const };
  }
}
