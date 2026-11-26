/**
 * Pemeriksa skema kontrak DOC-09 untuk tes fixture layar. Hanya untuk tes.
 *
 * Membaca OpenAPI JSON yang tertanam di development-docs/09_API_SPECIFICATION.md
 * (blok ```json pertama) lalu memeriksa nilai terhadap `components.schemas`.
 * Subset kata kunci yang didukung adalah yang dipakai DOC-09: $ref, type (termasuk
 * ["string","null"]), const, enum, required, properties, additionalProperties:false,
 * items, pattern, format uuid/date-time/date, minimum, maximum, anyOf.
 * Kata kunci lain sengaja membuat pemeriksaan gagal agar tidak lolos diam-diam.
 */
import { readFileSync } from 'node:fs';

type Schema = Record<string, unknown>;

const DOC09_URL = new URL('../../../../../development-docs/09_API_SPECIFICATION.md', import.meta.url);
const SUPPORTED = new Set([
  '$ref', 'type', 'const', 'enum', 'required', 'properties', 'additionalProperties',
  'items', 'pattern', 'format', 'minimum', 'maximum', 'anyOf', 'description',
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

let cached: Record<string, Schema> | null = null;

export function doc09Schemas(): Record<string, Schema> {
  if (cached) return cached;
  const text = readFileSync(DOC09_URL, 'utf8');
  const match = /```json\n([\s\S]*?)\n```/.exec(text);
  if (!match) throw new Error('DOC09_OPENAPI_NOT_FOUND');
  const openapi = JSON.parse(match[1]) as { components: { schemas: Record<string, Schema> } };
  cached = openapi.components.schemas;
  return cached;
}

function typeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  return typeof value;
}

function typeMatches(expected: string, actual: string): boolean {
  return expected === actual || (expected === 'number' && actual === 'integer');
}

function check(schema: Schema, value: unknown, path: string, errors: string[]): void {
  for (const key of Object.keys(schema)) {
    if (!SUPPORTED.has(key)) errors.push(`${path}: kata kunci tidak didukung "${key}"`);
  }
  if (typeof schema.$ref === 'string') {
    const name = schema.$ref.replace('#/components/schemas/', '');
    const target = doc09Schemas()[name];
    if (!target) errors.push(`${path}: $ref tidak ditemukan ${schema.$ref}`);
    else check(target, value, path, errors);
    return;
  }
  if (Array.isArray(schema.anyOf)) {
    const ok = schema.anyOf.some((option) => {
      const sub: string[] = [];
      check(option as Schema, value, path, sub);
      return sub.length === 0;
    });
    if (!ok) errors.push(`${path}: tidak cocok dengan anyOf`);
  }
  const actual = typeOf(value);
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? (schema.type as string[]) : [schema.type as string];
    if (!types.some((t) => typeMatches(t, actual))) {
      errors.push(`${path}: tipe ${actual}, diharapkan ${types.join('|')}`);
      return;
    }
  }
  if ('const' in schema && value !== schema.const) errors.push(`${path}: harus ${JSON.stringify(schema.const)}`);
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) errors.push(`${path}: di luar enum`);
  if (typeof value === 'string') {
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern).test(value)) errors.push(`${path}: tidak cocok pattern`);
    if (schema.format === 'uuid' && !UUID.test(value)) errors.push(`${path}: bukan uuid`);
    if (schema.format === 'date-time' && !DATE_TIME.test(value)) errors.push(`${path}: bukan date-time ber-offset`);
    if (schema.format === 'date' && !DATE.test(value)) errors.push(`${path}: bukan date`);
  }
  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) errors.push(`${path}: < minimum`);
    if (typeof schema.maximum === 'number' && value > schema.maximum) errors.push(`${path}: > maximum`);
  }
  if (actual === 'array' && schema.items) {
    (value as unknown[]).forEach((item, i) => check(schema.items as Schema, item, `${path}[${i}]`, errors));
  }
  if (actual === 'object') {
    const object = value as Record<string, unknown>;
    const properties = (schema.properties ?? {}) as Record<string, Schema>;
    for (const name of (schema.required ?? []) as string[]) {
      if (!(name in object)) errors.push(`${path}.${name}: wajib`);
    }
    for (const [name, child] of Object.entries(object)) {
      if (properties[name]) check(properties[name], child, `${path}.${name}`, errors);
      else if (schema.additionalProperties === false) errors.push(`${path}.${name}: properti tidak dikenal`);
    }
  }
}

/** Mengembalikan daftar pelanggaran; kosong berarti nilai cocok dengan skema DOC-09. */
export function validateDoc09(schemaName: string, value: unknown): string[] {
  const schema = doc09Schemas()[schemaName];
  if (!schema) return [`skema ${schemaName} tidak ada di DOC-09`];
  const errors: string[] = [];
  check(schema, value, schemaName, errors);
  return errors;
}

/** Memeriksa nilai terhadap skema inline (mis. respons daftar API-16/API-20). */
export function validateInline(schema: Schema, value: unknown, path = 'response'): string[] {
  const errors: string[] = [];
  check(schema, value, path, errors);
  return errors;
}

/** Skema respons 200 suatu endpoint DOC-09 berdasarkan x-endpoint-id. */
export function doc09ResponseSchema(endpointId: string): Schema {
  const text = readFileSync(DOC09_URL, 'utf8');
  const match = /```json\n([\s\S]*?)\n```/.exec(text);
  if (!match) throw new Error('DOC09_OPENAPI_NOT_FOUND');
  const paths = (JSON.parse(match[1]) as { paths: Record<string, Record<string, Schema>> }).paths;
  for (const methods of Object.values(paths)) {
    for (const operation of Object.values(methods)) {
      if (operation['x-endpoint-id'] === endpointId) {
        const responses = operation.responses as Record<string, { content?: Record<string, { schema: Schema }> }>;
        const ok = responses['200'] ?? responses['201'];
        const schema = ok?.content?.['application/json']?.schema;
        if (schema) return schema;
      }
    }
  }
  throw new Error(`DOC09_ENDPOINT_NOT_FOUND ${endpointId}`);
}
