# Kontrak Data, Pemetaan Impor, dan Validasi

## Identitas dan kendali dokumen

| Atribut | Nilai |
| --- | --- |
| Document ID | DOC-08 |
| Nama proyek | SIRIS — Capstone Project Kelompok 42 |
| Mitra | Warehouse PT Harina Chemicals Industry |
| Versi | 0.2.0 |
| Status dokumen | PROPOSED — aturan bisnis SRC-01 dipertahankan |
| Tanggal penyusunan | 2026-11-10 |
| Pemilik dokumen | Database Architect |
| Tujuan dokumen | Menetapkan usulan kontrak normalisasi kelima jenis impor. |
| Ruang lingkup | Website pendamping Erasoft; Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation. |

Ketentuan pengguna diberi rujukan **SRC-01**. Desain baru berstatus **PROPOSED**, bukan BASELINE APPROVED. Belum ada aplikasi, hasil pengujian runtime, evaluasi stakeholder, atau persetujuan rilis yang dibuktikan dalam workspace ini. Semua contoh adalah **UJI**.

## Daftar isi

1. Identitas dan kendali dokumen
2. Referensi
3. Inventaris sumber dan ketersediaan
4. Jenis berkas dan metadata
5. Kontrak EXPECTED — PROPOSED
6. Kontrak COMMITMENT — PROPOSED
7. Kontrak RECEIVING — PROPOSED
8. Kontrak STOCK — PROPOSED
9. Kontrak COUNT — PROPOSED
10. Raw-to-normalized mapping
11. Validasi bertingkat dan preview
12. State machine impor PROPOSED
13. Commit, duplikasi, dan konkurensi
14. Tabel keputusan rekonsiliasi
15. Contoh hitung UJI dan cutoff
16. Katalog error dan warning
17. Keputusan domain yang ditahan setelah SRC-09 tersedia
18. Dependencies
19. Open issues
20. Riwayat revisi

## Referensi

SRC-01: master prompt pengguna pada sesi penyusunan; SRC-02: `../AGENTS.md`. SRC-09: `../design.md` v1.0.0, kontrak desain untuk ditinjau yang tersedia pada pemeriksaan akhir; snapshot visual disertakan pada DOC-10. Register sumber lengkap, hierarki, dan sumber eksternal terdapat pada [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md). Rujukan antardokumen: [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md), [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md), [DOC-05](05_BUSINESS_RULES_RBAC.md), [DOC-07](07_DATABASE_DESIGN.md), [DOC-09](09_API_SPECIFICATION.md), [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md).

## Inventaris sumber dan ketersediaan

| Sumber | Kegunaan | ACTUAL tersedia? | Fixture | Status pemetaan |
| --- | --- | --- | --- | --- |
| Referensi inbound | EXPECTED | Belum dibuktikan | UJI-IN-001 | SOURCE REQUIRED |
| Komitmen supplier | COMMITMENT | Belum dibuktikan | UJI-COM-001 | SOURCE REQUIRED |
| Penerimaan terstruktur | RECEIVING | Belum dibuktikan | UJI-RCV-001 | SOURCE REQUIRED |
| Kartu mutasi / QTY AKHIR | STOCK saldo | Belum dilampirkan | UJI-MAT-01 = 10 KG | Kolom QTY AKHIR diketahui dari SRC-01 |
| Hasil hitung fisik | COUNT | Belum dibuktikan | UJI-MAT-01 = 0 KG, counted=true | SOURCE REQUIRED |
| Supplier/material/gudang master | Referensi validasi | Belum dibuktikan | Kode berawalan UJI- | SOURCE REQUIRED |
| Referensi material WO | UC-06 read-only | Belum dibuktikan | UJI-WO-001 setelah schema disepakati | Mekanisme suplai OPEN DECISION |
| Bukti kartu stok | UC-11 | Belum dilampirkan | PDF/JPG/PNG sintetis tanpa data mitra | Target final OPEN DECISION |

## Jenis berkas dan metadata

Jenis file impor tidak ditetapkan SRC-01. **PROPOSED:** CSV UTF-8 untuk lima kontrak, delimiter koma, header eksplisit, quoted field sesuai CSV; XLSX hanya setelah sampel/sheet disetujui. Format evidence tidak menentukan format impor. STOCK diusulkan sebagai satu request multipart dengan `balance_file` wajib dan `support_files` opsional; bukan beberapa commit saldo terpisah. Batas ukuran file impor, jumlah baris, encoding lain dan komponen support: NEEDS BASELINE; jangan memakai batas 5 MiB evidence sebagai batas impor.
| Metadata | Tipe | Wajib | Contoh UJI | Validasi/sumber |
| --- | --- | --- | --- | --- |
| kind | enum | Ya | STOCK | Salah satu lima jenis |
| warehouse_id | uuid | Ya | ID gudang UJI | Dari pilihan pengguna; divalidasi scope sesi |
| mode | enum | Ya | UJI | Tidak boleh diinfer dari nama file saja |
| source_name | string | Ya | UJI-stock.csv | Disanitasi |
| source_reference | string | Ya | UJI-SRC-001 | Referensi dokumen/sumber; bukan bukti mitra |
| cutoff_id | uuid | STOCK/COUNT | ID konteks UJI | Konteks waktu sama untuk rekonsiliasi |
| source_timezone | string | Kondisional | Asia/Jakarta | Wajib bila timestamp lokal tanpa offset; timezone mitra belum dikonfirmasi |
| contract_version | string | Ya | proposed-0.1 | Versi adaptor dan mapping |
| source_hash | SHA-256 | Server | Dihitung server | Hash seluruh bagian paket |
| actor_id | uuid | Server | Dari sesi | Tidak menerima identitas pelaku dari file |

## Kontrak EXPECTED — PROPOSED

| Field normalized | Tipe | Wajib | Format / contoh UJI | Validasi |
| --- | --- | --- | --- | --- |
| source_ref | string | Ya | UJI-IN-001 | Kunci line sumber unik dalam gudang/mode |
| material_code | string | Ya | UJI-MAT-01 | Referensi material harus ada pada mode sama |
| supplier_code | string | Ya | UJI-SUP-01 | Referensi supplier harus tersedia; tidak membuat master otomatis |
| uom | string | Ya | KG | Kode canonical dari mapping yang disetujui |
| requested_date | date | Ya | 2026-11-10 | ISO 8601 YYYY-MM-DD; immutable setelah commit |
| expected_quantity | decimal string | Ya | 10.000000 | Nonnegatif; presisi usulan numeric(20,6) |

Sumber: file EXPECTED beserta metadata batch. Nama header asli selain `QTY AKHIR` masih SOURCE REQUIRED. Contoh di atas bukan transaksi mitra.

## Kontrak COMMITMENT — PROPOSED

| Field normalized | Tipe | Wajib | Format / contoh UJI | Validasi |
| --- | --- | --- | --- | --- |
| inbound_source_ref | string | Ya | UJI-IN-001 | Referensi EXPECTED committed dan scope cocok |
| event_ref | string | Ya | UJI-COM-001 | Unik per inbound |
| event_type | enum | Ya | INITIAL | INITIAL atau CHANGE; CHANGE harus memiliki INITIAL |
| promised_date | date | Ya | 2026-11-11 | YYYY-MM-DD; tidak menulis requested_date |
| event_at | datetime | Ya | 2026-11-10T08:00:00+07:00 | Waktu sumber; konflik urutan ditolak |

Sumber: file COMMITMENT beserta metadata batch. Nama header asli selain `QTY AKHIR` masih SOURCE REQUIRED. Contoh di atas bukan transaksi mitra.

## Kontrak RECEIVING — PROPOSED

| Field normalized | Tipe | Wajib | Format / contoh UJI | Validasi |
| --- | --- | --- | --- | --- |
| inbound_source_ref | string | Ya | UJI-IN-001 | Referensi EXPECTED committed |
| event_ref | string | Ya | UJI-RCV-001 | Unik per inbound |
| received_quantity | decimal string | Ya | 4.000000 | Nonnegatif; koreksi belum disepakati |
| uom | string | Ya | KG | Sama dengan referensi inbound; tidak dikonversi otomatis |
| received_at | datetime | Ya | 2026-11-11T09:00:00+07:00 | ISO 8601 ber-offset |
| is_closing | boolean | Ya | false | Tidak diturunkan dari jumlah kumulatif |
| closing_reference | string/null | Kondisional | null | Wajib saat is_closing=true; bukti sah OD-06 |

Sumber: file RECEIVING beserta metadata batch. Nama header asli selain `QTY AKHIR` masih SOURCE REQUIRED. Contoh di atas bukan transaksi mitra.

## Kontrak STOCK — PROPOSED

| Field normalized | Tipe | Wajib | Format / contoh UJI | Validasi |
| --- | --- | --- | --- | --- |
| material_code | string | Ya | UJI-MAT-01 | Referensi sah |
| uom | string | Ya | KG | Kode canonical |
| system_quantity | decimal string | Ya | 10.000000 | Wajib berasal QTY AKHIR; tidak menjumlah movement |

Sumber: file STOCK beserta metadata batch. Nama header asli selain `QTY AKHIR` masih SOURCE REQUIRED. Contoh di atas bukan transaksi mitra.

Saldo merupakan komponen wajib. Dukungan opsional disimpan di stock_support_rows dengan lineage, tidak dijumlahkan kembali ke system_quantity. Komponen opsional yang diberikan tetapi invalid menggagalkan paket; komponen tidak diberikan hanya menghasilkan warning.

## Kontrak COUNT — PROPOSED

| Field normalized | Tipe | Wajib | Format / contoh UJI | Validasi |
| --- | --- | --- | --- | --- |
| material_code | string | Ya | UJI-MAT-01 | Referensi sah |
| uom | string | Ya | KG | Kode canonical |
| is_counted | boolean | Ya | true | Eksplisit; tidak diturunkan dari blank/zero |
| physical_quantity | decimal string/null | Kondisional | 0.000000 | Wajib nonnull >=0 jika true; wajib null jika false |

Sumber: file COUNT beserta metadata batch. Nama header asli selain `QTY AKHIR` masih SOURCE REQUIRED. Contoh di atas bukan transaksi mitra.

## Raw-to-normalized mapping

| Raw | Normalized/domain | Aturan |
| --- | --- | --- |
| QTY AKHIR | STOCK.system_quantity → stock_lines.system_quantity | Parse decimal sesuai locale sumber; tolak ambigu; jangan tambah movement |
| Header sumber lain | Field kontrak di atas | Mapping eksplisit per contract_version; SOURCE REQUIRED |
| Kode material/supplier | material_id / supplier_id | Lookup mode sama; raw code tetap tersimpan |
| Blank physical count | physical_quantity=null | Hanya sah jika is_counted=false; blank tidak otomatis 0 |
| Timestamp lokal | timestamptz | Butuh zona asal; simpan raw agar transformasi tertelusur |
| File + metadata | import_batches + staging_rows | Hash, row_number dan component menjaga lineage |

## Validasi bertingkat dan preview

Urutan: otorisasi → tipe/struktur file → field wajib/tipe → normalisasi → referensi → aturan bisnis → duplikasi → laporan. Error menghalangi preview siap commit; warning harus terlihat. PROPOSED: file tanpa baris data ditolak sebagai INVALID_FILE; batch tidak memperoleh preview siap commit. Usulan kebijakan warning: pengguna mengakui daftar warning saat konfirmasi. Preview memuat batch_id, kind, warehouse_id, mode, row_count, error_count, warning_count, normalized sample yang diizinkan, fingerprint, validator_version, validated_at dan expires_at. Timestamp server menjadi acuan; pada detik tepat expiry commit sudah ditolak.

Fingerprint **PROPOSED** = SHA-256 canonical normalized data + source hashes + metadata bisnis + contract/validator version + referensi versi terkait. Field urutan JSON harus dinormalisasi. Perubahan file, gudang, mode, cutoff atau referensi membatalkan preview. Metadata yang tampil dan disetujui pengguna harus sama dengan metadata yang di-commit.

## State machine impor PROPOSED

| Dari | Trigger / syarat | Ke | Efek |
| --- | --- | --- | --- |
| STAGED | Mulai validasi | VALIDATING | Tidak menulis domain |
| VALIDATING | Error ditemukan | INVALID | Simpan validation_issues |
| VALIDATING | Tanpa error | PREVIEW_READY | Tetapkan expiry 30 menit |
| PREVIEW_READY | Konfirmasi sah sebelum expiry | COMMITTED | Satu transaksi domain, lineage, audit SUCCESS, idempotency |
| PREVIEW_READY | Jam server >= expiry | EXPIRED | Tidak commit |
| INVALID / EXPIRED / PREVIEW_READY | Validasi ulang snapshot sama | VALIDATING | Fingerprint/expiry baru; preview lama tidak sah |
| STAGED / INVALID / PREVIEW_READY / EXPIRED | Pengguna membatalkan | CANCELLED | Audit pembatalan |
| PREVIEW_READY | Kegagalan transaksi | PREVIEW_READY atau EXPIRED | Rollback; audit FAILURE terpisah |
| COMMITTED | Retry identik | COMMITTED | Kembalikan hasil lama |
| COMMITTED / CANCELLED | Mutasi isi | Ditolak | Batch terminal immutable |

## Commit, duplikasi, dan konkurensi

Setiap commit membawa Idempotency-Key dan fingerprint preview. Dalam satu transaksi: kunci batch; cek existing idempotency response; cek actor/scope; cek fingerprint/expiry/state; cek ulang referensi terkunci; insert domain/lineage; audit sukses; tandai batch COMMITTED; simpan response idempotency. Key sama + payload berbeda ditolak 409. Batch baru dengan sumber bisnis identik dikenali menggunakan unique key domain dan canonical hash; kembalikan referensi hasil terdahulu tanpa duplikasi bila semuanya identik. Campuran baris lama/baru atau payload berbeda ditolak secara atomik sampai aturan koreksi disetujui. Untuk retry setelah jaringan putus, periksa record sukses dahulu sebelum expiry: keberhasilan lama tetap dapat dikembalikan.

Jika transaksi gagal sebelum sukses, rollback mencakup idempotency reservation sehingga retry aman; audit kegagalan dilakukan terpisah. Konkurensi dua key terhadap sumber sama tetap dilindungi unique constraints. Retensi idempotency adalah OD-08; rekam kunci bisnis tidak boleh hilang sehingga retry lama membuat duplikasi.

## Tabel keputusan rekonsiliasi

Pra-validasi run: gudang, mode, cutoff harus cocok; ACTUAL memakai VERIFIED. Tolak run jika konteks tidak sesuai atau grain material ambigu (AMBIGUOUS_PAIR), bukan menciptakan status variance baru. Usulan prioritas baris di bawah berlaku setelah konteks run valid; prioritas saat beberapa kondisi bertabrakan perlu review OD-05.
| Kondisi berurutan | Status | Variance | Eligible metrik valid |
| --- | --- | --- | --- |
| Stok tidak ada; count ada | STOCK_MISSING | null | Tidak |
| Stok ada; count tidak ada | COUNT_MISSING | null | Tidak |
| Dua sisi ada; UOM berbeda | UOM_MISMATCH | null | Tidak |
| Dua sisi ada; UOM sama; is_counted=false | NOT_COUNTED | null | Tidak |
| Dua sisi ada; UOM sama; counted=true; fisik-sistem=0 | MATCHED | 0 | Ya |
| Dua sisi ada; UOM sama; counted=true; fisik-sistem≠0 | DISCREPANCY | physical_quantity - system_quantity | Ya |

## Contoh hitung UJI dan cutoff

UJI-A: system_quantity=10, physical_quantity=0, is_counted=true → variance=-10 DISCREPANCY. UJI-B: system_quantity=10, physical_quantity=null, is_counted=false → NOT_COUNTED dan variance=null. UJI-C: stok tidak ada, count=8 → STOCK_MISSING dan variance=null. Tidak menambah stok nol untuk sisi yang hilang. Context cutoff yang sama diusulkan memakai cutoff_id identik; kesetaraan cutoff berbeda ID memerlukan aturan eksplisit, bukan toleransi waktu tersembunyi.

## Katalog error dan warning

| Code | HTTP usulan | Pemicu | Pemulihan |
| --- | --- | --- | --- |
| INVALID_FILE | 422 | Struktur atau jenis file tidak sesuai | Gunakan kontrak yang disetujui |
| MISSING_REFERENCE | 422 | Referensi tidak ditemukan pada scope/mode | Periksa referensi sumber; jangan buat master fiktif |
| DUPLICATE_SOURCE | 409 | Kunci sumber sama tetapi payload berbeda | Bandingkan sumber; koreksi melalui keputusan resmi |
| IDEMPOTENCY_CONFLICT | 409 | Key sama dengan fingerprint berbeda | Jangan ganti key untuk melewati konflik bisnis |
| PREVIEW_EXPIRED | 410 | Waktu server >= expires_at | Validasi ulang |
| PREVIEW_CHANGED | 409 | Fingerprint atau referensi berubah | Buat preview baru |
| FORBIDDEN | 403 | Izin tidak cukup | Hubungi penanggung jawab akses |
| CUTOFF_MISMATCH | 422 | Konteks cutoff berbeda | Pilih konteks yang sama |
| CUTOFF_UNVERIFIED | 422 | ACTUAL belum VERIFIED | Lengkapi bukti verifikasi yang berwenang |
| MODE_MISMATCH | 422 | Mode berbeda | Pilih ACTUAL atau UJI secara konsisten |
| WAREHOUSE_MISMATCH | 422 | Gudang berbeda | Pilih pasangan gudang sama |
| AMBIGUOUS_PAIR | 422 | Lebih dari satu calon pasangan material | Tinjau grain sumber; tidak menjumlah otomatis |
| NOT_COUNTED_VALUE | 422 | false dengan quantity nonnull | Gunakan null atau koreksi is_counted |
| INVALID_CLOSING | 422 | Penutup tanpa bukti sah | Lengkapi sumber penutup |
| FILE_TOO_LARGE | 413 | Evidence >5 MiB | Gunakan file dalam batas |
| UNSUPPORTED_MEDIA | 415 | Tipe/signature tidak sesuai | Gunakan PDF/JPG/PNG |
| INVALID_TARGET | 422 | Evidence tidak menunjuk satu target sah | Pilih target yang diizinkan |
| TRANSACTION_FAILED | 500 | Transaksi gagal dan di-rollback | Periksa correlation_id dan retry dengan key sama |
| OPTIONAL_COMPONENT_ABSENT | 200 | Dukungan STOCK opsional tidak ada | Warning informasional; saldo tetap dapat diimpor |

## Keputusan domain yang ditahan setelah SRC-09 tersedia

**CF-03–CF-06 dan CF-08 — OPEN DECISION.** Schema, payload dan test yang terdampak berikut masih PROPOSED dan tidak boleh diimplementasikan sebagai kontrak final sebelum sumber dianalisis.

| Area | Usulan dalam paket | SRC-09 | Tindakan sebelum implementasi |
| --- | --- | --- | --- |
| Evidence target | stock_line_id | snapshot ATAU count | Pilih scope final; bila source disahkan, ganti dengan stock_snapshot_id/count_session_id nullable dan XOR tepat satu, FK/scope wajib; perbarui API dan fixture |
| Cutoff | cutoff_at timestamptz; VERIFIED/UNVERIFIED | effective date/time, basis, precision; UJI SIMULATED | Sediakan date-only tanpa memalsukan waktu, basis reference dan status simulasi; perubahan schema/API melalui review |
| Rekonsiliasi identik | Idempotency-Key sama mengembalikan run sama; key baru dapat run baru | Fingerprint hasil identik dibaca ulang | Tentukan fingerprint snapshot/count/rule version dan kebijakan reuse lintas key; jangan duplikasi sebelum keputusan |
| EXPECTED quantity | >=0 | >0 | Konfirmasi apakah nol valid; perbarui validator dan boundary test |
| COMMITMENT | INITIAL/CHANGE + event_at | Sequence, previous date, committed date, recorded_at | Tambahkan pemetaan sumber jika disahkan; jangan sintesis event lama dari informasi yang hilang |
| WO di STOCK | stock_support_rows menyimpan payload; sumber wo_references belum ditetapkan | STOCK mendukung komponen WO opsional | Usulan pemetaan WO support ke wo_references dengan source_row lineage; bukan impor keenam |


## Dependencies

| Dependensi | Kegunaan |
| --- | --- |
| [DOC-00](00_MASTER_DOCUMENTATION_INDEX.md) | Indeks Induk Dokumentasi Pengembangan |
| [DOC-03](03_PRODUCT_REQUIREMENTS_DOCUMENT.md) | Dokumen Kebutuhan Produk |
| [DOC-05](05_BUSINESS_RULES_RBAC.md) | Spesifikasi Aturan Bisnis dan RBAC |
| [DOC-07](07_DATABASE_DESIGN.md) | Desain Database, ERD, IRD, dan Kamus Data |
| [DOC-09](09_API_SPECIFICATION.md) | Spesifikasi REST API |
| [DOC-13](13_SOFTWARE_TEST_PLAN_TEST_CASES.md) | Rencana dan Spesifikasi Kasus Pengujian |

## Open issues

Rincian baseline final belum tersedia; lihat register sumber dan keputusan terbuka pada DOC-00.

## Riwayat revisi

| Versi | Tanggal | Perubahan | Persetujuan |
| --- | --- | --- | --- |
| 0.1.0 | 2026-11-10 | Penyusunan berdasarkan SRC-01; celah sumber dicatat dan desain ditandai PROPOSED. | Belum ada bukti persetujuan |
| 0.2.0 | 2026-11-10 | Integrasi SRC-09 design.md: route, role, token, layar pendukung, metrik dan konflik desain; tetap NEEDS REVIEW. | Belum ada bukti persetujuan |
