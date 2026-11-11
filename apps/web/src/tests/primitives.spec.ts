import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseButton from '../components/primitives/BaseButton.vue';
import BaseInput from '../components/primitives/BaseInput.vue';
import BaseSelect from '../components/primitives/BaseSelect.vue';
import FormField from '../components/primitives/FormField.vue';
import StatusBadge from '../components/primitives/StatusBadge.vue';
import AlertBanner from '../components/primitives/AlertBanner.vue';

describe('BaseButton', () => {
  it('memakai type="button" secara default dan varian primary ukuran md', () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Simpan' } });
    const button = wrapper.get('button');
    expect(button.attributes('type')).toBe('button');
    expect(button.classes()).toContain('siris-button--primary');
    expect(button.classes()).toContain('siris-button--md');
  });

  it('meneruskan type="submit" ketika diminta', () => {
    const wrapper = mount(BaseButton, { props: { type: 'submit' }, slots: { default: 'Kirim' } });
    expect(wrapper.get('button').attributes('type')).toBe('submit');
  });

  it('mengirim event click saat aktif', async () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Simpan' } });
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('nonaktif: aria-disabled, tetap dapat difokuskan, klik diblokir, alasan terbaca', async () => {
    const wrapper = mount(BaseButton, {
      props: { disabled: true, disabledReason: 'Pilih berkas terlebih dahulu' },
      slots: { default: 'Unggah' },
    });
    const button = wrapper.get('button');
    expect(button.attributes('aria-disabled')).toBe('true');
    expect(button.attributes('disabled')).toBeUndefined();
    const describedBy = button.attributes('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(wrapper.get(`[id="${describedBy}"]`).text()).toBe('Pilih berkas terlebih dahulu');
    await button.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('loading: aria-busy, label kata kerja tampil, klik ganda diblokir', async () => {
    const wrapper = mount(BaseButton, {
      props: { loading: true, loadingLabel: 'Menyimpan…' },
      slots: { default: 'Simpan' },
    });
    const button = wrapper.get('button');
    expect(button.attributes('aria-busy')).toBe('true');
    expect(button.attributes('aria-disabled')).toBe('true');
    expect(button.text()).toContain('Menyimpan…');
    await button.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('tidak memakai opacity untuk keadaan nonaktif', () => {
    const wrapper = mount(BaseButton, { props: { disabled: true }, slots: { default: 'Simpan' } });
    expect(wrapper.get('button').attributes('style') ?? '').not.toContain('opacity');
  });
});

describe('FormField + BaseInput', () => {
  function mountField(props: Record<string, unknown> = {}) {
    return mount(FormField, {
      props: { label: 'Nama pengguna', ...props },
      slots: {
        default: `<template #default="{ id, ariaDescribedby, invalid, required }">
          <BaseInput :id="id" :aria-describedby="ariaDescribedby" :invalid="invalid" :required="required" />
        </template>`,
      },
      global: { components: { BaseInput } },
    });
  }

  it('mengaitkan label ke input lewat for/id', () => {
    const wrapper = mountField();
    const input = wrapper.get('input');
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'));
    expect(wrapper.get('label').text()).toContain('Nama pengguna');
  });

  it('menghubungkan hint lewat aria-describedby', () => {
    const wrapper = mountField({ hint: 'Gunakan email kantor' });
    const describedBy = wrapper.get('input').attributes('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(wrapper.get(`[id="${describedBy}"]`).text()).toBe('Gunakan email kantor');
  });

  it('galat: aria-invalid, role alert, teks galat terhubung ke input', () => {
    const wrapper = mountField({ hint: 'Petunjuk', error: 'Nama wajib diisi. Isi nama lalu coba lagi.' });
    const input = wrapper.get('input');
    expect(input.attributes('aria-invalid')).toBe('true');
    const ids = (input.attributes('aria-describedby') ?? '').split(' ');
    expect(ids).toHaveLength(2);
    const alert = wrapper.get('[role="alert"]');
    expect(ids).toContain(alert.attributes('id'));
    expect(alert.text()).toContain('Nama wajib diisi');
  });

  it('tanpa galat: tidak ada aria-invalid dan role alert', () => {
    const wrapper = mountField();
    expect(wrapper.get('input').attributes('aria-invalid')).toBeUndefined();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('wajib diisi ditandai dengan teks, bukan hanya simbol', () => {
    const wrapper = mountField({ required: true });
    expect(wrapper.get('label').text()).toContain('wajib diisi');
    expect(wrapper.get('input').attributes('required')).toBeDefined();
  });
});

describe('BaseInput', () => {
  it('mendukung v-model dan tipe password', async () => {
    const wrapper = mount(BaseInput, { props: { modelValue: '', type: 'password' } });
    const input = wrapper.get('input');
    expect(input.attributes('type')).toBe('password');
    await input.setValue('rahasia');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['rahasia']);
  });

  it('keadaan disabled memakai atribut native', () => {
    const wrapper = mount(BaseInput, { attrs: { disabled: true } });
    expect(wrapper.get('input').element.disabled).toBe(true);
  });
});

describe('BaseSelect', () => {
  const options = [
    { value: 'a', label: 'Gudang A' },
    { value: 'b', label: 'Gudang B' },
  ];

  it('merender opsi dan placeholder, serta mendukung v-model', async () => {
    const wrapper = mount(BaseSelect, {
      props: { options, placeholder: 'Pilih gudang', modelValue: '' },
    });
    const select = wrapper.get('select');
    expect(select.findAll('option').map((o) => o.text())).toEqual([
      'Pilih gudang',
      'Gudang A',
      'Gudang B',
    ]);
    await select.setValue('b');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b']);
  });

  it('meneruskan id dan aria-describedby ke elemen select', () => {
    const wrapper = mount(BaseSelect, {
      props: { options },
      attrs: { id: 'gudang', 'aria-describedby': 'gudang-hint' },
    });
    expect(wrapper.get('select').attributes('id')).toBe('gudang');
    expect(wrapper.get('select').attributes('aria-describedby')).toBe('gudang-hint');
  });

  it('loading: dinonaktifkan dengan teks "Memuat opsi…"', () => {
    const wrapper = mount(BaseSelect, { props: { options: [], loading: true } });
    const select = wrapper.get('select');
    expect(select.element.disabled).toBe(true);
    expect(select.attributes('aria-busy')).toBe('true');
    expect(select.text()).toContain('Memuat opsi…');
  });

  it('kosong: dinonaktifkan dengan teks yang menjelaskan keadaan', () => {
    const wrapper = mount(BaseSelect, { props: { options: [] } });
    expect(wrapper.get('select').element.disabled).toBe(true);
    expect(wrapper.get('select').text()).toContain('Tidak ada opsi tersedia');
  });

  it('galat: aria-invalid terpasang', () => {
    const wrapper = mount(BaseSelect, { props: { options, invalid: true } });
    expect(wrapper.get('select').attributes('aria-invalid')).toBe('true');
  });
});

describe('StatusBadge', () => {
  it('selalu menampilkan teks status dan menandai varian', () => {
    const wrapper = mount(StatusBadge, { props: { variant: 'danger' }, slots: { default: 'Ditolak' } });
    expect(wrapper.text()).toBe('Ditolak');
    expect(wrapper.classes()).toContain('siris-badge--danger');
  });

  it('varian default adalah neutral', () => {
    const wrapper = mount(StatusBadge, { slots: { default: 'Draf' } });
    expect(wrapper.classes()).toContain('siris-badge--neutral');
  });
});

describe('AlertBanner', () => {
  it('danger dan warning memakai role alert', () => {
    for (const variant of ['danger', 'warning'] as const) {
      const wrapper = mount(AlertBanner, { props: { variant }, slots: { default: 'Pesan' } });
      expect(wrapper.attributes('role')).toBe('alert');
    }
  });

  it('info dan success memakai role status', () => {
    for (const variant of ['info', 'success'] as const) {
      const wrapper = mount(AlertBanner, { props: { variant }, slots: { default: 'Pesan' } });
      expect(wrapper.attributes('role')).toBe('status');
    }
  });

  it('menampilkan judul dan pesan, ikon disembunyikan dari pembaca layar', () => {
    const wrapper = mount(AlertBanner, {
      props: { variant: 'warning', title: 'Perhatian' },
      slots: { default: 'Data belum lengkap' },
    });
    expect(wrapper.text()).toContain('Perhatian');
    expect(wrapper.text()).toContain('Data belum lengkap');
    expect(wrapper.get('svg').attributes('aria-hidden')).toBe('true');
  });

  it('dismissible: tombol tutup berlabel dan memicu event dismiss', async () => {
    const wrapper = mount(AlertBanner, { props: { dismissible: true }, slots: { default: 'Pesan' } });
    const close = wrapper.get('button');
    expect(close.attributes('aria-label')).toBe('Tutup pemberitahuan');
    expect(close.attributes('type')).toBe('button');
    await close.trigger('click');
    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });

  it('tanpa dismissible: tidak ada tombol', () => {
    const wrapper = mount(AlertBanner, { slots: { default: 'Pesan' } });
    expect(wrapper.find('button').exists()).toBe(false);
  });
});
