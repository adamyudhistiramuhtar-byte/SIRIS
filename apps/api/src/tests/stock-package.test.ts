import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FixtureSourceAdapter } from '../modules/imports/fixture-source-adapter.js';
import { stageMetadata, StageError, type NormalizedSourceRow } from '../modules/imports/staging-contract.js';
import { StockPackageFixtureAdapter, StockSupportFixtureAdapter, stockSupportComponents, validateStockPackage,
  type StockSupportComponent } from '../modules/imports/stock-package.js';

// Seluruh data berlabel UJI dan sintetis. Bukan kontrak ACTUAL; skema support SOURCE REQUIRED (OD-05).
const stockFixtureBytes = readFileSync(new URL('../../../../database/fixtures/uji/stock.proposed-0.1.json', import.meta.url));
const stockFixture = JSON.parse(stockFixtureBytes.toString('utf8')) as {
  rows: unknown[]; negative_cases: { case_id: string; expected_issue: string; normalized?: Record<string, string>;
    metadata_override?: Record<string, unknown> }[]; metadata: Record<string, unknown>;
};
const balanceAdapter = new FixtureSourceAdapter('STOCK');
const supportAdapter = new StockSupportFixtureAdapter();
const balance = (): NormalizedSourceRow[] => balanceAdapter.parse(stockFixtureBytes, 'balance');
const materials = new Set(['UJI-MAT-01', 'UJI-MAT-02']);

function supportBytes(component: StockSupportComponent, rows: { row_number: number; normalized: unknown; component?: string }[]): Buffer {
  return Buffer.from(JSON.stringify({ kind: 'STOCK', contract_version: 'proposed-0.1',
    rows: rows.map((r) => ({ row_number: r.row_number, component: r.component ?? component, raw: { UJI: 'sintetis' }, normalized: r.normalized })) }));
}
const support = (component: StockSupportComponent, rows: { row_number: number; normalized: unknown }[]) =>
  supportAdapter.parse(supportBytes(component, rows), component);

describe('SRS-26 paket STOCK UJI: saldo wajib dan support opsional', () => {
  it('fixture stock.proposed-0.1 terbaca oleh adapter saldo SRS-50 dengan lineage baris', () => {
    const rows = balance();
    expect(rows.map((r) => r.row_number)).toEqual([1, 2]);
    expect(rows.map((r) => r.normalized)).toEqual([
      { material_code: 'UJI-MAT-01', uom: 'KG', system_quantity: '10.000000' },
      { material_code: 'UJI-MAT-02', uom: 'L', system_quantity: '7.250000' }]);
    expect(rows[0].raw).toMatchObject({ raw: { 'QTY AKHIR': '10' } });
  });

  it('saldo tanpa support: sah, menghasilkan warning per komponen, line key dan sumber tersimpan', () => {
    const result = validateStockPackage({ balance: balance(), materialCodes: materials });
    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual(stockSupportComponents.map((component) => ({ code: 'OPTIONAL_COMPONENT_ABSENT', component })));
    expect(result.lines.map((l) => [l.line_key, l.system_quantity, l.source])).toEqual([
      ['UJI-MAT-01|KG', '10.000000', { component: 'balance', row_number: 1 }],
      ['UJI-MAT-02|L', '7.250000', { component: 'balance', row_number: 2 }]]);
  });

  it('movement tidak menambah saldo: system_quantity tetap dari QTY AKHIR dan support hanya lineage', () => {
    const movement = support('support_movement', [
      { row_number: 1, normalized: { material_code: 'UJI-MAT-01', quantity: '5', direction: 'IN' } },
      { row_number: 2, normalized: { material_code: 'UJI-MAT-01', quantity: '99', direction: 'OUT' } }]);
    const result = validateStockPackage({ balance: balance(), support: { support_movement: movement }, materialCodes: materials });
    expect(result.ok).toBe(true);
    expect(result.lines[0].system_quantity).toBe('10.000000');
    expect(result.lines[1].system_quantity).toBe('7.250000');
    expect(result.lines[0].support).toEqual([{ component: 'support_movement', row_number: 1 }, { component: 'support_movement', row_number: 2 }]);
    expect(result.lines[1].support).toEqual([]);
    expect(result.warnings.map((w) => w.component)).toEqual(['support_master', 'support_wo']);
  });

  it('support tanpa material_code tetap sah dan tidak dikaitkan ke baris saldo manapun', () => {
    const wo = support('support_wo', [{ row_number: 1, normalized: { wo_ref: 'UJI-WO-01', note: null } }]);
    const result = validateStockPackage({ balance: balance(), support: { support_wo: wo } });
    expect(result.ok).toBe(true);
    expect(result.lines.every((l) => l.support.length === 0)).toBe(true);
  });

  it('support diberikan tetapi kosong menggagalkan paket (bukan sekadar warning)', () => {
    const result = validateStockPackage({ balance: balance(), support: { support_master: [] } });
    expect(result.ok).toBe(false);
    expect(result.issues).toEqual([{ code: 'INVALID_FILE', component: 'support_master', row_number: null, detail: expect.any(String) }]);
  });

  it('support merujuk material yang tidak ada pada saldo paket menggagalkan paket dengan MISSING_REFERENCE', () => {
    const master = support('support_master', [{ row_number: 4, normalized: { material_code: 'UJI-MAT-TIDAK-ADA' } }]);
    const result = validateStockPackage({ balance: balance(), support: { support_master: master } });
    expect(result.ok).toBe(false);
    expect(result.issues).toMatchObject([{ code: 'MISSING_REFERENCE', component: 'support_master', row_number: 4 }]);
  });

  it('nomor baris ganda dalam satu komponen support dilaporkan DUPLICATE_SOURCE pada tingkat paket', () => {
    const rows: NormalizedSourceRow[] = [
      { row_number: 1, raw: {}, normalized: { material_code: 'UJI-MAT-01' } },
      { row_number: 1, raw: {}, normalized: { material_code: 'UJI-MAT-02' } }];
    const result = validateStockPackage({ balance: balance(), support: { support_master: rows } });
    expect(result.ok).toBe(false);
    expect(result.issues).toMatchObject([{ code: 'DUPLICATE_SOURCE', component: 'support_master', row_number: 1 }]);
  });

  it('payload support non-record ditolak validator walau lolos sebagai objek mentah', () => {
    const rows: NormalizedSourceRow[] = [{ row_number: 1, raw: {}, normalized: { nested: { a: 1 } } as never }];
    const result = validateStockPackage({ balance: balance(), support: { support_wo: rows } });
    expect(result.ok).toBe(false);
    expect(result.issues).toMatchObject([{ code: 'INVALID_FILE', component: 'support_wo', row_number: 1 }]);
  });

  it('UJI-STK-NEG-02: material tidak ada pada referensi UJI ditolak MISSING_REFERENCE', () => {
    const neg = stockFixture.negative_cases.find((c) => c.case_id === 'UJI-STK-NEG-02')!;
    const rows: NormalizedSourceRow[] = [...balance(), { row_number: 3, raw: {}, normalized: neg.normalized! }];
    const result = validateStockPackage({ balance: rows, materialCodes: materials });
    expect(neg.expected_issue).toBe('MISSING_REFERENCE');
    expect(result.ok).toBe(false);
    expect(result.issues).toMatchObject([{ code: neg.expected_issue, component: 'balance', row_number: 3 }]);
  });

  it('line key saldo ganda (material_code dan uom sama) dilaporkan DUPLICATE_SOURCE dan baris kedua tidak menggandakan saldo', () => {
    const rows = [...balance(), { row_number: 3, raw: {}, normalized: { material_code: 'UJI-MAT-01', uom: 'KG', system_quantity: '1.000000' } }];
    const result = validateStockPackage({ balance: rows, materialCodes: materials });
    expect(result.ok).toBe(false);
    expect(result.issues).toMatchObject([{ code: 'DUPLICATE_SOURCE', row_number: 3 }]);
    expect(result.lines).toHaveLength(2);
  });

  it('material sama dengan UOM berbeda adalah dua line key berbeda', () => {
    const rows = [...balance(), { row_number: 3, raw: {}, normalized: { material_code: 'UJI-MAT-01', uom: 'G', system_quantity: '1.000000' } }];
    expect(validateStockPackage({ balance: rows }).lines.map((l) => l.line_key)).toEqual(['UJI-MAT-01|KG', 'UJI-MAT-02|L', 'UJI-MAT-01|G']);
  });

  it('saldo kosong atau field saldo tidak lengkap menggagalkan paket', () => {
    expect(validateStockPackage({ balance: [] }).issues).toMatchObject([{ code: 'INVALID_FILE', component: 'balance' }]);
    const broken: NormalizedSourceRow[] = [{ row_number: 1, raw: {}, normalized: { material_code: 'UJI-MAT-01' } }];
    expect(validateStockPackage({ balance: broken }).issues).toMatchObject([{ code: 'INVALID_FILE', component: 'balance', row_number: 1 }]);
  });

  it('OD-05: saldo negatif tidak ditolak dan tidak dikoreksi, hanya dicatat sebagai keputusan terbuka', () => {
    const rows = [{ row_number: 1, raw: {}, normalized: { material_code: 'UJI-MAT-01', uom: 'KG', system_quantity: '-2.000000' } }];
    const result = validateStockPackage({ balance: rows });
    expect(result.ok).toBe(true);
    expect(result.lines[0].system_quantity).toBe('-2.000000');
    expect(result.open_decisions).toMatchObject([{ id: 'OD-05', row_number: 1 }]);
  });

  it('validator tidak mengubah masukan', () => {
    const rows = Object.freeze(balance().map((r) => Object.freeze({ ...r })));
    const before = JSON.stringify(rows);
    validateStockPackage({ balance: rows, support: { support_movement: Object.freeze([]) } });
    expect(JSON.stringify(rows)).toBe(before);
  });
});

describe('SRS-26 adapter support fixture UJI', () => {
  const parse = (bytes: Buffer, component = 'support_movement') => () => supportAdapter.parse(bytes, component);
  it('menolak komponen yang tidak dikenal, termasuk balance', () => {
    expect(parse(supportBytes('support_movement', [{ row_number: 1, normalized: { a: 1 } }]), 'balance')).toThrow(StageError);
    expect(parse(supportBytes('support_movement', [{ row_number: 1, normalized: { a: 1 } }]), 'lainnya')).toThrow(StageError);
  });
  it('menolak baris yang menyatakan komponen berbeda dari unggahan', () => {
    expect(parse(supportBytes('support_movement', [{ row_number: 1, component: 'support_wo', normalized: { a: 1 } }]))).toThrow(StageError);
  });
  it.each([
    ['nomor baris ganda', [{ row_number: 1, normalized: { a: 1 } }, { row_number: 1, normalized: { a: 2 } }]],
    ['nomor baris nol', [{ row_number: 0, normalized: { a: 1 } }]],
    ['payload kosong', [{ row_number: 1, normalized: {} }]],
    ['payload bersarang', [{ row_number: 1, normalized: { a: { b: 1 } } }]],
    ['payload bukan objek', [{ row_number: 1, normalized: 'x' }]],
  ])('menolak %s dengan INVALID_FILE', (_name, rows) => {
    expect(parse(supportBytes('support_movement', rows))).toThrow(expect.objectContaining({ code: 'INVALID_FILE' }));
  });
  it('menolak file tanpa baris, JSON rusak, dan kind atau versi lain', () => {
    expect(parse(supportBytes('support_movement', []))).toThrow(StageError);
    expect(parse(Buffer.from('{bukan json'))).toThrow(StageError);
    expect(parse(Buffer.from(JSON.stringify({ kind: 'COUNT', contract_version: 'proposed-0.1', rows: [] })))).toThrow(StageError);
  });
  it('mempertahankan raw dan normalized untuk lineage', () => {
    const [row] = support('support_master', [{ row_number: 7, normalized: { material_code: 'UJI-MAT-01', note: null } }]);
    expect(row.row_number).toBe(7);
    expect(row.normalized).toEqual({ material_code: 'UJI-MAT-01', note: null });
    expect(row.raw).toMatchObject({ row_number: 7, component: 'support_master', raw: { UJI: 'sintetis' } });
  });
});

describe('SRS-26 kasus negatif fixture stock yang berada di lapisan SRS-50', () => {
  it('UJI-STK-NEG-01: adapter saldo menolak nilai ambigu locale sebagai INVALID_FILE', () => {
    const neg = stockFixture.negative_cases.find((c) => c.case_id === 'UJI-STK-NEG-01')!;
    expect(neg.expected_issue).toBe('INVALID_FILE');
    const bytes = Buffer.from(JSON.stringify({ kind: 'STOCK', contract_version: 'proposed-0.1', rows: [
      { row_number: 1, component: 'balance', raw: { 'QTY AKHIR': '1.234,5' },
        normalized: { material_code: 'UJI-MAT-01', uom: 'KG', system_quantity: '1.234,5' } }] }));
    expect(() => balanceAdapter.parse(bytes, 'balance')).toThrow(expect.objectContaining({ code: 'INVALID_FILE' }));
  });
  it('UJI-STK-NEG-03: metadata tanpa cutoff_id ditolak INVALID_METADATA (keputusan PM 25 Nov), isi berkas invalid tetap INVALID_FILE', () => {
    const neg = stockFixture.negative_cases.find((c) => c.case_id === 'UJI-STK-NEG-03')!;
    const metadata = { ...stockFixture.metadata, ...neg.metadata_override };
    delete (metadata as Record<string, unknown>).cutoff_id;
    expect(neg.expected_issue).toBe('INVALID_METADATA');
    expect(stageMetadata.safeParse(metadata).success).toBe(false);
    expect(() => balanceAdapter.parse(Buffer.from('{bukan json'), 'balance')).toThrow(expect.objectContaining({ code: 'INVALID_FILE' }));
  });
});

describe('SRS-26 adapter paket tunggal StockPackageFixtureAdapter (SRS-50 afa00a9)', () => {
  const adapter = new StockPackageFixtureAdapter();
  it('mewajibkan balance dan menandai tiga komponen support sebagai opsional dengan satu kind dan versi', () => {
    expect(adapter.kind).toBe('STOCK');
    expect(adapter.version).toBe(balanceAdapter.version);
    expect(adapter.components).toEqual(['balance']);
    expect(adapter.optionalComponents).toEqual(stockSupportComponents);
  });
  it('mengarahkan balance ke adapter saldo dan support ke adapter support, hasil sama dengan adapter terpisah', () => {
    expect(adapter.parse(stockFixtureBytes, 'balance')).toEqual(balance());
    const bytes = supportBytes('support_movement', [{ row_number: 1, normalized: { material_code: 'UJI-MAT-01', quantity: '5' } }]);
    expect(adapter.parse(bytes, 'support_movement')).toEqual(supportAdapter.parse(bytes, 'support_movement'));
  });
  it('menolak komponen tak dikenal dan isi support yang invalid dengan INVALID_FILE', () => {
    expect(() => adapter.parse(stockFixtureBytes, 'lainnya')).toThrow(expect.objectContaining({ code: 'INVALID_FILE' }));
    expect(() => adapter.parse(Buffer.from('{}'), 'support_wo')).toThrow(expect.objectContaining({ code: 'INVALID_FILE' }));
  });
  it('paket dari adapter tunggal tetap lolos validator: balance saja sah dan support valid hanya menjadi lineage', () => {
    const only = validateStockPackage({ balance: adapter.parse(stockFixtureBytes, 'balance'), materialCodes: materials });
    expect(only.ok).toBe(true);
    const wo = adapter.parse(supportBytes('support_wo', [{ row_number: 1, normalized: { material_code: 'UJI-MAT-02', wo_ref: 'UJI-WO-01' } }]), 'support_wo');
    const full = validateStockPackage({ balance: adapter.parse(stockFixtureBytes, 'balance'), support: { support_wo: wo }, materialCodes: materials });
    expect(full.ok).toBe(true);
    expect(full.lines.map((l) => l.system_quantity)).toEqual(['10.000000', '7.250000']);
    expect(full.lines[1].support).toEqual([{ component: 'support_wo', row_number: 1 }]);
  });
});
