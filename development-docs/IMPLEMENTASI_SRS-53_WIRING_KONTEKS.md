# Implementasi SRS-53: Pengendali Alur Impor dan Reset Konteks

Status: PROPOSED. Dokumen ini mencatat tindak lanjut handoff PM pada PR #17 setelah routing SRS-46 (PR #24) masuk ke `develop`.

## 1. Ruang lingkup

Handoff PM meminta `ImportWizard` dipasang dengan menghubungkan `onContextReset` ke pembatalan request serta reset selection, preview, dan cache. Perubahan ini hanya menambah satu modul pengendali dan pengujiannya. Komponen `ImportWizard`, `FileUpload`, `ValidationReport`, router, dan halaman UC-01 (PR #11) tidak diubah.

| Berkas | Fungsi |
| --- | --- |
| `apps/web/src/shared/import/use-import-flow.ts` | Pengendali: memegang state wizard, berkas, progres, AbortController, dan berlangganan `onContextReset`. |
| `apps/web/src/tests/use-import-flow.spec.ts` | 13 pengujian, termasuk satu pengujian pemasangan pada `ImportWizard`. |

## 2. Perilaku yang diterapkan

1. Saat akun, role, gudang, atau mode berubah, request yang berjalan dibatalkan, lalu berkas, progres, preview, dan kunci simpan dibersihkan. Wizard kembali ke tahap Pilih File.
2. Respons yang datang terlambat dari konteks lama dibuang. Respons itu tidak ditampilkan sebagai preview maupun sukses.
3. Perubahan gudang dan mode dari wizard diteruskan ke store sesi. Gudang di luar assignment dan mode ACTUAL ditolak dan pengguna mendapat catatan singkat.
4. Hasil simpan yang tidak pasti menjadi `unknown` dengan kunci idempotensi. Cek status memakai kunci yang sama dan tidak pernah menampilkan sukses tanpa bukti dari layanan.
5. Kegagalan pembatalan menjadi `cancel-unknown`. Kegagalan validasi tampil sebagai galat umum tanpa pesan mentah.
6. Pengendali tidak mengakui warning. Hanya ID yang dikirim wizard setelah pengguna mengakui semuanya yang diteruskan ke layanan.

## 3. Batas dan hal yang belum dilakukan

- `ImportFlowService` adalah antarmuka lokal PROPOSED. Layanan nyata menunggu kontrak final SRS-58 dan endpoint SRS-51/52. Pemanggilan API sungguhan belum ada.
- Pemasangan pada halaman impor dan boundary PR #11 belum dilakukan. Berkas halaman yang dipakai perlu dipastikan PM agar tidak bertabrakan dengan PR #11.
- Penyelarasan identitas warning (teks atau UUID) dan kedaluwarsa dari server menunggu keputusan PM. Pengendali tidak menetapkan bentuk final.
- Browser upload belum diuji. ACTUAL, UC-11 (unggah dan unduh bukti), dan UC-12 (eksekusi) tetap nonaktif.
- Penyaringan di sisi klien bukan kontrol keamanan. Otoritas tetap pada backend (SRS-47/48).

## 4. Hasil pemeriksaan

Dijalankan pada hasil gabungan `develop` (28b8501) dengan branch SRS-53 (57a3ac1), Linux, Node dari lingkungan kerja.

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run typecheck` (api dan web) | PASS |
| `eslint apps/web` | PASS, tanpa temuan |
| `vitest run apps/` | PASS, 16 berkas, 219 tes |
| `check_repository.py --tracked` | PASS, 0 temuan (hanya berkas ter-track; berkas baru belum ter-track saat dijalankan) |
| Integrasi database | NOT RUN, tidak ada PostgreSQL |
| Browser upload dan layar nyata | NOT RUN |
