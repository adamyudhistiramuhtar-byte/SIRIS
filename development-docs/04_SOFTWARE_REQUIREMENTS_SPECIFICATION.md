# Spesifikasi Kebutuhan Perangkat Lunak

## Identitas dan kendali dokumen

| Atribut | Nilai |
| --- | --- |
| Document ID | DOC-04 |
| Nama proyek | SIRIS — Capstone Project Kelompok 42 |
| Mitra | Warehouse PT Harina Chemicals Industry |
| Versi | 0.2.0 |
| Status dokumen | DRAFT — NEEDS REVIEW |
| Tanggal penyusunan | 2026-11-10 |
| Pemilik dokumen | Requirements Engineer |
| Tujuan dokumen | Menjaga baseline kebutuhan tanpa mengarang isi yang hilang. |
| Ruang lingkup | Website pendamping Erasoft; Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation. |

Ketentuan pengguna diberi rujukan **SRC-01**. Desain baru berstatus **PROPOSED**, bukan BASELINE APPROVED. Belum ada aplikasi, hasil pengujian runtime, evaluasi stakeholder, atau persetujuan rilis yang dibuktikan dalam workspace ini. Semua contoh adalah **UJI**.

## Daftar isi

1. Identitas dan kendali dokumen
2. Referensi
3. Pendahuluan dan perspektif produk
4. Lingkungan, karakteristik pengguna, dan batasan
5. Register 29 FR dan 14 NFR
6. Register FR
7. Register NFR
8. Ketentuan yang diketahui dan kondisi penerimaan
9. Antarmuka eksternal, data, dan keamanan
10. Prosedur melengkapi baseline dan acceptance conditions
11. Dependencies
12. Open issues
13. Riwayat revisi

## Referensi

SRC-01: master prompt pengguna pada sesi penyusunan; SRC-02: `../AGENTS.md`. SRC-09: `../design.md` v1.0.0, kontrak desain untuk ditinjau yang tersedia pada pemeriksaan akhir; snapshot visual disertakan pada DOC-10. Register sumber lengkap, hierarki, dan sumber eksternal terdapat pada [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md). Rujukan antardokumen: [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md), [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md), [DOC-05](05_BUSINESS_RULES_RBAC.md), [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md), [DOC-15](15_REQUIREMENTS_TRACEABILITY.md), [DOC-16](16_SECURITY_RISK_NFR.md).

## Pendahuluan dan perspektif produk

SRS ini menjaga kebutuhan yang telah diberikan dan menyediakan register pemulihan baseline. Prinsip penulisan kebutuhan mengacu secara proporsional pada [ISO/IEC/IEEE 29148:2018](https://www.iso.org/standard/72089.html): kebutuhan harus dapat ditelusuri dan diverifikasi. Teks standar penuh dan kepatuhan seluruh klausul belum diaudit. Isi FR/NFR final tidak tersedia sehingga tidak diturunkan secara paksa menjadi 29 atau 14 butir baru.

## Lingkungan, karakteristik pengguna, dan batasan

Aplikasi web client–server menggunakan Vue 3, Node.js/Express.js, PostgreSQL, REST API. Versi runtime, browser target, autentikasi, ORM, hosting dan storage belum diputuskan. Empat role adalah pengguna internal; Supplier tidak memiliki akun. Autentikasi/logout merupakan dukungan teknis, bukan UC baru. Karakteristik literasi digital dan perangkat mitra: SOURCE REQUIRED.

## Register 29 FR dan 14 NFR

Jumlah berasal dari SRC-01. Kolom **Slot** adalah nomor administratif untuk memastikan tidak ada kebutuhan hilang ketika dokumen diterima; **bukan ID requirement**. Seluruh ID asli, judul, statement, rationale, source rinci, priority, related UC, precondition, verification method, dan acceptance criteria berstatus SOURCE REQUIRED. Tidak boleh menggunakan nomor slot sebagai FR/NFR produksi.

## Register FR

| Slot administratif | Requirement ID asli | Judul / statement / rationale | Source / priority / related UC | Preconditions | Verification method / acceptance criteria | Status |
| --- | --- | --- | --- | --- | --- | --- |
| FR slot 01 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 02 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 03 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 04 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 05 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 06 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 07 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 08 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 09 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 10 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 11 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 12 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 13 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 14 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 15 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 16 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 17 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 18 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 19 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 20 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 21 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 22 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 23 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 24 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 25 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 26 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 27 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 28 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| FR slot 29 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |

## Register NFR

| Slot administratif | Requirement ID asli | Judul / statement / rationale | Source / priority / related UC | Preconditions | Verification method / acceptance criteria | Status |
| --- | --- | --- | --- | --- | --- | --- |
| NFR slot 01 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| NFR slot 02 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| NFR slot 03 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| NFR slot 04 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| NFR slot 05 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| NFR slot 06 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| NFR slot 07 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| NFR slot 08 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| NFR slot 09 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| NFR slot 10 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| NFR slot 11 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| NFR slot 12 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| NFR slot 13 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |
| NFR slot 14 | SOURCE REQUIRED | SOURCE REQUIRED | SRS final / SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum dapat dinilai |

## Ketentuan yang diketahui dan kondisi penerimaan

Ketentuan berikut berasal langsung dari SRC-01 dan diidentifikasi sebagai BR, bukan sebagai pengganti FR/NFR. Rincian perilaku tiap UC ada pada DOC-03; katalog lengkap terdapat pada DOC-05. Status keterlacakan requirement tetap terbuka.
| Area | Ketentuan | Cara verifikasi |
| --- | --- | --- |
| Impor | 5 jenis, staging/preview 30 menit/konfirmasi/commit atomik/idempotency | Uji batch valid, expired, konkurensi, rollback, retry |
| Inbound | Tanggal kebutuhan tetap; INITIAL/CHANGE; parsial/final; dua jenis exception | Uji kronologi event dan finalisasi sah |
| Inventory | QTY AKHIR, null≠0, konteks cocok, ACTUAL VERIFIED, variance hanya valid | Uji tabel keputusan DOC-08 |
| Evidence dan akses | Tipe dan ukuran dibatasi; privat; satu target; role+gudang | Uji upload dan akses langsung backend |
| Audit | Sukses/gagal/batal tertelusur | Inspeksi event audit dan keterkaitan operasi |

## Antarmuka eksternal, data, dan keamanan

| Antarmuka | Kebutuhan yang tersedia | Rincian belum tersedia |
| --- | --- | --- |
| Web pengguna | Bahasa Indonesia; role/gudang; UI DOC-10 | Route dari SRC-09 tersedia; status persetujuan final belum tersedia |
| REST API | Kontrak konsisten, validasi backend, response tanpa lokasi privat | Endpoint final; DOC-09 PROPOSED |
| File impor | Raw, normalized, metadata dan lineage; lima jenis impor | Header/sheet/format asli DOC-08 |
| Erasoft | Sumber referensi melalui data yang disediakan; tanpa integrasi langsung | Mekanisme penyiapan file di luar SIRIS |
| Evidence | PDF/JPG/PNG maksimal 5 MiB; tidak OCR | Target final dan retensi |
| Database | Pemisahan mode dan konteks; commit atomik | Schema final DOC-07 PROPOSED |

## Prosedur melengkapi baseline dan acceptance conditions

Requirements Engineer menyalin kebutuhan dari dokumen final beserta nomor halaman dan versi, mempertahankan ID persis, lalu mengganti slot dengan record aslinya. QA memeriksa statement tunggal, kondisi awal, keluaran, dan cara verifikasi. Konflik dengan SRC-01 dicatat melalui DOC-15; tidak diselesaikan diam-diam. SRS siap dibekukan hanya jika 29 FR dan 14 NFR teridentifikasi, mapping UC berdasar sumber, target NFR diketahui, dan pemilik baseline menyetujui. Saat ini kondisi tersebut belum terpenuhi.

## Dependencies

| Dependensi | Kegunaan |
| --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | Indeks Induk Dokumentasi Pengembangan |
| [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md) | Dokumen Kebutuhan Produk |
| [DOC-05](05_BUSINESS_RULES_RBAC.md) | Spesifikasi Aturan Bisnis dan RBAC |
| [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md) | Rencana dan Spesifikasi Kasus Pengujian |
| [DOC-15](15_REQUIREMENTS_TRACEABILITY.md) | Ketertelusuran Kebutuhan dan Pengendalian Perubahan |
| [DOC-16](16_SECURITY_RISK_NFR.md) | Keamanan, Risiko, dan Verifikasi NFR |

## Open issues

Rincian baseline final belum tersedia; lihat register sumber dan keputusan terbuka pada DOC-00.

## Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1.0 | 2026-11-10 | Penyusunan berdasarkan SRC-01; celah sumber dicatat dan desain ditandai PROPOSED. | Belum ada bukti persetujuan |
| 0.2.0 | 2026-11-10 | Integrasi SRC-09 design.md: route, role, token, layar pendukung, metrik dan konflik desain; tetap NEEDS REVIEW. | Belum ada bukti persetujuan |
