# Spesifikasi REST API

## Identitas dan kendali dokumen

| Atribut | Nilai |
| --- | --- |
| Document ID | DOC-09 |
| Nama proyek | SIRIS — Capstone Project Kelompok 42 |
| Mitra | Warehouse PT Harina Chemicals Industry |
| Versi | 0.2.0 |
| Status dokumen | PROPOSED — NOT IMPLEMENTED |
| Tanggal penyusunan | 2026-11-10 |
| Pemilik dokumen | Fullstack Development Lead |
| Tujuan dokumen | Menyediakan kontrak antarmuka frontend–backend yang dapat ditinjau. |
| Ruang lingkup | Website pendamping Erasoft; Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation. |

Ketentuan pengguna diberi rujukan **SRC-01**. Desain baru berstatus **PROPOSED**, bukan BASELINE APPROVED. Belum ada aplikasi, hasil pengujian runtime, evaluasi stakeholder, atau persetujuan rilis yang dibuktikan dalam workspace ini. Semua contoh adalah **UJI**.

## Daftar isi

1. Identitas dan kendali dokumen
2. Referensi
3. Konvensi, status, dan autentikasi
4. Kontrak umum request, response, dan DTO
5. Inventaris endpoint
6. API-01 — POST /imports
7. API-02 — POST /imports/{batch_id}/validation
8. API-03 — GET /imports/{batch_id}/preview
9. API-04 — POST /imports/{batch_id}/commit
10. API-05 — POST /imports/{batch_id}/cancellation
11. API-06 — GET /inbound/exceptions
12. API-07 — GET /inbound/notices
13. API-08 — GET /inbound/wo
14. API-09 — GET /inbound/history
15. API-10 — GET /inbound/metrics
16. API-11 — GET /inventory/snapshots
17. API-12 — GET /inventory/count-sessions
18. API-13 — POST /inventory/reconciliations
19. API-14 — GET /inventory/reconciliations/{run_id}
20. API-15 — GET /inventory/reconciliations
21. API-16 — GET /inventory/metrics
22. API-17 — POST /evidence
23. API-18 — GET /evidence/{evidence_id}
24. API-19 — GET /evidence/{evidence_id}/content
25. API-20 — GET /audit
26. API-21 — GET /references
27. API-22 — GET /inventory/snapshots/{snapshot_id}/lines
28. Kontrak OpenAPI 3.1 seluruh endpoint
29. Status HTTP dan kontrol transaksi
30. Keputusan domain yang ditahan setelah SRC-09 tersedia
31. Pemetaan presentation state dan gap DTO ke SRC-09
32. Dependencies
33. Open issues
34. Riwayat revisi

## Referensi

SRC-01: master prompt pengguna pada sesi penyusunan; SRC-02: `../AGENTS.md`. SRC-09: `../design.md` v1.0.0, kontrak desain untuk ditinjau yang tersedia pada pemeriksaan akhir; snapshot visual disertakan pada DOC-10. Register sumber lengkap, hierarki, dan sumber eksternal terdapat pada [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md). Rujukan antardokumen: [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md), [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md), [DOC-05](05_BUSINESS_RULES_RBAC.md), [DOC-06](06_SOFTWARE_ARCHITECTURE_DESIGN.md), [DOC-07](07_DATABASE_DESIGN.md), [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md), [DOC-10](10_UI_UX_PROTOTYPE_SPECIFICATION.md), [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md).

## Konvensi, status, dan autentikasi

Semua endpoint **PROPOSED / NOT IMPLEMENTED**. Base URL usulan `/api/v1`; route di tabel relatif terhadap base tersebut. Pendekatan schema memakai OpenAPI 3.1 dan JSON Schema; perubahan breaking memerlukan versi baru. Tidak ada host produksi yang diklaim tersedia. Autentikasi rekomendasi sesi cookie pada DOC-06 menunggu OD-07; mutasi memerlukan CSRF protection. Role per UC mengikuti matriks DOC-05, gudang/objek tetap diperiksa backend. Endpoint validasi adalah bagian alur impor, bukan halaman atau fitur baru.

## Kontrak umum request, response, dan DTO

Semua ID berformat UUID; waktu ISO 8601 ber-offset; tanggal YYYY-MM-DD; quantity/variance dikirim sebagai string decimal agar tidak kehilangan presisi JavaScript; null tetap null. Query mode hanya ACTUAL/UJI. `AuthContext` = user_id, role, warehouse_ids dari sesi. `CommitRequest` = preview_fingerprint dan acknowledged_warnings; `CommitResult` = batch_id, state, committed_count. `ReconciliationRequest` = stock_snapshot_id, count_session_id. `EvidenceRequest` = stock_line_id dan file. `QueryFilter` = scope, mode, rentang waktu dan pagination; `QueryResult` = items serta next_cursor. Domain DTO terperinci mengikuti field bertipe DOC-07, dengan redaksi DOC-05.

Response error `ApiError`: `{ "error": { "code": "MODE_MISMATCH", "message": "Mode data tidak sama.", "details": [{"field":"mode","code":"MODE_MISMATCH"}], "correlation_id": "00000000-0000-4000-8000-000000000001" } }`. Tidak mengirim stack trace, SQL, raw file atau storage key. Collection menggunakan `{items: [], next_cursor: null}` ketika kosong. Usulan pagination limit default 25 maksimum 100 adalah opsi teknis, bukan threshold NFR. Cursor opaque terikat filter/scope dan urutan waktu+ID; perubahan filter menghapus cursor. Rentang waktu usulan [from,to); tanggal dasar metrik OD-06.

## Inventaris endpoint

| Endpoint ID | Method | Route | UC | Tujuan |
| --- | --- | --- | --- | --- |
| API-01 | POST | /imports | UC-01, UC-02, UC-03, UC-09, UC-10 | Membuat staging batch |
| API-02 | POST | /imports/{batch_id}/validation | UC-01, UC-02, UC-03, UC-09, UC-10, UC-16 | Menjalankan UC-16 internal dari alur impor |
| API-03 | GET | /imports/{batch_id}/preview | UC-01, UC-02, UC-03, UC-09, UC-10 | Membaca preview terikat fingerprint |
| API-04 | POST | /imports/{batch_id}/commit | UC-01, UC-02, UC-03, UC-09, UC-10 | Commit batch atomik |
| API-05 | POST | /imports/{batch_id}/cancellation | UC-01, UC-02, UC-03, UC-09, UC-10 | Membatalkan batch sebelum commit |
| API-06 | GET | /inbound/exceptions | UC-04 | Membaca memeriksa exception inbound |
| API-07 | GET | /inbound/notices | UC-05 | Membaca melihat pemberitahuan inbound |
| API-08 | GET | /inbound/wo | UC-06 | Membaca membaca referensi material wo |
| API-09 | GET | /inbound/history | UC-07 | Membaca menelusuri riwayat inbound |
| API-10 | GET | /inbound/metrics | UC-08 | Membaca melihat metrik supplier |
| API-11 | GET | /inventory/snapshots | UC-09 | Membaca mengimpor data stok |
| API-12 | GET | /inventory/count-sessions | UC-10 | Membaca mengimpor hasil hitung fisik |
| API-13 | POST | /inventory/reconciliations | UC-12 | Membuat run rekonsiliasi baru |
| API-14 | GET | /inventory/reconciliations/{run_id} | UC-12, UC-13 | Membaca hasil run immutable |
| API-15 | GET | /inventory/reconciliations | UC-13 | Membaca menelusuri riwayat selisih stok |
| API-16 | GET | /inventory/metrics | UC-14 | Membaca melihat metrik persediaan |
| API-17 | POST | /evidence | UC-11 | Mengarsipkan evidence privat |
| API-18 | GET | /evidence/{evidence_id} | UC-11 | Membaca metadata aman evidence |
| API-19 | GET | /evidence/{evidence_id}/content | UC-11 | Membaca file melalui stream privat terotorisasi |
| API-20 | GET | /audit | UC-15 | Membaca menelusuri audit proses |
| API-21 | GET | /references | UC-01, UC-02, UC-03, UC-06, UC-08, UC-09, UC-10, UC-11, UC-12, UC-14, UC-15 | Lookup referensi yang telah tersedia; bukan CRUD master |
| API-22 | GET | /inventory/snapshots/{snapshot_id}/lines | UC-09, UC-11, UC-12 | Membaca saldo dan memilih target evidence |

## API-01 — POST /imports

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membuat staging batch |
| Related UC | UC-01, UC-02, UC-03, UC-09, UC-10 |
| Allowed roles | PROPOSED: Purchasing, Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | multipart file/paket dan metadata DOC-08 |
| Request example UJI | {"kind": "STOCK", "warehouse_id": "00000000-0000-4000-8000-000000000001", "mode": "UJI", "cutoff_id": "00000000-0000-4000-8000-000000000002", "source_name": "UJI-stock.csv", "source_reference": "UJI-SRC-001", "contract_version": "proposed-0.1", "file": "<binary UJI>"} |
| Success HTTP | 201 |
| Success response example UJI | {"batch_id": "00000000-0000-4000-8000-000000000001", "state": "STAGED"} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-01, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-01, BR-INB-02, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-03, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-01, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-02, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Storage | Tabel DOC-07: commitment_events, count_sessions, count_lines, inbound_references, receiving_events, stock_snapshots, stock_lines, stock_support_rows |
| Status | PROPOSED; belum diimplementasikan |

## API-02 — POST /imports/{batch_id}/validation

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Menjalankan UC-16 internal dari alur impor |
| Related UC | UC-01, UC-02, UC-03, UC-09, UC-10, UC-16 |
| Allowed roles | PROPOSED: Purchasing, Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | batch_id UUID path |
| Request example UJI | {} |
| Success HTTP | 200 |
| Success response example UJI | {"batch_id": "00000000-0000-4000-8000-000000000001", "state": "PREVIEW_READY", "error_count": 0, "warning_count": 0, "issues": []} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-01, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-01, BR-INB-02, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-03, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-01, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-02, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-04, BR-DAT-01, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Storage | Tabel DOC-07: commitment_events, count_sessions, count_lines, import_batches, staging_rows, validation_issues, inbound_references, receiving_events, stock_snapshots, stock_lines, stock_support_rows |
| Status | PROPOSED; belum diimplementasikan |

## API-03 — GET /imports/{batch_id}/preview

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membaca preview terikat fingerprint |
| Related UC | UC-01, UC-02, UC-03, UC-09, UC-10 |
| Allowed roles | PROPOSED: Purchasing, Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | batch_id UUID path |
| Request example UJI | GET /imports/{batch_id}/preview; parameter scope seperti di atas; tanpa body |
| Success HTTP | 200 |
| Success response example UJI | {"batch_id": "00000000-0000-4000-8000-000000000001", "mode": "UJI", "warehouse_id": "00000000-0000-4000-8000-000000000002", "state": "PREVIEW_READY", "fingerprint": "UJI-sha256-placeholder", "validated_at": "2026-11-10T08:00:00Z", "expires_at": "2026-11-10T08:30:00Z", "rows": [{"row_number": 1, "component": "balance", "normalized": {"material_code": "UJI-MAT-01", "uom": "KG", "system_quantity": "10.000000"}}], "issues": [], "kind": "STOCK", "validator_version": "proposed-0.1", "row_count": 1, "error_count": 0, "warning_count": 0} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-01, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-01, BR-INB-02, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-03, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-01, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-02, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Storage | Tabel DOC-07: commitment_events, count_sessions, count_lines, inbound_references, receiving_events, stock_snapshots, stock_lines, stock_support_rows |
| Status | PROPOSED; belum diimplementasikan |

## API-04 — POST /imports/{batch_id}/commit

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Commit batch atomik |
| Related UC | UC-01, UC-02, UC-03, UC-09, UC-10 |
| Allowed roles | PROPOSED: Purchasing, Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | batch_id UUID path; Idempotency-Key header |
| Request example UJI | {"preview_fingerprint": "UJI-sha256-placeholder", "acknowledged_warnings": []} |
| Success HTTP | 200 |
| Success response example UJI | {"batch_id": "00000000-0000-4000-8000-000000000001", "state": "COMMITTED", "committed_count": 1} |
| Error response example | {"error": {"code": "IDEMPOTENCY_CONFLICT", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-01, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-01, BR-INB-02, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-03, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-01, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-02, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Storage | Tabel DOC-07: commitment_events, count_sessions, count_lines, inbound_references, receiving_events, stock_snapshots, stock_lines, stock_support_rows |
| Status | PROPOSED; belum diimplementasikan |

## API-05 — POST /imports/{batch_id}/cancellation

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membatalkan batch sebelum commit |
| Related UC | UC-01, UC-02, UC-03, UC-09, UC-10 |
| Allowed roles | PROPOSED: Purchasing, Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | batch_id UUID path |
| Request example UJI | {"reason": "Pembatalan fixture UJI"} |
| Success HTTP | 200 |
| Success response example UJI | {"batch_id": "00000000-0000-4000-8000-000000000001", "state": "CANCELLED"} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-01, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-01, BR-INB-02, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-03, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-01, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-02, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Storage | Tabel DOC-07: commitment_events, count_sessions, count_lines, inbound_references, receiving_events, stock_snapshots, stock_lines, stock_support_rows |
| Status | PROPOSED; belum diimplementasikan |

## API-06 — GET /inbound/exceptions

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membaca memeriksa exception inbound |
| Related UC | UC-04 |
| Allowed roles | PROPOSED: Purchasing, Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | warehouse_id UUID dan mode wajib; period/from/to opsional; cursor dan limit opsional; metrics inventory membutuhkan run_id |
| Request example UJI | GET /inbound/exceptions; parameter scope seperti di atas; tanpa body |
| Success HTTP | 200 |
| Success response example UJI | {"items": [{"inbound_id": "00000000-0000-4000-8000-000000000001", "is_final": false, "final_exceptions": [], "open_overdue": true}], "next_cursor": null} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-DAT-01, BR-INB-03, BR-INB-04, BR-SEC-01 |
| Storage | Tabel DOC-07: inbound_references, commitment_events, receiving_events |
| Status | PROPOSED; belum diimplementasikan |

## API-07 — GET /inbound/notices

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membaca melihat pemberitahuan inbound |
| Related UC | UC-05 |
| Allowed roles | PROPOSED: Purchasing, Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | warehouse_id UUID dan mode wajib; period/from/to opsional; cursor dan limit opsional; metrics inventory membutuhkan run_id |
| Request example UJI | GET /inbound/notices; parameter scope seperti di atas; tanpa body |
| Success HTTP | 200 |
| Success response example UJI | {"items": [{"inbound_id": "00000000-0000-4000-8000-000000000001", "message": "UJI: inbound terbuka melewati tanggal acuan", "mode": "UJI"}], "next_cursor": null} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-DAT-01, BR-INB-04, BR-SEC-01 |
| Storage | Tabel DOC-07: inbound_references, commitment_events, receiving_events |
| Status | PROPOSED; belum diimplementasikan |

## API-08 — GET /inbound/wo

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membaca membaca referensi material wo |
| Related UC | UC-06 |
| Allowed roles | PROPOSED: Production, Purchasing. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | warehouse_id UUID dan mode wajib; period/from/to opsional; cursor dan limit opsional; metrics inventory membutuhkan run_id |
| Request example UJI | GET /inbound/wo; parameter scope seperti di atas; tanpa body |
| Success HTTP | 200 |
| Success response example UJI | {"items": [{"id": "00000000-0000-4000-8000-000000000001", "source_ref": "UJI-WO-001", "material_id": "00000000-0000-4000-8000-000000000002", "required_quantity": "10.000000", "uom": "KG", "mode": "UJI"}], "next_cursor": null} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-DAT-01, BR-SEC-01, BR-DAT-02 |
| Storage | Tabel DOC-07: wo_references |
| Status | PROPOSED; belum diimplementasikan |

## API-09 — GET /inbound/history

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membaca menelusuri riwayat inbound |
| Related UC | UC-07 |
| Allowed roles | PROPOSED: Purchasing, Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | warehouse_id UUID dan mode wajib; period/from/to opsional; cursor dan limit opsional; metrics inventory membutuhkan run_id |
| Request example UJI | GET /inbound/history; parameter scope seperti di atas; tanpa body |
| Success HTTP | 200 |
| Success response example UJI | {"items": [{"inbound_id": "00000000-0000-4000-8000-000000000001", "event_type": "INITIAL", "promised_date": "2026-11-11", "source_row_id": "00000000-0000-4000-8000-000000000002"}], "next_cursor": null} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-DAT-01, BR-INB-01, BR-INB-02, BR-INB-03, BR-SEC-01 |
| Storage | Tabel DOC-07: inbound_references, commitment_events, receiving_events |
| Status | PROPOSED; belum diimplementasikan |

## API-10 — GET /inbound/metrics

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membaca melihat metrik supplier |
| Related UC | UC-08 |
| Allowed roles | PROPOSED: Management, Purchasing. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | warehouse_id UUID dan mode wajib; period/from/to opsional; cursor dan limit opsional; metrics inventory membutuhkan run_id |
| Request example UJI | GET /inbound/metrics; parameter scope seperti di atas; tanpa body |
| Success HTTP | 200 |
| Success response example UJI | {"items": [{"metric_code": "SOURCE_REQUIRED", "value": null, "eligible_count": 0, "excluded_count": 0, "reason": "NEEDS_BASELINE"}], "next_cursor": null} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-DAT-01, BR-INB-03, BR-INB-04, BR-INB-05, BR-SEC-01 |
| Storage | Tabel DOC-07: inbound_references, commitment_events, receiving_events |
| Status | PROPOSED; belum diimplementasikan |

## API-11 — GET /inventory/snapshots

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membaca mengimpor data stok |
| Related UC | UC-09 |
| Allowed roles | PROPOSED: Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | warehouse_id UUID dan mode wajib; period/from/to opsional; cursor dan limit opsional; metrics inventory membutuhkan run_id |
| Request example UJI | GET /inventory/snapshots; parameter scope seperti di atas; tanpa body |
| Success HTTP | 200 |
| Success response example UJI | {"items": [{"id": "00000000-0000-4000-8000-000000000001", "cutoff_id": "00000000-0000-4000-8000-000000000002", "mode": "UJI"}], "next_cursor": null} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-01, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Storage | Tabel DOC-07: stock_snapshots, stock_lines, stock_support_rows |
| Status | PROPOSED; belum diimplementasikan |

## API-12 — GET /inventory/count-sessions

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membaca mengimpor hasil hitung fisik |
| Related UC | UC-10 |
| Allowed roles | PROPOSED: Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | warehouse_id UUID dan mode wajib; period/from/to opsional; cursor dan limit opsional; metrics inventory membutuhkan run_id |
| Request example UJI | GET /inventory/count-sessions; parameter scope seperti di atas; tanpa body |
| Success HTTP | 200 |
| Success response example UJI | {"items": [{"id": "00000000-0000-4000-8000-000000000001", "cutoff_id": "00000000-0000-4000-8000-000000000002", "mode": "UJI"}], "next_cursor": null} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-02, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Storage | Tabel DOC-07: count_sessions, count_lines |
| Status | PROPOSED; belum diimplementasikan |

## API-13 — POST /inventory/reconciliations

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membuat run rekonsiliasi baru |
| Related UC | UC-12 |
| Allowed roles | PROPOSED: Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | Idempotency-Key header |
| Request example UJI | {"stock_snapshot_id": "00000000-0000-4000-8000-000000000001", "count_session_id": "00000000-0000-4000-8000-000000000002"} |
| Success HTTP | 201 |
| Success response example UJI | {"run_id": "00000000-0000-4000-8000-000000000001", "rule_version": "proposed-0.1"} |
| Error response example | {"error": {"code": "IDEMPOTENCY_CONFLICT", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-DAT-01, BR-INV-01, BR-INV-02, BR-INV-03, BR-INV-04, BR-INV-05, BR-INV-06, BR-AUD-01, BR-SEC-01 |
| Storage | Tabel DOC-07: reconciliation_runs, reconciliation_lines |
| Status | PROPOSED; belum diimplementasikan |

## API-14 — GET /inventory/reconciliations/{run_id}

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membaca hasil run immutable |
| Related UC | UC-12, UC-13 |
| Allowed roles | PROPOSED: Management, Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | run_id UUID path; cursor dan limit untuk lines |
| Request example UJI | GET /inventory/reconciliations/{run_id}; parameter scope seperti di atas; tanpa body |
| Success HTTP | 200 |
| Success response example UJI | {"run_id": "00000000-0000-4000-8000-000000000001", "stock_snapshot_id": "00000000-0000-4000-8000-000000000001", "count_session_id": "00000000-0000-4000-8000-000000000002", "lines": [{"material_id": "00000000-0000-4000-8000-000000000001", "status": "NOT_COUNTED", "variance": null}], "next_cursor": null} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-DAT-01, BR-INV-01, BR-INV-02, BR-INV-03, BR-INV-04, BR-INV-05, BR-INV-06, BR-AUD-01, BR-SEC-01; BR-DAT-01, BR-INV-04, BR-INV-05, BR-INV-06, BR-SEC-01 |
| Storage | Tabel DOC-07: reconciliation_runs, reconciliation_lines |
| Status | PROPOSED; belum diimplementasikan |

## API-15 — GET /inventory/reconciliations

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membaca menelusuri riwayat selisih stok |
| Related UC | UC-13 |
| Allowed roles | PROPOSED: Management, Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | warehouse_id UUID dan mode wajib; period/from/to opsional; cursor dan limit opsional; metrics inventory membutuhkan run_id |
| Request example UJI | GET /inventory/reconciliations; parameter scope seperti di atas; tanpa body |
| Success HTTP | 200 |
| Success response example UJI | {"items": [{"id": "00000000-0000-4000-8000-000000000001", "stock_snapshot_id": "00000000-0000-4000-8000-000000000002", "count_session_id": "00000000-0000-4000-8000-000000000001", "rule_version": "proposed-0.1"}], "next_cursor": null} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-DAT-01, BR-INV-04, BR-INV-05, BR-INV-06, BR-SEC-01 |
| Storage | Tabel DOC-07: reconciliation_runs, reconciliation_lines |
| Status | PROPOSED; belum diimplementasikan |

## API-16 — GET /inventory/metrics

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membaca melihat metrik persediaan |
| Related UC | UC-14 |
| Allowed roles | PROPOSED: Management, Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | warehouse_id UUID dan mode wajib; period/from/to opsional; cursor dan limit opsional; metrics inventory membutuhkan run_id |
| Request example UJI | GET /inventory/metrics; parameter scope seperti di atas; tanpa body |
| Success HTTP | 200 |
| Success response example UJI | {"items": [{"metric_code": "MATCH_RATE_PROPOSED", "value": null, "numerator": 0, "denominator": 0, "excluded_count": 1, "reason": "NO_ELIGIBLE_DATA"}], "next_cursor": null} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-DAT-01, BR-INV-04, BR-INV-05, BR-SEC-01 |
| Storage | Tabel DOC-07: reconciliation_runs, reconciliation_lines |
| Status | PROPOSED; belum diimplementasikan |

## API-17 — POST /evidence

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Mengarsipkan evidence privat |
| Related UC | UC-11 |
| Allowed roles | PROPOSED: Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | multipart; Idempotency-Key header |
| Request example UJI | {"stock_line_id": "00000000-0000-4000-8000-000000000001", "file": "<binary UJI PNG>"} |
| Success HTTP | 201 |
| Success response example UJI | {"evidence_id": "00000000-0000-4000-8000-000000000001", "file_name": "UJI-bukti.png", "size_bytes": 1024, "media_type": "image/png"} |
| Error response example | {"error": {"code": "IDEMPOTENCY_CONFLICT", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-DAT-01, BR-EVD-01, BR-EVD-02, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Storage | Tabel DOC-07: evidence |
| Status | PROPOSED; belum diimplementasikan |

## API-18 — GET /evidence/{evidence_id}

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membaca metadata aman evidence |
| Related UC | UC-11 |
| Allowed roles | PROPOSED: Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | evidence_id UUID path |
| Request example UJI | GET /evidence/{evidence_id}; parameter scope seperti di atas; tanpa body |
| Success HTTP | 200 |
| Success response example UJI | {"evidence_id": "00000000-0000-4000-8000-000000000001", "stock_line_id": "00000000-0000-4000-8000-000000000002", "file_name": "UJI-bukti.png", "size_bytes": 1024, "media_type": "image/png"} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-DAT-01, BR-EVD-01, BR-EVD-02, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Storage | Tabel DOC-07: evidence |
| Status | PROPOSED; belum diimplementasikan |

## API-19 — GET /evidence/{evidence_id}/content

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membaca file melalui stream privat terotorisasi |
| Related UC | UC-11 |
| Allowed roles | PROPOSED: Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | evidence_id UUID path |
| Request example UJI | GET /evidence/{evidence_id}/content; parameter scope seperti di atas; tanpa body |
| Success HTTP | 200 |
| Success response example UJI | {"binary": "<stream UJI sesuai media_type>"} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-DAT-01, BR-EVD-01, BR-EVD-02, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Storage | Tabel DOC-07: evidence |
| Status | PROPOSED; belum diimplementasikan |

## API-20 — GET /audit

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membaca menelusuri audit proses |
| Related UC | UC-15 |
| Allowed roles | PROPOSED: Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | warehouse_id UUID dan mode wajib; period/from/to opsional; cursor dan limit opsional; metrics inventory membutuhkan run_id |
| Request example UJI | GET /audit; parameter scope seperti di atas; tanpa body |
| Success HTTP | 200 |
| Success response example UJI | {"items": [{"id": "00000000-0000-4000-8000-000000000001", "action": "import.commit", "outcome": "SUCCESS", "mode": "UJI", "correlation_id": "00000000-0000-4000-8000-000000000002"}], "next_cursor": null} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-IMP-04, BR-DAT-01, BR-AUD-01, BR-SEC-01 |
| Storage | Tabel DOC-07: audit_events |
| Status | PROPOSED; belum diimplementasikan |

## API-21 — GET /references

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Lookup referensi yang telah tersedia; bukan CRUD master |
| Related UC | UC-01, UC-02, UC-03, UC-06, UC-08, UC-09, UC-10, UC-11, UC-12, UC-14, UC-15 |
| Allowed roles | PROPOSED: Management, Production, Purchasing, Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | warehouse_id UUID; mode; type=material/supplier/warehouse/cutoff; q opsional |
| Request example UJI | GET /references; parameter scope seperti di atas; tanpa body |
| Success HTTP | 200 |
| Success response example UJI | {"items": [{"id": "00000000-0000-4000-8000-000000000001", "code": "UJI-MAT-01", "name": "Material simulasi"}], "next_cursor": null} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-DAT-01, BR-EVD-01, BR-EVD-02, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-DAT-01, BR-INV-01, BR-INV-02, BR-INV-03, BR-INV-04, BR-INV-05, BR-INV-06, BR-AUD-01, BR-SEC-01; BR-DAT-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-01, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-01, BR-INB-02, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INB-03, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-01, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-02, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Storage | Tabel DOC-07: commitment_events, count_sessions, count_lines, evidence, inbound_references, receiving_events, reconciliation_runs, reconciliation_lines, stock_snapshots, stock_lines, stock_support_rows, wo_references |
| Status | PROPOSED; belum diimplementasikan |

## API-22 — GET /inventory/snapshots/{snapshot_id}/lines

| Elemen | Spesifikasi |
| --- | --- |
| Tujuan | Membaca saldo dan memilih target evidence |
| Related UC | UC-09, UC-11, UC-12 |
| Allowed roles | PROPOSED: Warehouse. Izin aksi mengikuti DOC-05; untuk impor dipilih menurut kind, bukan union role. |
| Required parameters | snapshot_id UUID path; cursor/limit opsional |
| Request example UJI | GET /inventory/snapshots/{snapshot_id}/lines; parameter scope seperti di atas; tanpa body |
| Success HTTP | 200 |
| Success response example UJI | {"items": [{"id": "00000000-0000-4000-8000-000000000001", "material_id": "00000000-0000-4000-8000-000000000002", "uom": "KG", "system_quantity": "10.000000"}], "next_cursor": null} |
| Error response example | {"error": {"code": "FORBIDDEN", "message": "Operasi ditolak; periksa izin atau kesamaan request.", "details": [], "correlation_id": "00000000-0000-4000-8000-000000000001"}} |
| Business validations | BR-DAT-01, BR-EVD-01, BR-EVD-02, BR-AUD-01, BR-SEC-01, BR-DAT-02; BR-DAT-01, BR-INV-01, BR-INV-02, BR-INV-03, BR-INV-04, BR-INV-05, BR-INV-06, BR-AUD-01, BR-SEC-01; BR-IMP-01, BR-IMP-02, BR-IMP-03, BR-IMP-04, BR-DAT-01, BR-INV-01, BR-INV-03, BR-AUD-01, BR-SEC-01, BR-DAT-02 |
| Storage | Tabel DOC-07: evidence, reconciliation_runs, reconciliation_lines, stock_snapshots, stock_lines, stock_support_rows |
| Status | PROPOSED; belum diimplementasikan |

## Kontrak OpenAPI 3.1 seluruh endpoint

Kontrak berikut memuat seluruh 22 operasi sebagai JSON OpenAPI 3.1.1 dan dapat diekstrak menjadi file spesifikasi ketika implementasi dimulai. Seluruh schema dan mekanisme sesi **PROPOSED**; bukan API yang sudah tersedia. Rujukan format: [OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html).

Aturan semantik lintas field tetap wajib: kind STOCK memerlukan balance_file dan boleh support_files; jenis lain memerlukan file. STOCK/COUNT wajib cutoff_id. PROPOSED: file tanpa baris data ditolak sebagai INVALID_FILE pada validasi. PreviewRow.normalized harus cocok dengan kind batch, bukan sekadar lolos salah satu schema. ACTUAL memerlukan verifikasi cutoff saat rekonsiliasi. COUNT true memerlukan nilai nonnull, false memerlukan null. Variance wajib null untuk status nonvalid; final_exceptions kosong ketika is_final=false. Penutup RECEIVING harus memenuhi bukti sah. Business constraints tersebut tidak boleh diabaikan hanya karena JSON Schema lolos.

API-01 multipart memakai metadata object; field contoh metadata di tabel endpoint ditempatkan di bagian metadata, file dipisah. API-02 tidak membutuhkan body. API-19 merespons binary dengan MIME sebenarnya PDF/JPEG/PNG, bukan JSON; contoh tabel adalah penjelasan stream. Schema bukan izin mengekspos raw atau storage key. API-21 mengembalikan referensi minimum sesuai tugas dan scope; lookup gudang/cutoff untuk filter metrik juga dapat dipakai Management sesuai izin view final, sedangkan raw tetap dilarang. Tidak menambah UC baru.

Sorting yang dirancang: source_asc/source_desc mengikuti urutan sumber yang stabil; default sumber terbaru/ID untuk events/run, urutan row_number untuk baris snapshot/preview, kode untuk lookup. Frontend tidak menawarkan sort kolom lain sebelum kontraknya tersedia. Mode, warehouse_id, filter, run_id dan cursor harus konsisten; cursor tidak boleh dipakai lintas konteks. Pada detail berbasis ID, server menurunkan scope dari objek dan memeriksa izin, bukan mempercayai scope client.

```json
{
  "openapi": "3.1.1",
  "info": {
    "title": "SIRIS REST API — PROPOSED",
    "version": "0.2.0",
    "description": "Desain belum diimplementasikan/disetujui. Contoh seluruhnya UJI. Aturan lintas field dan otorisasi tetap wajib di backend."
  },
  "servers": [
    {
      "url": "/api/v1"
    }
  ],
  "security": [
    {
      "proposedSession": []
    }
  ],
  "paths": {
    "/imports": {
      "post": {
        "operationId": "api_01",
        "summary": "Membuat staging batch",
        "x-endpoint-id": "API-01",
        "x-use-cases": [
          "UC-01",
          "UC-02",
          "UC-03",
          "UC-09",
          "UC-10"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "PROPOSED untuk mekanisme session cookie; metode penerbitan token mengikuti OD-07."
          }
        ],
        "responses": {
          "201": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/BatchCreated"
                },
                "example": {
                  "batch_id": "00000000-0000-4000-8000-000000000001",
                  "state": "STAGED"
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "multipart/form-data": {
              "schema": {
                "$ref": "#/components/schemas/ImportUpload"
              }
            }
          }
        }
      }
    },
    "/imports/{batch_id}/validation": {
      "post": {
        "operationId": "api_02",
        "summary": "Menjalankan UC-16 internal dari alur impor",
        "x-endpoint-id": "API-02",
        "x-use-cases": [
          "UC-01",
          "UC-02",
          "UC-03",
          "UC-09",
          "UC-10",
          "UC-16"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "batch_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "PROPOSED untuk mekanisme session cookie; metode penerbitan token mengikuti OD-07."
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ValidationResult"
                },
                "example": {
                  "batch_id": "00000000-0000-4000-8000-000000000001",
                  "state": "PREVIEW_READY",
                  "error_count": 0,
                  "warning_count": 0,
                  "issues": []
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    },
    "/imports/{batch_id}/preview": {
      "get": {
        "operationId": "api_03",
        "summary": "Membaca preview terikat fingerprint",
        "x-endpoint-id": "API-03",
        "x-use-cases": [
          "UC-01",
          "UC-02",
          "UC-03",
          "UC-09",
          "UC-10"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "batch_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Preview"
                },
                "example": {
                  "batch_id": "00000000-0000-4000-8000-000000000001",
                  "mode": "UJI",
                  "warehouse_id": "00000000-0000-4000-8000-000000000002",
                  "state": "PREVIEW_READY",
                  "fingerprint": "UJI-sha256-placeholder",
                  "validated_at": "2026-11-10T08:00:00Z",
                  "expires_at": "2026-11-10T08:30:00Z",
                  "rows": [
                    {
                      "row_number": 1,
                      "component": "balance",
                      "normalized": {
                        "material_code": "UJI-MAT-01",
                        "uom": "KG",
                        "system_quantity": "10.000000"
                      }
                    }
                  ],
                  "issues": [],
                  "kind": "STOCK",
                  "validator_version": "proposed-0.1",
                  "row_count": 1,
                  "error_count": 0,
                  "warning_count": 0
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    },
    "/imports/{batch_id}/commit": {
      "post": {
        "operationId": "api_04",
        "summary": "Commit batch atomik",
        "x-endpoint-id": "API-04",
        "x-use-cases": [
          "UC-01",
          "UC-02",
          "UC-03",
          "UC-09",
          "UC-10"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "batch_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "Idempotency-Key",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string",
              "minLength": 1
            }
          },
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "PROPOSED untuk mekanisme session cookie; metode penerbitan token mengikuti OD-07."
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CommitResult"
                },
                "example": {
                  "batch_id": "00000000-0000-4000-8000-000000000001",
                  "state": "COMMITTED",
                  "committed_count": 1
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CommitRequest"
              }
            }
          }
        }
      }
    },
    "/imports/{batch_id}/cancellation": {
      "post": {
        "operationId": "api_05",
        "summary": "Membatalkan batch sebelum commit",
        "x-endpoint-id": "API-05",
        "x-use-cases": [
          "UC-01",
          "UC-02",
          "UC-03",
          "UC-09",
          "UC-10"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "batch_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "PROPOSED untuk mekanisme session cookie; metode penerbitan token mengikuti OD-07."
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CancellationResult"
                },
                "example": {
                  "batch_id": "00000000-0000-4000-8000-000000000001",
                  "state": "CANCELLED"
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/Cancellation"
              }
            }
          }
        }
      }
    },
    "/inbound/exceptions": {
      "get": {
        "operationId": "api_06",
        "summary": "Membaca memeriksa exception inbound",
        "x-endpoint-id": "API-06",
        "x-use-cases": [
          "UC-04"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "warehouse_id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "mode",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "ACTUAL",
                "UJI"
              ]
            }
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "cursor",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 25
            }
          },
          {
            "name": "sort",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "source_asc",
                "source_desc"
              ],
              "default": "source_desc"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "additionalProperties": false,
                  "properties": {
                    "items": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/InboundException"
                      }
                    },
                    "next_cursor": {
                      "type": [
                        "string",
                        "null"
                      ]
                    }
                  },
                  "required": [
                    "items",
                    "next_cursor"
                  ]
                },
                "example": {
                  "items": [
                    {
                      "inbound_id": "00000000-0000-4000-8000-000000000001",
                      "is_final": false,
                      "final_exceptions": [],
                      "open_overdue": true
                    }
                  ],
                  "next_cursor": null
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    },
    "/inbound/notices": {
      "get": {
        "operationId": "api_07",
        "summary": "Membaca melihat pemberitahuan inbound",
        "x-endpoint-id": "API-07",
        "x-use-cases": [
          "UC-05"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "warehouse_id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "mode",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "ACTUAL",
                "UJI"
              ]
            }
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "cursor",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 25
            }
          },
          {
            "name": "sort",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "source_asc",
                "source_desc"
              ],
              "default": "source_desc"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "additionalProperties": false,
                  "properties": {
                    "items": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/Notice"
                      }
                    },
                    "next_cursor": {
                      "type": [
                        "string",
                        "null"
                      ]
                    }
                  },
                  "required": [
                    "items",
                    "next_cursor"
                  ]
                },
                "example": {
                  "items": [
                    {
                      "inbound_id": "00000000-0000-4000-8000-000000000001",
                      "message": "UJI: inbound terbuka melewati tanggal acuan",
                      "mode": "UJI"
                    }
                  ],
                  "next_cursor": null
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    },
    "/inbound/wo": {
      "get": {
        "operationId": "api_08",
        "summary": "Membaca membaca referensi material wo",
        "x-endpoint-id": "API-08",
        "x-use-cases": [
          "UC-06"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "warehouse_id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "mode",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "ACTUAL",
                "UJI"
              ]
            }
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "cursor",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 25
            }
          },
          {
            "name": "sort",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "source_asc",
                "source_desc"
              ],
              "default": "source_desc"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "additionalProperties": false,
                  "properties": {
                    "items": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/WoReference"
                      }
                    },
                    "next_cursor": {
                      "type": [
                        "string",
                        "null"
                      ]
                    }
                  },
                  "required": [
                    "items",
                    "next_cursor"
                  ]
                },
                "example": {
                  "items": [
                    {
                      "id": "00000000-0000-4000-8000-000000000001",
                      "source_ref": "UJI-WO-001",
                      "material_id": "00000000-0000-4000-8000-000000000002",
                      "required_quantity": "10.000000",
                      "uom": "KG",
                      "mode": "UJI"
                    }
                  ],
                  "next_cursor": null
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    },
    "/inbound/history": {
      "get": {
        "operationId": "api_09",
        "summary": "Membaca menelusuri riwayat inbound",
        "x-endpoint-id": "API-09",
        "x-use-cases": [
          "UC-07"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "warehouse_id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "mode",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "ACTUAL",
                "UJI"
              ]
            }
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "cursor",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 25
            }
          },
          {
            "name": "sort",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "source_asc",
                "source_desc"
              ],
              "default": "source_desc"
            }
          },
          {
            "name": "inbound_id",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "additionalProperties": false,
                  "properties": {
                    "items": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/InboundHistoryEvent"
                      }
                    },
                    "next_cursor": {
                      "type": [
                        "string",
                        "null"
                      ]
                    }
                  },
                  "required": [
                    "items",
                    "next_cursor"
                  ]
                },
                "example": {
                  "items": [
                    {
                      "inbound_id": "00000000-0000-4000-8000-000000000001",
                      "event_type": "INITIAL",
                      "promised_date": "2026-11-11",
                      "source_row_id": "00000000-0000-4000-8000-000000000002"
                    }
                  ],
                  "next_cursor": null
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    },
    "/inbound/metrics": {
      "get": {
        "operationId": "api_10",
        "summary": "Membaca melihat metrik supplier",
        "x-endpoint-id": "API-10",
        "x-use-cases": [
          "UC-08"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "warehouse_id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "mode",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "ACTUAL",
                "UJI"
              ]
            }
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "cursor",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 25
            }
          },
          {
            "name": "sort",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "source_asc",
                "source_desc"
              ],
              "default": "source_desc"
            }
          },
          {
            "name": "supplier_id",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "additionalProperties": false,
                  "properties": {
                    "items": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/SupplierMetric"
                      }
                    },
                    "next_cursor": {
                      "type": [
                        "string",
                        "null"
                      ]
                    }
                  },
                  "required": [
                    "items",
                    "next_cursor"
                  ]
                },
                "example": {
                  "items": [
                    {
                      "metric_code": "SOURCE_REQUIRED",
                      "value": null,
                      "eligible_count": 0,
                      "excluded_count": 0,
                      "reason": "NEEDS_BASELINE"
                    }
                  ],
                  "next_cursor": null
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    },
    "/inventory/snapshots": {
      "get": {
        "operationId": "api_11",
        "summary": "Membaca mengimpor data stok",
        "x-endpoint-id": "API-11",
        "x-use-cases": [
          "UC-09"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "warehouse_id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "mode",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "ACTUAL",
                "UJI"
              ]
            }
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "cursor",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 25
            }
          },
          {
            "name": "sort",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "source_asc",
                "source_desc"
              ],
              "default": "source_desc"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "additionalProperties": false,
                  "properties": {
                    "items": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/StockSnapshot"
                      }
                    },
                    "next_cursor": {
                      "type": [
                        "string",
                        "null"
                      ]
                    }
                  },
                  "required": [
                    "items",
                    "next_cursor"
                  ]
                },
                "example": {
                  "items": [
                    {
                      "id": "00000000-0000-4000-8000-000000000001",
                      "cutoff_id": "00000000-0000-4000-8000-000000000002",
                      "mode": "UJI"
                    }
                  ],
                  "next_cursor": null
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    },
    "/inventory/count-sessions": {
      "get": {
        "operationId": "api_12",
        "summary": "Membaca mengimpor hasil hitung fisik",
        "x-endpoint-id": "API-12",
        "x-use-cases": [
          "UC-10"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "warehouse_id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "mode",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "ACTUAL",
                "UJI"
              ]
            }
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "cursor",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 25
            }
          },
          {
            "name": "sort",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "source_asc",
                "source_desc"
              ],
              "default": "source_desc"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "additionalProperties": false,
                  "properties": {
                    "items": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/CountSession"
                      }
                    },
                    "next_cursor": {
                      "type": [
                        "string",
                        "null"
                      ]
                    }
                  },
                  "required": [
                    "items",
                    "next_cursor"
                  ]
                },
                "example": {
                  "items": [
                    {
                      "id": "00000000-0000-4000-8000-000000000001",
                      "cutoff_id": "00000000-0000-4000-8000-000000000002",
                      "mode": "UJI"
                    }
                  ],
                  "next_cursor": null
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    },
    "/inventory/reconciliations": {
      "post": {
        "operationId": "api_13",
        "summary": "Membuat run rekonsiliasi baru",
        "x-endpoint-id": "API-13",
        "x-use-cases": [
          "UC-12"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "Idempotency-Key",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string",
              "minLength": 1
            }
          },
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "PROPOSED untuk mekanisme session cookie; metode penerbitan token mengikuti OD-07."
          }
        ],
        "responses": {
          "201": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RunCreated"
                },
                "example": {
                  "run_id": "00000000-0000-4000-8000-000000000001",
                  "rule_version": "proposed-0.1"
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ReconciliationRequest"
              }
            }
          }
        }
      },
      "get": {
        "operationId": "api_15",
        "summary": "Membaca menelusuri riwayat selisih stok",
        "x-endpoint-id": "API-15",
        "x-use-cases": [
          "UC-13"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "warehouse_id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "mode",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "ACTUAL",
                "UJI"
              ]
            }
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "cursor",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 25
            }
          },
          {
            "name": "sort",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "source_asc",
                "source_desc"
              ],
              "default": "source_desc"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "additionalProperties": false,
                  "properties": {
                    "items": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/RunSummary"
                      }
                    },
                    "next_cursor": {
                      "type": [
                        "string",
                        "null"
                      ]
                    }
                  },
                  "required": [
                    "items",
                    "next_cursor"
                  ]
                },
                "example": {
                  "items": [
                    {
                      "id": "00000000-0000-4000-8000-000000000001",
                      "stock_snapshot_id": "00000000-0000-4000-8000-000000000002",
                      "count_session_id": "00000000-0000-4000-8000-000000000001",
                      "rule_version": "proposed-0.1"
                    }
                  ],
                  "next_cursor": null
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    },
    "/inventory/reconciliations/{run_id}": {
      "get": {
        "operationId": "api_14",
        "summary": "Membaca hasil run immutable",
        "x-endpoint-id": "API-14",
        "x-use-cases": [
          "UC-12",
          "UC-13"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "run_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "cursor",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 25
            }
          },
          {
            "name": "sort",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "source_asc",
                "source_desc"
              ],
              "default": "source_desc"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RunDetail"
                },
                "example": {
                  "run_id": "00000000-0000-4000-8000-000000000001",
                  "stock_snapshot_id": "00000000-0000-4000-8000-000000000001",
                  "count_session_id": "00000000-0000-4000-8000-000000000002",
                  "lines": [
                    {
                      "material_id": "00000000-0000-4000-8000-000000000001",
                      "status": "NOT_COUNTED",
                      "variance": null
                    }
                  ],
                  "next_cursor": null
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    },
    "/inventory/metrics": {
      "get": {
        "operationId": "api_16",
        "summary": "Membaca melihat metrik persediaan",
        "x-endpoint-id": "API-16",
        "x-use-cases": [
          "UC-14"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "warehouse_id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "mode",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "ACTUAL",
                "UJI"
              ]
            }
          },
          {
            "name": "cursor",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 25
            }
          },
          {
            "name": "sort",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "source_asc",
                "source_desc"
              ],
              "default": "source_desc"
            }
          },
          {
            "name": "run_id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "additionalProperties": false,
                  "properties": {
                    "items": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/InventoryMetric"
                      }
                    },
                    "next_cursor": {
                      "type": [
                        "string",
                        "null"
                      ]
                    }
                  },
                  "required": [
                    "items",
                    "next_cursor"
                  ]
                },
                "example": {
                  "items": [
                    {
                      "metric_code": "MATCH_RATE_PROPOSED",
                      "value": null,
                      "numerator": 0,
                      "denominator": 0,
                      "excluded_count": 1,
                      "reason": "NO_ELIGIBLE_DATA"
                    }
                  ],
                  "next_cursor": null
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    },
    "/evidence": {
      "post": {
        "operationId": "api_17",
        "summary": "Mengarsipkan evidence privat",
        "x-endpoint-id": "API-17",
        "x-use-cases": [
          "UC-11"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "Idempotency-Key",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string",
              "minLength": 1
            }
          },
          {
            "name": "X-CSRF-Token",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "PROPOSED untuk mekanisme session cookie; metode penerbitan token mengikuti OD-07."
          }
        ],
        "responses": {
          "201": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/EvidenceMetadata"
                },
                "example": {
                  "evidence_id": "00000000-0000-4000-8000-000000000001",
                  "file_name": "UJI-bukti.png",
                  "size_bytes": 1024,
                  "media_type": "image/png"
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        },
        "requestBody": {
          "required": true,
          "content": {
            "multipart/form-data": {
              "schema": {
                "$ref": "#/components/schemas/EvidenceRequest"
              }
            }
          }
        }
      }
    },
    "/evidence/{evidence_id}": {
      "get": {
        "operationId": "api_18",
        "summary": "Membaca metadata aman evidence",
        "x-endpoint-id": "API-18",
        "x-use-cases": [
          "UC-11"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "evidence_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/EvidenceMetadata"
                },
                "example": {
                  "evidence_id": "00000000-0000-4000-8000-000000000001",
                  "stock_line_id": "00000000-0000-4000-8000-000000000002",
                  "file_name": "UJI-bukti.png",
                  "size_bytes": 1024,
                  "media_type": "image/png"
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    },
    "/evidence/{evidence_id}/content": {
      "get": {
        "operationId": "api_19",
        "summary": "Membaca file melalui stream privat terotorisasi",
        "x-endpoint-id": "API-19",
        "x-use-cases": [
          "UC-11"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "evidence_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/octet-stream": {
                "schema": {
                  "type": "string",
                  "format": "binary"
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    },
    "/audit": {
      "get": {
        "operationId": "api_20",
        "summary": "Membaca menelusuri audit proses",
        "x-endpoint-id": "API-20",
        "x-use-cases": [
          "UC-15"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "warehouse_id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "mode",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "ACTUAL",
                "UJI"
              ]
            }
          },
          {
            "name": "from",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "to",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "format": "date-time"
            }
          },
          {
            "name": "cursor",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 25
            }
          },
          {
            "name": "sort",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "source_asc",
                "source_desc"
              ],
              "default": "source_desc"
            }
          },
          {
            "name": "action",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "outcome",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "additionalProperties": false,
                  "properties": {
                    "items": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/AuditEvent"
                      }
                    },
                    "next_cursor": {
                      "type": [
                        "string",
                        "null"
                      ]
                    }
                  },
                  "required": [
                    "items",
                    "next_cursor"
                  ]
                },
                "example": {
                  "items": [
                    {
                      "id": "00000000-0000-4000-8000-000000000001",
                      "action": "import.commit",
                      "outcome": "SUCCESS",
                      "mode": "UJI",
                      "correlation_id": "00000000-0000-4000-8000-000000000002"
                    }
                  ],
                  "next_cursor": null
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    },
    "/references": {
      "get": {
        "operationId": "api_21",
        "summary": "Lookup referensi yang telah tersedia; bukan CRUD master",
        "x-endpoint-id": "API-21",
        "x-use-cases": [
          "UC-01",
          "UC-02",
          "UC-03",
          "UC-06",
          "UC-08",
          "UC-09",
          "UC-10",
          "UC-11",
          "UC-12",
          "UC-14",
          "UC-15"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "warehouse_id",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "mode",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "ACTUAL",
                "UJI"
              ]
            }
          },
          {
            "name": "cursor",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 25
            }
          },
          {
            "name": "sort",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "source_asc",
                "source_desc"
              ],
              "default": "source_desc"
            }
          },
          {
            "name": "type",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": [
                "material",
                "supplier",
                "warehouse",
                "cutoff"
              ]
            }
          },
          {
            "name": "q",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "additionalProperties": false,
                  "properties": {
                    "items": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/ReferenceItem"
                      }
                    },
                    "next_cursor": {
                      "type": [
                        "string",
                        "null"
                      ]
                    }
                  },
                  "required": [
                    "items",
                    "next_cursor"
                  ]
                },
                "example": {
                  "items": [
                    {
                      "id": "00000000-0000-4000-8000-000000000001",
                      "code": "UJI-MAT-01",
                      "name": "Material simulasi"
                    }
                  ],
                  "next_cursor": null
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    },
    "/inventory/snapshots/{snapshot_id}/lines": {
      "get": {
        "operationId": "api_22",
        "summary": "Membaca saldo dan memilih target evidence",
        "x-endpoint-id": "API-22",
        "x-use-cases": [
          "UC-09",
          "UC-11",
          "UC-12"
        ],
        "x-status": "PROPOSED / NOT IMPLEMENTED",
        "parameters": [
          {
            "name": "snapshot_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          },
          {
            "name": "cursor",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "required": false,
            "schema": {
              "type": "integer",
              "minimum": 1,
              "maximum": 100,
              "default": 25
            }
          },
          {
            "name": "sort",
            "in": "query",
            "required": false,
            "schema": {
              "type": "string",
              "enum": [
                "source_asc",
                "source_desc"
              ],
              "default": "source_desc"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Hasil sukses yang diharapkan; bukan hasil eksekusi",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "additionalProperties": false,
                  "properties": {
                    "items": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/StockLine"
                      }
                    },
                    "next_cursor": {
                      "type": [
                        "string",
                        "null"
                      ]
                    }
                  },
                  "required": [
                    "items",
                    "next_cursor"
                  ]
                },
                "example": {
                  "items": [
                    {
                      "id": "00000000-0000-4000-8000-000000000001",
                      "material_id": "00000000-0000-4000-8000-000000000002",
                      "uom": "KG",
                      "system_quantity": "10.000000"
                    }
                  ],
                  "next_cursor": null
                }
              }
            }
          },
          "default": {
            "description": "Error aman; status HTTP menurut katalog DOC-08/DOC-09",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ApiError"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "proposedSession": {
        "type": "apiKey",
        "in": "cookie",
        "name": "siris_session",
        "description": "PROPOSED; OD-07 belum diputuskan"
      }
    },
    "schemas": {
      "ApiError": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "error": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "code": {
                "type": "string"
              },
              "message": {
                "type": "string"
              },
              "correlation_id": {
                "type": "string",
                "format": "uuid"
              },
              "details": {
                "type": "array",
                "items": {
                  "type": "object",
                  "additionalProperties": false,
                  "properties": {
                    "field": {
                      "type": "string"
                    },
                    "code": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "field",
                    "code"
                  ]
                }
              }
            },
            "required": [
              "code",
              "message",
              "correlation_id"
            ]
          }
        },
        "required": [
          "error"
        ]
      },
      "ValidationIssue": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "code": {
            "type": "string"
          },
          "severity": {
            "type": "string",
            "enum": [
              "ERROR",
              "WARNING"
            ]
          },
          "row_number": {
            "type": [
              "integer",
              "null"
            ],
            "minimum": 0
          },
          "field_name": {
            "type": [
              "string",
              "null"
            ]
          },
          "message": {
            "type": "string"
          }
        },
        "required": [
          "code",
          "severity",
          "row_number",
          "field_name",
          "message"
        ]
      },
      "ImportMetadata": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "kind": {
            "type": "string",
            "enum": [
              "EXPECTED",
              "COMMITMENT",
              "RECEIVING",
              "STOCK",
              "COUNT"
            ]
          },
          "warehouse_id": {
            "type": "string",
            "format": "uuid"
          },
          "mode": {
            "type": "string",
            "enum": [
              "ACTUAL",
              "UJI"
            ]
          },
          "source_name": {
            "type": "string"
          },
          "source_reference": {
            "type": "string"
          },
          "contract_version": {
            "type": "string"
          },
          "cutoff_id": {
            "type": "string",
            "format": "uuid"
          },
          "source_timezone": {
            "type": "string"
          }
        },
        "required": [
          "kind",
          "warehouse_id",
          "mode",
          "source_name",
          "source_reference",
          "contract_version"
        ]
      },
      "ImportUpload": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "metadata": {
            "$ref": "#/components/schemas/ImportMetadata"
          },
          "file": {
            "type": "string",
            "format": "binary"
          },
          "balance_file": {
            "type": "string",
            "format": "binary"
          },
          "support_files": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "binary"
            }
          }
        },
        "required": [
          "metadata"
        ]
      },
      "BatchCreated": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "batch_id": {
            "type": "string",
            "format": "uuid"
          },
          "state": {
            "const": "STAGED"
          }
        },
        "required": [
          "batch_id",
          "state"
        ]
      },
      "ValidationResult": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "batch_id": {
            "type": "string",
            "format": "uuid"
          },
          "state": {
            "type": "string",
            "enum": [
              "INVALID",
              "PREVIEW_READY"
            ]
          },
          "error_count": {
            "type": "integer",
            "minimum": 0
          },
          "warning_count": {
            "type": "integer",
            "minimum": 0
          },
          "issues": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ValidationIssue"
            }
          }
        },
        "required": [
          "batch_id",
          "state",
          "error_count",
          "warning_count",
          "issues"
        ]
      },
      "PreviewRow": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "row_number": {
            "type": "integer",
            "minimum": 0
          },
          "component": {
            "type": "string"
          },
          "normalized": {
            "anyOf": [
              {
                "$ref": "#/components/schemas/NormalizedEXPECTED"
              },
              {
                "$ref": "#/components/schemas/NormalizedCOMMITMENT"
              },
              {
                "$ref": "#/components/schemas/NormalizedRECEIVING"
              },
              {
                "$ref": "#/components/schemas/NormalizedSTOCK"
              },
              {
                "$ref": "#/components/schemas/NormalizedCOUNT"
              }
            ]
          }
        },
        "required": [
          "row_number",
          "component",
          "normalized"
        ]
      },
      "Preview": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "batch_id": {
            "type": "string",
            "format": "uuid"
          },
          "mode": {
            "type": "string",
            "enum": [
              "ACTUAL",
              "UJI"
            ]
          },
          "warehouse_id": {
            "type": "string",
            "format": "uuid"
          },
          "kind": {
            "type": "string",
            "enum": [
              "EXPECTED",
              "COMMITMENT",
              "RECEIVING",
              "STOCK",
              "COUNT"
            ]
          },
          "state": {
            "const": "PREVIEW_READY"
          },
          "fingerprint": {
            "type": "string"
          },
          "validator_version": {
            "type": "string"
          },
          "validated_at": {
            "type": "string",
            "format": "date-time"
          },
          "expires_at": {
            "type": "string",
            "format": "date-time"
          },
          "row_count": {
            "type": "integer",
            "minimum": 0
          },
          "error_count": {
            "type": "integer",
            "minimum": 0
          },
          "warning_count": {
            "type": "integer",
            "minimum": 0
          },
          "rows": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/PreviewRow"
            }
          },
          "issues": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ValidationIssue"
            }
          }
        },
        "required": [
          "batch_id",
          "mode",
          "warehouse_id",
          "kind",
          "state",
          "fingerprint",
          "validator_version",
          "validated_at",
          "expires_at",
          "row_count",
          "error_count",
          "warning_count",
          "rows",
          "issues"
        ]
      },
      "CommitRequest": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "preview_fingerprint": {
            "type": "string"
          },
          "acknowledged_warnings": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": [
          "preview_fingerprint",
          "acknowledged_warnings"
        ]
      },
      "CommitResult": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "batch_id": {
            "type": "string",
            "format": "uuid"
          },
          "state": {
            "const": "COMMITTED"
          },
          "committed_count": {
            "type": "integer",
            "minimum": 0
          }
        },
        "required": [
          "batch_id",
          "state",
          "committed_count"
        ]
      },
      "Cancellation": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "reason": {
            "type": "string"
          }
        },
        "required": [
          "reason"
        ]
      },
      "CancellationResult": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "batch_id": {
            "type": "string",
            "format": "uuid"
          },
          "state": {
            "const": "CANCELLED"
          }
        },
        "required": [
          "batch_id",
          "state"
        ]
      },
      "InboundException": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "inbound_id": {
            "type": "string",
            "format": "uuid"
          },
          "is_final": {
            "type": "boolean"
          },
          "final_exceptions": {
            "type": "array",
            "items": {
              "type": "string",
              "enum": [
                "delivery delay",
                "quantity mismatch"
              ]
            }
          },
          "open_overdue": {
            "type": "boolean"
          }
        },
        "required": [
          "inbound_id",
          "is_final",
          "final_exceptions",
          "open_overdue"
        ]
      },
      "Notice": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "inbound_id": {
            "type": "string",
            "format": "uuid"
          },
          "message": {
            "type": "string"
          },
          "mode": {
            "type": "string",
            "enum": [
              "ACTUAL",
              "UJI"
            ]
          }
        },
        "required": [
          "inbound_id",
          "message",
          "mode"
        ]
      },
      "WoReference": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "source_ref": {
            "type": "string"
          },
          "material_id": {
            "type": "string",
            "format": "uuid"
          },
          "required_quantity": {
            "type": "string",
            "pattern": "^-?\\d+(\\.\\d{1,6})?$"
          },
          "uom": {
            "type": "string"
          },
          "mode": {
            "type": "string",
            "enum": [
              "ACTUAL",
              "UJI"
            ]
          }
        },
        "required": [
          "id",
          "source_ref",
          "material_id",
          "required_quantity",
          "uom",
          "mode"
        ]
      },
      "InboundHistoryEvent": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "inbound_id": {
            "type": "string",
            "format": "uuid"
          },
          "event_type": {
            "type": "string",
            "enum": [
              "INITIAL",
              "CHANGE",
              "RECEIVING"
            ]
          },
          "promised_date": {
            "type": "string",
            "format": "date"
          },
          "received_quantity": {
            "type": "string",
            "pattern": "^-?\\d+(\\.\\d{1,6})?$"
          },
          "received_at": {
            "type": "string",
            "format": "date-time"
          },
          "is_closing": {
            "type": "boolean"
          },
          "source_row_id": {
            "type": "string",
            "format": "uuid"
          }
        },
        "required": [
          "inbound_id",
          "event_type",
          "source_row_id"
        ]
      },
      "SupplierMetric": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "metric_code": {
            "type": "string"
          },
          "value": {
            "type": [
              "number",
              "null"
            ]
          },
          "eligible_count": {
            "type": "integer",
            "minimum": 0
          },
          "excluded_count": {
            "type": "integer",
            "minimum": 0
          },
          "numerator": {
            "type": "integer",
            "minimum": 0
          },
          "denominator": {
            "type": "integer",
            "minimum": 0
          },
          "reason": {
            "type": [
              "string",
              "null"
            ]
          }
        },
        "required": [
          "metric_code",
          "value",
          "eligible_count",
          "excluded_count",
          "reason"
        ]
      },
      "StockSnapshot": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "cutoff_id": {
            "type": "string",
            "format": "uuid"
          },
          "mode": {
            "type": "string",
            "enum": [
              "ACTUAL",
              "UJI"
            ]
          }
        },
        "required": [
          "id",
          "cutoff_id",
          "mode"
        ]
      },
      "CountSession": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "cutoff_id": {
            "type": "string",
            "format": "uuid"
          },
          "mode": {
            "type": "string",
            "enum": [
              "ACTUAL",
              "UJI"
            ]
          }
        },
        "required": [
          "id",
          "cutoff_id",
          "mode"
        ]
      },
      "ReconciliationRequest": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "stock_snapshot_id": {
            "type": "string",
            "format": "uuid"
          },
          "count_session_id": {
            "type": "string",
            "format": "uuid"
          }
        },
        "required": [
          "stock_snapshot_id",
          "count_session_id"
        ]
      },
      "RunCreated": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "run_id": {
            "type": "string",
            "format": "uuid"
          },
          "rule_version": {
            "type": "string"
          }
        },
        "required": [
          "run_id",
          "rule_version"
        ]
      },
      "ReconciliationLine": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "material_id": {
            "type": "string",
            "format": "uuid"
          },
          "status": {
            "type": "string",
            "enum": [
              "MATCHED",
              "DISCREPANCY",
              "COUNT_MISSING",
              "NOT_COUNTED",
              "STOCK_MISSING",
              "UOM_MISMATCH"
            ]
          },
          "variance": {
            "type": [
              "string",
              "null"
            ],
            "pattern": "^-?\\d+(\\.\\d{1,6})?$"
          },
          "stock_line_id": {
            "type": [
              "string",
              "null"
            ],
            "format": "uuid"
          },
          "count_line_id": {
            "type": [
              "string",
              "null"
            ],
            "format": "uuid"
          },
          "system_quantity": {
            "type": [
              "string",
              "null"
            ],
            "pattern": "^-?\\d+(\\.\\d{1,6})?$"
          },
          "physical_quantity": {
            "type": [
              "string",
              "null"
            ],
            "pattern": "^-?\\d+(\\.\\d{1,6})?$"
          },
          "stock_uom": {
            "type": [
              "string",
              "null"
            ]
          },
          "count_uom": {
            "type": [
              "string",
              "null"
            ]
          }
        },
        "required": [
          "material_id",
          "status",
          "variance"
        ]
      },
      "RunDetail": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "run_id": {
            "type": "string",
            "format": "uuid"
          },
          "stock_snapshot_id": {
            "type": "string",
            "format": "uuid"
          },
          "count_session_id": {
            "type": "string",
            "format": "uuid"
          },
          "lines": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/ReconciliationLine"
            }
          },
          "next_cursor": {
            "type": [
              "string",
              "null"
            ]
          }
        },
        "required": [
          "run_id",
          "stock_snapshot_id",
          "count_session_id",
          "lines",
          "next_cursor"
        ]
      },
      "RunSummary": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "stock_snapshot_id": {
            "type": "string",
            "format": "uuid"
          },
          "count_session_id": {
            "type": "string",
            "format": "uuid"
          },
          "rule_version": {
            "type": "string"
          }
        },
        "required": [
          "id",
          "stock_snapshot_id",
          "count_session_id",
          "rule_version"
        ]
      },
      "InventoryMetric": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "metric_code": {
            "type": "string"
          },
          "value": {
            "type": [
              "number",
              "null"
            ]
          },
          "numerator": {
            "type": "integer",
            "minimum": 0
          },
          "denominator": {
            "type": "integer",
            "minimum": 0
          },
          "excluded_count": {
            "type": "integer",
            "minimum": 0
          },
          "reason": {
            "type": [
              "string",
              "null"
            ]
          }
        },
        "required": [
          "metric_code",
          "value",
          "numerator",
          "denominator",
          "excluded_count",
          "reason"
        ]
      },
      "EvidenceRequest": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "stock_line_id": {
            "type": "string",
            "format": "uuid"
          },
          "file": {
            "type": "string",
            "format": "binary"
          }
        },
        "required": [
          "stock_line_id",
          "file"
        ]
      },
      "EvidenceMetadata": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "evidence_id": {
            "type": "string",
            "format": "uuid"
          },
          "stock_line_id": {
            "type": "string",
            "format": "uuid"
          },
          "file_name": {
            "type": "string"
          },
          "size_bytes": {
            "type": "integer",
            "minimum": 1,
            "maximum": 5242880
          },
          "media_type": {
            "type": "string",
            "enum": [
              "application/pdf",
              "image/jpeg",
              "image/png"
            ]
          }
        },
        "required": [
          "evidence_id",
          "file_name",
          "size_bytes",
          "media_type"
        ]
      },
      "AuditEvent": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "action": {
            "type": "string"
          },
          "outcome": {
            "type": "string",
            "enum": [
              "SUCCESS",
              "FAILURE",
              "CANCELLED",
              "DENIED"
            ]
          },
          "mode": {
            "type": [
              "string",
              "null"
            ],
            "enum": [
              "ACTUAL",
              "UJI",
              null
            ]
          },
          "correlation_id": {
            "type": "string",
            "format": "uuid"
          },
          "created_at": {
            "type": "string",
            "format": "date-time"
          }
        },
        "required": [
          "id",
          "action",
          "outcome",
          "mode",
          "correlation_id"
        ]
      },
      "ReferenceItem": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "code": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "cutoff_at": {
            "type": "string",
            "format": "date-time"
          },
          "verification_status": {
            "type": "string",
            "enum": [
              "VERIFIED",
              "UNVERIFIED"
            ]
          }
        },
        "required": [
          "id"
        ]
      },
      "StockLine": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "material_id": {
            "type": "string",
            "format": "uuid"
          },
          "uom": {
            "type": "string"
          },
          "system_quantity": {
            "type": "string",
            "pattern": "^-?\\d+(\\.\\d{1,6})?$"
          }
        },
        "required": [
          "id",
          "material_id",
          "uom",
          "system_quantity"
        ]
      },
      "NormalizedEXPECTED": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "source_ref": {
            "type": "string",
            "description": "Kunci line sumber unik dalam gudang/mode"
          },
          "material_code": {
            "type": "string",
            "description": "Referensi material harus ada pada mode sama"
          },
          "supplier_code": {
            "type": "string",
            "description": "Referensi supplier harus tersedia; tidak membuat master otomatis"
          },
          "uom": {
            "type": "string",
            "description": "Kode canonical dari mapping yang disetujui"
          },
          "requested_date": {
            "type": "string",
            "format": "date",
            "description": "ISO 8601 YYYY-MM-DD; immutable setelah commit"
          },
          "expected_quantity": {
            "type": "string",
            "pattern": "^-?\\d+(\\.\\d{1,6})?$",
            "description": "Nonnegatif; presisi usulan numeric(20,6)"
          }
        },
        "required": [
          "source_ref",
          "material_code",
          "supplier_code",
          "uom",
          "requested_date",
          "expected_quantity"
        ]
      },
      "NormalizedCOMMITMENT": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "inbound_source_ref": {
            "type": "string",
            "description": "Referensi EXPECTED committed dan scope cocok"
          },
          "event_ref": {
            "type": "string",
            "description": "Unik per inbound"
          },
          "event_type": {
            "type": "string",
            "enum": [
              "INITIAL",
              "CHANGE"
            ],
            "description": "INITIAL atau CHANGE; CHANGE harus memiliki INITIAL"
          },
          "promised_date": {
            "type": "string",
            "format": "date",
            "description": "YYYY-MM-DD; tidak menulis requested_date"
          },
          "event_at": {
            "type": "string",
            "format": "date-time",
            "description": "Waktu sumber; konflik urutan ditolak"
          }
        },
        "required": [
          "inbound_source_ref",
          "event_ref",
          "event_type",
          "promised_date",
          "event_at"
        ]
      },
      "NormalizedRECEIVING": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "inbound_source_ref": {
            "type": "string",
            "description": "Referensi EXPECTED committed"
          },
          "event_ref": {
            "type": "string",
            "description": "Unik per inbound"
          },
          "received_quantity": {
            "type": "string",
            "pattern": "^-?\\d+(\\.\\d{1,6})?$",
            "description": "Nonnegatif; koreksi belum disepakati"
          },
          "uom": {
            "type": "string",
            "description": "Sama dengan referensi inbound; tidak dikonversi otomatis"
          },
          "received_at": {
            "type": "string",
            "format": "date-time",
            "description": "ISO 8601 ber-offset"
          },
          "is_closing": {
            "type": "boolean",
            "description": "Tidak diturunkan dari jumlah kumulatif"
          },
          "closing_reference": {
            "type": [
              "string",
              "null"
            ],
            "description": "Wajib saat is_closing=true; bukti sah OD-06"
          }
        },
        "required": [
          "inbound_source_ref",
          "event_ref",
          "received_quantity",
          "uom",
          "received_at",
          "is_closing"
        ]
      },
      "NormalizedSTOCK": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "material_code": {
            "type": "string",
            "description": "Referensi sah"
          },
          "uom": {
            "type": "string",
            "description": "Kode canonical"
          },
          "system_quantity": {
            "type": "string",
            "pattern": "^-?\\d+(\\.\\d{1,6})?$",
            "description": "Wajib berasal QTY AKHIR; tidak menjumlah movement"
          }
        },
        "required": [
          "material_code",
          "uom",
          "system_quantity"
        ]
      },
      "NormalizedCOUNT": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "material_code": {
            "type": "string",
            "description": "Referensi sah"
          },
          "uom": {
            "type": "string",
            "description": "Kode canonical"
          },
          "is_counted": {
            "type": "boolean",
            "description": "Eksplisit; tidak diturunkan dari blank/zero"
          },
          "physical_quantity": {
            "type": [
              "string",
              "null"
            ],
            "pattern": "^-?\\d+(\\.\\d{1,6})?$",
            "description": "Wajib nonnull >=0 jika true; wajib null jika false"
          }
        },
        "required": [
          "material_code",
          "uom",
          "is_counted"
        ]
      }
    }
  }
}
```

## Status HTTP dan kontrol transaksi

200 read/commit/replay; 201 staging/run/evidence baru; 400 parameter sintaks salah; 401 sesi tidak valid; 403 izin ditolak; 404 objek tidak ditemukan/tersembunyi; 409 konflik; 410 expiry; 413 evidence terlalu besar; 415 media salah; 422 validasi bisnis; 500 gagal transaksi; 503 dependensi tidak tersedia. API-04/API-13/API-17 memakai Idempotency-Key. API-13 key baru yang disengaja membuat run baru immutable; key sama mengembalikan run sebelumnya. API-17 retry mengacu hash file dan target yang sama. File content hanya mengalir setelah otorisasi; Content-Disposition attachment dan nosniff direkomendasikan. Tidak ada endpoint tulis WO, stock adjustment, PO, supplier portal atau writeback.

## Keputusan domain yang ditahan setelah SRC-09 tersedia

**CF-03–CF-06 dan CF-08 — OPEN DECISION.** Schema, payload dan test yang terdampak berikut masih PROPOSED dan tidak boleh diimplementasikan sebagai kontrak final sebelum sumber dianalisis.

| Area | Usulan dalam paket | SRC-09 | Tindakan sebelum implementasi |
| --- | --- | --- | --- |
| Evidence target | stock_line_id | snapshot ATAU count | Pilih scope final; bila source disahkan, ganti dengan stock_snapshot_id/count_session_id nullable dan XOR tepat satu, FK/scope wajib; perbarui API dan fixture |
| Cutoff | cutoff_at timestamptz; VERIFIED/UNVERIFIED | effective date/time, basis, precision; UJI SIMULATED | Sediakan date-only tanpa memalsukan waktu, basis reference dan status simulasi; perubahan schema/API melalui review |
| Rekonsiliasi identik | Idempotency-Key sama mengembalikan run sama; key baru dapat run baru | Fingerprint hasil identik dibaca ulang | Tentukan fingerprint snapshot/count/rule version dan kebijakan reuse lintas key; jangan duplikasi sebelum keputusan |
| EXPECTED quantity | >=0 | >0 | Konfirmasi apakah nol valid; perbarui validator dan boundary test |
| COMMITMENT | INITIAL/CHANGE + event_at | Sequence, previous date, committed date, recorded_at | Tambahkan pemetaan sumber jika disahkan; jangan sintesis event lama dari informasi yang hilang |
| WO di STOCK | stock_support_rows menyimpan payload; sumber wo_references belum ditetapkan | STOCK mendukung komponen WO opsional | Usulan pemetaan WO support ke wo_references dengan source_row lineage; bukan impor keenam |


## Pemetaan presentation state dan gap DTO ke SRC-09

| Sumber UI | Domain/API usulan | Penanganan |
| --- | --- | --- |
| VALID / PREVIEW | PREVIEW_READY dengan tahapan UI berbeda | VALID: laporan validasi tersedia; PREVIEW: pengguna membuka preview; server tidak commit hanya karena berpindah tahap |
| STALE | PREVIEW_CHANGED 409 | Validasi ulang; bukan status final baru |
| FAILED pada UI/audit | FAILURE atau DENIED pada backend | Tampilkan label gagal; pertahankan outcome asli untuk audit; mapping final NEEDS REVIEW |
| Scope cutoff basis/precision/status SIMULATED | Belum ada DTO lengkap | CF-04; blok integrasi cutoff, bukan isi timestamp palsu |
| Metric numerator/denominator/exclusion/source refs untuk 10 definisi | Schema metrik minimal tersedia | Tambah DTO per formula/group/grain setelah OD-06; metric_code SOURCE_REQUIRED pada contoh adalah placeholder, bukan fitur final |
| Sequence/previous date, imported_at; evidence uploaded_at; actor alias; total hasil/filter/sort kolom | Sebagian belum disediakan DTO minimal | CF-08; field sumber tidak dianggap sudah terintegrasi; service/query harus dirancang sebelum acceptance layar |


## Dependencies

| Dependensi | Kegunaan |
| --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | Indeks Induk Dokumentasi Pengembangan |
| [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md) | Dokumen Kebutuhan Produk |
| [DOC-05](05_BUSINESS_RULES_RBAC.md) | Spesifikasi Aturan Bisnis dan RBAC |
| [DOC-06](06_SOFTWARE_ARCHITECTURE_DESIGN.md) | Arsitektur Perangkat Lunak dan Desain Terperinci |
| [DOC-07](07_DATABASE_DESIGN.md) | Desain Database, ERD, IRD, dan Kamus Data |
| [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md) | Kontrak Data, Pemetaan Impor, dan Validasi |
| [DOC-10](10_UI_UX_PROTOTYPE_SPECIFICATION.md) | Spesifikasi Prototipe UI/UX |
| [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md) | Rencana dan Spesifikasi Kasus Pengujian |

## Open issues

Rincian baseline final belum tersedia; lihat register sumber dan keputusan terbuka pada DOC-00.

## Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1.0 | 2026-11-10 | Penyusunan berdasarkan SRC-01; celah sumber dicatat dan desain ditandai PROPOSED. | Belum ada bukti persetujuan |
| 0.2.0 | 2026-11-10 | Integrasi SRC-09 design.md: route, role, token, layar pendukung, metrik dan konflik desain; tetap NEEDS REVIEW. | Belum ada bukti persetujuan |
