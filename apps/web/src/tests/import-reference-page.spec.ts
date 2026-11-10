import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import ImportReferencePage from '../pages/inbound/ImportReferencePage.vue';

describe('Halaman simulasi impor referensi', () => {
  it('tidak mengaktifkan simulator tanpa konfigurasi eksplisit', () => {
    vi.stubEnv('VITE_ENABLE_IMPORT_SIMULATOR', '');
    const wrapper = mount(ImportReferencePage);
    expect(wrapper.get('#warehouse').attributes('disabled')).toBeDefined();
    vi.unstubAllEnvs();
  });
  it('mewajibkan konteks dan file, lalu menandai hasil sebagai simulasi', async () => {
    vi.stubEnv('VITE_ENABLE_IMPORT_SIMULATOR', 'true');
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
    const wrapper = mount(ImportReferencePage);
    const upload = wrapper.find('button');
    expect(upload.attributes('disabled')).toBeDefined();
    await wrapper.get('#warehouse').setValue('GUDANG-UJI');
    const input = wrapper.get('#source-file');
    Object.defineProperty(input.element, 'files', { value: [new File(['UJI'], 'uji.csv')], configurable: true });
    await input.trigger('change');
    expect(upload.attributes('disabled')).toBeUndefined();
    await upload.trigger('click'); await flushPromises();
    expect(wrapper.text()).toContain('isi file belum divalidasi server');
    const confirm = wrapper.findAll('button').find((button) => button.text() === 'Konfirmasi simulasi');
    expect(confirm?.attributes('disabled')).toBeDefined();
    await wrapper.get('input[type="checkbox"]').setValue(true);
    await confirm?.trigger('click'); await flushPromises();
    expect(wrapper.text()).toContain('Tidak ada transaksi database');
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });
});
