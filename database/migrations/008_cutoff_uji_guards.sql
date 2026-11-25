-- D-02 terbatas UJI: OPEN legacy adalah label simulasi, bukan verifikasi ACTUAL.
-- Tidak mengisi jam, tidak mengubah waktu/status ACTUAL, dan tidak menyunting005.
DO $cutoff008$
BEGIN
    LOCK TABLE cutoff_contexts IN ACCESS EXCLUSIVE MODE;
    IF EXISTS (SELECT 1 FROM cutoff_contexts WHERE mode='ACTUAL' AND cutoff_time IS NULL) THEN
        RAISE EXCEPTION 'CUTOFF008_ACTUAL_TIME_SOURCE_REQUIRED' USING ERRCODE='P0001';
    END IF;
    IF EXISTS (SELECT 1 FROM cutoff_contexts WHERE mode='UJI' AND status NOT IN ('OPEN','SIMULATED')) THEN
        RAISE EXCEPTION 'CUTOFF008_UJI_STATUS_REVIEW_REQUIRED' USING ERRCODE='P0001';
    END IF;
    UPDATE cutoff_contexts SET status='SIMULATED' WHERE mode='UJI' AND status='OPEN';
    ALTER TABLE cutoff_contexts DROP CONSTRAINT IF EXISTS ck_srs38_uji_simulated;
    ALTER TABLE cutoff_contexts ADD CONSTRAINT ck_srs38_uji_simulated CHECK (mode<>'UJI' OR status='SIMULATED');
    ALTER TABLE cutoff_contexts DROP CONSTRAINT IF EXISTS ck_srs38_actual_time_present;
    ALTER TABLE cutoff_contexts ADD CONSTRAINT ck_srs38_actual_time_present CHECK (mode='UJI' OR cutoff_time IS NOT NULL);
END;
$cutoff008$;
