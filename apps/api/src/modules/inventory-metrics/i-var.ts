/**
 * I-VAR per pasangan valid (SRS-32, UC-14). Fungsi murni tanpa DB, I/O, jam, atau acak.
 *
 * Definisi sumber (DOC-03/06/10/13/16, design.md): "Physical quantity − system quantity
 * per pasangan valid". I-VAR adalah selisih per item, bukan rasio, sehingga tidak memiliki
 * denominator. Pasangan nonvalid dikecualikan dan tidak pernah ditampilkan sebagai 0.
 *
 * Sengaja di luar cakupan sampai keputusan D-06/OD-05: pemilihan latest run, eligibility
 * lintas run, I-EXACT, I-COVER, dan I-REPEAT. Setiap run diproses terpisah apa adanya.
 */

export const I_VAR_RULE_VERSION = 'uji-i-var/proposed-0.1';

export type ReconciliationStatus =
  'MATCHED' | 'DISCREPANCY' | 'COUNT_MISSING' | 'NOT_COUNTED' | 'STOCK_MISSING' | 'UOM_MISMATCH';

/** Bentuk mengikuti DTO ReconciliationLine DOC-09 (PROPOSED). */
export interface IVarLineInput {
  material_id: string;
  status: ReconciliationStatus;
  variance: string | null;
  system_quantity: string | null;
  physical_quantity: string | null;
}

export interface IVarRunInput {
  run_id: string;
  cutoff_id: string;
  rule_version: string;
  lines: readonly IVarLineInput[];
}

export interface IVarItem {
  material_id: string;
  i_var: string;
}

export interface IVarExclusion {
  material_id: string;
  status: Exclude<ReconciliationStatus, 'MATCHED' | 'DISCREPANCY'>;
}

export interface IVarRunResult {
  run_id: string;
  cutoff_id: string;
  rule_version: string;
  /** Hanya pasangan valid, urut material_id naik. */
  items: IVarItem[];
  /** Pasangan nonvalid beserta alasannya; tidak diberi nilai I-VAR. */
  excluded: IVarExclusion[];
  /** True bila tidak ada pasangan valid; tampilkan sebagai data tidak cukup, bukan 0. */
  insufficient_data: boolean;
}

/**
 * Kode internal modul ini, bukan katalog error API DOC-08. Baris yang tidak konsisten
 * ditolak seluruh run-nya agar angka yang salah tidak ikut tampil.
 */
export type IVarRejectCode = 'INCONSISTENT_RUN_LINE';

export type IVarResult =
  | { ok: true; metric_version: string; runs: IVarRunResult[] }
  | { ok: false; code: IVarRejectCode; run_id?: string; material_id?: string };

const VALID_STATUSES = new Set<ReconciliationStatus>(['MATCHED', 'DISCREPANCY']);
const NONVALID_STATUSES = new Set<ReconciliationStatus>([
  'COUNT_MISSING',
  'NOT_COUNTED',
  'STOCK_MISSING',
  'UOM_MISMATCH',
]);
const SCALE = 1_000_000n;
const DECIMAL = /^(-?)(\d{1,14})(?:\.(\d{1,6}))?$/;

function parseDecimal(value: unknown): bigint | null {
  if (typeof value !== 'string') return null;
  const match = DECIMAL.exec(value);
  if (!match) return null;
  const [, sign, whole, fraction = ''] = match;
  const scaled = BigInt(whole) * SCALE + BigInt(fraction.padEnd(6, '0'));
  return sign === '-' ? -scaled : scaled;
}

function formatDecimal(scaled: bigint): string {
  const negative = scaled < 0n;
  const absolute = negative ? -scaled : scaled;
  const fraction = (absolute % SCALE).toString().padStart(6, '0');
  return `${negative ? '-' : ''}${absolute / SCALE}.${fraction}`;
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

type Rejection = Extract<IVarResult, { ok: false }>;

function inconsistent(runId?: string, materialId?: string): Rejection {
  const rejection: Rejection = { ok: false, code: 'INCONSISTENT_RUN_LINE' };
  if (runId !== undefined) rejection.run_id = runId;
  if (materialId !== undefined) rejection.material_id = materialId;
  return rejection;
}

/**
 * Menghitung ulang selisih dari kuantitas dan mencocokkannya dengan variance tersimpan,
 * sehingga hasil engine yang tidak konsisten tidak diteruskan sebagai metrik.
 */
function validIVar(line: IVarLineInput): bigint | null {
  const system = parseDecimal(line.system_quantity);
  const physical = parseDecimal(line.physical_quantity);
  const stored = parseDecimal(line.variance);
  if (system === null || physical === null || stored === null) return null;
  const difference = physical - system;
  if (difference !== stored) return null;
  if (line.status === 'MATCHED' && difference !== 0n) return null;
  if (line.status === 'DISCREPANCY' && difference === 0n) return null;
  return difference;
}

function computeRun(run: IVarRunInput): IVarRunResult | Rejection {
  if (!isText(run?.run_id) || !isText(run?.cutoff_id) || !isText(run?.rule_version)) {
    return inconsistent(isText(run?.run_id) ? run.run_id : undefined);
  }
  if (!Array.isArray(run.lines)) return inconsistent(run.run_id);
  const items: IVarItem[] = [];
  const excluded: IVarExclusion[] = [];
  const seen = new Set<string>();
  for (const line of run.lines) {
    if (!isText(line?.material_id) || seen.has(line.material_id)) {
      return inconsistent(run.run_id, isText(line?.material_id) ? line.material_id : undefined);
    }
    seen.add(line.material_id);
    if (VALID_STATUSES.has(line.status)) {
      const value = validIVar(line);
      if (value === null) return inconsistent(run.run_id, line.material_id);
      items.push({ material_id: line.material_id, i_var: formatDecimal(value) });
    } else if (NONVALID_STATUSES.has(line.status)) {
      // Nonvalid wajib tanpa variance (BR-INV-05); variance terisi berarti data rusak.
      if (line.variance !== null) return inconsistent(run.run_id, line.material_id);
      excluded.push({
        material_id: line.material_id,
        status: line.status as IVarExclusion['status'],
      });
    } else {
      return inconsistent(run.run_id, line.material_id);
    }
  }
  items.sort((a, b) => compareText(a.material_id, b.material_id));
  excluded.sort((a, b) => compareText(a.material_id, b.material_id));
  return {
    run_id: run.run_id,
    cutoff_id: run.cutoff_id,
    rule_version: run.rule_version,
    items,
    excluded,
    insufficient_data: items.length === 0,
  };
}

/**
 * Memproses setiap run terpisah sesuai urutan input. Run pada cutoff yang sama tidak
 * digabung dan tidak ada yang dipilih sebagai latest; keputusan itu menunggu D-06.
 */
export function computeIVar(runs: readonly IVarRunInput[]): IVarResult {
  if (!Array.isArray(runs)) return inconsistent();
  const runIds = new Set<string>();
  const results: IVarRunResult[] = [];
  for (const run of runs) {
    if (isText(run?.run_id) && runIds.has(run.run_id)) return inconsistent(run.run_id);
    const result = computeRun(run);
    if ('ok' in result) return result;
    runIds.add(result.run_id);
    results.push(result);
  }
  return { ok: true, metric_version: I_VAR_RULE_VERSION, runs: results };
}
