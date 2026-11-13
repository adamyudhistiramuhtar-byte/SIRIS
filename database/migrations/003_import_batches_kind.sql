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
--
-- Kondisi lama atau sudah ter-upgrade hanya diterima bila bentuk kolomnya persis
-- dikenal: tipe VARCHAR(32), NOT NULL, dan tepat satu CHECK yang menyebut kolom itu.
-- CHECK tersebut harus hanya menyebut kolom itu (bukan CHECK gabungan), sudah
-- tervalidasi, dan definisinya sama dengan CHECK acuan. Definisi acuan dibuat dari
-- tabel sementara (pg_temp) pada server yang sama, sehingga format
-- pg_get_constraintdef tidak bergantung pada versi PostgreSQL. Bentuk lain
-- dihentikan tanpa perubahan; constraint lain pada tabel tidak disentuh.
--
-- Seluruh isi berada dalam satu blok DO sehingga berjalan atomik: bila satu
-- langkah gagal, seluruh perubahan dibatalkan. Tabel tidak di-drop.
-- ============================================================================

DO $migration$
DECLARE
    v_table regclass := to_regclass('import_batches');
    v_reference regclass;
    v_has_old boolean;
    v_has_kind boolean;
    v_column text;
    v_column_ok boolean;
    v_checks bigint;
    v_checks_ok boolean;
    v_check_name text;
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

    -- ---------------------------------------------------------------- kondisi tidak dikenal
    -- Kedua kolom ada (parsial) atau keduanya tidak ada.
    IF v_has_old = v_has_kind THEN
        RAISE EXCEPTION 'SRS-44/003: kondisi import_batches tidak dikenal (import_type=%, kind=%); upgrade dihentikan tanpa perubahan.',
            v_has_old, v_has_kind;
    END IF;

    v_column := CASE WHEN v_has_kind THEN 'kind' ELSE 'import_type' END;

    -- ---------------------------------------------------------------- validasi bentuk kolom
    -- Acuan: definisi kolom lama (001) dan kolom baru (003) yang dikenal.
    CREATE TEMP TABLE srs44_003_reference (
        import_type VARCHAR(32) NOT NULL
            CHECK (import_type IN ('INBOUND_REFERENCE', 'SUPPLIER_COMMITMENT', 'RECEIVING', 'STOCK', 'PHYSICAL_COUNT')),
        kind VARCHAR(32) NOT NULL
            CHECK (kind IN ('EXPECTED', 'COMMITMENT', 'RECEIVING', 'STOCK', 'COUNT'))
    );
    v_reference := to_regclass('pg_temp.srs44_003_reference');

    WITH ref_col AS (
        SELECT attnum, atttypid, atttypmod
        FROM pg_attribute
        WHERE attrelid = v_reference AND attname = v_column
    ),
    act_col AS (
        SELECT attnum, atttypid, atttypmod, attnotnull
        FROM pg_attribute
        WHERE attrelid = v_table AND attname = v_column AND NOT attisdropped
    ),
    ref_check AS (
        SELECT pg_get_constraintdef(c.oid) AS def
        FROM pg_constraint c, ref_col r
        WHERE c.conrelid = v_reference AND c.contype = 'c' AND c.conkey = ARRAY[r.attnum]
    ),
    act_checks AS (
        SELECT c.conname, c.conkey, c.convalidated, pg_get_constraintdef(c.oid) AS def
        FROM pg_constraint c, act_col a
        WHERE c.conrelid = v_table AND c.contype = 'c' AND a.attnum = ANY (c.conkey)
    )
    SELECT
        (SELECT a.atttypid = r.atttypid AND a.atttypmod = r.atttypmod AND a.attnotnull
         FROM act_col a, ref_col r),
        (SELECT count(*) FROM act_checks),
        (SELECT bool_and(ac.conkey = ARRAY[a.attnum]
                         AND ac.convalidated
                         AND ac.def = (SELECT def FROM ref_check))
         FROM act_checks ac, act_col a),
        (SELECT min(conname) FROM act_checks)
    INTO v_column_ok, v_checks, v_checks_ok, v_check_name;

    DROP TABLE pg_temp.srs44_003_reference;

    IF NOT coalesce(v_column_ok, false) THEN
        RAISE EXCEPTION 'SRS-44/003: kolom % bukan VARCHAR(32) NOT NULL seperti yang dikenal; upgrade dihentikan tanpa perubahan.',
            v_column;
    END IF;

    IF v_checks <> 1 OR NOT coalesce(v_checks_ok, false) THEN
        RAISE EXCEPTION 'SRS-44/003: CHECK pada kolom % tidak dikenal (jumlah: %; harus tepat satu, hanya menyebut kolom ini, tervalidasi, dan sesuai definisi acuan); upgrade dihentikan tanpa perubahan.',
            v_column, v_checks;
    END IF;

    -- ---------------------------------------------------------------- sudah ter-upgrade
    IF v_has_kind THEN
        RAISE NOTICE 'SRS-44/003: import_batches sudah memakai kind dengan bentuk yang dikenal; tidak ada perubahan.';
        RETURN;
    END IF;

    -- ---------------------------------------------------------------- upgrade dari versi lama
    -- Lapisan pengaman tambahan; CHECK tervalidasi seharusnya sudah menjamin ini.
    SELECT count(*) INTO v_unknown
    FROM import_batches
    WHERE import_type NOT IN ('INBOUND_REFERENCE', 'SUPPLIER_COMMITMENT', 'RECEIVING', 'STOCK', 'PHYSICAL_COUNT');

    IF v_unknown > 0 THEN
        RAISE EXCEPTION 'SRS-44/003: % baris import_type bernilai tidak dikenal; upgrade dihentikan tanpa perubahan.', v_unknown;
    END IF;

    -- Inventarisasi sebelum perubahan (jumlah baris per nilai lama).
    SELECT coalesce(jsonb_object_agg(import_type, total), '{}'::jsonb) INTO v_before
    FROM (SELECT import_type, count(*) AS total FROM import_batches GROUP BY import_type) s;
    RAISE NOTICE 'SRS-44/003: inventaris sebelum upgrade: %', v_before;

    -- Hanya CHECK lama yang sudah diverifikasi persis yang di-drop.
    EXECUTE format('ALTER TABLE import_batches DROP CONSTRAINT %I', v_check_name);
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
