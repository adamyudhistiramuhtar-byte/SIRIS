-- Forward-only: 004 tetap utuh agar checksum ledger mesin tim tidak berubah.
-- Pemilik tetap dipercaya untuk DDL; trigger mencegah mutasi/truncate tidak sengaja.
DO $audit007$
DECLARE signature text; fingerprint text;
BEGIN
    IF to_regclass(format('%I.audit_events',current_schema())) IS NULL THEN
        RAISE EXCEPTION 'AUDIT007_REQUIRES004' USING ERRCODE='P0001';
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
    IF obj_description('audit_events'::regclass,'pg_class') IS DISTINCT FROM fingerprint THEN
        RAISE EXCEPTION 'SRS49_AUDIT_SCHEMA_DRIFT' USING ERRCODE='P0001';
    END IF;
    CREATE OR REPLACE TRIGGER srs49_audit_immutable
        BEFORE UPDATE OR DELETE OR TRUNCATE ON audit_events
        FOR EACH STATEMENT EXECUTE FUNCTION siris_audit_immutable();
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
    EXECUTE format('COMMENT ON TABLE audit_events IS %L',fingerprint);
END;
$audit007$;
