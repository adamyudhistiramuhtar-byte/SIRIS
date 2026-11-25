/**
 * Tipe lokal komponen alur impor bersama (SRS-53). Status: PROPOSED, bukan kontrak final.
 *
 * Tipe ini kompatibel secara struktur dengan boundary usulan PR #11
 * (`features/inbound/reference-import.ts` dan `import-wizard-contract.ts`), tetapi tidak
 * mengimpornya agar SRS-53 tidak menunggu PR tersebut merged. Penambahan di sini bersifat
 * opsional atau berupa status baru, sehingga nilai `ImportState` dari PR #11 tetap dapat
 * diberikan langsung ke `ImportWizard`.
 *
 * Penanda yang belum final dan sengaja dibuat extensible:
 * - Identitas warning: teks (bentuk PR #11) atau objek ber-ID. Lihat `warningId`.
 * - Status tambahan (`invalid`, `cancelling`, `cancelled`, `cancel-unknown`) dan status yang
 *   masih dibahas (VALIDATING/COMMITTING/CANCELLING di DOC-08). Status yang belum dikenal
 *   dikunci oleh komponen, bukan dianggap sukses.
 */

export type ImportMode = 'UJI' | 'ACTUAL';

export interface ImportContext {
  warehouseId: string;
  mode: ImportMode;
}

/** Warning berupa teks (PR #11) atau objek ber-ID; bentuk final menunggu keputusan PM. */
export type ImportWarning = string | { id: string; message: string };

/** Satu temuan validasi. Semua field selain pesan opsional agar tidak mengarang nilai. */
export interface ImportIssue {
  row?: number;
  field?: string;
  code?: string;
  message: string;
}

export interface ImportPreview {
  batchId: string;
  fingerprint: string;
  warnings: ImportWarning[];
  expiresAt?: string;
  /** Opsional: hanya ditampilkan bila layanan mengirimnya. */
  rowCount?: number;
  source?: string;
}

export interface ImportReceipt {
  batchId: string;
  state: 'COMMITTED';
}

export type ImportWizardState =
  | { phase: 'initial' }
  | { phase: 'uploading' | 'validating' | 'committing' }
  | { phase: 'invalid'; batchId: string; issues: ImportIssue[] }
  | { phase: 'preview'; preview: ImportPreview }
  | { phase: 'expired'; batchId: string }
  | { phase: 'success'; receipt: ImportReceipt }
  | { phase: 'error'; message: string }
  | { phase: 'unknown'; batchId: string; idempotencyKey: string }
  | { phase: 'preparation-unknown'; batchId?: string }
  | { phase: 'cancelling' | 'cancelled' | 'cancel-unknown'; batchId: string };

/** Tahap visual tepat empat (design.md §6.3); status proses dan nomor tahap adalah hal berbeda. */
export const IMPORT_STEPS = ['Pilih File', 'Hasil Validasi', 'Preview', 'Hasil Simpan'] as const;
export type ImportStep = 1 | 2 | 3 | 4;

/** Pemetaan status ke tahap. `undefined` berarti status belum dikenal dan harus dikunci. */
export function stepForPhase(phase: string): ImportStep | undefined {
  switch (phase) {
    case 'initial':
    case 'uploading':
    case 'error':
      return 1;
    case 'validating':
    case 'invalid':
    case 'preparation-unknown':
      return 2;
    case 'preview':
    case 'expired':
    case 'committing':
      return 3;
    case 'success':
    case 'unknown':
    case 'cancelling':
    case 'cancelled':
    case 'cancel-unknown':
      return 4;
    default:
      return undefined;
  }
}

export function warningId(warning: ImportWarning): string {
  return typeof warning === 'string' ? warning : warning.id;
}

export function warningMessage(warning: ImportWarning): string {
  return typeof warning === 'string' ? warning : warning.message;
}

/** Ukuran berkas untuk pembaca: B, KB, atau MB dengan koma desimal. */
export function formatFileSize(bytes: number): string {
  const round = (value: number) => String(Math.round(value * 10) / 10).replace('.', ',');
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${round(bytes / 1024)} KB`;
  return `${round(bytes / (1024 * 1024))} MB`;
}
