# Roadmap Tiga Sprint SIRIS

Periode tetap: **9–29 November 2026**, timezone **Asia/Jakarta**. Target akhir **29 November 2026** mencakup pengujian, integrasi dan release candidate untuk review. Status rencana per 10 November 2026: kegiatan 9 November tidak dianggap selesai tanpa bukti. Tanggal lampau pada rencana adalah timebox, bukan laporan realisasi.

## Timebox dan hasil yang direncanakan

| Sprint | Tanggal | Fokus | Deliverable rencana | Status pelaksanaan |
| --- | --- | --- | --- | --- |
| Sprint 1 | 9–15 November 2026 | Fondasi dan prototipe awal | Jalur UC-01 yang dapat didemokan; fondasi UC-09 | PARTIAL: dokumen/config setup disiapkan; aplikasi NOT STARTED |
| Sprint 2 | 16–22 November 2026 | Core inbound dan inventory | UC-01/02/03/04/05/07/09/10/12 terintegrasi | NOT STARTED |
| Sprint 3 | 23–29 November 2026 | Feature tersisa, stabilisasi dan delivery | UC-06/08/11/13/14/15, regresi, RC siap ditinjau | NOT STARTED |

Lima iterasi pada DOC-02 dipertahankan sebagai tujuan evaluasi: IT-01 berada di Sprint 1; IT-02/IT-03 di Sprint 2; IT-04/IT-05 di Sprint 3. Sprint adalah timebox pengelolaan kerja, bukan pengganti tahapan Prototyping. Feedback dapat mengembalikan analisis/desain/konstruksi dengan change control.

## Milestone rencana

- 10–11 November: hilangkan blocker Git/remote/identitas dan putuskan toolchain serta dependency kritis bersama pemilik baseline.
- 15 November: demo fondasi dan satu vertical slice dengan bukti tes, jika entry criteria terpenuhi.
- 22 November: demo core inbound/rekonsiliasi dan regresi Sprint 1.
- 23–25 November: integrasi feature tersisa dan pembuktian formula/akses.
- 26–27 November: E2E, security/NFR, defect fixing dan UAT bila stakeholder tersedia.
- 28 November: tinjau release candidate, known issues, runbook dan smoke test; ulangi tes pada perubahan setelah kandidat dibentuk.
- 29 November: review RC dan status penerimaan/serah terima dengan bukti. Tidak otomatis berarti sistem diterima mitra atau dideploy produksi.

## Ownership empat developer — PROPOSED

| Placeholder | Owner utama | Reviewer utama | Integrasi lintas modul |
| --- | --- | --- | --- |
| DEV-01 | Repository/toolchain, auth/RBAC, shared import, UC-16, audit infrastructure | DEV-02/DEV-04 | Mengintegrasikan kontrak bersama dan develop |
| DEV-02 | Modul inbound UC-01–UC-08 | DEV-04; UI oleh DEV-03 | Backend dan UI feature inbound tanpa mengubah shell sepihak |
| DEV-03 | Token/design system, app shell/router, shared UI, integrasi frontend | DEV-02/DEV-04 | Meninjau semua perubahan shared UI/route |
| DEV-04 | Database integration dan inventory UC-09–UC-14 | DEV-01/DEV-02 | Meninjau migration dan concurrency bersama DEV-01 |

Semua menulis dan menjalankan tes perubahan masing-masing. Nama, akun GitHub, kapasitas per hari dan Jira key masih belum tersedia. Beban ini perlu review kapasitas; tidak ada estimasi jam rekaan. Tidak ada perubahan paralel independen pada shared module tanpa owner integrasi.

## Ritme dan kendali jadwal

Sinkronisasi singkat setiap hari kerja: blocker, PR siap review, kontrak berubah dan tes gagal. Integrasikan PR kecil ketika memenuhi DoD; jangan menumpuk semuanya pada akhir sprint. Defect memakai issue yang benar-benar dibuat dan tautan bukti; jangan menebak issue key.

Jika blocker mengancam 29 November, catat dampak, pekerjaan yang dapat diparalelkan, dan usulan perubahan jadwal melalui CR. Jangan otomatis memperpanjang deadline atau menghapus UC untuk mengejar tanggal. Target tetap 29 November sampai perubahan disetujui dan dicatat.

Rincian: [Sprint 1](../sprints/SPRINT_01.md), [Sprint 2](../sprints/SPRINT_02.md), [Sprint 3](../sprints/SPRINT_03.md), [dependency matrix](DEPENDENCY_MATRIX.md), [readiness](DEVELOPMENT_READINESS.md).
