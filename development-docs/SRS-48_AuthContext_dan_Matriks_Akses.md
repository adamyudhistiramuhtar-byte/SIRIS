# SRS-48 — AuthContext, Authorizer, dan Matriks Akses (Draft Implementasi Terisolasi)

Status: **IN PROGRESS / TERISOLASI** (belum terintegrasi sesi backend nyata)  
Tanggal: 25 November 2026  
Pemilik: Muhammad Luthfi Rafif  
Issue: SRS-48

## Tujuan

Menyediakan authorizer terpusat dengan keputusan deny-by-default untuk role, gudang, kepemilikan objek, dan mode data. Implementasi ini dibuat terisolasi agar dapat diuji sebelum SRS-47 backend session selesai.

## Artefak Kode

- `apps/api/src/auth/auth-types.ts` — `AuthActor`, `AuthzAction`, `AuthzScope`, `AuthDecision`, `Authorizer`, `StageAuthorizer` adapter contract.
- `apps/api/src/auth/authorizer.ts` — `createAuthorizer()` dan `createStageAuthorizerAdapter()`.
- `apps/api/src/tests/authorizer.test.ts` — 10 tes PASS.

## AuthContext / Actor Contract

`AuthActor` **hanya** boleh dibentuk dari sesi backend tervalidasi (SRS-47). Payload/body/header dari klien tidak dipercaya.

| Field | Tipe | Sumber | Catatan |
|---|---|---|---|
| `accountId` | string (UUID akun) | sesi server | identitas kanonik |
| `role` | `PURCHASING|WAREHOUSE|PRODUCTION|MANAGEMENT` | sesi server | 4 role baseline |
| `warehouseIds` | string[] | assignment `user_warehouses` | scope gudang aktif/diizinkan |
| `active` | boolean | sesi/server | akun nonaktif ditolak |
| `sessionRevoked` | boolean? | session store | revokasi/logout/expiry |

## Keputusan Akses

`authorize()` mengembalikan `{ allowed, reason }` dengan deny-by-default.

| Reason | Arti |
|---|---|
| `ALLOWED` | semua pemeriksaan lolos |
| `DENY_NO_ACTOR` | tidak ada aktor/sesi valid |
| `DENY_INACTIVE` | akun tidak aktif |
| `DENY_REVOKED` | sesi dicabut/kadaluarsa |
| `DENY_ROLE` | role tidak diizinkan untuk aksi |
| `DENY_WAREHOUSE` | gudang di luar assignment |
| `DENY_OBJECT_OWNERSHIP` | batch/objek milik aktor lain |
| `DENY_MODE` | mode bukan UJI (ACTUAL belum diaktifkan) |

## Matriks Akses Awal (UJI, terisolasi)

| Aksi | PURCHASING | WAREHOUSE | PRODUCTION | MANAGEMENT | Catatan |
|---|---:|---:|---:|---:|---|
| `import:stage` | ✅ | ✅ | ❌ | ❌ | warehouse harus assigned |
| `import:validate` | ✅ | ✅ | ❌ | ❌ | owner/batch checks saat terintegrasi |
| `import:preview` | ✅ | ✅ | ❌ | ❌ | preview tidak memberi akses data di luar scope |
| `import:commit` | ✅ | ✅ | ❌ | ❌ | wajib recheck authz sebelum commit |
| `import:read` | ✅ | ✅ | ✅ | ❌ | read terbatas scope/kontrak |
| `batch:read` | ✅ | ✅ | ✅ | ✅* | *Management read metadata sesuai kontrak; tidak raw/file privat |
| `batch:mutate` | ✅ owner | ✅ owner | ❌ | ❌ | ownership wajib; revocation mencegah mutasi |

## StageAuthorizer Adapter (PR #27)

`createStageAuthorizerAdapter(resolveActor, authorizer)` mengembalikan kontrak `StageAuthorizer`:

- Input: `{ kind, warehouse_id, mode }`.
- Aktor diambil dari `resolveActor()` (sesi backend), **bukan** dari payload.
- Keputusan memakai `import:stage` + cek gudang + cek mode.
- Output sukses: `{ actor_id, role, warehouse_ids }`.
- Output tolak: error `FORBIDDEN`/403 dengan detail reason.

## Batasan

- Belum terhubung ke Express middleware atau session cookie SRS-47.
- Belum memfilter query DB/pagination; ini hanya keputusan otorisasi.
- Belum mengimplementasikan semua aksi domain UC-01..UC-15; aksi dapat ditambah saat kontrak endpoint disahkan.
- ACTUAL tetap ditolak (`DENY_MODE`).

## Hasil Tes

- `npx vitest run apps/api/src/tests/authorizer.test.ts` — **10 PASS / 0 FAIL** (25 Nov 2026, lokal).
- Integrasi backend/runtime: **NOT RUN / BLOCKED** (SRS-47 session backend belum tersedia).