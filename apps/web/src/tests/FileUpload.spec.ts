import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import FileUpload from '../components/patterns/FileUpload.vue';

function berkas(nama = 'referensi.csv', isi = 'a,b\n1,2', ukuran?: number): File {
  const file = new File([isi], nama, { type: 'text/csv' });
  if (ukuran !== undefined) Object.defineProperty(file, 'size', { value: ukuran });
  return file;
}

function pilih(wrapper: VueWrapper, file: File) {
  const input = wrapper.get('input[type="file"]');
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
  return input.trigger('change');
}

function tombol(wrapper: VueWrapper, label: string) {
  return wrapper
    .findAll('button')
    .find((b) => b.element.querySelector('.siris-button__layer')?.textContent?.trim() === label);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FileUpload', () => {
  it('belum ada berkas: keadaan empty, tidak ada klaim sukses', () => {
    const wrapper = mount(FileUpload, { props: { file: null } });
    expect(wrapper.get('[data-state]').attributes('data-state')).toBe('empty');
    expect(wrapper.text()).toContain('Belum ada berkas dipilih.');
    expect(wrapper.text()).not.toContain('Berkas dipilih:');
    expect(tombol(wrapper, 'Pilih Berkas')).toBeTruthy();
    expect(tombol(wrapper, 'Hapus Berkas')).toBeUndefined();
  });

  it('tombol Pilih Berkas membuka pemilih berkas native', async () => {
    const klik = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const wrapper = mount(FileUpload, { props: { file: null } });
    await tombol(wrapper, 'Pilih Berkas')!.trigger('click');
    expect(klik).toHaveBeenCalledTimes(1);
  });

  it('memilih berkas sah mengirim event select dengan berkas tersebut', async () => {
    const wrapper = mount(FileUpload, { props: { file: null } });
    const file = berkas();
    await pilih(wrapper, file);
    expect(wrapper.emitted('select')).toEqual([[file]]);
  });

  it('keadaan sukses hanya muncul bila ada berkas: nama dan ukuran terbaca', () => {
    const wrapper = mount(FileUpload, { props: { file: berkas('stok.csv', 'x'.repeat(2048)) } });
    expect(wrapper.get('[data-state]').attributes('data-state')).toBe('success');
    expect(wrapper.text()).toContain('Berkas dipilih: stok.csv (2 KB)');
    expect(tombol(wrapper, 'Ganti Berkas')).toBeTruthy();
  });

  it('nama berkas yang sangat panjang tetap tampil utuh di DOM', () => {
    const panjang = `${'sangat-panjang-'.repeat(12)}.csv`;
    const wrapper = mount(FileUpload, { props: { file: berkas(panjang) } });
    expect(wrapper.text()).toContain(panjang);
  });

  it('jenis berkas tidak didukung: ditolak, galat eksplisit, tidak ada sukses', async () => {
    const wrapper = mount(FileUpload, { props: { file: null, accept: ['.csv', '.xlsx'] } });
    await pilih(wrapper, berkas('virus.exe'));
    expect(wrapper.emitted('select')).toEqual([[null]]);
    expect(wrapper.get('[data-state]').attributes('data-state')).toBe('incompatible');
    expect(wrapper.get('[role="alert"]').text()).toContain('Jenis berkas tidak didukung');
    expect(wrapper.text()).not.toContain('Berkas dipilih:');
  });

  it('pemeriksaan ekstensi tidak peka huruf besar-kecil', async () => {
    const wrapper = mount(FileUpload, { props: { file: null, accept: ['.csv'] } });
    const file = berkas('DATA.CSV');
    await pilih(wrapper, file);
    expect(wrapper.emitted('select')).toEqual([[file]]);
  });

  it('ukuran melebihi batas: ditolak dengan pesan ukuran', async () => {
    const wrapper = mount(FileUpload, {
      props: { file: null, maxSizeBytes: 5 * 1024 * 1024 },
    });
    await pilih(wrapper, berkas('besar.csv', 'x', 6 * 1024 * 1024));
    expect(wrapper.emitted('select')).toEqual([[null]]);
    expect(wrapper.get('[data-state]').attributes('data-state')).toBe('oversize');
    expect(wrapper.get('[role="alert"]').text()).toContain('melebihi 5 MB');
  });

  it('berkas kosong ditolak', async () => {
    const wrapper = mount(FileUpload, { props: { file: null } });
    await pilih(wrapper, berkas('kosong.csv', ''));
    expect(wrapper.emitted('select')).toEqual([[null]]);
    expect(wrapper.get('[role="alert"]').text()).toContain('Berkas kosong');
  });

  it('galat dari layanan ditampilkan sebagai keadaan error', () => {
    const wrapper = mount(FileUpload, {
      props: { file: berkas(), error: 'Kolom wajib tidak ditemukan.' },
    });
    expect(wrapper.get('[data-state]').attributes('data-state')).toBe('error');
    expect(wrapper.get('[role="alert"]').text()).toContain('Kolom wajib tidak ditemukan.');
    expect(wrapper.text()).not.toContain('Berkas dipilih:');
  });

  it('berkas yang sama dapat dipilih ulang: nilai input dikosongkan setiap pemilihan', async () => {
    const wrapper = mount(FileUpload, { props: { file: null } });
    const file = berkas();
    const input = wrapper.get('input[type="file"]').element as HTMLInputElement;
    // Nilai input di jsdom selalu kosong; pencatat memastikan komponen benar-benar mengosongkannya.
    const penulisan: string[] = [];
    Object.defineProperty(input, 'value', {
      configurable: true,
      get: () => '',
      set: (nilai: string) => penulisan.push(nilai),
    });
    await pilih(wrapper, file);
    await pilih(wrapper, file);
    expect(wrapper.emitted('select')).toEqual([[file], [file]]);
    expect(penulisan).toEqual(['', '']);
  });

  it('pilihan sah setelah penolakan menghapus galat', async () => {
    const wrapper = mount(FileUpload, { props: { file: null, accept: ['.csv'] } });
    await pilih(wrapper, berkas('salah.exe'));
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    await pilih(wrapper, berkas('benar.csv'));
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('Hapus Berkas mengirim select(null)', async () => {
    const wrapper = mount(FileUpload, { props: { file: berkas() } });
    await tombol(wrapper, 'Hapus Berkas')!.trigger('click');
    expect(wrapper.emitted('select')).toEqual([[null]]);
  });

  it('nonaktif: aria-disabled dengan alasan, tidak ada Hapus Berkas', () => {
    const wrapper = mount(FileUpload, {
      props: { file: berkas(), disabled: true, disabledReason: 'Proses berjalan' },
    });
    const pilihTombol = wrapper.findAll('button')[0];
    expect(pilihTombol.attributes('aria-disabled')).toBe('true');
    expect(wrapper.text()).toContain('Proses berjalan');
    expect(tombol(wrapper, 'Hapus Berkas')).toBeUndefined();
  });

  it('progres unggah dibatasi 0 sampai 100 dan diberi label', () => {
    const wrapper = mount(FileUpload, { props: { file: berkas(), progress: 140 } });
    const progres = wrapper.get('progress');
    expect(progres.attributes('aria-label')).toBe('Progres unggah');
    expect(progres.attributes('value')).toBe('100');
    expect(wrapper.text()).toContain('100%');
  });

  it('petunjuk format dan ukuran dikaitkan ke tombol lewat aria-describedby', () => {
    const wrapper = mount(FileUpload, {
      props: { file: null, accept: ['.csv'], maxSizeBytes: 1024 * 1024 },
    });
    const ids = (wrapper.get('button').attributes('aria-describedby') ?? '').split(' ');
    const teks = ids.map((id) => wrapper.get(`[id="${id}"]`).text()).join(' ');
    expect(teks).toContain('Format: .csv.');
    expect(teks).toContain('Ukuran maksimum 1 MB.');
  });
});
