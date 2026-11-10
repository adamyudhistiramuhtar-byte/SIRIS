# Register keputusan teknis dan lingkungan — SRS-40

Status: **DRAFT — NEEDS REVIEW**; tanggal: 10 November 2026. Issue: [SRS-40](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-40), parent SRS-4; SRS-41 memiliki dependency terhadap SRS-40.

Dokumen ini mencatat hasil inventaris dan opsi untuk ditinjau. `ACCEPTED` berarti ada bukti persetujuan spesifik; `PROPOSED` berarti rekomendasi yang belum disetujui; `OPEN` berarti belum ada pilihan final. Fakta konfigurasi yang ada tidak dengan sendirinya merupakan persetujuan standar produksi. Tidak ada ADR di bawah yang ditandai ACCEPTED tanpa bukti persetujuan.

## Keputusan minimum yang disetujui pengguna

**Sumber persetujuan:** instruksi langsung pemilik proyek dalam percakapan “SIRIS — APPROVAL SRS-40 & SPRINT 1 UNBLOCK EXECUTION”, 10 November 2026, Asia/Jakarta. Persetujuan ini berlaku untuk Sprint 1 dan tidak otomatis mengesahkan keputusan di luar lima butir berikut.

| No. | Keputusan | Status |
| --- | --- | --- |
| 1 | Node.js 22 LTS sebagai baseline runtime pengembangan dan GitHub Actions CI Sprint 1; minor/patch mengikuti rilis aman yang kompatibel. | ACCEPTED |
| 2 | npm workspaces untuk monorepo dengan satu `package-lock.json` pada root. | ACCEPTED |
| 3 | `npm ci` untuk instalasi reproducible pada CI; lockfile tidak diperbarui tanpa perubahan dependency yang sah. | ACCEPTED |
| 4 | Local development dan testing terisolasi dengan fixture sintetis berlabel UJI. | ACCEPTED |
| 5 | Credential, token, password dan environment secrets tidak disimpan di Git; `.env.example` tanpa credential nyata. | ACCEPTED |

Autentikasi, parser, migration runner, hosting, retensi dan ambang NFR **tidak termasuk persetujuan** dan tetap PROPOSED/OPEN. Pencatatan persetujuan tidak membuktikan kontrol telah diterapkan di seluruh lingkungan atau menggantikan review independen dan PR merged.

## Sumber, versi, dan cakupan pemeriksaan

| Sumber | Versi atau snapshot | Kegunaan dan batas |
| --- | --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | 0.2.0, NEEDS REVIEW | OD-07, OD-08, OD-09; 29 FR dan 14 NFR asli masih SOURCE REQUIRED. |
| [DOC-05](05_BUSINESS_RULES_RBAC.md), [DOC-06](06_SOFTWARE_ARCHITECTURE_DESIGN.md), [DOC-09](09_API_SPECIFICATION.md), [DOC-16](16_SECURITY_RISK_NFR.md) | 0.2.0, NEEDS REVIEW | Usulan RBAC, sesi, API, dan kontrol keamanan; bukan persetujuan final. |
| [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md), [DOC-17](17_DEPLOYMENT_OPERATIONAL_GUIDE.md) | 0.2.0, NEEDS REVIEW | Usulan format sumber, staging, rollback, environment, dan rilis. |
| `AGENTS.md` | Snapshot develop `ea6dd9c` | Stack proyek, sumber baseline dan pemisahan ACTUAL/UJI. |
| Repository scaffold | Commit `74b79ab`, juga pada main `3b17306` melalui PR #2; belum pada develop snapshot di atas | Manifest, lockfile, konfigurasi dan implementasi aktual yang diperiksa. Perubahan scaffold sedang diajukan kembali melalui [PR #4](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/4). |

Sumber final, keputusan autentikasi dan deployment, versi PostgreSQL, kebijakan retensi, target deployment dan NFR asli belum tersedia atau belum terbukti disetujui. DOC-17 ditulis sebelum scaffold dan sejumlah pernyataan bahwa manifest/script belum ada tidak menggambarkan snapshot scaffold; jangan menganggapnya sebagai kondisi saat ini pada main maupun persetujuan produksi.

Pemeriksaan ulang terhadap scaffold PR #4 `3b5888f`: hanya satu `package-lock.json` root ditemukan; manifest root menyatakan npm workspaces; workflow `application-ci` mengonfigurasi Node 22 dan `npm ci`. Pemeriksaan nama kunci template tidak menemukan nilai nonkosong pada `SECRET`, `TOKEN`, `PASSWORD`, atau `DATABASE_URL`; ini bukan audit seluruh histori atau secret semantik. Node lokal yang tersedia pada pemeriksaan adalah 24.21.0, sehingga menjalankan lokal dengan Node 22 belum diverifikasi; penerapan lokal perlu ditindaklanjuti. Lockfile tidak diubah dalam PR ini.

## Matriks konfigurasi tooling

| Area | Bukti konfigurasi pada scaffold | Status dan batas |
| --- | --- | --- |
| Node/npm | Workflow `repository-checks.yml` memakai Node 22 dan `npm ci`; README menyebut Node >=20. Manifest root belum menetapkan `engines` atau `packageManager`. | ACCEPTED: Node 22 untuk pengembangan dan CI Sprint 1. README >=20 bukan bukti dukungan versi lain; produksi di luar persetujuan ini. |
| Package manager | Root `package.json` menggunakan npm workspaces; `package-lock.json` tersedia. | ACCEPTED: npm workspaces, satu lockfile root dan `npm ci` di CI; ubah lockfile hanya untuk perubahan dependency yang sah. |
| TypeScript, lint, format | Manifest mendeklarasikan TypeScript, ESLint 9 dan Prettier 3; lint/typecheck/build tersedia sebagai script. | Versi manifest berupa rentang; lockfile merekam resolusi. Formatter tersedia, bukan bukti semua file telah diformat. |
| Web/API | Manifest web mendeklarasikan Vue 3, Vite 6, Tailwind 3; API mendeklarasikan Express 4 dan `pg` 8; kontrak bersama dalam workspace. | Implementasi fondasi, bukan bukti fitur atau versi produksi disetujui. |
| Pengujian | Vitest dan Supertest dideklarasikan; script `npm test` tersedia. | Hasil test harus dicatat per commit dan lingkungan; satu test penanganan gagal koneksi tidak membuktikan PostgreSQL berjalan. |
| PostgreSQL | SQL migrasi/seed dan perintah `psql` dijelaskan dalam `database/README.md` pada scaffold. | OPEN: versi, migration runner, reapply dan hak runtime; koneksi/migrasi nyata belum diverifikasi. |
| CI | Workflow PR ke develop/main menjalankan repository check, `npm ci`, lint, typecheck, build dan test. | Tidak menyediakan service PostgreSQL; keberhasilan CI bukan bukti migrasi atau review. |

## Register keputusan arsitektur

### SRS40-ADR-01 — Runtime dan package manager

**Status:** ACCEPTED untuk tiga butir runtime dan package manager yang secara eksplisit disetujui pada register di atas; keputusan OD-07 lainnya tetap OPEN. **Masalah/konteks:** runtime harus dapat direproduksi di empat mesin dan CI. **Opsi:** (A) Node 22 dan npm workspaces bersama lockfile root; (B) rentang Node yang lebih luas beserta matriks kompatibilitas. **Pilihan:** A untuk pengembangan dan CI Sprint 1; `npm ci` digunakan pada CI. **Trade-off:** A menyederhanakan reproduksi tetapi tidak membuktikan kompatibilitas versi lain atau produksi; B memerlukan CI lebih luas. **Konsekuensi:** gunakan satu lockfile root, jangan perbarui tanpa perubahan dependency yang sah, dan uji instalasi bersih. Versi npm tertentu tidak ditetapkan oleh persetujuan. **Dampak:** seluruh workspace, CI, SRS-41. **Persetujuan:** instruksi langsung pengguna tanggal 10 November 2026, sebagaimana dirinci pada register keputusan minimum.

### SRS40-ADR-02 — Autentikasi dan otorisasi

**Status:** PROPOSED. **Masalah/konteks:** identitas tidak boleh dipercaya dari payload; izin per role, gudang dan objek memerlukan aturan final DOC-05. **Opsi:** (A) sesi server dan cookie; (B) token yang dikelola klien. **Rekomendasi untuk review:** A mengikuti DOC-06: cookie HttpOnly, Secure pada HTTPS dan SameSite sesuai topologi; proteksi CSRF untuk mutasi. Cookie lintas situs mungkin memerlukan konfigurasi berbeda yang harus diuji. **Trade-off:** sesi mengurangi paparan token ke JavaScript tetapi memerlukan session store, CSRF dan invalidasi; token juga memerlukan strategi penyimpanan dan pencabutan. **Konsekuensi:** pilih dan uji password hashing serta parameternya; tetapkan expiry absolut/idle, revocation pada logout, replay dan rotasi secret; periksa role/gudang/objek pada backend sebelum akses dan kembali saat mutasi; audit autentikasi/denial tanpa password, token atau payload sensitif. Jangan menambah registrasi publik atau role aplikasi. **Dampak:** SRS-36, SRS-47, SRS-48 dan audit. **Persetujuan:** belum ada; OD-04/OD-07 OPEN. Ini bukan implementasi autentikasi.

### SRS40-ADR-03 — Database, migrasi dan pemulihan

**Status:** PROPOSED. **Masalah/konteks:** schema harus berversi, dapat diterapkan dengan aman dan memisahkan data ACTUAL/UJI. **Opsi:** (A) SQL berurutan dengan kontrol versi dan operator; (B) migration runner yang mencatat versi/checksum dan transaksi. **Rekomendasi untuk review:** gunakan migrasi SQL yang sudah ada sebagai bahan uji terisolasi; pilih runner dan prosedur rilis sebelum deployment. `IF NOT EXISTS` tidak membuktikan reapply atau mengoreksi schema yang sudah berbeda. **Trade-off:** SQL sederhana tetapi pelacakan versi/manual lebih berat; runner menambah dependency tetapi dapat memeriksa urutan. **Konsekuensi:** database test terpisah dan seed sintetis UJI; role migrasi dan runtime terpisah dengan runtime non-superuser; uji koneksi, hak akses, migrasi/reapply dan isolasi. Sebelum rilis sediakan backup dan restore teruji; untuk kegagalan pilih roll-forward yang direview atau restore sesuai kompatibilitas, jangan menghapus data untuk memaksa migrasi. **Dampak:** SRS-44, SRS-54, DOC-07/17. **Persetujuan:** belum ada; OD-07/08 OPEN, lingkungan DB nyata NOT RUN.

### SRS40-ADR-04 — Parsing dan staging file

**Status:** OPEN. **Masalah/konteks:** DOC-08 hanya mengusulkan CSV UTF-8; XLSX menunggu sampel/sheet dan format XLS belum memiliki kontrak yang disahkan. Batas impor tidak boleh disamakan dengan batas file evidence. **Opsi:** (A) parser CSV tervalidasi terlebih dahulu; (B) adaptor CSV/XLSX/XLS berdasarkan sampel dan pustaka yang ditinjau. **Pilihan:** belum ditetapkan; tidak ada OCR. **Trade-off:** A mengurangi dependensi tetapi belum membuktikan format mitra; B memperluas kompleksitas dan permukaan input. **Konsekuensi:** SRS-37 harus mengonfirmasi format, ukuran, header, encoding dan versi; pilih parser yang dirawat berdasarkan bukti. Staging privat, pemeriksaan ukuran/tipe dan validasi per adaptor mendahului preview; commit atomik dan idempotency memerlukan transaksi dan pengujian tersendiri. Jangan mengarang format atau ukuran. **Dampak:** SRS-37, SRS-50–53, SRS-16/25. **Persetujuan:** belum ada; OD-05/07 dan konflik sumber tetap OPEN.

### SRS40-ADR-05 — Lingkungan, secret dan deployment

**Status:** ACCEPTED terbatas pada isolasi local development/testing dengan fixture sintetis UJI dan larangan menyimpan secret di Git; konfigurasi deployment tetap PROPOSED/OPEN. **Masalah/konteks:** konfigurasi lokal, test dan produksi harus terpisah; hosting, target kapasitas serta retensi belum disepakati. **Opsi:** (A) environment terisolasi dengan secret melalui penyedia runtime yang dipilih; (B) konfigurasi manual lokal saja. **Keputusan:** bagian local/test dan secret pada register minimum diterima; opsi deployment belum diputuskan. **Trade-off:** isolasi menambah pengelolaan tetapi mengurangi risiko pencampuran data. **Konsekuensi:** `.env.example` tanpa credential nyata; frontend hanya menerima konfigurasi publik. Origin, platform, retensi file/audit, NFR, RPO/RTO serta pemilik operasional masih memerlukan keputusan. **Dampak:** SRS-41, SRS-43/44, DOC-16/17. **Persetujuan:** instruksi langsung pengguna tanggal 10 November 2026 untuk bagian yang dibatasi di atas; OD-07/08 tetap OPEN sebagian dan OD-09 NEEDS BASELINE.

## Spesifikasi lingkungan untuk review

| Konteks | Data dan akses | Prasyarat yang diusulkan | Status |
| --- | --- | --- | --- |
| Lokal | Dataset sintetis UJI; secret lokal di luar Git. | Node 22 untuk Sprint 1; rincian DB, storage dan origin masih perlu review. | Isolasi dan data UJI ACCEPTED; runtime DB belum terbukti tersedia. |
| Test/CI | Fixture UJI terisolasi; tidak memakai data ACTUAL. | Database sementara, role non-superuser, clock deterministik bila relevan, hasil dan commit dicatat. | Isolasi dan data UJI ACCEPTED; rincian DB PROPOSED dan workflow scaffold belum menjalankan DB. |
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
| SRS-40: inventaris tooling | Manifest, lockfile dan workflow scaffold | Inspeksi isi snapshot; tidak menjalankan ulang aplikasi pada branch dokumentasi | Commit `74b79ab` dan tabel di atas | Belum ada | Lima butir disetujui pengguna; penerapan Node 22 lokal dan review independen belum diverifikasi. |
| SRS-40: OD-07/08/09, retensi/NFR dicatat | DOC-00 dan ADR-01–05 | Review dokumentasi terhadap sumber draft | Dokumen ini dan DOC-00 | Belum ada | Keputusan dan NFR asli masih OPEN/SOURCE REQUIRED. |
| SRS-40: PR dan review | Branch dokumentasi untuk PR ke develop | Pemeriksaan repository dilakukan setelah perubahan; lihat hasil PR/CI yang sebenarnya. | PR SRS-40 setelah dibuat | Reviewer independen belum ada | Review, persetujuan dan merge belum dilakukan. |

SRS-41 tetap diblokir oleh SRS-40 berdasarkan link Jira; persetujuan minimum tidak otomatis memenuhi DoD SRS-40. Perlu review oleh orang lain serta penyelesaian PR sesuai workflow. Acceptance criteria Jira meminta OD-07/08/09 dan retensi/NFR yang belum final dicatat; tidak menyatakan bahwa seluruh keputusan tersebut harus disetujui agar dicatat. Jangan menyimpulkan bahwa SRS-40 Done sebelum review dan workflow selesai.

Tidak ada hasil security test, runtime DB, UAT, atau penerimaan stakeholder yang dinyatakan lulus oleh dokumen ini. Keluaran dan keputusan harus ditinjau oleh reviewer lain sebelum Definition of Done SRS-40 dipertimbangkan.
