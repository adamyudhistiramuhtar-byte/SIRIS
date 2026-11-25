# Kontrak Metrik Persediaan dan Latest Run — SRS-32

| Atribut | Nilai |
| --- | --- |
| Issue | [SRS-32](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-32) (ST-14), parent EPIC-08 |
| UC terkait | UC-14 |
| FR/NFR terkait | SOURCE REQUIRED (mengikuti deskripsi SRS-32); tidak ada ID FR/NFR baru |
| Status dokumen | **PROPOSED — sebagian.** Tidak ada schema atau migrasi baru: SRS-32 hanya membaca `reconciliation_runs`/`reconciliation_lines` (rancangan 011, SRS-29) |
| Tanggal | 25 November 2026, Asia/Jakarta |
| Baseline repo | `origin/develop` @ `0ff9e4a`: fungsi I-VAR PR #37 (`77669f4`) tersedia |
| Pemilik | Backend & Database (Dwi Rani Amelia); reviewer nonpenulis Adam dan Luthfi |

## 1. Sumber

| Sumber | Bagian yang dipakai |
| --- | --- |
| Deskripsi SRS-32 | Alur N1–N5, A-1, E-1, E-2; acceptance criteria; API-16; "definisi periode, latest run dan kecukupan cutoff harus final" |
| Komentar Jira SRS-32 nomor 10169 (Adam) | I-VAR merged; I-EXACT/I-COVER/I-REPEAT, latest COMMITTED, query/API/UI masih dikerjakan; subtask I-REPEAT tidak ditutup oleh I-VAR |
| Komentar Jira SRS-38 nomor 10153 (Adam) | D-04 satu material per sisi per run; D-06 latest hanya COMMITTED, `created_at`/`id` tidak boleh mendahului keberhasilan commit, histori tetap |
| `design.md` (SRC-09) tabel metrik dan fixture persediaan | Definisi I-EXACT, I-COVER, I-REPEAT; oracle UJI I-EXACT 40%, I-COVER 62,5% |
| DOC-03/06/10/13/16 | Salinan definisi; "denominator nol unavailable, tidak 0%"; "I-REPEAT memerlukan konteks beberapa cutoff"; tie-break latest tetap OD-06 |
| `apps/api/src/tests/fixtures/i-var.uji.proposed-0.1.json` (PR #37) | Fixture UJI yang sama dengan design.md (run A) |

## 2. Yang dikerjakan dan dasarnya

| Bagian | Dasar | Status |
| --- | --- | --- |
| Latest hanya dari run COMMITTED, histori tetap | Keputusan Adam D-06 (10153 butir 4) | Dikerjakan (`latest-run.ts`) |
| Satu material per sisi per run | Keputusan Adam D-04 (10153 butir 3) | Dikerjakan: material ganda menolak seluruh hasil |
| I-EXACT = matched / valid × 100% | Definisi design.md; ditemukan | Dikerjakan per run (`exact-cover.ts`) |
| I-COVER = valid / item snapshot dalam scope × 100% | Definisi design.md; ditemukan | Dikerjakan per run; lihat §3 tentang "item snapshot" |
| Denominator nol → tidak tersedia, bukan 0% | DOC-03/06/10/13/16 | Dikerjakan |
| I-REPEAT | Definisi ditemukan, tetapi "periode" **tidak ditemukan** | **Tidak dikerjakan**; pertanyaan §8 |
| Tie-break latest | OD-06 **OPEN** | **Tidak ditebak**; kelompok seri ditandai `AMBIGUOUS_ORDER` |
| Pembulatan tampilan persen | **Tidak ditemukan** | Tidak dikerjakan; nilai tanpa pembulatan + numerator/denominator |

## 3. Aturan yang diimplementasikan

**Latest run (`selectLatestCommitted`).**

- Kelompok = (`warehouse_id`, `mode`, `cutoff_id`, `rule_version`), sesuai design.md UI-14: "latest committed run untuk cutoff + rule-version sama".
- Hanya run berstate `COMMITTED` yang dipertimbangkan; run lain dicatat sebagai `ignored_run_ids`.
- Latest = `commit_order` terbesar. `commit_order` wajib disediakan adapter dan harus mencerminkan urutan commit, bukan `created_at` atau `id` (D-06).
- `commit_order` seri pada nilai terbesar, atau tidak ada, membuat kelompok `AMBIGUOUS_ORDER` tanpa latest. Fungsi tidak jatuh ke `created_at`/`id`.
- `history_run_ids` memuat semua run COMMITTED kelompok; tidak ada yang dihapus atau ditimpa.

**I-EXACT/I-COVER per run (`computeExactCover`).**

- Pasangan valid = MATCHED + DISCREPANCY.
- "Item snapshot dalam scope" = baris run yang memiliki sisi stok, yaitu semua status kecuali STOCK_MISSING. Tafsiran ini cocok dengan fixture design.md (snapshot 8 item, valid 5 → 62,5%), tetapi kata "dalam scope" belum didefinisikan lebih jauh (§8).
- Hasil memuat `numerator`, `denominator`, `percent` (tanpa pembulatan), dan `insufficient_data`.
- Material ganda, status tidak dikenal, atau material kosong → `INCONSISTENT_RUN_LINE`; seluruh run ditolak.

**Service (`InventoryMetricsService.query`).**

1. Validasi filter: gudang UUID, mode, `rule_version`, dan daftar `cutoff_id` eksplisit yang tidak kosong dan tanpa duplikat. Definisi periode belum ada, jadi rentang tanggal tidak diterima.
2. Otorisasi scope (`FORBIDDEN` tanpa membaca sumber).
3. `RunCatalog.listRuns`. Run di luar scope/filter → `METRICS_SOURCE_INCONSISTENT`.
4. Latest per kelompok, lalu baca lines latest.
5. I-VAR (`computeIVar`, #37) + I-EXACT/I-COVER.

Hasil kosong dikembalikan kosong (A-1). Sumber gagal → `METRICS_SOURCE_UNAVAILABLE`, bukan angka nol (E-2). Log hanya `{code, correlation_id}`.

**Kode error.** `BAD_REQUEST` dan `FORBIDDEN` mengikuti `AppError`. `METRICS_SOURCE_UNAVAILABLE` dan `METRICS_SOURCE_INCONSISTENT` adalah **placeholder** (belum ada di katalog DOC-08).

## 4. Port

| Port | Adapter yang direncanakan | Ketergantungan |
| --- | --- | --- |
| `MetricsAuthorizer` | Sesi/role/assignment | SRS-47/48 |
| `RunCatalog` | `reconciliation_runs` terfilter sebelum paging, dengan `commit_order` | Migrasi 011; sumber `commit_order` (§8) |
| `RunLineReader` | `reconciliation_lines` per run | Migrasi 011 |

## 5. Verifikasi

Hasil eksekusi aktual pada branch `feature/SRS-32-latest-run-metrics` (25 November 2026, Node.js v24.18.0 lokal):

| Pemeriksaan | Hasil |
| --- | --- |
| `inventory-latest-metrics.test.ts`: latest run (6), I-EXACT/I-COVER dengan oracle design.md (7), service dengan fake (12) | 25 PASS |
| `inventory-metrics-db.todo.test.ts` | 8 TODO (belum dibuat; bukan PASS) |
| Uji mutasi sementara (tidak di-commit): run non-COMMITTED ikut dipilih; seri dipilih; denominator nol menjadi 0% | Tertangkap: 1, 2, dan 3 tes gagal; file asli dipulihkan |

Batas bukti: fake tidak membuktikan urutan commit PostgreSQL. Belum ada migrasi 011, API-16, atau layar SCR-14.

## 6. Catatan keterkaitan

- `commit_order` bergantung pada usulan SRS-29 (`KONTRAK_SCHEMA_011_RECONCILIATION_SRS-29.md` §7, PR #47): mengunci kelompok saat menyimpan run agar urutan dalam kelompok mengikuti urutan commit. Belum diputuskan.
- Fungsi I-VAR #37 dipakai apa adanya, tanpa perubahan.

## 7. Prasyarat lanjutan

Adapter dan tes PostgreSQL menunggu migrasi 011 dan keputusan sumber `commit_order`. I-REPEAT menunggu definisi periode.

## 8. Pertanyaan untuk Adam

1. **I-REPEAT:** "periode" didefinisikan bagaimana (rentang tanggal cutoff, jumlah cutoff terakhir, atau lainnya)? Apakah "item" dihitung per `material_id`, atau per material + UOM?
2. **I-REPEAT dengan satu cutoff:** design.md menulis "I-REPEAT 0 dengan teks penjelasan", sedangkan acceptance criteria SRS-32 menyatakan data tidak cukup tidak ditampilkan sebagai kinerja nol. Bentuk mana yang dipakai?
3. **Tie-break latest (OD-06):** dari mana `commit_order` diperoleh? Usulan di SRS-29 §7 adalah mengunci kelompok saat menyimpan run.
4. **"Item snapshot dalam scope" untuk I-COVER:** cukup baris run dengan sisi stok, atau ada filter scope lain (misalnya material tertentu)?
5. **Pembulatan persen** untuk tampilan dan DTO API-16.
6. **Kode error placeholder** `METRICS_SOURCE_UNAVAILABLE` dan `METRICS_SOURCE_INCONSISTENT`: dipakai, atau ada kode katalog yang lebih tepat?

## 9. Keterlacakan dan iterasi Prototyping

- **Kebutuhan:** acceptance criteria SRS-32 dan D-04/D-06.
- **Rancangan:** §2–§4.
- **Implementasi prototipe:** latest run, I-EXACT/I-COVER, dan service baca.
- **Evaluasi:** §5. Belum ada review nonpenulis dan belum ada feedback stakeholder.
- **Perbaikan:** menunggu §8.

| Acceptance criteria SRS-32 | Bukti saat ini | Bukti yang masih diperlukan |
| --- | --- | --- |
| I-VAR per pasangan | #37 merged; dipakai service | Tes PostgreSQL |
| I-EXACT, I-COVER mengikuti keputusan | Definisi design.md + oracle fixture | Konfirmasi §8 butir 4–5 |
| I-REPEAT mengikuti keputusan | **Belum** | Definisi periode (§8 butir 1–2) |
| Nonvalid dikecualikan sesuai denominator | Tes I-EXACT/I-COVER | Tes PostgreSQL |
| Data tidak cukup tidak ditampilkan sebagai kinerja nol | `insufficient_data` + `percent: null` | UI SCR-14 |

SRS-32 **belum selesai**.

## 10. Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1 | 2026-11-25 | Rancangan awal: latest COMMITTED, I-EXACT/I-COVER per run, service baca, port, pertanyaan | Belum ada; seluruh isi PROPOSED |
