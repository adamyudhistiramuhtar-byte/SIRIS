/**
 * Kontrak data COUNT untuk SRS-27 (UC-10) dan konsumen SRS-29. Status: PROPOSED.
 *
 * Sumber: DOC-07 count_sessions/count_lines, DOC-09 CountSession dan NormalizedCOUNT,
 * DOC-05 BR-INV-02 (nol fisik berbeda dari belum dihitung).
 *
 * Modul ini sengaja tidak memvalidasi isi file COUNT: validasi staging ada di adapter
 * PR #27 (fixture-source-adapter.ts) dan aturan tabel menjadi CHECK DOC-07 pada migrasi
 * yang nomornya belum disepakati. Pemeta di bawah hanya membentuk DTO tanpa mengubah nilai;
 * physical_quantity null tetap null dan tidak pernah diganti 0.
 *
 * Di luar cakupan: adapter ACTUAL (header Erasoft SOURCE REQUIRED), penulisan sesi/baris
 * saat commit (SRS-52), migrasi tabel, dan layar.
 */
import type pg from 'pg';

export type CountMode = 'ACTUAL' | 'UJI';

/** Klien kueri; implementasi memakai client transaksi yang sama dengan pemanggil. */
export type CountQueryClient = Pick<pg.PoolClient, 'query'>;

/** Baris count_sessions DOC-07; warehouse_id dan mode diturunkan dari import_batches. */
export interface CountSessionRecord {
  id: string;
  batch_id: string;
  cutoff_id: string;
  warehouse_id: string;
  mode: CountMode;
}

/** Baris count_lines DOC-07. physical_quantity berupa desimal string numeric(20,6). */
export interface CountLineRecord {
  id: string;
  session_id: string;
  material_id: string;
  uom: string;
  is_counted: boolean;
  physical_quantity: string | null;
  source_row_id: string;
}

/** DTO CountSession DOC-09: hanya id, cutoff_id, mode; batch dan scope tidak dibocorkan. */
export interface CountSessionDto {
  id: string;
  cutoff_id: string;
  mode: CountMode;
}

/** Bentuk baris yang dibaca engine rekonsiliasi SRS-29 (PROPOSED, lihat PR #36). */
export interface CountLineForReconciliation {
  id: string;
  material_id: string;
  uom: string;
  is_counted: boolean;
  physical_quantity: string | null;
}

export interface CountScope {
  warehouse_id: string;
  mode: CountMode;
}

/**
 * Interface baca untuk sesi hitung. Implementasi PostgreSQL menunggu migrasi tabel
 * count_sessions/count_lines; penulisan saat commit menjadi bagian SRS-52.
 */
export interface CountRepository {
  /**
   * Mengembalikan sesi hanya bila berada pada gudang dan mode scope pemanggil.
   * Sesi di luar scope dan sesi yang tidak ada sama-sama menghasilkan null.
   */
  findSession(
    client: CountQueryClient,
    scope: CountScope,
    sessionId: string,
  ): Promise<CountSessionRecord | null>;
  /** Baris satu sesi, urut material_id lalu uom; nilai null dipertahankan. */
  listLines(client: CountQueryClient, sessionId: string): Promise<CountLineRecord[]>;
}

export function toCountSessionDto(record: CountSessionRecord): CountSessionDto {
  return { id: record.id, cutoff_id: record.cutoff_id, mode: record.mode };
}

export function toReconciliationCountLine(record: CountLineRecord): CountLineForReconciliation {
  return {
    id: record.id,
    material_id: record.material_id,
    uom: record.uom,
    is_counted: record.is_counted,
    physical_quantity: record.physical_quantity,
  };
}
