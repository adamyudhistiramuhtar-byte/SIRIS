# Fixture dan DTO Layar Commit, Pembatalan, dan Audit Impor (SRS-52, konsumen SRS-67)

Status: PROPOSED. Data: SIMULATED, mode UJI. Bukan data mitra dan bukan hasil operasional.

## Isi

| Berkas | Fungsi |
| --- | --- |
| `packages/contracts/src/import-commit-screen.ts` | Tipe DTO API-04, API-05, kode error commit/cancel, dan `AuditEvent` DOC-09 (hanya tipe) |
| `database/fixtures/uji/import-commit-screen.proposed-0.1.json` | Fixture: contoh request, peta status HTTP, dan 11 skenario commit/cancel beserta event auditnya |
| `apps/api/src/tests/import-commit-screen-fixture.contract.test.ts` | Tes kontrak: skema DOC-09, redaksi audit, kesesuaian dengan jejak service, aturan replay |
| `apps/api/src/tests/contract/doc09-schema.ts` | Pemeriksa skema DOC-09 untuk tes (identik dengan branch SRS-86 dan SRS-32) |

## Sumber dan verifikasi

- Setiap skenario dijalankan pada `CommitService`/`CancelService` #46 @ 6cf5bbf dengan fake tes #46. `service_trace` adalah event internal apa adanya; `audit_events_dto` adalah bentuk DOC-09 untuk layar, dengan `id` dan `created_at` sintetis.
- Cek silang lokal 26 Nov 2026 pada worktree #46 @ 6cf5bbf (tidak di-commit): `CommitResultDto`, `CancellationResultDto`, `ImportCommitErrorCodeDto`, `ImportOperationDto`, dan `AuditOutcomeDto` identik dengan tipe #46 (tsc tanpa error).
- Pencocokan ulang otomatis terhadap #46 ditandai `it.todo` sampai #46 merged.

## Skenario

Commit sukses, replay key/body sama, key sama body berbeda, akses ditolak, preview kedaluwarsa, preview berubah, warning belum diakui, transaksi gagal, hasil COMMIT tidak diketahui, batal sukses, batal setelah COMMITTED.

## Cara pakai untuk layar (SRS-67)

- Replay identik mengembalikan hasil yang sama tanpa audit kedua.
- `TRANSACTION_OUTCOME_UNKNOWN`: jangan tampilkan sebagai gagal pasti; minta pengguna memeriksa status sebelum mencoba lagi.
- Event audit untuk layar hanya memuat `id`, `action`, `outcome`, `mode`, `correlation_id`, `created_at`. Jangan menampilkan actor, batch, gudang, atau reason dari jejak internal.
- `message` pada error hanya contoh; teks final belum ditetapkan.

## Batas lingkup

Audit dibatasi ke event yang dihasilkan commit/cancel #46. Query dan proyeksi audit API-20 milik SRS-33 (Luthfi), dan audit dasar SRS-49/#22 milik Adam.

## Masih OPEN

- `reason_code` audit #46 dibatasi allowlist #22, sehingga penolakan domain (IDEMPOTENCY_CONFLICT, PREVIEW_*, STATE_CONFLICT, WARNING_ACKNOWLEDGEMENT_OPEN) tercatat `TRANSACTION_FAILED` (SRS-52 10215 butir 1).
- C58-03 status preview, C58-04 ID dan acknowledgement warning, C58-05 expiry 409/410, dan kode penolakan ACTUAL (SRS-52 10221).
- Idempotency-Key untuk pembatalan (SRS-52 10215 butir 4).
- `ApiError.details` DOC-09 mewajibkan `field`+`code`, sedangkan `ApiErrorDetail` di api.ts menjadikan `field` opsional dan menambah `message`.
- Envelope respons sukses `data`/`meta` vs contoh DOC-09.
- Integrasi API, sesi, dan database nyata: NOT RUN.
