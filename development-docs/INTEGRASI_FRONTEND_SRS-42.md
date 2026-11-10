# Batas integrasi frontend — SRS-42

Status **PROPOSED — NEEDS REVIEW**, 10 November 2026. [SRS-42](https://adamyudhistiramuhtar.atlassian.net/browse/SRS-42) dikembangkan bertumpuk di atas PR #4; implementasi belum menjadi kontrak backend yang disetujui. DOC-09 dan desain aplikasi masih perlu review. Kebijakan Node 22, npm workspaces, root lockfile, `npm ci` di CI, isolasi UJI dan secret di luar Git telah disetujui PM pada SRS-40.

## Konvensi implementasi untuk review

- `apps/web/src/shared/api/client.ts` menyediakan `apiClient` dan `ApiClient`; model envelope/error berasal dari `packages/contracts`. Adapter endpoint bertanggung jawab memvalidasi isi DTO spesifik; pemeriksaan client umum hanya memeriksa bentuk object/envelope dan bukan validator domain.
- `VITE_API_BASE_URL` adalah konfigurasi **publik** Vite. Jika tidak disetel, client memakai `/api/v1`; nilai eksplisit kosong atau URL tidak aman ditolak. Jangan menaruh token, password, atau informasi rahasia pada variabel `VITE_*`. Vite membaca environment menurut root proyek dan environment prosesnya; verifikasi konfigurasi lokal masing-masing tanpa commit `.env`.
- Response envelope `ApiResponse<T>` dipertahankan; object DTO langsung termasuk koleksi `{items: [], next_cursor: null}` dari DOC-09 dibungkus menjadi `data`. Ini jembatan untuk perbedaan bentuk draft DOC-09 dan scaffold, **bukan** keputusan final bentuk API. Response malformed ditolak; HTTP 204 tidak diklaim didukung karena DOC-09 belum menetapkannya.
- Error terstruktur membawa `code`, `details`, status dan correlation ID; error jaringan GET dibedakan dari mutasi yang hasilnya tidak diketahui. Pada mutasi, pemutusan jaringan, abort, body sukses yang tak terbaca, dan HTTP 5xx diperlakukan sebagai outcome tidak pasti. Jangan retry otomatis; periksa status menggunakan kontrak yang disahkan dan pertahankan idempotency key. Tidak ada penanganan session/cookie lintas origin yang ditetapkan oleh pekerjaan ini.
- `RequestOptions` menerima `Headers`, query dan `AbortSignal`; correlation ID yang disediakan pemanggil diteruskan, correlation ID dari response disimpan jika tersedia. Request JSON dan `FormData` didukung; browser menetapkan boundary multipart. Tidak ada request/response atau credential dicatat ke console oleh client.
- Client tidak menyimpan cache dan tidak memilih mode/gudang. Pemanggil harus membawa context yang benar; backend tetap menjadi otoritas izin dan pemisahan ACTUAL/UJI. Mock di test hanya fixture UJI dan tidak menunjukkan integrasi backend nyata.

## Handoff lintas anggota

| Pemilik | Issue terkait | Kebutuhan untuk integrasi dan risiko |
| --- | --- | --- |
| Vassell | SRS-45/46/53/54/25/56 | Komponen dan routing tetap milik issue tersebut; gunakan hasil adapter dan tampilkan error/unknown outcome tanpa menyatakan sukses. ImportWizard mempertahankan context dan idempotency key. Harness/fixture lintas role tetap SRS-54. |
| Luthfi | SRS-36/43/47/48/49/51 | Tinjau bentuk response langsung vs envelope, error, correlation ID, CSRF/session dan scope; backend memeriksa role/gudang/objek. Validasi preview, expiry dan status transaksi tetap otoritas API. |
| Dwi | SRS-37/38/44/50/52 | Sahkan kontrak sumber, cutoff, staging, lineage dan retry atomik; quantity/header CF-06 masih terbuka. Sediakan DB dan fixture UJI terisolasi saat dependency siap; frontend tidak mengklaim commit atau rollback dari mock. |

Tidak ada perubahan kepemilikan Jira atau persetujuan anggota lain yang diklaim. Untuk route `/inbound/import-reference`, integrasi halaman SRS-16/82 tetap menunggu shared component SRS-53, transaksi SRS-52 dan review kontrak; jangan membuat duplikat ImportWizard atau menetapkan CF-06 dari asumsi.

## Verifikasi dan integrasi

Jalankan lint, typecheck, build dan test sesuai manifest. Test client menggunakan respons sintetis dan fetch tiruan, sedangkan integration test backend dan PostgreSQL hanya dapat dilaporkan jika dijalankan pada layanan nyata. PR SRS-42 harus tetap bertumpuk pada PR #4 dan tidak di-merge sebelum SRS-41 memenuhi DoD; setelah baseline tersedia di develop, retarget dan verifikasi ulang pada commit hasil integrasi. Review independen tetap diperlukan.
