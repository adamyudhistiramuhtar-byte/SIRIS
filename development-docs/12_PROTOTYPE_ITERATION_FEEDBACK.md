# Catatan Iterasi, Review, dan Feedback Prototipe

## Identitas dan kendali dokumen

| Atribut | Nilai |
| --- | --- |
| Document ID | DOC-12 |
| Nama proyek | SIRIS — Capstone Project Kelompok 42 |
| Mitra | Warehouse PT Harina Chemicals Industry |
| Versi | 0.2.0 |
| Status dokumen | DRAFT — NEEDS REVIEW |
| Tanggal penyusunan | 2026-11-10 |
| Pemilik dokumen | Business Analyst |
| Tujuan dokumen | Memisahkan rencana evaluasi dari feedback dan hasil aktual. |
| Ruang lingkup | Website pendamping Erasoft; Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation. |

Ketentuan pengguna diberi rujukan **SRC-01**. Desain baru berstatus **PROPOSED**, bukan BASELINE APPROVED. Belum ada aplikasi, hasil pengujian runtime, evaluasi stakeholder, atau persetujuan rilis yang dibuktikan dalam workspace ini. Semua contoh adalah **UJI**.

## Daftar isi

1. Identitas dan kendali dokumen
2. Referensi
3. Aturan pencatatan evaluasi
4. Register iterasi
5. IT-01 — Fondasi dan satu alur impor utuh
6. IT-02 — Supplier inbound
7. IT-03 — Inventory dan rekonsiliasi
8. IT-04 — Pelaporan dan dukungan
9. IT-05 — Integrasi dan evaluasi penerimaan
10. Form feedback dan keputusan yang digunakan saat evaluasi
11. Mekanisme tindak lanjut
12. Dependencies
13. Open issues
14. Riwayat revisi

## Referensi

SRC-01: master prompt pengguna pada sesi penyusunan; SRC-02: `../AGENTS.md`. SRC-09: `../design.md` v1.0.0, kontrak desain untuk ditinjau yang tersedia pada pemeriksaan akhir; snapshot visual disertakan pada DOC-10. Register sumber lengkap, hierarki, dan sumber eksternal terdapat pada [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md). Rujukan antardokumen: [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md), [DOC-02](02_PROTOTYPING_DEVELOPMENT_PLAN.md), [DOC-11](11_DEVELOPMENT_BACKLOG_WBS.md), [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md), [DOC-14](14_USER_ACCEPTANCE_TESTING.md), [DOC-15](15_REQUIREMENTS_TRACEABILITY.md).

## Aturan pencatatan evaluasi

Dokumen ini memuat rencana dan formulir siap digunakan, bukan feedback aktual. Belum ada versi prototipe, reviewer nyata, wawancara, hasil evaluasi atau perbaikan kode yang dibuktikan. Status semua iterasi NOT EXECUTED; tidak ada acceptance sign-off.

## Register iterasi

| Iteration | Feature Scope | Prototype Version | Evaluation Method | Feedback | Improvement | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| IT-01 | UC-01, UC-16; Database, referensi, autentikasi, RBAC, staging, preview, commit | Belum tersedia | Walkthrough tugas + observasi fixture UJI | Belum dikumpulkan | Belum diputuskan | NOT EXECUTED | Belum tersedia |
| IT-02 | UC-02–UC-05, UC-07; Janji, receiving parsial/final, exception, notices, histori | Belum tersedia | Walkthrough tugas + observasi fixture UJI | Belum dikumpulkan | Belum diputuskan | NOT EXECUTED | Belum tersedia |
| IT-03 | UC-09, UC-10, UC-12, UC-13; STOCK, COUNT, cutoff, rekonsiliasi versi | Belum tersedia | Walkthrough tugas + observasi fixture UJI | Belum dikumpulkan | Belum diputuskan | NOT EXECUTED | Belum tersedia |
| IT-04 | UC-06, UC-08, UC-11, UC-14, UC-15; Metrik, WO, evidence, tampilan audit | Belum tersedia | Walkthrough tugas + observasi fixture UJI | Belum dikumpulkan | Belum diputuskan | NOT EXECUTED | Belum tersedia |
| IT-05 | UC-01–UC-16; Regresi lintas modul, NFR, UAT, deployment rehearsal | Belum tersedia | Walkthrough tugas + observasi fixture UJI | Belum dikumpulkan | Belum diputuskan | NOT EXECUTED | Belum tersedia |

## IT-01 — Fondasi dan satu alur impor utuh

| Elemen | Isi |
| --- | --- |
| Objective | Fondasi dan satu alur impor utuh |
| Scope / features | UC-01, UC-16; Database, referensi, autentikasi, RBAC, staging, preview, commit |
| Deliverables rencana | Database, referensi, autentikasi, RBAC, staging, preview, commit dan catatan hasil pengujian terkait |
| Evaluation scenario | Impor UJI dapat ditelusuri; rollback dan retry diuji; skenario DOC-13/DOC-14 |
| Stakeholder reviewer | Perwakilan role terkait; nama dan kewenangan belum ditetapkan |
| Feedback collection method | Observasi tugas dan wawancara terarah; catat kutipan hanya jika benar-benar diperoleh |
| Actual feedback / findings / defects | Belum ada; NOT EXECUTED |
| Required improvements / change decisions | Belum diputuskan; jangan dibuat sebagai perubahan yang sudah disetujui |
| Retest results | NOT RUN |
| Acceptance status | Belum dievaluasi |
| Next iteration input | Temuan yang tervalidasi, keputusan CR, versi desain dan hasil regresi |

## IT-02 — Supplier inbound

| Elemen | Isi |
| --- | --- |
| Objective | Supplier inbound |
| Scope / features | UC-02–UC-05, UC-07; Janji, receiving parsial/final, exception, notices, histori |
| Deliverables rencana | Janji, receiving parsial/final, exception, notices, histori dan catatan hasil pengujian terkait |
| Evaluation scenario | Tanggal kebutuhan tetap; belum final tidak menghasilkan exception final; skenario DOC-13/DOC-14 |
| Stakeholder reviewer | Perwakilan role terkait; nama dan kewenangan belum ditetapkan |
| Feedback collection method | Observasi tugas dan wawancara terarah; catat kutipan hanya jika benar-benar diperoleh |
| Actual feedback / findings / defects | Belum ada; NOT EXECUTED |
| Required improvements / change decisions | Belum diputuskan; jangan dibuat sebagai perubahan yang sudah disetujui |
| Retest results | NOT RUN |
| Acceptance status | Belum dievaluasi |
| Next iteration input | Temuan yang tervalidasi, keputusan CR, versi desain dan hasil regresi |

## IT-03 — Inventory dan rekonsiliasi

| Elemen | Isi |
| --- | --- |
| Objective | Inventory dan rekonsiliasi |
| Scope / features | UC-09, UC-10, UC-12, UC-13; STOCK, COUNT, cutoff, rekonsiliasi versi |
| Deliverables rencana | STOCK, COUNT, cutoff, rekonsiliasi versi dan catatan hasil pengujian terkait |
| Evaluation scenario | Nol/null terpisah; pasangan invalid tidak mempunyai variance; skenario DOC-13/DOC-14 |
| Stakeholder reviewer | Perwakilan role terkait; nama dan kewenangan belum ditetapkan |
| Feedback collection method | Observasi tugas dan wawancara terarah; catat kutipan hanya jika benar-benar diperoleh |
| Actual feedback / findings / defects | Belum ada; NOT EXECUTED |
| Required improvements / change decisions | Belum diputuskan; jangan dibuat sebagai perubahan yang sudah disetujui |
| Retest results | NOT RUN |
| Acceptance status | Belum dievaluasi |
| Next iteration input | Temuan yang tervalidasi, keputusan CR, versi desain dan hasil regresi |

## IT-04 — Pelaporan dan dukungan

| Elemen | Isi |
| --- | --- |
| Objective | Pelaporan dan dukungan |
| Scope / features | UC-06, UC-08, UC-11, UC-14, UC-15; Metrik, WO, evidence, tampilan audit |
| Deliverables rencana | Metrik, WO, evidence, tampilan audit dan catatan hasil pengujian terkait |
| Evaluation scenario | Denominator dapat dijelaskan; raw file tetap privat; skenario DOC-13/DOC-14 |
| Stakeholder reviewer | Perwakilan role terkait; nama dan kewenangan belum ditetapkan |
| Feedback collection method | Observasi tugas dan wawancara terarah; catat kutipan hanya jika benar-benar diperoleh |
| Actual feedback / findings / defects | Belum ada; NOT EXECUTED |
| Required improvements / change decisions | Belum diputuskan; jangan dibuat sebagai perubahan yang sudah disetujui |
| Retest results | NOT RUN |
| Acceptance status | Belum dievaluasi |
| Next iteration input | Temuan yang tervalidasi, keputusan CR, versi desain dan hasil regresi |

## IT-05 — Integrasi dan evaluasi penerimaan

| Elemen | Isi |
| --- | --- |
| Objective | Integrasi dan evaluasi penerimaan |
| Scope / features | UC-01–UC-16; Regresi lintas modul, NFR, UAT, deployment rehearsal |
| Deliverables rencana | Regresi lintas modul, NFR, UAT, deployment rehearsal dan catatan hasil pengujian terkait |
| Evaluation scenario | Bukti pengujian dan keputusan penerimaan tersedia; skenario DOC-13/DOC-14 |
| Stakeholder reviewer | Perwakilan role terkait; nama dan kewenangan belum ditetapkan |
| Feedback collection method | Observasi tugas dan wawancara terarah; catat kutipan hanya jika benar-benar diperoleh |
| Actual feedback / findings / defects | Belum ada; NOT EXECUTED |
| Required improvements / change decisions | Belum diputuskan; jangan dibuat sebagai perubahan yang sudah disetujui |
| Retest results | NOT RUN |
| Acceptance status | Belum dievaluasi |
| Next iteration input | Temuan yang tervalidasi, keputusan CR, versi desain dan hasil regresi |

## Form feedback dan keputusan yang digunakan saat evaluasi

| Field | Cara pengisian |
| --- | --- |
| Feedback ID | FB-<iterasi>-<nomor>, hanya dibuat ketika observasi dicatat |
| Waktu/versi/reviewer | Isi data sesi nyata; bedakan versi dokumen dengan prototipe |
| Skenario dan UC | Pilih skenario yang benar-benar dijalankan |
| Observasi aktual | Catat tindakan/ucapan dan bukti; jangan mengganti dengan interpretasi tim |
| Interpretasi dan dampak | Analisis terpisah: defect, klarifikasi, change request |
| Perbaikan usulan | Hubungkan requirement/BR, schema, API, UI dan tes terdampak |
| Keputusan | Pemilik kewenangan, waktu, approve/reject/defer dan alasan |
| Retest | Versi perbaikan, test case, hasil aktual, evidence, reviewer |
| Input berikutnya | Pekerjaan tersisa dan dependency yang belum selesai |

## Mekanisme tindak lanjut

QA mencatat defect dengan langkah reproduksi dan data UJI. BA memverifikasi apakah perubahan masih sesuai baseline; di luar scope masuk CR DOC-15. Tim tidak mengubah status menjadi ACCEPTED sebelum reviewer berwenang memberi keputusan yang tersimpan. Feedback yang belum memiliki bukti diberi UNVERIFIED dan tidak dianggap persetujuan. Perubahan approved harus diikuti update dokumen, implementasi dan regresi terkait.

## Dependencies

| Dependensi | Kegunaan |
| --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | Indeks Induk Dokumentasi Pengembangan |
| [DOC-02](02_PROTOTYPING_DEVELOPMENT_PLAN.md) | Rencana Pengembangan Prototyping |
| [DOC-11](11_DEVELOPMENT_BACKLOG_WBS.md) | Backlog Pengembangan, WBS, dan Rencana Implementasi |
| [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md) | Rencana dan Spesifikasi Kasus Pengujian |
| [DOC-14](14_USER_ACCEPTANCE_TESTING.md) | Pengujian Penerimaan Pengguna |
| [DOC-15](15_REQUIREMENTS_TRACEABILITY.md) | Ketertelusuran Kebutuhan dan Pengendalian Perubahan |

## Open issues

Rincian baseline final belum tersedia; lihat register sumber dan keputusan terbuka pada DOC-00.

## Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1.0 | 2026-11-10 | Penyusunan berdasarkan SRC-01; celah sumber dicatat dan desain ditandai PROPOSED. | Belum ada bukti persetujuan |
| 0.2.0 | 2026-11-10 | Integrasi SRC-09 design.md: route, role, token, layar pendukung, metrik dan konflik desain; tetap NEEDS REVIEW. | Belum ada bukti persetujuan |
