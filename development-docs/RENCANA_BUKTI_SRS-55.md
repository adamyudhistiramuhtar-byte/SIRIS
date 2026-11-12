# Persiapan bukti verifikasi fondasi dan impor — SRS-55

Status: **DRAFT — PENGUJIAN INTEGRASI MENUNGGU DEPENDENCY**. Tanggal pemeriksaan: 10 November 2026. Issue: [SRS-55](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-55), Sprint 1.

Dokumen ini menyiapkan pengumpulan bukti untuk irisan UC-01 dan UC-09 serta validasi UC-16; tidak menyatakan use case lengkap telah diuji. Lingkup, acceptance criteria dan Definition of Done mengacu pada issue SRS-55 dan [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md). SRS-54, SRS-16 dan SRS-25 masih To Do pada saat pemeriksaan. Test harness lintas peran merupakan tanggung jawab SRS-54; dokumen ini tidak menggantikannya.

## Bukti yang sudah tersedia

| Pemeriksaan | Versi, data dan hasil | Batas |
| --- | --- | --- |
| Fondasi repository dan aplikasi | Pada tree commit `3b5888f` PR #4, `npm ci --offline`, lint, typecheck, build, repository checks dan whitespace lulus. `npm test` dengan izin localhost menghasilkan 13 test lulus. | Ini pemeriksaan scaffold, bukan pengujian lengkap SRS-55. Test DB melaporkan `DATABASE_URL_NOT_CONFIGURED`; tidak membuktikan PostgreSQL berjalan. |
| CI fondasi | [GitHub Actions PR #4](https://github.com/adamyudhistiramuhtar-byte/SIRIS/actions/runs/42774205363) melaporkan application-ci dan repository-checks berhasil. | Hasil pada commit tersebut; bukan bukti review, migration runtime atau acceptance bisnis. |

## Matriks skenario yang harus diverifikasi

ID pada tabel adalah **label kerja SRS-55**, bukan 55 ID pengujian baseline yang masih SOURCE REQUIRED. Dataset berikut harus seluruhnya fixture **UJI** terisolasi dan diberi versi/hash saat dieksekusi. Hasil berikut merupakan status persiapan saat dokumen dibuat, bukan hasil eksekusi pengujian baru.

| ID kerja | Cakupan / sumber | Dataset UJI dan hasil yang harus diamati | Status aktual | Prasyarat dan bukti yang diperlukan |
| --- | --- | --- | --- | --- |
| S55-01 | Repository: lint, typecheck, build, CI; SRS-41 | Commit integrasi terpilih; seluruh perintah yang dikonfigurasi selesai dan hasil dicatat | NOT RUN untuk commit integrasi | Commit/build hash dan log CI pada versi yang sama |
| S55-02 | Frontend: bootstrap, routing, integrasi API dan error; SRS-42 | Response UJI sah, kosong dan error; UI membedakan hasil serta tidak mengklaim sukses saat hasil tidak diketahui | BLOCKED | SRS-41/42 dan harness SRS-54; hasil component/integration beserta versi |
| S55-03 | UC-01: upload, preview, konfirmasi, cancellation; SRS-16/82 | File EXPECTED UJI sah dan invalid; status ditentukan API; tanpa file tidak siap validasi | BLOCKED | SRS-16, SRS-52/53/54; kontrak sumber/CF-06 ditinjau; fixture dan bukti per hasil |
| S55-04 | UC-09: impor stok; SRS-25 | File STOCK UJI yang disahkan; saldo sesuai QTY AKHIR tanpa menghitung ulang movement | BLOCKED | SRS-25, SRS-54; kontrak sumber dan cutoff ditinjau |
| S55-05 | UC-16: validasi, warning dan expiry; DOC-13 | Batch UJI valid, invalid dan expired; invalid/expired tidak menghasilkan commit | BLOCKED | SRS-16/25/54 dan implementasi validasi tersedia |
| S55-06 | Authentication/authorization dan scope; DOC-05/13 | Akun dan gudang UJI yang diizinkan serta ditolak; request tidak sah ditolak sesuai aturan yang disepakati | BLOCKED | SRS-54, matriks izin disahkan dan layanan terkait tersedia |
| S55-07 | Transaksi, rollback dan idempotency; DOC-13 | Batch UJI; injeksi kegagalan tidak meninggalkan domain parsial; retry yang identik tidak menggandakan hasil sesuai kontrak | BLOCKED | SRS-52/54 dan DB terisolasi; bukti sebelum/sesudah dan correlation ID |
| S55-08 | PostgreSQL: koneksi, migrasi, persistence, pemisahan mode | Database dan role UJI terisolasi; uji koneksi nyata, migrasi, persistensi dan isolasi berdasarkan kontrak yang disahkan | BLOCKED | PostgreSQL nyata, migrasi SRS-44 dan fixture/harness SRS-54; test koneksi gagal bukan bukti DB lulus |
| S55-09 | E2E irisan UC-01/UC-09 dengan UC-16 | Dataset UJI berversi; jalankan alur sah dari UI sampai data tersimpan dan verifikasi lineage | BLOCKED | SRS-16, SRS-25, SRS-54 dan layanan terintegrasi; bukan bukti seluruh UC selesai |

Untuk setiap pelaksanaan catat: ID kerja atau ID baseline yang benar-benar tersedia, issue terkait, commit/build dan versi schema, lingkungan, dataset dan hash, pelaksana/waktu, hasil yang diharapkan dan aktual, status PASS/FAIL/BLOCKED/NOT RUN, lokasi bukti serta referensi defect bila ada. `BLOCKED` di atas berarti prasyarat pelaksanaan yang diidentifikasi belum tersedia, bukan kegagalan pengujian aplikasi.

## Batas dan penutupan

Jangan membuat hasil, defect atau persetujuan stakeholder. Jangan menguji data operasional nyata sebagai UJI. Setelah dependency tersedia, tinjau kembali kontrak dan sumber, jalankan pengujian pada build yang sama, periksa hasil gagal dan regresi, lalu minta review independen. Coverage 55 spesifikasi pengujian asli dan FR/NFR tidak dapat diklaim sebelum sumber final tersedia.
