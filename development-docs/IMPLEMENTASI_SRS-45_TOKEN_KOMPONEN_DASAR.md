# Implementasi SRS-45 (T-11): Token dan Komponen Dasar Antarmuka

Dokumen ini mencatat pekerjaan SRS-45 pada cabang `feature/SRS-45-design-tokens-komponen-dasar`.
Sumber acuan: `design.md` (SIRIS Frontend Design Contract), terutama §4.9 (registry token), §5 (komponen), dan §8.2 (kontrak adapter).

## 1. Ringkasan

| Butir | Keterangan |
| --- | --- |
| Tujuan | Menurunkan registry token `design.md` menjadi CSS variable dan menyediakan komponen dasar Button, FormField, Input, Select, Badge, Alert, serta gaya fokus. |
| Tema | Hanya tema terang yang aktif pada V1 (`data-theme="light"`). Tema `dark` dan `high-contrast` ikut dihasilkan sebagai cadangan, belum diaktifkan. |
| Ikon | Satu pustaka ikon: `lucide-vue-next` yang sudah ada di repositori. Tidak ada pustaka UI atau ikon baru. |
| Identitas | Teks "SIRIS" tanpa logo (tidak diubah). |

## 2. Alur token

1. `design.md` §4.9 adalah satu-satunya sumber nilai token.
2. `scripts/generate-design-tokens.mjs` membaca blok JSON §4.9, menyelesaikan alias (dengan pemeriksaan alias hilang dan siklus), menghapus prefiks layer/tema, mengubah titik menjadi tanda hubung, mendeteksi tabrakan nama, dan menulis:
   - `apps/web/src/styles/generated/design-tokens.json` (salinan registry),
   - `apps/web/src/styles/generated/tokens.css` (CSS variable per tema).
3. Alias token komponen ke token semantik dipertahankan sebagai `var(--...)`; alias ke token primitif diisi nilainya. Token primitif tidak diemisikan dan tidak dipakai komponen.
4. `apps/web/tailwind.config.js` tetap memakai nama kelas `siris-*`, tetapi nilainya kini `var(--...)` ke token yang sama. Tidak ada palet kedua yang dikelola manual.

Berkas hasil generate tidak diedit manual. Setelah `design.md` berubah, jalankan ulang generator.

## 3. Perintah

Dijalankan dari akar repositori.

| Perintah | Fungsi |
| --- | --- |
| `npm run tokens:generate` | Menghasilkan ulang `tokens.css` dan `design-tokens.json`. |
| `npm run tokens:check` | Gagal (exit 1) jika hasil generate tidak sinkron dengan `design.md`. |
| `npm run lint` / `npm run typecheck` / `npm run build` / `npm test` | Pemeriksaan standar proyek. |
| `$env:VITE_ENABLE_IMPORT_SIMULATOR="true"; npm run dev --workspace @siris/web` | Menjalankan frontend (PowerShell, setelah `npm ci`). |

## 4. Komponen (`apps/web/src/components/primitives/`)

| Komponen | Keadaan dan perilaku utama |
| --- | --- |
| `BaseButton` | Varian primary/secondary/tertiary/danger; ukuran sm/md/lg (32/40/44 px lewat token); `type` eksplisit (default `button`); nonaktif memakai `aria-disabled` (tetap dapat difokuskan, tanpa opacity) dengan `disabledReason` terbaca pembaca layar; loading menampilkan spinner dan kata kerja, lebar stabil, klik ganda diblokir, `aria-busy`. |
| `FormField` | Label selalu terlihat; hint dan galat dikaitkan lewat `aria-describedby`; galat berupa teks dengan `role="alert"`; wajib diisi ditandai teks "(wajib diisi)". Atribut untuk kontrol diberikan lewat slot. |
| `BaseInput` | Elemen `<input>` native (text/password/search), `v-model`, `aria-invalid`, keadaan disabled/read-only terbaca. |
| `BaseSelect` | Elemen `<select>` native, `v-model`, placeholder, keadaan loading ("Memuat opsi…") dan kosong ("Tidak ada opsi tersedia"), `aria-invalid`. |
| `StatusBadge` | Status selalu berupa teks; varian neutral/success/warning/danger/info. |
| `AlertBanner` | Varian info/success/warning/danger; `role="alert"` untuk danger/warning dan `role="status"` untuk lainnya; ikon dekoratif (`aria-hidden`); tombol tutup opsional berlabel "Tutup pemberitahuan". |

Fokus: `apps/web/src/styles/base.css` memberi cincin fokus lewat `:focus-visible` (lebar `--focus-width`, jarak `--focus-offset`, celah `--focus-gap`), mengurangi gerak saat `prefers-reduced-motion`, dan memakai warna sistem saat `forced-colors`.

Semua gaya komponen hanya memakai `var(--...)`; tidak ada warna atau piksel literal (diperiksa otomatis oleh pengujian).

## 5. Perubahan pada berkas yang sudah ada

- `apps/web/src/assets/main.css`: mengimpor `tokens.css` dan `base.css`.
- `apps/web/tailwind.config.js`: warna dan font dipetakan ke CSS variable.
- `apps/web/index.html`: menambah `data-theme="light"` pada `<html>`.
- `package.json` (akar): menambah skrip `tokens:generate` dan `tokens:check`.

Dampak visual: nilai warna kini mengikuti `design.md`, sehingga sedikit berbeda dari palet scaffold lama (contoh: border `#DFE5EC`, border-strong `#637487`).

## 6. Bukti pengujian

Dijalankan pada cabang kerja (Node/Vitest di lingkungan cloud, bukan di mesin Windows pengembang). Hasil aktual:

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run tokens:check` | PASS — "Token sinkron dengan design.md (424 token terbaca)". |
| `npm run lint` | PASS — 0 error, 0 warning. |
| `npm run typecheck` | PASS — contracts, api, web. |
| `npm test` | PASS — 9 berkas, 57 pengujian (termasuk 19 pengujian token dan 25 pengujian komponen baru, serta smoke test AppShell). Tes database tercatat NOT RUN/BLOCKED karena PostgreSQL belum aktif (perilaku bawaan, bukan bagian SRS-45). |
| `npm run build` | PASS — build contracts, api, dan web berhasil. |
| Pemeriksaan visual di browser | NOT RUN — belum dilakukan; perlu dicek pengembang dengan menjalankan frontend. |
| Uji manual keyboard dan pembaca layar | NOT RUN. |
| Pengukuran kontras warna manual | NOT RUN — nilai berasal dari token `design.md`; tidak diukur ulang. |
| Review oleh orang lain dan merge PR | Belum (syarat Definition of Done). |

## 7. Keterbatasan dan tindak lanjut

- `lucide-vue-next` berstatus deprecated; `design.md` menyarankan `@lucide/vue`. Tidak dipasang keduanya agar tidak ada dua pustaka ikon. Migrasi perlu keputusan terpisah.
- Font Inter masih dimuat dari Google Fonts CDN di `index.html`; `design.md` menghendaki self-host dan berkas font belum tersedia (belum diverifikasi).
- `screens` Tailwind belum diturunkan dari token.
- Belum ada halaman katalog komponen agar tidak menambah rute di luar 17 layar yang disepakati; komponen diverifikasi lewat pengujian.
- Langkah `tokens:check` belum ditambahkan ke workflow CI (berkas workflow dikelola PM).
- Cabang ini bertumpu pada `chore/SRS-41-reconcile-main-develop` (PR #4 belum merge); PR diarahkan ke `develop` setelah PR #4 merge.
- Ketergantungan T-08 (SRS-42, adapter API) tidak menghalangi pekerjaan ini.
