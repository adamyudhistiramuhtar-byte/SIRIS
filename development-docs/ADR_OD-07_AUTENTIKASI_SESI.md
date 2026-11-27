# ADR OD-07 — Strategi Autentikasi dan Sesi SIRIS (Draft)

Status: **PROPOSED — NEEDS PM DECISION**  
Tanggal: 25 November 2026  
Pemilik draft: Muhammad Luthfi Rafif (SRS-47)  
Reviewer/keputusan: Adam Yudhistira Muhtar (PM/Technical Owner)  
Issue terkait: SRS-47, SRS-48, OD-07, DOC-05, DOC-06, DOC-09, DOC-16

## Konteks

SIRIS membutuhkan autentikasi internal untuk empat role (Purchasing, Warehouse, Production, Management) dengan gudang aktif dari assignment `user_warehouses`. Baseline saat ini:

- Frontend memiliki `session-context` UJI sementara (`apps/web/src/shared/session/session-context.ts`) — **bukan autentikasi backend**.
- `LoginPage.vue` masih simulasi `setTimeout` dan tidak memanggil backend.
- Backend (`apps/api`) belum memiliki endpoint auth, session store, CSRF middleware, atau authorization middleware.
- ADR-02 di `KEPUTUSAN_TEKNIS_SRS-40.md` merekomendasikan sesi server + cookie, tetapi masih PROPOSED.
- OD-07 di DOC-00 masih OPEN/NEEDS DECISION.

## Keputusan yang Dibutuhkan

Memilih mekanisme autentikasi/sesi yang akan diimplementasikan untuk runtime SIRIS, dengan batasan: tidak ada public registration, identitas tidak dipercaya dari payload, role/gudang divalidasi backend, logout/expiry aman, dan audit tanpa secret.

## Opsi

### Opsi A — Sesi Server + Cookie HttpOnly (Direkomendasikan)

- **Mekanisme**: Login mengembalikan cookie sesi `HttpOnly`, `Secure` (HTTPS), `SameSite=Lax/Strict` sesuai topologi; server menyimpan session record (DB/Redis/store terinjeksi).
- **CSRF**: Token CSRF per sesi untuk mutasi state-changing (POST/PUT/PATCH/DELETE), diverifikasi server; header `X-CSRF-Token` atau double-submit sesuai keputusan implementasi.
- **Expiry**: Idle timeout + absolute timeout; logout menginvalidasi sesi server-side.
- **Kelebihan**: Token tidak terekspos ke JavaScript; selaras dengan DOC-06/ADR-02; mudah dicabut server-side.
- **Risiko/biaya**: Perlu session store, kebijakan CSRF, CORS/credential config, dan pengujian cookie cross-origin jika frontend/backend berbeda origin.
- **Kesesuaian SIRIS**: Baik untuk aplikasi internal web; sederhana untuk audit/revocation.

### Opsi B — Token Bearer (JWT/PAT-style) dikelola klien

- **Mekanisme**: Login mengembalikan access token (+ optional refresh token); klien menyimpan dan mengirim `Authorization: Bearer`.
- **CSRF**: Tidak rentan CSRF klasik jika hanya header Bearer, tetapi rentan XSS/token theft jika disimpan di storage yang dapat dibaca JS.
- **Expiry**: Access token pendek + refresh token; revocation perlu daftar deny/rotasi.
- **Kelebihan**: Mudah untuk API non-browser; stateless access token.
- **Risiko/biaya**: Penyimpanan token di browser rawan; revocation/logout lebih kompleks; refresh flow perlu perlindungan replay.
- **Kesesuaian SIRIS**: Kurang ideal sebagai default browser app internal kecuali ada kebutuhan API client khusus.

## Rekomendasi Draft

**Pilih Opsi A** untuk runtime web SIRIS, dengan batas implementasi Sprint 3:

1. Session store diisolasi lewat interface (`SessionStore`/repository) agar pengujian tidak bergantung DB nyata.
2. Cookie attributes: `HttpOnly`, `Secure` saat HTTPS, `SameSite=Lax` default; evaluasi `SameSite=None; Secure` hanya jika cross-site diperlukan dan diuji.
3. CSRF wajib untuk mutasi cookie-auth.
4. Identitas aktor hanya dari sesi server tervalidasi; payload/body/header user ID dari klien diabaikan.
5. Logout/expiry menghapus sesi server dan memaksa klien membersihkan konteks UJI.
6. Password hashing menggunakan algoritma modern (Argon2id/bcrypt sesuai dependensi yang disetujui) — belum dipilih final di draft ini.
7. Tidak ada registrasi publik, tidak ada endpoint debug yang membocorkan session/cookie/token.

## Dampak Implementasi

| Area | Dampak |
|---|---|
| SRS-47 | Provider login/logout/refresh, session record, CSRF, expiry, audit auth event. |
| SRS-48 | Authorizer membaca aktor dari session context tervalidasi; deny-by-default. |
| Frontend | `session-context` menjadi proyeksi sesi server; `LoginPage` memanggil endpoint auth nyata; route guard tetap bukan security boundary. |
| API | Middleware auth/session, CSRF, error contract aman, CORS credentials sesuai origin. |
| Testing | Fake/in-memory session store untuk unit/integration; tidak ada bypass guard. |

## Status Bukti

- **Implemented in this branch (isolated)**: `session-provider.ts`, `fake-session-auth-server.ts`, `session-context.ts` clear lifecycle, unit tests PASS (16/16 for session-context+provider). **Koreksi review PM (25 Nov 2026)**: `csrfToken`/state lokal dibersihkan fail-closed saat logout, refresh expired/exception, login expired/exception, atau kegagalan apply; logout tetap membersihkan state lokal meski `auth.logout()` melempar exception (kontrak fail-closed, tidak meninggalkan token lama dapat dibaca).
- **NOT IMPLEMENTED / BLOCKED**: endpoint backend nyata, cookie transport, DB session table, password hashing production, CSRF middleware Express, audit event persistence, integration dengan SRS-43 error contract.
- **No ACCEPTED decision**: dokumen ini draft; PM harus menetapkan opsi final sebelum klaim SRS-47 Done.

## Pertanyaan untuk PM

1. Apakah Opsi A (cookie session server) disetujui sebagai baseline OD-07?
2. Apakah session store Sprint 3 memakai PostgreSQL table, in-memory dev-only, atau adapter yang diputuskan kemudian?
3. Kebijakan SameSite/CORS untuk topologi dev (Vite proxy) vs deployment?
4. Apakah CSRF memakai custom header token atau synchronizer token?
5. Algoritma password hashing dan parameter minimum?