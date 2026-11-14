# Matriks Izin Peran, Aksi, Gudang, dan Batch — SRS-36 (Baseline RBAC UJI v0.1)

**UJI BASELINE RBAC v0.1 — ACCEPTED FOR UJI WORKING BASELINE ONLY — NOT AN ACTUAL OR RELEASE AUTHORIZATION**

| Atribut | Nilai |
| --- | --- |
| Dokumen | Artefak SRS-36 (T-02) |
| Versi | 0.2.0 |
| Tanggal | 15 November 2026 |
| Penyusun | Muhammad Luthfi Rafif (Backend Development — Member 4) |
| Dasar keputusan | Komentar Jira SRS-36 `10071` — "PM DECISION — SRS-36: BASELINE RBAC UJI v0.1", status **ACCEPTED FOR UJI WORKING BASELINE ONLY** (15 November 2026) |
| Permintaan review | Komentar Jira SRS-36 `10069` (14 November 2026) |
| Baseline pembanding | DOC-05 v0.2.0, DOC-08 v0.2.0, DOC-16 v0.2.0, DOC-09, DOC-07, design.md v1.0.0, `database/migrations/001_initial_schema.sql` |
| Status UJI | **ACCEPTED FOR UJI WORKING BASELINE ONLY** — baseline kerja terbatas, bukan persetujuan final |
| Status ACTUAL | **PROPOSED / OPEN** — tidak memperoleh izin apa pun dari keputusan ini |
| Sifat | Dokumentasi. Tidak ada implementasi middleware, route guard, session, migration, atau perubahan kode pada dokumen ini. |

> **Batas persetujuan.** Keputusan PM menerima baseline ini **hanya sebagai baseline kerja untuk mode UJI akademik**. Dokumen ini bukan penutupan OD-04/CF-02, bukan pengesahan permission ACTUAL, bukan otorisasi rilis, dan bukan pernyataan bahwa SRS-36 atau SRS-46 selesai. ACTUAL tetap PROPOSED/OPEN dan tidak boleh disimpulkan dari baseline UJI.

## Daftar isi

1. Tujuan dan ruang lingkup
2. Keputusan PM dan batas persetujuan
3. Baseline sumber, versi, dan batasan
4. Empat peran yang diakui
5. Matriks izin impor UJI — ACCEPTED
6. Matriks izin halaman UJI — ACCEPTED
7. Kontrol akses wajib — ACCEPTED untuk UJI
8. Matriks akses gudang berbasis `user_warehouses`
9. Matriks kepemilikan batch (batch ownership)
10. Rekap matriks izin UJI
11. Matriks izin ACTUAL — PROPOSED/OPEN
12. Perbedaan terhadap DOC-05 dan design.md
13. Traceability keputusan dan sumber
14. Keputusan yang belum final
15. Implikasi dan catatan serah terima untuk SRS-46
16. Bukti validasi dokumen
17. Riwayat revisi

---

## 1. Tujuan dan ruang lingkup

1. Menetapkan **baseline RBAC UJI v0.1** hasil keputusan PM sebagai acuan kerja terbatas untuk mode UJI akademik, khususnya pekerjaan navigasi dan routing SRS-46 yang tidak bergantung pada keputusan lain.
2. Mencatat secara eksplisit perbedaan baseline ini terhadap DOC-05 v0.2.0 dan design.md v1.0.0, tanpa mengubah dokumen sumber tersebut.
3. Memisahkan **UJI ACCEPTED** dari **ACTUAL PROPOSED/OPEN** agar tidak ada izin ACTUAL yang disimpulkan dari baseline UJI.
4. Menyediakan bukti keterlacakan (sumber, baris, status) dan daftar keputusan yang masih terbuka.

Ruang lingkup: peran × jenis impor × aksi, peran × halaman use case, akses gudang, kepemilikan batch, dan kontrol akses untuk mode UJI.

Di luar ruang lingkup: implementasi backend middleware, route guard, authorization service, session/authentication, migration/schema, navigasi frontend, permission ACTUAL, dan perubahan status Jira. Dokumen sumber (DOC-00, DOC-05, DOC-07, DOC-08, DOC-09, DOC-16, `design.md`) tidak diubah oleh dokumen ini.

---

## 2. Keputusan PM dan batas persetujuan

Rujukan: komentar Jira SRS-36 `10071` (Adam Yudhistira Muhtar, 15 November 2026).

| Butir keputusan | Isi | Status di dokumen ini |
| --- | --- | --- |
| A | Role dan izin impor UJI: PURCHASING (EXPECTED, COMMITMENT), WAREHOUSE (RECEIVING, STOCK, COUNT), PRODUCTION dan MANAGEMENT tanpa izin impor; aksi View, Upload, Validate, Commit, Cancel | **A** (UJI) — §5 |
| B | Izin view halaman UJI per role, dengan UC-16 sebagai fungsi validasi internal bersama | **A** (UJI) — §6 |
| C | Sepuluh kontrol akses wajib: `user_warehouses`, larangan mutasi batch orang lain, raw/preview ditolak default, validasi tanpa tulis domain, syarat commit, pemeriksaan izin ulang, pembersihan selection/cache, backend otoritas, tanpa role Admin, ACTUAL tanpa izin | **A** (UJI) — §7–§9 |
| D | Keputusan yang belum final: upload/download evidence UC-11, eksekusi rekonsiliasi UC-12, kebijakan ACTUAL, akses lintas pemilik batch, proyeksi endpoint final, state machine DOC-08 | **O** — §14 |
| E | Handoff: masukkan baseline ke matriks SRS-36, catat perbedaan, pisahkan UJI dari ACTUAL, ajukan melalui PR dengan review independen | **Dilaksanakan** oleh dokumen ini |
| F | Batas: tidak menutup OD-04/CF-02, tidak mengesahkan ACTUAL, tidak menandai SRS-36/SRS-46 Done, tidak menggantikan pengujian atau persetujuan rilis | **Berlaku** |

**Yang disetujui:** baseline UJI untuk role, jenis impor, aksi impor, halaman, akses gudang, kepemilikan batch, dan kontrol akses pada §5–§9.

**Yang tidak disetujui:** permission ACTUAL, upload/download evidence UC-11, eksekusi rekonsiliasi UC-12, akses lintas pemilik batch, proyeksi endpoint final, dan finalisasi state machine DOC-08.

---

## 3. Baseline sumber, versi, dan batasan

| Sumber | Versi / status | Bagian yang dipakai | Batas |
| --- | --- | --- | --- |
| Jira SRS-36 `10071` | Keputusan PM, 15 November 2026 | Butir A–F | Keputusan UJI, bukan final ACTUAL |
| Jira SRS-36 `10069` | Permintaan review, 14 November 2026 | Daftar hal yang diminta dan prinsip review | Bukan persetujuan |
| DOC-00 `development-docs/00_MASTER_DOCUMENTATION_INDEX.md` | Register | OD-04 L143; OD-07 L146; CF-02 L225; CF-03 L226; CF-04 L227; CF-07 L230 | OD-04, OD-07, CF-03, CF-04 masih terbuka |
| DOC-05 `development-docs/05_BUSINESS_RULES_RBAC.md` | v0.2.0, DRAFT — NEEDS REVIEW | BR-SEC-01 L60; BR-DAT-02 L61; Matriks izin PROPOSED L63–131; otorisasi backend L135; state/error L139; skenario negatif L143–150 | Kolom View/Create/Execute/Download; "P" bukan izin produksi |
| DOC-08 `development-docs/08_DATA_CONTRACT_IMPORT_SPECIFICATION.md` | v0.2.0, PROPOSED | Metadata impor L59–69; validasi dan preview L148–150; state machine L154–168; commit dan konkurensi L169–174 | State machine berstatus PROPOSED dan belum final |
| DOC-16 `development-docs/16_SECURITY_RISK_NFR.md` | v0.2.0, PROPOSED | Deny-by-default dan access control L46; keamanan file/privat L58–60; kriteria penerimaan keamanan L96 | Kontrol belum diverifikasi (NOT RUN) |
| DOC-09 `development-docs/09_API_SPECIFICATION.md` | PROPOSED / NOT IMPLEMENTED | `AuthContext` L66; allowed roles API-01–API-22 L97–439 | Proyeksi endpoint final belum disetujui |
| DOC-07 `development-docs/07_DATABASE_DESIGN.md` | PROPOSED | `users` L123–138; `warehouses` L140–154; `user_warehouses` L156–169; `audit_events` L550–573 | Schema belum menjadi kontrak final |
| design.md (SRC-09) | v1.0.0, kontrak desain | §3.1 L133–145 (navigasi dan akses); §3.3 L208–232 (role per layar); §8.4 L1428–1432 (akses terikat user/gudang/mode/objek) | Bukan persetujuan izin produksi |
| `database/migrations/001_initial_schema.sql` | PROPOSED (header file) | `users.role` CHECK empat nilai; `warehouses`; `user_warehouses`; `import_batches` | Baseline teknis, bukan persetujuan bisnis |
| `packages/contracts/src/enums.ts` | Kode kontrak | `UserRole`, `ImportType`, `BatchStatus` | Enum teknis, bukan kebijakan izin |

**Batasan yang tetap berlaku:**

- **OD-04 OPEN DECISION** — matriks izin final (termasuk ACTUAL) belum ada (DOC-00 L143).
- **CF-02** mencatat perbedaan role view DOC-05 vs SRC-09 (DOC-00 L225); keputusan PM menyelesaikan view UJI, tetapi status CF-02 sebagai catatan terbuka tidak diubah.
- **OD-07 OPEN** — mekanisme sesi/autentikasi belum diputuskan (DOC-00 L146).
- **DOC-08 state machine PROPOSED** — status proses yang mengizinkan tindakan belum final; **CF-07** mencatat perbedaan penamaan state (DOC-00 L230).
- **Seluruh kontrol DOC-16 berstatus NOT RUN** — tidak ada bukti implementasi atau pengujian runtime.
- **Tidak ada endpoint yang berjalan** — DOC-09 masih PROPOSED/NOT IMPLEMENTED.

---

## 4. Empat peran yang diakui

| Kode | Peran (`users.role`) | Cakupan UJI yang disetujui PM |
| --- | --- | --- |
| P | `PURCHASING` | Impor EXPECTED dan COMMITMENT; halaman UC-01, 02, 04, 05, 06, 07, 08 |
| W | `WAREHOUSE` | Impor RECEIVING, STOCK, COUNT; halaman UC-03, 04, 05, 07, 09, 10, 11, 12, 13, 14, 15 |
| R | `PRODUCTION` | Tanpa izin impor; halaman UC-06 (baca referensi material WO) |
| M | `MANAGEMENT` | Tanpa izin impor; halaman UC-08, 13, 14 dengan proyeksi data aman |

- Nilai role mengikuti `users.role` CHECK pada migration 001: hanya `PURCHASING`, `WAREHOUSE`, `PRODUCTION`, `MANAGEMENT` (juga `packages/contracts/src/enums.ts`).
- **Tidak ada** `ADMIN`, role kelima, akun supplier, atau registrasi publik (PM butir C; design.md L145; DOC-16 L60).
- Role switch hanya alat demonstrasi berlabel Simulasi dan tidak mengubah izin (design.md L145).

Status: **A (UJI)** untuk keberadaan empat peran dan pembagiannya, berdasarkan PM butir A–B; ACTUAL tetap **O**.

---

## 5. Matriks izin impor UJI — ACCEPTED

### 5.1 Keputusan PM (butir A)

| Role | Jenis impor | Aksi |
| --- | --- | --- |
| PURCHASING | EXPECTED, COMMITMENT | View, Upload, Validate, Commit, Cancel |
| WAREHOUSE | RECEIVING, STOCK, COUNT | View, Upload, Validate, Commit, Cancel |
| PRODUCTION | Tidak ada | Tidak memiliki izin impor |
| MANAGEMENT | Tidak ada | Tidak memiliki izin impor |

Sumber: Jira SRS-36 `10071` butir A.

### 5.2 Pemetaan nama PM ke jenis impor teknis

| Nama PM | `import_type` | Use case | Layar | Sumber |
| --- | --- | --- | --- | --- |
| EXPECTED | `INBOUND_REFERENCE` | UC-01 | UI-01 Impor Referensi Inbound | migration 001 `import_batches.import_type` CHECK; DOC-08 L50; design.md L216 |
| COMMITMENT | `SUPPLIER_COMMITMENT` | UC-02 | UI-02 Impor Janji Supplier | migration 001; DOC-08 L51; design.md L217 |
| RECEIVING | `RECEIVING` | UC-03 | UI-03 Impor Penerimaan | migration 001; DOC-08 L52; design.md L218 |
| STOCK | `STOCK` | UC-09 | UI-09 Impor Data Stok | migration 001; DOC-08 L53; design.md L224 |
| COUNT | `PHYSICAL_COUNT` | UC-10 | UI-10 Impor Hasil Hitung Fisik | migration 001; DOC-08 L54; design.md L225 |

Tidak ada jenis impor lain yang ditambahkan. Nama PM dan nama teknis tidak boleh dipertukarkan tanpa pemetaan ini.

### 5.3 Matriks lengkap role × jenis impor × aksi (UJI)

`A` = ACCEPTED untuk UJI; `T` = TOLAK. Tidak ada nilai `P` pada matriks ini karena baseline UJI sudah diputuskan.

| Jenis impor | Role | View | Upload | Validate | Commit | Cancel | Status | Sumber |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `INBOUND_REFERENCE` (EXPECTED) | PURCHASING | A | A | A | A | A | A | PM `10071` A |
| `INBOUND_REFERENCE` (EXPECTED) | WAREHOUSE | T | T | T | T | T | A | PM `10071` A |
| `INBOUND_REFERENCE` (EXPECTED) | PRODUCTION | T | T | T | T | T | A | PM `10071` A |
| `INBOUND_REFERENCE` (EXPECTED) | MANAGEMENT | T | T | T | T | T | A | PM `10071` A |
| `SUPPLIER_COMMITMENT` (COMMITMENT) | PURCHASING | A | A | A | A | A | A | PM `10071` A |
| `SUPPLIER_COMMITMENT` (COMMITMENT) | WAREHOUSE | T | T | T | T | T | A | PM `10071` A |
| `SUPPLIER_COMMITMENT` (COMMITMENT) | PRODUCTION | T | T | T | T | T | A | PM `10071` A |
| `SUPPLIER_COMMITMENT` (COMMITMENT) | MANAGEMENT | T | T | T | T | T | A | PM `10071` A |
| `RECEIVING` | PURCHASING | T | T | T | T | T | A | PM `10071` A |
| `RECEIVING` | WAREHOUSE | A | A | A | A | A | A | PM `10071` A |
| `RECEIVING` | PRODUCTION | T | T | T | T | T | A | PM `10071` A |
| `RECEIVING` | MANAGEMENT | T | T | T | T | T | A | PM `10071` A |
| `STOCK` | PURCHASING | T | T | T | T | T | A | PM `10071` A |
| `STOCK` | WAREHOUSE | A | A | A | A | A | A | PM `10071` A |
| `STOCK` | PRODUCTION | T | T | T | T | T | A | PM `10071` A |
| `STOCK` | MANAGEMENT | T | T | T | T | T | A | PM `10071` A |
| `PHYSICAL_COUNT` (COUNT) | PURCHASING | T | T | T | T | T | A | PM `10071` A |
| `PHYSICAL_COUNT` (COUNT) | WAREHOUSE | A | A | A | A | A | A | PM `10071` A |
| `PHYSICAL_COUNT` (COUNT) | PRODUCTION | T | T | T | T | T | A | PM `10071` A |
| `PHYSICAL_COUNT` (COUNT) | MANAGEMENT | T | T | T | T | T | A | PM `10071` A |

Sumber: Jira SRS-36 `10071` butir A; pemetaan teknis §5.2.

Catatan: `View` pada tabel ini berarti melihat data halaman impor yang diizinkan. `View` **tidak** memberi akses ke raw file, preview batch milik pengguna lain, atau operasi mutasi (§6.3, §7).

### 5.4 Syarat tambahan untuk aksi mutasi

Aksi `Upload`, `Validate`, `Commit`, dan `Cancel` hanya boleh dieksekusi bila **seluruh** syarat berikut terpenuhi.

| No | Syarat | Status | Sumber |
| --- | --- | --- | --- |
| 1 | Role sesuai jenis impor (§5.3) | A | PM butir A |
| 2 | Assignment gudang sesuai `user_warehouses` (§8) | A | PM butir C |
| 3 | Mode permintaan adalah `UJI` | A | PM butir A dan C; DOC-05 L135 |
| 4 | Batch dimiliki pengguna (`import_batches.created_by`, §9) | A | PM butir C |
| 5 | Status proses mengizinkan tindakan | A (prinsip) / **O** (daftar state) | PM butir C; DOC-08 §12 state machine L154–168 belum final |

Syarat 5 tidak boleh diterjemahkan menjadi daftar state final sampai state machine DOC-08 diselesaikan (§14 nomor 6).

---

## 6. Matriks izin halaman UJI — ACCEPTED

### 6.1 Keputusan PM (butir B)

| Role | Halaman use case yang diizinkan |
| --- | --- |
| PURCHASING | UC-01, UC-02, UC-04, UC-05, UC-06, UC-07, UC-08 |
| WAREHOUSE | UC-03, UC-04, UC-05, UC-07, UC-09, UC-10, UC-11, UC-12, UC-13, UC-14, UC-15 |
| PRODUCTION | UC-06 |
| MANAGEMENT | UC-08, UC-13, UC-14 (proyeksi data aman) |
| Semua role | UC-16 bukan menu; fungsi validasi internal bersama |

Sumber: Jira SRS-36 `10071` butir B.

### 6.2 Matriks lengkap use case × role (UJI)

| UC | Halaman | PURCHASING | WAREHOUSE | PRODUCTION | MANAGEMENT | Sumber |
| --- | --- | --- | --- | --- | --- | --- |
| UC-01 | UI-01 Impor Referensi Inbound | A | T | T | T | PM butir B; design.md L216 |
| UC-02 | UI-02 Impor Janji Supplier | A | T | T | T | PM butir B; design.md L217 |
| UC-03 | UI-03 Impor Penerimaan | T | A | T | T | PM butir B; design.md L218 |
| UC-04 | UI-04 Exception Inbound | A | A | T | T | PM butir B; design.md L219 |
| UC-05 | UI-05 Pemberitahuan Inbound | A | A | T | T | PM butir B; design.md L220 |
| UC-06 | UI-06 Referensi Material WO | A | T | A | T | PM butir B; design.md L221 |
| UC-07 | UI-07 Riwayat Inbound | A | A | T | T | PM butir B; design.md L222 |
| UC-08 | UI-08 Metrik Supplier | A | T | T | A | PM butir B; design.md L223 |
| UC-09 | UI-09 Impor Data Stok | T | A | T | T | PM butir B; design.md L224 |
| UC-10 | UI-10 Impor Hasil Hitung Fisik | T | A | T | T | PM butir B; design.md L225 |
| UC-11 | UI-11 Arsip Bukti Kartu Stok | T | A (view saja) | T | T | PM butir B dan D; design.md L226 |
| UC-12 | UI-12 Rekonsiliasi Stok | T | A (view saja) | T | T | PM butir B dan D; design.md L227 |
| UC-13 | UI-13 Riwayat Selisih Stok | T | A | T | A | PM butir B; design.md L228 |
| UC-14 | UI-14 Metrik Persediaan | T | A | T | A | PM butir B; design.md L229 |
| UC-15 | UI-15 Audit Proses | T | A | T | T | PM butir B; design.md L230 |
| UC-16 | Fungsi validasi internal bersama (bukan menu) | A (via pemanggil) | A (via pemanggil) | A (via pemanggil) | A (via pemanggil) | PM butir B; DOC-05 L83, L99, L115, L131; design.md L232 |

Catatan:

- `A (view saja)` pada UC-11 dan UC-12 berarti halaman boleh dirancang dan diakses untuk melihat; upload/download evidence dan eksekusi rekonsiliasi **belum disetujui** (PM butir D) dan tidak boleh diaktifkan.
- Baris UC-16 bukan izin mandiri; UC-16 hanya dipanggil oleh alur use case yang sudah berizin.

### 6.3 Batas izin view

Izin view halaman **tidak** otomatis memberikan:

1. Akses raw file (raw content, `storage_key`, `private_storage_key`, path atau URL storage privat) — DOC-05 L65, L135; DOC-16 L58–60.
2. Akses preview atau isi batch milik pengguna lain — PM butir C; default ditolak.
3. Operasi mutasi (upload, validate, commit, cancel) — PM butir A dan C.
4. Akses ke gudang di luar `user_warehouses` — PM butir C; §8.
5. Proyeksi data di luar DTO aman untuk MANAGEMENT — DOC-05 L135; design.md L1434–1435.

---

## 7. Kontrol akses wajib — ACCEPTED untuk UJI

| No | Kontrol | Status | Sumber |
| --- | --- | --- | --- |
| 1 | Akses gudang hanya melalui assignment `user_warehouses` | A | PM butir C; DOC-07 L156–169; migration 001 |
| 2 | Mutasi batch milik pengguna lain ditolak | A | PM butir C; DOC-05 L135 |
| 3 | View raw/preview batch milik pengguna lain ditolak secara default | A | PM butir C; DOC-05 L65 |
| 4 | Validasi tidak menulis data domain | A | PM butir C; DOC-08 L154–158 |
| 5 | Commit mensyaratkan preview sah dan belum expired | A | PM butir C; DOC-08 L148–150, L161–162 |
| 6 | Commit melakukan pemeriksaan izin ulang | A | PM butir C; DOC-05 L139; DOC-08 L171 |
| 7 | Pencabutan izin setelah preview mencegah commit | A | PM butir C; DOC-05 L139, L148 |
| 8 | Pergantian akun, role, gudang, atau mode membersihkan selection/cache yang tidak lagi sah | A | PM butir C; design.md §8.4 L1428–1432 |
| 9 | Backend adalah otoritas akses, bukan frontend | A | PM butir C; DOC-05 L135; DOC-16 L46 |
| 10 | Tidak ada role Admin aplikasi tambahan | A | PM butir C; DOC-16 L60; migration 001 |
| 11 | Mode ACTUAL tidak memperoleh izin melalui keputusan ini | A | PM butir C dan F; §11 |

Catatan pelaksanaan: butir 5 dan 7 bergantung pada state machine DOC-08 yang masih PROPOSED. Kontrolnya disetujui sebagai prinsip; nama dan urutan state final tetap **O** (§14 nomor 6).

---

## 8. Matriks akses gudang berbasis `user_warehouses`

### 8.1 Model data

| Aspek | Temuan | Status | Sumber |
| --- | --- | --- | --- |
| Relasi pengguna–gudang | Tabel pivot `user_warehouses(user_id, warehouse_id)`; unik per pasangan | A (dasar akses) | DOC-07 L156–169; migration 001 |
| Sifat relasi | Banyak-ke-banyak; satu pengguna dapat memiliki beberapa gudang | A | DOC-07 L162–166 |
| Sumber identitas | `user_id`, `role`, `warehouse_ids` dari sesi, bukan payload | A | DOC-09 L66; DOC-05 L135 |
| Urutan pemeriksaan | sesi → role → gudang (`user_warehouses`) → mode → objek/batch → state | A (urutan), O (state) | PM butir C; DOC-05 L135 |
| Gudang nonaktif | `warehouses.is_active` ada; `user_warehouses` tidak memiliki flag aktif sendiri | O | migration 001; DOC-07 L156–169 |
| Agregasi lintas gudang | Tidak diatur oleh keputusan PM | O | PM butir C |

### 8.2 Matriks akses per aksi

Tabel ini hanya berlaku untuk role dan aksi yang telah diizinkan pada §5–§6. Akses gudang tidak menambah izin yang tidak ada.

| Aksi | Berlaku untuk | Ketentuan gudang | Status | Sumber |
| --- | --- | --- | --- | --- |
| Membuka halaman | Role yang diizinkan §6.2 | `warehouse_id` aktif harus ada pada `user_warehouses` pengguna | A | PM butir C; design.md §8.4 L1432 |
| Melihat data | Role yang diizinkan §6.2 | Filter `warehouse_id ∈ user_warehouses` sebelum pagination/agregasi | A | PM butir C; DOC-05 L135 |
| Upload | PURCHASING (EXPECTED, COMMITMENT), WAREHOUSE (RECEIVING, STOCK, COUNT) | `warehouse_id` wajib termasuk scope sesi | A | PM butir A dan C; DOC-08 L65 |
| Validate | idem | Scope batch harus sama dengan scope sesi | A | PM butir A dan C; DOC-08 L150 |
| Commit | idem | Scope diperiksa ulang saat commit | A | PM butir C; DOC-05 L139 |
| Cancel | idem, oleh pemilik batch | Hanya batch dalam scope dan milik pengguna | A | PM butir C; §9 |
| Riwayat | PURCHASING, WAREHOUSE | Hanya gudang dalam scope | A | PM butir B; DOC-05 L135 |
| Unduh evidence | Belum final | — | O | PM butir D; §14 nomor 1 |
| Audit proses | WAREHOUSE | Hanya gudang dalam scope | A | PM butir B; design.md L230 |
| Rekonsiliasi (eksekusi) | Belum final | — | O | PM butir D; §14 nomor 2 |

### 8.3 Aturan lintas gudang

1. **Akses lintas gudang ditolak.** Permintaan dengan `warehouse_id` di luar assignment sesi harus ditolak (PM butir C; DOC-05 L145).
2. **Tidak ada pengecualian all-warehouse.** Keputusan PM menyatakan akses gudang hanya melalui assignment `user_warehouses`; tidak ada pengecualian yang diberikan kepada role mana pun, termasuk MANAGEMENT (PM butir C; DOC-05 L65).
3. **Agregasi lintas gudang belum diatur** dan berstatus `O`; tidak boleh diaktifkan sebelum ada keputusan.
4. **Perubahan assignment** (penambahan/pencabutan) wajib membersihkan selection/cache yang tidak lagi sah (PM butir C; design.md §8.4 L1432).
5. **Gudang nonaktif** belum diatur; berstatus `O` (§14 nomor 7).

---

## 9. Matriks kepemilikan batch (batch ownership)

### 9.1 Definisi

- **Pemilik batch** = pengguna pembuat batch, direpresentasikan `import_batches.created_by` (migration 001). Definisi ini **I** (inferensi dari schema), sedangkan kewajiban memeriksa ownership adalah **A** (PM butir C).
- **Ownership** dan **akses gudang** adalah dua pemeriksaan berbeda. Memiliki akses ke gudang tidak memberi hak operasi atas seluruh batch di gudang tersebut.

### 9.2 Matriks

| Skenario | Lihat metadata | Lihat raw/preview | Mutasi (upload/validate/commit/cancel) | Status | Sumber |
| --- | --- | --- | --- | --- | --- |
| Pemilik batch, role dan gudang sesuai, state mengizinkan | A | A | A | A | PM butir C; migration 001 `created_by`; DOC-08 L154–168 |
| Pemilik batch, state terminal (`COMMITTED`/`CANCELLED`) | A | A | T (immutable) | I (menunggu state machine) | DOC-08 L167 |
| Pengguna lain, role sama, gudang sama | O | T (default) | T | A (larangan) / O (metadata) | PM butir C; DOC-05 L135 |
| Pengguna lain, role berbeda, gudang sama | Hanya halaman baca yang diizinkan §6.2 | T | T | A | PM butir B dan C; DOC-05 L143–150 |
| Pengguna lain, gudang berbeda | T | T | T | A | PM butir C; DOC-05 L145 |
| MANAGEMENT | Hanya proyeksi aman UC-08, UC-13, UC-14 | T | T | A (larangan) / O (field proyeksi) | PM butir B dan C; DOC-05 L65, L135 |
| Transfer kepemilikan batch | — | — | — | O | PM butir D; §14 nomor 4 |

### 9.3 Prinsip yang berlaku

1. Mutasi hanya oleh pemilik batch yang masih memiliki role, assignment gudang, dan mode UJI yang sah (PM butir C).
2. Pengguna dengan role sama **tidak** otomatis mewarisi hak mutasi; default view raw/preview milik orang lain adalah **tolak** (PM butir C).
3. Pemeriksaan ownership diulang saat commit (PM butir C; DOC-05 L139).
4. Pencabutan role/gudang setelah preview mencegah commit (PM butir C; DOC-05 L148).
5. `COMMITTED`/`CANCELLED` tidak dapat diubah — status **I** karena bergantung pada finalisasi state machine DOC-08 (DOC-08 L171; §14 nomor 6).
6. Model akses lintas pemilik batch yang lebih luas (misalnya reviewer melihat batch orang lain) **belum diputuskan** dan tidak boleh diimplementasikan (PM butir D).

---

## 10. Rekap matriks izin UJI

### 10.1 Rekap per jenis impor

| Jenis impor | PURCHASING | WAREHOUSE | PRODUCTION | MANAGEMENT |
| --- | --- | --- | --- | --- |
| EXPECTED (`INBOUND_REFERENCE`) | A — View, Upload, Validate, Commit, Cancel | T | T | T |
| COMMITMENT (`SUPPLIER_COMMITMENT`) | A — View, Upload, Validate, Commit, Cancel | T | T | T |
| RECEIVING | T | A — View, Upload, Validate, Commit, Cancel | T | T |
| STOCK | T | A — View, Upload, Validate, Commit, Cancel | T | T |
| COUNT (`PHYSICAL_COUNT`) | T | A — View, Upload, Validate, Commit, Cancel | T | T |

### 10.2 Rekap akses halaman per role

| Role | Jumlah UC | Daftar UC | Halaman mutasi impor |
| --- | --- | --- | --- |
| PURCHASING | 7 | UC-01, 02, 04, 05, 06, 07, 08 | UC-01, UC-02 |
| WAREHOUSE | 11 | UC-03, 04, 05, 07, 09, 10, 11, 12, 13, 14, 15 | UC-03, UC-09, UC-10 |
| PRODUCTION | 1 | UC-06 | Tidak ada |
| MANAGEMENT | 3 | UC-08, 13, 14 | Tidak ada |
| Semua | — | UC-16 sebagai fungsi internal bersama (bukan menu) | Tidak ada |

### 10.3 Ketentuan data UJI

1. Seluruh data berlabel UJI dan tidak boleh masuk dataset ACTUAL (BR-DAT-02 L61; PM butir C dan F).
2. Alur UJI tetap menjalankan validasi, preview, expiry, commit atomik, dan audit (DOC-08 L148–174).
3. Izin UJI **tidak** menjadi dasar, bukti, atau inferensi izin ACTUAL (PM butir F).
4. Baseline ini tidak mengubah status dokumen sumber mana pun; DOC-05, DOC-08, DOC-16, dan design.md tetap berstatus semula.

---

## 11. Matriks izin ACTUAL — PROPOSED/OPEN

**Tidak ada izin ACTUAL yang diberikan oleh dokumen ini.** Keputusan PM butir C dan F menyatakan mode ACTUAL tidak memperoleh izin melalui keputusan ini.

| Jenis impor | PURCHASING | WAREHOUSE | PRODUCTION | MANAGEMENT | Status |
| --- | --- | --- | --- | --- | --- |
| EXPECTED (`INBOUND_REFERENCE`) | O | O | O | O | PROPOSED/OPEN |
| COMMITMENT (`SUPPLIER_COMMITMENT`) | O | O | O | O | PROPOSED/OPEN |
| RECEIVING | O | O | O | O | PROPOSED/OPEN |
| STOCK | O | O | O | O | PROPOSED/OPEN |
| COUNT (`PHYSICAL_COUNT`) | O | O | O | O | PROPOSED/OPEN |

| Halaman | PURCHASING | WAREHOUSE | PRODUCTION | MANAGEMENT | Status |
| --- | --- | --- | --- | --- | --- |
| UC-01 sampai UC-16 (ACTUAL) | O | O | O | O | PROPOSED/OPEN |

Ketentuan yang tetap berlaku meskipun izin ACTUAL belum diputuskan:

1. **Deny-by-default** — tanpa izin ACTUAL eksplisit, permintaan ACTUAL ditolak (DOC-16 L46).
2. **ACTUAL tidak boleh diinferensi dari UJI** (PM butir F; BR-DAT-02 L61).
3. **Tidak ada raw/evidence untuk MANAGEMENT** (DOC-05 L65; DOC-16 L58–60).
4. **Cutoff ACTUAL** harus memenuhi ketentuan cutoff yang belum final (DOC-00 CF-04 L227).
5. **Data mitra ACTUAL belum tersedia**; tidak boleh direkayasa sebagai ACTUAL (BR-DAT-02 L61).
6. Upload/download evidence UC-11, eksekusi rekonsiliasi UC-12, akses lintas pemilik batch, dan state machine DOC-08 tetap berlaku sebagai keputusan terbuka untuk ACTUAL maupun UJI (§14).

Status keseluruhan: **PROPOSED/OPEN — bukan penolakan permanen, tetapi belum ada dasar persetujuan.**

---

## 12. Perbedaan terhadap DOC-05 dan design.md

Catatan: dokumen sumber tidak diubah. Tabel ini mencatat perbedaan yang timbul dari keputusan PM dan dari draf sebelumnya.

| ID | Perbedaan / perubahan | Sumber pembanding | Keputusan yang berlaku | Status |
| --- | --- | --- | --- | --- |
| D-01 | DOC-05 memakai kolom kasar View/Create-Import/Execute/Download; baseline ini memakai lima aksi terpisah (View, Upload, Validate, Commit, Cancel) | DOC-05 L66–131 | Granularitas PM butir A berlaku untuk UJI | A (UJI) |
| D-02 | DOC-05 memberi WAREHOUSE `Create=P` dan `Download=P` pada UC-11 | DOC-05 L94 | PM butir D menahan upload/download evidence; halaman hanya boleh dirancang untuk view | O |
| D-03 | DOC-05 memberi WAREHOUSE `Execute=P` pada UC-12 | DOC-05 L95 | PM butir D menahan eksekusi rekonsiliasi; halaman hanya boleh dirancang untuk view | O |
| D-04 | Draf dokumen v0.1 menandai izin UJI sebagai `P`/`I` | Versi 0.1.0 dokumen ini | Keputusan PM mengubahnya menjadi `A` khusus UJI; perubahan dicatat, bukan dihapus | A (UJI) |
| D-05 | Pertanyaan terbuka v0.1 "apakah MANAGEMENT boleh melihat Audit Proses" | Versi 0.1.0 §11; design.md L230 | Diselesaikan: MANAGEMENT tidak memperoleh UC-15 (`T`) | A (UJI) |
| D-06 | Pertanyaan v0.1 "Management dan unduhan" | Versi 0.1.0 §11; DOC-05 L65 | Sebagian diselesaikan: raw/evidence ditolak untuk semua role; unduhan metrik agregat tetap terbuka | A (raw) / O (metrik) |
| D-07 | design.md §3.3 menetapkan role per layar | design.md L216–230 | Selaras penuh dengan PM butir B; tidak ada konflik view UJI | A (UJI) |
| D-08 | CF-02 mencatat perbedaan role view DOC-05 vs SRC-09 | DOC-00 L225 | View UJI diselaraskan; CF-02/OD-04 tetap terbuka untuk ACTUAL dan RBAC final | Sebagian |
| D-09 | DOC-08 state machine berstatus PROPOSED; CF-07 mencatat perbedaan penamaan state | DOC-08 L154–168; DOC-00 L230 | Syarat "status proses mengizinkan" disetujui sebagai prinsip; daftar state final belum | O |
| D-10 | OD-07 belum memutuskan mekanisme sesi/autentikasi | DOC-00 L146 | Matriks hanya menetapkan pemeriksaan; cara penegakan (session store, CSRF) belum | O |
| D-11 | `user_warehouses` tidak memiliki flag aktif; `warehouses.is_active` tersedia | migration 001; DOC-07 L156–169 | Perlakuan gudang nonaktif belum diatur | O |
| D-12 | Draf v0.1 menyatakan SRS-46 tidak boleh memakai matriks sebelum persetujuan | Versi 0.1.0 §12 nomor 1 | PM butir E mengizinkan pemakaian terbatas untuk navigasi/routing; otorisasi backend dan pengujian tetap wajib | A (UJI, terbatas) |

---

## 13. Traceability keputusan dan sumber

| Tema | Ketentuan dalam dokumen | Sumber utama | Kesesuaian |
| --- | --- | --- | --- |
| Empat role | §4 | PM butir C; migration 001 `users.role`; enums | Selaras |
| Tidak ada role Admin | §4, §7 butir 10 | PM butir C; DOC-16 L60; migration 001 | Selaras |
| Izin impor UJI | §5.1–§5.3 | PM butir A; DOC-05 L68–98 | Selaras dengan penajaman aksi (D-01) |
| Syarat mutasi | §5.4 | PM butir A dan C; DOC-08 L148–150 | Selaras; state final belum |
| Izin halaman UJI | §6.1–§6.2 | PM butir B; design.md L216–230; DOC-05 L68–131 | Selaras penuh |
| UC-16 internal | §6.2 catatan | PM butir B; DOC-05 L83, L99, L115, L131; design.md L232 | Selaras |
| Batas izin view | §6.3 | PM butir B dan C; DOC-05 L65, L135; DOC-16 L58–60 | Selaras |
| Akses gudang | §8 | PM butir C; DOC-07 L156–169; migration 001; design.md L1428–1432 | Selaras |
| Publikasi DTO aman | §6.3, §9.2 | DOC-05 L135; DOC-16 L58–60 | Selaras |
| Kepemilikan batch | §9 | PM butir C; migration 001 `created_by` | Selaras; definisi `created_by` inferensi (I) |
| Deny-by-default | §7 butir 9, §11 | DOC-16 L46 | Selaras; belum diverifikasi (NOT RUN) |
| ACTUAL terpisah | §11 | PM butir C dan F; DOC-00 OD-04 L143 | Selaras |
| Evidence dan rekonsiliasi ditahan | §6.2, §14 | PM butir D; DOC-05 L94–95; DOC-00 CF-03 L226 | Selaras |
| State machine | §5.4, §9.2, §14 | DOC-08 L154–168; DOC-00 CF-07 L230 | Belum final (O) |
| Sesi/autentikasi | §14 nomor 9 | DOC-00 OD-07 L146 | Belum final (O) |

---

## 14. Keputusan yang belum final

| No | Keputusan | Mengapa belum final | Dampak bila belum diputuskan | Sumber |
| --- | --- | --- | --- | --- |
| 1 | Upload/download evidence UC-11 | PM butir D | Halaman UC-11 hanya untuk view; upload dan unduh tidak boleh diaktifkan | PM butir D; DOC-05 L94; DOC-00 CF-03 L226 |
| 2 | Eksekusi rekonsiliasi UC-12 | PM butir D | Halaman UC-12 hanya untuk view; eksekusi tidak boleh diaktifkan | PM butir D; DOC-05 L95 |
| 3 | Kebijakan ACTUAL | PM butir D dan F; OD-04/OD-05/CF-04 | Seluruh permission ACTUAL tetap `O`; tidak ada izin ACTUAL | DOC-00 L143, L144, L227 |
| 4 | Akses lintas pemilik batch | PM butir D | Default tolak dipertahankan; tidak ada berbagi metadata/preview, tidak ada transfer | PM butir C dan D |
| 5 | Proyeksi endpoint final | PM butir D | DOC-09 tetap PROPOSED; daftar endpoint dan allowed roles belum final | DOC-09 L62–439 |
| 6 | State machine DOC-08 | PM butir D; CF-07 | Daftar state dan transisi final belum; syarat commit/immutability menunggu | DOC-08 L154–168; DOC-00 L230 |
| 7 | Gudang nonaktif | Tidak diatur PM; C-07 | Perlakuan `warehouses.is_active` belum ditetapkan | migration 001; DOC-07 L156–169 |
| 8 | Agregasi lintas gudang | Tidak diatur PM | Tidak ada agregasi lintas gudang yang boleh diaktifkan | PM butir C |
| 9 | Mekanisme sesi/autentikasi | OD-07 | Cara penegakan izin (session store, CSRF, expiry) belum ditetapkan | DOC-00 L146 |
| 10 | Field proyeksi aman MANAGEMENT | PM only states "proyeksi data aman" | Daftar field final untuk UC-08, UC-13, UC-14 belum ditetapkan | PM butir B; DOC-05 L135; DOC-16 L58–60 |

Semua butir di atas berstatus **O** dan tidak boleh diisi dengan asumsi pada implementasi.

---

## 15. Implikasi dan catatan serah terima untuk SRS-46

### 15.1 Yang sudah boleh dilakukan

1. Vassell boleh memakai baseline UJI ini untuk pekerjaan **navigasi dan routing** SRS-46 yang tidak bergantung pada keputusan lain (PM butir E).
2. Menu dan route per role mengikuti §6.2; halaman yang tidak diizinkan tidak ditampilkan.
3. Penyembunyian menu di frontend bukan kontrol keamanan; backend tetap otoritas akses (PM butir C; DOC-05 L135).

### 15.2 Yang belum boleh dilakukan

1. Implementasi atau aktivasi permission ACTUAL (§11).
2. Upload/download evidence UC-11 dan eksekusi rekonsiliasi UC-12 (§14 nomor 1–2).
3. Akses lintas pemilik batch di luar default tolak (§14 nomor 4).
4. Menetapkan proyeksi endpoint final atau state machine final (§14 nomor 5–6).
5. Menambah role, menu, atau endpoint baru di luar baseline.

### 15.3 Kewajiban sebelum DoD

1. Otorisasi backend, integrasi sesi, dan pengujian tetap wajib sebelum DoD (PM butir E).
2. Urutan pemeriksaan yang disetujui: sesi → role → gudang (`user_warehouses`) → mode → objek/batch → state (§7, §8).
3. Pemeriksaan diulang pada commit; pencabutan izin setelah preview mencegah commit (§7 butir 6–7).
4. Audit `DENIED` tanpa raw/secret (DOC-05 L145–146).
5. Dokumen ini tidak menandai SRS-36 atau SRS-46 selesai (PM butir F).

### 15.4 Checklist review SRS-46 terhadap baseline

- [ ] Hanya empat role; tidak ada ADMIN.
- [ ] Izin impor sesuai §5.3 (termasuk PRODUCTION dan MANAGEMENT tanpa izin impor).
- [ ] Halaman per role sesuai §6.2.
- [ ] UC-16 tidak menjadi menu.
- [ ] Akses gudang dibatasi `user_warehouses`.
- [ ] Mutasi hanya oleh pemilik batch.
- [ ] Raw/preview batch orang lain ditolak default.
- [ ] ACTUAL tidak diaktifkan.
- [ ] UC-11 evidence dan UC-12 eksekusi tidak diaktifkan.
- [ ] Perubahan akun/role/gudang/mode membersihkan selection/cache.

---

## 16. Bukti validasi dokumen

Seluruh baris di bawah adalah hasil pemeriksaan **dokumen** pada 15 November 2026. Tidak ada pengujian runtime, build, atau eksekusi kode aplikasi yang dilakukan untuk PR ini.

| Pemeriksaan | Metode | Hasil |
| --- | --- | --- |
| Struktur bagian | Deteksi heading `## N.` dan pencocokan urutan 1–17 | PASS — seluruh 17 bagian ada dan berurutan |
| Konsistensi kolom tabel | Hitung jumlah pipa setiap baris pada tiap blok tabel | PASS — 0 ketidaksesuaian |
| Sitasi baris matriks | §5.3 (20 baris), §6.2 (16 baris), §7 (11 baris), §8.2 (10 baris), §9.2 (7 baris) | PASS — 0 baris tanpa sitasi |
| Secret scan | Pola kredensial: connection string, assignment password, token GitHub, AWS key, private key, nama variabel environment database | PASS — 0 temuan |
| ACTUAL tanpa grant | Deteksi nilai `A` pada §11 | PASS — 0 baris izin ACTUAL |
| Scope berkas | `git status --porcelain` dan diff terhadap `origin/develop` | PASS — hanya `development-docs/MATRIK_PERMUTASI_SRS-36.md` |
| Pengujian runtime aplikasi | — | NOT RUN — di luar ruang lingkup dokumen |

---

## 17. Riwayat revisi

| Versi | Tanggal | Perubahan | Status |
| --- | --- | --- | --- |
| 0.1.0 | 2026-11-15 | Penyusunan usulan awal berbasis DOC-05, DOC-07, DOC-08, DOC-09, DOC-16, design.md, migration 001, dan permintaan review Jira `10069` | DRAFT — menunggu review PM |
| 0.2.0 | 2026-11-15 | Memasukkan keputusan PM `10071` (Baseline RBAC UJI v0.1): izin impor dan halaman UJI menjadi `A`, kontrol akses dan kepemilikan batch diperbarui, ACTUAL dipisahkan sebagai PROPOSED/OPEN, register perbedaan D-01–D-12 dan traceability ditambahkan | UJI ACCEPTED FOR UJI WORKING BASELINE ONLY; ACTUAL PROPOSED/OPEN |
