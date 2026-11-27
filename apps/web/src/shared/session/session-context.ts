/**
 * Konteks sesi sisi klien: akun, role, gudang aktif, dan mode data.
 *
 * Batas (SRS-46, baseline SRS-36 §7 butir 8 dan §8.3):
 * - Ini BUKAN autentikasi. Sesi nyata dan otorisasi backend adalah SRS-47/SRS-48.
 *   Nilai awal di bawah adalah konteks UJI sementara sampai sesi tersedia.
 * - Gudang aktif hanya boleh berasal dari assignment (`user_warehouses`); gudang
 *   di luar assignment ditolak.
 * - Mode ACTUAL tidak diaktifkan (izin ACTUAL belum disetujui).
 * - Perubahan akun, role, gudang, atau mode memanggil semua handler reset agar
 *   selection/cache yang tidak lagi sah dibersihkan.
 */
import { computed, reactive, readonly } from 'vue';
import type { DataMode, UserRole } from '@siris/contracts';
import { isUserRole } from '../access/access-matrix';

export interface WarehouseAssignment {
  id: string;
  code: string;
  name: string;
}

export interface SessionContext {
  accountId: string;
  displayName: string;
  role: UserRole;
  warehouses: readonly WarehouseAssignment[];
  activeWarehouseId: string | null;
  mode: DataMode;
}

export type ContextChangeKey = 'account' | 'role' | 'warehouse' | 'mode';

export interface ContextResetEvent {
  changed: readonly ContextChangeKey[];
  previous: Readonly<SessionContext>;
  next: Readonly<SessionContext>;
}

export type ContextResetHandler = (event: ContextResetEvent) => void;

export type SessionChangeResult =
  | { ok: true; changed: readonly ContextChangeKey[] }
  | { ok: false; reason: 'ROLE_INVALID' | 'WAREHOUSE_NOT_ASSIGNED' | 'MODE_NOT_ENABLED' };

/** Konteks UJI sementara; diganti oleh sesi nyata setelah SRS-47. */
export const DEFAULT_UJI_CONTEXT: SessionContext = {
  accountId: 'uji-purchasing',
  displayName: 'yudha',
  role: 'PURCHASING',
  warehouses: [{ id: 'WH-01', code: 'WH-01', name: 'Gudang Bahan Baku' }],
  activeWarehouseId: 'WH-01',
  mode: 'UJI',
};

export function createSessionStore(initial: SessionContext = DEFAULT_UJI_CONTEXT) {
  const state = reactive<SessionContext>({ ...initial, warehouses: [...initial.warehouses] });
  const handlers = new Set<ContextResetHandler>();

  const activeWarehouse = computed(
    () => state.warehouses.find((w) => w.id === state.activeWarehouseId) ?? null,
  );

  function snapshot(): SessionContext {
    return { ...state, warehouses: [...state.warehouses] };
  }

  function notify(
    changed: readonly ContextChangeKey[],
    previous: SessionContext,
  ): void {
    if (changed.length === 0) return;
    const event: ContextResetEvent = { changed, previous, next: snapshot() };
    handlers.forEach((handler) => handler(event));
  }

  /** Daftarkan pembersih selection/cache. Mengembalikan fungsi untuk melepas. */
  function onContextReset(handler: ContextResetHandler): () => void {
    handlers.add(handler);
    return () => handlers.delete(handler);
  }

  function diff(previous: SessionContext, next: SessionContext): ContextChangeKey[] {
    const changed: ContextChangeKey[] = [];
    if (previous.accountId !== next.accountId) changed.push('account');
    if (previous.role !== next.role) changed.push('role');
    if (previous.activeWarehouseId !== next.activeWarehouseId) changed.push('warehouse');
    if (previous.mode !== next.mode) changed.push('mode');
    return changed;
  }

  /** Terapkan akun baru (login atau pergantian akun) beserta assignment gudangnya. */
  function setAccount(next: SessionContext): SessionChangeResult {
    if (!isUserRole(next.role)) return { ok: false, reason: 'ROLE_INVALID' };
    if (next.mode !== 'UJI') return { ok: false, reason: 'MODE_NOT_ENABLED' };
    if (
      next.activeWarehouseId !== null &&
      !next.warehouses.some((w) => w.id === next.activeWarehouseId)
    ) {
      return { ok: false, reason: 'WAREHOUSE_NOT_ASSIGNED' };
    }
    const previous = snapshot();
    Object.assign(state, { ...next, warehouses: [...next.warehouses] });
    const changed = diff(previous, snapshot());
    // Assignment gudang yang berubah juga membuat selection lama tidak sah (§8.3 butir 4).
    const assignmentChanged =
      previous.warehouses.length !== next.warehouses.length ||
      previous.warehouses.some((w, i) => w.id !== next.warehouses[i]?.id);
    if (assignmentChanged && !changed.includes('warehouse')) changed.push('warehouse');
    notify(changed, previous);
    return { ok: true, changed };
  }

  function setActiveWarehouse(warehouseId: string): SessionChangeResult {
    if (!state.warehouses.some((w) => w.id === warehouseId)) {
      return { ok: false, reason: 'WAREHOUSE_NOT_ASSIGNED' };
    }
    const previous = snapshot();
    state.activeWarehouseId = warehouseId;
    const changed = diff(previous, snapshot());
    notify(changed, previous);
    return { ok: true, changed };
  }

  function setMode(mode: DataMode): SessionChangeResult {
    if (mode !== 'UJI') return { ok: false, reason: 'MODE_NOT_ENABLED' };
    const previous = snapshot();
    state.mode = mode;
    const changed = diff(previous, snapshot());
    notify(changed, previous);
    return { ok: true, changed };
  }

  /**
   * Bersihkan konteks sesi (logout atau kadaluarsa). Semua selection/cache wajib
   * me-reset karena tidak ada konteks aktif lagi. Konteks kosong bersifat sementara
   * untuk pemisahan antara mode UJI dan runtime nyata (SRS-47).
   */
  function clear(): SessionChangeResult {
    const previous = snapshot();
    Object.assign(state, { ...SIGNED_OUT_CONTEXT, warehouses: [...SIGNED_OUT_CONTEXT.warehouses] });
    const changed = diff(previous, snapshot());
    notify(changed, previous);
    return { ok: true, changed };
  }

  function setRole(role: UserRole): SessionChangeResult {
    if (!isUserRole(role)) return { ok: false, reason: 'ROLE_INVALID' };
    const previous = snapshot();
    state.role = role;
    const changed = diff(previous, snapshot());
    notify(changed, previous);
    return { ok: true, changed };
  }

  return {
    state: readonly(state),
    activeWarehouse,
    onContextReset,
    setAccount,
    setActiveWarehouse,
    setMode,
    setRole,
    clear,
  };
}

export type SessionStore = ReturnType<typeof createSessionStore>;

/** Instans tunggal aplikasi. Pengujian membuat instans sendiri lewat createSessionStore. */
export const sessionStore: SessionStore = createSessionStore();

const SIGNED_OUT_CONTEXT: SessionContext = {
  accountId: '',
  displayName: '',
  role: 'PURCHASING',
  warehouses: [],
  activeWarehouseId: null,
  mode: 'UJI',
};
