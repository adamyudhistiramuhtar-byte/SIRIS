# Implementasi SRS-83: Komponen Preview Saldo dan Cutoff

Status: PROPOSED. Mengikuti kontrak kandidat SRS-58 `proposed-0.1` (PR #20). Kontrak itu belum disahkan, sehingga bentuk data di sini dapat berubah.

## Lingkup

Komponen presentasi `StockBalancePreview` untuk menampilkan saldo sistem per material dan cutoff pada alur impor stok (UC-09 / SCR-09). Komponen berdiri sendiri: belum dipasang pada halaman mana pun dan tidak memanggil API.

Berkas:

- `apps/web/src/components/patterns/StockBalancePreview.vue`
- `apps/web/src/shared/import/stock-preview-types.ts` (tipe lokal dan fungsi format)
- `apps/web/src/tests/stock-balance-preview.spec.ts` (18 uji)

## Aturan yang dijaga

| Aturan | Perilaku komponen |
| --- | --- |
| Tidak menghitung movement atau total | Tidak ada baris total, tidak ada penjumlahan |
| Kuantitas berupa string desimal | Diformat dengan manipulasi string, tanpa konversi ke angka, sehingga tidak ada kehilangan presisi |
| Nilai kosong bukan nol | `null` tampil "Tidak tersedia"; `"0"` tampil 0 |
| Nilai di luar pola kontrak | Ditandai "Nilai tidak valid" dengan nilai asli, tidak dikoreksi |
| Cutoff tanpa jam (CF-04 OPEN) | Tampil tanggal saja dengan "jam tidak ditentukan"; jam tidak diturunkan dari tanggal |
| Cutoff belum ada | Peringatan `role="alert"`; tidak ada tanggal karangan |
| Baris yang tampil kurang dari jumlah layanan | Dinyatakan "Menampilkan X dari Y baris" |
| Mode | Label UJI atau ACTUAL; komponen tidak mengaktifkan ACTUAL |

## Aksesibilitas

Heading terhubung ke section, tabel punya caption dan `th scope="col"`, wadah gulir berupa region yang dapat difokuskan keyboard, status memuat memakai `role="status"` dan `aria-busy`. Warna memakai token `siris-*` sehingga mengikuti tema terang, gelap, dan kontras tinggi.

## Hasil pemeriksaan

| Pemeriksaan | Hasil |
| --- | --- |
| vue-tsc typecheck | PASS |
| eslint | PASS |
| vitest `apps/` | PASS (148 uji, termasuk 18 uji baru) |
| Pemeriksaan visual di browser, tiga tema | NOT RUN |
| Pemeriksaan NVDA | NOT RUN (komponen belum dipasang pada halaman) |
| Integrasi dengan API pratinjau nyata | NOT RUN (menunggu kontrak SRS-58 disahkan dan backend SRS-47/48) |

## Batasan dan pertanyaan terbuka

- Nama field mengikuti `NormalizedSTOCK` (`material_code`, `uom`, `system_quantity`) dan `cutoff_id`. Pemetaan snake_case ke camelCase dilakukan oleh pemanggil.
- Jam dan zona waktu cutoff menunggu keputusan CF-04.
- Halaman yang menjadi tempat komponen ini dipasang menunggu jawaban Adam.
- Pemfilteran atau pembatasan data di sisi klien bukan kontrol keamanan; otoritasnya ada di backend.
