import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import type { CountLineRecord, CountSessionRecord } from '../modules/count/count-contract.js';
import {
  CountCommitError,
  CountCommitWriter,
  toCountLineDraft,
  type CountCommitBatch,
  type StagedCountRow,
} from '../modules/count/count-commit-writer.js';

/** Fake sederhana: menyimpan apa yang ditulis dalam satu transaksi. Bukan pengganti PostgreSQL. */
interface FakeTx { sessions: CountSessionRecord[]; lines: CountLineRecord[]; calls: string[] }

const WAREHOUSE = '20000000-0000-4000-8000-000000000001';
const CUTOFF = '40000000-0000-4000-8000-000000000001';
const BATCH = '30000000-0000-4000-8000-000000000001';

/** Fixture sumber SRS-37 (UJI) yang juga dipakai adapter #27; dibaca, tidak diubah. */
const fixture = JSON.parse(readFileSync(new URL('../../../../database/fixtures/uji/count.proposed-0.1.json', import.meta.url), 'utf8')) as {
  rows: { row_number: number; normalized: unknown }[];
};

let staged: StagedCountRow[];
let materials: Map<string, string>;
let tx: FakeTx;
let failInsertLines: boolean;

function writer() {
  let next = 1;
  return new CountCommitWriter<FakeTx>({
    rows: { readValidRows: async (t) => { t.calls.push('rows.read'); return staged; } },
    materials: {
      resolve: async (t, scope, code) => {
        t.calls.push(`material.resolve:${scope.warehouse_id}:${scope.mode}:${code}`);
        return materials.get(code) ?? null;
      },
    },
    store: {
      insertSession: async (t, session) => { t.calls.push('session.insert'); t.sessions.push(session); },
      insertLines: async (t, lines) => {
        t.calls.push('lines.insert');
        if (failInsertLines) throw new Error('PRIVATE_DRIVER_SENTINEL');
        t.lines.push(...lines);
      },
    },
    ids: { next: () => `90000000-0000-4000-8000-${String(next++).padStart(12, '0')}` },
  });
}

function batch(overrides: Partial<CountCommitBatch> = {}): CountCommitBatch {
  return { id: BATCH, warehouse_id: WAREHOUSE, mode: 'UJI', cutoff_id: CUTOFF, ...overrides };
}

async function code(promise: Promise<unknown>): Promise<string> {
  try { await promise; return 'NONE'; } catch (error) { return error instanceof CountCommitError ? error.code : 'OTHER'; }
}

beforeEach(() => {
  staged = fixture.rows.map((row, index) => ({
    source_row_id: `a0000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    row_number: row.row_number,
    normalized: row.normalized,
  }));
  materials = new Map(fixture.rows.map((row, index) => [
    (row.normalized as { material_code: string }).material_code,
    `b0000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  ]));
  tx = { sessions: [], lines: [], calls: [] };
  failInsertLines = false;
});

describe('SRS-27 invarian baris COUNT saat commit (BR-INV-02)', () => {
  const base = { material_code: 'UJI-MAT-01', uom: 'KG' };
  it.each([
    ['dihitung, fisik nol (hitung sah)', { ...base, is_counted: true, physical_quantity: '0.000000' }, '0.000000'],
    ['dihitung, fisik positif', { ...base, is_counted: true, physical_quantity: '12.5' }, '12.5'],
    ['belum dihitung, null eksplisit', { ...base, is_counted: false, physical_quantity: null }, null],
  ])('%s diterima tanpa mengubah nilai', (_label, input, expected) => {
    expect(toCountLineDraft(input).physical_quantity).toBe(expected);
  });
  it.each([
    ['belum dihitung dengan nol', { ...base, is_counted: false, physical_quantity: '0.000000' }],
    ['dihitung dengan null', { ...base, is_counted: true, physical_quantity: null }],
    ['physical_quantity tidak ada di baris', { ...base, is_counted: true }],
    ['physical_quantity tidak ada, belum dihitung', { ...base, is_counted: false }],
    ['is_counted bukan boolean', { ...base, is_counted: 'false', physical_quantity: null }],
    ['fisik negatif', { ...base, is_counted: true, physical_quantity: '-1.000000' }],
    ['fisik berupa number JavaScript', { ...base, is_counted: true, physical_quantity: 0 }],
    ['desimal lebih dari 6 digit', { ...base, is_counted: true, physical_quantity: '1.0000001' }],
    ['field tambahan', { ...base, is_counted: false, physical_quantity: null, warehouse: 'WH-01' }],
    ['material_code kosong', { ...base, material_code: '', is_counted: false, physical_quantity: null }],
    ['bukan objek', null],
  ])('%s → INVALID_FILE', (_label, input) => {
    expect(() => toCountLineDraft(input)).toThrow(CountCommitError);
    try { toCountLineDraft(input); } catch (error) { expect((error as CountCommitError).code).toBe('INVALID_FILE'); }
  });
});

describe('SRS-27 CountCommitWriter (fake)', () => {
  it('menulis satu sesi dan semua baris; scope, cutoff, dan source_row tertelusur; null tetap null', async () => {
    const result = await writer().write(tx, batch());
    expect(result.committed_count).toBe(fixture.rows.length);
    expect(tx.sessions).toEqual([{ id: result.session_id, batch_id: BATCH, cutoff_id: CUTOFF, warehouse_id: WAREHOUSE, mode: 'UJI' }]);
    expect(tx.lines.map((line) => line.source_row_id)).toEqual(staged.map((row) => row.source_row_id));
    expect(tx.lines.every((line) => line.session_id === result.session_id)).toBe(true);
    const notCounted = tx.lines.filter((line) => !line.is_counted);
    expect(notCounted.length).toBeGreaterThan(0);
    expect(notCounted.every((line) => line.physical_quantity === null)).toBe(true);
    expect(tx.lines.find((line) => line.is_counted && line.physical_quantity === '0.000000')).toBeDefined();
  });

  it('material diselesaikan ke UUID referensi pada scope batch; kode sumber tidak disimpan sebagai material_id', async () => {
    await writer().write(tx, batch());
    expect(tx.calls.filter((call) => call.startsWith('material.resolve')).every((call) => call.includes(`${WAREHOUSE}:UJI:`))).toBe(true);
    expect(tx.lines.every((line) => /^b0000000-/.test(line.material_id))).toBe(true);
  });

  it('referensi material tidak ditemukan → MISSING_REFERENCE tanpa penulisan apa pun', async () => {
    materials.clear();
    expect(await code(writer().write(tx, batch()))).toBe('MISSING_REFERENCE');
    expect(tx.calls.filter((call) => call.endsWith('.insert'))).toHaveLength(0);
  });

  it('satu baris melanggar invarian → INVALID_FILE sebelum penulisan apa pun', async () => {
    staged = [...staged, { source_row_id: 'a0000000-0000-4000-8000-000000000099', row_number: 99,
      normalized: { material_code: 'UJI-MAT-01', uom: 'KG', is_counted: false, physical_quantity: '0.000000' } }];
    expect(await code(writer().write(tx, batch()))).toBe('INVALID_FILE');
    expect(tx.calls.filter((call) => call.endsWith('.insert'))).toHaveLength(0);
  });

  it('cutoff_id tidak ada → INVALID_METADATA (10152 butir 3); ACTUAL → CUTOFF_UNVERIFIED (ditahan)', async () => {
    expect(await code(writer().write(tx, batch({ cutoff_id: null })))).toBe('INVALID_METADATA');
    expect(await code(writer().write(tx, batch({ mode: 'ACTUAL' })))).toBe('CUTOFF_UNVERIFIED');
    expect(tx.calls).toHaveLength(0);
  });

  it('kegagalan penyimpanan diteruskan apa adanya ke transaksi pemanggil (rollback milik UnitOfWork)', async () => {
    failInsertLines = true;
    await expect(writer().write(tx, batch())).rejects.toThrow('PRIVATE_DRIVER_SENTINEL');
    expect(tx.lines).toHaveLength(0);
  });
});
