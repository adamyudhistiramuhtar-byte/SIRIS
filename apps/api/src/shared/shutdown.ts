/** Penutupan dibatasi waktu; log hanya memakai pesan konstan, tanpa error mentah. */
export interface ShutdownServer {
  close(callback: (error?: Error) => void): unknown;
}

export interface ShutdownEffects {
  exit(code: number): void;
  log(message: string): void;
  error(message: string): void;
  timeoutMs?: number;
}

export function createGracefulShutdown(
  server: ShutdownServer,
  closeDatabase: () => Promise<void>,
  effects: ShutdownEffects,
): () => void {
  let started = false;
  let finished = false;
  return () => {
    if (started) return;
    started = true;
    effects.log('[SIRIS API] Memulai graceful shutdown.');
    const complete = (code: number): void => {
      if (finished) return;
      finished = true;
      clearTimeout(deadline);
      effects.exit(code);
    };
    const deadline = setTimeout(() => {
      effects.error('[SIRIS API] Batas waktu graceful shutdown terlampaui.');
      complete(1);
    }, effects.timeoutMs ?? 10000);
    deadline.unref();

    const finish = async (httpError?: Error): Promise<void> => {
      let code = httpError ? 1 : 0;
      if (httpError) effects.error('[SIRIS API] Gagal menutup server HTTP.');
      try {
        await closeDatabase();
      } catch {
        code = 1;
        effects.error('[SIRIS API] Gagal menutup database pool.');
      }
      complete(code);
    };
    try {
      server.close((error) => { void finish(error); });
    } catch {
      void finish(new Error('HTTP_CLOSE_FAILED'));
    }
  };
}
