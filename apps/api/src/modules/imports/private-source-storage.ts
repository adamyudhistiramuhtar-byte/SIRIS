import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, open, readFile, unlink } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { StageError } from './staging-contract.js';

export interface StoredSource { key: string; sha256: string; bytes: number; }
/** Root khusus privat, tidak boleh didaftarkan sebagai express.static. */
export class PrivateSourceStorage {
  constructor(private readonly root: string) {
    if (!isAbsolute(root)) throw new Error('INVALID_STORAGE_CONFIGURATION');
  }
  private path(key: string): string {
    if (!/^[0-9a-f-]{36}$/.test(key)) throw new Error('INVALID_STORAGE_KEY');
    return join(this.root, key);
  }
  async write(content: AsyncIterable<Uint8Array>, remainingBytes: number): Promise<StoredSource> {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    const root = await lstat(this.root);
    if (!root.isDirectory() || root.isSymbolicLink() || (root.mode & 0o077)) throw new Error('UNSAFE_STORAGE_CONFIGURATION');
    const key = randomUUID();
    const handle = await open(this.path(key), 'wx', 0o600);
    const hash = createHash('sha256');
    let bytes = 0;
    try {
      for await (const chunk of content) {
        bytes += chunk.byteLength;
        if (bytes > remainingBytes) throw new StageError('LIMIT_EXCEEDED');
        hash.update(chunk);
        await handle.writeFile(chunk);
      }
      if (bytes === 0) throw new StageError('INVALID_FILE');
      await handle.sync();
      return { key, sha256: hash.digest('hex'), bytes };
    } catch (error) {
      await unlink(this.path(key)); throw error;
    } finally { await handle.close(); }
  }
  async read(source: StoredSource): Promise<Buffer> { return readFile(this.path(source.key)); }
  async remove(source: StoredSource): Promise<void> { await unlink(this.path(source.key)); }
}
