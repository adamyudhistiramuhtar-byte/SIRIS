# Sprint 03 — Feature tersisa, stabilisasi dan persiapan delivery

Periode: **23–29 November 2026**. Timezone: **Asia/Jakarta**. Keseluruhan rencana: **9–29 November 2026**. Target akhir **29 November 2026** tidak diperpanjang. Status: NOT STARTED. Semua tes aplikasi **NOT RUN**. Tidak ada aktivitas historis yang dinyatakan selesai tanpa bukti.

## Tujuan dan entry criteria

Feature tersisa, stabilisasi dan persiapan delivery. Masuk setelah dependency pada tabel ditinjau, owner/reviewer tersedia, sumber/acceptance jelas dan fixture UJI siap. Sumber FR/NFR/55 tes asli tetap SOURCE REQUIRED; bagian yang belum dapat diputuskan tidak diimplementasikan berdasarkan asumsi tersembunyi. Jira key belum diketahui; label S3-xx adalah label rencana saja.

## Rencana pekerjaan dan ownership

| Label rencana | Pekerjaan | Owner usulan | Reviewer | Dependency | Acceptance rencana |
| --- | --- | --- | --- | --- | --- |
| S3-01 | UC-06 dan UC-08 | DEV-02 | DEV-04 | Sumber WO dan eligibility/rumus final | Read-only WO dan enam metrik supplier sesuai sumber |
| S3-02 | UC-11, UC-13, UC-14 | DEV-04 | DEV-01 | CF-03/05; run history; metrik inventory | Evidence privat, histori immutable, denominator/eligible benar |
| S3-03 | UC-15 audit UI dan keamanan | DEV-01 | DEV-04 | Audit dasar tersedia sejak S1; izin source | Success/failure/cancelled tertelusur; role/gudang benar |
| S3-04 | Full frontend integration dan state tersisa | DEV-03 | DEV-02 + DEV-04 | Semua contract disepakati | 17 layar pendukung/fitur sesuai design tanpa UC baru; a11y diuji |
| S3-05 | E2E/regresi/security/UAT | Semua sesuai modul | Reviewer silang + stakeholder jika tersedia | Build kandidat dan dataset UJI siap | Hasil aktual, defect dan retest dicatat; UAT tidak dipalsukan |
| S3-06 | Deployment configuration, manual, RC dan smoke | DEV-01; kontribusi semua | DEV-03 + DEV-04 | OD-07/09; bukti tes/review | RC siap review 29 Nov; tidak deployment produksi otomatis |

## Pengujian kontinu

Functional lengkap; integration; E2E; regression; negative; security; role-based access; UAT preparation/execution jika stakeholder tersedia; release smoke.

Owner menulis tes bersama implementasi; reviewer memeriksa expected result terhadap sumber. Simpan command, SHA build/schema, dataset, actual result dan bukti. Jangan menunda semua testing sampai Sprint 3. Tidak ada test PASS/FAIL yang dicatat pada dokumen ini.

## Integrasi dan evaluasi Prototyping

IT-04 dan IT-05; feedback serta sign-off hanya berdasarkan bukti. PR feature menuju develop; review minimal satu rekan. Kebutuhan/kontrak berubah melalui analisis dampak dan regresi. DEV-01 mengintegrasikan shared boundary; DEV-03 frontend bersama; DEV-04 schema; owner inbound DEV-02. Tidak ada dua perubahan independen pada shared module tanpa koordinasi.

## Exit criteria dan demo

Release candidate untuk review pada 29 November 2026, termasuk pengujian/integrasi. Jika tidak siap, laporkan gap dan usulan jadwal melalui CR; deadline tidak otomatis berubah.

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
