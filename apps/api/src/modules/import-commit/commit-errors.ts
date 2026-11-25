/**
 * Error domain SRS-52 untuk commit dan pembatalan impor. Status: PROPOSED.
 *
 * Kode yang berasal dari katalog DOC-08 §"Katalog error dan warning":
 * IDEMPOTENCY_CONFLICT (409), PREVIEW_EXPIRED (410), PREVIEW_CHANGED (409),
 * FORBIDDEN (403), TRANSACTION_FAILED (500). BAD_REQUEST (400) dan NOT_FOUND (404)
 * mengikuti AppError yang sudah ada.
 *
 * Kode PLACEHOLDER (belum ada di katalog; menunggu keputusan Adam, komentar Jira
 * SRS-52 nomor 10198 butir 1 dan 3): STATE_CONFLICT, WARNING_ACKNOWLEDGEMENT_OPEN,
 * SOURCE_REQUIRED, TRANSACTION_OUTCOME_UNKNOWN.
 *
 * Error ini sengaja tidak pernah membawa `cause` atau pesan driver. Message hanya
 * berisi kode konstan sehingga aman bila tidak sengaja dicetak.
 */
export type ImportCommitErrorCode =
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'IDEMPOTENCY_CONFLICT'
  | 'PREVIEW_CHANGED'
  | 'PREVIEW_EXPIRED'
  | 'STATE_CONFLICT'
  | 'WARNING_ACKNOWLEDGEMENT_OPEN'
  | 'SOURCE_REQUIRED'
  | 'TRANSACTION_FAILED'
  | 'TRANSACTION_OUTCOME_UNKNOWN';

/** Pemetaan HTTP usulan. Hanya kode pada allowlist ini yang boleh keluar dari service. */
export const IMPORT_COMMIT_HTTP_STATUS: Readonly<Record<ImportCommitErrorCode, number>> = Object.freeze({
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  IDEMPOTENCY_CONFLICT: 409,
  PREVIEW_CHANGED: 409,
  PREVIEW_EXPIRED: 410,
  STATE_CONFLICT: 409,
  WARNING_ACKNOWLEDGEMENT_OPEN: 422,
  SOURCE_REQUIRED: 422,
  TRANSACTION_FAILED: 500,
  TRANSACTION_OUTCOME_UNKNOWN: 500,
});

export class ImportCommitError extends Error {
  readonly httpStatus: number;

  constructor(readonly code: ImportCommitErrorCode) {
    super(code);
    this.name = 'ImportCommitError';
    this.httpStatus = IMPORT_COMMIT_HTTP_STATUS[code];
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isImportCommitError(value: unknown): value is ImportCommitError {
  return value instanceof ImportCommitError && Object.hasOwn(IMPORT_COMMIT_HTTP_STATUS, value.code);
}
