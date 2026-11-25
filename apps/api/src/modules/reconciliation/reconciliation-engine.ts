/**
 * Engine rekonsiliasi murni SRS-29 (UC-12). Tanpa DB, I/O, jam, atau acak.
 *
 * Sumber: DOC-03 UC-12, DOC-05 BR-INV-02..05, DOC-07 reconciliation_lines,
 * DOC-08 tabel keputusan rekonsiliasi dan katalog error, DOC-09 ReconciliationLine.
 * Status kontrak: PROPOSED. Grain mengikuti arahan baseline UJI (PR #14 §13.1).
 *
 * Sengaja di luar cakupan: penyimpanan run/lines, fingerprint/reuse (D-05),
 * pemilihan latest run (D-06), alias UOM (A.3), kebijakan saldo negatif (OD-05).
 */

export const RECONCILIATION_RULE_VERSION = 'uji-engine/proposed-0.1';

export type ReconciliationStatus =
  'MATCHED' | 'DISCREPANCY' | 'COUNT_MISSING' | 'NOT_COUNTED' | 'STOCK_MISSING' | 'UOM_MISMATCH';

/** Kode diambil dari katalog error DOC-08; tidak ada kode baru. */
export type ReconciliationRejectCode =
  | 'WAREHOUSE_MISMATCH'
  | 'MODE_MISMATCH'
  | 'CUTOFF_MISMATCH'
  | 'CUTOFF_UNVERIFIED'
  | 'AMBIGUOUS_PAIR'
  | 'NOT_COUNTED_VALUE'
  | 'INVALID_FILE';

export interface ReconciliationContext {
  warehouse_id: string;
  mode: 'ACTUAL' | 'UJI';
  cutoff_id: string;
}

export interface StockLineInput {
  id: string;
  material_id: string;
  uom: string;
  /** Desimal string numeric(20,6), misalnya "10" atau "7.250000". */
  system_quantity: string;
}

export interface CountLineInput {
  id: string;
  material_id: string;
  uom: string;
  is_counted: boolean;
  /** Wajib null bila is_counted=false; wajib desimal >= 0 bila true. */
  physical_quantity: string | null;
}

export interface ReconciliationInput {
  stock: { context: ReconciliationContext; lines: readonly StockLineInput[] };
  count: { context: ReconciliationContext; lines: readonly CountLineInput[] };
}

/** Bentuk mengikuti DTO ReconciliationLine DOC-09. */
export interface ReconciliationLineResult {
  material_id: string;
  status: ReconciliationStatus;
  variance: string | null;
  stock_line_id: string | null;
  count_line_id: string | null;
  system_quantity: string | null;
  physical_quantity: string | null;
  stock_uom: string | null;
  count_uom: string | null;
}

export type ReconciliationResult =
  | { ok: true; rule_version: string; lines: ReconciliationLineResult[] }
  | { ok: false; code: ReconciliationRejectCode; material_id?: string };

const SCALE = 1_000_000n;
const DECIMAL = /^(-?)(\d{1,14})(?:\.(\d{1,6}))?$/;

/** Mengubah desimal string menjadi bilangan bulat berskala 10^6; null bila tidak sah. */
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
  const whole = absolute / SCALE;
  const fraction = (absolute % SCALE).toString().padStart(6, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function contextCode(
  stock: ReconciliationContext,
  count: ReconciliationContext,
): ReconciliationRejectCode | null {
  if (stock.warehouse_id !== count.warehouse_id) return 'WAREHOUSE_MISMATCH';
  if (stock.mode !== count.mode) return 'MODE_MISMATCH';
  // cutoff_id identik adalah syarat perlu, bukan bukti basis efektif (PR #14 §3).
  if (stock.cutoff_id !== count.cutoff_id) return 'CUTOFF_MISMATCH';
  // Kewenangan VERIFIED (OD-08) belum diputuskan dan ACTUAL ditahan: fail-closed.
  if (stock.mode !== 'UJI') return 'CUTOFF_UNVERIFIED';
  return null;
}

function validContext(context: ReconciliationContext): boolean {
  return (
    isText(context?.warehouse_id) &&
    isText(context?.cutoff_id) &&
    (context?.mode === 'UJI' || context?.mode === 'ACTUAL')
  );
}

interface ParsedStock {
  line: StockLineInput;
  quantity: bigint;
}

interface ParsedCount {
  line: CountLineInput;
  quantity: bigint | null;
}

type Reject = { ok: false; code: ReconciliationRejectCode; material_id?: string };

function reject(code: ReconciliationRejectCode, materialId?: string): Reject {
  return materialId === undefined
    ? { ok: false, code }
    : { ok: false, code, material_id: materialId };
}

/** Mengelompokkan per material; lebih dari satu baris pada satu sisi berarti grain ambigu. */
function indexByMaterial<T extends { line: { id: string; material_id: string } }>(
  items: T[],
): Map<string, T> | Reject {
  const byMaterial = new Map<string, T>();
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.line.id)) return reject('INVALID_FILE', item.line.material_id);
    ids.add(item.line.id);
    if (byMaterial.has(item.line.material_id))
      return reject('AMBIGUOUS_PAIR', item.line.material_id);
    byMaterial.set(item.line.material_id, item);
  }
  return byMaterial;
}

function parseStock(lines: readonly StockLineInput[]): ParsedStock[] | Reject {
  const parsed: ParsedStock[] = [];
  for (const line of lines) {
    if (!isText(line?.id) || !isText(line?.material_id) || !isText(line?.uom)) {
      return reject('INVALID_FILE', isText(line?.material_id) ? line.material_id : undefined);
    }
    // Nilai negatif diterima apa adanya; kebijakannya masih OD-05 dan tidak diputuskan di sini.
    const quantity = parseDecimal(line.system_quantity);
    if (quantity === null) return reject('INVALID_FILE', line.material_id);
    parsed.push({ line, quantity });
  }
  return parsed;
}

function parseCount(lines: readonly CountLineInput[]): ParsedCount[] | Reject {
  const parsed: ParsedCount[] = [];
  for (const line of lines) {
    if (!isText(line?.id) || !isText(line?.material_id) || !isText(line?.uom)) {
      return reject('INVALID_FILE', isText(line?.material_id) ? line.material_id : undefined);
    }
    if (typeof line.is_counted !== 'boolean') return reject('INVALID_FILE', line.material_id);
    if (!line.is_counted) {
      // Belum dihitung wajib null; nilai apa pun (termasuk "0") ditolak, tidak dibuang.
      if (line.physical_quantity !== null) return reject('NOT_COUNTED_VALUE', line.material_id);
      parsed.push({ line, quantity: null });
      continue;
    }
    const quantity = parseDecimal(line.physical_quantity);
    if (quantity === null || quantity < 0n) return reject('INVALID_FILE', line.material_id);
    parsed.push({ line, quantity });
  }
  return parsed;
}

function pairLine(
  materialId: string,
  stock: ParsedStock | undefined,
  count: ParsedCount | undefined,
): ReconciliationLineResult {
  const base = {
    material_id: materialId,
    stock_line_id: stock?.line.id ?? null,
    count_line_id: count?.line.id ?? null,
    system_quantity: stock ? formatDecimal(stock.quantity) : null,
    physical_quantity: count && count.quantity !== null ? formatDecimal(count.quantity) : null,
    stock_uom: stock?.line.uom ?? null,
    count_uom: count?.line.uom ?? null,
  };
  // Urutan mengikuti tabel keputusan DOC-08; sisi yang hilang tidak diisi nol.
  if (!stock) return { ...base, status: 'STOCK_MISSING', variance: null };
  if (!count) return { ...base, status: 'COUNT_MISSING', variance: null };
  // UOM dibandingkan persis; alias/konversi UOM belum disetujui (A.3).
  if (stock.line.uom !== count.line.uom) return { ...base, status: 'UOM_MISMATCH', variance: null };
  if (count.quantity === null) return { ...base, status: 'NOT_COUNTED', variance: null };
  const variance = count.quantity - stock.quantity;
  return {
    ...base,
    status: variance === 0n ? 'MATCHED' : 'DISCREPANCY',
    variance: formatDecimal(variance),
  };
}

/**
 * Membandingkan satu snapshot stok dengan satu sesi hitung pada konteks yang sama.
 * Seluruh run ditolak bila konteks berbeda, ACTUAL, grain ambigu, atau ada nilai tidak sah.
 */
export function reconcile(input: ReconciliationInput): ReconciliationResult {
  if (!validContext(input?.stock?.context) || !validContext(input?.count?.context)) {
    return reject('INVALID_FILE');
  }
  if (!Array.isArray(input.stock.lines) || !Array.isArray(input.count.lines)) {
    return reject('INVALID_FILE');
  }
  const contextRejection = contextCode(input.stock.context, input.count.context);
  if (contextRejection) return reject(contextRejection);

  const stockParsed = parseStock(input.stock.lines);
  if (!Array.isArray(stockParsed)) return stockParsed;
  const countParsed = parseCount(input.count.lines);
  if (!Array.isArray(countParsed)) return countParsed;

  const stockByMaterial = indexByMaterial(stockParsed);
  if (!(stockByMaterial instanceof Map)) return stockByMaterial;
  const countByMaterial = indexByMaterial(countParsed);
  if (!(countByMaterial instanceof Map)) return countByMaterial;

  const materials = [...new Set([...stockByMaterial.keys(), ...countByMaterial.keys()])].sort(
    (a, b) => (a < b ? -1 : a > b ? 1 : 0),
  );
  const lines = materials.map((materialId) =>
    pairLine(materialId, stockByMaterial.get(materialId), countByMaterial.get(materialId)),
  );
  return { ok: true, rule_version: RECONCILIATION_RULE_VERSION, lines };
}
