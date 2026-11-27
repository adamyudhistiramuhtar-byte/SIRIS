# Perbaikan batas log error SRS-43 — 24 November 2026

Basis: PR #18, `c2105a6083bbb7ba2b81a51b49aab18fd6524c4f`. Perbaikan shutdown `842b406` sudah menjadi ancestor; tidak disalin atau di-merge ulang.

## Masalah dan perubahan

Error handler umum mencatat `error.name`, `error.code` dan, pada level debug, stack frames. Properti tersebut dapat berisi nilai privat walaupun pesan error tidak dicatat. Pool PostgreSQL juga menganggap seluruh code alfanumerik aman. Lima assertion regresi baru membuktikan kebocoran pada kode lama menggunakan marker sintetis, tanpa kredensial atau data mitra.

Perbaikan mengganti log exception umum dengan event konstan `INTERNAL_SERVER_ERROR`, menyalin correlation ID hanya bila berbentuk UUID, dan membatasi diagnostik pool pada daftar code koneksi yang dikenal. Code lain menghasilkan `DATABASE_CONNECTION_FAILED`. Bentuk response error dan kontrak wire correlation tidak diubah. Perubahan tidak menambahkan endpoint, sesi, tabel atau hak akses.

## Verifikasi aktual

Node.js 22.22.2, lingkungan UJI lokal reviewer:

| Pemeriksaan | Hasil |
| --- | --- |
| Tes regresi sebelum perubahan | 3 tes log exception gagal; 2 tes pool gagal dan 2 kontrol diagnostik lulus |
| `npm test` sesudah perubahan | 116/116 PASS, termasuk 7 tes baru dan 6 regresi shutdown |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| Repository scanner workspace | 129 berkas/0 temuan sebelum penambahan dokumen ini; jalankan ulang setelah staging |
| PostgreSQL nyata lokal | NOT RUN; test koneksi lama mencetak `DATABASE_URL_NOT_CONFIGURED`, walaupun runner menandainya PASS |
| CI remote pada kandidat baru | NOT RUN sampai kandidat dipush |

Tes pool baru adalah unit test dengan mock driver, bukan bukti koneksi PostgreSQL nyata. Bukti CI PostgreSQL HEAD staging `0c3a7f0` tidak otomatis berlaku pada perubahan ini.

## Review dan serah terima

Adam adalah penulis kandidat perbaikan ini; approval nonpenulis tetap diperlukan. Dwi memeriksa perbaikan shutdown/log dan kontrak database; Luthfi memeriksa service/error contract. Setelah kandidat tersedia pada branch pemilik, jalankan CI pada HEAD akhir dan tinjau ulang PR #18. Panduan runtime PR #25 bagian logging harus diperbarui agar tidak lagi menjanjikan nama/stack frame mentah pada log debug.

Jangan menandai SRS-43 Done atau menyatakan review GitHub berhasil hanya dari tes lokal. Jika akses tulis GitHub tidak tersedia, kandidat diberikan sebagai patch/bundle melalui issue Jira agar reviewer tetap dapat memeriksanya.
