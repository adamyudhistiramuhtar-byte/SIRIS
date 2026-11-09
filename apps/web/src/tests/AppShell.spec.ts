import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import AppShell from '../layouts/AppShell.vue';

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
    expect(text).toContain('Persediaan');
    expect(text).toContain('Referensi');
    expect(text).toContain('Pengawasan');
  });
});
