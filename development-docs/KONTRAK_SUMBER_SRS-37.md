# Kontrak Sumber dan Pemetaan Lima Jenis Impor — SRS-37

| Atribut | Nilai |
| --- | --- |
| Issue | [SRS-37](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-37) (T-03), parent SRS-6 / EPIC-03 |
| UC terkait | UC-01, UC-02, UC-03, UC-06, UC-09, UC-10, UC-16 |
| Versi kontrak | `proposed-0.1` |
| Status dokumen | **PROPOSED — NEEDS REVIEW** (reviewer usulan: MEMBER-02) |
| Tanggal | 12 November 2026, Asia/Jakarta |
| Baseline repo | `origin/develop` @ `ea5f6df` |
| Pemilik | Backend & Database (Dwi Rani Amelia) |

Dokumen ini menetapkan **usulan** kontrak sumber berversi untuk lima jenis impor (EXPECTED, COMMITMENT, RECEIVING, STOCK, COUNT) beserta fixture sintetis UJI. Dokumen ini **tidak** mengesahkan kontrak; setiap butir diberi status. Tidak ada sampel file mitra yang diperiksa karena tidak tersedia di repositori maupun Jira pada tanggal penyusunan.

## 1. Status keputusan yang dipakai

| Status | Makna |
| --- | --- |
| ACCEPTED | Ada bukti persetujuan spesifik (dokumen/instruksi berwenang). |
| PROPOSED | Usulan untuk review; tidak otomatis menjadi ACCEPTED. |
| SOURCE REQUIRED | Membutuhkan sampel/dokumen sumber dari mitra atau pemilik domain. |
| BLOCKED | Tidak dapat diputuskan sebelum dependensi lain selesai. |
| OPEN DECISION | Konflik sumber yang tercatat (CF/OD) dan belum diputuskan. |

## 2. Sumber yang diperiksa

| Sumber | Versi / snapshot | Yang diambil |
| --- | --- | --- |
| [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md) | 0.2.0, PROPOSED | Field normalized, metadata batch, validasi bertingkat, katalog error |
| [DOC-07](07_DATABASE_DESIGN.md) | 0.2.0, PROPOSED | `numeric(20,6)`, `import_batches`, `staging_rows`, `stock_support_rows` |
| [DOC-09](09_API_SPECIFICATION.md) | 0.2.0, PROPOSED | API-02 staging (`kind`, `contract_version`), API-03 preview |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | 0.2.0 | OD-05, OD-06, OD-08; CF-03–CF-08 |
| [KEPUTUSAN_TEKNIS_SRS-40](KEPUTUSAN_TEKNIS_SRS-40.md) | DRAFT | ADR-04 parsing/staging OPEN |
| `design.md` (SRC-09) | 1.0.0 | §1.2 A-09, §6.5 kolom layar UI-01–UI-11, Q-02, Q-04 |
| Komentar Jira SRS-37 (Adam, 11 Nov 2026) | — | Permintaan kontrak EXPECTED berversi + fixture UJI; header/CF-06 tidak boleh dikarang |
| PR #11 (`feature/SRS-16-inbound-reference-ui`, DRAFT) | `f55c83e` | Transport usulan memakai `kind=EXPECTED`, `state=STAGED`/`PREVIEW_READY`; hanya referensi baca |

**Sumber yang tidak tersedia** (dicatat, bukan diasumsikan): sampel file Erasoft untuk kelima jenis, nama sheet, header asli (selain `QTY AKHIR`), locale angka, timezone sumber, batas ukuran/baris impor, sumber suplai WO, dokumen SRS/PRD final (OD-01, OD-03).

## 3. Ketentuan umum lintas jenis

| Aspek | Usulan `proposed-0.1` | Status | Catatan |
| --- | --- | --- | --- |
| Jenis impor (`kind`) | Tepat lima: `EXPECTED`, `COMMITMENT`, `RECEIVING`, `STOCK`, `COUNT`; nilai lain ditolak `INVALID_FILE` | PROPOSED | Selaras DOC-07/08/09 dan PR #11. Lihat temuan F-01 tentang nama di migrasi 001. |
| Format file | CSV UTF-8, delimiter koma, header eksplisit di baris pertama, quoting RFC 4180 | PROPOSED | DOC-08; format asli Erasoft SOURCE REQUIRED. XLSX/XLS hanya setelah sampel dan sheet disetujui (ADR-04 OPEN). |
| Nama sheet | Tidak berlaku untuk CSV; untuk XLSX belum ditetapkan | SOURCE REQUIRED | Kolom `component` pada staging menyimpan nama sheet/komponen bila nanti disetujui. |
| Header asli | Hanya `QTY AKHIR` (STOCK) yang diketahui | SOURCE REQUIRED | Header lain **tidak dikarang**. Mapping header→field dibuat per `contract_version` setelah sampel tersedia. |
| Pencocokan header | Usulan: trim spasi tepi, perbandingan tidak peka huruf besar/kecil, header duplikat ditolak | PROPOSED | Perlu konfirmasi dengan sampel; tidak menebak sinonim. |
| Encoding | UTF-8 (BOM diizinkan dan dibuang) | PROPOSED | Encoding lain NEEDS BASELINE. |
| Desimal | Disimpan sebagai string desimal kanonik, presisi `numeric(20,6)`; nilai melebihi presisi **ditolak**, tidak dibulatkan | PROPOSED | DOC-07. Locale sumber (koma/titik desimal, pemisah ribuan) SOURCE REQUIRED; nilai ambigu ditolak. Presisi resmi = design.md Q-04 (OPEN). |
| UOM | Kode kanonik dari referensi yang disetujui; tidak ada konversi otomatis | PROPOSED | Daftar UOM kanonik SOURCE REQUIRED (OD-05). |
| Tanggal | `YYYY-MM-DD` untuk tanggal kebutuhan/janji | PROPOSED | Format tanggal sumber SOURCE REQUIRED. |
| Waktu event | ISO 8601 dengan offset; timestamp lokal tanpa offset wajib `source_timezone` | PROPOSED | Timezone mitra SOURCE REQUIRED; `Asia/Jakarta` adalah zona jadwal proyek, bukan bukti zona data. |
| Batas ukuran file impor | **Tidak ditetapkan** | SOURCE REQUIRED | design.md A-09/Q-02: berasal dari konfigurasi, tidak ditebak; blocking untuk upload produksi. |
| Batas jumlah baris | **Tidak ditetapkan** | SOURCE REQUIRED | OD-09 NEEDS BASELINE. |
| Batas evidence 5 MiB | Hanya untuk evidence UC-11 (PDF/JPG/PNG) | ACCEPTED sebagai fakta SRC-09 | **Tidak** dipakai sebagai batas impor (design.md A-09, DOC-08). Kode `FILE_TOO_LARGE` di katalog DOC-08 saat ini khusus evidence. |
| File tanpa baris data | Ditolak `INVALID_FILE` | PROPOSED | DOC-08 §11. |
| Metadata batch | `kind`, `warehouse_id`, `mode`, `source_name`, `source_reference`, `contract_version`, `cutoff_id` (STOCK/COUNT), `source_timezone` (kondisional); `source_hash`, `actor_id` dihitung server | PROPOSED | DOC-08 §4. `mode` tidak boleh diinfer dari nama file. |
| Lineage | Setiap baris staging menyimpan `component`, `row_number` (>0), `raw` (nilai asli tanpa perubahan) dan `normalized` | PROPOSED | DOC-07 `staging_rows`; implementasi di SRS-50. |

## 4. Kontrak per jenis impor

Kolom "Header sumber" berisi header asli bila diketahui; selain itu `SOURCE REQUIRED`. Field normalized mengikuti DOC-08 tanpa penambahan.

### 4.1 EXPECTED — referensi inbound (UC-01)

| Field normalized | Tipe | Wajib | Header sumber | Status |
| --- | --- | --- | --- | --- |
| `source_ref` | string | Ya | SOURCE REQUIRED | PROPOSED |
| `material_code` | string | Ya | SOURCE REQUIRED | PROPOSED |
| `supplier_code` | string | Ya | SOURCE REQUIRED | PROPOSED |
| `uom` | string | Ya | SOURCE REQUIRED | PROPOSED |
| `requested_date` | date | Ya | SOURCE REQUIRED | PROPOSED; immutable setelah commit |
| `expected_quantity` | decimal string | Ya | SOURCE REQUIRED | **OPEN DECISION CF-06**: DOC-08 `>=0` vs SRC-09 `>0` |

- Key bisnis usulan: (`warehouse_id`, `mode`, `source_ref`). Kunci line asli Erasoft SOURCE REQUIRED.
- design.md UI-01 menyebut kolom "release date bila tersedia" — **tidak** dimasukkan ke kontrak karena belum ada di DOC-08 (CF-08); dicatat sebagai gap.
- Fixture UJI tidak memuat baris dengan quantity `0` sebagai kasus valid maupun invalid; kasus batas tersebut ditandai `OPEN_DECISION` sampai CF-06 diputuskan.

### 4.2 COMMITMENT — janji supplier (UC-02)

| Field normalized | Tipe | Wajib | Header sumber | Status |
| --- | --- | --- | --- | --- |
| `inbound_source_ref` | string | Ya | SOURCE REQUIRED | PROPOSED |
| `event_ref` | string | Ya | SOURCE REQUIRED | PROPOSED; unik per inbound |
| `event_type` | enum `INITIAL`/`CHANGE` | Ya | SOURCE REQUIRED | PROPOSED |
| `promised_date` | date | Ya | SOURCE REQUIRED | PROPOSED; tidak menimpa `requested_date` |
| `event_at` | datetime | Ya | SOURCE REQUIRED | PROPOSED |

- **OPEN DECISION CF-06**: SRC-09 UI-02 meminta `sequence`, `previous_date`, `committed_date`, `recorded_at` yang belum ada di DOC-08. Tidak ditambahkan dan tidak disintesis.

### 4.3 RECEIVING — penerimaan (UC-03)

| Field normalized | Tipe | Wajib | Header sumber | Status |
| --- | --- | --- | --- | --- |
| `inbound_source_ref` | string | Ya | SOURCE REQUIRED | PROPOSED |
| `event_ref` | string | Ya | SOURCE REQUIRED | PROPOSED |
| `received_quantity` | decimal string | Ya | SOURCE REQUIRED | PROPOSED; nonnegatif |
| `uom` | string | Ya | SOURCE REQUIRED | PROPOSED; harus sama dengan referensi inbound |
| `received_at` | datetime | Ya | SOURCE REQUIRED | PROPOSED |
| `is_closing` | boolean | Ya | SOURCE REQUIRED | PROPOSED; tidak diturunkan dari kumulatif |
| `closing_reference` | string/null | Kondisional | SOURCE REQUIRED | PROPOSED; validitas penutup OD-06 OPEN |

- Representasi boolean di sumber (mis. `Y/N`, `1/0`) SOURCE REQUIRED; tidak ditebak.
- Quantity mismatch inbound **bukan** stock variance; kontrak ini tidak menghitung variance.

### 4.4 STOCK — saldo sistem (UC-09)

| Field normalized | Tipe | Wajib | Header sumber | Status |
| --- | --- | --- | --- | --- |
| `material_code` | string | Ya | SOURCE REQUIRED | PROPOSED |
| `uom` | string | Ya | SOURCE REQUIRED | PROPOSED |
| `system_quantity` | decimal string | Ya | **`QTY AKHIR`** | Pemetaan ACCEPTED dari SRC-01; format angka SOURCE REQUIRED |

- `system_quantity` **hanya** dari `QTY AKHIR`; tidak menjumlah movement.
- Paket STOCK: satu request, `balance_file` wajib + `support_files` opsional (master/movement/WO), satu commit. Komponen opsional yang diberikan tetapi invalid menggagalkan paket; komponen tidak diberikan → warning `OPTIONAL_COMPONENT_ABSENT`.
- Komponen support disimpan di `stock_support_rows` dengan lineage dan **tidak** dijumlahkan ke saldo. Schema payload komponen support SOURCE REQUIRED (OD-05).
- `cutoff_id` wajib. Kontrak cutoff (DATE/DATETIME, basis, precision, UJI SIMULATED) = **OPEN DECISION CF-04**, ditangani SRS-38.
- Nilai saldo negatif: kebijakan OD-05 OPEN; fixture tidak memuat kasus ini.

### 4.5 COUNT — hitung fisik (UC-10)

| Field normalized | Tipe | Wajib | Header sumber | Status |
| --- | --- | --- | --- | --- |
| `material_code` | string | Ya | SOURCE REQUIRED | PROPOSED (design.md UI-10 menyebut `item_code`; padanan perlu konfirmasi) |
| `uom` | string | Ya | SOURCE REQUIRED | PROPOSED |
| `is_counted` | boolean | Ya | SOURCE REQUIRED | PROPOSED; eksplisit |
| `physical_quantity` | decimal string/null | Kondisional | SOURCE REQUIRED | PROPOSED |

- `is_counted=true` + `0` = **sah** (fisik nol). `is_counted=false` + `null` = belum dihitung. `true`+`null` dan `false`+nilai = invalid (`NOT_COUNTED_VALUE` untuk yang kedua).
- Sel kosong **tidak** otomatis `0`; baris yang tidak ada **bukan** `0`.
- `cutoff_id` wajib; harus sama dengan STOCK untuk rekonsiliasi (CF-04 OPEN).

### 4.6 Suplai referensi WO (UC-06)

| Aspek | Status |
| --- | --- |
| Mekanisme suplai `wo_references` | **OPEN DECISION** (DOC-08 §3, CF-08). Usulan DOC-07/08: komponen WO opsional dalam paket STOCK dipetakan ke `wo_references` dengan lineage `source_row`; **bukan** jenis impor keenam. |
| Field WO | SOURCE REQUIRED; UI-06 hanya menampilkan field yang tersedia di sumber, tanpa mengarang actual use. |

## 5. Raw-to-normalized dan urutan validasi

Mengikuti DOC-08 §10–§11 tanpa perubahan: otorisasi → tipe/struktur file → field wajib/tipe → normalisasi → referensi → aturan bisnis → duplikasi → laporan. Kode error yang dipakai fixture hanya diambil dari katalog DOC-08 §16. Kesalahan tipe/format per field saat ini belum memiliki kode khusus di katalog; fixture menandainya `INVALID_FILE` sebagai usulan dan dicatat sebagai gap G-04.

## 6. Fixture sintetis UJI

Lokasi: `database/fixtures/uji/` (JSON, karena `scripts/check_repository.py` menolak `.csv` ter-track). Seluruh nilai sintetis berawalan `UJI-`, tanpa data mitra.

| File | Isi |
| --- | --- |
| [expected.proposed-0.1.json](../database/fixtures/uji/expected.proposed-0.1.json) | Baris valid + kasus invalid EXPECTED |
| [commitment.proposed-0.1.json](../database/fixtures/uji/commitment.proposed-0.1.json) | INITIAL/CHANGE + kasus invalid |
| [receiving.proposed-0.1.json](../database/fixtures/uji/receiving.proposed-0.1.json) | Parsial, penutup + kasus invalid |
| [stock.proposed-0.1.json](../database/fixtures/uji/stock.proposed-0.1.json) | Saldo dari `QTY AKHIR` + kasus invalid |
| [count.proposed-0.1.json](../database/fixtures/uji/count.proposed-0.1.json) | Fisik nol vs belum dihitung + kasus invalid |

Struktur setiap fixture: `metadata` batch (DOC-08 §4), `rows` valid dalam bentuk normalized dengan `row_number`, dan `negative_cases` dengan `expected_issue` dari katalog DOC-08 atau `OPEN_DECISION`. Bagian `raw` hanya diisi untuk header yang diketahui (`QTY AKHIR`); header lain tercatat `SOURCE REQUIRED` di `raw_header_status`.

## 7. Temuan dan gap

| ID | Temuan | Dampak | Tindak lanjut |
| --- | --- | --- | --- |
| F-01 | `database/migrations/001_initial_schema.sql` memakai `import_type` `INBOUND_REFERENCE`/`SUPPLIER_COMMITMENT`/`PHYSICAL_COUNT`, sedangkan DOC-07/08/09 dan PR #11 memakai `kind` `EXPECTED`/`COMMITMENT`/`COUNT`; status batch juga berbeda dari state machine DOC-08 | Kontrak bertentangan bila diberlakukan bersamaan | Diputuskan di SRS-44 bersama Adam; dokumen ini memakai nama DOC-07/08 |
| F-02 | `database/fixtures/inbound_sample_uji.json` memakai field `po_number`, `supplier_name`, `expected_quantity`, `expected_delivery_date` yang tidak bersumber dan berbeda dari DOC-08 (`source_ref`, `supplier_code`, `requested_date`) | Risiko dipakai sebagai "header EXPECTED" | Tidak diubah/dihapus di SRS-37; usulan: tandai deprecated atau ganti dengan fixture baru setelah review |
| G-01 | Header asli 4 jenis + komponen STOCK | Adaptor tidak dapat dibuat final | Minta sampel sintetis berstruktur sama dari mitra/pemilik domain (OD-05) |
| G-02 | Batas ukuran/baris impor | Upload produksi blocking | Keputusan backend + pemilik domain (Q-02, OD-09) |
| G-03 | Locale angka, daftar UOM, timezone sumber | Normalisasi dapat salah | OD-05 |
| G-04 | Katalog error belum punya kode untuk tipe/format field dan header hilang | Validator memakai `INVALID_FILE` secara umum | Usulkan kode tambahan melalui review DOC-08 |
| G-05 | CF-06 (EXPECTED quantity, field COMMITMENT tambahan), CF-08 (release date, kolom tambahan) | Validator dan boundary test tertahan | Keputusan Adam/pemilik domain |
| G-06 | FR/NFR terkait SRS-37 SOURCE REQUIRED (OD-01) | Traceability belum lengkap | Diisi setelah SRS final tersedia |

## 8. Status acceptance criteria SRS-37

| Kriteria (Jira) | Status | Bukti |
| --- | --- | --- |
| Versi kontrak dan contoh UJI ditinjau | Kontrak `proposed-0.1` dan fixture UJI **tersedia**; review **belum** | Dokumen ini + `database/fixtures/uji/`; menunggu reviewer |
| QTY AKHIR dipetakan | Terpenuhi: `QTY AKHIR` → `system_quantity` → `stock_lines.system_quantity` | §4.4, `stock.proposed-0.1.json` |
| Tidak menyamakan limit evidence dengan limit impor | Terpenuhi | §3 baris batas ukuran |
| Source yang hilang dicatat | Terpenuhi | §2, §7 |

Pengujian: tidak ada kode aplikasi yang berubah; validasi fixture terhadap validator **NOT RUN** (validator belum ada, SRS-34/SRS-51). Dokumen ini tidak menyatakan persetujuan; Definition of Done memerlukan review oleh reviewer lain dan PR merged.

## 9. Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| proposed-0.1 | 2026-11-12 | Penyusunan awal kontrak lima jenis, fixture UJI, temuan F-01/F-02 dan gap | Belum ada |
