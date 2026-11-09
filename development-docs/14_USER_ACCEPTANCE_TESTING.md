# Pengujian Penerimaan Pengguna

## Identitas dan kendali dokumen

| Atribut | Nilai |
| --- | --- |
| Document ID | DOC-14 |
| Nama proyek | SIRIS — Capstone Project Kelompok 42 |
| Mitra | Warehouse PT Harina Chemicals Industry |
| Versi | 0.2.0 |
| Status dokumen | DRAFT — NEEDS REVIEW |
| Tanggal penyusunan | 2026-11-10 |
| Pemilik dokumen | QA Engineer |
| Tujuan dokumen | Merencanakan penerimaan oleh empat peran internal. |
| Ruang lingkup | Website pendamping Erasoft; Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation. |

Ketentuan pengguna diberi rujukan **SRC-01**. Desain baru berstatus **PROPOSED**, bukan BASELINE APPROVED. Belum ada aplikasi, hasil pengujian runtime, evaluasi stakeholder, atau persetujuan rilis yang dibuktikan dalam workspace ini. Semua contoh adalah **UJI**.

## Daftar isi

1. Identitas dan kendali dokumen
2. Referensi
3. Tujuan, scope, peserta, dan prasyarat
4. Skenario, skrip, dan expected business outcomes
5. Catatan hasil dan issue tracking
6. Retest, keputusan, dan sign-off
7. Dependencies
8. Open issues
9. Riwayat revisi

## Referensi

SRC-01: master prompt pengguna pada sesi penyusunan; SRC-02: `../AGENTS.md`. SRC-09: `../design.md` v1.0.0, kontrak desain untuk ditinjau yang tersedia pada pemeriksaan akhir; snapshot visual disertakan pada DOC-10. Register sumber lengkap, hierarki, dan sumber eksternal terdapat pada [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md). Rujukan antardokumen: [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md), [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md), [DOC-05](05_BUSINESS_RULES_RBAC.md), [DOC-12](12_PROTOTYPE_ITERATION_FEEDBACK.md), [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md), [DOC-15](15_REQUIREMENTS_TRACEABILITY.md), [DOC-18](18_USER_MANUAL_HANDOVER.md).

## Tujuan, scope, peserta, dan prasyarat

UAT menilai kecocokan tugas bisnis dalam 16 UC yang telah ditetapkan. Peserta adalah wakil Purchasing, Warehouse, Production dan Management yang berwenang; nama, jadwal dan penandatangan belum tersedia. Tim memfasilitasi dan mencatat bukti. Prasyarat: izin role final, kebutuhan sumber dipetakan, versi prototipe tersedia, pengujian integrasi selesai sesuai kriteria, data UJI siap, serta reviewer memahami data simulasi. Tidak ada UAT yang telah dilakukan.

## Skenario, skrip, dan expected business outcomes

| ID | Peserta | UC | Skrip dengan data UJI | Acceptance criteria |
| --- | --- | --- | --- | --- |
| UAT-P | Purchasing | UC-01, UC-02, UC-04, UC-05, UC-06, UC-07, UC-08 | 1 Impor EXPECTED UJI dan lihat preview. 2 Commit. 3 Impor INITIAL lalu CHANGE. 4 Baca histori, exception, notices, referensi WO dan metrik setelah receiving fixture disediakan Warehouse. | Tanggal kebutuhan tetap; event janji utuh; belum final tidak disebut final delay/mismatch; denominator dijelaskan. |
| UAT-W | Warehouse | UC-03, UC-09, UC-10, UC-11, UC-12, UC-13, UC-14, UC-15 | 1 Impor receiving parsial dan penutup sah. 2 Impor STOCK QTY AKHIR 10. 3 Impor COUNT true 0 dan sesi lain false null. 4 Jalankan rekonsiliasi. 5 Arsipkan bukti dan buka histori/metrik serta audit proses. | Parsial/final dibedakan; variance -10 untuk true 0, null untuk false; file privat; run lama tetap ada. |
| UAT-R | Production | UC-06 | 1 Baca referensi material WO pada gudang berizin. 2 Coba membuka notices dan impor yang tidak diizinkan menurut SRC-09. | Referensi read-only dan sumber terlihat; tidak ada BOM/planning; impor ditolak menurut matriks final. |
| UAT-M | Management | UC-08, UC-13, UC-14 | 1 Pilih gudang/mode berizin. 2 Baca metrik dan histori. 3 Pastikan halaman audit ditolak sesuai SRC-09. 4 Coba akses raw/evidence content langsung. | Data hanya scope berizin; denominator jelas; raw dan storage key tidak dapat diperoleh. |
| UAT-I | Purchasing/Warehouse sesuai jenis impor | UC-01, UC-02, UC-03, UC-09, UC-10, UC-16 | 1 Unggah contoh invalid dari masing-masing jenis. 2 Perbaiki lalu validasi. 3 Biarkan satu preview expired. 4 Coba commit. | Lima impor menggunakan validasi internal; invalid/expired tidak commit; UC-16 tidak muncul di navigasi. |

## Catatan hasil dan issue tracking

| Skenario | Versi / waktu / peserta aktual | Actual results | Issue / evidence | Status | Keputusan |
| --- | --- | --- | --- | --- | --- |
| UAT-P | Belum tersedia | Belum ada hasil | Belum tersedia | NOT RUN | Belum dievaluasi |
| UAT-W | Belum tersedia | Belum ada hasil | Belum tersedia | NOT RUN | Belum dievaluasi |
| UAT-R | Belum tersedia | Belum ada hasil | Belum tersedia | NOT RUN | Belum dievaluasi |
| UAT-M | Belum tersedia | Belum ada hasil | Belum tersedia | NOT RUN | Belum dievaluasi |
| UAT-I | Belum tersedia | Belum ada hasil | Belum tersedia | NOT RUN | Belum dievaluasi |

## Retest, keputusan, dan sign-off

Jika hasil aktual berbeda, QA membuat issue berisi langkah reproduksi dan dampak bisnis. Perubahan scope mengikuti CR; defect mengikuti perbaikan dan regresi. Retest mengulang skenario terdampak menggunakan versi baru dan mencatat bukti; hasil lama tidak ditimpa. Keputusan yang mungkin setelah evaluasi: diterima, diterima dengan catatan yang disetujui, atau belum diterima. Tidak ada pilihan yang otomatis ditetapkan hanya karena dokumen selesai.
| Field sign-off | Status saat ini |
| --- | --- |
| Nama/jabatan pihak berwenang | Belum ditetapkan |
| Versi prototipe dan baseline | Belum tersedia |
| Skenario/evidence yang dinilai | Belum dieksekusi |
| Issue tersisa dan penerimaan risiko | Belum dinilai |
| Keputusan dan tanggal | Belum ada |
| Bukti persetujuan | Belum tersedia; jangan mengisi tanda tangan rekaan |

## Dependencies

| Dependensi | Kegunaan |
| --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | Indeks Induk Dokumentasi Pengembangan |
| [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md) | Dokumen Kebutuhan Produk |
| [DOC-05](05_BUSINESS_RULES_RBAC.md) | Spesifikasi Aturan Bisnis dan RBAC |
| [DOC-12](12_PROTOTYPE_ITERATION_FEEDBACK.md) | Catatan Iterasi, Review, dan Feedback Prototipe |
| [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md) | Rencana dan Spesifikasi Kasus Pengujian |
| [DOC-15](15_REQUIREMENTS_TRACEABILITY.md) | Ketertelusuran Kebutuhan dan Pengendalian Perubahan |
| [DOC-18](18_USER_MANUAL_HANDOVER.md) | Panduan Pengguna dan Serah Terima |

## Open issues

Rincian baseline final belum tersedia; lihat register sumber dan keputusan terbuka pada DOC-00.

## Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1.0 | 2026-11-10 | Penyusunan berdasarkan SRC-01; celah sumber dicatat dan desain ditandai PROPOSED. | Belum ada bukti persetujuan |
| 0.2.0 | 2026-11-10 | Integrasi SRC-09 design.md: route, role, token, layar pendukung, metrik dan konflik desain; tetap NEEDS REVIEW. | Belum ada bukti persetujuan |
