// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
// @ts-expect-error — modul generator berupa .mjs tanpa deklarasi tipe
import { buildCss, extractRegistryText, flatten, validateAliases } from '../../../../scripts/lib/design-tokens.mjs';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
// Checkout Windows dengan core.autocrlf=true dapat mengubah LF menjadi CRLF pada berkas
// yang dibaca di sini. Hanya pemisah baris yang dinormalisasi; perbedaan isi tetap terdeteksi.
const toLf = (text: string): string => text.replace(/\r\n/g, '\n');

const designMd = toLf(readFileSync(join(root, 'design.md'), 'utf8'));
const generatedCss = toLf(
  readFileSync(join(root, 'apps/web/src/styles/generated/tokens.css'), 'utf8'),
);
const generatedJson = toLf(
  readFileSync(join(root, 'apps/web/src/styles/generated/design-tokens.json'), 'utf8'),
);

describe('Token desain dari design.md §4.9', () => {
  const registryText: string = extractRegistryText(designMd);
  const registry = JSON.parse(registryText);
  const tokens = flatten(registry);

  it('tidak berubah dari registry design.md (tidak ada drift)', () => {
    expect(JSON.parse(generatedJson)).toEqual(registry);
    const { css } = buildCss(tokens);
    expect(generatedCss.trim()).toBe(css.trim());
  });

  it('toleran terhadap CRLF pada hasil generate, tetapi tetap mendeteksi perbedaan isi', () => {
    const { css } = buildCss(tokens);
    const crlfCss = css.replace(/\n/g, '\r\n');
    expect(crlfCss).toContain('\r\n');
    expect(toLf(crlfCss).trim()).toBe(css.trim());
    expect(toLf(crlfCss)).toContain(':root,\n[data-theme="light"]');
    const changed = crlfCss.replace('70ch', '71ch');
    expect(changed).not.toBe(crlfCss);
    expect(toLf(changed).trim()).not.toBe(css.trim());
  });

  it('seluruh alias valid dan tidak siklik', () => {
    expect(() => validateAliases(tokens)).not.toThrow();
  });

  it('mengunci tema terang sebagai default dan menyediakan tema cadangan', () => {
    expect(generatedCss).toContain(':root,\n[data-theme="light"]');
    expect(generatedCss).toContain('[data-theme="dark"]');
    expect(generatedCss).toContain('[data-theme="high-contrast"]');
  });

  it('menerapkan satuan ch pada lebar prosa', () => {
    expect(generatedCss).toMatch(/--layout-prose-ch:\s*70ch;/);
  });

  it('semua var(--x) pada tokens.css terdefinisi', () => {
    const defined = new Set([...generatedCss.matchAll(/(--[a-z0-9-]+):/g)].map((m) => m[1]));
    const used = [...generatedCss.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]);
    const missing = used.filter((name) => !defined.has(name));
    expect(missing).toEqual([]);
  });
});

describe('Aturan token-only pada gaya komponen dasar', () => {
  const dir = join(root, 'apps/web/src/components/primitives');
  const files = readdirSync(dir).filter((f) => f.endsWith('.vue'));
  const defined = new Set([...generatedCss.matchAll(/(--[a-z0-9-]+):/g)].map((m) => m[1]));

  function styleOf(file: string): string {
    const source = readFileSync(join(dir, file), 'utf8');
    return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  }

  it('menemukan enam komponen dasar', () => {
    expect(files.sort()).toEqual([
      'AlertBanner.vue',
      'BaseButton.vue',
      'BaseInput.vue',
      'BaseSelect.vue',
      'FormField.vue',
      'StatusBadge.vue',
    ]);
  });

  it.each(files)('%s tidak memakai warna atau piksel literal', (file) => {
    const css = styleOf(file);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\brgba?\(/);
    expect(css).not.toMatch(/(?<![\w-])[1-9]\d*(\.\d+)?px\b/);
  });

  it.each(files)('%s hanya merujuk token yang ada dan bukan token primitif', (file) => {
    const css = styleOf(file);
    const localVars = new Set([...css.matchAll(/(--siris-[a-z-]+):/g)].map((m) => m[1]));
    const used = [...css.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]);
    const unknown = used.filter((name) => !defined.has(name) && !localVars.has(name));
    expect(unknown).toEqual([]);
  });

  it('base.css hanya merujuk token yang ada', () => {
    const css = readFileSync(join(root, 'apps/web/src/styles/base.css'), 'utf8');
    const used = [...css.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]);
    expect(used.filter((name) => !defined.has(name))).toEqual([]);
  });
});
