-- ============================================================================
-- SIRIS Migration: 002_reference_masters.sql
-- Issue: SRS-44 (T-10). Status: PROPOSED (DOC-07 v0.2.0 tabel materials dan suppliers).
-- Referensi material dan supplier dipisahkan menurut mode ACTUAL/UJI:
-- kode yang sama boleh ada pada dua mode sebagai baris berbeda, tetapi unik
-- di dalam satu mode. Lookup referensi wajib memakai mode yang sama dengan batch.
-- Tabel ini tidak membuat akun supplier dan tidak membuat master otomatis dari impor.
-- Aman dijalankan ulang (reapply) karena memakai IF NOT EXISTS.
-- ============================================================================

-- 1. Tabel materials (DOC-07 "Tabel materials")
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL CONSTRAINT ck_materials_code_not_blank CHECK (btrim(code) <> ''),
    mode TEXT NOT NULL CONSTRAINT ck_materials_mode CHECK (mode IN ('ACTUAL', 'UJI')),
    name TEXT NOT NULL CONSTRAINT ck_materials_name_not_blank CHECK (btrim(name) <> ''),
    CONSTRAINT uq_materials_mode_code UNIQUE (mode, code)
);

-- 2. Tabel suppliers (DOC-07 "Tabel suppliers")
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL CONSTRAINT ck_suppliers_code_not_blank CHECK (btrim(code) <> ''),
    mode TEXT NOT NULL CONSTRAINT ck_suppliers_mode CHECK (mode IN ('ACTUAL', 'UJI')),
    name TEXT NOT NULL CONSTRAINT ck_suppliers_name_not_blank CHECK (btrim(name) <> ''),
    CONSTRAINT uq_suppliers_mode_code UNIQUE (mode, code)
);
