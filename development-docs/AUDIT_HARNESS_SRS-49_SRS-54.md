# Audit, lineage dan harness UJI — SRS-49 / SRS-54

Kandidat `proposed-0.1`, mulai 20 November 2026; pemeriksaan lanjutan dan handoff pada **21 November 2026 WIB**. Owner: Adam. Reviewer yang diminta: Luthfi untuk service/API, Dwi untuk schema/fixture. Baseline `develop@23f59a0`; 16 UC, 29 FR, 14 NFR tetap. Identitas FR/NFR asli SOURCE REQUIRED. Tidak ada endpoint bisnis baru atau izin ACTUAL yang diaktifkan.

## Kebutuhan, rancangan dan implementasi

AC SRS-49 bersumber DOC-07 `audit_events` dan batas transaksi, DOC-08 commit, DOC-16 kerahasiaan. Implementasi baru pada `apps/api/src/modules/audit/`: factory event strict, repository parameterized INSERT, dan `AuditService`. Repository menerima client mutasi yang sama; tidak menjalankan BEGIN/COMMIT tersembunyi. `transaction` mengelola satu transaksi, mutasi callback + audit SUCCESS/CANCELLED + COMMIT. Callback hanya untuk operasi DB; file/network tidak menjadi atomik oleh helper ini.

`recordOutcome` menulis event pada koneksi terpisah setelah rollback atau penolakan, maksimum dua upaya dengan UUID event yang sama. INSERT memakai ON CONFLICT ID sehingga response INSERT yang hilang tidak menduplikasi event. Pool/connect timeout mengikuti pool pemanggil. Jika dua upaya tidak tersedia, hasil `false` dan log kode tetap `AUDIT_UNAVAILABLE`; **tidak ada klaim audit tersimpan atau antrean persisten**. Pemulihan setelah batas retry memerlukan prosedur operasional, bukan replay otomatis yang belum dibangun.

Kegagalan sebelum COMMIT: rollback dahulu, release client, audit FAILURE melalui koneksi lain. Failure melepaskan FK batch/source-row yang mungkin telah hilang saat rollback; correlation ID, pelaku yang sah, scope dan reason code aman tetap menjadi kaitan. Jika respons COMMIT hilang, hasil dianggap `TRANSACTION_OUTCOME_UNKNOWN`; tidak menulis FAILURE palsu. SRS-52 wajib menyelesaikan replay/idempotency sebelum memberi hasil akhir ke pengguna.

Event hanya menerima action enum, empat outcome, UUID, mode dan konteks berupa count integer nonnegatif, kind serta reason code enum. Field raw, credential, error message/name/stack, reason bebas dan storage key ditolak. Logger hanya menerima kode tetap dan correlation UUID. Header correlation non-UUID diganti dengan UUID internal; penyelarasan header wire SRS-43 masih menunggu owner, jangan mengklaim header lama sudah UUID.

## Schema dan kepemilikan

`database/migrations/004_audit_lineage.sql` adalah **nomor kandidat untuk review Dwi**, bukan reservasi final atas branch tim. PR #15 masih memuat 001–003. Migrasi baru menambah audit append-only, unique pendukung FK batch/scope dan source-row/batch. Row dari batch lain atau scope berbeda ditolak FK komposit. Runtime hanya mendapat SELECT/INSERT untuk audit; trigger melarang UPDATE/DELETE, termasuk bila grant diperluas. Migrasi 001–003 tidak disunting.

Tabel run/evidence domain belum tersedia. `run_id`/`evidence_id` dan FK terkait tidak dibuat tanpa tabel tujuan; audit rekonsiliasi/evidence penuh memerlukan migrasi integrasi oleh owner. Jalur audit impor untuk SRS-50/52 tersedia sebagai kandidat. Runtime tidak menerima DDL. Migrasi004 mendukung reapply melalui fingerprint kolom/default/constraint/index/trigger/function yang direkam sebagai comment saat instalasi pertama; schema berubah/tidak dikenal ditolak atomik. Fingerprint adalah pemeriksaan drift, bukan tanda tangan atau pengganti review schema. **Ledger checksum hanya milik harness UJI** memastikan isi file migrasi lama tidak berubah. Ini bukan keputusan migration runner produksi OD-07.

Koordinasi awal transaction client/file dicatat pada Jira SRS-49 komentar 10096. Belum ada persetujuan owner yang diklaim. Dwi perlu menilai nomor 004 terhadap F-03, constraint, grant dan urutan migrasi; Luthfi menilai callback/pool serta mapping error. Tidak mengubah file pool atau branch owner.

## Harness yang dapat dipakai tim

`tests/helpers/uji-database.ts` membuat schema acak `srs_test_*` melalui `siris_migrator`, menerapkan migrasi dengan ledger/checksum, mengisi fixture empat role dan dua gudang, lalu menyediakan pool `siris_app`. Storage memakai direktori sementara privat yang berbeda per pemanggilan. Dispose mengakhiri pool, menghapus hanya schema yang dibuat helper dan storage miliknya. Tidak menghapus database/public bersama.

Guard menolak URL selain `127.0.0.1:55432/siris_uji`, role yang salah, query URL bebas, PostgreSQL selain 16.6 serta role administratif. Koneksi migrator/runtime wajib terpisah. Fixture `database/fixtures/uji/actors.proposed-0.1.json` seluruhnya sintetis; empat actor mempunyai assignment gudang 01, gudang 02 tersedia untuk uji lintas scope. Hash password fixture `UJI_DISABLED_AUTH` sengaja tidak dapat dipakai login. Fixture role **bukan bukti autentikasi/otorisasi backend**; login nyata menunggu SRS-47/48.

`UjiClock` mengembalikan waktu deterministik `2026-11-20T03:00:00Z` dan dapat dimajukan. Clock itu adalah data simulasi, bukan waktu pelaksanaan pengujian. Playwright memakai clock browser deterministik dan proses web/API lokal terpisah; saat ini smoke app shell dan health, belum alur impor atau RBAC.

## Perintah aktual

Gunakan Node22 (pemeriksaan lokal memakai 22.22.2) dan root lockfile dengan `npm ci`. Script lama lint/typecheck/build/check:repo tetap tersedia. Dependency baru hanya Playwright1.65.1 dan transitifnya; metadata dependency lama dipertahankan. Dokumentasi aplikasi mengikuti struktur aktual `apps/api`, `apps/web`, `packages/contracts`; tes berada di `tests/integration`, `tests/e2e`, `tests/helpers`.

| Tujuan | Script / konfigurasi |
| --- | --- |
| DB Docker UJI baru | `npm run test:db:up`; membutuhkan Docker dan port55432 kosong; image postgres:16.6; password acak disimpan privat dalam test-results, tidak di Git/log |
| Kredensial untuk runner | Set `SIRIS_UJI_ENV_FILE=test-results/uji-env.json` setelah DB Docker siap; native PostgreSQL boleh menggunakan DATABASE_URL/DATABASE_MIGRATION_URL dari secret lokal yang sesuai guard |
| Seluruh tes + identitas | `npm run test:evidence`; menolak koneksi kosong agar hasil DB tidak SKIPPED diam-diam |
| Tipe test harness | `npm run typecheck:harness` |
| API integration saja | `npm run test:integration` dengan kedua URL UJI; tanpa URL, suite DB eksplisit SKIPPED |
| Browser | Instal browser melalui `npm exec -- playwright install chromium`, lalu `npm run test:e2e`; Chrome terpasang dapat dipilih lewat SIRIS_UJI_CHROME |
| Hentikan DB Docker milik harness | `npm run test:db:down`; memeriksa ID dan label container miliknya sebelum stop |

`test:db:up` tidak boleh diarahkan ke instance/data anggota lain. Pada mesin reviewer Docker tidak tersedia; database nyata dibangun dari source PostgreSQL16.6 di direktori sementara dan dibootstrap dengan password unik. PostgreSQL bootstrap administratif memakai postgres hanya untuk database/role/ekstensi; operasi schema oleh migrator, operasi aplikasi oleh runtime. Default privileges public dan grant objek lama harus diperiksa per instance. Script Docker belum dijalankan lokal; hasil workflow CI harus dibaca terpisah.

Workflow baru `.github/workflows/uji-harness.yml` menjalankan bootstrap DB Docker, typecheck harness, evidence Vitest dan E2E Chromium. Cleanup selalu dijalankan. Artefak hanya laporan aman dan attachment identitas, **tidak** file env, connection string atau state bootstrap. Workflow lama repository/application checks tetap berlaku.

## Identitas evidence dan hasil aktual

`test-results/evidence-vitest.json` menyimpan setiap assertion PASS/FAIL/SKIPPED bersama SHA commit, hash isi source build, schema dan dataset, versi Node dan baseline DB. Attachment setiap E2E mencatat identitas sama. Isi `test-results` diabaikan Git karena dapat mengandung credential bootstrap; jangan mengunggah seluruh direktori. Nilai hash source berubah bila kode/script berubah walaupun commit belum dibuat; jalankan ulang pada commit akhir untuk handoff. Report JSON penuh Vitest disimpan lokal, ringkasan aman dipakai handoff.

Pada pemeriksaan awal: audit/guard/DB 15/15 PASS termasuk atomisitas, rollback audit/domain, CANCELLED/DENIED, FK lintas batch, outage total, recovery terbatas, INSERT response hilang, COMMIT response hilang, ledger/reapply/checksum dan isolasi. Suite penuh sebelum dua tes tambahan PASS105/105; suite final mengikuti evidence commit akhir. Browser nyata Chrome PASS2, SKIPPED1 (login/RBAC menunggu SRS-47/48). Lint awal menemukan empty destructuring di hook E2E, telah diperbaiki; repository check awal mendeteksi pola URL bercredential dalam template kode pembentuk URL, telah diganti URL builder. Ini bukan credential nyata yang ter-commit. Typecheck workspace dan harness PASS; build PASS. CI remote belum diklaim dari hasil lokal.

## Batas integrasi dan serah terima

Luthfi dapat memakai `AuditService` dan `TransactionClient` untuk auth/otorisasi/preview; jangan menyuntik actor dari payload. Dwi memakai client callback yang sama untuk domain dan audit saat SRS-52; idempotency hasil COMMIT unknown tetap tanggung jawab commit service. Adam memakai harness untuk staging setelah SRS-48 dan keputusan parser/header/limit siap. Vassell memakai Playwright scaffold; ganti satu test BLOCKED hanya setelah endpoint sesi/role nyata tersedia, tanpa memalsukan login.

Integrasi terhadap kandidat PR #18/#15 dan perbaikan shutdown diverifikasi pada worktree gabungan tersendiri; merge resmi dan review tetap gate terpisah. SRS-49/54 belum Done sebelum review independen, CI dan integrasi yang diwajibkan selesai. SRS-50 tetap blocked; tidak ada upload yang diaktifkan, tidak ada raw file mitra atau data domain operasional yang dimasukkan.

Iterasi Prototyping: kebutuhan berdasarkan AC kedua issue; rancangan transaction service + harness; implementasi kandidat di branch terisolasi; evaluasi berupa tes aktual di atas; perbaikan meliputi retry INSERT, unknown COMMIT, lint dan redaksi template. Feedback stakeholder/UAT belum tersedia dan tidak dibuat-buat.
