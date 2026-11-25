# PR #40 — Handoff Perbaikan Metrik SRS-24

Tanggal: 25 November 2026  
Pemilik PR: Muhammad Luthfi Rafif (`Yunaaaaa13`)  
Reviewer nonpenulis yang ditetapkan PM: dwira niameru / Dwi (`dwiraniameru-source`)

## Ruang Lingkup

Adopsi **hanya dua koreksi metrik** dari review PM pada PR #40, tanpa mengambil bundle kandidat lain.

- PR: https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/40
- Head PR remote saat review: `9b94a3febb2802b66767648b7c5f611edb6768ff` (`feature/SRS-24-supplier-metrics`)
- Review PM: CHANGES_REQUESTED (24 Nov 2026) oleh Adam Yudhistira Muhtar, commit_id `9b94a3f`.
- Patch sumber: `SRS-24-metric-boundaries.patch` / commit `7ceae644202660e259f7b49b37ad3f55e8c571a5` dari evidence PM.

## Dua Koreksi yang Diadopsi

1. **Expected quantity negatif tidak masuk denominator** (Quantity Mismatch Rate / S-Fill). `expected_quantity < 0` diperlakukan sebagai `INVALID_EXPECTED_QUANTITY`; denominator tidak bertambah.
2. **CHANGE pada instant final tidak dipakai sebagai janji sebelum final** untuk OTD-C. Kondisi eksklusi diubah dari `eventMs > completionMs` menjadi `eventMs >= completionMs`.

## File yang Berubah

- `apps/api/src/features/supplier-metrics/metrics.ts`
- `apps/api/src/tests/supplier-metrics.test.ts`

## Bukti

| Pemeriksaan | Hasil |
|---|---|
| `git apply --check` patch PM | PASS (clean) |
| RED (evidence PM `metrics-regression-red-20261125.log`) pada `9b94a3f` | **2 failed / 25 passed (27)** |
| RED failures | `expected_quantity negatif` -> denominator 1 (expected 0); `CHANGE at final instant` -> OTD-C 100 (expected 0) |
| Setelah patch `c97341d` lokal | `npx vitest run apps/api/src/tests/supplier-metrics.test.ts` **27 passed / 0 failed** |
| Full `npm test` setelah patch | **159 passed / 13 skipped / 0 failed** |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS |
| `npm run tokens:check` | PASS (424 token) |
| `python scripts/check_repository.py --tracked` | 3 temuan pre-existing SPRINT date/status; tidak terkait patch |
| Integrasi PostgreSQL | NOT RUN/BLOCKED (DATABASE_URL_NOT_CONFIGURED) |

## Status Git Lokal

- Branch lokal: `feature/SRS-24-supplier-metrics`
- Commit lokal: `c97341d` ("Tolak expected negatif dan gunakan janji sebelum final") di atas `9b94a3f`
- **Tidak di-push**, **tidak force-push**, **tidak merge**.

## Handoff ke Dwi

- Dwi melakukan re-review nonpenulis pada HEAD baru setelah patch dipush/diadopsi ke PR #40.
- Jangan anggap komentar Dwi sebelumnya sebagai approval untuk HEAD baru; Dwi sudah memberi COMMENTED review pada `9b94a3f` yang menyatakan akan review ulang setelah patch masuk HEAD PR.
- Batas tetap: tidak mengubah grain, provenance, API-10/DB status; S-CHANGE boleh memuat CHANGE pada inbound OPEN dalam periode recorded_at sesuai catatan PM.

## Risiko / Batas

- Saya tidak mengubah status Jira SRS-24/SRS-90.
- Saya tidak merge PR.
- Perubahan ini hanya dua bug metrik; tidak mencakup hardening lain dari bundle PM.