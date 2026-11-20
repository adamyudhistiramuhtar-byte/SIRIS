-- SRS-49 / proposed-0.1. Nomor kandidat, menunggu review Dwi terhadap PR #15/F-03.
-- Jalankan satu kali lewat ledger migrasi/checksum; jangan menyunting 001–003.
ALTER TABLE import_batches ADD CONSTRAINT uq_srs49_batch_scope UNIQUE (id, warehouse_id, mode);
ALTER TABLE staging_rows ADD CONSTRAINT uq_srs49_row_batch UNIQUE (id, batch_id);

CREATE TABLE audit_events (
    id UUID PRIMARY KEY,
    actor_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT,
    mode VARCHAR(16) CHECK (mode IN ('ACTUAL', 'UJI')),
    batch_id UUID,
    source_row_id UUID,
    action VARCHAR(64) NOT NULL CHECK (action IN (
        'import.stage', 'import.validate', 'import.commit', 'import.cancel',
        'auth.login', 'auth.logout', 'authorization.check', 'reconciliation.create'
    )),
    outcome VARCHAR(16) NOT NULL CHECK (outcome IN ('SUCCESS', 'FAILURE', 'CANCELLED', 'DENIED')),
    correlation_id UUID NOT NULL,
    context_safe JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(context_safe) = 'object'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_srs49_batch_scope FOREIGN KEY (batch_id, warehouse_id, mode)
        REFERENCES import_batches(id, warehouse_id, mode) ON DELETE RESTRICT,
    CONSTRAINT fk_srs49_source_row FOREIGN KEY (source_row_id, batch_id)
        REFERENCES staging_rows(id, batch_id) ON DELETE RESTRICT,
    CONSTRAINT ck_srs49_batch_scope CHECK (batch_id IS NULL OR (warehouse_id IS NOT NULL AND mode IS NOT NULL)),
    CONSTRAINT ck_srs49_row_batch CHECK (source_row_id IS NULL OR batch_id IS NOT NULL)
);

CREATE INDEX ix_srs49_audit_scope_time ON audit_events(warehouse_id, mode, created_at, id);
CREATE INDEX ix_srs49_audit_correlation ON audit_events(correlation_id);

CREATE FUNCTION siris_audit_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Audit bersifat append-only' USING ERRCODE = '42501';
END;
$$;
CREATE TRIGGER srs49_audit_immutable BEFORE UPDATE OR DELETE ON audit_events
    FOR EACH STATEMENT EXECUTE FUNCTION siris_audit_immutable();
