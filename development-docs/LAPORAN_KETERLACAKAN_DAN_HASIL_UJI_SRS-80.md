# Laporan Keterlacakan dan Hasil Pengujian (SRS-80)

## Identitas dokumen

| Atribut | Nilai |
| --- | --- |
| Issue Jira | SRS-80 (T-46), Sprint 3 |
| Penyusun | Vassell Enha Atthayya (Anggota 3, frontend dan design system) |
| Tanggal snapshot | 2026-11-24 |
| Status dokumen | DRAFT, menunggu tinjauan PM |
| Dokumen induk | DOC-15 `15_REQUIREMENTS_TRACEABILITY.md` v0.2.0, DOC-13 `13_SOFTWARE_TEST_PLAN_TEST_CASES.md` |
| Basis kode | `origin/develop` pada commit 28b8501 ditambah PR terbuka yang tercantum di bagian 3 |

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
