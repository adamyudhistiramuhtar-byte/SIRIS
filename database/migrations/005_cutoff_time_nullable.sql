-- SRS-38/F3-1: kandidat UJI; tanpa backfill dan tanpa keputusan status/precision.
DO $cutoff005$
DECLARE
    relation_id regclass := to_regclass(format('%I.cutoff_contexts', current_schema()));
BEGIN
    IF relation_id IS NULL THEN
        RAISE EXCEPTION 'CUTOFF005_SCHEMA_REQUIRED' USING ERRCODE = 'P0001';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_attribute WHERE attrelid = relation_id
        AND attname = 'cutoff_time' AND NOT attisdropped
        AND format_type(atttypid, atttypmod) = 'time without time zone'
    ) OR NOT EXISTS (
        SELECT 1 FROM pg_attribute WHERE attrelid = relation_id
        AND attname = 'cutoff_date' AND NOT attisdropped
        AND atttypid = 'date'::regtype AND attnotnull
    ) THEN
        RAISE EXCEPTION 'CUTOFF005_SCHEMA_UNKNOWN' USING ERRCODE = 'P0001';
    END IF;
    ALTER TABLE cutoff_contexts ALTER COLUMN cutoff_time DROP NOT NULL;
END;
$cutoff005$;
