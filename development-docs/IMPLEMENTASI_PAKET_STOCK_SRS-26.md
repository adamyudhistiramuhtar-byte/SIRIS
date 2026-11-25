# Paket STOCK UJI: saldo wajib dan dukungan opsional (SRS-26)

Versi `uji-fixture/proposed-0.1`, disiapkan 24 November 2026. Status: **kandidat implementasi terisolasi; belum Done**. Baseline tetap 16 UC, 29 FR, 14 NFR. Tidak ada endpoint, migrasi, atau perubahan pada kode SRS-50.

## Basis dan sumber

| Butir | Nilai |
| --- | --- |
| Basis kode | `feature/SRS-50-staging-core`, SHA `0c3a7f0` (PR #27, belum merged, base `integration/adam-20261121`). PR ini bertumpuk di atasnya. |
| Fixture | `database/fixtures/uji/stock.proposed-0.1.json` (SRS-37) |
| Acuan | DOC-08 kontrak STOCK, `KONTRAK_SUMBER_SRS-37.md` §4.4, `IMPLEMENTASI_STAGING_CORE_SRS-50.md` |
| Berkas baru | `apps/api/src/modules/imports/stock-package.ts`, `apps/api/src/tests/stock-package.test.ts`, dokumen ini |

## Isi

1. `StockSupportFixtureAdapter`: parser fixture untuk komponen `support_master`, `support_movement`, dan `support_wo`. Hanya memeriksa struktur generik (record skalar tidak kosong, nomor baris unik dan positif, komponen sesuai unggahan, raw dipertahankan). Tidak menebak nama field atau header mitra.
2. `validateStockPackage`: validator murni atas baris saldo dan support yang sudah diparse.
   - Saldo wajib; saldo kosong atau field tidak lengkap menggagalkan paket.
   - Support tidak dikirim menghasilkan warning `OPTIONAL_COMPONENT_ABSENT` per komponen; support dikirim tetapi kosong atau invalid menggagalkan paket.
   - `system_quantity` selalu string dari komponen saldo. Support tidak pernah menjumlah atau mengubahnya; hubungan hanya berupa lineage `{component, row_number}`.
   - Line key saldo `material_code|uom` (usulan UJI), dengan sumber `{component, row_number}`. Duplikat dilaporkan `DUPLICATE_SOURCE`.
   - Referensi material diperiksa bila himpunan referensi disuntik; kode `MISSING_REFERENCE`.
   - Saldo negatif tidak ditolak dan tidak dikoreksi; dicatat sebagai keputusan terbuka OD-05.

## Hasil pengujian (aktual)

| Pemeriksaan | Hasil |
| --- | --- |
| `npx vitest run apps/api/src/tests/stock-package.test.ts` | PASS, 25 tes |
| `npx vitest run` (seluruh repositori pada basis ini) | PASS, 178 tes; 47 tes SKIPPED karena `DATABASE_URL` tidak tersedia |
| `npx eslint` pada dua berkas kode | PASS |
| `npm run typecheck --workspace=@siris/api` | PASS |
| `python3 scripts/check_repository.py --tracked` | PASS, 0 temuan |
| Tes PostgreSQL (staging 22 tes, migrasi) | **NOT RUN** pada sesi ini |
| CI pada HEAD final | Menunggu pembukaan PR |

## Temuan

- **F-1 (kode galat NEG-03).** Fixture `UJI-STK-NEG-03` (metadata tanpa `cutoff_id`) menyatakan `INVALID_FILE`, sedangkan `stageMetadata` SRS-50 menolaknya sebagai `INVALID_METADATA`. Tes mencatat keduanya. Tidak ada kode yang diubah; keputusan kode mana yang berlaku ada pada pemilik kontrak (Adam/Dwi).
- **F-2 (paket opsional belum dapat di-stage).** `StagingService.stage` mensyaratkan jumlah bagian unggahan sama dengan `adapter.components.length` dan memilih adapter pertama dengan `kind` serta `version` yang sama. Support yang opsional dengan adapter terpisah belum dapat dilewatkan tanpa perubahan kontrak adapter (misalnya komponen wajib dan komponen opsional). Perubahan ini milik SRS-50 (Adam) dan tidak dibuat di PR ini.
- **F-3 (tabel support belum ada).** `stock_support_rows` disebut DOC-07/08 tetapi tidak ada pada migrasi 001 sampai 006. Penyimpanan support dan commit atomik saldo plus support menunggu SRS-52.

## Batas dan keputusan terbuka

- Skema payload support, header sumber, locale angka: SOURCE REQUIRED (OD-05). Relasi `material_code` pada support adalah usulan UJI karena skema belum ada.
- Line key STOCK `material_code|uom`: PROPOSED, belum disahkan.
- CF-04 (kontrak cutoff) dan CF-08 (suplai WO) tetap OPEN; WO tidak menjadi impor keenam.
- Validasi lima kind secara bisnis (SRS-34), halaman impor stok (SRS-25), preview dan commit (SRS-51/52) bukan bagian PR ini. Acceptance criteria "satu paket atomik" belum terbukti.

## Penggunaan oleh integrator

```ts
const balanceRows = new FixtureSourceAdapter('STOCK').parse(balanceBytes, 'balance');
const movementRows = new StockSupportFixtureAdapter().parse(movementBytes, 'support_movement');
const result = validateStockPackage({ balance: balanceRows, support: { support_movement: movementRows }, materialCodes });
// result.ok false: tampilkan result.issues; result.warnings harus terlihat pada preview.
```

## Handoff

- Adam/Luthfi: putuskan F-1 dan F-2; review nonpenulis oleh Luthfi.
- Dwi: tabel `stock_support_rows` dan commit atomik (SRS-52).
- Vassell: SRS-25 memakai hasil validator melalui DTO preview, bukan raw.
