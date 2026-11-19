-- ============================================================================
-- SIRIS Database Test Seed: 001_initial_seed.sql
-- PERINGATAN: Seluruh data pada file ini adalah DATA UJI SINTETIS untuk keperluan pengujian.
-- DILARANG memasukkan data operasional aktual mitra ke dalam berkas seed ini.
-- ============================================================================

-- Seed Gudang UJI
INSERT INTO warehouses (id, code, name, description, is_active)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'WH-01', 'Gudang Bahan Baku (UJI)', 'Gudang penyimpanan material utama untuk simulasi', TRUE),
    ('00000000-0000-0000-0000-000000000002', 'WH-02', 'Gudang Kemasan (UJI)', 'Gudang penyimpanan packaging untuk simulasi', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Seed Pengguna UJI (Password hash dummy untuk simulasi testing fondasi)
INSERT INTO users (id, username, password_hash, full_name, role, is_active)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'yudha', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Yudha (Purchasing UJI)', 'PURCHASING', TRUE),
    ('10000000-0000-0000-0000-000000000002', 'warehouse_user', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Staf Gudang (UJI)', 'WAREHOUSE', TRUE),
    ('10000000-0000-0000-0000-000000000003', 'mgmt_user', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Manajemen (UJI)', 'MANAGEMENT', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Relasi Pengguna - Gudang UJI
INSERT INTO user_warehouses (user_id, warehouse_id)
VALUES
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (user_id, warehouse_id) DO NOTHING;
