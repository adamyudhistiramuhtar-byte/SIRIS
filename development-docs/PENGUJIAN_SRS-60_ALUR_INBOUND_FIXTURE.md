# Pengujian Alur Inbound Parsial, Final, dan Exception pada Fixture (SRS-60)

## Identitas dokumen

| Atribut | Nilai |
| --- | --- |
| Issue Jira | SRS-60 (T-26), Sprint 3 |
| Penyusun | Vassell Enha Atthayya (Anggota 3) |
| Reviewer teknis nonpenulis | Muhammad Luthfi Rafif |
| Tanggal | 2026-11-24 |
| Status dokumen | DRAFT, menunggu review |
| Sumber | DOC-13 PVT-06, PVT-07, PVT-16, PVT-23; `KONTRAK_SUMBER_SRS-37.md`; fixture `database/fixtures/uji/{expected,commitment,receiving}.proposed-0.1.json` |

## 1. Batas

- Suite ini menguji **fixture UJI dan oracle referensi**, bukan aplikasi berjalan, API, basis data, atau sesi nyata. Hasilnya tidak menggantikan eksekusi PVT pada build terintegrasi.
- Oracle (`tests/integration/inbound/inbound-oracle.ts`) bukan implementasi domain. Ia hanya menghitung hasil yang diharapkan dari fixture menurut DOC-13.
- Aturan yang masih OPEN tidak diputuskan: OD-06 (validitas bukti penutup dan penentuan delay) dan CF-06 (atribut urutan janji). Bagian yang bergantung padanya ditulis sebagai `it.todo`.
- Semua data berawalan `UJI-`. Mode ACTUAL tidak disentuh.

## 2. Berkas

| Berkas | Isi |
| --- | --- |
| `tests/integration/inbound/inbound-oracle.ts` | Fungsi murni: kuantitas berskala 6 desimal (bigint), validasi penutup, evaluasi penerimaan, tampilan histori janji |
| `tests/integration/inbound/inbound-flow-fixtures.spec.ts` | Suite table-driven: 20 definisi (16 dieksekusi, 4 todo) |

Dijalankan oleh proyek `api` pada `vitest.config.ts` (pola `tests/integration/**`).

## 3. Cakupan terhadap PVT

| PVT | Skenario | Yang diperiksa pada fixture | Hasil | Batas |
| --- | --- | --- | --- | --- |
| PVT-06 | Penerimaan parsial | 4 KG tanpa penutup: status parsial, total 4, bukan final, tidak mismatch, tanpa delay | PASS | Pembacaan exception dan histori lewat API NOT RUN |
| PVT-07 | Penerimaan final | Parsial 4 KG ditambah penutup sah 6 KG: final, total 10, tanpa mismatch | PASS (data PVT-07 ditulis inline) | Validitas isi bukti dan penentuan delay menunggu OD-06 (todo) |
| PVT-16 | Requested date dan histori janji | `requested_date` tetap 10 Nov, INITIAL lalu CHANGE tersimpan berurutan | PASS | Persistensi pada basis data NOT RUN |
| PVT-23 | Penutup invalid | Penutup tanpa referensi menghasilkan INVALID_CLOSING dan tidak dihitung | PASS | Daftar overdue terbuka NOT RUN (acuan overdue belum ditetapkan) |
| Tambahan | UOM berbeda, CHANGE tanpa INITIAL | Ditolak, tidak dikonversi otomatis | PASS | Kode galat mengikuti `expected_issue` pada fixture |

## 4. Temuan selisih antara DOC-13 dan fixture

| No | Temuan | Dampak | Usulan |
| --- | --- | --- | --- |
| F-1 | PVT-07 memakai parsial 4 KG ditambah penutup 6 KG (total 10). Fixture `receiving.proposed-0.1.json` memakai penutup 5 KG (total 9). Dengan fixture, hasilnya final dengan mismatch terhadap 10 KG | Fixture tidak dapat dipakai langsung sebagai data PVT-07 | Pilih salah satu: ubah fixture menjadi 6 KG, atau ubah data PVT-07. Perlu keputusan pemilik kontrak (Dwi) dan PM |
| F-2 | PVT-16 menyebut CHANGE bertanggal 12 Nov. Fixture `commitment.proposed-0.1.json` memakai 13 Nov | Expected PVT-16 tidak cocok harfiah dengan fixture. Perilaku yang diuji (requested date tidak tertimpa) tetap sama | Samakan salah satu sisi saat kontrak ditinjau |

Suite memuat kedua keadaan: kasus fixture (total 9, mismatch) dan kasus PVT-07 (total 10, tanpa mismatch) diuji terpisah, sehingga perubahan fixture nanti tidak menyembunyikan temuan.

## 5. Yang belum dapat diuji (todo dan NOT RUN)

- PVT-07 langkah 1 dan penentuan delay (OD-06 OPEN)
- PVT-23 langkah 2, daftar overdue terbuka (acuan overdue belum ditetapkan)
- Exception dan notices dari API nyata (SRS-21, SRS-23, SRS-54 belum selesai)
- Semua eksekusi pada build terintegrasi dengan sesi dan otorisasi nyata
- PVT-02, PVT-03, PVT-04, PVT-11, PVT-12 (di luar lingkup SRS-60)

## 6. Cara menjalankan

```
npx vitest run tests/integration/inbound
```

## Riwayat revisi

| Versi | Tanggal | Perubahan |
| --- | --- | --- |
| 0.1.0 | 2026-11-24 | Penyusunan awal. |
