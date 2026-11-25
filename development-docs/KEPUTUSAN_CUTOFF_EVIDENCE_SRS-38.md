# Usulan Keputusan Cutoff, Evidence, dan Identitas Hasil — SRS-38

| Atribut | Nilai |
| --- | --- |
| Issue | [SRS-38](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-38) (T-04), parent SRS-11 / EPIC-08 |
| UC terkait | UC-09, UC-10, UC-11, UC-12, UC-13, UC-14 |
| Konflik yang ditangani | CF-03 (target evidence), CF-04 (cutoff), CF-05 (identitas/reuse hasil rekonsiliasi) |
| Status dokumen | **PROPOSED, dengan keputusan PM teknis untuk mode UJI tercatat di §0.** Keputusan Adam (komentar Jira SRS-38 nomor 10153, 25 Nov 2026) hanya berlaku untuk baseline UJI dan dicatat terpisah dari usulan. Butir lain, termasuk seluruh bagian ACTUAL, tetap PROPOSED atau SOURCE REQUIRED. Dokumen ini **belum siap merge** sebagai penyelesaian SRS-38 karena keputusan ACTUAL (OD-05, OD-08) belum ada dan review HEAD baru belum dilakukan. Arahan baseline UJI (Adam, 15 Nov 2026) tetap dicatat di §13. |
| Tanggal | 12 November 2026, diperbarui 15, 24, dan 25 November 2026, Asia/Jakarta |
| Baseline repo | Disusun pada `origin/develop` @ `dba5c66`. Rujukan terbaru yang dibaca: `origin/develop` @ `0ff9e4a` (25 November 2026 WIB; memuat merge PR #15 `d1acfb4`, PR #36 `3e61e0e`, PR #37 `77669f4`, dan PR #38 `0ff9e4a`). Branch ini tidak di-rebase atau digabung dengan `develop`. Pembanding: [PR #26](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/26) @ `1886b2c` (Draft) dan [PR #28](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/28) @ `c68893a` (belum merged) |
| Pemilik | Backend & Database (Dwi Rani Amelia) |

Dokumen ini menyusun opsi, rekomendasi, dan dampak untuk setiap konflik. Keputusan akhir berada pada pihak berwenang yang tercantum di §2. Sampai keputusan dicatat, berlaku aturan §9: **kontrak yang bertentangan tidak diberlakukan bersamaan**.

## 0. Keputusan PM teknis UJI yang tercatat (25 November 2026)

Sumber keputusan: Adam (PM & Technical Lead), **komentar Jira SRS-38 nomor 10153** (25 Nov 2026, 02.44 WIB), yang menanggapi PR #14 HEAD `1c85b4f` dan review Dwi. Tindak lanjut: **komentar Jira SRS-38 nomor 10188** (25 Nov 2026, 03.33 WIB) dan **komentar Adam pada PR #14** (24 Nov 2026, 20.03 UTC atau 25 Nov 2026, 03.03 WIB) yang meminta dokumen ini diselaraskan dengan 10153.

Kolom "Keputusan Adam" hanya memuat isi 10153. Kolom "Masih usulan atau terbuka" memuat bagian yang **tidak** ditetapkan Adam dan tetap berstatus usulan dokumen ini. Keputusan ini berlaku untuk baseline UJI; ACTUAL tetap ditahan.

| Butir | Keputusan Adam (sumber) | Masih usulan atau terbuka |
| --- | --- | --- |
| F3-1 dan D-01 | F3-1 dilanjutkan sebagai **migrasi 005 terpisah**: `cutoff_time` nullable untuk cutoff UJI tanggal-saja. D-01 adalah rancangan semantik yang lebih lengkap (precision, basis, zone); F3-1 **tidak** berarti seluruh D-01 sudah diimplementasikan atau bukti basis efektif sudah tersedia (10153 butir 1). Tidak mengisi jam 00:00 (10153 butir 2) | Opsi B D-01 (`effective_*`, CHECK precision, unique key) tetap PROPOSED (§3). Cara transisi dari F3-1 ke opsi B belum dirancang |
| D-02 status | **UJI = SIMULATED ditetapkan untuk baseline UJI.** Kandidat migrasi 008 dan pengecekan staging dibangun lokal oleh Adam: UJI `OPEN` ditandai SIMULATED, status lain yang tidak dikenal ditolak, ACTUAL dengan `cutoff_time` NULL ditolak (10153 butir 2) | Domain ACTUAL `VERIFIED`/`UNVERIFIED`, kolom `verification_reference`/`verified_by`/`verified_at`, dan kewenangan verifikator tetap PROPOSED dan BLOCKED oleh OD-08 (§4). Kandidat 008 belum dipush ke PR dan belum direview nonpenulis |
| D-03 evidence | Evidence harus **XOR**: tepat satu `stock_snapshot_id` atau `count_session_id` sesuai sumber (10153 butir 3) | FK `ON DELETE RESTRICT`, pemeriksaan gudang/mode oleh service, dan retensi evidence tetap usulan; kewenangan dan retensi tetap OD-08 (§5). Nomor migrasi evidence belum direservasi |
| D-04 grain | **Satu material per sisi per run**; lebih dari satu UOM pada material yang sama adalah `AMBIGUOUS_PAIR`, tidak dipilih acak; `physical_quantity` null **bukan** nol (10153 butir 3) | Grain final multi-UOM untuk ACTUAL tetap OD-05 (§6) |
| D-05 identitas | **Input identik (snapshot, count, rule, scope) memakai ulang run yang ada**, termasuk ketika Idempotency-Key berbeda. Scope identitas dan responsnya perlu tes transaksi SRS-30/SRS-52 (10153 butir 4) | Komposisi `result_fingerprint`, unique key, dan bentuk respons (HTTP 200 `reused: true`) tetap usulan (§7). Usulan §7 belum memuat scope dalam fingerprint; perlu diselaraskan. Asumsi snapshot/sesi immutable tetap terbuka |
| D-06 latest run | **Latest hanya dipilih dari run COMMITTED**; `created_at`/`id` tidak boleh mendahului keberhasilan commit. Histori tetap disimpan (10153 butir 4) | Kelompok agregasi, kolom pengurut, tie-breaker, dan indeks tetap usulan (§8). Sah atau tidaknya beberapa run per cutoff tetap OPEN DECISION |
| Nomor migrasi | Reservasi setelah 006: **007** audit append-only (Adam); **008** guard cutoff UJI/ACTUAL (Adam, review Dwi); **009** persistensi STOCK/support (Dwi); **010** COUNT (Dwi); **011** reconciliation (Dwi); **012** idempotency commit SRS-52 (Dwi). Ini reservasi nomor/modul, **bukan** perintah membuat tabel tanpa rancangan; kirim schema contract per modul sebelum integrasi; jangan menyunting 001–006 atau mengganti checksum yang sudah dipakai tim (10153 butir 5) | Isi schema setiap nomor belum final. Urutan 004 audit, 005 cutoff, 006 staging mengikuti handoff sebelumnya (§13.4) |
| Pemulihan 005 | Recovery 005 khusus harness kini mengubah schema dan ledger pada transaksi yang sama dan diuji untuk reapply. Untuk database bersama wajib inventaris/backup dan review Dwi; ledger tidak dihapus manual (10153 butir 6) | Perbaikan recovery ledger dan 008 dari kandidat Adam belum tercakup PR #26 @ `1886b2c` (10188). Prosedur database bersama belum ditulis sebagai dokumen tersendiri |
| ACTUAL | **Tetap SOURCE REQUIRED dan ditahan.** CF-04/OD-08 (kewenangan dan sumber ACTUAL) memerlukan bukti mitra; pekerjaan UJI dan fungsi murni tidak perlu menunggu itu (10153 penutup) | Sumber ACTUAL yang masih diperlukan tercantum di §13.3 dan Lampiran A.6 |

Tidak ada butir di luar kolom "Keputusan Adam" yang dinaikkan statusnya. Keputusan di atas bukan approval PR #14; review GitHub PR #14 masih berstatus CHANGES_REQUESTED.

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
| Komentar Jira SRS-38 nomor 10153 (Adam) | 25 Nov 2026, 02.44 WIB | Keputusan PM teknis UJI: F3-1, D-02 sampai D-06, reservasi migrasi 007–012, pemulihan 005 (§0) |
| Komentar Jira SRS-38 nomor 10188 (Adam) | 25 Nov 2026, 03.33 WIB | Hasil QA cutoff pada kandidat `b6d9766`; cakupan PR #26 @ `1886b2c`; permintaan merekam 10153 dan sumber ACTUAL |
| Komentar Adam pada PR #14 | 24 Nov 2026, 20.03 UTC (25 Nov 2026, 03.03 WIB), HEAD `1c85b4f` | Permintaan penyelarasan dokumen dengan keputusan UJI dan pemisahan kewenangan/basis/jam ACTUAL |
| [PR #36](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/36) (SRS-29) | HEAD `70d1ec4`, **merged** ke develop `3e61e0e` (24 Nov 2026, 19.58 UTC) | Engine rekonsiliasi murni enam status: grain, `AMBIGUOUS_PAIR`, `UOM_MISMATCH`, belum dihitung bukan nol (D-04) |
| [PR #37](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/37) (SRS-32) | HEAD `c8da43b`, **merged** ke develop `77669f4` (24 Nov 2026, 19.59 UTC) | Fungsi I-VAR per pasangan valid; variance nonvalid null (D-04, UI-14) |
| [PR #38](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/38) (SRS-27) | HEAD `bea1f14`, **merged** ke develop `0ff9e4a` (24 Nov 2026, 20.01 UTC) | DTO/mapper dan interface repository COUNT; `physical_quantity` null dipertahankan (D-04) |

Sumber yang belum tersedia: SRS/PRD final (OD-01, OD-03), sampel kartu stok dan hasil hitung mitra (OD-05), keputusan verifikator cutoff dan retensi (OD-08).

## 2. Pihak berwenang untuk keputusan

| Keputusan | Pemilik menurut DOC-00 | Status |
| --- | --- | --- |
| Model cutoff (basis, precision, timezone) | OD-05 — Database Architect, dengan sumber dari mitra | OPEN DECISION |
| Kewenangan VERIFIED, target evidence, retensi | OD-08 — Business Analyst | OPEN DECISION |
| Konflik desain lintas schema/API/UI | PM & Technical Lead (Adam) | Keputusan PM teknis untuk mode UJI tercatat (komentar Jira SRS-38 nomor 10153, §0); bagian ACTUAL tetap menunggu OD-05/OD-08 |

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

**Hubungan D-01 dengan F3-1 — diputuskan untuk UJI (Adam, komentar Jira SRS-38 nomor 10153 butir 1).** F3-1 dilanjutkan sebagai migrasi 005 terpisah untuk cutoff UJI tanggal-saja. D-01 adalah rancangan semantik yang lebih lengkap (precision, basis, zone), dan F3-1 tidak berarti seluruh D-01 sudah diimplementasikan. Dengan demikian pertanyaan cara baca terhadap PR #28 pada versi 0.5 terjawab: F3-1 mendahului dan merupakan bagian kecil dari D-01, bukan penggantinya. **Opsi B tetap PROPOSED**; cara transisi dari `cutoff_time` NULL ke kolom `effective_*` belum dirancang.

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

**Keputusan UJI (Adam, komentar Jira SRS-38 nomor 10153 butir 2 dan 5).** D-02 UJI = SIMULATED ditetapkan untuk baseline UJI. Penegakannya dipisah dari 005: guard cutoff UJI/ACTUAL direservasi sebagai migrasi **008** (Adam, review Dwi). Kandidat 008 yang dibangun lokal oleh Adam menandai UJI `OPEN` sebagai SIMULATED, menolak status lain yang tidak dikenal, dan menolak ACTUAL dengan `cutoff_time` NULL tanpa mengisi jam. Kandidat ini belum dipush ke PR dan belum direview nonpenulis. **Bagian ACTUAL dari rekomendasi di atas tetap PROPOSED**: domain `VERIFIED`/`UNVERIFIED`, default `UNVERIFIED`, dan tiga kolom verifikasi menunggu OD-08.

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

**Keputusan UJI (Adam, komentar Jira SRS-38 nomor 10153 butir 3).** Evidence harus XOR: tepat satu `stock_snapshot_id` atau `count_session_id` sesuai sumber. Ini sama dengan inti opsi B. Rincian lain di atas (FK `ON DELETE RESTRICT`, pemeriksaan gudang/mode oleh service) tetap usulan. Kewenangan dan retensi evidence tetap OD-08. Nomor migrasi untuk tabel `evidence` belum direservasi pada 10153.

## 6. D-04 — Grain pasangan rekonsiliasi

**Sumber.** DOC-07/08 sudah mengusulkan: satu hasil per material per run; lebih dari satu baris/UOM untuk material yang sama ⇒ run ditolak `AMBIGUOUS_PAIR`. SRC-09 UI-14: tidak menjumlah beda UOM.

**Rekomendasi (PROPOSED), tanpa perubahan dari DOC-07/08:**
- Kunci pasangan = `material_id` dalam run; unique `reconciliation_lines(run_id, material_id)`.
- Sumber tetap disimpan apa adanya: unique `stock_lines(snapshot_id, material_id, uom)` dan `count_lines(session_id, material_id, uom)`.
- Satu baris per sisi dengan UOM berbeda ⇒ status `UOM_MISMATCH` (nonvalid, variance null). Lebih dari satu baris di satu sisi ⇒ seluruh run ditolak `AMBIGUOUS_PAIR`.
- Variance hanya untuk pasangan valid: **Physical Quantity − System Quantity**.
- Grain final multi-UOM per material tetap OD-05.

**Keputusan UJI (Adam, komentar Jira SRS-38 nomor 10153 butir 3).** Satu material per sisi per run; lebih dari satu UOM pada material yang sama adalah `AMBIGUOUS_PAIR` dan tidak dipilih secara acak; `physical_quantity` null bukan nol. Grain final multi-UOM untuk ACTUAL tetap OD-05.

**Belum dihitung bukan nol.** `physical_quantity` null dan item yang belum dihitung (`is_counted = false`) **tidak** diperlakukan sebagai nol dan **tidak** menghasilkan DISCREPANCY. Baris COUNT yang tidak ada juga bukan nol. Variance hanya dihitung untuk pasangan yang terhitung (`is_counted = true`), UOM sama, dan valid; untuk status nonvalid variance wajib null. Aturan ini dipertahankan dalam skenario uji berikut (data UJI, `system_quantity = 10` bila stok ada):

| Skenario | Input COUNT | Status | Variance |
| --- | --- | --- | --- |
| Dihitung, fisik nol | `is_counted = true`, `physical_quantity = 0` | DISCREPANCY | −10 |
| Dihitung, sama dengan sistem | `is_counted = true`, `physical_quantity = 10` | MATCHED | 0 |
| Belum dihitung | `is_counted = false`, `physical_quantity = null` | NOT_COUNTED | null |
| Baris COUNT tidak ada | — | COUNT_MISSING | null |
| Stok tidak ada, count ada (8) | `is_counted = true`, `physical_quantity = 8` | STOCK_MISSING | null |
| UOM berbeda | `is_counted = true`, UOM lain | UOM_MISMATCH | null |

Keenam skenario di atas memiliki tes dengan nama yang sesuai pada `apps/api/src/tests/reconciliation-engine.test.ts` di `develop` (engine murni [PR #36](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/36), merged `3e61e0e`). Engine ini bukan service, schema 011, transaksi, atau otorisasi. Tes tersebut tidak ada pada branch dokumen ini dan **belum dijalankan oleh pemilik dokumen**; hasil yang dilaporkan berasal dari review Adam pada PR #36.

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

**Keputusan UJI (Adam, komentar Jira SRS-38 nomor 10153 butir 4).** Input identik (snapshot, count, rule, scope) memakai ulang run yang ada, termasuk ketika Idempotency-Key berbeda. Scope identitas dan responsnya perlu tes transaksi SRS-30/SRS-52. Keputusan ini memuat **scope** sebagai bagian identitas, sedangkan usulan `result_fingerprint` di atas belum memuat scope; komposisi fingerprint, unique key, dan bentuk respons (`reused: true`, HTTP 200) tetap usulan dan perlu diselaraskan.

**Catatan cara baca terhadap PR #28 — TERBUKA.** PR #28 mencatat bahwa koreksi input immutable masih memerlukan keputusan domain. Karena itu, asumsi immutable di atas belum menjadi dasar yang disahkan. Bila koreksi snapshot/sesi diizinkan, fingerprint berbasis ID tidak lagi cukup dan hash isi baris diperlukan.

## 8. D-06 — Pemilihan latest run untuk metrik (UI-13/UI-14)

**Sumber.** SRC-09 UI-14: "Agregasi memilih latest committed run untuk cutoff + rule-version sama".

**Rekomendasi (PROPOSED):**
- Kelompok = (`warehouse_id`, `mode`, `cutoff_id`, `rule_version`). Latest = `created_at` terbesar, lalu `id` terbesar sebagai tie-breaker deterministik.
- Dengan D-05, input identik tidak menghasilkan dua run. Beberapa run dalam satu kelompok hanya muncul bila snapshot atau count yang berbeda di-commit untuk cutoff yang sama. Apakah kondisi itu sah, atau harus ditolak saat impor, adalah **OPEN DECISION** (OD-05/OD-06).
- Run lama tidak dihapus atau ditimpa; hanya tidak dipilih untuk agregasi.
- Run ACTUAL dengan cutoff `UNVERIFIED` tidak eligible untuk metrik.

**Keputusan UJI (Adam, komentar Jira SRS-38 nomor 10153 butir 4).** Latest hanya dipilih dari run COMMITTED; `created_at`/`id` tidak boleh mendahului keberhasilan commit. Histori tetap disimpan. Akibatnya, usulan "latest = `created_at` terbesar" di atas hanya berlaku di antara run yang sudah COMMITTED; kolom pengurut yang mencerminkan keberhasilan commit dan tie-breaker final belum ditetapkan dan tetap usulan.

**Catatan cara baca terhadap PR #28 — TERBUKA.** Kelompok dan tie-breaker usulan sama dengan PR #28 (gudang/mode/cutoff/rule; `created_at`, lalu UUID). Perbedaan yang belum disepakati:
- PR #28 menambahkan tes pemisahan scope dan metadata run terpilih, yang belum tercantum pada §10.
- Indeks usulan §10 tidak memuat `warehouse_id` dan `mode`, padahal kelompok memuatnya. Apakah keduanya cukup diwakili `cutoff_id` (karena `cutoff_contexts` menyimpan `warehouse_id` dan `mode`) belum diputuskan.
- PR #28 menyerahkan sah atau tidaknya beberapa snapshot/sesi pada cutoff yang sama kepada mitra, sedangkan dokumen ini mencatatnya sebagai OPEN DECISION OD-05/OD-06. Pemilik keputusannya belum disepakati.

## 9. Kontrak yang berlaku sampai keputusan diambil

| Area | Kontrak yang dirujuk saat ini | Kontrak yang **ditahan** | Aturan |
| --- | --- | --- | --- |
| Cutoff | Untuk UJI: F3-1, `cutoff_time` NULL = tanggal-saja (migrasi 005) dan UJI = SIMULATED (guard 008), keputusan 10153. `cutoff_id` identik tetap syarat perlu, bukan cukup (DOC-08) | `cutoff_at` DOC-07, opsi B §3, seluruh cutoff ACTUAL | Kandidat 005 (PR #26) dan 008 (lokal Adam) belum merged atau direview nonpenulis; sampai merged, UJI tetap memakai fixture. ACTUAL ditahan (OD-05/OD-08) |
| Evidence | Untuk UJI: XOR `stock_snapshot_id`/`count_session_id`, keputusan 10153 | `stock_line_id` DOC-07/09; rincian FK opsi B §5; kewenangan dan retensi (OD-08) | Implementasi API-17 mengikuti XOR; nomor migrasi evidence belum direservasi |
| Identitas run | Untuk UJI: input identik (snapshot, count, rule, scope) memakai ulang run walaupun key berbeda, keputusan 10153 | Komposisi fingerprint dan bentuk respons §7 | PVT-20 tetap NOT RUN sampai tes transaksi SRS-30/SRS-52 tersedia |
| Latest run | Untuk UJI: hanya dari run COMMITTED, keputusan 10153 | Kelompok, kolom pengurut, tie-breaker §8 | Histori tidak dihapus |
| Grain | DOC-07/08 (`AMBIGUOUS_PAIR`) dan keputusan 10153 | — | Grain multi-UOM ACTUAL tetap OD-05 |

## 10. Matriks dampak

| Keputusan | Schema (DOC-07 / migrasi) | API (DOC-09) | UI (design.md / DOC-10) | Tes (DOC-13) | Issue terdampak |
| --- | --- | --- | --- | --- | --- |
| D-01 cutoff | `cutoff_contexts`: kandidat `005_cutoff_time_nullable.sql` ([PR #26](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/26) @ `1886b2c`, Draft) hanya melepas `NOT NULL` dari `cutoff_time` (F3-1, §13.4). Kolom `effective_*` + CHECK opsi B tetap PROPOSED dan memerlukan migrasi terpisah. Migrasi 001 tidak diubah | API-01 metadata cutoff; API-11/12/14/15 menampilkan precision/basis; DTO tidak menampilkan jam buatan untuk `cutoff_time` NULL | UI-09/UI-10 metadata cutoff; Context Strip; tanggal-saja tanpa jam | PVT-18; boundary DATE vs DATETIME; `CUTOFF_MISMATCH`; enam tes kandidat 005 (§13.4) | SRS-38 (migrasi 005), SRS-25, SRS-27, SRS-58 |
| D-02 status | Guard UJI = SIMULATED dan penolakan ACTUAL tanpa jam pada migrasi **008** (reservasi 10153; kandidat lokal Adam, review Dwi). Bagian ACTUAL usulan: CHECK `VERIFIED`/`UNVERIFIED` dan kolom `verification_reference`, `verified_by`, `verified_at` | API-13 error `CUTOFF_UNVERIFIED`/`MODE_MISMATCH` | Label UNVERIFIED/SIMULATED; alasan spesifik (§6.5) | AC-13; tolak ACTUAL UNVERIFIED; UJI wajib SIMULATED; tes guard 008 | SRS-38 (008), SRS-58 |
| D-03 evidence | `evidence`: XOR `stock_snapshot_id`/`count_session_id` (keputusan UJI 10153); nomor migrasi belum direservasi | API-17 request body berubah; API-18 menampilkan target | UI-11 pilihan target snapshot/count | Kasus XOR (0, 1, 2 target), lintas scope | Story UC-11, SRS-58 |
| D-04 grain | Persistensi reconciliation pada migrasi **011** (reservasi 10153, Dwi); COUNT pada **010**, STOCK/support pada **009** | Error `AMBIGUOUS_PAIR` | Alasan penolakan run | Multi-UOM per material; UOM_MISMATCH; tes engine murni PR #36 (merged `3e61e0e`) | SRS-29 (engine merged, service belum), SRS-27 (DTO COUNT PR #38 merged `0ff9e4a`) |
| D-05 identitas | Unique `reconciliation_runs(snapshot, session, rule_version)` dan `result_fingerprint` (usulan; scope perlu ditambahkan sesuai 10153) pada **011**; idempotency commit pada **012** (reservasi 10153, Dwi) | API-13: 200 `reused` vs 201; 409 konflik key | UI-12/13 tidak menampilkan run duplikat | PVT-20; konkurensi dua key; tes transaksi SRS-30/SRS-52 | SRS-30, SRS-52, SRS-58 |
| D-06 latest run | Indeks (`cutoff_id`, `rule_version`, `created_at`, `id`) usulan; pemilihan hanya dari run COMMITTED (keputusan 10153) | API-16 memakai latest run COMMITTED | UI-14 I-REPEAT/I-EXACT/I-COVER | Tie-breaker deterministik; run belum COMMITTED tidak terpilih; run lama tetap terbaca | SRS-32 (I-VAR PR #37 merged `77669f4`; metrik lain belum), metrik UC-14 |

## 11. Temuan

| ID | Temuan | Tindak lanjut |
| --- | --- | --- |
| F-03 | `001_initial_schema.sql` mendefinisikan `cutoff_contexts.cutoff_time TIME NOT NULL` dan `status` `OPEN` tanpa CHECK. Ini memaksa jam untuk cutoff tanggal-saja dan tidak memiliki status verifikasi DOC-07/SRC-09. | Untuk bagian `cutoff_time`, Adam memutuskan F3-1 sebagai migrasi 005 terpisah (komentar Jira SRS-38 nomor 10153). Kandidatnya ada pada [PR #26](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/26) @ `1886b2c` (Draft), belum direview nonpenulis dan belum merged. Bagian `status` tanpa CHECK ditangani terpisah oleh guard 008 (reservasi 10153; kandidat lokal Adam, belum dipush). Dokumen ini tidak mengubah migrasi, dan scope SRS-44 (Done) tidak diperluas |
| F-04 | DOC-09 API-17 contoh request memakai `stock_line_id`, yang bertentangan dengan SRC-09 | Diperbarui setelah D-03 diputuskan |

## 12. Status acceptance criteria SRS-38

| Kriteria (Jira) | Status |
| --- | --- |
| Keputusan berwenang tercatat | **Sebagian, bertambah pada 25 Nov 2026.** Keputusan PM teknis UJI (Adam, komentar Jira SRS-38 nomor 10153) tercatat di §0: F3-1, D-02 UJI = SIMULATED, inti D-03 sampai D-06, reservasi migrasi 007–012, dan pemulihan 005. Arahan baseline UJI (Adam, 15 Nov 2026) tetap di §13.1. **Belum ada:** keputusan ACTUAL (OD-05, OD-08, CF-04), D-01 opsi B, rincian fingerprint dan respons D-05, kolom pengurut D-06, dan tabel UOM |
| Dampak schema/API/UI/tes tercatat | **Tersedia, dengan celah tercatat** (§10). Baris D-02, D-04, D-05, dan D-06 diperbarui dengan reservasi migrasi 008–012 dan modul yang sudah merged (PR #36, #37, #38). Tes D-06 tambahan dari PR #28 (pemisahan scope, metadata run terpilih) belum dimasukkan ke §10 (catatan §8) |
| Kontrak yang bertentangan tidak diberlakukan bersamaan | **Aturan penahanan tercatat** (§9). Hubungan D-01 dengan F3-1 sudah diputuskan untuk UJI (§3): F3-1 berlaku lebih dulu, opsi B tetap usulan. Risiko yang tersisa: bila opsi B kelak disetujui, cara transisi dari `cutoff_time` NULL ke kolom `effective_*` perlu dirancang agar dua kontrak cutoff tidak berlaku bersamaan. PR #26 masih Draft dan belum merged |

Karena kriteria pertama baru terpenuhi sebagian (bagian ACTUAL belum diputuskan), pekerjaan ini tetap **belum siap merge maupun Done**. Usulan tidak dinaikkan statusnya tanpa bukti keputusan dari pihak pada §2.

Review: review formal terakhir PR #14 (Adam, 24 Nov 2026 pukul 02.08 WIB) berstatus COMMENT, bukan APPROVED, sehingga status review GitHub masih CHANGES_REQUESTED. Komentar Adam pada PR #14 (24 Nov 2026, 20.03 UTC) meminta dokumen diselaraskan dengan keputusan 10153 lalu meminta review HEAD baru. Versi 0.6 adalah tindak lanjutnya.

Pengujian: dokumen ini tidak mengubah kode; PVT-18 dan PVT-20 tetap NOT RUN. Skenario §6 sudah memiliki tes pada engine murni PR #36 di `develop`, tetapi tidak dijalankan oleh pemilik dokumen ini. Adam melaporkan delapan tes `cutoff-nullable.test.ts` PASS pada PostgreSQL 16.6 untuk kandidat `b6d9766` (komentar Jira SRS-38 nomor 10188; evidence pada lampiran SRS-68 nomor 10005), sedangkan PR #26 @ `1886b2c` belum mencakup perbaikan recovery ledger dan 008. Verifikasi independen oleh pemilik dokumen: **NOT RUN** (§13.4). Definition of Done memerlukan keputusan berwenang, review oleh reviewer lain, dan PR merged.

## 13. Status butir setelah arahan baseline UJI (Adam, 15 Nov 2026)

Bagian ini memisahkan butir usulan §3–§8 dan Lampiran A ke dalam tiga kelompok. Label yang dipakai untuk kelompok pertama adalah **arahan baseline UJI (Adam, 15 Nov 2026)**; label ini **bukan** status ACCEPTED dan hanya berlaku untuk mode UJI. Tidak ada butir lain yang berubah status. Rujukan bukti arahan: Adam, chat grup Capstone 42, 15 Nov 2026, 15.11 WIB.

**Pembaruan 25 Nov 2026.** Butir yang diputuskan Adam pada komentar Jira SRS-38 nomor 10153 dipindahkan ke Kelompok 1 dengan label **keputusan PM teknis UJI (10153)**. Bagian yang tidak ditetapkan pada 10153 tetap di Kelompok 2 atau 3.

### 13.1 Kelompok 1 — Dapat dipakai untuk UJI sekarang

| Butir | Rujukan | Aturan yang berlaku untuk UJI | Batasan |
| --- | --- | --- | --- |
| Cutoff tanggal-saja tidak diberi jam | D-01 (§3), A.1 | Cutoff yang sumbernya hanya tanggal disimpan dan ditampilkan tanpa jam; tidak diisi 00.00 atau jam lain | Bentuk kolom opsi B (`effective_*`, unique key) tetap PROPOSED. Migrasi 001 masih mewajibkan `cutoff_time` (F-03). F3-1 sudah dipilih (10153), tetapi aturan ini baru tegak di database setelah migrasi 005 direview dan merged; sampai itu UJI memakai fixture |
| Cutoff UJI berlabel SIMULATED | D-02 (§4) | `mode = 'UJI'` ⇒ status cutoff `SIMULATED`; data UJI tidak disajikan sebagai data operasional | Bagian ACTUAL dari D-02 (`VERIFIED`/`UNVERIFIED`, kewenangan verifikator) tetap ditahan (Kelompok 3) |
| Grain pasangan dan penolakan pasangan ambigu | D-04 (§6) | Mengikuti DOC-07/08 apa adanya: satu hasil per material per run, `AMBIGUOUS_PAIR`, `UOM_MISMATCH` dengan variance null, belum dihitung bukan nol | Grain final multi-UOM untuk ACTUAL tetap OD-05. Skenario §6 belum dijalankan |
| ACTUAL ditahan | §9, A.6 | Rekonsiliasi dan cutoff ACTUAL tidak dijalankan; fail-closed (`CUTOFF_UNVERIFIED`) | Dibuka hanya setelah OD-05 dan OD-08 diputuskan; ditegaskan ulang pada 10153 (CF-04/OD-08 memerlukan bukti mitra) |
| F3-1: `cutoff_time` nullable sebagai migrasi 005 terpisah | §3, §13.4; keputusan PM teknis UJI (10153 butir 1) | `cutoff_time IS NULL` = cutoff UJI tanggal-saja; tanpa backfill dan tanpa jam 00:00 | Bukan persetujuan seluruh D-01; opsi B tetap Kelompok 2. Kandidat PR #26 belum direview nonpenulis dan belum merged |
| Guard UJI = SIMULATED (008) | §4; keputusan PM teknis UJI (10153 butir 2 dan 5) | UJI wajib SIMULATED; ACTUAL dengan `cutoff_time` NULL ditolak | Kandidat 008 lokal Adam, belum dipush dan belum direview Dwi. Bagian ACTUAL D-02 tetap Kelompok 3 |
| Evidence XOR | §5; keputusan PM teknis UJI (10153 butir 3) | Tepat satu `stock_snapshot_id` atau `count_session_id` | Rincian FK dan pemeriksaan service tetap Kelompok 2; kewenangan dan retensi OD-08 |
| Reuse run untuk input identik | §7; keputusan PM teknis UJI (10153 butir 4) | Input identik (snapshot, count, rule, scope) memakai ulang run, termasuk dengan Idempotency-Key berbeda | Fingerprint dan bentuk respons tetap Kelompok 2; perlu tes transaksi SRS-30/SRS-52 |
| Latest hanya dari run COMMITTED | §8; keputusan PM teknis UJI (10153 butir 4) | Run yang belum COMMITTED tidak dipilih; histori tetap disimpan | Kelompok, kolom pengurut, dan tie-breaker tetap Kelompok 2 |
| Reservasi nomor migrasi 007–012 | §0, §13.4; keputusan PM teknis UJI (10153 butir 5) | 007 audit (Adam), 008 guard cutoff (Adam, review Dwi), 009 STOCK/support, 010 COUNT, 011 reconciliation, 012 idempotency SRS-52 (Dwi) | Reservasi nomor/modul, bukan schema final; 001–006 dan checksum tidak diubah |

### 13.2 Kelompok 2 — Belum disahkan

Butir berikut tetap **PROPOSED** dan tidak diimplementasikan, termasuk untuk UJI, sampai ada keputusan dari pihak pada §2.

| Butir | Rujukan | Yang menunggu keputusan |
| --- | --- | --- |
| D-03 rincian evidence | §5, F-04 | FK `ON DELETE RESTRICT`, pemeriksaan gudang/mode oleh service, nomor migrasi evidence (inti XOR sudah Kelompok 1) |
| D-05 rincian identitas | §7 | Komposisi `result_fingerprint` (termasuk scope sesuai 10153), unique `reconciliation_runs`, respons `reused`; PVT-20 tetap NOT RUN |
| D-06 rincian latest run | §8 | Kelompok, kolom pengurut, dan tie-breaker agregasi; status beberapa run per cutoff (OD-05/OD-06) |
| Tabel UOM kanonik dan alias | A.3, A.5 | Persetujuan Adam sebelum masuk rancangan schema; tanpa itu tabel tidak dibuat |
| Bentuk kolom cutoff opsi B dan unique key | §3, A.1 | Nama kolom, CHECK precision, unique (bergantung OD-07) |
| Model timezone opsi B | A.2 | Termasuk izin UJI mencantumkan `Asia/Jakarta` secara eksplisit |
| Penerapan F3-1 dan pemulihan pada database bersama | §13.4 | Pilihan F3-1 sudah diputuskan (Kelompok 1). Yang tersisa: review nonpenulis dan merge PR #26, adopsi perbaikan recovery ledger dari kandidat Adam, serta prosedur database bersama (inventaris/backup, review Dwi, tanpa menghapus ledger manual) |
| Perbedaan cara baca dengan PR #28 | §7, §8 | Asumsi immutable (D-05); indeks, tes, dan pemilik keputusan beberapa run per cutoff (D-06). Hubungan D-01 dengan F3-1 dan pemisahan CHECK status sudah dijawab 10153 (§3, §4) |

### 13.3 Kelompok 3 — Membutuhkan bukti mitra

Butir berikut tidak dapat diputuskan dari dokumen repo saja dan **tetap ditahan** sampai sumber dari mitra tersedia. Tidak ada nilai yang dikarang. Seluruh butir ACTUAL tetap **SOURCE REQUIRED**; Adam menegaskan bahwa CF-04/OD-08 (kewenangan dan sumber ACTUAL) memerlukan bukti mitra (komentar Jira SRS-38 nomor 10153) dan meminta sumber ACTUAL yang masih diperlukan dicatat (nomor 10188). Daftar di bawah adalah catatan tersebut.

| Butir | Open decision | Bukti yang dibutuhkan |
| --- | --- | --- |
| Basis cutoff ACTUAL (`effective_basis`, `basis_reference`), tanggal-saja atau tanggal-jam | OD-05 | Sampel ekspor Erasoft STOCK dan COUNT; dokumen dasar cutoff (A.6 butir 1) |
| Timezone data ACTUAL | OD-05 | Zona waktu server Erasoft dan gudang; ada/tidaknya offset (A.6 butir 2) |
| Daftar UOM ACTUAL dan material multi-UOM | OD-05 | Daftar UOM Erasoft, variasi penulisan, pihak penyetuju (A.6 butir 3) |
| Locale dan desimal quantity | OD-05 | Contoh angka pada ekspor (A.6 butir 4, G-03) |
| Kewenangan VERIFIED dan retensi evidence | OD-08 | Keputusan Business Analyst beserta pihak mitra yang berwenang |
| Bagian OD-05 lain (saldo negatif, sheet/header, key bisnis) | OD-05 | A.6 butir 5 |

### 13.4 Usulan perubahan minimal F-03 (untuk diputuskan Adam)

**Status: F3-1 dipilih oleh Adam (komentar Jira SRS-38 nomor 10153 butir 1) — kandidat belum direview nonpenulis dan belum merged.** Opsi F3-2 dan F3-3 di bawah dipertahankan sebagai catatan riwayat. [PR #15](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/15) (SRS-44, migrasi 001–003) sudah merged ke `develop` sebagai `d1acfb4` pada 22 November 2026, dan F3-1 tidak menjadi bagian SRS-44. Kandidat F3-1 disiapkan Adam pada [PR #26](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/26) @ `1886b2c` (Draft); pemilik domain migrasi 005 adalah Dwi. Dokumen ini tidak mengubah migrasi apa pun, dan migrasi 001 tidak disunting (sejalan dengan A.4).

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
- **Pemulihan.** Script `database/migrations/recovery/005_restore_cutoff_time_required.sql` berada di luar runner migrasi maju. Script ini menolak mengembalikan `NOT NULL` bila masih ada `cutoff_time` NULL (`CUTOFF005_RECOVERY_REQUIRES_SOURCE`) dan tidak mengubah data. Langkah menurut PR #26/#28: hentikan penulis data, ambil backup, inventarisasi baris NULL; bila tidak ada sumber waktu yang sah, gunakan roll-forward dan jangan mengisi `00:00` atau menghapus baris. **Pembaruan 25 Nov 2026 (10153 butir 6):** recovery 005 khusus harness kini mengubah schema dan ledger pada transaksi yang sama dan diuji untuk reapply (kandidat lokal Adam; belum tercakup PR #26 @ `1886b2c` menurut 10188). Untuk database bersama wajib inventaris/backup dan review Dwi; ledger tidak dihapus manual. Prosedur tertulis untuk database bersama belum ada.
- **Makna NULL tersirat.** Pada F3-1, arti "NULL = tanggal-saja" hanya tercatat di dokumen; database tidak menyimpan precision eksplisit. Perubahan juga berlaku untuk baris ACTUAL karena kolomnya dipakai bersama; penolakan ACTUAL bergantung pada baseline akses, bukan constraint.
- **Label SIMULATED tidak termasuk F-03 jam.** Kolom `status` pada 001 (default `OPEN`, tanpa CHECK) adalah bagian lain dari temuan F-03. Adam memutuskan penegakan `UJI ⇒ SIMULATED` dipisah dari 005 sebagai guard 008 (10153 butir 2 dan 5; lihat §4). Kandidat 005 tetap tidak menyentuh status.
- **Penempatan.** Urutan yang disiapkan PR #28: `004_audit_lineage.sql` (SRS-49, PR #22), `005_cutoff_time_nullable.sql` (SRS-38, PR #26), `006_import_staging_sources.sql` (SRS-50, PR #27; tidak memerlukan 005). Nomor 004 yang sudah diuji tidak dinomori ulang. Reservasi setelah 006 menurut 10153 butir 5: 007 audit append-only (Adam), 008 guard cutoff UJI/ACTUAL (Adam, review Dwi), 009 STOCK/support, 010 COUNT, 011 reconciliation, 012 idempotency SRS-52 (Dwi). Seluruh nomor adalah reservasi nomor/modul, bukan schema final. Base PR #26 adalah `integration/adam-20261121` (PR #23), bukan `develop`, sehingga merge ke `develop` bergantung pada #22/#23.

**Tes.** Kandidat 005 memuat enam tes pada `tests/integration/database/cutoff-nullable.test.ts`: insert NULL diterima tanpa jam buatan; upgrade schema berisi data menjaga jam lama termasuk `00:00`; reapply tidak mengubah data; schema tidak dikenal ditolak atomik; pemulihan menolak bila masih ada NULL; pemulihan berjalan bila semua baris memiliki waktu sumber. Penulis PR #26 melaporkan 6/6 PASS pada PostgreSQL 16.6 UJI (deskripsi PR #26 dan komentar Jira SRS-38, 24 November 2026). Pemilik dokumen ini belum menjalankan tes tersebut. PR #26 tidak memiliki CI check karena base-nya bukan `develop`, dan tes otomatis ter-skip bila koneksi UJI tidak tersedia. **Verifikasi independen: NOT RUN.** Pembaruan 25 Nov 2026: Adam melaporkan delapan tes `cutoff-nullable.test.ts` PASS pada PostgreSQL 16.6 untuk kandidat `b6d9766` (tanggal-saja, upgrade termasuk 00:00, reapply, penolakan schema asing, recovery dengan/tanpa NULL, ledger 005, dan guard 008), dengan evidence pada lampiran SRS-68 nomor 10005 (komentar Jira SRS-38 nomor 10188). Hasil ini juga belum dijalankan ulang oleh pemilik dokumen. Tes F3-2 (kombinasi precision dan `cutoff_time` yang tidak konsisten ditolak) belum disiapkan karena F3-2 tidak memiliki kandidat.

## 14. Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1 | 2026-11-12 | Usulan D-01–D-06, matriks dampak, aturan penahanan kontrak, temuan F-03/F-04 | Belum ada |
| 0.2 | 2026-11-12 | Tindak lanjut review PR #14: status belum siap merge, aturan belum dihitung bukan nol beserta skenario uji (§6), tanggal laporan dan `cutoff_id` bukan bukti basis efektif (§3) | Belum ada; seluruh usulan tetap PROPOSED |
| 0.3 | 2026-11-13 | Lampiran A: usulan keputusan teknis OD-05 (dasar waktu cutoff, timezone, UOM material), dampak, dan data mitra yang perlu divalidasi; catatan persetujuan tabel UOM dan penomoran migrasi | Belum ada; seluruh usulan tetap PROPOSED |
| 0.4 | 2026-11-15 | §13: pemisahan butir yang dapat dipakai untuk UJI, belum disahkan, dan butuh bukti mitra; usulan perubahan minimal F-03 (§13.4); penyesuaian §11 dan §12 | Arahan baseline UJI (Adam, 15 Nov 2026) untuk butir §13.1; butir lain tetap PROPOSED; §13.4 menunggu keputusan Adam |
| 0.5 | 2026-11-24 | Penyelarasan dengan PR #26 (`1886b2c`) dan register PR #28 (`c68893a`): header (tanggal, rujukan `develop` @ `28b8501`); §3 unique key dengan PostgreSQL 16.6 UJI; nama kolom D-02 disamakan dengan `status` pada migrasi 001; catatan cara baca TERBUKA untuk D-01, D-02, D-05, D-06; §1 sumber PR #26, PR #28, dan `MIGRASI_DATABASE_SRS-44.md`; §10 baris D-01 serta nama kolom dan issue terdampak D-02; §11 F-03 merujuk kandidat 005; §12 status acceptance criteria dibandingkan ulang tanpa perubahan status kelulusan; §13.2; §13.4 (status PR #15 merged, kandidat 005, pemulihan, urutan 004/005/006, tes NOT RUN secara independen); A.5 | Belum ada; seluruh usulan tetap PROPOSED. Tidak ada keputusan baru dari PM atau pemilik domain |
| 0.6 | 2026-11-25 | Pencatatan keputusan PM teknis UJI: §0 baru (keputusan Adam dipisah dari usulan); §1 sumber komentar Jira SRS-38 nomor 10153 dan 10188, komentar Adam PR #14 (24 Nov 2026, 20.03 UTC), PR #36/#37/#38 merged; header baseline `origin/develop` @ `0ff9e4a`; §2; catatan keputusan pada §3–§8; §9 kontrak UJI; §10 reservasi migrasi 008–012 dan modul merged; §11; §12; §13 (Kelompok 1 bertambah, Kelompok 2 dipersempit, §13.3 ACTUAL SOURCE REQUIRED, §13.4 F3-1 dipilih, pemulihan, penempatan 007–012, tes 10188); A.5 | Keputusan PM teknis UJI oleh Adam (komentar Jira SRS-38 nomor 10153) untuk butir §0 dan §13.1. Butir lain tetap PROPOSED; ACTUAL tetap SOURCE REQUIRED. Belum ada approval PR |

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
- **Penomoran migrasi masih reservasi.** [PR #15](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/15) (SRS-44, migrasi 001–003) sudah merged ke `develop` sebagai `d1acfb4` pada 22 November 2026. Urutan yang disiapkan PR #28 adalah 004 audit (SRS-49), 005 cutoff (SRS-38, F3-1 pada PR #26), dan 006 staging (SRS-50). Nomor 007–012 sudah direservasi untuk modul lain (komentar Jira SRS-38 nomor 10153). Migrasi opsi B atau tabel UOM, bila kelak disetujui, belum memiliki nomor reservasi. Ledger/checksum tiap mesin perlu dikumpulkan sebelum deployment bersama.

### A.6 Data mitra yang perlu divalidasi

| No. | Yang perlu divalidasi | Untuk keputusan |
| --- | --- | --- |
| 1 | Sampel ekspor Erasoft STOCK dan COUNT: cutoff tanggal-saja atau tanggal dan jam; dasar cutoff (akhir hari, waktu cetak, tutup buku); dokumen yang dapat menjadi `basis_reference` | A.1 |
| 2 | Zona waktu server Erasoft dan lokasi gudang (WIB tidak diasumsikan); ada atau tidaknya offset pada timestamp ekspor | A.2 |
| 3 | Daftar UOM yang dipakai Erasoft beserta variasi penulisannya; pihak yang menyetujui daftar kanonik; ada atau tidaknya material dengan lebih dari satu UOM | A.3 |
| 4 | Locale angka (koma/titik desimal) dan jumlah desimal quantity (G-03) | A.3 |
| 5 | Bagian OD-05 di luar lampiran ini: kebijakan saldo negatif, sheet/header, dan key bisnis per jenis file | Di luar lampiran |

Sampai butir 1–4 tervalidasi, implementasi cutoff ACTUAL tetap ditahan (CF-04, F-03, aturan §9). Pengujian UJI hanya memakai fixture berlabel simulasi. Lampiran ini tidak mengubah kode; tidak ada pengujian yang dijalankan.
