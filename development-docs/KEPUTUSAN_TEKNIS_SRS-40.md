# Register keputusan teknis dan lingkungan — SRS-40

Status: **DRAFT — NEEDS REVIEW**; tanggal: 10 November 2026. Issue: [SRS-40](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-40), parent SRS-4; SRS-41 memiliki dependency terhadap SRS-40.

Dokumen ini mencatat hasil inventaris dan opsi untuk ditinjau. `ACCEPTED` berarti ada bukti persetujuan spesifik; `PROPOSED` berarti rekomendasi yang belum disetujui; `OPEN` berarti belum ada pilihan final. Fakta konfigurasi yang ada tidak dengan sendirinya merupakan persetujuan standar produksi. Tidak ada ADR di bawah yang ditandai ACCEPTED tanpa bukti persetujuan.

## Sumber, versi, dan cakupan pemeriksaan

| Sumber | Versi atau snapshot | Kegunaan dan batas |
| --- | --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | 0.2.0, NEEDS REVIEW | OD-07, OD-08, OD-09; 29 FR dan 14 NFR asli masih SOURCE REQUIRED. |
| [DOC-05](05_BUSINESS_RULES_RBAC.md), [DOC-06](06_SOFTWARE_ARCHITECTURE_DESIGN.md), [DOC-09](09_API_SPECIFICATION.md), [DOC-16](16_SECURITY_RISK_NFR.md) | 0.2.0, NEEDS REVIEW | Usulan RBAC, sesi, API, dan kontrol keamanan; bukan persetujuan final. |
| [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md), [DOC-17](17_DEPLOYMENT_OPERATIONAL_GUIDE.md) | 0.2.0, NEEDS REVIEW | Usulan format sumber, staging, rollback, environment, dan rilis. |
| `AGENTS.md` | Snapshot develop `ea6dd9c` | Stack proyek, sumber baseline dan pemisahan ACTUAL/UJI. |
| Repository scaffold | Commit `74b79ab`, juga pada main `3b17306` melalui PR #2; belum pada develop snapshot di atas | Manifest, lockfile, konfigurasi dan implementasi aktual yang diperiksa. Perubahan scaffold sedang diajukan kembali melalui [PR #4](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/4). |

Sumber final, keputusan stakeholder, versi PostgreSQL, kebijakan retensi, target deployment dan NFR asli belum tersedia atau belum terbukti disetujui. DOC-17 ditulis sebelum scaffold dan sejumlah pernyataan bahwa manifest/script belum ada tidak menggambarkan snapshot scaffold; jangan menganggapnya sebagai kondisi saat ini pada main maupun persetujuan produksi.

## Matriks konfigurasi tooling

| Area | Bukti konfigurasi pada scaffold | Status dan batas |
| --- | --- | --- |
| Node/npm | Workflow `repository-checks.yml` memakai Node 22 dan `npm ci`; README menyebut Node >=20. Manifest root belum menetapkan `engines` atau `packageManager`. | OPEN: versi yang didukung dan npm baku perlu disepakati; Node 22 adalah konfigurasi CI, bukan keputusan produksi. |
| Package manager | Root `package.json` menggunakan npm workspaces; `package-lock.json` tersedia. | Implementasi ada pada scaffold; persetujuan kebijakan lockfile dan pembaruan dependency belum ditemukan. |
| TypeScript, lint, format | Manifest mendeklarasikan TypeScript, ESLint 9 dan Prettier 3; lint/typecheck/build tersedia sebagai script. | Versi manifest berupa rentang; lockfile merekam resolusi. Formatter tersedia, bukan bukti semua file telah diformat. |
| Web/API | Manifest web mendeklarasikan Vue 3, Vite 6, Tailwind 3; API mendeklarasikan Express 4 dan `pg` 8; kontrak bersama dalam workspace. | Implementasi fondasi, bukan bukti fitur atau versi produksi disetujui. |
| Pengujian | Vitest dan Supertest dideklarasikan; script `npm test` tersedia. | Hasil test harus dicatat per commit dan lingkungan; satu test penanganan gagal koneksi tidak membuktikan PostgreSQL berjalan. |
| PostgreSQL | SQL migrasi/seed dan perintah `psql` dijelaskan dalam `database/README.md` pada scaffold. | OPEN: versi, migration runner, reapply dan hak runtime; koneksi/migrasi nyata belum diverifikasi. |
| CI | Workflow PR ke develop/main menjalankan repository check, `npm ci`, lint, typecheck, build dan test. | Tidak menyediakan service PostgreSQL; keberhasilan CI bukan bukti migrasi atau review. |

## Register keputusan arsitektur

### SRS40-ADR-01 — Runtime dan package manager

**Status:** PROPOSED. **Masalah/konteks:** runtime harus dapat direproduksi di empat mesin dan CI; versi yang disetujui belum tercatat. **Opsi:** (A) Node 22 dan npm yang diuji bersama lockfile; (B) rentang Node yang lebih luas beserta matriks kompatibilitas. **Rekomendasi untuk review:** A sebagai baseline kerja sementara karena workflow sudah memakai Node 22, tanpa mengklaim dukungan produksi. **Trade-off:** A menyederhanakan reproduksi tetapi tidak membuktikan kompatibilitas versi lain; B memerlukan CI lebih luas. **Konsekuensi:** sepakati versi Node/npm dan kebijakan `npm ci`, commit lockfile setelah perubahan dependency, lalu uji instalasi bersih. **Dampak:** seluruh workspace, CI, SRS-41. **Persetujuan:** belum ada bukti; OD-07 OPEN.

### SRS40-ADR-02 — Autentikasi dan otorisasi

**Status:** PROPOSED. **Masalah/konteks:** identitas tidak boleh dipercaya dari payload; izin per role, gudang dan objek memerlukan aturan final DOC-05. **Opsi:** (A) sesi server dan cookie; (B) token yang dikelola klien. **Rekomendasi untuk review:** A mengikuti DOC-06: cookie HttpOnly, Secure pada HTTPS dan SameSite sesuai topologi; proteksi CSRF untuk mutasi. Cookie lintas situs mungkin memerlukan konfigurasi berbeda yang harus diuji. **Trade-off:** sesi mengurangi paparan token ke JavaScript tetapi memerlukan session store, CSRF dan invalidasi; token juga memerlukan strategi penyimpanan dan pencabutan. **Konsekuensi:** pilih dan uji password hashing serta parameternya; tetapkan expiry absolut/idle, revocation pada logout, replay dan rotasi secret; periksa role/gudang/objek pada backend sebelum akses dan kembali saat mutasi; audit autentikasi/denial tanpa password, token atau payload sensitif. Jangan menambah registrasi publik atau role aplikasi. **Dampak:** SRS-36, SRS-47, SRS-48 dan audit. **Persetujuan:** belum ada; OD-04/OD-07 OPEN. Ini bukan implementasi autentikasi.

### SRS40-ADR-03 — Database, migrasi dan pemulihan

**Status:** PROPOSED. **Masalah/konteks:** schema harus berversi, dapat diterapkan dengan aman dan memisahkan data ACTUAL/UJI. **Opsi:** (A) SQL berurutan dengan kontrol versi dan operator; (B) migration runner yang mencatat versi/checksum dan transaksi. **Rekomendasi untuk review:** gunakan migrasi SQL yang sudah ada sebagai bahan uji terisolasi; pilih runner dan prosedur rilis sebelum deployment. `IF NOT EXISTS` tidak membuktikan reapply atau mengoreksi schema yang sudah berbeda. **Trade-off:** SQL sederhana tetapi pelacakan versi/manual lebih berat; runner menambah dependency tetapi dapat memeriksa urutan. **Konsekuensi:** database test terpisah dan seed sintetis UJI; role migrasi dan runtime terpisah dengan runtime non-superuser; uji koneksi, hak akses, migrasi/reapply dan isolasi. Sebelum rilis sediakan backup dan restore teruji; untuk kegagalan pilih roll-forward yang direview atau restore sesuai kompatibilitas, jangan menghapus data untuk memaksa migrasi. **Dampak:** SRS-44, SRS-54, DOC-07/17. **Persetujuan:** belum ada; OD-07/08 OPEN, lingkungan DB nyata NOT RUN.

### SRS40-ADR-04 — Parsing dan staging file

**Status:** OPEN. **Masalah/konteks:** DOC-08 hanya mengusulkan CSV UTF-8; XLSX menunggu sampel/sheet dan format XLS belum memiliki kontrak yang disahkan. Batas impor tidak boleh disamakan dengan batas file evidence. **Opsi:** (A) parser CSV tervalidasi terlebih dahulu; (B) adaptor CSV/XLSX/XLS berdasarkan sampel dan pustaka yang ditinjau. **Pilihan:** belum ditetapkan; tidak ada OCR. **Trade-off:** A mengurangi dependensi tetapi belum membuktikan format mitra; B memperluas kompleksitas dan permukaan input. **Konsekuensi:** SRS-37 harus mengonfirmasi format, ukuran, header, encoding dan versi; pilih parser yang dirawat berdasarkan bukti. Staging privat, pemeriksaan ukuran/tipe dan validasi per adaptor mendahului preview; commit atomik dan idempotency memerlukan transaksi dan pengujian tersendiri. Jangan mengarang format atau ukuran. **Dampak:** SRS-37, SRS-50–53, SRS-16/25. **Persetujuan:** belum ada; OD-05/07 dan konflik sumber tetap OPEN.

### SRS40-ADR-05 — Lingkungan, secret dan deployment

**Status:** PROPOSED. **Masalah/konteks:** konfigurasi lokal, test dan produksi harus terpisah; hosting, target kapasitas serta retensi belum disepakati. **Opsi:** (A) environment terisolasi dengan secret melalui penyedia runtime yang dipilih; (B) konfigurasi manual lokal saja. **Rekomendasi untuk review:** A untuk deployment setelah platform diputuskan; B terbatas untuk pengembangan, bukan bukti kesiapan rilis. **Trade-off:** isolasi menambah pengelolaan tetapi mengurangi risiko pencampuran data. **Konsekuensi:** jangan commit secret atau data mitra; frontend hanya menerima konfigurasi publik; gunakan origin spesifik dan TLS pada deployment; catat versi artefak, prosedur backup/restore dan verifikasi hak akses. Lockfile, origin, platform, retensi file/audit, NFR, RPO/RTO serta pemilik operasional masih memerlukan keputusan. **Dampak:** SRS-41, SRS-43/44, DOC-16/17. **Persetujuan:** belum ada; OD-07/08 OPEN, OD-09 NEEDS BASELINE.

## Spesifikasi lingkungan untuk review

| Konteks | Data dan akses | Prasyarat yang diusulkan | Status |
| --- | --- | --- | --- |
| Lokal | Dataset sintetis UJI; secret lokal di luar Git. | Node/npm sesuai keputusan; DB dan storage lokal terisolasi; origin frontend eksplisit. | PROPOSED; tidak menyiratkan runtime DB tersedia. |
| Test/CI | Fixture UJI terisolasi; tidak memakai data ACTUAL. | Database sementara, role non-superuser, clock deterministik bila relevan, hasil dan commit dicatat. | PROPOSED; workflow scaffold belum menjalankan DB. |
| Production-like | Tidak menggunakan data mitra tanpa otorisasi dan kontrol yang disetujui. | TLS, origin disepakati, secret injection, DB/storage privat, backup dan latihan restore. | OPEN; belum ada platform atau bukti deployment. |

| Variabel | Pemakaian yang teramati pada scaffold / ketentuan | Gap |
| --- | --- | --- |
| `NODE_ENV`, `PORT`, `LOG_LEVEL` | Backend membaca variabel; default hanya berlaku ketika tidak terdefinisi. | Nilai kosong `PORT`/`LOG_LEVEL` pada template dapat menggagalkan validasi; perbaikan SRS-43. |
| `DATABASE_URL` | Backend memakai URL koneksi; rahasia tidak boleh masuk frontend atau Git. | Nilai/role/versi dan koneksi DB nyata belum diverifikasi. |
| `ALLOWED_ORIGIN` | Backend menerapkan konfigurasi CORS; template kosong tidak membuktikan origin valid. | Allowlist untuk tiap lingkungan dan perilaku credential perlu disahkan serta diuji; jangan memilih wildcard untuk deployment credentialed. |
| `VITE_API_BASE_URL` | Tercantum pada template sebagai konfigurasi publik. | Adapter scaffold masih memakai path tetap; implementasi/tes termasuk SRS-42. Jangan memasukkan secret ke variabel frontend. |
| `API_PREFIX` | Backend memiliki nilai konfigurasi dan mencatatnya. | Route scaffold tetap memakai path tetap; konsistensi konfigurasi perlu diverifikasi pada SRS-43. |
| `SESSION_SECRET`, `PRIVATE_STORAGE_ROOT` | Tercantum dalam template; digunakan hanya setelah rancangan terkait disepakati dan diimplementasikan. | Pengelolaan secret, rotasi dan penyimpanan privat OPEN. |
| `APP_TIMEZONE` | Backend scaffold memiliki default Asia/Jakarta. | Zona jadwal proyek tidak membuktikan timezone data operasional mitra; OD-05 OPEN. |

Kebijakan logging PROPOSED: hanya metadata yang diperlukan dan correlation ID; redaksi credential, token, payload mentah, storage key serta parameter sensitif. Audit menemukan scaffold masih mencatat URL beserta query dan error mentah; perbaikan masuk SRS-43/issue terkait setelah dependency terpenuhi. Template `.env.example` menyatakan belum dibaca, sedangkan backend memuat dotenv; komentar template dan perilaku aktual belum konsisten.

## Persiapan rilis dan matriks verifikasi

Prasyarat rilis yang masih harus dibuktikan: sumber dan keputusan disetujui; artefak dan migrasi diberi versi; TLS/CORS, secret injection dan hak DB/storage ditinjau; backup/restore diuji; pemisahan data dan penolakan lintas scope diuji; hasil test dan review dicatat. Target kapasitas, threshold NFR, RPO/RTO dan retensi tidak boleh diisi tanpa sumber atau persetujuan yang relevan.

| Issue / kriteria | Bukti implementasi/dokumen | Metode dan hasil saat penyusunan | Lokasi bukti | Reviewer | Gap |
| --- | --- | --- | --- | --- | --- |
| SRS-40: inventaris tooling | Manifest, lockfile dan workflow scaffold | Inspeksi isi snapshot; tidak menjalankan ulang aplikasi pada branch dokumentasi | Commit `74b79ab` dan tabel di atas | Belum ada | Persetujuan versi dan lockfile/environment belum tersedia. |
| SRS-40: OD-07/08/09, retensi/NFR dicatat | DOC-00 dan ADR-01–05 | Review dokumentasi terhadap sumber draft | Dokumen ini dan DOC-00 | Belum ada | Keputusan dan NFR asli masih OPEN/SOURCE REQUIRED. |
| SRS-40: PR dan review | Branch dokumentasi untuk PR ke develop | Pemeriksaan repository dilakukan setelah perubahan; lihat hasil PR/CI yang sebenarnya. | PR SRS-40 setelah dibuat | Reviewer independen belum ada | Review, persetujuan dan merge belum dilakukan. |

Tidak ada acceptance, hasil security test, runtime DB, UAT, atau persetujuan stakeholder yang dinyatakan lulus oleh dokumen ini. Keluaran dan keputusan harus ditinjau oleh reviewer lain sebelum Definition of Done SRS-40 dipertimbangkan.
