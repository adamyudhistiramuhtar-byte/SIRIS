/**
 * SRS-18: Impor janji supplier dengan histori INITIAL dan CHANGE.
 *
 * Slice domain terisolasi (tanpa endpoint HTTP, tanpa migrasi DB, tanpa pipeline UC-16).
 * Sumber kontrak: DOC-08 §6 COMMITMENT (PROPOSED), BR-INB-01/02, fixture
 * database/fixtures/uji/commitment.proposed-0.1.json.
 *
 * Batasan eksplisit:
 * - CF-06 (sequence/previous_date/correction) OPEN: tidak diimplementasikan.
 * - Nama header sumber asli selain QTY AKHIR masih SOURCE REQUIRED; modul ini
 *   memvalidasi bentuk normalized yang sudah dipetakan sesuai kontrak.
 * - Idempotency commit batch UC-16 ada di pipeline; di sini hanya guard domain
 *   event_ref unik per inbound dan deteksi duplikat payload-identik.
 *
 * Semantik tambahan hasil review SRS-18 (HEAD 9530a51):
 * - event_ref unik per inbound; payload identik → IDEMPOTENT tanpa duplikasi
 *   event (source_row_number pada record tetap provenance event asli).
 * - Proses baris per baris; `ok=false` boleh koeksis dengan baris yang sukses
 *   di-apply (tidak atomik di sini; atomicitas commit ada di pipeline UC-16).
 * - `CommitmentHistoryStore.apply()` menegakkan validasi internal; input tidak
 *   valid tetap ditolak walau caller melewati validasi eksplisit.
 * - Context inbound duplikat pada konstruktor ditolak eksplisit.
 */

export const COMMITMENT_EVENT_TYPES = ['INITIAL', 'CHANGE'] as const;
export type CommitmentEventType = (typeof COMMITMENT_EVENT_TYPES)[number];

/** Baris normalized sesuai DOC-08 §6. */
export interface NormalizedCommitmentRow {
  inbound_source_ref: string;
  event_ref: string;
  event_type: CommitmentEventType;
  promised_date: string;
  event_at: string;
}

export interface CommitmentSourceRow {
  row_number: number;
  raw?: Record<string, unknown>;
  normalized: Record<string, unknown>;
}

export type CommitmentIssueCode =
  | 'INVALID_FILE'
  | 'MISSING_REFERENCE'
  | 'DUPLICATE_EVENT_REF'
  | 'CONFLICTING_EVENT_REF'
  | 'CHANGE_WITHOUT_INITIAL'
  | 'IMMUTABLE_REQUESTED_DATE';

export interface CommitmentValidationIssue {
  code: CommitmentIssueCode;
  message: string;
  row_number?: number;
  field?: keyof NormalizedCommitmentRow | 'requested_date';
  event_ref?: string;
  inbound_source_ref?: string;
}

export interface CommitmentEventRecord {
  inbound_source_ref: string;
  event_ref: string;
  event_type: CommitmentEventType;
  promised_date: string;
  event_at: string;
  event_at_epoch_ms: number;
  /**
   * Provenance event asli: nomor baris sumber saat event pertama kali diterima.
   * Re-import payload identik dari baris sumber lain (IDEMPOTENT) tidak
   * mengganti nilai ini dan tidak membuat event baru.
   */
  source_row_number: number;
  /**
   * Urutan penyisipan store (import/apply order), BUKAN kronologi bisnis.
   * Bukan pengganti sequence CF-06 yang belum diputuskan.
   */
  recorded_sequence: number;
}

/**
 * Konteks inbound minimal untuk menegakkan BR-INB-01.
 * requested_date immutable; service tidak boleh mengubahnya.
 */
export interface InboundCommitmentContext {
  inbound_source_ref: string;
  requested_date: string;
}

export interface CommitmentHistory {
  inbound_source_ref: string;
  requested_date: string;
  events: CommitmentEventRecord[];
}

export interface ApplyCommitmentResult {
  ok: boolean;
  /**
   * APPLIED: event baru ditambahkan.
   * IDEMPOTENT: event_ref + payload identik sudah ada; record yang dikembalikan
   *   adalah event asli (source_row_number asli dipertahankan).
   * REJECTED: tidak ada mutasi histori; issues menjelaskan alasan.
   */
  status: 'APPLIED' | 'IDEMPOTENT' | 'REJECTED';
  history: CommitmentHistory;
  record?: CommitmentEventRecord;
  issues: CommitmentValidationIssue[];
}

export interface ImportCommitmentBatchResult {
  /**
   * false bila ada minimal satu issue baris. Karena pemrosesan per baris tidak
   * atomik di slice ini, `ok=false` dapat tetap memiliki `applied`/`idempotent`
   * yang tidak kosong dan histori yang sudah bertambah. Atomicitas commit
   * sesungguhnya milik pipeline UC-16 (DOC-08 §13), bukan modul ini.
   */
  ok: boolean;
  histories: CommitmentHistory[];
  applied: CommitmentEventRecord[];
  idempotent: CommitmentEventRecord[];
  issues: CommitmentValidationIssue[];
}

/** Context inbound duplikat (termasuk tabrakan setelah trim) ditolak eksplisit. */
export class DuplicateInboundContextError extends Error {
  readonly code = 'DUPLICATE_INBOUND_CONTEXT';

  constructor(readonly inbound_source_ref: string) {
    super(`Context inbound duplikat untuk inbound_source_ref "${inbound_source_ref}".`);
    this.name = 'DuplicateInboundContextError';
  }
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_OFFSET_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function parseCommitmentEventAt(value: string): number | null {
  if (!ISO_DATETIME_OFFSET_RE.test(value)) return null;
  const epochMs = Date.parse(value);
  return Number.isNaN(epochMs) ? null : epochMs;
}

function issue(
  code: CommitmentIssueCode,
  message: string,
  extra: Partial<CommitmentValidationIssue> = {},
): CommitmentValidationIssue {
  return { code, message, ...extra };
}

/**
 * Validasi bentuk normalized DOC-08 §6.
 *
 * `event_at` wajib ISO 8601 lengkap dengan detik dan offset/Z sesuai contoh
 * kontrak (`2026-11-10T08:00:00+07:00`); timestamp lokal tanpa offset ditolak.
 */
export function validateNormalizedCommitmentRow(
  rowNumber: number,
  raw: unknown,
): { ok: true; value: NormalizedCommitmentRow } | { ok: false; issues: CommitmentValidationIssue[] } {
  if (!isRecord(raw)) {
    return {
      ok: false,
      issues: [issue('INVALID_FILE', 'Baris commitment harus berupa objek normalized.', { row_number: rowNumber })],
    };
  }

  const issues: CommitmentValidationIssue[] = [];
  const inboundSourceRef = raw.inbound_source_ref;
  const eventRef = raw.event_ref;
  const eventType = raw.event_type;
  const promisedDate = raw.promised_date;
  const eventAt = raw.event_at;

  if (typeof inboundSourceRef !== 'string' || inboundSourceRef.trim() === '') {
    issues.push(
      issue('INVALID_FILE', 'inbound_source_ref wajib berupa string non-kosong.', {
        row_number: rowNumber,
        field: 'inbound_source_ref',
      }),
    );
  }
  if (typeof eventRef !== 'string' || eventRef.trim() === '') {
    issues.push(
      issue('INVALID_FILE', 'event_ref wajib berupa string non-kosong.', {
        row_number: rowNumber,
        field: 'event_ref',
      }),
    );
  }
  if (eventType !== 'INITIAL' && eventType !== 'CHANGE') {
    issues.push(
      issue('INVALID_FILE', 'event_type wajib INITIAL atau CHANGE.', {
        row_number: rowNumber,
        field: 'event_type',
      }),
    );
  }
  if (typeof promisedDate !== 'string' || !isIsoDate(promisedDate)) {
    issues.push(
      issue('INVALID_FILE', 'promised_date wajib format tanggal ISO YYYY-MM-DD yang valid.', {
        row_number: rowNumber,
        field: 'promised_date',
      }),
    );
  }
  if (typeof eventAt !== 'string' || parseCommitmentEventAt(eventAt) === null) {
    issues.push(
      issue(
        'INVALID_FILE',
        'event_at wajib ISO 8601 dengan offset zona waktu atau Z; timestamp lokal tanpa offset ditolak.',
        { row_number: rowNumber, field: 'event_at' },
      ),
    );
  }

  if (issues.length > 0) return { ok: false, issues };

  return {
    ok: true,
    value: {
      inbound_source_ref: (inboundSourceRef as string).trim(),
      event_ref: (eventRef as string).trim(),
      event_type: eventType as CommitmentEventType,
      promised_date: promisedDate as string,
      event_at: eventAt as string,
    },
  };
}

function cloneHistory(history: CommitmentHistory): CommitmentHistory {
  return {
    inbound_source_ref: history.inbound_source_ref,
    requested_date: history.requested_date,
    events: history.events.map((event) => ({ ...event })),
  };
}

function sameEventPayload(a: CommitmentEventRecord, b: NormalizedCommitmentRow): boolean {
  return (
    a.inbound_source_ref === b.inbound_source_ref &&
    a.event_ref === b.event_ref &&
    a.event_type === b.event_type &&
    a.promised_date === b.promised_date &&
    a.event_at === b.event_at
  );
}

/**
 * Store append-only in-memory untuk pengujian/domain slice SRS-18.
 * Bukan persistence produksi.
 *
 * Konstruktor menolak `inbound_source_ref` duplikat (setelah trim) agar
 * `requested_date` tidak bisa tertimpa diam-diam.
 */
export class CommitmentHistoryStore {
  private readonly histories = new Map<string, CommitmentHistory>();
  private sequence = 0;

  constructor(inboundContexts: InboundCommitmentContext[] = []) {
    for (const context of inboundContexts) {
      const ref = context.inbound_source_ref.trim();
      if (this.histories.has(ref)) {
        throw new DuplicateInboundContextError(ref);
      }
      this.histories.set(ref, {
        inbound_source_ref: ref,
        requested_date: context.requested_date,
        events: [],
      });
    }
  }

  getHistory(inboundSourceRef: string): CommitmentHistory | undefined {
    const history = this.histories.get(inboundSourceRef);
    return history ? cloneHistory(history) : undefined;
  }

  getAllHistories(): CommitmentHistory[] {
    return [...this.histories.values()].map(cloneHistory);
  }

  /**
   * Batas domain yang aman: input divalidasi ulang di sini, sehingga caller
   * yang melewati `validateNormalizedCommitmentRow` (mis. JavaScript atau cast
   * TypeScript) tidak dapat menyisipkan event invalid ke histori.
   */
  apply(rowNumber: number, row: NormalizedCommitmentRow): ApplyCommitmentResult {
    const validated = validateNormalizedCommitmentRow(rowNumber, row);
    if (!validated.ok) {
      const rawInboundRef = isRecord(row) ? row.inbound_source_ref : undefined;
      return {
        ok: false,
        status: 'REJECTED',
        history: {
          inbound_source_ref: typeof rawInboundRef === 'string' ? rawInboundRef.trim() : '',
          requested_date: '',
          events: [],
        },
        issues: validated.issues,
      };
    }

    const normalized = validated.value;
    const history = this.histories.get(normalized.inbound_source_ref);
    if (!history) {
      return {
        ok: false,
        status: 'REJECTED',
        history: {
          inbound_source_ref: normalized.inbound_source_ref,
          requested_date: '',
          events: [],
        },
        issues: [
          issue('MISSING_REFERENCE', 'inbound_source_ref belum memiliki referensi inbound committed pada scope ini.', {
            row_number: rowNumber,
            field: 'inbound_source_ref',
            inbound_source_ref: normalized.inbound_source_ref,
            event_ref: normalized.event_ref,
          }),
        ],
      };
    }

    const existing = history.events.find((event) => event.event_ref === normalized.event_ref);
    if (existing) {
      if (sameEventPayload(existing, normalized)) {
        return {
          ok: true,
          status: 'IDEMPOTENT',
          history: cloneHistory(history),
          record: { ...existing },
          issues: [],
        };
      }
      return {
        ok: false,
        status: 'REJECTED',
        history: cloneHistory(history),
        issues: [
          issue('CONFLICTING_EVENT_REF', 'event_ref sudah ada dengan payload berbeda untuk inbound yang sama.', {
            row_number: rowNumber,
            field: 'event_ref',
            inbound_source_ref: normalized.inbound_source_ref,
            event_ref: normalized.event_ref,
          }),
        ],
      };
    }

    const hasInitial = history.events.some((event) => event.event_type === 'INITIAL');
    if (normalized.event_type === 'CHANGE' && !hasInitial) {
      return {
        ok: false,
        status: 'REJECTED',
        history: cloneHistory(history),
        issues: [
          issue('CHANGE_WITHOUT_INITIAL', 'Event CHANGE ditolak karena belum ada INITIAL untuk inbound tersebut.', {
            row_number: rowNumber,
            field: 'event_type',
            inbound_source_ref: normalized.inbound_source_ref,
            event_ref: normalized.event_ref,
          }),
        ],
      };
    }

    if (normalized.event_type === 'INITIAL' && hasInitial) {
      return {
        ok: false,
        status: 'REJECTED',
        history: cloneHistory(history),
        issues: [
          issue('INVALID_FILE', 'Event INITIAL kedua untuk inbound yang sama ditolak.', {
            row_number: rowNumber,
            field: 'event_type',
            inbound_source_ref: normalized.inbound_source_ref,
            event_ref: normalized.event_ref,
          }),
        ],
      };
    }

    const eventAtEpochMs = parseCommitmentEventAt(normalized.event_at);
    if (eventAtEpochMs === null) {
      return {
        ok: false,
        status: 'REJECTED',
        history: cloneHistory(history),
        issues: [
          issue('INVALID_FILE', 'event_at tidak valid; timestamp lokal tanpa offset ditolak.', {
            row_number: rowNumber,
            field: 'event_at',
            event_ref: normalized.event_ref,
          }),
        ],
      };
    }

    const record: CommitmentEventRecord = {
      inbound_source_ref: normalized.inbound_source_ref,
      event_ref: normalized.event_ref,
      event_type: normalized.event_type,
      promised_date: normalized.promised_date,
      event_at: normalized.event_at,
      event_at_epoch_ms: eventAtEpochMs,
      source_row_number: rowNumber,
      recorded_sequence: ++this.sequence,
    };

    // BR-INB-01/02: append-only; requested_date tidak pernah disentuh.
    history.events.push(record);

    return {
      ok: true,
      status: 'APPLIED',
      history: cloneHistory(history),
      record: { ...record },
      issues: [],
    };
  }
}

/**
 * Memproses baris secara berurutan (non-atomik). Baris invalid dicatat sebagai
 * issue dan dilewati; baris valid sebelumnya tetap applied. `ok` hanya berarti
 * "tidak ada issue", bukan "tidak ada mutasi" — lihat `ImportCommitmentBatchResult`.
 */
export function importCommitmentRows(
  inboundContexts: InboundCommitmentContext[],
  rows: CommitmentSourceRow[],
): ImportCommitmentBatchResult {
  const store = new CommitmentHistoryStore(inboundContexts);
  const applied: CommitmentEventRecord[] = [];
  const idempotent: CommitmentEventRecord[] = [];
  const issues: CommitmentValidationIssue[] = [];

  for (const sourceRow of rows) {
    const validated = validateNormalizedCommitmentRow(sourceRow.row_number, sourceRow.normalized);
    if (!validated.ok) {
      issues.push(...validated.issues);
      continue;
    }

    const result = store.apply(sourceRow.row_number, validated.value);
    if (result.status === 'APPLIED' && result.record) applied.push(result.record);
    if (result.status === 'IDEMPOTENT' && result.record) idempotent.push(result.record);
    if (result.status === 'REJECTED') issues.push(...result.issues);
  }

  return {
    ok: issues.length === 0,
    histories: store.getAllHistories(),
    applied,
    idempotent,
    issues,
  };
}

export function assertRequestedDateUnchanged(
  before: InboundCommitmentContext,
  after: CommitmentHistory | undefined,
): CommitmentValidationIssue | null {
  if (!after) return null;
  if (before.requested_date !== after.requested_date) {
    return issue('IMMUTABLE_REQUESTED_DATE', 'requested_date berubah setelah event commitment; ini melanggar BR-INB-01.', {
      field: 'requested_date',
      inbound_source_ref: before.inbound_source_ref,
    });
  }
  return null;
}
