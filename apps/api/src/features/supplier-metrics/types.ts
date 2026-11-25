/**
 * Tipe sumber dan hasil perhitungan enam metrik supplier (SRS-24 / SRS-90).
 *
 * Definisi metrik bersumber dari design.md §6.6 dan DOC-03 §UC-08.
 * Modul ini sengaja tidak bergantung pada Express maupun PostgreSQL agar dapat
 * diuji dengan fixture UJI berversi secara deterministik.
 */

export type DataStatus = 'UJI' | 'ACTUAL';

export type InboundStatus = 'FINAL' | 'OPEN';

export type CommitmentEventType = 'INITIAL' | 'CHANGE';

export type SupplierMetricId =
  | 'OTD_R'
  | 'OTD_C'
  | 'QUANTITY_MISMATCH_RATE'
  | 'S_FILL'
  | 'S_LEAD'
  | 'S_CHANGE';

export type MetricUnit = 'PERCENT' | 'DAYS' | 'COUNT';

/**
 * Alasan eksklusi yang eksplisit. Kode ini stabil dan dipakai pada metadata hasil
 * agar nilai yang tidak dihitung tidak pernah disamakan dengan nol.
 */
export type ExclusionReason =
  | 'OPEN_NOT_FINAL'
  | 'MISSING_FINAL_ARRIVAL'
  | 'MISSING_REQUESTED_DATE'
  | 'MISSING_RELEASE_DATE'
  | 'MISSING_COMPLETION'
  | 'MISSING_EXPECTED_QUANTITY'
  | 'INVALID_EXPECTED_QUANTITY'
  | 'ZERO_EXPECTED_QUANTITY'
  | 'NO_RECEIPTS'
  | 'INVALID_RECEIPT'
  | 'DUPLICATE_RECEIPT_EVENT'
  | 'UOM_NOT_COMPARABLE'
  | 'NO_COMMITMENT'
  | 'INVALID_COMMITMENT_SEQUENCE'
  | 'DUPLICATE_COMMITMENT_EVENT'
  | 'INVALID_COMMITMENT_TIMESTAMP';

export interface ExclusionSummary {
  reason: ExclusionReason;
  count: number;
  source_refs: string[];
}

export interface InboundRecord {
  inbound_ref: string;
  warehouse_id: string;
  mode: DataStatus;
  supplier_code: string;
  material_code: string;
  uom: string;
  /** Tanggal release (YYYY-MM-DD); null bila tidak tersedia di sumber. */
  release_date: string | null;
  /** Tanggal diminta pembeli (YYYY-MM-DD); null bila tidak tersedia. */
  requested_date: string | null;
  /** Kuantitas diminta sebagai string desimal maksimum 6 angka di belakang koma. */
  expected_quantity: string | null;
  status: InboundStatus;
  /** Tanggal kedatangan final (YYYY-MM-DD); null untuk record OPEN. */
  final_arrival_date: string | null;
  /** Waktu penyelesaian final (ISO-8601 dengan offset); null untuk record OPEN. */
  final_completion_at: string | null;
  source_reference: string;
}

export interface CommitmentEvent {
  inbound_ref: string;
  event_ref: string;
  event_type: CommitmentEventType;
  /** Tanggal janji terbaru pada event ini (YYYY-MM-DD). */
  promised_date: string;
  /** Waktu pencatatan event (ISO-8601 dengan offset); null bila sumber tidak lengkap. */
  event_at: string | null;
  source_reference: string;
}

export interface ReceivingEvent {
  inbound_ref: string;
  event_ref: string;
  /** Kuantitas diterima sebagai string desimal maksimum 6 angka di belakang koma. */
  received_quantity: string | null;
  uom: string;
  received_at: string;
  is_closing: boolean;
  closing_reference: string | null;
  source_reference: string;
}

export interface SupplierMetricSource {
  data_status: DataStatus;
  inbound: InboundRecord[];
  commitments: CommitmentEvent[];
  receipts: ReceivingEvent[];
}

export interface SupplierMetricsFixtureFile extends SupplierMetricSource {
  fixture_version: string;
  contract_status: 'CANDIDATE';
}

export interface MetricResult {
  metric: SupplierMetricId;
  unit: MetricUnit;
  /** Nilai final: persentase, hari, atau jumlah. null bila tidak dapat dihitung. */
  value: number | null;
  numerator: number | null;
  denominator: number | null;
  excluded_count: number;
  exclusions: ExclusionSummary[];
  /** Kode alasan bila value null. Wajib terisi saat denominator nol. */
  unavailable_reason: string | null;
  eligibility: string;
  source_refs: string[];
  data_status: DataStatus;
  /**
   * Seluruh hasil perhitungan ini masih kandidat UJI. Nilai yang bergantung pada
   * keputusan eligibility (OD-06) belum boleh diperlakukan sebagai keputusan final.
   */
  decision_status: 'CANDIDATE_UJI';
}

export interface SupplierFillGroup {
  supplier_code: string;
  material_code: string;
  uom: string;
}

export interface SupplierFillResult extends MetricResult {
  metric: 'S_FILL';
  group: SupplierFillGroup;
}

export interface SupplierMetricsResult {
  fixture_version: string;
  data_status: DataStatus;
  metrics: {
    otd_r: MetricResult;
    otd_c: MetricResult;
    quantity_mismatch_rate: MetricResult;
    s_lead: MetricResult;
    s_change: MetricResult;
  };
  s_fill: SupplierFillResult[];
}
