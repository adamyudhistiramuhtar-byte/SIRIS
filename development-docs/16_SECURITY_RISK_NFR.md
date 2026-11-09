# Keamanan, Risiko, dan Verifikasi NFR

## Identitas dan kendali dokumen

| Atribut | Nilai |
| --- | --- |
| Document ID | DOC-16 |
| Nama proyek | SIRIS — Capstone Project Kelompok 42 |
| Mitra | Warehouse PT Harina Chemicals Industry |
| Versi | 0.2.0 |
| Status dokumen | DRAFT — NEEDS REVIEW |
| Tanggal penyusunan | 2026-11-10 |
| Pemilik dokumen | QA Engineer |
| Tujuan dokumen | Merencanakan kontrol keamanan dan verifikasi kualitas. |
| Ruang lingkup | Website pendamping Erasoft; Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation. |

Ketentuan pengguna diberi rujukan **SRC-01**. Desain baru berstatus **PROPOSED**, bukan BASELINE APPROVED. Belum ada aplikasi, hasil pengujian runtime, evaluasi stakeholder, atau persetujuan rilis yang dibuktikan dalam workspace ini. Semua contoh adalah **UJI**.

## Daftar isi

1. Identitas dan kendali dokumen
2. Referensi
3. Tujuan keamanan dan model kualitas
4. Kontrol dan verifikasi yang diturunkan dari aturan
5. Keamanan file dan data privat
6. Register verifikasi 14 NFR existing
7. Risiko operasional dan mitigasi
8. Kriteria penerimaan keamanan
9. Definisi metrik dari SRC-09 dan batas verifikasi
10. Dependencies
11. Open issues
12. Riwayat revisi

## Referensi

SRC-01: master prompt pengguna pada sesi penyusunan; SRC-02: `../AGENTS.md`. SRC-09: `../design.md` v1.0.0, kontrak desain untuk ditinjau yang tersedia pada pemeriksaan akhir; snapshot visual disertakan pada DOC-10. Register sumber lengkap, hierarki, dan sumber eksternal terdapat pada [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md). Rujukan antardokumen: [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md), [DOC-04](04_SOFTWARE_REQUIREMENTS_SPECIFICATION.md), [DOC-05](05_BUSINESS_RULES_RBAC.md), [DOC-06](06_SOFTWARE_ARCHITECTURE_DESIGN.md), [DOC-07](07_DATABASE_DESIGN.md), [DOC-09](09_API_SPECIFICATION.md), [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md), [DOC-15](15_REQUIREMENTS_TRACEABILITY.md), [DOC-17](17_DEPLOYMENT_OPERATIONAL_GUIDE.md).

## Tujuan keamanan dan model kualitas

Tujuannya menjaga kerahasiaan file, integritas hasil, scope akses dan kemampuan penelusuran. [ISO/IEC 25010:2023](https://www.iso.org/standard/78176.html) dipakai sebagai rujukan model kualitas produk untuk meninjau kebutuhan yang relevan; bukan alasan menambah 14 NFR baru atau menetapkan threshold tanpa sumber. Atribut dan target 14 NFR asli tetap SOURCE REQUIRED. Tidak ada klaim audit keamanan atau kepatuhan standar penuh telah lulus.

## Kontrol dan verifikasi yang diturunkan dari aturan

| Area | Kontrol PROPOSED / ketentuan sumber | Metode verifikasi | Kriteria observasi | Status |
| --- | --- | --- | --- | --- |
| Access control | Deny-by-default; role + gudang + objek pada backend | Direct request lintas role/gudang | Data tak berizin tidak terbaca/tertulis | NOT RUN |
| Session | Sesi server; cookie HttpOnly Secure SameSite; CSRF; logout invalidasi | Inspeksi konfigurasi dan uji reuse/CSRF | Sesi tidak sah ditolak; secret tidak di JS | PROPOSED; NOT RUN |
| Upload | Allowlist tipe; cek signature; size evidence <=5 MiB; nama storage acak | UJI rename extension, batas ukuran, path traversal | File tidak sah ditolak; tidak dieksekusi | NOT RUN |
| Input validation | Schema request; enum; decimal; sumber timezone; batas parser | Fuzz field dan invalid format | Tidak ada coercion diam-diam atau domain parsial | NOT RUN |
| SQL injection | Query parameterized; identitas kolom sort allowlist | Payload SQL pada filter dan source field | Tidak mengubah struktur query/akses | NOT RUN |
| Error exposure | DTO error aman + correlation_id | Inspeksi 4xx/5xx dan response Management | Tidak ada SQL/stack/storage key/raw | NOT RUN |
| Confidentiality | HTTPS; jaringan DB privat; storage di luar web root | Inspeksi routing dan akses langsung | Objek privat tidak dapat diakses tanpa izin | NOT RUN |
| Sensitive data | Secret di runtime secret store/env; fixture tanpa data mitra | Review repository/log/backup | Tidak ada credential atau data aktual palsu | NOT RUN |
| Audit integrity | Append-only, role DB tanpa update/delete audit; korelasi | Uji operasi dan upaya mutasi audit | SUCCESS/FAILURE/CANCELLED sesuai bukti | NOT RUN |
| Reliability | Transaksi, unique constraints, idempotency, restore | Fault injection dan concurrency | Tidak ada data parsial/duplikat; restore dapat diperiksa | NOT RUN |
| UI accessibility | Keyboard, kontras, label dan status | Pemeriksaan DOC-10 + uji runtime | Kriteria desain terverifikasi; NFR asli tetap dipetakan | NEEDS BASELINE; NOT RUN |

## Keamanan file dan data privat

Rekomendasi upload memakai pemeriksaan extension, MIME dan signature, nama penyimpanan yang tidak dikendalikan pengguna, serta lokasi privat. Content-type browser tidak menjadi satu-satunya bukti tipe. Batas evidence dihitung byte server. Parser tidak menjalankan macro/script; pemeriksaan malware merupakan opsi deployment yang perlu keputusan, bukan fitur OCR. Referensi teknis: [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

Backend tidak mengembalikan raw_storage_key maupun private_storage_key kepada role mana pun; Management juga dilarang memperoleh raw content. Lineage untuk Management cukup metadata aman/ID proses yang telah diotorisasi. Log operasional menghindari raw payload dan credential. Retensi, enkripsi backup dan akses petugas operasional ditetapkan melalui OD-08. Tidak ada role aplikasi kelima bernama Admin; operator deployment adalah tanggung jawab tim, bukan UC bisnis baru.

## Register verifikasi 14 NFR existing

Setiap baris adalah slot sumber, bukan kategori NFR rekaan. Cara verifikasi spesifik tidak dapat dipilih sebelum statement aslinya diketahui. Prosedur pemulihan per baris: baca ID/statement final → identifikasi atribut/kondisi → pilih test/measurement/inspection/demonstration → tetapkan dataset/alat/target dari sumber → tautkan TC asli → review QA. Kolom yang belum diketahui wajib diselesaikan sebelum menyatakan coverage NFR lengkap.
| Slot | NFR ID/statement asli | Cara verifikasi spesifik | Target / kondisi ukur | Test ID baseline | Hasil |
| --- | --- | --- | --- | --- | --- |
| NFR slot 01 | SOURCE REQUIRED | SOURCE REQUIRED; pilih setelah statement tersedia | NEEDS BASELINE | SOURCE REQUIRED | NOT RUN |
| NFR slot 02 | SOURCE REQUIRED | SOURCE REQUIRED; pilih setelah statement tersedia | NEEDS BASELINE | SOURCE REQUIRED | NOT RUN |
| NFR slot 03 | SOURCE REQUIRED | SOURCE REQUIRED; pilih setelah statement tersedia | NEEDS BASELINE | SOURCE REQUIRED | NOT RUN |
| NFR slot 04 | SOURCE REQUIRED | SOURCE REQUIRED; pilih setelah statement tersedia | NEEDS BASELINE | SOURCE REQUIRED | NOT RUN |
| NFR slot 05 | SOURCE REQUIRED | SOURCE REQUIRED; pilih setelah statement tersedia | NEEDS BASELINE | SOURCE REQUIRED | NOT RUN |
| NFR slot 06 | SOURCE REQUIRED | SOURCE REQUIRED; pilih setelah statement tersedia | NEEDS BASELINE | SOURCE REQUIRED | NOT RUN |
| NFR slot 07 | SOURCE REQUIRED | SOURCE REQUIRED; pilih setelah statement tersedia | NEEDS BASELINE | SOURCE REQUIRED | NOT RUN |
| NFR slot 08 | SOURCE REQUIRED | SOURCE REQUIRED; pilih setelah statement tersedia | NEEDS BASELINE | SOURCE REQUIRED | NOT RUN |
| NFR slot 09 | SOURCE REQUIRED | SOURCE REQUIRED; pilih setelah statement tersedia | NEEDS BASELINE | SOURCE REQUIRED | NOT RUN |
| NFR slot 10 | SOURCE REQUIRED | SOURCE REQUIRED; pilih setelah statement tersedia | NEEDS BASELINE | SOURCE REQUIRED | NOT RUN |
| NFR slot 11 | SOURCE REQUIRED | SOURCE REQUIRED; pilih setelah statement tersedia | NEEDS BASELINE | SOURCE REQUIRED | NOT RUN |
| NFR slot 12 | SOURCE REQUIRED | SOURCE REQUIRED; pilih setelah statement tersedia | NEEDS BASELINE | SOURCE REQUIRED | NOT RUN |
| NFR slot 13 | SOURCE REQUIRED | SOURCE REQUIRED; pilih setelah statement tersedia | NEEDS BASELINE | SOURCE REQUIRED | NOT RUN |
| NFR slot 14 | SOURCE REQUIRED | SOURCE REQUIRED; pilih setelah statement tersedia | NEEDS BASELINE | SOURCE REQUIRED | NOT RUN |

## Risiko operasional dan mitigasi

| Risiko | Dampak | Mitigasi | Pemilik | Status |
| --- | --- | --- | --- | --- |
| Referensi/marker penutup tidak sah | Metrik menyesatkan | Tahan finalisasi, validasi bukti dan OD-06 | BA | OPEN |
| Mode/gudang tercampur | Hasil rekonsiliasi salah atau kebocoran | Scope pada query, transaksi dan FK/service | Backend/QA | OPEN |
| Hash sama dianggap identik tanpa konteks | Retry salah dataset | Hash meliputi metadata dan versi aturan | Backend | OPEN |
| Audit ikut hilang saat rollback | Tidak dapat menjelaskan kegagalan | Transaksi audit terpisah setelah rollback; fallback log aman | Backend/Operations | OPEN |
| DB dan file backup tidak konsisten | Evidence hilang atau yatim | Backup berpasangan, manifest hash, restore rehearsal | Database/Operations | OPEN |
| Target NFR tidak tersedia | Hasil ukur tak dapat dinilai | NEEDS BASELINE; jangan klaim pass | QA | OPEN |
| Data ACTUAL belum tersedia | UAT tidak mewakili operasional | Label UJI, catat keterbatasan dan rencana validasi aktual | BA | OPEN |

## Kriteria penerimaan keamanan

Kriteria rilis usulan: bukti denial lintas scope, file privat, no partial commit, idempotency, audit dan restore tersedia; defect penghalang diselesaikan; 14 NFR asli memiliki metode dan hasil verifikasi atau keputusan penanganan eksplisit. Threshold response time, concurrency, file impor, RPO/RTO dan kapasitas storage tetap NEEDS BASELINE. Daftar kontrol ini tidak menggantikan NFR baseline.

## Definisi metrik dari SRC-09 dan batas verifikasi

SRC-09 §6.6 menyediakan enam metrik supplier dan empat metrik persediaan. Definisi ini menggantikan pernyataan bahwa tidak ada definisi metrik sama sekali; statusnya **bersumber dari kontrak desain untuk ditinjau**, bukan pengganti SRS/analisis fitur final. Sumber analisis yang dirujuk SRC-09 masih SOURCE REQUIRED.

| Metrik | Definisi tampilan dan batas |
| --- | --- |
| OTD-R | Final tepat waktu terhadap requested date / final eligible untuk R ×100% |
| OTD-C | Final tepat waktu terhadap janji terakhir yang sah sebelum completion / final eligible untuk C ×100% |
| Quantity Mismatch Rate | Final dengan total received ≠ expected / final eligible untuk quantity ×100% |
| S-FILL | Σmin(received,expected)/Σexpected ×100%, per supplier+material+UOM |
| S-LEAD | Rata-rata hari kalender completion−release untuk record eligible |
| S-CHANGE | Jumlah event CHANGE yang termasuk cakupan |
| I-VAR | Physical quantity−system quantity per pasangan valid |
| I-EXACT | Matched/valid pairs ×100% |
| I-COVER | Valid pairs/snapshot items in scope ×100% |
| I-REPEAT | Jumlah item discrepancy pada sedikitnya dua cutoff berbeda dalam periode |

Eligibility final, bukti completion/release, kebijakan interval tanggal, koreksi event dan tie-break latest run tetap OD-06. Denominator nol unavailable, tidak 0%; S-FILL tidak menggabungkan material/UOM; I-REPEAT memerlukan konteks beberapa cutoff. Target performa numerik pada SRC-09 §7.3 adalah target desain sumber, bukan 14 NFR baseline yang telah disetujui. Jangan membuat threshold baru atau menyatakan target tersebut tercapai.

## Dependencies

| Dependensi | Kegunaan |
| --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | Indeks Induk Dokumentasi Pengembangan |
| [DOC-04](04_SOFTWARE_REQUIREMENTS_SPECIFICATION.md) | Spesifikasi Kebutuhan Perangkat Lunak |
| [DOC-05](05_BUSINESS_RULES_RBAC.md) | Spesifikasi Aturan Bisnis dan RBAC |
| [DOC-06](06_SOFTWARE_ARCHITECTURE_DESIGN.md) | Arsitektur Perangkat Lunak dan Desain Terperinci |
| [DOC-07](07_DATABASE_DESIGN.md) | Desain Database, ERD, IRD, dan Kamus Data |
| [DOC-09](09_API_SPECIFICATION.md) | Spesifikasi REST API |
| [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md) | Rencana dan Spesifikasi Kasus Pengujian |
| [DOC-15](15_REQUIREMENTS_TRACEABILITY.md) | Ketertelusuran Kebutuhan dan Pengendalian Perubahan |
| [DOC-17](17_DEPLOYMENT_OPERATIONAL_GUIDE.md) | Panduan Deployment dan Operasional |

## Open issues

Rincian baseline final belum tersedia; lihat register sumber dan keputusan terbuka pada DOC-00.

## Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1.0 | 2026-11-10 | Penyusunan berdasarkan SRC-01; celah sumber dicatat dan desain ditandai PROPOSED. | Belum ada bukti persetujuan |
| 0.2.0 | 2026-11-10 | Integrasi SRC-09 design.md: route, role, token, layar pendukung, metrik dan konflik desain; tetap NEEDS REVIEW. | Belum ada bukti persetujuan |
