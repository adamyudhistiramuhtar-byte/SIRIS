# Fixture dan DTO Layar Rekonsiliasi (SRS-86, konsumen SRS-67)

Status: PROPOSED. Data: SIMULATED, mode UJI. Bukan data mitra dan bukan hasil operasional.

## Isi

| Berkas | Fungsi |
| --- | --- |
| `packages/contracts/src/reconciliation-screen.ts` | Tipe DTO body API-13 dan API-14 (hanya tipe, dipakai dengan `import type`) |
| `database/fixtures/uji/reconciliation-screen.proposed-0.1.json` | Fixture layar SCR-12: run baru, detail run, run kosong, lima penolakan konteks, peta status HTTP error |
| `apps/api/src/tests/reconciliation-screen-fixture.contract.test.ts` | Tes kontrak: skema DOC-09, keluaran engine #36, kesamaan tipe DTO dengan engine |
| `apps/api/src/tests/contract/doc09-schema.ts` | Pemeriksa skema DOC-09 untuk tes (subset kata kunci DOC-09) |

## Sumber

- Bentuk DTO: DOC-09 `RunCreated`, `RunDetail`, `ReconciliationLine`, `ReconciliationRequest`.
- Baris `run_detail`: keluaran `reconcile()` engine #36 (develop) dari `engine_input`. Tes memastikan keduanya sama persis.
- Kode error dan status HTTP usulan: service #47 (Draft, `reconciliation-errors.ts` @ 542384b).

## Cara pakai untuk layar (SRS-67)

- Tampilkan keenam status. `variance` hanya ada pada MATCHED/DISCREPANCY; status lain `null`, jangan diganti 0.
- Fisik `0.000000` yang dihitung adalah angka sah (DISCREPANCY), berbeda dari NOT_COUNTED (`physical_quantity` null).
- Penolakan konteks menolak seluruh run (HTTP 422). Tidak ada baris parsial.
- Run tanpa baris ditampilkan kosong, bukan error.

## Masih OPEN

- Envelope respons `data`/`meta` (api.ts) vs contoh DOC-09 tanpa envelope.
- `RunDetail` DOC-09 tidak memuat `rule_version`, `warehouse_id`, `mode`, `cutoff_id`; tampilan konteks run butuh keputusan kontrak (SRS-58).
- `TRANSACTION_OUTCOME_UNKNOWN` belum ada di katalog DOC-08 (PLACEHOLDER).
- Riwayat run API-15 (SRS-31) dan pemilihan latest belum dicakup.
- Integrasi API, sesi, dan database nyata: NOT RUN.
