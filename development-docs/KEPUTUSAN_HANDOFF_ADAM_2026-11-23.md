# Keputusan dan handoff Adam — 23 November 2026

Versi review-0.2. Pekerjaan diteruskan dari 22 November melewati target 18.00 WIB. Baseline tetap 16 UC, 29 FR dan 14 NFR. Keputusan yang diotorisasi, rekomendasi PM yang belum dijawab, dan kebutuhan sumber dibedakan. Tidak ada pengesahan ACTUAL atau feedback mitra yang ditambahkan.

## Fondasi dan review

| Pekerjaan | HEAD dan hasil |
| --- | --- |
| SRS-44 / PR #15 | HEAD e56d73e, 15/15 tes migrasi reviewer PostgreSQL 16.6 UJI PASS, cocok dengan Jira 10098. Review independen Adam, CI 2/2 PASS, merged d1acfb496f7e3a2cb2d8580f44d5fd4bc416cca8. Scope 001–003 selesai; cutoff F3-1 adalah lanjutan SRS-38. |
| SRS-46 / PR #24 | HEAD ec88cc8f3ec50bd8298924521cbff8791b5da576. Suite 132/132 dan 64 tes reviewer terhadap matriks literal SRS-36 PASS; lint/typecheck/build dan CI 2/2 PASS. Review independen Adam, merged 28b85013184750a67e8a7ef816a68ed4c068d454. Scope routing UJI dengan sesi sementara. |
| SRS-43 / PR #18 | HEAD c2105a6083bbb7ba2b81a51b49aab18fd6524c4f mengandung ancestor 842b406 dari stacked PR #21; tree sama. Suite 109/109 termasuk 6 regresi shutdown dan koneksi PostgreSQL nyata PASS. Adam penulis fix, sehingga Dwi harus memberi review nonpenulis. Belum merged. |
| PR #23 integrasi | Diperbarui menjadi 17e0a1a366c5cabc0bfe0e01f45875c22880c6e5 dari owner #18 dan develop sesudah #15/#24. Suite 178/178 PASS, smoke browser/API 2 PASS/1 SKIPPED login SRS-47/48. Memuat audit 004, belum cutoff 005/staging 006. Belum merged. |
| SRS-49/54 / PR #22 | Kandidat 7c20a65. Bukti historis 108 tes dan CI PostgreSQL/browser hanya berlaku pada SHA dan lingkungan tersebut. Review API Luthfi serta schema Dwi masih diperlukan. |
| SRS-50 core | Source 5223bd3, dokumentasi efceb40; branch feature/SRS-50-staging-core. Suite 200/200 PASS termasuk 22 tes staging; evidence mengikat build/schema/dataset. Tidak memasang endpoint sebelum SRS-47/48. Belum Done. |

Tiga repository-check finding lama belum tereproduksi: HEAD #18 tracked 127 berkas/0 temuan, workspace pengguna 122 berkas/0 temuan. Log asal beserta SHA/file/baris belum tersedia; asalnya tidak dikarang. Lokasi dokumen runtime yang baru ditemukan diperbaiki secara terpisah pada f7a0ab8: dipindahkan ke development-docs/API_RUNTIME_GUIDE_SRS-43.md, README dan publish manifest diselaraskan. Ini bukan klaim bahwa pemindahan tersebut menyelesaikan tiga finding lama.

Evidence ringkas ada pada [integrasi 17e0a1a](evidence/INTEGRASI_17e0a1a_2026-11-23.json) dan [hash sumber](evidence/SUMBER_SESI_2026-11-23.json). Reproduksi 64 tes reviewer routing: pada worktree ec88cc8, salin [source tes reviewer](evidence/REVIEW_ROUTING_ec88cc8.spec.ts.txt) menjadi apps/web/src/tests/reviewer-routing-20261122.spec.ts, kemudian jalankan npm test -- apps/web/src/tests/reviewer-routing-20261122.spec.ts menggunakan Node 22. Source tes bukan perubahan aplikasi yang ikut PR #24.

## Re-review PR #14 dan keputusan cutoff

HEAD 7eca74483ce5e08b1897e19e3421f3a5d2e38a67 telah diperiksa. Temuan lama sudah dikoreksi pada §3 dan §6: belum dihitung wajib physical_quantity NULL, counted zero sah, counted NULL invalid; variance hanya untuk pasangan lengkap terhitung dengan UOM sesuai. Tanggal laporan bukan basis efektif. Cutoff UUID sama adalah syarat perlu, bukan cukup. D-01–D-06 tidak otomatis ACCEPTED; hanya batas UJI §13.1 memiliki arahan PM terdahulu pada 15 November.

| Butir | Rekomendasi/status, sumber dan batas | Dampak serta bukti yang diperlukan |
| --- | --- | --- |
| D-01 / F3-1 | Kandidat PM: nullable cutoff_time, NULL berarti tanggal-saja, tanpa backfill atau konversi 00:00. Sumber §3/§13.4, SRC-09 §7 dan baseline UJI §13.1. | Migrasi 005; DTO/UI tidak menampilkan jam buatan. Enam tes nyata PASS: insert NULL, data lama, reapply, upgrade berisi data, kegagalan atomik, recovery saat ada NULL. Basis ACTUAL dan sampel ekspor masih diperlukan dari mitra. |
| D-02 | Pertahankan SIMULATED pada fixture UJI; pisahkan CHECK status dari perubahan nullable time. ACTUAL ditahan. Sumber §4/§13.1; kewenangan VERIFIED OD-08 SOURCE REQUIRED. | 005 tidak mengubah status/default atau menambah CHECK. API/UI membedakan simulasi. Tes ACTUAL ditolak; mitra menetapkan verifikator dan bukti. |
| D-03 | Usulkan XOR satu target snapshot/count sesuai §5. Belum disahkan karena konflik DOC-07/09 stock_line versus SRC-09. | Schema FK/XOR, API-17 dan UI-11 berubah. Tes 0/1/2 target dan lintas scope diperlukan. Kewenangan serta retensi membutuhkan BA/mitra. Implementasi evidence tetap ditahan. |
| D-04 | Gunakan baseline UJI §6/§13.1: grain per material, ambigu ditolak, mismatch/nonvalid variance NULL. Multi-UOM ACTUAL masih OD-05. | Tidak membuat tabel alias UOM tanpa izin. API AMBIGUOUS_PAIR/UOM_MISMATCH, UI alasan/null; tes enam status dan grain diperlukan. Core COUNT sudah menguji nol/null, bukan engine rekonsiliasi. |
| D-05 | Rekomendasi unique snapshot/session/rule serta reuse lintas key untuk input identik; PM/API/schema review diperlukan. Sumber §7, konflik DOC-07/08 dengan SRC-09. | Unique hasil, HTTP 200 reused/201 baru/409 konflik; UI tidak menduplikasi hasil. PVT-20, konkurensi dan replay NOT RUN karena engine belum ada. Koreksi input immutable masih perlu keputusan domain. |
| D-06 | Rekomendasi latest per gudang/mode/cutoff/rule, created_at lalu UUID sebagai tie-breaker; belum disahkan. Sumber §8 dan SRC-09 UI-14. | Index/query API-16 dan metadata run terpilih; tes tie, run lama dan pemisahan scope. Mitra perlu menentukan apakah beberapa snapshot/sesi pada cutoff sama sah. |

Paket pertanyaan PM/domain sudah diajukan dalam sesi ini. Belum ada jawaban yang mengesahkan keputusan baru. Kandidat dapat direview, sementara integrasi yang bergantung pada keputusan menunggu jawabannya. Precision eksplisit, timezone, SIMULATED dan kewenangan VERIFIED tetap keputusan yang terpisah dari nullable time.

Urutan migrasi yang disiapkan:

| Nomor/file | Issue, owner dan branch |
| --- | --- |
| 001–003 | SRS-44 / Dwi; merged melalui PR #15. |
| 004_audit_lineage.sql | SRS-49 / Adam; PR #22, feature/SRS-49-54-audit-harness. |
| 005_cutoff_time_nullable.sql | SRS-38 / Dwi sebagai owner domain/migrasi; kandidat disiapkan Adam pada feature/SRS-38-cutoff-time-nullable, commit 1886b2c. |
| 006_import_staging_sources.sql | SRS-50 / Adam; feature/SRS-50-staging-core, source 5223bd3. Tidak memerlukan nullable 005. |

001–003 diketahui pernah dijalankan pemilik dan reviewer, 001–004 pada reviewer/CI kandidat. Ledger seluruh mesin tim belum tersedia. Jangan menganggap mesin lain kosong atau menomori ulang 004 yang sudah diuji. Kirim ledger/checksum sebelum deployment bersama.

Recovery 005 berada pada database/migrations/recovery/005_restore_cutoff_time_required.sql dan tidak ikut runner forward. Recovery menolak bila ada NULL. Hentikan writer, backup dan inventarisasi dahulu. NOT NULL hanya dipulihkan bila sumber otoritatif melengkapi waktu; jika tidak ada sumber gunakan roll-forward. Jangan isi 00:00 atau hapus data untuk memaksa rollback.

## Register keputusan SRS-58

Matriks 22 operasi dan snapshot DOC-09 tetap pada [kontrak SRS-58](KONTRAK_LINTAS_MODUL_SRS-58.md). Snapshot mesin tidak diam-diam diubah oleh kandidat di bawah. Pemutus PM Adam; review API Luthfi, schema Dwi dan konsumen Vassell. Status PROPOSED/OPEN bukan persetujuan.

| ID/aspek | Nilai dan batas penerapan | Sumber, file dan tes berikutnya |
| --- | --- | --- |
| OD-07 sesi | Rekomendasi cookie HttpOnly, CSRF pada mutasi, expiry server dan logout invalidasi. Store, durasi serta SameSite/Secure/dev config masih review Luthfi. PROPOSED. | DOC-08/09, SRS-47/48. StageAuthorizer terpisah. Login empat role, expiry, CSRF, logout/reload/revocation BLOCKED menunggu backend. Routing #24 hanya konteks sementara. |
| C58-01 DTO | Health memakai data/meta; DTO bisnis DOC-09 belum tentu envelope. Boundary unwrap per endpoint sampai API review selesai. PROPOSED. | SRS-42 ApiResponse, PR #11 transport, runtime #18. Smoke health/error tersedia; business wire belum terbukti. |
| C58-02 multipart/hash | Satu metadata JSON part; file tunggal atau balance/support; browser menetapkan boundary. Hash manifest core adalah kandidat UJI. Limit wajib diinjeksi, bukan limit evidence 5 MiB. OPEN. | SRS-37/DOC-09; staging-contract/storage/service dan 006. Hash/file privat/limit PASS; encoding HTTP dan support parser NOT RUN. |
| C58-03 state | Usulkan lifecycle DOC-08 dengan COMMITTED/CANCELLED terminal. SQL dasar STAGED/VALIDATED/COMMITTED/CANCELLED dipertahankan. Status proses UI bukan otomatis state durable DB. OPEN. | 006 tidak menambah state. Tes transisi atomik SRS-51/52 dan UI diperlukan. |
| C58-04 warning | Rekomendasi issue UUID stabil per snapshot sebagai acknowledgement, bukan code/pesan/index. PROPOSED. | DOC-09 string[] belum memiliki ID; PR #17 menerima string/objek, PR #11 menahan commit ber-warning. Tes duplicate code serta invalidasi acknowledgement saat revalidation diperlukan. |
| C58-05 expiry/replay | Rekomendasi preview 30 menit DOC-08, waktu server otoritatif; replay sukses key/payload sama diperiksa sebelum expiry baru, payload berubah 409. PROPOSED. | Jangan retry mutasi unknown otomatis. Core menjaga file dan batch UUID pada unknown COMMIT; tes PASS. Pemulihan HTTP upload/validation/commit/cancel masih OPEN dalam 22 operasi; tidak menambah endpoint status tanpa keputusan. |
| Correlation/actor | Audit/core memakai UUID server bila header invalid. Actor dari provider sah, role dan gudang diulang di DB. Batas teknis UJI terimplementasi; header wire global tetap review Luthfi. | Core 5223bd3 dan audit 004, tes redaksi/invalid header PASS. Runtime #18 masih menerima correlation string terbatas. Belum provider endpoint SRS-47/48. |
| C58-06 cutoff | Baseline UJI §13.1 berlaku; 005 kandidat. Precision eksplisit, timezone, status dan VERIFIED terpisah. | D-01–D-06 di atas, PR #14; enam tes 005 PASS. Tidak fallback APP_TIMEZONE untuk sumber. |
| C58-07 inbound | Grain/line key, expected >0 versus >=0, completion/release, periode dan eligibility SOURCE REQUIRED. | SRS-37/39, DOC-05 BR-INB-03/04 dan OD-06. Staging menyimpan PENDING; quantity nol atau closing reference belum dinyatakan sah untuk commit. |
| C58-08 sumber | Header, locale, UOM, limit dan domain key SOURCE REQUIRED untuk ACTUAL. Fixture UJI mempunyai versi parser terpisah. | SRS-35/37; tidak membuat parser mitra dengan header tebakan. |
| C58-09 proyeksi | Management hanya view sesuai SRS-36; tidak mendapat raw, preview privat atau storage key. Alias/reason/count detail direview owner. | Routing matriks PASS; proyeksi backend dan lookup masih bergantung SRS-47/48. |

## Sumber yang memengaruhi implementasi

SRS-35: branch docs/SRS-35-source-baseline@0a2f418c9231e62711e8cf0c4fff5fd5fbd81f99, development-docs/REGISTER_SUMBER_SRS-35.md. Register memuat versi/hash DOC-00/03/04/13/15/16 draft 0.2.0 dan design SRC-09 v1.0.0 untuk ditinjau. SRC-03 SRS final 29 FR/14 NFR, SRC-04 PRD/business flow/BPMN final, SRC-05/06 UML final, SRC-07 spesifikasi 55 tes asli dan SRC-08 sampel/master mitra masih SOURCE REQUIRED. Slot administratif tidak menggantikan identitas asli. Snapshot hash sumber yang dibaca disimpan bersama evidence sesi.

SRS-39: docs/SRS-39-inbound-metrics@60ca3b084e78a77f675f9d6ead09935a5302a8c8, development-docs/KONTRAK_INBOUND_METRIK_SRS-39.md. Sumber draft menyatakan parsial bukan final, quantity terpenuhi bukan bukti penutupan, final hanya setelah closing sah, serta overdue terbuka terpisah dari delay/mismatch final. Denominator nol menghasilkan null beralasan. Pertanyaan yang diajukan: business line key EXPECTED; apakah quantity nol sah; jenis/pemilik bukti closing; timestamp completion/release; koreksi dan batas periode eligible. Sambil menunggu, simpan representasi dan lineage UJI; jangan menghitung metrik ACTUAL.

## Handoff dan checklist 16 tugas Adam

| Issue | Keluaran berikutnya | Dependency/penerima dan evidence |
| --- | --- | --- |
| SRS-35 | Cocokkan sumber final dengan register hash dan ID. | Mitra/BA; Luthfi/Dwi review. Register tersedia; FR/NFR asli belum tersedia. |
| SRS-39 | Tutup closing/release/periode/eligible melalui sumber. | Mitra/PM; Luthfi/Dwi. Kontrak draft 60ca3b0, metrik NOT RUN. |
| SRS-42 | Uji DTO bisnis versus envelope per endpoint. | SRS-43/58; Luthfi/Vassell. Health/error tersedia; endpoint bisnis belum lengkap. |
| SRS-49 | Review transaksi/audit lalu integrasi 004. | PR #18/#15; Luthfi/Dwi. PR #22, integrasi 17e0a1a lulus 178 tes. |
| SRS-54 | Review harness/CI role/storage, perluas browser upload. | Luthfi/Dwi/Vassell. Node 22/PG16.6; smoke 2 PASS/1 SKIPPED auth. |
| SRS-58 | Review API/schema 22 operasi, revisi snapshot berversi setelah keputusan. | Luthfi/Dwi/Vassell. PR #20, keputusan baru belum disahkan. |
| SRS-50 | Review core/006, tambah parser sumber dan endpoint berizin. | SRS-48/49; Luthfi SRS-51, Dwi SRS-52. 200 tes PASS, belum Done. |
| SRS-34 | Validator lima kind, referensi dan duplikat bisnis. | SRS-37/38/39/50/51; Luthfi. Struktur fixture diuji, validator bisnis NOT RUN. |
| SRS-16 | Hubungkan UC-01 dengan routing/wizard/backend. | SRS-46/53/48/50/51/52; Vassell. PR #11 draft, halaman belum terintegrasi. |
| SRS-17 | Recovery invalid/expired/changed/cancelled/unknown. | C58, SRS-51/52; Luthfi. Unknown COMMIT core PASS, seluruh outcome HTTP belum diuji. |
| SRS-55 | UC-01 berizin end-to-end. | SRS-47/48/50/51/52/53; Dwi. Fondasi/smoke PASS, alur impor backend BLOCKED. |
| SRS-61 | Enam status, cutoff, rollback, konkurensi/replay hasil. | SRS-29/30/38/52; Dwi/Luthfi. Engine belum siap, NOT RUN. |
| SRS-64 | Regression lintas modul pada build gabungan. | Modul operasional; Vassell/Luthfi. 200 tes core/fondasi bukan full regression. |
| SRS-66 | Review input/parser/query/file/log dan scope. | Build dan SRS-47/48; Luthfi/Dwi. Parameter SQL, metadata strict, file privat/redaksi dites; review lengkap NOT RUN. |
| SRS-57 | Evaluasi IT-01 dari observasi serta feedback nyata. | UC-01/stakeholder; Luthfi/Vassell. Evidence pengembang tersedia, feedback mitra SOURCE REQUIRED. |
| SRS-65 | Evaluasi IT-02/03 dan keterbatasan. | Integrasi/regression/feedback; Dwi/Luthfi. Tidak ada acceptance atau feedback yang dikarang. |

Luthfi dapat memakai StageAuthorizer dan readOwnedStaging pada branch core untuk mengembangkan SRS-47/48/51 sekarang, sambil review API #20 dan audit #22. Dwi diminta review nonpenulis shutdown #18, transaksi/schema #22, kandidat 005 dan 006; lanjut SRS-52 setelah preview SRS-51 siap.

Vassell dapat mengambil routing #24 dari develop lalu memperbarui branch ImportWizard #17/SRS-53 dan memasangnya pada halaman melalui boundary #11. Komponen memiliki fase invalid/cancel/unknown, expiry dan event confirm(ids), checkStatus, revalidate, changeContext. Wiring wajib menghubungkan onContextReset dengan abort request serta reset selection/preview/cache, kemudian menyelaraskan warning UUID dan server expiry. String warning legacy tidak menjadi acknowledgement otomatis. UC-16 tetap internal; UC-11/12 mengikuti batas view SRS-36. Pemeriksaan ini adalah kompatibilitas interface; mounting dan browser upload belum dilakukan.

Deskripsi 16 task Adam serta SRS-86/87 sudah memakai akun Assignee aktual dan reviewer nonpenulis. Parent SRS-86→SRS-29 dan SRS-87→SRS-30 dipertahankan; SRS-86 mewarisi dependency SRS-26/27, SRS-87 mewarisi SRS-29 dan CF-04/05. Penetapan reviewer bukan bukti review selesai.

## Forecast aktual

Checkpoint 23 November 2026 pukul 02.08 WIB: target 22 November 18.00 WIB tidak tercapai. Jalur SRS-43/44→47→48→50→51→52 belum selesai. Fondasi 44 dan routing 46 terbuka, core 50 siap review; 18/20/22/23 masih membutuhkan review nonpenulis atau keputusan. Tanpa bukti SRS-47/48/51/52 dan UC-01 terintegrasi, tanggal Done baru belum dapat dipertanggungjawabkan.

Tindakan yang tersedia: reviewer memeriksa kandidat sekarang; Luthfi menyelaraskan actor/preview, Dwi meninjau cutoff dan menyiapkan commit, Vassell memasang routing/wizard, Adam melanjutkan parser/validator/recovery sesuai sumber dan endpoint. Reforecast setelah owner memberi ETA dan hasil SRS-47/48/51. SP selesai dihitung dari Jira aktual, bukan jumlah commit atau tes.
