/**
 * DTO layar metrik persediaan (UI-14, UC-14) untuk konsumen web SRS-67. Status: PROPOSED.
 * Hanya tipe, mengikuti pola paket ini (konsumen memakai `import type`).
 *
 * Sumber bentuk:
 * - I-VAR: `apps/api/src/modules/inventory-metrics/i-var.ts` (#37, develop 77669f4);
 * - latest run, I-EXACT/I-COVER, dan hasil service: #49 (Draft, SHA 9668a00).
 *
 * Fixture SIMULATED: database/fixtures/uji/inventory-metrics-screen.proposed-0.1.json.
 *
 * Batas:
 * - Bentuk ini mengikuti keluaran service #49, BELUM sama dengan DOC-09 `InventoryMetric`
 *   (API-16: metric_code/value/numerator/denominator/excluded_count/reason). Pemetaannya OPEN.
 * - `percent` belum dibulatkan; aturan pembulatan belum diputuskan.
 * - `latest_run_id` bergantung pada `commit_order` yang mekanismenya masih OPEN (SRS-32 10213).
 * - I-REPEAT tidak ada: definisi periode belum diputuskan.
 */

/** Status pasangan sumber metrik; sama dengan DOC-09 `ReconciliationLine.status`. */
export type MetricLineStatusDto =
  | 'MATCHED'
  | 'DISCREPANCY'
  | 'COUNT_MISSING'
  | 'NOT_COUNTED'
  | 'STOCK_MISSING'
  | 'UOM_MISMATCH';

/** I-VAR per material untuk pasangan valid (#37). Desimal sebagai string. */
export interface IVarItemDto {
  material_id: string;
  i_var: string;
}

/** Pasangan nonvalid; tidak diberi nilai I-VAR. */
export interface IVarExclusionDto {
  material_id: string;
  status: Exclude<MetricLineStatusDto, 'MATCHED' | 'DISCREPANCY'>;
}

/** Hasil I-VAR satu run (#37 `IVarRunResult`). */
export interface IVarRunDto {
  run_id: string;
  cutoff_id: string;
  rule_version: string;
  items: IVarItemDto[];
  excluded: IVarExclusionDto[];
  /** True bila tidak ada pasangan valid: tampilkan "data tidak cukup", bukan 0. */
  insufficient_data: boolean;
}

/** Rasio I-EXACT/I-COVER (#49 `RatioMetric`). */
export interface RatioMetricDto {
  numerator: number;
  denominator: number;
  /** numerator × 100 / denominator tanpa pembulatan; null bila denominator nol. */
  percent: number | null;
  insufficient_data: boolean;
}

/** #49 `ExactCoverResult`. */
export interface ExactCoverDto {
  i_exact: RatioMetricDto;
  i_cover: RatioMetricDto;
  counts: { matched: number; discrepancy: number; valid: number; nonvalid: number; snapshot_items: number };
}

/** Satu kelompok (gudang, mode, cutoff, rule_version) pada hasil service #49. */
export interface InventoryMetricsGroupDto {
  cutoff_id: string;
  rule_version: string;
  /** AMBIGUOUS_ORDER: urutan commit tidak terjamin, latest tidak dipilih dan metrik null. */
  status: 'OK' | 'AMBIGUOUS_ORDER';
  latest_run_id: string | null;
  /** Seluruh run COMMITTED kelompok ini; histori tidak ditimpa. */
  history_run_ids: string[];
  i_var: IVarRunDto | null;
  exact_cover: ExactCoverDto | null;
}

/** Hasil service metrik persediaan #49 (`MetricsResult`). */
export interface InventoryMetricsScreenDto {
  warehouse_id: string;
  mode: 'ACTUAL' | 'UJI';
  groups: InventoryMetricsGroupDto[];
}

/** Kode error service #49. Dua kode terakhir PLACEHOLDER (belum ada di katalog DOC-08). */
export type InventoryMetricsErrorCodeDto =
  | 'BAD_REQUEST'
  | 'FORBIDDEN'
  | 'METRICS_SOURCE_UNAVAILABLE'
  | 'METRICS_SOURCE_INCONSISTENT';
