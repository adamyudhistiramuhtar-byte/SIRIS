# Persiapan QA SRS-59: Oracle dan Fixture Integritas Lima Impor

Status: PROPOSED. Data: SIMULATED, mode UJI. Tanggal persiapan: 26 November 2026. Basis: develop 0ff9e4a.

Dokumen ini menyiapkan oracle dan matriks kasus untuk DOC-13 PVT-01/02/03/04/11/12/15/17/22. Oracle tidak bergantung pada kode SRS-17/18/19/26/54. **Tidak ada kasus PVT yang ditandai PASS.** Satu-satunya eksekusi PVT adalah PVT-17 langkah 2, dan itu hanya sebagian kasus.

## Berkas

| Berkas | Fungsi |
| --- | --- |
| `tests/integration/imports/integrity-oracle.ts` | Fungsi penilai observasi per PVT (PASS/FAIL beserta alasan), murni tanpa akses modul domain |
| `tests/integration/imports/integrity-oracle.spec.ts` | Integritas matriks, uji oracle, dan eksekusi PVT-17 langkah 2 |
| `database/fixtures/uji/srs59-integrity-cases.proposed-0.1.json` | Matriks 9 PVT × 5 jenis impor: rujukan negative case, kode yang diharapkan, status, dan penghalang |

## Hasil yang benar-benar dijalankan (lokal, Node v24.18.0)

| Pemeriksaan | Hasil | Catatan |
| --- | --- | --- |
| Integritas matriks (8 tes) | PASS | Rujukan `case_id` ada di fixture develop, kode dari katalog DOC-08, tidak ada status PASS/FAIL di matriks |
| Uji oracle (9 tes) | PASS | Membuktikan oracle membedakan observasi benar dan salah. **Bukan eksekusi PVT.** |
| PVT-17 langkah 2: rekonsiliasi engine #36 dengan QTY AKHIR 10, movement +3 tidak dijumlahkan, COUNT 10 | PASS untuk langkah 2 saja | `system_quantity` 10.000000, MATCHED, variance 0.000000. Langkah 1 dan 3 BLOCKED, sehingga PVT-17 secara keseluruhan **belum PASS** |
| CI Node 22 | NOT RUN | Branch belum di-push |

## Status per kasus

| PVT | EXPECTED | COMMITMENT | RECEIVING | STOCK | COUNT |
| --- | --- | --- | --- | --- | --- |
| PVT-01 File invalid | BLOCKED (data diturunkan: tanpa `requested_date`) | BLOCKED (UJI-COM-NEG-03) | BLOCKED (UJI-RCV-NEG-02) | BLOCKED (UJI-STK-NEG-01) | BLOCKED (UJI-CNT-NEG-02) |
| PVT-02 Missing reference | BLOCKED (UJI-EXP-NEG-01) | BLOCKED (diturunkan: UJI-IN-TIDAK-ADA) | BLOCKED (diturunkan) | BLOCKED (UJI-STK-NEG-02) | SOURCE REQUIRED |
| PVT-03 Duplicate import | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| PVT-04 Expired preview | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| PVT-11 Rollback | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| PVT-12 Idempotency/konkurensi | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| PVT-15 Metadata tampering | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| PVT-17 QTY AKHIR | n/a | n/a | n/a | Langkah 1 BLOCKED, 2 dijalankan, 3 BLOCKED | (dipakai di langkah 2) |
| PVT-22 Warehouse scope | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |

## Yang masih terblokir

Gate yang berlaku untuk semua jenis impor:
1. Core staging SRS-50 (#27 tanpa CI PR karena base bukan develop; #52 HEAD ce37fb5 belum punya run CI, run terakhir 52ec3d9 gagal).
2. Preview SRS-51 (#54, CHANGES_REQUESTED). Persistensi preview dan fingerprint actor/reference revision belum ada.
3. Commit/idempotency SRS-52 (#46 Draft). Migrasi 012 belum ada.
4. Harness PostgreSQL SRS-54 (#22/#23 belum merged). Di laptop ini tidak ada DATABASE_URL, jadi tes DB di-skip.

Gate per jenis impor:
- EXPECTED: SRS-17 (To Do).
- COMMITMENT: SRS-18 (#58, review).
- RECEIVING: SRS-19 (To Do).
- STOCK: SRS-26 (#39 In Review) dan migrasi 009 (belum ada).
- COUNT: SRS-27 (#48 Draft) dan migrasi 010 (belum ada).

Gate per kasus:
- PVT-04: TTL 30 menit masih PROPOSED; expiry otoritatif di server dan 409/410 masih C58-05 (SRS-52 10221).
- PVT-15: fingerprint #54 belum memuat actor dan reference revision (SRS-52 10215 butir 7).
- PVT-22: sesi dan otorisasi backend nyata SRS-47/48.
- PVT-02 COUNT: tidak ada negative case material tidak dikenal untuk COUNT, dan aturannya belum tertulis di DOC-08 §COUNT (SOURCE REQUIRED).

## Temuan pada fixture develop (tidak diubah)

| Rujukan | Isi develop | Seharusnya | Catatan |
| --- | --- | --- | --- |
| `stock:UJI-STK-NEG-03` (metadata tanpa `cutoff_id`) | INVALID_FILE | INVALID_METADATA (Adam, SRS-26 10161; SRS-58 10152 butir 3) | Perbaikan ada di #39/#52, belum di develop. INVALID_METADATA belum ada di katalog DOC-08 |
| `commitment:UJI-COM-NEG-01` (CHANGE tanpa INITIAL) | INVALID_FILE | Belum diputuskan | #58 menghasilkan CHANGE_WITHOUT_INITIAL, yang tidak ada di katalog DOC-08 |

## Cara memakai oracle nanti

Tes integrasi mengumpulkan observasi nyata (respons API, hitungan tabel sebelum/sesudah, outcome audit), lalu memanggil fungsi `judge*` yang sesuai. Hasil PASS/FAIL dicatat di DOC-13 beserta build, dataset, dan evidence. Oracle tidak menggantikan eksekusi.
