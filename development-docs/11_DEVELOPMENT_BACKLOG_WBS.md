# Backlog Pengembangan, WBS, dan Rencana Implementasi

## Identitas dan kendali dokumen

| Atribut | Nilai |
| --- | --- |
| Document ID | DOC-11 |
| Nama proyek | SIRIS — Capstone Project Kelompok 42 |
| Mitra | Warehouse PT Harina Chemicals Industry |
| Versi | 0.2.0 |
| Status dokumen | DRAFT — NEEDS REVIEW |
| Tanggal penyusunan | 2026-11-10 |
| Pemilik dokumen | Fullstack Development Lead |
| Tujuan dokumen | Membagi pekerjaan empat anggota berdasarkan dependensi. |
| Ruang lingkup | Website pendamping Erasoft; Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation. |

Ketentuan pengguna diberi rujukan **SRC-01**. Desain baru berstatus **PROPOSED**, bukan BASELINE APPROVED. Belum ada aplikasi, hasil pengujian runtime, evaluasi stakeholder, atau persetujuan rilis yang dibuktikan dalam workspace ini. Semua contoh adalah **UJI**.

## Daftar isi

1. Identitas dan kendali dokumen
2. Referensi
3. Strategi tim dan prioritas
4. WBS, epic, dan urutan implementasi
5. Backlog user stories
6. Definition of Ready dan Definition of Done
7. Implementation tracking
8. Milestone dan pengendalian kapasitas
9. Dependencies
10. Open issues
11. Riwayat revisi

## Referensi

SRC-01: master prompt pengguna pada sesi penyusunan; SRC-02: `../AGENTS.md`. SRC-09: `../design.md` v1.0.0, kontrak desain untuk ditinjau yang tersedia pada pemeriksaan akhir; snapshot visual disertakan pada DOC-10. Register sumber lengkap, hierarki, dan sumber eksternal terdapat pada [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md). Rujukan antardokumen: [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md), [DOC-02](02_PROTOTYPING_DEVELOPMENT_PLAN.md), [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md), [DOC-06](06_SOFTWARE_ARCHITECTURE_DESIGN.md), [DOC-10](10_UI_UX_PROTOTYPE_SPECIFICATION.md), [DOC-12](12_PROTOTYPE_ITERATION_FEEDBACK.md), [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md), [DOC-15](15_REQUIREMENTS_TRACEABILITY.md).

## Strategi tim dan prioritas

Empat anggota belum ditetapkan namanya. Pembagian PROPOSED: A Requirements/BA/dokumentasi, B UI/frontend, C backend/arsitektur, D database/QA. Review silang diperlukan; pemilik implementasi tidak menjadi satu-satunya penilai. P0 berarti fondasi dan jalur utama; P1 tetap masuk scope, dikerjakan setelah dependensi. Estimasi S/M/L hanya kompleksitas relatif, bukan durasi atau komitmen tanggal.

## WBS, epic, dan urutan implementasi

| WBS | Epic | Technical tasks | Owner usulan | Estimasi | Dependensi | Milestone relatif |
| --- | --- | --- | --- | --- | --- | --- |
| WBS-01 | Fondasi | Schema referensi, autentikasi, RBAC, audit dasar | C + D | L | OD-04, OD-07; schema ditinjau | IT-01 |
| WBS-02 | Impor bersama | Adaptor, staging, validation, preview, expiry, atomic commit, idempotency | C + D | L | WBS-01; kontrak input | IT-01 |
| WBS-03 | Inbound imports | EXPECTED, COMMITMENT, RECEIVING | B + C | L | WBS-02; finalisasi OD-06 | IT-02 |
| WBS-04 | Exception/notices | Pembacaan final/overdue dan notice dalam aplikasi | B + C | M | WBS-03; aturan delay | IT-02 |
| WBS-05 | Inventory imports | Paket STOCK dan COUNT dengan cutoff | B + D | L | WBS-02; cutoff OD-05 | IT-03 |
| WBS-06 | Rekonsiliasi | Pairing, nonvalid states, run immutable | C + D | L | WBS-05 | IT-03 |
| WBS-07 | Histories | Histori inbound dan run persediaan | B + C | M | WBS-03, WBS-06 | IT-02/IT-03 |
| WBS-08 | Metrics | Eligibility, denominator, query agregasi | C + D | L | WBS-04, WBS-06; OD-06 | IT-04 |
| WBS-09 | WO/evidence/audit UI | Bacaan WO, arsip privat dan penelusuran audit | B + C | L | WBS-01, WBS-05; OD-08 | IT-04 |
| WBS-10 | Integrasi/evaluasi | Regresi, NFR, UAT, dokumentasi dan rehearsal deployment | A + D; seluruh tim | L | WBS-01–WBS-09; sumber final | IT-05 |

## Backlog user stories

| Backlog ID | User story | Acceptance / rujukan | Priority | Owner usulan | Status |
| --- | --- | --- | --- | --- | --- |
| BL-01 | Sebagai Purchasing, saya memerlukan mengimpor referensi inbound agar menetapkan referensi kebutuhan inbound yang dapat ditelusuri. | UC-01 DOC-03; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-01, BR-AUD-01, BR-SEC-01, BR-DAT-02 | P0 | B + C/D | PLANNED; belum ada kode |
| BL-02 | Sebagai Purchasing, saya memerlukan mengimpor janji supplier agar mencatat janji awal dan perubahannya tanpa mengubah tanggal kebutuhan. | UC-02 DOC-03; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-01, BR-INB-02, BR-AUD-01, BR-SEC-01, BR-DAT-02 | P0 | B + C/D | PLANNED; belum ada kode |
| BL-03 | Sebagai Warehouse, saya memerlukan mengimpor data penerimaan agar mencatat penerimaan parsial dan penutup yang sah. | UC-03 DOC-03; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-03, BR-AUD-01, BR-SEC-01, BR-DAT-02 | P0 | B + C/D | PLANNED; belum ada kode |
| BL-04 | Sebagai Purchasing, Warehouse, saya memerlukan memeriksa exception inbound agar membedakan kondisi inbound terbuka dari exception final. | UC-04 DOC-03; BR-DAT-01, BR-INB-03, BR-INB-04, BR-SEC-01 | P1 | B + C/D | PLANNED; belum ada kode |
| BL-05 | Sebagai Purchasing, Warehouse, saya memerlukan melihat pemberitahuan inbound agar menyajikan pemberitahuan inbound di website sesuai bukti. | UC-05 DOC-03; BR-DAT-01, BR-INB-04, BR-SEC-01 | P1 | B + C/D | PLANNED; belum ada kode |
| BL-06 | Sebagai Purchasing, Production, saya memerlukan membaca referensi material wo agar menyediakan bacaan referensi material WO tanpa perencanaan produksi. | UC-06 DOC-03; BR-DAT-01, BR-SEC-01, BR-DAT-02 | P1 | B + C/D | PLANNED; belum ada kode |
| BL-07 | Sebagai Purchasing, Warehouse, saya memerlukan menelusuri riwayat inbound agar menelusuri referensi, perubahan janji dan penerimaan. | UC-07 DOC-03; BR-DAT-01, BR-INB-01, BR-INB-02, BR-INB-03, BR-SEC-01 | P1 | B + C/D | PLANNED; belum ada kode |
| BL-08 | Sebagai Purchasing, Management, saya memerlukan melihat metrik supplier agar menyajikan metrik supplier dengan eligibility yang dapat dijelaskan. | UC-08 DOC-03; BR-DAT-01, BR-INB-03, BR-INB-04, BR-INB-05, BR-SEC-01 | P1 | B + C/D | PLANNED; belum ada kode |
| BL-09 | Sebagai Warehouse, saya memerlukan mengimpor data stok agar mengimpor saldo QTY AKHIR bersama dukungan opsional. | UC-09 DOC-03; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-01, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02 | P0 | B + C/D | PLANNED; belum ada kode |
| BL-10 | Sebagai Warehouse, saya memerlukan mengimpor hasil hitung fisik agar menyimpan hasil hitung dan membedakan belum dihitung dari nol. | UC-10 DOC-03; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-02, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02 | P0 | B + C/D | PLANNED; belum ada kode |
| BL-11 | Sebagai Warehouse, saya memerlukan mengarsipkan bukti kartu stok agar mengaitkan bukti privat ke tepat satu target sah. | UC-11 DOC-03; BR-DAT-01, BR-EVD-01, BR-EVD-02, BR-AUD-01, BR-SEC-01, BR-DAT-02 | P1 | B + C/D | PLANNED; belum ada kode |
| BL-12 | Sebagai Warehouse, saya memerlukan menjalankan rekonsiliasi stok agar membandingkan pasangan stok dan hitung yang memenuhi konteks. | UC-12 DOC-03; BR-DAT-01, BR-INV-01, BR-INV-02, BR-INV-03, BR-INV-04, BR-INV-05, BR-INV-06, BR-AUD-01, BR-SEC-01 | P0 | B + C/D | PLANNED; belum ada kode |
| BL-13 | Sebagai Warehouse, Management, saya memerlukan menelusuri riwayat selisih stok agar membaca versi hasil selisih tanpa menimpa histori. | UC-13 DOC-03; BR-DAT-01, BR-INV-04, BR-INV-05, BR-INV-06, BR-SEC-01 | P1 | B + C/D | PLANNED; belum ada kode |
| BL-14 | Sebagai Warehouse, Management, saya memerlukan melihat metrik persediaan agar menyajikan metrik persediaan dari pasangan rekonsiliasi valid. | UC-14 DOC-03; BR-DAT-01, BR-INV-04, BR-INV-05, BR-SEC-01 | P1 | B + C/D | PLANNED; belum ada kode |
| BL-15 | Sebagai Warehouse, saya memerlukan menelusuri audit proses agar menelusuri keberhasilan, kegagalan dan pembatalan proses. | UC-15 DOC-03; BR-IMP-04, BR-DAT-01, BR-AUD-01, BR-SEC-01 | P1 | B + C/D | PLANNED; belum ada kode |
| BL-16 | Sebagai Internal; mewarisi pengguna pemanggil, saya memerlukan memvalidasi data impor agar memvalidasi data dan metadata impor sebelum preview dan commit. | UC-16 DOC-03; BR-IMP-01, BR-IMP-02, BR-IMP-04, BR-DAT-01, BR-AUD-01, BR-SEC-01, BR-DAT-02 | P0 | C + D | PLANNED; belum ada kode |

## Definition of Ready dan Definition of Done

| Kendali | Kriteria |
| --- | --- |
| Ready | Sumber requirement teridentifikasi; scope dan izin jelas; fixture UJI tersedia; desain data/API/UI ditinjau; dependency tersedia; acceptance criteria dapat diuji. |
| Done untuk implementasi | Code review selesai; migration diuji; tes terkait dieksekusi dan bukti dicatat; error/permission/empty state tersedia; audit/lineage sesuai; dokumentasi dan traceability diperbarui. |
| Done untuk dokumen | Metadata dan sumber ada; usulan dibedakan; link dan ID benar; tidak ada bukti rekaan; reviewer mencatat temuan terbuka. |
| Review kode | Tidak ada hardcoded secret; SQL parameterized; scope backend; atomicity/idempotency; tidak ada perubahan scope diam-diam; tidak ada raw file ke Management. |
| Integrasi checkpoint | Sesudah fondasi: kontrak auth/scope; sesudah impor: retry+rollback; sesudah rekonsiliasi: fixture edge; sesudah metrics: denominator; sebelum delivery: seluruh sumber dan bukti. |
| Delivery | Build/version dan konfigurasi dapat direproduksi; sumber final ditelusuri; UAT dan keputusan tercatat; known issues disampaikan. |

## Implementation tracking

| Item | Versi/source code | Status aktual | Bukti | Langkah berikut |
| --- | --- | --- | --- | --- |
| WBS-01 | Belum tersedia | NOT STARTED | Repositori belum memiliki aplikasi | OD-04, OD-07; schema ditinjau |
| WBS-02 | Belum tersedia | NOT STARTED | Repositori belum memiliki aplikasi | WBS-01; kontrak input |
| WBS-03 | Belum tersedia | NOT STARTED | Repositori belum memiliki aplikasi | WBS-02; finalisasi OD-06 |
| WBS-04 | Belum tersedia | NOT STARTED | Repositori belum memiliki aplikasi | WBS-03; aturan delay |
| WBS-05 | Belum tersedia | NOT STARTED | Repositori belum memiliki aplikasi | WBS-02; cutoff OD-05 |
| WBS-06 | Belum tersedia | NOT STARTED | Repositori belum memiliki aplikasi | WBS-05 |
| WBS-07 | Belum tersedia | NOT STARTED | Repositori belum memiliki aplikasi | WBS-03, WBS-06 |
| WBS-08 | Belum tersedia | NOT STARTED | Repositori belum memiliki aplikasi | WBS-04, WBS-06; OD-06 |
| WBS-09 | Belum tersedia | NOT STARTED | Repositori belum memiliki aplikasi | WBS-01, WBS-05; OD-08 |
| WBS-10 | Belum tersedia | NOT STARTED | Repositori belum memiliki aplikasi | WBS-01–WBS-09; sumber final |

## Milestone dan pengendalian kapasitas

Milestone M1–M5 mengikuti IT-01–IT-05 DOC-02. Tanggal: belum ditetapkan. Lead meminta kapasitas mingguan empat anggota sebelum memperkirakan durasi. Jika dependensi gagal, pindahkan pekerjaan independen seperti fixture, kontrak, atau review dokumen; jangan menyatakan milestone selesai hanya karena tanggal rencana telah lewat. Audit dasar pada WBS-01 wajib sebelum impor meskipun tampilan audit ada pada WBS-09.

## Dependencies

| Dependensi | Kegunaan |
| --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | Indeks Induk Dokumentasi Pengembangan |
| [DOC-02](02_PROTOTYPING_DEVELOPMENT_PLAN.md) | Rencana Pengembangan Prototyping |
| [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md) | Dokumen Kebutuhan Produk |
| [DOC-06](06_SOFTWARE_ARCHITECTURE_DESIGN.md) | Arsitektur Perangkat Lunak dan Desain Terperinci |
| [DOC-10](10_UI_UX_PROTOTYPE_SPECIFICATION.md) | Spesifikasi Prototipe UI/UX |
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
