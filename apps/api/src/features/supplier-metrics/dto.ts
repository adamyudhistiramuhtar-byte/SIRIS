/**
 * DTO KANDIDAT untuk enam metrik supplier (SRS-24).
 *
 * Status: CANDIDATE, bukan kontrak bersama yang disetujui.
 * API-10 `GET /inbound/metrics` belum disahkan, sehingga DTO ini sengaja
 * diletakkan di dalam modul fitur dan TIDAK ditambahkan ke `packages/contracts`.
 */

import type {
  MetricResult,
  SupplierFillResult,
  SupplierMetricsResult,
} from './types.js';

export interface SupplierMetricsFilterCandidate {
  supplier_code: string | null;
  material_code: string | null;
  uom: string | null;
  warehouse_id: string | null;
  mode: 'UJI' | 'ACTUAL' | null;
  date_from: string | null;
  date_to: string | null;
}

export const SUPPLIER_METRICS_OPEN_DECISIONS: readonly string[] = [
  'OD-06: eligibility final, bukti completion/release, kebijakan interval tanggal, koreksi event, dan tie-break latest run belum ditutup; seluruh nilai tetap kandidat UJI.',
  'API-10 GET /inbound/metrics belum disetujui; DTO ini kandidat internal dan belum menjadi kontrak bersama.',
  'CF-06: aturan expected_quantity nol atau batas presisi belum diputuskan; record terkait dikecualikan dengan alasan eksplisit, bukan dihitung sebagai nol.',
  'Layar metrik belum diimplementasikan karena kontrak DTO/API belum disetujui.',
];

export interface SupplierMetricsDtoCandidate {
  contract_status: 'CANDIDATE';
  data_status: 'UJI';
  fixture_version: string;
  oracle_version: string;
  generated_at: string;
  filter: SupplierMetricsFilterCandidate;
  metrics: {
    otd_r: MetricResult;
    otd_c: MetricResult;
    quantity_mismatch_rate: MetricResult;
    s_lead: MetricResult;
    s_change: MetricResult;
  };
  s_fill: SupplierFillResult[];
  open_decisions: readonly string[];
}

/**
 * Membungkus hasil perhitungan menjadi DTO kandidat.
 * `generatedAt` wajib diberikan pemanggil agar tetap deterministik dan dapat diuji.
 */
export function toSupplierMetricsDtoCandidate(
  result: SupplierMetricsResult,
  options: {
    generated_at: string;
    oracle_version: string;
    filter?: Partial<SupplierMetricsFilterCandidate>;
  },
): SupplierMetricsDtoCandidate {
  const filter: SupplierMetricsFilterCandidate = {
    supplier_code: options.filter?.supplier_code ?? null,
    material_code: options.filter?.material_code ?? null,
    uom: options.filter?.uom ?? null,
    warehouse_id: options.filter?.warehouse_id ?? null,
    mode: options.filter?.mode ?? null,
    date_from: options.filter?.date_from ?? null,
    date_to: options.filter?.date_to ?? null,
  };

  return {
    contract_status: 'CANDIDATE',
    data_status: 'UJI',
    fixture_version: result.fixture_version,
    oracle_version: options.oracle_version,
    generated_at: options.generated_at,
    filter,
    metrics: result.metrics,
    s_fill: result.s_fill,
    open_decisions: SUPPLIER_METRICS_OPEN_DECISIONS,
  };
}
