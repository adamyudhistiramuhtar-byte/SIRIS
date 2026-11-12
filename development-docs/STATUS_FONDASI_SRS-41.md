# Status fondasi dan verifikasi SRS-41

Pemeriksaan: 10 November 2026, Asia/Jakarta. Status: **IN PROGRESS — NEEDS REVIEW**. Dokumen ini adalah catatan bukti untuk [SRS-41](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-41), bukan penerimaan aplikasi atau persetujuan arsitektur. Status Jira dapat berubah; periksa ulang sebelum tindakan berikutnya.

## Baseline dan kolaborasi

Pemeriksaan remote membaca `main` pada `3b17306` dan `develop` pada `ea6dd9c`. Commit scaffold `74b79ab` terdapat di main; develop merupakan ancestor main dan belum memuat scaffold tersebut. [PR #4](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/4) dari `chore/SRS-41-reconcile-main-develop` ke develop masih draft, belum merge, dan belum mempunyai review formal pada saat diperiksa. SRS-41 diblokir oleh SRS-40 yang masih In Progress. Jangan merge sampai dependency, review independen dan quality gate terpenuhi.

Pada pemeriksaan `git ls-remote --heads origin`, seluruh 22 branch awal (main, develop, 16 branch UC, dan 4 branch teknis) ada; branch SRS-35 dan SRS-41 juga ada. Branch UC dan tiga branch teknis lain masih menunjuk ke `4dbc74f`; branch fondasi menunjuk ke `74b79ab`. Keberadaan remote ref tidak membuktikan tidak ada pekerjaan yang belum dipush oleh anggota. Branch yang ada tidak di-reset, dihapus atau di-force-push.

Pemeriksaan GitHub API terhadap main dan develop mengembalikan `protected: false` pada saat pemeriksaan. Kebijakan kerja yang mewajibkan review dan CI tetap harus dilaksanakan secara manual; penerapan atau perubahan protection memerlukan keputusan dan hak akses yang sesuai. Prosedur ada pada [workflow Git](../docs/implementation/GIT_WORKFLOW.md).

## Struktur dan perintah pada snapshot scaffold

Struktur ini tersedia pada `main` dan head PR #4, belum pada `develop` saat pemeriksaan: `apps/web` berisi frontend, `apps/api` backend, `packages/contracts` kontrak bersama, `database` migrasi/seed dan fixture UJI, `tests/integration` pengujian integrasi, `development-docs` dokumentasi, serta `.github/workflows` konfigurasi CI. Snapshot ini menggunakan npm workspaces dan lockfile.

Pada worktree yang sudah memuat scaffold, perintah berikut tersedia dalam manifest:

```sh
npm ci
npm run dev
npm run dev:api
npm run lint
npm run typecheck
npm run build
npm test
npm run check:repo
```

Node 24.21.0 dan npm 11.19.0 digunakan pada pengujian lokal yang dicatat di bawah; CI dikonfigurasi memakai Node 22. Versi runtime resmi masih OD-07, bukan keputusan yang telah disahkan. Untuk konfigurasi lokal, gunakan `.env.example` sebagai referensi tanpa memasukkan secret ke Git. **Jangan menganggap salinan template langsung dapat menjalankan API:** `PORT` dan `LOG_LEVEL` kosong dapat gagal validasi. Koreksi konfigurasi runtime dan pengujiannya merupakan tindak lanjut SRS-43; lihat [panduan database](../database/README.md) untuk perintah migrasi dan batas verifikasi DB.

## Matriks verifikasi

| Kriteria / aspek | Bukti dan metode | Hasil / reviewer | Gap tersisa |
| --- | --- | --- | --- |
| README mengarah ke dokumentasi | Tautan README dan pemeriksa repository | Tersedia untuk review; reviewer independen belum ada | Review perubahan dokumentasi pada head PR terbaru |
| Branch, PR, review | Registry branch, remote refs, PR #4 dan API review | 22 branch awal ada; PR draft; review formal belum tercatat | Reviewer lain, dependency SRS-40 dan merge sesuai workflow |
| CI memakai script manifest | `.github/workflows/repository-checks.yml` dan `package.json` pada scaffold | npm ci, lint, typecheck, build dan test dikonfigurasi; [run pada 3b17306](https://github.com/adamyudhistiramuhtar-byte/SIRIS/actions/runs/42766659535) sukses | CI wajib diperiksa kembali pada commit terbaru PR |
| Verifikasi aplikasi pada `3b17306` | Node 24.21.0/npm 11.19.0: npm ci, lint, typecheck, build, test | Lint/typecheck/build lulus. Test awal sandbox: 6 gagal `listen EPERM`; ulang dengan izin localhost: 13 test lulus | Pengujian ulang diperlukan untuk head terbaru; bukan bukti acceptance bisnis |
| Koneksi dan migrasi PostgreSQL | Test koneksi pada scaffold dan pemeriksaan port lokal 5432 | Test melaporkan `DATABASE_URL_NOT_CONFIGURED` dan lulus untuk penanganan error; port menolak koneksi | Runtime PostgreSQL, migrasi, reapply dan role non-superuser belum diuji; handoff SRS-44 |
| Pemisahan ACTUAL/UJI | Review migration, seed dan fixture | Fixture/seed berlabel UJI dan kolom mode ada | Isolasi end-to-end belum dibuktikan; SRS-44 |
| Secret dan data mitra | `.gitignore`, template environment dan `scripts/check_repository.py` | Scanner memeriksa pola terbatas dan path tracked; template diperiksa tanpa mempublikasikan nilai | Scanner bukan audit menyeluruh atas semantik, seluruh histori, atau secret provider; review independen tetap diperlukan |
| Kontrak dan integrasi | Scaffold shared contracts, health test, review gap | Fondasi tersedia; bukan bukti seluruh DTO dan acceptance | Konfigurasi startup, URL API, logging, error handling dan referensi database perlu ditangani pada issue terkait setelah dependency terpenuhi |
| Definition of Done | Issue SRS-41 dan PR #4 | Belum terpenuhi | Review oleh orang lain, dependency, integrasi dan PR merged, serta verifikasi kontrak dan dokumentasi |

Tidak ada review independen atau persetujuan stakeholder yang diklaim. Jumlah tes runner yang lulus tidak membuktikan koneksi database, keamanan menyeluruh, UAT, atau seluruh requirement bisnis.

## Tindakan lanjutan

1. Selesaikan SRS-40 dan keputusan yang menjadi dependency; jangan mengubah status dependency secara sepihak.
2. Tinjau diff PR #4 dan dokumen dengan reviewer lain; jalankan kembali seluruh CI pada head final dan selesaikan konflik jika muncul.
3. Verifikasi integrasi, secret/data privat serta kontrak yang relevan. Tindak lanjuti gap frontend, backend dan database pada SRS-42–SRS-44 setelah prasyarat terpenuhi.
4. Hanya setelah quality gate terpenuhi, integrasikan PR ke develop sesuai workflow dan konfirmasikan hasil GitHub sebelum memperbarui status Jira.
