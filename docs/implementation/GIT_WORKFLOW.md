# Workflow Git untuk Empat Developer

Versi 1.0 — 10 November 2026 — Asia/Jakarta. Prosedur ini adalah rencana kerja; status eksekusi aktual ada di readiness. Remote target: `https://github.com/adamyudhistiramuhtar-byte/SIRIS.git`.

## Alur branch

`feature/*`, `chore/*`, `fix/*` → PR/review/tes → `develop` → PR integrasi/review → `main`.

Main menyimpan baseline stabil yang telah ditinjau; pada fase awal, baseline repository belum berarti produk siap rilis. Develop adalah integrasi prototipe. Jangan membuat release/hotfix/fix kosong. Jangan merge branch kosong untuk menandai setup selesai. Dua puluh branch awal boleh memiliki commit dasar sama setelah develop diverifikasi.

[Registry branch](../../scripts/branches.json) berisi nama, tujuan, owner usulan dan reviewer. Nama UC dipertahankan ketika Jira key asli datang; hubungkan tiket di PR. Nama developer masih placeholder, bukan akun GitHub nyata.

## Pemeriksaan sebelum publikasi awal

1. Verifikasi identitas commit yang diberikan pemilik; konfigurasi lokal repository, bukan global.
2. Verifikasi autentikasi GitHub, permission, visibilitas, default branch, seluruh remote refs dan histori. Kegagalan DNS/401/404 bukan bukti repo kosong.
3. Periksa [publish review](PUBLISH_REVIEW.md), diff dan seluruh tracked history; file yang belum terklasifikasi menghentikan push terkait.
4. Jika remote benar-benar kosong, baru initialize `main`, tambahkan origin tepat, stage daftar berkas yang ditinjau, commit `chore(repo): initialize SIRIS development repository`, dan push main tanpa force.
5. Jika remote memiliki histori, fetch dahulu dan periksa ancestry. Gunakan baseline remote yang sah; backup/preservasi berkas lokal dan integrasikan melalui perubahan terfokus. Jangan memakai allow-unrelated-histories otomatis atau reset untuk memaksa kecocokan.
6. Setelah main terverifikasi, buat develop jika tidak ada; jika develop remote sudah ada, pertahankan commitnya. Review isi/keamanan baseline itu, lalu catat SHA develop yang dipakai.
7. Untuk tiap branch registry: jika remote ada, gunakan tracking tanpa menggeser ref; jika lokal ada, bandingkan dan pertahankan; jika keduanya tidak ada, buat dari develop yang diverifikasi, push branch spesifik dan set upstream.
8. Bandingkan SHA `refs/heads/*` remote dengan local refs. Jangan memakai `push --all` pada repository yang belum ditinjau seluruh branch-nya.

Tahap di atas belum dijalankan sampai selesai pada sesi ini: .git tidak dapat ditulis dan remote tidak dapat diakses. Tidak ada alternatif git-dir di luar workspace untuk melewati pembatasan.

## Sebelum mengerjakan feature

Sesudah setup berhasil, gunakan pemeriksaan berikut; ini prosedur pemulihan, bukan bukti command telah dijalankan:

```sh
git status --short --branch
git remote -v
git fetch origin
git branch -vv
git log --oneline --graph --decorate --all -20
```

Jika working tree bersih, switch ke branch tugas dan bandingkan `git log --left-right --oneline HEAD...origin/develop`. Bila branch belum memiliki perubahan sendiri, `git merge --ff-only origin/develop` dapat memperbarui baseline. Bila branch bersama sudah divergen, koordinasikan merge develop tanpa rewrite histori; bila konflik sumber/baseline belum jelas, hentikan integrasi dan catat masalah. Jangan otomatis rebase pekerjaan developer lain.

## Review dan merge

Owner mengirim PR ke develop; reviewer silang memeriksa kontrak, tes dan keamanan. Integrasikan kecil dan sering, idealnya tiap hari kerja bila perubahan sudah memenuhi DoD. Setelah merge, owner modul membantu pengecekan gabungan. Jangan menghapus branch otomatis; penghapusan tidak termasuk tugas setup ini.

Sebelum PR develop → main: jalankan tes relevan pada SHA kandidat, tinjau defect/known limitation, pastikan dokumen akurat dan release smoke test tersedia. Tidak ada deployment produksi otomatis.

## Branch protection yang direkomendasikan

Setelah permission dan check nyata tersedia, tinjau aturan main/develop: wajib PR, satu approval dari rekan, penyelesaian percakapan, larangan force push/deletion, dan required check yang benar-benar pernah berjalan. Mulai dari check `repository-checks`; tambahkan build/lint/typecheck/tes setelah script nyata tersedia. Jangan mengaktifkan code-owner approval tanpa owner nyata atau check yang tidak pernah dilaporkan.

Protection belum diaktifkan; ketersediaannya bergantung visibilitas dan paket GitHub. Rujukan: [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
