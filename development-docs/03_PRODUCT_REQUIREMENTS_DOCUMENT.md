# Dokumen Kebutuhan Produk

## Identitas dan kendali dokumen

| Atribut | Nilai |
| --- | --- |
| Document ID | DOC-03 |
| Nama proyek | SIRIS — Capstone Project Kelompok 42 |
| Mitra | Warehouse PT Harina Chemicals Industry |
| Versi | 0.2.0 |
| Status dokumen | DRAFT — NEEDS REVIEW |
| Tanggal penyusunan | 2026-11-10 |
| Pemilik dokumen | Business Analyst |
| Tujuan dokumen | Menjelaskan perilaku 16 fitur untuk pengguna dan pengembang. |
| Ruang lingkup | Website pendamping Erasoft; Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation. |

Ketentuan pengguna diberi rujukan **SRC-01**. Desain baru berstatus **PROPOSED**, bukan BASELINE APPROVED. Belum ada aplikasi, hasil pengujian runtime, evaluasi stakeholder, atau persetujuan rilis yang dibuktikan dalam workspace ini. Semua contoh adalah **UJI**.

## Daftar isi

1. Identitas dan kendali dokumen
2. Referensi
3. Gambaran produk, pengguna, dan sasaran
4. Inventaris fitur dan prioritas
5. UC-01 — Mengimpor Referensi Inbound
6. UC-02 — Mengimpor Janji Supplier
7. UC-03 — Mengimpor Data Penerimaan
8. UC-04 — Memeriksa Exception Inbound
9. UC-05 — Melihat Pemberitahuan Inbound
10. UC-06 — Membaca Referensi Material WO
11. UC-07 — Menelusuri Riwayat Inbound
12. UC-08 — Melihat Metrik Supplier
13. UC-09 — Mengimpor Data Stok
14. UC-10 — Mengimpor Hasil Hitung Fisik
15. UC-11 — Mengarsipkan Bukti Kartu Stok
16. UC-12 — Menjalankan Rekonsiliasi Stok
17. UC-13 — Menelusuri Riwayat Selisih Stok
18. UC-14 — Melihat Metrik Persediaan
19. UC-15 — Menelusuri Audit Proses
20. UC-16 — Memvalidasi Data Impor
21. Metrik keberhasilan dan penerimaan produk
22. Di luar ruang lingkup
23. Definisi metrik dari SRC-09 dan batas verifikasi
24. Dependencies
25. Open issues
26. Riwayat revisi

## Referensi

SRC-01: master prompt pengguna pada sesi penyusunan; SRC-02: `../AGENTS.md`. SRC-09: `../design.md` v1.0.0, kontrak desain untuk ditinjau yang tersedia pada pemeriksaan akhir; snapshot visual disertakan pada DOC-10. Register sumber lengkap, hierarki, dan sumber eksternal terdapat pada [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md). Rujukan antardokumen: [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md), [DOC-01](01_PROJECT_CHARTER_SCOPE.md), [DOC-04](04_SOFTWARE_REQUIREMENTS_SPECIFICATION.md), [DOC-05](05_BUSINESS_RULES_RBAC.md), [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md), [DOC-09](09_API_SPECIFICATION.md), [DOC-10](10_UI_UX_PROTOTYPE_SPECIFICATION.md), [DOC-14](14_USER_ACCEPTANCE_TESTING.md).

## Gambaran produk, pengguna, dan sasaran

SIRIS menyediakan pemeriksaan berbasis sumber untuk inbound dan persediaan. Sasaran produk adalah menjelaskan hasil melalui data yang sah, bukan menggantikan Erasoft atau mengotomatisasi koreksi transaksi. Pengguna internal: Purchasing, Warehouse, Production, Management. Kebutuhan tiap stakeholder mengikuti DOC-01; hak rinci berikut PROPOSED sampai OD-04 selesai. Prioritas adalah urutan pembangunan, bukan pengurangan scope.

## Inventaris fitur dan prioritas

| Feature ID | UC | Nama | Prioritas usulan | Dependensi |
| --- | --- | --- | --- | --- |
| FEAT-01 | UC-01 | Mengimpor Referensi Inbound | P0 | Referensi gudang/material; UC-16 |
| FEAT-02 | UC-02 | Mengimpor Janji Supplier | P0 | UC-01, UC-16 |
| FEAT-03 | UC-03 | Mengimpor Data Penerimaan | P0 | UC-01, UC-16; kontrak finalisasi |
| FEAT-04 | UC-04 | Memeriksa Exception Inbound | P1 | UC-01, UC-02, UC-03 |
| FEAT-05 | UC-05 | Melihat Pemberitahuan Inbound | P1 | UC-04; aturan pemberitahuan final |
| FEAT-06 | UC-06 | Membaca Referensi Material WO | P1 | Sumber referensi WO tersedia; OD-05 |
| FEAT-07 | UC-07 | Menelusuri Riwayat Inbound | P1 | UC-01, UC-02, UC-03 |
| FEAT-08 | UC-08 | Melihat Metrik Supplier | P1 | UC-01–UC-04; OD-06 |
| FEAT-09 | UC-09 | Mengimpor Data Stok | P0 | Referensi material/UOM/cutoff; UC-16 |
| FEAT-10 | UC-10 | Mengimpor Hasil Hitung Fisik | P0 | Referensi material/UOM/cutoff; UC-16 |
| FEAT-11 | UC-11 | Mengarsipkan Bukti Kartu Stok | P1 | Target sah tersedia; OD-08 |
| FEAT-12 | UC-12 | Menjalankan Rekonsiliasi Stok | P0 | UC-09, UC-10 |
| FEAT-13 | UC-13 | Menelusuri Riwayat Selisih Stok | P1 | UC-12 |
| FEAT-14 | UC-14 | Melihat Metrik Persediaan | P1 | UC-12 |
| FEAT-15 | UC-15 | Menelusuri Audit Proses | P1 | Audit ditulis sejak fondasi |
| FEAT-16 | UC-16 | Memvalidasi Data Impor | P0 | Lima adaptor dan referensi tervalidasi |

## UC-01 — Mengimpor Referensi Inbound

| Elemen | Spesifikasi |
| --- | --- |
| Feature ID | FEAT-01 |
| Use Case ID | UC-01 |
| Nama fitur | Mengimpor Referensi Inbound |
| Tujuan / WHY | Menetapkan referensi kebutuhan inbound yang dapat ditelusuri. |
| Actor / WHO | Purchasing — pemetaan PROPOSED |
| Trigger / WHEN | Pengguna memulai tugas mengimpor referensi inbound |
| Preconditions | Sesi terautentikasi; izin role/gudang; mode eksplisit; dependensi tersedia. UC-16 juga mensyaratkan batch staging. |
| User flow dan system flow / HOW | N1 Pengguna memilih jenis impor, gudang, mode dan file. N2 Sistem menyimpan staging. N3 Sistem memanggil UC-16 dan menampilkan preview. N4 Pengguna memeriksa lalu mengonfirmasi. N5 Sistem memeriksa ulang fingerprint, expiry, izin dan referensi lalu commit atomik. N6 Sistem menampilkan hasil dan audit. |
| Input | File EXPECTED; gudang; mode; referensi sumber. |
| Output / WHAT | Referensi inbound committed atau laporan validasi. |
| Business rules | BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-01, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Alternative / exception flows | A-1 pada N4: pengguna membatalkan; sistem menutup batch dan mencatat pembatalan. E-1 pada N3: file/referensi tidak valid, tampilkan error baris tanpa commit; pengguna memperbaiki dan mengunggah batch baru. E-2 pada N5: kedaluwarsa atau metadata berubah, validasi ulang. E-3 pada N5: kegagalan transaksi, rollback seluruh domain dan catat kegagalan. A-2 pada N5: retry identik mengembalikan hasil terdahulu. |
| Acceptance criteria | Dengan file UJI sah, preview tidak mengubah domain; setelah konfirmasi satu batch tersimpan utuh. File salah tidak committed. Retry identik tidak menambah duplikat. Pengulangan tidak menggandakan data; setiap baris domain menunjuk sumber. |
| Dependencies | Referensi gudang/material; UC-16 |
| Postconditions | Output di atas tersedia saat sukses; kegagalan tidak menghasilkan data domain parsial. |
| Sub flows | UC-16 wajib pada tahap validasi |
| FR mapping | SOURCE REQUIRED — tidak diberi ID FR rekaan |

## UC-02 — Mengimpor Janji Supplier

| Elemen | Spesifikasi |
| --- | --- |
| Feature ID | FEAT-02 |
| Use Case ID | UC-02 |
| Nama fitur | Mengimpor Janji Supplier |
| Tujuan / WHY | Mencatat janji awal dan perubahannya tanpa mengubah tanggal kebutuhan. |
| Actor / WHO | Purchasing — pemetaan PROPOSED |
| Trigger / WHEN | Pengguna memulai tugas mengimpor janji supplier |
| Preconditions | Sesi terautentikasi; izin role/gudang; mode eksplisit; dependensi tersedia. UC-16 juga mensyaratkan batch staging. |
| User flow dan system flow / HOW | N1 Pengguna memilih jenis impor, gudang, mode dan file. N2 Sistem menyimpan staging. N3 Sistem memanggil UC-16 dan menampilkan preview. N4 Pengguna memeriksa lalu mengonfirmasi. N5 Sistem memeriksa ulang fingerprint, expiry, izin dan referensi lalu commit atomik. N6 Sistem menampilkan hasil dan audit. |
| Input | File COMMITMENT; referensi inbound; event INITIAL/CHANGE; tanggal janji. |
| Output / WHAT | Event janji immutable dan lineage. |
| Business rules | BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-01, BR-INB-02, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Alternative / exception flows | A-1 pada N4: pengguna membatalkan; sistem menutup batch dan mencatat pembatalan. E-1 pada N3: file/referensi tidak valid, tampilkan error baris tanpa commit; pengguna memperbaiki dan mengunggah batch baru. E-2 pada N5: kedaluwarsa atau metadata berubah, validasi ulang. E-3 pada N5: kegagalan transaksi, rollback seluruh domain dan catat kegagalan. A-2 pada N5: retry identik mengembalikan hasil terdahulu. |
| Acceptance criteria | Dengan file UJI sah, preview tidak mengubah domain; setelah konfirmasi satu batch tersimpan utuh. File salah tidak committed. Retry identik tidak menambah duplikat. Nilai awal tetap setelah event CHANGE. |
| Dependencies | UC-01, UC-16 |
| Postconditions | Output di atas tersedia saat sukses; kegagalan tidak menghasilkan data domain parsial. |
| Sub flows | UC-16 wajib pada tahap validasi |
| FR mapping | SOURCE REQUIRED — tidak diberi ID FR rekaan |

## UC-03 — Mengimpor Data Penerimaan

| Elemen | Spesifikasi |
| --- | --- |
| Feature ID | FEAT-03 |
| Use Case ID | UC-03 |
| Nama fitur | Mengimpor Data Penerimaan |
| Tujuan / WHY | Mencatat penerimaan parsial dan penutup yang sah. |
| Actor / WHO | Warehouse — pemetaan PROPOSED |
| Trigger / WHEN | Pengguna memulai tugas mengimpor data penerimaan |
| Preconditions | Sesi terautentikasi; izin role/gudang; mode eksplisit; dependensi tersedia. UC-16 juga mensyaratkan batch staging. |
| User flow dan system flow / HOW | N1 Pengguna memilih jenis impor, gudang, mode dan file. N2 Sistem menyimpan staging. N3 Sistem memanggil UC-16 dan menampilkan preview. N4 Pengguna memeriksa lalu mengonfirmasi. N5 Sistem memeriksa ulang fingerprint, expiry, izin dan referensi lalu commit atomik. N6 Sistem menampilkan hasil dan audit. |
| Input | File RECEIVING; referensi inbound; kuantitas; tanggal; penanda penutup. |
| Output / WHAT | Event penerimaan; status final terverifikasi atau tetap terbuka. |
| Business rules | BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-03, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Alternative / exception flows | A-1 pada N4: pengguna membatalkan; sistem menutup batch dan mencatat pembatalan. E-1 pada N3: file/referensi tidak valid, tampilkan error baris tanpa commit; pengguna memperbaiki dan mengunggah batch baru. E-2 pada N5: kedaluwarsa atau metadata berubah, validasi ulang. E-3 pada N5: kegagalan transaksi, rollback seluruh domain dan catat kegagalan. A-2 pada N5: retry identik mengembalikan hasil terdahulu. |
| Acceptance criteria | Dengan file UJI sah, preview tidak mengubah domain; setelah konfirmasi satu batch tersimpan utuh. File salah tidak committed. Retry identik tidak menambah duplikat. Akumulasi parsial tidak otomatis menutup inbound. |
| Dependencies | UC-01, UC-16; kontrak finalisasi |
| Postconditions | Output di atas tersedia saat sukses; kegagalan tidak menghasilkan data domain parsial. |
| Sub flows | UC-16 wajib pada tahap validasi |
| FR mapping | SOURCE REQUIRED — tidak diberi ID FR rekaan |

## UC-04 — Memeriksa Exception Inbound

| Elemen | Spesifikasi |
| --- | --- |
| Feature ID | FEAT-04 |
| Use Case ID | UC-04 |
| Nama fitur | Memeriksa Exception Inbound |
| Tujuan / WHY | Membedakan kondisi inbound terbuka dari exception final. |
| Actor / WHO | Purchasing, Warehouse — pemetaan PROPOSED |
| Trigger / WHEN | Pengguna memulai tugas memeriksa exception inbound |
| Preconditions | Sesi terautentikasi; izin role/gudang; mode eksplisit; dependensi tersedia. UC-16 juga mensyaratkan batch staging. |
| User flow dan system flow / HOW | N1 Pengguna membuka fitur dan memilih filter sesuai izin. N2 Sistem memvalidasi filter dan scope di backend. N3 Sistem membaca inbound_references, commitment_events, receiving_events. N4 Sistem menerapkan aturan domain dan proyeksi field. N5 Sistem menampilkan daftar delivery delay / quantity mismatch final dan daftar overdue terbuka terpisah. |
| Input | Gudang, mode, periode dan filter status. |
| Output / WHAT | Daftar delivery delay / quantity mismatch final dan daftar overdue terbuka terpisah. |
| Business rules | BR-DAT-01, BR-INB-03, BR-INB-04, BR-SEC-01 |
| Alternative / exception flows | E-1 pada N2: filter tidak valid ditolak; izin tidak ada ditolak tanpa membocorkan data. A-1 pada N3: hasil kosong ditampilkan sebagai kosong, bukan error. E-2 pada N3: sumber gagal diakses, tampilkan kegagalan dan pilihan mencoba ulang, bukan angka nol. |
| Acceptance criteria | Inbound belum final tidak tampil sebagai exception final; overdue terbuka terpisah. |
| Dependencies | UC-01, UC-02, UC-03 |
| Postconditions | Output di atas tersedia saat sukses; kegagalan tidak menghasilkan data domain parsial. |
| Sub flows | Tidak ada subflow lain yang ditetapkan sumber. |
| FR mapping | SOURCE REQUIRED — tidak diberi ID FR rekaan |

## UC-05 — Melihat Pemberitahuan Inbound

| Elemen | Spesifikasi |
| --- | --- |
| Feature ID | FEAT-05 |
| Use Case ID | UC-05 |
| Nama fitur | Melihat Pemberitahuan Inbound |
| Tujuan / WHY | Menyajikan pemberitahuan inbound di website sesuai bukti. |
| Actor / WHO | Purchasing, Warehouse — pemetaan SRC-09 untuk draft; izin final NEEDS REVIEW |
| Trigger / WHEN | Pengguna memulai tugas melihat pemberitahuan inbound |
| Preconditions | Sesi terautentikasi; izin role/gudang; mode eksplisit; dependensi tersedia. UC-16 juga mensyaratkan batch staging. |
| User flow dan system flow / HOW | N1 Pengguna membuka fitur dan memilih filter sesuai izin. N2 Sistem memvalidasi filter dan scope di backend. N3 Sistem membaca inbound_references, commitment_events, receiving_events. N4 Sistem menerapkan aturan domain dan proyeksi field. N5 Sistem menampilkan daftar pemberitahuan dalam aplikasi dengan asal data. |
| Input | Gudang, mode, periode. |
| Output / WHAT | Daftar pemberitahuan dalam aplikasi dengan asal data. |
| Business rules | BR-DAT-01, BR-INB-04, BR-SEC-01 |
| Alternative / exception flows | E-1 pada N2: filter tidak valid ditolak; izin tidak ada ditolak tanpa membocorkan data. A-1 pada N3: hasil kosong ditampilkan sebagai kosong, bukan error. E-2 pada N3: sumber gagal diakses, tampilkan kegagalan dan pilihan mencoba ulang, bukan angka nol. |
| Acceptance criteria | Pemberitahuan hanya muncul di website; tidak mengirim email/WhatsApp/SMS/push. |
| Dependencies | UC-04; aturan pemberitahuan final |
| Postconditions | Output di atas tersedia saat sukses; kegagalan tidak menghasilkan data domain parsial. |
| Sub flows | Tidak ada subflow lain yang ditetapkan sumber. |
| FR mapping | SOURCE REQUIRED — tidak diberi ID FR rekaan |

## UC-06 — Membaca Referensi Material WO

| Elemen | Spesifikasi |
| --- | --- |
| Feature ID | FEAT-06 |
| Use Case ID | UC-06 |
| Nama fitur | Membaca Referensi Material WO |
| Tujuan / WHY | Menyediakan bacaan referensi material WO tanpa perencanaan produksi. |
| Actor / WHO | Purchasing, Production — pemetaan SRC-09 untuk draft; izin final NEEDS REVIEW |
| Trigger / WHEN | Pengguna memulai tugas membaca referensi material wo |
| Preconditions | Sesi terautentikasi; izin role/gudang; mode eksplisit; dependensi tersedia. UC-16 juga mensyaratkan batch staging. |
| User flow dan system flow / HOW | N1 Pengguna membuka fitur dan memilih filter sesuai izin. N2 Sistem memvalidasi filter dan scope di backend. N3 Sistem membaca wo_references. N4 Sistem menerapkan aturan domain dan proyeksi field. N5 Sistem menampilkan referensi wo read-only; sumber dan waktu data. |
| Input | Gudang, mode, identitas WO. |
| Output / WHAT | Referensi WO read-only; sumber dan waktu data. |
| Business rules | BR-DAT-01, BR-SEC-01, BR-DAT-02 |
| Alternative / exception flows | E-1 pada N2: filter tidak valid ditolak; izin tidak ada ditolak tanpa membocorkan data. A-1 pada N3: hasil kosong ditampilkan sebagai kosong, bukan error. E-2 pada N3: sumber gagal diakses, tampilkan kegagalan dan pilihan mencoba ulang, bukan angka nol. |
| Acceptance criteria | Pengguna hanya membaca referensi; tidak ada BOM calculation atau planning. |
| Dependencies | Sumber referensi WO tersedia; OD-05 |
| Postconditions | Output di atas tersedia saat sukses; kegagalan tidak menghasilkan data domain parsial. |
| Sub flows | Tidak ada subflow lain yang ditetapkan sumber. |
| FR mapping | SOURCE REQUIRED — tidak diberi ID FR rekaan |

## UC-07 — Menelusuri Riwayat Inbound

| Elemen | Spesifikasi |
| --- | --- |
| Feature ID | FEAT-07 |
| Use Case ID | UC-07 |
| Nama fitur | Menelusuri Riwayat Inbound |
| Tujuan / WHY | Menelusuri referensi, perubahan janji dan penerimaan. |
| Actor / WHO | Purchasing, Warehouse — pemetaan PROPOSED |
| Trigger / WHEN | Pengguna memulai tugas menelusuri riwayat inbound |
| Preconditions | Sesi terautentikasi; izin role/gudang; mode eksplisit; dependensi tersedia. UC-16 juga mensyaratkan batch staging. |
| User flow dan system flow / HOW | N1 Pengguna membuka fitur dan memilih filter sesuai izin. N2 Sistem memvalidasi filter dan scope di backend. N3 Sistem membaca inbound_references, commitment_events, receiving_events. N4 Sistem menerapkan aturan domain dan proyeksi field. N5 Sistem menampilkan urutan event initial/change dan penerimaan beserta lineage yang diizinkan. |
| Input | Referensi inbound, gudang, mode. |
| Output / WHAT | Urutan event INITIAL/CHANGE dan penerimaan beserta lineage yang diizinkan. |
| Business rules | BR-DAT-01, BR-INB-01, BR-INB-02, BR-INB-03, BR-SEC-01 |
| Alternative / exception flows | E-1 pada N2: filter tidak valid ditolak; izin tidak ada ditolak tanpa membocorkan data. A-1 pada N3: hasil kosong ditampilkan sebagai kosong, bukan error. E-2 pada N3: sumber gagal diakses, tampilkan kegagalan dan pilihan mencoba ulang, bukan angka nol. |
| Acceptance criteria | Histori INITIAL/CHANGE dan penerimaan tersusun dengan identitas sumber. |
| Dependencies | UC-01, UC-02, UC-03 |
| Postconditions | Output di atas tersedia saat sukses; kegagalan tidak menghasilkan data domain parsial. |
| Sub flows | Tidak ada subflow lain yang ditetapkan sumber. |
| FR mapping | SOURCE REQUIRED — tidak diberi ID FR rekaan |

## UC-08 — Melihat Metrik Supplier

| Elemen | Spesifikasi |
| --- | --- |
| Feature ID | FEAT-08 |
| Use Case ID | UC-08 |
| Nama fitur | Melihat Metrik Supplier |
| Tujuan / WHY | Menyajikan metrik supplier dengan eligibility yang dapat dijelaskan. |
| Actor / WHO | Purchasing, Management — pemetaan PROPOSED |
| Trigger / WHEN | Pengguna memulai tugas melihat metrik supplier |
| Preconditions | Sesi terautentikasi; izin role/gudang; mode eksplisit; dependensi tersedia. UC-16 juga mensyaratkan batch staging. |
| User flow dan system flow / HOW | N1 Pengguna membuka fitur dan memilih filter sesuai izin. N2 Sistem memvalidasi filter dan scope di backend. N3 Sistem membaca inbound_references, commitment_events, receiving_events. N4 Sistem menerapkan aturan domain dan proyeksi field. N5 Sistem menampilkan nilai metrik, numerator, denominator, excluded_count dan reason. |
| Input | Gudang, mode, periode, supplier. |
| Output / WHAT | Nilai metrik, numerator, denominator, excluded_count dan reason. |
| Business rules | BR-DAT-01, BR-INB-03, BR-INB-04, BR-INB-05, BR-SEC-01 |
| Alternative / exception flows | E-1 pada N2: filter tidak valid ditolak; izin tidak ada ditolak tanpa membocorkan data. A-1 pada N3: hasil kosong ditampilkan sebagai kosong, bukan error. E-2 pada N3: sumber gagal diakses, tampilkan kegagalan dan pilihan mencoba ulang, bukan angka nol. |
| Acceptance criteria | Denominator nol menghasilkan nilai null dan alasan NO_ELIGIBLE_DATA; definisi dari SRC-09 §6.6; finalisasi eligibility OD-06. |
| Dependencies | UC-01–UC-04; OD-06 |
| Postconditions | Output di atas tersedia saat sukses; kegagalan tidak menghasilkan data domain parsial. |
| Sub flows | Tidak ada subflow lain yang ditetapkan sumber. |
| FR mapping | SOURCE REQUIRED — tidak diberi ID FR rekaan |

## UC-09 — Mengimpor Data Stok

| Elemen | Spesifikasi |
| --- | --- |
| Feature ID | FEAT-09 |
| Use Case ID | UC-09 |
| Nama fitur | Mengimpor Data Stok |
| Tujuan / WHY | Mengimpor saldo QTY AKHIR bersama dukungan opsional. |
| Actor / WHO | Warehouse — pemetaan PROPOSED |
| Trigger / WHEN | Pengguna memulai tugas mengimpor data stok |
| Preconditions | Sesi terautentikasi; izin role/gudang; mode eksplisit; dependensi tersedia. UC-16 juga mensyaratkan batch staging. |
| User flow dan system flow / HOW | N1 Pengguna memilih jenis impor, gudang, mode dan file. N2 Sistem menyimpan staging. N3 Sistem memanggil UC-16 dan menampilkan preview. N4 Pengguna memeriksa lalu mengonfirmasi. N5 Sistem memeriksa ulang fingerprint, expiry, izin dan referensi lalu commit atomik. N6 Sistem menampilkan hasil dan audit. |
| Input | Paket STOCK: saldo wajib; komponen dukungan opsional; cutoff. |
| Output / WHAT | Snapshot stok; saldo digital; lineage komponen dukungan. |
| Business rules | BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-01, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Alternative / exception flows | A-1 pada N4: pengguna membatalkan; sistem menutup batch dan mencatat pembatalan. E-1 pada N3: file/referensi tidak valid, tampilkan error baris tanpa commit; pengguna memperbaiki dan mengunggah batch baru. E-2 pada N5: kedaluwarsa atau metadata berubah, validasi ulang. E-3 pada N5: kegagalan transaksi, rollback seluruh domain dan catat kegagalan. A-2 pada N5: retry identik mengembalikan hasil terdahulu. |
| Acceptance criteria | Dengan file UJI sah, preview tidak mengubah domain; setelah konfirmasi satu batch tersimpan utuh. File salah tidak committed. Retry identik tidak menambah duplikat. Saldo hasil normalisasi sama dengan nilai akhir sumber. |
| Dependencies | Referensi material/UOM/cutoff; UC-16 |
| Postconditions | Output di atas tersedia saat sukses; kegagalan tidak menghasilkan data domain parsial. |
| Sub flows | UC-16 wajib pada tahap validasi |
| FR mapping | SOURCE REQUIRED — tidak diberi ID FR rekaan |

## UC-10 — Mengimpor Hasil Hitung Fisik

| Elemen | Spesifikasi |
| --- | --- |
| Feature ID | FEAT-10 |
| Use Case ID | UC-10 |
| Nama fitur | Mengimpor Hasil Hitung Fisik |
| Tujuan / WHY | Menyimpan hasil hitung dan membedakan belum dihitung dari nol. |
| Actor / WHO | Warehouse — pemetaan PROPOSED |
| Trigger / WHEN | Pengguna memulai tugas mengimpor hasil hitung fisik |
| Preconditions | Sesi terautentikasi; izin role/gudang; mode eksplisit; dependensi tersedia. UC-16 juga mensyaratkan batch staging. |
| User flow dan system flow / HOW | N1 Pengguna memilih jenis impor, gudang, mode dan file. N2 Sistem menyimpan staging. N3 Sistem memanggil UC-16 dan menampilkan preview. N4 Pengguna memeriksa lalu mengonfirmasi. N5 Sistem memeriksa ulang fingerprint, expiry, izin dan referensi lalu commit atomik. N6 Sistem menampilkan hasil dan audit. |
| Input | File COUNT; cutoff; is_counted; physical_quantity. |
| Output / WHAT | Sesi hitung; baris dihitung/belum dihitung; lineage. |
| Business rules | BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-02, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Alternative / exception flows | A-1 pada N4: pengguna membatalkan; sistem menutup batch dan mencatat pembatalan. E-1 pada N3: file/referensi tidak valid, tampilkan error baris tanpa commit; pengguna memperbaiki dan mengunggah batch baru. E-2 pada N5: kedaluwarsa atau metadata berubah, validasi ulang. E-3 pada N5: kegagalan transaksi, rollback seluruh domain dan catat kegagalan. A-2 pada N5: retry identik mengembalikan hasil terdahulu. |
| Acceptance criteria | Dengan file UJI sah, preview tidak mengubah domain; setelah konfirmasi satu batch tersimpan utuh. File salah tidak committed. Retry identik tidak menambah duplikat. False disimpan dengan physical_quantity null; nol sah ketika true. |
| Dependencies | Referensi material/UOM/cutoff; UC-16 |
| Postconditions | Output di atas tersedia saat sukses; kegagalan tidak menghasilkan data domain parsial. |
| Sub flows | UC-16 wajib pada tahap validasi |
| FR mapping | SOURCE REQUIRED — tidak diberi ID FR rekaan |

## UC-11 — Mengarsipkan Bukti Kartu Stok

| Elemen | Spesifikasi |
| --- | --- |
| Feature ID | FEAT-11 |
| Use Case ID | UC-11 |
| Nama fitur | Mengarsipkan Bukti Kartu Stok |
| Tujuan / WHY | Mengaitkan bukti privat ke tepat satu target sah. |
| Actor / WHO | Warehouse — pemetaan PROPOSED |
| Trigger / WHEN | Pengguna memulai tugas mengarsipkan bukti kartu stok |
| Preconditions | Sesi terautentikasi; izin role/gudang; mode eksplisit; dependensi tersedia. UC-16 juga mensyaratkan batch staging. |
| User flow dan system flow / HOW | N1 Pengguna memilih satu target sah. N2 Sistem memeriksa scope target. N3 Pengguna mengunggah file. N4 Sistem memeriksa ukuran, tipe dan isi signature lalu menyimpan privat. N5 Sistem mengikat evidence ke target dan mencatat audit. |
| Input | File PDF/JPG/PNG; target; gudang; mode. |
| Output / WHAT | evidence_id dan metadata aman; file tetap privat. |
| Business rules | BR-DAT-01, BR-EVD-01, BR-EVD-02, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Alternative / exception flows | E-1 pada N2: target tidak sah/lintas scope ditolak. E-2 pada N4: tipe/ukuran salah ditolak. E-3 pada N5: penyimpanan gagal, tidak ada evidence aktif; cleanup objek sementara dicatat. |
| Acceptance criteria | File <= 5242880 byte dengan tipe PDF/JPG/PNG sah terikat satu target; file lebih besar ditolak. Management tidak memperoleh raw file atau storage key. |
| Dependencies | Target sah tersedia; OD-08 |
| Postconditions | Output di atas tersedia saat sukses; kegagalan tidak menghasilkan data domain parsial. |
| Sub flows | Tidak ada subflow lain yang ditetapkan sumber. |
| FR mapping | SOURCE REQUIRED — tidak diberi ID FR rekaan |

## UC-12 — Menjalankan Rekonsiliasi Stok

| Elemen | Spesifikasi |
| --- | --- |
| Feature ID | FEAT-12 |
| Use Case ID | UC-12 |
| Nama fitur | Menjalankan Rekonsiliasi Stok |
| Tujuan / WHY | Membandingkan pasangan stok dan hitung yang memenuhi konteks. |
| Actor / WHO | Warehouse — pemetaan PROPOSED |
| Trigger / WHEN | Pengguna memulai tugas menjalankan rekonsiliasi stok |
| Preconditions | Sesi terautentikasi; izin role/gudang; mode eksplisit; dependensi tersedia. UC-16 juga mensyaratkan batch staging. |
| User flow dan system flow / HOW | N1 Pengguna memilih snapshot dan sesi hitung. N2 Sistem memeriksa gudang, mode dan cutoff. N3 Sistem membentuk pasangan material dan memeriksa UOM/status hitung. N4 Sistem menghitung variance hanya untuk pasangan valid. N5 Sistem menyimpan run baru atomik dan menampilkan hasil serta audit. |
| Input | stock_snapshot_id dan count_session_id. |
| Output / WHAT | Run immutable dan baris status, variance nullable. |
| Business rules | BR-DAT-01, BR-INV-01, BR-INV-02, BR-INV-03, BR-INV-04, BR-INV-05, BR-INV-06, BR-AUD-01, BR-SEC-01 |
| Alternative / exception flows | E-1 pada N2: konteks berbeda atau ACTUAL belum VERIFIED, tolak seluruh permintaan. A-1 pada N3: pasangan nonvalid tetap tercatat dengan status dan variance null. E-2 pada N5: rollback; hasil lama tetap tersedia. |
| Acceptance criteria | Stok 10 dan hitung 8 menghasilkan -2 DISCREPANCY; hitung 10 MATCHED; belum dihitung NOT_COUNTED dengan null. Run ulang tidak menghapus histori. |
| Dependencies | UC-09, UC-10 |
| Postconditions | Output di atas tersedia saat sukses; kegagalan tidak menghasilkan data domain parsial. |
| Sub flows | Tidak ada subflow lain yang ditetapkan sumber. |
| FR mapping | SOURCE REQUIRED — tidak diberi ID FR rekaan |

## UC-13 — Menelusuri Riwayat Selisih Stok

| Elemen | Spesifikasi |
| --- | --- |
| Feature ID | FEAT-13 |
| Use Case ID | UC-13 |
| Nama fitur | Menelusuri Riwayat Selisih Stok |
| Tujuan / WHY | Membaca versi hasil selisih tanpa menimpa histori. |
| Actor / WHO | Warehouse, Management — pemetaan PROPOSED |
| Trigger / WHEN | Pengguna memulai tugas menelusuri riwayat selisih stok |
| Preconditions | Sesi terautentikasi; izin role/gudang; mode eksplisit; dependensi tersedia. UC-16 juga mensyaratkan batch staging. |
| User flow dan system flow / HOW | N1 Pengguna membuka fitur dan memilih filter sesuai izin. N2 Sistem memvalidasi filter dan scope di backend. N3 Sistem membaca reconciliation_runs, reconciliation_lines. N4 Sistem menerapkan aturan domain dan proyeksi field. N5 Sistem menampilkan daftar run dan detail hasil historis. |
| Input | run_id atau filter gudang, mode, periode. |
| Output / WHAT | Daftar run dan detail hasil historis. |
| Business rules | BR-DAT-01, BR-INV-04, BR-INV-05, BR-INV-06, BR-SEC-01 |
| Alternative / exception flows | E-1 pada N2: filter tidak valid ditolak; izin tidak ada ditolak tanpa membocorkan data. A-1 pada N3: hasil kosong ditampilkan sebagai kosong, bukan error. E-2 pada N3: sumber gagal diakses, tampilkan kegagalan dan pilihan mencoba ulang, bukan angka nol. |
| Acceptance criteria | Run lama dan baru tetap dapat dipilih dengan konteks yang terlihat. |
| Dependencies | UC-12 |
| Postconditions | Output di atas tersedia saat sukses; kegagalan tidak menghasilkan data domain parsial. |
| Sub flows | Tidak ada subflow lain yang ditetapkan sumber. |
| FR mapping | SOURCE REQUIRED — tidak diberi ID FR rekaan |

## UC-14 — Melihat Metrik Persediaan

| Elemen | Spesifikasi |
| --- | --- |
| Feature ID | FEAT-14 |
| Use Case ID | UC-14 |
| Nama fitur | Melihat Metrik Persediaan |
| Tujuan / WHY | Menyajikan metrik persediaan dari pasangan rekonsiliasi valid. |
| Actor / WHO | Warehouse, Management — pemetaan PROPOSED |
| Trigger / WHEN | Pengguna memulai tugas melihat metrik persediaan |
| Preconditions | Sesi terautentikasi; izin role/gudang; mode eksplisit; dependensi tersedia. UC-16 juga mensyaratkan batch staging. |
| User flow dan system flow / HOW | N1 Pengguna membuka fitur dan memilih filter sesuai izin. N2 Sistem memvalidasi filter dan scope di backend. N3 Sistem membaca reconciliation_runs, reconciliation_lines. N4 Sistem menerapkan aturan domain dan proyeksi field. N5 Sistem menampilkan metrik pasangan valid dan jumlah nonvalid terpisah. |
| Input | run_id; filter gudang dan mode. |
| Output / WHAT | Metrik pasangan valid dan jumlah nonvalid terpisah. |
| Business rules | BR-DAT-01, BR-INV-04, BR-INV-05, BR-SEC-01 |
| Alternative / exception flows | E-1 pada N2: filter tidak valid ditolak; izin tidak ada ditolak tanpa membocorkan data. A-1 pada N3: hasil kosong ditampilkan sebagai kosong, bukan error. E-2 pada N3: sumber gagal diakses, tampilkan kegagalan dan pilihan mencoba ulang, bukan angka nol. |
| Acceptance criteria | Pasangan nonvalid tidak masuk denominator valid; nilai tanpa data tidak dinyatakan 0%. |
| Dependencies | UC-12 |
| Postconditions | Output di atas tersedia saat sukses; kegagalan tidak menghasilkan data domain parsial. |
| Sub flows | Tidak ada subflow lain yang ditetapkan sumber. |
| FR mapping | SOURCE REQUIRED — tidak diberi ID FR rekaan |

## UC-15 — Menelusuri Audit Proses

| Elemen | Spesifikasi |
| --- | --- |
| Feature ID | FEAT-15 |
| Use Case ID | UC-15 |
| Nama fitur | Menelusuri Audit Proses |
| Tujuan / WHY | Menelusuri keberhasilan, kegagalan dan pembatalan proses. |
| Actor / WHO | Warehouse — pemetaan SRC-09 untuk draft; izin final NEEDS REVIEW |
| Trigger / WHEN | Pengguna memulai tugas menelusuri audit proses |
| Preconditions | Sesi terautentikasi; izin role/gudang; mode eksplisit; dependensi tersedia. UC-16 juga mensyaratkan batch staging. |
| User flow dan system flow / HOW | N1 Pengguna membuka fitur dan memilih filter sesuai izin. N2 Sistem memvalidasi filter dan scope di backend. N3 Sistem membaca audit_events. N4 Sistem menerapkan aturan domain dan proyeksi field. N5 Sistem menampilkan event audit tersaring tanpa data privat terlarang. |
| Input | Filter proses, outcome, periode, gudang dan mode. |
| Output / WHAT | Event audit tersaring tanpa data privat terlarang. |
| Business rules | BR-IMP-04, BR-DAT-01, BR-AUD-01, BR-SEC-01 |
| Alternative / exception flows | E-1 pada N2: filter tidak valid ditolak; izin tidak ada ditolak tanpa membocorkan data. A-1 pada N3: hasil kosong ditampilkan sebagai kosong, bukan error. E-2 pada N3: sumber gagal diakses, tampilkan kegagalan dan pilihan mencoba ulang, bukan angka nol. |
| Acceptance criteria | Event sukses, gagal dan batal dapat dicari; Management tidak melihat raw/storage key. |
| Dependencies | Audit ditulis sejak fondasi |
| Postconditions | Output di atas tersedia saat sukses; kegagalan tidak menghasilkan data domain parsial. |
| Sub flows | Tidak ada subflow lain yang ditetapkan sumber. |
| FR mapping | SOURCE REQUIRED — tidak diberi ID FR rekaan |

## UC-16 — Memvalidasi Data Impor

| Elemen | Spesifikasi |
| --- | --- |
| Feature ID | FEAT-16 |
| Use Case ID | UC-16 |
| Nama fitur | Memvalidasi Data Impor |
| Tujuan / WHY | Memvalidasi data dan metadata impor sebelum preview dan commit. |
| Actor / WHO | Internal; mewarisi pengguna pemanggil |
| Trigger / WHEN | Pemanggilan internal lima impor |
| Preconditions | Sesi terautentikasi; izin role/gudang; mode eksplisit; dependensi tersedia. UC-16 juga mensyaratkan batch staging. |
| User flow dan system flow / HOW | N1 Proses impor memanggil validator internal. N2 Sistem memeriksa struktur, tipe, referensi, konteks dan aturan bisnis. N3 Sistem mencatat validation_issues. N4 Jika tanpa error, sistem mengikat preview ke fingerprint data/metadata/versi validator dengan masa berlaku 30 menit. N5 Sistem mengembalikan hasil ke pemanggil. |
| Input | Batch staging, raw, normalized, metadata dan versi validator. |
| Output / WHAT | Laporan error/warning; fingerprint; preview dan expiry bila valid. |
| Business rules | BR-IMP-01, BR-IMP-02, BR-IMP-04, BR-DAT-01, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Alternative / exception flows | E-1 pada N2: invalid menghasilkan laporan dan tidak ada preview siap commit. A-1 pada N3: warning ditampilkan dan konfirmasi mengikuti kebijakan DOC-08. E-2 pada N4: perubahan referensi memerlukan validasi ulang. |
| Acceptance criteria | Kelima impor memanggil proses ini; tidak ada navigasi UC-16. Perubahan mode atau gudang setelah validasi membatalkan preview. |
| Dependencies | Lima adaptor dan referensi tervalidasi |
| Postconditions | Output di atas tersedia saat sukses; kegagalan tidak menghasilkan data domain parsial. |
| Sub flows | Tidak ada subflow lain yang ditetapkan sumber. |
| FR mapping | SOURCE REQUIRED — tidak diberi ID FR rekaan |

## Metrik keberhasilan dan penerimaan produk

Keberhasilan dievaluasi melalui tugas pengguna dan bukti QA: lineage tersedia, hasil rekonsiliasi dapat dijelaskan, dan pembatasan akses konsisten. Nilai target waktu tugas, pengurangan selisih, serta tingkat akurasi operasional: NEEDS BASELINE. Penerimaan produk mengikuti DOC-14 dan 55 pengujian sumber setelah tersedia; tidak ada klaim PASS atau diterima.

## Di luar ruang lingkup

ERP replacement; integrasi langsung database/API Erasoft; Erasoft writeback; Purchase Order Management baru; supplier portal; public registration; OCR; real-time ERP synchronization; automatic stock adjustment; production planning/MRP; BOM calculation; picking; accounting module; corrective action workflow otomatis; email, WhatsApp, SMS atau push notification otomatis; analitik di luar baseline.

## Definisi metrik dari SRC-09 dan batas verifikasi

SRC-09 §6.6 menyediakan enam metrik supplier dan empat metrik persediaan. Definisi ini menggantikan pernyataan bahwa tidak ada definisi metrik sama sekali; statusnya **bersumber dari kontrak desain untuk ditinjau**, bukan pengganti SRS/analisis fitur final. Sumber analisis yang dirujuk SRC-09 masih SOURCE REQUIRED.

| Metrik | Definisi tampilan dan batas |
| --- | --- |
| OTD-R | Final tepat waktu terhadap requested date / final eligible untuk R ×100% |
| OTD-C | Final tepat waktu terhadap janji terakhir yang sah sebelum completion / final eligible untuk C ×100% |
| Quantity Mismatch Rate | Final dengan total received ≠ expected / final eligible untuk quantity ×100% |
| S-FILL | Σmin(received,expected)/Σexpected ×100%, per supplier+material+UOM |
| S-LEAD | Rata-rata hari kalender completion−release untuk record eligible |
| S-CHANGE | Jumlah event CHANGE yang termasuk cakupan |
| I-VAR | Physical quantity−system quantity per pasangan valid |
| I-EXACT | Matched/valid pairs ×100% |
| I-COVER | Valid pairs/snapshot items in scope ×100% |
| I-REPEAT | Jumlah item discrepancy pada sedikitnya dua cutoff berbeda dalam periode |

Eligibility final, bukti completion/release, kebijakan interval tanggal, koreksi event dan tie-break latest run tetap OD-06. Denominator nol unavailable, tidak 0%; S-FILL tidak menggabungkan material/UOM; I-REPEAT memerlukan konteks beberapa cutoff. Target performa numerik pada SRC-09 §7.3 adalah target desain sumber, bukan 14 NFR baseline yang telah disetujui. Jangan membuat threshold baru atau menyatakan target tersebut tercapai.

## Dependencies

| Dependensi | Kegunaan |
| --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | Indeks Induk Dokumentasi Pengembangan |
| [DOC-01](01_PROJECT_CHARTER_SCOPE.md) | Piagam Proyek dan Definisi Ruang Lingkup |
| [DOC-04](04_SOFTWARE_REQUIREMENTS_SPECIFICATION.md) | Spesifikasi Kebutuhan Perangkat Lunak |
| [DOC-05](05_BUSINESS_RULES_RBAC.md) | Spesifikasi Aturan Bisnis dan RBAC |
| [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md) | Kontrak Data, Pemetaan Impor, dan Validasi |
| [DOC-09](09_API_SPECIFICATION.md) | Spesifikasi REST API |
| [DOC-10](10_UI_UX_PROTOTYPE_SPECIFICATION.md) | Spesifikasi Prototipe UI/UX |
| [DOC-14](14_USER_ACCEPTANCE_TESTING.md) | Pengujian Penerimaan Pengguna |

## Open issues

Rincian baseline final belum tersedia; lihat register sumber dan keputusan terbuka pada DOC-00.

## Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1.0 | 2026-11-10 | Penyusunan berdasarkan SRC-01; celah sumber dicatat dan desain ditandai PROPOSED. | Belum ada bukti persetujuan |
| 0.2.0 | 2026-11-10 | Integrasi SRC-09 design.md: route, role, token, layar pendukung, metrik dan konflik desain; tetap NEEDS REVIEW. | Belum ada bukti persetujuan |
