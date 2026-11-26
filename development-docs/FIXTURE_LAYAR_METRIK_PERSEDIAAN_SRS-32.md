# Fixture dan DTO Layar Metrik Persediaan (SRS-32, konsumen SRS-67)

Status: PROPOSED. Data: SIMULATED, mode UJI. Bukan data mitra dan bukan hasil operasional.

## Isi

| Berkas | Fungsi |
| --- | --- |
| `packages/contracts/src/inventory-metrics-screen.ts` | Tipe DTO hasil service metrik #49 (hanya tipe, dipakai dengan `import type`) |
| `database/fixtures/uji/inventory-metrics-screen.proposed-0.1.json` | Fixture UI-14: kelompok OK dengan histori, AMBIGUOUS_ORDER, data tidak cukup, hasil kosong, kode error |
| `apps/api/src/tests/inventory-metrics-screen-fixture.contract.test.ts` | Tes kontrak: baris sumber vs DOC-09, I-VAR vs `computeIVar` #37, kesamaan tipe I-VAR, state layar |
| `apps/api/src/tests/contract/doc09-schema.ts` | Pemeriksa skema DOC-09 untuk tes (identik dengan branch SRS-86) |

## Sumber dan verifikasi

- `screens.metrics_result` adalah keluaran `InventoryMetricsService.query` #49 @ 9668a00 dengan port palsu atas `service_input`.
- Di develop, tes memverifikasi ulang bagian I-VAR dengan `computeIVar` #37. Latest run dan I-EXACT/I-COVER ditandai `it.todo` sampai #49 merged.
- Cek silang lokal 26 Nov 2026 pada worktree #49 @ 9668a00 (tidak di-commit): service menghasilkan body yang sama persis, dan tipe `ExactCoverDto`, `RatioMetricDto`, `InventoryMetricsScreenDto`, serta `InventoryMetricsErrorCodeDto` identik dengan tipe #49 (tsc tanpa error).

## Cara pakai untuk layar (SRS-67)

- `AMBIGUOUS_ORDER`: tampilkan bahwa urutan commit belum dapat dipastikan; jangan memilih run sendiri dan jangan menampilkan angka.
- `insufficient_data` atau `percent: null`: tampilkan "data tidak cukup", bukan 0%. `percent: 0` (I-COVER 0/2) adalah angka sah.
- `percent` belum dibulatkan; jangan menetapkan aturan pembulatan sendiri.
- `history_run_ids` hanya memuat run COMMITTED; run lama tetap ada.

## Masih OPEN

- Bentuk ini belum sama dengan DOC-09 `InventoryMetric` (API-16: metric_code/value/numerator/denominator/excluded_count/reason). Pemetaannya perlu keputusan Adam.
- Aturan pembulatan persen.
- Mekanisme persisten `commit_order` (SRS-32 10213); nilai di fixture SIMULATED.
- I-REPEAT dan definisi periode.
- `METRICS_SOURCE_UNAVAILABLE` dan `METRICS_SOURCE_INCONSISTENT` belum ada di katalog DOC-08 (PLACEHOLDER).
- Integrasi API, sesi, dan database nyata: NOT RUN.
