# Implementasi SRS-24: Enam Metrik Supplier yang Ditelusuri (UJI)

Status: **dalam pengerjaan; belum Done.** Sesuai DoD SRS-24, selesai pengembangan kode,
fixture, dan pengujian UJI belum menjamin status produk karena kontrak API dan persetujuan
bisnis pada bagian tertentu masih bernilai kandidat.

Dasar: baseline `develop` pada commit `28b8501`, cabang kerja `feature/SRS-24-supplier-metrics`.
Semua kode dan fixture di bawah ditulis secara terisolasi pada cabang ini tanpa mengubah
kontrak bersama atau skema database.

## Cakupan yang dikerjakan

| No | Kegiatan | Hasil |
| --- | --- | --- |
| 1 | Inspeksi prasyarat (fase 1) | Belum ada implementasi metrik supplier, tidak ada kontrak `GET /inbound/metrics`, sumber data inbound/commitment/receiving belum ada di skema. PR #20, #22, #27, dan #28 masih OPEN dan belum disetujui PM. Oracle grain SRS-90 belum final. |
| 2 | Fixture dan oracle UJI (fase 2) | Fixture `database/fixtures/uji/supplier_metrics.uji-0.1.json` dan oracle `database/fixtures/uji/supplier_metrics.expected-0.1.json` versi `uji-0.1` / `oracle-0.1`. |
| 3 | Layanan perhitungan enam metrik (fase 3) | `apps/api/src/features/supplier-metrics/metrics.ts` berisi enam fungsi kalkulasi murni. |
| 4 | DTO kandidat (fase 5) | `apps/api/src/features/supplier-metrics/dto.ts` berisi DTO internal dengan `contract_status: CANDIDATE`, `data_status: UJI`, dan `decision_status: CANDIDATE_UJI`. Tidak ditambahkan ke `packages/contracts`. |
| 5 | Pengujian deterministik (fase 4) | `apps/api/src/tests/supplier-metrics.test.ts` dengan 25 kasus UJI. |

## Dataset demonstrasi dan hasil oracle

Fixture UJI dibangun dari dataset demonstrasi pada `design.md` §6.6 dan dipahami sebagai data
sintetis berlabel UJI, bukan data operasional mitra. Struktur fixture:

- 5 record inbound (`UJI-IN-001` sampai `UJI-IN-005`).
- 6 event commitment (`UJI-COM-001` sampai `UJI-COM-006`) dengan 2 event `CHANGE`.
- 6 event receiving (`UJI-RCV-001` sampai `UJI-RCV-006`).
- 4 record final, 1 record open, 1 final terlambat, dan 2 final mismatch.

| Metrik | Nilai oracle (`oracle-0.1`) | Keterangan |
| --- | --- | --- |
| OTD-R | 75% | 3 dari 4 final eligible tepat waktu terhadap tanggal diminta. |
| OTD-C | 100% | 4 dari 4 final eligible tepat waktu terhadap janji terakhir sebelum completion. |
| Quantity Mismatch Rate | 50% | 2 dari 4 final eligible mismatch kuantitas. |
| S-LEAD | 10.25 hari | Rata-rata selisih hari kalender release ke completion. |
| S-CHANGE | 2 | Jumlah event `CHANGE` pada cakupan. |
| S-FILL | 93.3333% pada satu grup, 100% pada grup lain, dan 83.3333% pada grup ketiga | Dihitung per supplier + material + UOM, bukan digabung lintas material/UOM. |

Catatan oracle: nilai S-FILL pada kelompok `UJI-SUP-A` / `UJI-MAT-A` / `KG` adalah
93.3333% karena jumlah diterima dikurangi jumlah expected pada record partial receiving.
Semua nilai di atas adalah nilai kandidat UJI, bukan hasil bisnis final.

## Definisi numerik dan batasan perhitungan

Setiap fungsi metrik mengembalikan nilai dengan numeran, denominan, jumlah eksklusi, alasan
eksklusi, dan referensi sumber. Aturan penting:

- Persentase dihitung sebagai `jumlah tepat waktu / jumlah eligible final x 100`.
- S-LEAD dihitung sebagai rata-rata selisih hari kalender dari release ke completion.
- S-CHANGE dihitung sebagai jumlah event `CHANGE` pada cakupan inbound.
- S-FILL dihitung sebagai `Σ min(received, expected) / Σ expected x 100%`, dengan grup kunci
  supplier + material + UOM.
- Penyelesaian yang lewat waktu ditentukan dengan membandingkan tanggal kedatangan final terhadap
  janji terakhir yang sah sebelum completion; event `CHANGE` setelah completion tidak dipakai.

### Eksklusi dan keputusan eligibility

Daftar eksklusi yang sudah diputuskan pada implementasi ini:

- `OPEN_NOT_FINAL`: record open tidak masuk metrik final-only.
- `MISSING_REQUESTED_DATE`, `MISSING_FINAL_ARRIVAL`, `MISSING_COMPLETION`, `MISSING_RELEASE_DATE`,
  `MISSING_EXPECTED_QUANTITY`: nilai yang diperlukan belum tersedia.
- `INVALID_EXPECTED_QUANTITY`, `ZERO_EXPECTED_QUANTITY`, `NO_RECEIPTS`, `INVALID_RECEIPT`,
  `DUPLICATE_RECEIPT_EVENT`, `UOM_NOT_COMPARABLE`: kondisi nilai atau penerimaan yang tidak
  sah.
- `NO_COMMITMENT`, `INVALID_COMMITMENT_SEQUENCE`, `DUPLICATE_COMMITMENT_EVENT`, `INVALID_COMMITMENT_TIMESTAMP`:
  kondisi event commitment yang tidak dapat diproses.

Keputusan yang masih bernilai kandidat:

- `OD-06`: aturan eligibility final, bukti completion/release, interval tanggal, koreksi event,
  dan aturan tie-break belum ditutup PM.
- `CF-06`: batas nilai `expected_quantity` (nihil atau positif) dan presisi desimal belum
  disepakati.

Bila penyelesaian atau nilai eksklusi menghasilkan denominator nol, hasil berupa `null` dengan
alasan eksplisit, bukan 0%.

## DTO dan status kontrak

- DTO internal disusun pada `apps/api/src/features/supplier-metrics/dto.ts`.
- Pola status: `contract_status: CANDIDATE`, `data_status: UJI`, dan
  `decision_status: CANDIDATE_UJI`.
- Kontrak bersama `GET /inbound/metrics` (API-10) belum disetujui PM; karena itu endpoint tidak
  dimasukkan dan `packages/contracts` tidak diubah pada cabang ini.
- Filter pada DTO kandidat mencakup supplier, material, UOM, gudang, mode, rentang tanggal.

## Frontend

Layar metrik supplier belum dikerjakan pada tahap ini. Penyebabnya adalah kontrak DTO dan API
belum disetujui; hingga saat ini hanya kandidat internal yang tersedia.

## Hasil validasi (fase 6)

| Pemeriksaan | Hasil |
| --- | --- |
| Unit test fitur (`apps/api/src/tests/supplier-metrics.test.ts`) | Lulus: 25 kasus UJI. |
| Unit test seluruh repo (`npx vitest run`) | Lulus: 157 kasus, 13 dilewati, 0 gagal. Termasuk suite web, API, dan integrasi dengan PostgreSQL yang tidak aktif. |
| Typecheck (`npm run typecheck`) | Lulus: contracts, api, web. |
| Lint (`npm run lint`) | Lulus: tanpa temuan. |
| Build (`npm run build`) | Lulus: contracts, api, web. |
| Pemeriksaan repository (`scripts/check_repository.py --workspace`) | 3 temuan pra-baseline di `planning/sprints/SPRINT_01.md` sampai `SPRINT_03.md`; tidak ada temuan baru dari berkas SRS-24 ini. |

Temuan repo terkait skrip: `python3` pada lingkungan Windows tidak tersedia sehingga
eksekusi dilakukan melalui `python`. Skrip tetap dieksekusi; hasilnya sama.

Pemeriksaan yang tidak bisa dijalankan pada tahap ini: eksekusi integrasi database PostgreSQL
untuk fixture (skema sumber belum ada), pengujian API endpoint, pengujian browser, dan
pengujian manual pengguna.

## Status akhir

Kalkulasi enam metrik, fixture UJI, dan oracle telah diimplementasikan, diuji deterministik,
dan lolos typecheck, lint, build, serta unit test. Proses review teknis dan persetujuan bisnis masih menjadi bagian dari jalur kerja SRS-24.

## Koordinasi SRS-90

Oracle per grain (SRS-90) masih berstatus To Do dan menjadi kegiatan yang harus
dikonsolidasikan bersama perubahan ini. Tidak ada penggantian tanggung jawab SRS-90 oleh
implementasi cabang ini; target checkpoint SRS-90 2026-11-28 WIB masih berlaku.

## Catatan

- Seluruh nilai bisnis pada dokumen ini adalah nilai **UJI** yang diturunkan dari fixture
  sintetis, bukan data operasional **ACTUAL**.
- Tidak ada perubahan kontrak bersama, skema database, status Jira, atau pull request pada tahap
  implementasi ini.
