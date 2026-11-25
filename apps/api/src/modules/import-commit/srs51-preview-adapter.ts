/**
 * Adapter PreviewReader SRS-52 untuk bentuk keluaran preview SRS-51 pada PR #54.
 * Status: PROPOSED, Fase A.
 *
 * Tipe di bawah adalah SALINAN bentuk `PreviewResult` PR #54 @ ab91423
 * (`apps/api/src/validation/preview-types.ts`). Modul ini sengaja tidak mengimpor kode #54
 * karena #54 belum merged; bila kontrak #54 berubah, salinan ini wajib diperbarui.
 *
 * Batas yang belum diputuskan (komentar Jira SRS-52 nomor 10221):
 * - #54 tidak menyimpan preview, sehingga sumber `Srs51PreviewSource` belum punya
 *   implementasi nyata (C58-03);
 * - #54 tidak memiliki reference revision; sumber wajib menyediakannya sendiri (butir 7).
 *
 * Pemetaan bersifat fail-closed:
 * - `expiresAt` yang tidak dapat diurai menjadi `Invalid Date` dan dianggap kedaluwarsa
 *   oleh `isPreviewExpired` (berbeda dengan #54 yang fail-open);
 * - preview yang menyatakan tidak dapat di-commit (`status` bukan VALID atau `canCommit`
 *   bukan true) dihitung minimal satu error walaupun daftar `errors` kosong;
 * - bentuk yang tidak sesuai dilempar sebagai error internal tanpa isi data.
 */
import type { CommitActor, LockedBatch, PreviewReader, PreviewSnapshot } from './commit-ports.js';

/** Salinan `ValidationIssue` #54 (hanya field yang dibaca adapter yang diperiksa). */
export interface Srs51PreviewIssue {
  id: string;
  severity: 'ERROR' | 'WARNING';
  code: string;
  message: string;
  rowNumber?: number | null;
  field?: string | null;
}

/** Salinan `PreviewResult` #54 (camelCase, `expiresAt` berupa string ISO). */
export interface Srs51PreviewResult {
  batchId: string;
  status: 'VALID' | 'INVALID';
  fingerprint: string;
  validationVersion: string;
  expiresAt: string;
  expiresInMs: number;
  issues: readonly Srs51PreviewIssue[];
  warnings: readonly Srs51PreviewIssue[];
  errors: readonly Srs51PreviewIssue[];
  rowCount: number;
  canCommit: boolean;
}

/** Preview #54 yang sudah disimpan beserta reference revision saat preview dibuat. */
export interface StoredSrs51Preview {
  preview: Srs51PreviewResult;
  reference_revision: string;
}

/** Sumber preview tersimpan; wajib memakai client transaksi pemanggil. Penyimpanan menunggu C58-03. */
export interface Srs51PreviewSource<Tx> {
  load(tx: Tx, actor: CommitActor, batch: LockedBatch): Promise<StoredSrs51Preview | null>;
}

export class Srs51PreviewShapeError extends Error {
  constructor() {
    super('SRS51_PREVIEW_SHAPE_INVALID');
    this.name = 'Srs51PreviewShapeError';
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isIssueList(value: unknown): value is readonly Srs51PreviewIssue[] {
  return Array.isArray(value) && value.every((issue) => typeof issue === 'object' && issue !== null && isNonEmptyString(issue.id));
}

/** Memetakan preview #54 tersimpan ke `PreviewSnapshot` port SRS-52. */
export function toPreviewSnapshot(stored: StoredSrs51Preview): PreviewSnapshot {
  if (typeof stored !== 'object' || stored === null) throw new Srs51PreviewShapeError();
  const { preview, reference_revision: referenceRevision } = stored;
  if (typeof preview !== 'object' || preview === null) throw new Srs51PreviewShapeError();
  if (!isNonEmptyString(preview.batchId) || !isNonEmptyString(preview.fingerprint)) throw new Srs51PreviewShapeError();
  if (typeof preview.expiresAt !== 'string') throw new Srs51PreviewShapeError();
  if (!isIssueList(preview.errors) || !isIssueList(preview.warnings)) throw new Srs51PreviewShapeError();
  if (!isNonEmptyString(referenceRevision)) throw new Srs51PreviewShapeError();

  const declaredCommittable = preview.status === 'VALID' && preview.canCommit === true;
  const errorCount = Math.max(preview.errors.length, declaredCommittable ? 0 : 1);

  return {
    batch_id: preview.batchId,
    fingerprint: preview.fingerprint,
    expires_at: new Date(preview.expiresAt),
    reference_revision: referenceRevision,
    error_count: errorCount,
    warning_issue_ids: preview.warnings.map((warning) => warning.id),
  };
}

export function createSrs51PreviewReader<Tx>(source: Srs51PreviewSource<Tx>): PreviewReader<Tx> {
  return {
    async read(tx, actor, batch) {
      const stored = await source.load(tx, actor, batch);
      return stored === null ? null : toPreviewSnapshot(stored);
    },
  };
}
