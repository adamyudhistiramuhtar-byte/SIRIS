/**
 * Fake server autentikasi untuk pengujian provider sesi (SRS-47, T-13).
 *
 * Meniru kontrak inti server sesi tanpa HTTP: penyimpanan sesi in-memory,
 * expiry absolut, CSRF token per sesi, dan pengesahan credential.
 * Penggunaan nyata (cookie/refresh server) tetap menunggu integrasi SRS-47
 * backend; pemakaian ini hanya sebagai test double pada store interface terinjeksi.
 */
import type { UserRole } from '@siris/contracts';
import type { SessionAuthPort, SessionLoginInput, SessionLoginResult } from './session-provider';
import type { SessionContext } from './session-context';

export interface FakeSessionAccountContextInput {
  accountId: string;
  displayName: string;
  role: UserRole;
  warehouseId: string | null;
  warehouses: SessionContext['warehouses'];
}

interface FakeSessionRecord {
  context: SessionContext;
  csrfToken: string;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 30 * 60 * 1000;

export class FakeSessionAuthServer implements SessionAuthPort {
  private accounts = new Map<string, { password: string; context: SessionContext }>();
  private current: FakeSessionRecord | null = null;

  constructor(private readonly now: () => number = () => Date.now(), private readonly ttlMs: number = DEFAULT_TTL_MS) {}

  seed(username: string, password: string, context: SessionContext): void {
    this.accounts.set(username, { password, context });
  }

  async login(input: SessionLoginInput): Promise<SessionLoginResult | null> {
    const account = this.accounts.get(input.username);
    if (!account || account.password !== input.password) return null;
    const context: SessionContext = { ...account.context, mode: 'UJI' };
    const session: FakeSessionRecord = {
      context,
      csrfToken: `csrf-fake-${this.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
      expiresAt: this.now() + this.ttlMs,
    };
    this.current = session;
    return { context, csrfToken: session.csrfToken, expiresAt: session.expiresAt };
  }

  async logout(_input?: { sessionId?: string | null }): Promise<void> {
    this.current = null;
  }

  async refresh(): Promise<SessionContext | null> {
    if (!this.current) return null;
    if (this.now() >= this.current.expiresAt) {
      this.current = null;
      return null;
    }
    return { ...this.current.context, mode: 'UJI' };
  }

  activeContext(): SessionContext | null {
    if (!this.current) return null;
    if (this.now() >= this.current.expiresAt) {
      this.current = null;
      return null;
    }
    return { ...this.current.context, mode: 'UJI' };
  }
}

export function makeFakeSessionContext(input: FakeSessionAccountContextInput): SessionContext {
  return {
    accountId: input.accountId,
    displayName: input.displayName,
    role: input.role,
    warehouses: input.warehouses,
    activeWarehouseId: input.warehouseId,
    mode: 'UJI',
  };
}
