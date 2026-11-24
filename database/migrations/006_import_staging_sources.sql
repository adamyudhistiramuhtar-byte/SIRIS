-- SRS-50 kandidat UJI. Reservasi 005 untuk F3-1/SRS-38; tidak bergantung pada
-- nullable cutoff_time. Jangan mengubah 001–004 yang telah diuji/dijalankan.
-- Kolom tambahan nullable menjaga baris legacy; jangan mengarang lineage lama.
DO $srs50$
DECLARE
    existing boolean := to_regclass(format('%I.import_source_files',current_schema())) IS NOT NULL;
    signature text;
    fingerprint text;
BEGIN
    LOCK TABLE import_batches, staging_rows IN ACCESS EXCLUSIVE MODE;
    IF NOT existing THEN
        ALTER TABLE import_batches
            ADD COLUMN contract_version VARCHAR(64),
            ADD COLUMN source_hash VARCHAR(64) CHECK (source_hash ~ '^[0-9a-f]{64}$'),
            ADD COLUMN source_reference VARCHAR(128),
            ADD COLUMN source_timezone VARCHAR(64),
            ADD COLUMN cutoff_id UUID REFERENCES cutoff_contexts(id) ON DELETE RESTRICT;
        ALTER TABLE staging_rows
            ADD COLUMN component VARCHAR(32),
            ADD COLUMN normalized_payload JSONB CHECK (jsonb_typeof(normalized_payload)='object'),
            ADD CONSTRAINT uq_srs50_source_row UNIQUE (batch_id,component,row_number),
            ADD CONSTRAINT ck_srs50_source_row CHECK (component IS NULL OR row_number > 0);
        CREATE TABLE import_source_files (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE RESTRICT,
            component VARCHAR(32) NOT NULL,
            storage_key VARCHAR(36) NOT NULL UNIQUE,
            source_hash VARCHAR(64) NOT NULL CHECK (source_hash ~ '^[0-9a-f]{64}$'),
            size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
            CONSTRAINT uq_srs50_source_component UNIQUE (batch_id,component)
        );
    END IF;
    SELECT jsonb_build_object(
        'columns', (SELECT jsonb_agg(jsonb_build_array(r.relname,a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,pg_get_expr(d.adbin,d.adrelid)) ORDER BY r.relname,a.attnum)
            FROM pg_attribute a JOIN pg_class r ON r.oid=a.attrelid
            LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
            WHERE a.attnum>0 AND NOT a.attisdropped AND (
                r.oid='import_source_files'::regclass OR
                (r.oid='import_batches'::regclass AND a.attname IN ('contract_version','source_hash','source_reference','source_timezone','cutoff_id')) OR
                (r.oid='staging_rows'::regclass AND a.attname IN ('component','normalized_payload')))),
        'constraints', (SELECT jsonb_agg(jsonb_build_array(r.relname,c.conname,c.convalidated,pg_get_constraintdef(c.oid)) ORDER BY r.relname,c.conname)
            FROM pg_constraint c JOIN pg_class r ON r.oid=c.conrelid
            WHERE r.oid='import_source_files'::regclass OR
                (r.oid='import_batches'::regclass AND c.conname IN ('import_batches_source_hash_check','import_batches_cutoff_id_fkey')) OR
                (r.oid='staging_rows'::regclass AND c.conname IN ('staging_rows_normalized_payload_check','uq_srs50_source_row','ck_srs50_source_row')))
    )::text INTO signature;
    fingerprint := 'SRS-50/uji-fixture-0.1:' || encode(sha256(convert_to(signature,'UTF8')),'hex');
    IF existing THEN
        IF obj_description('import_source_files'::regclass,'pg_class') IS DISTINCT FROM fingerprint THEN
            RAISE EXCEPTION 'SRS50_STAGING_SCHEMA_DRIFT' USING ERRCODE='P0001';
        END IF;
    ELSE
        EXECUTE format('COMMENT ON TABLE import_source_files IS %L',fingerprint);
    END IF;
END;
$srs50$;
