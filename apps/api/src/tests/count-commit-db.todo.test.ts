/**
 * SRS-27 — tes PostgreSQL yang BELUM dibuat. Ditulis sebagai `it.todo` agar terlihat
 * sebagai TODO pada laporan vitest, bukan skip diam-diam.
 *
 * Prasyarat (development-docs/KONTRAK_SCHEMA_010_COUNT_SRS-27.md §7): migrasi 004–009
 * dan staging #27 tersedia, bentuk 010 disetujui reviewer, SRS-52 menyediakan transaksi commit.
 */
import { describe, it } from 'vitest';

describe('SRS-27: migrasi 010 pada PostgreSQL 16.6 UJI (TODO)', () => {
  it.todo('count_sessions UNIQUE batch_id; FK batch kind COUNT dan cutoff_contexts');
  it.todo('count_lines CHECK BR-INV-02: true+0 diterima, false+null diterima, false+0 dan true+null ditolak 23514');
  it.todo('count_lines UNIQUE (session_id, material_id, uom) dan FK materials, staging_rows');
  it.todo('physical_quantity numeric(20,6) menolak nilai negatif');
  it.todo('reapply 010 aman dan checksum ledger 001–009 tidak berubah');
});

describe('SRS-27: CountCommitWriter di atas adapter PostgreSQL (TODO)', () => {
  it.todo('commit COUNT menulis sesi + baris + source_row dalam transaksi SRS-52; rollback tidak meninggalkan baris');
  it.todo('referensi material diselesaikan ke materials.id pada gudang/mode batch, bukan kode fixture');
  it.todo('repository baca (findSession/listLines) mengembalikan null tetap null setelah commit nyata');
});
