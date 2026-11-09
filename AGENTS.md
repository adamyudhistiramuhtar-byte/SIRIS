# Repository Guidelines

## Konteks dan Teknologi

SIRIS adalah website pendamping Erasoft pada Warehouse PT Harina Chemicals Industry, dikembangkan oleh Capstone Project Kelompok 42 menggunakan metode Prototyping. Teknologi yang digunakan: Vue 3, Node.js dengan Express.js, PostgreSQL, dan REST API.

## Sumber Acuan dan Batasan Wajib

- Gunakan dokumen SRS, PRD, UML, dan business flow final sebagai sumber acuan utama (*source of truth*). Jika dokumen belum tersedia atau saling bertentangan, catat kekurangannya dan minta klarifikasi; jangan menetapkan asumsi sebagai keputusan final.
- Pertahankan baseline **16 use case, 29 FR, dan 14 NFR**, termasuk identitas, makna, dan keterkaitannya.
- Jangan menambahkan fitur atau mengubah ruang lingkup tanpa persetujuan eksplisit. Catat perubahan yang disetujui beserta dampaknya pada dokumen terkait.

## Struktur dan Dokumentasi

- Simpan seluruh dokumen development di `development-docs/`; `AGENTS.md` tetap menjadi panduan di akar repositori. `README.md`, jika ditambahkan, cukup menjadi pengantar dan penunjuk dokumentasi.
- Gunakan Bahasa Indonesia formal, jelas, dan mudah dipahami mahasiswa untuk seluruh dokumentasi.
- Dokumentasikan setiap iterasi Prototyping: kebutuhan, rancangan, implementasi prototipe, evaluasi, dan perbaikan. Terapkan keterlacakan kebutuhan, pengendalian perubahan, serta verifikasi dan validasi sesuai bukti yang tersedia.
- Jangan mengarang hasil pengujian, feedback stakeholder, atau data operasional mitra. Tandai informasi yang belum tersedia.
- Pisahkan data **ACTUAL** dan **UJI** melalui label serta penyimpanan yang jelas; jangan menyajikan data simulasi sebagai data operasional nyata.
- Saat mengerjakan dokumentasi, jangan mengubah source code aplikasi. Pertahankan konfigurasi proyek yang sudah ada.

## Pengembangan dan Gaya Kode

Repositori saat ini hanya berisi `AGENTS.md`. Dokumentasikan struktur aktual dan perintah instalasi, pengembangan, build, lint, serta pengujian di `development-docs/` setelah tooling tersedia. Jalankan hanya perintah yang dikonfigurasi.

Ikuti konvensi bahasa dan framework: indentasi konsisten, nama deskriptif, dan modul terfokus. Jangan mencampur tab dan spasi. Gunakan formatter dan linter proyek; hindari perubahan format di luar tugas.

## Pengujian dan Pemeriksaan Akhir

Framework pengujian dan ambang cakupan belum ditetapkan. Tambahkan pengujian perilaku baru dan regresi untuk perbaikan bug; gunakan nama deskriptif dan pengujian deterministik. Laporkan pemeriksaan yang dijalankan beserta hasil aktualnya, termasuk pemeriksaan yang belum dapat dilakukan.

Sebelum menyatakan selesai, periksa konsistensi istilah, aktor, alur bisnis, baseline, dan keterlacakan antardokumen. Laporkan ketidaksesuaian atau keterbatasan verifikasi yang tersisa.

## Commit, Pull Request, dan Keamanan

Riwayat Git belum tersedia. Gunakan commit terfokus dengan judul imperatif, misalnya `Perbarui panduan dokumentasi`. Pull request menjelaskan perubahan, isu terkait, validasi, serta tangkapan layar untuk perubahan antarmuka.

Jangan commit kredensial atau data privat. Gunakan nilai contoh untuk variabel lingkungan dan sesuaikan `.gitignore` dengan tooling yang digunakan.
