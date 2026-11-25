/**
 * SRS-29 — tes PostgreSQL yang BELUM dibuat. Ditulis sebagai `it.todo` agar terlihat
 * sebagai TODO pada laporan vitest, bukan skip diam-diam.
 *
 * Prasyarat (development-docs/KONTRAK_SCHEMA_011_RECONCILIATION_SRS-29.md §8): migrasi
 * 004–010 tersedia, bentuk 011 dan 012 diputuskan, serta audit #22 merged.
 */
import { describe, it } from 'vitest';

describe('SRS-29: migrasi 011 pada PostgreSQL 16.6 UJI (TODO)', () => {
  it.todo('011 membuat reconciliation_runs dengan UNIQUE identity_hash dan FK snapshot/sesi/users');
  it.todo('reconciliation_lines UNIQUE (run_id, material_id) menolak dua baris material sama');
  it.todo('CHECK status enam nilai; status valid wajib dua sisi dan variance nonnull; nonvalid wajib variance null');
  it.todo('trigger append-only menolak UPDATE/DELETE/TRUNCATE pada runs dan lines, termasuk oleh owner');
  it.todo('reapply 011 aman dan checksum ledger 001–010 tidak berubah');
});

describe('SRS-29: service di atas adapter PostgreSQL (TODO)', () => {
  it.todo('dua koneksi paralel input identik dengan key berbeda: satu run, unique 23505 diulang sekali lalu reuse');
  it.todo('dua koneksi paralel key sama + input berbeda: satu run, satu IDEMPOTENCY_CONFLICT');
  it.todo('fault injection di setiap langkah tidak meninggalkan run, lines, key, atau audit SUCCESS');
  it.todo('COMMIT terputus tidak menulis audit FAILURE; retry key sama memakai ulang run');
  it.todo('snapshot/sesi dibaca FOR SHARE dengan client transaksi yang sama');
  it.todo('otorisasi memakai sesi dan assignment nyata (SRS-47/48), bukan fake');
});
