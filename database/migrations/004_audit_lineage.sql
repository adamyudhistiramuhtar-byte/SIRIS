-- SRS-49 / proposed-0.1. Nomor kandidat, menunggu review Dwi terhadap PR #15/F-03.
-- Reapply memverifikasi fingerprint schema; drift ditolak. Jangan menyunting 001–003.
DO $srs49$
DECLARE
    existing boolean := to_regclass(format('%I.audit_events',current_schema())) IS NOT NULL;
    signature text;
    fingerprint text;
BEGIN
    IF NOT existing THEN
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
    END IF;

    SELECT jsonb_build_object(
      'columns', (SELECT jsonb_agg(jsonb_build_array(a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum)
        FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
        WHERE a.attrelid='audit_events'::regclass AND a.attnum>0 AND NOT a.attisdropped),
      'constraints', (SELECT jsonb_agg(jsonb_build_array(r.relname,c.conname,c.contype,c.convalidated,pg_get_constraintdef(c.oid)) ORDER BY r.relname,c.conname)
        FROM pg_constraint c JOIN pg_class r ON r.oid=c.conrelid
        WHERE c.conrelid='audit_events'::regclass OR
          (c.conrelid IN ('import_batches'::regclass,'staging_rows'::regclass) AND c.conname IN ('uq_srs49_batch_scope','uq_srs49_row_batch'))),
      'indexes', (SELECT jsonb_agg(jsonb_build_array(indexname,indexdef) ORDER BY indexname)
        FROM pg_indexes WHERE schemaname=current_schema() AND tablename='audit_events'),
      'triggers', (SELECT jsonb_agg(pg_get_triggerdef(oid) ORDER BY tgname) FROM pg_trigger WHERE tgrelid='audit_events'::regclass AND NOT tgisinternal),
      'function', pg_get_functiondef(to_regprocedure(format('%I.siris_audit_immutable()',current_schema())))
    )::text INTO signature;
    fingerprint := 'SRS-49/proposed-0.1:' || encode(sha256(convert_to(signature,'UTF8')),'hex');
    IF existing THEN
        IF obj_description('audit_events'::regclass,'pg_class') IS DISTINCT FROM fingerprint THEN
            RAISE EXCEPTION 'SRS49_AUDIT_SCHEMA_DRIFT' USING ERRCODE='P0001';
        END IF;
    ELSE
        EXECUTE format('COMMENT ON TABLE audit_events IS %L',fingerprint);
    END IF;
END;
$srs49$;
