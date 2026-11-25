/**
 * Oracle referensi untuk SRS-60 (T-26). BUKAN implementasi domain aplikasi.
 *
 * Fungsi di sini hanya menghitung hasil yang diharapkan dari fixture UJI
 * (database/fixtures/uji/*.proposed-0.1.json) menurut PVT-06, PVT-07, PVT-16,
 * dan PVT-23 pada DOC-13. Aturan yang masih OPEN (OD-06 untuk bukti penutup
 * dan penentuan delay, CF-06 untuk urutan janji) tidak diputuskan di sini.
 * Kuantitas memakai bilangan bulat berskala 6 desimal, bukan float.
 */

export type ReceivingRow = {
  inbound_source_ref: string;
  event_ref: string;
  received_quantity: string;
  uom: string;
  received_at: string;
  is_closing: boolean;
  closing_reference: string | null;
};

export type CommitmentRow = {
  inbound_source_ref: string;
  event_ref: string;
  event_type: 'INITIAL' | 'CHANGE';
  promised_date: string;
  event_at: string;
};

export type ExpectedRow = {
  source_ref: string;
  uom: string;
  requested_date: string;
  expected_quantity: string;
};

const SCALE = 6;

/** Mengubah "10.000000" menjadi 10000000n. Format selain angka desimal ditolak. */
export function toScaled(value: string): bigint {
  const match = /^(-?)(\d+)(?:\.(\d{1,6}))?$/.exec(value);
  if (!match) {
    throw new Error(`Format kuantitas tidak valid: ${value}`);
  }
  const [, sign, whole, fraction = ''] = match;
  const scaled = BigInt(whole + fraction.padEnd(SCALE, '0'));
  return sign === '-' ? -scaled : scaled;
}

export type ClosingIssue = 'INVALID_CLOSING' | null;

/** PVT-23: penutup tanpa referensi bukti ditolak. Validitas isi bukti menunggu OD-06. */
export function validateClosing(row: ReceivingRow): ClosingIssue {
  if (row.is_closing && !row.closing_reference) {
    return 'INVALID_CLOSING';
  }
  return null;
}

export type ReceivingOutcome = {
  status: 'NO_RECEIPT' | 'PARTIAL' | 'FINAL';
  receivedTotal: bigint;
  /** Hanya dievaluasi bila FINAL. Null berarti belum boleh dinilai. */
  quantityMismatch: boolean | null;
  /** Selalu null: penentuan delay menunggu OD-06. */
  deliveryDelay: null;
  rejected: { event_ref: string; issue: Exclude<ClosingIssue, null> | 'UOM_MISMATCH' }[];
};

/**
 * PVT-06 dan PVT-07: event diproses berurutan menurut received_at.
 * Event dengan penutup tidak sah atau UOM berbeda ditolak dan tidak dihitung.
 */
export function evaluateReceiving(expected: ExpectedRow, events: ReceivingRow[]): ReceivingOutcome {
  const ordered = [...events].sort((a, b) => a.received_at.localeCompare(b.received_at));
  const rejected: ReceivingOutcome['rejected'] = [];
  let total = 0n;
  let closed = false;

  for (const event of ordered) {
    if (event.uom !== expected.uom) {
      rejected.push({ event_ref: event.event_ref, issue: 'UOM_MISMATCH' });
      continue;
    }
    const issue = validateClosing(event);
    if (issue) {
      rejected.push({ event_ref: event.event_ref, issue });
      continue;
    }
    total += toScaled(event.received_quantity);
    if (event.is_closing) {
      closed = true;
    }
  }

  const status = closed ? 'FINAL' : total > 0n ? 'PARTIAL' : 'NO_RECEIPT';
  return {
    status,
    receivedTotal: total,
    quantityMismatch: status === 'FINAL' ? total !== toScaled(expected.expected_quantity) : null,
    deliveryDelay: null,
    rejected,
  };
}

export type CommitmentView = {
  requested_date: string;
  history: { event_ref: string; event_type: 'INITIAL' | 'CHANGE'; promised_date: string }[];
  currentPromisedDate: string | null;
};

/** PVT-16: janji tidak pernah menimpa tanggal kebutuhan. Histori berurutan menurut event_at. */
export function buildCommitmentView(expected: ExpectedRow, events: CommitmentRow[]): CommitmentView {
  const ordered = [...events].sort((a, b) => a.event_at.localeCompare(b.event_at));
  return {
    requested_date: expected.requested_date,
    history: ordered.map(({ event_ref, event_type, promised_date }) => ({ event_ref, event_type, promised_date })),
    currentPromisedDate: ordered.length ? ordered[ordered.length - 1].promised_date : null,
  };
}

/** CHANGE hanya sah bila INITIAL untuk inbound yang sama sudah ada lebih dulu. */
export function hasInitialBeforeChange(events: CommitmentRow[]): boolean {
  const ordered = [...events].sort((a, b) => a.event_at.localeCompare(b.event_at));
  return ordered.length === 0 || ordered[0].event_type === 'INITIAL';
}
