/**
 * SRS-91 — kerangka tes I-REPEAT pada dua cutoff dan run terbaru. Status: PROPOSED. Data SIMULATED.
 *
 * Definisi sumber (design.md): "Jumlah item discrepancy pada sedikitnya dua cutoff berbeda dalam
 * periode". Periode, satuan item, perlakuan nonvalid, tampilan satu cutoff, dan tie-break latest
 * belum diputuskan (fixture `open_decisions` Q1–Q5). Karena itu tes ini TIDAK menghitung angka
 * I-REPEAT. Yang diuji sekarang hanya struktur skenario dan konsistensinya dengan I-VAR #37.
 * Hitungan I-REPEAT ditulis sebagai `it.todo` sampai keputusan tersedia.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { computeIVar, type IVarLineInput } from '../modules/inventory-metrics/i-var.js';
import { validateDoc09 } from './contract/doc09-schema.js';

interface Run { run_id: string; state: string; commit_order?: string | null; lines: IVarLineInput[] }
interface Cutoff { cutoff_id: string; runs: Run[] }
interface Scenario { id: string; judul: string; bergantung_pada: string[]; cutoffs: Cutoff[]; expected_i_repeat: number | null }

const fixture = JSON.parse(readFileSync(new URL('./fixtures/i-repeat.uji.proposed-0.1.json', import.meta.url), 'utf8'));
const scenarios: Scenario[] = fixture.scenarios;
const decisionIds = new Set<string>(fixture.open_decisions.map((d: { id: string }) => d.id));
const scenario = (id: string) => scenarios.find((s) => s.id === id) as Scenario;

describe('Label dan batas kerangka I-REPEAT', () => {
  it('berlabel SIMULATED, mode UJI, PROPOSED, tanpa ACTUAL', () => {
    expect(fixture.data_label).toBe('SIMULATED');
    expect(fixture.mode).toBe('UJI');
    expect(fixture.contract_status).toBe('PROPOSED');
    expect(JSON.stringify(fixture)).not.toContain('"ACTUAL"');
  });

  it('tidak ada angka I-REPEAT yang ditetapkan sebelum keputusan', () => {
    for (const s of scenarios) expect(s.expected_i_repeat, s.id).toBeNull();
  });

  it('setiap skenario merujuk keputusan OPEN yang terdaftar', () => {
    for (const s of scenarios) {
      expect(s.bergantung_pada.length, s.id).toBeGreaterThan(0);
      for (const id of s.bergantung_pada) expect(decisionIds.has(id), `${s.id} ${id}`).toBe(true);
    }
  });
});

describe('Struktur skenario', () => {
  it('skenario lintas cutoff memiliki sedikitnya dua cutoff berbeda; S2 sengaja satu cutoff', () => {
    for (const s of scenarios) {
      const distinct = new Set(s.cutoffs.map((c) => c.cutoff_id)).size;
      if (s.id === 'S2') expect(distinct).toBe(1);
      else expect(distinct, s.id).toBeGreaterThanOrEqual(2);
    }
  });

  it.each(scenarios.map((s) => [s.id, s] as const))('baris %s cocok dengan DOC-09 ReconciliationLine', (_id, s) => {
    for (const run of s.cutoffs.flatMap((c) => c.runs)) {
      for (const line of run.lines) expect(validateDoc09('ReconciliationLine', line)).toEqual([]);
    }
  });

  it('hanya run COMMITTED yang dipakai sebagai sumber', () => {
    for (const run of scenarios.flatMap((s) => s.cutoffs.flatMap((c) => c.runs))) expect(run.state).toBe('COMMITTED');
  });

  it('S3 memuat cutoff dengan dua run COMMITTED tanpa commit_order (tie-break tidak boleh ditebak)', () => {
    const tie = scenario('S3').cutoffs.find((c) => c.runs.length > 1);
    expect(tie?.runs.every((r) => r.commit_order === null)).toBe(true);
  });
});

describe('Konsistensi dengan I-VAR #37 (develop)', () => {
  it.each(scenarios.map((s) => [s.id, s] as const))('setiap run %s dapat dihitung I-VAR tanpa error', (_id, s) => {
    for (const cutoff of s.cutoffs) {
      for (const run of cutoff.runs) {
        const result = computeIVar([{ run_id: run.run_id, cutoff_id: cutoff.cutoff_id, rule_version: 'uji-engine/proposed-0.1', lines: run.lines }]);
        expect(result.ok, run.run_id).toBe(true);
      }
    }
  });

  it('status DISCREPANCY di fixture selalu bervariance bukan nol (dasar "item discrepancy")', () => {
    for (const line of scenarios.flatMap((s) => s.cutoffs.flatMap((c) => c.runs.flatMap((r) => r.lines)))) {
      if (line.status === 'DISCREPANCY') expect(Number(line.variance)).not.toBe(0);
    }
  });
});

describe('Hitungan I-REPEAT (menunggu keputusan)', () => {
  it.todo('S1: jumlah item discrepancy pada >= 2 cutoff dalam periode (butuh Q1 periode, Q2 satuan item, Q3 nonvalid)');
  it.todo('S2: tampilan satu cutoff, 0 dengan teks atau data tidak cukup (butuh Q4)');
  it.todo('S3: pakai latest run COMMITTED per cutoff; kelompok seri tidak dinilai (butuh Q5 commit_order)');
  it.todo('S4: material sama dengan UOM berbeda antarcutoff tidak dijumlah (butuh Q2)');
  it.todo('Cutoff di luar periode tidak ikut dihitung (butuh Q1)');
});
