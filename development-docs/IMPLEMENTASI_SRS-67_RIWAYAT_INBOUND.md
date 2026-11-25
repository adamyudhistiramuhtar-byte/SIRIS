# Implementasi SRS-67 (irisan 1): Halaman Riwayat Inbound (UC-07)

## Identitas dokumen

| Atribut | Nilai |
| --- | --- |
| Issue Jira | SRS-67 (T-33), irisan pertama. Issue belum selesai |
| Penyusun | Vassell Enha Atthayya (Anggota 3, frontend dan design system) |
| Tanggal | 2026-11-26 |
| Versi | 0.1.0 |
| Status | DRAFT, menunggu review |
| Cabang dan basis | `feature/SRS-67-inbound-history-page`, basis `develop` |
| Sumber | DOC-15 (UC-07), `KONTRAK_SUMBER_SRS-37.md`, fixture `database/fixtures/uji/expected.proposed-0.1.json` dan `commitment.proposed-0.1.json`, PVT-16 pada DOC-13 |

## 1. Cakupan dan batas

Irisan ini mengikuti bagian "Mulai sekarang" pada SRS-67: membangun view adapter terhadap fixture DTO berversi tanpa menunggu API. Irisan ini hanya mencakup layar Riwayat Inbound (UC-07). Layar lain pada SRS-67 (referensi material WO, metrik, evidence, audit) belum dikerjakan.

Batas yang berlaku:

- Sumber data adalah fixture UJI `proposed-0.1` yang dibaca di sisi klien. Tidak ada panggilan API, sesi, atau basis data. Ini bukan bukti integrasi.
- Halaman hanya baca. Tidak ada tombol, formulir, atau unggah.
- Mode ACTUAL tetap dinonaktifkan. Halaman memuat label "Data simulasi (UJI), hanya lihat".
- Keterlambatan dan selisih tidak dihitung karena aturannya (OD-06) belum diputuskan.
- Urutan event ditampilkan menurut `event_at`. Aturan urutan resmi (CF-06) masih OPEN, sehingga urutan ini adalah tampilan sementara, bukan keputusan domain.
- Waktu tidak dikonversi zona dan tidak dikarang. Tanpa offset, jam ditampilkan apa adanya dengan keterangan zona tidak tercatat.
- Kriteria SRS-67 "17 layar memakai kontrak disepakati" dan integrasi nyata tidak terpenuhi oleh irisan ini. SRS-67 tidak diklaim selesai.

## 2. Berkas

| Berkas | Isi |
| --- | --- |
| `apps/web/src/shared/inbound/inbound-history.ts` | Fungsi murni `buildInboundHistory`, `formatDate`, `formatEventAt` |
| `apps/web/src/pages/inbound/InboundHistoryPage.vue` | Halaman UC-07 |
| `apps/web/src/router/index.ts` | Rute `inbound-history` memakai halaman ini (sebelumnya placeholder). Metadata rute tidak diubah |
| `apps/web/src/tests/InboundHistoryPage.spec.ts` | 16 tes |

## 3. Perilaku

- Pilihan inbound berasal dari baris EXPECTED. Inbound pertama terpilih secara bawaan.
- Ringkasan menampilkan material, supplier, kuantitas diharapkan (string, tidak dijumlahkan), tanggal kebutuhan, dan janji saat ini. Tanggal kebutuhan tidak pernah tertimpa janji (PVT-16).
- Tabel riwayat menampilkan referensi event, jenis (INITIAL atau CHANGE), tanggal janji, waktu event, dan penanda "Janji saat ini" tepat pada satu event terakhir.
- Inbound tanpa janji menampilkan keadaan kosong dan "Belum ada janji", bukan tanggal karangan.
- Riwayat yang dimulai dari CHANGE tanpa INITIAL ditampilkan apa adanya dengan peringatan "Urutan janji tidak sah".
- Event yang merujuk inbound yang tidak ada pada EXPECTED dilaporkan dengan kode `MISSING_REFERENCE` dan tidak dibuang diam-diam.
- Urutan memakai instan waktu, bukan urutan teks, sehingga offset yang berbeda tetap benar. Waktu yang sama mempertahankan urutan masukan.

## 4. Hasil pemeriksaan aktual

Dijalankan pada `develop` ditambah irisan ini, di lingkungan pengembangan lokal.

| Pemeriksaan | Hasil | Catatan |
| --- | --- | --- |
| `npx vitest run --project web` | PASS, 13 berkas, 196 uji | Termasuk 16 uji baru pada `InboundHistoryPage.spec.ts` |
| `npx eslint apps/web/src` | PASS, tanpa temuan | |
| `npx vue-tsc --noEmit -p apps/web` | PASS, tanpa galat | |
| `vite build` (apps/web) | PASS | Impor JSON fixture dari luar `apps/web` berhasil dibundel |
| `python3 scripts/check_repository.py --tracked` | PASS, 0 temuan (157 berkas) | Dijalankan dengan berkas irisan ini sudah di-stage |

## 5. NOT RUN dan batas bukti

- Eksekusi PVT-16 pada lingkungan nyata dengan API dan basis data: NOT RUN.
- Halaman pada peramban sungguhan (visual, keyboard, NVDA, perangkat fisik, Firefox/Safari): NOT RUN. Tes yang ada berjalan pada jsdom.
- Pemfilteran role dan gudang pada layar ini: mengandalkan penjaga rute yang sudah ada; tidak diuji ulang di sini. Pemfilteran frontend bukan kontrol keamanan.
- CI GitHub pada HEAD final: belum diperiksa saat dokumen ini ditulis.
- Integrasi dengan API (SRS-62) dan gate SRS-47/48/51/52: belum ada.

## 6. Serah terima

- Fixture yang dipakai adalah dua berkas `proposed-0.1`. Bila kontrak berubah (misalnya CF-06 diputuskan), ubah `inbound-history.ts` dan tesnya, bukan halaman.
- Ketika API tersedia, ganti sumber data pada `InboundHistoryPage.vue` dengan layanan yang menghasilkan `InboundHistory`; fungsi dan tampilan tetap dapat dipakai.
- Layar SRS-67 yang tersisa: referensi material WO (UC-06), metrik (UC-08, UC-13), evidence (UC-11), rekonsiliasi (UC-12), audit (UC-15). Layar yang belum punya fixture tidak dibuat dengan DTO karangan.

## Riwayat revisi

| Versi | Tanggal | Perubahan |
| --- | --- | --- |
| 0.1.0 | 2026-11-26 | Penyusunan awal irisan Riwayat Inbound (UC-07). |
