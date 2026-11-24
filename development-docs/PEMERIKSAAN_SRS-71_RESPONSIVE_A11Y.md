# Pemeriksaan SRS-71: Responsive, Aksesibilitas, dan State Layar yang Ada

Status: PROPOSED. Cakupan terbatas pada layar yang sudah ada di `develop` setelah SRS-46: shell, Beranda, halaman akses ditolak, dan halaman placeholder per use case. Fitur belum terintegrasi (SRS-62 dan SRS-67), sehingga pemeriksaan ini bukan pemeriksaan akhir seluruh layar.

## 1. Metode

- Peramban: Google Chrome headless (Linux) dengan Playwright; aplikasi dijalankan dari Vite dev server.
- Pemeriksaan A (halaman aplikasi): seluruh halaman yang diizinkan untuk empat role UJI menurut matriks SRS-36 (PURCHASING 9, WAREHOUSE 9, PRODUCTION 2, MANAGEMENT 4), pada viewport 360x740, 768x1024, dan 1280x800.
- Pemeriksaan B (state ImportWizard): ImportWizard belum dipasang pada halaman, sehingga 17 state dirender lewat halaman harness sementara yang tidak dikomit: initial, initial dengan berkas, uploading, validating, invalid, preview, preview kedaluwarsa, expired, committing, success, error, unknown, preparation-unknown, cancelling, cancelled, cancel-unknown, dan satu status baru yang tidak dikenal. Setiap state diperiksa pada 4 viewport (320, 360, 768, 1280) dan 3 tema (light, dark, high-contrast), yaitu 204 kombinasi.
- Aksesibilitas: axe-core dengan tag WCAG 2.0, 2.1, dan 2.2 A dan AA.
- Responsive: pemeriksaan gulir horizontal (`scrollWidth` melebihi `clientWidth`); lebar 320 piksel mewakili reflow WCAG 1.4.10.
- Ukuran target sentuh (WCAG 2.5.8, minimal 24x24 piksel) pada viewport 360 untuk seluruh state wizard.
- Papan ketik: urutan Tab pada Beranda role WAREHOUSE (8 tekanan Tab per viewport) memeriksa indikator fokus terlihat.
- Skrip pemeriksaan dan halaman harness berada di luar repositori (lingkungan kerja), bukan bagian aplikasi.

## 2. Temuan dan perbaikan

| No | Temuan | Pengukuran | Perbaikan |
| --- | --- | --- | --- |
| 1 | Teks menu aktif pada latar aktif kurang kontras (WCAG 1.4.3) | #0A6ED1 pada #E5F0FA = 4,36:1 | Memakai token `--navigation-selected-fg` (#0854A0 = 6,52:1) di `AppShell.vue` |
| 2 | Badge ID use case memakai `bg-blue-100` (bukan token) dengan warna aksen | #0A6ED1 pada #DBEAFE = 4,13:1 | Memakai pasangan token info `bg-siris-info-bg text-siris-info` di `PlaceholderPage.vue` |

Total 61 kemunculan `color-contrast` (38 badge, 23 menu aktif) berasal dari dua sumber di atas. Setelah perbaikan, axe melaporkan 0 pelanggaran pada seluruh kombinasi viewport, role, dan halaman.

Pengujian regresi `a11y-contrast.spec.ts` (7 tes) membaca token dari `tokens.css` dan memeriksa rasio minimal 4,5:1 pada tiga tema (light, dark, high-contrast), serta mengunci alasan token navigasi dipakai.

## 3. Hasil

| Pemeriksaan | Hasil |
| --- | --- |
| A. axe, halaman aplikasi, tema light, 3 viewport | PASS setelah perbaikan (0 pelanggaran) |
| B. axe, 17 state ImportWizard x 4 viewport x 3 tema (204 kombinasi) | PASS (0 pelanggaran) |
| Gulir horizontal (A dan B, termasuk 320 piksel) | PASS (tidak ada) |
| Indikator fokus pada urutan Tab Beranda | PASS (outline 2 sampai 3 px terlihat) |
| Ukuran target sentuh pada wizard (viewport 360) | PASS: kotak centang warning berukuran 13 px, tetapi labelnya 244x24 px dan ikut menerima klik; tepat pada batas minimal 24 px |
| Rasio token tema dark dan high-contrast untuk pasangan yang diubah | PASS (unit test token) |
| Dukungan `prefers-reduced-motion` | Ada pada `styles/base.css` (diperiksa pada kode; tidak diukur di peramban) |
| Pembaca layar | Diperiksa manual oleh pengembang (Vassell) dengan NVDA pada seluruh item yang diminta PM; hasil dilaporkan aman. Versi NVDA dan bukti (rekaman atau catatan per halaman) belum dilampirkan, sehingga hasil ini belum terverifikasi independen |
| Perangkat nyata (ponsel/tablet) | NOT RUN: tidak dapat dijalankan dari lingkungan kerja; perlu uji manual (lihat bagian 5) |
| Wizard terpasang pada halaman impor nyata | NOT RUN: belum dipasang (menunggu keputusan PM atas boundary PR #11) |

## 4. Catatan dan keterbatasan

- axe hanya mendeteksi sebagian masalah aksesibilitas; kelulusan otomatis bukan bukti kepatuhan penuh.
- Pemuatan font Inter dari Google Fonts gagal pada lingkungan kerja tanpa jaringan luar. Ini bukan galat aplikasi, tetapi tampilan memakai font cadangan di lingkungan tanpa jaringan. Penggantian ke font lokal tidak dilakukan karena di luar cakupan.
- Satu respons 404 sempat muncul pada satu putaran pemuatan; saat diperiksa ulang dengan pemantau respons tidak ada status 4xx. Kemungkinan berkas ikon bawaan peramban; tidak memengaruhi hasil di atas.
- Seluruh layar fitur masih placeholder. Pemeriksaan ulang diperlukan setelah SRS-62 dan SRS-67.

## 5. Uji manual yang tersisa (perlu perangkat pengguna)

1. Pembaca layar: lengkapi versi NVDA dan catatan per halaman agar hasil dapat ditelusuri (lihat bagian 3).
2. Ponsel nyata: buka aplikasi pada lebar sempit, buka dan tutup menu navigasi, pastikan tombol dapat ditekan tanpa salah sentuh.
