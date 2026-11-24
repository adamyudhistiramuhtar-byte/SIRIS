import { describe, it, expect } from 'vitest';
import {
  PAGE_ACCESS,
  USER_ROLES,
  canViewPage,
  isViewOnlyPage,
  type PageUcId,
} from '../shared/access/access-matrix';
import { getNavigationFor, NAVIGATION_GROUPS } from '../shared/access/navigation';

// Nilai ekspektasi ditulis ulang dari SRS-36 §6.2 / §10.2, bukan diturunkan dari kode.
const EXPECTED: Record<string, string[]> = {
  PURCHASING: ['UC-01', 'UC-02', 'UC-04', 'UC-05', 'UC-06', 'UC-07', 'UC-08'],
  WAREHOUSE: ['UC-03', 'UC-04', 'UC-05', 'UC-07', 'UC-09', 'UC-10', 'UC-11', 'UC-12', 'UC-13', 'UC-14', 'UC-15'],
  PRODUCTION: ['UC-06'],
  MANAGEMENT: ['UC-08', 'UC-13', 'UC-14'],
};

describe('Matriks halaman UJI per role (SRS-36 §6.2)', () => {
  it('hanya mengenal empat role, tanpa ADMIN', () => {
    expect([...USER_ROLES].sort()).toEqual(['MANAGEMENT', 'PRODUCTION', 'PURCHASING', 'WAREHOUSE']);
    expect(canViewPage('ADMIN' as never, 'UC-01', 'UJI')).toBe(false);
  });

  it.each(Object.entries(EXPECTED))('akses halaman %s sesuai matriks', (role, ucs) => {
    expect([...PAGE_ACCESS[role as keyof typeof PAGE_ACCESS]].sort()).toEqual([...ucs].sort());
    for (let n = 1; n <= 15; n += 1) {
      const uc = `UC-${String(n).padStart(2, '0')}`;
      expect(canViewPage(role as never, uc, 'UJI')).toBe(ucs.includes(uc));
    }
  });

  it('UC-16 bukan halaman: ditolak untuk semua role', () => {
    for (const role of USER_ROLES) expect(canViewPage(role, 'UC-16', 'UJI')).toBe(false);
  });

  it('mode ACTUAL tidak memberi akses apa pun', () => {
    for (const role of USER_ROLES) {
      for (const uc of PAGE_ACCESS[role]) expect(canViewPage(role, uc, 'ACTUAL')).toBe(false);
    }
  });

  it('role atau use case kosong ditolak', () => {
    expect(canViewPage(null, 'UC-01', 'UJI')).toBe(false);
    expect(canViewPage('PURCHASING', undefined, 'UJI')).toBe(false);
  });

  it('UC-11 dan UC-12 hanya lihat', () => {
    expect(isViewOnlyPage('UC-11')).toBe(true);
    expect(isViewOnlyPage('UC-12')).toBe(true);
    expect(isViewOnlyPage('UC-09')).toBe(false);
  });
});

describe('Navigasi per role', () => {
  const ucsFor = (role: Parameters<typeof getNavigationFor>[0]) =>
    getNavigationFor(role, 'UJI')
      .flatMap((g) => g.items)
      .map((i) => i.ucId)
      .filter(Boolean) as PageUcId[];

  it.each(Object.entries(EXPECTED))('menu %s hanya memuat halaman yang diizinkan', (role, ucs) => {
    expect(ucsFor(role as never).sort()).toEqual([...ucs].sort());
  });

  it('Beranda selalu tampil dan grup kosong disembunyikan', () => {
    const nav = getNavigationFor('PRODUCTION', 'UJI');
    expect(nav.flatMap((g) => g.items).some((i) => i.path === '/')).toBe(true);
    expect(nav.map((g) => g.title)).toEqual(['Utama', 'Referensi']);
  });

  it('mode ACTUAL hanya menyisakan Beranda', () => {
    const items = getNavigationFor('WAREHOUSE', 'ACTUAL').flatMap((g) => g.items);
    expect(items.map((i) => i.path)).toEqual(['/']);
  });

  it('tidak ada menu untuk UC-16', () => {
    const all = NAVIGATION_GROUPS.flatMap((g) => g.items);
    expect(all.some((i) => (i.ucId as string | undefined) === 'UC-16')).toBe(false);
  });
});
