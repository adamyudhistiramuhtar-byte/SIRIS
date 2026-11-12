# Fondasi Database SIRIS

Dokumentasi ini menjelaskan konfigurasi, strategi migrasi, dan seed untuk database PostgreSQL SIRIS (Capstone Project Kelompok 42).

## 1. Konfigurasi Lingkungan

Konfigurasi koneksi database dikelola melalui variabel lingkungan pada berkas `.env` lokal (tidak di-commit):

```env
DATABASE_URL=            # role runtime: hanya SELECT/INSERT/UPDATE/DELETE, bukan superuser
DATABASE_MIGRATION_URL=  # role migrasi: pemilik schema, menjalankan DDL, bukan superuser
```

Pemisahan role (SRS-44, mengikuti SRS40-ADR-03 yang masih PROPOSED):

| Role | Atribut | Kegunaan |
| --- | --- | --- |
| `siris_migrator` | LOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE; pemilik database dan schema `public` | Menjalankan migrasi dan seed |
| `siris_app` | LOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE; tanpa hak CREATE di `public` | Runtime aplikasi |

Hak `siris_app` atas tabel baru diberikan melalui `ALTER DEFAULT PRIVILEGES FOR ROLE siris_migrator`, sehingga tabel yang dibuat migrasi otomatis dapat dibaca/ditulis runtime tanpa memberi hak DDL. Versi PostgreSQL proyek belum diputuskan (OD-07); lingkungan UJI lokal memakai 16.6 sebagai usulan.

## 2. Struktur Direktori

```text
database/
├── migrations/          # Skrip migrasi DDL berurutan (001_initial_schema.sql, dst.)
├── seeds/               # Skrip data awal pengujian berlabel UJI (001_initial_seed.sql)
├── fixtures/            # Dataset JSON sintetis UJI untuk pengujian otomatis
└── README.md            # Panduan konfigurasi dan inisialisasi database
```

## 3. Strategi Migrasi

Migrasi PostgreSQL menggunakan file SQL standar yang dieksekusi secara berurutan:

1. **Idempotensi**: Setiap pernyataan DDL menggunakan klausa `IF NOT EXISTS` atau pengecekan constraint. `IF NOT EXISTS` tidak mengoreksi tabel yang sudah ada dengan struktur berbeda; perubahan struktur memerlukan migrasi baru yang direview.
2. **Keterlacakan**: Penamaan file menggunakan format penomoran 3 digit dan dijalankan berurutan:
   - `001_initial_schema.sql` — identitas, gudang, cutoff (ditahan, lihat F-03), staging dan idempotency awal.
   - `002_reference_masters.sql` — `materials` dan `suppliers` terpisah menurut mode ACTUAL/UJI.
3. **Migration runner** belum diputuskan (SRS40-ADR-03 PROPOSED). Eksekusi saat ini manual dengan role migrasi:
   ```bash
   for f in database/migrations/*.sql database/seeds/*.sql; do
     psql "$DATABASE_MIGRATION_URL" -v ON_ERROR_STOP=1 -f "$f"
   done
   ```
   Tanpa `psql` lokal, jalankan di dalam container UJI (lihat bagian 6):
   ```bash
   for f in database/migrations/*.sql database/seeds/*.sql; do
     docker exec -i siris-pg-uji psql -X -v ON_ERROR_STOP=1 -U siris_migrator -d siris_uji < "$f"
   done
   ```
4. **Pengujian migrasi**: `npm run test:integration` menjalankan `tests/integration/database/migrations.test.ts`, yang menerapkan seluruh migrasi dan seed dua kali (reapply) di dalam satu transaksi lalu ROLLBACK. Tanpa `DATABASE_MIGRATION_URL` test ini berstatus *skipped*, bukan PASS.

## 4. Strategi Seed (Data Uji)

- Seluruh data seed berlabel **UJI** (Simulasi).
- **DILARANG KERAS** memasukkan data transaksi operasional riil atau data mitra (PT Harina Chemicals Industry) ke dalam direktori seed atau repositori publik.
- Seed dijalankan dengan role migrasi (`DATABASE_MIGRATION_URL`), bersama migrasi pada perintah di bagian 3.
- `002_reference_masters_uji.sql` hanya berisi material/supplier `mode = 'UJI'` dengan kode yang selaras dengan fixture kontrak SRS-37.

## 5. Status Ketersediaan Database Runtime

- Bila instance PostgreSQL belum aktif di lingkungan lokal atau CI, pengujian integrasi database ditandai sebagai **BLOCKED** atau **NOT RUN**, bukan PASS.
- Backend API SIRIS dirancang dengan *lazy connection pooling* sehingga server Express tetap dapat melakukan bootstrap dan melayani endpoint kesehatan (`/health`) meskipun database belum terhubung.

## 6. Lingkungan PostgreSQL UJI Lokal (Docker)

Disiapkan untuk SRS-44; kredensial hanya berada di berkas lokal yang diabaikan Git (`.env`, `.env.pg-uji`).

| Komponen | Nilai |
| --- | --- |
| Image | `postgres:16.6` |
| Container | `siris-pg-uji`, port `127.0.0.1:55432` |
| Volume | `siris-pg-uji-data` |
| Database | `siris_uji` (pemilik `siris_migrator`) |

Ringkasan penyiapan: buat `.env.pg-uji` berisi `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `SIRIS_MIGRATOR_PASSWORD`, `SIRIS_APP_PASSWORD` dengan nilai acak; jalankan container dengan `--env-file .env.pg-uji`; buat kedua role dan database melalui `psql` di dalam container memakai `\getenv` agar password tidak muncul di argumen perintah; isi `DATABASE_URL` dan `DATABASE_MIGRATION_URL` di `.env`. Koneksi lokal di dalam container memakai autentikasi `trust` bawaan image; koneksi dari host memakai password. Konfigurasi ini hanya untuk UJI lokal, bukan produksi.

Menghapus lingkungan UJI (menghapus seluruh data UJI):

```bash
docker rm -f siris-pg-uji && docker volume rm siris-pg-uji-data
```
