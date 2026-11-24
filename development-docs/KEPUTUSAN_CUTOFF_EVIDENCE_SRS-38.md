# Usulan Keputusan Cutoff, Evidence, dan Identitas Hasil — SRS-38

| Atribut | Nilai |
| --- | --- |
| Issue | [SRS-38](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-38) (T-04), parent SRS-11 / EPIC-08 |
| UC terkait | UC-09, UC-10, UC-11, UC-12, UC-13, UC-14 |
| Konflik yang ditangani | CF-03 (target evidence), CF-04 (cutoff), CF-05 (identitas/reuse hasil rekonsiliasi) |
| Status dokumen | **PROPOSED — NEEDS DECISION**. Tidak ada keputusan di dokumen ini yang berstatus ACCEPTED. Dokumen ini **belum siap merge** sebagai penyelesaian SRS-38 sampai keputusan berwenang tersedia. Butir yang tercakup arahan baseline UJI (Adam, 15 Nov 2026) dicatat terpisah di §13 dan tidak dinaikkan menjadi ACCEPTED. Perbedaan cara baca dengan register PR #28 untuk D-01, D-02, D-05, dan D-06 dicatat sebagai **TERBUKA** pada bagian masing-masing. |
| Tanggal | 12 November 2026, diperbarui 15 November 2026 dan 24 November 2026, Asia/Jakarta |
| Baseline repo | Disusun pada `origin/develop` @ `dba5c66`. Rujukan terbaru yang dibaca: `origin/develop` @ `28b8501` (24 November 2026; memuat merge PR #15 `d1acfb4`). Branch ini tidak di-rebase atau digabung dengan `develop`. Pembanding: [PR #26](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/26) @ `1886b2c` dan [PR #28](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/28) @ `c68893a` |
| Pemilik | Backend & Database (Dwi Rani Amelia) |

Dokumen ini menyusun opsi, rekomendasi, dan dampak untuk setiap konflik. Keputusan akhir berada pada pihak berwenang yang tercantum di §2. Sampai keputusan dicatat, berlaku aturan §9: **kontrak yang bertentangan tidak diberlakukan bersamaan**.

## 1. Sumber

| Sumber | Versi | Bagian yang dipakai |
| --- | --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | 0.2.0 | CF-03, CF-04, CF-05; OD-05, OD-08 |
| [DOC-05](05_BUSINESS_RULES_RBAC.md) | 0.2.0 | BR-INV-03, BR-EVD-01, BR-EVD-02 |
| [DOC-07](07_DATABASE_DESIGN.md) | 0.2.0 | `cutoff_contexts`, `stock_snapshots`, `count_sessions`, `reconciliation_runs`, `reconciliation_lines`, `evidence`; keputusan yang ditahan |
| [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md) | 0.2.0 | Tabel keputusan rekonsiliasi, contoh cutoff, katalog error |
| [DOC-09](09_API_SPECIFICATION.md) | 0.2.0 | API-11–API-17, API-22 |
| [DOC-10](10_UI_UX_PROTOTYPE_SPECIFICATION.md) | 0.2.0 | Layar UI-09–UI-14 (mengacu SRC-09) |
| [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md) | 0.2.0 | PVT-18 (menunggu CF-04), PVT-20 (menunggu CF-05) |
| `design.md` (SRC-09) | 1.0.0 | §6.4 UI-09–UI-14, §6.5 eligibility rekonsiliasi, §7 aturan tanggal (`effective_precision=DATE` bukan 00.00), AC-13 |
| `KONTRAK_SUMBER_SRS-37.md` ([PR #13](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/13), sudah merged ke develop `761a183`) | proposed-0.1 | Metadata `cutoff_id`, kontrak STOCK/COUNT |
| `database/migrations/001_initial_schema.sql` | `dba5c66` | Tabel `cutoff_contexts` aktual pada repo (temuan F-03) |
| [PR #26](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/26), branch `feature/SRS-38-cutoff-time-nullable` | `1886b2c` (Draft, base `integration/adam-20261121`, belum merged) | Kandidat F3-1: `005_cutoff_time_nullable.sql`, `recovery/005_restore_cutoff_time_required.sql`, `tests/integration/database/cutoff-nullable.test.ts`, `KANDIDAT_CUTOFF_F3-1_SRS-38.md` |
| [PR #28](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/28), branch `docs/adam-decisions-20261122` | `c68893a` (terbuka, base `docs/SRS-58-contract-matrix`, belum merged) | `KEPUTUSAN_HANDOFF_ADAM_2026-11-23.md`: register D-01–D-06, C58-06, urutan migrasi 004/005/006, prosedur pemulihan 005 |
| `MIGRASI_DATABASE_SRS-44.md` | `origin/develop` @ `28b8501` | PostgreSQL 16.6 untuk UJI lokal (PROPOSED, OD-07 OPEN) |

Sumber yang belum tersedia: SRS/PRD final (OD-01, OD-03), sampel kartu stok dan hasil hitung mitra (OD-05), keputusan verifikator cutoff dan retensi (OD-08).

## 2. Pihak berwenang untuk keputusan

| Keputusan | Pemilik menurut DOC-00 | Status |
| --- | --- | --- |
| Model cutoff (basis, precision, timezone) | OD-05 — Database Architect, dengan sumber dari mitra | OPEN DECISION |
| Kewenangan VERIFIED, target evidence, retensi | OD-08 — Business Analyst | OPEN DECISION |
| Konflik desain lintas schema/API/UI | PM & Technical Lead (Adam) | Menunggu |

Pemilik issue SRS-38 hanya menyiapkan usulan; penetapan menjadi ACCEPTED memerlukan bukti persetujuan dari pihak di atas.

## 3. D-01 — Representasi cutoff: DATE/DATETIME, basis, precision (CF-04)

**Konflik.** DOC-07 memakai `cutoff_at timestamptz`. SRC-09 meminta effective date/time, basis, precision, dan melarang memalsukan jam untuk cutoff tanggal-saja (design.md §7, DatePicker). Migrasi 001 di repo memakai `cutoff_date DATE NOT NULL` + `cutoff_time TIME NOT NULL` (F-03), sehingga cutoff tanggal-saja terpaksa diberi jam.

| Opsi | Uraian | Kelebihan | Kekurangan |
| --- | --- | --- | --- |
| A | Pertahankan `cutoff_at timestamptz` | Sederhana | Memalsukan jam untuk sumber tanggal-saja; bertentangan SRC-09 |
| **B (rekomendasi)** | `effective_date date NOT NULL`, `effective_time time NULL`, `effective_precision` `DATE`/`DATETIME`, `source_timezone` wajib bila `DATETIME`, `effective_basis`, `basis_reference` | Tanggal-saja tetap tanggal-saja; precision eksplisit; mendukung UI-09 | Perbandingan lintas precision perlu aturan |
| C | Simpan teks mentah saja | Tidak ada kehilangan informasi | Tidak dapat dibandingkan secara andal |

**Rekomendasi (PROPOSED):** opsi B dengan constraint:
- `effective_precision = 'DATE'` ⇒ `effective_time IS NULL`; `'DATETIME'` ⇒ `effective_time IS NOT NULL` dan `source_timezone IS NOT NULL`.
- Nilai `effective_basis` (misalnya akhir hari kerja, waktu cetak laporan): **SOURCE REQUIRED**; tidak dikarang. Sampai tersedia, kolom berisi teks bebas yang wajib diisi dan `basis_reference` wajib.
- **Tanggal laporan bukan bukti waktu efektif.** Tanggal cetak, periode laporan, atau tanggal yang tertera pada laporan tidak otomatis membuktikan effective timestamp, dan tidak membuktikan bahwa STOCK dan COUNT sebanding waktunya. Label tanggal tersebut tidak dipertukarkan dengan effective cutoff (design.md §7).
- **`cutoff_id` identik adalah syarat perlu, bukan syarat cukup.** Pasangan STOCK–COUNT wajib memakai `cutoff_id` yang sama (DOC-08 §15), tetapi `cutoff_id` yang sama tidak menggantikan bukti basis efektif. Kesebandingan juga memerlukan `effective_basis` dan `basis_reference` yang dapat ditelusuri. Tidak ada toleransi waktu tersembunyi; konteks berbeda ditolak `CUTOFF_MISMATCH`.
- Unique usulan: (`warehouse_id`, `mode`, `effective_date`, `effective_time`, `effective_precision`, `effective_basis`) dengan `NULLS NOT DISTINCT`, karena `effective_time` boleh NULL. Lingkungan UJI saat ini memakai PostgreSQL 16.6 (PROPOSED untuk UJI lokal, `MIGRASI_DATABASE_SRS-44.md`), yang sudah mendukung `NULLS NOT DISTINCT` (tersedia sejak PostgreSQL 15), sehingga indeks parsial tidak diperlukan untuk UJI. Versi runtime dan deployment tetap OD-07 (OPEN DECISION); bila versi akhir di bawah 15, indeks parsial menjadi alternatif.

**Catatan cara baca terhadap PR #28 — TERBUKA.** Register PR #28 menulis butir ini sebagai "D-01 / F3-1" dan menyebut F3-1 (`cutoff_time` boleh NULL untuk tanggal-saja) sebagai kandidat PM. Dokumen ini membaca D-01 sebagai opsi B (kolom `effective_*` dengan precision eksplisit), sedangkan F3-1 adalah perubahan minimal F-03 (§13.4) untuk menegakkan aturan UJI §13.1. Belum disepakati apakah F3-1 menggantikan, mendahului, atau menjadi bagian dari D-01. Opsi B dan F3-1 sama-sama tetap PROPOSED.

## 4. D-02 — Status verifikasi: VERIFIED dan UJI SIMULATED (CF-04)

**Konflik.** DOC-07: `VERIFIED`/`UNVERIFIED`. SRC-09 §6.5: "ACTUAL membutuhkan verifikasi; UJI membutuhkan SIMULATED". Kewenangan verifikator = OD-08 (OPEN). DOC-07 menegaskan `cutoff_contexts` "bukan workflow verifikasi baru".

**Rekomendasi (PROPOSED):**
- Domain status per mode, ditegakkan dengan CHECK:
  - `mode = 'UJI'` ⇒ `status = 'SIMULATED'`.
  - `mode = 'ACTUAL'` ⇒ `status IN ('VERIFIED','UNVERIFIED')`, default `UNVERIFIED`.
  - `status = 'VERIFIED'` ⇒ `verification_reference IS NOT NULL`, `verified_by IS NOT NULL`, `verified_at IS NOT NULL`.
- **Nama kolom.** Usulan ini memakai kolom `status` yang sudah ada pada `cutoff_contexts` di migrasi 001 (`VARCHAR(32) NOT NULL DEFAULT 'OPEN'`, tanpa CHECK), bukan kolom baru `verification_status`. Kolom `verification_reference`, `verified_by`, dan `verified_at` belum ada di 001 dan tetap usulan. Default `OPEN` pada 001 tidak termasuk domain usulan di atas; perlakuan nilai `OPEN` dan perubahan default belum diputuskan.
- Tidak menambah workflow/layar verifikasi baru (di luar scope). Status `VERIFIED` hanya mencatat referensi bukti eksternal.
- **Kewenangan siapa yang boleh menandai VERIFIED: BLOCKED oleh OD-08.** Sampai diputuskan, sistem *fail-closed*: rekonsiliasi ACTUAL ditolak `CUTOFF_UNVERIFIED` (AC-13), UJI hanya berjalan dengan `SIMULATED`.
- Rekonsiliasi tidak boleh mencampur ACTUAL dan UJI (`MODE_MISMATCH`).

**Catatan cara baca terhadap PR #28 — TERBUKA.** PR #28 merekomendasikan agar CHECK status dipisah dari perubahan nullable `cutoff_time`, dan kandidat migrasi 005 (PR #26) tidak mengubah status, default, maupun menambah CHECK. Versi sebelumnya dokumen ini (§13.4) menyerahkan pilihan gabung atau pisah kepada Adam. Rekomendasi pemisahan belum menjadi keputusan; sampai diputuskan, label SIMULATED tetap diterapkan pada fixture UJI.

## 5. D-03 — Target evidence (CF-03)

**Konflik.** DOC-07/09 API-17: `evidence.stock_line_id NOT NULL`. SRC-09 UI-11: target **snapshot ATAU count**, tepat satu.

| Opsi | Uraian | Catatan |
| --- | --- | --- |
| A | `stock_line_id` (per baris saldo) | Tidak mendukung bukti untuk hitung fisik; bertentangan SRC-09 |
| **B (rekomendasi)** | `stock_snapshot_id uuid NULL` + `count_session_id uuid NULL`, CHECK `num_nonnulls(stock_snapshot_id, count_session_id) = 1` | Sesuai SRC-09 dan tindakan yang dicatat DOC-07 |
| C | Tabel tautan polimorfik | Lebih fleksibel, kehilangan FK langsung |

**Rekomendasi (PROPOSED):** opsi B.
- FK langsung ke `stock_snapshots`/`count_sessions` (`ON DELETE RESTRICT`).
- Kesamaan gudang/mode target dengan sesi pengguna diperiksa service dalam transaksi (DOC-07 "Integritas lintas tabel"); trigger hanya jika diputuskan perlu.
- Aturan lain tidak berubah: PDF/JPG/PNG, 1..5242880 byte, privat, tanpa OCR, bukan sumber quantity (BR-EVD-01/02).
- Penetapan final tetap OD-08.

## 6. D-04 — Grain pasangan rekonsiliasi

**Sumber.** DOC-07/08 sudah mengusulkan: satu hasil per material per run; lebih dari satu baris/UOM untuk material yang sama ⇒ run ditolak `AMBIGUOUS_PAIR`. SRC-09 UI-14: tidak menjumlah beda UOM.

**Rekomendasi (PROPOSED), tanpa perubahan dari DOC-07/08:**
- Kunci pasangan = `material_id` dalam run; unique `reconciliation_lines(run_id, material_id)`.
- Sumber tetap disimpan apa adanya: unique `stock_lines(snapshot_id, material_id, uom)` dan `count_lines(session_id, material_id, uom)`.
- Satu baris per sisi dengan UOM berbeda ⇒ status `UOM_MISMATCH` (nonvalid, variance null). Lebih dari satu baris di satu sisi ⇒ seluruh run ditolak `AMBIGUOUS_PAIR`.
- Variance hanya untuk pasangan valid: **Physical Quantity − System Quantity**.
- Grain final multi-UOM per material tetap OD-05.

**Belum dihitung bukan nol.** `physical_quantity` null dan item yang belum dihitung (`is_counted = false`) **tidak** diperlakukan sebagai nol dan **tidak** menghasilkan DISCREPANCY. Baris COUNT yang tidak ada juga bukan nol. Variance hanya dihitung untuk pasangan yang terhitung (`is_counted = true`), UOM sama, dan valid; untuk status nonvalid variance wajib null. Aturan ini dipertahankan dalam skenario uji berikut (data UJI, `system_quantity = 10` bila stok ada):

| Skenario | Input COUNT | Status | Variance |
| --- | --- | --- | --- |
| Dihitung, fisik nol | `is_counted = true`, `physical_quantity = 0` | DISCREPANCY | −10 |
| Dihitung, sama dengan sistem | `is_counted = true`, `physical_quantity = 10` | MATCHED | 0 |
| Belum dihitung | `is_counted = false`, `physical_quantity = null` | NOT_COUNTED | null |
| Baris COUNT tidak ada | — | COUNT_MISSING | null |
| Stok tidak ada, count ada (8) | `is_counted = true`, `physical_quantity = 8` | STOCK_MISSING | null |
| UOM berbeda | `is_counted = true`, UOM lain | UOM_MISMATCH | null |

## 7. D-05 — Identitas hasil dan reuse fingerprint (CF-05)

**Konflik.** DOC-07/08: Idempotency-Key sama mengembalikan run sama; key berbeda dapat membuat run baru. SRC-09 §6.5: "Result existing fingerprint dibaca ulang; tidak menampilkan run duplikat seolah hasil baru". PVT-20 ditahan.

**Rekomendasi (PROPOSED):**
- `result_fingerprint` = SHA-256 atas representasi kanonik (`stock_snapshot_id`, `count_session_id`, `cutoff_id`, `rule_version`). Usulan ini **mengasumsikan** snapshot/sesi immutable setelah commit, sehingga ID mewakili isinya. Hash isi baris dapat ditambahkan bila koreksi data kelak diizinkan.
- Unique `reconciliation_runs(stock_snapshot_id, count_session_id, rule_version)`.
- Perilaku API-13:
  - **Key sama + payload sama** ⇒ respons lama (idempotency).
  - **Key sama + payload beda** ⇒ 409 `IDEMPOTENCY_CONFLICT`.
  - **Key berbeda + input identik** ⇒ tidak membuat run baru; mengembalikan run yang ada (usulan HTTP 200 dengan penanda `reused: true`, bukan 201). Bentuk respons perlu persetujuan kontrak API.
  - **Input atau `rule_version` berbeda** ⇒ run baru; histori lama tetap ada (PVT-20).
- Konkurensi dua key untuk input identik ditangani unique constraint: transaksi kedua membaca run pemenang.

**Catatan cara baca terhadap PR #28 — TERBUKA.** PR #28 mencatat bahwa koreksi input immutable masih memerlukan keputusan domain. Karena itu, asumsi immutable di atas belum menjadi dasar yang disahkan. Bila koreksi snapshot/sesi diizinkan, fingerprint berbasis ID tidak lagi cukup dan hash isi baris diperlukan.

## 8. D-06 — Pemilihan latest run untuk metrik (UI-13/UI-14)

**Sumber.** SRC-09 UI-14: "Agregasi memilih latest committed run untuk cutoff + rule-version sama".

**Rekomendasi (PROPOSED):**
- Kelompok = (`warehouse_id`, `mode`, `cutoff_id`, `rule_version`). Latest = `created_at` terbesar, lalu `id` terbesar sebagai tie-breaker deterministik.
- Dengan D-05, input identik tidak menghasilkan dua run. Beberapa run dalam satu kelompok hanya muncul bila snapshot atau count yang berbeda di-commit untuk cutoff yang sama. Apakah kondisi itu sah, atau harus ditolak saat impor, adalah **OPEN DECISION** (OD-05/OD-06).
- Run lama tidak dihapus atau ditimpa; hanya tidak dipilih untuk agregasi.
- Run ACTUAL dengan cutoff `UNVERIFIED` tidak eligible untuk metrik.

**Catatan cara baca terhadap PR #28 — TERBUKA.** Kelompok dan tie-breaker usulan sama dengan PR #28 (gudang/mode/cutoff/rule; `created_at`, lalu UUID). Perbedaan yang belum disepakati:
- PR #28 menambahkan tes pemisahan scope dan metadata run terpilih, yang belum tercantum pada §10.
- Indeks usulan §10 tidak memuat `warehouse_id` dan `mode`, padahal kelompok memuatnya. Apakah keduanya cukup diwakili `cutoff_id` (karena `cutoff_contexts` menyimpan `warehouse_id` dan `mode`) belum diputuskan.
- PR #28 menyerahkan sah atau tidaknya beberapa snapshot/sesi pada cutoff yang sama kepada mitra, sedangkan dokumen ini mencatatnya sebagai OPEN DECISION OD-05/OD-06. Pemilik keputusannya belum disepakati.

## 9. Kontrak yang berlaku sampai keputusan diambil

| Area | Kontrak yang dirujuk saat ini | Kontrak yang **ditahan** | Aturan |
| --- | --- | --- | --- |
| Cutoff | Tidak ada yang final; `cutoff_id` identik sebagai syarat perlu (bukan cukup) pasangan (DOC-08) | `cutoff_at` DOC-07, `cutoff_date`/`cutoff_time NOT NULL` migrasi 001, opsi B §3 | Migrasi cutoff tidak dibekukan di SRS-44 sebelum D-01/D-02 diputuskan; UJI berjalan dengan fixture saja |
| Evidence | Tidak ada | `stock_line_id` DOC-07/09 dan opsi B §5 | Implementasi UC-11 (API-17) tidak dimulai sebelum D-03 diputuskan |
| Identitas run | Idempotency-Key per (actor, operation, key) DOC-07 | Reuse lintas key §7 | PVT-20 tetap NOT RUN; tidak membuat run duplikat untuk input identik sampai D-05 diputuskan |
| Grain | DOC-07/08 (`AMBIGUOUS_PAIR`) | — | Tidak ada konflik; tetap PROPOSED |

## 10. Matriks dampak

| Keputusan | Schema (DOC-07 / migrasi) | API (DOC-09) | UI (design.md / DOC-10) | Tes (DOC-13) | Issue terdampak |
| --- | --- | --- | --- | --- | --- |
| D-01 cutoff | `cutoff_contexts`: kandidat `005_cutoff_time_nullable.sql` ([PR #26](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/26) @ `1886b2c`, Draft) hanya melepas `NOT NULL` dari `cutoff_time` (F3-1, §13.4). Kolom `effective_*` + CHECK opsi B tetap PROPOSED dan memerlukan migrasi terpisah. Migrasi 001 tidak diubah | API-01 metadata cutoff; API-11/12/14/15 menampilkan precision/basis; DTO tidak menampilkan jam buatan untuk `cutoff_time` NULL | UI-09/UI-10 metadata cutoff; Context Strip; tanggal-saja tanpa jam | PVT-18; boundary DATE vs DATETIME; `CUTOFF_MISMATCH`; enam tes kandidat 005 (§13.4) | SRS-38 (migrasi 005), SRS-25, SRS-27, SRS-58 |
| D-02 status | `status` (kolom 001) + CHECK per mode; kolom baru usulan `verification_reference`, `verified_by`, `verified_at` | API-13 error `CUTOFF_UNVERIFIED`/`MODE_MISMATCH` | Label UNVERIFIED/SIMULATED; alasan spesifik (§6.5) | AC-13; tolak ACTUAL UNVERIFIED; UJI wajib SIMULATED | SRS-38 (migrasi lanjutan terpisah dari 005; nomor belum ditetapkan), SRS-58 |
| D-03 evidence | `evidence`: XOR `stock_snapshot_id`/`count_session_id` | API-17 request body berubah; API-18 menampilkan target | UI-11 pilihan target snapshot/count | Kasus XOR (0, 1, 2 target), lintas scope | Story UC-11, SRS-58 |
| D-04 grain | Tidak berubah dari DOC-07 | Error `AMBIGUOUS_PAIR` | Alasan penolakan run | Multi-UOM per material; UOM_MISMATCH | Engine rekonsiliasi |
| D-05 identitas | Unique `reconciliation_runs(snapshot, session, rule_version)`; kolom `result_fingerprint` | API-13: 200 `reused` vs 201; 409 konflik key | UI-12/13 tidak menampilkan run duplikat | PVT-20; konkurensi dua key | SRS-52 (pola idempotency), SRS-58 |
| D-06 latest run | Indeks (`cutoff_id`, `rule_version`, `created_at`, `id`) | API-16 memakai latest run | UI-14 I-REPEAT/I-EXACT/I-COVER | Tie-breaker deterministik; run lama tetap terbaca | Metrik UC-14 |

## 11. Temuan

| ID | Temuan | Tindak lanjut |
| --- | --- | --- |
| F-03 | `001_initial_schema.sql` mendefinisikan `cutoff_contexts.cutoff_time TIME NOT NULL` dan `status` `OPEN` tanpa CHECK. Ini memaksa jam untuk cutoff tanggal-saja dan tidak memiliki status verifikasi DOC-07/SRC-09. | Usulan perubahan minimal tercatat di §13.4. Untuk bagian `cutoff_time`, kandidat F3-1 tersedia sebagai migrasi 005 pada [PR #26](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/26) @ `1886b2c` (Draft, disiapkan Adam), belum diputuskan PM dan belum direview nonpenulis. Bagian `status` tanpa CHECK tidak ditangani 005 dan tetap termasuk D-02. Dokumen ini tidak mengubah migrasi, dan scope SRS-44 (Done) tidak diperluas |
| F-04 | DOC-09 API-17 contoh request memakai `stock_line_id`, yang bertentangan dengan SRC-09 | Diperbarui setelah D-03 diputuskan |

## 12. Status acceptance criteria SRS-38

| Kriteria (Jira) | Status |
| --- | --- |
| Keputusan berwenang tercatat | **Sebagian (tidak berubah sejak 15 Nov 2026)**. Arahan baseline UJI (Adam, 15 Nov 2026) tercatat di §13.1. Sampai 24 Nov 2026 belum ada keputusan PM atau pemilik domain yang baru (komentar Jira SRS-38, 24 Nov 2026). Kandidat F3-1 (PR #26) dan register PR #28 adalah kandidat dan rekomendasi, bukan keputusan. Keputusan ACTUAL (OD-05, OD-08), D-01 opsi B, D-03, D-05, D-06, dan tabel UOM belum disahkan |
| Dampak schema/API/UI/tes tercatat | **Tersedia sebagai usulan, dengan celah tercatat** (§10). Baris D-01 dan D-02 sudah diperbarui terhadap kandidat 005. Tes D-06 tambahan dari PR #28 (pemisahan scope, metadata run terpilih) belum dimasukkan ke §10 (catatan §8) |
| Kontrak yang bertentangan tidak diberlakukan bersamaan | **Aturan penahanan tercatat** (§9). Risiko tercatat: bila kandidat 005 di-merge sebelum hubungan D-01 dengan F3-1 disepakati (catatan §3), `cutoff_time` NULL dan opsi B dapat menjadi dua kontrak cutoff yang berlaku bersamaan. Risiko ini belum terjadi karena PR #26 masih Draft dan belum merged |

Karena kriteria pertama baru terpenuhi sebagian, pekerjaan ini tetap berupa **usulan** dan **belum siap merge maupun Done**. Usulan tidak dinaikkan menjadi ACCEPTED tanpa bukti keputusan dari pihak pada §2.

Review: review terakhir PR #14 (Adam, 24 Nov 2026 pukul 02.08 WIB) berstatus COMMENT, bukan APPROVED, sehingga status review GitHub masih CHANGES_REQUESTED. Adam menyatakan komentar tersebut bukan approval menyeluruh.

Pengujian: dokumen ini tidak mengubah kode; PVT-18 dan PVT-20 tetap NOT RUN. Skenario §6 belum dijalankan karena engine rekonsiliasi belum ada. Enam tes kandidat 005 dilaporkan PASS oleh penulis PR #26, tetapi tidak dijalankan oleh pemilik dokumen ini (verifikasi independen NOT RUN, §13.4). Definition of Done memerlukan keputusan berwenang, review oleh reviewer lain, dan PR merged.

## 13. Status butir setelah arahan baseline UJI (Adam, 15 Nov 2026)

Bagian ini memisahkan butir usulan §3–§8 dan Lampiran A ke dalam tiga kelompok. Label yang dipakai untuk kelompok pertama adalah **arahan baseline UJI (Adam, 15 Nov 2026)**; label ini **bukan** status ACCEPTED dan hanya berlaku untuk mode UJI. Tidak ada butir lain yang berubah status. Rujukan bukti arahan: Adam, chat grup Capstone 42, 15 Nov 2026, 15.11 WIB.

### 13.1 Kelompok 1 — Dapat dipakai untuk UJI sekarang

| Butir | Rujukan | Aturan yang berlaku untuk UJI | Batasan |
| --- | --- | --- | --- |
| Cutoff tanggal-saja tidak diberi jam | D-01 (§3), A.1 | Cutoff yang sumbernya hanya tanggal disimpan dan ditampilkan tanpa jam; tidak diisi 00.00 atau jam lain | Bentuk kolom opsi B (`effective_*`, unique key) tetap PROPOSED. Migrasi 001 masih mewajibkan `cutoff_time` (F-03), sehingga aturan ini baru dapat ditegakkan di database setelah §13.4 diputuskan; sampai itu UJI memakai fixture |
| Cutoff UJI berlabel SIMULATED | D-02 (§4) | `mode = 'UJI'` ⇒ status cutoff `SIMULATED`; data UJI tidak disajikan sebagai data operasional | Bagian ACTUAL dari D-02 (`VERIFIED`/`UNVERIFIED`, kewenangan verifikator) tetap ditahan (Kelompok 3) |
| Grain pasangan dan penolakan pasangan ambigu | D-04 (§6) | Mengikuti DOC-07/08 apa adanya: satu hasil per material per run, `AMBIGUOUS_PAIR`, `UOM_MISMATCH` dengan variance null, belum dihitung bukan nol | Grain final multi-UOM untuk ACTUAL tetap OD-05. Skenario §6 belum dijalankan |
| ACTUAL ditahan | §9, A.6 | Rekonsiliasi dan cutoff ACTUAL tidak dijalankan; fail-closed (`CUTOFF_UNVERIFIED`) | Dibuka hanya setelah OD-05 dan OD-08 diputuskan |

### 13.2 Kelompok 2 — Belum disahkan

Butir berikut tetap **PROPOSED** dan tidak diimplementasikan, termasuk untuk UJI, sampai ada keputusan dari pihak pada §2.

| Butir | Rujukan | Yang menunggu keputusan |
| --- | --- | --- |
| D-03 target evidence | §5, F-04 | XOR `stock_snapshot_id`/`count_session_id`; implementasi UC-11 (API-17) tetap tidak dimulai |
| D-05 identitas dan reuse hasil | §7 | Fingerprint, unique `reconciliation_runs`, respons `reused`; PVT-20 tetap NOT RUN |
| D-06 pemilihan latest run | §8 | Kelompok dan tie-breaker agregasi; status beberapa run per cutoff (OD-05/OD-06) |
| Tabel UOM kanonik dan alias | A.3, A.5 | Persetujuan Adam sebelum masuk rancangan schema; tanpa itu tabel tidak dibuat |
| Bentuk kolom cutoff opsi B dan unique key | §3, A.1 | Nama kolom, CHECK precision, unique (bergantung OD-07) |
| Model timezone opsi B | A.2 | Termasuk izin UJI mencantumkan `Asia/Jakarta` secara eksplisit |
| Perubahan minimal F-03 | §13.4 | Keputusan PM antara F3-1 dan F3-3 (F3-2 tidak memiliki kandidat). Kandidat F3-1 sudah tersedia pada PR #26 (`005`, branch `feature/SRS-38-cutoff-time-nullable`), tetapi nomor 005 masih reservasi, review nonpenulis belum ada, dan prosedur ledger setelah script pemulihan belum ditulis |
| Perbedaan cara baca dengan PR #28 | §3, §4, §7, §8 | Hubungan D-01 dengan F3-1; pemisahan CHECK status (D-02); asumsi immutable (D-05); indeks, tes, dan pemilik keputusan beberapa run per cutoff (D-06) |

### 13.3 Kelompok 3 — Membutuhkan bukti mitra

Butir berikut tidak dapat diputuskan dari dokumen repo saja dan **tetap ditahan** sampai sumber dari mitra tersedia. Tidak ada nilai yang dikarang.

| Butir | Open decision | Bukti yang dibutuhkan |
| --- | --- | --- |
| Basis cutoff ACTUAL (`effective_basis`, `basis_reference`), tanggal-saja atau tanggal-jam | OD-05 | Sampel ekspor Erasoft STOCK dan COUNT; dokumen dasar cutoff (A.6 butir 1) |
| Timezone data ACTUAL | OD-05 | Zona waktu server Erasoft dan gudang; ada/tidaknya offset (A.6 butir 2) |
| Daftar UOM ACTUAL dan material multi-UOM | OD-05 | Daftar UOM Erasoft, variasi penulisan, pihak penyetuju (A.6 butir 3) |
| Locale dan desimal quantity | OD-05 | Contoh angka pada ekspor (A.6 butir 4, G-03) |
| Kewenangan VERIFIED dan retensi evidence | OD-08 | Keputusan Business Analyst beserta pihak mitra yang berwenang |
| Bagian OD-05 lain (saldo negatif, sheet/header, key bisnis) | OD-05 | A.6 butir 5 |

### 13.4 Usulan perubahan minimal F-03 (untuk diputuskan Adam)

**Status: PROPOSED — kandidat tersedia, menunggu keputusan PM.** [PR #15](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/15) (SRS-44, migrasi 001–003) sudah merged ke `develop` sebagai `d1acfb4` pada 22 November 2026, dan F3-1 tidak menjadi bagian SRS-44. Kandidat F3-1 disiapkan Adam pada [PR #26](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/26) @ `1886b2c` (Draft); pemilik domain migrasi 005 adalah Dwi. Dokumen ini tidak mengubah migrasi apa pun, dan migrasi 001 tidak disunting (sejalan dengan A.4).

**Masalah.** `001_initial_schema.sql` mendefinisikan `cutoff_contexts.cutoff_time TIME NOT NULL`. Akibatnya cutoff tanggal-saja wajib diberi jam, bertentangan dengan arahan baseline UJI §13.1 dan SRC-09 §7.

**Opsi.**

| Opsi | Perubahan | Kelebihan | Kekurangan |
| --- | --- | --- | --- |
| **F3-1 (usulan minimal)** | Migrasi baru: `ALTER TABLE cutoff_contexts ALTER COLUMN cutoff_time DROP NOT NULL;` Makna: `cutoff_time IS NULL` = cutoff tanggal-saja | Satu pernyataan; aman untuk data yang ada; tidak mendahului bentuk kolom opsi B | Precision tersirat dari NULL, belum eksplisit |
| F3-2 | F3-1 ditambah kolom `effective_precision` (`DATE`/`DATETIME`) dengan CHECK konsistensi terhadap `cutoff_time` | Precision eksplisit sesuai D-01 | Mendahului sebagian keputusan bentuk kolom opsi B (Kelompok 2) |
| F3-3 | Tunda sampai seluruh D-01 opsi B diputuskan | Tidak ada migrasi sementara | Aturan UJI §13.1 tidak dapat ditegakkan di database; UJI tetap fixture saja |

**Catatan untuk opsi F3-1/F3-2.**

- **Tanpa backfill.** Baris yang sudah ada tidak diubah dan nilai `00:00` tidak dikonversi otomatis menjadi NULL, karena tidak dapat dibedakan apakah jam tersebut berasal dari sumber atau diisi paksa. Kandidat 005 tidak memuat `UPDATE`.
- **Upgrade-aman dan idempoten.** `DROP NOT NULL` dapat dijalankan ulang tanpa galat. Kandidat 005 terlebih dahulu memeriksa bentuk `cutoff_contexts` (`cutoff_date` DATE NOT NULL, `cutoff_time` TIME) dan menolak schema yang tidak dikenal (`CUTOFF005_SCHEMA_UNKNOWN`). Untuk F3-2, penambahan kolom dan CHECK mengikuti pola pemeriksaan migrasi 003.
- **Pemulihan.** Script `database/migrations/recovery/005_restore_cutoff_time_required.sql` berada di luar runner migrasi maju. Script ini menolak mengembalikan `NOT NULL` bila masih ada `cutoff_time` NULL (`CUTOFF005_RECOVERY_REQUIRES_SOURCE`) dan tidak mengubah data. Langkah menurut PR #26/#28: hentikan penulis data, ambil backup, inventarisasi baris NULL; bila tidak ada sumber waktu yang sah, gunakan roll-forward dan jangan mengisi `00:00` atau menghapus baris. **Terbuka:** setelah script pemulihan dijalankan, ledger migrasi UJI (`_uji_schema_versions`) masih mencatat 005 sebagai sudah diterapkan; prosedur penyelarasan ledger belum ditulis.
- **Makna NULL tersirat.** Pada F3-1, arti "NULL = tanggal-saja" hanya tercatat di dokumen; database tidak menyimpan precision eksplisit. Perubahan juga berlaku untuk baris ACTUAL karena kolomnya dipakai bersama; penolakan ACTUAL bergantung pada baseline akses, bukan constraint.
- **Label SIMULATED tidak termasuk F-03 jam.** Kolom `status` pada 001 (default `OPEN`, tanpa CHECK) adalah bagian lain dari temuan F-03. Penegakan `UJI ⇒ SIMULATED` lewat CHECK termasuk D-02. PR #28 merekomendasikan pemisahan, dan kandidat 005 tidak menyentuh status; keputusan belum ada (lihat catatan §4). Sampai diputuskan, label SIMULATED diterapkan pada fixture UJI.
- **Penempatan.** Urutan yang disiapkan PR #28: `004_audit_lineage.sql` (SRS-49, PR #22), `005_cutoff_time_nullable.sql` (SRS-38, PR #26), `006_import_staging_sources.sql` (SRS-50, PR #27; tidak memerlukan 005). Nomor 004 yang sudah diuji tidak dinomori ulang. Nomor-nomor ini masih reservasi kandidat, bukan keputusan final. Base PR #26 adalah `integration/adam-20261121` (PR #23), bukan `develop`, sehingga merge ke `develop` bergantung pada #22/#23.

**Tes.** Kandidat 005 memuat enam tes pada `tests/integration/database/cutoff-nullable.test.ts`: insert NULL diterima tanpa jam buatan; upgrade schema berisi data menjaga jam lama termasuk `00:00`; reapply tidak mengubah data; schema tidak dikenal ditolak atomik; pemulihan menolak bila masih ada NULL; pemulihan berjalan bila semua baris memiliki waktu sumber. Penulis PR #26 melaporkan 6/6 PASS pada PostgreSQL 16.6 UJI (deskripsi PR #26 dan komentar Jira SRS-38, 24 November 2026). Pemilik dokumen ini belum menjalankan tes tersebut. PR #26 tidak memiliki CI check karena base-nya bukan `develop`, dan tes otomatis ter-skip bila koneksi UJI tidak tersedia. **Verifikasi independen: NOT RUN.** Tes F3-2 (kombinasi precision dan `cutoff_time` yang tidak konsisten ditolak) belum disiapkan karena F3-2 tidak memiliki kandidat.

## 14. Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1 | 2026-11-12 | Usulan D-01–D-06, matriks dampak, aturan penahanan kontrak, temuan F-03/F-04 | Belum ada |
| 0.2 | 2026-11-12 | Tindak lanjut review PR #14: status belum siap merge, aturan belum dihitung bukan nol beserta skenario uji (§6), tanggal laporan dan `cutoff_id` bukan bukti basis efektif (§3) | Belum ada; seluruh usulan tetap PROPOSED |
| 0.3 | 2026-11-13 | Lampiran A: usulan keputusan teknis OD-05 (dasar waktu cutoff, timezone, UOM material), dampak, dan data mitra yang perlu divalidasi; catatan persetujuan tabel UOM dan penomoran migrasi | Belum ada; seluruh usulan tetap PROPOSED |
| 0.4 | 2026-11-15 | §13: pemisahan butir yang dapat dipakai untuk UJI, belum disahkan, dan butuh bukti mitra; usulan perubahan minimal F-03 (§13.4); penyesuaian §11 dan §12 | Arahan baseline UJI (Adam, 15 Nov 2026) untuk butir §13.1; butir lain tetap PROPOSED; §13.4 menunggu keputusan Adam |
| 0.5 | 2026-11-24 | Penyelarasan dengan PR #26 (`1886b2c`) dan register PR #28 (`c68893a`): header (tanggal, rujukan `develop` @ `28b8501`); §3 unique key dengan PostgreSQL 16.6 UJI; nama kolom D-02 disamakan dengan `status` pada migrasi 001; catatan cara baca TERBUKA untuk D-01, D-02, D-05, D-06; §1 sumber PR #26, PR #28, dan `MIGRASI_DATABASE_SRS-44.md`; §10 baris D-01 serta nama kolom dan issue terdampak D-02; §11 F-03 merujuk kandidat 005; §12 status acceptance criteria dibandingkan ulang tanpa perubahan status kelulusan; §13.2; §13.4 (status PR #15 merged, kandidat 005, pemulihan, urutan 004/005/006, tes NOT RUN secara independen); A.5 | Belum ada; seluruh usulan tetap PROPOSED. Tidak ada keputusan baru dari PM atau pemilik domain |

## Lampiran A. Usulan keputusan teknis OD-05: dasar waktu cutoff, timezone, dan UOM

**Status: PROPOSED.** Tidak ada bagian lampiran ini yang berstatus ACCEPTED. OD-05 tetap **SOURCE REQUIRED** dengan pemilik Database Architect dan sumber dari mitra (§2). Lampiran ini melengkapi D-01 (§3) dan D-04 (§6), tidak menggantikannya, serta tidak menambah UC, FR, atau NFR (baseline 16 UC, 29 FR, 14 NFR tetap).

Sumber tambahan: DOC-08 §4 (metadata batch, `source_timezone`) dan tabel transformasi timestamp lokal; DOC-07 kamus `stock_lines`/`count_lines`; `KONTRAK_SUMBER_SRS-37.md` (aturan UOM dan waktu event, gap G-03); `KEPUTUSAN_TEKNIS_SRS-40.md` (`APP_TIMEZONE` bukan bukti timezone data mitra).

### A.1 Dasar waktu cutoff

| Opsi | Uraian | Catatan |
| --- | --- | --- |
| A | `cutoff_at timestamptz` (DOC-07) | Memalsukan jam untuk cutoff tanggal-saja; bertentangan SRC-09 §7 |
| **B (usulan)** | Model D-01: `effective_date`, `effective_time` NULL, `effective_precision` (`DATE`/`DATETIME`), `effective_basis`, `basis_reference` | Tanggal-saja tetap tanggal-saja; precision eksplisit; menyelesaikan CF-04 tanpa mengarang jam |
| C | Teks mentah saja | Tidak dapat dibandingkan secara andal |

**Usulan (PROPOSED):** opsi B, dengan aturan D-01: `DATE` ⇒ `effective_time IS NULL`; `DATETIME` ⇒ `effective_time` dan `source_timezone` wajib. Nilai `effective_basis` SOURCE REQUIRED; sampai tersedia diisi teks bebas yang wajib beserta `basis_reference`. Tanggal cetak laporan bukan waktu efektif, dan `cutoff_id` yang sama adalah syarat perlu, bukan syarat cukup.

### A.2 Timezone

| Opsi | Uraian | Catatan |
| --- | --- | --- |
| A | Seluruh data dianggap `Asia/Jakarta` (default `APP_TIMEZONE`) | Zona jadwal proyek bukan bukti zona data mitra |
| **B (usulan)** | Waktu sumber disimpan `timestamptz` beserta nilai mentahnya; `source_timezone` wajib per batch bila timestamp tanpa offset; tidak ada fallback ke `APP_TIMEZONE` | Sejalan dengan DOC-08 dan kontrak SRS-37; fail-closed |
| C | Hanya UTC, tanpa nilai mentah | Transformasi tidak tertelusur (bertentangan DOC-08) |

**Usulan (PROPOSED):** opsi B.

- Batch ACTUAL dengan timestamp tanpa offset dan tanpa `source_timezone` ditolak.
- Batch UJI boleh mencantumkan `Asia/Jakarta` secara eksplisit dengan label simulasi.
- Waktu yang dibuat server (`created_at`, `validated_at`, `committed_at`) tetap `timestamptz`; `APP_TIMEZONE` hanya untuk tampilan.
- Cutoff dengan precision `DATE` tidak memerlukan timezone.

### A.3 Satuan (UOM) material

| Opsi | Uraian | Catatan |
| --- | --- | --- |
| A | Teks UOM apa adanya dari sumber | Variasi penulisan (`KG`/`Kg`/`kg`) memicu `UOM_MISMATCH` palsu |
| **B (usulan)** | Daftar kode UOM kanonik dan pemetaan alias sumber ke kode kanonik yang disetujui; tanpa konversi otomatis | Sesuai DOC-08 ("kode canonical dari mapping yang disetujui") dan SRS-37 |
| C | Konversi ke satuan dasar per material | Memerlukan faktor konversi tanpa sumber; berisiko menambah fitur |

**Usulan (PROPOSED):** opsi B.

- UOM yang tidak terpetakan ditolak pada validasi impor.
- UOM berbeda antarsisi ⇒ `UOM_MISMATCH`, variance null.
- Lebih dari satu UOM untuk material yang sama pada satu sisi ⇒ run ditolak `AMBIGUOUS_PAIR` (D-04).
- Precision quantity tetap usulan DOC-07 `numeric(20,6)`.

### A.4 Dampak

| Area | Dampak |
| --- | --- |
| Schema | Migrasi baru mengganti `cutoff_date`/`cutoff_time NOT NULL` milik 001 (F-03) dengan kolom `effective_*` dan CHECK; 001 tidak disunting. `import_batches` mendapat `source_timezone` (kondisional) dan nilai waktu mentah disimpan. Tabel referensi UOM kanonik dan alias; kolom `uom` pada baris EXPECTED/STOCK/COUNT merujuk kode kanonik. Unique `(snapshot_id, material_id, uom)` dan `(session_id, material_id, uom)` tetap. |
| API | Metadata impor dan cutoff (API-01, API-11/12/14/15) menampilkan precision, basis, dan `source_timezone`. Validasi impor memuat penolakan timezone tidak tersedia dan UOM tidak terpetakan; kode error perlu dicocokkan dengan katalog DOC-08 dan, bila belum ada, memerlukan persetujuan kontrak API. `CUTOFF_MISMATCH`, `UOM_MISMATCH`, dan `AMBIGUOUS_PAIR` sudah tersedia. |
| Tes | PVT-18; batas `DATE` vs `DATETIME` pada CHECK precision; timestamp tanpa offset ditolak bila `source_timezone` kosong, tanpa fallback; pemetaan alias UOM dan penolakan UOM tidak terpetakan; `UOM_MISMATCH` dengan variance null; `AMBIGUOUS_PAIR`; tes migrasi upgrade-aman mengikuti pola migrasi 003 (PR #15). |

### A.5 Catatan persetujuan dan ketergantungan

- **Tabel UOM kanonik dan tabel alias adalah usulan baru.** Keduanya sejalan dengan DOC-08, tetapi belum ada di DOC-07 maupun migrasi mana pun, sehingga **memerlukan persetujuan Adam** (PM & Technical Lead) sebelum masuk rancangan schema. Tanpa persetujuan, tabel ini tidak dibuat dan tidak dianggap bagian ruang lingkup.
- **Penomoran migrasi masih reservasi kandidat.** [PR #15](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/15) (SRS-44, migrasi 001–003) sudah merged ke `develop` sebagai `d1acfb4` pada 22 November 2026. Urutan yang disiapkan PR #28 adalah 004 audit (SRS-49), 005 cutoff (SRS-38, kandidat F3-1 pada PR #26), dan 006 staging (SRS-50). Migrasi opsi B atau tabel UOM, bila kelak disetujui, memerlukan nomor baru setelah 006. Ledger/checksum tiap mesin perlu dikumpulkan sebelum deployment bersama.

### A.6 Data mitra yang perlu divalidasi

| No. | Yang perlu divalidasi | Untuk keputusan |
| --- | --- | --- |
| 1 | Sampel ekspor Erasoft STOCK dan COUNT: cutoff tanggal-saja atau tanggal dan jam; dasar cutoff (akhir hari, waktu cetak, tutup buku); dokumen yang dapat menjadi `basis_reference` | A.1 |
| 2 | Zona waktu server Erasoft dan lokasi gudang (WIB tidak diasumsikan); ada atau tidaknya offset pada timestamp ekspor | A.2 |
| 3 | Daftar UOM yang dipakai Erasoft beserta variasi penulisannya; pihak yang menyetujui daftar kanonik; ada atau tidaknya material dengan lebih dari satu UOM | A.3 |
| 4 | Locale angka (koma/titik desimal) dan jumlah desimal quantity (G-03) | A.3 |
| 5 | Bagian OD-05 di luar lampiran ini: kebijakan saldo negatif, sheet/header, dan key bisnis per jenis file | Di luar lampiran |

Sampai butir 1–4 tervalidasi, implementasi cutoff ACTUAL tetap ditahan (CF-04, F-03, aturan §9). Pengujian UJI hanya memakai fixture berlabel simulasi. Lampiran ini tidak mengubah kode; tidak ada pengujian yang dijalankan.
