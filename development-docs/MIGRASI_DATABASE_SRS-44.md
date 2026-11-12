# Migrasi Referensi dan Pemisahan ACTUAL/UJI — SRS-44

| Atribut | Nilai |
| --- | --- |
| Issue | [SRS-44](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-44) (T-10), parent SRS-4 / EPIC-01 |
| Status | **NEEDS REVIEW** — [PR #15](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/15) Draft, belum merged |
| Tanggal | 12 November 2026, Asia/Jakarta |
| Baseline | `origin/develop` @ `761a183` (disusulkan dengan merge biasa) |
| Pemilik | Backend & Database (Dwi Rani Amelia) |

## 1. Dependensi

| Dependensi | Status | Dampak |
| --- | --- | --- |
| SRS-37 — kontrak sumber, [PR #13](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/13) | **Merged** ke `develop` (`761a183`, 12 Nov 2026), di-approve Adam sebagai kontrak PROPOSED | Nama `kind` dan kode seed UJI mengikuti kontrak `proposed-0.1`. Kontrak tetap PROPOSED dengan gap SOURCE REQUIRED; bila berubah, migrasi dan seed SRS-44 perlu disesuaikan. |
| SRS-41 — repository dan CI | Done | — |
| SRS-38 — cutoff, evidence, identitas hasil, [PR #14](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/14) | OPEN; D-01–D-06 PROPOSED | `cutoff_contexts` ditahan (F-03) |
| SRS-43 — layanan Express (Luthfi) | Branch belum di-PR | Branch SRS-43 juga mengubah `.env.example`; potensi konflik satu baris pada `DATABASE_MIGRATION_URL` |

## 2. Keputusan yang diterapkan

| ID | Keputusan | Status | Bukti |
| --- | --- | --- | --- |
| F-01 | Kolom `import_batches.import_type` diganti `kind` dengan nilai `EXPECTED`, `COMMITMENT`, `RECEIVING`, `STOCK`, `COUNT` | ACCEPTED | Adam, 12 Nov 2026, chat tim; dicatat di `KONTRAK_SUMBER_SRS-37.md` (PR #13, merged) |
| — | Migrasi yang sudah ada di `develop` tidak disunting; perubahan schema dilakukan dengan migrasi upgrade baru (003) | Diterapkan atas review PR #15 | Review Adam, 12 Nov 2026 |
| — | Versi PostgreSQL 16.6 untuk lingkungan UJI lokal | PROPOSED | OD-07 OPEN |
| — | Migrasi manual berurutan tanpa runner baru | PROPOSED | SRS40-ADR-03 PROPOSED; tidak menambah dependency |

## 3. Perubahan

| Berkas | Perubahan |
| --- | --- |
| `database/migrations/001_initial_schema.sql` | **Tidak diubah**; identik dengan versi `develop` (masih `import_type`). |
| `database/migrations/002_reference_masters.sql` | Tabel `materials` dan `suppliers` sesuai DOC-07: `code`, `mode` (ACTUAL/UJI), `name`; unique (`mode`, `code`); CHECK kode/nama tidak kosong. |
| `database/migrations/003_import_batches_kind.sql` | Upgrade `import_type` → `kind` (F-01) dalam satu blok atomik. Memeriksa kondisi terlebih dahulu: schema lama di-upgrade (pemetaan INBOUND_REFERENCE→EXPECTED, SUPPLIER_COMMITMENT→COMMITMENT, PHYSICAL_COUNT→COUNT; RECEIVING/STOCK tetap; CHECK diganti; data dan FK dipertahankan); schema yang sudah memakai `kind` hanya diverifikasi; kondisi parsial/tidak dikenal dihentikan tanpa perubahan. Mencetak inventaris sebelum/sesudah dan memverifikasi jumlah baris. Tidak men-drop tabel. |
| `database/seeds/002_reference_masters_uji.sql` | Material `UJI-MAT-01..03` dan supplier `UJI-SUP-01..02`, seluruhnya `mode = 'UJI'`. |
| `tests/integration/database/migrations.test.ts` | Setiap skenario pada schema sementara dalam transaksi ROLLBACK: instalasi bersih + reapply, penolakan nama `kind` lama, isolasi ACTUAL/UJI, seed hanya UJI, **upgrade dari 001 lama berisi data** (pemetaan, FK, reapply), **fail-closed** (kondisi parsial, `kind` tanpa CHECK, tabel tidak ada), serta role runtime bukan superuser. |
| `database/README.md` | Pemisahan role, aturan "migrasi yang sudah dipublikasikan tidak diubah", urutan migrasi 001–003, inventarisasi sebelum upgrade, cara eksekusi, lingkungan Docker UJI. |
| `.env.example` | Kunci kosong `DATABASE_MIGRATION_URL`. |

Pemisahan ACTUAL/UJI pada referensi: kode yang sama boleh ada di kedua mode sebagai baris berbeda dan unik di dalam satu mode. Penegakan bahwa domain hanya menunjuk referensi dengan mode yang sama (FK komposit atau trigger) belum dibuat. DOC-07 menyerahkannya ke service/transaksi, dan tabel domain belum ada.

Tabel `suppliers` dan `materials` hanya menyediakan struktur; belum ada sumber master ACTUAL yang terverifikasi untuk mengisinya. Menurut review PR #13, daftar distributor yang dilaporkan **bukan** master supplier dan daftar barang belum diperiksa, sehingga keduanya tidak dipakai sebagai seed ACTUAL. Seed saat ini hanya data sintetis UJI.

### 3.1 Koreksi asumsi (review PR #15)

Versi awal PR ini menyunting `001_initial_schema.sql` dengan asumsi bahwa migrasi 001 belum pernah dijalankan di lingkungan mana pun. Asumsi tersebut **tidak didukung bukti**. Review Adam menunjukkan bahwa database yang sudah menjalankan 001 lama tidak ter-upgrade oleh 001 baru karena `CREATE TABLE IF NOT EXISTS` melewati tabel yang sudah ada. Pendekatan diganti: 001 dikembalikan ke versi `develop`, dan perubahan dilakukan melalui migrasi 003 yang menangani schema lama maupun baru. Tidak ada klaim bahwa lingkungan lain belum pernah menjalankan 001.

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
| Migrasi 001–003 + seed 001–002 pada schema `public` `siris_uji` (sudah memakai `kind`), dua putaran | PASS, exit 0 di kedua putaran; 003 mencatat "sudah memakai kind; tidak ada perubahan"; jumlah baris tetap (batches 0, materials 3, suppliers 2, users 3) |
| Upgrade manual dari 001 lama berisi 5 batch (satu per nilai lama) + baris staging, pada schema sementara dalam transaksi ROLLBACK | PASS: kelima nilai terpetakan, relasi staging tetap utuh, 003 kedua kali tidak mengubah apa pun; schema sementara hilang setelah ROLLBACK |
| Test upgrade: pemetaan, jumlah baris, FK `staging_rows`/`validation_issues`, nama lama ditolak, reapply | PASS |
| Test fail-closed: `import_type` + `kind` bersamaan, `kind` tanpa CHECK, tabel tidak ada | PASS: 003 gagal (SQLSTATE P0001) dan data lama tidak berubah |
| Uji mutasi: pemetaan 003 sengaja dirusak (PHYSICAL_COUNT→STOCK) | Test upgrade **gagal** sesuai harapan; file dikembalikan setelahnya |
| Pemilik seluruh tabel `public` | `siris_migrator` (0 tabel milik role lain) |
| Atribut role | `siris_app` dan `siris_migrator`: bukan superuser, tidak dapat membuat database maupun role |
| `siris_app` membuat tabel | Ditolak (SQLSTATE 42501) |
| `npm run test:integration` | PASS — 3 file, 12 test (10 test SRS-44) |
| Test SRS-44 tanpa variabel DB | 10 *skipped* (bukan PASS) |
| Data dan schema setelah test | Tidak berubah: `import_batches` = 0, tidak ada schema `srs44_test_*` tersisa |
| `npm test`, lint, typecheck, build | PASS (101 test) |

Batas bukti: CI GitHub tidak menyediakan PostgreSQL, sehingga di CI test SRS-44 berstatus *skipped*. Bukti di atas berasal dari lingkungan UJI lokal (PostgreSQL 16.6), bukan dari CI. Upgrade diuji pada salinan schema 001 lama yang dibuat di lingkungan UJI, bukan pada database lingkungan lain; kondisi database anggota tim lain belum diinventarisasi.

## 6. Status acceptance criteria SRS-44

| Kriteria (Jira) | Status |
| --- | --- |
| Migrasi/reapply diuji pada DB terisolasi | Terpenuhi secara lokal (§5), termasuk upgrade dari 001 lama dan kegagalan fail-closed |
| Referensi dan mode konsisten | Sebagian: referensi `materials`/`suppliers` dengan mode tersedia; cutoff ditahan (F-03); penegakan mode lintas tabel menunggu tabel domain |
| Seed sintetis berlabel UJI | Terpenuhi untuk seed 002; seed 001 berlabel UJI pada nama |
| Runtime DB bukan superuser | Terpenuhi (§5) |

Definition of Done belum terpenuhi: diperlukan review ulang oleh reviewer lain, keputusan F-03, dan PR #15 merged. PR #13 (SRS-37) sudah merged.
