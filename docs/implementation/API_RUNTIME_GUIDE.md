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
4. Isi `.env` lokal (tidak di-commit) dengan `DATABASE_URL` untuk `siris_app` dan `DATABASE_MIGRATION_URL` untuk `siris_migrator`. Jangan commit `.env`, `.env.pg-uji`, connection string, atau password.

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

### 6.5 Status verifikasi (14 November 2026)

| Aspek | Hasil | Bukti |
| --- | --- | --- |
| Instance PostgreSQL UJI | PASS | `postgres:16.6`, container `siris-pg-uji`, `127.0.0.1:55432` → `5432`. |
| Atribut role | PASS | `siris_app` dan `siris_migrator`: `rolsuper=f`, `rolcreatedb=f`, `rolcreaterole=f`, `rolcanlogin=t`. |
| Kepemilikan objek | PASS | Owner database `siris_uji`, schema `public`, dan 8 tabel = `siris_migrator`. |
| Hak runtime | PASS | `has_table_privilege` SELECT/INSERT/UPDATE/DELETE = `true`; `has_schema_privilege('siris_app','public','CREATE')` = `false`; USAGE = `true`. |
| Penolakan CREATE runtime | PASS | `CREATE TABLE` oleh `siris_app` → `ERROR: permission denied for schema public`; `to_regclass` objek probe = null. |
| `npm run db:check` | PASS | `[SIRIS API] Koneksi PostgreSQL berhasil (80ms).` exit code `0`. |
| Migrasi `001` + seed `001` | PASS | Exit code `0`; 8 tabel; seed UJI: `users` 3, `warehouses` 2, `user_warehouses` 3. |
| Clean install (database kosong) | PASS | Migrasi dijalankan pada `siris_uji` yang belum memiliki tabel. |
| Upgrade data lama (`001` lama → `003`) | **NOT RUN** | File `002`/`003` hanya ada pada PR #15 (draft); belum ada prosedur/fixture upgrade di branch ini. |
| Integration test database | **BLOCKED** | `tests/integration/database/connection.test.ts` tetap lolos saat database tidak terhubung, sehingga bukan bukti koneksi. |

Ketersediaan port bukan bukti koneksi, autentikasi, migrasi, atau isolasi ACTUAL/UJI berhasil. Klaim PASS untuk PostgreSQL memerlukan `DATABASE_URL` yang sah dan hasil `db:check` yang berhasil; klaim migrasi memerlukan eksekusi aktual dengan role migrasi pada database UJI.

## 7. Matriks verifikasi

Perintah dijalankan pada branch `feature/SRS-43-express-service-error-contract` (commit implementasi `b6656cc`), Node.js v24.14.1 dan npm 11.11.0 (runtime lokal; CI memakai Node 22). Matriks ini adalah snapshot pada commit `b6656cc`; bukti terbaru pada head `889270f` dicatat di §6.

| Perintah | Hasil |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS (contracts, api, web) |
| `npm run build` | PASS (contracts, api, web) |
| `npm test` | PASS — 8 file, 21 test |
| `npx vitest run --project api` | PASS — 6 file, 18 test |
| `npm run db:check` | BLOCKED pada `b6656cc`; PASS pada head `889270f` (lihat §6) |

Test yang ditambahkan:

- `apps/api/src/tests/env.test.ts` — default saat nilai kosong, rentang `PORT`, validasi dan normalisasi `API_PREFIX`.
- `apps/api/src/tests/error.test.ts` — error tak terduga tidak membocorkan SQL/pesan mentah/stack, payload terlalu besar menghasilkan 413.
- `apps/api/src/tests/request-logger.test.ts` — log akses tidak memuat query string.

## 8. Batas dan tindak lanjut

- Kontrak wire DOC-09 masih PROPOSED; bentuk envelope `{data, meta}` pada health endpoint belum disepakati sebagai kontrak seluruh endpoint.
- Autentikasi, sesi, CSRF, dan pemeriksaan role/gudang belum diterapkan; lihat SRS-47 dan SRS-48.
- `npm run db:check` PASS terhadap PostgreSQL 16.6 UJI lokal (lihat §6); CI pada commit final dan review ulang masih diperlukan.
- Review independen, CI pada commit final, dan merge PR belum dilakukan.
