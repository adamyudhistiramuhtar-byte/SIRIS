// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// Aturan token-only (design.md §5) untuk komponen pola impor: gaya hanya memakai token
// semantic/component, tanpa warna atau piksel literal. Berkas terpisah dari design-tokens.spec.ts
// agar tidak bersinggungan dengan perbaikan CRLF/LF yang ditinjau pada PR terpisah.
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const patterns = join(root, 'apps/web/src/components/patterns');
const files = ['FileUpload.vue', 'ImportWizard.vue', 'ValidationReport.vue'];

const tokensCss = readFileSync(join(root, 'apps/web/src/styles/generated/tokens.css'), 'utf8');
const defined = new Set([...tokensCss.matchAll(/(--[a-z0-9-]+):/g)].map((m) => m[1]));

function styleOf(file: string): string {
  const source = readFileSync(join(patterns, file), 'utf8');
  return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
}

describe('Aturan token-only pada komponen pola impor', () => {
  it.each(files)('%s tidak memakai warna atau piksel literal', (file) => {
    const css = styleOf(file);
    expect(css.length).toBeGreaterThan(0);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\brgba?\(/);
    expect(css).not.toMatch(/(?<![\w-])[1-9]\d*(\.\d+)?px\b/);
  });

  it.each(files)('%s hanya merujuk token yang ada', (file) => {
    const css = styleOf(file);
    const localVars = new Set([...css.matchAll(/(--siris-[a-z-]+):/g)].map((m) => m[1]));
    const used = [...css.matchAll(/var\((--[a-z0-9-]+)\)/g)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(0);
    expect(used.filter((name) => !defined.has(name) && !localVars.has(name))).toEqual([]);
  });
});
