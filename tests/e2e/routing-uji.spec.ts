import { test, expect } from '@playwright/test';
import { evidenceIdentity } from '../helpers/evidence.mjs';

// Konteks sementara SRS-46 melalui modul internal dev; bukan login/RBAC backend.
const cases = [
  {role: 'PURCHASING', allowed: '/inbound/import-reference', denied: '/inventory/reconcile'},
  {role: 'WAREHOUSE', allowed: '/inventory/reconcile', denied: '/inbound/import-reference'},
  {role: 'PRODUCTION', allowed: '/materials/work-orders', denied: '/inventory/reconcile'},
  {role: 'MANAGEMENT', allowed: '/inventory/history', denied: '/inbound/import-reference'},
];

for (const scenario of cases) {
  test(`routing browser konteks sementara UJI ${scenario.role}, bukan autentikasi`, async ({page}, info) => {
    await page.clock.install({time: new Date('2026-11-20T03:00:00.000Z')});
    await page.goto('/');
    await expect(page.locator('#app')).not.toBeEmpty();
    await page.evaluate(async ({role, path}) => {
      const sessionPath = '/src/shared/session/session-context.ts';
      const routerPath = '/src/router/index.ts';
      const {sessionStore} = await import(sessionPath);
      const {router} = await import(routerPath);
      const result = sessionStore.setRole(role);
      if (!result.ok) throw new Error('UJI_CONTEXT_FAILED');
      await router.push(path);
    }, {role: scenario.role, path: scenario.allowed});
    await expect(page).toHaveURL(new RegExp(`${scenario.allowed}$`));
    await expect(page.locator(`a[href="${scenario.allowed}"]`).first()).toBeVisible();
    await info.attach(`UJI-${scenario.role}-halaman-berizin`, {body: await page.screenshot({fullPage: true}), contentType: 'image/png'});
    await page.evaluate(async (path) => {
      const routerPath = '/src/router/index.ts';
      const {router} = await import(routerPath); await router.push(path);
    }, scenario.denied);
    await expect(page).toHaveURL(/\/akses-ditolak$/);
    await info.attach(`UJI-${scenario.role}-akses-ditolak`, {body: await page.screenshot({fullPage: true}), contentType: 'image/png'});
    await page.reload();
    const roleAfterReload = await page.evaluate(async () => {
      const sessionPath = '/src/shared/session/session-context.ts';
      return (await import(sessionPath)).sessionStore.state.role;
    });
    expect(roleAfterReload).toBe('PURCHASING');
    await info.attach('identitas-routing-UJI', {body: JSON.stringify({...evidenceIdentity(), role: scenario.role,
      mode: 'UJI', auth: 'NOT_IMPLEMENTED', status: info.status}), contentType: 'application/json'});
  });
}
