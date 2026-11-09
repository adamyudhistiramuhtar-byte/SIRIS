# Panduan Deployment dan Operasional

## Identitas dan kendali dokumen

| Atribut | Nilai |
| --- | --- |
| Document ID | DOC-17 |
| Nama proyek | SIRIS — Capstone Project Kelompok 42 |
| Mitra | Warehouse PT Harina Chemicals Industry |
| Versi | 0.2.0 |
| Status dokumen | PROPOSED — NOT IMPLEMENTED |
| Tanggal penyusunan | 2026-11-10 |
| Pemilik dokumen | Fullstack Development Lead |
| Tujuan dokumen | Mengarahkan persiapan lingkungan, pemulihan, dan pemeriksaan deployment. |
| Ruang lingkup | Website pendamping Erasoft; Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation. |

Ketentuan pengguna diberi rujukan **SRC-01**. Desain baru berstatus **PROPOSED**, bukan BASELINE APPROVED. Belum ada aplikasi, hasil pengujian runtime, evaluasi stakeholder, atau persetujuan rilis yang dibuktikan dalam workspace ini. Semua contoh adalah **UJI**.

## Daftar isi

1. Identitas dan kendali dokumen
2. Referensi
3. Status dan gambaran deployment
4. Lingkungan dan persyaratan
5. Environment variables PROPOSED
6. Prosedur instalasi, migration, seed, dan build
7. Perintah operasional generik, belum menjadi script proyek
8. Health check, logging, dan backup
9. Rollback dan troubleshooting
10. Verifikasi deployment dan keterbatasan
11. Dependencies
12. Open issues
13. Riwayat revisi

## Referensi

SRC-01: master prompt pengguna pada sesi penyusunan; SRC-02: `../AGENTS.md`. SRC-09: `../design.md` v1.0.0, kontrak desain untuk ditinjau yang tersedia pada pemeriksaan akhir; snapshot visual disertakan pada DOC-10. Register sumber lengkap, hierarki, dan sumber eksternal terdapat pada [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md). Rujukan antardokumen: [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md), [DOC-06](06_SOFTWARE_ARCHITECTURE_DESIGN.md), [DOC-07](07_DATABASE_DESIGN.md), [DOC-09](09_API_SPECIFICATION.md), [DOC-11](11_DEVELOPMENT_BACKLOG_WBS.md), [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md), [DOC-16](16_SECURITY_RISK_NFR.md), [DOC-18](18_USER_MANUAL_HANDOVER.md).

## Status dan gambaran deployment

**Belum ada aplikasi atau konfigurasi deployment di repositori saat penyusunan.** Panduan ini adalah runbook rencana, bukan pernyataan bahwa perintah build/start tersedia. Jangan menjalankan nama script yang belum ada. Topologi PROPOSED: reverse proxy HTTPS menyajikan build Vue dan meneruskan `/api/v1` ke Express; PostgreSQL dan file storage privat hanya diakses backend. Tidak ada koneksi langsung Erasoft.

## Lingkungan dan persyaratan

| Lingkungan | Data | Akses | Kegunaan |
| --- | --- | --- | --- |
| Development | Fixture UJI | Tim pengembang | Implementasi dan debug |
| Test | Fixture UJI terisolasi; simulasi ACTUAL ditandai | QA dan tim | Integrasi, fault injection, security testing |
| Production-like | Data yang disetujui; fixture UJI tetap terpisah | Reviewer berwenang | Demo/UAT/restore rehearsal |
| Production | Belum diputuskan | Belum ditetapkan | Tidak boleh mengklaim sistem live |

Prasyarat: versi Node.js/PostgreSQL didukung dan dipin setelah OD-07; package manager lockfile; akses DB non-superuser; TLS; disk privat; secrets runtime; timezone dan clock sinkron. Kapasitas CPU/RAM/storage, versi browser dan target RPO/RTO: NEEDS BASELINE.

## Environment variables PROPOSED

| Variabel | Pemilik | Nilai contoh aman | Aturan |
| --- | --- | --- | --- |
| NODE_ENV | Backend | development | Nilai sesuai lingkungan; jangan tampilkan stack produksi |
| PORT | Backend | <port-disepakati> | Tidak diekspos DB |
| DATABASE_URL | Backend | <secret-connection-string> | Tidak commit dan tidak dikirim ke frontend |
| SESSION_SECRET | Backend | <secret-random> | Hanya jika rekomendasi sesi disetujui; rotasi direncanakan |
| PRIVATE_STORAGE_ROOT | Backend | <direktori-privat> | Di luar static web root; permission terbatas |
| ALLOWED_ORIGIN | Backend | <origin-disepakati> | Allowlist, bukan wildcard credentialed |
| APP_TIMEZONE | Backend | <zona-sumber-terkonfirmasi> | Jangan menebak timezone mitra |
| VITE_API_BASE_URL | Frontend | /api/v1 | Publik; tidak menyimpan secret |
| LOG_LEVEL | Backend | <level-disepakati> | Jangan log raw/credential |

## Prosedur instalasi, migration, seed, dan build

| Langkah | Tindakan operator | Bukti selesai |
| --- | --- | --- |
| 1 Prasyarat | Catat OS, versi runtime, DB, package manager dan hash source yang disetujui | Manifest rilis dan versi |
| 2 PostgreSQL | Buat database serta role runtime/migration terpisah; runtime bukan superuser | Akses minimum diverifikasi |
| 3 Backend | Isi env dari secret store; install dependency berdasarkan manifest/lockfile aktual | Log instalasi tanpa secret |
| 4 Migration | Review SQL; backup; jalankan tool migrasi yang telah dipilih | Versi schema dan hasil migrasi |
| 5 Seed | Muat referensi sah; fixture UJI eksplisit; jangan membuat supplier ACTUAL fiktif | Manifest seed dan hash |
| 6 Frontend | Tetapkan API base URL; install dan build dengan script manifest aktual | Artifact hash dan log build |
| 7 Private storage | Siapkan path/bucket privat; cek izin; tidak ada listing publik | Uji akses langsung ditolak |
| 8 Startup | Mulai DB/storage dependency; backend; reverse proxy/frontend | Log readiness dan smoke check |
| 9 Verifikasi | Sesi, izin, impor UJI, rollback, rekonsiliasi dan file privat | Evidence checklist deployment |

## Perintah operasional generik, belum menjadi script proyek

Contoh berikut hanya untuk operator setelah kredensial/target dan versi tool disiapkan. Placeholder harus diganti secara aman; gunakan autentikasi PostgreSQL yang tidak menaruh password pada command history. File backup wajib berada di lokasi privat.

```sh
# Contoh PostgreSQL: nilai koneksi disiapkan operator melalui mekanisme aman.
pg_dump --format=custom --file="<backup-privat.dump>" "<database-sumber>"
# Restore selalu diuji pada database kosong terisolasi terlebih dahulu.
pg_restore --exit-on-error --dbname="<database-restore-uji>" "<backup-privat.dump>"
```

Perintah Node/Vue, migration dan startup masih SOURCE REQUIRED dari package.json/lockfile yang kelak dibuat. `npm test`, `npm run build`, atau perintah migration tidak dinyatakan tersedia. Panduan ini tidak mengeksekusi backup/restore atau deployment.

## Health check, logging, dan backup

Pemeriksaan awal: proses backend hidup, koneksi DB minimum tersedia, akses storage privat berfungsi, frontend memuat API yang benar, dan jam server sinkron untuk expiry. Endpoint health dapat diusulkan sebagai dukungan operasional setelah keputusan arsitektur; bukan UC bisnis baru. Log memakai correlation_id, waktu, level, aksi dan hasil aman; jangan memasukkan payload mentah.

Backup harus mencakup PostgreSQL, file raw/evidence, manifest hash, dan versi konfigurasi tanpa secret plaintext. Ambil snapshot konsisten atau hentikan sementara mutasi selama titik pemulihan dicatat. Retensi dan jadwal ditetapkan berdasarkan OD-08/OD-09. Restore rehearsal: pulihkan DB dan file pada lingkungan terisolasi, cek FK, jumlah batch/run/evidence, checksum file, serta akses. Catat durasi aktual; jangan menyatakan memenuhi RTO sebelum target dan bukti tersedia.

## Rollback dan troubleshooting

| Kondisi | Langkah | Larangan |
| --- | --- | --- |
| Build gagal | Periksa versi/lockfile/script, simpan log, jangan deploy artifact parsial | Jangan menebak script baru tanpa review |
| Migrasi gagal | Hentikan rilis; periksa transaksi/schema; restore backup teruji atau roll forward yang ditinjau | Jangan drop data domain untuk melewati error |
| Preview expired | Validasi ulang menggunakan jam server dan data yang sama | Jangan memperpanjang expiry dengan edit DB manual |
| Commit response hilang | Retry memakai key dan payload sama; baca hasil existing | Jangan memakai key baru untuk memaksa duplikasi |
| Storage gagal setelah upload | Tidak aktifkan metadata evidence; cleanup objek yatim sesuai log | Jangan membuka akses publik sebagai perbaikan |
| Metrik kosong | Periksa mode, cutoff, eligibility, finalisasi dan filter | Jangan mengubah null menjadi 0% |
| Akses ditolak | Periksa provisioning dan scope berwenang | Jangan menonaktifkan middleware otorisasi |

## Verifikasi deployment dan keterbatasan

Checklist rilis: artifact/source hash, migration version, secret injection, TLS, izin DB/storage, fixture UJI, denial lintas role, expiry, retry, rollback, run historis, file size dan restore evidence. Seluruh checklist operasional **NOT EXECUTED**. Keterbatasan saat ini: tidak ada implementasi, hosting, runtime final, source file aktual, keputusan RBAC final atau hasil pengujian. Panduan siap direview; belum dapat dipakai sebagai bukti deployment berhasil.

## Dependencies

| Dependensi | Kegunaan |
| --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | Indeks Induk Dokumentasi Pengembangan |
| [DOC-06](06_SOFTWARE_ARCHITECTURE_DESIGN.md) | Arsitektur Perangkat Lunak dan Desain Terperinci |
| [DOC-07](07_DATABASE_DESIGN.md) | Desain Database, ERD, IRD, dan Kamus Data |
| [DOC-09](09_API_SPECIFICATION.md) | Spesifikasi REST API |
| [DOC-11](11_DEVELOPMENT_BACKLOG_WBS.md) | Backlog Pengembangan, WBS, dan Rencana Implementasi |
| [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md) | Rencana dan Spesifikasi Kasus Pengujian |
| [DOC-16](16_SECURITY_RISK_NFR.md) | Keamanan, Risiko, dan Verifikasi NFR |
| [DOC-18](18_USER_MANUAL_HANDOVER.md) | Panduan Pengguna dan Serah Terima |

## Open issues

Rincian baseline final belum tersedia; lihat register sumber dan keputusan terbuka pada DOC-00.

## Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1.0 | 2026-11-10 | Penyusunan berdasarkan SRC-01; celah sumber dicatat dan desain ditandai PROPOSED. | Belum ada bukti persetujuan |
| 0.2.0 | 2026-11-10 | Integrasi SRC-09 design.md: route, role, token, layar pendukung, metrik dan konflik desain; tetap NEEDS REVIEW. | Belum ada bukti persetujuan |
