import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StockBalancePreview from '../components/patterns/StockBalancePreview.vue';
import {
  formatCutoffDate,
  formatQuantity,
  type StockPreviewRow,
} from '../shared/import/stock-preview-types';

const rows: StockPreviewRow[] = [
  { rowNumber: 1, materialCode: 'MAT-001', uom: 'KG', systemQuantity: '1250.5' },
  { rowNumber: 2, materialCode: 'MAT-002', uom: 'PCS', systemQuantity: null },
  { rowNumber: 3, materialCode: 'MAT-003', uom: 'L', systemQuantity: '0' },
];

const cutoff = { cutoffId: '3f2a9c1e-5b7d-4e2a-9a10-0c6f7d8e9a11', date: '2026-11-24' };

function build(props: Record<string, unknown> = {}) {
  return mount(StockBalancePreview, { props: { rows, cutoff, mode: 'UJI', ...props } });
}

describe('formatQuantity', () => {
  it('memformat string desimal tanpa kehilangan presisi', () => {
    expect(formatQuantity('1250.5')).toEqual({ kind: 'value', text: '1.250,5' });
    expect(formatQuantity('1234567.123456')).toEqual({ kind: 'value', text: '1.234.567,123456' });
    expect(formatQuantity('-42')).toEqual({ kind: 'value', text: '-42' });
  });

  it('nol adalah nilai, bukan kosong', () => {
    expect(formatQuantity('0')).toEqual({ kind: 'value', text: '0' });
  });

  it('null dan undefined berarti tidak ada', () => {
    expect(formatQuantity(null)).toEqual({ kind: 'absent' });
    expect(formatQuantity(undefined)).toEqual({ kind: 'absent' });
  });

  it('nilai di luar pola ditandai tidak valid dan tidak dikoreksi', () => {
    expect(formatQuantity('1,5')).toEqual({ kind: 'invalid', raw: '1,5' });
    expect(formatQuantity('abc')).toEqual({ kind: 'invalid', raw: 'abc' });
    expect(formatQuantity('1.1234567')).toEqual({ kind: 'invalid', raw: '1.1234567' });
    expect(formatQuantity('')).toEqual({ kind: 'invalid', raw: '' });
  });
});

describe('formatCutoffDate', () => {
  it('menulis tanggal tanpa pergeseran zona waktu', () => {
    expect(formatCutoffDate('2026-11-24')).toBe('24 November 2026');
    expect(formatCutoffDate('2026-01-01')).toBe('1 Januari 2026');
  });

  it('mengembalikan null untuk tanggal tidak ada atau tidak sah', () => {
    expect(formatCutoffDate(undefined)).toBeNull();
    expect(formatCutoffDate('24-11-2026')).toBeNull();
    expect(formatCutoffDate('2026-13-01')).toBeNull();
  });
});

describe('StockBalancePreview', () => {
  it('menampilkan baris persis seperti dikirim layanan', () => {
    const wrapper = build();
    const bodyRows = wrapper.findAll('tbody tr');
    expect(bodyRows).toHaveLength(3);
    expect(bodyRows[0].text()).toContain('MAT-001');
    expect(bodyRows[0].text()).toContain('KG');
    expect(bodyRows[0].text()).toContain('1.250,5');
  });

  it('null tampil "Tidak tersedia", nol tampil 0 (tidak tertukar)', () => {
    const cells = build().findAll('tbody tr').map((r) => r.findAll('td')[3].text());
    expect(cells[1]).toBe('Tidak tersedia');
    expect(cells[2]).toBe('0');
  });

  it('nilai tidak valid ditandai dan nilai aslinya tampil', () => {
    const wrapper = build({
      rows: [{ rowNumber: 1, materialCode: 'X', uom: 'KG', systemQuantity: '1,5' }],
    });
    expect(wrapper.get('tbody').text()).toContain('Nilai tidak valid: 1,5');
  });

  it('tidak menghitung total atau movement', () => {
    const wrapper = build();
    expect(wrapper.find('tfoot').exists()).toBe(false);
    expect(wrapper.text().toLowerCase()).not.toContain('total');
    expect(wrapper.text().toLowerCase()).not.toContain('movement');
  });

  it('cutoff tanggal saja: jam tidak dikarang', () => {
    const text = build().get('[data-testid="cutoff"]').text();
    expect(text).toContain('24 November 2026');
    expect(text).toContain('jam tidak ditentukan');
    expect(text).not.toMatch(/\d{2}:\d{2}/);
  });

  it('cutoff dengan jam dari layanan ditampilkan apa adanya', () => {
    const wrapper = build({ cutoff: { ...cutoff, time: '23:59', timezone: 'WIB' } });
    expect(wrapper.get('[data-testid="cutoff"]').text()).toContain('pukul 23:59 WIB');
  });

  it('cutoff null: peringatan role=alert, tidak ada tanggal karangan', () => {
    const wrapper = build({ cutoff: null });
    expect(wrapper.get('[data-testid="cutoff"]').text()).toContain('Belum tersedia dari layanan');
    expect(wrapper.get('[role="alert"]').text()).toContain('Cutoff belum tersedia');
  });

  it('cutoff dengan tanggal tidak terbaca tidak diganti tanggal lain', () => {
    const wrapper = build({ cutoff: { cutoffId: cutoff.cutoffId, date: 'bukan-tanggal' } });
    expect(wrapper.get('[data-testid="cutoff"]').text()).toContain('Tanggal tidak dapat dibaca');
  });

  it('mode UJI dan ACTUAL diberi label jelas', () => {
    expect(build().get('[data-testid="mode"]').text()).toContain('UJI');
    expect(build({ mode: 'ACTUAL' }).get('[data-testid="mode"]').text()).toContain('ACTUAL');
  });

  it('menyatakan bila baris tampil lebih sedikit dari jumlah menurut layanan', () => {
    const wrapper = build({ rowCount: 10 });
    expect(wrapper.text()).toContain('Menampilkan 3 dari 10 baris');
    expect(build({ rowCount: 3 }).text()).not.toContain('Menampilkan');
  });

  it('keadaan kosong dan memuat', () => {
    expect(build({ rows: [] }).text()).toContain('Belum ada baris saldo');
    const loading = build({ loading: true });
    expect(loading.attributes('aria-busy')).toBe('true');
    expect(loading.get('[role="status"]').text()).toContain('Memuat');
    expect(loading.find('table').exists()).toBe(false);
  });

  it('aksesibilitas: heading terhubung, caption, th scope=col, region fokusable', () => {
    const wrapper = build();
    const section = wrapper.get('section');
    const headingId = wrapper.get('h3').attributes('id');
    expect(section.attributes('aria-labelledby')).toBe(headingId);
    expect(wrapper.get('caption').text()).toContain('Saldo sistem');
    wrapper.findAll('th').forEach((th) => expect(th.attributes('scope')).toBe('col'));
    const region = wrapper.get('[role="region"]');
    expect(region.attributes('tabindex')).toBe('0');
    expect(region.attributes('aria-labelledby')).toBe(headingId);
  });
});
