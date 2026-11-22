# Implementasi SRS-46: Layout, Konteks, dan Routing Berbasis Peran (UJI)

Status: **dalam pengerjaan; belum Done.** Sesuai DoD SRS-46, selesai coding saja belum Done.
Dasar: baseline RBAC UJI v0.1 (`MATRIK_PERMUTASI_SRS-36.md`, §6.2, §7, §8.3, §15). Keputusan PM SRS-36 komentar 10071.

## Cakupan yang dikerjakan

| Butir | Berkas | Keterangan |
| --- | --- | --- |
| Matriks halaman per role | `apps/web/src/shared/access/access-matrix.ts` | Empat role, UC-01 sampai UC-15 sesuai §6.2. Mode selain UJI ditolak. UC-16 tidak ada. |
| Menu per role | `apps/web/src/shared/access/navigation.ts` | Menu disaring dengan matriks; grup kosong disembunyikan. |
| Route guard | `apps/web/src/router/access-guard.ts` | Route dengan `meta.ucId` dievaluasi; terlarang diarahkan ke `/akses-ditolak` tanpa membawa tujuan. Route aktif dievaluasi ulang saat role/mode/akun berubah. |
| Konteks sesi | `apps/web/src/shared/session/session-context.ts` | Akun, role, gudang aktif (hanya dari assignment), mode. Perubahan memanggil handler reset selection/cache. |
| Context Strip | `apps/web/src/layouts/AppShell.vue` | Peran, gudang, dan mode terbaca dari konteks sesi. |
| Halaman akses ditolak | `apps/web/src/pages/ForbiddenPage.vue` | Pesan umum, tanpa detail izin. |
| UC-11 dan UC-12 | `meta.viewOnly` pada route | Ditandai "Hanya lihat (UJI)"; upload evidence dan eksekusi rekonsiliasi tidak diaktifkan. |

## Batas yang dijaga

- Penyaringan menu dan route di frontend **bukan kontrol keamanan**; backend tetap otoritas akses (PM butir C).
- Konteks sesi saat ini adalah **konteks UJI sementara**, bukan autentikasi. Sesi nyata dan otorisasi backend adalah SRS-47 dan SRS-48 dan belum tersedia.
- Izin ACTUAL tidak diaktifkan. Mode ACTUAL tidak memberi akses halaman dan tidak dapat dipilih.
- Tidak ada role, menu, atau endpoint baru di luar baseline. Tidak ada role switch di antarmuka.
- Komponen PR #17 (SRS-53) belum dipasang ke halaman; pemasangan dikerjakan setelah PR #17 tersedia pada branch kerja.

## Checklist review SRS-46 terhadap baseline (§15.4)

- [x] Hanya empat role; tidak ada ADMIN (diuji `role-access.spec.ts`).
- [x] Halaman per role sesuai §6.2 (diuji untuk 15 UC x 4 role).
- [x] UC-16 tidak menjadi menu.
- [x] ACTUAL tidak diaktifkan.
- [x] UC-11 evidence dan UC-12 eksekusi tidak diaktifkan.
- [x] Perubahan akun/role/gudang/mode memanggil reset selection/cache (diuji `session-context.spec.ts`; konsumen reset nyata belum ada, belum ada selection/cache yang dipakai halaman).
- [ ] Izin impor §5.3: bukan cakupan layar ini; belum diverifikasi.
- [ ] Akses gudang dibatasi `user_warehouses`: baru sebatas validasi sisi klien terhadap assignment sesi; sumber assignment dari backend belum ada.
- [ ] Mutasi hanya oleh pemilik batch; raw/preview batch orang lain ditolak: tidak termasuk cakupan frontend ini, bergantung backend.

## Pemeriksaan yang dijalankan (Linux, Node lokal)

| Pemeriksaan | Hasil |
| --- | --- |
| `npx vitest run apps/web` | 122 lulus (9 berkas) |
| `npx vitest run` (seluruh repo) | 132 lulus (14 berkas) |
| `vue-tsc --noEmit` (web) | tanpa galat |
| `eslint apps/web/src` | tanpa temuan |
| `npm run build --workspace=@siris/web` | berhasil |
| `scripts/check_repository.py --tracked` | 0 temuan |

Pemeriksaan browser headless (Chrome, Linux) per role pada server dev: menu, Context Strip, route terlarang, dan evaluasi ulang saat role berubah sesuai matriks; ditemukan dan diperbaiki judul pintasan kosong pada Beranda Production. Ini bukan pengujian manual oleh pengguna.

Belum dijalankan: pengujian manual oleh pengguna di browser, pengujian dengan sesi/backend nyata, code review oleh reviewer lain, CI remote. **SRS-46 belum memenuhi DoD.**
