import { z } from 'zod';
import { FixtureSourceAdapter } from './fixture-source-adapter.js';
import { StageError, type NormalizedSourceRow, type SourceAdapter } from './staging-contract.js';

/**
 * Paket STOCK UJI (SRS-26): saldo wajib + dukungan opsional (DOC-08 STOCK, SRS-37 §4.4).
 * Modul murni: tanpa DB, tanpa storage, tanpa endpoint. Bukan kontrak ACTUAL.
 *
 * SOURCE REQUIRED / OPEN yang TIDAK diputuskan di sini:
 * - Skema payload komponen support (OD-05). Adapter hanya memeriksa bentuk generik.
 * - Kebijakan saldo negatif (OD-05): dilaporkan sebagai open_decisions, bukan error.
 * - Line key STOCK: `material_code|uom` adalah usulan UJI, belum disahkan.
 * - Persistensi stock_support_rows: tabelnya belum ada pada migrasi 001-006.
 */

/** Nama komponen support usulan (master/movement/WO, SRS-37 §4.4). PROPOSED. */
export const stockSupportComponents = ['support_master', 'support_movement', 'support_wo'] as const;
export type StockSupportComponent = typeof stockSupportComponents[number];

export type StockIssueCode = 'INVALID_FILE' | 'MISSING_REFERENCE' | 'DUPLICATE_SOURCE';
export interface StockIssue { code: StockIssueCode; component: string; row_number: number | null; detail: string; }
export interface StockWarning { code: 'OPTIONAL_COMPONENT_ABSENT'; component: StockSupportComponent; }

export interface StockLine {
  /** Usulan UJI `material_code|uom`; belum disahkan. */
  line_key: string;
  material_code: string;
  uom: string;
  /** String persis dari komponen balance; tidak pernah dihitung dari support. */
  system_quantity: string;
  source: { component: 'balance'; row_number: number };
  /** Lineage support yang merujuk material_code ini; tidak mengubah saldo. */
  support: { component: StockSupportComponent; row_number: number }[];
}

export interface StockPackageInput {
  balance: readonly NormalizedSourceRow[];
  /** Komponen yang tidak dikirim cukup dihilangkan; array kosong dianggap diberikan tetapi invalid. */
  support?: Partial<Record<StockSupportComponent, readonly NormalizedSourceRow[]>>;
  /** Referensi material mode UJI (disuntik). Bila tidak diberikan, pemeriksaan referensi dilewati. */
  materialCodes?: ReadonlySet<string>;
}
export interface StockPackageResult {
  ok: boolean;
  lines: StockLine[];
  issues: StockIssue[];
  warnings: StockWarning[];
  open_decisions: { id: 'OD-05'; detail: string; row_number: number }[];
}

const scalar = z.union([z.string(), z.number().finite(), z.boolean(), z.null()]);
const supportRecord = z.record(z.string().min(1), scalar).refine((v) => Object.keys(v).length > 0);

/**
 * Parser fixture UJI untuk satu komponen support. Hanya memeriksa struktur generik karena
 * skema support SOURCE REQUIRED (OD-05); tidak menebak nama field atau header mitra.
 */
export class StockSupportFixtureAdapter implements SourceAdapter {
  readonly kind = 'STOCK' as const;
  readonly version = 'uji-fixture/proposed-0.1';
  readonly components: readonly string[] = stockSupportComponents;
  parse(bytes: Buffer, component: string): NormalizedSourceRow[] {
    try {
      if (!(stockSupportComponents as readonly string[]).includes(component)) throw new Error();
      const file = z.object({ kind: z.literal('STOCK'), contract_version: z.literal('proposed-0.1'),
        rows: z.array(z.object({ row_number: z.number().int().positive().safe(), component: z.literal(component),
          raw: z.record(z.string(), z.unknown()), normalized: supportRecord }).strict()).min(1) }).passthrough()
        .parse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
      const seen = new Set<number>();
      return file.rows.map((row) => {
        if (seen.has(row.row_number)) throw new Error();
        seen.add(row.row_number);
        return { row_number: row.row_number, raw: row, normalized: row.normalized };
      });
    } catch { throw new StageError('INVALID_FILE'); }
  }
}

const balanceShape = z.object({ material_code: z.string().min(1), uom: z.string().min(1), system_quantity: z.string() });

/** Memvalidasi relasi saldo/support. Saldo tidak pernah dihitung ulang dari support. */
export function validateStockPackage(input: StockPackageInput): StockPackageResult {
  const issues: StockIssue[] = [];
  const warnings: StockWarning[] = [];
  const open: StockPackageResult['open_decisions'] = [];
  const lines: StockLine[] = [];
  const byKey = new Map<string, StockLine>();
  const byMaterial = new Map<string, StockLine[]>();

  if (input.balance.length === 0) issues.push({ code: 'INVALID_FILE', component: 'balance', row_number: null, detail: 'balance wajib dan tidak boleh kosong' });
  for (const row of input.balance) {
    const parsed = balanceShape.safeParse(row.normalized);
    if (!parsed.success) { issues.push({ code: 'INVALID_FILE', component: 'balance', row_number: row.row_number, detail: 'field balance tidak lengkap' }); continue; }
    const { material_code, uom, system_quantity } = parsed.data;
    const line_key = `${material_code}|${uom}`;
    if (input.materialCodes && !input.materialCodes.has(material_code)) {
      issues.push({ code: 'MISSING_REFERENCE', component: 'balance', row_number: row.row_number, detail: 'material_code tidak ada pada referensi UJI' });
    }
    const existing = byKey.get(line_key);
    if (existing) {
      issues.push({ code: 'DUPLICATE_SOURCE', component: 'balance', row_number: row.row_number, detail: `line key sama dengan baris ${existing.source.row_number}` });
      continue;
    }
    if (system_quantity.startsWith('-')) open.push({ id: 'OD-05', row_number: row.row_number, detail: 'saldo negatif: kebijakan belum diputuskan, tidak ditolak dan tidak dikoreksi' });
    const line: StockLine = { line_key, material_code, uom, system_quantity, source: { component: 'balance', row_number: row.row_number }, support: [] };
    byKey.set(line_key, line); lines.push(line);
    byMaterial.set(material_code, [...(byMaterial.get(material_code) ?? []), line]);
  }

  for (const component of stockSupportComponents) {
    const rows = input.support?.[component];
    if (rows === undefined) { warnings.push({ code: 'OPTIONAL_COMPONENT_ABSENT', component }); continue; }
    if (rows.length === 0) { issues.push({ code: 'INVALID_FILE', component, row_number: null, detail: 'komponen diberikan tetapi kosong' }); continue; }
    const seen = new Set<number>();
    for (const row of rows) {
      if (seen.has(row.row_number)) { issues.push({ code: 'DUPLICATE_SOURCE', component, row_number: row.row_number, detail: 'nomor baris ganda' }); continue; }
      seen.add(row.row_number);
      if (!supportRecord.safeParse(row.normalized).success) { issues.push({ code: 'INVALID_FILE', component, row_number: row.row_number, detail: 'payload support tidak berbentuk record skalar' }); continue; }
      // Relasi usulan: bila support menyebut material_code, harus ada pada saldo paket yang sama.
      const material = (row.normalized as Record<string, unknown>).material_code;
      if (material === undefined) continue;
      const targets = typeof material === 'string' ? byMaterial.get(material) : undefined;
      if (!targets) { issues.push({ code: 'MISSING_REFERENCE', component, row_number: row.row_number, detail: 'material_code support tidak ada pada saldo paket' }); continue; }
      for (const line of targets) line.support.push({ component, row_number: row.row_number });
    }
  }
  return { ok: issues.length === 0, lines, issues, warnings, open_decisions: open };
}

/** Satu adapter paket: jangan mendaftarkan dua adapter STOCK dengan versi sama. */
export class StockPackageFixtureAdapter implements SourceAdapter {
  readonly kind = 'STOCK' as const;
  readonly version = 'uji-fixture/proposed-0.1';
  readonly components: readonly string[] = ['balance'];
  readonly optionalComponents: readonly string[] = stockSupportComponents;
  private readonly balance = new FixtureSourceAdapter('STOCK');
  private readonly support = new StockSupportFixtureAdapter();
  parse(bytes: Buffer, component: string): NormalizedSourceRow[] {
    return component === 'balance' ? this.balance.parse(bytes, component) : this.support.parse(bytes, component);
  }
}
