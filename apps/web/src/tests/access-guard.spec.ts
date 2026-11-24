import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';
import { FORBIDDEN_ROUTE_NAME, installAccessGuard } from '../router/access-guard';
import { createSessionStore, DEFAULT_UJI_CONTEXT } from '../shared/session/session-context';

const stub = { template: '<div />' };

function setup(role: 'PURCHASING' | 'WAREHOUSE' | 'PRODUCTION' | 'MANAGEMENT' = 'PURCHASING') {
  const session = createSessionStore({ ...DEFAULT_UJI_CONTEXT, role });
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: stub },
      { path: '/login', name: 'login', component: stub },
      { path: '/akses-ditolak', name: FORBIDDEN_ROUTE_NAME, component: stub },
      { path: '/inbound/import-reference', component: stub, meta: { ucId: 'UC-01' } },
      { path: '/inventory/import-stock', component: stub, meta: { ucId: 'UC-09' } },
      { path: '/materials/work-orders', component: stub, meta: { ucId: 'UC-06' } },
      { path: '/inventory/evidence', component: stub, meta: { ucId: 'UC-11' } },
    ],
  });
  const dispose = installAccessGuard(router, session);
  return { session, router, dispose };
}

describe('Route guard berbasis role (SRS-46)', () => {
  it('mengizinkan halaman yang ada di matriks role', async () => {
    const { router } = setup('PURCHASING');
    await router.push('/inbound/import-reference');
    expect(router.currentRoute.value.path).toBe('/inbound/import-reference');
  });

  it('mengalihkan halaman terlarang ke halaman akses ditolak', async () => {
    const { router } = setup('PURCHASING');
    await router.push('/inventory/import-stock');
    expect(router.currentRoute.value.name).toBe(FORBIDDEN_ROUTE_NAME);
  });

  it('PRODUCTION hanya dapat membuka UC-06', async () => {
    const { router } = setup('PRODUCTION');
    await router.push('/materials/work-orders');
    expect(router.currentRoute.value.path).toBe('/materials/work-orders');
    await router.push('/inbound/import-reference');
    expect(router.currentRoute.value.name).toBe(FORBIDDEN_ROUTE_NAME);
  });

  it('Beranda dan login tidak dibatasi', async () => {
    const { router } = setup('MANAGEMENT');
    await router.push('/');
    expect(router.currentRoute.value.path).toBe('/');
    await router.push('/login');
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('halaman akses ditolak tidak membocorkan route tujuan', async () => {
    const { router } = setup('PURCHASING');
    await router.push('/inventory/import-stock?x=1');
    const route = router.currentRoute.value;
    expect(route.fullPath).toBe('/akses-ditolak');
    expect(route.query).toEqual({});
  });

  it('mengevaluasi ulang route aktif saat role berubah', async () => {
    const { router, session } = setup('WAREHOUSE');
    await router.push('/inventory/import-stock');
    expect(router.currentRoute.value.path).toBe('/inventory/import-stock');
    session.setRole('PURCHASING');
    await nextTick();
    await router.isReady();
    await new Promise((r) => setTimeout(r, 0));
    expect(router.currentRoute.value.name).toBe(FORBIDDEN_ROUTE_NAME);
  });

  it('UC-11 dapat dibuka WAREHOUSE (hanya lihat) dan ditolak untuk PURCHASING', async () => {
    const wh = setup('WAREHOUSE');
    await wh.router.push('/inventory/evidence');
    expect(wh.router.currentRoute.value.path).toBe('/inventory/evidence');
    const pu = setup('PURCHASING');
    await pu.router.push('/inventory/evidence');
    expect(pu.router.currentRoute.value.name).toBe(FORBIDDEN_ROUTE_NAME);
  });
});
