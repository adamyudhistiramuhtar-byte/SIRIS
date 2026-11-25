/**
 * I-EXACT dan I-COVER per run (SRS-32, UC-14). Fungsi murni. Status: PROPOSED.
 *
 * Definisi sumber (design.md tabel metrik; disalin di DOC-03/06/10/13/16):
 * - I-EXACT = matched / pasangan valid × 100%;
 * - I-COVER = pasangan valid / item snapshot dalam scope × 100%.
 * Pasangan valid = MATCHED atau DISCREPANCY. "Item snapshot" = baris run yang memiliki sisi
 * stok (semua status kecuali STOCK_MISSING); konsisten dengan fixture design.md
 * (snapshot 8 item, valid 5 → 62,5%).
 *
 * Aturan sumber: denominator nol tidak tersedia, bukan 0% (DOC-03 "Denominator nol
 * unavailable, tidak 0%"). Satu material per sisi per run (D-04, komentar Jira SRS-38
 * nomor 10153 butir 3): material ganda dalam satu run menolak seluruh run.
 *
 * Di luar cakupan: I-REPEAT (definisi "periode" tidak ditemukan), pembulatan tampilan,
 * filter material "in scope" selain isi run, dan agregasi lintas run.
 */
import type { ReconciliationStatus } from './i-var.js';

export const EXACT_COVER_RULE_VERSION = 'uji-exact-cover/proposed-0.1';

export interface MetricLineInput {
  material_id: string;
  status: ReconciliationStatus;
}

export interface RatioMetric {
  numerator: number;
  denominator: number;
  /** numerator × 100 / denominator tanpa pembulatan; null bila denominator nol. */
  percent: number | null;
  /** True bila denominator nol: tampilkan "data tidak cukup", bukan 0%. */
  insufficient_data: boolean;
}

export interface ExactCoverResult {
  i_exact: RatioMetric;
  i_cover: RatioMetric;
  counts: { matched: number; discrepancy: number; valid: number; nonvalid: number; snapshot_items: number };
}

export type ExactCoverOutcome =
  | { ok: true; metric_version: string; result: ExactCoverResult }
  | { ok: false; code: 'INCONSISTENT_RUN_LINE'; material_id?: string };

const STATUSES = new Set<ReconciliationStatus>(['MATCHED', 'DISCREPANCY', 'COUNT_MISSING', 'NOT_COUNTED', 'STOCK_MISSING', 'UOM_MISMATCH']);

function ratio(numerator: number, denominator: number): RatioMetric {
  return denominator === 0
    ? { numerator, denominator, percent: null, insufficient_data: true }
    : { numerator, denominator, percent: (numerator * 100) / denominator, insufficient_data: false };
}

export function computeExactCover(lines: readonly MetricLineInput[]): ExactCoverOutcome {
  if (!Array.isArray(lines)) return { ok: false, code: 'INCONSISTENT_RUN_LINE' };
  const seen = new Set<string>();
  let matched = 0;
  let discrepancy = 0;
  let nonvalid = 0;
  let stockMissing = 0;
  for (const line of lines) {
    if (typeof line?.material_id !== 'string' || line.material_id.length === 0 || !STATUSES.has(line.status)) {
      return { ok: false, code: 'INCONSISTENT_RUN_LINE' };
    }
    if (seen.has(line.material_id)) return { ok: false, code: 'INCONSISTENT_RUN_LINE', material_id: line.material_id };
    seen.add(line.material_id);
    if (line.status === 'MATCHED') matched += 1;
    else if (line.status === 'DISCREPANCY') discrepancy += 1;
    else nonvalid += 1;
    if (line.status === 'STOCK_MISSING') stockMissing += 1;
  }
  const valid = matched + discrepancy;
  const snapshotItems = lines.length - stockMissing;
  return {
    ok: true,
    metric_version: EXACT_COVER_RULE_VERSION,
    result: {
      i_exact: ratio(matched, valid),
      i_cover: ratio(valid, snapshotItems),
      counts: { matched, discrepancy, valid, nonvalid, snapshot_items: snapshotItems },
    },
  };
}
