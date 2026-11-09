# Rencana dan Spesifikasi Kasus Pengujian

## Identitas dan kendali dokumen

| Atribut | Nilai |
| --- | --- |
| Document ID | DOC-13 |
| Nama proyek | SIRIS — Capstone Project Kelompok 42 |
| Mitra | Warehouse PT Harina Chemicals Industry |
| Versi | 0.2.0 |
| Status dokumen | DRAFT — NEEDS REVIEW |
| Tanggal penyusunan | 2026-11-10 |
| Pemilik dokumen | QA Engineer |
| Tujuan dokumen | Menetapkan strategi uji serta kasus turunan yang dapat dieksekusi setelah implementasi. |
| Ruang lingkup | Website pendamping Erasoft; Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation. |

Ketentuan pengguna diberi rujukan **SRC-01**. Desain baru berstatus **PROPOSED**, bukan BASELINE APPROVED. Belum ada aplikasi, hasil pengujian runtime, evaluasi stakeholder, atau persetujuan rilis yang dibuktikan dalam workspace ini. Semua contoh adalah **UJI**.

## Daftar isi

1. Identitas dan kendali dokumen
2. Referensi
3. Tujuan, strategi, dan acuan
4. Scope, level, dan lingkungan uji
5. Data, entry, exit, dan defect management
6. Register 55 spesifikasi pengujian baseline
7. Kasus verifikasi turunan PROPOSED
8. PVT-01 — File invalid
9. PVT-02 — Missing reference
10. PVT-03 — Duplicate import
11. PVT-04 — Expired preview
12. PVT-05 — Permission denied dan file privat
13. PVT-06 — Partial receiving
14. PVT-07 — Final receiving
15. PVT-08 — Null versus zero
16. PVT-09 — Cutoff mismatch
17. PVT-10 — Mode mismatch
18. PVT-11 — Rollback
19. PVT-12 — Idempotency dan konkurensi
20. PVT-13 — Metric denominator zero
21. PVT-14 — Nonvalid reconciliation pair
22. PVT-15 — Preview metadata tampering
23. PVT-16 — Requested date dan histori janji
24. PVT-17 — QTY AKHIR tanpa double counting
25. PVT-18 — ACTUAL cutoff unverified
26. PVT-19 — Batas ukuran, tipe dan target evidence
27. PVT-20 — Histori hasil tidak tertimpa
28. PVT-21 — Pembatalan dan audit
29. PVT-22 — Warehouse scope
30. PVT-23 — Penutup invalid dan overdue terbuka
31. Rencana nonfunctional dan laporan eksekusi
32. Definisi metrik dari SRC-09 dan batas verifikasi
33. Dampak SRC-09 pada pengujian
34. Dependencies
35. Open issues
36. Riwayat revisi

## Referensi

SRC-01: master prompt pengguna pada sesi penyusunan; SRC-02: `../AGENTS.md`. SRC-09: `../design.md` v1.0.0, kontrak desain untuk ditinjau yang tersedia pada pemeriksaan akhir; snapshot visual disertakan pada DOC-10. Register sumber lengkap, hierarki, dan sumber eksternal terdapat pada [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md). Rujukan antardokumen: [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md), [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md), [DOC-04](04_SOFTWARE_REQUIREMENTS_SPECIFICATION.md), [DOC-05](05_BUSINESS_RULES_RBAC.md), [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md), [DOC-09](09_API_SPECIFICATION.md), [DOC-15](15_REQUIREMENTS_TRACEABILITY.md), [DOC-16](16_SECURITY_RISK_NFR.md).

## Tujuan, strategi, dan acuan

Pengujian menilai perilaku fitur, integritas data, otorisasi dan kualitas sesuai sumber yang sah. Struktur dokumentasi menggunakan prinsip perencanaan, spesifikasi, eksekusi dan pelaporan yang relevan dari [ISO/IEC/IEEE 29119-3:2021](https://www.iso.org/standard/79429.html); tidak ada klaim seluruh klausul dipenuhi. Paket ini tidak menciptakan hasil PASS/FAIL. Semua eksekusi **NOT RUN**.

## Scope, level, dan lingkungan uji

| Level/jenis | Objek | Teknik | Prasyarat |
| --- | --- | --- | --- |
| Unit | Fingerprint, decimal, pairing, status, eligibility | Tabel keputusan dan boundary | Library/framework belum dipilih |
| Integration | Repository, transaksi, audit, storage | Fault injection, retry, concurrent request | PostgreSQL terisolasi dan private storage UJI |
| API authorization | Role × UC × aksi × gudang | Direct request tanpa mengandalkan UI | Identitas empat role fixture |
| System/E2E | Alur upload sampai histori/metrik | Task-based test | Frontend/backend versi tercatat |
| Nonfunctional | Kualitas yang benar-benar ditetapkan NFR | Pengukuran, inspeksi, security probes | 14 NFR dan threshold sumber |
| Regression | Perubahan yang disetujui | Tes terkait + jalur integritas/akses | Impact analysis DOC-15 |

## Data, entry, exit, dan defect management

Seluruh data contoh sintetis diberi label UJI. Untuk menguji cabang ACTUAL, gunakan namespace simulasi terisolasi dengan penanda asal fixture; jangan mengklaim data tersebut operasional. Catat seed/hash dataset, timezone, versi backend/frontend/schema, konfigurasi dan alat ukur. Framework tes belum tersedia.

Entry: requirement/aturan yang diuji diketahui, build tersedia, kontrak input disepakati, fixture dan akun sah, lingkungan dapat dipulihkan. Exit usulan: tes wajib selesai dengan evidence, tidak ada defect penghalang integritas/akses, coverage dapat ditelusuri dan reviewer menyetujui risiko tersisa. Kegagalan critical seperti data parsial atau kebocoran akses menghalangi rilis. Defect memuat ID, versi, langkah reproduksi, expected/actual, severity, evidence, owner dan retest. Angka coverage target NEEDS BASELINE.

## Register 55 spesifikasi pengujian baseline

SRC-01 menyebut 29 cakupan FR + 12 batas/kegagalan + 14 NFR = 55. ID asli dan expected result belum tersedia. Tabel ini **register slot sumber**, bukan 55 kasus uji yang telah direkonstruksi. Semua field skenario, precondition, data, steps dan expected result menunggu sumber; actual/evidence/defect belum ada. Slot tidak boleh dikonversi menjadi ID test case final.
| Slot | Kategori | Test Case ID asli | Related FR/NFR / UC | Skenario / precondition / data / steps / expected | Actual / evidence / defect | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 02 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 03 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 04 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 05 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 06 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 07 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 08 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 09 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 10 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 11 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 12 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 13 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 14 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 15 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 16 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 17 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 18 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 19 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 20 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 21 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 22 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 23 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 24 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 25 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 26 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 27 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 28 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 29 | FR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 30 | Batas/kegagalan | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 31 | Batas/kegagalan | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 32 | Batas/kegagalan | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 33 | Batas/kegagalan | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 34 | Batas/kegagalan | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 35 | Batas/kegagalan | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 36 | Batas/kegagalan | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 37 | Batas/kegagalan | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 38 | Batas/kegagalan | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 39 | Batas/kegagalan | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 40 | Batas/kegagalan | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 41 | Batas/kegagalan | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 42 | NFR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 43 | NFR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 44 | NFR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 45 | NFR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 46 | NFR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 47 | NFR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 48 | NFR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 49 | NFR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 50 | NFR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 51 | NFR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 52 | NFR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 53 | NFR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 54 | NFR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |
| 55 | NFR | SOURCE REQUIRED | SOURCE REQUIRED | SOURCE REQUIRED | Belum tersedia | NOT RUN |

## Kasus verifikasi turunan PROPOSED

PVT adalah **usulan skenario turunan aturan SRC-01**, terpisah dari hitungan 55 baseline. Tidak mengganti identitas atau expected result sumber. Ketika sumber diterima, QA memetakan kesetaraan dan menggabungkan bila sah melalui review. Seluruh kasus menggunakan prasyarat bersama: build uji tersedia, akun role/gudang sesuai DOC-05, fixture terisolasi dan versi dicatat. Untuk kasus dengan OD terbuka, eksekusi menunggu keputusan terkait.

## PVT-01 — File invalid

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-01 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-01, UC-16 |
| Test scenario | File invalid |
| Preconditions | Prasyarat bersama di atas; aturan BR-IMP-01 ditinjau |
| Test data | File UJI EXPECTED tanpa requested_date — seluruhnya fixture UJI |
| Test steps | 1 Unggah file. 2 Jalankan validasi. 3 Coba commit. |
| Expected result | Error field wajib; tidak ada domain atau preview siap commit. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-02 — Missing reference

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-02 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-02, UC-16 |
| Test scenario | Missing reference |
| Preconditions | Prasyarat bersama di atas; aturan BR-IMP-01 ditinjau |
| Test data | COMMITMENT UJI menunjuk UJI-IN-TIDAK-ADA — seluruhnya fixture UJI |
| Test steps | 1 Unggah. 2 Validasi. 3 Periksa laporan dan domain. |
| Expected result | MISSING_REFERENCE; event tidak tersimpan. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-03 — Duplicate import

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-03 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-01, UC-16 |
| Test scenario | Duplicate import |
| Preconditions | Prasyarat bersama di atas; aturan BR-IMP-04 ditinjau |
| Test data | Dua batch EXPECTED UJI dengan kunci bisnis dan payload identik — seluruhnya fixture UJI |
| Test steps | 1 Commit batch A. 2 Impor/commit batch B identik. 3 Hitung record. |
| Expected result | Tidak ada referensi kedua; hasil lama dikenali dan outcome diaudit. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-04 — Expired preview

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-04 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-01, UC-16 |
| Test scenario | Expired preview |
| Preconditions | Prasyarat bersama di atas; aturan BR-IMP-02 ditinjau |
| Test data | Preview tervalidasi t0; jam server terkendali — seluruhnya fixture UJI |
| Test steps | 1 Coba commit pada t0+29:59. 2 Dengan batch baru coba pada t0+30:00. |
| Expected result | Sebelum expiry dapat sukses jika prasyarat lain sah; tepat expiry PREVIEW_EXPIRED tanpa commit. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-05 — Permission denied dan file privat

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-05 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-11, UC-15 |
| Test scenario | Permission denied dan file privat |
| Preconditions | Prasyarat bersama di atas; aturan BR-SEC-01 ditinjau |
| Test data | Sesi Management; evidence UJI milik gudang yang diketahui — seluruhnya fixture UJI |
| Test steps | 1 Panggil endpoint content langsung. 2 Coba akses audit sebagai Management (ditolak); gunakan Warehouse untuk pemeriksaan positif. 3 Inspeksi response/error. |
| Expected result | Content ditolak; tidak ada raw, path atau storage key pada response/audit. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-06 — Partial receiving

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-06 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-03, UC-04 |
| Test scenario | Partial receiving |
| Preconditions | Prasyarat bersama di atas; aturan BR-INB-03, BR-INB-04 ditinjau |
| Test data | Expected UJI 10 KG; receiving 4 KG is_closing=false — seluruhnya fixture UJI |
| Test steps | 1 Commit receiving. 2 Baca exception. 3 Baca histori. |
| Expected result | Event tersimpan sebagai parsial; tidak ada delivery delay atau quantity mismatch final. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-07 — Final receiving

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-07 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-03, UC-04 |
| Test scenario | Final receiving |
| Preconditions | Prasyarat bersama di atas; aturan BR-INB-03 ditinjau |
| Test data | Expected 10 KG; parsial 4 KG; penutup 6 KG dengan bukti sah — seluruhnya fixture UJI |
| Test steps | 1 Validasi bukti penutup menurut aturan disepakati. 2 Commit penutup. 3 Baca finalisasi. |
| Expected result | Final hanya setelah penutup sah; total 10 tidak quantity mismatch. Penentuan delay menunggu OD-06. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-08 — Null versus zero

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-08 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-10, UC-12 |
| Test scenario | Null versus zero |
| Preconditions | Prasyarat bersama di atas; aturan BR-INV-02, BR-INV-04, BR-INV-05 ditinjau |
| Test data | Stok 10 KG; A counted=true physical=0; B counted=false physical=null — seluruhnya fixture UJI |
| Test steps | 1 Buat dua sesi UJI. 2 Rekonsiliasi masing-masing. 3 Bandingkan status. |
| Expected result | A variance -10 DISCREPANCY; B variance null NOT_COUNTED. false dengan physical=0 ditolak saat validasi. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-09 — Cutoff mismatch

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-09 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-12 |
| Test scenario | Cutoff mismatch |
| Preconditions | Prasyarat bersama di atas; aturan BR-INV-03 ditinjau |
| Test data | Snapshot/count UJI dengan cutoff berbeda — seluruhnya fixture UJI |
| Test steps | 1 Pilih pasangan. 2 Execute. 3 Periksa run tersimpan. |
| Expected result | CUTOFF_MISMATCH; tidak ada run atau lines parsial. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-10 — Mode mismatch

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-10 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-12 |
| Test scenario | Mode mismatch |
| Preconditions | Prasyarat bersama di atas; aturan BR-DAT-01 ditinjau |
| Test data | Fixture sintetis pada lingkungan terisolasi untuk simulasi ACTUAL dan UJI; bukan data mitra — seluruhnya fixture UJI |
| Test steps | 1 Pilih snapshot mode ACTUAL simulasi dan count UJI. 2 Execute. |
| Expected result | MODE_MISMATCH; tidak ada pembandingan/agregasi campuran. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-11 — Rollback

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-11 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-01, UC-09 |
| Test scenario | Rollback |
| Preconditions | Prasyarat bersama di atas; aturan BR-IMP-03, BR-AUD-01 ditinjau |
| Test data | Batch UJI berisi beberapa baris; fault injection setelah insert pertama — seluruhnya fixture UJI |
| Test steps | 1 Catat count domain. 2 Commit dengan injeksi error. 3 Periksa domain, batch, lineage dan audit. |
| Expected result | Seluruh domain/lineage baru dibatalkan; audit FAILURE terpisah jika DB pulih; tidak ada SUCCESS palsu. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-12 — Idempotency dan konkurensi

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-12 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-01, UC-12 |
| Test scenario | Idempotency dan konkurensi |
| Preconditions | Prasyarat bersama di atas; aturan BR-IMP-04 ditinjau |
| Test data | Request UJI identik; key A; request berbeda dengan key A — seluruhnya fixture UJI |
| Test steps | 1 Kirim dua request identik konkuren. 2 Retry setelah response hilang. 3 Ubah payload memakai key A. |
| Expected result | Satu hasil; retry menerima ID sama; perubahan payload 409 IDEMPOTENCY_CONFLICT. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-13 — Metric denominator zero

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-13 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-08, UC-14 |
| Test scenario | Metric denominator zero |
| Preconditions | Prasyarat bersama di atas; aturan BR-INB-05, BR-INV-05 ditinjau |
| Test data | Dataset UJI kosong atau seluruh pasangan nonvalid — seluruhnya fixture UJI |
| Test steps | 1 Baca metrik. 2 Inspeksi numerator/denominator/reason. |
| Expected result | value null, denominator 0 dan NO_ELIGIBLE_DATA bila formula sudah disepakati; tidak NaN/Infinity/0% semu. Supplier formula belum disetujui: NEEDS_BASELINE. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-14 — Nonvalid reconciliation pair

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-14 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-12 |
| Test scenario | Nonvalid reconciliation pair |
| Preconditions | Prasyarat bersama di atas; aturan BR-INV-05 ditinjau |
| Test data | Variasi: stock-only; count-only; UOM berbeda; counted=false — seluruhnya fixture UJI |
| Test steps | 1 Buat tiap variasi UJI terpisah. 2 Rekonsiliasi. 3 Periksa detail dan metrik. |
| Expected result | COUNT_MISSING, STOCK_MISSING, UOM_MISMATCH, NOT_COUNTED; seluruh variance null dan dikecualikan dari denominator valid. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-15 — Preview metadata tampering

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-15 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-01, UC-16 |
| Test scenario | Preview metadata tampering |
| Preconditions | Prasyarat bersama di atas; aturan BR-IMP-02 ditinjau |
| Test data | Preview UJI sah; gudang/mode/cutoff diubah sesudahnya — seluruhnya fixture UJI |
| Test steps | 1 Validasi. 2 Ubah metadata sebelum commit. 3 Kirim fingerprint lama. |
| Expected result | PREVIEW_CHANGED atau scope error; tidak commit; wajib validasi ulang. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-16 — Requested date dan histori janji

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-16 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-02, UC-07 |
| Test scenario | Requested date dan histori janji |
| Preconditions | Prasyarat bersama di atas; aturan BR-INB-01, BR-INB-02 ditinjau |
| Test data | Referensi UJI requested 10 Nov; INITIAL 11 Nov; CHANGE 12 Nov — seluruhnya fixture UJI |
| Test steps | 1 Commit INITIAL. 2 Commit CHANGE. 3 Baca reference/histori. |
| Expected result | requested_date tetap 10 Nov; kedua event tersedia; janji tidak menimpa tanggal kebutuhan. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-17 — QTY AKHIR tanpa double counting

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-17 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-09, UC-12 |
| Test scenario | QTY AKHIR tanpa double counting |
| Preconditions | Prasyarat bersama di atas; aturan BR-INV-01 ditinjau |
| Test data | STOCK UJI QTY AKHIR 10; dukungan movement +3; COUNT 10 — seluruhnya fixture UJI |
| Test steps | 1 Commit satu paket. 2 Rekonsiliasi. 3 Periksa lineage dukungan. |
| Expected result | system_quantity 10, bukan 13; variance 0 MATCHED; support tersimpan terpisah. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-18 — ACTUAL cutoff unverified

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-18 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-12 |
| Test scenario | ACTUAL cutoff unverified |
| Preconditions | Prasyarat bersama di atas; aturan BR-INV-03, BR-DAT-02 ditinjau |
| Test data | Fixture UJI berlabel simulasi ACTUAL di lingkungan terisolasi; cutoff UNVERIFIED — seluruhnya fixture UJI |
| Test steps | 1 Execute. 2 Verifikasi penolakan. 3 Ulang setelah bukti verifikasi sah tersedia dalam fixture. |
| Expected result | UNVERIFIED ditolak; hanya VERIFIED dapat lanjut. Tidak mengubah fixture menjadi bukti operasional mitra. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-19 — Batas ukuran, tipe dan target evidence

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-19 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-11 |
| Test scenario | Batas ukuran, tipe dan target evidence |
| Preconditions | Prasyarat bersama di atas; aturan BR-EVD-01, BR-EVD-02 ditinjau |
| Test data | File sintetis sah 5242880 byte; 5242881 byte; executable rename .png; target invalid — seluruhnya fixture UJI |
| Test steps | 1 Upload setiap variasi. 2 Periksa metadata dan objek privat. |
| Expected result | Tepat 5 MiB diterima jika semua syarat sah; lebih besar/tipuan tipe/target invalid ditolak; tidak ada evidence aktif yatim. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-20 — Histori hasil tidak tertimpa

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-20 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-12, UC-13 |
| Test scenario | Histori hasil tidak tertimpa |
| Preconditions | Prasyarat bersama di atas; aturan BR-INV-06 ditinjau |
| Test data | Dua eksekusi disengaja UJI dengan idempotency key berbeda — seluruhnya fixture UJI |
| Test steps | 1 Buat run A. 2 Buat run B. 3 Baca A dan B. |
| Expected result | OPEN DECISION CF-05 untuk input identik dengan key berbeda. Untuk input/rule berbeda yang sah, histori lama wajib tetap tersedia; tidak ada update saldo ERP. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-21 — Pembatalan dan audit

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-21 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-01, UC-15 |
| Test scenario | Pembatalan dan audit |
| Preconditions | Prasyarat bersama di atas; aturan BR-AUD-01 ditinjau |
| Test data | Batch UJI PREVIEW_READY — seluruhnya fixture UJI |
| Test steps | 1 Batalkan. 2 Coba commit batch cancelled. 3 Baca audit. |
| Expected result | CANCELLED tercatat; commit ditolak; tidak ada domain committed. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-22 — Warehouse scope

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-22 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-01, UC-12, UC-15 |
| Test scenario | Warehouse scope |
| Preconditions | Prasyarat bersama di atas; aturan BR-SEC-01 ditinjau |
| Test data | Sesi Warehouse hanya gudang UJI-A; objek UJI-B — seluruhnya fixture UJI |
| Test steps | 1 Panggil read dan mutasi objek B langsung. 2 Ubah query filter. 3 Periksa response. |
| Expected result | Seluruh akses lintas izin ditolak/disembunyikan; tidak ada data B dalam hasil atau metrik. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## PVT-23 — Penutup invalid dan overdue terbuka

| Field | Spesifikasi |
| --- | --- |
| Test Case ID | PVT-23 (PROPOSED, bukan baseline) |
| Related FR/NFR | SOURCE REQUIRED |
| Related UC | UC-03, UC-04 |
| Test scenario | Penutup invalid dan overdue terbuka |
| Preconditions | Prasyarat bersama di atas; aturan BR-INB-03, BR-INB-04, BR-INB-05 ditinjau |
| Test data | Receiving is_closing=true tanpa bukti; inbound terbuka melewati acuan — seluruhnya fixture UJI |
| Test steps | 1 Validasi penutup. 2 Baca daftar overdue pada fixture yang belum final. |
| Expected result | INVALID_CLOSING; overdue terbuka berbeda dari delivery delay final; tidak menyalahkan supplier. |
| Actual result | Belum tersedia |
| Execution status | NOT RUN |
| Evidence | Belum tersedia |
| Defect reference | Belum ada hasil eksekusi |

## Rencana nonfunctional dan laporan eksekusi

Rincian 14 NFR dipulihkan melalui DOC-16 sebelum dipetakan ke kasus baseline. Jangan menganggap 14 kategori buatan sebagai 14 NFR asli. Format laporan saat eksekusi: test_id, versi aplikasi/schema, lingkungan, dataset hash, pelaksana, timestamp, expected, actual, status, evidence path dan defect_id. NOT RUN berbeda dari BLOCKED saat eksekusi benar-benar terhambat; keduanya bukan FAIL. Screenshot tanpa versi/data/konteks tidak cukup untuk membuktikan kebutuhan terpenuhi.

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

## Dampak SRC-09 pada pengujian

PVT-05 menggunakan Management untuk memverifikasi penolakan akses raw dan audit; baca audit positif dijalankan oleh Warehouse sesuai SRC-09. PVT-20 menunggu keputusan CF-05: bedakan reuse fingerprint identik dari run berbeda input/rule yang tetap mempertahankan histori. PVT-18 menunggu model cutoff DATE/DATETIME/SIMULATED CF-04. Expected result lama yang bertentangan bukan keputusan final; seluruhnya NOT RUN. Tambahkan kasus source quantity=0, event sequence/previous date, evidence XOR snapshot/count, dan metrik SRC-09 setelah aturan disahkan; jangan memberi ID baseline baru.

## Dependencies

| Dependensi | Kegunaan |
| --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | Indeks Induk Dokumentasi Pengembangan |
| [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md) | Dokumen Kebutuhan Produk |
| [DOC-04](04_SOFTWARE_REQUIREMENTS_SPECIFICATION.md) | Spesifikasi Kebutuhan Perangkat Lunak |
| [DOC-05](05_BUSINESS_RULES_RBAC.md) | Spesifikasi Aturan Bisnis dan RBAC |
| [DOC-08](08_DATA_CONTRACT_IMPORT_SPECIFICATION.md) | Kontrak Data, Pemetaan Impor, dan Validasi |
| [DOC-09](09_API_SPECIFICATION.md) | Spesifikasi REST API |
| [DOC-15](15_REQUIREMENTS_TRACEABILITY.md) | Ketertelusuran Kebutuhan dan Pengendalian Perubahan |
| [DOC-16](16_SECURITY_RISK_NFR.md) | Keamanan, Risiko, dan Verifikasi NFR |

## Open issues

Rincian baseline final belum tersedia; lihat register sumber dan keputusan terbuka pada DOC-00.

## Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1.0 | 2026-11-10 | Penyusunan berdasarkan SRC-01; celah sumber dicatat dan desain ditandai PROPOSED. | Belum ada bukti persetujuan |
| 0.2.0 | 2026-11-10 | Integrasi SRC-09 design.md: route, role, token, layar pendukung, metrik dan konflik desain; tetap NEEDS REVIEW. | Belum ada bukti persetujuan |
