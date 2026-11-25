# SRS-51 — Fondasi UC-16 dan Preview Tervalidasi (Draft Implementasi Terisolasi)

Status: **IN PROGRESS / TERISOLASI** (belum terintegrasi endpoint HTTP/staging runtime)  
Tanggal: 25 November 2026  
Pemilik: Muhammad Luthfi Rafif  
Issue: SRS-51 (T-17)

## Cakupan yang Diimplementasikan

Implementasi terisolasi domain service untuk preview tervalidasi:

- `apps/api/src/validation/preview-types.ts` — tipe `ReadOwnedStaging`, `PreviewAuthorizer`, `BuildPreviewInput`, `PreviewResult`, issue/warning.
- `apps/api/src/validation/preview-service.ts` — `createPreviewService`, fingerprint SHA-256 kanonik, expiry 30 menit, invalidasi.
- `apps/api/src/tests/fixtures/srs51/preview-valid-uji.fixture.json` — fixture UJI berversi (`srs51-uji-v1`, label UJI).
- `apps/api/src/tests/preview-service.test.ts` — 12 tes PASS.

## Kontrak Internal

### `ReadOwnedStaging` (dependency dari PR #27 / SRS-50)

```ts
type ReadOwnedStaging = (input: { batchId: string; actorId: string }) => Promise<StagingRow[]>
```

Service tidak membaca DB langsung; ia memakai fungsi terinjeksi ini. Saat integrasi, caller harus meneruskan `transactionClient` yang sama sesuai handoff SRS-50.

### Authorizer

Service memakai `PreviewAuthorizer.authorize(...)` deny-by-default. Actor harus berasal dari sesi tervalidasi; payload klien tidak dipercaya. Integrasi nyata harus memakai SRS-48 authorizer + SRS-47 session.

### Fingerprint

Fingerprint SHA-256 dari JSON kanonik yang mencakup: batchId, warehouseId, mode, importType, sourceHash, contractVersion, validationVersion, metadata, dan rows ternormalisasi berurutan. Perubahan salah satu field ini menginvalidasi preview.

### Expiry

- TTL default: **30 menit** (`PREVIEW_TTL_MS = 1_800_000`).
- `expiresAt` dihitung server-side dari `now()` terinjeksi.
- `assertPreviewFresh` menolak jika `now >= expiresAt` atau fingerprint berbeda.

### Warning IDs

Warning/error memiliki ID deterministik `warn_<sha1-16>` dari `batchId|code|rowNumber|field`. ID stabil untuk input yang sama.

## Batasan / Belum Selesai

- Tidak ada endpoint HTTP `/imports/{batch}/validate|preview|commit` (menunggu kontrak API final #20/#28 dan wiring backend).
- `readOwnedStaging` nyata dari PR #27 belum diimpor sebagai dependency runtime; saat ini interface terinjeksi.
- Aturan validasi domain masih minimal (row order, PENDING blocking fail-closed, INVALID row, negative quantity). Aturan UC-16 penuh per adaptor (5 jenis impor) belum diimplementasikan.

### Commit dan Status (fail-closed, diperbarui per review PM 25 Nov 2026)

- Baris dengan `validation_status === 'PENDING'` menghasilkan issue blocking (`ROW_PENDING`, severity ERROR) dan menolak `status` menjadi `VALID` serta menolak `canCommit` selama ada baris pending/ERROR. Tidak ada mekanisme lain (misalnya warning acknowledgment) yang boleh melewatkan komit untuk batch yang belum divalidasi penuh.
- Tidak ada persistensi preview; expiry/invalidation dicek in-memory oleh caller.
- ACTUAL ditolak.

## Hasil Tes

- `npx vitest run apps/api/src/tests/preview-service.test.ts` — **12 PASS / 0 FAIL** (25 Nov 2026, lokal, sesudah koreksi review PM).
- Integrasi staging/runtime: **NOT RUN / BLOCKED** (SRS-50 runtime, SRS-47/48 wiring, kontrak #20/#28).

## Handoff

- SRS-52 commit/idempotency harus memanggil `assertPreviewFresh` dengan fingerprint terkini sebelum commit.
- Endpoint HTTP harus mengambil actor dari sesi, bukan body.
- Perlu review nonpenulis sebelum merge ke develop.