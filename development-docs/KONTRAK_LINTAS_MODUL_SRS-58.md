# Kontrak lintas modul SRS-58

Versi: **proposed-0.1**, 20 November 2026. Status: **KANDIDAT REVIEW**, bukan pengesahan domain atau bukti endpoint tersedia. Owner: Adam. Reviewer yang diminta: Luthfi (API), Dwi (schema), Vassell (konsumsi UI).

Baseline: `develop@23f59a0`. Baseline tetap 16 UC, 29 FR, 14 NFR. Identitas FR/NFR asli tetap SOURCE REQUIRED. Snapshot OpenAPI tersedia pada [kontrak mesin](contracts/SRS-58-openapi.proposed-0.1.json); matriks field lengkap pada [katalog field](contracts/SRS-58-field-matrix.proposed-0.1.json). Keduanya menyalin DOC-09, bukan menghasilkan nilai operasional.

## Sumber dan batas keputusan

| Sumber | Versi/HEAD | Pemakaian dan status |
| --- | --- | --- |
| DOC-07/08/09/10 | 0.2.0, PROPOSED | Schema, metadata, 22 operasi dan kolom UI; bukan baseline final |
| design.md | 1.0.0, untuk ditinjau | §6.3–6.6; tanggal, state presentasi, kolom dan metrik |
| SRS-37 | `09652fe`, `proposed-0.1`, PR #13 merged | Lima kind; header/locale/grain tetap SOURCE REQUIRED |
| SRS-36 | `e16d634`, PR #19 merged `23f59a0` | Keputusan Jira 10071, hanya izin UJI; UC-16 melalui pemanggil berizin |
| SRS-42 | PR #10 merged `dba5c66` | Adapter memiliki `responseFormat: dto/envelope`; default dto |
| SRS-16 | PR #11 `757f12c`, Draft | Transport usulan; belum integrasi DB |
| SRS-53 | PR #17 `57a3ac1` | Komponen presentasi; belum routing/API |
| SRS-43 | PR #18 `af574ae` | Health memakai envelope; correlation header masih menerima string non-UUID |
| SRS-44 | PR #15 `e56d73e`, Draft | 001–003; `kind` target; status dan staging masih legacy |
| SRS-38 / SRS-39 | `7eca744` / `60ca3b0`, Draft | Cutoff, penutup, eligibility dan metrik belum final |

Register hash SHA-256 sumber terdapat pada katalog field. Keputusan PM setelah snapshot ini harus dicatat sebagai revisi berikutnya; tidak otomatis dianggap disetujui. Kontrak ACTUAL tidak dibuka dari izin UJI.

## Pembaruan integrasi UJI — 27 November 2026

Pembaruan ini menggunakan keputusan PM pada SRS-38 komentar 10153, SRS-58 komentar 10152 dan handoff SRS-52 komentar 10159. Versi mesin OpenAPI pada PR ini tetap kandidat untuk review. Ketidaksesuaian di bawah harus diselesaikan bersama pemilik API dan schema sebelum kontrak dipakai sebagai bukti implementasi.

| Area | Nilai atau batas yang dapat dipakai sekarang | Pekerjaan berikut dan pemilik |
| --- | --- | --- |
| Cutoff | UJI tanggal-saja memakai `cutoff_date` dan `cutoff_time = null`; UJI berstatus SIMULATED. Tanggal cetak atau `cutoff_id` sama saja belum membuktikan basis efektif. | Luthfi dan Dwi menyelaraskan ReferenceItem, schema dan UI. `cutoff_at` wajib date-time pada snapshot mesin tidak dapat mewakili tanggal-saja. CF-04 ACTUAL tetap SOURCE REQUIRED. |
| Hasil rekonsiliasi | Fisik null tetap belum dihitung. Satu material per sisi per run; UOM ganda ambigu. Input snapshot/count/rule/scope identik memakai ulang run. Latest hanya dari run COMMITTED. | Dwi memeriksa constraint, transaksi dan API. Sumber urutan commit yang dapat dibuktikan masih OPEN. |
| Pembatalan dan replay | COMMITTED dan CANCELLED terminal. Replay identik tidak boleh membuat domain write kedua. Hasil COMMIT tidak pasti tidak boleh diulang sebagai unggahan baru. | Luthfi dan Dwi mereview header cancel, respons replay serta bukti konkuren. Kewajiban Idempotency-Key untuk cancel masih OPEN. |
| Warning dan expiry | Warning belum memiliki identitas acknowledgement yang diterima. Commit tetap fail-closed sampai kontrak disepakati. Waktu kedaluwarsa harus diterbitkan oleh server. | Luthfi dan Vassell menyepakati identitas warning, konsumen dan boundary. Durasi 30 menit dan retensi record masih PROPOSED. |
| Fingerprint | Hash mengikat scope, actor, metadata dan sumber; referensi harus memakai revisi yang dapat dibuktikan. | Sumber reference revision masih OPEN. Jangan mengganti revisi bisnis dengan timestamp yang diasumsikan. Dwi menguji perubahan referensi dan replay. |
| Error dan audit | Error domain yang dikenal dapat dipetakan melalui allowlist. Pesan driver dan `cause` internal tidak ditampilkan pada response. | Luthfi dan Dwi mereview nama error publik dan reason audit. Guard transaksi staging pada #52 membutuhkan #50 serta pemeriksaan pada HEAD hasil integrasi. |
| Sumber operasi | Kandidat ini mencakup 22 operasi pada 21 path. Katalog internal SRS-35 mencatat 25 operasi pada sumber. | Adam menyusun pemetaan satu per satu berdasarkan sumber berizin. Selisih masih NEEDS REVIEW dan tidak menghapus operasi baseline. |

Komponen PR #54 adalah kandidat terpisah. Hasil pengujian fixture dan review pada HEAD PR dicatat di Jira; implementasi session, role, preview dan commit nyata masih memerlukan uji API dan database terintegrasi.

## Matriks 22 operasi UI–DTO–query–lineage

Semua operasi bisnis masih PROPOSED. Query berikut adalah rancangan relasi DOC-07, **bukan klaim tabel domain sudah dibangun**. Sebelum pagination/agregasi, terapkan sesi, role, gudang, mode dan ownership pada backend. Detail ID mengambil scope dari objek. Field yang belum ada di DTO tetap kosong secara semantik dengan alasan yang benar; jangan mengisi angka/nama/waktu fiktif.

| API, operasi | UI dan field utama | DTO sumber DOC-09 | Query dan lineage | Owner; keputusan yang menahan |
| --- | --- | --- | --- | --- |
| 01 POST /imports | UI-01/02/03/09/10: file, kind, gudang, mode, versi, sumber, cutoff | ImportUpload → BatchCreated | import_batches → staging_rows; hash server dan row number | Adam; SRS-48/49, header/limit OPEN |
| 02 POST /imports/{batch_id}/validation | Laporan error/warning, jumlah, nomor baris | ValidationResult, ValidationIssue | validation_issues → staging_rows → batch | Luthfi; state dan warning identity OPEN |
| 03 GET /imports/{batch_id}/preview | Rows normalized, fingerprint, expiry, jumlah | Preview, PreviewRow + Normalized lima kind | staging_rows terurut component/row_number, batch dan versi validator | Luthfi; snapshot/version referensi OPEN |
| 04 POST /imports/{batch_id}/commit | Konfirmasi dan hasil simpan | CommitRequest → CommitResult | batch lock; domain + lineage + audit + idempotency dalam satu transaksi | Dwi; SRS-51 dan unique key domain SOURCE REQUIRED |
| 05 POST /imports/{batch_id}/cancellation | Pembatalan eksplisit | Cancellation → CancellationResult | batch lock; audit CANCELLED; terminal immutable | Dwi; state final OPEN |
| 06 GET /inbound/exceptions | UI-04: final flag, overdue, delay/mismatch, supplier/material, alasan | InboundException | inbound_references + commitment_events + receiving_events → source_row | Luthfi; OD-06 dan supplier/material detail OPEN |
| 07 GET /inbound/notices | UI-05: kategori, tanggal acuan, status, inbound unik | Notice | Proyeksi exception final dan overdue terpisah | Vassell/Luthfi; kategori/date/unique count belum lengkap, OPEN |
| 08 GET /inbound/wo | UI-06: WO, material, quantity, UOM, sumber | WoReference | wo_references → stock_support_rows/source_row | Luthfi; mekanisme suplai dan field sumber SOURCE REQUIRED |
| 09 GET /inbound/history | UI-07: requested, INITIAL/CHANGE, receipt, recorded/imported_at | InboundHistoryEvent | inbound_id yang sama; union event immutable + source_row | Luthfi; sequence/previous_date/recorded_at OPEN, jangan fallback record pertama |
| 10 GET /inbound/metrics | UI-08: enam metrik, numerator/denominator/excluded, periode, sumber | SupplierMetric | Eligible final dalam supplier/material/UOM; referensi sumber aman | Luthfi; OD-06, DTO terperinci OPEN; denominator nol null beralasan |
| 11 GET /inventory/snapshots | UI-09: snapshot, metadata sumber/cutoff | StockSnapshot | stock_snapshots → batch → source rows | Vassell/Dwi; precision/basis CF-04 OPEN |
| 12 GET /inventory/count-sessions | UI-10: sesi, cutoff, scope | CountSession | count_sessions → batch → source rows | Dwi; precision/basis OPEN; absent bukan nol |
| 13 POST /inventory/reconciliations | UI-12: input snapshot/count, result run | ReconciliationRequest → RunCreated | Lock input; scope/cutoff/grain; hasil immutable | Dwi; execute permission, D-05 reuse lintas key OPEN |
| 14 GET /inventory/reconciliations/{run_id} | UI-12/13: stock/count qty, UOM, counted, status, variance/reason | RunDetail, ReconciliationLine | run → lines → stock/count source_row | Dwi; grain UJI mengikuti arahan; DTO reason/code belum lengkap |
| 15 GET /inventory/reconciliations | UI-13: run/input IDs, cutoff, rule, counts, created_at | RunSummary | scope/filter sebelum paging; histori tidak ditimpa | Dwi; counts/proyeksi Management dan cutoff OPEN |
| 16 GET /inventory/metrics | UI-14: I-EXACT/COVER/REPEAT, I-VAR, nonvalid, run IDs | InventoryMetric | latest eligible run per konteks → lines → source refs | Dwi; D-06 latest dan denominator/item grain OPEN |
| 17 POST /evidence | UI-11: satu target, file privat | EvidenceRequest → EvidenceMetadata | evidence → target; file di luar transaksi DB | Di luar pekerjaan hari ini; target stock_line vs snapshot/count CF-03 OPEN, upload ditahan |
| 18 GET /evidence/{evidence_id} | UI-11: metadata berizin | EvidenceMetadata | evidence + target scope; tanpa storage key | Owner UC-11; daftar field aman OPEN |
| 19 GET /evidence/{evidence_id}/content | UI-11: unduh eksplisit | Binary MIME aktual; bukan JSON | Otorisasi sebelum stream storage privat | Owner UC-11; download ditahan keputusan izin |
| 20 GET /audit | UI-15: correlation, waktu, aksi/outcome, actor alias, ref, counts | AuditEvent | audit_events; timestamp/ID stabil; sumber batch/source_row | Adam; DTO alias/ref/context belum lengkap; FAILURE bukan FAILED |
| 21 GET /references | Pemilih gudang/material/supplier/cutoff/WO | ReferenceItem collection | Referensi minimum terfilter mode/scope/jenis sebelum paging | Luthfi/Dwi; jenis lookup dan versi referensi OPEN; tanpa CRUD |
| 22 GET /inventory/snapshots/{snapshot_id}/lines | UI-09/11/12: item, UOM, saldo | StockLine | stock_lines → source_row → batch | Vassell/Dwi; filter material/kode dan target evidence OPEN |

## Kontrak rinci alur impor bersama

### Format wire dan error

Usulan kandidat mempertahankan **DTO bisnis langsung** DOC-09. Konsumen SRS-42 memakai `responseFormat: 'dto'`; hasil method adapter tetap `ApiResponse<T>` internal. `/health` dan `/api/v1/health` yang sudah ada memakai `{data,meta}` sehingga wajib `responseFormat: 'envelope'`. Jangan mendeteksi format dari keberadaan field bernama `data`. Pemilihan DTO bisnis perlu review Luthfi; tidak mengubah API health.

Error wire tetap `{error:{code,message,details?,correlation_id}}`. Header `X-Correlation-ID` dikirim pada sukses/gagal. UUID adalah kontrak DOC-09/audit. Middleware SRS-43 saat ini menerima string arbitrer hingga batas yang diizinkan; adapter audit harus membuat UUID internal ketika header tidak sah dan tidak memasukkan string mentah ke audit/log. Penyelarasan header oleh owner SRS-43 masih OPEN.

Status kandidat: 201 staging baru; 200 hasil validation termasuk INVALID, preview/commit/replay/cancel/read; 400 sintaks; 401 sesi; 403 izin; 404 tersembunyi/tidak ditemukan; 409 fingerprint/state/idempotency conflict; 410 preview expired; 422 validasi bisnis; 500 transaksi gagal; 503 dependency gagal. Limit upload impor SOURCE REQUIRED, **bukan** limit evidence 5 MiB. Pesan tidak memuat raw, credential, SQL, stack atau storage key.

### API-01 multipart

Sesuai OpenAPI DOC-09: satu bagian `metadata` object (encoding JSON untuk review), satu `file` bagi EXPECTED/COMMITMENT/RECEIVING/COUNT; STOCK memakai `balance_file` wajib + `support_files` opsional. Jangan mengirim duplikasi metadata sebagai top-level field. Bentuk persis `encoding.metadata.contentType` serta identitas/urutan komponen support masih OPEN. Browser menetapkan boundary, jangan menulis Content-Type multipart manual.

| Field metadata | Tipe, asal | Status/aturan |
| --- | --- | --- |
| kind | Lima enum F-01 | Penamaan ACCEPTED; tidak menerima alias legacy |
| warehouse_id, mode | UUID, ACTUAL/UJI dari konteks UI | Backend cek assignment; ACTUAL tetap ditolak sampai izin tersedia |
| source_name, source_reference | string dari sumber/request | Sanitasi tampilan; bukan storage path atau bukti mitra |
| contract_version | string, `proposed-0.1` SRS-37 | Adaptor berversi; bukan bukti header disahkan |
| cutoff_id | UUID, STOCK/COUNT wajib | CF-04 OPEN; jangan membuat jam dari tanggal-saja |
| source_timezone | string kondisional | Tanpa fallback zona proyek untuk data mitra |
| source_hash | SHA-256 dihitung server dari seluruh paket | Tidak menerima hash client sebagai bukti; algoritme canonical manifest komponen OPEN |
| actor_id, batch_id | UUID server/sesi | Tidak mempercayai actor dari payload; batch_id identitas proses, bukan business line key |

Upload hanya membuat staging dan file privat. `batch_id`, `state=STAGED` pada response 201 mengikuti DOC-09. Business key EXPECTED dan mapping header belum tersedia; jangan menyatakan file mitra telah dinormalisasi oleh fixture JSON. Tidak ada data domain yang boleh berubah pada upload/validation.

### API-02/03 validation dan preview

Validation tidak memerlukan body. INVALID adalah laporan bisnis berisi `issues`, bukan transport gagal. Preview siap menyertakan `batch_id`, `kind`, `warehouse_id`, `mode`, `state`, `fingerprint`, `validator_version`, `validated_at`, `expires_at`, `row_count`, `error_count`, `warning_count`, `rows`, `issues`. Quantity decimal string, null tetap null. Setiap preview row menjaga `component` dan `row_number` >0. `raw` tidak masuk DTO preview aman.

Fingerprint mengikat canonical normalized rows, seluruh hash komponen, metadata bisnis, contract/validator version dan versi referensi. Algoritme canonical byte dan sumber versi referensi harus direview sebelum implementasi bersama. Expiry kandidat 30 menit **jam server**; `now >= expires_at` menolak commit. UI timer hanya membantu tampilan. Perubahan file/konteks/referensi membatalkan preview; validasi ulang menghasilkan snapshot dan expiry baru.

Warning acknowledgement masih **OPEN**: DOC-09 menerima string[] tetapi ValidationIssue tidak mempunyai ID; kode warning tidak unik antarbaris. Usulan review: gunakan `validation_issues.id` UUID sebagai `issue_id`, stabil untuk satu snapshot preview, dan akui semua warning snapshot itu; jangan gunakan code atau index array sebagai identitas. Kontrak mesin snapshot sengaja mempertahankan kekurangan tersebut dan menandainya melalui register gap. Sampai disetujui, PR #11 menolak commit ber-warning; jangan melewatinya dengan acknowledgement kosong.

### API-04 commit, replay dan unknown outcome

Request: Idempotency-Key nonkosong; `{preview_fingerprint,acknowledged_warnings}`. Response `{batch_id,state:'COMMITTED',committed_count}`. Scope idempotency kandidat `(actor,operation,key)` DOC-07; migration 001 masih UNIQUE key global dan belum mempunyai request_hash, sehingga SRS-52 perlu migrasi terpisah. Jangan menambah key baru untuk melewati konflik.

Dalam satu transaction client: lock batch → cek hasil idempotency lama → ulangi otorisasi/ownership → cek state, fingerprint, expiry dan referensi → domain + source_row → audit SUCCESS → COMMITTED + response idempotency → COMMIT. Hasil sukses lama boleh dikembalikan setelah expiry; jangan menolaknya hanya karena preview sekarang expired. Kegagalan rollback dahulu, audit FAILURE pada koneksi/transaksi baru; outage total hanya log aman.

Network timeout/abort/408/5xx atau respons sukses rusak pada mutasi berarti **unknown**, bukan FAILED atau sukses. Abort fetch bukan pembatalan batch. Untuk commit, pertahankan key/payload sama dan gunakan replay yang disepakati setelah otorisasi; transport PR #11 masih menolak retry bila expiry lewat sehingga perlu penyesuaian pada integrasi. Untuk upload yang kehilangan response sebelum batch_id diketahui, API pemulihan belum tersedia: tampilkan tertahan, jangan otomatis unggah ulang. Tidak menambah endpoint ke-23 tanpa persetujuan. Untuk validation/cancel yang unknown, tindakan pemulihan deterministik masih perlu kontrak read-status; GET preview bukan pengganti status terminal. Keterbatasan ini memblokir klaim pemulihan end-to-end.

### API-05 cancellation dan API-21 references

Cancellation: `{reason}` → `{batch_id,state:'CANCELLED'}`; lock yang sama dengan commit, tidak boleh ada domain commit dan cancellation sukses bersamaan. Reason bebas tidak disalin ke audit/log. CANCELLED/COMMITTED terminal; daftar state final menunggu keputusan PM.

References: lookup minimum untuk tugas berizin, bukan CRUD. Query DOC-09 (`type`, scope/mode, cursor/limit/sort sesuai snapshot mesin) diperiksa sebelum query. `items` kosong sah dan `next_cursor=null`; supplier/master yang hilang tidak dibuat otomatis. Management hanya proyeksi aman; lookup tidak memberi akses file/preview orang lain. Sumber versi material/supplier/cutoff dan daftar type final OPEN.

## Kompatibilitas dan pekerjaan owner

| Antarmuka | Hasil inspeksi | Tindak lanjut |
| --- | --- | --- |
| Adapter SRS-42 | dto/envelope eksplisit tersedia; FormData boundary dibiarkan browser; mutation unknown tersedia | Pakai format per endpoint; verifikasi aktual setelah route tersedia |
| Transport PR #11 | Metadata top-level berbeda OpenAPI object; validation hanya PREVIEW_READY; warning diblokir; expiry lokal mencegah replay | Adam menyesuaikan setelah kontrak disetujui; simulator bukan backend |
| Komponen PR #17 | State presentasi lokal dan expiry guard tersedia, tanpa API | Vassell hubungkan melalui mapping; `invalid`, `cancel-unknown` tidak boleh dipaksakan menjadi sukses |
| Backend PR #18 | Health envelope; error aman; correlation ID bisa non-UUID | Luthfi selaraskan UUID/header dan route bisnis; audit memvalidasi ulang |
| Migrasi PR #15 | kind siap; status VALIDATED legacy, raw_payload tanpa normalized/component; idempotency global | Dwi review migrasi lanjutan; jangan mengubah 001 atau mengklaim semua tabel DOC-07 telah ada |

## Register keputusan dan serah terima

| ID | Status | Owner dan dampak |
| --- | --- | --- |
| C58-01 wire DTO bisnis vs envelope | PROPOSED | Luthfi; seluruh konsumen API; health tetap envelope |
| C58-02 multipart metadata JSON, manifest komponen/hash | OPEN | Adam/Luthfi/Dwi; staging, fingerprint dan parser |
| C58-03 state UJI DOC-08 | OPEN, diajukan kepada PM | SRS-50/51/52, status legacy dan UI |
| C58-04 issue_id warning | PROPOSED | Luthfi/Dwi; preview, acknowledgement dan fingerprint |
| C58-05 unknown upload/cancel/status terminal | OPEN | API owner + PM; tidak ada endpoint status dalam 22 operasi |
| C58-06 cutoff/evidence/reuse/latest | OPEN | SRS-38; API-11–19 dan metrik; kontrak bertentangan ditahan |
| C58-07 inbound final/eligibility/sequence/release | OPEN / SOURCE REQUIRED | SRS-39 dan sumber mitra; API-06–10 |
| C58-08 header/locale/UOM/limit/business line key | SOURCE REQUIRED | SRS-37/35 + mitra; staging ACTUAL ditahan |
| C58-09 actor alias, reason, counts, DTO Management | OPEN | Pemilik proyeksi; tidak diisi dari raw atau data pribadi |

Audit menggunakan outcome `FAILURE`, bukan `FAILED`; label UI boleh diterjemahkan tanpa menulis ulang enum domain. `source_row_id` adalah UUID staging, `row_number` adalah posisi sumber, `correlation_id` identitas request, `batch_id` identitas impor. Keempatnya tidak dipertukarkan.

Iterasi Prototyping: kebutuhan diambil dari AC SRS-58; rancangan berupa matriks dan snapshot mesin; implementasi prototipe pada iterasi ini berupa kontrak dokumentasi; evaluasi adalah pemeriksaan sumber/ref/operasi dan review yang diminta, **bukan feedback stakeholder**. Perbaikan berikutnya mengikuti C58-01–09. Pengujian runtime endpoint bisnis, penerimaan stakeholder, serta penutupan CF-07/08 belum terjadi. Review independen dan merge tetap diperlukan sebelum DoD.

## Pemeriksaan aktual kandidat

Pada 20 November 2026, Node 22.22.2: parse JSON, 22 operation ID unik dan 58 referensi lokal PASS; 35 schema DTO tercatat. `Redocly CLI 2.82.0 lint --extends=minimal` terhadap snapshot OpenAPI PASS tanpa temuan. `python3 scripts/check_repository.py --workspace` PASS (125 berkas, 0 temuan); whitespace PASS. Validator dijalankan terisolasi, lockfile aplikasi tidak berubah. Validasi struktur OpenAPI tidak mengesahkan aturan domain, keamanan runtime atau tersedianya endpoint. Contract test terhadap backend bisnis NOT RUN; review Luthfi/Dwi masih diperlukan.
