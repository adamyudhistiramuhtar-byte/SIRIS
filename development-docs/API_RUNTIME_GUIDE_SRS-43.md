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
| `ALLOWED_ORIGIN` | `http://localhost:5173` | Daftar origin dipisahkan koma. Origin ditolak kecuali yang terdaftar eksplisit. Wildcard `*` bila dikonfigurasi hanya mengembalikan `Access-Control-Allow-Origin: *` **tanpa** credentials; origin pemanggil tidak dipantulkan. Hindari wildcard untuk deployment credentialed. |
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
- Header `X-Correlation-ID` yang dikirim klien hanya diterima bila berformat UUID yang valid; nilai kosong, non-UUID, cacat, terlalu panjang, atau mengandung karakter kontrol diabaikan dan diganti UUID baru yang dihasilkan server.
- Satu permintaan memakai satu `correlation_id` yang konsisten pada konteks request, header response, body error, dan log.
- Error tak terduga selalu menghasilkan `500 INTERNAL_SERVER_ERROR` dengan pesan generik.
- Error tak terduga tidak pernah mencetak `error.name`, `error.code`, pesan mentah, atau stack; lognya hanya memakai identitas stabil `INTERNAL_SERVER_ERROR` dan `correlation_id` yang lolos validasi UUID.
- Pesan driver, SQL, stack trace, nama tabel, dan storage key tidak dikirim ke klien.
- Payload JSON rusak menghasilkan `400 INVALID_JSON`.
- Payload melebihi batas parser menghasilkan `413 PAYLOAD_TOO_LARGE`.
- Route tidak dikenal menghasilkan `404 NOT_FOUND`.

Kode error pada `AppError` yang tersedia: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, dan `VALIDATION_ERROR`, ditambah kode spesifik yang diberikan pemanggil (misalnya `INVALID_JSON`). Dua kode berikut dihasilkan oleh error handler untuk kondisi parser dan tidak tersedia sebagai class `AppError`: `INVALID_JSON`, `PAYLOAD_TOO_LARGE`. `INTERNAL_SERVER_ERROR` selalu dihasilkan error handler untuk error tak terduga, bukan melalui `AppError`.

## 5. Logging aman

- Log akses memakai `req.path` sehingga query string tidak dicatat.
- Query string dapat memuat token, kata kunci pencarian, atau storage key, sehingga tidak boleh masuk log.
- Error tak terduga dicatat sebagai event konstan `Unhandled Error: INTERNAL_SERVER_ERROR` dengan `correlation_id` yang lolos validasi UUID.
- `LOG_LEVEL` tidak mengubah batas kerahasiaan ini: nama, code, pesan mentah, SQL, storage key, dan stack tidak dicatat pada level mana pun.
- Header `X-Correlation-ID` yang bukan UUID tidak dipercaya, tidak dipantulkan ke response, dan tidak disalin ke log; middleware mengganti dengan UUID server dan log error memakai `CORRELATION_UNAVAILABLE` hanya bila konteks correlation belum tersedia.
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

Keluaran sukses: `[SIRIS API] Koneksi PostgreSQL berhasil (<ms>ms).` dengan exit code `0`. Bila `DATABASE_URL` kosong atau koneksi gagal, script mencatat `[SIRIS API] DATABASE_CHECK_FAILED: Koneksi PostgreSQL gagal (<kode-aman>).` dan keluar dengan kode `1`; status yang benar adalah **BLOCKED**, bukan PASS. Bila pemeriksaan tidak dapat dijalankan, script mencatat `[SIRIS API] DATABASE_CHECK_FAILED: Pemeriksaan database tidak dapat dijalankan.` dan keluar dengan kode `1` tanpa membocorkan nama/pesan error mentah.

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
| Integration test database | **GATED / NOT RUN tanpa env** | `tests/integration/database/connection.test.ts` menjalankan pemeriksaan koneksi PostgreSQL nyata hanya bila `DATABASE_URL` tersedia; bila tidak, kasus nyata di-skip dan hanya perilaku `DATABASE_URL_NOT_CONFIGURED` yang diverifikasi. Bukan bukti koneksi saat env tidak tersedia. |
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
| Integration test database | **GATED / NOT RUN tanpa env** | Sama seperti §6.5: pemeriksaan nyata PostgreSQL dijalankan hanya bila `DATABASE_URL` tersedia; tanpa env, hasilnya bukan bukti koneksi. |

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

Pemeriksaan 22 November 2026 pada HEAD `c2105a6083bbb7ba2b81a49aab18fd6524c4f` memakai Node.js 22.22.2, PostgreSQL 16.6 UJI lokal, dan role runtime `siris_app`. `842b406a75690da031bf37a555cdcdc72f317838` adalah ancestor HEAD tersebut; isi tree keduanya sama. Perbaikan shutdown tidak perlu di-cherry-pick lagi.

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

## 10. Remediasi review independen 25–26 November 2026 (temuan #2–#4)

Pemeriksaan Dwi pada HEAD `2b86059` menutup Finding #1 dan menyisakan Finding #2–#4. Perbaikan berikut dibatasi pada temuan tersebut; implementasi Finding #1 (log error konstan dan `DATABASE_CHECK_FAILED`) tidak diubah.

| Temuan | Perbaikan | Regresi |
| --- | --- | --- |
| #2 Lokasi panduan | Panduan dipindahkan dari `docs/implementation/API_RUNTIME_GUIDE.md` ke `development-docs/API_RUNTIME_GUIDE_SRS-43.md` (rename yang sama dengan PR #25 `f7a0ab8`), termasuk baris §9. Rujukan `README.md` dan `.github/publish-candidates.json` diperbarui; tidak ada duplikasi panduan. | Pencarian repositori untuk path lama tidak menemukan rujukan tersisa. |
| #3 Bukti koneksi database | `tests/integration/database/connection.test.ts` di-gate: kasus PostgreSQL nyata hanya berjalan bila `DATABASE_URL` tersedia dan di-skip eksplisit bila tidak. Unit test deterministik `apps/api/src/tests/db-pool.test.ts` mencakup tanpa konfigurasi, sukses + cleanup client, kegagalan koneksi/query dengan kode aman, error client idle, dan `closeDbPool`. | 5 kasus integrasi di-skip tanpa `DATABASE_URL`; PostgreSQL 16 nyata **NOT RUN/BLOCKED** di environment ini. |
| #4A Correlation ID | Header non-UUID, cacat, kosong, terlalu panjang, atau mengandung karakter kontrol tidak dipercaya; middleware menghasilkan UUID server. UUID valid dipertahankan; response header, body error, dan log memakai ID yang sama. | `correlation-id.test.ts` (9 kasus) dan `error-log-boundary.test.ts` (konsistensi UUID pada error/log). |
| #4B CORS | `ALLOWED_ORIGIN='*'` tidak lagi memantulkan origin dan tidak mengaktifkan credentials (`Access-Control-Allow-Origin: *`, tanpa `Access-Control-Allow-Credentials`). Allowlist eksplisit tetap memakai credentials. | `cors.test.ts` (7 kasus: allowlist, origin asing, multi-origin, preflight, wildcard, tanpa Origin). |
| SIGTERM pool | Investigasi: `server.ts` sudah memanggil `closeDbPool` pada SIGTERM/SIGINT; `shutdown.test.ts` menutupi kegagalan pool, sinyal berulang, dan timeout. Bukti tambahan unit: `closeDbPool` idempoten dan mempropagasi kegagalan `pool.end`. | Uji SIGTERM dengan PostgreSQL nyata tetap **NOT RUN** (tidak ada instance). |

### 10.1 Validasi lokal pada working tree remediasi

| Pemeriksaan | Hasil |
| --- | --- |
| `npx vitest run` | PASS — 17 file, 140 test lulus, 5 di-skip (integrasi DB tanpa `DATABASE_URL`). |
| `npm run lint` | PASS. |
| `npm run typecheck` | PASS. |
| `npm run build` | PASS. |
| `npm run tokens:check` | PASS. |
| `npm run db:check` | **BLOCKED** — `DATABASE_CHECK_FAILED (DATABASE_URL_NOT_CONFIGURED)`, exit code `1`; bukan PASS. |
| `python scripts/check_repository.py --tracked` | **FAIL** — 3 temuan pre-existing `SPRINT_01–03.md`; file tersebut tidak disentuh. |
| `git diff --check` | PASS. |
| PostgreSQL 16 integrasi | **NOT RUN/BLOCKED** — `DATABASE_URL`/instance tidak tersedia. |

CI dan review independen pada commit remediasi masih diperlukan; tabel ini bukan bukti CI maupun bukti koneksi PostgreSQL nyata.
