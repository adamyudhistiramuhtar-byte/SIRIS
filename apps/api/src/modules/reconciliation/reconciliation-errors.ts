/**
 * Error domain service rekonsiliasi SRS-29 (API-13). Status: PROPOSED.
 *
 * Kode dari katalog DOC-08: IDEMPOTENCY_CONFLICT (409), FORBIDDEN (403),
 * TRANSACTION_FAILED (500), serta kode penolakan engine (WAREHOUSE_MISMATCH, MODE_MISMATCH,
 * CUTOFF_MISMATCH, CUTOFF_UNVERIFIED, AMBIGUOUS_PAIR, NOT_COUNTED_VALUE, INVALID_FILE; 422).
 * BAD_REQUEST (400) dan NOT_FOUND (404) mengikuti AppError yang sudah ada.
 * PLACEHOLDER (belum ada di katalog DOC-08): TRANSACTION_OUTCOME_UNKNOWN.
 *
 * Error ini tidak membawa `cause`; message hanya kode konstan.
 */
import type { ReconciliationRejectCode } from './reconciliation-engine.js';

export type ReconciliationServiceErrorCode =
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'IDEMPOTENCY_CONFLICT'
  | ReconciliationRejectCode
  | 'TRANSACTION_FAILED'
  | 'TRANSACTION_OUTCOME_UNKNOWN';

export const RECONCILIATION_HTTP_STATUS: Readonly<Record<ReconciliationServiceErrorCode, number>> = Object.freeze({
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  IDEMPOTENCY_CONFLICT: 409,
  WAREHOUSE_MISMATCH: 422,
  MODE_MISMATCH: 422,
  CUTOFF_MISMATCH: 422,
  CUTOFF_UNVERIFIED: 422,
  AMBIGUOUS_PAIR: 422,
  NOT_COUNTED_VALUE: 422,
  INVALID_FILE: 422,
  TRANSACTION_FAILED: 500,
  TRANSACTION_OUTCOME_UNKNOWN: 500,
});

export class ReconciliationServiceError extends Error {
  readonly httpStatus: number;

  constructor(readonly code: ReconciliationServiceErrorCode) {
    super(code);
    this.name = 'ReconciliationServiceError';
    this.httpStatus = RECONCILIATION_HTTP_STATUS[code];
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isReconciliationServiceError(value: unknown): value is ReconciliationServiceError {
  return value instanceof ReconciliationServiceError && Object.hasOwn(RECONCILIATION_HTTP_STATUS, value.code);
}
