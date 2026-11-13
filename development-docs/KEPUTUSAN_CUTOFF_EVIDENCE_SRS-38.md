# Usulan Keputusan Cutoff, Evidence, dan Identitas Hasil — SRS-38

| Atribut | Nilai |
| --- | --- |
| Issue | [SRS-38](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-38) (T-04), parent SRS-11 / EPIC-08 |
| UC terkait | UC-09, UC-10, UC-11, UC-12, UC-13, UC-14 |
| Konflik yang ditangani | CF-03 (target evidence), CF-04 (cutoff), CF-05 (identitas/reuse hasil rekonsiliasi) |
| Status dokumen | **PROPOSED — NEEDS DECISION**. Tidak ada keputusan di dokumen ini yang berstatus ACCEPTED. Dokumen ini **belum siap merge** sebagai penyelesaian SRS-38 sampai keputusan berwenang tersedia. |
| Tanggal | 12 November 2026, Asia/Jakarta |
| Baseline repo | `origin/develop` @ `dba5c66` |
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
| `KONTRAK_SUMBER_SRS-37.md` ([PR #13](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/13), belum merged ke develop) | proposed-0.1 | Metadata `cutoff_id`, kontrak STOCK/COUNT |
| `database/migrations/001_initial_schema.sql` | `dba5c66` | Tabel `cutoff_contexts` aktual pada repo (temuan F-03) |

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
- Unique usulan: (`warehouse_id`, `mode`, `effective_date`, `effective_time`, `effective_precision`, `effective_basis`), dengan `NULLS NOT DISTINCT` atau indeks parsial, menunggu versi PostgreSQL (OD-07).

## 4. D-02 — Status verifikasi: VERIFIED dan UJI SIMULATED (CF-04)

**Konflik.** DOC-07: `VERIFIED`/`UNVERIFIED`. SRC-09 §6.5: "ACTUAL membutuhkan verifikasi; UJI membutuhkan SIMULATED". Kewenangan verifikator = OD-08 (OPEN). DOC-07 menegaskan `cutoff_contexts` "bukan workflow verifikasi baru".

**Rekomendasi (PROPOSED):**
- Domain status per mode, ditegakkan dengan CHECK:
  - `mode = 'UJI'` ⇒ `verification_status = 'SIMULATED'`.
  - `mode = 'ACTUAL'` ⇒ `verification_status IN ('VERIFIED','UNVERIFIED')`, default `UNVERIFIED`.
  - `VERIFIED` ⇒ `verification_reference IS NOT NULL`, `verified_by IS NOT NULL`, `verified_at IS NOT NULL`.
- Tidak menambah workflow/layar verifikasi baru (di luar scope). Status `VERIFIED` hanya mencatat referensi bukti eksternal.
- **Kewenangan siapa yang boleh menandai VERIFIED: BLOCKED oleh OD-08.** Sampai diputuskan, sistem *fail-closed*: rekonsiliasi ACTUAL ditolak `CUTOFF_UNVERIFIED` (AC-13), UJI hanya berjalan dengan `SIMULATED`.
- Rekonsiliasi tidak boleh mencampur ACTUAL dan UJI (`MODE_MISMATCH`).

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
- `result_fingerprint` = SHA-256 atas representasi kanonik (`stock_snapshot_id`, `count_session_id`, `cutoff_id`, `rule_version`). Snapshot/sesi bersifat immutable setelah commit, sehingga ID mewakili isinya. Hash isi baris dapat ditambahkan bila koreksi data kelak diizinkan.
- Unique `reconciliation_runs(stock_snapshot_id, count_session_id, rule_version)`.
- Perilaku API-13:
  - **Key sama + payload sama** ⇒ respons lama (idempotency).
  - **Key sama + payload beda** ⇒ 409 `IDEMPOTENCY_CONFLICT`.
  - **Key berbeda + input identik** ⇒ tidak membuat run baru; mengembalikan run yang ada (usulan HTTP 200 dengan penanda `reused: true`, bukan 201). Bentuk respons perlu persetujuan kontrak API.
  - **Input atau `rule_version` berbeda** ⇒ run baru; histori lama tetap ada (PVT-20).
- Konkurensi dua key untuk input identik ditangani unique constraint: transaksi kedua membaca run pemenang.

## 8. D-06 — Pemilihan latest run untuk metrik (UI-13/UI-14)

**Sumber.** SRC-09 UI-14: "Agregasi memilih latest committed run untuk cutoff + rule-version sama".

**Rekomendasi (PROPOSED):**
- Kelompok = (`warehouse_id`, `mode`, `cutoff_id`, `rule_version`). Latest = `created_at` terbesar, lalu `id` terbesar sebagai tie-breaker deterministik.
- Dengan D-05, input identik tidak menghasilkan dua run. Beberapa run dalam satu kelompok hanya muncul bila snapshot atau count yang berbeda di-commit untuk cutoff yang sama. Apakah kondisi itu sah, atau harus ditolak saat impor, adalah **OPEN DECISION** (OD-05/OD-06).
- Run lama tidak dihapus atau ditimpa; hanya tidak dipilih untuk agregasi.
- Run ACTUAL dengan cutoff `UNVERIFIED` tidak eligible untuk metrik.

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
| D-01 cutoff | `cutoff_contexts`: ganti `cutoff_at` dengan kolom effective_* + CHECK; revisi `cutoff_date`/`cutoff_time` di migrasi 001 | API-01 metadata cutoff; API-11/12/14/15 menampilkan precision/basis | UI-09/UI-10 metadata cutoff; Context Strip; tanggal-saja tanpa jam | PVT-18; boundary DATE vs DATETIME; `CUTOFF_MISMATCH` | SRS-44, SRS-25, SRS-27, SRS-58 |
| D-02 status | `verification_status` + CHECK per mode; `verified_by`, `verified_at` | API-13 error `CUTOFF_UNVERIFIED`/`MODE_MISMATCH` | Label UNVERIFIED/SIMULATED; alasan spesifik (§6.5) | AC-13; tolak ACTUAL UNVERIFIED; UJI wajib SIMULATED | SRS-44, SRS-58 |
| D-03 evidence | `evidence`: XOR `stock_snapshot_id`/`count_session_id` | API-17 request body berubah; API-18 menampilkan target | UI-11 pilihan target snapshot/count | Kasus XOR (0, 1, 2 target), lintas scope | Story UC-11, SRS-58 |
| D-04 grain | Tidak berubah dari DOC-07 | Error `AMBIGUOUS_PAIR` | Alasan penolakan run | Multi-UOM per material; UOM_MISMATCH | Engine rekonsiliasi |
| D-05 identitas | Unique `reconciliation_runs(snapshot, session, rule_version)`; kolom `result_fingerprint` | API-13: 200 `reused` vs 201; 409 konflik key | UI-12/13 tidak menampilkan run duplikat | PVT-20; konkurensi dua key | SRS-52 (pola idempotency), SRS-58 |
| D-06 latest run | Indeks (`cutoff_id`, `rule_version`, `created_at`, `id`) | API-16 memakai latest run | UI-14 I-REPEAT/I-EXACT/I-COVER | Tie-breaker deterministik; run lama tetap terbaca | Metrik UC-14 |

## 11. Temuan

| ID | Temuan | Tindak lanjut |
| --- | --- | --- |
| F-03 | `001_initial_schema.sql` mendefinisikan `cutoff_contexts.cutoff_time TIME NOT NULL` dan `status` `OPEN` tanpa CHECK. Ini memaksa jam untuk cutoff tanggal-saja dan tidak memiliki status verifikasi DOC-07/SRC-09. | Disesuaikan pada branch SRS-44 setelah D-01/D-02 diputuskan; tidak diubah di SRS-38 |
| F-04 | DOC-09 API-17 contoh request memakai `stock_line_id`, yang bertentangan dengan SRC-09 | Diperbarui setelah D-03 diputuskan |

## 12. Status acceptance criteria SRS-38

| Kriteria (Jira) | Status |
| --- | --- |
| Keputusan berwenang tercatat | **Belum**. Usulan dan pihak berwenang tercatat (§2–§8); belum ada persetujuan |
| Dampak schema/API/UI/tes tercatat | Tersedia (§10) |
| Kontrak yang bertentangan tidak diberlakukan bersamaan | Aturan penahanan tercatat (§9) |

Karena kriteria pertama belum terpenuhi, pekerjaan ini tetap berupa **usulan** dan **belum siap merge maupun Done**. Usulan tidak dinaikkan menjadi ACCEPTED tanpa bukti keputusan dari pihak pada §2.

Pengujian: tidak ada kode yang berubah; PVT-18 dan PVT-20 tetap NOT RUN. Skenario §6 belum dijalankan karena engine rekonsiliasi belum ada. Definition of Done memerlukan keputusan berwenang, review oleh reviewer lain, dan PR merged.

## 13. Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1 | 2026-11-12 | Usulan D-01–D-06, matriks dampak, aturan penahanan kontrak, temuan F-03/F-04 | Belum ada |
| 0.2 | 2026-11-12 | Tindak lanjut review PR #14: status belum siap merge, aturan belum dihitung bukan nol beserta skenario uji (§6), tanggal laporan dan `cutoff_id` bukan bukti basis efektif (§3) | Belum ada; seluruh usulan tetap PROPOSED |
| 0.3 | 2026-11-13 | Lampiran A: usulan keputusan teknis OD-05 (dasar waktu cutoff, timezone, UOM material), dampak, dan data mitra yang perlu divalidasi; catatan persetujuan tabel UOM dan penomoran migrasi | Belum ada; seluruh usulan tetap PROPOSED |

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
- **Penomoran migrasi (004 atau seterusnya) belum ditetapkan.** Nomor baru ditentukan setelah [PR #15](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/15) (SRS-44, saat ini berisi migrasi 001–003) merged, agar tidak terjadi bentrok urutan.

### A.6 Data mitra yang perlu divalidasi

| No. | Yang perlu divalidasi | Untuk keputusan |
| --- | --- | --- |
| 1 | Sampel ekspor Erasoft STOCK dan COUNT: cutoff tanggal-saja atau tanggal dan jam; dasar cutoff (akhir hari, waktu cetak, tutup buku); dokumen yang dapat menjadi `basis_reference` | A.1 |
| 2 | Zona waktu server Erasoft dan lokasi gudang (WIB tidak diasumsikan); ada atau tidaknya offset pada timestamp ekspor | A.2 |
| 3 | Daftar UOM yang dipakai Erasoft beserta variasi penulisannya; pihak yang menyetujui daftar kanonik; ada atau tidaknya material dengan lebih dari satu UOM | A.3 |
| 4 | Locale angka (koma/titik desimal) dan jumlah desimal quantity (G-03) | A.3 |
| 5 | Bagian OD-05 di luar lampiran ini: kebijakan saldo negatif, sheet/header, dan key bisnis per jenis file | Di luar lampiran |

Sampai butir 1–4 tervalidasi, implementasi cutoff ACTUAL tetap ditahan (CF-04, F-03, aturan §9). Pengujian UJI hanya memakai fixture berlabel simulasi. Lampiran ini tidak mengubah kode; tidak ada pengujian yang dijalankan.
