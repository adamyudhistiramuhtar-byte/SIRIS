/**
 * Perhitungan enam metrik supplier (SRS-24 / SRS-90).
 *
 * Prinsip:
 * - Fungsi murni: tidak menyentuh HTTP, database, jam sistem, atau I/O.
 * - Determinstik: seluruh input berasal dari fixture/typed records.
 * - Denominator nol selalu menghasilkan null + alasan, bukan 0%.
 * - Setiap angka membawa numerator, denominator, eksklusi, dan source_refs.
 *
 * Keputusan eligibility yang belum final (OD-06, CF-06) ditandai melalui
 * `decision_status: 'CANDIDATE_UJI'` pada setiap hasil.
 */

import type {
  CommitmentEvent,
  DataStatus,
  ExclusionReason,
  ExclusionSummary,
  InboundRecord,
  MetricResult,
  MetricUnit,
  ReceivingEvent,
  SupplierFillResult,
  SupplierMetricId,
  SupplierMetricSource,
  SupplierMetricsResult,
} from './types.js';

const MICRO_PER_UNIT = 1_000_000n;
const DECIMAL_PATTERN = /^-?\d+(?:\.\d{1,6})?$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

interface Tally {
  numerator: number;
  denominator: number;
  refs: Set<string>;
  exclusions: Map<ExclusionReason, Set<string>>;
}

interface CommitmentHistory {
  events: CommitmentEvent[];
  invalid: ExclusionReason | null;
}

interface ReceiptTotals {
  totalMicro: bigint;
  receipts: ReceivingEvent[];
  invalid: ExclusionReason | null;
}

function createTally(): Tally {
  return { numerator: 0, denominator: 0, refs: new Set<string>(), exclusions: new Map() };
}

function excludeRecord(tally: Tally, reason: ExclusionReason, ref: string): void {
  const existing = tally.exclusions.get(reason) ?? new Set<string>();
  existing.add(ref);
  tally.exclusions.set(reason, existing);
}

function buildExclusions(tally: Tally): ExclusionSummary[] {
  return [...tally.exclusions.entries()]
    .map(([reason, refs]) => ({ reason, count: refs.size, source_refs: [...refs].sort() }))
    .sort((a, b) => a.reason.localeCompare(b.reason));
}

function excludedCount(tally: Tally): number {
  const unique = new Set<string>();
  for (const refs of tally.exclusions.values()) {
    for (const ref of refs) unique.add(ref);
  }
  return unique.size;
}

function makeResult(
  metric: SupplierMetricId,
  unit: MetricUnit,
  tally: Tally,
  eligibility: string,
  dataStatus: DataStatus,
  value: number | null,
  unavailableReason: string | null,
  numeratorOverride?: number | null,
  denominatorOverride?: number | null,
): MetricResult {
  return {
    metric,
    unit,
    value,
    numerator: numeratorOverride !== undefined ? numeratorOverride : tally.numerator,
    denominator:
      denominatorOverride !== undefined
        ? denominatorOverride
        : tally.denominator === 0
          ? 0
          : tally.denominator,
    excluded_count: excludedCount(tally),
    exclusions: buildExclusions(tally),
    unavailable_reason: unavailableReason,
    eligibility,
    source_refs: [...tally.refs].sort(),
    data_status: dataStatus,
    decision_status: 'CANDIDATE_UJI',
  };
}

/** Mengubah string desimal menjadi bilangan mikro (6 angka di belakang koma). */
export function tryParseDecimalToMicro(value: string | null): bigint | null {
  if (value === null || !DECIMAL_PATTERN.test(value)) {
    return null;
  }
  const negative = value.startsWith('-');
  const unsigned = negative ? value.slice(1) : value;
  const [whole, fraction = ''] = unsigned.split('.');
  const micro = BigInt(whole) * MICRO_PER_UNIT + BigInt((fraction + '000000').slice(0, 6));
  return negative ? -micro : micro;
}

function microToNumber(micro: bigint): number {
  return Number(micro) / Number(MICRO_PER_UNIT);
}

function isIsoDate(value: string | null): value is string {
  if (value === null || !ISO_DATE_PATTERN.test(value)) {
    return false;
  }
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
}

function isIsoTimestamp(value: string | null): value is string {
  return value !== null && value.includes('T') && !Number.isNaN(Date.parse(value));
}

function calendarDaysBetween(startDate: string, endDate: string): number {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  return Math.round((end - start) / DAY_MS);
}

function buildCommitmentHistory(
  source: SupplierMetricSource,
): Map<string, CommitmentHistory> {
  const grouped = new Map<string, CommitmentEvent[]>();
  for (const event of source.commitments) {
    const list = grouped.get(event.inbound_ref) ?? [];
    list.push(event);
    grouped.set(event.inbound_ref, list);
  }

  const history = new Map<string, CommitmentHistory>();
  for (const [inboundRef, events] of grouped) {
    const seenRefs = new Set<string>();
    let invalid: ExclusionReason | null = null;

    for (const event of events) {
      if (seenRefs.has(event.event_ref)) {
        invalid = 'DUPLICATE_COMMITMENT_EVENT';
        break;
      }
      seenRefs.add(event.event_ref);
      if (!isIsoDate(event.promised_date) || !isIsoTimestamp(event.event_at)) {
        invalid = 'INVALID_COMMITMENT_TIMESTAMP';
        break;
      }
    }

    const sorted = [...events].sort((left, right) => {
      const leftAt = Date.parse(left.event_at ?? '');
      const rightAt = Date.parse(right.event_at ?? '');
      if (leftAt !== rightAt) {
        return leftAt - rightAt;
      }
      return left.event_ref.localeCompare(right.event_ref);
    });

    if (invalid === null && sorted.length > 0) {
      const initialCount = sorted.filter((event) => event.event_type === 'INITIAL').length;
      if (sorted[0].event_type !== 'INITIAL' || initialCount > 1) {
        invalid = 'INVALID_COMMITMENT_SEQUENCE';
      }
    }

    history.set(inboundRef, { events: sorted, invalid });
  }

  return history;
}

function latestCommitmentBefore(
  history: CommitmentHistory,
  completionAt: string,
): CommitmentEvent | null {
  const completionMs = Date.parse(completionAt);
  let latest: CommitmentEvent | null = null;
  let latestMs = Number.NEGATIVE_INFINITY;

  for (const event of history.events) {
    const eventMs = Date.parse(event.event_at ?? '');
    if (Number.isNaN(eventMs) || eventMs > completionMs) {
      continue;
    }
    if (
      eventMs > latestMs ||
      (eventMs === latestMs && latest !== null && event.event_ref > latest.event_ref)
    ) {
      latest = event;
      latestMs = eventMs;
    }
  }

  return latest;
}

function buildReceiptTotals(source: SupplierMetricSource): Map<string, ReceiptTotals> {
  const inboundUom = new Map(source.inbound.map((record) => [record.inbound_ref, record.uom]));
  const grouped = new Map<string, ReceivingEvent[]>();
  for (const receipt of source.receipts) {
    const list = grouped.get(receipt.inbound_ref) ?? [];
    list.push(receipt);
    grouped.set(receipt.inbound_ref, list);
  }

  const totals = new Map<string, ReceiptTotals>();
  for (const [inboundRef, receipts] of grouped) {
    let invalid: ExclusionReason | null = null;
    let totalMicro = 0n;
    const seenRefs = new Set<string>();
    const expectedUom = inboundUom.get(inboundRef);

    for (const receipt of receipts) {
      if (seenRefs.has(receipt.event_ref)) {
        invalid = 'DUPLICATE_RECEIPT_EVENT';
        break;
      }
      seenRefs.add(receipt.event_ref);

      if (expectedUom === undefined || receipt.uom !== expectedUom) {
        invalid = 'UOM_NOT_COMPARABLE';
        break;
      }
      if (receipt.is_closing && receipt.closing_reference === null) {
        invalid = 'INVALID_RECEIPT';
        break;
      }

      const micro = tryParseDecimalToMicro(receipt.received_quantity);
      if (micro === null || micro < 0n) {
        invalid = 'INVALID_RECEIPT';
        break;
      }
      totalMicro += micro;
    }

    totals.set(inboundRef, { totalMicro, receipts, invalid });
  }

  return totals;
}

const OTD_R_ELIGIBILITY =
  'FINAL_ONLY: status FINAL dengan requested_date dan final_arrival_date tersedia';
const OTD_C_ELIGIBILITY =
  'FINAL_ONLY: status FINAL dengan final_completion_at dan commitment INITIAL yang sah sebelum completion';
const QUANTITY_ELIGIBILITY =
  'FINAL_ONLY: status FINAL, expected_quantity > 0, dan receipt sah dengan UOM sebanding';
const LEAD_ELIGIBILITY =
  'FINAL_ONLY: status FINAL dengan release_date dan final_completion_at tersedia';
const CHANGE_ELIGIBILITY =
  'Semua inbound dalam cakupan; hanya event CHANGE dengan event_ref unik yang dihitung';

/** OTD-R: final tepat waktu terhadap requested date / final eligible × 100%. */
export function calculateOtdR(source: SupplierMetricSource): MetricResult {
  const tally = createTally();

  for (const record of source.inbound) {
    tally.refs.add(record.inbound_ref);
    if (record.status !== 'FINAL') {
      excludeRecord(tally, 'OPEN_NOT_FINAL', record.inbound_ref);
      continue;
    }
    if (!isIsoDate(record.final_arrival_date)) {
      excludeRecord(tally, 'MISSING_FINAL_ARRIVAL', record.inbound_ref);
      continue;
    }
    if (!isIsoDate(record.requested_date)) {
      excludeRecord(tally, 'MISSING_REQUESTED_DATE', record.inbound_ref);
      continue;
    }

    tally.denominator += 1;
    if (record.final_arrival_date <= record.requested_date) {
      tally.numerator += 1;
    }
  }

  const value = tally.denominator === 0 ? null : (tally.numerator / tally.denominator) * 100;
  return makeResult(
    'OTD_R',
    'PERCENT',
    tally,
    OTD_R_ELIGIBILITY,
    source.data_status,
    value,
    value === null ? 'ZERO_DENOMINATOR' : null,
  );
}

/** OTD-C: final tepat waktu terhadap janji terakhir yang sah sebelum completion. */
export function calculateOtdC(source: SupplierMetricSource): MetricResult {
  const tally = createTally();
  const history = buildCommitmentHistory(source);

  for (const record of source.inbound) {
    tally.refs.add(record.inbound_ref);
    if (record.status !== 'FINAL') {
      excludeRecord(tally, 'OPEN_NOT_FINAL', record.inbound_ref);
      continue;
    }
    if (!isIsoDate(record.final_arrival_date)) {
      excludeRecord(tally, 'MISSING_FINAL_ARRIVAL', record.inbound_ref);
      continue;
    }
    if (!isIsoTimestamp(record.final_completion_at)) {
      excludeRecord(tally, 'MISSING_COMPLETION', record.inbound_ref);
      continue;
    }

    const events = history.get(record.inbound_ref);
    if (events === undefined || events.events.length === 0) {
      excludeRecord(tally, 'NO_COMMITMENT', record.inbound_ref);
      continue;
    }
    if (events.invalid !== null) {
      excludeRecord(tally, events.invalid, record.inbound_ref);
      continue;
    }

    const commitment = latestCommitmentBefore(events, record.final_completion_at);
    if (commitment === null) {
      excludeRecord(tally, 'NO_COMMITMENT', record.inbound_ref);
      continue;
    }

    tally.denominator += 1;
    if (record.final_arrival_date <= commitment.promised_date) {
      tally.numerator += 1;
    }
    tally.refs.add(commitment.event_ref);
  }

  const value = tally.denominator === 0 ? null : (tally.numerator / tally.denominator) * 100;
  return makeResult(
    'OTD_C',
    'PERCENT',
    tally,
    OTD_C_ELIGIBILITY,
    source.data_status,
    value,
    value === null ? 'ZERO_DENOMINATOR' : null,
  );
}

/**
 * Quantity Mismatch Rate: final dengan total received ≠ expected / final eligible × 100%.
 * Penerimaan parsial dijumlahkan; record tanpa receipt tidak dianggap nol.
 */
export function calculateQuantityMismatchRate(source: SupplierMetricSource): MetricResult {
  const tally = createTally();
  const receiptTotals = buildReceiptTotals(source);

  for (const record of source.inbound) {
    tally.refs.add(record.inbound_ref);
    if (record.status !== 'FINAL') {
      excludeRecord(tally, 'OPEN_NOT_FINAL', record.inbound_ref);
      continue;
    }

    const expectedMicro = tryParseDecimalToMicro(record.expected_quantity);
    if (record.expected_quantity === null) {
      excludeRecord(tally, 'MISSING_EXPECTED_QUANTITY', record.inbound_ref);
      continue;
    }
    if (expectedMicro === null) {
      excludeRecord(tally, 'INVALID_EXPECTED_QUANTITY', record.inbound_ref);
      continue;
    }
    if (expectedMicro === 0n) {
      excludeRecord(tally, 'ZERO_EXPECTED_QUANTITY', record.inbound_ref);
      continue;
    }

    const totals = receiptTotals.get(record.inbound_ref);
    if (totals === undefined || totals.receipts.length === 0) {
      excludeRecord(tally, 'NO_RECEIPTS', record.inbound_ref);
      continue;
    }
    if (totals.invalid !== null) {
      excludeRecord(tally, totals.invalid, record.inbound_ref);
      continue;
    }

    tally.denominator += 1;
    if (totals.totalMicro !== expectedMicro) {
      tally.numerator += 1;
    }
  }

  const value = tally.denominator === 0 ? null : (tally.numerator / tally.denominator) * 100;
  return makeResult(
    'QUANTITY_MISMATCH_RATE',
    'PERCENT',
    tally,
    QUANTITY_ELIGIBILITY,
    source.data_status,
    value,
    value === null ? 'ZERO_DENOMINATOR' : null,
  );
}

/**
 * S-FILL: Σmin(received, expected) / Σexpected × 100%, dikelompokkan per
 * supplier + material + UOM. Tidak pernah digabung lintas material/UOM.
 */
export function calculateSFill(source: SupplierMetricSource): SupplierFillResult[] {
  const receiptTotals = buildReceiptTotals(source);
  const groups = new Map<
    string,
    {
      supplier_code: string;
      material_code: string;
      uom: string;
      tally: Tally;
      expectedMicro: bigint;
      fillMicro: bigint;
    }
  >();

  for (const record of source.inbound) {
    if (record.status !== 'FINAL') {
      continue;
    }

    const key = `${record.supplier_code}|${record.material_code}|${record.uom}`;
    const group =
      groups.get(key) ??
      {
        supplier_code: record.supplier_code,
        material_code: record.material_code,
        uom: record.uom,
        tally: createTally(),
        expectedMicro: 0n,
        fillMicro: 0n,
      };
    groups.set(key, group);
    group.tally.refs.add(record.inbound_ref);

    const expectedMicro = tryParseDecimalToMicro(record.expected_quantity);
    if (record.expected_quantity === null) {
      excludeRecord(group.tally, 'MISSING_EXPECTED_QUANTITY', record.inbound_ref);
      continue;
    }
    if (expectedMicro === null) {
      excludeRecord(group.tally, 'INVALID_EXPECTED_QUANTITY', record.inbound_ref);
      continue;
    }
    if (expectedMicro === 0n) {
      excludeRecord(group.tally, 'ZERO_EXPECTED_QUANTITY', record.inbound_ref);
      continue;
    }

    const totals = receiptTotals.get(record.inbound_ref);
    if (totals === undefined || totals.receipts.length === 0) {
      excludeRecord(group.tally, 'NO_RECEIPTS', record.inbound_ref);
      continue;
    }
    if (totals.invalid !== null) {
      excludeRecord(group.tally, totals.invalid, record.inbound_ref);
      continue;
    }

    group.expectedMicro += expectedMicro;
    group.fillMicro += totals.totalMicro < expectedMicro ? totals.totalMicro : expectedMicro;
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, group]) => {
      const value =
        group.expectedMicro === 0n
          ? null
          : (microToNumber(group.fillMicro) / microToNumber(group.expectedMicro)) * 100;
      const result = makeResult(
        'S_FILL',
        'PERCENT',
        group.tally,
        QUANTITY_ELIGIBILITY,
        source.data_status,
        value,
        value === null ? 'ZERO_DENOMINATOR' : null,
        microToNumber(group.fillMicro),
        microToNumber(group.expectedMicro),
      );
      return { ...result, metric: 'S_FILL' as const, group: {
        supplier_code: group.supplier_code,
        material_code: group.material_code,
        uom: group.uom,
      } };
    });
}

/** S-LEAD: rata-rata hari kalender completion − release untuk record eligible. */
export function calculateSLead(source: SupplierMetricSource): MetricResult {
  const tally = createTally();
  let totalDays = 0;

  for (const record of source.inbound) {
    tally.refs.add(record.inbound_ref);
    if (record.status !== 'FINAL') {
      excludeRecord(tally, 'OPEN_NOT_FINAL', record.inbound_ref);
      continue;
    }
    if (!isIsoDate(record.release_date)) {
      excludeRecord(tally, 'MISSING_RELEASE_DATE', record.inbound_ref);
      continue;
    }
    if (!isIsoTimestamp(record.final_completion_at)) {
      excludeRecord(tally, 'MISSING_COMPLETION', record.inbound_ref);
      continue;
    }

    const completionDate = record.final_completion_at.slice(0, 10);
    if (!isIsoDate(completionDate)) {
      excludeRecord(tally, 'MISSING_COMPLETION', record.inbound_ref);
      continue;
    }

    const days = calendarDaysBetween(record.release_date, completionDate);
    if (days < 0) {
      excludeRecord(tally, 'MISSING_RELEASE_DATE', record.inbound_ref);
      continue;
    }

    tally.denominator += 1;
    totalDays += days;
  }

  const value = tally.denominator === 0 ? null : totalDays / tally.denominator;
  return makeResult(
    'S_LEAD',
    'DAYS',
    tally,
    LEAD_ELIGIBILITY,
    source.data_status,
    value,
    value === null ? 'ZERO_DENOMINATOR' : null,
    totalDays,
  );
}

/** S-CHANGE: jumlah event CHANGE dalam cakupan. */
export function calculateSChange(source: SupplierMetricSource): MetricResult {
  const tally = createTally();
  const scope = new Set(source.inbound.map((record) => record.inbound_ref));
  const seenRefs = new Set<string>();

  for (const event of source.commitments) {
    if (!scope.has(event.inbound_ref) || event.event_type !== 'CHANGE') {
      continue;
    }

    const key = `${event.inbound_ref}|${event.event_ref}`;
    if (seenRefs.has(key)) {
      excludeRecord(tally, 'DUPLICATE_COMMITMENT_EVENT', event.event_ref);
      continue;
    }
    seenRefs.add(key);
    tally.refs.add(event.event_ref);
    tally.numerator += 1;
  }

  return makeResult(
    'S_CHANGE',
    'COUNT',
    tally,
    CHANGE_ELIGIBILITY,
    source.data_status,
    tally.numerator,
    null,
    tally.numerator,
    null,
  );
}

/** Menghitung seluruh enam metrik sekaligus pada satu sumber yang sama. */
export function calculateSupplierMetrics(
  source: SupplierMetricSource,
  fixtureVersion: string,
): SupplierMetricsResult {
  return {
    fixture_version: fixtureVersion,
    data_status: source.data_status,
    metrics: {
      otd_r: calculateOtdR(source),
      otd_c: calculateOtdC(source),
      quantity_mismatch_rate: calculateQuantityMismatchRate(source),
      s_lead: calculateSLead(source),
      s_change: calculateSChange(source),
    },
    s_fill: calculateSFill(source),
  };
}

/** Mengekspor tipe record untuk pemakaian adapter/fixture. */
export type { InboundRecord, ReceivingEvent, CommitmentEvent };
