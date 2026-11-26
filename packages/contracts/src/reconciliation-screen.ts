/**
 * DTO layar rekonsiliasi (SCR-12, UC-12) untuk konsumen web SRS-67. Status: PROPOSED.
 * Hanya tipe, mengikuti pola paket ini (konsumen memakai `import type`).
 *
 * Sumber bentuk:
 * - DOC-09 `RunCreated` (API-13), `RunDetail` dan `ReconciliationLine` (API-14);
 * - engine rekonsiliasi #36 (develop, `reconciliation-engine.ts`) untuk status dan kode tolak;
 * - service #47 (Draft, SHA 542384b) untuk kode error service dan status HTTP usulan.
 *
 * Fixture SIMULATED: database/fixtures/uji/reconciliation-screen.proposed-0.1.json.
 *
 * Batas:
 * - Envelope respons (`data`/`meta` pada api.ts vs contoh tanpa envelope di DOC-09) masih OPEN;
 *   tipe di sini hanya isi body.
 * - Daftar riwayat run (API-15, SRS-31) dan pemilihan latest belum dicakup.
 */

/** Enam status pasangan DOC-09 `ReconciliationLine.status`. */
export type ReconciliationStatusDto =
  | 'MATCHED'
  | 'DISCREPANCY'
  | 'COUNT_MISSING'
  | 'NOT_COUNTED'
  | 'STOCK_MISSING'
  | 'UOM_MISMATCH';

/** DOC-09 `ReconciliationLine`. Desimal dikirim sebagai string; nonvalid memiliki variance null. */
export interface ReconciliationLineDto {
  material_id: string;
  status: ReconciliationStatusDto;
  variance: string | null;
  stock_line_id: string | null;
  count_line_id: string | null;
  system_quantity: string | null;
  physical_quantity: string | null;
  stock_uom: string | null;
  count_uom: string | null;
}

/** DOC-09 `RunDetail` (API-14). */
export interface ReconciliationRunDetailDto {
  run_id: string;
  stock_snapshot_id: string;
  count_session_id: string;
  lines: ReconciliationLineDto[];
  next_cursor: string | null;
}

/** DOC-09 `RunCreated` (API-13). */
export interface ReconciliationRunCreatedDto {
  run_id: string;
  rule_version: string;
}

/** DOC-09 `ReconciliationRequest` (API-13). */
export interface ReconciliationRequestDto {
  stock_snapshot_id: string;
  count_session_id: string;
}

/** Kode tolak konteks/grain engine #36 (HTTP 422 usulan #47); seluruh run ditolak. */
export type ReconciliationRejectCodeDto =
  | 'WAREHOUSE_MISMATCH'
  | 'MODE_MISMATCH'
  | 'CUTOFF_MISMATCH'
  | 'CUTOFF_UNVERIFIED'
  | 'AMBIGUOUS_PAIR'
  | 'NOT_COUNTED_VALUE'
  | 'INVALID_FILE';

/**
 * Kode error API-13 dari service #47. `TRANSACTION_OUTCOME_UNKNOWN` PLACEHOLDER:
 * belum ada di katalog DOC-08. Status HTTP usulan ada di fixture (`error_http_status`).
 */
export type ReconciliationErrorCodeDto =
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'IDEMPOTENCY_CONFLICT'
  | ReconciliationRejectCodeDto
  | 'TRANSACTION_FAILED'
  | 'TRANSACTION_OUTCOME_UNKNOWN';
