# Arsitektur Repositori SIRIS

Status: PROPOSED untuk struktur aplikasi; konfigurasi repository yang benar-benar dibuat dicatat terpisah. Tanggal 10 November 2026. Stack tetap Vue 3, Node.js/Express.js, PostgreSQL, REST API. Tidak ada implementasi feature pada pekerjaan ini.

## Kondisi yang ditemukan

Workspace berisi AGENTS.md, design.md, 19 dokumen development dan ZIP dokumentasi. Belum ada aplikasi, package.json, lockfile, migration, konfigurasi Git atau CI. Tidak ada layout aplikasi yang perlu dipindah. Semua sumber asal dipertahankan.

Rekomendasi: modular monorepo dengan npm workspaces setelah package manager/runtime disepakati (OD-07). Keuntungannya satu kontrak dan satu koordinasi release untuk empat developer. Tidak memerlukan Nx/Turborepo/microservices. Pilihan ORM, autentikasi dan hosting tetap terbuka.

## Struktur saat setup dan struktur usulan

| Path | Status | Tanggung jawab |
| --- | --- | --- |
| development-docs/ | Existing, dipertahankan | Sumber teknis draft dengan OD/CF yang masih terbuka |
| design.md | Existing, dipertahankan | Sumber visual/token/route; bukan bukti implementasi |
| planning/roadmap/ dan planning/sprints/ | Dibuat sekarang | Jadwal, readiness, dependency dan ownership |
| docs/implementation/ | Dibuat sekarang | Workflow, arsitektur, pengujian, review publikasi |
| scripts/ | Dibuat sekarang | Pemeriksa repository dan registry branch; bukan kode bisnis |
| .github/ | Dibuat sekarang | Template PR dan CI repository-only |
| apps/web/ | PROPOSED; belum dibuat | Aplikasi Vue 3 |
| apps/api/ | PROPOSED; belum dibuat | Server Express modular |
| packages/contracts/ | PROPOSED; belum dibuat | DTO/schema yang sudah ditinjau; tanpa aturan bisnis duplikat |
| database/migrations/, seeds/, fixtures/ | PROPOSED; belum dibuat | Migrasi dan seed aman; fixture sintetis UJI |
| tests/integration/, e2e/, fixtures/ | PROPOSED; belum dibuat | Pengujian lintas modul dan browser |
| planning/jira/ | Belum diperlukan | Buat setelah ada ekspor/key Jira asli |

Direktori aplikasi kosong dan placeholder source tidak dibuat. package.json, script lint/build/test dan lockfile dibuat bersama scaffold nyata pada chore/project-foundation, bukan untuk memberi kesan aplikasi telah ada.

## Frontend yang direncanakan

`apps/web/src/app/` mengoordinasikan bootstrap/router/session; `layouts/` berisi AppShell; `features/inbound/`, `features/inventory/` dan `features/audit/` mengelompokkan page, composable, API adapter dan tes menurut tugas. `shared/ui/` menyimpan primitives/composites; `shared/api/` menangani HTTP/DTO/error; `styles/generated/` menerima token hasil ekstraksi design.md. Nama akhir diselaraskan dengan konvensi scaffold, tanpa palette kedua.

Route berasal design.md §3.3: 15 layar fungsi ditambah AUTH/HOME. UC-16 tetap internal. Route guard memberi UX yang jelas, sedangkan backend tetap memutuskan izin. Tidak ada halaman baru. Loading/empty/partial/error/offline/success/permission-denied diwarisi dari kontrak visual. Composable mengelola perilaku lokal; state global hanya untuk sesi/konteks yang benar-benar dibagi. Pinia adalah kandidat bila kebutuhan membenarkan, bukan keputusan instalasi saat ini.

DEV-03 mengintegrasikan shell/komponen bersama. DEV-02/DEV-04 boleh berkontribusi UI feature di branch UC dengan review DEV-03; tidak mengubah token/shared router secara independen tanpa koordinasi.

## Backend yang direncanakan

`apps/api/src/modules/{inbound,inventory,imports,audit}/` memisahkan routes, controllers, services, domain, repositories, dto dan tests di masing-masing modul. `shared/{auth,rbac,middleware,config,db,storage}/` menampung infrastruktur yang benar-benar dipakai bersama. Urutan request: middleware sesi/izin → DTO validation → controller → application service/transaksi → domain rules → repository/storage.

Controller tidak menghitung variance/metrik atau mengatur SQL transaksi. Domain tidak bergantung Express. Repository memakai SQL parameterized dan scope; ORM tetap OD-07. UC-16 berada pada module imports; shared import framework mengatur staging/preview/commit/idempotency/lineage. Rekonsiliasi dan metrik memakai aturan satu sumber; evidence storage privat terpisah dari web root. Audit dasar dibangun sejak Sprint 1, UI UC-15 pada Sprint 3.

Endpoint dan field mengikuti DOC-09 setelah keputusan terkait disetujui. Setup ini tidak menambah route atau DTO. CF-03 evidence, CF-04 cutoff, CF-05 reuse run, CF-06 sumber, CF-07 state, CF-08 DTO menghalangi finalisasi bagian terkait.

## Kontrak, database, dan integrasi

DEV-01 adalah integrator shared contracts/API boundary; DEV-04 mengintegrasikan perubahan database. Setiap perubahan contract/schema ditinjau keduanya dan consumer frontend/backend sebelum merge. packages/contracts bukan tempat menyalin rumus bisnis atau data mitra. Migration hanya dari schema yang telah diputuskan; jangan mengubah 23 tabel PROPOSED menjadi approved secara otomatis.

Sumber: [DOC-06](../../development-docs/06_SOFTWARE_ARCHITECTURE_DESIGN.md), [DOC-07](../../development-docs/07_DATABASE_DESIGN.md), [DOC-09](../../development-docs/09_API_SPECIFICATION.md), [design.md](../../design.md). Matriks dependency: [roadmap](../../planning/roadmap/DEPENDENCY_MATRIX.md).
