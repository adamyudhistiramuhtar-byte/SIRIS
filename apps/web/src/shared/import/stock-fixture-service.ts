/**
 * Layanan impor stok berbasis fixture UJI untuk halaman SRS-25 (UC-09). Status: PROPOSED.
 *
 * Ini adapter di sisi klien yang memenuhi `ImportFlowService`, BUKAN klien API. Tidak ada
 * pemanggilan jaringan, otorisasi server, staging, atau commit basis data. Hasilnya tidak
 * dapat dipakai sebagai bukti integrasi atau E2E.
 *
 * Batas yang dijaga:
 * - Hanya mode UJI. Mode ACTUAL ditolak (baseline: ACTUAL ditahan).
 * - `commit` tidak pernah menyatakan sukses: commit atomik dan audit menunggu SRS-52 dan
 *   SRS-54. Layanan mengembalikan galat yang jelas agar tidak ada simpan palsu.
 * - Warning OPTIONAL_COMPONENT_ABSENT selalu dikirim karena halaman ini hanya mengunggah
 *   komponen saldo; dukungan opsional tidak diunggah.
 */
import type { ImportContext } from './import-wizard-types';
import type { ImportFlowService } from './use-import-flow';
import { parseStockFixture, type ParsedStockFixture } from './stock-fixture-adapter';

export const OPTIONAL_COMPONENT_ABSENT_WARNING = {
  id: 'OPTIONAL_COMPONENT_ABSENT',
  message:
    'Komponen dukungan opsional (support_master, support_movement, support_wo) tidak diunggah. Saldo tetap dari QTY AKHIR.',
};

export const COMMIT_UNAVAILABLE_MESSAGE =
  'Simpan belum tersedia: commit atomik dan audit menunggu SRS-52 dan SRS-54. Pratinjau UJI ini tidak disimpan.';

/** Sumber baris untuk komponen preview, dibaca menurut batch aktif. */
export interface StockPreviewSource {
  get(batchId: string): ParsedStockFixture | undefined;
}

export function createStockFixtureService(): { service: ImportFlowService; source: StockPreviewSource } {
  const batches = new Map<string, ParsedStockFixture>();
  let counter = 0;

  async function readText(file: File): Promise<string> {
    if (typeof file.text === 'function') return file.text();
    // Lingkungan tanpa Blob.text (mis. jsdom lama): baca lewat FileReader.
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  const service: ImportFlowService = {
    async validate({ file, context, onProgress }: {
      file: File;
      context: ImportContext;
      signal: AbortSignal;
      onProgress: (percent: number) => void;
    }) {
      if (context.mode !== 'UJI') {
        return { phase: 'error', message: 'Mode ACTUAL belum diaktifkan. Gunakan mode UJI.' };
      }
      onProgress(100);
      const result = parseStockFixture(await readText(file));
      counter += 1;
      const batchId = `UJI-STK-BATCH-${String(counter).padStart(3, '0')}`;
      if (!result.ok) return { phase: 'invalid', batchId, issues: result.issues };
      batches.set(batchId, result.value);
      return {
        phase: 'preview',
        preview: {
          batchId,
          fingerprint: `uji-fixture:${batchId}:${result.value.rows.length}`,
          warnings: [OPTIONAL_COMPONENT_ABSENT_WARNING],
          rowCount: result.value.rows.length,
          source: result.value.sourceName ?? file.name,
        },
      };
    },
    async commit() {
      return { phase: 'error', message: COMMIT_UNAVAILABLE_MESSAGE };
    },
    async cancel({ batchId }: { batchId: string; signal: AbortSignal }) {
      batches.delete(batchId);
      return { phase: 'cancelled', batchId };
    },
    async status() {
      return { phase: 'error', message: 'Status batch tidak tersedia pada layanan fixture UJI.' };
    },
  };

  return { service, source: { get: (batchId) => batches.get(batchId) } };
}
