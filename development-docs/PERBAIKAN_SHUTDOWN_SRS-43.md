# Perbaikan jalur kegagalan shutdown SRS-43

20 November 2026, Adam. Kebutuhan: AC SRS-43, DOC-16 (log tanpa secret), pemeriksaan failure-path PR #18. Baseline `af574ae`; tidak mengubah UC/FR/NFR atau kontrak domain.

Reproduksi reviewer pada HEAD asli menggunakan mock pool yang menolak dengan Error bernama sentinel sintetis: proses meminta `exit(0)` dan log memuat nama error sentinel. Kedua assertion gagal. Sentinel bukan credential nyata. Koneksi UJI nyata pada HEAD asli juga diuji: `db:check` PASS (5 ms); suite existing Node22 PASS 103/103, tetapi suite itu tidak menguji shutdown.

Perbaikan mengekstrak lifecycle ke `apps/api/src/shared/shutdown.ts`: penolakan pool/HTTP menghasilkan exit1, log menggunakan pesan konstan, timeout tetap 10 detik, sinyal berulang tidak menutup dua kali, deadline dibersihkan dan penyelesaian terlambat tidak mengirim exit kedua. Identitas error, message dan stack tidak dicatat. Server memakai handler tersebut untuk SIGINT/SIGTERM.

Evaluasi kandidat pada Node22.22.2: enam tes regresi shutdown PASS (sukses, sinyal berulang, pool rejection/redaksi, HTTP callback error, exception sinkron, timeout dan penyelesaian terlambat); suite penuh 109/109 PASS dengan koneksi PostgreSQL16.6 UJI. Role runtime/migrator terpisah; credential di luar Git. Hasil lint/typecheck/build dicatat pada PR setelah selesai. Ini bukan hasil stakeholder atau bukti endpoint bisnis.

Lint, typecheck dan build kandidat PASS pada Node22.22.2; repository workspace checks PASS (0 temuan), whitespace PASS. Perbaikan diajukan ke branch pemilik PR #18, sehingga Luthfi dapat meninjau dan mengintegrasikannya tanpa perubahan paksa pada branch beliau. Reviewer lain wajib memeriksa kandidat sebelum merge; approval lama PR #18 tidak mengesahkan kode perbaikan yang ditulis Adam. PR #18 belum siap merge sampai perbaikan dan review independen selesai. Integrasi migrasi dan domain tetap mengikuti issue terkait.
