import { describe, it, expect, afterEach, vi } from 'vitest';
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ImportStockPage from '../pages/inventory/ImportStockPage.vue';
import { createSessionStore, DEFAULT_UJI_CONTEXT, type SessionContext } from '../shared/session/session-context';
import { parseStockFixture } from '../shared/import/stock-fixture-adapter';
import {
  COMMIT_UNAVAILABLE_MESSAGE,
  createStockFixtureService,
} from '../shared/import/stock-fixture-service';

/**
 * SRS-25 (UC-09): halaman impor stok pada adapter fixture QTY AKHIR.
 * Menguji halaman, wizard, dan adapter fixture di sisi klien. BUKAN uji API, basis data,
 * sesi nyata, atau commit atomik; hasilnya bukan bukti integrasi/E2E.
 */

// Vitest dijalankan dari akar repositori; jsdom membuat import.meta.url bukan skema file.
const fixturePath = resolve(process.cwd(), 'database/fixtures/uji/stock.proposed-0.1.json');
const fixtureText = readFileSync(fixturePath, 'utf8');
const fixture = JSON.parse(fixtureText) as {
  metadata: Record<string, unknown>;
  rows: unknown[];
};

const TWO_WAREHOUSES: SessionContext = {
  ...DEFAULT_UJI_CONTEXT,
  role: 'WAREHOUSE',
  warehouses: [
    { id: 'WH-01', code: 'WH-01', name: 'Gudang Bahan Baku' },
    { id: 'WH-02', code: 'WH-02', name: 'Gudang Barang Jadi' },
  ],
};

const mounted: VueWrapper[] = [];
afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount());
});

function pasang(context: SessionContext = TWO_WAREHOUSES) {
  const session = createSessionStore(context);
  const { service, source } = createStockFixtureService();
  const wrapper = mount(ImportStockPage, { attachTo: document.body, props: { session, service, source } });
  mounted.push(wrapper);
  return { wrapper, session };
}

function tombol(wrapper: VueWrapper, label: string) {
  return wrapper
    .findAll('button')
    .find((b) => b.element.querySelector('.siris-button__layer')?.textContent?.trim() === label);
}

async function pilihBerkas(wrapper: VueWrapper, name: string, content: string) {
  const file = new File([content], name, { type: 'application/json' });
  const input = wrapper.find('input[type="file"]');
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
  await input.trigger('change');
  await flushPromises();
}

// Pembacaan berkas lewat FileReader di jsdom tidak selesai pada flushPromises; tunggu hasilnya
// pindah dari tahap 1 (hasil validasi selalu tahap 2 atau 3).
async function validasi(wrapper: VueWrapper) {
  await tombol(wrapper, 'Validasi')!.trigger('click');
  await vi.waitFor(() => expect(wrapper.text()).not.toContain('Tahap 1 dari 4'));
  await flushPromises();
}

const withoutCutoff = () => {
  const metadata = { ...fixture.metadata };
  delete metadata.cutoff_id;
  return JSON.stringify({ ...JSON.parse(fixtureText), metadata });
};

describe('SRS-25 adapter fixture QTY AKHIR (parseStockFixture)', () => {
  it('menerima fixture saldo UJI dan mempertahankan kuantitas sebagai string persis', () => {
    const result = parseStockFixture(fixtureText);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.rows.map((r) => [r.materialCode, r.uom, r.systemQuantity])).toEqual([
      ['UJI-MAT-01', 'KG', '10.000000'],
      ['UJI-MAT-02', 'L', '7.250000'],
    ]);
    expect(result.value.cutoff).toEqual({ cutoffId: fixture.metadata.cutoff_id });
    // Jam cutoff tidak dikarang (CF-04 OPEN).
    expect(result.value.cutoff.time).toBeUndefined();
  });

  it('UJI-STK-NEG-03: metadata tanpa cutoff_id ditolak INVALID_METADATA (keputusan PM 25 Nov)', () => {
    const result = parseStockFixture(withoutCutoff());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((i) => i.code)).toEqual(['INVALID_METADATA']);
  });

  it('isi berkas yang tidak valid tetap INVALID_FILE (bukan JSON, jenis salah, kuantitas bukan desimal)', () => {
    const base = JSON.parse(fixtureText);
    const badQuantity = JSON.stringify({
      ...base,
      rows: [{ row_number: 1, normalized: { material_code: 'M', uom: 'KG', system_quantity: '1e3' } }],
    });
    const wrongKind = JSON.stringify({ ...base, kind: 'COUNT' });
    for (const text of ['{bukan json', wrongKind, badQuantity, '[]']) {
      const result = parseStockFixture(text);
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.issues.every((i) => i.code === 'INVALID_FILE')).toBe(true);
    }
  });

  it('menolak nomor baris ganda dengan menyebut barisnya', () => {
    const base = JSON.parse(fixtureText);
    const row = { row_number: 1, normalized: { material_code: 'M', uom: 'KG', system_quantity: '1' } };
    const result = parseStockFixture(JSON.stringify({ ...base, rows: [row, row] }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]).toMatchObject({ row: 1, field: 'row_number', code: 'INVALID_FILE' });
  });

  it('tidak menjumlah dan tidak menghitung: setiap baris membawa nilai QTY AKHIR sendiri', () => {
    const base = JSON.parse(fixtureText);
    const rows = [1, 2, 3].map((n) => ({
      row_number: n,
      normalized: { material_code: `UJI-M-${n}`, uom: 'KG', system_quantity: String(n * 100) },
    }));
    const result = parseStockFixture(JSON.stringify({ ...base, rows }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.rows.map((r) => r.systemQuantity)).toEqual(['100', '200', '300']);
  });
});

describe('SRS-25 halaman impor stok: pemilihan konteks', () => {
  it('menampilkan label UJI dan tidak menyatakan terhubung ke API', () => {
    const { wrapper } = pasang();
    expect(wrapper.text()).toContain('Impor Data Stok');
    expect(wrapper.text()).toContain('Data simulasi (UJI)');
    expect(wrapper.text()).toContain('Belum terhubung ke API');
  });

  it('gudang di luar assignment ditolak oleh store sesi dan pemberitahuan tampil', async () => {
    const { wrapper, session } = pasang();
    const gudang = wrapper.find('input[autocomplete="off"]');
    await gudang.setValue('WH-99');
    await flushPromises();
    expect(session.state.activeWarehouseId).toBe('WH-01');
    expect(wrapper.text()).toContain('Gudang tersebut bukan assignment akun ini.');
  });

  it('gudang dalam assignment diterima dan menjadi konteks wizard', async () => {
    const { wrapper, session } = pasang();
    await wrapper.find('input[autocomplete="off"]').setValue('WH-02');
    await flushPromises();
    expect(session.state.activeWarehouseId).toBe('WH-02');
    expect((wrapper.find('input[autocomplete="off"]').element as HTMLInputElement).value).toBe('WH-02');
  });

  it('mode ACTUAL ditolak: mode tetap UJI dan pemberitahuan tampil', async () => {
    const { wrapper, session } = pasang();
    await wrapper.find('select').setValue('ACTUAL');
    await flushPromises();
    expect(session.state.mode).toBe('UJI');
    expect(wrapper.text()).toContain('Mode ACTUAL belum diaktifkan.');
  });

  it('tanpa gudang aktif, Validasi tidak mengirim apa pun', async () => {
    const { wrapper } = pasang({ ...TWO_WAREHOUSES, activeWarehouseId: null });
    await pilihBerkas(wrapper, 'saldo.json', fixtureText);
    const validate = tombol(wrapper, 'Validasi')!;
    expect(validate.attributes('aria-disabled') === 'true' || validate.attributes('disabled') !== undefined).toBe(true);
    await validate.trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Tahap 1 dari 4');
  });
});

describe('SRS-25 halaman impor stok: invalid', () => {
  it('berkas dengan isi tidak valid tampil sebagai laporan temuan dan tidak ada Simpan', async () => {
    const { wrapper } = pasang();
    await pilihBerkas(wrapper, 'saldo.json', '{bukan json');
    await validasi(wrapper);
    expect(wrapper.text()).toContain('Berkas belum valid');
    // ValidationReport menampilkan baris, kolom, dan pesan (kode tidak ditampilkan).
    expect(wrapper.text()).toContain('Isi berkas bukan JSON yang dapat dibaca.');
    expect(tombol(wrapper, 'Simpan')).toBeUndefined();
    expect(wrapper.find('.siris-stock-preview').exists()).toBe(false);
  });

  it('metadata tanpa cutoff_id ditolak dan alasannya tampil', async () => {
    const { wrapper } = pasang();
    await pilihBerkas(wrapper, 'saldo.json', withoutCutoff());
    await validasi(wrapper);
    expect(wrapper.text()).toContain('Metadata wajib memuat cutoff_id');
    expect(tombol(wrapper, 'Simpan')).toBeUndefined();
  });

  it('berkas berekstensi lain ditolak sebelum dikirim', async () => {
    const { wrapper } = pasang();
    await pilihBerkas(wrapper, 'saldo.csv', 'a,b');
    expect(wrapper.text()).toContain('Jenis berkas tidak didukung');
    expect(tombol(wrapper, 'Validasi')?.attributes('aria-disabled') === 'true'
      || tombol(wrapper, 'Validasi')?.attributes('disabled') !== undefined).toBe(true);
  });
});

describe('SRS-25 halaman impor stok: preview', () => {
  it('berkas valid menampilkan preview saldo, cutoff, dan mode tanpa baris total', async () => {
    const { wrapper } = pasang();
    await pilihBerkas(wrapper, 'saldo.json', fixtureText);
    await validasi(wrapper);
    expect(wrapper.text()).toContain('Tahap 3 dari 4');
    const preview = wrapper.find('.siris-stock-preview');
    expect(preview.exists()).toBe(true);
    expect(preview.text()).toContain('UJI-MAT-01');
    expect(preview.text()).toContain('10,000000');
    expect(preview.text()).toContain('7,250000');
    expect(preview.text()).toContain('UJI (data simulasi)');
    expect(preview.text().toLowerCase()).not.toContain('total');
  });

  it('Simpan terkunci sampai warning opsional diakui', async () => {
    const { wrapper } = pasang();
    await pilihBerkas(wrapper, 'saldo.json', fixtureText);
    await validasi(wrapper);
    expect(wrapper.text()).toContain('Komponen dukungan opsional');
    const simpan = tombol(wrapper, 'Simpan')!;
    expect(simpan.attributes('aria-disabled') === 'true' || simpan.attributes('disabled') !== undefined).toBe(true);
  });

  it('Simpan tidak pernah menyatakan sukses: galat jelas dan tidak ada status COMMITTED', async () => {
    const { wrapper } = pasang();
    await pilihBerkas(wrapper, 'saldo.json', fixtureText);
    await validasi(wrapper);
    await wrapper.find('input[type="checkbox"]').setValue(true);
    await tombol(wrapper, 'Simpan')!.trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain(COMMIT_UNAVAILABLE_MESSAGE);
    expect(wrapper.text()).not.toContain('COMMITTED');
    expect(wrapper.text()).not.toContain('Impor tersimpan');
  });
});

describe('SRS-25 halaman impor stok: cancel', () => {
  it('Batal pada preview menutup batch dan menyembunyikan preview', async () => {
    const { wrapper } = pasang();
    await pilihBerkas(wrapper, 'saldo.json', fixtureText);
    await validasi(wrapper);
    expect(wrapper.find('.siris-stock-preview').exists()).toBe(true);
    await tombol(wrapper, 'Batal')!.trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Batch dibatalkan');
    expect(wrapper.text()).toContain('UJI-STK-BATCH-001');
    expect(wrapper.find('.siris-stock-preview').exists()).toBe(false);
  });

  it('Mulai Impor Baru mengembalikan ke tahap 1 tanpa berkas terpilih', async () => {
    const { wrapper } = pasang();
    await pilihBerkas(wrapper, 'saldo.json', fixtureText);
    await validasi(wrapper);
    await tombol(wrapper, 'Batal')!.trigger('click');
    await flushPromises();
    await tombol(wrapper, 'Mulai Impor Baru')!.trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Tahap 1 dari 4');
    expect(wrapper.find('.siris-stock-preview').exists()).toBe(false);
  });

  it('pergantian gudang saat preview membersihkan preview (reset konteks SRS-46)', async () => {
    const { wrapper, session } = pasang();
    await pilihBerkas(wrapper, 'saldo.json', fixtureText);
    await validasi(wrapper);
    expect(wrapper.find('.siris-stock-preview').exists()).toBe(true);
    session.setActiveWarehouse('WH-02');
    await flushPromises();
    expect(wrapper.find('.siris-stock-preview').exists()).toBe(false);
    expect(wrapper.text()).toContain('Tahap 1 dari 4');
  });
});
