# Pembagian tugas dan workload Sprint 1

Snapshot diverifikasi langsung dari Jira pada 10 November 2026 pukul 16.28 WIB. Sprint: **SIRIS — Sprint 1: Fondasi dan Prototype Awal**, ID 1, aktif; jadwal 9–15 November 2026, Asia/Jakarta. Nilai di bawah adalah snapshot, bukan pembaruan otomatis Jira. Link issue membuka acceptance criteria dan uraian lengkap.

## Beban terverifikasi

| Anggota | Spesialisasi | Issue utama | Story Points aktual |
| --- | --- | ---: | ---: |
| Adam Yudhistira Muhtar | Frontend, integrasi dan koordinasi | 7 | 21 |
| Vassell Enha Atthayya | Frontend, UI/UX dan pengujian bersama | 7 | 20 |
| Luthfi (akun Jira: luthfirafif) | Backend, API, authentication dan authorization | 6 | 21 |
| Dwi (akun Jira: dwiraniameruu) | Backend, PostgreSQL dan data integrity | 5 | 21 |
| **Total** | | **25** | **83** |

Story Points bukan jam kerja. Selisih 1 SP tidak membuktikan kapasitas sprint realistis; ketersediaan aktual anggota, review, keputusan sumber, kapasitas testing dan blocker belum diukur. Pembagian artefak akademik sebelumnya tetap berlaku; identitas Anggota 2–4 tidak diasumsikan dari nomor.

## Issue utama berdasarkan hasil pembacaan Jira

| Issue | Ringkasan | SP | Assignee aktual | Status | Diblokir oleh link Jira |
| --- | --- | ---: | --- | --- | --- |
| [SRS-16](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-16) | Mengimpor referensi inbound melalui alur utuh pertama | 5 | Adam Yudhistira Muhtar | To Do | SRS-52, SRS-53 |
| [SRS-25](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-25) | Mengimpor saldo stok dasar dari QTY AKHIR | 5 | Vassell Enha Atthayya | To Do | SRS-38, SRS-52, SRS-53 |
| [SRS-35](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-35) | Memulihkan sumber baseline dan memetakan kebutuhan asli | 3 | Adam Yudhistira Muhtar | In Progress | Tidak ada link blocker |
| [SRS-36](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-36) | Menetapkan matriks izin peran, aksi, dan gudang | 2 | luthfirafif | To Do | Tidak ada link blocker |
| [SRS-37](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-37) | Menetapkan kontrak sumber dan pemetaan lima jenis impor | 3 | dwiraniameruu | To Do | Tidak ada link blocker |
| [SRS-38](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-38) | Menyelesaikan konflik cutoff, evidence, dan identitas hasil | 3 | dwiraniameruu | To Do | Tidak ada link blocker |
| [SRS-39](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-39) | Menetapkan finalisasi inbound dan definisi metrik | 3 | Adam Yudhistira Muhtar | To Do | Tidak ada link blocker |
| [SRS-40](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-40) | Menetapkan tooling, autentikasi, dan lingkungan rilis | 2 | Adam Yudhistira Muhtar | In Progress | Tidak ada link blocker |
| [SRS-41](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-41) | Menyiapkan repository, branching, dan CI awal | 3 | Adam Yudhistira Muhtar | In Progress | SRS-40 |
| [SRS-42](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-42) | Menyiapkan aplikasi Vue 3 dan adapter API | 2 | Adam Yudhistira Muhtar | To Do | SRS-41 |
| [SRS-43](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-43) | Menyiapkan layanan Express dan kontrak error | 3 | luthfirafif | To Do | SRS-41 |
| [SRS-44](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-44) | Menyiapkan migrasi referensi dan pemisahan ACTUAL/UJI | 5 | dwiraniameruu | To Do | SRS-37, SRS-41 |
| [SRS-45](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-45) | Menerapkan token dan komponen dasar antarmuka | 3 | Vassell Enha Atthayya | To Do | SRS-42 |
| [SRS-46](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-46) | Membangun layout, konteks, dan routing berbasis peran | 3 | Vassell Enha Atthayya | To Do | SRS-36, SRS-45 |
| [SRS-47](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-47) | Menerapkan autentikasi dan pengelolaan sesi | 5 | luthfirafif | To Do | SRS-36, SRS-43, SRS-44 |
| [SRS-48](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-48) | Menerapkan otorisasi peran, gudang, dan objek | 3 | luthfirafif | To Do | SRS-47 |
| [SRS-49](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-49) | Membangun audit dasar dan referensi lineage | 3 | luthfirafif | To Do | SRS-43, SRS-44 |
| [SRS-50](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-50) | Membangun staging dan normalisasi sumber | 5 | dwiraniameruu | To Do | SRS-48, SRS-49 |
| [SRS-51](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-51) | Membangun fondasi UC-16 dan preview tervalidasi | 5 | luthfirafif | To Do | SRS-50 |
| [SRS-52](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-52) | Membangun commit atomik, pembatalan, dan idempotency | 5 | dwiraniameruu | To Do | SRS-51 |
| [SRS-53](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-53) | Membangun komponen alur impor bersama | 3 | Vassell Enha Atthayya | To Do | SRS-46 |
| [SRS-54](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-54) | Menyiapkan test harness dan fixture lintas peran | 3 | Vassell Enha Atthayya | To Do | SRS-43, SRS-44 |
| [SRS-55](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-55) | Memverifikasi fondasi dan alur impor pertama | 3 | Adam Yudhistira Muhtar | To Do | SRS-54, SRS-16, SRS-25 |
| [SRS-56](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-56) | Menguji rendering, routing, dan komponen impor | 2 | Vassell Enha Atthayya | To Do | SRS-54, SRS-16, SRS-25 |
| [SRS-57](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-57) | Mencatat evaluasi IT-01 dan perbaikan yang disetujui | 1 | Vassell Enha Atthayya | To Do | SRS-55, SRS-56 |

Subtask [SRS-82](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-82), parent SRS-16, ditugaskan kepada Adam; [SRS-83](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-83), parent SRS-25, kepada Vassell. Keduanya To Do. Field estimasi subtask kosong pada pembacaan Jira; deskripsinya menyatakan usulan 0 SP sudah termasuk parent. Tidak ditambahkan ke total 83 SP.

## Koordinasi dan kesiapan

- Adam–Luthfi: integrasi UI/API dan authentication; Adam–Dwi: kontrak data inbound dan integrasi.
- Vassell–Dwi: UI impor stok, preview dan cutoff; Vassell–Luthfi: komponen impor, validasi, error dan routing role.
- Setiap pemilik menguji kodenya sendiri; SRS-54 dikoordinasikan Vassell sebagai pekerjaan QA bersama. Reviewer dalam CSV hanyalah **usulan**, bukan assignment atau bukti review; reviewer tidak boleh menyetujui PR sendiri.
- Adam dapat melanjutkan SRS-35 dan SRS-40 serta mengkaji SRS-39; Luthfi dapat memulai analisis SRS-36; Dwi dapat memulai analisis SRS-37 dan SRS-38. Ketersediaan sumber dan otorisasi keputusan tetap prasyarat. Vassell dapat melakukan review/desain persiapan dan membantu testing tanpa menyatakan issue yang memiliki blocker siap diimplementasikan.
- SRS-40 memblokir SRS-41; SRS-41 memblokir SRS-42/43 dan bersama SRS-37 memblokir SRS-44. Jalur backend/data SRS-43/44 → SRS-47/49 → SRS-48/50 → SRS-51/52 dan jalur frontend SRS-42/45/46/53 bertemu pada kedua Story, lalu SRS-55/56 dan SRS-57. Diagram ini merupakan ringkasan; field dependency Jira pada tabel tetap acuan.
- SRS-35, SRS-40, dan SRS-41 memiliki PR #3, #5, dan #4 yang masih memerlukan review. Branch issue berikutnya perlu dibuat dari develop setelah dependency dan baseline siap; penamaan usulan `feature/SRS-<nomor>-<deskripsi>` atau `docs/SRS-<nomor>-<deskripsi>` bukan klaim branch tersebut sudah ada.

## Batas verifikasi

Assignee, status, SP, Sprint, prioritas, label, parent dan link dependency dibandingkan dengan snapshot sebelum perubahan; tidak ada perubahan pada field selain assignee. Tidak ada transisi status atau perubahan Story Points. Tabel kontributor dan reviewer adalah rencana koordinasi; alokasi Jira tidak mengubah kepemilikan artefak akademik. CSV [SPRINT_01_WORKLOAD.csv](SPRINT_01_WORKLOAD.csv) berisi rincian snapshot yang sama, termasuk parent dan referensi acceptance criteria.
