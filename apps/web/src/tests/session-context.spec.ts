import { describe, it, expect, vi } from 'vitest';
import {
  createSessionStore,
  DEFAULT_UJI_CONTEXT,
  type SessionContext,
} from '../shared/session/session-context';

const TWO_WAREHOUSES: SessionContext = {
  ...DEFAULT_UJI_CONTEXT,
  warehouses: [
    { id: 'WH-01', code: 'WH-01', name: 'Gudang Bahan Baku' },
    { id: 'WH-02', code: 'WH-02', name: 'Gudang Barang Jadi' },
  ],
};

describe('Konteks sesi (SRS-36 §7 butir 8, §8.3)', () => {
  it('pergantian gudang aktif memanggil reset dengan kunci warehouse', () => {
    const store = createSessionStore(TWO_WAREHOUSES);
    const handler = vi.fn();
    store.onContextReset(handler);
    const result = store.setActiveWarehouse('WH-02');
    expect(result).toEqual({ ok: true, changed: ['warehouse'] });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].changed).toEqual(['warehouse']);
    expect(store.activeWarehouse.value?.id).toBe('WH-02');
  });

  it('gudang di luar assignment ditolak dan tidak mereset', () => {
    const store = createSessionStore(TWO_WAREHOUSES);
    const handler = vi.fn();
    store.onContextReset(handler);
    expect(store.setActiveWarehouse('WH-99')).toEqual({ ok: false, reason: 'WAREHOUSE_NOT_ASSIGNED' });
    expect(store.state.activeWarehouseId).toBe('WH-01');
    expect(handler).not.toHaveBeenCalled();
  });

  it('pergantian role memicu reset', () => {
    const store = createSessionStore(TWO_WAREHOUSES);
    const handler = vi.fn();
    store.onContextReset(handler);
    expect(store.setRole('WAREHOUSE').ok).toBe(true);
    expect(handler.mock.calls[0][0].changed).toEqual(['role']);
  });

  it('role tidak dikenal ditolak', () => {
    const store = createSessionStore(TWO_WAREHOUSES);
    expect(store.setRole('ADMIN' as never)).toEqual({ ok: false, reason: 'ROLE_INVALID' });
    expect(store.state.role).toBe('PURCHASING');
  });

  it('mode ACTUAL tidak dapat diaktifkan', () => {
    const store = createSessionStore(TWO_WAREHOUSES);
    const handler = vi.fn();
    store.onContextReset(handler);
    expect(store.setMode('ACTUAL')).toEqual({ ok: false, reason: 'MODE_NOT_ENABLED' });
    expect(store.state.mode).toBe('UJI');
    expect(handler).not.toHaveBeenCalled();
  });

  it('mengatur mode yang sama tidak memicu reset', () => {
    const store = createSessionStore(TWO_WAREHOUSES);
    const handler = vi.fn();
    store.onContextReset(handler);
    expect(store.setMode('UJI')).toEqual({ ok: true, changed: [] });
    expect(handler).not.toHaveBeenCalled();
  });

  it('pergantian akun mereset akun, role, dan gudang sekaligus', () => {
    const store = createSessionStore(TWO_WAREHOUSES);
    const handler = vi.fn();
    store.onContextReset(handler);
    store.setAccount({
      accountId: 'uji-warehouse',
      displayName: 'gudang1',
      role: 'WAREHOUSE',
      warehouses: [{ id: 'WH-02', code: 'WH-02', name: 'Gudang Barang Jadi' }],
      activeWarehouseId: 'WH-02',
      mode: 'UJI',
    });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].changed).toEqual(['account', 'role', 'warehouse']);
  });

  it('akun baru dengan gudang aktif di luar assignment ditolak', () => {
    const store = createSessionStore(TWO_WAREHOUSES);
    const result = store.setAccount({ ...TWO_WAREHOUSES, accountId: 'x', activeWarehouseId: 'WH-77' });
    expect(result).toEqual({ ok: false, reason: 'WAREHOUSE_NOT_ASSIGNED' });
    expect(store.state.accountId).toBe(TWO_WAREHOUSES.accountId);
  });

  it('perubahan assignment gudang mereset walau gudang aktif sama', () => {
    const store = createSessionStore(TWO_WAREHOUSES);
    const handler = vi.fn();
    store.onContextReset(handler);
    store.setAccount({ ...TWO_WAREHOUSES, warehouses: [TWO_WAREHOUSES.warehouses[0]] });
    expect(handler.mock.calls[0][0].changed).toContain('warehouse');
  });

  it('handler yang dilepas tidak dipanggil lagi', () => {
    const store = createSessionStore(TWO_WAREHOUSES);
    const handler = vi.fn();
    const off = store.onContextReset(handler);
    off();
    store.setRole('MANAGEMENT');
    expect(handler).not.toHaveBeenCalled();
  });
});
