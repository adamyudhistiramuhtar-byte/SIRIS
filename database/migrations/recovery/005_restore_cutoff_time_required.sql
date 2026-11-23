-- Pemulihan terkendali. Tidak mengubah/menghapus data atau menebak waktu sumber.
DO $cutoff005_recovery$
BEGIN
    IF EXISTS (SELECT 1 FROM cutoff_contexts WHERE cutoff_time IS NULL) THEN
        RAISE EXCEPTION 'CUTOFF005_RECOVERY_REQUIRES_SOURCE'
            USING ERRCODE = 'P0001';
    END IF;
    ALTER TABLE cutoff_contexts ALTER COLUMN cutoff_time SET NOT NULL;
END;
$cutoff005_recovery$;
