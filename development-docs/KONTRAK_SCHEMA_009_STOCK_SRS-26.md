# Kontrak Schema 009 Persistensi STOCK dan Dukungan — SRS-26

| Atribut | Nilai |
| --- | --- |
| Issue | [SRS-26](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-26) (story impor stok dan komponen dukungan, pemilik story Vassell). Persistensi 009 ditugaskan ke Dwi oleh Adam (komentar Jira SRS-26 nomor 10161 butir 3; SRS-38 nomor 10153 butir 5) |
| UC terkait | UC-09 |
| FR/NFR terkait | SOURCE REQUIRED; tidak ada ID FR/NFR baru |
| Status dokumen | **PROPOSED — draf awal.** Dokumen ini adalah rancangan, **bukan** file migrasi. Nomor 009 adalah reservasi nomor/modul, bukan schema final |
| Tanggal | 26 November 2026, Asia/Jakarta |
| Baseline repo | `origin/develop` @ `0ff9e4a`: migrasi hanya 001–003. Validasi paket STOCK ada di kandidat #52 @ `ce37fb5` (`stock-package.ts`, belum merged) |
| Pemilik | Backend & Database (Dwi Rani Amelia); reviewer nonpenulis Adam (schema) dan Luthfi (API); konsumen Vassell (SRS-26) |

## 1. Sumber

| Sumber | Bagian yang dipakai |
| --- | --- |
| Komentar Jira SRS-26 nomor 10161 (Adam) | Satu `StockPackageFixtureAdapter`; balance wajib; support_master/movement/wo opsional; balance saja diterima; balance + satu support diterima; support invalid membatalkan seluruh paket; balance hilang, komponen tak dikenal, atau komponen ganda ditolak. Persistensi STOCK/support adalah migrasi 009 milik Dwi; PR #39 tidak menambah tabel/endpoint |
| Komentar Jira SRS-58 nomor 10152 butir 3–4 (Adam) | Tanpa support menghasilkan warning; support yang diberikan tetapi invalid menolak seluruh paket; movement bukan sumber perhitungan saldo. NEG-03 tanpa `cutoff_id` → `INVALID_METADATA` |
| Komentar Jira SRS-38 nomor 10153 butir 3 dan 5 (Adam) | D-04 satu material per sisi per run (UOM ganda → `AMBIGUOUS_PAIR` di rekonsiliasi); reservasi 009 untuk STOCK/support; kirim schema contract per modul sebelum integrasi; jangan menyunting 001–006 |
| [DOC-07](07_DATABASE_DESIGN.md) | `stock_snapshots`, `stock_lines`, `stock_support_rows` |
| [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md) | Paket STOCK: `balance_file` wajib, `support_files` opsional, support tidak dijumlahkan ke `system_quantity`; kode `INVALID_FILE`, `MISSING_REFERENCE`, `DUPLICATE_SOURCE`, `OPTIONAL_COMPONENT_ABSENT` |
| `stock-package.ts` (#52 @ `ce37fb5`, belum merged) | Nama komponen usulan `support_master`, `support_movement`, `support_wo`; bentuk normalized balance `material_code`, `uom`, `system_quantity` |

## 2. Usulan bentuk 009

Mengikuti DOC-07 tanpa kolom baru.

**`stock_snapshots`**

| Kolom | Tipe | Null | Constraint |
| --- | --- | --- | --- |
| `id` | uuid PK | Tidak | Dari aplikasi |
| `batch_id` | uuid FK `import_batches` | Tidak | UNIQUE; batch kind STOCK dan COMMITTED (diperiksa service commit) |
| `cutoff_id` | uuid FK `cutoff_contexts` | Tidak | Scope/mode sama dengan batch. Batch tanpa cutoff ditolak `INVALID_METADATA` sebelum menulis (10152) |

**`stock_lines`** (saldo dari komponen balance / QTY AKHIR)

| Kolom | Tipe | Null | Constraint |
| --- | --- | --- | --- |
| `id` | uuid PK | Tidak | Dari aplikasi |
| `snapshot_id` | uuid FK `stock_snapshots` | Tidak | — |
| `material_id` | uuid FK `materials` | Tidak | Mode sama |
| `uom` | text | Tidak | Unit sumber, tanpa konversi |
| `system_quantity` | numeric(20,6) | Tidak | Nilai QTY AKHIR apa adanya; **tanpa** CHECK `>= 0` (kebijakan negatif OD-05 OPEN) |
| `source_row_id` | uuid FK `staging_rows` | Tidak | Lineage ke baris komponen balance |

UNIQUE (`snapshot_id`, `material_id`, `uom`).

**`stock_support_rows`** (dukungan opsional, tidak dijumlahkan)

| Kolom | Tipe | Null | Constraint |
| --- | --- | --- | --- |
| `id` | uuid PK | Tidak | Dari aplikasi |
| `snapshot_id` | uuid FK `stock_snapshots` | Tidak | — |
| `component` | text | Tidak | Nilai yang diizinkan OPEN (§8 butir 1) |
| `payload` | jsonb | Tidak | Skema per komponen OD-05 OPEN; tidak dijumlahkan |
| `source_row_id` | uuid FK `staging_rows` | Tidak | Lineage ke baris komponen support |

Tidak ada unique selain PK (DOC-07).

## 3. Aturan yang sudah diputuskan Adam

| Aturan | Dampak pada 009 dan commit SRS-52 |
| --- | --- |
| Balance wajib | Paket tanpa baris balance tidak menulis apa pun. `stock_snapshots` hanya dibuat bila ada minimal satu `stock_lines` |
| Support opsional | Komponen support yang tidak dikirim tidak membuat baris `stock_support_rows` dan hanya menghasilkan warning `OPTIONAL_COMPONENT_ABSENT` |
| Support invalid menggagalkan seluruh paket | Validasi semua komponen selesai sebelum penulisan pertama. Satu baris support invalid berarti tidak ada `stock_snapshots`, `stock_lines`, atau `stock_support_rows` yang tersimpan (rollback satu transaksi SRS-52) |
| Movement bukan sumber saldo | `stock_lines.system_quantity` hanya berasal dari balance; tidak ada kolom atau trigger yang menurunkan saldo dari `stock_support_rows` (lihat PVT-17: saldo 10, bukan 13) |
| Satu adapter paket STOCK | Penulis 009 membaca hasil satu adapter; tidak ada dua jalur tulis untuk kind/versi yang sama |
| Tanpa `cutoff_id` → `INVALID_METADATA` | Diperiksa sebelum menulis; `cutoff_id` NOT NULL pada `stock_snapshots` menjadi pengaman kedua |
| ACTUAL ditahan | Penulis hanya untuk mode UJI sampai keputusan OD-08/CF-04 |

## 4. Urutan penulisan yang diusulkan (di dalam transaksi commit SRS-52)

1. Mode selain UJI → ditolak (ACTUAL ditahan; kode final mengikuti keputusan SRS-52 10221).
2. `cutoff_id` tidak ada → `INVALID_METADATA`.
3. Baca baris VALID batch per komponen dengan client transaksi yang sama.
4. Validasi paket lengkap (bentuk balance, referensi material, line key ganda, support). Ada issue → tidak menulis apa pun.
5. Selesaikan `material_code` ke `materials.id` pada gudang/mode batch → `MISSING_REFERENCE` bila tidak ada; master tidak dibuat.
6. Tulis satu `stock_snapshots`, lalu seluruh `stock_lines`, lalu `stock_support_rows` (bila ada), masing-masing dengan `source_row_id`.

Kegagalan penyimpanan diteruskan apa adanya; rollback milik `UnitOfWork` SRS-52.

## 5. Port yang direncanakan

| Port | Adapter yang direncanakan | Ketergantungan |
| --- | --- | --- |
| Pembaca baris STOCK VALID | `staging_rows` per `component` di transaksi commit | Migrasi 006, #27/#52 |
| Resolver material | `materials` (002) terfilter gudang/mode | Kontrak referensi API-21 OPEN |
| Penyimpan STOCK | `stock_snapshots`, `stock_lines`, `stock_support_rows` | Migrasi 009 |

## 6. Verifikasi

Belum ada kode atau tes untuk 009; dokumen ini hanya rancangan. Pemeriksaan pada branch ini: `check_repository.py --tracked` dan lint (lihat deskripsi PR). Tes PostgreSQL untuk CHECK/FK/unique/rollback: NOT RUN.

## 7. Prasyarat lanjutan

File migrasi 009 dan adapter PostgreSQL dibuat setelah 004–008 tersedia di basis branch, bentuk 009 direview Adam, validasi paket #52/#39 merged, dan transaksi commit SRS-52 tersedia.

## 8. OPEN (belum diputuskan)

1. Nilai `component` yang diizinkan: `support_master`, `support_movement`, `support_wo` masih nama usulan (#52). Perlu CHECK di 009 atau cukup validasi aplikasi?
2. Skema `payload` per komponen support (OD-05). Saat ini hanya record skalar generik.
3. Kebijakan saldo negatif (OD-05): disimpan apa adanya tanpa CHECK, atau ditolak?
4. Line key STOCK `material_code|uom` masih usulan UJI. DOC-07 unique (`snapshot_id`, `material_id`, `uom`) membolehkan satu material dengan dua UOM, sedangkan rekonsiliasi menolaknya sebagai `AMBIGUOUS_PAIR` (D-04). Perlu ditolak juga saat impor?
5. Relasi support ke saldo: DOC-07 hanya punya `snapshot_id`. #52 mengaitkan support ke saldo lewat `material_code` di payload. Perlu `stock_line_id` nullable (kolom baru, perlu persetujuan) atau cukup payload?
6. Support tanpa `material_code` (#52 menerimanya): sah atau ditolak?
7. Komponen support diberikan tetapi kosong: #52 menolak `INVALID_FILE`. Perlu dikonfirmasi sebagai keputusan.
8. **Konflik warning dengan preview #54:** paket tanpa support menghasilkan warning `OPTIONAL_COMPONENT_ABSENT` dan menurut keputusan Adam saldo tetap dapat diimpor. Namun #54 saat ini memblokir `canCommit` untuk warning apa pun (fail-closed sampai kontrak acknowledgement C58-04). Akibatnya STOCK balance-only belum dapat di-commit sampai C58-04 diputuskan, atau warning informasional dibedakan.
9. Imutabilitas setelah commit: perlu trigger append-only seperti 007?
10. Pemetaan support WO ke `wo_references` (DOC-08 tabel CF): di luar 009 sampai sumbernya ditetapkan.
11. `LockedBatch` SRS-52 belum memuat `cutoff_id` (pertanyaan yang sama dengan kontrak 010 §8 butir 5).
12. Target evidence D-03 (XOR `stock_snapshot_id`/`count_session_id`) tidak mengubah 009, tetapi `stock_lines.id` tetap dirujuk `reconciliation_lines` (DOC-07).

## 9. Keterlacakan dan iterasi Prototyping

- **Kebutuhan:** acceptance criteria SRS-26 dan keputusan Adam di §3.
- **Rancangan:** §2–§5.
- **Implementasi prototipe:** belum ada untuk 009. Validasi paket ada di #52/#39 (milik Vassell/Adam).
- **Evaluasi:** belum ada review nonpenulis dan belum ada feedback stakeholder.
- **Perbaikan:** menunggu §8.

| Keputusan | Bukti saat ini | Bukti yang masih diperlukan |
| --- | --- | --- |
| Balance wajib, support opsional | Validasi paket #52 (kandidat) | Tes PostgreSQL bahwa paket balance-only tersimpan tanpa support |
| Support invalid menggagalkan paket | Tes DB staging kandidat (Adam, 10161) | Tes commit 009: rollback tanpa baris tersisa di ketiga tabel |
| Movement bukan sumber saldo | PVT-17 langkah 2 terhadap engine #36 (SRS-59, PR #62) | PVT-17 langkah 1 dan 3 setelah 009 dan commit tersedia |

## 10. Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1 | 2026-11-26 | Draf awal: usulan 009 mengikuti DOC-07, aturan keputusan Adam, urutan penulisan, OPEN | Belum ada; seluruh isi PROPOSED |
