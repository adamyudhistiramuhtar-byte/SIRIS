# Panduan Runtime dan Kontrak Error API

Dokumen ini mencatat implementasi dan bukti untuk [SRS-43](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-43) (T-09). Status: **IN PROGRESS — NEEDS REVIEW**. Dokumen ini bukan persetujuan kontrak final; DOC-09 masih berstatus PROPOSED.

## 1. Cakupan

Perubahan pada issue ini terbatas pada fondasi layanan Express dan kontrak error:

- Resolusi environment yang aman ketika template `.env.example` disalin apa adanya.
- Prefix API mengikuti `API_PREFIX`, bukan path tetap.
- Log akses tanpa query string dan log error tanpa pesan mentah, SQL, atau storage key.
- Response error yang tidak membocorkan stack, SQL, pesan driver, atau storage key.
- Pemeriksaan koneksi PostgreSQL melalui script runtime.
- Pengujian otomatis untuk perilaku di atas.

Di luar cakupan: autentikasi/sesi (SRS-47), otorisasi dan RBAC (SRS-48), audit (SRS-49), migrasi database (SRS-44), serta seluruh endpoint bisnis DOC-09 yang masih PROPOSED.

## 2. Perintah runtime

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev:api` | Menjalankan API dengan `tsx watch` pada `PORT` (default 3001). |
| `npm run build:api` | Kompilasi TypeScript API ke `apps/api/dist`. |
| `npm run start --workspace=@siris/api` | Menjalankan hasil build (`dist/server.js`). |
| `npm run db:check` | Memeriksa koneksi PostgreSQL dan keluar dengan kode 1 bila gagal. |
| `npm run lint` | ESLint seluruh workspace. |
| `npm run typecheck` | Typecheck seluruh workspace. |
| `npm test` | Vitest unit, komponen, dan integration test. |

`db:check` tidak pernah melaporkan PASS ketika `DATABASE_URL` kosong atau koneksi gagal. Status yang benar untuk kondisi tersebut adalah **BLOCKED**, bukan PASS.

## 3. Resolusi environment

Nilai kosong atau hanya whitespace diperlakukan sebagai "tidak diisi" sehingga default berlaku. Ini mencegah API gagal startup hanya karena `.env.example` disalin tanpa diisi.

| Variabel | Default | Catatan |
| --- | --- | --- |
| `NODE_ENV` | `development` | Enum `development`, `test`, `production`. |
| `PORT` | `3001` | Harus bilangan bulat 1–65535. |
| `DATABASE_URL` | string kosong | String kosong berarti database belum dikonfigurasi, bukan error startup. |
| `ALLOWED_ORIGIN` | `http://localhost:5173` | Daftar origin dipisahkan koma. Jangan gunakan wildcard untuk deployment credentialed. |
| `LOG_LEVEL` | `info` | Enum `debug`, `info`, `warn`, `error`. |
| `APP_TIMEZONE` | `Asia/Jakarta` | Zona jadwal proyek, bukan bukti zona data operasional mitra. |
| `API_PREFIX` | `/api/v1` | Wajib diawali `/`; garis miring di akhir dinormalkan. |

`API_PREFIX` kini benar-benar dipakai saat me-mount router versi. Endpoint kesehatan tetap tersedia pada `/health` dan `${API_PREFIX}/health`.

## 4. Kontrak error

Response error mengikuti bentuk DOC-09:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validasi data gagal.",
    "details": [{ "field": "mode", "code": "MODE_MISMATCH" }],
    "correlation_id": "00000000-0000-4000-8000-000000000001"
  }
}
```

Ketentuan yang diterapkan:

- `details` selalu berupa array; kosong bila tidak ada detail.
- `correlation_id` sama dengan header `X-Correlation-ID` pada response.
- Error tak terduga selalu menghasilkan `500 INTERNAL_SERVER_ERROR` dengan pesan generik.
- Pesan driver, SQL, stack trace, nama tabel, dan storage key tidak dikirim ke klien.
- Payload JSON rusak menghasilkan `400 INVALID_JSON`.
- Payload melebihi batas parser menghasilkan `413 PAYLOAD_TOO_LARGE`.
- Route tidak dikenal menghasilkan `404 NOT_FOUND`.

Kode error pada `AppError` yang tersedia: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, dan `VALIDATION_ERROR`, ditambah kode spesifik yang diberikan pemanggil (misalnya `INVALID_JSON`). Dua kode berikut dihasilkan oleh error handler untuk kondisi parser dan tidak tersedia sebagai class `AppError`: `INVALID_JSON`, `PAYLOAD_TOO_LARGE`. `INTERNAL_SERVER_ERROR` selalu dihasilkan error handler untuk error tak terduga, bukan melalui `AppError`.

## 5. Logging aman

- Log akses memakai `req.path` sehingga query string tidak dicatat.
- Query string dapat memuat token, kata kunci pencarian, atau storage key, sehingga tidak boleh masuk log.
- Error tak terduga dicatat sebagai nama error dan `correlation_id` saja.
- Bila `LOG_LEVEL=debug`, hanya stack frame yang dicatat; baris pesan error tetap dihilangkan agar SQL/nilai sensitif tidak bocor.
- Error klien PostgreSQL pada koneksi idle dicatat sebagai kode aman (misalnya `ECONNREFUSED`), bukan objek error mentah.

## 6. Verifikasi koneksi PostgreSQL

Bagian ini memisahkan kredensial runtime dan migrasi sesuai kesepakatan teknis SRS-44 dengan pengelola database (14 November 2026). Rancangan role, DDL privilege, dan *migration runner* pada PR #15 masih **PROPOSED dan belum merged**; isi bagian ini mencatat apa yang sudah diverifikasi pada lingkungan UJI lokal, bukan menetapkan kontrak final.

### 6.1 Peran dan tanggung jawab

| Kredensial | Role | Hak | Digunakan oleh |
| --- | --- | --- | --- |
| `DATABASE_URL` | `siris_app` | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `USAGE` sequence; `USAGE` schema `public`; **tanpa** `CREATE` | Aplikasi/runtime: layanan Express dan `npm run db:check` |
| `DATABASE_MIGRATION_URL` | `siris_migrator` | `LOGIN`, `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`; pemilik database, schema `public`, dan objek migrasi | Proses migrasi dan seed manual melalui `psql` — **bukan** aplikasi |

Kedua role `NOSUPERUSER`. `DATABASE_MIGRATION_URL` **tidak dibaca oleh konfigurasi aplikasi**: `apps/api/src/config/env.ts` hanya memuat `DATABASE_URL`, dan `apps/api/src/shared/db/pool.ts` hanya membuka pool dari `DATABASE_URL`. Variabel migrasi dikonsumsi oleh proses `psql`, bukan oleh Node.js. DDL tidak boleh dijalankan dengan `DATABASE_URL` runtime karena role runtime tidak memiliki hak `CREATE`.

### 6.2 Urutan bootstrap

1. Siapkan instance PostgreSQL 16.6 lokal (container UJI, port hanya pada loopback `127.0.0.1:55432`).
2. Jalankan DDL role dan privilege sebagai administrator instance: `CREATE ROLE ... NOSUPERUSER`, pemilik database/schema, `REVOKE CREATE ON SCHEMA public FROM PUBLIC`, `GRANT USAGE`, dan `ALTER DEFAULT PRIVILEGES FOR ROLE siris_migrator`.
3. Baru jalankan migrasi dan seed dengan `siris_migrator`. `ALTER DEFAULT PRIVILEGES` hanya berlaku untuk objek yang dibuat **setelah** perintah tersebut; objek yang sudah ada sebelumnya harus diberi grant eksplisit.
4. Simpan nilai lokal (tidak di-commit) untuk `DATABASE_URL` (`siris_app`) dan `DATABASE_MIGRATION_URL` (`siris_migrator`). Aplikasi hanya membaca `DATABASE_URL`; `DATABASE_MIGRATION_URL` diekspor eksplisit pada sesi `psql` dan tidak dibaca oleh kode Node.js. Jangan commit `.env`, `.env.pg-uji`, connection string, atau password.

### 6.3 Pemeriksaan runtime

```powershell
npm run db:check
```

Keluaran yang diharapkan: `[SIRIS API] Koneksi PostgreSQL berhasil (<ms>ms).` dengan exit code `0`. Bila `DATABASE_URL` kosong atau koneksi gagal, script keluar dengan kode `1` dan status yang benar adalah **BLOCKED**, bukan PASS.

### 6.4 Migrasi dan seed dengan role migrasi

Perintah berikut menjalankan DDL sebagai `siris_migrator` tanpa menampilkan connection string (autentikasi lokal di dalam container):

```powershell
Get-Content database/migrations/001_initial_schema.sql -Raw |
  docker exec -i siris-pg-uji psql -X -v ON_ERROR_STOP=1 -U siris_migrator -d siris_uji
Get-Content database/seeds/001_initial_seed.sql -Raw |
  docker exec -i siris-pg-uji psql -X -v ON_ERROR_STOP=1 -U siris_migrator -d siris_uji
```

Bila `psql` tersedia pada host:

```powershell
psql $env:DATABASE_MIGRATION_URL -v ON_ERROR_STOP=1 -f database/migrations/001_initial_schema.sql
psql $env:DATABASE_MIGRATION_URL -v ON_ERROR_STOP=1 -f database/seeds/001_initial_seed.sql
```

`.env` dimuat oleh aplikasi melalui `dotenv`, bukan oleh shell; nilai `DATABASE_MIGRATION_URL` harus diekspor eksplisit pada sesi shell dan tidak boleh dicetak ke log atau terminal bersama.

### 6.5 Status verifikasi

Seluruh baris di bawah diuji pada HEAD `50d075b` (commit `Selaraskan panduan koneksi PostgreSQL dengan pemisahan role SRS-44`, 14 November 2026 00:34 WIB), bukan pada `889270f`. Waktu dicatat dalam zona WIB (+07:00) berdasarkan jam lingkungan pengujian, bukan perkiraan.

| Aspek | Hasil | Bukti |
| --- | --- | --- |
| Instance PostgreSQL UJI | PASS | `postgres:16.6`, container `siris-pg-uji`, `127.0.0.1:55432` → `5432`. |
| Atribut role | PASS | Diperiksa 14 Nov 2026 20:02 WIB: `siris_app` dan `siris_migrator` `rolsuper=f`, `rolcreatedb=f`, `rolcreaterole=f`, `rolcanlogin=t`. |
| Kepemilikan objek | PASS | 14 Nov 2026 20:02 WIB: owner database `siris_uji`, schema `public`, dan 8 tabel = `siris_migrator`. |
| Hak runtime | PASS | `has_table_privilege` SELECT/INSERT/UPDATE/DELETE = `true`; `has_schema_privilege('siris_app','public','CREATE')` = `false`; USAGE = `true`. |
| Penolakan CREATE runtime | PASS | `CREATE TABLE` oleh `siris_app` → `ERROR: permission denied for schema public`, exit code `1`; `to_regclass('public.probe_denied')` = `NO_OBJECT`. |
| `npm run db:check` | PASS | HEAD `50d075b`; 14 Nov 2026 20:02:05–20:02:11 WIB; `[SIRIS API] Koneksi PostgreSQL berhasil (427ms).`; role runtime `siris_app`; exit code `0`. |
| Migrasi `001` + seed `001` | PASS | HEAD `50d075b`; 14 Nov 2026 20:02:19–20:02:22 WIB; keduanya exit code `0`; 8 tabel; seed UJI: `users` 3, `warehouses` 2, `user_warehouses` 3. |
| Clean install (database kosong) | PASS (bukti awal) | Dilakukan saat penyiapan database UJI sebelum audit ini: 8 tabel terbentuk dari database kosong. Tidak diulang pada audit 14 Nov 2026 20:02 karena bersifat destruktif; log bertimestamp untuk langkah awal tidak tersimpan. |
| Upgrade data lama (`001` lama → `003`) | **NOT RUN** | File `002`/`003` hanya ada pada PR #15 (draft); scope SRS-44. |
| Integration test database | **BLOCKED** | `tests/integration/database/connection.test.ts` mencetak `DATABASE_URL_NOT_CONFIGURED` dan tetap lolos tanpa koneksi, sehingga bukan bukti koneksi. |
| `npm run check:repo` lokal | **NOT RUN** | Python 3 tidak tersedia pada Windows lokal (exit code `9009`); divalidasi oleh job CI Ubuntu. |

Pengukuran `db:check` sebelumnya (80 ms dan 114 ms) tidak memiliki log bertimestamp yang tersimpan, sehingga tidak dipakai sebagai bukti pada laporan ini. Angka yang berlaku adalah pengukuran 427 ms di atas; latensi dapat berbeda antarpengukuran dan bukan ambang kelulusan.

Ketersediaan port bukan bukti koneksi, autentikasi, migrasi, atau isolasi ACTUAL/UJI berhasil. Klaim PASS untuk PostgreSQL memerlukan `DATABASE_URL` yang sah dan hasil `db:check` yang berhasil; klaim migrasi memerlukan eksekusi aktual dengan role migrasi pada database UJI.

## 7. Matriks verifikasi

### 7.1 Snapshot historis pada `b6656cc`

Baris berikut adalah hasil pengujian saat implementasi awal (`b6656cc`), bukan HEAD PR. Angka ini dipertahankan sebagai riwayat dan tidak dipakai sebagai bukti akhir.

| Perintah | Hasil |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS (contracts, api, web) |
| `npm run build` | PASS (contracts, api, web) |
| `npm test` | PASS — 8 file, 21 test |
| `npx vitest run --project api` | PASS — 6 file, 18 test |
| `npm run db:check` | BLOCKED pada `b6656cc` (tanpa `DATABASE_URL`) |

### 7.2 Verifikasi akhir pada HEAD `50d075b` (Windows lokal)

Diuji ulang pada 14 November 2026, 20:03–20:05 WIB (+07:00), branch `feature/SRS-43-express-service-error-contract`, Node.js v24.14.1 dan npm 11.11.0. CI memakai Node 22 dan dicatat terpisah pada §7.3.

| Pemeriksaan | Hasil | Bukti |
| --- | --- | --- |
| `npm run lint` | PASS | Exit code `0`. |
| `npm run typecheck` | PASS | Exit code `0`; contracts, api, web. |
| `npm run build` | PASS | Exit code `0`; Vite selesai dalam 14,05 detik. |
| `npm test` | PASS | Exit code `0`; 11 file, 103 test. |
| `npm run check:repo` | **NOT RUN** | Python 3 tidak tersedia (exit code `9009`); divalidasi CI Ubuntu. |
| `npm run db:check` | PASS | 427 ms, exit code `0`, role `siris_app`; rincian waktu di §6.5. |
| Integration test database | **BLOCKED** | Mencetak `DATABASE_URL_NOT_CONFIGURED`; bukan bukti koneksi. |

### 7.3 CI Ubuntu pada HEAD `50d075b`

| Run | Job | Hasil |
| --- | --- | --- |
| `43474142812` | `repository-checks` | PASS |
| `43474142812` | `application-ci` | PASS |
| `43474142812` | Total | **2/2 job PASS** |

Test yang ditambahkan:

- `apps/api/src/tests/env.test.ts` — default saat nilai kosong, rentang `PORT`, validasi dan normalisasi `API_PREFIX`.
- `apps/api/src/tests/error.test.ts` — error tak terduga tidak membocorkan SQL/pesan mentah/stack, payload terlalu besar menghasilkan 413.
- `apps/api/src/tests/request-logger.test.ts` — log akses tidak memuat query string.

## 8. Batas dan tindak lanjut historis

- Kontrak wire DOC-09 masih PROPOSED; bentuk envelope `{data, meta}` pada health endpoint belum disepakati sebagai kontrak seluruh endpoint.
- Autentikasi, sesi, CSRF, dan pemeriksaan role/gudang belum diterapkan; lihat SRS-47 dan SRS-48.
- `npm run db:check` PASS terhadap PostgreSQL 16.6 UJI lokal (lihat §6); CI pada commit final dan review ulang masih diperlukan.
- Review independen, CI pada commit final, dan merge PR belum dilakukan.

## 9. Verifikasi reviewer setelah stacked PR #21

Pemeriksaan 22 November 2026 pada HEAD `c2105a6083bbb7ba2b81a51b49aab18fd6524c4f` memakai Node.js 22.22.2, PostgreSQL 16.6 UJI lokal, dan role runtime `siris_app`. `842b406a75690da031bf37a555cdcdc72f317838` adalah ancestor HEAD tersebut; isi tree keduanya sama. Perbaikan shutdown tidak perlu di-cherry-pick lagi.

| Pemeriksaan | Hasil dan batas |
| --- | --- |
| `npm ci` | PASS pada worktree reviewer terpisah |
| `npm test` | PASS 109/109, termasuk 6 regresi shutdown dan koneksi PostgreSQL nyata |
| `python3 scripts/check_repository.py --tracked` | PASS, 127 berkas, 0 temuan |
| Repository workspace pengguna | PASS, 122 berkas, 0 temuan; konteks berbeda dari tracked HEAD PR |
| Tiga temuan yang dilaporkan sebelumnya | Tidak tereproduksi pada kedua pemeriksaan di atas; log dan lokasi temuan asal belum tersedia. Tidak disimpulkan sebagai temuan yang telah diperbaiki tanpa bukti asal. |
| Review nonpenulis atas shutdown | Belum ditemukan: daftar review PR #21 kosong, merge pemilik PR bukan bukti review formal. Adam menulis shutdown sehingga tidak dapat mengesahkannya sendiri. Dwi diminta memeriksa HEAD PR #18. |

Tes shutdown mencakup kegagalan HTTP/pool/deadline dengan exit gagal, pesan log aman, sinyal berulang, resource dan timer. Riwayat §6–8 dipertahankan sebagai evidence historis; klaim failure-path NOT RUN di versi lama telah digantikan oleh hasil di atas. Tes bukan bukti autentikasi/otorisasi SRS-47/48 atau endpoint bisnis.

Dokumen ini dipindahkan ke `development-docs/` mengikuti AGENTS.md. Tidak ada perubahan source runtime. HEAD dokumentasi baru tetap perlu CI dan review; bukti eksekusi runtime mengikat SHA `c2105a6`, bukan otomatis semua perubahan runtime sesudahnya.
