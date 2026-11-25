# Pengujian SRS-63: Izin Lintas Role dan Gudang pada Modul Inti (Sisi Klien)

Status: PROPOSED. Dokumen ini hanya mencakup sisi klien. Otorisasi backend belum tersedia (SRS-47 dan SRS-48), sehingga bagian backend tercatat NOT RUN dan tidak boleh dibaca sebagai bukti keamanan.

## 1. Acuan

- SRS-36 baseline RBAC UJI v0.1: §6.2 (matriks halaman use case x role), §7 butir 8 (reset konteks), §8.3 (aturan lintas gudang berbasis `user_warehouses`).
- Pengujian membaca tabel §6.2 langsung dari `MATRIK_PERMUTASI_SRS-36.md`. Bila dokumen atau kode berubah dan keduanya tidak lagi sama, pengujian gagal. Sensitivitas diperiksa dengan mutasi: menambahkan UC-01 ke role WAREHOUSE membuat 4 pengujian gagal.

## 2. Cakupan pengujian (`cross-role-warehouse.spec.ts`, 33 tes)

| Kelompok | Isi |
| --- | --- |
| Pembacaan dokumen | Tabel §6.2 terbaca 16 baris (15 halaman dan UC-16 sebagai non-halaman). |
| Matriks halaman | 15 use case x 4 role sama dengan dokumen; penanda hanya-lihat (UC-11 dan UC-12) sama dengan dokumen; UC-16 tidak pernah menjadi halaman; mode ACTUAL menolak semua kombinasi. |
| Route nyata | Memakai `router` aplikasi sebenarnya: tiap use case halaman punya satu route, UC-16 tidak punya route, penanda `viewOnly` sama dengan dokumen, dan untuk setiap role seluruh route terbuka atau dialihkan ke akses ditolak sesuai dokumen tanpa membocorkan tujuan lewat query atau hash. Beralih role pada route terbuka mengalihkan ke akses ditolak bila role baru tidak berhak. |
| Lintas gudang (§8.3) | Gudang di luar assignment ditolak tanpa mengubah konteks; akun lain dengan assignment berbeda tidak mewarisi gudang akun sebelumnya dan reset terpanggil sekali dengan kunci akun, role, dan gudang; akun dua gudang hanya berpindah di antara assignment-nya dan pindah ke gudang yang sama tidak mereset; akun tanpa assignment tidak punya gudang aktif; gudang aktif di luar assignment pada akun baru ditolak dan akun lama tetap utuh; pergantian role pada gudang yang sama tetap mereset; role tidak dikenal dan mode ACTUAL ditolak tanpa mereset. |

Pengujian lain yang sudah ada tetap berlaku: `role-access.spec.ts`, `access-guard.spec.ts`, `session-context.spec.ts`, dan `use-import-flow.spec.ts` (reset konteks pada alur impor; berkas ini berada pada PR #17 dan belum ada di `develop`).

## 3. Hasil

Dijalankan pada `develop` (28b8501) ditambah berkas SRS-63 ini, Linux.

| Pemeriksaan | Hasil |
| --- | --- |
| `cross-role-warehouse.spec.ts` | PASS, 33 tes |
| Mutasi matriks (UC-01 ditambahkan ke WAREHOUSE) | Terdeteksi, 4 tes gagal; kode dikembalikan seperti semula |
| `npm run typecheck` (contracts, api, web) | PASS |
| `eslint apps/web` | PASS, tanpa temuan |
| `vitest run apps/` | PASS, 13 berkas, 163 tes (130 tes sebelumnya ditambah 33 tes SRS-63) |
| `check_repository.py --workspace` | PASS, 139 berkas, 0 temuan (tidak menguji aplikasi, histori Git, atau CI remote) |

## 4. Yang belum dapat diuji

| Butir | Status | Alasan |
| --- | --- | --- |
| Otorisasi backend per endpoint dan per aksi (§5.3, §8.2) | NOT RUN | SRS-47/48 belum tersedia; endpoint bisnis belum lengkap |
| Kepemilikan batch lintas gudang dan lintas pengguna (§9) | NOT RUN | Membutuhkan layanan dan data batch nyata |
| Penegakan `user_warehouses` pada basis data | NOT RUN | Integrasi database tidak dapat dijalankan tanpa PostgreSQL di lingkungan ini |
| Izin mode ACTUAL (§11) | Tidak diuji | Status PROPOSED/OPEN; ACTUAL sengaja ditolak |
| Sesi, login, dan pergantian akun nyata | NOT RUN | Sesi nyata menunggu SRS-47; konteks UJI sementara dipakai |
| ID gudang WH-01 | Sementara | Bukan identitas backend; menunggu provider SRS-47/48 |

Penyaringan di sisi klien bukan kontrol keamanan. Otoritas tetap pada backend.
