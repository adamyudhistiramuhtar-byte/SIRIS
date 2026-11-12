# Migrasi Referensi dan Pemisahan ACTUAL/UJI — SRS-44

| Atribut | Nilai |
| --- | --- |
| Issue | [SRS-44](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-44) (T-10), parent SRS-4 / EPIC-01 |
| Status | **IMPLEMENTASI AWAL — NEEDS REVIEW** (belum di-push, belum ada PR, belum merged) |
| Tanggal | 12 November 2026, Asia/Jakarta |
| Baseline | `origin/develop` @ `43e9382` |
| Pemilik | Backend & Database (Dwi Rani Amelia) |

## 1. Dependensi

| Dependensi | Status | Dampak |
| --- | --- | --- |
| SRS-37 — kontrak sumber, [PR #13](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/13) | **OPEN, belum merged** | Nama `kind` dan kode seed UJI mengikuti kontrak `proposed-0.1` di PR #13. Bila kontrak berubah saat review, migrasi dan seed SRS-44 perlu disesuaikan. Link Jira: SRS-37 memblokir SRS-44. |
| SRS-41 — repository dan CI | Done | — |
| SRS-38 — cutoff, evidence, identitas hasil, [PR #14](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/14) | OPEN; D-01–D-06 PROPOSED | `cutoff_contexts` ditahan (F-03) |
| SRS-43 — layanan Express (Luthfi) | Branch belum di-PR | Branch SRS-43 juga mengubah `.env.example`; potensi konflik satu baris pada `DATABASE_MIGRATION_URL` |

## 2. Keputusan yang diterapkan

| ID | Keputusan | Status | Bukti |
| --- | --- | --- | --- |
| F-01 | Kolom `import_batches.import_type` diganti `kind` dengan nilai `EXPECTED`, `COMMITMENT`, `RECEIVING`, `STOCK`, `COUNT` | ACCEPTED | Adam, 12 Nov 2026, chat tim; dicatat di `KONTRAK_SUMBER_SRS-37.md` (PR #13) |
| — | Versi PostgreSQL 16.6 untuk lingkungan UJI lokal | PROPOSED | OD-07 OPEN |
| — | Migrasi manual berurutan tanpa runner baru | PROPOSED | SRS40-ADR-03 PROPOSED; tidak menambah dependency |

## 3. Perubahan

| Berkas | Perubahan |
| --- | --- |
| `database/migrations/001_initial_schema.sql` | Hanya penamaan `kind` sesuai F-01. Bagian lain tidak diubah. |
| `database/migrations/002_reference_masters.sql` | Tabel `materials` dan `suppliers` sesuai DOC-07: `code`, `mode` (ACTUAL/UJI), `name`; unique (`mode`, `code`); CHECK kode/nama tidak kosong. |
| `database/seeds/002_reference_masters_uji.sql` | Material `UJI-MAT-01..03` dan supplier `UJI-SUP-01..02`, seluruhnya `mode = 'UJI'`. |
| `tests/integration/database/migrations.test.ts` | Test migrasi + reapply dalam transaksi ROLLBACK, penolakan nama `kind` lama, isolasi ACTUAL/UJI, seed hanya UJI, role runtime bukan superuser. |
| `database/README.md` | Pemisahan role, urutan migrasi, cara eksekusi, lingkungan Docker UJI. |
| `.env.example` | Kunci kosong `DATABASE_MIGRATION_URL`. |

Pemisahan ACTUAL/UJI pada referensi: kode yang sama boleh ada di kedua mode sebagai baris berbeda dan unik di dalam satu mode. Penegakan bahwa domain hanya menunjuk referensi dengan mode yang sama (FK komposit atau trigger) belum dibuat. DOC-07 menyerahkannya ke service/transaksi, dan tabel domain belum ada.

## 4. Bagian yang ditahan dan selisih yang belum diselesaikan

| ID | Selisih migrasi 001 terhadap DOC-07/08 | Penanganan |
| --- | --- | --- |
| F-03 | `cutoff_contexts.cutoff_time TIME NOT NULL`, `status` tanpa CHECK | **Ditahan** sampai D-01/D-02 SRS-38 diputuskan |
| G-44-01 | `users` memakai `username`/`password_hash`; DOC-07 memakai `subject` | Bergantung keputusan autentikasi (SRS-47, Luthfi; ADR-02 PROPOSED) |
| G-44-02 | Status batch `STAGED/VALIDATED/COMMITTED/CANCELLED` vs state machine DOC-08 | Scope SRS-50 |
| G-44-03 | `idempotency_records` unique hanya `idempotency_key`; DOC-07 (`actor_id`, `operation`, `idempotency_key`) + `request_hash` | Scope SRS-52 |
| G-44-04 | FK `ON DELETE CASCADE` pada `user_warehouses`, `staging_rows`, `validation_issues`; DOC-07 RESTRICT | Perlu keputusan; tidak diubah tanpa review |
| G-44-05 | `staging_rows` belum punya `component`, `normalized`; batch belum punya `source_hash` | Scope SRS-50 |
| F-02 | Fixture lama `inbound_sample_uji.json` memakai field tanpa sumber | Tidak diubah |

## 5. Bukti verifikasi

Lingkungan: Docker Desktop 29.8.0, container `siris-pg-uji` (`postgres:16.6`, `127.0.0.1:55432`), database `siris_uji`; Node v24.18.0 (bukan Node 22 yang ACCEPTED; lihat SRS-40).

| Pemeriksaan | Hasil |
| --- | --- |
| Migrasi 001, 002 + seed 001, 002 sebagai `siris_migrator` (putaran 1) | PASS, exit 0 |
| Reapply putaran 2 | PASS, exit 0; hanya NOTICE "already exists"; jumlah baris tetap (materials 3, suppliers 2, warehouses 2, users 3) |
| Pemilik seluruh tabel `public` | `siris_migrator` (0 tabel milik role lain) |
| Atribut role | `siris_app` dan `siris_migrator`: bukan superuser, tidak dapat membuat database maupun role |
| `siris_app` membuat tabel | Ditolak (SQLSTATE 42501) |
| `npm run test:integration` | PASS — 3 file, 10 test (8 test SRS-44) |
| Test SRS-44 tanpa variabel DB | 8 *skipped* (bukan PASS) |
| Data setelah test | Tidak berubah (ROLLBACK terbukti: `import_batches` = 0) |

Batas bukti: CI GitHub tidak menyediakan PostgreSQL, sehingga di CI test SRS-44 berstatus *skipped*. Bukti di atas berasal dari lingkungan UJI lokal pada commit branch ini, bukan dari CI.

## 6. Status acceptance criteria SRS-44

| Kriteria (Jira) | Status |
| --- | --- |
| Migrasi/reapply diuji pada DB terisolasi | Terpenuhi secara lokal (§5) |
| Referensi dan mode konsisten | Sebagian: referensi `materials`/`suppliers` dengan mode tersedia; cutoff ditahan (F-03); penegakan mode lintas tabel menunggu tabel domain |
| Seed sintetis berlabel UJI | Terpenuhi untuk seed 002; seed 001 berlabel UJI pada nama |
| Runtime DB bukan superuser | Terpenuhi (§5) |

Definition of Done belum terpenuhi: diperlukan review oleh reviewer lain, PR merged, PR #13 merged, dan keputusan F-03.
