import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, mkdir, open, unlink } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { MAX_EVIDENCE_BYTES } from './evidence-policy.js';

export interface StoredEvidence {
  key: string;
  sha256: string;
  size: number;
}

/** Penyimpanan privat internal. Akses pemanggil tetap harus diotorisasi backend. */
export class PrivateEvidenceStorage {
  constructor(private readonly root: string, private readonly onCleanupFailure: () => void) {
    if (!isAbsolute(root)) throw new Error('INVALID_STORAGE_CONFIGURATION');
  }

  private path(key: string): string {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
      throw new Error('INVALID_STORAGE_KEY');
    }
    return join(this.root, key);
  }

  private async ensurePrivateRoot(): Promise<void> {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    const root = await lstat(this.root);
    if (!root.isDirectory() || root.isSymbolicLink() || (root.mode & 0o077) !== 0) {
      throw new Error('UNSAFE_STORAGE_CONFIGURATION');
    }
  }

  async write(content: AsyncIterable<Uint8Array>): Promise<StoredEvidence> {
    await this.ensurePrivateRoot();
    const key = randomUUID();
    let handle;
    try {
      handle = await open(this.path(key), constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
    } catch {
      throw new Error('EVIDENCE_STORAGE_FAILED');
    }
    const hash = createHash('sha256');
    let size = 0;
    try {
      for await (const chunk of content) {
        size += chunk.byteLength;
        if (size > MAX_EVIDENCE_BYTES) throw new Error('LIMIT_EXCEEDED');
        hash.update(chunk);
        await handle.writeFile(chunk);
      }
      if (size === 0) throw new Error('INVALID_FILE');
      await handle.sync();
      return { key, sha256: hash.digest('hex'), size };
    } catch (error) {
      try {
        await unlink(this.path(key));
      } catch {
        try { this.onCleanupFailure(); } catch { /* Diagnostik tidak menutupi error awal. */ }
      }
      if (error instanceof Error && ['LIMIT_EXCEEDED', 'INVALID_FILE'].includes(error.message)) throw error;
      throw new Error('EVIDENCE_STORAGE_FAILED');
    } finally {
      await handle.close();
    }
  }

  async read(expected: StoredEvidence): Promise<Buffer> {
    await this.ensurePrivateRoot();
    if (!/^[a-f0-9]{64}$/.test(expected.sha256) ||
      !Number.isSafeInteger(expected.size) || expected.size < 1 || expected.size > MAX_EVIDENCE_BYTES) {
      throw new Error('INVALID_EVIDENCE_METADATA');
    }
    const path = this.path(expected.key);
    let handle;
    try {
      handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    } catch {
      throw new Error('EVIDENCE_STORAGE_FAILED');
    }
    try {
      const info = await handle.stat();
      if (!info.isFile() || info.size !== expected.size || (info.mode & 0o077) !== 0) {
        throw new Error('EVIDENCE_INTEGRITY_FAILED');
      }
      const bytes = Buffer.alloc(expected.size + 1);
      let offset = 0;
      while (offset < bytes.length) {
        const result = await handle.read(bytes, offset, bytes.length - offset, offset);
        if (result.bytesRead === 0) break;
        offset += result.bytesRead;
      }
      const content = bytes.subarray(0, offset);
      if (offset !== expected.size || createHash('sha256').update(content).digest('hex') !== expected.sha256) {
        throw new Error('EVIDENCE_INTEGRITY_FAILED');
      }
      return content;
    } finally {
      await handle.close();
    }
  }

  async remove(key: string): Promise<void> {
    await this.ensurePrivateRoot();
    const path = this.path(key);
    try {
      await unlink(path);
    } catch {
      throw new Error('EVIDENCE_STORAGE_FAILED');
    }
  }
}
