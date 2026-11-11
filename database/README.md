# Fondasi Database SIRIS

Dokumentasi ini menjelaskan konfigurasi, strategi migrasi, dan seed untuk database PostgreSQL SIRIS (Capstone Project Kelompok 42).

## 1. Konfigurasi Lingkungan

Konfigurasi koneksi database dikelola melalui variabel lingkungan `DATABASE_URL` pada berkas `.env` lokal:

```env
DATABASE_URL=
```

Komponen parameter koneksi:
- Driver: PostgreSQL
- Host default: `localhost`
- Port default: `5432`
- Nama database development: `siris_dev`
- Nama database test: `siris_test`

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

1. **Idempotensi**: Setiap pernyataan DDL menggunakan klausa `IF NOT EXISTS` atau pengecekan constraint.
2. **Keterlacakan**: Penamaan file menggunakan format penomoran 3 digit: `001_initial_schema.sql`, `002_xxx.sql`.
3. **Eksekusi Lokal**:
   ```bash
   psql "$DATABASE_URL" -f database/migrations/001_initial_schema.sql
   ```

## 4. Strategi Seed (Data Uji)

- Seluruh data seed berlabel **UJI** (Simulasi).
- **DILARANG KERAS** memasukkan data transaksi operasional riil atau data mitra (PT Harina Chemicals Industry) ke dalam direktori seed atau repositori publik.
- Eksekusi seed:
  ```bash
  psql "$DATABASE_URL" -f database/seeds/001_initial_seed.sql
  ```

## 5. Status Ketersediaan Database Runtime

- Bila instance PostgreSQL belum aktif di lingkungan lokal atau CI, pengujian integrasi database ditandai sebagai **BLOCKED** atau **NOT RUN**, bukan PASS.
- Backend API SIRIS dirancang dengan *lazy connection pooling* sehingga server Express tetap dapat melakukan bootstrap dan melayani endpoint kesehatan (`/health`) meskipun database belum terhubung.
