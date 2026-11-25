/**
 * SRS-52 Fase A: adapter PreviewReader untuk bentuk preview SRS-51 PR #54 (salinan tipe),
 * serta kontrak terhadap probe #54 yang masih menunggu keputusan Adam.
 * Data seluruhnya UJI; tidak ada data operasional mitra.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { isImportCommitError } from '../modules/import-commit/commit-errors.js';
import { CommitService, type CommitCommand } from '../modules/import-commit/commit.service.js';
import {
  createSrs51PreviewReader,
  toPreviewSnapshot,
  type Srs51PreviewIssue,
  type Srs51PreviewResult,
  type StoredSrs51Preview,
} from '../modules/import-commit/srs51-preview-adapter.js';
import {
  FakeClock,
  FakeImportDatabase,
  RecordingLogger,
  UJI_ACTOR,
  UJI_BATCH_ID,
  UJI_CORRELATION,
  ujiBatch,
  type FakeTx,
} from './fakes/import-commit-fakes.js';

const RETENTION_MS = 24 * 60 * 60 * 1000; // nilai tes saja
const UJI_FINGERPRINT = 'a'.repeat(64);

function issue(id: string, severity: 'ERROR' | 'WARNING'): Srs51PreviewIssue {
  return { id, severity, code: `UJI_${severity}`, message: 'UJI', rowNumber: 1 };
}

function srs51Preview(overrides: Partial<Srs51PreviewResult> = {}): Srs51PreviewResult {
  return {
    batchId: UJI_BATCH_ID,
    status: 'VALID',
    fingerprint: UJI_FINGERPRINT,
    validationVersion: 'srs51-preview-v1',
    expiresAt: '2026-11-25T03:30:00.000Z', // 10:30 WIB
    expiresInMs: 30 * 60 * 1000,
    issues: [],
    warnings: [],
    errors: [],
    rowCount: 3,
    canCommit: true,
    ...overrides,
  };
}

function stored(overrides: Partial<Srs51PreviewResult> = {}, referenceRevision = 'REF-UJI-1'): StoredSrs51Preview {
  return { preview: srs51Preview(overrides), reference_revision: referenceRevision };
}

describe('SRS-52 adapter preview #54: pemetaan bentuk', () => {
  it('memetakan camelCase ke snake_case, ISO string ke Date, errors.length, dan warnings[].id', () => {
    const snapshot = toPreviewSnapshot(stored({
      warnings: [issue('warn_aaaa', 'WARNING'), issue('warn_bbbb', 'WARNING')],
    }));
    expect(snapshot).toEqual({
      batch_id: UJI_BATCH_ID,
      fingerprint: UJI_FINGERPRINT,
      expires_at: new Date('2026-11-25T10:30:00+07:00'),
      reference_revision: 'REF-UJI-1',
      error_count: 0,
      warning_issue_ids: ['warn_aaaa', 'warn_bbbb'],
    });
  });

  it('expiresAt dengan offset berbeda menghasilkan instant yang sama', () => {
    const a = toPreviewSnapshot(stored({ expiresAt: '2026-11-25T10:30:00+07:00' }));
    const b = toPreviewSnapshot(stored({ expiresAt: '2026-11-25T03:30:00Z' }));
    expect(a.expires_at.getTime()).toBe(b.expires_at.getTime());
  });

  it('expiresAt yang tidak dapat diurai menjadi Invalid Date (fail-closed, bukan fail-open seperti #54)', () => {
    expect(Number.isNaN(toPreviewSnapshot(stored({ expiresAt: 'bukan-tanggal' })).expires_at.getTime())).toBe(true);
  });

  it('error_count mengikuti errors.length', () => {
    const snapshot = toPreviewSnapshot(stored({
      status: 'INVALID', canCommit: false, errors: [issue('warn_e1', 'ERROR'), issue('warn_e2', 'ERROR')],
    }));
    expect(snapshot.error_count).toBe(2);
  });

  it('preview INVALID atau canCommit false tanpa daftar error tetap dihitung minimal satu error', () => {
    expect(toPreviewSnapshot(stored({ status: 'INVALID', canCommit: false })).error_count).toBe(1);
    expect(toPreviewSnapshot(stored({ status: 'VALID', canCommit: false })).error_count).toBe(1);
    expect(toPreviewSnapshot(stored({ status: 'INVALID', canCommit: true })).error_count).toBe(1);
  });

  it.each([
    ['batchId kosong', stored({ batchId: '' })],
    ['fingerprint bukan string', stored({ fingerprint: 1 as unknown as string })],
    ['expiresAt bukan string', stored({ expiresAt: Date.now() as unknown as string })],
    ['warnings bukan array', stored({ warnings: null as unknown as Srs51PreviewIssue[] })],
    ['warning tanpa id', stored({ warnings: [{ ...issue('x', 'WARNING'), id: '' }] })],
    ['errors bukan array', stored({ errors: {} as unknown as Srs51PreviewIssue[] })],
    ['reference revision kosong', stored({}, '')],
    ['preview null', { preview: null, reference_revision: 'REF-UJI-1' } as unknown as StoredSrs51Preview],
  ])('bentuk tidak sesuai ditolak tanpa membawa isi data: %s', (_label, value) => {
    expect(() => toPreviewSnapshot(value)).toThrowError(/^SRS51_PREVIEW_SHAPE_INVALID$/);
  });
});

describe('SRS-52 adapter preview #54: dipakai CommitService', () => {
  let db: FakeImportDatabase;
  let clock: FakeClock;
  let current: StoredSrs51Preview | null;

  function service(): CommitService<FakeTx> {
    const previews = createSrs51PreviewReader<FakeTx>({ load: async () => current });
    return new CommitService<FakeTx>({
      unitOfWork: db.unitOfWork, batches: db.batches, authorizer: db.authorizer, previews,
      references: db.references, writers: [db.writer('COUNT')], idempotency: db.idempotency, audit: db.audit,
      clock, logger: new RecordingLogger(),
    }, { idempotencyRetentionMs: RETENTION_MS });
  }

  function command(acknowledged: string[] = []): CommitCommand {
    return {
      actor: UJI_ACTOR,
      batch_id: UJI_BATCH_ID,
      idempotency_key: 'uji-adapter-1',
      correlation_id: UJI_CORRELATION,
      body: { preview_fingerprint: UJI_FINGERPRINT, acknowledged_warnings: acknowledged },
    };
  }

  async function errorCode(promise: Promise<unknown>): Promise<string> {
    try {
      await promise;
      return 'NONE';
    } catch (error) {
      return isImportCommitError(error) ? error.code : 'NON_DOMAIN';
    }
  }

  beforeEach(() => {
    db = new FakeImportDatabase();
    db.addBatch(ujiBatch());
    clock = new FakeClock(new Date('2026-11-25T10:00:00+07:00'));
    current = stored();
  });

  it('preview #54 yang valid dan segar dapat di-commit', async () => {
    await expect(service().commit(command())).resolves.toEqual({ batch_id: UJI_BATCH_ID, state: 'COMMITTED', committed_count: 3 });
  });

  it('expiresAt tidak valid ditolak PREVIEW_EXPIRED dan tidak menulis domain', async () => {
    current = stored({ expiresAt: 'bukan-tanggal' });
    expect(await errorCode(service().commit(command()))).toBe('PREVIEW_EXPIRED');
    expect(db.committed.domainRows).toHaveLength(0);
  });

  it('jam server tepat pada expiresAt ditolak PREVIEW_EXPIRED', async () => {
    clock.current = new Date('2026-11-25T03:30:00.000Z');
    expect(await errorCode(service().commit(command()))).toBe('PREVIEW_EXPIRED');
  });

  it('preview #54 dengan warning ditolak WARNING_ACKNOWLEDGEMENT_OPEN walaupun canCommit true', async () => {
    current = stored({ warnings: [issue('warn_aaaa', 'WARNING')], canCommit: true });
    expect(await errorCode(service().commit(command()))).toBe('WARNING_ACKNOWLEDGEMENT_OPEN');
  });

  it('preview INVALID ditolak STATE_CONFLICT', async () => {
    current = stored({ status: 'INVALID', canCommit: false, errors: [issue('warn_e1', 'ERROR')] });
    expect(await errorCode(service().commit(command()))).toBe('STATE_CONFLICT');
  });

  it('tidak ada preview tersimpan ditolak PREVIEW_CHANGED', async () => {
    current = null;
    expect(await errorCode(service().commit(command()))).toBe('PREVIEW_CHANGED');
  });

  it('reference revision tersimpan berbeda dari revision sekarang ditolak PREVIEW_CHANGED', async () => {
    current = stored({}, 'REF-UJI-LAMA');
    expect(await errorCode(service().commit(command()))).toBe('PREVIEW_CHANGED');
  });

  it('bentuk preview rusak menjadi TRANSACTION_FAILED tanpa data parsial', async () => {
    current = stored({ fingerprint: '' });
    expect(await errorCode(service().commit(command()))).toBe('TRANSACTION_FAILED');
    expect(db.committed.domainRows).toHaveLength(0);
    expect(db.committed.idempotency.size).toBe(0);
  });
});

/**
 * Kontrak terhadap probe PR #54 (review 25 Nov 2026). Ditulis sebagai TODO karena perilaku
 * final menunggu keputusan Adam (komentar Jira SRS-52 nomor 10221); bukan PASS.
 */
describe('SRS-52 kontrak preview #54: menunggu keputusan Adam', () => {
  it.todo('P2 (C58-04) menunggu keputusan Adam: ID warning berubah atau acknowledgement batal bila data baris berubah walau batch/code/row/field sama');
  it.todo('P4 (C58-04) menunggu keputusan Adam: canCommit preview konsisten dengan penolakan commit saat ada warning yang belum di-acknowledge');
  it.todo('P5 (C58-05) menunggu keputusan Adam: expiry disimpan dan otoritatif di server; expiresAt tidak valid ditolak di kedua sisi');
  it.todo('P9 (C58-05) menunggu keputusan Adam: kode dan status preview kedaluwarsa (409 atau 410) serta preview berubah (PREVIEW_INVALIDATED atau PREVIEW_CHANGED) sama di #54 dan SRS-52');
});
