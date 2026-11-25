import { describe, it, expect, vi } from 'vitest';
import { createSessionStore } from '../shared/session/session-context';
import { createSessionProvider } from '../shared/session/session-provider';
import { FakeSessionAuthServer } from '../shared/session/fake-session-auth-server';
import type { SessionContext } from '../shared/session/session-context';

const WH1 = { id: 'WH-01', code: 'WH-01', name: 'Gudang Bahan Baku' };
const WH2 = { id: 'WH-02', code: 'WH-02', name: 'Gudang Barang Jadi' };

function makeContext(overrides: Partial<SessionContext> = {}): SessionContext {
  return {
    accountId: 'uji-purchasing',
    displayName: 'yudha',
    role: 'PURCHASING',
    warehouses: [WH1, WH2],
    activeWarehouseId: 'WH-01',
    mode: 'UJI',
    ...overrides,
  };
}

describe('SRS-47 session provider (store terinjeksi, fake auth server)', () => {
  it('login sukses mengisi konteks sesi dan menyimpan CSRF token', async () => {
    const now = vi.fn(() => 1_000);
    const store = createSessionStore(makeContext({ accountId: '', displayName: '', warehouses: [], activeWarehouseId: null }));
    const auth = new FakeSessionAuthServer(now, 5_000);
    auth.seed('yudha', 'secret', makeContext());
    const provider = createSessionProvider({ store, auth, now });

    const result = await provider.login({ username: 'yudha', password: 'secret' });

    expect(result.ok).toBe(true);
    expect(store.state.accountId).toBe('uji-purchasing');
    expect(store.state.role).toBe('PURCHASING');
    expect(store.state.activeWarehouseId).toBe('WH-01');
    expect(provider.csrfToken).toMatch(/^csrf-fake-/);
  });

  it('login gagal tidak mengubah konteks dan tidak membocorkan password', async () => {
    const store = createSessionStore(makeContext({ accountId: 'before', displayName: 'before' }));
    const auth = new FakeSessionAuthServer(() => 1_000, 5_000);
    auth.seed('yudha', 'secret', makeContext());
    const provider = createSessionProvider({ store, auth });

    const result = await provider.login({ username: 'yudha', password: 'wrong' });

    expect(result).toEqual({ ok: false, reason: 'AUTH_FAILED' });
    expect(store.state.accountId).toBe('before');
    expect(provider.csrfToken).toBeNull();
  });

  it('logout memanggil auth server dan membersihkan konteks', async () => {
    const store = createSessionStore(makeContext());
    const auth = new FakeSessionAuthServer(() => 1_000, 5_000);
    auth.seed('yudha', 'secret', makeContext());
    const logoutSpy = vi.spyOn(auth, 'logout');
    const provider = createSessionProvider({ store, auth });
    await provider.login({ username: 'yudha', password: 'secret' });

    await provider.logout();

    expect(logoutSpy).toHaveBeenCalled();
    expect(store.state.accountId).toBe('');
    expect(store.state.warehouses).toEqual([]);
    expect(store.state.activeWarehouseId).toBeNull();
  });

  it('sesi kadaluarsa saat refresh ditolak dan konteks dibersihkan', async () => {
    let clock = 1_000;
    const now = () => clock;
    const store = createSessionStore(makeContext({ accountId: '', displayName: '', warehouses: [], activeWarehouseId: null }));
    const auth = new FakeSessionAuthServer(now, 100);
    auth.seed('yudha', 'secret', makeContext());
    const provider = createSessionProvider({ store, auth, now });
    await provider.login({ username: 'yudha', password: 'secret' });

    clock = 2_000;
    const result = await provider.refresh();

    expect(result).toEqual({ ok: false, reason: 'SESSION_EXPIRED' });
    expect(store.state.accountId).toBe('');
    expect(auth.activeContext()).toBeNull();
  });

  it('login dengan sesi yang sudah kedaluwarsa ditolak', async () => {
    const now = vi.fn(() => 10_000);
    const store = createSessionStore(makeContext());
    const auth = new FakeSessionAuthServer(now, 5_000);
    auth.seed('yudha', 'secret', makeContext());
    // Paksa login mengembalikan expiresAt di masa lalu untuk menguji guard provider.
    vi.spyOn(auth, 'login').mockResolvedValue({
      context: makeContext(),
      csrfToken: 'csrf-expired',
      expiresAt: 5_000,
    });
    const provider = createSessionProvider({ store, auth, now });

    const result = await provider.login({ username: 'yudha', password: 'secret' });

    expect(result).toEqual({ ok: false, reason: 'SESSION_EXPIRED' });
    expect(store.state.accountId).toBe('');
  });

  it('perubahan akun melalui login memicu reset konteks', async () => {
    const store = createSessionStore(makeContext({ accountId: 'old', displayName: 'old' }));
    const auth = new FakeSessionAuthServer(() => 1_000, 5_000);
    auth.seed('yudha', 'secret', makeContext({ accountId: 'new-user', displayName: 'new' }));
    const provider = createSessionProvider({ store, auth });
    const reset = vi.fn();
    store.onContextReset(reset);

    await provider.login({ username: 'yudha', password: 'secret' });

    expect(reset).toHaveBeenCalled();
    expect(reset.mock.calls[0][0].changed).toContain('account');
  });
});
