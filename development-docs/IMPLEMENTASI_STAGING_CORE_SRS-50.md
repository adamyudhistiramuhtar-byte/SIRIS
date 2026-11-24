# Core staging terisolasi SRS-50

Versi `uji-fixture/proposed-0.1`, disiapkan 22–23 November 2026. Status: **kandidat implementasi UJI; belum Done**. Source implementasi pertama `5223bd3`. Baseline tetap 16 UC, 29 FR, 14 NFR. Tidak ada endpoint baru atau autentikasi tiruan yang diaktifkan.

## Kebutuhan, sumber, dan batas

AC SRS-50: upload membentuk staging saja, lima kind, source hash serta source-row lineage, file privat. Rancangan memakai SRS-37 `proposed-0.1` dan fixture sintetis pada `database/fixtures/uji/`, DOC-07/08/09, audit SRS-49 dan harness SRS-54 pada PR #22. Kandidat integrasi PR #23 memasukkan ancestry pemilik PR #18 sesudah #21, migrasi dasar PR #15, serta routing UJI PR #24. Review upstream dan review nonpenulis core tetap diperlukan.

Parser `FixtureSourceAdapter` membaca **JSON fixture sintetis** SRS-37. `raw_payload` adalah record JSON yang benar-benar diunggah, termasuk field `normalized` pada fixture; ini bukan klaim pemulihan header CSV/XLSX mitra. STOCK menyimpan record raw yang memuat contoh `QTY AKHIR`; saldo tidak dijumlahkan dari support. Adapter mitra belum tersedia. Version adapter sengaja berbeda dari `proposed-0.1` milik dokumen supaya fixture tidak disalahartikan sebagai format operasional.

Header/sheet, locale angka, alias dan konversi UOM, business line key EXPECTED, zero expected, timezone lokal tanpa offset, limit impor dan skema support STOCK tetap **OPEN / SOURCE REQUIRED**. Core mempertahankan desimal string numeric(20,6), tidak membulatkan atau menebak locale, serta menolak timestamp tanpa offset pada adapter fixture. EXPECTED nol dan STOCK negatif hanya dapat tersimpan sebagai representasi staging PENDING; belum berarti sah untuk validasi/commit. Tidak ada pembuktian closing reference mitra, eligibility metrik, referensi master atau urutan event pada tahap ini; itu milik validasi bisnis berikutnya.

## Antarmuka untuk Luthfi

- `apps/api/src/modules/imports/staging-contract.ts`: metadata strict dan `StageAuthorizer.authorizeStage(scope)`; provider SRS-47/48 harus mengembalikan actor UUID, role dan assignment dari sesi sah. Actor pada metadata/body ditolak. Role Purchasing hanya EXPECTED/COMMITMENT, Warehouse hanya RECEIVING/STOCK/COUNT; Production/Management tidak dapat staging. ACTUAL ditolak.
- `staging.service.ts`: `stage(metadata, parts, correlation)` menghasilkan STAGED, batch UUID, kind, scope, version, row count, hash dan correlation UUID. `parts` berupa async byte stream. Limit byte, row dan jumlah file wajib diinjeksi; angka pada tes hanya kebijakan fixture.
- `staging.repository.ts`: `readOwnedStaging(client, actor, batchId)` untuk SRS-51, terurut component/row_number/id, mencakup source-row UUID, raw/normalized dan status PENDING. Gunakan client transaksi yang sama untuk pembacaan dan perubahan validasi agar lock scope tetap berlaku. Tidak memuat storage key. Belum menjadi DTO frontend.
- `private-source-storage.ts`: root absolut khusus privat, mode direktori 0700 dan file 0600, random key/exclusive create. Root dan parent dikelola konfigurasi tepercaya, tidak dipasang sebagai static route. Upload dibatasi saat streaming, file parsial dibersihkan pada kegagalan yang pasti.

Server harus membentuk provider dari autentikasi SRS-47/48, menerjemahkan metadata multipart yang disepakati, memetakan error ke katalog DOC-09, membatasi request di transport, dan menjalankan ownership sebelum expose preview. Tidak menerima `actor_id` dari client. Provider fixture pada tes tidak membuktikan login/session/CSRF.

## Transaksi, audit, dan unknown outcome

Role/assignment/user/gudang aktif diperiksa sebelum file dan diulang memakai `FOR SHARE` dalam transaksi akhir. Cutoff, jika ada, harus berada pada scope batch. Transaksi yang sama menyimpan batch, file manifest, source rows dan audit SUCCESS; data domain tidak ditulis. Audit menerima transaction client yang sama, tidak membuka transaksi bertingkat.

Kegagalan sebelum COMMIT melakukan rollback, kemudian audit FAILURE atau DENIED melalui koneksi terpisah, dan membersihkan file. Pesan driver/raw/credential/path tidak keluar sebagai error/log. Bila koneksi hilang saat COMMIT, core mengembalikan `OUTCOME_UNKNOWN` dengan batch UUID serta correlation; file dipertahankan karena transaksi mungkin sudah sukses. Tidak merekam FAILURE palsu. Backend harus memulihkan lewat pembacaan batch berizin sebelum retry; belum ada HTTP status endpoint tambahan, idempotency upload, garbage collector atau klaim replay aman. Recovery HTTP tetap C58-05 OPEN. Storage bukan bagian transaksi PostgreSQL; orphan akibat crash/cleanup gagal memerlukan prosedur inspeksi privat berdasarkan batch, tanpa menghapus file outcome unknown.

Hash per file = SHA-256 byte asli. Hash paket kandidat = SHA-256 JSON array `[component, file_sha256, size_bytes]`, urut component (`en`), tidak memasukkan nama tampilan, key privat atau UUID acak. Kebijakan ini diuji untuk fixture dan perlu review C58-02 sebelum menjadi kontrak multipart final.

## Migrasi dan kepemilikan

001–003: SRS-44/Dwi, sudah merged melalui PR #15 `d1acfb4`. 004: audit SRS-49/Adam, PR #22, belum merged. **005 dicadangkan untuk cutoff F3-1 SRS-38/Dwi**, kandidat Adam pada branch `feature/SRS-38-cutoff-time-nullable`; keputusan PM/review tetap terpisah. **006 `006_import_staging_sources.sql`: SRS-50/Adam**, branch `feature/SRS-50-staging-core`. 006 tidak membutuhkan 005; nomor yang dilewati adalah reservasi, bukan migrasi yang hilang diam-diam. Koordinasikan urutan sebelum deployment bersama. Lingkungan lain yang pernah menjalankan 004/005/006 harus mengirim ledger/checksum; jangan menimpa migrasi yang sudah dijalankan.

006 menambah kolom batch/source/normalized nullable untuk menjaga data lama serta tabel file privat. Data legacy tidak diberi normalized/hash palsu. Reapply memverifikasi fingerprint schema dan menolak drift. Upgrade berisi data, reapply, rollback transaksi, concurrency dan outcome unknown memiliki tes nyata. Pemulihan schema setelah batch baru ada harus roll-forward/backup; jangan drop kolom atau tabel file tanpa rekonsiliasi private storage dan audit.

## Pengujian dan penggunaan harness

Node.js 22.22.2, PostgreSQL 16.6 UJI, migrator dan runtime terpisah. `tests/helpers/uji-database.ts` membuat schema/storage per tes serta empat role dan dua gudang; clock `UjiClock` deterministik. Password fixture tidak dapat login. Jalankan `npm ci`, `npm run lint`, `npm run typecheck`, `npm run typecheck:harness`, `npm run build`, `npm run check:repo`, dan `npm run test:evidence` melalui konfigurasi UJI pada [panduan harness](AUDIT_HARNESS_SRS-49_SRS-54.md). File harness tetap sumber perintah aktual.

Tes terarah `npm test -- tests/integration/imports/staging.test.ts`: **22/22 PASS** pada implementasi `5223bd3` (isi source sama dengan pengujian sebelum commit). Cakupan: lima kind, null versus nol, hash/raw/normalized/lineage, file privat, role/gudang/mode/ownership, assignment stale dan pencabutan saat streaming, limit, format/precision, rollback audit, outage, konkurensi, unknown COMMIT dan upgrade/reapply/drift. Lint, typecheck aplikasi/harness, build: PASS. Hasil suite lengkap beserta build/schema/dataset dicatat pada evidence yang ditambahkan sesudah eksekusi; jangan memperluas klaim tes ini menjadi browser upload atau integrasi endpoint.

## Handoff dan evaluasi

Luthfi dapat memakai interface actor dan repository rows untuk SRS-47/48/51 sekarang. Dwi meninjau 006 dan transaction client untuk commit atomik SRS-52; schema domain dan idempotency tetap pekerjaannya. Vassell memakai DTO preview final melalui adapter, bukan raw atau storage key. Adam melanjutkan parser sumber, SRS-34, endpoint upload setelah SRS-48, UC-01 dan pemulihan setelah kontrak preview/commit tersedia. Evaluasi ini berasal dari tes aktual, bukan feedback mitra. Perbaikan prototipe berikutnya adalah review nonpenulis, penyelarasan kontrak sumber dan endpoint berizin.
