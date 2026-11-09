# Matriks Dependency Pengembangan

Periode 9–29 November 2026, Asia/Jakarta. Status seluruh dependency implementasi: belum dibuktikan selesai. ID TECH adalah label perencanaan, bukan use case atau Jira key baru.

| Pekerjaan | Dependency teknis | Keputusan/sumber penghalang | Owner | Sprint | Kendali |
| --- | --- | --- | --- | --- | --- |
| TECH-01 repository/foundation | Tidak ada implementasi awal | Git/remote/identity; OD-07 | DEV-01 | S1 | CI repository/config dapat disiapkan lokal |
| TECH-02 auth/RBAC | TECH-01; referensi gudang | OD-04, OD-07; CF-02 | DEV-01 | S1 | Backend authorization harus diuji sebelum impor |
| TECH-04 app shell | TECH-01; design.md | Approval desain/source; OD-07 | DEV-03 | S1 | Buat komponen state, bukan success palsu |
| TECH-03 shared import | TECH-01/02; DB; audit dasar | OD-05; CF-04/06/07/08 | DEV-01 | S1–S2 | Staging→validasi→preview→commit atomik |
| UC-16 | TECH-03; kontrak lima jenis | OD-05; mapping FR asli | DEV-01 | S1–S2 | Bukan layar/route baru |
| UC-01 | TECH-02/03; UC-16; referensi | CF-06; source EXPECTED | DEV-02 | S1–S2 | Vertical slice pertama |
| UC-02/03 | UC-01; UC-16 | OD-06; event dan penutup sah | DEV-02 | S2 | Tidak mengubah requested date |
| UC-04/05/07 | UC-01/02/03 | OD-06; CF-07/08 | DEV-02 | S2 | Final exception terpisah overdue |
| UC-09 | TECH-02/03; UC-16; DB | CF-04; kontrak QTY AKHIR | DEV-04 | S1–S2 | Foundation S1, completion S2 |
| UC-10/12 | UC-09; COUNT; UC-16 | CF-04/05/08; grain/UOM | DEV-04 | S2 | Null/zero, cutoff, mode, atomic run |
| UC-06 | Referensi WO; shared read/query | OD-05; source WO dalam STOCK opsional | DEV-02 | S3 | Read-only; tidak impor keenam |
| UC-08 | UC-01–UC-04/07 | OD-06; eligibility/source date | DEV-02 | S3 | Denominator dan UOM tervalidasi |
| UC-11 | Dataset target sah; storage; RBAC | CF-03; OD-08 | DEV-04 | S3 | Jangan memilih target sebelum konflik ditutup |
| UC-13/14 | UC-12; histori immutable | CF-05/08; definisi metrik | DEV-04 | S3 | Source run/cutoff harus jelas |
| UC-15 UI | Audit dasar sejak S1; scope | CF-02/07/08; OD-08 | DEV-01 | S3 | Tampilan terlambat bukan alasan menunda audit dasar |
| RC/release review | Seluruh fitur, integrasi dan tes | OD-01/02/09; reviewer UAT | Seluruh tim | S3 | 29 November 2026; keputusan berbukti |

## Urutan integrasi

Fondasi database/reference/auth/RBAC/audit → shared staging/adaptor/validasi/preview/commit → inbound imports dan inventory imports → exception/reconciliation → history → metrics → WO/evidence/audit UI → integrasi/regresi/RC. Stream A dan B dapat berjalan paralel setelah kontrak shared stabil; DEV-01 mengintegrasikan shared module dan DEV-04 mengintegrasikan schema.

Registry OD-01–OD-10 dan CF-01–CF-09 berasal [indeks sumber](../../development-docs/00_MASTER_DOCUMENTATION_INDEX.md). Setup repository tidak menutup keputusan tersebut. Jadwal 9–29 November dari instruksi terbaru melengkapi kalender yang belum ditetapkan pada DOC-11, tanpa mengubah requirements atau status implementasi lama.

## Jalur kritis

Git/remote → foundation → auth/RBAC + import framework/UC-16 → UC-01 dan UC-09 → receiving/count → exception/reconciliation → metrics/evidence → regresi dan RC. Jika tertahan, lanjutkan tugas independen yang tidak menebak keputusan: review source, desain kontrak usulan, fixture UJI, spesifikasi test dan state UI. Jangan menyebut jalur tersebut implemented sebelum ada kode/tes.
