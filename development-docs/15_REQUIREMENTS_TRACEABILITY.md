# Ketertelusuran Kebutuhan dan Pengendalian Perubahan

## Identitas dan kendali dokumen

| Atribut | Nilai |
| --- | --- |
| Document ID | DOC-15 |
| Nama proyek | SIRIS — Capstone Project Kelompok 42 |
| Mitra | Warehouse PT Harina Chemicals Industry |
| Versi | 0.2.0 |
| Status dokumen | DRAFT — NEEDS REVIEW |
| Tanggal penyusunan | 2026-11-10 |
| Pemilik dokumen | Requirements Engineer |
| Tujuan dokumen | Melacak sumber ke desain dan pengujian tanpa hubungan rekaan. |
| Ruang lingkup | Website pendamping Erasoft; Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation. |

Ketentuan pengguna diberi rujukan **SRC-01**. Desain baru berstatus **PROPOSED**, bukan BASELINE APPROVED. Belum ada aplikasi, hasil pengujian runtime, evaluasi stakeholder, atau persetujuan rilis yang dibuktikan dalam workspace ini. Semua contoh adalah **UJI**.

## Daftar isi

1. Identitas dan kendali dokumen
2. Referensi
3. Tujuan, versi baseline, dan aturan mapping
4. Matriks requirement ke implementasi dan pengujian
5. Ketertelusuran UC ke desain PROPOSED
6. Uncovered requirements dan dependency UML
7. Prosedur change request
8. Contoh analisis dampak, bukan change request aktual
9. Approval status dan revisi baseline
10. Rekonsiliasi sumber baru SRC-09 dan konflik terbuka
11. Dependencies
12. Open issues
13. Riwayat revisi

## Referensi

SRC-01: master prompt pengguna pada sesi penyusunan; SRC-02: `../AGENTS.md`. SRC-09: `../design.md` v1.0.0, kontrak desain untuk ditinjau yang tersedia pada pemeriksaan akhir; snapshot visual disertakan pada DOC-10. Register sumber lengkap, hierarki, dan sumber eksternal terdapat pada [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md). Rujukan antardokumen: [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md), [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md), [DOC-04](04_SOFTWARE_REQUIREMENTS_SPECIFICATION.md), [DOC-06](06_SOFTWARE_ARCHITECTURE_DESIGN.md), [DOC-07](07_DATABASE_DESIGN.md), [DOC-09](09_API_SPECIFICATION.md), [DOC-10](10_UI_UX_PROTOTYPE_SPECIFICATION.md), [DOC-11](11_DEVELOPMENT_BACKLOG_WBS.md), [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md), [DOC-14](14_USER_ACCEPTANCE_TESTING.md), [DOC-16](16_SECURITY_RISK_NFR.md).

## Tujuan, versi baseline, dan aturan mapping

Versi paket dokumentasi adalah 0.1.0; versi SRS final tidak diketahui. SRC-01 menetapkan jumlah dan UC, tetapi bukan ID/isi 29 FR serta 14 NFR. Mapping hanya diisi jika didukung kutipan sumber atau desain yang eksplisit PROPOSED. Tidak boleh menyamakan satu FR dengan satu UC atau satu test hanya agar tabel penuh.

## Matriks requirement ke implementasi dan pengujian

Seluruh baris berikut mewakili slot kebutuhan sumber. Nilai SOURCE REQUIRED bukan bukti coverage; status implementasi tidak diketahui dari baseline dan tidak ada kode pada repositori saat penyusunan.
| FR/NFR ID | UC ID | Feature | UI Screen | Backend/API | Database | Test Case | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SOURCE REQUIRED (FR slot 01) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 02) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 03) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 04) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 05) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 06) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 07) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 08) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 09) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 10) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 11) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 12) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 13) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 14) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 15) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 16) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 17) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 18) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 19) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 20) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 21) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 22) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 23) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 24) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 25) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 26) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 27) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 28) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (FR slot 29) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (NFR slot 01) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (NFR slot 02) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (NFR slot 03) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (NFR slot 04) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (NFR slot 05) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (NFR slot 06) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (NFR slot 07) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (NFR slot 08) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (NFR slot 09) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (NFR slot 10) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (NFR slot 11) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (NFR slot 12) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (NFR slot 13) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |
| SOURCE REQUIRED (NFR slot 14) | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | UNMAPPED; sumber belum tersedia |

## Ketertelusuran UC ke desain PROPOSED

Hubungan berikut bersumber dari daftar UC dan perilaku SRC-01 yang diperinci pada DOC-03. Ini membantu implementasi usulan, tetapi tidak menutup gap pemetaan FR/NFR.
| UC | Feature | UI Screen | Backend/API | Database | Skenario turunan | Dasar / status |
| --- | --- | --- | --- | --- | --- | --- |
| UC-01 | FEAT-01 | SCR-01 | API-01, API-02, API-03, API-04, API-05, API-21 | inbound_references | PVT-01, PVT-03, PVT-04, PVT-11, PVT-12, PVT-15, PVT-21, PVT-22 | SRC-01 → DOC-03 → desain PROPOSED |
| UC-02 | FEAT-02 | SCR-02 | API-01, API-02, API-03, API-04, API-05, API-21 | commitment_events | PVT-02, PVT-16 | SRC-01 → DOC-03 → desain PROPOSED |
| UC-03 | FEAT-03 | SCR-03 | API-01, API-02, API-03, API-04, API-05, API-21 | receiving_events | PVT-06, PVT-07, PVT-23 | SRC-01 → DOC-03 → desain PROPOSED |
| UC-04 | FEAT-04 | SCR-04 | API-06 | inbound_references, commitment_events, receiving_events | PVT-06, PVT-07, PVT-23 | SRC-01 → DOC-03 → desain PROPOSED |
| UC-05 | FEAT-05 | SCR-05 | API-07 | inbound_references, commitment_events, receiving_events | Skenario UAT sesuai peran; baseline SOURCE REQUIRED | SRC-01 → DOC-03 → desain PROPOSED |
| UC-06 | FEAT-06 | SCR-06 | API-08, API-21 | wo_references | Skenario UAT sesuai peran; baseline SOURCE REQUIRED | SRC-01 → DOC-03 → desain PROPOSED |
| UC-07 | FEAT-07 | SCR-07 | API-09 | inbound_references, commitment_events, receiving_events | PVT-16 | SRC-01 → DOC-03 → desain PROPOSED |
| UC-08 | FEAT-08 | SCR-08 | API-10, API-21 | inbound_references, commitment_events, receiving_events | PVT-13 | SRC-01 → DOC-03 → desain PROPOSED |
| UC-09 | FEAT-09 | SCR-09 | API-01, API-02, API-03, API-04, API-05, API-11, API-21, API-22 | stock_snapshots, stock_lines, stock_support_rows | PVT-11, PVT-17 | SRC-01 → DOC-03 → desain PROPOSED |
| UC-10 | FEAT-10 | SCR-10 | API-01, API-02, API-03, API-04, API-05, API-12, API-21 | count_sessions, count_lines | PVT-08 | SRC-01 → DOC-03 → desain PROPOSED |
| UC-11 | FEAT-11 | SCR-11 | API-17, API-18, API-19, API-21, API-22 | evidence | PVT-05, PVT-19 | SRC-01 → DOC-03 → desain PROPOSED |
| UC-12 | FEAT-12 | SCR-12 | API-13, API-14, API-21, API-22 | reconciliation_runs, reconciliation_lines | PVT-08, PVT-09, PVT-10, PVT-12, PVT-14, PVT-17, PVT-18, PVT-20, PVT-22 | SRC-01 → DOC-03 → desain PROPOSED |
| UC-13 | FEAT-13 | SCR-13 | API-14, API-15 | reconciliation_runs, reconciliation_lines | PVT-20 | SRC-01 → DOC-03 → desain PROPOSED |
| UC-14 | FEAT-14 | SCR-14 | API-16, API-21 | reconciliation_runs, reconciliation_lines | PVT-13 | SRC-01 → DOC-03 → desain PROPOSED |
| UC-15 | FEAT-15 | SCR-15 | API-20, API-21 | audit_events | PVT-05, PVT-21, PVT-22 | SRC-01 → DOC-03 → desain PROPOSED |
| UC-16 | FEAT-16 | Internal, tidak ada halaman | API-02 | import_batches, staging_rows, validation_issues | PVT-01, PVT-02, PVT-03, PVT-04, PVT-15 | SRC-01 → DOC-03 → desain PROPOSED |

## Uncovered requirements dan dependency UML

29 FR serta 14 NFR belum dapat dinyatakan tercakup implementasi atau pengujian karena identitas/statement sumber belum tersedia. Daftar 55 pengujian juga belum dapat dibandingkan. Activity/Sequence/Class final dan hubungan FR–UC menunggu DESAIN-42-1.1/REVISI-UML-42-1.2. Revisi 1.2 yang hanya mengganti Activity, Sequence, Class tidak menghapus bagian lain desain 1.1. BPMN AS-IS/TO-BE tidak dibuat ulang; hubungan ke baseline tersebut SOURCE REQUIRED.

## Prosedur change request

1. Catat CR-<nomor>, pemohon, alasan, sumber, versi asal dan bagian berubah.
2. Bedakan koreksi redaksi, defect implementasi, klarifikasi sumber, dan perubahan scope.
3. Analisis dampak FR/NFR/UC/BR, entitas, API, UI, test, backlog, fixture dan manual.
4. Ajukan ke pemilik baseline/pihak berwenang yang ditentukan proyek; tim tidak mengasumsikan pemberi persetujuan.
5. Rekam approve/reject/defer beserta bukti. Scope tetap terkunci sampai approve.
6. Perbarui semua artefak terdampak sebagai satu set versi; pertahankan riwayat.
7. Jalankan regresi relevan, lampirkan hasil aktual, lalu review konsistensi kembali.

## Contoh analisis dampak, bukan change request aktual

| Perubahan hipotetis | Artefak terdampak | Regresi | Keputusan saat ini |
| --- | --- | --- | --- |
| Aturan penutup receiving diperjelas oleh sumber final | DOC-03, DOC-05–DOC-09, DOC-13, DOC-18 | PVT-06, PVT-07, PVT-23 dan baseline terkait | Belum ada CR aktual |
| Mapping header COUNT berubah | DOC-07–DOC-10, DOC-13, DOC-17 | Null/zero, fingerprint, rollback, idempotency | Belum ada CR aktual |
| Izin role diperbaiki mengikuti sumber | DOC-03, DOC-05, DOC-09, DOC-10, DOC-14, DOC-18 | Direct endpoint, gudang, download, proyeksi response | Belum ada CR aktual |

## Approval status dan revisi baseline

Tidak ada baseline baru yang dinyatakan APPROVED. Untuk membekukan paket berikutnya, simpan daftar versi/hash sumber, mapping lengkap, temuan terbuka, reviewer, dan bukti keputusan. Perubahan redaksi menaikkan patch; perluasan desain usulan minor; perubahan kontrak breaking atau baseline yang disetujui major. Nomor versi bukan bukti approval.

## Rekonsiliasi sumber baru SRC-09 dan konflik terbuka

| ID | Bagian bertentangan / gap | Konsekuensi dan penanganan | Status |
| --- | --- | --- | --- |
| CF-01 | Route dan token usulan awal DOC-10 vs SRC-09 | Gunakan route dan registry SRC-09 sebagai sumber draft; batalkan palette paralel | Diterapkan pada DOC-10; approval final tetap belum tersedia |
| CF-02 | Audit role awal Purchasing/Warehouse/Management; SRC-09 hanya Warehouse. Notices tidak untuk Production; WO untuk Purchasing/Production | Selaraskan draft view role dengan SRC-09; backend tetap NEEDS REVIEW sampai RBAC final | DOC-03, DOC-05, DOC-09, DOC-10, DOC-11, DOC-14, DOC-18 diperbarui |
| CF-03 | Evidence target usulan stock_line vs SRC-09 snapshot ATAU count | Target final belum dapat ditetapkan dari SRS; jangan implementasikan kontrak target sampai diputuskan | OPEN DECISION; schema/API stock_line tetap usulan yang ditahan, alternatif source dijelaskan DOC-07–DOC-09 |
| CF-04 | Cutoff usulan timestamptz vs SRC-09 DATE/DATETIME, basis, precision dan UJI SIMULATED | Perlu kontrak cutoff yang tidak memalsukan jam untuk DATE | OPEN DECISION; implementasi ACTUAL/cutoff ditahan sampai OD-05 selesai |
| CF-05 | Run baru pada key berbeda vs SRC-09 reuse fingerprint identik | Makna identik harus disepakati lintas key dan source/rule version | OPEN DECISION; tidak mengeksekusi PVT-20 sebelum keputusan |
| CF-06 | Tanggal/quantity minimal usulan EXPECTED >=0 vs SRC-09 requested quantity >0; event sequence dan previous date belum dirancang | Preserve sumber tanpa menganggap constraint baru approved | OPEN DECISION; validasi source kontrak perlu dilengkapi |
| CF-07 | Backend PREVIEW_READY vs UI VALID/PREVIEW; backend FAILURE/DENIED vs sumber FAILED | Presentation state dipetakan ke domain; label outcome perlu mapping eksplisit | PROPOSED mapping DOC-09; tidak mengganti status domain diam-diam |
| CF-08 | Kolom metrik/cutoff/evidence/commitment pada SRC-09 lebih lengkap daripada DTO/skema awal | Jangan memalsukan data agar layar penuh; tandai field yang belum dikontrak | OPEN DECISION; gap contract DOC-09 dan DOC-10 |
| CF-09 | Sumber mengklaim inspeksi SIRIS_Prototype.html/analisis fitur terdahulu yang tidak ada di workspace | Perlakukan sebagai atribusi sumber, bukan bukti pemeriksaan agen ini | SOURCE REQUIRED untuk file/bukti asli |

SRC-09 tersedia pada pemeriksaan akhir, setelah draft awal disusun. Tidak ada bukti bahwa kontrak desain ini mengganti SRS final atau memberi persetujuan scope. Karena itu rincian domain yang bertentangan ditahan sebagai OPEN DECISION; hanya route, token dan pemetaan view role yang diselaraskan pada level draft. File sumber asli tidak diubah.

## Dependencies

| Dependensi | Kegunaan |
| --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | Indeks Induk Dokumentasi Pengembangan |
| [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md) | Dokumen Kebutuhan Produk |
| [DOC-04](04_SOFTWARE_REQUIREMENTS_SPECIFICATION.md) | Spesifikasi Kebutuhan Perangkat Lunak |
| [DOC-06](06_SOFTWARE_ARCHITECTURE_DESIGN.md) | Arsitektur Perangkat Lunak dan Desain Terperinci |
| [DOC-07](07_DATABASE_DESIGN.md) | Desain Database, ERD, IRD, dan Kamus Data |
| [DOC-09](09_API_SPECIFICATION.md) | Spesifikasi REST API |
| [DOC-10](10_UI_UX_PROTOTYPE_SPECIFICATION.md) | Spesifikasi Prototipe UI/UX |
| [DOC-11](11_DEVELOPMENT_BACKLOG_WBS.md) | Backlog Pengembangan, WBS, dan Rencana Implementasi |
| [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md) | Rencana dan Spesifikasi Kasus Pengujian |
| [DOC-14](14_USER_ACCEPTANCE_TESTING.md) | Pengujian Penerimaan Pengguna |
| [DOC-16](16_SECURITY_RISK_NFR.md) | Keamanan, Risiko, dan Verifikasi NFR |

## Open issues

Rincian baseline final belum tersedia; lihat register sumber dan keputusan terbuka pada DOC-00.

## Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1.0 | 2026-11-10 | Penyusunan berdasarkan SRC-01; celah sumber dicatat dan desain ditandai PROPOSED. | Belum ada bukti persetujuan |
| 0.2.0 | 2026-11-10 | Integrasi SRC-09 design.md: route, role, token, layar pendukung, metrik dan konflik desain; tetap NEEDS REVIEW. | Belum ada bukti persetujuan |
