-- ============================================================================
-- SIRIS Migration: 003_import_batches_kind.sql
-- Issue: SRS-44. Keputusan F-01 (Adam, 12 Nov 2026): nama jenis impor mengikuti
-- DOC-07/08/09 -> kolom kind dengan nilai EXPECTED, COMMITMENT, RECEIVING, STOCK, COUNT.
--
-- Migrasi 001 tidak diubah karena mungkin sudah dijalankan di lingkungan lain.
-- Migrasi ini meng-upgrade tabel import_batches secara aman:
--   * Kondisi lama (import_type, tanpa kind)  -> upgrade, data dan FK dipertahankan.
--   * Kondisi sudah ter-upgrade (kind saja)   -> diverifikasi, tidak ada perubahan.
--   * Kondisi lain/parsial/tidak dikenal       -> gagal (fail-closed), tidak ada perubahan.
-- Pemetaan nilai: INBOUND_REFERENCE -> EXPECTED, SUPPLIER_COMMITMENT -> COMMITMENT,
-- PHYSICAL_COUNT -> COUNT; RECEIVING dan STOCK tetap.
-- Seluruh isi berada dalam satu blok DO sehingga berjalan atomik: bila satu
-- langkah gagal, seluruh perubahan dibatalkan. Tabel tidak di-drop.
-- ============================================================================

DO $migration$
DECLARE
    v_table regclass := to_regclass('import_batches');
    v_has_old boolean;
    v_has_kind boolean;
    v_old_checks text[];
    v_kind_checks integer;
    v_unknown bigint;
    v_before jsonb;
    v_after jsonb;
BEGIN
    IF v_table IS NULL THEN
        RAISE EXCEPTION 'SRS-44/003: tabel import_batches tidak ditemukan; jalankan migrasi 001 terlebih dahulu.';
    END IF;

    -- Cegah perubahan bersamaan selama pemeriksaan dan upgrade.
    LOCK TABLE import_batches IN ACCESS EXCLUSIVE MODE;

    SELECT
        bool_or(attname = 'import_type'),
        bool_or(attname = 'kind')
    INTO v_has_old, v_has_kind
    FROM pg_attribute
    WHERE attrelid = v_table AND attnum > 0 AND NOT attisdropped;

    v_has_old := coalesce(v_has_old, false);
    v_has_kind := coalesce(v_has_kind, false);

    -- ---------------------------------------------------------------- sudah ter-upgrade
    IF v_has_kind AND NOT v_has_old THEN
        SELECT count(*) INTO v_unknown
        FROM import_batches
        WHERE kind NOT IN ('EXPECTED', 'COMMITMENT', 'RECEIVING', 'STOCK', 'COUNT');

        SELECT count(*) INTO v_kind_checks
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
        WHERE c.conrelid = v_table AND c.contype = 'c' AND a.attname = 'kind';

        IF v_unknown > 0 OR v_kind_checks <> 1 THEN
            RAISE EXCEPTION 'SRS-44/003: kolom kind ada tetapi kondisinya tidak dikenal (nilai di luar kontrak: %, jumlah CHECK pada kind: %); periksa manual.',
                v_unknown, v_kind_checks;
        END IF;

        RAISE NOTICE 'SRS-44/003: import_batches sudah memakai kind; tidak ada perubahan.';
        RETURN;
    END IF;

    -- ---------------------------------------------------------------- kondisi tidak dikenal
    IF NOT (v_has_old AND NOT v_has_kind) THEN
        RAISE EXCEPTION 'SRS-44/003: kondisi import_batches tidak dikenal (import_type=%, kind=%); upgrade dihentikan tanpa perubahan.',
            v_has_old, v_has_kind;
    END IF;

    -- ---------------------------------------------------------------- upgrade dari versi lama
    SELECT count(*) INTO v_unknown
    FROM import_batches
    WHERE import_type NOT IN ('INBOUND_REFERENCE', 'SUPPLIER_COMMITMENT', 'RECEIVING', 'STOCK', 'PHYSICAL_COUNT');

    IF v_unknown > 0 THEN
        RAISE EXCEPTION 'SRS-44/003: % baris import_type bernilai tidak dikenal; upgrade dihentikan tanpa perubahan.', v_unknown;
    END IF;

    SELECT coalesce(array_agg(c.conname ORDER BY c.conname), ARRAY[]::text[]) INTO v_old_checks
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = v_table AND c.contype = 'c' AND a.attname = 'import_type';

    IF cardinality(v_old_checks) <> 1 THEN
        RAISE EXCEPTION 'SRS-44/003: diharapkan tepat satu CHECK pada import_type, ditemukan %; upgrade dihentikan tanpa perubahan.',
            cardinality(v_old_checks);
    END IF;

    -- Inventarisasi sebelum perubahan (jumlah baris per nilai lama).
    SELECT coalesce(jsonb_object_agg(import_type, total), '{}'::jsonb) INTO v_before
    FROM (SELECT import_type, count(*) AS total FROM import_batches GROUP BY import_type) s;
    RAISE NOTICE 'SRS-44/003: inventaris sebelum upgrade: %', v_before;

    EXECUTE format('ALTER TABLE import_batches DROP CONSTRAINT %I', v_old_checks[1]);
    ALTER TABLE import_batches RENAME COLUMN import_type TO kind;

    UPDATE import_batches
    SET kind = CASE kind
        WHEN 'INBOUND_REFERENCE' THEN 'EXPECTED'
        WHEN 'SUPPLIER_COMMITMENT' THEN 'COMMITMENT'
        WHEN 'PHYSICAL_COUNT' THEN 'COUNT'
        ELSE kind
    END
    WHERE kind IN ('INBOUND_REFERENCE', 'SUPPLIER_COMMITMENT', 'PHYSICAL_COUNT');

    ALTER TABLE import_batches
        ADD CONSTRAINT ck_import_batches_kind
        CHECK (kind IN ('EXPECTED', 'COMMITMENT', 'RECEIVING', 'STOCK', 'COUNT'));

    -- Verifikasi: jumlah baris per jenis sama dengan sebelum upgrade setelah pemetaan.
    SELECT coalesce(jsonb_object_agg(kind, total), '{}'::jsonb) INTO v_after
    FROM (SELECT kind, count(*) AS total FROM import_batches GROUP BY kind) s;

    IF v_after <> (
        SELECT coalesce(jsonb_object_agg(mapped, total), '{}'::jsonb)
        FROM (
            SELECT CASE key
                       WHEN 'INBOUND_REFERENCE' THEN 'EXPECTED'
                       WHEN 'SUPPLIER_COMMITMENT' THEN 'COMMITMENT'
                       WHEN 'PHYSICAL_COUNT' THEN 'COUNT'
                       ELSE key
                   END AS mapped,
                   value::bigint AS total
            FROM jsonb_each_text(v_before)
        ) m
    ) THEN
        RAISE EXCEPTION 'SRS-44/003: verifikasi jumlah gagal (sebelum %, sesudah %); seluruh perubahan dibatalkan.', v_before, v_after;
    END IF;

    RAISE NOTICE 'SRS-44/003: upgrade selesai; inventaris sesudah upgrade: %', v_after;
END
$migration$;
