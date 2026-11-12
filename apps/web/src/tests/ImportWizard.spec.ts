import { describe, it, expect, afterEach } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import ImportWizard from '../components/patterns/ImportWizard.vue';
import ValidationReport from '../components/patterns/ValidationReport.vue';
import {
  IMPORT_STEPS,
  stepForPhase,
  type ImportContext,
  type ImportPreview,
  type ImportWizardState,
} from '../shared/import/import-wizard-types';

const konteks: ImportContext = { warehouseId: 'WH-01', mode: 'UJI' };
const berkas = () => new File(['a,b\n1,2'], 'referensi.csv', { type: 'text/csv' });

type Props = InstanceType<typeof ImportWizard>['$props'];

function pasang(state: ImportWizardState, props: Partial<Props> = {}) {
  return mount(ImportWizard, {
    attachTo: document.body,
    props: {
      context: konteks,
      state,
      file: berkas(),
      uploadProgress: null,
      importLabel: 'Referensi Inbound',
      ...props,
    },
  });
}

function tombol(wrapper: VueWrapper, label: string) {
  return wrapper
    .findAll('button')
    .find((b) => b.element.querySelector('.siris-button__layer')?.textContent?.trim() === label);
}

function labelTombol(wrapper: VueWrapper): string[] {
  return wrapper
    .findAll('button')
    .map((b) => b.element.querySelector('.siris-button__layer')?.textContent?.trim() ?? '');
}

const preview = (tambahan: Partial<ImportPreview> = {}): ImportPreview => ({
  batchId: 'B-100',
  fingerprint: 'fp-1',
  warnings: [],
  ...tambahan,
});

let aktif: VueWrapper | undefined;
afterEach(() => {
  aktif?.unmount();
  aktif = undefined;
});
function mountTrack(state: ImportWizardState, props: Partial<Props> = {}) {
  aktif = pasang(state, props);
  return aktif;
}

describe('ImportWizard: tahap dan stepper', () => {
  it('menampilkan tepat empat tahap berurutan dengan aria-current pada tahap saat ini', () => {
    const wrapper = mountTrack({ phase: 'initial' });
    const items = wrapper.findAll('ol li');
    expect(items).toHaveLength(4);
    expect(IMPORT_STEPS).toEqual(['Pilih File', 'Hasil Validasi', 'Preview', 'Hasil Simpan']);
    expect(items.map((li) => li.attributes('aria-current'))).toEqual(['step', undefined, undefined, undefined]);
    expect(wrapper.text()).toContain('Tahap 1 dari 4 — Pilih File');
  });

  it.each<[ImportWizardState, number]>([
    [{ phase: 'initial' }, 1],
    [{ phase: 'uploading' }, 1],
    [{ phase: 'error', message: 'x' }, 1],
    [{ phase: 'validating' }, 2],
    [{ phase: 'invalid', batchId: 'B', issues: [] }, 2],
    [{ phase: 'preparation-unknown' }, 2],
    [{ phase: 'preview', preview: preview() }, 3],
    [{ phase: 'expired', batchId: 'B' }, 3],
    [{ phase: 'committing' }, 3],
    [{ phase: 'success', receipt: { batchId: 'B', state: 'COMMITTED' } }, 4],
    [{ phase: 'unknown', batchId: 'B', idempotencyKey: 'k' }, 4],
    [{ phase: 'cancelling', batchId: 'B' }, 4],
    [{ phase: 'cancelled', batchId: 'B' }, 4],
    [{ phase: 'cancel-unknown', batchId: 'B' }, 4],
  ])('status %j berada pada tahap %i', (state, tahap) => {
    const wrapper = mountTrack(state);
    const nama = IMPORT_STEPS[tahap - 1];
    expect(wrapper.text()).toContain(`Tahap ${tahap} dari 4 — ${nama}`);
    const saatIni = wrapper.findAll('ol li').findIndex((li) => li.attributes('aria-current') === 'step');
    expect(saatIni + 1).toBe(tahap);
  });

  it('tahap setelah yang aktif tidak dapat dilewati: stepper bukan kontrol interaktif', () => {
    const wrapper = mountTrack({ phase: 'initial' });
    expect(wrapper.findAll('ol li button, ol li a')).toHaveLength(0);
  });

  it('fokus pindah ke judul tahap setelah tahap berubah, bukan saat pertama tampil', async () => {
    const wrapper = mountTrack({ phase: 'initial' });
    expect(document.activeElement).not.toBe(wrapper.get('h2').element);
    await wrapper.setProps({ state: { phase: 'preview', preview: preview() } });
    await nextTick();
    expect(document.activeElement).toBe(wrapper.get('h2').element);
    expect(wrapper.get('h2').text()).toBe('Preview');
  });
});

describe('ImportWizard: Pilih File', () => {
  it('tanpa berkas: Validasi nonaktif beralasan dan tidak mengirim submit', async () => {
    const wrapper = mountTrack({ phase: 'initial' }, { file: null });
    const validasi = tombol(wrapper, 'Validasi')!;
    expect(validasi.attributes('aria-disabled')).toBe('true');
    expect(wrapper.text()).toContain('Pilih berkas terlebih dahulu');
    await validasi.trigger('click');
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('tanpa berkas tidak ada klaim valid, preview, atau tombol Simpan', () => {
    const wrapper = mountTrack({ phase: 'initial' }, { file: null });
    expect(wrapper.text()).not.toMatch(/valid(?!asi)/i);
    expect(labelTombol(wrapper)).not.toContain('Simpan');
    expect(wrapper.text()).toContain('Belum ada berkas dipilih.');
  });

  it('gudang kosong: Validasi nonaktif dengan alasan gudang', () => {
    const wrapper = mountTrack({ phase: 'initial' }, { context: { warehouseId: '  ', mode: 'UJI' } });
    expect(tombol(wrapper, 'Validasi')!.attributes('aria-disabled')).toBe('true');
    expect(wrapper.text()).toContain('Isi gudang terlebih dahulu');
  });

  it('berkas dan gudang lengkap: Validasi mengirim submit', async () => {
    const wrapper = mountTrack({ phase: 'initial' });
    const validasi = tombol(wrapper, 'Validasi')!;
    expect(validasi.attributes('aria-disabled')).toBeUndefined();
    await validasi.trigger('click');
    expect(wrapper.emitted('submit')).toHaveLength(1);
  });

  it('konteks null memakai gudang kosong dan mode UJI sebagai bawaan', async () => {
    const wrapper = mountTrack({ phase: 'initial' }, { context: null });
    await wrapper.get('input[autocomplete="off"]').setValue('WH-09');
    expect(wrapper.emitted('changeContext')).toEqual([[{ warehouseId: 'WH-09', mode: 'UJI' }]]);
  });

  it('mengubah mode mengirim changeContext dengan gudang yang sama', async () => {
    const wrapper = mountTrack({ phase: 'initial' });
    await wrapper.get('select').setValue('ACTUAL');
    expect(wrapper.emitted('changeContext')).toEqual([[{ warehouseId: 'WH-01', mode: 'ACTUAL' }]]);
  });

  it('memilih berkas meneruskan selectFile', async () => {
    const wrapper = mountTrack({ phase: 'initial' }, { file: null });
    const file = berkas();
    const input = wrapper.get('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
    await input.trigger('change');
    expect(wrapper.emitted('selectFile')).toEqual([[file]]);
  });

  it('uploading: Validasi loading, progres tampil, kolom dan pemilih berkas terkunci', async () => {
    const wrapper = mountTrack({ phase: 'uploading' }, { uploadProgress: 42 });
    const validasi = wrapper.findAll('button').find((b) => b.attributes('aria-busy') === 'true')!;
    expect(validasi).toBeTruthy();
    expect(wrapper.get('progress').attributes('value')).toBe('42');
    expect(wrapper.get('input[autocomplete="off"]').attributes('disabled')).toBeDefined();
    await validasi.trigger('click');
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('error persiapan: banner danger tanpa klaim sukses', () => {
    const wrapper = mountTrack({ phase: 'error', message: 'Impor belum siap. Coba kembali.' });
    expect(wrapper.get('[role="alert"]').text()).toContain('Impor belum siap. Coba kembali.');
    expect(wrapper.text()).not.toContain('Impor tersimpan');
  });
});

describe('ImportWizard: Hasil Validasi', () => {
  it('validating: status ditampilkan dan tidak ada tindakan ganda', () => {
    const wrapper = mountTrack({ phase: 'validating' });
    expect(wrapper.text()).toContain('Memvalidasi berkas');
    expect(wrapper.findAll('button')).toHaveLength(0);
  });

  it('INVALID tampil sebagai laporan temuan yang sah, bukan galat transport', async () => {
    const wrapper = mountTrack({
      phase: 'invalid',
      batchId: 'B-7',
      issues: [
        { row: 3, field: 'qty', message: 'Kuantitas harus angka.' },
        { message: 'Header tidak lengkap.' },
      ],
    });
    expect(wrapper.text()).toContain('Berkas belum valid');
    expect(wrapper.text()).toContain('2 temuan perlu diperbaiki.');
    const baris = wrapper.findAll('tbody tr').map((tr) => tr.findAll('td').map((td) => td.text()));
    expect(baris).toEqual([
      ['3', 'qty', 'Kuantitas harus angka.'],
      ['—', '—', 'Header tidak lengkap.'],
    ]);
    expect(wrapper.text()).not.toContain('Impor tersimpan');
  });

  it('INVALID mengunci Preview dan Simpan; hanya Ganti Berkas dan Batal', async () => {
    const wrapper = mountTrack({ phase: 'invalid', batchId: 'B-7', issues: [{ message: 'x' }] });
    expect(labelTombol(wrapper)).toEqual(['Ganti Berkas', 'Batal']);
    await tombol(wrapper, 'Ganti Berkas')!.trigger('click');
    await tombol(wrapper, 'Batal')!.trigger('click');
    expect(wrapper.emitted('back')).toHaveLength(1);
    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });

  it('INVALID tanpa rincian baris tidak boleh dianggap valid', () => {
    const wrapper = mount(ValidationReport, { props: { issues: [] } });
    expect(wrapper.text()).toContain('tidak dapat dianggap valid');
    expect(wrapper.find('table').exists()).toBe(false);
  });

  it('persiapan tidak pasti: peringatan bukan sukses, hanya Periksa Status', async () => {
    const wrapper = mountTrack({ phase: 'preparation-unknown', batchId: 'B-9' });
    expect(wrapper.text()).toContain('Hasil persiapan belum pasti');
    expect(wrapper.text()).toContain('B-9');
    expect(labelTombol(wrapper)).toEqual(['Periksa Status']);
    await tombol(wrapper, 'Periksa Status')!.trigger('click');
    expect(wrapper.emitted('checkStatus')).toHaveLength(1);
  });
});

describe('ImportWizard: Preview dan konfirmasi', () => {
  it('ringkasan konfirmasi: nilai yang tidak dikirim layanan ditulis Tidak tersedia', () => {
    const wrapper = mountTrack({
      phase: 'preview',
      preview: preview({ rowCount: 120, expiresAt: 'bukan-tanggal' }),
    });
    const teks = wrapper.get('dl').text();
    expect(teks).toContain('Referensi Inbound');
    expect(teks).toContain('WH-01');
    expect(teks).toContain('UJI');
    expect(teks).toContain('referensi.csv');
    expect(teks).toContain('120');
    expect(teks).toMatch(/Sumber\s*Tidak tersedia/);
    expect(teks).toContain('B-100');
    expect(teks).toContain('bukan-tanggal');
  });

  it('tanpa warning: Simpan aktif dan confirm membawa daftar kosong', async () => {
    const wrapper = mountTrack({ phase: 'preview', preview: preview() });
    const simpan = tombol(wrapper, 'Simpan')!;
    expect(simpan.attributes('aria-disabled')).toBeUndefined();
    await simpan.trigger('click');
    expect(wrapper.emitted('confirm')).toEqual([[[]]]);
  });

  it('dengan warning: Simpan terkunci sampai semua warning diakui', async () => {
    const wrapper = mountTrack({
      phase: 'preview',
      preview: preview({ warnings: ['Tanggal kosong pada 2 baris', 'Satuan tidak baku'] }),
    });
    const simpan = () => tombol(wrapper, 'Simpan')!;
    expect(simpan().attributes('aria-disabled')).toBe('true');
    expect(wrapper.text()).toContain('Akui semua warning sebelum menyimpan');
    await simpan().trigger('click');
    expect(wrapper.emitted('confirm')).toBeUndefined();

    const kotak = wrapper.findAll('input[type="checkbox"]');
    expect(kotak).toHaveLength(2);
    await kotak[0].setValue(true);
    expect(simpan().attributes('aria-disabled')).toBe('true');
    await kotak[1].setValue(true);
    expect(simpan().attributes('aria-disabled')).toBeUndefined();
    await simpan().trigger('click');
    expect(wrapper.emitted('confirm')).toEqual([[['Tanggal kosong pada 2 baris', 'Satuan tidak baku']]]);
  });

  it('warning berupa objek ber-ID: confirm membawa ID, pesan ditampilkan', async () => {
    const wrapper = mountTrack({
      phase: 'preview',
      preview: preview({ warnings: [{ id: 'W-DATE', message: 'Tanggal kosong' }] }),
    });
    expect(wrapper.text()).toContain('Tanggal kosong');
    await wrapper.get('input[type="checkbox"]').setValue(true);
    await tombol(wrapper, 'Simpan')!.trigger('click');
    expect(wrapper.emitted('confirm')).toEqual([[['W-DATE']]]);
  });

  it('warning duplikat hanya ditampilkan sekali', () => {
    const wrapper = mountTrack({
      phase: 'preview',
      preview: preview({ warnings: ['sama', 'sama'] }),
    });
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(1);
  });

  it('preview baru (fingerprint berbeda) menghapus pengakuan warning sebelumnya', async () => {
    const wrapper = mountTrack({
      phase: 'preview',
      preview: preview({ warnings: ['w1'] }),
    });
    await wrapper.get('input[type="checkbox"]').setValue(true);
    expect(tombol(wrapper, 'Simpan')!.attributes('aria-disabled')).toBeUndefined();
    await wrapper.setProps({
      state: { phase: 'preview', preview: preview({ fingerprint: 'fp-2', warnings: ['w1'] }) },
    });
    expect((wrapper.get('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(false);
    expect(tombol(wrapper, 'Simpan')!.attributes('aria-disabled')).toBe('true');
  });

  it('committing: Simpan loading, Kembali dan Batal terkunci, tidak ada event ganda', async () => {
    const wrapper = mountTrack({ phase: 'committing' });
    const sibuk = wrapper.findAll('button').find((b) => b.attributes('aria-busy') === 'true')!;
    expect(sibuk.text()).toContain('Menyimpan…');
    await sibuk.trigger('click');
    await tombol(wrapper, 'Kembali')!.trigger('click');
    await tombol(wrapper, 'Batal')!.trigger('click');
    expect(wrapper.emitted('confirm')).toBeUndefined();
    expect(wrapper.emitted('back')).toBeUndefined();
    expect(wrapper.emitted('cancel')).toBeUndefined();
  });

  it('Kembali dan Batal mengirim niat pengguna saat preview', async () => {
    const wrapper = mountTrack({ phase: 'preview', preview: preview() });
    await tombol(wrapper, 'Kembali')!.trigger('click');
    await tombol(wrapper, 'Batal')!.trigger('click');
    expect(wrapper.emitted('back')).toHaveLength(1);
    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });

  it('kedaluwarsa: Simpan hilang, hanya Validasi Ulang dan Batal', async () => {
    const wrapper = mountTrack({ phase: 'expired', batchId: 'B-100' });
    expect(wrapper.text()).toContain('Preview kedaluwarsa');
    expect(labelTombol(wrapper)).toEqual(['Validasi Ulang', 'Batal']);
    await tombol(wrapper, 'Validasi Ulang')!.trigger('click');
    expect(wrapper.emitted('revalidate')).toHaveLength(1);
  });
});

describe('ImportWizard: Hasil Simpan', () => {
  it('sukses hanya dari receipt COMMITTED, dengan batch dan Mulai Impor Baru', async () => {
    const wrapper = mountTrack({ phase: 'success', receipt: { batchId: 'B-100', state: 'COMMITTED' } });
    expect(wrapper.text()).toContain('Impor tersimpan');
    expect(wrapper.text()).toContain('B-100');
    await tombol(wrapper, 'Mulai Impor Baru')!.trigger('click');
    expect(wrapper.emitted('restart')).toHaveLength(1);
  });

  it('hasil commit tidak pasti tidak dinyatakan sukses dan tidak menawarkan Simpan ulang', async () => {
    const wrapper = mountTrack({ phase: 'unknown', batchId: 'B-100', idempotencyKey: 'key-1' });
    expect(wrapper.text()).toContain('Hasil penyimpanan belum dapat dikonfirmasi');
    expect(wrapper.text()).not.toContain('Impor tersimpan');
    expect(wrapper.get('[role="alert"]').text()).toContain('B-100');
    expect(labelTombol(wrapper)).toEqual(['Periksa Status']);
    await tombol(wrapper, 'Periksa Status')!.trigger('click');
    expect(wrapper.emitted('checkStatus')).toHaveLength(1);
    expect(wrapper.emitted('confirm')).toBeUndefined();
  });

  it('pembatalan: cancelling tanpa tindakan, cancelled boleh mulai baru, cancel-unknown periksa status', async () => {
    const proses = mountTrack({ phase: 'cancelling', batchId: 'B-1' });
    expect(proses.text()).toContain('Pembatalan sedang diproses');
    expect(proses.findAll('button')).toHaveLength(0);
    proses.unmount();

    const batal = mountTrack({ phase: 'cancelled', batchId: 'B-1' });
    expect(labelTombol(batal)).toEqual(['Mulai Impor Baru']);
    batal.unmount();

    const tidakPasti = mountTrack({ phase: 'cancel-unknown', batchId: 'B-1' });
    expect(tidakPasti.text()).toContain('Hasil pembatalan belum pasti');
    expect(labelTombol(tidakPasti)).toEqual(['Periksa Status']);
  });
});

describe('ImportWizard: status baru dan kompatibilitas', () => {
  it('status yang belum dikenal mengunci semua tindakan dan tidak dianggap sukses', () => {
    const wrapper = mountTrack({ phase: 'committing-v2' } as unknown as ImportWizardState);
    expect(wrapper.text()).toContain('Status proses belum didukung');
    expect(wrapper.text()).toContain('committing-v2');
    expect(wrapper.findAll('button')).toHaveLength(0);
    expect(wrapper.text()).not.toContain('Impor tersimpan');
    expect(stepForPhase('committing-v2')).toBeUndefined();
  });

  it('state dari boundary PR #11 dapat diberikan langsung (tipe lokal kompatibel)', () => {
    // Salinan bentuk `ImportState` pada PR #11 (reference-import.ts); bila bentuk itu berubah,
    // pemeriksaan tipe di sini yang harus gagal lebih dulu.
    type Pr11State =
      | { phase: 'initial' }
      | { phase: 'uploading' | 'validating' | 'committing' }
      | {
          phase: 'preview';
          preview: { batchId: string; fingerprint: string; warnings: string[]; expiresAt?: string };
        }
      | { phase: 'expired'; batchId: string }
      | { phase: 'success'; receipt: { batchId: string; state: 'COMMITTED' } }
      | { phase: 'error'; message: string }
      | { phase: 'unknown'; batchId: string; idempotencyKey: string }
      | { phase: 'preparation-unknown'; batchId?: string };
    const dariPr11: Pr11State = {
      phase: 'preview',
      preview: { batchId: 'B-1', fingerprint: 'fp', warnings: ['peringatan'] },
    };
    const wrapper = mountTrack(dariPr11);
    expect(wrapper.text()).toContain('Tahap 3 dari 4 — Preview');
    expect(wrapper.text()).toContain('peringatan');
  });
});
