# Implementasi SRS-53 (T-19): Komponen Alur Impor Bersama

Dokumen ini mencatat persiapan SRS-53 pada cabang `feature/SRS-53-import-wizard`.
Sumber acuan: `design.md` §5 (FileUpload, ImportWizard), §6.1 (kamus state), §6.3 (state machine impor bersama), serta `development-docs/10_UI_UX_PROTOTYPE_SPECIFICATION.md`.

Status: **PROPOSED — NEEDS REVIEW**. Komponen belum dipasang pada halaman mana pun dan belum tersambung ke API. Kontrak API-01 sampai API-05, status endpoint, dan status proses tambahan masih menunggu keputusan PM (lihat bagian 5).

## 1. Ringkasan

| Butir | Keterangan |
| --- | --- |
| Tujuan | Menyediakan `FileUpload`, `ValidationReport`, dan `ImportWizard` sebagai komponen presentasi bersama untuk UI-01, UI-02, UI-03, UI-09, dan UI-10. |
| Prinsip | Komponen murni presentasi: state masuk lewat props, niat pengguna keluar lewat event. Validasi, otorisasi, idempotency key, dan perubahan batch tetap pada layanan. |
| Cakupan | Tidak ada pemanggilan API, router, penyimpanan, maupun pembuatan idempotency key di dalam komponen. |
| Hubungan dengan PR #11 | Memakai tipe lokal yang kompatibel secara struktur dengan boundary usulan PR #11, tanpa mengimpornya (arahan PM). Tidak ada perubahan pada `import-wizard-contract.ts` maupun kontrak bersama. |

## 2. Berkas

| Berkas | Fungsi |
| --- | --- |
| `apps/web/src/shared/import/import-wizard-types.ts` | Tipe lokal (`ImportWizardState`, `ImportContext`, `ImportPreview`, `ImportWarning`, `ImportIssue`), daftar empat tahap, pemetaan status ke tahap, dan pembantu ukuran berkas. |
| `apps/web/src/components/patterns/FileUpload.vue` | Pemilih berkas native: metadata terbaca, state empty/incompatible/oversize/error/success, pilih ulang berkas yang sama. |
| `apps/web/src/components/patterns/ValidationReport.vue` | Laporan temuan per baris; nilai yang tidak dikirim layanan ditulis "—". |
| `apps/web/src/components/patterns/ImportWizard.vue` | Stepper empat tahap, ringkasan konfirmasi, pengakuan warning, dan tampilan hasil. |
| `apps/web/src/tests/FileUpload.spec.ts` | 16 pengujian FileUpload. |
| `apps/web/src/tests/ImportWizard.spec.ts` | 45 pengujian ImportWizard dan ValidationReport. |
| `apps/web/src/tests/import-patterns-tokens.spec.ts` | 6 pengujian aturan token-only untuk komponen pola (berkas terpisah dari `design-tokens.spec.ts`). |

## 3. Perilaku utama

Tahap visual tepat empat: **Pilih File → Hasil Validasi → Preview → Hasil Simpan** (`design.md` §6.3). Status proses dan nomor tahap adalah hal berbeda.

| Status | Tahap | Tindakan yang tersedia |
| --- | --- | --- |
| `initial`, `uploading`, `error` | 1 | Isi gudang dan mode, pilih berkas, Validasi (nonaktif beralasan bila berkas atau gudang kosong). |
| `validating`, `invalid`, `preparation-unknown` | 2 | `invalid`: Ganti Berkas, Batal. `preparation-unknown`: Periksa Status. |
| `preview`, `expired`, `committing` | 3 | `preview`: Simpan (terkunci sampai semua warning diakui), Kembali, Batal. `expired`: Validasi Ulang, Batal. |
| `success`, `unknown`, `cancelling`, `cancelled`, `cancel-unknown` | 4 | `success`/`cancelled`: Mulai Impor Baru. `unknown`/`cancel-unknown`: Periksa Status. |
| Status yang belum dikenal | 1 | Semua tindakan dikunci dengan pesan eksplisit. |

Acceptance criteria T-19 pada implementasi ini:

- Tanpa berkas tidak ada keadaan sukses atau VALID: `FileUpload` hanya berstatus sukses bila ada berkas, dan Validasi nonaktif beralasan.
- INVALID adalah hasil validasi yang sah: tampil sebagai laporan temuan (Preview dan Simpan terkunci), bukan banner galat transport.
- Hasil tidak pasti (persiapan, commit, pembatalan) tidak pernah ditampilkan sebagai sukses dan tidak menawarkan Simpan ulang; hanya Periksa Status.
- Retry mempertahankan idempotency key: kunci dimiliki pemanggil (ada pada state `unknown`); komponen tidak membuat atau mengganti kunci.
- Aksesibilitas: daftar bernomor dengan `aria-current="step"`, tahap berikutnya bukan kontrol interaktif, fokus pindah ke judul tahap setelah tahap berubah, teks "Tahap n dari 4 — Nama" selalu terbaca.

## 4. Kompatibilitas dengan PR #11

`ImportState` dari `features/inbound/reference-import.ts` (PR #11) dapat diberikan langsung ke `ImportWizard`. Pengujian menyalin bentuk tipe tersebut dan memeriksa penugasannya pada saat typecheck, sehingga perubahan bentuk di PR #11 akan terdeteksi. Penambahan pada sisi SRS-53 bersifat opsional (`rowCount`, `source`, props `importLabel`, `accept`, `maxSizeBytes`) atau berupa status baru (`invalid`, `cancelling`, `cancelled`, `cancel-unknown`) dan event baru (`back`, `revalidate`, `checkStatus`, `restart`). Event `selectFile`, `changeContext`, `submit`, `confirm`, dan `cancel` mengikuti `ImportWizardEvents` pada PR #11.

## 5. Keputusan yang masih PROPOSED

| Butir | Kondisi pada implementasi ini | Menunggu |
| --- | --- | --- |
| Identitas warning | Teks (bentuk PR #11) atau objek `{ id, message }`; `confirm` mengirim daftar ID. Tidak dikunci sebagai kontrak. | API-03 dan keputusan PM. |
| Status VALIDATING, COMMITTING, CANCELLING, fingerprint | Status baru ditambahkan di `ImportWizardState` dan `stepForPhase`; status yang belum dikenal dikunci. | Sinkronisasi state machine Dwi dan Rafif; DOC-08. |
| Pembacaan status batch | `Periksa Status` hanya event; belum ada endpoint `GET /imports/{batch_id}`. | Keputusan PM atas usulan backend. |
| Bentuk metadata impor | Hanya `warehouseId` dan `mode` (sama dengan PR #11). | API-01. |
| Pengakuan semua warning sebelum Simpan | Diterapkan sebagai kebijakan tampilan; belum disahkan. | Kontrak P-I pada §6 (warning-only dapat lanjut bila kontrak mengizinkan). |
| Pilihan mode ACTUAL pada UI | Ditampilkan; izin sebenarnya diperiksa layanan. | Matriks role/gudang. |

## 6. Verifikasi

Dijalankan pada cabang `feature/SRS-53-import-wizard` (basis `develop` pada `761a183`), Node dengan `npm ci`, lingkungan Linux.

| Pemeriksaan | Hasil aktual |
| --- | --- |
| `npm run lint` | Lulus tanpa galat. |
| `npm run typecheck` | Lulus (contracts, api, web). |
| `npm run tokens:check` | Sinkron dengan `design.md` (424 token). |
| `npm test` | 13 berkas, 158 pengujian lulus (91 sebelumnya + 67 baru). Pengujian koneksi database tercatat NOT RUN/BLOCKED karena PostgreSQL belum aktif. |
| `npm run build` | Lulus. Komponen baru belum diimpor aplikasi, sehingga build hanya membuktikan tipe valid, bukan perilaku. |
| Uji mutasi manual (8 kerusakan sengaja pada kode) | Seluruhnya terdeteksi oleh pengujian; kode dikembalikan dan 61 pengujian komponen lulus. |

Belum dilakukan (NOT RUN): pengujian pembaca layar dan kontras warna manual, pengujian di peramban nyata dan layar sempit (aturan tampilan seluler hanya diperiksa lewat gaya, bukan render), integrasi dengan halaman dan router (menunggu SRS-46), integrasi API nyata, serta pengujian PostgreSQL.

## 7. Dampak pada issue lain

- SRS-46 memblokir pemasangan pada route; komponen tidak bergantung pada router.
- SRS-16 dan SRS-25 bergantung pada komponen ini; pemasangan pada halaman dilakukan pada issue masing-masing.
- Tidak ada perubahan skema, migrasi, kontrak API, maupun kontrak bersama.
