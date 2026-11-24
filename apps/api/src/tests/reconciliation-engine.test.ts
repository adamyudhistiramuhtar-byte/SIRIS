import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  RECONCILIATION_RULE_VERSION,
  reconcile,
  type CountLineInput,
  type ReconciliationContext,
  type ReconciliationInput,
  type StockLineInput,
} from '../modules/reconciliation/reconciliation-engine.js';

/** Fixture sintetis SRS-37 (UJI, proposed-0.1); bukan data mitra. */
function fixture(kind: 'stock' | 'count') {
  const url = new URL(
    `../../../../database/fixtures/uji/${kind}.proposed-0.1.json`,
    import.meta.url,
  );
  return JSON.parse(readFileSync(url, 'utf8'));
}

const stockFixture = fixture('stock');
const countFixture = fixture('count');

const context: ReconciliationContext = {
  warehouse_id: stockFixture.metadata.warehouse_id,
  mode: 'UJI',
  cutoff_id: stockFixture.metadata.cutoff_id,
};

const MAT_A = '10000000-0000-4000-8000-00000000000a';
const MAT_B = '10000000-0000-4000-8000-00000000000b';
const MAT_C = '10000000-0000-4000-8000-00000000000c';

function stock(material_id: string, system_quantity: string, uom = 'KG'): StockLineInput {
  return { id: `stock-${material_id}-${uom}`, material_id, uom, system_quantity };
}

function count(
  material_id: string,
  is_counted: boolean,
  physical_quantity: string | null,
  uom = 'KG',
): CountLineInput {
  return { id: `count-${material_id}-${uom}`, material_id, uom, is_counted, physical_quantity };
}

function run(
  stockLines: StockLineInput[],
  countLines: CountLineInput[],
  overrides: {
    stock?: Partial<ReconciliationContext>;
    count?: Partial<ReconciliationContext>;
  } = {},
) {
  const input: ReconciliationInput = {
    stock: { context: { ...context, ...overrides.stock }, lines: stockLines },
    count: { context: { ...context, ...overrides.count }, lines: countLines },
  };
  return reconcile(input);
}

function onlyLine(result: ReturnType<typeof reconcile>) {
  if (!result.ok) throw new Error(`run ditolak: ${result.code}`);
  expect(result.lines).toHaveLength(1);
  return result.lines[0];
}

describe('SRS-29 engine rekonsiliasi murni: acceptance criteria', () => {
  it('stok 10 dan hitung 8 menghasilkan DISCREPANCY dengan variance -2', () => {
    const line = onlyLine(run([stock(MAT_A, '10')], [count(MAT_A, true, '8')]));
    expect(line).toMatchObject({ status: 'DISCREPANCY', variance: '-2.000000' });
  });

  it('stok 10 dan hitung 10 menghasilkan MATCHED dengan variance 0', () => {
    const line = onlyLine(run([stock(MAT_A, '10')], [count(MAT_A, true, '10.000000')]));
    expect(line).toMatchObject({ status: 'MATCHED', variance: '0.000000' });
  });

  it('belum dihitung menghasilkan NOT_COUNTED dengan variance null', () => {
    const line = onlyLine(run([stock(MAT_A, '10')], [count(MAT_A, false, null)]));
    expect(line).toMatchObject({ status: 'NOT_COUNTED', variance: null, physical_quantity: null });
  });

  it('stok ada tanpa baris hitung menghasilkan COUNT_MISSING tanpa mengisi nol', () => {
    const line = onlyLine(run([stock(MAT_A, '10')], []));
    expect(line).toMatchObject({
      status: 'COUNT_MISSING',
      variance: null,
      count_line_id: null,
      physical_quantity: null,
    });
  });

  it('hitung ada tanpa stok menghasilkan STOCK_MISSING tanpa menambah stok nol (UJI-C)', () => {
    const line = onlyLine(run([], [count(MAT_A, true, '8')]));
    expect(line).toMatchObject({
      status: 'STOCK_MISSING',
      variance: null,
      stock_line_id: null,
      system_quantity: null,
      physical_quantity: '8.000000',
    });
  });

  it('UOM berbeda menghasilkan UOM_MISMATCH dengan variance null', () => {
    const line = onlyLine(run([stock(MAT_A, '10', 'KG')], [count(MAT_A, true, '10', 'L')]));
    expect(line).toMatchObject({
      status: 'UOM_MISMATCH',
      variance: null,
      stock_uom: 'KG',
      count_uom: 'L',
    });
  });
});

describe('SRS-29 engine: nol sah berbeda dari belum dihitung', () => {
  it('hitung nol yang sah adalah DISCREPANCY -10, bukan NOT_COUNTED (UJI-A)', () => {
    const line = onlyLine(run([stock(MAT_A, '10')], [count(MAT_A, true, '0')]));
    expect(line).toMatchObject({
      status: 'DISCREPANCY',
      variance: '-10.000000',
      physical_quantity: '0.000000',
    });
  });

  it('is_counted=false dengan nilai "0" ditolak NOT_COUNTED_VALUE, tidak dianggap nol', () => {
    expect(run([stock(MAT_A, '10')], [count(MAT_A, false, '0')])).toEqual({
      ok: false,
      code: 'NOT_COUNTED_VALUE',
      material_id: MAT_A,
    });
  });

  it('is_counted=true tanpa nilai ditolak, tidak diubah menjadi nol', () => {
    expect(run([stock(MAT_A, '10')], [count(MAT_A, true, null)])).toMatchObject({
      ok: false,
      code: 'INVALID_FILE',
    });
  });
});

describe('SRS-29 engine: fixture SRS-37 UJI', () => {
  const ids: Record<string, string> = {
    'UJI-MAT-01': MAT_A,
    'UJI-MAT-02': MAT_B,
    'UJI-MAT-03': MAT_C,
  };
  const stockLines: StockLineInput[] = stockFixture.rows.map(
    (row: {
      row_number: number;
      normalized: { material_code: string; uom: string; system_quantity: string };
    }) => ({
      id: `stock-row-${row.row_number}`,
      material_id: ids[row.normalized.material_code],
      uom: row.normalized.uom,
      system_quantity: row.normalized.system_quantity,
    }),
  );
  type CountNormalized = {
    material_code: string;
    uom: string;
    is_counted: boolean;
    physical_quantity: string | null;
  };
  const toCount = (normalized: CountNormalized, rowNumber: number): CountLineInput => ({
    id: `count-row-${rowNumber}`,
    material_id: ids[normalized.material_code],
    uom: normalized.uom,
    is_counted: normalized.is_counted,
    physical_quantity: normalized.physical_quantity,
  });
  const countLines: CountLineInput[] = countFixture.rows.map(
    (row: { row_number: number; normalized: CountNormalized }) =>
      toCount(row.normalized, row.row_number),
  );

  it('fixture memakai konteks yang sama untuk STOCK dan COUNT', () => {
    expect(countFixture.metadata).toMatchObject({
      warehouse_id: context.warehouse_id,
      mode: 'UJI',
      cutoff_id: context.cutoff_id,
    });
  });

  it('baris valid fixture menghasilkan DISCREPANCY -10 dan NOT_COUNTED', () => {
    const result = reconcile({
      stock: { context, lines: stockLines },
      count: { context: { ...context }, lines: countLines },
    });
    expect(result).toEqual({
      ok: true,
      rule_version: RECONCILIATION_RULE_VERSION,
      lines: [
        {
          material_id: MAT_A,
          status: 'DISCREPANCY',
          variance: '-10.000000',
          stock_line_id: 'stock-row-1',
          count_line_id: 'count-row-1',
          system_quantity: '10.000000',
          physical_quantity: '0.000000',
          stock_uom: 'KG',
          count_uom: 'KG',
        },
        {
          material_id: MAT_B,
          status: 'NOT_COUNTED',
          variance: null,
          stock_line_id: 'stock-row-2',
          count_line_id: 'count-row-2',
          system_quantity: '7.250000',
          physical_quantity: null,
          stock_uom: 'L',
          count_uom: 'L',
        },
      ],
    });
  });

  it.each([
    ['UJI-CNT-NEG-01', 'NOT_COUNTED_VALUE'],
    ['UJI-CNT-NEG-02', 'INVALID_FILE'],
    ['UJI-CNT-NEG-03', 'INVALID_FILE'],
  ])('kasus negatif %s ditolak %s sesuai fixture', (caseId, code) => {
    const negative = countFixture.negative_cases.find(
      (item: { case_id: string }) => item.case_id === caseId,
    );
    expect(negative.expected_issue).toBe(code);
    const result = reconcile({
      stock: { context, lines: stockLines },
      count: { context, lines: [...countLines, toCount(negative.normalized, 99)] },
    });
    expect(result).toMatchObject({ ok: false, code });
  });

  it('QTY AKHIR dengan locale ambigu (UJI-STK-NEG-01) ditolak, tidak ditebak', () => {
    const negative = stockFixture.negative_cases.find(
      (item: { case_id: string }) => item.case_id === 'UJI-STK-NEG-01',
    );
    const ambiguous = negative.raw['QTY AKHIR'];
    expect(run([stock(MAT_A, ambiguous)], [count(MAT_A, true, '1')])).toMatchObject({
      ok: false,
      code: 'INVALID_FILE',
    });
  });
});

describe('SRS-29 engine: konteks dan grain', () => {
  it.each([
    ['WAREHOUSE_MISMATCH', { warehouse_id: '00000000-0000-4000-8000-0000000000ff' }],
    ['CUTOFF_MISMATCH', { cutoff_id: '00000000-0000-4000-8000-0000000000fe' }],
    ['MODE_MISMATCH', { mode: 'ACTUAL' as const }],
  ])('konteks berbeda ditolak seluruhnya dengan %s', (code, countContext) => {
    expect(run([stock(MAT_A, '10')], [count(MAT_A, true, '8')], { count: countContext })).toEqual({
      ok: false,
      code,
    });
  });

  it('ACTUAL ditolak CUTOFF_UNVERIFIED selama kewenangan VERIFIED belum diputuskan', () => {
    const actual = { mode: 'ACTUAL' as const };
    expect(
      run([stock(MAT_A, '10')], [count(MAT_A, true, '10')], { stock: actual, count: actual }),
    ).toEqual({
      ok: false,
      code: 'CUTOFF_UNVERIFIED',
    });
  });

  it('dua baris stok untuk material sama ditolak AMBIGUOUS_PAIR, tidak dijumlahkan', () => {
    const result = run(
      [stock(MAT_A, '4', 'KG'), stock(MAT_A, '6', 'L')],
      [count(MAT_A, true, '10')],
    );
    expect(result).toEqual({ ok: false, code: 'AMBIGUOUS_PAIR', material_id: MAT_A });
  });

  it('dua baris hitung untuk material sama ditolak AMBIGUOUS_PAIR', () => {
    const result = run(
      [stock(MAT_A, '10')],
      [count(MAT_A, true, '4', 'KG'), count(MAT_A, true, '6', 'L')],
    );
    expect(result).toEqual({ ok: false, code: 'AMBIGUOUS_PAIR', material_id: MAT_A });
  });

  it('id baris ganda pada satu sisi ditolak INVALID_FILE', () => {
    const duplicate = { ...stock(MAT_B, '5'), id: stock(MAT_A, '10').id };
    expect(run([stock(MAT_A, '10'), duplicate], [])).toMatchObject({
      ok: false,
      code: 'INVALID_FILE',
    });
  });

  it('UOM dibandingkan persis; KG dan kg tidak disamakan tanpa alias yang disetujui', () => {
    const line = onlyLine(run([stock(MAT_A, '10', 'KG')], [count(MAT_A, true, '10', 'kg')]));
    expect(line.status).toBe('UOM_MISMATCH');
  });

  it('UOM berbeda didahulukan dari belum dihitung sesuai urutan DOC-08', () => {
    const line = onlyLine(run([stock(MAT_A, '10', 'KG')], [count(MAT_A, false, null, 'L')]));
    expect(line).toMatchObject({ status: 'UOM_MISMATCH', variance: null });
  });
});

describe('SRS-29 engine: nilai tidak valid tidak berubah menjadi 0', () => {
  it.each(['', ' 10', '10 ', '1e3', 'NaN', '+10', '10.', '.5', '1.0000001', '123456789012345'])(
    'system_quantity %j ditolak INVALID_FILE',
    (value) => {
      expect(run([stock(MAT_A, value)], [count(MAT_A, true, '1')])).toMatchObject({
        ok: false,
        code: 'INVALID_FILE',
      });
    },
  );

  it('angka JavaScript (bukan desimal string) ditolak', () => {
    const numeric = { ...stock(MAT_A, '10'), system_quantity: 10 as unknown as string };
    expect(run([numeric], [count(MAT_A, true, '10')])).toMatchObject({
      ok: false,
      code: 'INVALID_FILE',
    });
  });

  it('is_counted bukan boolean ditolak', () => {
    const unknownFlag = { ...count(MAT_A, true, '1'), is_counted: 'true' as unknown as boolean };
    expect(run([stock(MAT_A, '1')], [unknownFlag])).toMatchObject({
      ok: false,
      code: 'INVALID_FILE',
    });
  });

  it('physical_quantity negatif ditolak', () => {
    expect(run([stock(MAT_A, '1')], [count(MAT_A, true, '-1')])).toMatchObject({
      ok: false,
      code: 'INVALID_FILE',
    });
  });

  it('material_id atau uom kosong ditolak', () => {
    expect(run([stock('', '1')], [])).toMatchObject({ ok: false, code: 'INVALID_FILE' });
    expect(run([], [count(MAT_A, true, '1', '')])).toMatchObject({
      ok: false,
      code: 'INVALID_FILE',
    });
  });

  it('konteks atau daftar baris yang rusak ditolak, bukan dianggap kosong', () => {
    const broken = { stock: { context, lines: null }, count: { context, lines: [] } };
    expect(reconcile(broken as unknown as ReconciliationInput)).toEqual({
      ok: false,
      code: 'INVALID_FILE',
    });
    expect(run([], [], { stock: { cutoff_id: '' } })).toEqual({ ok: false, code: 'INVALID_FILE' });
  });
});

describe('SRS-29 engine: presisi desimal dan determinisme', () => {
  it('menghitung desimal persis tanpa galat floating point', () => {
    const tiny = onlyLine(run([stock(MAT_A, '0.1')], [count(MAT_A, true, '0.3')]));
    expect(tiny.variance).toBe('0.200000');
    const smallest = onlyLine(run([stock(MAT_A, '0')], [count(MAT_A, true, '0.000001')]));
    expect(smallest).toMatchObject({ status: 'DISCREPANCY', variance: '0.000001' });
    const largest = onlyLine(
      run([stock(MAT_A, '0')], [count(MAT_A, true, '99999999999999.999999')]),
    );
    expect(largest.variance).toBe('99999999999999.999999');
  });

  it('nol bertanda minus diperlakukan sama dengan nol dan ditulis tanpa tanda', () => {
    const line = onlyLine(run([stock(MAT_A, '-0.000000')], [count(MAT_A, true, '0')]));
    expect(line).toMatchObject({
      status: 'MATCHED',
      variance: '0.000000',
      system_quantity: '0.000000',
    });
  });

  it('saldo sistem negatif dihitung apa adanya; kebijakannya tetap OD-05', () => {
    const line = onlyLine(run([stock(MAT_A, '-3')], [count(MAT_A, true, '0')]));
    expect(line).toMatchObject({ status: 'DISCREPANCY', variance: '3.000000' });
  });

  it('urutan hasil tetap per material_id dan input tidak diubah', () => {
    const stockLines = Object.freeze(
      [stock(MAT_C, '1'), stock(MAT_A, '2')].map((line) => Object.freeze(line)),
    );
    const countLines = Object.freeze([count(MAT_B, true, '3')].map((line) => Object.freeze(line)));
    const first = run([...stockLines], [...countLines]);
    const second = run([...stockLines].reverse(), [...countLines]);
    expect(first).toEqual(second);
    if (!first.ok) throw new Error('run ditolak');
    expect(first.lines.map((line) => [line.material_id, line.status])).toEqual([
      [MAT_A, 'COUNT_MISSING'],
      [MAT_B, 'STOCK_MISSING'],
      [MAT_C, 'COUNT_MISSING'],
    ]);
  });

  it('snapshot dan sesi kosong menghasilkan run tanpa baris, bukan galat', () => {
    expect(run([], [])).toEqual({ ok: true, rule_version: RECONCILIATION_RULE_VERSION, lines: [] });
  });
});
