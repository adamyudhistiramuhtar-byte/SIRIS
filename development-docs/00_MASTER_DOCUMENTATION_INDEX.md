# Indeks Induk Dokumentasi Pengembangan

## Identitas dan kendali dokumen

| Atribut | Nilai |
| --- | --- |
| Document ID | DOC-00 |
| Nama proyek | SIRIS — Capstone Project Kelompok 42 |
| Mitra | Warehouse PT Harina Chemicals Industry |
| Versi | 0.2.0 |
| Status dokumen | DRAFT — NEEDS REVIEW |
| Tanggal penyusunan | 2026-11-10 |
| Pemilik dokumen | Technical Documentation Specialist |
| Tujuan dokumen | Mengendalikan navigasi, sumber, status, dan konsistensi paket. |
| Ruang lingkup | Website pendamping Erasoft; Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation. |

Ketentuan pengguna diberi rujukan **SRC-01**. Desain baru berstatus **PROPOSED**, bukan BASELINE APPROVED. Belum ada aplikasi, hasil pengujian runtime, evaluasi stakeholder, atau persetujuan rilis yang dibuktikan dalam workspace ini. Semua contoh adalah **UJI**.

## Daftar isi

1. Identitas dan kendali dokumen
2. Referensi
3. Identitas proyek dan cara menggunakan paket
4. Register sumber dan hierarki
5. Referensi eksternal yang diperiksa
6. Daftar dokumen, tujuan, pemilik, versi, dan status
7. Hubungan dan dependency antardokumen
8. Documentation completeness matrix
9. Open decisions dan pekerjaan sebelum development
10. Urutan penyelesaian gap
11. Ringkasan pemeriksaan konsistensi dan batas bukti
12. Paket penyerahan
13. Kriteria versi dan documentation change log
14. Kamus istilah terkendali
15. Rekonsiliasi sumber baru SRC-09 dan konflik terbuka
16. Dependencies
17. Open issues
18. Riwayat revisi

## Referensi

SRC-01: master prompt pengguna pada sesi penyusunan; SRC-02: `../AGENTS.md`. SRC-09: `../design.md` v1.0.0, kontrak desain untuk ditinjau yang tersedia pada pemeriksaan akhir; snapshot visual disertakan pada DOC-10. Register sumber lengkap, hierarki, dan sumber eksternal terdapat pada [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md). Rujukan antardokumen: [DOC-01](01_PROJECT_CHARTER_SCOPE.md), [DOC-02](02_PROTOTYPING_DEVELOPMENT_PLAN.md), [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md), [DOC-04](04_SOFTWARE_REQUIREMENTS_SPECIFICATION.md), [DOC-05](05_BUSINESS_RULES_RBAC.md), [DOC-06](06_SOFTWARE_ARCHITECTURE_DESIGN.md), [DOC-07](07_DATABASE_DESIGN.md), [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md), [DOC-09](09_API_SPECIFICATION.md), [DOC-10](10_UI_UX_PROTOTYPE_SPECIFICATION.md), [DOC-11](11_DEVELOPMENT_BACKLOG_WBS.md), [DOC-12](12_PROTOTYPE_ITERATION_FEEDBACK.md), [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md), [DOC-14](14_USER_ACCEPTANCE_TESTING.md), [DOC-15](15_REQUIREMENTS_TRACEABILITY.md), [DOC-16](16_SECURITY_RISK_NFR.md), [DOC-17](17_DEPLOYMENT_OPERATIONAL_GUIDE.md), [DOC-18](18_USER_MANUAL_HANDOVER.md).

## Identitas proyek dan cara menggunakan paket

SIRIS — Capstone Project Kelompok 42; mitra Warehouse PT Harina Chemicals Industry; pendekatan SDLC Prototyping yang iteratif. Sistem mendampingi Erasoft untuk Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation. Stack rencana: Vue 3, Node.js/Express.js, PostgreSQL, REST API, web client–server.

Mulai dari DOC-01 dan DOC-03 untuk tujuan/fitur; DOC-04/DOC-05 untuk kebutuhan/aturan; DOC-06–DOC-10 untuk desain; DOC-11 untuk pembagian kerja; DOC-13/DOC-16 untuk QA; DOC-12/DOC-14 untuk evaluasi; DOC-17/DOC-18 untuk operasi dan penyerahan. **Paket siap ditinjau, belum baseline final dan belum siap dijadikan bukti implementasi atau kelulusan pengujian.**

## Register sumber dan hierarki

| Source ID | Sumber | Ketersediaan | Penggunaan / batas |
| --- | --- | --- | --- |
| SRC-01 | Master prompt pengguna: SIRIS Software Development Documentation | Tersedia dalam percakapan penyusunan | 16 UC, jumlah FR/NFR/tes, 4 role, stack dan aturan bisnis |
| SRC-02 | AGENTS.md repositori | Dibaca pada 2026-11-10 | Aturan dokumentasi, scope, integritas dan lokasi berkas |
| SRC-03 | SRS final beserta 29 FR dan 14 NFR | SOURCE REQUIRED | Tidak merekayasa ID/statement/mapping |
| SRC-04 | PRD dan business flow final; BPMN baseline | SOURCE REQUIRED | Tidak membuat ulang AS-IS/TO-BE |
| SRC-05 | DESAIN-42-1.1 | SOURCE REQUIRED | Tetap berlaku kecuali bagian direvisi eksplisit |
| SRC-06 | REVISI-UML-42-1.2 | SOURCE REQUIRED | Bila hanya Activity/Sequence/Class, tidak mengganti seluruh desain |
| SRC-07 | 55 spesifikasi pengujian asli | SOURCE REQUIRED | 29 FR + 12 batas/kegagalan + 14 NFR |
| SRC-08 | File operasional, master, penerimaan, janji, physical count | SOURCE REQUIRED | Belum ada bukti ketersediaan ACTUAL |
| SRC-09 | design.md v1.0.0 — Frontend Design Contract | Tersedia pada pemeriksaan akhir; dibaca | Route, role view, 17 layar, token dan definisi metrik; status sumber untuk ditinjau, bukan approved |

Hierarki: baseline final disetujui → revisi yang eksplisit mengganti → daftar fitur/business flow pengguna → keputusan teknis terkonfirmasi → standar relevan → desain AI PROPOSED. Konflik antara desain usulan awal dan SRC-09 tercatat pada CF-01–CF-09. File baseline final belum tersedia; konsistensi sumber final belum dapat dinilai. Konflik mendatang dicatat bagian/versi, konsekuensi, dasar keputusan dan OPEN DECISION bila belum dapat diputuskan.

## Referensi eksternal yang diperiksa

Referensi resmi diakses pada 2026-11-10. Halaman katalog ISO dipakai untuk identitas dan tujuan standar; teks penuh dan kepatuhan klausul belum diaudit. Desain SIRIS berasal dari SRC-01 dan usulan tim, bukan dianggap sebagai persyaratan universal standar.

| Referensi | Pemakaian terbatas |
| --- | --- |
| [ISO/IEC/IEEE 29148:2018](https://www.iso.org/standard/72089.html) | Prinsip requirements engineering DOC-04 |
| [ISO/IEC 25010:2023](https://www.iso.org/standard/78176.html) | Rujukan model kualitas DOC-16 |
| [ISO/IEC/IEEE 29119-3:2021](https://www.iso.org/standard/79429.html) | Struktur dokumentasi pengujian DOC-13 |
| [OMG UML 2.5.1](https://www.omg.org/spec/UML/2.5.1/) | Rujukan notasi model, tanpa mengklaim diagram baseline telah diperiksa |
| [OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html) | Kontrak HTTP/schema pada DOC-09; bukan kewajiban upgrade ke versi lain |
| [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) | Kontrol akses backend |
| [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) | Perlindungan upload privat |
| [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html) | Rujukan transaksi all-or-nothing |
| [PostgreSQL Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) | Rujukan integritas schema |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Target desain aksesibilitas PROPOSED |
| [Lucide License](https://lucide.dev/license) | Pilihan icon library PROPOSED; lisensi ISC |

## Daftar dokumen, tujuan, pemilik, versi, dan status

| Dokumen | Tujuan / isi utama | Pemilik | Versi | Status penyusunan |
| --- | --- | --- | --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | Indeks Induk Dokumentasi Pengembangan | Technical Documentation Specialist | 0.2.0 | Tersusun; NEEDS REVIEW |
| [DOC-01](01_PROJECT_CHARTER_SCOPE.md) | Piagam Proyek dan Definisi Ruang Lingkup | Business Analyst | 0.2.0 | Tersusun; NEEDS REVIEW |
| [DOC-02](02_PROTOTYPING_DEVELOPMENT_PLAN.md) | Rencana Pengembangan Prototyping | Fullstack Development Lead | 0.2.0 | Tersusun; NEEDS REVIEW |
| [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md) | Dokumen Kebutuhan Produk | Business Analyst | 0.2.0 | Tersusun; NEEDS REVIEW |
| [DOC-04](04_SOFTWARE_REQUIREMENTS_SPECIFICATION.md) | Spesifikasi Kebutuhan Perangkat Lunak | Requirements Engineer | 0.2.0 | Tersusun; NEEDS REVIEW |
| [DOC-05](05_BUSINESS_RULES_RBAC.md) | Spesifikasi Aturan Bisnis dan RBAC | Requirements Engineer | 0.2.0 | Tersusun; NEEDS REVIEW |
| [DOC-06](06_SOFTWARE_ARCHITECTURE_DESIGN.md) | Arsitektur Perangkat Lunak dan Desain Terperinci | Software Architect | 0.2.0 | Tersusun; NEEDS REVIEW; PROPOSED |
| [DOC-07](07_DATABASE_DESIGN.md) | Desain Database, ERD, IRD, dan Kamus Data | Database Architect | 0.2.0 | Tersusun; NEEDS REVIEW; PROPOSED |
| [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md) | Kontrak Data, Pemetaan Impor, dan Validasi | Database Architect | 0.2.0 | Tersusun; NEEDS REVIEW; PROPOSED |
| [DOC-09](09_API_SPECIFICATION.md) | Spesifikasi REST API | Fullstack Development Lead | 0.2.0 | Tersusun; NEEDS REVIEW; PROPOSED |
| [DOC-10](10_UI_UX_PROTOTYPE_SPECIFICATION.md) | Spesifikasi Prototipe UI/UX | UI/UX Designer | 0.2.0 | Tersusun; NEEDS REVIEW; PROPOSED |
| [DOC-11](11_DEVELOPMENT_BACKLOG_WBS.md) | Backlog Pengembangan, WBS, dan Rencana Implementasi | Fullstack Development Lead | 0.2.0 | Tersusun; NEEDS REVIEW |
| [DOC-12](12_PROTOTYPE_ITERATION_FEEDBACK.md) | Catatan Iterasi, Review, dan Feedback Prototipe | Business Analyst | 0.2.0 | Tersusun; NEEDS REVIEW |
| [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md) | Rencana dan Spesifikasi Kasus Pengujian | QA Engineer | 0.2.0 | Tersusun; NEEDS REVIEW |
| [DOC-14](14_USER_ACCEPTANCE_TESTING.md) | Pengujian Penerimaan Pengguna | QA Engineer | 0.2.0 | Tersusun; NEEDS REVIEW |
| [DOC-15](15_REQUIREMENTS_TRACEABILITY.md) | Ketertelusuran Kebutuhan dan Pengendalian Perubahan | Requirements Engineer | 0.2.0 | Tersusun; NEEDS REVIEW |
| [DOC-16](16_SECURITY_RISK_NFR.md) | Keamanan, Risiko, dan Verifikasi NFR | QA Engineer | 0.2.0 | Tersusun; NEEDS REVIEW |
| [DOC-17](17_DEPLOYMENT_OPERATIONAL_GUIDE.md) | Panduan Deployment dan Operasional | Fullstack Development Lead | 0.2.0 | Tersusun; NEEDS REVIEW; PROPOSED |
| [DOC-18](18_USER_MANUAL_HANDOVER.md) | Panduan Pengguna dan Serah Terima | Technical Documentation Specialist | 0.2.0 | Tersusun; NEEDS REVIEW |

## Hubungan dan dependency antardokumen

| Kelompok | Input | Output / pemakai |
| --- | --- | --- |
| Communication | SRC-01–SRC-08 | DOC-01, DOC-03–DOC-05 → seluruh desain dan tes |
| Quick Plan | Kebutuhan, kapasitas empat anggota | DOC-02/DOC-11 → urutan implementasi dan evaluasi |
| Quick Design | UC, BR, kontrak sumber | DOC-06–DOC-10 saling menyelaraskan entity/DTO/layar |
| Construction | Desain ditinjau, implementasi tersedia | DOC-11/DOC-13/DOC-16 → evidence dan defect |
| Delivery & Feedback | Build dan evidence nyata | DOC-12/DOC-14/DOC-17/DOC-18 → feedback dan CR |
| Pengendalian lintas tahap | Seluruh versi/sumber | DOC-00/DOC-15 → dependency, gap dan perubahan |

Alur di atas bukan gerbang linear: feedback dapat kembali ke analisis/desain, kemudian diikuti pembaruan backlog dan regresi. Setiap dokumen memuat dependencies khusus.

## Documentation completeness matrix

| Area | Isi yang tersedia | Gap / status |
| --- | --- | --- |
| 19 dokumen | 19 Markdown bernama sesuai permintaan, metadata dan referensi silang | Review manusia dan approval belum tersedia |
| 16 UC | Inventaris dan spesifikasi tiap UC pada DOC-03; pemetaan desain DOC-15 | Mapping FR/role/route mengikuti SRC-09 untuk draft; validasi terhadap SRS final SOURCE REQUIRED |
| 29 FR | 29 slot sumber DOC-04 dan DOC-15 | 0 statement/ID asli tersedia |
| 14 NFR | 14 slot sumber dan prosedur verifikasi DOC-16 | 0 statement/ID asli tersedia; target NEEDS BASELINE |
| 55 tes baseline | 55 slot (29+12+14) DOC-13 | ID dan expected result sumber belum tersedia |
| Tes turunan | 23 skenario PVT dengan langkah/expected berdasar BR | PROPOSED; terpisah dari 55 baseline; semuanya NOT RUN |
| Database/API/UI | Schema, ERD source, dictionary, kontrak, endpoint, route, komponen dan state | PROPOSED; implementasi belum tersedia; kontrak OpenAPI seluruh endpoint disertakan, validator OpenAPI khusus belum dijalankan |
| UML/BPMN baseline | Dependency dan batas revisi dicatat; satu class model usulan dan sequence impor source | Diagram final sumber belum dibandingkan; BPMN tidak dibuat ulang |
| Metode Prototyping | 5 iterasi rencana, feedback form, CR, retest dan UAT | NOT EXECUTED; tidak ada feedback/penerimaan mitra |
| Deployment/manual | Runbook rencana dan panduan tiap UC | Belum dapat menjadi instruksi operasional aplikasi yang tersedia |

## Open decisions dan pekerjaan sebelum development

| ID | Keputusan / sumber yang dibutuhkan | Pemilik peran | Dokumen terdampak | Status |
| --- | --- | --- | --- | --- |
| OD-01 | SRS final: ID, isi dan mapping 29 FR serta 14 NFR | Requirements Engineer | DOC-04, DOC-13, DOC-15, DOC-16 | SOURCE REQUIRED |
| OD-02 | 55 spesifikasi pengujian asli beserta ID dan expected result | QA Engineer | DOC-13, DOC-14, DOC-15 | SOURCE REQUIRED |
| OD-03 | DESAIN-42-1.1, REVISI-UML-42-1.2, business flow final, PRD dan route baseline | Software Architect | DOC-03, DOC-06–DOC-10 | SOURCE REQUIRED |
| OD-04 | Matriks izin role × UC × aksi × gudang final | Business Analyst | DOC-05, DOC-09, DOC-10, DOC-14 | OPEN DECISION |
| OD-05 | File sumber asli, sheet/header, tipe file, key bisnis, UOM, timezone dan cutoff | Database Architect | DOC-07–DOC-09 | SOURCE REQUIRED |
| OD-06 | Basis tanggal delay, validitas penutup, koreksi receiving, eligibility dan rumus metrik final | Business Analyst | DOC-03, DOC-06, DOC-08, DOC-13 | OPEN DECISION |
| OD-07 | Library, ORM, mekanisme autentikasi, versi runtime dan deployment | Fullstack Development Lead | DOC-06, DOC-09, DOC-17 | OPEN DECISION |
| OD-08 | Target evidence yang sah, retensi file/audit, verifikator cutoff | Business Analyst | DOC-05, DOC-07, DOC-11, DOC-17 | OPEN DECISION |
| OD-09 | Threshold NFR, volume data, beban, RPO/RTO dan perangkat uji | QA Engineer | DOC-13, DOC-16, DOC-17 | NEEDS BASELINE |
| OD-10 | Nama empat anggota, kapasitas, kalender, reviewer dan penandatangan | Fullstack Development Lead | DOC-02, DOC-11, DOC-12, DOC-14 | OPEN DECISION |

## Urutan penyelesaian gap

1. Dapatkan sumber final dan nomor versinya; cocokkan 29 FR, 14 NFR, dan 55 test case tanpa renumbering.
2. Cocokkan business flow, revisi UML dan route; tandai bagian desain usulan yang perlu diganti.
3. Sahkan role/aksi/gudang, key bisnis, file sumber, cutoff, finalisasi inbound, formula metrik dan target evidence.
4. Pilih library/autentikasi/hosting dan target NFR berbasis keputusan proyek; tetapkan kapasitas empat anggota.
5. Review desain bersama frontend/backend/database/QA; bekukan versi untuk iterasi, lalu implementasikan dan jalankan tes dengan bukti.
6. Kumpulkan feedback/UAT aktual, jalankan regresi perubahan, dan siapkan rehearsal deployment/restore sebelum handover.

## Ringkasan pemeriksaan konsistensi dan batas bukti

Pemeriksaan artefak dilakukan pada 2026-11-10 dengan pembacaan dokumen dan skrip Python sementara di luar repositori. Pemeriksaan ini memvalidasi dokumentasi, bukan menjalankan aplikasi SIRIS atau kasus uji bisnis.

| Area pemeriksaan | Hasil aktual | Batas verifikasi |
| --- | --- | --- |
| Nama dan jumlah file | 19 Markdown DOC-00–DOC-18 tersedia | Isi baseline final belum dapat dibandingkan |
| Struktur dokumen | Metadata, daftar isi, referensi, dependencies, open issues dan riwayat tersedia | Review redaksi manusia tetap diperlukan |
| Link dan tabel | Target link lokal tersedia; jumlah kolom tabel konsisten; code fence berpasangan | Konversi Word dan rendering Mermaid belum diuji |
| UC dan layar | 16 spesifikasi UC; 15 layar fitur + AUTH/HOME dari SRC-09; UC-16 internal lima impor | Route/role draft mengikuti SRC-09; persetujuan final dan sumber SRS belum tersedia |
| Kebutuhan | 29 slot FR dan 14 slot NFR tersedia tanpa ID rekaan | Tidak ada statement/ID asli untuk verifikasi semantik |
| Pengujian | 55 slot baseline dan 23 skenario turunan terpisah | Semua eksekusi NOT RUN; bukan 78 tes baseline |
| Database | 23 tabel usulan; relasi ERD dan nama tabel API memiliki definisi | DDL/migration/database belum dijalankan |
| API | 22 operasi; JSON OpenAPI terbaca; operationId unik; ref schema dan path parameter diperiksa | Validator OpenAPI khusus, generator client dan server belum dijalankan |
| Contoh response | Tipe, required, enum, pola decimal, UUID dan tanggal diperiksa terhadap schema terkait | Pemeriksa lokal terbatas, bukan sertifikasi JSON Schema/OpenAPI penuh |
| UI | Kolom layar dirujukkan ke DTO; 424 token SRC-09 diparse; alias tanpa referensi hilang/siklus; snapshot JSON cocok dengan sumber; kontras sumber bukan bukti runtime | Kontras halaman, keyboard, responsive dan WCAG runtime belum diuji |
| Aturan domain | Ketentuan SRC-01 dipertahankan; CF-03–CF-08 menandai perbedaan desain terhadap SRC-09 yang belum dapat diputuskan | Keputusan konflik harus ditutup dan kebenaran implementasi dibuktikan melalui QA |
| Prototyping | 5 iterasi berstatus rencana; tidak ada feedback atau acceptance rekaan | Evaluasi stakeholder belum dilakukan |
| Source code/configuration | Pekerjaan hanya membuat dokumentasi dan arsip; AGENTS.md tetap | Repositori awal tidak memiliki aplikasi |

Temuan yang masih terbuka:

| Severity | Lokasi | Temuan dan dampak | Tindakan |
| --- | --- | --- | --- |
| BLOCKER baseline | DOC-04, DOC-13, DOC-15, DOC-16 | ID/statement 29 FR, 14 NFR dan 55 tes asli belum tersedia; coverage tidak dapat disahkan | Lengkapi SRC-03/SRC-07 |
| BLOCKER desain final | DOC-03, DOC-05–DOC-10 | Flow/UML/RBAC final dan kontrak sumber belum tersedia; route/view role dari SRC-09 sudah diintegrasikan sebagai draft | Lengkapi SRC-04–SRC-06 dan OD-04–OD-06 |
| BLOCKER penerimaan | DOC-12–DOC-14, DOC-17–DOC-18 | Belum ada build, eksekusi tes, feedback, deployment atau sign-off | Implementasikan dan evaluasi setelah keputusan disetujui |
| NEEDS REVIEW | DOC-06–DOC-10 | Schema, endpoint, token, target evidence dan prioritas status adalah usulan | Review bersama peran tim sebelum freeze iterasi |

Koreksi yang dilakukan saat review: kontrak API diperluas dari fragmen menjadi seluruh operasi; kolom layar awal dipetakan ke DTO; gap tambahan dari SRC-09 dicatat pada CF-08; izin lookup konteks untuk metrik Management dijelaskan tanpa memberi akses raw; nullable mode audit dan field preview/validation diperjelas; constraint status variance serta grain pasangan multi-UOM ditambahkan. Tidak ada perubahan scope atau baseline FR/NFR yang diklaim.

## Paket penyerahan

Seluruh 19 dokumen versi 0.2.0 berada di folder `development-docs/`. [Unduh paket ZIP versi 0.2.0](SIRIS_development_docs_v0.2.0.zip). Arsip memuat tepat 19 Markdown dengan struktur folder `development-docs/`; tidak menyertakan source code aplikasi atau data operasional. Matriks kelengkapan, keputusan terbuka, dependencies dan hasil review tersedia di indeks ini.

## Kriteria versi dan documentation change log

Versi 0.1.0 adalah draft pertama paket ini. Patch untuk redaksi/link yang tidak mengubah perilaku; minor untuk detail desain usulan yang kompatibel; major untuk perubahan kontrak/baseline yang telah disetujui. Status APPROVED hanya diberikan dengan referensi bukti persetujuan. Gunakan CR untuk perubahan scope; perubahan status bukan pengganti persetujuan.

| Tanggal | Versi | Perubahan | Sumber | Status |
| --- | --- | --- | --- | --- |
| 2026-11-10 | 0.1.0 | Pembuatan 19 dokumen, slot sumber, desain PROPOSED dan rencana QA | SRC-01, SRC-02, referensi resmi | NEEDS REVIEW; belum disetujui |
| 2026-11-10 | 0.2.0 | Integrasi kontrak frontend yang tersedia pada pemeriksaan akhir; 17 layar, token sumber, role/route dan CF-01–CF-09 | SRC-09 | NEEDS REVIEW; konflik domain belum diputuskan |

## Kamus istilah terkendali

| Istilah | Makna |
| --- | --- |
| BASELINE | Ketentuan yang ditetapkan sumber; paket draft tidak otomatis baseline approved |
| PROPOSED | Usulan desain untuk review; bukan keputusan final |
| SOURCE REQUIRED | Sumber/ID/isi asli belum tersedia |
| OPEN DECISION | Perlu keputusan pihak berwenang; tidak diasumsikan |
| NEEDS BASELINE | Target/kriteria belum ditetapkan sumber |
| ACTUAL | Data operasional mitra dengan sumber sah |
| UJI | Data simulasi/fixture; tidak dianggap operasional |
| Final inbound | Penerimaan ditutup oleh marker sah |
| Overdue terbuka | Melewati acuan waktu tetapi belum final; bukan delivery delay final |
| Variance | physical_quantity - system_quantity hanya pada pasangan valid |
| NOT RUN / NOT EXECUTED | Belum ada eksekusi; bukan PASS atau FAIL |

## Rekonsiliasi sumber baru SRC-09 dan konflik terbuka

| ID | Bagian bertentangan / gap | Konsekuensi dan penanganan | Status |
| --- | --- | --- | --- |
| CF-01 | Route dan token usulan awal DOC-10 vs SRC-09 | Gunakan route dan registry SRC-09 sebagai sumber draft; batalkan palette paralel | Diterapkan pada DOC-10; approval final tetap belum tersedia |
| CF-02 | Audit role awal Purchasing/Warehouse/Management; SRC-09 hanya Warehouse. Notices tidak untuk Production; WO untuk Purchasing/Production | Selaraskan draft view role dengan SRC-09; backend tetap NEEDS REVIEW sampai RBAC final | DOC-03, DOC-05, DOC-09, DOC-10, DOC-11, DOC-14, DOC-18 diperbarui |
| CF-03 | Evidence target usulan stock_line vs SRC-09 snapshot ATAU count | Target final belum dapat ditetapkan dari SRS; jangan implementasikan kontrak target sampai diputuskan | OPEN DECISION; schema/API stock_line tetap usulan yang ditahan, alternatif source dijelaskan DOC-07–DOC-09 |
| CF-04 | Cutoff usulan timestamptz vs SRC-09 DATE/DATETIME, basis, precision dan UJI SIMULATED | Perlu kontrak cutoff yang tidak memalsukan jam untuk DATE | OPEN DECISION; implementasi ACTUAL/cutoff ditahan sampai OD-05 selesai |
| CF-05 | Run baru pada key berbeda vs SRC-09 reuse fingerprint identik | Makna identik harus disepakati lintas key dan source/rule version | OPEN DECISION; tidak mengeksekusi PVT-20 sebelum keputusan |
| CF-06 | Tanggal/quantity minimal usulan EXPECTED >=0 vs SRC-09 requested quantity >0; event sequence dan previous date belum dirancang | Preserve sumber tanpa menganggap constraint baru approved | OPEN DECISION; validasi source kontrak perlu dilengkapi |
| CF-07 | Backend PREVIEW_READY vs UI VALID/PREVIEW; backend FAILURE/DENIED vs sumber FAILED | Presentation state dipetakan ke domain; label outcome perlu mapping eksplisit | PROPOSED mapping DOC-09; tidak mengganti status domain diam-diam |
| CF-08 | Kolom metrik/cutoff/evidence/commitment pada SRC-09 lebih lengkap daripada DTO/skema awal | Jangan memalsukan data agar layar penuh; tandai field yang belum dikontrak | OPEN DECISION; gap contract DOC-09 dan DOC-10 |
| CF-09 | Sumber mengklaim inspeksi SIRIS_Prototype.html/analisis fitur terdahulu yang tidak ada di workspace | Perlakukan sebagai atribusi sumber, bukan bukti pemeriksaan agen ini | SOURCE REQUIRED untuk file/bukti asli |

SRC-09 tersedia pada pemeriksaan akhir, setelah draft awal disusun. Tidak ada bukti bahwa kontrak desain ini mengganti SRS final atau memberi persetujuan scope. Karena itu rincian domain yang bertentangan ditahan sebagai OPEN DECISION; hanya route, token dan pemetaan view role yang diselaraskan pada level draft. File sumber asli tidak diubah.

## Dependencies

| Dependensi | Kegunaan |
| --- | --- |
| [DOC-01](01_PROJECT_CHARTER_SCOPE.md) | Piagam Proyek dan Definisi Ruang Lingkup |
| [DOC-02](02_PROTOTYPING_DEVELOPMENT_PLAN.md) | Rencana Pengembangan Prototyping |
| [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md) | Dokumen Kebutuhan Produk |
| [DOC-04](04_SOFTWARE_REQUIREMENTS_SPECIFICATION.md) | Spesifikasi Kebutuhan Perangkat Lunak |
| [DOC-05](05_BUSINESS_RULES_RBAC.md) | Spesifikasi Aturan Bisnis dan RBAC |
| [DOC-06](06_SOFTWARE_ARCHITECTURE_DESIGN.md) | Arsitektur Perangkat Lunak dan Desain Terperinci |
| [DOC-07](07_DATABASE_DESIGN.md) | Desain Database, ERD, IRD, dan Kamus Data |
| [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md) | Kontrak Data, Pemetaan Impor, dan Validasi |
| [DOC-09](09_API_SPECIFICATION.md) | Spesifikasi REST API |
| [DOC-10](10_UI_UX_PROTOTYPE_SPECIFICATION.md) | Spesifikasi Prototipe UI/UX |
| [DOC-11](11_DEVELOPMENT_BACKLOG_WBS.md) | Backlog Pengembangan, WBS, dan Rencana Implementasi |
| [DOC-12](12_PROTOTYPE_ITERATION_FEEDBACK.md) | Catatan Iterasi, Review, dan Feedback Prototipe |
| [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md) | Rencana dan Spesifikasi Kasus Pengujian |
| [DOC-14](14_USER_ACCEPTANCE_TESTING.md) | Pengujian Penerimaan Pengguna |
| [DOC-15](15_REQUIREMENTS_TRACEABILITY.md) | Ketertelusuran Kebutuhan dan Pengendalian Perubahan |
| [DOC-16](16_SECURITY_RISK_NFR.md) | Keamanan, Risiko, dan Verifikasi NFR |
| [DOC-17](17_DEPLOYMENT_OPERATIONAL_GUIDE.md) | Panduan Deployment dan Operasional |
| [DOC-18](18_USER_MANUAL_HANDOVER.md) | Panduan Pengguna dan Serah Terima |

## Open issues

OD-01–OD-10 tetap terbuka. Paket ini tidak dapat dinyatakan BASELINE APPROVED atau implementasi-ready penuh sebelum sumber kritis dan keputusan tersedia.

## Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1.0 | 2026-11-10 | Penyusunan berdasarkan SRC-01; celah sumber dicatat dan desain ditandai PROPOSED. | Belum ada bukti persetujuan |
| 0.2.0 | 2026-11-10 | Integrasi SRC-09 design.md: route, role, token, layar pendukung, metrik dan konflik desain; tetap NEEDS REVIEW. | Belum ada bukti persetujuan |
