/**
 * Persiapan QA SRS-59: integritas matriks kasus, uji oracle, dan satu langkah PVT yang bisa
 * dijalankan sekarang. Data SIMULATED, mode UJI.
 *
 * Penting: blok "Uji oracle" menguji bahwa oracle dapat membedakan observasi benar dan salah.
 * Itu BUKAN eksekusi PVT dan tidak boleh dicatat sebagai PASS untuk kasus DOC-13 mana pun.
 * Satu-satunya eksekusi PVT di sini adalah PVT-17 langkah 2 terhadap engine #36 (develop).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { reconcile, type ReconciliationContext } from '../../../apps/api/src/modules/reconciliation/reconciliation-engine.js';
import {
  grownTables,
  judgeDuplicateImport,
  judgeIdempotency,
  judgeNoDoubleCounting,
  judgePreviewExpiry,
  judgeRejectedImport,
  judgeRollback,
  judgeTampering,
  judgeWarehouseScope,
  type ApiOutcome,
} from './integrity-oracle.js';

const root = new URL('../../../', import.meta.url);
const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const matrix = readJson('database/fixtures/uji/srs59-integrity-cases.proposed-0.1.json');
const KINDS = ['EXPECTED', 'COMMITMENT', 'RECEIVING', 'STOCK', 'COUNT'] as const;
const sources: Record<string, { negative_cases: { case_id: string }[]; rows: unknown[]; metadata: { mode: string } }> =
  Object.fromEntries(KINDS.map((k) => [k.toLowerCase(), readJson(`database/fixtures/uji/${k.toLowerCase()}.proposed-0.1.json`)]));

/** Kode katalog error DOC-08 (tabel "Katalog error dan warning"). */
function doc08Codes(): Set<string> {
  const text = readFileSync(new URL('development-docs/08_DATA_CONTRACT_IMPORT_SPECIFICATION.md', root), 'utf8');
  const start = text.indexOf('Katalog error');
  return new Set([...text.slice(start).matchAll(/^\| ([A-Z_]+) \| \d{3} \|/gm)].map((m) => m[1]));
}

interface KindCase { kind: string; case_ref: string | null; expected_codes: string[]; status: string; blocked_by?: string[] }
interface Step { langkah: string; status: string; blocked_by?: string[] }
interface MatrixCase { pvt_id: string; oracle: string; per_kind?: KindCase[]; langkah?: Step[] }
const cases: MatrixCase[] = matrix.cases;
const entries = cases.flatMap((c) => [...(c.per_kind ?? []), ...(c.langkah ?? [])].map((e) => ({ pvt: c.pvt_id, ...e })));

const ok = (http_status = 200, body: unknown = {}): ApiOutcome => ({ http_status, error_code: null, body });
const err = (http_status: number, error_code: string, body: unknown = {}): ApiOutcome => ({ http_status, error_code, body });

describe('Integritas matriks kasus SRS-59', () => {
  it('berlabel SIMULATED, mode UJI, PROPOSED, dan mencakup sembilan PVT dari SRS-59', () => {
    expect(matrix.data_label).toBe('SIMULATED');
    expect(matrix.mode).toBe('UJI');
    expect(matrix.contract_status).toBe('PROPOSED');
    expect(cases.map((c) => c.pvt_id)).toEqual(['PVT-01', 'PVT-02', 'PVT-03', 'PVT-04', 'PVT-11', 'PVT-12', 'PVT-15', 'PVT-17', 'PVT-22']);
  });

  it('tidak ada satu pun kasus berstatus PASS atau FAIL di matriks', () => {
    const allowed = new Set(['NOT RUN', 'BLOCKED', 'SOURCE REQUIRED', 'EXECUTABLE_NOW']);
    for (const entry of entries) expect(allowed.has(entry.status), `${entry.pvt} ${entry.status}`).toBe(true);
  });

  it('setiap kasus BLOCKED/SOURCE REQUIRED menyebut penghalangnya', () => {
    for (const entry of entries.filter((e) => e.status === 'BLOCKED' || e.status === 'SOURCE REQUIRED')) {
      expect(entry.blocked_by?.length ?? 0, entry.pvt).toBeGreaterThan(0);
    }
  });

  it('setiap PVT per jenis mencakup kelima impor', () => {
    for (const c of cases.filter((x) => x.per_kind)) {
      expect(c.per_kind?.map((k) => k.kind).sort(), c.pvt_id).toEqual([...KINDS].sort());
    }
  });

  it('rujukan case_id menunjuk negative case yang benar-benar ada di fixture develop', () => {
    for (const entry of entries as (KindCase & { pvt: string })[]) {
      const match = /^(\w+):(UJI-[A-Z]+-[A-Z]+-\d+)$/.exec(entry.case_ref ?? '');
      if (!match) continue;
      const [, file, id] = match;
      expect(sources[file]?.negative_cases.map((n) => n.case_id), `${entry.pvt} ${entry.case_ref}`).toContain(id);
    }
  });

  it('kode yang diharapkan berasal dari katalog DOC-08', () => {
    const catalog = doc08Codes();
    expect(catalog.size).toBeGreaterThan(10);
    for (const entry of entries as (KindCase & { pvt: string })[]) {
      for (const code of entry.expected_codes ?? []) expect(catalog.has(code), `${entry.pvt} ${code}`).toBe(true);
    }
  });

  it('kelima fixture sumber berlabel mode UJI', () => {
    for (const source of Object.values(sources)) expect(source.metadata.mode).toBe('UJI');
  });

  it('temuan fixture dicatat sebagai keputusan, tidak diubah diam-diam', () => {
    const stock = readJson('database/fixtures/uji/stock.proposed-0.1.json');
    const neg03 = stock.negative_cases.find((c: { case_id: string }) => c.case_id === 'UJI-STK-NEG-03');
    const note = matrix.temuan_fixture.find((t: { case_ref: string }) => t.case_ref === 'stock:UJI-STK-NEG-03');
    expect(note.isi_develop).toBe(neg03.expected_issue);
  });
});

describe('Uji oracle (bukan eksekusi PVT)', () => {
  const before = { expected_lines: 2, source_rows: 2 };
  const grew = { expected_lines: 3, source_rows: 2 };

  it('grownTables hanya melaporkan tabel yang bertambah', () => {
    expect(grownTables(before, grew)).toEqual(['expected_lines']);
    expect(grownTables(before, { expected_lines: 1 })).toEqual([]);
  });

  it('judgeRejectedImport: PASS bila ditolak tanpa domain; FAIL bila domain bertambah atau preview siap commit', () => {
    const base = { validation: err(422, 'INVALID_FILE'), preview_can_commit: false, commit_attempt: err(422, 'INVALID_FILE'), expected_codes: ['INVALID_FILE'], domain_before: before, domain_after: before };
    expect(judgeRejectedImport(base).verdict).toBe('PASS');
    expect(judgeRejectedImport({ ...base, domain_after: grew }).verdict).toBe('FAIL');
    expect(judgeRejectedImport({ ...base, preview_can_commit: true }).verdict).toBe('FAIL');
    expect(judgeRejectedImport({ ...base, validation: err(422, 'MISSING_REFERENCE') }).verdict).toBe('FAIL');
    expect(judgeRejectedImport({ ...base, commit_attempt: ok() }).verdict).toBe('FAIL');
  });

  it('judgeDuplicateImport: hasil lama dikenali tanpa domain kedua', () => {
    const base = { first_result_ref: 'run-a', second: { ...ok(), result_ref: 'run-a' }, domain_after_first: grew, domain_after_second: grew, audit_outcomes_for_second: ['SUCCESS'] };
    expect(judgeDuplicateImport(base).verdict).toBe('PASS');
    expect(judgeDuplicateImport({ ...base, second: { ...err(409, 'DUPLICATE_SOURCE'), result_ref: null } }).verdict).toBe('PASS');
    expect(judgeDuplicateImport({ ...base, domain_after_second: { expected_lines: 4 } }).verdict).toBe('FAIL');
    expect(judgeDuplicateImport({ ...base, second: { ...ok(), result_ref: 'run-b' } }).verdict).toBe('FAIL');
    expect(judgeDuplicateImport({ ...base, audit_outcomes_for_second: [] }).verdict).toBe('FAIL');
  });

  it('judgePreviewExpiry: tepat pada TTL wajib PREVIEW_EXPIRED', () => {
    const ttl = 1_800_000;
    const pass = { ttl_ms: ttl, attempts: [{ age_ms: ttl - 1000, outcome: ok(), domain_grew: true }, { age_ms: ttl, outcome: err(410, 'PREVIEW_EXPIRED'), domain_grew: false }] };
    expect(judgePreviewExpiry(pass).verdict).toBe('PASS');
    expect(judgePreviewExpiry({ ttl_ms: ttl, attempts: [pass.attempts[0], { age_ms: ttl, outcome: ok(), domain_grew: true }] }).verdict).toBe('FAIL');
    expect(judgePreviewExpiry({ ttl_ms: ttl, attempts: [{ age_ms: ttl - 1000, outcome: err(410, 'PREVIEW_EXPIRED'), domain_grew: false }] }).verdict).toBe('FAIL');
  });

  it('judgeRollback: FAILURE tercatat, tanpa SUCCESS palsu, domain dan state utuh', () => {
    const base = { outcome: err(500, 'TRANSACTION_FAILED'), domain_before: before, domain_after: before, batch_state_before: 'VALIDATED', batch_state_after: 'VALIDATED', audit_outcomes: ['FAILURE'], db_recovered: true };
    expect(judgeRollback(base).verdict).toBe('PASS');
    expect(judgeRollback({ ...base, audit_outcomes: ['SUCCESS', 'FAILURE'] }).verdict).toBe('FAIL');
    expect(judgeRollback({ ...base, audit_outcomes: [] }).verdict).toBe('FAIL');
    expect(judgeRollback({ ...base, audit_outcomes: [], db_recovered: false }).verdict).toBe('PASS');
    expect(judgeRollback({ ...base, domain_after: grew }).verdict).toBe('FAIL');
    expect(judgeRollback({ ...base, batch_state_after: 'COMMITTED' }).verdict).toBe('FAIL');
  });

  it('judgeIdempotency: satu hasil, retry ID sama, payload berubah 409', () => {
    const r = (ref: string) => ({ ...ok(), result_ref: ref });
    const base = { concurrent: [r('x'), r('x')], retry_after_lost_response: r('x'), changed_payload_same_key: err(409, 'IDEMPOTENCY_CONFLICT'), domain_writes_total: 1 };
    expect(judgeIdempotency(base).verdict).toBe('PASS');
    expect(judgeIdempotency({ ...base, concurrent: [r('x'), r('y')] }).verdict).toBe('FAIL');
    expect(judgeIdempotency({ ...base, retry_after_lost_response: r('y') }).verdict).toBe('FAIL');
    expect(judgeIdempotency({ ...base, changed_payload_same_key: ok() }).verdict).toBe('FAIL');
    expect(judgeIdempotency({ ...base, domain_writes_total: 2 }).verdict).toBe('FAIL');
  });

  it('judgeTampering: fingerprint lama setelah metadata berubah ditolak tanpa commit', () => {
    expect(judgeTampering({ outcome: err(409, 'PREVIEW_CHANGED'), domain_before: before, domain_after: before }).verdict).toBe('PASS');
    expect(judgeTampering({ outcome: ok(), domain_before: before, domain_after: grew }).verdict).toBe('FAIL');
  });

  it('judgeNoDoubleCounting: menolak saldo 13 dan menerima 10 MATCHED', () => {
    const base = { qty_akhir: '10.000000', support_movement_total: '3.000000', stored_system_quantity: '10.000000', reconciliation: { status: 'MATCHED', variance: '0.000000', system_quantity: '10.000000' }, support_rows_stored_separately: true };
    expect(judgeNoDoubleCounting(base).verdict).toBe('PASS');
    expect(judgeNoDoubleCounting({ ...base, stored_system_quantity: '13.000000', reconciliation: { status: 'DISCREPANCY', variance: '-3.000000', system_quantity: '13.000000' } }).verdict).toBe('FAIL');
    expect(judgeNoDoubleCounting({ ...base, support_rows_stored_separately: false }).verdict).toBe('FAIL');
  });

  it('judgeWarehouseScope: 403/404 dan tidak ada data scope B', () => {
    const base = { attempts: [{ label: 'read B', outcome: err(404, 'NOT_FOUND', { error: { code: 'NOT_FOUND' } }) }], forbidden_markers: ['UJI-B'], domain_before: before, domain_after: before };
    expect(judgeWarehouseScope(base).verdict).toBe('PASS');
    expect(judgeWarehouseScope({ ...base, attempts: [{ label: 'read B', outcome: ok(200, { items: [{ warehouse: 'UJI-B' }] }) }] }).verdict).toBe('FAIL');
    expect(judgeWarehouseScope({ ...base, attempts: [{ label: 'read B', outcome: err(403, 'FORBIDDEN', { hint: 'UJI-B' }) }] }).verdict).toBe('FAIL');
  });
});

describe('Eksekusi PVT-17 langkah 2 terhadap engine #36 (develop)', () => {
  const pvt17 = cases.find((c) => c.pvt_id === 'PVT-17') as MatrixCase & { data_uji: Record<string, string> };
  const data = pvt17.data_uji;
  const context: ReconciliationContext = { warehouse_id: '00000000-0000-4000-8000-000000000001', mode: 'UJI', cutoff_id: '00000000-0000-4000-8000-000000000002' };

  it('saldo dari QTY AKHIR saja tidak menjumlahkan movement dukungan', () => {
    const result = reconcile({
      stock: { context, lines: [{ id: '59000000-0000-4000-8000-000000000011', material_id: data.material_id, uom: data.uom, system_quantity: data.qty_akhir }] },
      count: { context, lines: [{ id: '59000000-0000-4000-8000-000000000021', material_id: data.material_id, uom: data.uom, is_counted: true, physical_quantity: data.count_physical }] },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [line] = result.lines;
    const judged = judgeNoDoubleCounting({
      qty_akhir: data.qty_akhir,
      support_movement_total: data.support_movement.replace('+', ''),
      stored_system_quantity: null, // langkah 1 (commit/penyimpanan) BLOCKED
      reconciliation: { status: line.status, variance: line.variance, system_quantity: line.system_quantity },
      support_rows_stored_separately: null, // langkah 3 (lineage dukungan) BLOCKED
    });
    expect(judged).toEqual({ verdict: 'PASS', reasons: [] });
    expect(line).toMatchObject({ status: 'MATCHED', variance: '0.000000', system_quantity: '10.000000' });
  });
});
