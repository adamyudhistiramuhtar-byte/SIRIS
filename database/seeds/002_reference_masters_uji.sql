-- ============================================================================
-- SIRIS Test Seed: 002_reference_masters_uji.sql
-- Issue: SRS-44. PERINGATAN: seluruh baris adalah DATA UJI SINTETIS (mode = 'UJI').
-- Kode selaras dengan fixture kontrak SRS-37 (database/fixtures/uji/, PR #13).
-- DILARANG memasukkan data material/supplier aktual mitra ke berkas ini.
-- Aman dijalankan ulang karena memakai ON CONFLICT DO NOTHING.
-- ============================================================================

INSERT INTO materials (id, code, mode, name)
VALUES
    ('20000000-0000-4000-8000-000000000001', 'UJI-MAT-01', 'UJI', 'Material Simulasi 01 (UJI)'),
    ('20000000-0000-4000-8000-000000000002', 'UJI-MAT-02', 'UJI', 'Material Simulasi 02 (UJI)'),
    ('20000000-0000-4000-8000-000000000003', 'UJI-MAT-03', 'UJI', 'Material Simulasi 03 (UJI)')
ON CONFLICT (mode, code) DO NOTHING;

INSERT INTO suppliers (id, code, mode, name)
VALUES
    ('30000000-0000-4000-8000-000000000001', 'UJI-SUP-01', 'UJI', 'Supplier Simulasi 01 (UJI)'),
    ('30000000-0000-4000-8000-000000000002', 'UJI-SUP-02', 'UJI', 'Supplier Simulasi 02 (UJI)')
ON CONFLICT (mode, code) DO NOTHING;
