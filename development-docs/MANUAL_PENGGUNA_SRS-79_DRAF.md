# Draf Manual Pengguna per Use Case (SRS-79)

## Identitas dokumen

| Atribut | Nilai |
| --- | --- |
| Issue Jira | SRS-79 (T-45), Sprint 3 |
| Penyusun | Vassell Enha Atthayya (Anggota 3, frontend dan design system) |
| Reviewer teknis nonpenulis | Muhammad Luthfi Rafif |
| Persetujuan PM | Adam Yudhistira Muhtar, setelah review dan evidence |
| Tanggal snapshot | 2026-11-26 |
| Versi | 0.1.0 |
| Status dokumen | DRAFT, menunggu review. Bukan manual operasional |
| Dokumen induk | DOC-18 `18_USER_MANUAL_HANDOVER.md` v0.2.0. Dokumen ini tidak menggantikan dan tidak mengubah DOC-18 |
| Basis kode | `origin/develop` pada commit 0ff9e4a, ditambah PR terbuka yang disebut per use case |
| Sumber | Rute dan metadata pada `apps/web/src/router/index.ts`, matriks izin `apps/web/src/shared/access/access-matrix.ts` (SRS-36 baseline UJI v0.1), `KONTRAK_SUMBER_SRS-37.md`, DOC-05, DOC-10, DOC-14, DOC-18 |

## 1. Tujuan dan batas

Dokumen ini mencocokkan 16 use case pada DOC-18 dengan keadaan aplikasi yang benar-benar ada pada snapshot di atas, sehingga pembaca tahu halaman mana yang sudah dapat dipakai, mana yang masih rancangan, dan mana yang belum ada.

Batas yang berlaku:

- Belum ada tangkapan layar. Tangkapan layar hanya boleh berasal dari build yang benar dijalankan, dan build semacam itu belum dijalankan untuk dokumen ini. Mockup tidak dipakai sebagai bukti fungsi.
- Semua data adalah data UJI. Mode ACTUAL tetap dinonaktifkan dan tidak memberi akses halaman.
- Langkah pada bagian "Rancangan" mengikuti DOC-18 dan berstatus rencana. Langkah pada bagian "Menurut PR" berasal dari kode pada PR terbuka yang belum digabung dan belum ditinjau.
- Tidak ada klaim pengujian oleh pengguna akhir, UAT, atau persetujuan. Seluruh UAT berstatus NOT RUN.
- Pemfilteran menu dan rute pada sisi klien bukan kontrol keamanan. Penegakan akses ada di server (SRS-47, SRS-48) dan belum ada.
- Tidak ada fitur atau use case yang ditambahkan di luar 16 UC.

## 2. Istilah status

| Status | Arti |
| --- | --- |
| TERSEDIA (DEVELOP) | Halaman berfungsi pada `develop`. Belum ada pada snapshot ini |
| PR TERBUKA | Halaman ada pada pull request yang belum digabung. Dapat berubah setelah review |
| PLACEHOLDER | Rute terdaftar dan menampilkan halaman kerangka. Tidak ada fungsi impor atau data |
| TIDAK ADA LAYAR | Tidak ada halaman tersendiri (UC-16) |
| RANCANGAN | Panduan pada DOC-18 yang belum dapat dicocokkan dengan build |

## 3. Masuk, konteks, dan navigasi (keadaan saat ini)

- **Halaman masuk** (`/login`) adalah simulasi fondasi. Kolom sudah terisi nilai contoh dan tombol masuk langsung membuka Beranda setelah jeda singkat tanpa memeriksa akun. Autentikasi dan sesi sungguhan menunggu SRS-47/48/51 (PR #54, belum digabung).
- **Konteks UJI sementara**: sesi bawaan memakai role Purchasing, gudang WH-01 (Gudang Bahan Baku), mode UJI. Nilai ini akan diganti sesi nyata setelah SRS-47.
- **Strip konteks** pada kerangka aplikasi menampilkan gudang aktif dan mode. Periksa keduanya sebelum membaca data.
- **Menu** disaring menurut role dan mode. Halaman yang tidak diizinkan tidak muncul pada menu. Membuka alamat halaman yang tidak diizinkan menampilkan halaman Akses Ditolak.
- **Mode ACTUAL** tidak memberi akses ke halaman mana pun.

Izin halaman pada baseline UJI (SRS-36 §6.1 dan §6.2):

| Role | Use case yang dapat dibuka |
| --- | --- |
| Purchasing | UC-01, UC-02, UC-04, UC-05, UC-06, UC-07, UC-08 |
| Warehouse | UC-03, UC-04, UC-05, UC-07, UC-09, UC-10, UC-11, UC-12, UC-13, UC-14, UC-15 |
| Production | UC-06 |
| Management | UC-08, UC-13, UC-14 |

UC-11 dan UC-12 berizin lihat saja pada baseline UJI (keputusan PM butir D). UC-16 bukan halaman.

## 4. Status per use case

| UC | Nama | Rute | Role UJI | Status layar pada snapshot | PR terkait |
| --- | --- | --- | --- | --- | --- |
| UC-01 | Mengimpor Referensi Inbound | `/inbound/import-reference` | Purchasing | PLACEHOLDER | Belum ada |
| UC-02 | Mengimpor Janji Supplier | `/inbound/import-commitment` | Purchasing | PLACEHOLDER | Belum ada |
| UC-03 | Mengimpor Data Penerimaan | `/inbound/import-receiving` | Warehouse | PLACEHOLDER | Belum ada |
| UC-04 | Memeriksa Exception Inbound | `/inbound/exceptions` | Purchasing, Warehouse | PLACEHOLDER | Belum ada |
| UC-05 | Melihat Pemberitahuan Inbound | `/inbound/notices` | Purchasing, Warehouse | PLACEHOLDER | Belum ada |
| UC-06 | Membaca Referensi Material WO | `/materials/work-orders` | Purchasing, Production | PLACEHOLDER | Belum ada |
| UC-07 | Menelusuri Riwayat Inbound | `/inbound/history` | Purchasing, Warehouse | PR TERBUKA (fixture UJI, hanya baca) | #56 (ea4eab0) |
| UC-08 | Melihat Metrik Supplier | `/inbound/metrics` | Purchasing, Management | PLACEHOLDER | Logika metrik backend pada #40 dan #43, belum ada layar |
| UC-09 | Mengimpor Data Stok | `/inventory/import-stock` | Warehouse | PR TERBUKA (fixture UJI, simpan belum tersedia) | #55 (1cfde82), bertumpuk pada #17 (44d7c02) |
| UC-10 | Mengimpor Hasil Hitung Fisik | `/inventory/import-count` | Warehouse | PLACEHOLDER | Belum ada layar |
| UC-11 | Mengarsipkan Bukti Kartu Stok | `/inventory/evidence` | Warehouse (lihat saja) | PLACEHOLDER | Belum ada |
| UC-12 | Menjalankan Rekonsiliasi Stok | `/inventory/reconcile` | Warehouse (lihat saja) | PLACEHOLDER | Layanan rekonsiliasi backend pada #47, belum ada layar |
| UC-13 | Menelusuri Riwayat Selisih Stok | `/inventory/history` | Warehouse, Management | PLACEHOLDER | Belum ada |
| UC-14 | Melihat Metrik Persediaan | `/inventory/metrics` | Warehouse, Management | PLACEHOLDER | Logika metrik backend pada #49, belum ada layar |
| UC-15 | Menelusuri Audit Proses | `/audit` | Warehouse | PLACEHOLDER | Belum ada |
| UC-16 | Memvalidasi Data Impor | Tidak ada | Internal | TIDAK ADA LAYAR | Komponen alur impor bersama pada #17 |

Komponen yang sudah ada pada `develop`: komponen dasar (SRS-45), kerangka dan routing role (SRS-46), dan preview saldo stok (komponen `StockBalancePreview`, SRS-83). Komponen alur impor bersama (unggah, laporan validasi, wizard) berada pada PR #17 dan belum digabung.

## 5. Panduan yang dapat dicocokkan dengan kode

### 5.1 UC-07 Menelusuri Riwayat Inbound (menurut PR #56, belum digabung)

Peran: Purchasing dan Warehouse. Data: fixture UJI `proposed-0.1`, bukan data mitra. Halaman hanya baca.

1. Buka menu Riwayat Inbound. Periksa strip konteks (gudang, mode UJI).
2. Pilih referensi inbound pada kolom "Inbound".
3. Baca ringkasan: material, supplier, kuantitas diharapkan, tanggal kebutuhan, dan janji saat ini.
4. Baca tabel riwayat: referensi event, jenis (INITIAL atau CHANGE), tanggal janji, waktu event, dan penanda "Janji saat ini" pada event terakhir.

Hal yang perlu dipahami:

- Tanggal kebutuhan tidak pernah berubah karena janji. Perubahan janji hanya menambah event.
- Inbound tanpa janji menampilkan "Belum ada janji", bukan tanggal tertentu.
- Peringatan "Urutan janji tidak sah" muncul bila riwayat dimulai dari CHANGE tanpa INITIAL. Event tetap ditampilkan apa adanya.
- Peringatan "Event tanpa referensi inbound" (MISSING_REFERENCE) muncul bila ada event yang merujuk inbound yang tidak ada pada data EXPECTED.
- Waktu event ditampilkan sesuai zona pada sumber, tanpa konversi.
- Halaman tidak menghitung keterlambatan atau selisih karena aturannya belum diputuskan (OD-06).
- Penerimaan parsial dan penutup yang disebut DOC-18 belum ditampilkan pada riwayat ini.

### 5.2 UC-09 Mengimpor Data Stok (menurut PR #55, belum digabung)

Peran: Warehouse. Data: berkas JSON UJI QTY AKHIR (`kind` STOCK, `contract_version` proposed-0.1). Hanya mode UJI.

1. Buka menu Impor Data Stok. Halaman menampilkan label "Data simulasi (UJI)".
2. Pilih berkas JSON saldo stok. Jalankan validasi.
3. Bila berkas tidak sah, laporan validasi menampilkan baris, kolom, dan pesan. Perbaiki berkas lalu validasi ulang.
4. Bila sah, periksa preview saldo dan cutoff. Nilai saldo diambil dari QTY AKHIR dan tidak dijumlahkan dari pergerakan.
5. Tombol konfirmasi tidak menyimpan data. Halaman menampilkan "Simpan belum tersedia" karena commit atomik dan audit (SRS-52, SRS-54) belum ada. Pratinjau tidak disimpan.

Hal yang perlu dipahami:

- Berkas tanpa `cutoff_id` ditolak sebagai INVALID_METADATA. Isi berkas yang tidak sah tetap INVALID_FILE.
- Komponen dukungan opsional (movement, WO, master) belum diproses pada halaman ini; penyimpanan dukungan menunggu migrasi 009.
- Jam cutoff belum diputuskan (CF-04). Halaman tidak mengarang jam.

## 6. Panduan lain: tetap rancangan

Untuk UC-01 sampai UC-06, UC-08, UC-10 sampai UC-15, langkah penggunaan masih berupa rancangan pada DOC-18 bagian 5 sampai 19. Langkah tersebut belum dicocokkan dengan build karena halamannya masih placeholder. Jangan memakainya sebagai petunjuk operasional.

Ringkasan batas rancangan yang sudah diputuskan dan relevan bagi pengguna:

- **UC-11 dan UC-12**: baseline UJI view-only. Unggah dan unduh isi evidence serta eksekusi rekonsiliasi belum disetujui dan nonaktif. Skenario positif menunggu fitur, domain, dan otorisasi yang sah (lihat `PERSIAPAN_UAT_SRS-74.md`, PR #34).
- **UC-10**: nol dan belum dihitung harus dibedakan. Item belum dihitung tidak boleh ditafsirkan sebagai fisik nol.
- **UC-15**: akses halaman audit hanya Warehouse pada baseline UJI. Management tidak memperoleh isi mentah atau lokasi penyimpanan privat.
- **UC-16**: validasi berjalan sebagai bagian kelima alur impor dan tidak punya halaman.

## 7. Known issues dan keputusan terbuka

| No | Hal | Status |
| --- | --- | --- |
| K-1 | Halaman masuk berupa simulasi tanpa pemeriksaan akun. Kolom terisi nilai contoh | Menunggu SRS-47/48/51 (PR #54) |
| K-2 | Sebagian besar rute masih placeholder | Diketahui, lihat bagian 4 |
| K-3 | Pemfilteran menu dan rute sisi klien bukan kontrol keamanan | Penegakan di server belum ada (SRS-48) |
| K-4 | Simpan pada impor stok belum tersedia | Menunggu SRS-52 dan SRS-54 |
| K-5 | Jam cutoff (CF-04), nilai nol EXPECTED (CF-06), saldo negatif (OD-05), aturan delay (OD-06), CF-08 | OPEN DECISION pada PM |
| K-6 | Urutan janji pada riwayat mengikuti waktu event sebagai tampilan sementara (CF-06 OPEN) | Menunggu keputusan |
| K-7 | UC-11 dan UC-12 view-only pada baseline UJI | Keputusan PM butir D |
| K-8 | Sumber final dan 55 kasus uji asli | Lampiran SRS-35 dan SRS-58; pemetaan tidak dicakup dokumen ini |
| K-9 | Aksesibilitas pembaca layar (NVDA), perangkat fisik, Firefox dan Safari belum diuji | NOT RUN |

## 8. Pemeriksaan dan bukti

| Pemeriksaan | Hasil |
| --- | --- |
| `python3 scripts/check_repository.py --tracked` | 0 temuan (154 berkas) |
| Pencocokan 16 UC dengan rute dan matriks izin | Dilakukan dengan membaca `router/index.ts` dan `access-matrix.ts` pada develop 0ff9e4a |
| Tangkapan layar dari build berjalan | NOT RUN |
| Langkah pada bagian 5 dijalankan pada peramban | NOT RUN. Langkah disusun dari kode dan tes PR terkait |
| UAT oleh pengguna | NOT RUN |

Status PR dan SHA pada tabel bagian 4 adalah snapshot 2026-11-26. Perbarui tabel ini setiap PR digabung.

## 9. Serah terima

- DOC-18 tidak diubah. Bila isi dokumen ini akan menggantikan bagian DOC-18, gunakan prosedur change request pada DOC-15.
- Pemilik dokumen berikutnya perlu menambahkan tangkapan layar hanya dari build yang dijalankan, dan memperbarui bagian 4 dan 5 saat PR #17, #55, #56 digabung.
- Layar yang masih placeholder tidak diberi langkah baru sampai halamannya ada.

## Riwayat revisi

| Versi | Tanggal | Perubahan |
| --- | --- | --- |
| 0.1.0 | 2026-11-26 | Penyusunan awal dari rute, matriks izin, dan PR terbuka. |
