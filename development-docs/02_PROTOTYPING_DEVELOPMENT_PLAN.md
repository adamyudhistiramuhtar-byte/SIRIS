# Rencana Pengembangan Prototyping

## Identitas dan kendali dokumen

| Atribut | Nilai |
| --- | --- |
| Document ID | DOC-02 |
| Nama proyek | SIRIS — Capstone Project Kelompok 42 |
| Mitra | Warehouse PT Harina Chemicals Industry |
| Versi | 0.2.0 |
| Status dokumen | DRAFT — NEEDS REVIEW |
| Tanggal penyusunan | 2026-11-10 |
| Pemilik dokumen | Fullstack Development Lead |
| Tujuan dokumen | Mengarahkan iterasi berdasarkan dependensi dan bukti evaluasi. |
| Ruang lingkup | Website pendamping Erasoft; Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation. |

Ketentuan pengguna diberi rujukan **SRC-01**. Desain baru berstatus **PROPOSED**, bukan BASELINE APPROVED. Belum ada aplikasi, hasil pengujian runtime, evaluasi stakeholder, atau persetujuan rilis yang dibuktikan dalam workspace ini. Semua contoh adalah **UJI**.

## Daftar isi

1. Identitas dan kendali dokumen
2. Referensi
3. Pendekatan dan alasan
4. Tahapan, input, aktivitas, output
5. Rencana iterasi dan milestone
6. Evaluasi, feedback, dan revisi
7. Baseline freeze dan validasi ulang
8. Risiko dan pembagian kapasitas
9. Dependencies
10. Open issues
11. Riwayat revisi

## Referensi

SRC-01: master prompt pengguna pada sesi penyusunan; SRC-02: `../AGENTS.md`. SRC-09: `../design.md` v1.0.0, kontrak desain untuk ditinjau yang tersedia pada pemeriksaan akhir; snapshot visual disertakan pada DOC-10. Register sumber lengkap, hierarki, dan sumber eksternal terdapat pada [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md). Rujukan antardokumen: [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md), [DOC-01](01_PROJECT_CHARTER_SCOPE.md), [DOC-05](05_BUSINESS_RULES_RBAC.md), [DOC-11](11_DEVELOPMENT_BACKLOG_WBS.md), [DOC-12](12_PROTOTYPE_ITERATION_FEEDBACK.md), [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md), [DOC-15](15_REQUIREMENTS_TRACEABILITY.md).

## Pendekatan dan alasan

Prototyping dipakai untuk meninjau pemahaman kebutuhan dan interaksi dengan pengguna sebelum implementasi dimatangkan. Pilihan metode berasal dari SRC-01, bukan hasil evaluasi efektivitas yang telah dilakukan. Tahap dapat berulang: feedback tentang cutoff dapat mengembalikan pekerjaan dari evaluasi ke Communication, lalu memperbarui desain dan pengujian.

## Tahapan, input, aktivitas, output

| Tahap | Input | Aktivitas | Output | Peran |
| --- | --- | --- | --- | --- |
| Communication | Sumber final, aturan SRC-01 | Analisis masalah, aktor, kebutuhan, scope | DOC-01, DOC-03, DOC-04, DOC-05 | BA/Requirements |
| Quick Plan | Kebutuhan dan dependensi | Prioritas, kapasitas, WBS, rencana iterasi | DOC-02, DOC-11 | Lead |
| Modeling / Quick Design | Kebutuhan yang dapat ditelusuri | Rancang arsitektur, data, API, layar | DOC-06–DOC-10 | Architect/DB/UI |
| Construction of Prototype | Desain yang ditinjau | Implementasi, integrasi, uji, pencatatan status | DOC-11, DOC-13, DOC-16 | Developer/QA |
| Deployment, Delivery & Feedback | Versi prototipe dan skrip evaluasi | Demo, observasi tugas, feedback, UAT, serah terima | DOC-12, DOC-14, DOC-15, DOC-17, DOC-18 | Tim dan reviewer berwenang |

## Rencana iterasi dan milestone

| Iterasi | Tujuan | UC | Scope | Kriteria masuk | Kriteria selesai |
| --- | --- | --- | --- | --- | --- |
| IT-01 | Fondasi dan satu alur impor utuh | UC-01, UC-16 | Database, referensi, autentikasi, RBAC, staging, preview, commit | Kontrak contoh UJI tersedia dan keputusan keamanan awal ditinjau | Impor UJI dapat ditelusuri; rollback dan retry diuji |
| IT-02 | Supplier inbound | UC-02–UC-05, UC-07 | Janji, receiving parsial/final, exception, notices, histori | Fondasi impor stabil; definisi finalisasi disepakati | Tanggal kebutuhan tetap; belum final tidak menghasilkan exception final |
| IT-03 | Inventory dan rekonsiliasi | UC-09, UC-10, UC-12, UC-13 | STOCK, COUNT, cutoff, rekonsiliasi versi | Kontrak QTY AKHIR dan konteks cutoff disepakati | Nol/null terpisah; pasangan invalid tidak mempunyai variance |
| IT-04 | Pelaporan dan dukungan | UC-06, UC-08, UC-11, UC-14, UC-15 | Metrik, WO, evidence, tampilan audit | Rumus eligibility, referensi WO dan target evidence disepakati | Denominator dapat dijelaskan; raw file tetap privat |
| IT-05 | Integrasi dan evaluasi penerimaan | UC-01–UC-16 | Regresi lintas modul, NFR, UAT, deployment rehearsal | Traceability lengkap dan lingkungan uji tersedia | Bukti pengujian dan keputusan penerimaan tersedia |

Semua iterasi berstatus **PLANNED / NOT EXECUTED**. Versi prototipe, tanggal mulai/selesai, dan kapasitas: belum ditetapkan. Versi dokumen 0.1.0 bukan versi prototipe.

## Evaluasi, feedback, dan revisi

Pada setiap iterasi, QA menyiapkan fixture UJI dan skenario; reviewer menjalankan tugas sesuai role. Pencatat memisahkan ucapan/observasi aktual dari interpretasi tim. Temuan memuat waktu, versi, bukti, dampak, dan sumber requirement. BA mengklasifikasikan sebagai defect, klarifikasi, atau change request. Perubahan scope hanya dilakukan setelah keputusan berwenang tercatat. Hasil pembahasan disimpan pada DOC-12 dan perubahan lintas artefak pada DOC-15.

## Baseline freeze dan validasi ulang

Freeze berarti satu set versi sumber/desain diberi referensi untuk iterasi, bukan menutup kesempatan revisi. Setiap perubahan membutuhkan analisis dampak UC, FR/NFR, schema, API, UI, fixture dan tes. Setelah perubahan, jalankan regresi pada jalur normal, batas, izin, dan konteks data yang terdampak. Hentikan rilis apabila ada cacat atomicity, pemisahan mode, kebocoran akses, atau mapping baseline belum jelas. Ini kriteria rilis usulan, bukan hasil uji.

## Risiko dan pembagian kapasitas

Empat anggota dapat memegang beberapa peran: A analisis/dokumentasi, B frontend/UI, C backend/arsitektur, D database/QA (usulan; nama belum ditetapkan). Reviewer perubahan tidak menjadi satu-satunya pembuat perubahan. Dependency audit dan otorisasi dibangun sejak fondasi; penempatan UC-15 pada IT-04 hanya untuk antarmuka penelusuran, bukan menunda pencatatan audit.

## Dependencies

| Dependensi | Kegunaan |
| --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | Indeks Induk Dokumentasi Pengembangan |
| [DOC-01](01_PROJECT_CHARTER_SCOPE.md) | Piagam Proyek dan Definisi Ruang Lingkup |
| [DOC-05](05_BUSINESS_RULES_RBAC.md) | Spesifikasi Aturan Bisnis dan RBAC |
| [DOC-11](11_DEVELOPMENT_BACKLOG_WBS.md) | Backlog Pengembangan, WBS, dan Rencana Implementasi |
| [DOC-12](12_PROTOTYPE_ITERATION_FEEDBACK.md) | Catatan Iterasi, Review, dan Feedback Prototipe |
| [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md) | Rencana dan Spesifikasi Kasus Pengujian |
| [DOC-15](15_REQUIREMENTS_TRACEABILITY.md) | Ketertelusuran Kebutuhan dan Pengendalian Perubahan |

## Open issues

Rincian baseline final belum tersedia; lihat register sumber dan keputusan terbuka pada DOC-00.

## Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1.0 | 2026-11-10 | Penyusunan berdasarkan SRC-01; celah sumber dicatat dan desain ditandai PROPOSED. | Belum ada bukti persetujuan |
| 0.2.0 | 2026-11-10 | Integrasi SRC-09 design.md: route, role, token, layar pendukung, metrik dan konflik desain; tetap NEEDS REVIEW. | Belum ada bukti persetujuan |
