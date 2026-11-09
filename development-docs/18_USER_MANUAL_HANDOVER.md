# Panduan Pengguna dan Serah Terima

## Identitas dan kendali dokumen

| Atribut | Nilai |
| --- | --- |
| Document ID | DOC-18 |
| Nama proyek | SIRIS — Capstone Project Kelompok 42 |
| Mitra | Warehouse PT Harina Chemicals Industry |
| Versi | 0.2.0 |
| Status dokumen | DRAFT — panduan rencana, belum manual operasional |
| Tanggal penyusunan | 2026-11-10 |
| Pemilik dokumen | Technical Documentation Specialist |
| Tujuan dokumen | Menyediakan panduan penggunaan yang direncanakan serta syarat serah terima. |
| Ruang lingkup | Website pendamping Erasoft; Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation. |

Ketentuan pengguna diberi rujukan **SRC-01**. Desain baru berstatus **PROPOSED**, bukan BASELINE APPROVED. Belum ada aplikasi, hasil pengujian runtime, evaluasi stakeholder, atau persetujuan rilis yang dibuktikan dalam workspace ini. Semua contoh adalah **UJI**.

## Daftar isi

1. Identitas dan kendali dokumen
2. Referensi
3. Status panduan dan pengenalan sistem
4. Prasyarat akses, role, dan navigasi
5. Panduan rencana UC-01 — Mengimpor Referensi Inbound
6. Panduan rencana UC-02 — Mengimpor Janji Supplier
7. Panduan rencana UC-03 — Mengimpor Data Penerimaan
8. Panduan rencana UC-04 — Memeriksa Exception Inbound
9. Panduan rencana UC-05 — Melihat Pemberitahuan Inbound
10. Panduan rencana UC-06 — Membaca Referensi Material WO
11. Panduan rencana UC-07 — Menelusuri Riwayat Inbound
12. Panduan rencana UC-08 — Melihat Metrik Supplier
13. Panduan rencana UC-09 — Mengimpor Data Stok
14. Panduan rencana UC-10 — Mengimpor Hasil Hitung Fisik
15. Panduan rencana UC-11 — Mengarsipkan Bukti Kartu Stok
16. Panduan rencana UC-12 — Menjalankan Rekonsiliasi Stok
17. Panduan rencana UC-13 — Menelusuri Riwayat Selisih Stok
18. Panduan rencana UC-14 — Melihat Metrik Persediaan
19. Panduan rencana UC-15 — Menelusuri Audit Proses
20. Panduan rencana UC-16 — Memvalidasi Data Impor
21. Preview, konfirmasi, dan pemulihan
22. Pesan umum dan penanganan
23. Batas sistem dan checklist serah terima
24. Known issues dan pending decisions
25. Dependencies
26. Open issues
27. Riwayat revisi

## Referensi

SRC-01: master prompt pengguna pada sesi penyusunan; SRC-02: `../AGENTS.md`. SRC-09: `../design.md` v1.0.0, kontrak desain untuk ditinjau yang tersedia pada pemeriksaan akhir; snapshot visual disertakan pada DOC-10. Register sumber lengkap, hierarki, dan sumber eksternal terdapat pada [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md). Rujukan antardokumen: [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md), [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md), [DOC-05](05_BUSINESS_RULES_RBAC.md), [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md), [DOC-10](10_UI_UX_PROTOTYPE_SPECIFICATION.md), [DOC-12](12_PROTOTYPE_ITERATION_FEEDBACK.md), [DOC-14](14_USER_ACCEPTANCE_TESTING.md), [DOC-17](17_DEPLOYMENT_OPERATIONAL_GUIDE.md).

## Status panduan dan pengenalan sistem

SIRIS adalah pendamping Erasoft untuk inbound dan rekonsiliasi persediaan. **Belum tersedia aplikasi yang dapat digunakan dalam repositori.** Bagian penggunaan di bawah adalah panduan rencana berdasarkan UC dan rancangan DOC-03/DOC-10, bukan klaim bahwa tombol/route telah diimplementasikan. Sebelum dibagikan sebagai manual operasional, cocokkan setiap langkah dengan versi prototipe, hak final dan bukti UAT. Tidak ada tindakan di luar 16 UC yang ditambahkan.

## Prasyarat akses, role, dan navigasi

Pengguna memerlukan akun internal yang diprovisikan tim berwenang, izin gudang dan sesi autentikasi. Supplier tidak mempunyai akun; tidak ada public registration. Purchasing, Warehouse, Production dan Management hanya melihat menu sesuai izin final. Navigasi rencana: Inbound, Persediaan, Audit. Periksa label gudang, mode ACTUAL/UJI dan cutoff sebelum membaca atau memproses data. Jangan menganggap dataset UJI sebagai data mitra. Logout mengikuti mekanisme teknis yang akan dipilih, tanpa UC tambahan.

## Panduan rencana UC-01 — Mengimpor Referensi Inbound

Peran rencana: Purchasing. Izin final mengikuti DOC-05 setelah disetujui.

Pilih referensi inbound, isi gudang/mode, pilih file EXPECTED. Jalankan validasi dan periksa requested date, material, supplier, kuantitas serta sumber. Konfirmasi hanya jika preview benar; simpan referensi batch hasil.

Hasil yang harus diperiksa: Referensi inbound committed atau laporan validasi. Rujukan layar: SCR-01 pada DOC-10.

## Panduan rencana UC-02 — Mengimpor Janji Supplier

Peran rencana: Purchasing. Izin final mengikuti DOC-05 setelah disetujui.

Pilih file COMMITMENT yang mengacu inbound tersedia. Periksa event INITIAL/CHANGE dan tanggal janji. Setelah commit, buka histori untuk memastikan tanggal kebutuhan tidak berubah.

Hasil yang harus diperiksa: Event janji immutable dan lineage. Rujukan layar: SCR-02 pada DOC-10.

## Panduan rencana UC-03 — Mengimpor Data Penerimaan

Peran rencana: Warehouse. Izin final mengikuti DOC-05 setelah disetujui.

Pilih file RECEIVING dan periksa inbound, jumlah, waktu dan penanda penutup. Penerimaan parsial tidak menutup inbound. Jangan menandai penutup tanpa bukti sah; finalisasi mengikuti aturan sumber yang disetujui.

Hasil yang harus diperiksa: Event penerimaan; status final terverifikasi atau tetap terbuka. Rujukan layar: SCR-03 pada DOC-10.

## Panduan rencana UC-04 — Memeriksa Exception Inbound

Peran rencana: Purchasing, Warehouse. Izin final mengikuti DOC-05 setelah disetujui.

Pilih gudang/mode/periode. Baca overdue terbuka secara terpisah dari delivery delay dan quantity mismatch final. Buka sumber sebelum menyimpulkan penyebab; sistem tidak menetapkan kesalahan supplier tanpa bukti.

Hasil yang harus diperiksa: Daftar delivery delay / quantity mismatch final dan daftar overdue terbuka terpisah. Rujukan layar: SCR-04 pada DOC-10.

## Panduan rencana UC-05 — Melihat Pemberitahuan Inbound

Peran rencana: Purchasing, Warehouse. Izin final mengikuti DOC-05 setelah disetujui.

Buka daftar pemberitahuan di aplikasi dan pilih kondisi terkait untuk ditelusuri. Pemberitahuan tidak dikirim melalui email, WhatsApp, SMS atau push otomatis.

Hasil yang harus diperiksa: Daftar pemberitahuan dalam aplikasi dengan asal data. Rujukan layar: SCR-05 pada DOC-10.

## Panduan rencana UC-06 — Membaca Referensi Material WO

Peran rencana: Purchasing, Production. Izin final mengikuti DOC-05 setelah disetujui.

Pilih referensi WO yang tersedia dan baca material, unit, kuantitas serta sumbernya. Fitur ini read-only; tidak menghitung BOM atau merencanakan produksi. Jika sumber tidak ada, tampilkan status sumber belum tersedia.

Hasil yang harus diperiksa: Referensi WO read-only; sumber dan waktu data. Rujukan layar: SCR-06 pada DOC-10.

## Panduan rencana UC-07 — Menelusuri Riwayat Inbound

Peran rencana: Purchasing, Warehouse. Izin final mengikuti DOC-05 setelah disetujui.

Pilih referensi inbound. Baca urutan INITIAL, CHANGE, penerimaan parsial dan penutup beserta sumber yang diizinkan. Histori tidak diedit dari halaman ini.

Hasil yang harus diperiksa: Urutan event INITIAL/CHANGE dan penerimaan beserta lineage yang diizinkan. Rujukan layar: SCR-07 pada DOC-10.

## Panduan rencana UC-08 — Melihat Metrik Supplier

Peran rencana: Purchasing, Management. Izin final mengikuti DOC-05 setelah disetujui.

Pilih konteks dan baca nilai beserta numerator/denominator/eksklusi jika formula telah disetujui. Denominator nol berarti tidak ada data eligible, bukan supplier berkinerja nol. Definisi tampilan mengikuti SRC-09 §6.6; eligibility final menunggu sumber analisis asli.

Hasil yang harus diperiksa: Nilai metrik, numerator, denominator, excluded_count dan reason. Rujukan layar: SCR-08 pada DOC-10.

## Panduan rencana UC-09 — Mengimpor Data Stok

Peran rencana: Warehouse. Izin final mengikuti DOC-05 setelah disetujui.

Unggah satu paket STOCK dengan saldo wajib dan dukungan opsional. Cocokkan system_quantity dengan QTY AKHIR dan cutoff. Jangan menjumlahkan kembali movement ke saldo. Preview lalu commit seluruh paket.

Hasil yang harus diperiksa: Snapshot stok; saldo digital; lineage komponen dukungan. Rujukan layar: SCR-09 pada DOC-10.

## Panduan rencana UC-10 — Mengimpor Hasil Hitung Fisik

Peran rencana: Warehouse. Izin final mengikuti DOC-05 setelah disetujui.

Unggah COUNT dengan konteks cutoff yang benar. Isi is_counted=true untuk item yang benar-benar dihitung; physical_quantity=0 hanya jika hasilnya nol. Item belum dihitung memakai false dan null. Periksa preview sebelum commit.

Hasil yang harus diperiksa: Sesi hitung; baris dihitung/belum dihitung; lineage. Rujukan layar: SCR-10 pada DOC-10.

## Panduan rencana UC-11 — Mengarsipkan Bukti Kartu Stok

Peran rencana: Warehouse. Izin final mengikuti DOC-05 setelah disetujui.

Pilih satu target sah sesuai aturan final; rancangan saat ini mengusulkan baris stok. Unggah PDF/JPG/PNG maksimal 5 MiB. Periksa metadata arsip. Unduh hanya jika diizinkan. File privat dan tidak diproses OCR.

Hasil yang harus diperiksa: evidence_id dan metadata aman; file tetap privat. Rujukan layar: SCR-11 pada DOC-10.

## Panduan rencana UC-12 — Menjalankan Rekonsiliasi Stok

Peran rencana: Warehouse. Izin final mengikuti DOC-05 setelah disetujui.

Pilih snapshot dan sesi hitung. Pastikan gudang, mode dan cutoff cocok; ACTUAL wajib VERIFIED. Jalankan rekonsiliasi; baca MATCHED/DISCREPANCY hanya pada pasangan valid. Status nonvalid memiliki variance kosong/null, bukan nol.

Hasil yang harus diperiksa: Run immutable dan baris status, variance nullable. Rujukan layar: SCR-12 pada DOC-10.

## Panduan rencana UC-13 — Menelusuri Riwayat Selisih Stok

Peran rencana: Warehouse, Management. Izin final mengikuti DOC-05 setelah disetujui.

Pilih run terdahulu melalui histori. Periksa waktu, versi aturan, snapshot/count dan hasil. Menjalankan rekonsiliasi baru tidak menghapus hasil sebelumnya.

Hasil yang harus diperiksa: Daftar run dan detail hasil historis. Rujukan layar: SCR-13 pada DOC-10.

## Panduan rencana UC-14 — Melihat Metrik Persediaan

Peran rencana: Warehouse, Management. Izin final mengikuti DOC-05 setelah disetujui.

Baca metrik dari run dan pasangan valid. Periksa denominator dan jumlah nonvalid secara terpisah. Tidak ada automatic stock adjustment atau penulisan hasil ke Erasoft.

Hasil yang harus diperiksa: Metrik pasangan valid dan jumlah nonvalid terpisah. Rujukan layar: SCR-14 pada DOC-10.

## Panduan rencana UC-15 — Menelusuri Audit Proses

Peran rencana: Warehouse. Izin final mengikuti DOC-05 setelah disetujui.

Gunakan filter aksi, outcome, waktu dan scope untuk menelusuri proses. Catat correlation_id ketika meminta bantuan. Management tidak dapat memperoleh raw file atau lokasi penyimpanan privat; akses halaman audit pada SRC-09 hanya Warehouse.

Hasil yang harus diperiksa: Event audit tersaring tanpa data privat terlarang. Rujukan layar: SCR-15 pada DOC-10.

## Panduan rencana UC-16 — Memvalidasi Data Impor

Peran rencana: Internal; mewarisi pengguna pemanggil. Izin final mengikuti DOC-05 setelah disetujui.

Validasi berjalan sebagai bagian kelima impor; pengguna tidak membuka halaman UC-16. Baca error/warning yang dikembalikan proses impor, perbaiki data sumber, lalu jalankan validasi ulang.

Hasil yang harus diperiksa: Laporan error/warning; fingerprint; preview dan expiry bila valid. Rujukan layar: Tidak ada layar tersendiri.

## Preview, konfirmasi, dan pemulihan

Urutan impor selalu staging → validasi → preview → konfirmasi → commit → audit. Preview berlaku 30 menit sejak validasi server; perubahan data/metadata membutuhkan preview baru. Selama preview domain belum berubah. Bila pengguna membatalkan, tidak ada commit. Bila jaringan putus saat commit, jangan berulang mengunggah dengan data berbeda; periksa status menggunakan mekanisme retry yang menjaga idempotency. Pada versi implementasi nanti, UI harus memfasilitasi pemulihan ini tanpa meminta pengguna mengelola key teknis sendiri.

## Pesan umum dan penanganan

| Pesan/kode | Arti | Tindakan pengguna |
| --- | --- | --- |
| MISSING_REFERENCE | Referensi belum sah pada mode/gudang | Periksa kode/sumber; hubungi penanggung jawab, jangan buat ACTUAL fiktif |
| PREVIEW_EXPIRED / PREVIEW_CHANGED | Preview tidak lagi cocok/berlaku | Validasi ulang dan periksa hasil baru |
| CUTOFF_MISMATCH / CUTOFF_UNVERIFIED | Konteks pembandingan belum memenuhi syarat | Pilih konteks cocok atau lengkapi bukti berwenang |
| MODE_MISMATCH | ACTUAL dan UJI berbeda | Pilih mode yang konsisten |
| NOT_COUNTED | Item belum dihitung | Jangan tafsirkan sebagai fisik nol |
| COUNT_MISSING / STOCK_MISSING | Salah satu sisi tidak ada | Telusuri kelengkapan sumber |
| UOM_MISMATCH | Unit kedua sisi berbeda | Periksa sumber; tidak ada konversi otomatis |
| FORBIDDEN | Aksi/scope tidak diizinkan | Hubungi penanggung jawab akses |
| TRANSACTION_FAILED | Operasi tidak selesai | Catat correlation_id; gunakan pemulihan yang disediakan |

## Batas sistem dan checklist serah terima

Batas sistem: ERP replacement; integrasi langsung database/API Erasoft; Erasoft writeback; Purchase Order Management baru; supplier portal; public registration; OCR; real-time ERP synchronization; automatic stock adjustment; production planning/MRP; BOM calculation; picking; accounting module; corrective action workflow otomatis; email, WhatsApp, SMS atau push notification otomatis; analitik di luar baseline.

Checklist berikut belum dinyatakan terpenuhi.
| Item handover | Pemilik | Status / bukti |
| --- | --- | --- |
| Sumber final dan mapping 29 FR/14 NFR/55 pengujian | Requirements + QA | SOURCE REQUIRED |
| Source code, artifact dan versi release | Development Lead | Belum tersedia |
| Schema, migration, seed dan data dictionary | Database Architect | Rancangan PROPOSED |
| API dan UI sesuai implementasi | Backend/Frontend | NOT IMPLEMENTED |
| Laporan QA/NFR dan keputusan UAT | QA + reviewer berwenang | NOT RUN / belum diterima |
| Runbook, backup/restore dan akses operasional aman | Lead/Operations | NOT EXECUTED |
| Manual sesuai versi dan pelatihan pengguna | Dokumentasi/BA | Belum divalidasi pada aplikasi |
| Known issues dan pending decisions | Seluruh tim | OD-01–OD-10 pada DOC-00 |
| Bukti penyerahan dan persetujuan | Pihak berwenang proyek | Belum tersedia |

## Known issues dan pending decisions

Kesenjangan saat ini bukan defect aplikasi yang telah diuji: belum ada source code, sumber final, data operasional, target NFR, atau keputusan hosting/autentikasi. Role-to-feature, route, schema dan endpoint masih usulan. Daftar keputusan lengkap DOC-00. Setelah implementasi tersedia, revisi manual dengan tangkapan layar aktual dan hasil UAT; jangan menggunakan mockup sebagai bukti penerimaan.

## Dependencies

| Dependensi | Kegunaan |
| --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | Indeks Induk Dokumentasi Pengembangan |
| [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md) | Dokumen Kebutuhan Produk |
| [DOC-05](05_BUSINESS_RULES_RBAC.md) | Spesifikasi Aturan Bisnis dan RBAC |
| [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md) | Kontrak Data, Pemetaan Impor, dan Validasi |
| [DOC-10](10_UI_UX_PROTOTYPE_SPECIFICATION.md) | Spesifikasi Prototipe UI/UX |
| [DOC-12](12_PROTOTYPE_ITERATION_FEEDBACK.md) | Catatan Iterasi, Review, dan Feedback Prototipe |
| [DOC-14](14_USER_ACCEPTANCE_TESTING.md) | Pengujian Penerimaan Pengguna |
| [DOC-17](17_DEPLOYMENT_OPERATIONAL_GUIDE.md) | Panduan Deployment dan Operasional |

## Open issues

Rincian baseline final belum tersedia; lihat register sumber dan keputusan terbuka pada DOC-00.

## Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1.0 | 2026-11-10 | Penyusunan berdasarkan SRC-01; celah sumber dicatat dan desain ditandai PROPOSED. | Belum ada bukti persetujuan |
| 0.2.0 | 2026-11-10 | Integrasi SRC-09 design.md: route, role, token, layar pendukung, metrik dan konflik desain; tetap NEEDS REVIEW. | Belum ada bukti persetujuan |
