# Kontrak Schema 011 dan Service Rekonsiliasi — SRS-29

| Atribut | Nilai |
| --- | --- |
| Issue | [SRS-29](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-29) (ST-12A), parent EPIC-08; subtask SRS-86 |
| UC terkait | UC-12 (dan aturan target evidence UC-11, §5) |
| FR/NFR terkait | SOURCE REQUIRED (mengikuti deskripsi SRS-29); tidak ada ID FR/NFR baru |
| Status dokumen | **PROPOSED — sebagian.** Dokumen ini adalah rancangan, **bukan** file migrasi. Nomor 011 adalah reservasi nomor/modul (Adam, komentar Jira SRS-38 nomor 10153 butir 5), bukan schema final |
| Tanggal | 25 November 2026, Asia/Jakarta |
| Baseline repo | `origin/develop` @ `0ff9e4a`: engine murni PR #36 (`3e61e0e`) tersedia; migrasi hanya 001–003 |
| Pemilik | Backend & Database (Dwi Rani Amelia); reviewer nonpenulis Adam dan Luthfi (deskripsi SRS-29) |

## 1. Sumber

| Sumber | Bagian yang dipakai |
| --- | --- |
| Deskripsi SRS-29 | Alur N1–N5, E-1, A-1, E-2; acceptance criteria; API-13; tabel reconciliation_runs/lines |
| Komentar Jira SRS-29 nomor 10166 (Adam) | Engine merged `3e61e0e`; service harus membuktikan basis efektif, sesi/otorisasi, transaksi; schema 011 |
| Komentar Jira SRS-38 nomor 10153 (Adam) | D-03 evidence XOR; D-04 satu material per sisi per run, `AMBIGUOUS_PAIR`, null bukan nol; D-05 reuse input identik walaupun key berbeda; D-06 latest hanya COMMITTED, histori tetap |
| [DOC-07](07_DATABASE_DESIGN.md) | `reconciliation_runs`, `reconciliation_lines`, `evidence`, `idempotency_records` |
| [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md) | Katalog error (kode penolakan, `IDEMPOTENCY_CONFLICT`, `INVALID_TARGET`) |
| [DOC-09](09_API_SPECIFICATION.md) | API-13: Idempotency-Key wajib, 201 `{run_id, rule_version}` |
| [DOC-05](05_BUSINESS_RULES_RBAC.md) | BR-INV-03..06, BR-AUD-01 |
| `apps/api/src/modules/reconciliation/reconciliation-engine.ts` | Engine murni, `RECONCILIATION_RULE_VERSION = uji-engine/proposed-0.1` |

## 2. Keputusan yang dipakai dan yang masih usulan

| Butir | Keputusan Adam (sumber) | Masih usulan di dokumen ini |
| --- | --- | --- |
| Reuse run | Input identik (snapshot, count, rule, scope) memakai ulang run, termasuk ketika Idempotency-Key berbeda (10153 butir 4) | Komposisi `identity_hash` (§4), bentuk respons reuse, audit untuk reuse |
| Grain | Satu material per sisi per run; lebih dari satu baris/UOM material yang sama → `AMBIGUOUS_PAIR`; null bukan nol (10153 butir 3) | — (ditegakkan engine #36) |
| Histori | Histori tetap disimpan; latest hanya dari run COMMITTED (10153 butir 4) | Pemilihan latest adalah SRS-32; urutan commit dicatat di §7 |
| Evidence | XOR satu `stock_snapshot_id` atau `count_session_id` (10153 butir 3) | Tabel evidence, nomor migrasi (belum direservasi), kewenangan dan retensi (OD-08) |
| ACTUAL | Ditahan (10153; engine menolak `CUTOFF_UNVERIFIED`) | — |

## 3. Usulan bentuk 011

Mengikuti DOC-07, dengan tambahan yang diperlukan D-05 dan imutabilitas. Semua kolom dan constraint di bawah adalah usulan.

**`reconciliation_runs`**

| Kolom | Tipe | Null | Catatan |
| --- | --- | --- | --- |
| `id` | uuid PK | Tidak | Dari aplikasi |
| `identity_hash` | char(64) | Tidak | **Tambahan** untuk D-05; UNIQUE; CHECK hex huruf kecil |
| `stock_snapshot_id` | uuid FK `stock_snapshots` | Tidak | DOC-07; tabel dari migrasi 009 |
| `count_session_id` | uuid FK `count_sessions` | Tidak | DOC-07; tabel dari migrasi 010 |
| `rule_version` | text | Tidak | Versi engine |
| `warehouse_id`, `mode`, `cutoff_id` | uuid / varchar / uuid | Tidak | **Tambahan** usulan: scope disalin dari snapshot agar filter dan latest (SRS-32) tidak perlu join. Konsistensi dengan sumber diperiksa service; trigger hanya bila diputuskan |
| `created_by` | uuid FK `users` | Tidak | Dari sesi |
| `created_at` | timestamptz | Tidak | `now()`; lihat §7 tentang urutan commit |

DOC-07 mencatat "Unique: tidak ada selain PK". D-05 memerlukan UNIQUE `identity_hash`; perbedaan ini perlu dikonfirmasi Adam (§9).

**`reconciliation_lines`** sesuai DOC-07: `id`, `run_id` FK, `material_id`, `stock_line_id` NULL, `count_line_id` NULL, `status`, `variance` numeric(20,6) NULL; UNIQUE (`run_id`, `material_id`). Usulan menyimpan juga `system_quantity`, `physical_quantity`, `stock_uom`, `count_uom` dari hasil engine agar hasil lama dapat dibaca ulang tanpa menghitung ulang. CHECK DOC-07: minimal satu sisi ada; status valid (MATCHED/DISCREPANCY) wajib dua FK dan variance nonnull; status nonvalid wajib variance null.

**Imutabilitas.** Run dan lines append-only: trigger menolak UPDATE/DELETE/TRUNCATE dengan pola migrasi 007 (kandidat Adam). Port `ReconciliationRunStore` sengaja hanya punya `findByIdentity` dan `insertRun`.

**Pemetaan key.** Idempotency-Key aktor dipetakan ke run lewat port `RunKeyStore`. Adapter direncanakan memakai `idempotency_records` dengan operation `reconciliation.create` (DOC-07 §15), sehingga bergantung pada bentuk 012 (SRS-52, komentar Jira SRS-52 nomor 10198 butir 5).

## 4. Identitas run dan tabel keputusan

`identity_hash` = SHA-256 hex atas array berurutan tetap `[versi, stock_snapshot_id, count_session_id, rule_version, warehouse_id, mode]` dengan versi `SRS-29/run-identity/proposed-0.1` (`run-identity.ts`). Actor tidak termasuk, karena D-05 menyebut snapshot, count, rule, dan scope saja.

| Key aktor | Run identik | Hasil |
| --- | --- | --- |
| Pernah dipakai, input sama | — | Reuse run yang sama |
| Pernah dipakai, input lain | — | `IDEMPOTENCY_CONFLICT` 409 |
| Baru | Ada | Reuse run dan catat key (D-05) |
| Baru | Tidak ada | Jalankan engine dan buat run baru |

## 5. Service (`reconciliation.service.ts`)

Urutan dalam satu transaksi:

1. Baca snapshot dan sesi `FOR SHARE`; salah satu tidak ada → `NOT_FOUND`.
2. Otorisasi ulang kedua scope (snapshot dan sesi) → `FORBIDDEN`.
3. Hitung `identity_hash` → keputusan key/reuse.
4. Hanya untuk run baru: engine; penolakan engine (`WAREHOUSE_MISMATCH`, `MODE_MISMATCH`, `CUTOFF_MISMATCH`, `CUTOFF_UNVERIFIED`, `AMBIGUOUS_PAIR`, `NOT_COUNTED_VALUE`, `INVALID_FILE`) menolak seluruh permintaan tanpa menyimpan apa pun (E-1, D-04).
5. Simpan run + lines → catat key → audit SUCCESS `reconciliation.create` → COMMIT.

**Konkurensi.** Bila unique `identity_hash` atau unique key terlanjur dipakai transaksi paralel, service mengulang sekali. Percobaan kedua membaca run atau key pemenang lalu memakai ulang run itu atau menolaknya sebagai konflik.

**Kegagalan.** Error domain dilempar ulang dengan audit FAILURE/DENIED pada koneksi baru. Error lain → `TRANSACTION_FAILED` tanpa `cause`. COMMIT terputus → `TRANSACTION_OUTCOME_UNKNOWN` (placeholder) tanpa FAILURE palsu. Log hanya `{code, correlation_id}`.

**Evidence XOR** (`modules/evidence/evidence-target.ts`): aturan murni D-03 yang mengembalikan `INVALID_TARGET` bila target kosong, ganda, bukan UUID, atau memakai `stock_line_id` lama. Aturan ini milik UC-11 dan ditaruh di sini atas permintaan pemilik tugas; upload, tabel, dan nomor migrasi evidence belum dikerjakan.

## 6. Port dan adapter

| Port | Adapter yang direncanakan | Ketergantungan |
| --- | --- | --- |
| `StockSnapshotReader` | `stock_snapshots` + `stock_lines` COMMITTED, `FOR SHARE` | Migrasi 009, SRS-26 |
| `CountSessionReader` | `count_sessions` + `count_lines` COMMITTED, `FOR SHARE` | Migrasi 010, SRS-27 |
| `ReconciliationAuthorizer` | Sesi/role/assignment di transaksi | SRS-47/48 |
| `ReconciliationRunStore` | `reconciliation_runs`/`lines`; 23505 identity → `RunIdentityTakenError` | Migrasi 011 |
| `RunKeyStore` | `idempotency_records` operation `reconciliation.create`; 23505 → `RunKeyTakenError` | Migrasi 012 (SRS-52) |
| `ReconciliationAuditWriter` | `appendAuditEvent` / `recordOutcome` dari #22 (action `reconciliation.create` sudah ada) | #22 |
| `ReconciliationUnitOfWork` | Client `pg` BEGIN/COMMIT/ROLLBACK | — |

## 7. Catatan untuk SRS-32 (latest COMMITTED)

10153 butir 4 menyatakan `created_at`/`id` tidak boleh mendahului keberhasilan commit. Di PostgreSQL, `now()` dan nilai sequence ditetapkan di dalam transaksi, sehingga transaksi yang mulai lebih awal bisa COMMIT lebih akhir. Usulan untuk dibahas: kunci baris `cutoff_contexts` (atau kelompok warehouse/mode/cutoff/rule) `FOR UPDATE` sebelum menyimpan run, supaya urutan dalam satu kelompok mengikuti urutan commit. Ini belum diimplementasikan dan menunggu keputusan (§9).

## 8. Verifikasi

Hasil eksekusi aktual pada branch `feature/SRS-29-reconciliation-service` (25 November 2026, Node.js v24.18.0 lokal):

| Pemeriksaan | Hasil |
| --- | --- |
| `reconciliation-run-rules.test.ts` (identitas, keputusan, error, evidence XOR) | 22 PASS |
| `reconciliation-service.test.ts` (run baru, immutable, reuse, konflik, penolakan, otorisasi, fault injection 8 langkah, unknown COMMIT, konkurensi) | 33 PASS |
| `reconciliation-db.todo.test.ts` | 11 TODO (belum dibuat; bukan PASS) |
| Uji mutasi sementara (tidak di-commit): retry dimatikan, konflik diabaikan, penolakan engine diabaikan | Tertangkap: 2, 2, dan 5 tes gagal; file asli dipulihkan |

Batas bukti: fake meniru unique index dan rollback, tetapi tidak membuktikan PostgreSQL (isolasi, `FOR SHARE`, deadlock, FK/CHECK, trigger). Belum ada route, sesi nyata, migrasi 009–011, atau UI SRS-86.

## 9. Pertanyaan untuk Adam

1. Respons reuse: DOC-09 API-13 hanya menyebut 201 `{run_id, rule_version}`. Apakah reuse memakai 200 + `reused: true` (usulan PR #14 §7)?
2. Apakah reuse dicatat di audit? Sementara tidak menulis audit kedua.
3. DOC-07 tidak punya unique selain PK pada `reconciliation_runs`. Apakah 011 boleh menambah UNIQUE `identity_hash` dan kolom scope (`warehouse_id`, `mode`, `cutoff_id`)?
4. Apakah pemetaan key memakai `idempotency_records` 012 (operation `reconciliation.create`), atau tabel terpisah?
5. Otorisasi sumber yang tidak berizin: `FORBIDDEN` (sekarang) atau `NOT_FOUND` tersembunyi?
6. Apakah imutabilitas run/lines ditegakkan trigger seperti 007?
7. Reuse, retry, dan versi hasil juga tercantum di SRS-30 (To Do). Apakah bagian ini tetap di SRS-29 atau dipindah ke SRS-30?
8. Urutan commit untuk latest (§7): kunci kelompok, atau cara lain?
9. Evidence XOR (§5) ditaruh di branch SRS-29. Apakah perlu dipindah ke tiket UC-11, dan nomor migrasi evidence berapa?
10. `material_id` pada engine berupa string, sedangkan DOC-07 menetapkan FK `materials.id` UUID. Apakah adapter memetakan ke UUID referensi?

## 10. Keterlacakan dan iterasi Prototyping

- **Kebutuhan:** acceptance criteria SRS-29 dan D-03 sampai D-05.
- **Rancangan:** §3–§6.
- **Implementasi prototipe:** service, aturan identitas, dan port.
- **Evaluasi:** tes di §8. Belum ada review nonpenulis dan belum ada feedback stakeholder.
- **Perbaikan:** menunggu §9.

| Acceptance criteria SRS-29 | Bukti saat ini | Bukti yang masih diperlukan |
| --- | --- | --- |
| 10/8 → DISCREPANCY −2; 10/10 → MATCHED 0 | Tes engine #36 dan tes service (run baru) | Tes PostgreSQL dan UI (SRS-86) |
| NOT_COUNTED, COUNT_MISSING, STOCK_MISSING, UOM_MISMATCH: variance null | Tes engine #36; tes service untuk NOT_COUNTED | Tes PostgreSQL dengan CHECK variance |
| E-1 tolak seluruh permintaan; E-2 rollback, hasil lama tetap | Tes penolakan dan fault injection dengan fake | Tes PostgreSQL (TODO) |

SRS-29 **belum selesai**: DoD memerlukan migrasi 009–011, adapter, integrasi sesi/otorisasi, UI, review nonpenulis, dan merge.

## 11. Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1 | 2026-11-25 | Rancangan awal: usulan 011, identitas run, tabel keputusan, service, port, evidence XOR, catatan latest, pertanyaan | Belum ada; seluruh isi PROPOSED |
