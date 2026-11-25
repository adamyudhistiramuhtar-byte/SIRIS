// Riwayat inbound (UC-07, SRS-67). Murni dan tanpa efek samping: mengubah baris EXPECTED dan
// event COMMITMENT (kontrak proposed-0.1) menjadi tampilan kronologis per inbound.
// Batas yang dijaga:
// - Janji tidak pernah menimpa tanggal kebutuhan (requestedDate tetap apa adanya, PVT-16).
// - Urutan menurut event_at (instan waktu). Aturan urutan resmi (CF-06) masih OPEN, jadi urutan
//   ini adalah tampilan sementara, bukan keputusan domain.
// - Tidak menghitung keterlambatan atau mismatch: aturan delay (OD-06) belum diputuskan.
// - Event yang inbound-nya tidak ada pada EXPECTED tidak dibuang diam-diam; dilaporkan terpisah.
// - Waktu tidak diubah zona dan tidak dikarang. Tanpa offset, teks ditampilkan apa adanya.

export type ExpectedInput = {
  source_ref: string;
  material_code: string;
  supplier_code: string;
  uom: string;
  requested_date: string;
  expected_quantity: string;
};

export type CommitmentInput = {
  inbound_source_ref: string;
  event_ref: string;
  event_type: 'INITIAL' | 'CHANGE';
  promised_date: string;
  event_at: string;
};

export type HistoryEvent = {
  eventRef: string;
  eventType: 'INITIAL' | 'CHANGE';
  promisedDate: string;
  eventAt: string;
  isCurrent: boolean;
};

export type SequenceIssue = 'CHANGE_WITHOUT_INITIAL' | null;

export type InboundHistoryEntry = {
  sourceRef: string;
  materialCode: string;
  supplierCode: string;
  uom: string;
  requestedDate: string;
  expectedQuantity: string;
  events: HistoryEvent[];
  currentPromisedDate: string | null;
  sequenceIssue: SequenceIssue;
};

export type OrphanEvent = CommitmentInput & { issue: 'MISSING_REFERENCE' };

export type InboundHistory = {
  entries: InboundHistoryEntry[];
  orphanEvents: OrphanEvent[];
};

function instant(value: string): number {
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? Number.NaN : ms;
}

/** Urut naik menurut instan event_at. Bila tidak dapat dibaca, jatuh ke urutan teks; stabil. */
function compareEvents(a: { at: string; index: number }, b: { at: string; index: number }): number {
  const ia = instant(a.at);
  const ib = instant(b.at);
  if (!Number.isNaN(ia) && !Number.isNaN(ib) && ia !== ib) return ia - ib;
  if (Number.isNaN(ia) || Number.isNaN(ib)) {
    const byText = a.at.localeCompare(b.at);
    if (byText !== 0) return byText;
  }
  return a.index - b.index;
}

export function buildInboundHistory(
  expected: readonly ExpectedInput[],
  events: readonly CommitmentInput[],
): InboundHistory {
  const known = new Set(expected.map((row) => row.source_ref));
  const orphanEvents: OrphanEvent[] = events
    .filter((event) => !known.has(event.inbound_source_ref))
    .map((event) => ({ ...event, issue: 'MISSING_REFERENCE' as const }));

  const entries = expected.map((row): InboundHistoryEntry => {
    const own = events
      .map((event, index) => ({ event, index, at: event.event_at }))
      .filter(({ event }) => event.inbound_source_ref === row.source_ref)
      .sort(compareEvents);
    const last = own.length - 1;
    return {
      sourceRef: row.source_ref,
      materialCode: row.material_code,
      supplierCode: row.supplier_code,
      uom: row.uom,
      requestedDate: row.requested_date,
      expectedQuantity: row.expected_quantity,
      events: own.map(({ event }, position) => ({
        eventRef: event.event_ref,
        eventType: event.event_type,
        promisedDate: event.promised_date,
        eventAt: event.event_at,
        isCurrent: position === last,
      })),
      currentPromisedDate: last >= 0 ? own[last].event.promised_date : null,
      sequenceIssue:
        own.length > 0 && own[0].event.event_type !== 'INITIAL' ? 'CHANGE_WITHOUT_INITIAL' : null,
    };
  });

  return { entries, orphanEvents };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** "2026-11-11" menjadi "11 Nov 2026". Format tak dikenal ditampilkan apa adanya. */
export function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return value;
  return `${Number(match[3])} ${MONTHS[month - 1]} ${match[1]}`;
}

/**
 * "2026-11-10T08:00:00+07:00" menjadi "10 Nov 2026 08:00 (UTC+07:00)". Waktu tidak dikonversi.
 * Tanpa offset, jam ditampilkan apa adanya dengan keterangan zona tidak tercatat.
 */
export function formatEventAt(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/.exec(value);
  if (!match) return value;
  const date = formatDate(match[1]);
  if (date === match[1]) return value;
  const zone = match[4] === undefined ? 'zona waktu tidak tercatat' : match[4] === 'Z' ? 'UTC' : `UTC${match[4]}`;
  return `${date} ${match[2]}:${match[3]} (${zone})`;
}
