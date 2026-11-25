import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import InboundHistoryPage from '../pages/inbound/InboundHistoryPage.vue';
import { router } from '../router';
import expectedFixture from '../../../../database/fixtures/uji/expected.proposed-0.1.json';
import commitmentFixture from '../../../../database/fixtures/uji/commitment.proposed-0.1.json';
import {
  buildInboundHistory,
  formatDate,
  formatEventAt,
  type CommitmentInput,
  type ExpectedInput,
} from '../shared/inbound/inbound-history';

const expected = (expectedFixture.rows as { normalized: ExpectedInput }[]).map((row) => row.normalized);
const commitments = (commitmentFixture.rows as { normalized: CommitmentInput }[]).map((row) => row.normalized);
const negatives = commitmentFixture.negative_cases as { case_id: string; normalized: CommitmentInput }[];

const EXPECTED_A: ExpectedInput = {
  source_ref: 'A',
  material_code: 'M',
  supplier_code: 'S',
  uom: 'KG',
  requested_date: '2026-11-10',
  expected_quantity: '1.000000',
};

function event(ref: string, type: 'INITIAL' | 'CHANGE', promised: string, at: string, inbound = 'A'): CommitmentInput {
  return { inbound_source_ref: inbound, event_ref: ref, event_type: type, promised_date: promised, event_at: at };
}

describe('buildInboundHistory', () => {
  it('menyusun histori UJI-IN-001 berurutan dan tidak menimpa tanggal kebutuhan', () => {
    const { entries, orphanEvents } = buildInboundHistory(expected, commitments);
    const first = entries.find((item) => item.sourceRef === 'UJI-IN-001');
    expect(first?.requestedDate).toBe('2026-11-10');
    expect(first?.events.map((item) => item.eventRef)).toEqual(['UJI-COM-001', 'UJI-COM-002']);
    expect(first?.events.map((item) => item.promisedDate)).toEqual(['2026-11-11', '2026-11-13']);
    expect(first?.currentPromisedDate).toBe('2026-11-13');
    expect(first?.events.filter((item) => item.isCurrent)).toHaveLength(1);
    expect(first?.sequenceIssue).toBeNull();
    expect(orphanEvents).toEqual([]);
  });

  it('inbound tanpa event tetap tampil dengan histori kosong dan tanpa janji', () => {
    const second = buildInboundHistory(expected, commitments).entries.find((item) => item.sourceRef === 'UJI-IN-002');
    expect(second?.events).toEqual([]);
    expect(second?.currentPromisedDate).toBeNull();
    expect(second?.requestedDate).toBe('2026-11-11');
  });

  it('mengurutkan menurut instan waktu, bukan menurut teks, lintas offset', () => {
    // 10:00+07:00 = 03:00Z lebih awal daripada 05:00Z walaupun teksnya "10..." lebih besar.
    const result = buildInboundHistory(
      [EXPECTED_A],
      [
        event('E2', 'CHANGE', '2026-11-14', '2026-11-10T05:00:00Z'),
        event('E1', 'INITIAL', '2026-11-12', '2026-11-10T10:00:00+07:00'),
      ],
    );
    expect(result.entries[0].events.map((item) => item.eventRef)).toEqual(['E1', 'E2']);
    expect(result.entries[0].currentPromisedDate).toBe('2026-11-14');
  });

  it('menjaga urutan masukan untuk event dengan waktu sama', () => {
    const result = buildInboundHistory(
      [EXPECTED_A],
      [
        event('E1', 'INITIAL', '2026-11-12', '2026-11-10T08:00:00+07:00'),
        event('E2', 'CHANGE', '2026-11-13', '2026-11-10T08:00:00+07:00'),
      ],
    );
    expect(result.entries[0].events.map((item) => item.eventRef)).toEqual(['E1', 'E2']);
  });

  it('menandai CHANGE tanpa INITIAL sebagai urutan tidak sah tanpa membuang event', () => {
    const result = buildInboundHistory(
      [EXPECTED_A],
      [event('E1', 'CHANGE', '2026-11-12', '2026-11-10T08:00:00+07:00')],
    );
    expect(result.entries[0].sequenceIssue).toBe('CHANGE_WITHOUT_INITIAL');
    expect(result.entries[0].events).toHaveLength(1);
  });

  it('melaporkan event tanpa referensi EXPECTED (MISSING_REFERENCE) dan tidak membuangnya diam-diam', () => {
    const orphan = negatives.find((item) => item.case_id === 'UJI-COM-NEG-02')!.normalized;
    const { entries, orphanEvents } = buildInboundHistory(expected, [...commitments, orphan]);
    expect(orphanEvents).toHaveLength(1);
    expect(orphanEvents[0]).toMatchObject({ event_ref: 'UJI-COM-004', issue: 'MISSING_REFERENCE' });
    expect(entries.flatMap((item) => item.events.map((e) => e.eventRef))).not.toContain('UJI-COM-004');
  });

  it('tidak mengubah masukan', () => {
    const before = JSON.stringify([expected, commitments]);
    buildInboundHistory(expected, commitments);
    expect(JSON.stringify([expected, commitments])).toBe(before);
  });
});

describe('format tampilan', () => {
  it('formatDate memakai bulan Indonesia dan membiarkan format tak dikenal', () => {
    expect(formatDate('2026-11-11')).toBe('11 Nov 2026');
    expect(formatDate('2026-05-03')).toBe('3 Mei 2026');
    expect(formatDate('2026-13-01')).toBe('2026-13-01');
    expect(formatDate('kemarin')).toBe('kemarin');
  });

  it('formatEventAt tidak mengonversi zona dan tidak mengarang zona', () => {
    expect(formatEventAt('2026-11-10T08:00:00+07:00')).toBe('10 Nov 2026 08:00 (UTC+07:00)');
    expect(formatEventAt('2026-11-10T08:00:00Z')).toBe('10 Nov 2026 08:00 (UTC)');
    expect(formatEventAt('2026-11-12T08:00:00')).toBe('12 Nov 2026 08:00 (zona waktu tidak tercatat)');
    expect(formatEventAt('bukan waktu')).toBe('bukan waktu');
  });
});

describe('InboundHistoryPage', () => {
  it('menampilkan judul UC-07, label UJI, dan tanpa aksi mengubah data', () => {
    const wrapper = mount(InboundHistoryPage);
    expect(wrapper.text()).toContain('UC-07');
    expect(wrapper.text()).toContain('Riwayat Inbound');
    expect(wrapper.text()).toContain('Data simulasi (UJI), hanya lihat');
    expect(wrapper.findAll('button')).toHaveLength(0);
    expect(wrapper.find('input[type="file"]').exists()).toBe(false);
  });

  it('memilih inbound pertama dan menampilkan tanggal kebutuhan terpisah dari janji saat ini', () => {
    const wrapper = mount(InboundHistoryPage);
    expect(wrapper.get('[data-testid="requested-date"]').text()).toBe('10 Nov 2026');
    expect(wrapper.get('[data-testid="current-promise"]').text()).toBe('13 Nov 2026');
    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].text()).toContain('UJI-COM-001');
    expect(rows[0].text()).toContain('INITIAL');
    expect(rows[0].text()).toContain('10 Nov 2026 08:00 (UTC+07:00)');
    expect(rows[1].text()).toContain('UJI-COM-002');
    expect(wrapper.findAll('tbody tr').filter((row) => row.text().includes('Janji saat ini'))).toHaveLength(1);
    expect(rows[1].text()).toContain('Janji saat ini');
  });

  it('inbound tanpa janji menampilkan keadaan kosong, bukan tanggal karangan', async () => {
    const wrapper = mount(InboundHistoryPage);
    await wrapper.get('select').setValue('UJI-IN-002');
    expect(wrapper.text()).toContain('Belum ada janji supplier untuk inbound ini.');
    expect(wrapper.get('[data-testid="current-promise"]').text()).toBe('Belum ada janji');
    expect(wrapper.get('[data-testid="requested-date"]').text()).toBe('11 Nov 2026');
    expect(wrapper.find('table').exists()).toBe(false);
  });

  it('memperingatkan urutan CHANGE tanpa INITIAL', () => {
    const history = buildInboundHistory(
      [EXPECTED_A],
      [event('E1', 'CHANGE', '2026-11-12', '2026-11-10T08:00:00+07:00')],
    );
    const wrapper = mount(InboundHistoryPage, { props: { history } });
    expect(wrapper.text()).toContain('Urutan janji tidak sah');
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
  });

  it('memperingatkan event tanpa referensi dan menyebut kodenya', () => {
    const orphan = negatives.find((item) => item.case_id === 'UJI-COM-NEG-02')!.normalized;
    const history = buildInboundHistory(expected, [...commitments, orphan]);
    const wrapper = mount(InboundHistoryPage, { props: { history } });
    expect(wrapper.text()).toContain('MISSING_REFERENCE');
    expect(wrapper.text()).toContain('UJI-COM-004');
  });

  it('menampilkan keadaan kosong bila tidak ada inbound', () => {
    const wrapper = mount(InboundHistoryPage, { props: { history: { entries: [], orphanEvents: [] } } });
    expect(wrapper.text()).toContain('Belum ada data inbound untuk ditampilkan.');
    expect(wrapper.find('select').exists()).toBe(false);
  });

  it('terdaftar pada rute inbound-history', () => {
    const route = router.getRoutes().find((item) => item.name === 'inbound-history');
    expect(route?.components?.default).toBe(InboundHistoryPage);
    expect(route?.meta.ucId).toBe('UC-07');
  });
});
