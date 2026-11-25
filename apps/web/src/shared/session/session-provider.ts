/**
 * Provider autentikasi dan sesi aplikasi (SRS-47 / T-13).
 *
 * Batas:
 * - Provider ini BUKAN penyimpanan sesi server. Ia menerjemahkan siklus hidup
 *   autentikasi (login/logout/refresh/expiry) ke konteks sesi pada store yang
 *   diberikan lewat dependency injection.
 * - Konteks yang dipakai adalah konteks UJI pada runtime aplikasi; mode ACTUAL
 *   tetap ditolak sampai SRS-47 acceptance criteria backend dan approval PM.
 * - CSRF token dari respons login dijaga di dalam provider dan tidak ikut ke
 *   store/state yang dikirim ke komponen. Menyimpan token di luar state juga
 *   memudahkan rotasi dan memutus penularan ke permintaan.
 */
import type { DataMode } from '@siris/contracts';
import type { SessionContext, SessionStore } from './session-context';

export interface SessionLoginInput {
  username: string;
  password: string;
  warehouseId?: string | null;
}

export interface SessionLoginResult {
  context: SessionContext;
  csrfToken?: string | null;
  expiresAt?: number | null;
}

export interface SessionLogoutRequest {
  sessionId?: string | null;
}

export interface SessionAuthPort {
  login(input: SessionLoginInput): Promise<SessionLoginResult | null>;
  logout(input?: SessionLogoutRequest): Promise<void>;
  refresh?(): Promise<SessionContext | null>;
}

export type SessionProviderResult =
  | { ok: true; changed: readonly string[] }
  | { ok: false; reason: 'MODE_NOT_ENABLED' | 'AUTH_FAILED' | 'SESSION_EXPIRED' | 'ROLE_INVALID' | 'WAREHOUSE_NOT_ASSIGNED' };

export interface SessionProviderOptions {
  store: SessionStore;
  auth: SessionAuthPort;
  now?: () => number;
}

export interface SessionProvider {
  readonly store: SessionStore;
  readonly csrfToken: string | null;
  readonly mode: DataMode;
  login(input: SessionLoginInput): Promise<SessionProviderResult>;
  logout(): Promise<void>;
  refresh(): Promise<SessionProviderResult>;
}

const UJI: DataMode = 'UJI';

export function createSessionProvider({ store, auth, now = (): number => Date.now() }: SessionProviderOptions): SessionProvider {
  let csrfToken: string | null = null;

  async function login(input: SessionLoginInput): Promise<SessionProviderResult> {
    if (store.state.mode !== UJI) return { ok: false, reason: 'MODE_NOT_ENABLED' };

    const result = await auth.login(input);
    if (!result) return { ok: false, reason: 'AUTH_FAILED' };

    const expiresAt = result.expiresAt ?? null;
    if (expiresAt !== null && now() >= expiresAt) {
      await auth.logout({ sessionId: result.context.accountId });
      store.clear();
      return { ok: false, reason: 'SESSION_EXPIRED' };
    }

    csrfToken = result.csrfToken ?? null;
    const applied = store.setAccount({ ...result.context, mode: UJI });
    return applied.ok
      ? { ok: true, changed: applied.changed }
      : { ok: false, reason: applied.reason };
  }

  async function logout(): Promise<void> {
    await auth.logout();
    store.clear();
  }

  async function refresh(): Promise<SessionProviderResult> {
    if (store.state.mode !== UJI) return { ok: false, reason: 'MODE_NOT_ENABLED' };

    const context = await auth.refresh?.();
    if (!context) {
      store.clear();
      return { ok: false, reason: 'SESSION_EXPIRED' };
    }

    const applied = store.setAccount({ ...context, mode: UJI });
    return applied.ok
      ? { ok: true, changed: applied.changed }
      : { ok: false, reason: applied.reason };
  }

  return {
    store,
    get csrfToken(): string | null {
      return csrfToken;
    },
    get mode(): DataMode {
      return store.state.mode;
    },
    login,
    logout,
    refresh,
  };
}
