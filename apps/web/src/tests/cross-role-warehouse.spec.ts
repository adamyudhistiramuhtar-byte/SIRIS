import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { router } from '../router/index';
import { FORBIDDEN_ROUTE_NAME } from '../router/access-guard';
import { canViewPage, isViewOnlyPage, USER_ROLES } from '../shared/access/access-matrix';
import {
  createSessionStore,
  DEFAULT_UJI_CONTEXT,
  sessionStore,
  type SessionContext,
} from '../shared/session/session-context';

// SRS-63 (sisi klien): uji izin lintas role dan lintas gudang pada modul inti.
// Acuan diambil dari dokumen baseline SRS-36 §6.2 dan §8.3, dibaca langsung dari berkas,
// bukan disalin, agar penyimpangan kode terhadap dokumen terdeteksi.
// Batas: penyaringan klien bukan kontrol keamanan. Otorisasi backend (SRS-47/48) tidak
// diuji di sini dan berstatus NOT RUN.

const doc = readFileSync(
  resolve(__dirname, '../../../../development-docs/MATRIK_PERMUTASI_SRS-36.md'),
  'utf8',
);

type Role = (typeof USER_ROLES)[number];
const ROLE_COLUMNS: Role[] = ['PURCHASING', 'WAREHOUSE', 'PRODUCTION', 'MANAGEMENT'];

interface Cell {
  allowed: boolean;
  viewOnly: boolean;
}
function parseMatrix(): Map<string, Record<Role, Cell>> {
  const start = doc.indexOf('### 6.2');
  const end = doc.indexOf('### 6.3');
  const rows = doc
    .slice(start, end)
    .split('\n')
    .filter((line) => /^\| UC-\d{2} \|/.test(line));
  const matrix = new Map<string, Record<Role, Cell>>();
  for (const row of rows) {
    const cols = row.split('|').map((c) => c.trim());
    const uc = cols[1];
    const cells = {} as Record<Role, Cell>;
    ROLE_COLUMNS.forEach((role, i) => {
      const value = cols[3 + i];
      cells[role] = { allowed: value.startsWith('A'), viewOnly: value.includes('view saja') };
    });
    matrix.set(uc, cells);
  }
  return matrix;
}

const MATRIX = parseMatrix();
const PAGE_UCS = [...MATRIX.keys()].filter((uc) => uc !== 'UC-16');

const WH1 = { id: 'WH-01', code: 'WH-01', name: 'Gudang Bahan Baku' };
const WH2 = { id: 'WH-02', code: 'WH-02', name: 'Gudang Barang Jadi' };
function account(overrides: Partial<SessionContext>): SessionContext {
  return { ...DEFAULT_UJI_CONTEXT, ...overrides };
}

afterEach(() => {
  sessionStore.setAccount(DEFAULT_UJI_CONTEXT);
});

describe('Pembacaan dokumen baseline', () => {
  it('matriks §6.2 terbaca lengkap: 16 use case, termasuk UC-16 sebagai non-halaman', () => {
    expect(MATRIX.size).toBe(16);
    expect(PAGE_UCS).toHaveLength(15);
  });
});

describe('Matriks halaman role x use case sama dengan SRS-36 §6.2', () => {
  it.each(PAGE_UCS)('%s: izin keempat role sesuai dokumen', (uc) => {
    for (const role of ROLE_COLUMNS) {
      expect(canViewPage(role, uc, 'UJI'), `${uc} untuk ${role}`).toBe(MATRIX.get(uc)![role].allowed);
    }
  });

  it('penanda hanya-lihat sesuai dokumen (UC-11 dan UC-12 untuk WAREHOUSE)', () => {
    for (const uc of PAGE_UCS) {
      const documented = ROLE_COLUMNS.some((r) => MATRIX.get(uc)![r].viewOnly);
      expect(isViewOnlyPage(uc), uc).toBe(documented);
    }
  });

  it('UC-16 tidak pernah menjadi halaman untuk role mana pun', () => {
    for (const role of ROLE_COLUMNS) expect(canViewPage(role, 'UC-16', 'UJI')).toBe(false);
  });

  it('mode ACTUAL menolak semua kombinasi role x use case', () => {
    for (const role of ROLE_COLUMNS) {
      for (const uc of MATRIX.keys()) {
        expect(canViewPage(role, uc, 'ACTUAL' as never), `${uc}/${role}`).toBe(false);
      }
    }
  });
});

describe('Route nyata aplikasi diblokir sesuai matriks (semua role x semua route)', () => {
  const routes = router
    .getRoutes()
    .filter((r) => typeof r.meta?.ucId === 'string')
    .map((r) => ({ path: r.path, uc: r.meta.ucId as string, viewOnly: r.meta.viewOnly === true }));

  it('setiap use case halaman punya tepat satu route, dan UC-16 tidak punya route', () => {
    expect(routes.map((r) => r.uc).sort()).toEqual([...PAGE_UCS].sort());
    expect(routes.some((r) => r.uc === 'UC-16')).toBe(false);
  });

  it('penanda viewOnly pada route sama dengan dokumen', () => {
    for (const route of routes) {
      expect(route.viewOnly, route.path).toBe(isViewOnlyPage(route.uc));
    }
  });

  it.each(ROLE_COLUMNS)('role %s: tiap route terbuka atau dialihkan sesuai dokumen', async (role) => {
    sessionStore.setRole(role);
    for (const route of routes) {
      await router.push('/').catch(() => undefined);
      await router.push(route.path).catch(() => undefined);
      const expectedOpen = MATRIX.get(route.uc)![role].allowed;
      if (expectedOpen) {
        expect(router.currentRoute.value.path, `${role} ke ${route.path}`).toBe(route.path);
      } else {
        expect(router.currentRoute.value.name, `${role} ke ${route.path}`).toBe(FORBIDDEN_ROUTE_NAME);
        // Alihan tidak boleh membocorkan route tujuan lewat query atau hash.
        expect(router.currentRoute.value.fullPath).toBe('/akses-ditolak');
      }
    }
  });

  it('beralih role pada route terbuka mengalihkan ke akses ditolak bila role baru tidak berhak', async () => {
    sessionStore.setRole('WAREHOUSE');
    await router.push('/inventory/import-stock');
    expect(router.currentRoute.value.path).toBe('/inventory/import-stock');
    sessionStore.setRole('MANAGEMENT');
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe(FORBIDDEN_ROUTE_NAME));
  });
});

describe('Lintas gudang berbasis assignment (SRS-36 §8.3)', () => {
  it('gudang yang bukan assignment akun tidak dapat diaktifkan, dan konteks tidak berubah', () => {
    const store = createSessionStore(account({ warehouses: [WH1], activeWarehouseId: 'WH-01' }));
    const handler = vi.fn();
    store.onContextReset(handler);
    expect(store.setActiveWarehouse('WH-02')).toEqual({ ok: false, reason: 'WAREHOUSE_NOT_ASSIGNED' });
    expect(store.state.activeWarehouseId).toBe('WH-01');
    expect(handler).not.toHaveBeenCalled();
  });

  it('akun B dengan assignment lain tidak mewarisi gudang akun A, dan reset terpanggil sekali', () => {
    const store = createSessionStore(account({ accountId: 'A', warehouses: [WH1], activeWarehouseId: 'WH-01' }));
    const handler = vi.fn();
    store.onContextReset(handler);
    const result = store.setAccount(
      account({ accountId: 'B', role: 'WAREHOUSE', warehouses: [WH2], activeWarehouseId: 'WH-02' }),
    );
    expect(result.ok).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect([...handler.mock.calls[0][0].changed].sort()).toEqual(['account', 'role', 'warehouse']);
    expect(store.setActiveWarehouse('WH-01')).toEqual({ ok: false, reason: 'WAREHOUSE_NOT_ASSIGNED' });
    expect(store.state.activeWarehouseId).toBe('WH-02');
  });

  it('akun dengan dua gudang dapat berpindah hanya di antara assignment-nya, tiap pindah mereset', () => {
    const store = createSessionStore(
      account({ role: 'WAREHOUSE', warehouses: [WH1, WH2], activeWarehouseId: 'WH-01' }),
    );
    const handler = vi.fn();
    store.onContextReset(handler);
    expect(store.setActiveWarehouse('WH-02').ok).toBe(true);
    expect(store.setActiveWarehouse('WH-01').ok).toBe(true);
    expect(store.setActiveWarehouse('WH-01').ok).toBe(true);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('akun tanpa assignment tidak punya gudang aktif dan tidak dapat memilih gudang', () => {
    const store = createSessionStore(account({ warehouses: [], activeWarehouseId: null }));
    expect(store.activeWarehouse.value).toBeNull();
    expect(store.setActiveWarehouse('WH-01')).toEqual({ ok: false, reason: 'WAREHOUSE_NOT_ASSIGNED' });
  });

  it('gudang aktif di luar assignment pada akun baru ditolak dan akun lama tetap utuh', () => {
    const store = createSessionStore(account({ accountId: 'A', warehouses: [WH1], activeWarehouseId: 'WH-01' }));
    const result = store.setAccount(
      account({ accountId: 'B', warehouses: [WH1], activeWarehouseId: 'WH-02' }),
    );
    expect(result).toEqual({ ok: false, reason: 'WAREHOUSE_NOT_ASSIGNED' });
    expect(store.state.accountId).toBe('A');
  });

  it('pergantian role pada gudang yang sama tetap mereset (selection tidak boleh lintas role)', () => {
    const store = createSessionStore(account({ role: 'PURCHASING' }));
    const handler = vi.fn();
    store.onContextReset(handler);
    store.setRole('WAREHOUSE');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].changed).toEqual(['role']);
    expect(store.state.activeWarehouseId).toBe('WH-01');
  });

  it('role tidak dikenal dan mode ACTUAL ditolak tanpa mengubah atau mereset konteks', () => {
    const store = createSessionStore(account({}));
    const handler = vi.fn();
    store.onContextReset(handler);
    expect(store.setRole('ADMIN' as never)).toEqual({ ok: false, reason: 'ROLE_INVALID' });
    expect(store.setMode('ACTUAL' as never)).toEqual({ ok: false, reason: 'MODE_NOT_ENABLED' });
    expect(store.state.role).toBe('PURCHASING');
    expect(store.state.mode).toBe('UJI');
    expect(handler).not.toHaveBeenCalled();
  });
});
