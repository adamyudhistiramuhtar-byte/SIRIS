/**
 * SRS-52 Fase B — tes PostgreSQL yang BELUM dibuat. Sengaja ditulis sebagai `it.todo`
 * agar terlihat sebagai TODO pada laporan vitest, bukan skip diam-diam.
 *
 * Prasyarat (development-docs/KONTRAK_SCHEMA_012_IDEMPOTENCY_SRS-52.md §8):
 * migrasi 004–008 dan staging #27 tersedia di basis branch, file migrasi 012 disetujui,
 * dan jawaban Adam atas komentar Jira SRS-52 nomor 10198.
 */
import { describe, it } from 'vitest';

describe('SRS-52 Fase B: migrasi 012 pada PostgreSQL 16.6 UJI (TODO)', () => {
  it.todo('012 menolak data idempotency_records lama yang tidak memenuhi syarat secara atomik');
  it.todo('012 mengganti UNIQUE global idempotency_key menjadi UNIQUE (actor_id, operation, idempotency_key)');
  it.todo('key sama dengan actor berbeda diterima; key sama, actor dan operation sama ditolak 23505');
  it.todo('request_hash wajib 64 karakter hex dan actor_id NOT NULL');
  it.todo('reapply 012 aman dan checksum ledger 001–011 tidak berubah');
});

describe('SRS-52 Fase B: service di atas adapter PostgreSQL (TODO)', () => {
  it.todo('dua koneksi paralel key sama + body sama: satu penulisan domain, respons identik');
  it.todo('dua koneksi paralel key sama + body beda: satu sukses, satu IDEMPOTENCY_CONFLICT (409)');
  it.todo('unique violation 23505 dari adapter dipetakan ke IdempotencyKeyTakenError, bukan dicetak');
  it.todo('COMMIT terputus (unknown) tidak menulis audit FAILURE; retry key sama mengembalikan replay');
  it.todo('fault injection di setiap langkah tidak meninggalkan domain, lineage, audit SUCCESS, atau record idempotency');
  it.todo('audit SUCCESS hanya ada bila domain ter-commit; audit FAILURE ditulis pada koneksi baru setelah rollback');
  it.todo('commit vs cancel paralel pada batch sama: tepat satu state terminal (SELECT … FOR UPDATE)');
  it.todo('pembacaan staging/preview memakai client transaksi di dalam BEGIN (guard readOwnedStaging, butir 2)');
});
