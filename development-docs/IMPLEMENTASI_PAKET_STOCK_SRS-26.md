# Paket STOCK UJI: saldo wajib dan dukungan opsional (SRS-26)

Versi `uji-fixture/proposed-0.1`, diperbarui 25 November 2026. Status: **kandidat implementasi terisolasi; belum Done**. Baseline tetap 16 UC, 29 FR, 14 NFR. Tidak ada endpoint dan tidak ada migrasi di PR ini.

## Basis dan sumber

| Butir | Nilai |
| --- | --- |
| Basis kode | `fix/SRS-50-staging-hardening`, SHA `ce37fb5` (PR #52, Adam), yang bertumpuk di PR #27. PR ini bertumpuk di atasnya. |
| Fixture | `database/fixtures/uji/stock.proposed-0.1.json` (SRS-37) |
| Acuan | DOC-08 kontrak STOCK, `KONTRAK_SUMBER_SRS-37.md` §4.4, `IMPLEMENTASI_STAGING_CORE_SRS-50.md`, keputusan PM 25 November |
| Berkas di PR ini | `apps/api/src/tests/stock-package.test.ts`, perubahan satu baris pada fixture (NEG-03), dokumen ini |
| Berkas dari basis | `apps/api/src/modules/imports/stock-package.ts` (adapter dukungan, `StockPackageFixtureAdapter`, validator) sudah ada pada #52 dan tidak diubah di PR ini |

## Isi

1. `StockSupportFixtureAdapter`: parser fixture untuk komponen `support_master`, `support_movement`, dan `support_wo`. Hanya memeriksa struktur generik; tidak menebak nama field atau header mitra.
2. `StockPackageFixtureAdapter`: satu adapter STOCK (komponen wajib `balance`, komponen opsional `support_master`, `support_movement`, `support_wo`) sesuai keputusan PM. Tidak ada dua adapter dengan `kind` dan `version` yang sama.
3. `validateStockPackage`: validator murni atas baris saldo dan support.
   - Saldo wajib; saldo kosong atau tidak lengkap menggagalkan paket.
   - Support tidak dikirim hanya menghasilkan warning `OPTIONAL_COMPONENT_ABSENT`; support dikirim tetapi kosong atau invalid menggagalkan paket.
   - `system_quantity` hanya berasal dari komponen saldo (QTY AKHIR); support tidak pernah menjumlah atau mengubahnya.
   - Line key `material_code|uom` (usulan UJI) dengan sumber `{component, row_number}`; duplikat dilaporkan `DUPLICATE_SOURCE`.
   - Saldo negatif tidak ditolak dan tidak dikoreksi; dicatat sebagai keputusan terbuka OD-05.

## Perubahan pada PR ini

- Fixture `UJI-STK-NEG-03`: `expected_issue` diubah dari `INVALID_FILE` menjadi `INVALID_METADATA` mengikuti keputusan PM 25 November (STOCK tanpa `cutoff_id` ditolak sebagai `INVALID_METADATA`; isi berkas yang invalid tetap `INVALID_FILE`). Perubahan ini juga menyelaraskan fixture dengan asersi `tests/integration/imports/staging.test.ts`.
- Tes NEG-03 ditulis ulang: memeriksa `stageMetadata` menolak metadata tanpa `cutoff_id` dan adapter saldo tetap menolak isi tidak valid dengan `INVALID_FILE`.
- Empat tes baru untuk `StockPackageFixtureAdapter` (komponen, routing, penolakan komponen tak dikenal dan support invalid, paket saldo saja atau dengan `support_wo`).

## Hasil pengujian (aktual)

Seluruh tes basis data dijalankan pada PostgreSQL 16.6.0 lokal (127.0.0.1:55432, peran non-admin, sesuai guard harness UJI).

| Pemeriksaan | Hasil |
| --- | --- |
| `npx vitest run apps/api/src/tests/stock-package.test.ts` pada basis #52 | PASS, 29 tes |
| `stock-package` dan `tests/integration/imports/staging.test.ts` pada #52 digabung #50 | PASS, 58 tes (29 + 29) |
| `staging.test.ts` pada #52 tanpa #50 | **FAIL** 8 tes, `INVALID_AUDIT_EVENT` (bukan dari PR ini; lihat temuan F-4) |
| `npx vitest run` penuh pada #52 digabung #50 dan PR ini | 238 PASS, 1 FAIL, 1 berkas FAIL; keduanya juga FAIL pada `ce37fb5` tanpa perubahan PR ini (lihat F-5) |
| `npx eslint` pada berkas tes | PASS |
| `npm run typecheck --workspace=@siris/api` | PASS |
| `npm run typecheck:harness` | FAIL pada `tests/e2e/routing-uji.spec.ts` (TS7031, TS7006); berkas bukan bagian PR ini |
| CI pada HEAD final | Menunggu push |

## Temuan

- **F-1 (NEG-03): selesai.** Diputuskan PM: `INVALID_METADATA`. Fixture dan tes diselaraskan.
- **F-2 (paket opsional): selesai.** `optionalComponents` pada kontrak adapter (#52) dan `StockPackageFixtureAdapter` menyelesaikan stage paket dengan support opsional.
- **F-3 (tabel support).** `stock_support_rows` belum ada; penyimpanan support dan commit atomik menjadi migrasi 009 (Dwi, SRS-52). Belum dibuktikan di PR ini.
- **F-4 (ketergantungan #52 pada #50).** #52 menulis kode alasan audit `INVALID_METADATA`, `INVALID_FILE`, `LIMIT_EXCEEDED`, `SOURCE_REQUIRED`, `CUTOFF_UNVERIFIED` yang baru ada pada enum audit di PR #50. Tanpa #50, 8 tes staging basis data gagal. Perlu dilaporkan ke Adam agar #50 masuk ke tumpukan sebelum #52.
- **F-5 (kegagalan yang sudah ada).** `tests/integration/database/cutoff-nullable.test.ts` membaca `database/migrations/005_cutoff_time_nullable.sql` yang tidak ada (nomor migrasi 005 tidak ada di repositori), dan `private-storage-cleanup.test.ts` ("kegagalan unlink tidak menutupi sebab asli") gagal pada `ce37fb5`. Keduanya di luar cakupan PR ini; pemilik: Adam.

## Batas dan keputusan terbuka

- Skema payload support, header sumber, locale angka: SOURCE REQUIRED. Relasi `material_code` pada support adalah usulan UJI.
- Line key STOCK `material_code|uom`: PROPOSED, belum disahkan.
- OD-05 (kebijakan saldo negatif), CF-04 (kontrak cutoff), dan CF-08 (suplai WO) tetap OPEN; WO tidak menjadi impor keenam.
- Halaman impor stok (SRS-25), preview dan commit (SRS-51/52) bukan bagian PR ini. Kriteria "satu paket atomik" belum terbukti.

## Penggunaan oleh integrator

```ts
const adapter = new StockPackageFixtureAdapter();
const balanceRows = adapter.parse(balanceBytes, 'balance');
const movementRows = adapter.parse(movementBytes, 'support_movement');
const result = validateStockPackage({ balance: balanceRows, support: { support_movement: movementRows }, materialCodes });
// result.ok false: tampilkan result.issues; result.warnings harus terlihat pada preview.
```

## Handoff

- Adam: masukkan #50 ke tumpukan sebelum #52 (F-4); tinjau F-5; review nonpenulis oleh Luthfi.
- Dwi: tabel `stock_support_rows` dan commit atomik (migrasi 009, SRS-52).
- Vassell: SRS-25 memakai hasil validator melalui DTO preview, bukan raw.
