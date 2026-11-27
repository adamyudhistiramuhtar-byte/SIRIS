import { expect, it } from 'vitest';
import { parseCommitmentEventAt, validateNormalizedCommitmentRow } from '../modules/commitment/supplier-commitment.js';

it.each([
  '2026-02-30T10:00:00+07:00',
  '2026-02-29T08:00:00Z',
  '2026-04-31T10:00:00Z',
])('menolak tanggal kalender tidak sah pada event_at %s', (eventAt) => {
  const result = validateNormalizedCommitmentRow(1, {
    inbound_source_ref: 'UJI-INBOUND',
    event_ref: 'UJI-EVENT',
    event_type: 'INITIAL',
    promised_date: '2026-02-28',
    event_at: eventAt,
  });
  expect(result).toMatchObject({ok: false, issues: [{code: 'INVALID_FILE', field: 'event_at'}]});
});

it('menerima tahun kabisat dan mempertahankan offset yang sah', () => {
  expect(parseCommitmentEventAt('2024-02-29T10:00:00+07:00'))
    .toBe(Date.parse('2024-02-29T03:00:00Z'));
  expect(parseCommitmentEventAt('2026-02-28T10:00:00-05:00'))
    .toBe(Date.parse('2026-02-28T15:00:00Z'));
});
