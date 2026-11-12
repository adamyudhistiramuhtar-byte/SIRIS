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

Kode error pada `AppError` yang tersedia: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `PAYLOAD_TOO_LARGE`, `VALIDATION_ERROR`, `INTERNAL_SERVER_ERROR`, serta kode spesifik yang diberikan pemanggil (misalnya `INVALID_JSON`).

## 5. Logging aman

- Log akses memakai `req.path` sehingga query string tidak dicatat.
- Query string dapat memuat token, kata kunci pencarian, atau storage key, sehingga tidak boleh masuk log.
- Error tak terduga dicatat sebagai nama error dan `correlation_id` saja.
- Bila `LOG_LEVEL=debug`, hanya stack frame yang dicatat; baris pesan error tetap dihilangkan agar SQL/nilai sensitif tidak bocor.
- Error klien PostgreSQL pada koneksi idle dicatat sebagai kode aman (misalnya `ECONNREFUSED`), bukan objek error mentah.

## 6. Verifikasi koneksi PostgreSQL

Langkah yang disarankan pada lingkungan lokal:

```sh
# 1. Isi DATABASE_URL pada .env lokal (jangan commit nilainya)
# 2. Jalankan pemeriksaan koneksi
npm run db:check

# 3. Terapkan migrasi bila database uji tersedia
psql "$DATABASE_URL" -f database/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f database/seeds/001_initial_seed.sql
```

Status aktual pada pemeriksaan 12 November 2026:

| Aspek | Hasil | Bukti |
| --- | --- | --- |
| Port lokal 5432 | OPEN | Pemeriksaan TCP ke `127.0.0.1:5432`. |
| `DATABASE_URL` pada `.env` lokal | Kosong | Pemeriksaan kunci environment tanpa mencetak nilai. |
| `npm run db:check` | **BLOCKED** | Keluaran: `Koneksi PostgreSQL gagal: DATABASE_URL_NOT_CONFIGURED.` |
| Migrasi dan seed PostgreSQL | **NOT RUN** | Menunggu `DATABASE_URL`, role non-superuser, dan keputusan SRS-44. |
| Integration test database | **BLOCKED** | Test hanya memverifikasi penanganan aman saat database tidak dikonfigurasi. |

Ketersediaan port bukan bukti koneksi, autentikasi, migrasi, atau isolasi ACTUAL/UJI berhasil. Klaim PASS untuk PostgreSQL memerlukan `DATABASE_URL` yang sah dan hasil `db:check` yang berhasil.

## 7. Matriks verifikasi

Perintah dijalankan pada branch `feature/SRS-43-express-service-error-contract` (commit implementasi `b6656cc`), Node.js v24.14.1 dan npm 11.11.0 (runtime lokal; CI memakai Node 22).

| Perintah | Hasil |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS (contracts, api, web) |
| `npm run build` | PASS (contracts, api, web) |
| `npm test` | PASS — 8 file, 21 test |
| `npx vitest run --project api` | PASS — 6 file, 18 test |
| `npm run db:check` | BLOCKED — `DATABASE_URL_NOT_CONFIGURED` |

Test yang ditambahkan:

- `apps/api/src/tests/env.test.ts` — default saat nilai kosong, rentang `PORT`, validasi dan normalisasi `API_PREFIX`.
- `apps/api/src/tests/error.test.ts` — error tak terduga tidak membocorkan SQL/pesan mentah/stack, payload terlalu besar menghasilkan 413.
- `apps/api/src/tests/request-logger.test.ts` — log akses tidak memuat query string.

## 8. Batas dan tindak lanjut

- Kontrak wire DOC-09 masih PROPOSED; bentuk envelope `{data, meta}` pada health endpoint belum disepakati sebagai kontrak seluruh endpoint.
- Autentikasi, sesi, CSRF, dan pemeriksaan role/gudang belum diterapkan; lihat SRS-47 dan SRS-48.
- `npm run db:check` belum dijalankan terhadap PostgreSQL nyata.
- Review independen, CI pada commit final, dan merge PR belum dilakukan.
