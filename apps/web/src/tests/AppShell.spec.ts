import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import AppShell from '../layouts/AppShell.vue';
import { DEFAULT_UJI_CONTEXT, sessionStore } from '../shared/session/session-context';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      component: { template: '<div>Beranda</div>' },
      meta: {
        title: 'Beranda',
        description: 'Halaman beranda aplikasi',
      },
    },
    {
      path: '/:pathMatch(.*)*',
      component: { template: '<div>Placeholder</div>' },
    },
  ],
});

describe('AppShell Component Smoke Test', () => {
  afterEach(() => {
    sessionStore.setAccount(DEFAULT_UJI_CONTEXT);
  });

  it('Harus merender identitas SIRIS, Context Strip, dan grup navigasi', async () => {
    router.push('/');
    await router.isReady();

    const wrapper = mount(AppShell, {
      global: {
        plugins: [router],
        stubs: {
          'router-view': {
            template: '<div class="test-router-view">Main Content</div>',
          },
        },
      },
    });

    const text = wrapper.text();

    // Verifikasi identitas brand
    expect(text).toContain('SIRIS');
    expect(text).toContain('PT Harina Chemicals Industry');

    // Verifikasi Context Strip (design.md signature)
    expect(text).toContain('Konteks:');
    expect(text).toContain('MODE UJI');
    expect(text).toContain('Gudang Bahan Baku');

    // Verifikasi Grup Navigasi
    expect(text).toContain('Utama');
    expect(text).toContain('Supplier Inbound');
    expect(text).toContain('Referensi');

    // Konteks bawaan UJI adalah PURCHASING: grup yang bukan miliknya tidak tampil (SRS-36 §6.2)
    expect(text).not.toContain('Persediaan');
    expect(text).not.toContain('Pengawasan');
  });

  function mountShell() {
    return mount(AppShell, {
      global: {
        plugins: [router],
        stubs: { 'router-view': { template: '<div />' } },
      },
    });
  }

  it('menu WAREHOUSE memuat Persediaan dan Audit, tanpa impor Purchasing', async () => {
    sessionStore.setRole('WAREHOUSE');
    const wrapper = mountShell();
    const text = wrapper.text();
    expect(text).toContain('Persediaan');
    expect(text).toContain('Audit Proses');
    expect(text).toContain('Impor Penerimaan');
    expect(text).not.toContain('Impor Janji Supplier');
    expect(text).not.toContain('Metrik Supplier');
  });

  it('PRODUCTION hanya melihat Beranda dan Referensi Material WO', async () => {
    sessionStore.setRole('PRODUCTION');
    const links = mountShell()
      .findAll('nav a')
      .map((a) => a.text());
    expect(links).toEqual(['Beranda', 'Referensi Material WO']);
  });

  it('tidak pernah menampilkan menu UC-16', async () => {
    for (const role of ['PURCHASING', 'WAREHOUSE', 'PRODUCTION', 'MANAGEMENT'] as const) {
      sessionStore.setRole(role);
      expect(mountShell().text()).not.toContain('UC-16');
    }
  });

  it('Context Strip selalu menampilkan peran, gudang, dan mode', async () => {
    sessionStore.setRole('MANAGEMENT');
    const text = mountShell().text();
    expect(text).toContain('Peran:');
    expect(text).toContain('Management');
    expect(text).toContain('Gudang Bahan Baku (WH-01)');
    expect(text).toContain('MODE UJI');
  });
});
