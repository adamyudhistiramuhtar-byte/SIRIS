import { describe, it, expect, vi } from 'vitest';
import { createAuthorizer, createStageAuthorizerAdapter } from '../auth/authorizer.js';
import type { AuthActor } from '../auth/auth-types.js';

const actor = (overrides: Partial<AuthActor> = {}): AuthActor => ({
  accountId: 'u-1',
  role: 'PURCHASING',
  warehouseIds: ['WH-01'],
  active: true,
  ...overrides,
});

describe('SRS-48 authorizer (deny-by-default)', () => {
  it('menolak tanpa aktor', () => {
    const az = createAuthorizer();
    expect(az.authorize({ actor: null, action: 'import:stage', scope: { mode: 'UJI', warehouseId: 'WH-01' } })).toEqual({
      allowed: false,
      reason: 'DENY_NO_ACTOR',
    });
  });

  it('menolak aktor tidak aktif atau sesi dicabut', () => {
    const az = createAuthorizer();
    expect(az.authorize({ actor: actor({ active: false }), action: 'import:stage', scope: { mode: 'UJI', warehouseId: 'WH-01' } }).reason).toBe('DENY_INACTIVE');
    expect(az.authorize({ actor: actor({ sessionRevoked: true }), action: 'import:stage', scope: { mode: 'UJI', warehouseId: 'WH-01' } }).reason).toBe('DENY_REVOKED');
  });

  it('menolak gudang di luar assignment', () => {
    const az = createAuthorizer();
    const decision = az.authorize({ actor: actor(), action: 'import:stage', scope: { mode: 'UJI', warehouseId: 'WH-99' } });
    expect(decision).toEqual({ allowed: false, reason: 'DENY_WAREHOUSE' });
  });

  it('menolak mode selain UJI', () => {
    const az = createAuthorizer();
    expect(az.authorize({ actor: actor(), action: 'import:stage', scope: { mode: 'ACTUAL', warehouseId: 'WH-01' } }).reason).toBe('DENY_MODE');
  });

  it('menolak role yang tidak punya aksi', () => {
    const az = createAuthorizer();
    expect(az.authorize({ actor: actor({ role: 'MANAGEMENT' }), action: 'import:stage', scope: { mode: 'UJI', warehouseId: 'WH-01' } }).reason).toBe('DENY_ROLE');
  });

  it('menolak mutasi batch milik orang lain', () => {
    const az = createAuthorizer();
    const decision = az.authorize({ actor: actor(), action: 'batch:mutate', scope: { mode: 'UJI', batchOwnerId: 'u-2' } });
    expect(decision.reason).toBe('DENY_OBJECT_OWNERSHIP');
  });

  it('mengizinkan akses sah', () => {
    const az = createAuthorizer();
    expect(az.authorize({ actor: actor(), action: 'import:stage', scope: { mode: 'UJI', warehouseId: 'WH-01' } })).toEqual({
      allowed: true,
      reason: 'ALLOWED',
    });
  });
});

describe('SRS-48 StageAuthorizer adapter (PR #27 handoff)', () => {
  it('mengembalikan actor id/role/warehouse_ids dari sesi tervalidasi', async () => {
    const az = createAuthorizer();
    const adapter = createStageAuthorizerAdapter(async () => actor({ warehouseIds: ['WH-01', 'WH-02'] }), az);
    await expect(adapter.authorizeStage({ kind: 'STOCK', warehouse_id: 'WH-01', mode: 'UJI' })).resolves.toEqual({
      actor_id: 'u-1',
      role: 'PURCHASING',
      warehouse_ids: ['WH-01', 'WH-02'],
    });
  });

  it('menolak staging tanpa aktor/sesi', async () => {
    const az = createAuthorizer();
    const adapter = createStageAuthorizerAdapter(async () => null, az);
    await expect(adapter.authorizeStage({ kind: 'STOCK', warehouse_id: 'WH-01', mode: 'UJI' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
      statusCode: 403,
    });
  });

  it('tidak mempercayai actor dari payload; actor hanya dari resolver', async () => {
    const az = createAuthorizer();
    const resolver = vi.fn(async () => actor({ accountId: 'session-user' }));
    const adapter = createStageAuthorizerAdapter(resolver, az);
    const result = await adapter.authorizeStage({ kind: 'STOCK', warehouse_id: 'WH-01', mode: 'UJI' } as any);
    expect(result.actor_id).toBe('session-user');
    expect(resolver).toHaveBeenCalledTimes(1);
  });
});
