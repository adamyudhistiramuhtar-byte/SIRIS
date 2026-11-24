# Kontrak finalisasi inbound dan metrik — SRS-39

Status: **DRAFT — NEEDS REVIEW; OD-06 OPEN; sumber final SOURCE REQUIRED**

Tanggal: 10 November 2026. Issue: [SRS-39](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-39); snapshot `develop` `ea6dd9cfa4943f1afd546bed2c9cdc965f09ccdd`.

Dokumen ini merangkum sumber yang tersedia untuk review, bukan pengesahan aturan domain, implementasi backend, hasil pengujian, atau data operasional mitra. `design.md` SRC-09 versi 1.0.0 adalah kontrak desain yang **perlu ditinjau**, bukan pengganti SRS final. DOC-03, DOC-05, DOC-09, DOC-13, DOC-15 dan DOC-00 berstatus draft 0.2.0; FR/NFR asli dan sumber analisis final masih SOURCE REQUIRED. Pertahankan baseline 16 UC, 29 FR dan 14 NFR tanpa mengisi identitas yang belum tersedia.

## Aturan inbound untuk ditinjau

| Aspek | Aturan pada sumber yang tersedia | Keterbatasan / keputusan |
| --- | --- | --- |
| Kebutuhan dan janji | Requested date tetap; event INITIAL dan CHANGE dipertahankan, bukan menimpa histori. DOC-05 BR-INB-01/02; DOC-03 UC-02/07. | Urutan, koreksi dan janji yang sah untuk metrik perlu disahkan. |
| Penerimaan parsial | Penerimaan dapat parsial; jumlah yang sudah terpenuhi tidak otomatis menutup inbound. DOC-05 BR-INB-03; DOC-03 UC-03; DOC-13 PVT-06. | Bentuk dan otoritas bukti penutup sah belum final; OD-06. |
| Finalisasi | Final hanya setelah penanda penutup yang sah; quantity mismatch dan delivery delay final tidak dihasilkan untuk inbound yang belum final. DOC-05 BR-INB-03/04. | Kriteria bukti, tanggal completion dan koreksi setelah penutupan belum ditetapkan. Jangan memilih dari asumsi. |
| Exception dan overdue | Delivery delay dan quantity mismatch final disajikan terpisah dari overdue terbuka. DOC-03 UC-04; SRC-09 UI-04/05. | Dasar waktu delay, cutoff, batas hari, timezone dan alasan eksklusi OD-06 belum final. |
| Pemberitahuan | UC-05 menyajikan pemberitahuan di website; SRC-09 UI-05 menampilkan dua kategori final dan overdue terbuka terpisah. | Pemicu, periode dan kebijakan kategori final belum disahkan; jangan menambah kanal email/SMS/push. |
| Scope data | DOC-05 BR-DAT-01/02 memisahkan ACTUAL/UJI; perhitungan dan akses mengikuti scope role/gudang. | Matriks izin final OD-04 masih terbuka. Contoh di bawah semata UJI. |

## Definisi metrik untuk review

Rumus berikut ditranskripsikan dari SRC-09 §6.6 dan [DOC-03 bagian definisi metrik](03_PRODUCT_REQUIREMENTS_DOCUMENT.md). Ini bukan formula baseline final. Kelayakan, interval tanggal dan kebijakan pembulatan tetap memerlukan keputusan OD-06. Kolom grain menyatakan batas yang sumber jelaskan; detail tambahan belum diisi.

| Metrik | Numerator / hasil | Denominator / grain sumber | Pengecualian dan batas |
| --- | --- | --- | --- |
| OTD-R | Final tepat waktu terhadap requested date ×100% | Final eligible untuk R | Record belum final atau tidak eligible tidak menjadi numerator/denominator; kriteria eligible dan tepat waktu OPEN. |
| OTD-C | Final tepat waktu terhadap janji terakhir yang sah sebelum completion ×100% | Final eligible untuk C | Janji sah dan completion memerlukan definisi; record tanpa janji sah tidak dapat diasumsikan eligible. |
| Quantity Mismatch Rate | Final dengan total received ≠ expected ×100% | Final eligible untuk quantity | Parsial belum final tidak dihitung sebagai mismatch final; perbandingan kuantitas/UOM sah perlu sumber. |
| S-FILL | Σ min(received, expected) ×100% | Σ expected; kelompok supplier + material + UOM | Jangan menggabungkan material/UOM tidak kompatibel; eligibility dan expected nol masih perlu konfirmasi. |
| S-LEAD | Σ hari kalender (completion − release) | Jumlah record eligible | Bukti release/completion, tanggal, koreksi dan inclusion OPEN. |
| S-CHANGE | Jumlah event CHANGE dalam cakupan | Hitungan event; tidak memiliki denominator rasio | Periode dan aturan event termasuk koreksi OPEN. |
| I-VAR | Physical quantity − system quantity | Per pasangan valid | Empat status nonvalid tidak memiliki variance; jangan menggabungkan UOM. |
| I-EXACT | Jumlah matched ×100% | Jumlah valid pairs dalam scope | Nonvalid tidak masuk denominator valid pairs. |
| I-COVER | Jumlah valid pairs ×100% | Jumlah snapshot items dalam scope | Pencacahan item dan scope bergantung kontrak yang ditinjau. |
| I-REPEAT | Jumlah item discrepancy pada ≥2 cutoff berbeda dalam periode | Hitungan item pada periode/cutoff yang dipilih | Hanya satu cutoff tidak cukup menilai pengulangan; tampilkan keterbatasan sumber. |

DOC-03 UC-08 menyatakan denominator nol menghasilkan `null` dengan alasan `NO_ELIGIBLE_DATA`; SRC-09 §6.2 menampilkan “Tidak dapat dihitung”. Terapkan hanya sebagai kontrak draft, bukan menetapkan nilai 0%. Daftar eksklusi lengkap, pilihan periode dan grain final **belum tersedia**. Aturan pasangan valid/nonvalid berasal dari SRC-09 §6.5 dan DOC-05 BR-INV-04/05; keputusan cutoff dan latest run tetap perlu review CF-04/05.

## Contoh aritmetika UJI untuk review

Seluruh angka berikut sintetis dan tidak menggambarkan operasi PT Harina. Expected adalah perhitungan dari asumsi fixture, bukan hasil eksekusi aplikasi atau bukti acceptance. Penetapan record eligible hanya asumsi contoh; OD-06 tetap terbuka. Tidak ada expected result di sini yang merupakan kasus uji baseline asli.

| Contoh | Input dan asumsi UJI | Hasil aritmetika di bawah definisi draft | Batas |
| --- | --- | --- | --- |
| Penerimaan parsial | Expected 10 KG; receipt 4 KG, `is_closing=false`. | Belum menghasilkan delivery delay/mismatch **final**. | DOC-13 PVT-06 PROPOSED; NOT RUN. |
| Penutup | Expected 10 KG; parsial 4 KG dan penutup 6 KG yang **diasumsikan sah**. | Total 10 KG; tidak mismatch kuantitas. | DOC-13 PVT-07 PROPOSED; validitas bukti dan delay OD-06; NOT RUN. |
| OTD-R | Empat final **diasumsikan eligible**, tiga tepat waktu terhadap requested date. | 3/4 ×100% = 75%. | Kondisi tepat waktu dan eligibility belum disahkan. |
| OTD-C | Dua final diasumsikan eligible dan keduanya tepat waktu terhadap janji sah yang diasumsikan sebelum completion. | 2/2 ×100% = 100%. | Identitas janji sah, tanggal completion dan eligibility OD-06. |
| Quantity Mismatch Rate | Empat final diasumsikan eligible dan dua memiliki received berbeda dari expected. | 2/4 ×100% = 50%. | UOM dan kelayakan kuantitas diasumsikan sah. |
| S-FILL | Satu kelompok supplier/material/UOM UJI; dua record diasumsikan eligible, expected 10 dan 10 KG, received 8 dan 10 KG. | (min(8,10)+min(10,10))/(10+10) ×100% = 90%. | Bukan agregasi lintas material/UOM; expected nol dan pembulatan belum diputuskan. |
| S-LEAD | Dua record diasumsikan eligible dengan selisih completion−release 8 dan 12 hari kalender. | (8+12)/2 = 10 hari. | Bukti dan semantik tanggal OD-06. |
| S-CHANGE | Dua event CHANGE diasumsikan termasuk cakupan periode yang sama. | 2 event. | Batas periode dan koreksi event belum ditentukan. |
| I-EXACT dan I-COVER | Snapshot 8 item; 5 pasangan valid, 2 matched. | 2/5 ×100% = 40%; 5/8 ×100% = 62,5%. | Angka sesuai fixture SRC-09 §6.6; bukan hasil runtime. |
| I-VAR | Satu pasangan valid UJI: physical 7 KG, system 10 KG. | 7−10 = −3 KG. | Status valid dan UOM sebanding diasumsikan. |
| I-REPEAT | Satu item UJI yang sama mengalami discrepancy pada dua cutoff berbeda dalam periode yang diasumsikan. | 1 item. | Grain item, pemilihan run dan periode memerlukan keputusan. |
| Satu cutoff | Fixture SRC-09 menyatakan I-REPEAT 0 dengan penjelasan satu cutoff. | Angka fixture ditampilkan bersama keterangan bahwa pengulangan lintas cutoff belum dapat dinilai. | Jangan menafsirkan 0 sebagai bukti tidak ada pengulangan pada beberapa cutoff. |

## Keputusan terbuka dan dampak

| Acuan | Keputusan / bukti yang diperlukan | Dampak |
| --- | --- | --- |
| OD-06 | Bukti penutup sah, tanggal completion/release, koreksi receiving dan validitas janji. | UC-03/04/05/08, exception, denominator dan expected result. |
| OD-06 | Basis delay, interval periode, timezone, tanggal inklusif/eksklusif, eligibility, eksklusi dan pembulatan. | Metrik dan notice tidak dapat dinyatakan final atau diuji sebagai acceptance tanpa keputusan. |
| OD-05 / CF-06 | Header dan quantity sumber, key, UOM dan data sumber yang sah. | Agregasi received/expected dan fixture representatif. |
| CF-04/05 | Representasi cutoff, pemilihan latest run dan reuse fingerprint. | UC-14, I-COVER/I-REPEAT serta hasil historis; keputusan belum dapat ditebak. |
| CF-08 | Perbedaan kebutuhan kolom UI dan DTO awal. | Field numerator, denominator, excluded, periode, source refs dan cutoff tidak boleh direkayasa sebagai respons API. |
| SRC-03 / SRC-07 | SRS final dengan FR/NFR asli dan spesifikasi tes asli. | Hubungan FR/NFR ke use case dan cakupan pengujian tetap SOURCE REQUIRED. |

## Keterlacakan dan catatan integrasi

| Use case | Bukti dan konsumsi desain | API draft DOC-09 | Batas implementasi |
| --- | --- | --- | --- |
| UC-03 | DOC-03 UC-03; BR-INB-03; penerimaan parsial/penutup | API-01–05, alur impor | Validasi dan penutup dilakukan pada backend; SRS-39 tidak mengimplementasikannya. |
| UC-04 | DOC-03 UC-04; BR-INB-04; SRC-09 UI-04 | API-06 `GET /inbound/exceptions` | Tampilkan final dan overdue terbuka terpisah; proyeksi serta scope memerlukan review. |
| UC-05 | DOC-03 UC-05; SRC-09 UI-05 | API-07 `GET /inbound/notices` | Kategori dan aturan pemberitahuan final OD-06 OPEN. |
| UC-08 | DOC-03 UC-08; BR-INB-05; SRC-09 UI-08/§6.6 | API-10 `GET /inbound/metrics` | Tampilkan hasil API/domain beserta konteks yang benar-benar dikontrak; jangan hitung ulang asumsi di UI. |
| UC-14 | DOC-03 UC-14; BR-INV-04/05; SRC-09 UI-14/§6.6 | API-16 `GET /inventory/metrics` | Nonvalid tidak diberi variance; latest run/cutoff dan field DTO masih perlu review. |

Endpoint/field di atas adalah usulan DOC-09, bukan bukti implementasi atau persetujuan API. [DOC-15](15_REQUIREMENTS_TRACEABILITY.md) memuat keterlacakan draft; pemetaan ke 29 FR, 14 NFR dan 55 tes asli belum dapat diisi dari asumsi. Dokumen ini tidak memodifikasi baseline, data mitra, atau source code.

## Pemeriksaan dan status

Pemeriksaan dilakukan dengan pembacaan sumber dan kalkulasi aritmetika contoh; PVT-06/PVT-07 dan seluruh pengujian aplikasi **NOT RUN** pada pekerjaan dokumentasi ini. Gate konsistensi FR ↔ UC ↔ tes dan kesesuaian terhadap BPMN/UML final belum dapat dinilai tanpa SRC-03/04/05/06/07. Review independen, persetujuan OD-06 dan PR merged masih diperlukan sebelum Definition of Done SRS-39 dapat dipertimbangkan.
