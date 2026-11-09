# Strategi Pengujian dan CI

Tanggal 10 November 2026. Status: PROPOSED untuk tooling aplikasi; pemeriksa repository-only sudah disediakan. Tidak ada dependency aplikasi yang diinstal dan tidak ada tes bisnis yang telah dijalankan.

## Tooling yang direkomendasikan

| Level | Rekomendasi | Penempatan usulan | Aktivasi setelah |
| --- | --- | --- | --- |
| Vue unit/component | Vitest + Vue Test Utils v2 | apps/web/src/**/*.spec.* | Vue/Vite/runtime dipilih dan manifest tersedia |
| Backend unit/domain | Vitest dalam lingkungan Node | apps/api/src/**/*.test.* | Module API/domain nyata tersedia |
| HTTP integration | Supertest + runner yang sama | tests/integration/api/ | Express app dapat diimpor tanpa bind port global |
| PostgreSQL integration | Database test terisolasi; migration nyata | tests/integration/database/ | Versi PostgreSQL dan migrasi disetujui |
| End-to-end | Playwright Test | tests/e2e/ | Web/API dapat dijalankan dan fixture deterministik |
| Repository foundation | Python 3 standard library | scripts/check_repository.py | Tersedia sekarang; tidak memerlukan npm install |

Rekomendasi mengacu [panduan testing Vue](https://vuejs.org/guide/scaling-up/testing.html), [Vue Test Utils](https://test-utils.vuejs.org/guide/), [Vitest](https://vitest.dev/guide/), [Supertest](https://github.com/forwardemail/supertest), dan [Playwright](https://playwright.dev/docs/intro), diperiksa 10 November 2026. Versi package final dan kompatibilitas diputuskan pada OD-07; tidak memasang tool yang fungsinya tumpang tindih tanpa kebutuhan.

## Data dan isolasi

Gunakan fixture sintetis berlabel UJI. Dataset test tidak menunjuk database operasional. Uji cabang ACTUAL memakai fixture simulasi pada lingkungan terisolasi dengan penanda asal yang jelas, bukan data mitra rekaan. Pisahkan schema/database per worker bila tes paralel; reset hanya database test yang eksplisit. Jangan memakai rollback test-wrapper untuk menyembunyikan perilaku commit/konkurensi yang justru sedang diuji.

Simpan migration version, seed hash, build SHA, timezone dan command pada laporan. Semua developer menulis tes perubahan sendiri; reviewer silang memeriksa expected result. Tidak ada anggota yang hanya mengerjakan testing sementara yang lain bebas tes.

## Cakupan usulan terpisah dari 55 baseline

Register 55 test case sumber belum tersedia; jangan membuat ID baseline atau hasil PASS. Gunakan PVT-01–PVT-23 pada DOC-13 sebagai usulan, dengan pembatasan CF-03–CF-08. Checklist implementasi berikut bukan tambahan FR/NFR:

| Area | Kasus yang harus disiapkan | Sprint |
| --- | --- | --- |
| Fondasi | Build, lint/typecheck bila dikonfigurasi; API smoke; DB connection/migration | 1 |
| Auth/RBAC | Sesi invalid, role tidak berizin, akses gudang lain, direct endpoint | 1–3 |
| Impor | File invalid, referensi hilang, preview expired/stale, cancelled, duplikasi | 1–2 |
| Transaksi | Rollback tengah batch, retry identik, konkurensi key sama/berbeda | 2 |
| Inbound | Requested date tetap, INITIAL/CHANGE, parsial/final, overdue vs delay | 2 |
| Inventory | QTY AKHIR, counted false/null vs true/0, cutoff/mode/UOM berbeda | 2 |
| Rekonsiliasi | Enam status; variance hanya pasangan valid; histori tetap | 2–3 |
| Metrik/evidence | Denominator nol, eligibility, beda UOM; file 5 MiB, target sah, privacy | 3 |
| Release | Regresi, E2E, state UI, security/NFR, UAT jika reviewer tersedia, smoke | 3 |

## CI yang tersedia sekarang

Workflow `.github/workflows/repository-checks.yml` berjalan pada PR ke develop/main, push ke keduanya dan manual dispatch. Job tunggal `repository-checks` menjalankan `python3 scripts/check_repository.py --tracked`. Permissions hanya contents: read; tidak memakai secret aplikasi, tidak deploy dan tidak menjalankan kode PR melalui pull_request_target. Checkout tidak mempertahankan credential. [Referensi Actions](https://docs.github.com/en/actions/get-started/quickstart) dan [checkout](https://github.com/actions/checkout).

Pemeriksa memvalidasi struktur wajib, 19 dokumen, registry 20 branch, tanggal sprint, link lokal dengan satu pengecualian ZIP lokal, serta pola berkas/credential berisiko tanpa mencetak nilainya. Pemeriksaan tracked files harus dijalankan setelah staging; --workspace menilai calon berkas lokal sebelum Git tersedia. Pemindaian pola tidak menggantikan pemeriksaan manusia atau scanning seluruh histori.

CI remote belum dieksekusi karena Git/push terblokir. Hasil script lokal tidak membuktikan GitHub Actions lulus.

## Evolusi CI dan acceptance

Saat scaffold nyata tersedia: tambahkan dependency installation berbasis lockfile, script lint, typecheck jika TypeScript dipilih, build, unit dan integration tests. Update workflow dan manifest dalam PR yang sama; jangan memakai --if-present untuk menyamarkan ketiadaan tes wajib. PostgreSQL service hanya diaktifkan saat migrasi/tes tersedia. Tambahkan E2E setelah web/API siap dijalankan. Jangan membuat script test yang sekadar mengembalikan sukses.

Sebelum merge, semua pemeriksaan relevan harus menghasilkan bukti aktual; jika baseline atau tool belum tersedia, laporkan NOT RUN/BLOCKED. Required checks baru ditetapkan setelah job nyata berjalan dan izin contributor telah diperiksa. Target NFR numerik tetap NEEDS BASELINE; target desain tidak otomatis menjadi kebutuhan yang disahkan.
