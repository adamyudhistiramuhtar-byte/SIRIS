# Kontrak Schema 012 dan Service Commit/Cancel — SRS-52

| Atribut | Nilai |
| --- | --- |
| Issue | [SRS-52](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-52) (T-18), parent SRS-6 / EPIC-03 |
| UC terkait | UC-01, UC-02, UC-03, UC-09, UC-10 |
| FR/NFR terkait | SOURCE REQUIRED (mengikuti deskripsi SRS-52); tidak ada ID FR/NFR baru |
| Status dokumen | **PROPOSED — Fase A.** Dokumen ini adalah rancangan, **bukan** file migrasi dan bukan keputusan final. Nomor 012 adalah reservasi nomor/modul dari Adam (komentar Jira SRS-38 nomor 10153 butir 5), bukan schema final. Butir bertanda **MENUNGGU ADAM** merujuk pertanyaan pada komentar Jira SRS-52 nomor 10198 |
| Tanggal | 25 November 2026, Asia/Jakarta |
| Baseline repo | `origin/develop` @ `0ff9e4a` (migrasi 001–003; belum memuat 004–008, audit #22, staging #27, preview SRS-51) |
| Pemilik | Backend & Database (Dwi Rani Amelia); reviewer nonpenulis Adam dan Luthfi (deskripsi SRS-52) |

## 1. Sumber

| Sumber | Versi / lokasi | Bagian yang dipakai |
| --- | --- | --- |
| [DOC-07](07_DATABASE_DESIGN.md) | 0.2.0 | Tabel `idempotency_records` (§15); aturan commit atomik dan audit FAILURE terpisah |
| [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md) | 0.2.0 | State machine impor PROPOSED; katalog error (`IDEMPOTENCY_CONFLICT`, `PREVIEW_EXPIRED`, `PREVIEW_CHANGED`, `FORBIDDEN`, `TRANSACTION_FAILED`) |
| [DOC-09](09_API_SPECIFICATION.md) | 0.2.0 | API-04 commit (Idempotency-Key wajib), API-05 cancellation (tanpa Idempotency-Key) |
| `database/migrations/001_initial_schema.sql` | `0ff9e4a` | `import_batches` (status, `preview_fingerprint`, `preview_expires_at`), `idempotency_records` |
| `KONTRAK_LINTAS_MODUL_SRS-58.md` (PR #20) | `3099525`, Draft, belum merged | API-04/05: urutan transaksi, replay, unknown outcome, status 409/410 |
| `KEPUTUSAN_HANDOFF_ADAM_2026-11-23.md` (PR #28) | `c68893a`, belum merged | C58-03 (OPEN), C58-04 (PROPOSED), C58-05 (PROPOSED) |
| Komentar Jira SRS-52 nomor 10159 (Adam) | 25 Nov 2026 | 012 untuk idempotency commit/cancel; isi fingerprint; tes wajib |
| Komentar Jira SRS-52 nomor 10198 (Dwi) | 25 Nov 2026 | Tujuh pertanyaan keputusan untuk Adam |
| Komentar Jira SRS-38 nomor 10197 (Dwi) | 25 Nov 2026 | Temuan guard transaksi `readOwnedStaging` |

## 2. Kondisi saat ini

`idempotency_records` sudah dibuat oleh migrasi 001, tetapi berbeda dari rancangan DOC-07 §15:

| Aspek | DOC-07 §15 | Migrasi 001 (`0ff9e4a`) |
| --- | --- | --- |
| Nama kolom operasi | `operation` | `action_type` |
| `actor_id` | NOT NULL, FK users | Nullable, FK users |
| `request_hash` | Wajib ("payload canonical + scope") | **Tidak ada** |
| State | `state` IN_PROGRESS/SUCCEEDED | `status` VARCHAR(32) NOT NULL tanpa CHECK |
| Respons | `response_safe` jsonb | `response_payload` jsonb |
| Referensi hasil | `result_id` uuid | Tidak ada |
| Expiry | Tidak ada | `expires_at` NOT NULL |
| Unique | (`actor_id`, `operation`, `idempotency_key`) | `idempotency_key` **global** |

Akibat unique global, dua aktor berbeda tidak dapat memakai key yang sama, dan tanpa `request_hash` konflik "key sama, body berbeda" tidak dapat dideteksi di database. Migrasi 001 tidak boleh disunting (komentar Jira SRS-38 nomor 10153 butir 5), sehingga koreksi memerlukan migrasi maju 012.

`import_batches.status` pada 001 memiliki domain STAGED/VALIDATED/COMMITTED/CANCELLED, berbeda dari state machine DOC-08 (VALIDATING, INVALID, PREVIEW_READY, EXPIRED). Daftar state final adalah C58-03 (OPEN).

## 3. Usulan bentuk 012 — MENUNGGU ADAM (butir 5)

| Opsi | Uraian | Kelebihan | Kekurangan |
| --- | --- | --- | --- |
| **A (usulan)** | Ubah `idempotency_records` dari 001 dengan migrasi maju yang memeriksa bentuk schema dahulu (pola 006/007) | Satu tabel sesuai nama DOC-07; tidak ada tabel ganda | Perlu menangani data lama; nama kolom 001 (`action_type`, `status`, `response_payload`) berbeda dari DOC-07 |
| B | Tabel baru khusus impor; tabel 001 dibiarkan | Tidak menyentuh data lama | Dua tabel untuk konsep yang sama; tabel 001 menjadi yatim |

Rincian opsi A (usulan, belum final):

| Unsur | Usulan | Catatan |
| --- | --- | --- |
| Pemeriksaan awal | Tolak bila bentuk tabel tidak dikenal; tolak atomik bila ada baris tanpa `actor_id` atau tanpa sumber `request_hash` | Mengikuti pola 008; tidak mengarang hash untuk baris lama |
| Unique | Lepas UNIQUE global `idempotency_key`; tambah UNIQUE (`actor_id`, `action_type`, `idempotency_key`) | Sesuai DOC-07 §15 |
| `actor_id` | NOT NULL | Sesuai DOC-07 §15 |
| `request_hash` | Kolom baru, NOT NULL, CHECK 64 karakter hex huruf kecil | Komposisi pada §4 |
| `action_type` | CHECK `IN ('import.commit')`; `import.cancel` hanya bila butir 4 menetapkan cancel memakai idempotency | Nama `operation` DOC-07 vs `action_type` 001: dipertahankan nama 001 kecuali Adam memutuskan lain |
| `batch_id` | Kolom baru, FK `import_batches(id)` `ON DELETE RESTRICT` | Menggantikan `result_id` polimorfik untuk operasi impor |
| `status` | CHECK `IN ('SUCCEEDED')` | Lihat §4 "Siklus record"; DOC-07 juga menyebut IN_PROGRESS |
| `response_payload` | Hanya `{batch_id, state, committed_count}`; tanpa raw, key, atau pesan error | Sesuai larangan DOC-07 "tanpa raw key/secret" |
| `expires_at` | Tetap NOT NULL dari 001; nilai = waktu commit + retensi | Lama retensi **MENUNGGU ADAM** (butir 3) |

## 4. request_hash dan siklus record

**Komposisi `request_hash` (diimplementasikan di `apps/api/src/modules/import-commit/request-hash.ts`).** SHA-256 hex atas JSON kanonik (key objek diurutkan, tanpa spasi) berisi:

- `version` = `SRS-52/request-hash/proposed-0.1`;
- `operation` = `import.commit`;
- `actor_id`, `batch_id`;
- `scope` = `{warehouse_id, mode}` dari batch yang sudah dikunci;
- `preview_fingerprint` dari body request;
- `acknowledged_warnings` yang diurutkan (duplikat ditolak `BAD_REQUEST`).

Scope disertakan sesuai DOC-07 ("payload canonical + scope"). Reference revision dan isi preview terikat melalui `preview_fingerprint` milik SRS-51 (komentar 10159). **Sumber reference revision: tidak ditemukan; MENUNGGU ADAM (butir 7).** Service hanya membandingkan nilai dari `ReferenceRevisionReader` dengan nilai pada preview.

**Siklus record (usulan).** Record ditulis hanya untuk hasil sukses, di transaksi yang sama dengan domain, audit SUCCESS, dan perubahan state batch. Kegagalan di-rollback sehingga tidak meninggalkan record, dan retry dengan key yang sama tetap aman. Karena record tidak pernah terlihat sebelum COMMIT, state IN_PROGRESS pada DOC-07 tidak diperlukan; ini perbedaan dengan DOC-07 yang perlu dikonfirmasi Adam.

**Tabel keputusan (diimplementasikan di `commit-rules.ts`).**

| Record untuk (actor, operation, key) | Hash request | Hasil |
| --- | --- | --- |
| Tidak ada | — | Jalankan commit |
| Ada | Sama | Kembalikan respons lama (replay), tanpa menulis domain atau audit kedua |
| Ada | Berbeda | `IDEMPOTENCY_CONFLICT` 409 |

Record yang `expires_at`-nya sudah lewat tetap dihormati sampai dihapus oleh prosedur retensi yang belum ditetapkan (fail-closed).

## 5. Service commit dan cancel (Fase A)

**Urutan commit** (`commit.service.ts`), mengikuti #20 API-04 dengan satu penegasan: replay dikembalikan setelah otorisasi diulang, sesuai frasa #20 "replay yang disepakati setelah otorisasi".

1. Validasi request sebelum transaksi: batch UUID, correlation UUID, key 1–128 karakter (batas VARCHAR(128) pada 001), body tepat `{preview_fingerprint, acknowledged_warnings}`.
2. Dalam satu transaksi: kunci batch (`FOR UPDATE`) → baca record idempotency → otorisasi ulang → keputusan replay/konflik.
3. Guard state: commit hanya dari VALIDATED; state lain atau tidak dikenal → `STATE_CONFLICT`.
4. Preview: tidak ada atau milik batch lain → `PREVIEW_CHANGED`; ada error → `STATE_CONFLICT`; fingerprint berbeda → `PREVIEW_CHANGED`; jam server ≥ `expires_at` → `PREVIEW_EXPIRED`; reference revision berubah → `PREVIEW_CHANGED`.
5. Warning: preview memiliki warning atau request membawa acknowledgement → `WARNING_ACKNOWLEDGEMENT_OPEN` (fail-closed sampai C58-04 diputuskan, sejalan dengan PR #11).
6. Domain + source_row melalui `DomainCommitWriter` per kind; kind tanpa writer → `SOURCE_REQUIRED`.
7. Audit SUCCESS → batch COMMITTED → record idempotency → COMMIT.

**Cancel** (`CancelService`): kunci batch → otorisasi ulang → hanya STAGED/VALIDATED → CANCELLED → audit CANCELLED dengan `reason_code` `USER_CANCELLED`. Alasan dari pengguna tidak disalin ke audit atau log. Cancel tidak memakai Idempotency-Key, mengikuti OpenAPI kandidat; pembatalan ulang batch CANCELLED ditolak `STATE_CONFLICT`. Keduanya **MENUNGGU ADAM** (butir 4).

**Kegagalan.**

| Kondisi | Perilaku |
| --- | --- |
| Error domain pada allowlist | Rollback; audit FAILURE (atau DENIED untuk `FORBIDDEN`/`NOT_FOUND`) pada koneksi baru; error domain dilempar ulang |
| Error lain (termasuk driver) | Rollback; audit FAILURE `TRANSACTION_FAILED`; log `{code:'IMPORT_MUTATION_FAILED', correlation_id}`; dilempar `TRANSACTION_FAILED` tanpa `cause` |
| COMMIT terputus | Tidak menulis FAILURE; log `IMPORT_MUTATION_OUTCOME_UNKNOWN`; dilempar `TRANSACTION_OUTCOME_UNKNOWN` |
| Audit FAILURE gagal ditulis | Error asli tetap dilempar; log `AUDIT_UNAVAILABLE` |

`NOT_FOUND` tidak merujuk `batch_id` pada audit. Logger hanya menerima `{code, correlation_id}`; objek error tidak pernah dicetak. Ini menanggapi temuan review bundle bahwa `util.inspect` membawa pesan driver melalui `Error.cause`.

**Kode error.**

| Kode | HTTP | Asal |
| --- | --- | --- |
| `IDEMPOTENCY_CONFLICT` | 409 | DOC-08 |
| `PREVIEW_CHANGED` | 409 | DOC-08 |
| `PREVIEW_EXPIRED` | 410 | DOC-08 |
| `FORBIDDEN` | 403 | DOC-08 |
| `TRANSACTION_FAILED` | 500 | DOC-08 |
| `BAD_REQUEST` / `NOT_FOUND` | 400 / 404 | `AppError` yang sudah ada |
| `STATE_CONFLICT` | 409 | **Placeholder, MENUNGGU ADAM (butir 1)**; #20 menyebut 409 untuk konflik state tanpa nama kode |
| `WARNING_ACKNOWLEDGEMENT_OPEN` | 422 | **Placeholder, MENUNGGU ADAM (butir 3)** |
| `SOURCE_REQUIRED` | 422 | **Placeholder**; meminjam istilah staging #27 |
| `TRANSACTION_OUTCOME_UNKNOWN` | 500 | **Placeholder**; meminjam istilah `AuditService` #22 |

**Audit.** `reason_code` dibatasi ke nilai yang sudah ada pada `audit-event.ts` #22 (`TRANSACTION_FAILED`, `ACCESS_DENIED`, `USER_CANCELLED`). Akibatnya konflik idempotency tercatat sebagai FAILURE `TRANSACTION_FAILED`, sama dengan temuan review bundle. Kode audit baru **MENUNGGU ADAM** (butir 1) dan memerlukan perubahan file milik #22, yang tidak disentuh di sini.

## 6. Port dan adapter

Service bergantung pada port di `commit-ports.ts`, bukan pada kode yang belum merged:

| Port | Adapter Fase B yang direncanakan | Ketergantungan |
| --- | --- | --- |
| `UnitOfWork` | Client `pg` BEGIN/COMMIT/ROLLBACK; COMMIT terputus → `UnitOfWorkOutcomeUnknownError` | — |
| `BatchStore` | `import_batches` `SELECT … FOR UPDATE`, update state | 001/003 |
| `CommitAuthorizer` | Ulang sesi/role/assignment di transaksi | SRS-47/48; `StageAuthorizer` #27 |
| `PreviewReader` | Preview SRS-51 memakai client transaksi | SRS-51 (belum ada); guard transaksi `readOwnedStaging` (butir 2) |
| `ReferenceRevisionReader` | Sumber versi referensi | **Tidak ditemukan** (butir 7) |
| `DomainCommitWriter` | Per kind; kandidat pertama COUNT setelah migrasi 010 | 009/010/inbound schema |
| `IdempotencyStore` | `idempotency_records` setelah 012; 23505 → `IdempotencyKeyTakenError` | 012 |
| `CommitAuditWriter` | `appendAuditEvent` (dalam transaksi) dan `recordOutcome` (setelah rollback) dari #22 | #22 + patch `afa00a9` |

## 7. Keputusan yang masih terbuka

| No. | Keputusan | Status | Perlakuan sementara di Fase A |
| --- | --- | --- | --- |
| 1 | Kelas error konflik dan `reason_code` audit baru | MENUNGGU ADAM (10198 butir 1) | Error domain bertipe dengan allowlist; audit memakai kode #22 yang ada |
| 2 | Guard transaksi `readOwnedStaging` | MENUNGGU ADAM (butir 2) | Port `PreviewReader` mewajibkan `tx`; belum ada pembungkus |
| 3 | State C58-03, warning C58-04, expiry C58-05, retensi | MENUNGGU ADAM (butir 3) | Empat state 001; warning ditolak; expiry dari preview; retensi parameter wajib tanpa default |
| 4 | Idempotency untuk cancel | MENUNGGU ADAM (butir 4) | Cancel tanpa key; pembatalan ulang ditolak |
| 5 | Bentuk 012 (opsi A atau B) | MENUNGGU ADAM (butir 5) | Belum ada file migrasi |
| 6 | Basis Fase B | MENUNGGU ADAM (butir 6) | Branch dari develop; tes DB berupa TODO |
| 7 | Sumber reference revision | MENUNGGU ADAM (butir 7); **tidak ditemukan** | Port `ReferenceRevisionReader` |
| 8 | Audit untuk replay | **Belum ditanyakan**; tidak ditemukan keputusannya | Replay tidak menulis audit kedua |
| 9 | State IN_PROGRESS DOC-07 vs record sukses saja | **Belum ditanyakan** | Hanya `SUCCEEDED` (§4) |
| 10 | Nama kode placeholder (`STATE_CONFLICT`, dll.) | Termasuk butir 1 | Ditandai placeholder (§5) |

## 8. Rencana Fase B dan prasyarat

Fase B (file migrasi 012 dan tes DB) dimulai setelah:

1. Migrasi 004–008, audit (#22 dengan perbaikan `afa00a9`), dan staging (#27) tersedia di basis branch, baik merged ke develop maupun HEAD PR yang sudah dipush, sesuai jawaban butir 6.
2. Guard transaksi staging diperbaiki atau dibungkus (butir 2).
3. Bentuk 012 diputuskan (butir 5) dan schema contract ini direview Adam dan Luthfi.

Daftar tes DB tercatat sebagai `it.todo` pada `apps/api/src/tests/import-commit-db.todo.test.ts` (13 butir): perilaku migrasi 012, konkurensi dua koneksi, pemetaan 23505, COMMIT terputus, fault injection, audit atomik, commit vs cancel dengan `FOR UPDATE`, dan guard transaksi.

## 9. Verifikasi Fase A

Diisi dari hasil eksekusi aktual pada branch `feature/SRS-52-commit-idempotency` (25 November 2026, Node.js v24.18.0 lokal; CI memakai Node 22):

| Pemeriksaan | Hasil |
| --- | --- |
| Tes modul murni `import-commit-rules.test.ts` | 23 PASS |
| Tes service dengan fake `import-commit-service.test.ts` | 55 PASS |
| Tes DB `import-commit-db.todo.test.ts` | 13 TODO (belum dibuat; bukan PASS) |
| Uji mutasi sementara (tidak di-commit): `>=` menjadi `>`, konflik diabaikan, unknown COMMIT dimatikan | Masing-masing tertangkap: 2, 3, dan 2 tes gagal; file asli dipulihkan |
| Lint, typecheck, build | PASS (lint tanpa warning) |
| Seluruh test, `DATABASE_URL` dan `DATABASE_MIGRATION_URL` kosong seperti CI | 359 PASS, 13 TODO (Fase B), 13 skipped (tes migrasi SRS-44 yang memang di-skip tanpa DB), 0 FAIL |
| Repository check mode workspace | 163 berkas, 0 temuan |
| Catatan lingkungan | Dengan hanya `DATABASE_URL` dikosongkan, `migrations.test.ts` membaca `.env` lokal lewat `dotenv/config` lalu gagal `ECONNREFUSED` karena DB lokal mati. Ini perilaku lingkungan yang sudah ada sebelumnya dan tidak terkait perubahan ini |

Batas bukti: fake meniru kunci per batch dan rollback, tetapi **tidak** membuktikan perilaku PostgreSQL (isolasi, deadlock, FK, CHECK, trigger). Konkurensi, unknown COMMIT, dan audit atomik pada database nyata masih NOT RUN. Belum ada route, sesi nyata, atau integrasi SRS-51.

## 10. Keterlacakan dan iterasi Prototyping

- **Kebutuhan:** acceptance criteria SRS-52 (fault injection tanpa data parsial; key sama/payload sama mengembalikan hasil lama; key sama/payload beda konflik; cancelled tidak dapat commit).
- **Rancangan:** dokumen ini (§3–§6).
- **Implementasi prototipe:** modul `apps/api/src/modules/import-commit/` dan tes di `apps/api/src/tests/`.
- **Evaluasi:** tes Fase A (§9). Belum ada review nonpenulis dan belum ada feedback stakeholder.
- **Perbaikan:** menunggu jawaban butir 1–7 dan review.

| Acceptance criteria SRS-52 | Bukti Fase A | Bukti yang masih diperlukan |
| --- | --- | --- |
| Fault injection tidak meninggalkan data parsial | 9 langkah fault injection dengan fake | Tes PostgreSQL (TODO) |
| Key sama/payload sama mengembalikan hasil lama | Tes replay, termasuk sesudah expiry | Tes PostgreSQL dua koneksi (TODO) |
| Key sama/payload beda konflik | Tes konflik berurutan dan paralel dengan fake | Tes PostgreSQL + 23505 (TODO) |
| Cancelled tidak dapat commit | Tes guard state dan commit setelah cancel | Tes PostgreSQL commit vs cancel (TODO) |

SRS-52 **belum selesai**: Definition of Done memerlukan implementasi DB, integrasi, review nonpenulis, dan PR merged.

## 11. Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1 | 2026-11-25 | Rancangan awal Fase A: kondisi 001 vs DOC-07, usulan 012 opsi A/B, komposisi request_hash, tabel keputusan, urutan service, port, keputusan terbuka, rencana Fase B | Belum ada; seluruh isi PROPOSED |
