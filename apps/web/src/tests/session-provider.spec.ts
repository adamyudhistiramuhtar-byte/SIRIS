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

  it('logout menghapus csrfToken sehingga token lama tidak bisa dibaca lagi', async () => {
    const now = () => 1_000;
    const store = createSessionStore(makeContext());
    const auth = new FakeSessionAuthServer(now, 5_000);
    auth.seed('yudha', 'secret', makeContext());
    const provider = createSessionProvider({ store, auth, now });
    await provider.login({ username: 'yudha', password: 'secret' });
    expect(provider.csrfToken).toMatch(/^csrf-fake-/);

    await provider.logout();

    expect(provider.csrfToken).toBeNull();
    expect(store.state.accountId).toBe('');
  });

  it('refresh expired membersihkan csrfToken dan state sesi', async () => {
    let clock = 1_000;
    const now = () => clock;
    const store = createSessionStore(makeContext({ accountId: '', displayName: '', warehouses: [], activeWarehouseId: null }));
    const auth = new FakeSessionAuthServer(now, 100);
    auth.seed('yudha', 'secret', makeContext());
    const provider = createSessionProvider({ store, auth, now });
    await provider.login({ username: 'yudha', password: 'secret' });
    expect(provider.csrfToken).not.toBeNull();

    clock = 2_000;
    const result = await provider.refresh();

    expect(result).toEqual({ ok: false, reason: 'SESSION_EXPIRED' });
    expect(provider.csrfToken).toBeNull();
    expect(store.state.accountId).toBe('');
  });

  it('login A -> logout -> login B tidak membocorkan token/konteks akun A', async () => {
    const now = () => 1_000;
    const store = createSessionStore(makeContext({ accountId: '', displayName: '', warehouses: [], activeWarehouseId: null }));
    const auth = new FakeSessionAuthServer(now, 5_000);
    auth.seed('user-a', 'pw-a', makeContext({ accountId: 'account-a', displayName: 'A' }));
    auth.seed('user-b', 'pw-b', makeContext({ accountId: 'account-b', displayName: 'B' }));
    const provider = createSessionProvider({ store, auth, now });

    await provider.login({ username: 'user-a', password: 'pw-a' });
    const tokenA = provider.csrfToken;
    await provider.logout();
    expect(provider.csrfToken).toBeNull();

    await provider.login({ username: 'user-b', password: 'pw-b' });
    expect(store.state.accountId).toBe('account-b');
    expect(provider.csrfToken).not.toBeNull();
    expect(provider.csrfToken).not.toBe(tokenA);
  });

  it('logout tetap membersihkan state lokal meski auth.logout melempar exception', async () => {
    const now = () => 1_000;
    const store = createSessionStore(makeContext());
    const auth = new FakeSessionAuthServer(now, 5_000);
    auth.seed('yudha', 'secret', makeContext());
    const provider = createSessionProvider({ store, auth, now });
    await provider.login({ username: 'yudha', password: 'secret' });
    vi.spyOn(auth, 'logout').mockRejectedValueOnce(new Error('network'));

    await expect(provider.logout()).rejects.toThrow('network');
    expect(provider.csrfToken).toBeNull();
    expect(store.state.accountId).toBe('');
  });

  it('login failure (exception) tidak meninggalkan state terautentikasi parsial', async () => {
    const store = createSessionStore(makeContext({ accountId: '', displayName: '', warehouses: [], activeWarehouseId: null }));
    const auth = new FakeSessionAuthServer(() => 1_000, 5_000);
    vi.spyOn(auth, 'login').mockRejectedValueOnce(new Error('boom'));
    const provider = createSessionProvider({ store, auth });

    const result = await provider.login({ username: 'yudha', password: 'secret' });

    expect(result).toEqual({ ok: false, reason: 'AUTH_FAILED' });
    expect(store.state.accountId).toBe('');
    expect(provider.csrfToken).toBeNull();
  });

  it('refresh exception membersihkan sesi/token stale', async () => {
    const now = () => 1_000;
    const store = createSessionStore(makeContext());
    const auth = new FakeSessionAuthServer(now, 5_000);
    auth.seed('yudha', 'secret', makeContext());
    const provider = createSessionProvider({ store, auth, now });
    await provider.login({ username: 'yudha', password: 'secret' });
    vi.spyOn(auth, 'refresh').mockRejectedValueOnce(new Error('timeout'));

    const result = await provider.refresh();

    expect(result).toEqual({ ok: false, reason: 'SESSION_EXPIRED' });
    expect(provider.csrfToken).toBeNull();
    expect(store.state.accountId).toBe('');
  });
});
