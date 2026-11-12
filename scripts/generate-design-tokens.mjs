#!/usr/bin/env node
// Generator token desain SIRIS: design.md §4.9 -> design-tokens.json + tokens.css.
// Pemakaian:
//   npm run tokens:generate   menulis berkas hasil generate
//   npm run tokens:check      gagal (exit 1) jika berkas hasil generate tidak sinkron dengan design.md
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCss, extractRegistryText, flatten } from './lib/design-tokens.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'apps/web/src/styles/generated');
const targets = {
  json: resolve(outDir, 'design-tokens.json'),
  css: resolve(outDir, 'tokens.css'),
};

const checkOnly = process.argv.includes('--check');
const normalize = (s) => s.replace(/\r\n/g, '\n');

const markdown = readFileSync(resolve(root, 'design.md'), 'utf8');
const jsonText = extractRegistryText(markdown);
const registry = JSON.parse(jsonText);
const { css, stats } = buildCss(flatten(registry));

if (checkOnly) {
  const drift = [];
  for (const [key, content] of [['json', jsonText], ['css', css]]) {
    const path = targets[key];
    if (!existsSync(path) || normalize(readFileSync(path, 'utf8')) !== normalize(content)) drift.push(path);
  }
  if (drift.length) {
    console.error('Token tidak sinkron dengan design.md. Jalankan: npm run tokens:generate');
    for (const p of drift) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`Token sinkron dengan design.md (${stats.total} token terbaca).`);
} else {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(targets.json, jsonText);
  writeFileSync(targets.css, css);
  console.log(
    `Token dihasilkan: ${stats.total} dibaca (${stats.primitive} primitive tidak diemit); ` +
      `base ${stats.base}, light ${stats.light}, dark ${stats.dark}, high-contrast ${stats.highContrast}.`,
  );
}
