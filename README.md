# SIRIS

SIRIS adalah website pendamping Erasoft untuk Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation, Capstone Project Kelompok 42. Stack rencana: Vue 3, Node.js/Express.js, PostgreSQL dan REST API. Metode: Prototyping.

## Status repositori

Dokumentasi dan fondasi kolaborasi tersedia; aplikasi belum diinisialisasi. Tidak ada klaim build, pengujian bisnis, UAT, atau deployment telah berhasil. Publikasi GitHub dan branch masih **BLOCKED** pada sesi setup; lihat [laporan readiness](planning/roadmap/DEVELOPMENT_READINESS.md).

Target repository: [adamyudhistiramuhtar-byte/SIRIS](https://github.com/adamyudhistiramuhtar-byte/SIRIS). Keberadaan, visibilitas, default branch dan histori remote belum terverifikasi.

## Mulai bekerja

1. Baca [AGENTS.md](AGENTS.md), [kontrak desain](design.md), dan [indeks 19 dokumen](development-docs/00_MASTER_DOCUMENTATION_INDEX.md).
2. Baca [aturan kontribusi](CONTRIBUTING.md), [workflow Git](docs/implementation/GIT_WORKFLOW.md), dan [roadmap](planning/roadmap/SPRINT_ROADMAP.md).
3. Jalankan pemeriksaan lokal yang tersedia:

```sh
python3 scripts/check_repository.py --workspace
```

Perintah tersebut memeriksa dokumentasi, registry branch dan pola berkas berisiko; bukan pengujian aplikasi. Belum ada `package.json`, dependency aplikasi, `npm test`, build atau server lokal yang tersedia. [Arsitektur repositori](docs/implementation/REPOSITORY_ARCHITECTURE.md) menjelaskan struktur yang akan dibuat pada pekerjaan fondasi berikutnya.

## Batas dan jadwal

Pertahankan 16 UC; 29 FR, 14 NFR dan 55 test case asli masih memerlukan register sumber final. Tidak ada writeback Erasoft, OCR, stock adjustment otomatis, supplier portal atau modul ERP baru. ACTUAL dan UJI dipisahkan.

Tiga sprint: **9–15, 16–22, dan 23–29 November 2026**, Asia/Jakarta. Target release candidate ditinjau pada **29 November 2026**, termasuk integrasi dan pengujian. Semua kegiatan sprint yang belum mempunyai bukti tetap NOT STARTED/NOT RUN.

## Navigasi

- [Dependency matrix](planning/roadmap/DEPENDENCY_MATRIX.md)
- [Strategi pengujian dan CI](docs/implementation/TESTING_STRATEGY.md)
- [Review publikasi dan keamanan](docs/implementation/PUBLISH_REVIEW.md)
- [Registry 20 branch](scripts/branches.json)

ZIP dokumentasi tetap tersedia lokal tetapi diabaikan Git. Markdown adalah sumber yang direncanakan untuk version control; tautan ZIP pada indeks lama dapat tidak tersedia dalam clone GitHub. Dokumen asal dipertahankan tanpa perubahan.
