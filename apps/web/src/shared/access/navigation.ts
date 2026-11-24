import type { Component } from 'vue';
import type { DataMode, UserRole } from '@siris/contracts';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  CalendarCheck,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  GitCompare,
  History,
  Home,
  PackageCheck,
  ShieldCheck,
  TrendingUp,
} from 'lucide-vue-next';
import { canViewPage, type PageUcId } from './access-matrix';

export interface NavItem {
  name: string;
  path: string;
  icon: Component;
  /** Kosong untuk Beranda, yang terbuka bagi semua role. */
  ucId?: PageUcId;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/** Daftar menu lengkap. Tampilan per role disaring oleh getNavigationFor (§6.2). */
export const NAVIGATION_GROUPS: readonly NavGroup[] = [
  {
    title: 'Utama',
    items: [{ name: 'Beranda', path: '/', icon: Home }],
  },
  {
    title: 'Supplier Inbound',
    items: [
      { name: 'Impor Referensi Inbound', path: '/inbound/import-reference', icon: FileSpreadsheet, ucId: 'UC-01' },
      { name: 'Impor Janji Supplier', path: '/inbound/import-commitment', icon: CalendarCheck, ucId: 'UC-02' },
      { name: 'Impor Penerimaan', path: '/inbound/import-receiving', icon: PackageCheck, ucId: 'UC-03' },
      { name: 'Exception Inbound', path: '/inbound/exceptions', icon: AlertTriangle, ucId: 'UC-04' },
      { name: 'Pemberitahuan Inbound', path: '/inbound/notices', icon: Bell, ucId: 'UC-05' },
      { name: 'Riwayat Inbound', path: '/inbound/history', icon: History, ucId: 'UC-07' },
      { name: 'Metrik Supplier', path: '/inbound/metrics', icon: BarChart3, ucId: 'UC-08' },
    ],
  },
  {
    title: 'Persediaan',
    items: [
      { name: 'Impor Data Stok', path: '/inventory/import-stock', icon: Boxes, ucId: 'UC-09' },
      { name: 'Impor Hasil Hitung Fisik', path: '/inventory/import-count', icon: ClipboardList, ucId: 'UC-10' },
      { name: 'Arsip Bukti Kartu Stok', path: '/inventory/evidence', icon: FileText, ucId: 'UC-11' },
      { name: 'Rekonsiliasi Stok', path: '/inventory/reconcile', icon: GitCompare, ucId: 'UC-12' },
      { name: 'Riwayat Selisih Stok', path: '/inventory/history', icon: History, ucId: 'UC-13' },
      { name: 'Metrik Persediaan', path: '/inventory/metrics', icon: TrendingUp, ucId: 'UC-14' },
    ],
  },
  {
    title: 'Referensi',
    items: [{ name: 'Referensi Material WO', path: '/materials/work-orders', icon: Boxes, ucId: 'UC-06' }],
  },
  {
    title: 'Pengawasan',
    items: [{ name: 'Audit Proses', path: '/audit', icon: ShieldCheck, ucId: 'UC-15' }],
  },
];

/** Menu yang boleh tampil untuk role dan mode ini; grup tanpa item disembunyikan. */
export function getNavigationFor(role: UserRole, mode: DataMode): NavGroup[] {
  return NAVIGATION_GROUPS.map((group) => ({
    title: group.title,
    items: group.items.filter((item) => !item.ucId || canViewPage(role, item.ucId, mode)),
  })).filter((group) => group.items.length > 0);
}
