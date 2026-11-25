# Review PR #17 — Wizard Import SRS-53

Tanggal review: 25 November 2026 WIB  
Reviewer: Muhammad Luthfi Rafif (pemilik SRS-47/48/51; review teknis, bukan pemilik PR)  
Status PR: **OPEN / DRAFT? open, not merged** — tidak diubah oleh review ini.

## 1. Metadata PR

| Butir | Nilai |
|---|---|
| PR | #17 — `feat(web): tambah FileUpload, ValidationReport, dan ImportWizard (SRS-53)` |
| URL | https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/17 |
| Head SHA direview | `7f16c89f5a7b1edcaca80279ce68e68d6a10311c` |
| Branch | `feature/SRS-53-import-wizard` -> `develop` |
| Base SHA (PR) | `28b85013184750a67e8a7ef816a68ed4c068d454` |
| State / merge | open / merged=false / mergeable=true / mergeable_state=clean |
| Author / assignee | vassellenha |
| Requested reviewer | Yunaaaaa13 |
| Commits / files | 5 commits / 11 files / +2620 -0 |
| Updated | 2026-11-24T20:03:42Z |

Sumber metadata: GitHub REST `GET /repos/adamyudhistiramuhtar-byte/SIRIS/pulls/17` (diambil 25 Nov 2026).

## 2. Ruang Lingkup Review

- Review difokuskan pada **3 regresi** yang tercatat pada review formal Adam (24 Nov 2026, CHANGES_REQUESTED, head `7f16c89`).
- PR #17 **bukan milik Luthfi**. Saya **tidak mengedit kode PR #17** dan **tidak push ke branch PR**.
- Kandidat fix yang direview: branch lokal `fix/SRS-53-wizard-regression` @ `44d7c02c49d9da6ae93ba74ebb2d57afac91008f` (author: Adam Yudhistira Muhtar, 2026-11-25 03:10:59 +0700), berbasis head PR `7f16c89`. Fix juga tersedia di bundle PM `SIRIS-kandidat-review-20261125.bundle` / patch evidence ZIP.
- Boundary kepemilikan (sesuai PM/Jira): Vassell memiliki `apps/web/src/pages/inventory/ImportStockPage.vue` (UC-09 / `/inventory/import-stock`); Adam memiliki `apps/web/src/pages/inbound/ImportReferencePage.vue` (UC-01 / #11). Komponen/wiring bersama `shared/import/use-import-flow.ts` dan pola import adalah area bersama yang memerlukan koordinasi.

## 3. Temuan (3 Regresi PM)

### R1 — Progress callback lama mengisi ulang progres setelah reset konteks
- **Lokasi**: `apps/web/src/shared/import/use-import-flow.ts` (callback `onProgress` dari request lama).
- **Masalah**: Setelah konteks berganti/reset, callback `onProgress` dari request lama masih menulis `uploadProgress`. Ini dapat menampilkan progres stale dan membingungkan pengguna setelah selection/cache dibersihkan.
- **Ekspektasi**: Guard callback dengan identitas controller/signal/generation aktif; progress lama setelah reset tidak boleh memutasi state aktif.
- **Dampak**: State UI stale setelah reset konteks (SRS-36 §7 butir 8 / reset selection-cache).

### R2 — `AbortError` transport saat commit ditelan, fase committing menggantung
- **Lokasi**: `apps/web/src/shared/import/use-import-flow.ts` (`run`/commit path).
- **Masalah**: `run` menelan semua `AbortError`, sehingga `AbortError` dari transport saat commit meninggalkan fase `committing` selamanya. Operasi aktif yang abort karena transport/jaringan harus menjadi `unknown`, bukan hilang diam-diam.
- **Ekspektasi**: Hanya buang AbortError dari generation lama yang memang dibatalkan karena reset; AbortError pada operasi aktif commit harus menghasilkan state `unknown` dengan jalur Periksa Status/idempotency key.
- **Dampak**: UI bisa macet di `committing`; melanggar aturan "hasil tidak pasti tidak ditampilkan sebagai sukses/gagal pasti".

### R3 — Validate terputus masuk `error` dan memberi "Coba lagi"/upload ulang, padahal batch mungkin sudah terbentuk
- **Lokasi**: `apps/web/src/shared/import/use-import-flow.ts` (validate/submit path).
- **Masalah**: Kegagalan/putus jaringan saat validasi memunculkan phase `error` generik. Jika batch/staging mungkin sudah terbentuk di server, menawarkan unggah ulang otomatis berisiko duplikasi/orphan batch.
- **Ekspektasi**: Gunakan `preparation-unknown` (atau state unknown yang setara) dan arahkan ke Periksa Status/recovery; jangan menawarkan upload ulang otomatis seolah belum ada efek samping.
- **Dampak**: Risiko duplikasi batch / kehilangan korelasi status jika klien retry buta.

## 4. Bukti Reproduksi dan Verifikasi

Lingkungan lokal verifikasi: Windows, Node/npm lokal repo, Vitest workspace web. Saya menjalankan tes terfokus pada `apps/web/src/tests/use-import-flow.spec.ts`.

| Skenario | Command | Hasil | Bukti |
|---|---|---:|---|
| PR #17 head `7f16c89` (test suite existing) | `npx vitest run apps/web/src/tests/use-import-flow.spec.ts` | **13 passed / 0 failed** | log lokal: head memiliki 13 test, tidak memuat 3 test regresi baru |
| Fix candidate `44d7c02` (source+tests) | `npx vitest run apps/web/src/tests/use-import-flow.spec.ts` | **16 passed / 0 failed** | log lokal: `Test Files 1 passed, Tests 16 passed` |
| RED reproduction: source `7f16c89` + tests `44d7c02` | checkout `7f16c89` untuk `use-import-flow.ts`, `44d7c02` untuk spec, lalu vitest | **4 failed / 12 passed (16 total)** | `/tmp/opencode/wizard-red-local3.log`, JSON `/tmp/opencode/w4results.json` |
| PM evidence RED (bundle/ZIP) | dari `wizard-regression-red-20261125.log` | **3 failed / 13 passed (16 total)** | `C:/Users/Acer/AppData/Local/Temp/opencode/siris-evidence/wizard-regression-red-20261125.log` |

### 4.1 Detail RED lokal (source 7f16c89 + tests fix)

Kegagalan yang teramati:

1. `Pengendali alur impor: hasil tidak pasti > kegagalan validasi mempertahankan ketidakpastian tanpa membocorkan pesan mentah` — expected `preparation-unknown`, received `error`.
2. `Regresi review PM: operasi terlambat dan hasil tidak pasti > progress lama tidak mengisi ulang progres setelah reset konteks` — expected `null`, received `99`.
3. `Regresi review PM: operasi terlambat dan hasil tidak pasti > AbortError dari transport simpan tidak meninggalkan fase committing` — expected `unknown`, received `committing`.
4. `Regresi review PM: operasi terlambat dan hasil tidak pasti > validasi terputus tidak mengizinkan unggah ulang otomatis` — expected `error`? (PM log shows expected `preparation-unknown`, received `error`).

Catatan presisi: PM log 24 Nov melaporkan 3 FAIL karena baseline test saat itu belum memuat perubahan ekspektasi test existing untuk validasi gagal. Fix commit `44d7c02` juga menyesuaikan 1 test existing ("kegagalan validasi...") dari `error` menjadi `preparation-unknown`, sehingga reproduksi RED dengan test fix menghasilkan 4 FAIL. Ini konsisten dengan perbaikan perilaku R3; bukan regresi baru.

### 4.2 Detail GREEN fix (`44d7c02`)

Tes terfokus pada fix branch: **16 passed / 0 failed**.

Perubahan fix (dari `git show --stat 44d7c02`):
- `apps/web/src/shared/import/use-import-flow.ts` — 14 insertions, 10 deletions (3 hunks)
- `apps/web/src/tests/use-import-flow.spec.ts` — 29 insertions, 2 deletions (3 hunks)

## 5. Penilaian

| Temuan | Status pada PR head 7f16c89 | Status pada fix 44d7c02 | Bukti |
|---|---:|---:|---|
| R1 progress lama setelah reset | **TERKONFIRMASI** | **TERATASI oleh kandidat fix** | RED local/PM, GREEN 16/16 |
| R2 AbortError commit menggantung | **TERKONFIRMASI** | **TERATASI oleh kandidat fix** | RED local/PM, GREEN 16/16 |
| R3 validate terputus -> error/retry | **TERKONFIRMASI** | **TERATASI oleh kandidat fix** | RED local/PM, GREEN 16/16 |

## 6. Rekomendasi / Handoff

1. **Vassell (pemilik PR #17)**: adopsi/cherry-pick fix `44d7c02` ke PR #17 setelah review, atau koordinasikan PR terpisah yang jelas kepemilikannya. Jangan merge tanpa review nonpenulis.
2. **Luthfi (reviewer teknis nonpenulis yang ditunjuk PM)**: setelah fix masuk ke HEAD PR, lakukan review nonpenulis atas HEAD baru; jangan self-approve perubahan yang ditulis Adam tanpa nonpenulis lain.
3. **PM/Adam**: karena Adam menulis kandidat fix, approval nonpenulis pada HEAD final tetap diperlukan sebelum merge.
4. Pastikan deskripsi PR #17 diperbarui (masih merujuk SHA lama/routing belum merged) saat head berubah.
5. Pertahankan boundary: jangan ubah `ImportStockPage.vue` milik Vassell di PR ini tanpa koordinasi.

## 7. Batasan Review Ini

- **PASS**: review metadata, pembacaan diff/log/bundle, reproduksi RED/GREEN terfokus pada `use-import-flow.spec.ts`.
- **NOT RUN**: full web suite pada PR #17 head/fix branch, browser/screen-reader/manual UI, integrasi API/backend nyata, PostgreSQL integration, CI remote untuk HEAD PR.
- **NOT EDITED**: tidak ada file PR #17 yang diubah oleh Luthfi; review ini hanya menghasilkan dokumen review.
- Saya **tidak** mengklaim PR #17 siap merge; status merge tetap keputusan PM + reviewer nonpenulis + CI HEAD final.
