# Kandidat F3-1 dan urutan migrasi cutoff

22 November2026. Issue SRS-38; owner pelaksanaan tetap Dwi/Amel (akun Jira terverifikasi `dwira niameru`), Adam menyiapkan kandidat dan pengujian atas instruksi PM. Status: **KANDIDAT REVIEW UJI**, menunggu jawaban paket keputusan PM; tidak mengesahkan ACTUAL.

Migrasi dasar PR#15 pada e56d73e telah diperiksa dan di-merge menjadi d1acfb4. F3-1 bukan prasyarat merge001–003. Urutan teknis yang disiapkan:004_audit_lineage.sql pada SRS-49/PR#22;005_cutoff_time_nullable.sql pada SRS-38, branch feature/SRS-38-cutoff-time-nullable;006 untuk staging SRS-50. Nomor004 yang telah diuji tidak diganti tanpa inventaris instance dan review Dwi. Lingkungan anggota lain belum diperiksa langsung; bukti yang tersedia menunjukkan001–003 pernah dipakai pada UJI owner dan001–004 pada schema UJI reviewer/CI. Tidak ada asumsi semua database kosong.

005 hanya melepas NOT NULL dari cutoff_time setelah memeriksa bentuk schema. NULL menyatakan tanggal-saja pada kontrak kandidat; tidak menambahkan jam, mengubah baris lama atau mengonversi00:00. DDL berlaku pada kolom bersama; izin operasional ACTUAL tetap ditolak oleh baseline akses. Tidak ada perubahan status OPEN/SIMULATED, precision eksplisit, timezone, basis efektif, unique key atau kewenangan VERIFIED. Keputusan itu terpisah pada PR#14/D-01–D-06.

Tes pada tests/integration/database/cutoff-nullable.test.ts memeriksa insertNULL, upgrade berisi data termasuk00:00, pelestarian seluruh row, reapply, schema tidak dikenal ditolak atomik, serta pemulihan. Hasil aktual dicatat sesudah eksekusi; tidak ada pengujian database mitra yang diklaim.

Pemulihan: hentikan penulis data, inventaris barisNULL dan versi aplikasi, ambil backup yang disepakati. Bila NULL masih ada, pertahankan schema nullable dan gunakan roll-forward; jangan isi00:00 atau hapus baris. Bukti waktu sumber yang sah atau pemulihan backup konsisten diperlukan sebelum menjalankan database/migrations/recovery/005_restore_cutoff_time_required.sql. Script menolak pemulihan bila adaNULL dan tidak memodifikasi data. Script recovery tidak ikut runner migrasi maju.

API/UI harus menampilkan tanggal-saja tanpa jam dan tidak menukar tanggal cetak laporan dengan basis efektif. Test rekonsiliasi harus tetap menolak pasangan tanpa konteks/bukti basis yang sah; cutoff_id identik adalah syarat perlu. F3-1 tidak membuka eksekusi rekonsiliasi atau bukti UC-11 yang masih ditahan.
