import { z } from 'zod';
import { StageError, type ImportKind, type SourceAdapter, type NormalizedSourceRow } from './staging-contract.js';

const text = z.string().min(1).max(128);
// Representasi desimal persis; tidak melewati Number, tidak menebak locale/UOM.
const decimal = z.string().regex(/^-?(?:0|[1-9]\d{0,13})(?:\.\d{1,6})?$/);
const nonnegative = decimal.refine((v) => !v.startsWith('-'));
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => {
  const time = Date.parse(v); return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === v;
});
const instant = z.string().datetime({ offset: true });
const schemas = {
  EXPECTED: z.object({ source_ref: text, material_code: text, supplier_code: text, uom: text,
    requested_date: date, expected_quantity: nonnegative }).strict(),
  COMMITMENT: z.object({ inbound_source_ref: text, event_ref: text, event_type: z.enum(['INITIAL', 'CHANGE']),
    promised_date: date, event_at: instant }).strict(),
  RECEIVING: z.object({ inbound_source_ref: text, event_ref: text, received_quantity: nonnegative, uom: text,
    received_at: instant, is_closing: z.boolean(), closing_reference: text.nullable() }).strict()
    .refine((v) => !v.is_closing || !!v.closing_reference),
  STOCK: z.object({ material_code: text, uom: text, system_quantity: decimal }).strict(),
  COUNT: z.object({ material_code: text, uom: text, is_counted: z.boolean(), physical_quantity: nonnegative.nullable() }).strict()
    .refine((v) => v.is_counted ? v.physical_quantity !== null : v.physical_quantity === null),
};
const rowSchema = z.object({ row_number: z.number().int().positive().safe(),
  component: z.string().optional(), normalized: z.unknown() }).passthrough();

/** Parser fixture sintetis SRS-37. Bukan parser CSV/XLSX atau header mitra. */
export class FixtureSourceAdapter implements SourceAdapter {
  readonly version = 'uji-fixture/proposed-0.1';
  readonly components: readonly string[];
  constructor(readonly kind: ImportKind) { this.components = [kind === 'STOCK' ? 'balance' : 'file']; }
  parse(bytes: Buffer, component: string): NormalizedSourceRow[] {
    try {
      const file = z.object({ kind: z.literal(this.kind), contract_version: z.literal('proposed-0.1'),
        rows: z.array(rowSchema).min(1) }).passthrough().parse(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
      const seen = new Set<number>();
      return file.rows.map((row) => {
        if (seen.has(row.row_number) || (row.component && row.component !== component)) throw new Error();
        seen.add(row.row_number);
        return { row_number: row.row_number, raw: row, normalized: schemas[this.kind].parse(row.normalized) };
      });
    } catch { throw new StageError('INVALID_FILE'); }
  }
}
