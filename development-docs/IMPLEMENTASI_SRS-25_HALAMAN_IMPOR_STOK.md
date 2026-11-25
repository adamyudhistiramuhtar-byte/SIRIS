# Halaman Impor Stok pada Adapter Fixture QTY AKHIR (SRS-25)

Versi `proposed-0.1`, disiapkan 25 November 2026. Status: **kandidat implementasi terisolasi; belum Done**. Baseline tetap 16 UC, 29 FR, 14 NFR. Tidak ada endpoint, migrasi, atau perubahan kontrak.

## Identitas dokumen

| Atribut | Nilai |
| --- | --- |
| Issue Jira | SRS-25 (ST-09A), Sprint 3 |
| UC dan layar | UC-09, SCR-09 `/inventory/import-stock` |
| Penyusun | Vassell Enha Atthayya (Anggota 3) |
| Reviewer teknis nonpenulis | Muhammad Luthfi Rafif |
| Basis kode | `feature/SRS-53-import-wizard` HEAD `44d7c02` (PR #17, belum merged) digabung `develop` (memuat PR #30/SRS-83) |
| Fixture | `database/fixtures/uji/stock.proposed-0.1.json` (SRS-37) |

## 1. Batas

- Halaman memakai **adapter fixture UJI di sisi klien**, bukan klien API. Tidak ada pemanggilan jaringan, staging, otorisasi server, atau commit basis data. Hasil pengujian ini bukan bukti integrasi atau E2E.
- **Simpan tidak tersedia.** Commit atomik dan audit menunggu SRS-52 dan SRS-54. Layanan fixture mengembalikan galat yang jelas dan tidak pernah menyatakan `COMMITTED`.
- Mode ACTUAL ditahan: store sesi menolak pergantian mode, dan layanan fixture menolak ACTUAL. Penyaringan di frontend bukan keamanan; otorisasi tetap di server.
- Pemeriksaan referensi material (`MISSING_REFERENCE`) memerlukan himpunan referensi dari layanan dan tidak dilakukan di klien.
- Komponen dukungan opsional (`support_master`, `support_movement`, `support_wo`) tidak diunggah lewat halaman ini. Ketiadaannya hanya menjadi warning `OPTIONAL_COMPONENT_ABSENT` yang harus diakui sebelum Simpan (belum dapat dilakukan karena Simpan tidak tersedia).
- Keputusan terbuka tidak diputuskan di sini: OD-05 (kebijakan saldo negatif; nilai negatif tetap diteruskan apa adanya sesuai pola desimal), CF-04 (jam cutoff tidak dikarang), kontrak ACTUAL, FR/NFR terkait (SOURCE REQUIRED).

## 2. Berkas

| Berkas | Isi |
| --- | --- |
| `apps/web/src/pages/inventory/ImportStockPage.vue` | Halaman SCR-09: `ImportWizard` (SRS-53) dan `StockBalancePreview` (SRS-83) dengan `useImportFlow`; `session`, `service`, dan `source` dapat diinjeksi |
| `apps/web/src/shared/import/stock-fixture-adapter.ts` | `parseStockFixture`: parser murni berkas fixture STOCK `proposed-0.1` |
| `apps/web/src/shared/import/stock-fixture-service.ts` | `createStockFixtureService`: `ImportFlowService` berbasis fixture UJI plus sumber baris untuk preview |
| `apps/web/src/router/index.ts` | Rute `inventory-import-stock` memakai halaman ini; meta tidak berubah |
| `apps/web/src/tests/ImportStockPage.spec.ts` | 19 tes: adapter (5), pemilihan konteks (5), invalid (3), preview (3), cancel (3) |

## 3. Perilaku

1. **Format berkas.** JSON `kind: "STOCK"`, `contract_version: "proposed-0.1"`, `rows[]` dengan `row_number` dan `normalized` {`material_code`, `uom`, `system_quantity`}, serta `metadata.cutoff_id`. Bentuk ini sama dengan yang dipahami adapter API fixture. Ini bukan parser CSV/XLSX dan tidak menebak header mitra.
2. **`system_quantity` hanya dari QTY AKHIR.** Nilai berupa string desimal (paling banyak enam pecahan), tidak dijumlah dan tidak dihitung dari pergerakan; baris total tidak ada pada preview.
3. **Kode galat.** Keputusan PM 25 November: metadata tanpa `cutoff_id` ditolak `INVALID_METADATA`; isi berkas tidak valid (bukan JSON, jenis salah, kuantitas bukan desimal, nomor baris ganda atau tidak positif, komponen selain `balance`) tetap `INVALID_FILE`. Komponen `ValidationReport` menampilkan baris, kolom, dan pesan; kode tidak ditampilkan.
4. **Konteks.** Perubahan gudang dan mode melewati store sesi (SRS-46). Gudang di luar assignment dan mode ACTUAL ditolak dengan pemberitahuan. Pergantian konteks saat preview membatalkan request, membersihkan berkas, preview, dan hasil.
5. **Batal.** Pada preview, Batal menutup batch fixture dan menampilkan status dibatalkan; Mulai Impor Baru kembali ke tahap 1.

## 4. Hasil pengujian (aktual)

| Pemeriksaan | Hasil |
| --- | --- |
| `npx vitest run --project web apps/web/src/tests/ImportStockPage.spec.ts` | PASS, 19 tes |
| `npx vitest run --project web` (seluruh proyek web) | PASS, 291 tes (17 berkas) |
| `npx eslint apps/web/src` | PASS |
| `npx vue-tsc --noEmit -p apps/web` | PASS, tanpa galat |
| `python3 scripts/check_repository.py --tracked` | PASS, 0 temuan |
| CI pada HEAD final | Menunggu pembukaan PR |
| Eksekusi pada build berjalan dengan sesi, otorisasi, API, dan basis data nyata | **NOT RUN** |
| Uji aksesibilitas manual dan pemeriksaan visual pada peramban | **NOT RUN** |

## 5. Yang belum dapat diuji (todo dan NOT RUN)

- Commit atomik, audit, dan hasil simpan nyata (SRS-52, SRS-54).
- Pemanggilan API-01 sampai API-05, API-11, API-21, API-22.
- Pemeriksaan referensi material dan izin role/gudang dari server.
- Kedaluwarsa preview dari layanan: fixture tidak mengirim `expiresAt`.
- Dukungan opsional (`support_*`) pada halaman; persistensi migrasi 009 (Dwi).
- Skenario UC-09 pada TESTS.csv di luar yang tertulis pada bagian 4.

## 6. Penggunaan dan integrasi

Saat layanan API tersedia, ganti `createStockFixtureService()` dengan implementasi `ImportFlowService` yang memanggil API dan sumber preview dari respons `GET /imports/{batch_id}/preview`, tanpa mengubah halaman selain properti `service` dan `source`. Pengecekan UJI manual: unggah `database/fixtures/uji/stock.proposed-0.1.json` pada `/inventory/import-stock`.

## 7. Handoff

- Luthfi: review nonpenulis halaman, adapter, dan tes.
- Adam: konfirmasi keputusan kode galat dan batas fixture; PM approval setelah review independen.
- Dwi: persistensi dukungan (migrasi 009) dan commit atomik (SRS-52).
- PR ini bertumpuk pada PR #17; setelah #17 merged, retarget ke `develop`.

## Riwayat revisi

| Versi | Tanggal | Perubahan |
| --- | --- | --- |
| 0.1.0 | 2026-11-25 | Penyusunan awal halaman, adapter, layanan fixture, dan tes. |
