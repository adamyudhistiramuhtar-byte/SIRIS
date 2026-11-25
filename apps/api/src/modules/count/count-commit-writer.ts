/**
 * Port dan penulis domain COUNT saat commit (SRS-27, dipanggil dari SRS-52). Status: PROPOSED.
 *
 * Bentuk `write()` disiapkan agar dapat dibungkus menjadi `DomainCommitWriter` kind COUNT
 * milik SRS-52 (PR #46, belum merged) tanpa mengimpornya dari branch lain.
 *
 * Batas tanggung jawab:
 * - Validasi isi file COUNT adalah adapter staging #27 (zod strict + refine is_counted).
 *   Modul ini TIDAK mem-parse file dan tidak menduplikasi validator tersebut.
 * - `toCountLineDraft` hanya memeriksa invarian domain BR-INV-02 pada baris ternormalisasi
 *   sebelum menulis, selaras dengan CHECK count_lines DOC-07 (rancangan 010). Pelanggaran
 *   berarti data staging tidak sesuai kontrak dan ditolak INVALID_FILE (fail-closed).
 * - Tidak ada adapter ACTUAL; mode selain UJI ditolak.
 *
 * Kode error: INVALID_FILE, MISSING_REFERENCE, CUTOFF_UNVERIFIED dari katalog DOC-08;
 * INVALID_METADATA untuk cutoff_id hilang mengikuti keputusan Adam (komentar Jira
 * SRS-58 nomor 10152 butir 3).
 */
import type { CountLineRecord, CountMode, CountSessionRecord } from './count-contract.js';

export type CountCommitErrorCode = 'INVALID_FILE' | 'INVALID_METADATA' | 'MISSING_REFERENCE' | 'CUTOFF_UNVERIFIED';

export class CountCommitError extends Error {
  constructor(readonly code: CountCommitErrorCode) {
    super(code);
    this.name = 'CountCommitError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Batch COUNT yang sudah dikunci di transaksi commit. */
export interface CountCommitBatch {
  id: string;
  warehouse_id: string;
  mode: CountMode;
  cutoff_id: string | null;
}

/** Baris staging VALID beserta normalized payload dari adapter #27. */
export interface StagedCountRow {
  source_row_id: string;
  row_number: number;
  normalized: unknown;
}

export interface CountStagedRowReader<Tx> {
  /** Baris VALID batch ini, urut row_number, dibaca dengan client transaksi yang sama. */
  readValidRows(tx: Tx, batchId: string): Promise<readonly StagedCountRow[]>;
}

/** material_code sumber → materials.id UUID pada scope; null bila tidak ada (jangan buat master fiktif). */
export interface MaterialReferenceResolver<Tx> {
  resolve(tx: Tx, scope: { warehouse_id: string; mode: CountMode }, materialCode: string): Promise<string | null>;
}

export interface CountWriteStore<Tx> {
  insertSession(tx: Tx, session: CountSessionRecord): Promise<void>;
  insertLines(tx: Tx, lines: readonly CountLineRecord[]): Promise<void>;
}

export interface CountIdGenerator {
  next(): string;
}

/** Baris domain sebelum material_id diselesaikan. */
export interface CountLineDraft {
  material_code: string;
  uom: string;
  is_counted: boolean;
  physical_quantity: string | null;
}

/** numeric(20,6) nonnegatif sebagai string desimal persis (DOC-07 count_lines). */
const NONNEGATIVE_DECIMAL = /^\d{1,14}(?:\.\d{1,6})?$/;
const DRAFT_KEYS = ['is_counted', 'material_code', 'physical_quantity', 'uom'];

/**
 * Invarian BR-INV-02: is_counted eksplisit; true → physical_quantity desimal >= 0;
 * false → physical_quantity null. physical_quantity wajib ada sebagai key (tidak ada ≠ null).
 * Nilai tidak pernah diubah: null tetap null, "0.000000" tetap nol sah.
 */
export function toCountLineDraft(normalized: unknown): CountLineDraft {
  if (typeof normalized !== 'object' || normalized === null || Array.isArray(normalized)) throw new CountCommitError('INVALID_FILE');
  const keys = Object.keys(normalized).sort();
  if (keys.length !== DRAFT_KEYS.length || keys.some((key, index) => key !== DRAFT_KEYS[index])) throw new CountCommitError('INVALID_FILE');
  const { material_code: code, uom, is_counted: counted, physical_quantity: quantity } = normalized as Record<string, unknown>;
  if (typeof code !== 'string' || code.length === 0 || typeof uom !== 'string' || uom.length === 0 || typeof counted !== 'boolean') {
    throw new CountCommitError('INVALID_FILE');
  }
  if (counted) {
    if (typeof quantity !== 'string' || !NONNEGATIVE_DECIMAL.test(quantity)) throw new CountCommitError('INVALID_FILE');
  } else if (quantity !== null) {
    throw new CountCommitError('INVALID_FILE');
  }
  return { material_code: code, uom, is_counted: counted, physical_quantity: counted ? (quantity as string) : null };
}

export class CountCommitWriter<Tx> {
  readonly kind = 'COUNT' as const;

  constructor(private readonly deps: {
    rows: CountStagedRowReader<Tx>;
    materials: MaterialReferenceResolver<Tx>;
    store: CountWriteStore<Tx>;
    ids: CountIdGenerator;
  }) {}

  /**
   * Menulis satu count_sessions dan seluruh count_lines dalam transaksi pemanggil.
   * Semua baris divalidasi dan direferensikan dulu; tidak ada penulisan sebelum semuanya sah.
   */
  async write(tx: Tx, batch: CountCommitBatch): Promise<{ committed_count: number; session_id: string }> {
    // ACTUAL ditahan sesuai baseline; tidak ada adapter ACTUAL.
    if (batch.mode !== 'UJI') throw new CountCommitError('CUTOFF_UNVERIFIED');
    if (typeof batch.cutoff_id !== 'string' || batch.cutoff_id.length === 0) throw new CountCommitError('INVALID_METADATA');

    const staged = await this.deps.rows.readValidRows(tx, batch.id);
    const drafts = staged.map((row) => ({ row, draft: toCountLineDraft(row.normalized) }));

    const scope = { warehouse_id: batch.warehouse_id, mode: batch.mode };
    const resolved = new Map<string, string>();
    for (const { draft } of drafts) {
      if (resolved.has(draft.material_code)) continue;
      const materialId = await this.deps.materials.resolve(tx, scope, draft.material_code);
      if (materialId === null) throw new CountCommitError('MISSING_REFERENCE');
      resolved.set(draft.material_code, materialId);
    }

    const session: CountSessionRecord = {
      id: this.deps.ids.next(),
      batch_id: batch.id,
      cutoff_id: batch.cutoff_id,
      warehouse_id: batch.warehouse_id,
      mode: batch.mode,
    };
    const lines: CountLineRecord[] = drafts.map(({ row, draft }) => ({
      id: this.deps.ids.next(),
      session_id: session.id,
      material_id: resolved.get(draft.material_code) as string,
      uom: draft.uom,
      is_counted: draft.is_counted,
      physical_quantity: draft.physical_quantity,
      source_row_id: row.source_row_id,
    }));

    await this.deps.store.insertSession(tx, session);
    await this.deps.store.insertLines(tx, lines);
    return { committed_count: lines.length, session_id: session.id };
  }
}
