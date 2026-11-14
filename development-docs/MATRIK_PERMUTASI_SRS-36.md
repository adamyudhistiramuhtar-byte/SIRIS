# Matriks Izin Peran, Aksi, Gudang, dan Batch — SRS-36 (Usulan)

**DRAFT — PROPOSED FOR PM REVIEW — NOT APPROVED FOR SRS-46 IMPLEMENTATION**

| Atribut | Nilai |
| --- | --- |
| Terkait | SRS-36 (T-02), OD-04, CF-02, SRS-46, SRS-47, SRS-48 |
| Status | DRAFT — usulan untuk review PM; bukan kebijakan final |
| Penyusun | Muhammad Luthfi Rafif (Backend Developer) |
| Tanggal | 15 November 2026 |
| Baseline awal | DOC-05 v0.2.0, Matriks izin PROPOSED |
| Sifat | Proposal analisis. Tidak ada izin yang diimplementasikan, tidak ada perubahan kode, migration, seed, route, atau guard frontend. |

> Dokumen ini **bukan** penetapan izin. Seluruh nilai berlabel `P`, `T`, `I`, atau `N` tetap usulan sampai PM menyetujui OD-04 dan CF-02. Jangan menyalin matriks ini menjadi guard, middleware, atau policy produksi sebelum persetujuan tertulis.

---

## 1. Tujuan dan ruang lingkup

1. Menyediakan usulan matriks izin `peran × jenis impor/use case × aksi × gudang × batch` sebagai input SRS-46 dan SRS-47/SRS-48.
2. Memisahkan izin **UJI** dan **ACTUAL**, tanpa menyimpulkan ACTUAL dari UJI.
3. Mendokumentasikan perbedaan terhadap DOC-05, celah keputusan, dan pertanyaan yang harus dijawab PM.
4. Menjadi dasar review sebelum Vassell memakai matriks untuk SRS-46.

Di luar ruang lingkup: implementasi izin, perubahan kode/migration/seed, perubahan Jira, penetapan role baru, akun supplier, dan keputusan OD-04/CF-02.

---

## 2. Baseline sumber dan batasannya

| Sumber | Bagian yang dipakai | Status sumber | Batas |
| --- | --- | --- | --- |
| DOC-05 `development-docs/05_BUSINESS_RULES_RBAC.md` | BR-IMP/DAT/INB/INV/EVD/AUD/SEC L41–61; Matriks izin PROPOSED L63–131; otorisasi backend L133–135; skenario negatif L141–150 | DRAFT — NEEDS REVIEW | Matriks memakai kolom kasar View/Create/Execute/Download; rincian aksi tetap usulan |
| DOC-00 `development-docs/00_MASTER_DOCUMENTATION_INDEX.md` | OD-04 L143; OD-07 L146; CF-02 L225; CF-07 L230; CF-08 L231; blocker L185 | Register | OD-04 dan OD-07 masih OPEN |
| DOC-09 `development-docs/09_API_SPECIFICATION.md` | L62 (semua endpoint PROPOSED), L66 (AuthContext), API-01–API-22 L97–439 | PROPOSED / NOT IMPLEMENTED | Allowed roles per endpoint masih usulan |
| DOC-16 `development-docs/16_SECURITY_RISK_NFR.md` | L46 (deny-by-default), L58–60 (file privat), L96 (kriteria keamanan) | Kontrol usulan; verifikasi NOT RUN | Bukan bukti implementasi |
| SRC-09 `design.md` v1.0.0 | §3.1 L133–145 (navigasi dan akses), §3.3 L208–230 (peran tiap layar), §8.4 L1428–1432 (akses terikat user/gudang/mode/objek) | Kontrak desain untuk ditinjau | Bukan persetujuan izin produksi |
| DOC-07 `development-docs/07_DATABASE_DESIGN.md` | `users` L123–138; `warehouses` L140–154; `user_warehouses` L156–169; `audit_events` L550–573; integritas L575–579 | PROPOSED | Schema belum menjadi kontrak final |
| `database/migrations/001_initial_schema.sql` | `users.role` CHECK; `user_warehouses`; `import_batches` | PROPOSED (header file) | Baseline teknis aktual, bukan persetujuan bisnis |
| DOC-08 `development-docs/08_DATA_CONTRACT_IMPORT_SPECIFICATION.md` | Metadata L59–69; validasi/preview L148–150; state machine L154–171 | PROPOSED | State dan kontrak import belum final |

**Batasan utama yang harus dibaca sebelum matriks:**

- **OD-04 OPEN DECISION** — matriks izin final belum ada (DOC-00 L143).
- **CF-02 belum final** — peran tiap view masih perlu review; SRC-09 hanya menyebut Warehouse untuk sebagian layar (DOC-00 L225).
- **OD-07 OPEN** — mekanisme sesi/autentikasi belum diputuskan (DOC-00 L146), sehingga cara penerapan izin (AuthContext, session store, CSRF) belum final.
- **29 FR, 14 NFR, dan 55 tes asli masih SOURCE REQUIRED** — tidak dapat dipakai untuk menyimpulkan izin.
- **Semua endpoint DOC-09 masih PROPOSED/NOT IMPLEMENTED** — tidak ada izin runtime yang sudah berjalan.

---

## 3. Empat peran yang diakui

| Kode | Peran | Cakupan yang disebut sumber |
| --- | --- | --- |
| P | `PURCHASING` | Referensi inbound, janji supplier, exception/notices, riwayat inbound, metrik supplier, referensi WO (design §3.3 L216–222; DOC-05 L68–83) |
| W | `WAREHOUSE` | Penerimaan, stok, hitung fisik, evidence, rekonsiliasi, riwayat selisih, audit (design §3.3 L218, L224–230; DOC-05 L84–99) |
| R | `PRODUCTION` | Referensi material WO read-only (design L142, L221; DOC-05 L100–115) |
| M | `MANAGEMENT` | Metrik supplier dan persediaan, riwayat selisih; tanpa raw/evidence (DOC-05 L116–131, L65; design L229–230) |

- Peran mengikuti `users.role` CHECK pada migration 001: hanya empat nilai.
- **Tidak ada** `ADMIN`, peran kelima, akun supplier, registrasi publik, atau role switch operasional (design L145; DOC-16).
- Role switch hanya alat demonstrasi berlabel Simulasi dan tidak mengubah izin (design L145).

Status: **A** untuk keberadaan empat peran (migration 001 + `packages/contracts/src/enums.ts`); pembagian akses per peran tetap **P** sampai OD-04/CF-02 selesai.

---

## 4. Matriks peran × jenis impor × aksi (UJI)

### 4.1 Legenda

| Label | Arti |
| --- | --- |
| **A** | ACCEPTED — diterima eksplisit oleh keputusan proyek |
| **P** | PROPOSED — usulan baseline, menunggu persetujuan |
| **T** | TOLAK — ditolak dalam rancangan sesuai konvensi DOC-05 L65 |
| **I** | INFERRED — inferensi analitis, bukan requirement yang diterima |
| **N** | NOT FOUND / NOT DECIDED — tidak ada dasar aturan |

Catatan label `T`: DOC-05 L65 mendefinisikan `T` sebagai "ditolak dalam rancangan". Skema label PM mendefinisikan `T` sebagai TENTATIVE; karena tidak ada izin yang secara eksplisit dinyatakan tentative di sumber, nilai `T` pada dokumen ini **selalu bermakna ditolak** dan tidak boleh dibaca sebagai izin sementara. Jika PM menghendaki label terpisah untuk "tentative", konvensi harus ditetapkan lebih dulu.

### 4.2 Jenis impor yang diakui

| Jenis impor (`import_type`) | Use case | Layar (design §3.3) |
| --- | --- | --- |
| `INBOUND_REFERENCE` (EXPECTED) | UC-01 | UI-01 Impor Referensi Inbound (Purchasing) |
| `SUPPLIER_COMMITMENT` (INITIAL/CHANGE) | UC-02 | UI-02 Impor Janji Supplier (Purchasing) |
| `RECEIVING` | UC-03 | UI-03 Impor Penerimaan (Warehouse) |
| `STOCK` (QTY AKHIR) | UC-09 | UI-09 Impor Data Stok (Warehouse) |
| `PHYSICAL_COUNT` | UC-10 | UI-10 Impor Hasil Hitung Fisik (Warehouse) |

Sumber jenis: migration 001 `import_batches.import_type` CHECK; DOC-08 §Inventaris sumber L46–56; design §3.3 L216–218, L224–225.

### 4.3 Matriks aksi per jenis impor

Nilai di bawah adalah izin **UJI** (akademik). Kolom ACTUAL dibahas terpisah di §8 dan **tidak** boleh diturunkan dari tabel ini.

#### 4.3.1 `INBOUND_REFERENCE` (UC-01)

| Aksi | P | W | R | M | Status | Sumber | Rasional / pertanyaan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Buka/akses layar | P | T | T | T | P | DOC-05 L68, L84, L100, L116; design L216 | UI-01 hanya Purchasing |
| Lihat/baca data | P | T | T | T | P | DOC-05 L68; DOC-09 API-06/09 allowed roles | Warehouse T pada UC-01 meski tergabung di grup Supplier Inbound |
| Unggah berkas | P | T | T | T | P | DOC-05 L68 (Create/Import P) | — |
| Validasi | P | T | T | T | I | DOC-05 L68 (Execute P); DOC-08 L148–150 | Validasi bukan kolom eksplisit DOC-05; diinferensikan dari Execute |
| Commit/simpan | P | T | T | T | P | DOC-05 L68 (Execute P); DOC-08 L154–171 | Terminal `COMMITTED` immutable |
| Batalkan | P | T | T | T | I | DOC-08 L164 (cancel dari STAGED/INVALID/PREVIEW_READY/EXPIRED) | DOC-05 tidak punya kolom cancel; usulan: pemilik batch |
| Riwayat | P | T | T | T | P | DOC-05 L74; design L222 | Riwayat inbound UC-07 |
| Unduh evidence | T | T | T | T | P | DOC-05 L65, L68 | Raw/evidence ditolak untuk semua pada UC-01 |
| Lihat audit trail | T | T | T | T | P | DOC-05 L82; design L143, L230 | Audit Proses = Warehouse |

#### 4.3.2 `SUPPLIER_COMMITMENT` (UC-02)

| Aksi | P | W | R | M | Status | Sumber | Rasional / pertanyaan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Buka/akses layar | P | T | T | T | P | DOC-05 L69; design L217 | UI-02 hanya Purchasing |
| Lihat/baca data | P | T | T | T | P | DOC-05 L69 | Warehouse T |
| Unggah berkas | P | T | T | T | P | DOC-05 L69 | — |
| Validasi | P | T | T | T | I | DOC-05 L69 (Execute P) | Kolom aksi tidak eksplisit |
| Commit/simpan | P | T | T | T | P | DOC-05 L69; DOC-08 L157–161 | Event INITIAL/CHANGE |
| Batalkan | P | T | T | T | I | DOC-08 L164 | Usulan: pemilik batch |
| Riwayat | P | T | T | T | P | DOC-05 L74; design L222 | — |
| Unduh evidence | T | T | T | T | P | DOC-05 L65, L69 | — |
| Lihat audit trail | T | T | T | T | P | design L143, L230 | Audit hanya Warehouse |

#### 4.3.3 `RECEIVING` (UC-03)

| Aksi | P | W | R | M | Status | Sumber | Rasional / pertanyaan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Buka/akses layar | T | P | T | T | P | DOC-05 L70, L86; design L218 | UI-03 hanya Warehouse |
| Lihat/baca data | T | P | T | T | P | DOC-05 L86; design L219 | Exception/notices dibaca Purchasing dan Warehouse |
| Unggah berkas | T | P | T | T | P | DOC-05 L86 | — |
| Validasi | T | P | T | T | I | DOC-05 L86 (Execute P) | — |
| Commit/simpan | T | P | T | T | P | DOC-05 L86; DOC-08 L157–161 | Penerimaan parsial/final |
| Batalkan | T | P | T | T | I | DOC-08 L164 | Usulan: pemilik batch |
| Riwayat | T | P | T | T | P | DOC-05 L90; design L222 | — |
| Unduh evidence | T | T | T | T | P | DOC-05 L65, L86 | Pada UC-03 tidak ada download |
| Lihat audit trail | T | P | T | T | P | design L230; DOC-09 API-20 | Audit hanya Warehouse |

#### 4.3.4 `STOCK` (UC-09)

| Aksi | P | W | R | M | Status | Sumber | Rasional / pertanyaan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Buka/akses layar | T | P | T | T | P | DOC-05 L76, L92; design L224 | UI-09 hanya Warehouse |
| Lihat/baca data | T | P | T | T | P | DOC-05 L92; design L224 | — |
| Unggah berkas | T | P | T | T | P | DOC-05 L92 | Satu paket STOCK (DOC-08 L61, L124) |
| Validasi | T | P | T | T | I | DOC-05 L92 (Execute P) | — |
| Commit/simpan | T | P | T | T | P | DOC-05 L92; DOC-08 L157–161 | Commit atomik satu paket |
| Batalkan | T | P | T | T | I | DOC-08 L164 | Usulan: pemilik batch |
| Riwayat | T | P | T | T | P | DOC-05 L96; design L228 | Riwayat selisih UC-13 |
| Unduh evidence | T | P | T | T | P | DOC-05 L94 (UC-11 Warehouse P) | Evidence target belum final (CF-03) |
| Lihat audit trail | T | P | T | T | P | design L230 | — |

#### 4.3.5 `PHYSICAL_COUNT` (UC-10)

| Aksi | P | W | R | M | Status | Sumber | Rasional / pertanyaan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Buka/akses layar | T | P | T | T | P | DOC-05 L77, L93; design L225 | UI-10 hanya Warehouse |
| Lihat/baca data | T | P | T | T | P | DOC-05 L93 | — |
| Unggah berkas | T | P | T | T | P | DOC-05 L93 | Nol vs belum dihitung (BR-INV-02) |
| Validasi | T | P | T | T | I | DOC-05 L93 (Execute P) | — |
| Commit/simpan | T | P | T | T | P | DOC-05 L93; DOC-08 L157–161 | — |
| Batalkan | T | P | T | T | I | DOC-08 L164 | Usulan: pemilik batch |
| Riwayat | T | P | T | T | P | DOC-05 L96 | — |
| Unduh evidence | T | P | T | T | P | DOC-05 L94 | Target evidence belum final (CF-03) |
| Lihat audit trail | T | P | T | T | P | design L230 | — |

### 4.4 Matriks use case baca/analisis (bukan impor)

| Use case | P | W | R | M | Status | Sumber |
| --- | --- | --- | --- | --- | --- | --- |
| UC-04 Exception inbound | P | P | T | T | P | DOC-05 L71, L87; design L219 |
| UC-05 Pemberitahuan inbound | P | P | T | T | P | DOC-05 L72, L88; design L220 |
| UC-06 Referensi material WO | P | T | P | T | P | DOC-05 L73, L89, L105, L121; design L142 |
| UC-07 Riwayat inbound | P | P | T | T | P | DOC-05 L74, L90; design L222 |
| UC-08 Metrik supplier | P | T | T | P | P | DOC-05 L75, L91, L123; design L222 |
| UC-11 Evidence | T | P | T | T | P | DOC-05 L78, L94, L110, L126; design L226 |
| UC-12 Rekonsiliasi | T | P | T | T | P | DOC-05 L79, L95, L111, L127 |
| UC-13 Riwayat selisih | T | P | T | P | P | DOC-05 L80, L96, L128; design L228–229 |
| UC-14 Metrik persediaan | T | P | T | P | P | DOC-05 L81, L97, L129; design L229 |
| UC-15 Audit proses | T | P | T | T | P | DOC-05 L82, L98, L130; design L230 |
| UC-16 Validasi internal | I | I | I | I | I | DOC-05 L83, L99, L115, L131 (`I bila pemanggil diizinkan`) |

Catatan UC-16: bukan halaman/menu; hanya dipanggil alur impor (design L145; DOC-05 L83). Tidak ada izin mandiri.

---

## 5. Matriks akses gudang berbasis `user_warehouses`

### 5.1 Model data

| Aspek | Temuan | Sumber |
| --- | --- | --- |
| Relasi pengguna–gudang | Tabel pivot `user_warehouses(user_id, warehouse_id)`; unik per pasangan | DOC-07 L156–169; migration 001 |
| Sifat relasi | Banyak-ke-banyak; satu pengguna dapat memiliki beberapa gudang | DOC-07 L118, L162–166 |
| Aktif/nonaktif | `warehouses.is_active` ada pada migration; `user_warehouses` tidak memiliki flag aktif sendiri | migration 001 |
| Penghapusan | FK `ON DELETE CASCADE` untuk user, `RESTRICT` untuk warehouse | migration 001 |
| Sumber `AuthContext` | `user_id`, `role`, `warehouse_ids` dari sesi (bukan payload) | DOC-09 L66; DOC-05 L135 |
| Pemeriksaan | Setiap request: sesi, role, gudang, mode, ownership batch | DOC-05 L135; DOC-16 L46 |

### 5.2 Matriks akses per aksi

Tabel ini hanya berlaku untuk peran yang memiliki akses layar/aksi menurut §4. Jika §4 menyatakan `T`, nilai `T` tersebut tetap berlaku; kolom gudang tidak memberi izin tambahan. "Hanya gudang yang terhubung" berarti `warehouse_id` wajib ada pada `user_warehouses` milik pengguna.

| Aksi | P | W | R | M | Status | Sumber / catatan |
| --- | --- | --- | --- | --- | --- | --- |
| Membuka layar | Hanya gudang yang terhubung | Hanya gudang yang terhubung | Hanya gudang yang terhubung | Hanya gudang yang terhubung | P | DOC-07 L158; design §8.4 L1432 |
| Melihat data | Filter `warehouse_id ∈ user_warehouses` sebelum pagination/agregasi | idem | idem | idem | P | DOC-05 L135 |
| Mengunggah | `warehouse_id` wajib termasuk scope sesi | idem | T | T | P | DOC-08 L65 (“divalidasi scope sesi”) |
| Memvalidasi | Scope batch harus sama dengan scope sesi | idem | T | T | P | DOC-08 L150 |
| Commit | Scope dicek ulang saat commit | idem | T | T | P | DOC-05 L139; DOC-08 L171 |
| Membatalkan | Hanya batch dalam scope | idem | T | T | I | DOC-08 L164 tidak mengatur scope |
| Riwayat | Hanya gudang dalam scope | idem | T | Hanya agregat dalam scope | P | DOC-05 L135 |
| Unduh evidence | T | Hanya evidence dalam scope | T | T | P | BR-SEC-01 L60; DOC-05 L65 |
| Audit trail | T | Hanya gudang dalam scope | T | T | P | design L230; DOC-09 API-20 |

### 5.3 Aturan lintas gudang

1. **Akses lintas gudang ditolak.** Tidak ada sumber yang memberikan akses ke gudang di luar `user_warehouses`. Kode harus menolak `warehouse_id` yang tidak ada dalam scope sesi (DOC-05 L145; DOC-16 L46).
2. **Tidak ada pengecualian all-warehouse untuk Management.** DOC-05 L65 menyatakan Management selalu `T` untuk download raw/evidence; tidak ada aturan yang memberikan seluruh gudang. Usulan `N` (belum ada dasar) jika ada kebutuhan agregat lintas gudang.
3. **Agregasi lintas gudang** hanya boleh jika sumber menyatakan; saat ini `N` dan memerlukan keputusan PM/OD-04.
4. **Perubahan keanggotaan gudang** harus menginvalidasi cache/konteks sesi (design §8.4 L1432) — usulan `I`.

---

## 6. Matriks kepemilikan batch (batch ownership)

### 6.1 Definisi usulan

- **Pemilik batch** = pengguna yang membuat batch (`import_batches.created_by`), bukan sekadar pengguna yang memiliki akses ke gudang batch.
- **Scope gudang** dan **kepemilikan batch** adalah dua pemeriksaan berbeda: akses gudang tidak otomatis memberi hak operasi atas semua batch di gudang tersebut.

### 6.2 Matriks

| Skenario | Boleh lihat | Boleh unggah/validasi/commit | Boleh batalkan | Boleh unduh evidence | Status | Sumber |
| --- | --- | --- | --- | --- | --- | --- |
| Kreator batch (UJI, state dapat diubah) | Ya | Ya | Ya, selama state belum terminal | Ya, jika role diizinkan | P | migration `created_by`; DOC-08 L164, L167 |
| Pengguna lain dengan role sama di gudang yang sama | Usulan: ya untuk metadata | Usulan: tidak | Tidak | Tidak | P | DOC-05 L135; tidak ada aturan eksplisit |
| Role berbeda di gudang yang sama | Tidak, kecuali layar baca yang diizinkan | Tidak | Tidak | Tidak | P | DOC-05 L141–150 (skenario negatif) |
| Role berbeda di gudang berbeda | Tidak | Tidak | Tidak | Tidak | P | DOC-05 L145 |
| Management | Metadata agregat sesuai DTO aman | Tidak | Tidak | Tidak (raw/evidence T) | P | DOC-05 L65, L135; BR-SEC-01 |
| Batch `COMMITTED` atau `CANCELLED` | Ya, sesuai izin baca | Tidak (immutable) | Tidak | Sesuai izin evidence | P | DOC-08 L167 |
| Transfer kepemilikan | Tidak diusulkan | — | — | — | N | Tidak ada sumber; perlu keputusan PM |
| Batch milik pengguna lain dalam gudang yang sama, state `STAGED` | Usulan: hanya metadata | Tidak | Tidak | Tidak | P | Perlu keputusan PM |

### 6.3 Prinsip yang diusulkan

1. Operasi mutasi (`validate`, `commit`, `cancel`) hanya oleh **kreator batch** yang masih memiliki role dan scope gudang yang sah.
2. Pengguna dengan role sama **tidak** otomatis mewarisi hak operasi; hanya hak baca yang diizinkan layar.
3. Pemeriksaan diulang saat commit karena role/gudang dapat berubah setelah preview (DOC-05 L139).
4. `COMMITTED` dan `CANCELLED` bersifat terminal dan tidak dapat diubah (DOC-08 L167).
5. Tidak ada transfer kepemilikan pada rilis ini; usulan `N` dengan pertanyaan PM.

---

## 7. Matriks izin UJI

Ringkasan baseline UJI (detail per aksi pada §4):

| Jenis | P | W | R | M | Status |
| --- | --- | --- | --- | --- | --- |
| `INBOUND_REFERENCE` | Impor: ya | T | T | T | P |
| `SUPPLIER_COMMITMENT` | Impor: ya | T | T | T | P |
| `RECEIVING` | T | Impor: ya | T | T | P |
| `STOCK` | T | Impor: ya | T | T | P |
| `PHYSICAL_COUNT` | T | Impor: ya | T | T | P |

"Impor: ya" hanya untuk aksi unggah/validasi/commit/batal oleh kreator batch; aksi baca, riwayat, evidence, dan audit mengikuti §4 (beberapa tetap `T`, misalnya audit trail dan unduh evidence untuk Purchasing).

Catatan UJI:
- Seluruh data UJI wajib berlabel dan tidak boleh masuk dataset ACTUAL (BR-DAT-01 L45; BR-DAT-02 L61).
- UJI tetap menjalankan validasi, preview, expiry, commit atomik, dan audit (DOC-08 L148–171).
- Izin UJI **tidak** menjadi dasar izin ACTUAL.

---

## 8. Matriks izin ACTUAL

**Tidak ada izin ACTUAL yang ditetapkan dalam dokumen ini.** OD-04 belum selesai dan OD-05/CF-04 cutoff masih terbuka.

| Jenis | P | W | R | M | Status | Alasan |
| --- | --- | --- | --- | --- | --- | --- |
| `INBOUND_REFERENCE` | N | N | N | N | N | OD-04/OD-05 belum final; data mitra belum tersedia (BR-DAT-02) |
| `SUPPLIER_COMMITMENT` | N | N | N | N | N | idem |
| `RECEIVING` | N | N | N | N | N | idem |
| `STOCK` | N | N | N | N | N | Cutoff ACTUAL wajib `VERIFIED` (BR-INV-03 L53; DOC-08 L177); definisi cutoff belum final (CF-04) |
| `PHYSICAL_COUNT` | N | N | N | N | N | idem |

Ketentuan yang tetap berlaku meskipun izin belum diputuskan:

1. **Deny-by-default**: tanpa izin ACTUAL eksplisit, permintaan ACTUAL ditolak (DOC-16 L46).
2. **ACTUAL tidak boleh diinferensi dari UJI** (BR-DAT-01 L45).
3. **Management tidak memperoleh raw/evidence** (DOC-05 L65; BR-SEC-01 L60).
4. **Cutoff ACTUAL wajib `VERIFIED`** sebelum rekonsiliasi (BR-INV-03; DOC-08 L177).
5. Validasi/preview/commit ACTUAL mengikuti state machine yang sama, tetapi gerbang izinnya tetap `N` sampai OD-04 selesai.

---

## 9. Aturan lintas peran dan lintas gudang

| Aturan | Nilai | Status | Sumber |
| --- | --- | --- | --- |
| Frontend menyembunyikan menu tanpa izin, tetapi backend tetap memeriksa | Wajib | P | DOC-05 L135; design L135 |
| Identitas dari sesi, bukan payload | Wajib | P | DOC-05 L135; DOC-09 L66 |
| Filter scope sebelum pagination/agregasi | Wajib | P | DOC-05 L135 |
| Direct request lintas role/gudang | Tolak; 403 atau 404 untuk objek tersembunyi | P | DOC-05 L139 |
| Payload mengirim `actor_id` orang lain | Abaikan/tolak | P | DOC-05 L149 |
| Izin dicabut setelah preview | Commit ditolak | P | DOC-05 L148 |
| Batch gudang lain | Tolak; audit `DENIED` tanpa raw | P | DOC-05 L145 |
| Management memanggil endpoint file langsung | Tolak meski ID valid | P | DOC-05 L146; BR-SEC-01 |
| Role switch operasional | Tidak diizinkan | P | design L145 |
| Peran kelima/ADMIN | Tidak diizinkan | A | PM instruction; migration 001; DOC-16 |

---

## 10. Register konflik

| ID | Konflik / celah | Bukti | Dampak | Usulan penanganan |
| --- | --- | --- | --- | --- |
| C-01 | DOC-05 hanya memakai kolom View/Create/Execute/Download; PM meminta aksi terpisah (upload, validate, commit, cancel, history, audit, evidence) | DOC-05 L66–131 | Rincian aksi belum pernah disetujui | Perluas pada §4; tandai `P`/`I`; jangan implementasi sebelum disetujui |
| C-02 | Warehouse `T` pada UC-01/UC-02 meskipun tergabung di grup Supplier Inbound | DOC-05 L68–69 vs L84–85; design L140 | Menu grup bisa disalahartikan sebagai izin | Tegaskan izin per layar, bukan per grup |
| C-03 | Management `T` untuk download, tetapi DOC-05 memberi `P` pada UC-08 download | DOC-05 L65 vs L123 | Ambiguitas unduh metrik vs raw/evidence | Tegaskan larangan hanya untuk raw/evidence; metrik agregat tetap boleh |
| C-04 | Audit Proses hanya Warehouse (design/API-20), sedangkan sebagian dokumen menyebut Management membaca audit | design L230; DOC-09 API-20; DOC-05 L130 | Management tidak dapat menelusuri audit | Konfirmasi PM; usulan: Management hanya ringkasan aman tanpa detail |
| C-05 | Tidak ada kolom `cancel` pada DOC-05; state machine DOC-08 mengizinkan pembatalan | DOC-05 L66; DOC-08 L164 | Siapa yang boleh membatalkan belum ditetapkan | Usulan: kreator batch; perlu keputusan |
| C-06 | Kepemilikan batch tidak didefinisikan eksplisit di DOC-05 | DOC-05 L135 hanya menyebut ownership batch | Risiko pengguna lain mengoperasikan batch | Usulan §6; perlu keputusan |
| C-07 | `user_warehouses` tidak memiliki flag aktif/expiry; `warehouses.is_active` ada | migration 001; DOC-07 L156–169 | Scope bisa mencakup gudang nonaktif | Usulan: filter `warehouses.is_active = true`; perlu keputusan |
| C-08 | CF-02 mencatat perbedaan role view DOC-05 vs SRC-09 | DOC-00 L225 | Matriks belum final | Pertahankan sebagai PROPOSED; PM review |
| C-09 | OD-07 belum diputuskan (sesi/CSRF) | DOC-00 L146 | Cara penerapan izin belum final | Implementasi menunggu SRS-47/OD-07 |
| C-10 | ACTUAL permission belum ada di sumber mana pun | DOC-00 L143; BR-DAT-01/02 | Tidak boleh mengarang izin ACTUAL | Tetapkan `N` + deny-by-default |

---

## 11. Keputusan terbuka untuk PM

1. **Granularitas aksi**: setujui pemetaan aksi `open/view/upload/validate/commit/cancel/history/evidence/audit` sebagai unit izin? Jika tidak, aksi mana yang digabung?
2. **Pembatalan**: siapa yang berhak membatalkan batch — hanya kreator, atau semua pengguna berizin di gudang yang sama? Dapatkah batch `COMMITTED` dibatalkan (usulan: tidak)?
3. **Kepemilikan batch**: apakah pengguna dengan role sama boleh melihat metadata batch pengguna lain di gudang yang sama? Boleh mengoperasikan? Apakah perlu transfer kepemilikan?
4. **Warehouse scope**: konfirmasi bahwa akses selalu dibatasi `user_warehouses`, tanpa pengecualian all-warehouse untuk Management, dan `warehouses.is_active` wajib diperiksa?
5. **Management dan audit**: apakah Management boleh melihat Audit Proses (design menyebut Warehouse saja), atau hanya ringkasan/DTO aman?
6. **Management dan unduhan**: konfirmasi larangan raw/evidence, serta apakah unduhan metrik agregat diizinkan.
7. **ACTUAL**: izin ACTUAL ditetapkan terpisah setelah OD-04/OD-05, atau ada baseline ACTUAL yang boleh disetujui sekarang?
8. **UC-16**: konfirmasi bahwa tidak ada izin mandiri untuk UC-16 dan hanya mengikuti izin pemanggil.
9. **Gudang nonaktif**: apakah keanggotaan pada gudang nonaktif otomatis ditolak, atau perlu penonaktifan eksplisit?
10. **Peran ganda**: apakah satu akun boleh memiliki lebih dari satu peran? (Usulan: tidak; `users.role` tunggal.)

---

## 12. Implikasi dan catatan serah terima untuk SRS-46

1. **SRS-46 tidak boleh mengimplementasikan matriks ini sebelum PM menyetujui §11 dan OD-04/CF-02.**
2. Guard frontend hanya menyembunyikan menu; pemeriksaan sebenarnya tetap di backend (DOC-05 L135).
3. `AuthContext` harus memuat `user_id`, `role`, `warehouse_ids` dari sesi; payload tidak dipercaya (DOC-09 L66).
4. Middleware otorisasi sebaiknya memeriksa, berurutan: sesi → role → gudang (`user_warehouses`) → mode → objek/batch → state.
5. Route dan menu mengikuti design §3.1/§3.3; jangan menambah menu atau role baru.
6. Checklist minimum untuk SRS-46 setelah persetujuan:
   - [ ] Empat role dan tidak ada ADMIN.
   - [ ] Menu per role sesuai matriks yang disetujui.
   - [ ] Direct request lintas gudang/role ditolak (403/404).
   - [ ] Batch ownership diperiksa pada mutasi.
   - [ ] `COMMITTED`/`CANCELLED` tidak dapat diubah.
   - [ ] Management tidak menerima raw/evidence.
   - [ ] Audit `DENIED` tanpa raw/secret.
7. Jika PM mengubah nilai mana pun, perbarui dokumen ini dan catat versi/tanggal; jangan mengubah DOC-05 tanpa keputusan.

---

## 13. Riwayat revisi

| Versi | Tanggal | Perubahan | Status |
| --- | --- | --- | --- |
| 0.1.0 | 2026-11-15 | Penyusunan usulan awal berbasis DOC-05, DOC-07, DOC-08, DOC-09, DOC-16, design.md, migration 001, dan komentar PM pada SRS-36 | DRAFT — menunggu review PM |
