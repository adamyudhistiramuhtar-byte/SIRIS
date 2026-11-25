# Kontrak Schema 010 dan Penulis Commit COUNT — SRS-27

| Atribut | Nilai |
| --- | --- |
| Issue | [SRS-27](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-27) (ST-10), parent EPIC-07 |
| UC terkait | UC-10 |
| FR/NFR terkait | SOURCE REQUIRED (mengikuti deskripsi SRS-27); tidak ada ID FR/NFR baru |
| Status dokumen | **PROPOSED — sebagian.** Dokumen ini adalah rancangan, **bukan** file migrasi. Nomor 010 adalah reservasi nomor/modul (Adam, komentar Jira SRS-38 nomor 10153 butir 5), bukan schema final |
| Tanggal | 25 November 2026, Asia/Jakarta |
| Baseline repo | `origin/develop` @ `0ff9e4a`: DTO/mapper dan interface repository COUNT dari PR #38 tersedia; migrasi hanya 001–003 |
| Pemilik | Backend & Database (Dwi Rani Amelia); reviewer nonpenulis Adam dan Luthfi |

## 1. Sumber

| Sumber | Bagian yang dipakai |
| --- | --- |
| Deskripsi SRS-27 | Alur N1–N6, acceptance criteria, count_sessions/count_lines, API-01..05/12 |
| Komentar Jira SRS-27 nomor 10163 (Adam) | `physical_quantity` wajib pada file; tidak ada → `INVALID_FILE`; null eksplisit hanya saat `is_counted=false`; mapper bukan validator; validasi file di adapter staging; UUID gudang dari API, bukan WH-01 |
| Komentar Jira SRS-27 nomor 10171 (Adam) | PR #38 merged `0ff9e4a`; repository PostgreSQL, migrasi 010, write commit SRS-52, API, dan halaman belum selesai |
| Komentar Jira SRS-58 nomor 10152 (Adam) | NEG-03 tanpa `cutoff_id` → `INVALID_METADATA` |
| [DOC-07](07_DATABASE_DESIGN.md) | `count_sessions`, `count_lines` beserta CHECK dan unique |
| [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md) | Kode `INVALID_FILE`, `MISSING_REFERENCE`, `CUTOFF_UNVERIFIED` |
| [DOC-05](05_BUSINESS_RULES_RBAC.md) | BR-INV-02 (nol fisik ≠ belum dihitung) |
| `apps/api/src/modules/count/count-contract.ts` (PR #38) | `CountSessionRecord`, `CountLineRecord`, `CountRepository` |
| Adapter staging #27 @ `0c3a7f0` (`fixture-source-adapter.ts`, belum merged) | Skema normalized COUNT: `material_code`, `uom`, `is_counted`, `physical_quantity` nullable, strict + refine |

## 2. Usulan bentuk 010

Mengikuti DOC-07 tanpa kolom baru.

**`count_sessions`**

| Kolom | Tipe | Null | Constraint |
| --- | --- | --- | --- |
| `id` | uuid PK | Tidak | Dari aplikasi |
| `batch_id` | uuid FK `import_batches` | Tidak | UNIQUE; batch kind COUNT dan COMMITTED (diperiksa service commit) |
| `cutoff_id` | uuid FK `cutoff_contexts` | Tidak | Scope/mode sama dengan batch |

`warehouse_id` dan `mode` pada `CountSessionRecord` (#38) diturunkan dari `import_batches`, bukan kolom sendiri (sesuai komentar di `count-contract.ts`).

**`count_lines`**

| Kolom | Tipe | Null | Constraint |
| --- | --- | --- | --- |
| `id` | uuid PK | Tidak | Dari aplikasi |
| `session_id` | uuid FK `count_sessions` | Tidak | — |
| `material_id` | uuid FK `materials` | Tidak | Mode sama |
| `uom` | text | Tidak | Unit sumber, tanpa konversi |
| `is_counted` | boolean | Tidak | Tanpa default |
| `physical_quantity` | numeric(20,6) | Ya | — |
| `source_row_id` | uuid FK `staging_rows` | Tidak | Lineage |

UNIQUE (`session_id`, `material_id`, `uom`). CHECK DOC-07: `(is_counted AND physical_quantity IS NOT NULL AND physical_quantity >= 0) OR (NOT is_counted AND physical_quantity IS NULL)`. Imutabilitas setelah commit: apakah perlu trigger append-only seperti 007 belum diputuskan (§8).

## 3. Pembagian tanggung jawab validasi

| Lapisan | Tanggung jawab | Status |
| --- | --- | --- |
| Adapter staging #27 | Parse file, skema strict, `physical_quantity` wajib ada sebagai key (tidak ada → `INVALID_FILE`), refine `is_counted` | Di #27; **tidak diduplikasi** di sini |
| `toCountLineDraft` (modul ini) | Invarian domain BR-INV-02 pada baris ternormalisasi tepat sebelum menulis; pelanggaran → `INVALID_FILE` | Ada; pemeriksaan pertahanan, bukan parser file |
| CHECK 010 | Invarian yang sama di database | Usulan |

Pemeriksaan di `toCountLineDraft` sengaja meniru CHECK DOC-07 supaya data staging yang tidak sesuai kontrak gagal dengan kode domain, bukan dengan pelanggaran constraint driver. Apakah lapisan ini dipertahankan atau cukup mengandalkan CHECK 010 adalah pertanyaan §8.

## 4. Port penulisan COUNT (`count-commit-writer.ts`)

`CountCommitWriter.write(tx, batch)` mengembalikan `{committed_count, session_id}`. Urutannya:

1. Mode selain UJI → `CUTOFF_UNVERIFIED` (ACTUAL ditahan; tidak ada adapter ACTUAL).
2. `cutoff_id` tidak ada → `INVALID_METADATA` (10152 butir 3).
3. Baca baris VALID batch (`CountStagedRowReader`, client transaksi yang sama).
4. `toCountLineDraft` untuk semua baris → `INVALID_FILE` bila ada yang melanggar.
5. Selesaikan `material_code` ke `materials.id` UUID pada gudang/mode batch (`MaterialReferenceResolver`) → `MISSING_REFERENCE` bila tidak ada; master tidak dibuat.
6. Baru menulis: satu `count_sessions`, lalu seluruh `count_lines` dengan `source_row_id`.

Tidak ada penulisan sebelum langkah 1–5 lolos. Kegagalan penyimpanan diteruskan apa adanya, karena rollback milik `UnitOfWork` SRS-52.

**Kompatibilitas dengan SRS-52.** `DomainCommitWriter` (PR #46) menerima `LockedBatch` yang belum memuat `cutoff_id`. Pembungkus kind COUNT membutuhkan `cutoff_id` dari batch. Ini perlu disesuaikan di #46 setelah salah satu PR merged (§8).

## 5. Port lain

| Port | Adapter yang direncanakan | Ketergantungan |
| --- | --- | --- |
| `CountStagedRowReader` | `staging_rows` VALID (`normalized_payload`, `component`) dibaca di transaksi commit | Migrasi 006, #27; guard transaksi `readOwnedStaging` (komentar Jira SRS-38 nomor 10197) |
| `MaterialReferenceResolver` | `materials` (002) terfilter gudang/mode | Kontrak referensi API-21; versi referensi masih OPEN |
| `CountWriteStore` | `count_sessions`/`count_lines` | Migrasi 010 |

Interface baca `CountRepository` (#38) tidak diubah.

## 6. Verifikasi

Hasil eksekusi aktual pada branch `feature/SRS-27-count-commit-writer` (25 November 2026, Node.js v24.18.0 lokal):

| Pemeriksaan | Hasil |
| --- | --- |
| `count-commit-writer.test.ts`: 14 kasus invarian + 6 kasus writer dengan fixture SRS-37 UJI | 20 PASS |
| `count-commit-db.todo.test.ts` | 8 TODO (belum dibuat; bukan PASS) |
| Uji mutasi sementara (tidak di-commit): false + nilai diterima; sesi ditulis sebelum validasi | Tertangkap: 2 dan 3 tes gagal; file asli dipulihkan |

Batas bukti: fake hanya mencatat penulisan. CHECK, FK, unique, dan rollback PostgreSQL belum teruji. Belum ada API, halaman SCR-10, atau integrasi SRS-52.

## 7. Prasyarat lanjutan

File migrasi 010 dan adapter PostgreSQL dibuat setelah 004–009 tersedia di basis branch, bentuk 010 direview, dan transaksi commit SRS-52 tersedia.

## 8. Pertanyaan untuk Adam

1. Apakah pemeriksaan invarian di `toCountLineDraft` dipertahankan sebagai lapisan pertahanan, atau cukup CHECK 010 (agar tidak terkesan menduplikasi #27)?
2. Baris COUNT dengan `material_id` + `uom` yang sama dua kali dalam satu batch: ditolak di validasi staging, atau cukup unique 010 (sekarang menjadi `TRANSACTION_FAILED`)? Bila ditolak, kodenya apa (DOC-08 `DUPLICATE_SOURCE` atau lainnya)?
3. Batch COUNT tanpa baris: sah (sesi kosong) atau ditolak?
4. Apakah `count_sessions`/`count_lines` immutable setelah commit dengan trigger seperti 007?
5. `LockedBatch` SRS-52 perlu memuat `cutoff_id` untuk pembungkus COUNT. Disesuaikan di #46, atau writer membaca cutoff dari batch sendiri?
6. Sumber dan versi referensi material (API-21) untuk `MaterialReferenceResolver`.

## 9. Keterlacakan dan iterasi Prototyping

- **Kebutuhan:** acceptance criteria SRS-27.
- **Rancangan:** §2–§5.
- **Implementasi prototipe:** writer dan port.
- **Evaluasi:** §6. Belum ada review nonpenulis dan belum ada feedback stakeholder.
- **Perbaikan:** menunggu §8.

| Acceptance criteria SRS-27 | Bukti saat ini | Bukti yang masih diperlukan |
| --- | --- | --- |
| `is_counted=true` dengan 0 adalah hitung sah | Tes invarian dan writer dengan fixture UJI | CHECK 010 di PostgreSQL |
| `false` mewajibkan null; `false` dengan 0 ditolak | Tes invarian; validator #27 | CHECK 010 di PostgreSQL |
| Scope/cutoff tersimpan dan tertelusur | Tes writer: sesi memuat batch, cutoff, scope; baris memuat `source_row_id` | Tes PostgreSQL + FK |

SRS-27 **belum selesai**: DoD memerlukan migrasi 010, adapter, API, halaman, integrasi SRS-52, review nonpenulis, dan merge.

## 10. Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1 | 2026-11-25 | Rancangan awal: usulan 010, pembagian validasi, port penulisan COUNT, pertanyaan | Belum ada; seluruh isi PROPOSED |
