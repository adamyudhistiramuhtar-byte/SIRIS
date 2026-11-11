-- ============================================================================
-- SIRIS Database Baseline Migration: 001_initial_schema.sql
-- Status: PROPOSED (Berdasarkan DOC-07 Desain Database v0.2.0)
-- Seluruh data yang dimasukkan melalui skema ini adalah data berlabel UJI.
-- ============================================================================

-- Ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel users (DOC-07 §6)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('PURCHASING', 'WAREHOUSE', 'PRODUCTION', 'MANAGEMENT')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel warehouses (DOC-07 §7)
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel user_warehouses (DOC-07 §8)
CREATE TABLE IF NOT EXISTS user_warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_warehouse UNIQUE (user_id, warehouse_id)
);

-- 4. Tabel cutoff_contexts (DOC-07 §11)
CREATE TABLE IF NOT EXISTS cutoff_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    cutoff_date DATE NOT NULL,
    cutoff_time TIME NOT NULL,
    mode VARCHAR(16) NOT NULL CHECK (mode IN ('ACTUAL', 'UJI')),
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel import_batches (DOC-07 §12)
CREATE TABLE IF NOT EXISTS import_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    import_type VARCHAR(32) NOT NULL CHECK (import_type IN ('INBOUND_REFERENCE', 'SUPPLIER_COMMITMENT', 'RECEIVING', 'STOCK', 'PHYSICAL_COUNT')),
    mode VARCHAR(16) NOT NULL CHECK (mode IN ('ACTUAL', 'UJI')),
    status VARCHAR(32) NOT NULL DEFAULT 'STAGED' CHECK (status IN ('STAGED', 'VALIDATED', 'COMMITTED', 'CANCELLED')),
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    row_count INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(id),
    preview_fingerprint VARCHAR(64),
    preview_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel staging_rows (DOC-07 §13)
CREATE TABLE IF NOT EXISTS staging_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    raw_payload JSONB NOT NULL,
    validation_status VARCHAR(16) NOT NULL DEFAULT 'PENDING' CHECK (validation_status IN ('PENDING', 'VALID', 'INVALID')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel validation_issues (DOC-07 §14)
CREATE TABLE IF NOT EXISTS validation_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
    staging_row_id UUID REFERENCES staging_rows(id) ON DELETE CASCADE,
    severity VARCHAR(16) NOT NULL CHECK (severity IN ('ERROR', 'WARNING')),
    code VARCHAR(64) NOT NULL,
    field_name VARCHAR(64),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabel idempotency_records (DOC-07 §15)
CREATE TABLE IF NOT EXISTS idempotency_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    actor_id UUID REFERENCES users(id),
    action_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    response_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL
);
