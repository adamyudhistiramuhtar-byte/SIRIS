/**
 * Matriks izin halaman UJI (SRS-36 baseline v0.1, §6.2).
 * Sumber: development-docs/MATRIK_PERMUTASI_SRS-36.md.
 *
 * Catatan batas:
 * - Hanya untuk mode UJI. Izin ACTUAL belum disetujui (§11) sehingga mode ACTUAL
 *   tidak pernah memberi akses halaman.
 * - Ini hanya penyaring tampilan (menu dan route). Backend tetap otoritas akses
 *   (PM butir C; DOC-05 L135).
 * - UC-16 adalah fungsi validasi internal bersama, bukan halaman atau menu,
 *   sehingga sengaja tidak ada di sini.
 */
import type { DataMode, UserRole } from '@siris/contracts';

export type PageUcId =
  | 'UC-01'
  | 'UC-02'
  | 'UC-03'
  | 'UC-04'
  | 'UC-05'
  | 'UC-06'
  | 'UC-07'
  | 'UC-08'
  | 'UC-09'
  | 'UC-10'
  | 'UC-11'
  | 'UC-12'
  | 'UC-13'
  | 'UC-14'
  | 'UC-15';

export const USER_ROLES: readonly UserRole[] = [
  'PURCHASING',
  'WAREHOUSE',
  'PRODUCTION',
  'MANAGEMENT',
] as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  PURCHASING: 'Purchasing',
  WAREHOUSE: 'Warehouse',
  PRODUCTION: 'Production',
  MANAGEMENT: 'Management',
};

/** Halaman yang diizinkan per role (§6.1 dan §10.2). */
export const PAGE_ACCESS: Record<UserRole, readonly PageUcId[]> = {
  PURCHASING: ['UC-01', 'UC-02', 'UC-04', 'UC-05', 'UC-06', 'UC-07', 'UC-08'],
  WAREHOUSE: [
    'UC-03',
    'UC-04',
    'UC-05',
    'UC-07',
    'UC-09',
    'UC-10',
    'UC-11',
    'UC-12',
    'UC-13',
    'UC-14',
    'UC-15',
  ],
  PRODUCTION: ['UC-06'],
  MANAGEMENT: ['UC-08', 'UC-13', 'UC-14'],
};

/**
 * Halaman dengan izin "A (view saja)" (§6.2 catatan, PM butir D).
 * Upload/download evidence (UC-11) dan eksekusi rekonsiliasi (UC-12) belum disetujui.
 */
export const VIEW_ONLY_PAGES: readonly PageUcId[] = ['UC-11', 'UC-12'];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

/**
 * Apakah role boleh membuka halaman use case pada mode tertentu.
 * Mengembalikan false untuk role tak dikenal, ucId kosong atau tak terdaftar,
 * dan mode selain UJI (ACTUAL belum diberi izin).
 */
export function canViewPage(
  role: UserRole | null | undefined,
  ucId: string | null | undefined,
  mode: DataMode,
): boolean {
  if (mode !== 'UJI') return false;
  if (!role || !isUserRole(role) || !ucId) return false;
  return (PAGE_ACCESS[role] as readonly string[]).includes(ucId);
}

export function isViewOnlyPage(ucId: string | null | undefined): boolean {
  return !!ucId && (VIEW_ONLY_PAGES as readonly string[]).includes(ucId);
}
