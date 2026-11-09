# SIRIS

SIRIS adalah website pendamping Erasoft untuk Supplier Inbound Reliability dan Inventory Accuracy & Reconciliation, Capstone Project Kelompok 42. Stack rencana: Vue 3, Node.js/Express.js, PostgreSQL dan REST API. Metode: Prototyping.

## Status repositori

Fondasi monorepo dan publikasi GitHub telah selesai (**DONE**). Seluruh 22 branch (1 main, 1 develop, 16 use case branches, 4 technical branches) telah dibuat, dipush, dan diverifikasi di remote origin.

Implementasi fondasi teknis monorepo (**Task S1-02**) telah selesai pada branch `chore/project-foundation`:
- Root monorepo dengan npm workspaces (`apps/web`, `apps/api`, `packages/contracts`).
- Frontend Vue 3 + Vite + TypeScript + Tailwind CSS (AppShell, routing 17 layar, Context Strip, API client).
- Backend Express.js + TypeScript (modular architecture, correlation ID, standard error handling, health endpoint).
- Shared contracts package (`@siris/contracts`) untuk standard response, pagination, dan domain enums.
- Database foundation PostgreSQL (`database/migrations/`, `database/seeds/`, `database/fixtures/`, connection pool).
- Tooling lengkap: ESLint, Prettier, TypeScript, Vitest test suite (13 unit/component/integration tests).

## Panduan Pengembang

### Prerequisites
- Node.js >= 20.x (Teruji pada Node v24.21.0)
- npm >= 10.x (Teruji pada npm 11.19.0)
- Python 3.9+ (untuk `scripts/check_repository.py`)
- PostgreSQL 14+ (opsional untuk dev lokal; backend mendukung *graceful startup* tanpa DB)

### Instalasi
```sh
npm install
```

### Konfigurasi Environment
Salin template environment ke `.env` lokal:
```sh
cp .env.example .env
```
Sesuaikan `PORT` (default 3001) dan `DATABASE_URL` bila PostgreSQL lokal tersedia.

### Perintah Pengembangan (Development)
```sh
# Menjalankan frontend web (Vite dev server pada http://localhost:5173)
npm run dev

# Menjalankan backend API (tsx watch pada http://localhost:3001)
npm run dev:api
```

### Perintah Build & Typecheck
```sh
# Build seluruh workspace (contracts -> api -> web)
npm run build

# Typecheck TypeScript seluruh workspace
npm run typecheck

# Lint kode JavaScript / TypeScript / Vue
npm run lint
```

### Perintah Pengujian (Testing)
```sh
# Menjalankan seluruh test suite (unit + component + integration)
npm run test

# Menjalankan verifikasi kepatuhan repositori
npm run check:repo
```

## Struktur Monorepo

```text
SIRIS/
├── apps/
│   ├── web/               # Frontend Vue 3 + Vite + TypeScript + Tailwind CSS
│   └── api/               # Backend Express.js + TypeScript REST API
├── packages/
│   └── contracts/         # Shared TypeScript DTOs, response contracts, dan domain enums
├── database/
│   ├── migrations/        # Skrip DDL PostgreSQL (001_initial_schema.sql)
│   ├── seeds/             # Skrip data uji sintetis berlabel UJI (001_initial_seed.sql)
│   ├── fixtures/          # Dataset uji sintetis JSON untuk pengujian otomatis
│   └── README.md          # Panduan database & strategi migrasi
├── tests/
│   └── integration/       # Pengujian integrasi API & database
├── development-docs/      # 19 dokumen spesifikasi sistem (SRS, PRD, Arsitektur, dll.)
├── planning/              # Roadmap sprint (Sprint 1–3) dan laporan development readiness
├── docs/                  # Panduan implementasi teknis (Git workflow, testing, review)
├── scripts/               # Script pemeriksaan repositori dan registry branch
├── .github/               # GitHub Actions CI workflow dan pull request template
├── package.json           # Root npm workspaces configuration
└── README.md
```

## Batasan & Catatan Teknis (Known Limitations)

- **Database Connection**: Jika PostgreSQL belum dikonfigurasi, pengujian database dilaporkan sebagai `NOT RUN / BLOCKED`, bukan PASS. Server API tetap dapat melayani endpoint `/health`.
- **Ruang Lingkup S1-02**: Task ini mengimplementasikan fondasi teknis monorepo dan arsitektur aplikasi; logika bisnis per use case (autentikasi S1-03, import framework S1-05, slice UC-01 S1-06, stock UC-09 S1-07) akan dikerjakan pada branch fitur masing-masing.
- **Pemisahan Data**: Seluruh data simulasi berlabel **UJI**; tidak ada data riil mitra operasional di dalam repositori.

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
