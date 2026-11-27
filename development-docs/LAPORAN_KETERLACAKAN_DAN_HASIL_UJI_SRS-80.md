# Laporan Keterlacakan dan Hasil Pengujian (SRS-80)

## Identitas dokumen

| Atribut | Nilai |
| --- | --- |
| Issue Jira | SRS-80 (T-46), Sprint 3 |
| Penyusun | Vassell Enha Atthayya (Anggota 3, frontend dan design system) |
| Versi | 0.2.0 |
| Tanggal snapshot | 2026-11-24 (bagian 1 sampai 9, historis) dan 2026-11-28 (bagian A, status aktual) |
| Status dokumen | DRAFT, menunggu tinjauan PM |
| Dokumen induk | DOC-15 `15_REQUIREMENTS_TRACEABILITY.md` v0.2.0, DOC-13 `13_SOFTWARE_TEST_PLAN_TEST_CASES.md` |
| Basis kode | Snapshot historis: `origin/develop` pada commit 28b8501 ditambah PR terbuka pada bagian 3. Status aktual: `origin/develop` pada commit 0ff9e4a |

## A. Status aktual 2026-11-28 (revisi 0.2.0)

Bagian ini menambah dan tidak menghapus snapshot 2026-11-24. Bagian 1 sampai 9 dipertahankan apa adanya sebagai catatan historis bertanggal. Jika ada perbedaan, bagian A yang berlaku.

### A.1 Perubahan sejak snapshot 2026-11-24

- ID FR, NFR, dan test case asli sudah ditemukan kembali. PM mencatatnya pada Jira SRS-58 (komentar 10152, 25 November 2026). Pernyataan "SOURCE REQUIRED" pada bagian 1, 6, dan 8 berlaku untuk snapshot 2026-11-24 dan sudah digantikan oleh bagian A.2 sampai A.4.
- PR #29, #30, dan #31 sudah digabung ke `develop` (bagian 3 menulisnya sebagai open).
- Cabang `develop` berada pada commit 0ff9e4a.

### A.2 Rujukan sumber internal

Materi internal tetap disimpan di Jira. Repositori ini hanya memuat ID, jumlah, dan hash. Nama kebutuhan, nomor halaman, dan isi spesifikasi uji tidak disalin ke repositori.

| Materi | Lokasi | Hash SHA-256 |
| --- | --- | --- |
| Sumber DESAIN-42-1.1 (8 November 2026, 249 halaman) | Arsip internal tim, tidak dipublikasikan | `d44b4679352ae0bddd1be3a8f9016a60cbebf19c8e0d29a0ca715e91cc6b71b3` |
| Katalog sumber asli, `KATALOG_SUMBER_ASLI_2026-11-24.json` | Jira SRS-35, lampiran 10000 | `4045b00bfb805fac8a08e59cd9ebcf6ecd479bb8682ddfb2c57d7de59c820684` |
| Ekstrak kebutuhan dan 55 tes desain, `EKSTRAK_KEBUTUHAN_DAN_55_TES_DESAIN_42_1_1.md` | Jira SRS-58, lampiran 10001 | `1214e674ba2b037bf8d16c9f162d3370754847882554062a985ee36dc2138512` |
| Matriks 55 kasus | Jira SRS-68, lampiran 10004 (disusun PM) | Tidak dihitung. Isinya tidak dibaca pada revisi ini |

### A.3 Hasil pencocokan ID asli (dijalankan 2026-11-28)

Pencocokan dilakukan dengan skrip yang mengekstrak ID berpola dari ekstrak dan membandingkannya dengan katalog.

| Pemeriksaan | Katalog | Ekstrak | Hasil |
| --- | --- | --- | --- |
| FR-01 sampai FR-29 | 29 ID | 29 ID, himpunan identik | PASS |
| NFR-01 sampai NFR-14 | 14 ID | 14 ID, himpunan identik | PASS |
| Test case asli (TC-F01 sampai TC-F29, TC-E01 sampai TC-E12, TC-N01 sampai TC-N14) | 55 ID | 55 ID, himpunan identik | PASS |
| Setiap test case punya rujukan halaman pada katalog | 55 dari 55 | Tidak berlaku | PASS |

Batas pencocokan:

- Pemeriksaan ini hanya membuktikan bahwa dua lampiran Jira konsisten satu sama lain. PDF sumber tidak dibuka pada revisi ini, sehingga kesesuaian dengan PDF asli adalah NOT RUN.
- Katalog mencatat 25 ID API pada sumber dan 22 operasi pada kandidat kontrak. Statusnya NEEDS RECONCILIATION dan ditangani PM pada SRS-58. Laporan ini tidak menyelaraskan keduanya.
- Tidak ada ID FR, NFR, atau test case baru yang dibuat.

### A.4 Keputusan PM pada SRS-58 yang berlaku untuk baris 55 spesifikasi uji dan pemilik halaman

Sumber: Jira SRS-58, komentar 10152 (handoff PM, 25 November 2026).

| No | Keputusan | Dampak pada laporan ini |
| --- | --- | --- |
| 1 | Sumber asli ditemukan dan memuat 29 FR, 14 NFR, dan 55 test case. Dilarang membuat ID baru dan dilarang menganggap 55 test case sudah PASS. | Seluruh 55 test case asli dicatat NOT RUN pada bagian A.6, kecuali ada bukti per kasus. |
| 2 | Halaman inbound `ImportReferencePage.vue` dan batas layanan PR #11 dimiliki Adam. Halaman STOCK `ImportStockPage.vue`, rute `/inventory/import-stock`, komponen preview PR #30, dan pemasangan wizard dimiliki Vassell. Komponen bersama `ImportWizard.vue` dan `use-import-flow.ts` tetap bersama. Perubahan kontrak bersama dilakukan lewat PR terpisah. | Pertanyaan terbuka nomor 1 pada bagian 8 terjawab. Halaman induk wizard sudah ditetapkan. |
| 3 | Kontrak API 22 operasi perlu dipetakan terhadap sumber, bukan diganti diam-diam. | Di luar lingkup SRS-80. Dicatat sebagai batas pada bagian A.3. |

### A.5 Status aktual per kelompok

Pengelompokan di bawah ini dibuat penyusun berdasarkan urutan ID dan hanya untuk memudahkan pembacaan. Ini bukan klasifikasi dari sumber dan bukan matriks keterlacakan resmi. Kolom bukti klien hanya mencatat pekerjaan sisi klien (`apps/web`) milik penyusun. Pekerjaan backend dan basis data milik anggota lain tidak diklaim di sini.

| Kelompok | ID | Jumlah | Bukti implementasi sisi klien | Hasil test case asli |
| --- | --- | --- | --- | --- |
| Inbound | FR-01 sampai FR-08 | 8 | Hanya halaman riwayat inbound UC-07 pada adapter fixture UJI (PR #56, open). Tidak ada kode klien lain dari penyusun | NOT RUN |
| Stok dan rekonsiliasi | FR-09 sampai FR-15 | 7 | Preview saldo dan cutoff impor stok (PR #30, merged). Halaman impor stok (PR #55, open). Adapter paket STOCK (PR #39, open, sisi API) | NOT RUN |
| Impor, validasi, dan asal data | FR-16 sampai FR-19 | 4 | Komponen FileUpload, ValidationReport, ImportWizard (PR #17, open) dan preview (PR #30, merged). Atomicity dan asal data adalah sisi backend | NOT RUN |
| Sesi dan akses | FR-20 sampai FR-21 | 2 | Uji izin lintas role dan gudang sisi klien (PR #31, merged). Penegakan sesungguhnya di backend (PR #54, open, milik anggota lain) | NOT RUN |
| Master, rincian, dan konteks | FR-22 sampai FR-26 | 5 | Tidak ada kode klien dari penyusun | NOT RUN |
| Histori, audit, dan pencegahan ganda | FR-27 sampai FR-29 | 3 | Tidak ada kode klien dari penyusun | NOT RUN |
| Kebutuhan nonfungsional | NFR-01 sampai NFR-14 | 14 | Hanya perbaikan kontras dan pemeriksaan responsif/a11y (PR #29, merged) dan uji izin sisi klien (PR #31, merged). Korespondensi ke NFR dibuat dari nama kebutuhan dan belum diverifikasi lewat matriks resmi | NOT RUN |

### A.6 Pemisahan evidence implementasi dan hasil test case lengkap

Evidence implementasi (kode dan uji pengembang) tidak ekuivalen dengan eksekusi 55 test case asli. Katalog sumber sendiri menyatakan hasil suite pengembang tidak otomatis ekuivalen dengan kasus baseline asli.

**Tabel 1. Hasil test case asli (55 kasus)**

| Keluarga | Rentang ID | Jumlah | PASS | FAIL | BLOCKED | NOT RUN |
| --- | --- | --- | --- | --- | --- | --- |
| Fungsional | TC-F01 sampai TC-F29 | 29 | 0 | 0 | 0 | 29 |
| Exception | TC-E01 sampai TC-E12 | 12 | 0 | 0 | 0 | 12 |
| Nonfungsional | TC-N01 sampai TC-N14 | 14 | 0 | 0 | 0 | 14 |
| Total | | 55 | 0 | 0 | 0 | 55 |

Alasan NOT RUN: belum ada eksekusi per kasus pada lingkungan dengan API, basis data, dan sesi sungguhan, dan belum ada pemetaan evidence per kasus.

**Tabel 2. Evidence implementasi sisi klien (status 2026-11-28)**

| Issue | PR | Status PR | Commit | CI GitHub pada commit tersebut | Status Jira |
| --- | --- | --- | --- | --- | --- |
| SRS-45 | #12 | merged | 43e9382 | Tidak diperiksa ulang | Done |
| SRS-46 | #24 | merged | 28b8501 | Tidak diperiksa ulang | Done |
| SRS-71 | #29 | merged | 81469a5 | Tidak diperiksa ulang | In Review |
| SRS-83 | #30 | merged | bba021d | Tidak diperiksa ulang | In Review |
| SRS-63 | #31 | merged | 37d5781 | Tidak diperiksa ulang | In Review |
| SRS-53 | #17 | open | 44d7c02 (memuat PR #41 yang sudah digabung ke cabang wizard) | Lulus (repository-checks, application-ci) | In Review |
| SRS-56 | #32 (basis: cabang PR #17) | open | a79339c | Lulus | In Review |
| SRS-60 | #35 | open | f5aff6a | Lulus | In Review |
| SRS-25 | #55 (basis: cabang PR #17) | open | 1cfde82 | Belum ada karena basis bukan `develop` | In Review |
| SRS-26 | #39 (basis: cabang staging core) | open | 2abb325 | Belum ada karena basis bukan `develop` | In Review |
| SRS-67 | #56 | open | ea4eab0 | Lulus | In Progress |
| SRS-74 | #34 | open | 86ecf19 | Lulus | In Review |
| SRS-79 | #57 | open | de8cd1e | Lulus | In Progress |

Hasil uji yang dijalankan pada revisi ini (2026-11-28, `origin/develop` commit 0ff9e4a):

| Pemeriksaan | Hasil | Catatan |
| --- | --- | --- |
| `npx vitest run --project web` | PASS, 180 uji pada 12 berkas | Hanya uji sisi klien yang sudah digabung ke `develop`. Tidak mencakup PR terbuka |
| `npx eslint apps/web/src` | PASS, exit code 0, tanpa keluaran | |
| `npx vue-tsc --noEmit -p apps/web` | PASS, exit code 0, tanpa keluaran | |
| `python3 scripts/check_repository.py --tracked` pada `develop` | 0 temuan (153 berkas) | |

Hasil uji PR terbuka yang tercatat pada bagian 4 adalah angka pada tanggal snapshot masing-masing dan tidak dijalankan ulang pada revisi ini.

### A.7 Ringkasan status Jira (2026-11-28, SRS-16 sampai SRS-106, 91 issue bukan Epic)

| Status Jira | Jumlah |
| --- | --- |
| Done | 7 |
| In Testing | 1 |
| In Review | 11 |
| In Progress | 32 |
| To Do | 40 |

Angka ini tidak dapat dibandingkan langsung dengan bagian 7 karena cakupannya berbeda (Epic tidak dihitung, dan subtask review SRS-93 sampai SRS-106 sudah ada). Tidak ada issue yang berstatus Accepted menurut definisi pada bagian 2.

### A.8 NOT RUN dan batas revisi ini

- Eksekusi 55 test case asli: NOT RUN.
- Kesesuaian katalog dan ekstrak dengan PDF sumber: NOT RUN.
- Matriks 55 kasus pada SRS-68 lampiran 10004: tidak dibaca dan tidak dibandingkan.
- Uji pada browser sungguhan, NVDA, perangkat fisik, API, basis data, dan sesi nyata: NOT RUN.
- Pemetaan UC ke FR/NFR resmi: belum ada. Kolom korespondensi pada bagian A.5 adalah dugaan penyusun dan perlu diverifikasi PM.
- Tidak ada item yang dinyatakan Accepted.

## Snapshot historis 2026-11-24 (bagian 1 sampai 9)

Bagian di bawah ini tidak diubah sejak versi 0.1.0, kecuali judul pembatas ini. Beberapa pernyataan di dalamnya sudah digantikan oleh bagian A.

## 1. Tujuan dan batas

Laporan ini mencatat hubungan antara use case, issue Jira, pull request, commit, berkas uji, dan hasil uji yang benar-benar sudah dijalankan pada snapshot di atas. Laporan ini tidak menggantikan DOC-15 dan tidak mengubahnya.

Batas yang berlaku:

- Tidak ada ID FR, NFR, atau test case baru yang dibuat. ID FR/NFR asli dan 55 spesifikasi uji baseline masih berstatus `SOURCE REQUIRED` di DOC-13 dan DOC-15, sehingga kolom terkait ditulis apa adanya.
- Hanya pekerjaan sisi klien (apps/web) yang dicatat dengan bukti. Pekerjaan backend dan basis data milik anggota lain hanya dicatat status Jira-nya, tanpa klaim hasil uji.
- Semua data adalah data UJI. Mode ACTUAL tetap dinonaktifkan.
- Pengujian unit dan integrasi komponen di bawah ini bukan eksekusi kasus PVT-01 sampai PVT-23. PVT bersifat PROPOSED dan belum dieksekusi pada lingkungan dengan API, basis data, dan sesi sungguhan.

## 2. Definisi status

| Status | Arti dalam laporan ini |
| --- | --- |
| Planned | Ada issue Jira, belum ada kode di PR. |
| Implemented | Kode ada di PR terbuka atau cabang, belum digabung ke `develop`. |
| Tested | Ada berkas uji dan hasil yang dapat ditelusuri ke PR, dengan batas yang dicatat. |
| Accepted | Sudah ditinjau dan disetujui PM atau pihak berwenang. Belum ada satu pun item pada laporan ini yang berstatus Accepted. |
| PASS, FAIL, BLOCKED, NOT RUN | Hasil eksekusi. NOT RUN dan BLOCKED bukan FAIL. |

## 3. Pekerjaan sisi klien yang sudah ada bukti

Semua PR di bawah ini berstatus terbuka (belum digabung) pada snapshot, kecuali yang ditandai merged.

| Issue | Judul singkat | PR | Commit (HEAD PR) | Status PR | Status Jira |
| --- | --- | --- | --- | --- | --- |
| SRS-45 | Token dan komponen dasar | #12 | 97ab59e | merged | Done |
| SRS-46 | Layout, konteks, routing peran | #24 | ec88cc8 | merged | Done |
| SRS-53 | Komponen alur impor bersama (FileUpload, ValidationReport, ImportWizard) dan wiring konteks | #17 | 7f16c89 | open | In Review |
| SRS-71 | Perbaikan kontras dan pemeriksaan responsif/a11y | #29 | 35fb4fc | open | In Review |
| SRS-83 | Preview saldo dan cutoff impor stok | #30 | 0eada91 | open | In Review |
| SRS-63 | Uji izin lintas role dan gudang sisi klien | #31 | e342f8c | open | In Review |
| SRS-56 | Uji rendering, routing, dan komponen impor | #32 (basis: cabang PR #17) | a79339c | open | In Review |

## 4. Hubungan ke use case dan hasil uji

Kolom UC dan PVT mengikuti tabel "Ketertelusuran UC ke desain PROPOSED" di DOC-15. Kolom PVT berarti terkait, bukan terbukti lulus.

| Issue | UC terkait | PVT terkait (belum dieksekusi) | Berkas uji / bukti | Hasil yang tercatat | Batas |
| --- | --- | --- | --- | --- | --- |
| SRS-53 | UC-16 (internal), konsumen UC-01 dan UC-09 | PVT-01, PVT-02, PVT-03, PVT-04, PVT-11, PVT-12 | `apps/web/src/tests/use-import-flow.spec.ts` (13 definisi uji) | PASS pada CI PR #17 | Tanpa API, sesi, atau basis data sungguhan. Halaman induk wizard belum ditetapkan PM. |
| SRS-56 | UC-16, UC-01, UC-09 (sisi tampilan) | PVT-01, PVT-11, PVT-12 | `import-flow-integration.spec.ts` (14 uji), `LAPORAN_UJI_SRS-56_RENDERING_ROUTING_KOMPONEN_IMPOR.md` | Vitest 233 uji pada cabang bertumpuk: PASS. Browser headless: 26 PASS | NOT RUN: wizard pada halaman nyata, API/auth, DB, NVDA, perangkat fisik, Firefox/Safari, tema gelap dan kontras tinggi. |
| SRS-83 | UC-09 | PVT-08, PVT-09, PVT-17 | `stock-balance-preview.spec.ts` (18 uji), `IMPLEMENTASI_SRS-83_PREVIEW_SALDO_CUTOFF.md` | Vitest 148 uji: PASS. CI PR #30 hijau saat dicek terakhir | Kontrak NormalizedSTOCK proposed-0.1. Cutoff CF-04 masih OPEN, jam tidak diasumsikan. |
| SRS-63 | UC-15 dan seluruh UC yang dibatasi gudang | PVT-05, PVT-22 | `cross-role-warehouse.spec.ts` (33 uji dieksekusi), `PENGUJIAN_SRS-63_IZIN_LINTAS_ROLE_GUDANG.md` | Vitest 163 uji: PASS | Pemfilteran frontend bukan kontrol keamanan. Penegakan sebenarnya di backend (SRS-48) belum ada. |
| SRS-71 | Lintas UC (NFR aksesibilitas dan responsif) | Tidak ada | `a11y-contrast.spec.ts` (3 definisi uji), `PEMERIKSAAN_SRS-71_RESPONSIVE_A11Y.md` | PASS pada CI PR #29 | ID NFR asli SOURCE REQUIRED. NVDA dan perangkat fisik belum tercatat. |

## 5. Cakupan per use case (sisi klien)

| UC | Ada kode klien di PR | Ada uji klien | Eksekusi PVT | Catatan |
| --- | --- | --- | --- | --- |
| UC-01 | Sebagian (komponen impor bersama, PR #17) | Ya, tingkat komponen | NOT RUN | Layar referensi inbound (SRS-16/SRS-82) milik PM, PR #11 masih terbuka. |
| UC-02 sampai UC-08 | Tidak | Tidak | NOT RUN | Issue masih To Do. SRS-21 dan SRS-22 menunggu API. |
| UC-09 | Preview saldo dan cutoff (PR #30) | Ya, tingkat komponen | NOT RUN | SRS-25 dan SRS-26 menunggu kontrak dan API. |
| UC-10 sampai UC-14 | Tidak | Tidak | NOT RUN | Dimiliki anggota lain atau belum dimulai. |
| UC-15 | Tidak (hanya uji izin sisi klien, PR #31) | Sebagian | NOT RUN | SRS-33 belum dimulai. |
| UC-16 | Ya (wizard dan controller) | Ya | NOT RUN | Internal, tanpa halaman sendiri. |

## 6. Persyaratan yang belum tercakup

Mengikuti bagian "Uncovered requirements" di DOC-15:

- 29 FR dan 14 NFR belum dapat disebut tercakup karena ID aslinya masih SOURCE REQUIRED.
- 55 spesifikasi uji baseline di DOC-13 semuanya NOT RUN dan tidak dapat dibandingkan dengan uji yang ada di repositori, karena ID dan expected result aslinya belum tersedia.
- 23 kasus PVT turunan belum dieksekusi pada lingkungan terintegrasi.
- Integrasi UI dengan API nyata (SRS-62, SRS-67) belum dimulai karena bergantung pada SRS-47, SRS-48, dan SRS-51.
- Konflik CF-01 sampai CF-09 pada DOC-15 belum diselesaikan. CF-04 (cutoff) tetap OPEN DECISION.

## 7. Ringkasan status Jira (snapshot 2026-11-24, SRS-4 sampai SRS-92, 89 issue)

| Status Jira | Jumlah |
| --- | --- |
| Done | 7 |
| In Testing | 1 |
| In Review | 5 |
| In Progress | 19 |
| To Do | 57 |

Tidak ada issue yang berstatus Accepted menurut definisi pada bagian 2.

## 8. Pertanyaan terbuka

| No | Hal | Pemilik | Status |
| --- | --- | --- | --- |
| 1 | Halaman induk untuk ImportWizard (batas nomor 11) | PM | Menunggu jawaban |
| 2 | Sumber ID FR, NFR, dan 55 kasus uji baseline | PM | SOURCE REQUIRED |
| 3 | Keputusan CF-04 (jam cutoff) | PM | OPEN DECISION |
| 4 | Versi NVDA dan bukti pembacaan layar | Penyusun | Belum dicatat |
| 5 | Uji pada perangkat fisik, Firefox, Safari, tema gelap, kontras tinggi | Penyusun | NOT RUN |

## 9. Cara memperbarui laporan

1. Setiap PR yang digabung: ubah kolom status PR dan tambahkan SHA merge.
2. Setiap hasil uji baru: tambahkan baris dengan berkas uji, versi alat, tanggal, dan hasil apa adanya.
3. Jika ID FR/NFR/test case asli sudah tersedia: isi pada DOC-15 melalui prosedur change request di dokumen tersebut, bukan di laporan ini.
4. Jangan memindahkan status ke Accepted tanpa persetujuan tertulis dari PM.

## Riwayat revisi

| Versi | Tanggal | Perubahan |
| --- | --- | --- |
| 0.1.0 | 2026-11-24 | Penyusunan awal dari snapshot Jira dan PR. |
| 0.2.0 | 2026-11-28 | Menambah bagian A (status aktual): rujukan sumber internal, pencocokan 55 ID asli, keputusan PM pada SRS-58, status per kelompok, pemisahan evidence implementasi dan hasil test case, serta hasil pemeriksaan pada `develop`. Bagian 1 sampai 9 dipertahankan sebagai snapshot historis. |
