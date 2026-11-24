import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  toCountSessionDto,
  toReconciliationCountLine,
  type CountLineRecord,
  type CountQueryClient,
  type CountRepository,
  type CountScope,
  type CountSessionRecord,
} from '../modules/count/count-contract.js';

/** Fixture record SRS-27 (UJI) dan fixture sumber SRS-37 yang menjadi asalnya. */
const records = JSON.parse(
  readFileSync(new URL('./fixtures/count-records.uji.proposed-0.1.json', import.meta.url), 'utf8'),
);
const source = JSON.parse(
  readFileSync(
    new URL('../../../../database/fixtures/uji/count.proposed-0.1.json', import.meta.url),
    'utf8',
  ),
);

type FixtureLine = {
  source_row_number: number;
  material_code: string;
  record: CountLineRecord;
};

const session: CountSessionRecord = records.session;
const lines: FixtureLine[] = records.lines;

/**
 * Oracle tes yang menyalin CHECK DOC-07 count_lines. Bukan validator produksi; validasi
 * file tetap milik adapter PR #27 dan penegakan tabel menunggu migrasi.
 */
function satisfiesDoc07Check(isCounted: unknown, physical: unknown): boolean {
  if (isCounted === true) {
    return typeof physical === 'string' && /^\d+(\.\d{1,6})?$/.test(physical);
  }
  if (isCounted === false) return physical === null;
  return false;
}

/** Repository palsu di memori untuk menguji kontrak interface, bukan implementasi DB. */
function memoryRepository(
  sessions: CountSessionRecord[],
  allLines: CountLineRecord[],
): CountRepository {
  return {
    async findSession(_client: CountQueryClient, scope: CountScope, sessionId: string) {
      const found = sessions.find((item) => item.id === sessionId);
      if (!found || found.warehouse_id !== scope.warehouse_id || found.mode !== scope.mode) {
        return null;
      }
      return { ...found };
    },
    async listLines(_client: CountQueryClient, sessionId: string) {
      return allLines
        .filter((item) => item.session_id === sessionId)
        .map((item) => ({ ...item }))
        .sort((a, b) =>
          a.material_id === b.material_id
            ? a.uom.localeCompare(b.uom, 'en')
            : a.material_id.localeCompare(b.material_id, 'en'),
        );
    },
  };
}

const client = {} as CountQueryClient;
const scope: CountScope = { warehouse_id: session.warehouse_id, mode: 'UJI' };

describe('SRS-27 fixture record COUNT konsisten dengan fixture SRS-37', () => {
  it('konteks sesi sama dengan metadata COUNT SRS-37 dan batch-nya', () => {
    expect(session).toMatchObject({
      warehouse_id: source.metadata.warehouse_id,
      cutoff_id: source.metadata.cutoff_id,
      mode: source.metadata.mode,
      batch_id: records.batch.id,
    });
    expect(records.batch).toMatchObject({
      kind: 'COUNT',
      warehouse_id: session.warehouse_id,
      cutoff_id: session.cutoff_id,
      mode: 'UJI',
    });
  });

  it('setiap baris record sama maknanya dengan baris normalized sumber', () => {
    for (const line of lines) {
      const row = source.rows.find(
        (item: { row_number: number }) => item.row_number === line.source_row_number,
      );
      expect(row.normalized).toEqual({
        material_code: line.material_code,
        uom: line.record.uom,
        is_counted: line.record.is_counted,
        physical_quantity: line.record.physical_quantity,
      });
    }
  });

  it('contoh ditolak yang merujuk SRS-37 memakai kode yang sama dengan fixture sumber', () => {
    const negatives = new Map<string, string>(
      source.negative_cases.map((item: { case_id: string; expected_issue: string }) => [
        item.case_id,
        item.expected_issue,
      ]),
    );
    expect(records.contoh_ditolak[1].kode_sumber).toBe(negatives.get('UJI-CNT-NEG-01'));
    expect(records.contoh_ditolak[2].kode_sumber).toBe(negatives.get('UJI-CNT-NEG-02'));
  });
});

describe('SRS-27 nol yang sah berbeda dari belum dihitung (oracle CHECK DOC-07)', () => {
  it('hitung nol yang sah (is_counted=true, 0) memenuhi CHECK', () => {
    const zero = lines.find((line) => line.record.is_counted)?.record;
    expect(zero?.physical_quantity).toBe('0.000000');
    expect(satisfiesDoc07Check(zero?.is_counted, zero?.physical_quantity)).toBe(true);
  });

  it('belum dihitung (is_counted=false, null) memenuhi CHECK', () => {
    const notCounted = lines.find((line) => !line.record.is_counted)?.record;
    expect(notCounted?.physical_quantity).toBeNull();
    expect(satisfiesDoc07Check(notCounted?.is_counted, notCounted?.physical_quantity)).toBe(true);
  });

  type RejectedSample = { case_id: string; is_counted: unknown; physical_quantity: unknown };
  const rejectedCases: [string, RejectedSample][] = (
    records.contoh_ditolak as RejectedSample[]
  ).map((item) => [item.case_id, item]);

  it.each(rejectedCases)('%s melanggar CHECK DOC-07', (_caseId, sample) => {
    expect(satisfiesDoc07Check(sample.is_counted, sample.physical_quantity)).toBe(false);
  });

  it('is_counted=false dengan 0 termasuk contoh yang wajib ditolak NOT_COUNTED_VALUE', () => {
    expect(records.contoh_ditolak).toContainEqual(
      expect.objectContaining({
        is_counted: false,
        physical_quantity: '0.000000',
        kode_sumber: 'NOT_COUNTED_VALUE',
      }),
    );
  });
});

describe('SRS-27 pemeta DTO tidak mengubah nilai', () => {
  it('DTO sesi hanya berisi field DOC-09 dan tidak membocorkan batch atau gudang', () => {
    const dto = toCountSessionDto(session);
    expect(dto).toEqual({ id: session.id, cutoff_id: session.cutoff_id, mode: 'UJI' });
    expect(Object.keys(dto).sort()).toEqual(['cutoff_id', 'id', 'mode']);
  });

  it('baris untuk SRS-29 mempertahankan nol sah dan null belum dihitung', () => {
    const mapped = lines.map((line) => toReconciliationCountLine(line.record));
    expect(mapped.map((line) => [line.is_counted, line.physical_quantity])).toEqual([
      [true, '0.000000'],
      [false, null],
    ]);
    expect(mapped.every((line) => !('session_id' in line) && !('source_row_id' in line))).toBe(
      true,
    );
  });

  it('pemeta tidak memperbaiki atau menormalkan nilai secara diam-diam', () => {
    const odd: CountLineRecord = {
      ...lines[1].record,
      is_counted: false,
      physical_quantity: '0',
      uom: 'kg',
    };
    expect(toReconciliationCountLine(odd)).toMatchObject({
      is_counted: false,
      physical_quantity: '0',
      uom: 'kg',
    });
  });

  it('pemeta tidak mengubah record masukan', () => {
    const record = Object.freeze({ ...lines[0].record });
    expect(() => toReconciliationCountLine(record)).not.toThrow();
    expect(record.physical_quantity).toBe('0.000000');
  });
});

describe('SRS-27 kontrak interface repository (implementasi palsu di memori)', () => {
  const repository = memoryRepository(
    [session],
    lines.map((line) => line.record),
  );

  it('sesi pada scope yang sama ditemukan beserta cutoff dan batch-nya', async () => {
    await expect(repository.findSession(client, scope, session.id)).resolves.toEqual(session);
  });

  it.each([
    ['gudang lain', { ...scope, warehouse_id: '00000000-0000-4000-8000-0000000000ff' }],
    ['mode ACTUAL', { ...scope, mode: 'ACTUAL' as const }],
  ])('sesi di luar scope (%s) menghasilkan null', async (_name, otherScope) => {
    await expect(repository.findSession(client, otherScope, session.id)).resolves.toBeNull();
  });

  it('sesi tidak ada juga menghasilkan null yang sama', async () => {
    await expect(
      repository.findSession(client, scope, '40000000-0000-4000-8000-0000000000ff'),
    ).resolves.toBeNull();
  });

  it('setiap baris tertelusur ke sesi, batch, cutoff dan baris sumber', async () => {
    const found = await repository.findSession(client, scope, session.id);
    const rows = await repository.listLines(client, session.id);
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.session_id).toBe(found?.id);
      expect(row.source_row_id).toMatch(/^[0-9a-f-]{36}$/);
    }
    expect(found).toMatchObject({ batch_id: records.batch.id, cutoff_id: records.batch.cutoff_id });
  });

  it('baris dikembalikan urut material_id dan nilai null tetap null', async () => {
    const rows = await repository.listLines(client, session.id);
    expect(rows.map((row) => row.material_id)).toEqual(
      [...rows.map((row) => row.material_id)].sort(),
    );
    expect(rows.find((row) => !row.is_counted)?.physical_quantity).toBeNull();
  });
});
