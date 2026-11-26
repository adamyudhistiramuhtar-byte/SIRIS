/**
 * DTO daftar riwayat run rekonsiliasi (SCR-13, UC-13, API-15) untuk SRS-31. Status: PROPOSED.
 * Hanya tipe (konsumen memakai `import type`).
 *
 * Sumber bentuk: DOC-09 API-15 (`GET /inventory/reconciliations`) dan `RunSummary`.
 * Fixture SIMULATED: database/fixtures/uji/reconciliation-history-screen.proposed-0.1.json.
 *
 * Batas (OPEN):
 * - Urutan daftar tidak menyiratkan "latest". Pemilihan latest dan tie-break (`commit_order`)
 *   masih OPEN (SRS-32 10213), dan arti `sort=source_asc|source_desc` belum didefinisikan.
 * - `RunSummary` tidak memuat waktu, cutoff, gudang, atau mode; filter `from`/`to` belum punya
 *   kolom acuan yang disepakati.
 * - Detail run memakai DTO API-14 (`ReconciliationRunDetailDto`, PR #59).
 */

/** DOC-09 `RunSummary`. */
export interface ReconciliationRunSummaryDto {
  id: string;
  stock_snapshot_id: string;
  count_session_id: string;
  rule_version: string;
}

/** Body respons API-15. */
export interface ReconciliationRunListDto {
  items: ReconciliationRunSummaryDto[];
  next_cursor: string | null;
}

/** Parameter query API-15 menurut DOC-09. */
export interface ReconciliationRunListQueryDto {
  warehouse_id: string;
  mode: 'ACTUAL' | 'UJI';
  from?: string;
  to?: string;
  cursor?: string;
  /** 1–100, default 25. */
  limit?: number;
  /** Default `source_desc`; arti urutan OPEN. */
  sort?: 'source_asc' | 'source_desc';
}
