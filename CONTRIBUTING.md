# Panduan Kontribusi SIRIS

## Sebelum mulai

Baca AGENTS.md, design.md, 19 development documents dan readiness. Keputusan yang berstatus PROPOSED, OPEN DECISION atau SOURCE REQUIRED tidak berubah menjadi approved karena tercantum di repository. Struktur planning/ dan docs/implementation/ dibuat atas instruksi MASTER PROMPT 02; aturan lokasi ini melengkapi panduan lama tanpa memindahkan dokumen asal.

## Branch dan pull request

Gunakan branch tugas pada [registry](scripts/branches.json). Feature/chore/fix menargetkan `develop`; PR integrasi yang sudah ditinjau menargetkan `main`. Jangan commit fitur rutin langsung ke main. Branch pre-created belum berisi implementasi dan harus diperiksa ulang terhadap develop sebelum tugas dimulai. Jangan rebase atau force-push branch bersama.

Periksa working tree bersih, fetch remote, lalu sinkronkan secara fast-forward jika memungkinkan. Jika divergen, koordinasikan merge develop melalui review; jangan reset, hapus branch atau memaksa merge histori tak berhubungan. Detail pemulihan setup ada pada [workflow](docs/implementation/GIT_WORKFLOW.md).

## Commit

Gunakan `type(scope): description` dengan type `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, atau `ci`. Tulis deskripsi singkat yang menjelaskan tindakan.

```text
feat(inbound): implement receiving import
fix(auth): correct warehouse permission check
test(import): cover duplicate submission
docs(api): update import contract
```

Jira key belum tersedia. Cantumkan UC dan key asli ketika sudah diketahui di commit/PR; jangan memakai key contoh sebagai tiket nyata atau membuat branch duplikat hanya karena tiket telah tersedia.

## Review dan Definition of Done

- PR kecil dan terfokus; jelaskan masalah, perubahan, UC/BR/sumber, dependency, serta risiko.
- Minimal satu rekan di luar penulis meninjau; semua percakapan penting diselesaikan.
- Setiap developer menulis tes untuk perubahan sendiri. Laporkan command, versi dan hasil aktual; tes belum tersedia tetap NOT RUN.
- Periksa kontrak data, role/gudang, ACTUAL/UJI, error/empty/loading, lineage, atomicity dan idempotency sesuai perubahan.
- Perubahan schema/kontrak membutuhkan review owner database/shared contracts dan analisis dampak. Jangan mengarang endpoint atau field baru.
- Screenshot hanya dari UJI dan diperlukan bila tampilan berubah; tidak menyertakan data mitra.
- Merge feature menggunakan squash untuk unit perubahan terfokus; PR develop → main dapat memakai merge commit agar ancestry integrasi tetap jelas. Kebijakan ini usulan sampai permission repo diperiksa.

## Gaya kode dan keamanan

Gunakan UTF-8/LF dan spasi sesuai .editorconfig. Penamaan Vue component PascalCase, fungsi/variabel JavaScript camelCase, modul berdasarkan feature; formatter/linter dipilih pada scaffold setelah dependency disepakati. Business logic berada di domain/service, bukan controller atau komponen UI.

Jangan commit credential, .env, file raw mitra, dump, staging atau storage privat. `.gitignore` tidak menghapus berkas yang sudah tracked. Tinjau `git diff --cached --stat`, daftar file dan konten secara lokal sebelum commit. Jika secret sudah masuk histori, hentikan push dan koordinasikan rotasi serta penanganan histori; jangan force-push sendiri.

Pemeriksaan tersedia: `python3 scripts/check_repository.py --workspace`. Setelah Git tersedia, gunakan `--tracked` untuk menilai kandidat commit. Pemeriksa pola bukan bukti tidak adanya semua jenis informasi rahasia.
