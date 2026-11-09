# Spesifikasi Aturan Bisnis dan RBAC

## Identitas dan kendali dokumen

| Atribut | Nilai |
| --- | --- |
| Document ID | DOC-05 |
| Nama proyek | SIRIS — Capstone Project Kelompok 42 |
| Mitra | Warehouse PT Harina Chemicals Industry |
| Versi | 0.2.0 |
| Status dokumen | DRAFT — NEEDS REVIEW |
| Tanggal penyusunan | 2026-11-10 |
| Pemilik dokumen | Requirements Engineer |
| Tujuan dokumen | Menentukan aturan domain dan rancangan pembatasan akses. |
| Ruang lingkup | Website pendamping Erasoft; Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation. |

Ketentuan pengguna diberi rujukan **SRC-01**. Desain baru berstatus **PROPOSED**, bukan BASELINE APPROVED. Belum ada aplikasi, hasil pengujian runtime, evaluasi stakeholder, atau persetujuan rilis yang dibuktikan dalam workspace ini. Semua contoh adalah **UJI**.

## Daftar isi

1. Identitas dan kendali dokumen
2. Referensi
3. Katalog aturan bisnis
4. Matriks izin PROPOSED
5. Otorisasi backend dan visibilitas
6. State transitions dan kondisi error
7. Audit dan skenario otorisasi negatif
8. Dependencies
9. Open issues
10. Riwayat revisi

## Referensi

SRC-01: master prompt pengguna pada sesi penyusunan; SRC-02: `../AGENTS.md`. SRC-09: `../design.md` v1.0.0, kontrak desain untuk ditinjau yang tersedia pada pemeriksaan akhir; snapshot visual disertakan pada DOC-10. Register sumber lengkap, hierarki, dan sumber eksternal terdapat pada [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md). Rujukan antardokumen: [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md), [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md), [DOC-04](04_SOFTWARE_REQUIREMENTS_SPECIFICATION.md), [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md), [DOC-09](09_API_SPECIFICATION.md), [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md), [DOC-16](16_SECURITY_RISK_NFR.md).

## Katalog aturan bisnis

Semua aturan BR berikut diturunkan dari SRC-01. Nomor BR adalah indeks dokumentasi paket ini; bukan ID FR/NFR baseline.
| ID | Aturan | UC terkait | FR/NFR terkait | Kondisi penerimaan |
| --- | --- | --- | --- | --- |
| BR-IMP-01 | Hanya EXPECTED, COMMITMENT, RECEIVING, STOCK, COUNT; seluruhnya staging → validasi → preview → konfirmasi → commit → audit. | UC-01, UC-02, UC-03, UC-09, UC-10, UC-16 | SOURCE REQUIRED | Domain tidak berubah sebelum konfirmasi. |
| BR-IMP-02 | Preview berlaku 30 menit dan terikat data serta metadata tervalidasi. | UC-01, UC-02, UC-03, UC-09, UC-10, UC-16 | SOURCE REQUIRED | Perubahan isi/metadata atau preview kedaluwarsa mengharuskan validasi ulang. |
| BR-IMP-03 | Commit atomik; kegagalan tidak meninggalkan data domain parsial. | UC-01, UC-02, UC-03, UC-09, UC-10 | SOURCE REQUIRED | Injeksi kegagalan membatalkan semua perubahan transaksi. |
| BR-IMP-04 | Operasi identik idempotent; raw, normalized, metadata sumber dan lineage dapat ditelusuri. | UC-01, UC-02, UC-03, UC-09, UC-10, UC-15, UC-16 | SOURCE REQUIRED | Pengulangan tidak menggandakan data; setiap baris domain menunjuk sumber. |
| BR-DAT-01 | ACTUAL dan UJI tidak digabung dalam perhitungan atau pembandingan. | UC-01, UC-02, UC-03, UC-04, UC-05, UC-06, UC-07, UC-08, UC-09, UC-10, UC-11, UC-12, UC-13, UC-14, UC-15, UC-16 | SOURCE REQUIRED | Mode menjadi syarat query dan validasi referensi. |
| BR-INB-01 | Requested date tidak berubah akibat pembaruan janji supplier. | UC-01, UC-02, UC-07 | SOURCE REQUIRED | Nilai awal tetap setelah event CHANGE. |
| BR-INB-02 | Histori janji mempertahankan INITIAL dan CHANGE. | UC-02, UC-07 | SOURCE REQUIRED | Event lama tetap dapat ditelusuri. |
| BR-INB-03 | Penerimaan dapat parsial; final hanya melalui penanda penutup yang sah. | UC-03, UC-04, UC-07, UC-08 | SOURCE REQUIRED | Akumulasi parsial tidak otomatis menutup inbound. |
| BR-INB-04 | Exception hanya delivery delay dan quantity mismatch; belum final tidak menghasilkan exception final. | UC-04, UC-05, UC-08 | SOURCE REQUIRED | Overdue terbuka ditampilkan terpisah dari delivery delay final. |
| BR-INB-05 | Metrik memakai record eligible dan denominator yang sesuai; tidak menyimpulkan kesalahan supplier tanpa bukti. | UC-08 | SOURCE REQUIRED | Numerator, denominator dan alasan eksklusi dapat diperiksa. |
| BR-INV-01 | Saldo digital berasal dari QTY AKHIR; movement tidak dijumlahkan kembali. | UC-09, UC-12 | SOURCE REQUIRED | Saldo hasil normalisasi sama dengan nilai akhir sumber. |
| BR-INV-02 | Nol fisik berbeda dari belum dihitung; is_counted=false bukan physical_quantity=0. | UC-10, UC-12 | SOURCE REQUIRED | False disimpan dengan physical_quantity null; nol sah ketika true. |
| BR-INV-03 | Pasangan rekonsiliasi harus cocok gudang, mode, UOM, konteks cutoff; ACTUAL wajib cutoff VERIFIED. | UC-09, UC-10, UC-12 | SOURCE REQUIRED | Pasangan tidak memenuhi konteks ditolak atau nonvalid sesuai DOC-08. |
| BR-INV-04 | Variance = physical_quantity - system_quantity; MATCHED jika nol dan DISCREPANCY jika bukan nol pada pasangan valid. | UC-12, UC-13, UC-14 | SOURCE REQUIRED | Perhitungan dilakukan hanya setelah validitas pasangan terpenuhi. |
| BR-INV-05 | COUNT_MISSING, NOT_COUNTED, STOCK_MISSING, UOM_MISMATCH tidak memiliki variance. | UC-12, UC-13, UC-14 | SOURCE REQUIRED | Variance disimpan null dan tidak masuk denominator pasangan valid. |
| BR-INV-06 | Hasil lama tetap tersedia; tidak ada automatic stock adjustment atau Erasoft writeback. | UC-12, UC-13 | SOURCE REQUIRED | Run baru menambah versi tanpa menimpa hasil lama. |
| BR-EVD-01 | Evidence hanya PDF/JPG/PNG, maksimum 5 MiB per file, privat, tanpa OCR. | UC-11 | SOURCE REQUIRED | Tolak ukuran > 5242880 byte dan tipe tidak sesuai. |
| BR-EVD-02 | Evidence terkait tepat satu target sah. | UC-11 | SOURCE REQUIRED | Tolak target tidak ada, lintas scope, atau lebih dari satu. |
| BR-AUD-01 | Audit mencatat keberhasilan, kegagalan dan pembatalan relevan. | UC-01, UC-02, UC-03, UC-09, UC-10, UC-11, UC-12, UC-15, UC-16 | SOURCE REQUIRED | Outcome tercatat dengan pelaku, waktu, konteks dan referensi proses. |
| BR-SEC-01 | Akses sesuai role dan izin gudang; Management tidak memperoleh raw file maupun lokasi privat. | UC-01, UC-02, UC-03, UC-04, UC-05, UC-06, UC-07, UC-08, UC-09, UC-10, UC-11, UC-12, UC-13, UC-14, UC-15, UC-16 | SOURCE REQUIRED | Cek akses backend setiap request dan proyeksi response tanpa storage key. |
| BR-DAT-02 | Data mitra yang belum tersedia tidak boleh direkayasa sebagai ACTUAL; contoh wajib UJI. | UC-01, UC-02, UC-03, UC-06, UC-09, UC-10, UC-11, UC-16 | SOURCE REQUIRED | Fixture berlabel UJI dan tidak masuk dataset ACTUAL. |

## Matriks izin PROPOSED

P = izin rancangan untuk review; akses view bersumber SRC-09, rincian aksi tetap usulan; T = ditolak dalam rancangan; I = internal melalui UC pemanggil; N/A = aksi tidak relevan. Tidak ada izin produksi boleh disimpulkan dari P sebelum OD-04 selesai. Download di sini berarti raw/evidence, bukan fitur ekspor laporan baru. Management selalu T untuk download raw/evidence. Untuk role lain izin download hanya diusulkan pada UC-11; unduh raw impor tetap ditolak sampai sumber mengizinkan.
| Role | Use Case | View | Create/Import | Execute | Download |
| --- | --- | --- | --- | --- | --- |
| Purchasing | UC-01 | P | P | P | T |
| Purchasing | UC-02 | P | P | P | T |
| Purchasing | UC-03 | T | T | T | T |
| Purchasing | UC-04 | P | N/A | N/A | T |
| Purchasing | UC-05 | P | N/A | N/A | T |
| Purchasing | UC-06 | P | N/A | N/A | T |
| Purchasing | UC-07 | P | N/A | N/A | T |
| Purchasing | UC-08 | P | N/A | N/A | T |
| Purchasing | UC-09 | T | T | T | T |
| Purchasing | UC-10 | T | T | T | T |
| Purchasing | UC-11 | T | T | N/A | T |
| Purchasing | UC-12 | T | N/A | T | T |
| Purchasing | UC-13 | T | N/A | N/A | T |
| Purchasing | UC-14 | T | N/A | N/A | T |
| Purchasing | UC-15 | T | N/A | N/A | T |
| Purchasing | UC-16 | N/A | N/A | I bila pemanggil diizinkan | T |
| Warehouse | UC-01 | T | T | T | T |
| Warehouse | UC-02 | T | T | T | T |
| Warehouse | UC-03 | P | P | P | T |
| Warehouse | UC-04 | P | N/A | N/A | T |
| Warehouse | UC-05 | P | N/A | N/A | T |
| Warehouse | UC-06 | T | N/A | N/A | T |
| Warehouse | UC-07 | P | N/A | N/A | T |
| Warehouse | UC-08 | T | N/A | N/A | T |
| Warehouse | UC-09 | P | P | P | T |
| Warehouse | UC-10 | P | P | P | T |
| Warehouse | UC-11 | P | P | N/A | P |
| Warehouse | UC-12 | P | N/A | P | T |
| Warehouse | UC-13 | P | N/A | N/A | T |
| Warehouse | UC-14 | P | N/A | N/A | T |
| Warehouse | UC-15 | P | N/A | N/A | T |
| Warehouse | UC-16 | N/A | N/A | I bila pemanggil diizinkan | T |
| Production | UC-01 | T | T | T | T |
| Production | UC-02 | T | T | T | T |
| Production | UC-03 | T | T | T | T |
| Production | UC-04 | T | N/A | N/A | T |
| Production | UC-05 | T | N/A | N/A | T |
| Production | UC-06 | P | N/A | N/A | T |
| Production | UC-07 | T | N/A | N/A | T |
| Production | UC-08 | T | N/A | N/A | T |
| Production | UC-09 | T | T | T | T |
| Production | UC-10 | T | T | T | T |
| Production | UC-11 | T | T | N/A | T |
| Production | UC-12 | T | N/A | T | T |
| Production | UC-13 | T | N/A | N/A | T |
| Production | UC-14 | T | N/A | N/A | T |
| Production | UC-15 | T | N/A | N/A | T |
| Production | UC-16 | N/A | N/A | I bila pemanggil diizinkan | T |
| Management | UC-01 | T | T | T | T |
| Management | UC-02 | T | T | T | T |
| Management | UC-03 | T | T | T | T |
| Management | UC-04 | T | N/A | N/A | T |
| Management | UC-05 | T | N/A | N/A | T |
| Management | UC-06 | T | N/A | N/A | T |
| Management | UC-07 | T | N/A | N/A | T |
| Management | UC-08 | P | N/A | N/A | T |
| Management | UC-09 | T | T | T | T |
| Management | UC-10 | T | T | T | T |
| Management | UC-11 | T | T | N/A | T |
| Management | UC-12 | T | N/A | T | T |
| Management | UC-13 | P | N/A | N/A | T |
| Management | UC-14 | P | N/A | N/A | T |
| Management | UC-15 | T | N/A | N/A | T |
| Management | UC-16 | N/A | N/A | I bila pemanggil diizinkan | T |

## Otorisasi backend dan visibilitas

Frontend menyembunyikan menu yang tidak diizinkan, tetapi backend tetap memeriksa sesi aktif, role, gudang, mode dan ownership batch pada setiap request. Identitas pengguna berasal dari sesi, tidak dipercaya dari payload. Query harus difilter sebelum pagination/agregasi. ID yang ditebak tidak mengabaikan pemeriksaan objek. Response Management hanya memakai DTO aman; field raw, storage_key, path, dan URL storage privat dilarang, termasuk pada error dan audit. Rekomendasi ini sejalan dengan prinsip deny-by-default dan pemeriksaan setiap request pada [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

## State transitions dan kondisi error

State impor, status rekonsiliasi, serta prioritas error ditetapkan pada DOC-08. Pada commit, izin diperiksa ulang karena role/gudang dapat berubah setelah preview. Kesalahan autentikasi: 401; akses yang tidak diizinkan: 403, atau 404 untuk objek tersembunyi; konflik state/idempotency: 409; preview expired: 410; validasi isi: 422. Ini konvensi API usulan, bukan endpoint yang tersedia.

## Audit dan skenario otorisasi negatif

| Skenario | Respons yang diharapkan | Audit |
| --- | --- | --- |
| Warehouse mengganti warehouse_id batch milik gudang lain | Tolak; tidak ada commit | DENIED tanpa raw data |
| Management memanggil endpoint file secara langsung | Tolak meskipun ID valid | DENIED dengan target tersamarkan |
| Production mencoba import receiving | Tolak sesuai matriks usulan | DENIED |
| Izin dicabut sesudah preview | Commit ditolak dan tidak ada domain baru | DENIED |
| Payload mengirim actor_id orang lain | Abaikan/tolak; identitas dari sesi | Pelaku autentik sesungguhnya |
| Pengguna memakai cursor/filter mode berbeda | Validasi ulang scope; tidak mencampur hasil | Catat kegagalan yang relevan |

## Dependencies

| Dependensi | Kegunaan |
| --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | Indeks Induk Dokumentasi Pengembangan |
| [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md) | Dokumen Kebutuhan Produk |
| [DOC-04](04_SOFTWARE_REQUIREMENTS_SPECIFICATION.md) | Spesifikasi Kebutuhan Perangkat Lunak |
| [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md) | Kontrak Data, Pemetaan Impor, dan Validasi |
| [DOC-09](09_API_SPECIFICATION.md) | Spesifikasi REST API |
| [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md) | Rencana dan Spesifikasi Kasus Pengujian |
| [DOC-16](16_SECURITY_RISK_NFR.md) | Keamanan, Risiko, dan Verifikasi NFR |

## Open issues

Rincian baseline final belum tersedia; lihat register sumber dan keputusan terbuka pada DOC-00.

## Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1.0 | 2026-11-10 | Penyusunan berdasarkan SRC-01; celah sumber dicatat dan desain ditandai PROPOSED. | Belum ada bukti persetujuan |
| 0.2.0 | 2026-11-10 | Integrasi SRC-09 design.md: route, role, token, layar pendukung, metrik dan konflik desain; tetap NEEDS REVIEW. | Belum ada bukti persetujuan |
