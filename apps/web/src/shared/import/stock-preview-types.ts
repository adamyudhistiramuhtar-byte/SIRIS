/**
 * Tipe lokal komponen preview saldo dan cutoff impor stok (SRS-83). Status: PROPOSED.
 *
 * Mengikuti kontrak kandidat SRS-58 `proposed-0.1` (PR #20, SHA sumber 3099525):
 * `NormalizedSTOCK` (material_code, uom, system_quantity) dan metadata `cutoff_id`.
 * Kontrak itu belum disahkan; bentuk final menunggu keputusan PM.
 *
 * Batas yang dijaga:
 * - Kuantitas berupa string desimal dari layanan. Komponen tidak mengubahnya menjadi angka
 *   dan tidak menjumlah atau menghitung movement (AC SRS-83).
 * - `null` berarti nilai tidak ada, bukan nol.
 * - Cutoff berupa tanggal saja bila layanan hanya mengirim tanggal. Jam tidak dikarang
 *   (CF-04 OPEN).
 */

export type StockPreviewMode = 'UJI' | 'ACTUAL';

export interface StockPreviewRow {
  /** Nomor baris sumber (>0 pada kontrak). */
  rowNumber: number;
  materialCode: string;
  uom: string;
  /** String desimal dengan paling banyak 6 digit pecahan, atau null bila tidak ada. */
  systemQuantity: string | null;
}

export interface StockPreviewCutoff {
  cutoffId: string;
  /** Tanggal `YYYY-MM-DD` bila layanan mengirimnya. */
  date?: string;
  /** Jam `HH:mm` hanya bila layanan mengirimnya; tidak pernah diturunkan dari tanggal. */
  time?: string;
  timezone?: string;
}

/** Kuantitas yang sah menurut pola kontrak: bilangan desimal dengan maksimal enam pecahan. */
const QUANTITY_PATTERN = /^-?\d+(\.\d{1,6})?$/;

export type FormattedQuantity =
  | { kind: 'value'; text: string }
  | { kind: 'absent' }
  | { kind: 'invalid'; raw: string };

/**
 * Format tampilan id-ID (titik ribuan, koma desimal) murni dengan manipulasi string agar
 * tidak ada kehilangan presisi. Nilai yang tidak sesuai pola ditandai `invalid`, bukan dikoreksi.
 */
export function formatQuantity(value: string | null | undefined): FormattedQuantity {
  if (value === null || value === undefined) return { kind: 'absent' };
  if (!QUANTITY_PATTERN.test(value)) return { kind: 'invalid', raw: value };
  const negative = value.startsWith('-');
  const [integer, fraction] = (negative ? value.slice(1) : value).split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return { kind: 'value', text: `${negative ? '-' : ''}${grouped}${fraction ? `,${fraction}` : ''}` };
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** Tanggal `YYYY-MM-DD` menjadi "24 November 2026" tanpa objek Date (tanpa pergeseran zona). */
export function formatCutoffDate(value: string | undefined): string | null {
  if (value === undefined) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${day} ${MONTHS[month - 1]} ${match[1]}`;
}
