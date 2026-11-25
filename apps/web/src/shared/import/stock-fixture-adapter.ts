/**
 * Adapter fixture saldo stok QTY AKHIR untuk halaman impor stok (SRS-25, UC-09). Status: PROPOSED.
 *
 * Mencerminkan bentuk fixture UJI `proposed-0.1` (SRS-37) yang juga dipahami adapter API
 * (`FixtureSourceAdapter('STOCK')`): berkas JSON dengan `kind: 'STOCK'`, `contract_version`,
 * `rows[]` berisi `row_number` dan `normalized` {material_code, uom, system_quantity}, serta
 * `metadata.cutoff_id`. Ini BUKAN parser CSV/XLSX dan tidak menebak header mitra.
 *
 * Batas yang dijaga:
 * - `system_quantity` hanya berasal dari QTY AKHIR dan tidak pernah dijumlah atau dihitung.
 * - Keputusan PM 25 November: metadata tanpa `cutoff_id` ditolak `INVALID_METADATA`; isi berkas
 *   yang tidak valid tetap `INVALID_FILE`.
 * - Pemeriksaan referensi material (`MISSING_REFERENCE`) memerlukan himpunan referensi dari
 *   layanan dan tidak dilakukan di sisi klien.
 * - Komponen dukungan opsional (support_*) tidak diunggah lewat halaman ini; ketiadaannya
 *   hanya menjadi warning, bukan kegagalan.
 */
import type { ImportIssue } from './import-wizard-types';
import type { StockPreviewCutoff, StockPreviewRow } from './stock-preview-types';

export const STOCK_FIXTURE_VERSION = 'proposed-0.1';

export interface ParsedStockFixture {
  rows: StockPreviewRow[];
  cutoff: StockPreviewCutoff;
  sourceName?: string;
}

export type StockFixtureResult =
  | { ok: true; value: ParsedStockFixture }
  | { ok: false; issues: ImportIssue[] };

const TEXT_MAX = 128;
// Representasi desimal persis seperti adapter API: tanpa lewat Number, tanpa tebakan locale.
const DECIMAL = /^-?(?:0|[1-9]\d{0,13})(?:\.\d{1,6})?$/;
const NORMALIZED_KEYS = ['material_code', 'uom', 'system_quantity'];

function invalidFile(message: string, extra: Partial<ImportIssue> = {}): StockFixtureResult {
  return { ok: false, issues: [{ code: 'INVALID_FILE', message, ...extra }] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= TEXT_MAX;
}

export function parseStockFixture(text: string): StockFixtureResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return invalidFile('Isi berkas bukan JSON yang dapat dibaca.');
  }
  if (!isRecord(data)) return invalidFile('Isi berkas harus berupa objek JSON.');
  if (data.kind !== 'STOCK') return invalidFile('Jenis berkas harus STOCK.', { field: 'kind' });
  if (data.contract_version !== STOCK_FIXTURE_VERSION) {
    return invalidFile(`Versi kontrak harus ${STOCK_FIXTURE_VERSION}.`, { field: 'contract_version' });
  }
  if (!Array.isArray(data.rows) || data.rows.length === 0) {
    return invalidFile('Berkas harus memuat minimal satu baris saldo.', { field: 'rows' });
  }

  const issues: ImportIssue[] = [];
  const seen = new Set<number>();
  const rows: StockPreviewRow[] = [];

  data.rows.forEach((entry: unknown, index: number) => {
    const position = index + 1;
    if (!isRecord(entry)) {
      issues.push({ row: position, code: 'INVALID_FILE', message: 'Baris harus berupa objek.' });
      return;
    }
    const rowNumber = entry.row_number;
    if (typeof rowNumber !== 'number' || !Number.isSafeInteger(rowNumber) || rowNumber <= 0) {
      issues.push({ row: position, field: 'row_number', code: 'INVALID_FILE', message: 'Nomor baris harus bilangan bulat positif.' });
      return;
    }
    if (seen.has(rowNumber)) {
      issues.push({ row: rowNumber, field: 'row_number', code: 'INVALID_FILE', message: 'Nomor baris ganda.' });
      return;
    }
    seen.add(rowNumber);
    if (entry.component !== undefined && entry.component !== 'balance') {
      issues.push({ row: rowNumber, field: 'component', code: 'INVALID_FILE', message: 'Komponen baris harus balance.' });
      return;
    }
    const normalized = entry.normalized;
    if (!isRecord(normalized) || Object.keys(normalized).some((key) => !NORMALIZED_KEYS.includes(key))) {
      issues.push({ row: rowNumber, field: 'normalized', code: 'INVALID_FILE', message: 'Baris harus memuat tepat material_code, uom, dan system_quantity.' });
      return;
    }
    const { material_code: materialCode, uom, system_quantity: quantity } = normalized;
    if (!isText(materialCode)) {
      issues.push({ row: rowNumber, field: 'material_code', code: 'INVALID_FILE', message: 'Kode material wajib diisi (1 sampai 128 karakter).' });
      return;
    }
    if (!isText(uom)) {
      issues.push({ row: rowNumber, field: 'uom', code: 'INVALID_FILE', message: 'Satuan wajib diisi (1 sampai 128 karakter).' });
      return;
    }
    if (typeof quantity !== 'string' || !DECIMAL.test(quantity)) {
      issues.push({ row: rowNumber, field: 'system_quantity', code: 'INVALID_FILE', message: 'QTY AKHIR harus berupa bilangan desimal dengan paling banyak 6 digit pecahan.' });
      return;
    }
    rows.push({ rowNumber, materialCode, uom, systemQuantity: quantity });
  });

  if (issues.length > 0) return { ok: false, issues };

  const metadata = isRecord(data.metadata) ? data.metadata : {};
  if (!isText(metadata.cutoff_id)) {
    return {
      ok: false,
      issues: [{ code: 'INVALID_METADATA', field: 'cutoff_id', message: 'Metadata wajib memuat cutoff_id untuk impor STOCK.' }],
    };
  }

  return {
    ok: true,
    value: {
      rows,
      cutoff: { cutoffId: metadata.cutoff_id },
      sourceName: isText(metadata.source_name) ? metadata.source_name : undefined,
    },
  };
}
