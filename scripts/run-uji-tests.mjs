import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { evidenceIdentity } from '../tests/helpers/evidence.mjs';

if (process.versions.node.split('.')[0] !== '22') throw new Error('BLOCKED: gunakan Node.js22.');
if (process.env.SIRIS_UJI_ENV_FILE) Object.assign(process.env, JSON.parse(readFileSync(process.env.SIRIS_UJI_ENV_FILE, 'utf8')));
if (!process.env.DATABASE_URL || !process.env.DATABASE_MIGRATION_URL) throw new Error('BLOCKED: kedua koneksi UJI wajib tersedia; tidak menjalankan tes dengan DB SKIPPED.');
mkdirSync('test-results', {recursive: true});
const identity = evidenceIdentity();
const startedAt = new Date().toISOString();
const result = spawnSync('npm', ['test','--','--reporter=json','--outputFile=test-results/vitest.json'], {env: {...process.env, NODE_ENV:'test'}, stdio:'inherit'});
let report;
try { report = JSON.parse(readFileSync('test-results/vitest.json', 'utf8')); } catch { report = {}; }
const assertions = (report.testResults ?? []).flatMap((suite) => (suite.assertionResults ?? []).map((test) => ({name: test.fullName, status: test.status === 'passed' ? 'PASS' : test.status === 'failed' ? 'FAIL' : 'SKIPPED'})));
writeFileSync('test-results/evidence-vitest.json', JSON.stringify({ ...identity, started_at:startedAt, finished_at:new Date().toISOString(), exit_code:result.status, assertions }, null, 2));
process.exit(result.status ?? 1);
