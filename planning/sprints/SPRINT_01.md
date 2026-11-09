# Sprint 01 — Fondasi dan prototipe pertama

Periode: **9–15 November 2026**. Timezone: **Asia/Jakarta**. Keseluruhan rencana: **9–29 November 2026**. Target akhir **29 November 2026** tidak diperpanjang. Status: PARTIAL untuk setup lokal; implementasi NOT STARTED. Semua tes aplikasi **NOT RUN**. Tidak ada aktivitas historis yang dinyatakan selesai tanpa bukti.

## Tujuan dan entry criteria

Fondasi dan prototipe pertama. Masuk setelah dependency pada tabel ditinjau, owner/reviewer tersedia, sumber/acceptance jelas dan fixture UJI siap. Sumber FR/NFR/55 tes asli tetap SOURCE REQUIRED; bagian yang belum dapat diputuskan tidak diimplementasikan berdasarkan asumsi tersembunyi. Jira key belum diketahui; label S1-xx adalah label rencana saja.

## Rencana pekerjaan dan ownership

| Label rencana | Pekerjaan | Owner usulan | Reviewer | Dependency | Acceptance rencana |
| --- | --- | --- | --- | --- | --- |
| S1-01 | Setup repository, review publish set, branch dan CI repository | DEV-01 | DEV-04 | Permission .git, remote dan identity | Config ditinjau, branch/upstream remote terverifikasi; saat ini BLOCKED untuk Git |
| S1-02 | Vue/Express foundation, PostgreSQL, shared contracts | DEV-01 + DEV-04 | DEV-02 | OD-07 dan baseline schema/kontrak yang ditinjau | Build/lint/typecheck yang dikonfigurasi, API smoke dan DB connection test nyata |
| S1-03 | Authentication dan RBAC | DEV-01 | DEV-02 | S1-02; OD-04/07 | Sesi sah/invalid, permission role/gudang diuji backend |
| S1-04 | Design system dan app shell | DEV-03 | DEV-02 | design.md; kontrak sesi/context | Token sumber, route yang ada, error/loading/empty, component tests |
| S1-05 | Shared import framework dan UC-16 foundation | DEV-01 | DEV-04 | S1-02/03; OD-05 | Staging/validator/preview; invalid input tidak menyimpan domain |
| S1-06 | UC-01 initial vertical slice | DEV-02 | DEV-01 | S1-04/05; kontrak EXPECTED sah | File UJI→validasi→preview→commit→hasil/lineage; integration test |
| S1-07 | UC-09 fondasi impor STOCK | DEV-04 | DEV-01 | Kontrak QTY AKHIR; CF-04 | Adaptor/fixture fondasi; belum klaim feature lengkap |

## Pengujian kontinu

Build checks; lint/typecheck bila script tersedia; API smoke; authentication; RBAC; DB connection/migration; import validation; vertical slice integration.

Owner menulis tes bersama implementasi; reviewer memeriksa expected result terhadap sumber. Simpan command, SHA build/schema, dataset, actual result dan bukti. Jangan menunda semua testing sampai Sprint 3. Tidak ada test PASS/FAIL yang dicatat pada dokumen ini.

## Integrasi dan evaluasi Prototyping

IT-01; record demo/feedback hanya bila dilakukan. PR feature menuju develop; review minimal satu rekan. Kebutuhan/kontrak berubah melalui analisis dampak dan regresi. DEV-01 mengintegrasikan shared boundary; DEV-03 frontend bersama; DEV-04 schema; owner inbound DEV-02. Tidak ada dua perubahan independen pada shared module tanpa koordinasi.

## Exit criteria dan demo

Fondasi berfungsi dan satu vertical slice dapat didemokan dengan bukti. Dokumen dan CI repository-only tidak memenuhi exit aplikasi.

## Risiko dan tindakan

Akses Git/remote, kapasitas empat anggota, sumber final, kontrak cutoff/evidence/identical run dan ketersediaan reviewer dapat menahan jalur kritis. Catat blocker harian dan koordinasikan pekerjaan independen; jangan menambah scope atau menghapus UC. Jika target terancam, buat usulan perubahan jadwal eksplisit; jangan mengubah tanggal pada dokumen ini tanpa keputusan.

## Catatan hasil aktual

| Hal yang dilaporkan | Status |
| --- | --- |
| Versi prototipe / SHA | Belum tersedia |
| Feature selesai | Belum ada bukti implementasi |
| Test aplikasi | NOT RUN |
| Feedback stakeholder | Belum dikumpulkan |
| Defect/retest aktual | Belum tersedia |
| Acceptance sprint | Belum dievaluasi |

Rujukan: [roadmap](../roadmap/SPRINT_ROADMAP.md), [dependency](../roadmap/DEPENDENCY_MATRIX.md), [strategi pengujian](../../docs/implementation/TESTING_STRATEGY.md).
