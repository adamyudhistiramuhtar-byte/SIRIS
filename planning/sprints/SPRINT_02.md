# Sprint 02 — Core inbound dan rekonsiliasi

Periode: **16–22 November 2026**. Timezone: **Asia/Jakarta**. Keseluruhan rencana: **9–29 November 2026**. Target akhir **29 November 2026** tidak diperpanjang. Status: NOT STARTED. Semua tes aplikasi **NOT RUN**. Tidak ada aktivitas historis yang dinyatakan selesai tanpa bukti.

## Tujuan dan entry criteria

Core inbound dan rekonsiliasi. Masuk setelah dependency pada tabel ditinjau, owner/reviewer tersedia, sumber/acceptance jelas dan fixture UJI siap. Sumber FR/NFR/55 tes asli tetap SOURCE REQUIRED; bagian yang belum dapat diputuskan tidak diimplementasikan berdasarkan asumsi tersembunyi. Jira key belum diketahui; label S2-xx adalah label rencana saja.

## Rencana pekerjaan dan ownership

| Label rencana | Pekerjaan | Owner usulan | Reviewer | Dependency | Acceptance rencana |
| --- | --- | --- | --- | --- | --- |
| S2-01 | Selesaikan UC-01, UC-02, UC-03 | DEV-02 | DEV-01 | Shared import/UC-16; OD-06 dan event contract | Requested date tetap; INITIAL/CHANGE; parsial/final sah |
| S2-02 | UC-04, UC-05, UC-07 | DEV-02 | DEV-04 | S2-01; eligibility final | Exception final terpisah overdue; histori dan notices tertelusur |
| S2-03 | Selesaikan UC-09, UC-10 | DEV-04 | DEV-01 | Shared import; cutoff/source contract | Saldo QTY AKHIR; COUNT membedakan false/null dan true/0 |
| S2-04 | UC-12 reconciliation engine | DEV-04 | DEV-02 | S2-03; CF-04/05/08 diselesaikan | Enam status, variance hanya valid, histori hasil terjaga |
| S2-05 | Frontend core API integration | DEV-03 | DEV-02 + DEV-04 | Contract consumer/provider ditinjau | Tidak ada field rekaan; state gagal dan pemulihan benar |
| S2-06 | Atomicity/idempotency/security/regresi S1 | Semua sesuai modul | Reviewer silang | Implementasi domain dan test DB terisolasi | Fault injection/konkurensi tidak menimbulkan data parsial/duplikat |

## Pengujian kontinu

Unit; API integration; import transaction; duplicate submission; exception calculation; physical count validation; reconciliation rules; security/permission; regresi Sprint 1.

Owner menulis tes bersama implementasi; reviewer memeriksa expected result terhadap sumber. Simpan command, SHA build/schema, dataset, actual result dan bukti. Jangan menunda semua testing sampai Sprint 3. Tidak ada test PASS/FAIL yang dicatat pada dokumen ini.

## Integrasi dan evaluasi Prototyping

IT-02 dan IT-03; review bersama role berwenang bila tersedia. PR feature menuju develop; review minimal satu rekan. Kebutuhan/kontrak berubah melalui analisis dampak dan regresi. DEV-01 mengintegrasikan shared boundary; DEV-03 frontend bersama; DEV-04 schema; owner inbound DEV-02. Tidak ada dua perubahan independen pada shared module tanpa koordinasi.

## Exit criteria dan demo

Core inbound dan inventory reconciliation terintegrasi dengan evidence test; defect integritas/akses yang menghalangi belum boleh diabaikan.

## Risiko dan tindakan

Akses Git/remote, kapasitas empat anggota, sumber final, kontrak cutoff/evidence/identical run dan ketersediaan reviewer dapat menahan jalur kritis. Catat blocker harian dan koordinasikan pekerjaan independen; jangan menambah scope atau menghapus UC. Jika target terancam, buat usulan perubahan jadwal eksplisit; jangan mengubah tanggal pada dokumen ini tanpa keputusan.

## Catatan hasil aktual

| Hal yang dilaporkan | Status |
| --- | --- |
| Versi prototipe / SHA | Belum tersedia |
| Feature selesai | Belum ada bukti implementasi |
| Test aplikasi | NOT RUN |
| Feedback stakeholder | Belum dikumpulkan |
| Defect/retest aktual | Belum tersedia |
| Acceptance sprint | Belum dievaluasi |

Rujukan: [roadmap](../roadmap/SPRINT_ROADMAP.md), [dependency](../roadmap/DEPENDENCY_MATRIX.md), [strategi pengujian](../../docs/implementation/TESTING_STRATEGY.md).
