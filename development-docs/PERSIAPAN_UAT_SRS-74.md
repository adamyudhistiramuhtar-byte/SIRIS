# Persiapan UAT: Skrip, Peserta, dan Lingkungan (SRS-74)

## Identitas dokumen

| Atribut | Nilai |
| --- | --- |
| Issue Jira | SRS-74 (T-40), Sprint 3 |
| Penyusun | Vassell Enha Atthayya (Anggota 3) |
| Reviewer teknis nonpenulis | Muhammad Luthfi Rafif |
| Persetujuan PM | Adam Yudhistira Muhtar, setelah review dan evidence |
| Tanggal | 2026-11-24 (0.1.0), direvisi 2026-11-25 (0.2.0) |
| Status dokumen | DRAFT, menunggu review ulang. Seluruh isi adalah usulan persiapan, bukan hasil UAT |
| Sumber | DOC-14 v0.2.0, DOC-13, DOC-15, `MATRIK_PERMUTASI_SRS-36.md` (baseline RBAC UJI v0.1), `KONTRAK_SUMBER_SRS-37.md`, fixture `database/fixtures/uji/*.proposed-0.1.json` |
| Keputusan PM yang dipakai pada 0.2.0 | Baseline UJI UC-11 dan UC-12 tetap view-only (jawaban butir D). Keputusan UJI dan cutoff: komentar 10153 pada SRS-38. Arahan UAT: komentar 10160 pada SRS-74. Sumber asli dan baseline 55 TC: lampiran SRS-35 dan SRS-58 |

## 1. Batas dokumen

- Tidak ada UAT yang sudah dilaksanakan. Semua hasil aktual pada DOC-14 tetap NOT RUN.
- Nama peserta, jadwal, dan penandatangan tidak tersedia. Dokumen ini tidak mengarang nama, tanggal, atau tanda tangan, dan tidak mengirim undangan.
- Semua data adalah data UJI berawalan `UJI-`. Mode ACTUAL tetap dinonaktifkan.
- Kontrak sumber dan fixture berstatus `proposed-0.1`, review belum ada. Skrip di bawah ikut berstatus usulan.
- Pekerjaan ini tidak mengubah DOC-14, termasuk secara diam-diam. Pemisahan dua tahap pada bagian 1.1 hanya berlaku untuk skrip persiapan ini. Perubahan ke DOC-14 mengikuti prosedur change request pada DOC-15.
- Revisi 0.2.0 tidak menghasilkan hasil UAT baru. Tidak ada langkah yang ditandai PASS.

### 1.1 Batas dua tahap UAT-W langkah 4 dan 5

Baseline UJI menetapkan UC-11 (evidence) dan UC-12 (rekonsiliasi) tetap view-only. Karena itu langkah 4 dan 5 pada UAT-W dipecah menjadi dua tahap yang tidak boleh dicampur:

| Tahap | Isi | Syarat mulai | Hasil yang boleh dicatat |
| --- | --- | --- | --- |
| Tahap 1: penolakan mutasi pada build saat ini | Memeriksa bahwa aksi mutasi pada UC-11 dan UC-12 (jalankan rekonsiliasi, unggah evidence, unduh isi evidence) ditolak atau tidak tersedia, dan bahwa tampilan hanya-lihat tetap bekerja | Build yang memuat halaman UC-11 dan UC-12 view-only. Pengecekan sisi server menunggu SRS-48 | Penolakan yang teramati. Bukan PASS untuk fungsi positif |
| Tahap 2: skenario positif | Rekonsiliasi dijalankan, evidence diunggah dan diunduh, variance -10 untuk fisik 0 diverifikasi | Fitur, domain, dan otorisasi yang sah tersedia, dan keputusan PM membuka baseline view-only. Gate 47, 48, 51, 52 terpenuhi pada build terintegrasi dengan stakeholder | Tetap NOT RUN. Tidak boleh dinyatakan PASS pada build view-only |

UC-11 dan UC-12 tidak dihapus dari skrip. Tidak ada klaim PASS positif pada build view-only.

## 2. Ketidaksesuaian dan celah yang ditemukan

| No | Temuan | Dampak pada skrip | Tindakan |
| --- | --- | --- | --- |
| G-1 | DOC-14 UAT-W langkah 4 (jalankan rekonsiliasi) dan langkah 5 (arsipkan bukti) bertentangan dengan baseline UJI view-only pada UC-11 dan UC-12 (keputusan PM butir D) | Dipecah menjadi Tahap 1 (pemeriksaan penolakan mutasi pada build saat ini, langkah 4A dan 5A) dan Tahap 2 (skenario positif, langkah 4B dan 5B, BLOCKED BY DECISION) | DOC-14 tidak diubah. PM memutuskan apakah DOC-14 direvisi lewat change request atau butir D dibuka. Tahap 2 menunggu fitur, domain, dan otorisasi yang sah |
| G-2 | Expected "variance -10 untuk true 0" pada UAT-W bergantung pada eksekusi rekonsiliasi (UC-12) | Bagian Tahap 2 (langkah 4B) tidak dapat diverifikasi selama G-1 terbuka. Perilaku null versus nol tetap dapat diperiksa pada preview impor COUNT | Dicatat pada skrip UAT-W |
| G-3 | Prasyarat DOC-14 menyebut "pengujian integrasi selesai sesuai kriteria", sedangkan SRS-47, SRS-48, SRS-51, dan SRS-52 belum selesai | UAT tidak dapat dimulai pada lingkungan nyata | Dicatat sebagai gate pada bagian 6 |
| G-4 | Tidak ada skrip atau perintah reset data UJI yang terdaftar di `package.json` atau `scripts/` pada snapshot ini | Prosedur reset pada bagian 5 baru berupa syarat, bukan langkah yang dapat dijalankan | Menunggu SRS-50 dan SRS-54 (harness dan staging) |
| G-5 | Nilai nol pada EXPECTED (CF-06) dan nilai saldo negatif (OD-05) masih OPEN pada kontrak | Dua kasus ini tidak dimasukkan ke skrip | Menunggu keputusan PM |
| G-6 | Tanggal dan jam cutoff (CF-04) masih OPEN | Skrip UAT-W tidak menyebut jam cutoff | Menunggu keputusan PM |

## 3. Lima skrip UAT

Kolom UC mengikuti DOC-14. Izin mengikuti SRS-36 bagian 5 dan 6 (baseline UJI, A = diizinkan, T = ditolak). Status setiap skrip: SIAP DIREVIEW untuk teks, NOT RUN untuk eksekusi.

### 3.1 UAT-P (Purchasing)

| Atribut | Isi |
| --- | --- |
| UC | UC-01, UC-02, UC-04, UC-05, UC-06, UC-07, UC-08 |
| Peran | PURCHASING |
| Prasyarat | Sesi PURCHASING pada gudang berizin. Fixture receiving sudah diimpor Warehouse (UAT-W langkah 1) sebelum langkah 4. API, otorisasi, dan staging nyata aktif |
| Data UJI | `expected.proposed-0.1.json` (UJI-IN-001, UJI-IN-002), `commitment.proposed-0.1.json` (event INITIAL lalu CHANGE untuk UJI-IN-001) |

| Langkah | Aksi | Hasil bisnis yang diharapkan |
| --- | --- | --- |
| 1 | Impor EXPECTED UJI dan lihat preview | Preview menampilkan baris valid. Tanggal kebutuhan (`requested_date`) tidak berubah |
| 2 | Commit | Batch tersimpan. Hanya satu commit untuk satu kunci idempotency |
| 3 | Impor COMMITMENT INITIAL lalu CHANGE | Dua event janji tersimpan utuh. Janji awal tidak tertimpa |
| 4 | Baca histori, exception, pemberitahuan, referensi WO, dan metrik | Belum final tidak disebut final delay atau mismatch. Denominator metrik dijelaskan. Histori berurutan |

Kriteria penerimaan (DOC-14): tanggal kebutuhan tetap, event janji utuh, belum final tidak disebut final, denominator dijelaskan.

### 3.2 UAT-W (Warehouse)

| Atribut | Isi |
| --- | --- |
| UC | UC-03, UC-09, UC-10, UC-11, UC-12, UC-13, UC-14, UC-15 |
| Peran | WAREHOUSE |
| Prasyarat | Sesi WAREHOUSE pada gudang berizin. Referensi inbound (UAT-P langkah 1 dan 2) sudah ada |
| Data UJI | `receiving.proposed-0.1.json` (parsial UJI-RCV-001 dan penutup), `stock.proposed-0.1.json` (QTY AKHIR 10 untuk UJI-MAT-01), `count.proposed-0.1.json` (fisik nol dihitung, dan baris belum dihitung bernilai null) |

| Langkah | Aksi | Hasil bisnis yang diharapkan | Status rencana |
| --- | --- | --- | --- |
| 1 | Impor receiving parsial lalu penutup yang sah | Parsial dan final dibedakan. Penutup tanpa referensi yang sah ditolak (INVALID_CLOSING) | Dapat dijalankan |
| 2 | Impor STOCK dengan QTY AKHIR 10 | Preview menampilkan saldo dan cutoff. Cutoff yang null ditampilkan sebagai tidak tersedia | Dapat dijalankan |
| 3 | Impor COUNT: satu baris dihitung dengan fisik 0, baris lain belum dihitung (null) | Nol dan belum dihitung ditampilkan berbeda. Null tidak diperlakukan sebagai nol | Dapat dijalankan |
| 4A | Tahap 1: coba jalankan rekonsiliasi pada build saat ini | Aksi mutasi UC-12 tidak tersedia atau ditolak. Hasil rekonsiliasi hanya dapat dilihat. Penolakan di sisi server dicek setelah SRS-48 | Dapat disiapkan. Eksekusi NOT RUN |
| 4B | Tahap 2: jalankan rekonsiliasi | Variance -10 untuk fisik 0 dan null untuk belum dihitung (DOC-14) | BLOCKED BY DECISION (G-1, G-2). NOT RUN |
| 5A | Tahap 1: coba unggah dan unduh isi evidence, lalu buka histori, metrik, dan audit proses | Unggah dan unduh isi evidence UC-11 tidak tersedia atau ditolak. Histori, metrik, dan audit proses dapat dilihat. Kunci penyimpanan tidak terlihat | Dapat disiapkan. Eksekusi NOT RUN |
| 5B | Tahap 2: arsipkan bukti (berkas privat, run lama tetap ada) | Unggah dan unduh evidence berfungsi pada berkas privat. Run lama tetap ada | BLOCKED BY DECISION (G-1). NOT RUN |

### 3.3 UAT-R (Production)

| Atribut | Isi |
| --- | --- |
| UC | UC-06 |
| Peran | PRODUCTION |
| Prasyarat | Sesi PRODUCTION pada gudang berizin. Referensi material WO tersedia |
| Data UJI | Referensi material WO UJI (kontrak UC-06 pada `KONTRAK_SUMBER_SRS-37.md` bagian 4.6) |

| Langkah | Aksi | Hasil bisnis yang diharapkan |
| --- | --- | --- |
| 1 | Baca referensi material WO pada gudang berizin | Hanya baca. Sumber referensi terlihat. Tidak ada BOM atau perencanaan |
| 2 | Coba buka pemberitahuan inbound dan halaman impor | Ditolak sesuai matriks: PRODUCTION hanya A pada UC-06, T pada UC-01 sampai UC-05 dan UC-07 sampai UC-16 |

### 3.4 UAT-M (Management)

| Atribut | Isi |
| --- | --- |
| UC | UC-08, UC-13, UC-14 |
| Peran | MANAGEMENT |
| Prasyarat | Sesi MANAGEMENT. Hasil metrik dan riwayat dari UAT-P dan UAT-W tersedia |
| Data UJI | Hasil dari UAT-P dan UAT-W pada gudang yang sama |

| Langkah | Aksi | Hasil bisnis yang diharapkan |
| --- | --- | --- |
| 1 | Pilih gudang dan mode yang berizin | Pilihan di luar izin tidak tersedia. ACTUAL tidak dapat dipilih |
| 2 | Baca metrik supplier, metrik persediaan, dan riwayat selisih | Data hanya pada lingkup berizin. Denominator jelas |
| 3 | Buka halaman audit | Ditolak (UC-15: T untuk MANAGEMENT) |
| 4 | Coba akses langsung isi mentah dan konten evidence | Tidak dapat diperoleh. Kunci penyimpanan tidak terlihat |

Catatan: bagian ini sekaligus menguji penegakan di sisi server. Pemfilteran frontend bukan kontrol keamanan.

### 3.5 UAT-I (Purchasing atau Warehouse sesuai jenis impor)

| Atribut | Isi |
| --- | --- |
| UC | UC-01, UC-02, UC-03, UC-09, UC-10, UC-16 |
| Peran | PURCHASING untuk EXPECTED dan COMMITMENT. WAREHOUSE untuk RECEIVING, STOCK, dan COUNT |
| Data UJI | `negative_cases` pada kelima fixture, dengan kode galat dari katalog DOC-08 bagian 16 |

| Langkah | Aksi | Hasil bisnis yang diharapkan |
| --- | --- | --- |
| 1 | Unggah contoh invalid dari tiap jenis impor | Laporan validasi menampilkan kode dan pesan yang sesuai. Pesan galat mentah dari server tidak bocor ke layar |
| 2 | Perbaiki berkas lalu validasi ulang | Validasi lolos |
| 3 | Biarkan satu preview kedaluwarsa | Preview ditandai kedaluwarsa |
| 4 | Coba commit pada preview invalid dan kedaluwarsa | Ditolak. Tidak ada data masuk |

Kriteria penerimaan (DOC-14): lima jenis impor memakai validasi internal bersama, invalid dan kedaluwarsa tidak dapat commit, UC-16 tidak muncul di navigasi.

## 4. Calon peserta dan konfirmasi kewenangan

Nama, jabatan, dan jadwal tidak tersedia pada sumber manapun di repositori. Tabel di bawah adalah formulir yang harus diisi PM. Tidak ada undangan yang dikirim.

| Skrip | Peran yang dibutuhkan | Nama calon peserta | Kewenangan dikonfirmasi (ya/tidak, oleh siapa, kapan) | Jadwal rencana |
| --- | --- | --- | --- | --- |
| UAT-P | Purchasing | Tidak tersedia | Belum | Tidak tersedia |
| UAT-W | Warehouse | Tidak tersedia | Belum | Tidak tersedia |
| UAT-R | Production | Tidak tersedia | Belum | Tidak tersedia |
| UAT-M | Management | Tidak tersedia | Belum | Tidak tersedia |
| UAT-I | Purchasing dan Warehouse | Tidak tersedia | Belum | Tidak tersedia |

Kriteria Jira: kewenangan peserta harus dikonfirmasi sebelum pelaksanaan. Konfirmasi itu belum ada, sehingga kriteria ini belum terpenuhi.

Urutan eksekusi yang disarankan karena ketergantungan data: UAT-W langkah 1, UAT-P, UAT-W langkah 2 sampai 5, UAT-R, UAT-M, UAT-I.

## 5. Data UJI dan reset

| Item | Status |
| --- | --- |
| Lima fixture UJI `proposed-0.1` | Tersedia di `database/fixtures/uji/`, belum direview |
| Pemisahan ACTUAL dan UJI | Migrasi SRS-44 sudah digabung. Mode ACTUAL tetap dinonaktifkan |
| Prosedur reset data UJI | Belum tersedia (G-4). Syarat minimum: mengembalikan basis data UJI ke dataset awal, menghapus batch dan preview sisa, tanpa menyentuh data ACTUAL, serta mencatat hash dataset sebelum dan sesudah |
| Data pengguna uji per peran | Belum tersedia. Bergantung pada SRS-47 dan SRS-48 |

## 6. Lingkungan dan gate

| Prasyarat | Kondisi saat snapshot | Pemilik |
| --- | --- | --- |
| Versi prototipe dan baseline yang ditetapkan | Belum tersedia | PM |
| Autentikasi, sesi, dan otorisasi nyata | Belum selesai (SRS-47, SRS-48 To Do) | Luthfi |
| Staging dan preview tervalidasi | Dalam pengerjaan (SRS-50 In Progress, SRS-51 To Do) | Adam, Luthfi |
| Commit atomik dan idempotency | Belum selesai (SRS-52 To Do) | Dwi |
| Integrasi UI dengan API | Belum dimulai (SRS-62, SRS-67) | Vassell |
| Regression dan pengujian menyeluruh | Belum dimulai (SRS-64, SRS-68, SRS-72) | Adam, Dwi |
| Mock tidak boleh dipakai sebagai bukti E2E UAT | Berlaku | Semua |

Sampai gate di atas terpenuhi, UAT tidak boleh dijalankan pada lingkungan nyata. Skrip tetap dapat direview.

## 7. Evidence dan handoff

| Butir | Status |
| --- | --- |
| PR dan SHA | Diisi setelah PR dibuka |
| Dataset | Fixture UJI `proposed-0.1` (lima berkas) |
| Hasil PASS, FAIL, SKIPPED, NOT RUN | Seluruhnya NOT RUN |
| Reviewer | Belum ada hasil review |
| Handoff ke PM | Pertanyaan G-1, G-5, G-6, dan formulir bagian 4 |

## Riwayat revisi

| Versi | Tanggal | Perubahan |
| --- | --- | --- |
| 0.1.0 | 2026-11-24 | Penyusunan awal skrip, formulir peserta, dan syarat lingkungan. |
| 0.2.0 | 2026-11-25 | Menanggapi review PM pada 8577c47: UAT-W langkah 4 dan 5 dipecah menjadi Tahap 1 (penolakan mutasi pada build view-only) dan Tahap 2 (skenario positif, BLOCKED BY DECISION). Batas dua tahap dibuat eksplisit pada bagian 1.1. DOC-14 tidak diubah. Tidak ada hasil UAT baru. |
