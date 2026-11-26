/**
 * DTO layar commit/pembatalan impor dan event auditnya (UC-16, API-04/API-05/API-20)
 * untuk konsumen web SRS-67. Status: PROPOSED. Hanya tipe (konsumen memakai `import type`).
 *
 * Sumber bentuk:
 * - DOC-09 `CommitRequest`, `CommitResult`, `Cancellation`, `CancellationResult`, `AuditEvent`, `ApiError`;
 * - service commit/cancel SRS-52 #46 (Draft, SHA 6cf5bbf) untuk kode error dan status HTTP usulan.
 *
 * Fixture SIMULATED: database/fixtures/uji/import-commit-screen.proposed-0.1.json.
 *
 * Batas:
 * - Audit dibatasi ke event yang dihasilkan commit/cancel #46. Query dan proyeksi audit API-20
 *   (SRS-33, Luthfi) serta audit dasar (SRS-49/#22, Adam) bukan bagian DTO ini.
 * - `AuditEventDto` mengikuti DOC-09: tidak memuat actor, batch, gudang, atau reason_code.
 * - Kode bertanda PLACEHOLDER belum ada di katalog DOC-08 dan menunggu keputusan Adam.
 */

export type ImportOperationDto = 'import.commit' | 'import.cancel';

/** DOC-09 `CommitRequest` (API-04). Header Idempotency-Key dikirim terpisah. */
export interface CommitRequestDto {
  preview_fingerprint: string;
  acknowledged_warnings: string[];
}

/** DOC-09 `CommitResult` (API-04). */
export interface CommitResultDto {
  batch_id: string;
  state: 'COMMITTED';
  committed_count: number;
}

/** DOC-09 `Cancellation` (API-05). */
export interface CancellationRequestDto {
  reason: string;
}

/** DOC-09 `CancellationResult` (API-05). */
export interface CancellationResultDto {
  batch_id: string;
  state: 'CANCELLED';
}

/**
 * Kode error commit/cancel #46. Dari katalog DOC-08: IDEMPOTENCY_CONFLICT, PREVIEW_EXPIRED,
 * PREVIEW_CHANGED, FORBIDDEN, TRANSACTION_FAILED. BAD_REQUEST dan NOT_FOUND mengikuti AppError.
 * PLACEHOLDER: STATE_CONFLICT, WARNING_ACKNOWLEDGEMENT_OPEN, SOURCE_REQUIRED, MODE_NOT_ENABLED,
 * TRANSACTION_OUTCOME_UNKNOWN. Status HTTP usulan ada di fixture (`error_http_status`).
 */
export type ImportCommitErrorCodeDto =
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'IDEMPOTENCY_CONFLICT'
  | 'PREVIEW_CHANGED'
  | 'PREVIEW_EXPIRED'
  | 'STATE_CONFLICT'
  | 'WARNING_ACKNOWLEDGEMENT_OPEN'
  | 'SOURCE_REQUIRED'
  | 'MODE_NOT_ENABLED'
  | 'TRANSACTION_FAILED'
  | 'TRANSACTION_OUTCOME_UNKNOWN';

export type AuditOutcomeDto = 'SUCCESS' | 'FAILURE' | 'CANCELLED' | 'DENIED';

/** DOC-09 `AuditEvent` (item API-20). */
export interface AuditEventDto {
  id: string;
  action: string;
  outcome: AuditOutcomeDto;
  mode: 'ACTUAL' | 'UJI' | null;
  correlation_id: string;
  created_at?: string;
}
