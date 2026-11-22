import { watch } from 'vue';
import type { RouteLocationNormalized, Router } from 'vue-router';
import { canViewPage } from '../shared/access/access-matrix';
import type { SessionStore } from '../shared/session/session-context';

export const FORBIDDEN_ROUTE_NAME = 'forbidden';

/**
 * Keputusan akses route: undefined berarti boleh. Route tanpa `meta.ucId`
 * (Beranda, login, halaman akses ditolak) tidak dibatasi per role.
 * Ini hanya penyaring tampilan; backend tetap otoritas akses.
 */
function evaluate(to: RouteLocationNormalized, session: SessionStore) {
  const ucId = to.meta.ucId as string | undefined;
  if (!ucId) return undefined;
  if (canViewPage(session.state.role, ucId, session.state.mode)) return undefined;
  return { name: FORBIDDEN_ROUTE_NAME, replace: true };
}

/**
 * Pasang route guard berbasis role/mode. Pesan penolakan tidak menyertakan
 * detail izin atau nama route yang dituju agar route terlarang tetap aman.
 * Saat role atau mode berubah, route yang sedang dibuka dievaluasi ulang.
 */
export function installAccessGuard(router: Router, session: SessionStore): () => void {
  const removeGuard = router.beforeEach((to) => evaluate(to, session));

  const stopWatch = watch(
    () => [session.state.role, session.state.mode, session.state.accountId] as const,
    () => {
      const current = router.currentRoute.value;
      const decision = evaluate(current, session);
      if (decision) void router.replace(decision);
    },
  );

  return () => {
    removeGuard();
    stopWatch();
  };
}
