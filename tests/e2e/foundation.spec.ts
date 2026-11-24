import { test, expect } from '@playwright/test';
import { evidenceIdentity } from '../helpers/evidence.mjs';

test.afterEach(async ({page}, info) => {
  void page;
  await info.attach('identitas-evidence-UJI', {body:JSON.stringify({...evidenceIdentity(),test:info.title,status:info.status,finished_at:new Date().toISOString()}),contentType:'application/json'});
});

test('browser nyata memuat app shell tanpa error JavaScript', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.name));
  await page.clock.install({time: new Date('2026-11-20T03:00:00.000Z')});
  await page.goto('/');
  await expect(page.locator('#app')).not.toBeEmpty();
  expect(errors).toEqual([]);
});

test('API nyata mengembalikan health envelope dan correlation header', async ({request}) => {
  const response = await request.get('http://127.0.0.1:3101/api/v1/health');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.data.status).toBe('ok');
  expect(response.headers()['x-correlation-id']).toBe(body.meta.correlation_id);
});

test('alur login lintas empat role menunggu integrasi SRS-47/48', async () => {
  test.skip(true, 'BLOCKED: session/auth belum tersedia; fixture role bukan bukti login/RBAC.');
});
