# SIRIS

SIRIS adalah website pendamping Erasoft untuk Warehouse PT Harina Chemicals Industry, dikembangkan oleh Capstone Project Kelompok 42 menggunakan metode Prototyping. Stack proyek mencakup Vue 3, Node.js/Express.js, PostgreSQL dan REST API.

## Dokumentasi dan status

- [Indeks dokumentasi pengembangan](development-docs/00_MASTER_DOCUMENTATION_INDEX.md) menjelaskan kebutuhan, rancangan, keterlacakan dan gap sumber.
- [Pemeriksaan fondasi dan status SRS-41](development-docs/STATUS_FONDASI_SRS-41.md) memuat bukti Git, CI, pengujian, keterbatasan keamanan dan blocker integrasi.
- [Panduan kontribusi](CONTRIBUTING.md), [workflow Git](docs/implementation/GIT_WORKFLOW.md), dan [rencana Sprint 1](planning/sprints/SPRINT_01.md) menjelaskan cara berkolaborasi.
- [Panduan database](database/README.md) menjelaskan migrasi dan fixture UJI; runtime PostgreSQL harus diverifikasi pada lingkungan yang tersedia.

Scaffold aplikasi tersedia pada `main`; integrasi ke `develop` diajukan melalui [draft PR #4](https://github.com/adamyudhistiramuhtar-byte/SIRIS/pull/4) dan belum menjadi bukti bahwa SRS-41 selesai. Sumber final 29 FR, 14 NFR dan 55 spesifikasi pengujian masih diperlukan. Data simulasi diberi label **UJI** dan tidak menjadi bukti data operasional mitra.
