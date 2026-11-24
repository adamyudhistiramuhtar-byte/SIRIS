# Laporan Uji SRS-56: Rendering, Routing, dan Komponen Impor

Status: laporan kerja Sprint 3, 24 November 2026. Hasil di bawah hanya untuk apa yang benar-benar dijalankan. Tidak ada hasil yang diisi dari asumsi.

## 1. Ruang lingkup dan batas

Sumber: Jira SRS-56 (T-22), UC-01, UC-09, UC-16; design.md AC-02/03/21/24; DOC-13. Acceptance criteria: rendering sesuai role/context; tanpa file validasi diblokir; focus dan pesan error dapat diperiksa; evidence browser tercatat.

Laporan ini memisahkan dua kelompok bukti:

- **Mock/component (fixture transport UJI)**: komponen nyata (`ImportWizard`, `useImportFlow`, store sesi), transport berupa fixture. Ini bukan bukti E2E.
- **API nyata**: tidak ada. Seluruhnya NOT RUN (bagian 5).

## 2. Build dan dataset yang diuji

| Item | Nilai |
| --- | --- |
| Basis kode | Kandidat PR #17 (`feature/SRS-53-import-wizard`), HEAD 7f16c89 |
| Develop #24 (SRS-46 routing) | Ada pada riwayat basis (28b8501 leluhur HEAD) |
| Kontrak | Tipe lokal `import-wizard-types.ts` (PROPOSED); kontrak SRS-58 proposed-0.1 belum disahkan |
| Dataset | Fixture UJI: berkas `saldo.csv` 2 baris, preview satu warning ber-ID, fixture INVALID, galat transport |
| Browser | Google Chrome for Testing 153.0.8010.12, headless, via Playwright 1.63.0 |
| Aksesibilitas otomatis | axe-core 4.14.1 (tag wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa) |
| Runtime | Node v22.23.4, vitest 3.2.7 |

Harness browser (halaman uji yang memasang wizard dengan fixture) dan skrip Playwright tidak ikut di-commit karena Playwright bukan dependensi repo. Daftar skenario ada pada bagian 4. Dapat dimasukkan ke repo bila PM menghendaki.

## 3. Hasil uji komponen dan routing (vitest, jsdom)

| Pemeriksaan | Hasil | Catatan |
| --- | --- | --- |
| `vue-tsc --noEmit` | PASS | |
| `eslint apps/web/src` | PASS | |
| `npx vitest run apps/` | PASS | 17 file, 233 tes, termasuk 14 tes baru |
| Tes baru `import-flow-integration.spec.ts` | PASS (14) | wizard, controller, dan store sesi nyata; transport fixture |

Cakupan tes baru: file gate (tanpa berkas, alasan nonaktif, ekstensi tidak didukung); alur sukses sampai COMMITTED dan mulai ulang; konteks gudang dan mode yang diteruskan ke layanan; INVALID; galat transport tanpa pesan mentah; simpan timeout menjadi unknown lalu cek status dengan kunci idempotensi sama; cancel dan cancel-unknown; context reset (ganti role saat berjalan, ganti gudang saat preview, gudang di luar assignment dan ACTUAL ditolak); urutan fokus dan fokus judul tahap.

Cakupan yang sudah ada sebelumnya dan tidak diulang: routing dan guard role (`access-guard`, `role-access`, `AppShell`, `HomePage`), unit `FileUpload` dan `ImportWizard`, serta `use-import-flow`.

Selama penulisan, dua tes sempat gagal karena kesalahan pada tes sendiri (teks stepper "Hasil Simpan" ikut terbaca; role awal sudah PURCHASING sehingga tidak ada perubahan konteks). Keduanya diperbaiki di tes; tidak ditemukan cacat pada produk.

## 4. Hasil uji browser (Chrome, fixture transport)

Dijalankan 26 pemeriksaan, hasil 26 PASS, 0 FAIL, 0 SKIPPED pada run akhir.

| Skenario | Hasil |
| --- | --- |
| File gate: Validasi `aria-disabled` tanpa berkas; klik tidak memanggil layanan | PASS |
| Keyboard: urutan fokus tahap 1 tercatat; Enter pada Validasi memicu validasi | PASS |
| Fokus pindah ke judul tahap (H2) setelah validasi | PASS |
| Simpan terkunci sampai warning diakui; Space mengakui, Enter menyimpan menjadi COMMITTED | PASS |
| INVALID menampilkan temuan dan tanpa Simpan | PASS |
| Galat validasi tidak membocorkan pesan mentah | PASS |
| Unknown: bukan sukses, tanpa Simpan, ada Periksa Status; cek status tidak mengulang commit | PASS |
| Cancel menjadi cancelled; cancel gagal menjadi cancel-unknown | PASS |
| Context reset saat request berjalan kembali ke tahap awal; respons lambat dibuang | PASS |
| Ganti gudang di preview membuang preview dan berkas | PASS |
| axe-core pada tahap 1, 2 (invalid), 3, 4, dan unknown: 0 pelanggaran | PASS (5) |
| Tanpa scroll horizontal halaman pada lebar 1280, 768, 375, 320 px (preview) | PASS (4) |
| Tanpa galat konsol pada alur sukses | PASS |

Catatan jujur: run pertama menunjukkan satu FAIL pada "tanpa galat konsol", yaitu permintaan `favicon.ico` yang 404 karena halaman harness tidak punya ikon. Ini artefak harness, bukan produk. Harness diberi ikon kosong lalu seluruh skenario dijalankan ulang (26 PASS). Pada pengulangan tambahan sebelum perbaikan, hasilnya konsisten (25 PASS, 1 FAIL yang sama).

Bukti visual: tangkapan layar preview 375 px (`srs56-preview-375.png`) pada folder keluaran sesi.

## 5. NOT RUN dan keterbatasan

| Item | Status | Alasan |
| --- | --- | --- |
| Wizard terpasang pada halaman aplikasi nyata | NOT RUN | Halaman induk belum ditetapkan (boundary #11, menunggu jawaban PM) |
| API nyata, sesi dan otorisasi nyata (SRS-47/48/51/52) | NOT RUN | Backend belum tersedia; mock tidak melewati guard dan bukan evidence E2E |
| Integrasi database dan impor nyata (SRS-16, SRS-25) | NOT RUN | Gate integrasi masih terbuka |
| Pembaca layar nyata (NVDA) pada wizard | NOT RUN dalam laporan ini | Hanya axe-core otomatis; pemeriksaan manual NVDA oleh anggota tim belum terdokumentasi dengan versi dan bukti |
| Perangkat nyata (ponsel/tablet fisik) | NOT RUN | Hanya viewport emulasi |
| Browser selain Chrome (Firefox, Safari) | NOT RUN | Tidak tersedia pada sesi ini |
| Tema gelap dan kontras tinggi pada wizard | NOT RUN | Browser dijalankan pada tema bawaan |
| Layar AUTH/HOME di browser | NOT RUN | Rendering dan routing keduanya diperiksa di vitest (guard, navigasi, HomePage), belum di browser |

Gate Definition of Done yang belum terpenuhi: reviewer non-penulis belum memeriksa hasil; PR belum dibuat; CI pada HEAD final belum dijalankan. Karena itu issue tetap In Progress.

## 6. Kesimpulan

Untuk lingkup komponen impor dengan transport fixture, seluruh pemeriksaan yang dijalankan PASS dan tidak ditemukan cacat produk. Kesimpulan ini tidak berlaku untuk API, sesi, atau otorisasi nyata, dan tidak boleh dibaca sebagai bukti E2E.
