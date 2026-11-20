import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
function filesIn(folder) {
  return readdirSync(resolve(root, folder), {withFileTypes: true}).flatMap((entry) => {
    if (['node_modules','dist','.vite'].includes(entry.name)) return [];
    const path = `${folder}/${entry.name}`;
    return entry.isDirectory() ? filesIn(path) : [path];
  }).sort();
}
function digest(paths) {
  const hash = createHash('sha256');
  for (const path of [...paths].sort()) { hash.update(path); hash.update('\0'); hash.update(readFileSync(resolve(root, path))); hash.update('\0'); }
  return hash.digest('hex');
}
export function evidenceIdentity() {
  const source = ['package.json','package-lock.json','tsconfig.base.json','tsconfig.test.json','eslint.config.js','vitest.config.ts','playwright.config.ts','.github/workflows/uji-harness.yml',...filesIn('apps'),...filesIn('packages'),...filesIn('tests'),...filesIn('scripts').filter((path) => path.endsWith('.mjs'))];
  return {
    evidence_version: 'SRS-54/proposed-0.1', mode: 'UJI',
    build_commit: execFileSync('git', ['rev-parse','HEAD'], {cwd: root, encoding:'utf8'}).trim(),
    build_sha256: digest(source), schema_sha256: digest(filesIn('database/migrations')),
    dataset_sha256: digest(filesIn('database/fixtures/uji')), node: process.version,
    baseline_postgresql: '16.6', clock: '2026-11-20T03:00:00.000Z',
  };
}
