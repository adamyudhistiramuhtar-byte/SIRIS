# Piagam Proyek dan Definisi Ruang Lingkup

## Identitas dan kendali dokumen

| Atribut | Nilai |
| --- | --- |
| Document ID | DOC-01 |
| Nama proyek | SIRIS — Capstone Project Kelompok 42 |
| Mitra | Warehouse PT Harina Chemicals Industry |
| Versi | 0.2.0 |
| Status dokumen | DRAFT — NEEDS REVIEW |
| Tanggal penyusunan | 2026-11-10 |
| Pemilik dokumen | Business Analyst |
| Tujuan dokumen | Menetapkan tujuan, batas, risiko, dan penerimaan proyek. |
| Ruang lingkup | Website pendamping Erasoft; Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation. |

Ketentuan pengguna diberi rujukan **SRC-01**. Desain baru berstatus **PROPOSED**, bukan BASELINE APPROVED. Belum ada aplikasi, hasil pengujian runtime, evaluasi stakeholder, atau persetujuan rilis yang dibuktikan dalam workspace ini. Semua contoh adalah **UJI**.

## Daftar isi

1. Identitas dan kendali dokumen
2. Referensi
3. Posisi proyek dan latar belakang
4. Masalah, tujuan, dan keberhasilan
5. Stakeholder dan tanggung jawab
6. Ruang lingkup dan batasan
7. Asumsi, dependensi, dan risiko awal
8. Deliverables dan penerimaan proyek
9. Dependencies
10. Open issues
11. Riwayat revisi

## Referensi

SRC-01: master prompt pengguna pada sesi penyusunan; SRC-02: `../AGENTS.md`. SRC-09: `../design.md` v1.0.0, kontrak desain untuk ditinjau yang tersedia pada pemeriksaan akhir; snapshot visual disertakan pada DOC-10. Register sumber lengkap, hierarki, dan sumber eksternal terdapat pada [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md). Rujukan antardokumen: [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md), [DOC-02](02_PROTOTYPING_DEVELOPMENT_PLAN.md), [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md), [DOC-04](04_SOFTWARE_REQUIREMENTS_SPECIFICATION.md), [DOC-14](14_USER_ACCEPTANCE_TESTING.md), [DOC-15](15_REQUIREMENTS_TRACEABILITY.md).

## Posisi proyek dan latar belakang

SIRIS mendampingi Erasoft melalui data yang disediakan secara terpisah. SIRIS tidak menjadi sumber transaksi ERP baru. Dua fokusnya adalah keterlacakan inbound supplier serta pembandingan saldo stok digital dengan hitung fisik. Besaran masalah, frekuensi selisih, waktu kerja sebelum sistem, dan hasil wawancara belum tersedia; tidak ada klaim bahwa mitra mengalami angka kerugian tertentu.

## Masalah, tujuan, dan keberhasilan

| Kebutuhan yang diturunkan dari SRC-01 | Tujuan sistem | Kriteria keberhasilan yang dapat diamati |
| --- | --- | --- |
| Janji dapat berubah dan penerimaan dapat parsial | Memisahkan tanggal kebutuhan, histori janji, dan finalisasi | CHANGE tidak mengubah requested_date; parsial tidak diberi exception final |
| Saldo dan hitung fisik memiliki konteks berbeda | Mencegah perbandingan yang menyesatkan | Pasangan nonvalid tidak mempunyai variance; ACTUAL memakai cutoff VERIFIED |
| Data dan evidence perlu ditelusuri | Menjaga sumber, lineage, dan akses | Setiap hasil memiliki sumber; raw file tidak terpapar ke Management |

## Stakeholder dan tanggung jawab

| Stakeholder | Kebutuhan/tanggung jawab | Batas kepastian |
| --- | --- | --- |
| Purchasing | Meninjau referensi dan janji supplier. | Peran tersedia; pembagian UC terperinci PROPOSED sampai OD-04 selesai. |
| Warehouse | Menyediakan penerimaan, stok, hitung fisik dan bukti. | Peran tersedia; pembagian UC terperinci PROPOSED sampai OD-04 selesai. |
| Production | Membaca referensi material WO. | Peran tersedia; pembagian UC terperinci PROPOSED sampai OD-04 selesai. |
| Management | Membaca metrik sesuai izin. | Peran tersedia; pembagian UC terperinci PROPOSED sampai OD-04 selesai. |
| Tim empat anggota | Membangun prototipe, menguji, dan mendokumentasikan | Nama dan kapasitas belum tersedia |
| Supplier | Sumber informasi melalui proses di luar website | Bukan pengguna internal dan tidak memiliki akun |

## Ruang lingkup dan batasan

| Area | Termasuk |
| --- | --- |
| Stream A | UC-01–UC-08 |
| Stream B | UC-09–UC-14 |
| Dukungan | UC-15 audit; UC-16 validasi internal lima impor |
| Teknologi | Vue 3, Node.js + Express.js, PostgreSQL, REST API, web client–server |
| Dokumen | 19 dokumen development; BPMN AS-IS/TO-BE direferensikan setelah sumber tersedia |

Di luar ruang lingkup: ERP replacement; integrasi langsung database/API Erasoft; Erasoft writeback; Purchase Order Management baru; supplier portal; public registration; OCR; real-time ERP synchronization; automatic stock adjustment; production planning/MRP; BOM calculation; picking; accounting module; corrective action workflow otomatis; email, WhatsApp, SMS atau push notification otomatis; analitik di luar baseline.

## Asumsi, dependensi, dan risiko awal

| ID | Asumsi atau risiko | Penanganan | Pemilik |
| --- | --- | --- | --- |
| R-01 | Dokumen final belum dilampirkan | Tahan klaim kepatuhan baseline; gunakan SOURCE REQUIRED | Requirements Engineer |
| R-02 | Sumber operasional belum terverifikasi | Gunakan fixture UJI; inventaris sumber DOC-08 | Business Analyst |
| R-03 | Kapasitas empat anggota belum diketahui | Gunakan urutan relatif tanpa tanggal fiktif | Development Lead |
| R-04 | Parser dan kontrak belum disepakati | Uji sampel sumber sebelum implementasi adaptor | Database Architect |
| R-05 | Metrik dapat menyesatkan bila eligibility salah | Blok finalisasi rumus sampai OD-06 selesai | QA Engineer |

## Deliverables dan penerimaan proyek

Deliverables mencakup 19 dokumen pada DOC-00 serta prototipe web, skema database, pengujian, dan paket serah terima yang masih direncanakan. Penerimaan proyek mensyaratkan sumber final direkonsiliasi, 16 UC tetap, 29 FR dan 14 NFR ditelusuri, 55 spesifikasi asli dipetakan, seluruh pemeriksaan wajib dieksekusi dengan bukti, serta keputusan UAT tercatat. Target perbaikan kuantitatif operasional: NEEDS BASELINE. Belum ada persetujuan mitra atau hasil penerimaan.

## Dependencies

| Dependensi | Kegunaan |
| --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | Indeks Induk Dokumentasi Pengembangan |
| [DOC-02](02_PROTOTYPING_DEVELOPMENT_PLAN.md) | Rencana Pengembangan Prototyping |
| [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md) | Dokumen Kebutuhan Produk |
| [DOC-04](04_SOFTWARE_REQUIREMENTS_SPECIFICATION.md) | Spesifikasi Kebutuhan Perangkat Lunak |
| [DOC-14](14_USER_ACCEPTANCE_TESTING.md) | Pengujian Penerimaan Pengguna |
| [DOC-15](15_REQUIREMENTS_TRACEABILITY.md) | Ketertelusuran Kebutuhan dan Pengendalian Perubahan |

## Open issues

Rincian baseline final belum tersedia; lihat register sumber dan keputusan terbuka pada DOC-00.

## Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1.0 | 2026-11-10 | Penyusunan berdasarkan SRC-01; celah sumber dicatat dan desain ditandai PROPOSED. | Belum ada bukti persetujuan |
| 0.2.0 | 2026-11-10 | Integrasi SRC-09 design.md: route, role, token, layar pendukung, metrik dan konflik desain; tetap NEEDS REVIEW. | Belum ada bukti persetujuan |
