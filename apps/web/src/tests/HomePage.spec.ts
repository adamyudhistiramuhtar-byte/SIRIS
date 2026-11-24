import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import HomePage from '../pages/HomePage.vue';
import { DEFAULT_UJI_CONTEXT, sessionStore } from '../shared/session/session-context';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
});

function mountHome() {
  return mount(HomePage, { global: { plugins: [router] } });
}

describe('Beranda: pintasan per role (SRS-46)', () => {
  afterEach(() => {
    sessionStore.setAccount(DEFAULT_UJI_CONTEXT);
  });

  it('PURCHASING hanya melihat pintasan UC-01 dan UC-04', () => {
    const text = mountHome().text();
    expect(text).toContain('UC-01');
    expect(text).toContain('UC-04');
    expect(text).not.toContain('UC-09');
    expect(text).not.toContain('UC-12');
  });

  it('WAREHOUSE melihat UC-09, UC-04, dan UC-12 tanpa UC-01', () => {
    sessionStore.setRole('WAREHOUSE');
    const text = mountHome().text();
    expect(text).toContain('UC-09');
    expect(text).toContain('UC-04');
    expect(text).toContain('UC-12');
    expect(text).not.toContain('UC-01');
  });

  it('PRODUCTION tidak melihat judul "Alur Kerja Utama" kosong', () => {
    sessionStore.setRole('PRODUCTION');
    const text = mountHome().text();
    expect(text).not.toContain('Alur Kerja Utama');
    expect(text).not.toMatch(/UC-\d\d/);
  });
});
