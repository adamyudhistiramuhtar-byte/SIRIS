import { checkEvidenceUpload, checkEvidenceUploadAccess, type EvidenceActor, type EvidenceMime, type EvidenceTarget } from './evidence-policy.js';
import { validateEvidenceStructure } from './evidence-structure.js';
import { type PrivateEvidenceStorage, type StoredEvidence } from './private-evidence-storage.js';

/** Menyiapkan file privat sebelum transaksi metadata, tanpa mengaktifkan endpoint mutasi. */
export async function preparePrivateEvidence(input: {
  actor: EvidenceActor;
  target: EvidenceTarget | null;
  uploadAuthorized: boolean;
  mime: EvidenceMime;
  content: AsyncIterable<Uint8Array>;
  storage: PrivateEvidenceStorage;
  onCleanupFailure: () => void;
}): Promise<StoredEvidence> {
  const access = checkEvidenceUploadAccess(input.actor, input.target, input.uploadAuthorized);
  if (!access.ok) throw new Error(access.code);

  const saved = await input.storage.write(input.content);
  try {
    const bytes = await input.storage.read(saved);
    const policy = checkEvidenceUpload(input.actor, input.target, input.mime, bytes, input.uploadAuthorized);
    if (!policy.ok) throw new Error(policy.code);
    if (!(await validateEvidenceStructure(bytes, input.mime))) throw new Error('INVALID_FILE');
    return saved;
  } catch (error) {
    try {
      await input.storage.remove(saved.key);
    } catch {
      try { input.onCleanupFailure(); } catch { /* Error awal tetap dipertahankan. */ }
    }
    throw error;
  }
}
