import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  I_VAR_RULE_VERSION,
  computeIVar,
  type IVarLineInput,
  type IVarRunInput,
} from '../modules/inventory-metrics/i-var.js';

/** Fixture sintetis UJI; oracle diambil dari design.md (lihat _keterangan di fixture). */
const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/i-var.uji.proposed-0.1.json', import.meta.url), 'utf8'),
);

type FixtureLine = IVarLineInput & { material_code: string };
type FixtureRun = Omit<IVarRunInput, 'lines'> & { lines: FixtureLine[] };

const runs: FixtureRun[] = fixture.runs;
const [runA, runB] = runs;
const codeById = new Map<string, string>(
  runs.flatMap((run) => run.lines.map((line) => [line.material_id, line.material_code] as const)),
);

function byCode<T extends { material_id: string }>(entries: T[], field: keyof T) {
  return Object.fromEntries(
    entries.map((entry) => [codeById.get(entry.material_id), entry[field]]),
  );
}

function line(overrides: Partial<IVarLineInput> = {}): IVarLineInput {
  return {
    material_id: '10000000-0000-4000-8000-0000000000aa',
    status: 'DISCREPANCY',
    variance: '-2.000000',
    system_quantity: '10.000000',
    physical_quantity: '8.000000',
    ...overrides,
  };
}

function singleRun(lines: IVarLineInput[]): IVarRunInput {
  return { run_id: 'run-x', cutoff_id: 'cutoff-x', rule_version: 'uji-engine/proposed-0.1', lines };
}

function okRuns(result: ReturnType<typeof computeIVar>) {
  if (!result.ok) throw new Error(`ditolak: ${result.code}`);
  return result.runs;
}

describe('SRS-32 I-VAR: oracle fixture persediaan design.md', () => {
  it('struktur fixture sesuai sumber: union 9, valid 5, matched 2, discrepancy 3, nonvalid 4', () => {
    const statuses = runA.lines.map((item) => item.status);
    const oracle = fixture.oracle.run_a;
    expect(runA.lines).toHaveLength(oracle.union);
    expect(statuses.filter((s) => s === 'MATCHED' || s === 'DISCREPANCY')).toHaveLength(
      oracle.valid,
    );
    expect(statuses.filter((s) => s === 'MATCHED')).toHaveLength(oracle.matched);
    expect(statuses.filter((s) => s === 'DISCREPANCY')).toHaveLength(oracle.discrepancy);
    expect(runA.lines.length - oracle.valid).toBe(oracle.nonvalid);
  });

  it('I-VAR run A sama dengan oracle: MAT-001=0, MAT-002=-5, MAT-003=+3, MAT-005=-20, MAT-008=0', () => {
    const [result] = okRuns(computeIVar([runA]));
    expect(byCode(result.items, 'i_var')).toEqual(fixture.oracle.run_a.i_var);
    expect(result.insufficient_data).toBe(false);
  });

  it('pasangan nonvalid dikecualikan beserta status, tanpa nilai I-VAR', () => {
    const [result] = okRuns(computeIVar([runA]));
    expect(byCode(result.excluded, 'status')).toEqual(fixture.oracle.run_a.excluded);
    expect(result.excluded.every((item) => !('i_var' in item))).toBe(true);
  });

  it('MATCHED dengan kuantitas nol (MAT-008) adalah I-VAR 0 yang sah, bukan data kosong', () => {
    const [result] = okRuns(computeIVar([runA]));
    const mat008 = result.items.find((item) => codeById.get(item.material_id) === 'MAT-008');
    expect(mat008?.i_var).toBe('0.000000');
  });

  it('item diurutkan material_id naik dan menyertakan konteks run', () => {
    const [result] = okRuns(computeIVar([runA]));
    const ids = result.items.map((item) => item.material_id);
    expect(ids).toEqual([...ids].sort());
    expect(result).toMatchObject({
      run_id: runA.run_id,
      cutoff_id: runA.cutoff_id,
      rule_version: runA.rule_version,
    });
  });
});

describe('SRS-32 I-VAR: dua cutoff tanpa memilih latest run', () => {
  it('dua run pada cutoff berbeda diproses terpisah sesuai urutan input', () => {
    const result = okRuns(computeIVar([runA, runB]));
    expect(result.map((run) => run.cutoff_id)).toEqual([runA.cutoff_id, runB.cutoff_id]);
    expect(byCode(result[1].items, 'i_var')).toEqual(fixture.oracle.run_b.i_var);
    expect(byCode(result[1].excluded, 'status')).toEqual(fixture.oracle.run_b.excluded);
  });

  it('material yang sama pada dua cutoff tidak digabung atau dijumlahkan', () => {
    const result = okRuns(computeIVar([runA, runB]));
    const mat002 = result.map(
      (run) => run.items.find((item) => codeById.get(item.material_id) === 'MAT-002')?.i_var,
    );
    expect(mat002).toEqual(['-5.000000', '-1.500000']);
  });

  it('dua run pada cutoff yang sama dikembalikan keduanya; tidak ada latest yang dipilih', () => {
    const sameCutoff = {
      ...runB,
      run_id: '20000000-0000-4000-8000-0000000000bb',
      cutoff_id: runA.cutoff_id,
    };
    const result = okRuns(computeIVar([runA, sameCutoff]));
    expect(result).toHaveLength(2);
    expect(result.map((run) => run.run_id)).toEqual([runA.run_id, sameCutoff.run_id]);
  });

  it('urutan input dipertahankan sehingga pemanggil yang menentukan pilihan run', () => {
    const forward = okRuns(computeIVar([runA, runB])).map((run) => run.run_id);
    const reversed = okRuns(computeIVar([runB, runA])).map((run) => run.run_id);
    expect(reversed).toEqual([...forward].reverse());
  });
});

describe('SRS-32 I-VAR: data tidak cukup tidak ditampilkan sebagai nol', () => {
  it('run tanpa pasangan valid ditandai insufficient_data, items kosong', () => {
    const [result] = okRuns(
      computeIVar([
        singleRun([
          line({ status: 'NOT_COUNTED', variance: null, physical_quantity: null }),
          line({
            material_id: '10000000-0000-4000-8000-0000000000ab',
            status: 'STOCK_MISSING',
            variance: null,
            system_quantity: null,
          }),
        ]),
      ]),
    );
    expect(result).toMatchObject({ items: [], insufficient_data: true });
    expect(result.excluded).toHaveLength(2);
  });

  it('run tanpa baris sama sekali juga insufficient_data, bukan 0', () => {
    const [result] = okRuns(computeIVar([singleRun([])]));
    expect(result).toMatchObject({ items: [], excluded: [], insufficient_data: true });
  });

  it('tanpa run sama sekali menghasilkan daftar kosong', () => {
    expect(computeIVar([])).toEqual({ ok: true, metric_version: I_VAR_RULE_VERSION, runs: [] });
  });
});

describe('SRS-32 I-VAR: baris tidak konsisten menolak run, bukan diubah menjadi 0', () => {
  it.each([
    ['variance tidak sama dengan fisik - sistem', { variance: '-3.000000' }],
    ['MATCHED dengan selisih bukan nol', { status: 'MATCHED' as const, variance: '-2.000000' }],
    [
      'DISCREPANCY dengan selisih nol',
      { status: 'DISCREPANCY' as const, variance: '0.000000', physical_quantity: '10.000000' },
    ],
    ['pasangan valid tanpa physical_quantity', { physical_quantity: null }],
    ['pasangan valid tanpa system_quantity', { system_quantity: null }],
    ['pasangan valid tanpa variance', { variance: null }],
    ['kuantitas bukan desimal string', { physical_quantity: '1e1' }],
    ['nonvalid yang membawa variance', { status: 'NOT_COUNTED' as const, variance: '0.000000' }],
    ['status di luar enam status', { status: 'UNKNOWN' as unknown as IVarLineInput['status'] }],
    ['material_id kosong', { material_id: '' }],
  ])('%s ditolak INCONSISTENT_RUN_LINE', (_name, overrides) => {
    expect(computeIVar([singleRun([line(overrides)])])).toMatchObject({
      ok: false,
      code: 'INCONSISTENT_RUN_LINE',
      run_id: 'run-x',
    });
  });

  it('material ganda dalam satu run ditolak', () => {
    expect(computeIVar([singleRun([line(), line()])])).toMatchObject({
      ok: false,
      code: 'INCONSISTENT_RUN_LINE',
    });
  });

  it('run_id ganda ditolak', () => {
    expect(computeIVar([runA, runA])).toMatchObject({
      ok: false,
      code: 'INCONSISTENT_RUN_LINE',
      run_id: runA.run_id,
    });
  });

  it('konteks run tidak lengkap ditolak', () => {
    expect(computeIVar([{ ...singleRun([]), cutoff_id: '' }])).toMatchObject({
      ok: false,
      code: 'INCONSISTENT_RUN_LINE',
    });
  });
});

describe('SRS-32 I-VAR: presisi desimal', () => {
  it('selisih dihitung persis tanpa galat floating point', () => {
    const [result] = okRuns(
      computeIVar([
        singleRun([line({ system_quantity: '0.1', physical_quantity: '0.3', variance: '0.2' })]),
      ]),
    );
    expect(result.items[0].i_var).toBe('0.200000');
  });

  it('nilai terbesar numeric(20,6) tetap persis', () => {
    const [result] = okRuns(
      computeIVar([
        singleRun([
          line({
            system_quantity: '0',
            physical_quantity: '99999999999999.999999',
            variance: '99999999999999.999999',
          }),
        ]),
      ]),
    );
    expect(result.items[0].i_var).toBe('99999999999999.999999');
  });
});
