/**
 * SRS-32 — tes yang BELUM dibuat. Ditulis sebagai `it.todo` agar terlihat sebagai TODO
 * pada laporan vitest, bukan skip diam-diam.
 *
 * Prasyarat (development-docs/KONTRAK_METRIK_PERSEDIAAN_SRS-32.md §7): migrasi 011 dan sumber
 * `commit_order` disepakati; definisi periode dan I-REPEAT ditetapkan.
 */
import { describe, it } from 'vitest';

describe('SRS-32: adapter PostgreSQL (TODO)', () => {
  it.todo('RunCatalog memfilter scope, mode, rule_version, dan cutoff sebelum paging');
  it.todo('commit_order dari adapter mengikuti urutan commit nyata; transaksi yang mulai lebih awal tetapi commit lebih akhir menjadi latest');
  it.todo('run yang belum COMMITTED tidak terlihat oleh RunCatalog');
  it.todo('RunLineReader mengembalikan variance null tetap null dari reconciliation_lines');
  it.todo('otorisasi memakai sesi dan assignment nyata (SRS-47/48)');
});

describe('SRS-32: metrik yang menunggu keputusan (TODO)', () => {
  it.todo('I-REPEAT: jumlah item discrepancy pada >= 2 cutoff berbeda dalam periode (definisi periode belum ditemukan)');
  it.todo('I-REPEAT dengan satu cutoff menampilkan penjelasan design.md, bukan kinerja nol (bentuk tampilan menunggu keputusan)');
  it.todo('pembulatan tampilan persen I-EXACT/I-COVER (aturan belum ditemukan)');
});
