import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import AppShell from '../layouts/AppShell.vue';
import HomePage from '../pages/HomePage.vue';
import LoginPage from '../pages/LoginPage.vue';
import PlaceholderPage from '../pages/PlaceholderPage.vue';
import ImportReferencePage from '../pages/inbound/ImportReferencePage.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: {
      title: 'Masuk — SIRIS',
      description: 'Halaman autentikasi sesi pengguna',
    },
  },
  {
    path: '/',
    component: AppShell,
    children: [
      {
        path: '',
        name: 'home',
        component: HomePage,
        meta: {
          title: 'Beranda',
          description: 'Pintu masuk alur kerja dan ringkasan aktivitas gudang',
          role: 'Semua Role',
        },
      },
      // Supplier Inbound
      {
        path: 'inbound/import-reference',
        name: 'inbound-import-reference',
        component: ImportReferencePage,
        meta: {
          title: 'Impor Referensi Inbound',
          description: 'Impor referensi PO/Inbound EXPECTED dari Erasoft',
          ucId: 'UC-01',
          sprint: 'Sprint 1 (S1-06)',
          role: 'Purchasing',
        },
      },
      {
        path: 'inbound/import-commitment',
        name: 'inbound-import-commitment',
        component: PlaceholderPage,
        meta: {
          title: 'Impor Janji Supplier',
          description: 'Impor komitmen tanggal/jumlah supplier (INITIAL / CHANGE)',
          ucId: 'UC-02',
          sprint: 'Sprint 2',
          role: 'Purchasing',
        },
      },
      {
        path: 'inbound/import-receiving',
        name: 'inbound-import-receiving',
        component: PlaceholderPage,
        meta: {
          title: 'Impor Penerimaan',
          description: 'Impor data kedatangan fisik RECEIVING dari gudang',
          ucId: 'UC-03',
          sprint: 'Sprint 2',
          role: 'Warehouse',
        },
      },
      {
        path: 'inbound/exceptions',
        name: 'inbound-exceptions',
        component: PlaceholderPage,
        meta: {
          title: 'Exception Inbound',
          description: 'Pemeriksaan delivery delay dan quantity mismatch supplier',
          ucId: 'UC-04',
          sprint: 'Sprint 2',
          role: 'Purchasing, Warehouse',
        },
      },
      {
        path: 'inbound/notices',
        name: 'inbound-notices',
        component: PlaceholderPage,
        meta: {
          title: 'Pemberitahuan Inbound',
          description: 'Prioritas pemantauan inbound dan peringatan keterlambatan',
          ucId: 'UC-05',
          sprint: 'Sprint 2',
          role: 'Purchasing, Warehouse',
        },
      },
      {
        path: 'materials/work-orders',
        name: 'materials-work-orders',
        component: PlaceholderPage,
        meta: {
          title: 'Referensi Material WO',
          description: 'Pembacaan referensi kebutuhan material work order',
          ucId: 'UC-06',
          sprint: 'Sprint 2',
          role: 'Purchasing, Production',
        },
      },
      {
        path: 'inbound/history',
        name: 'inbound-history',
        component: PlaceholderPage,
        meta: {
          title: 'Riwayat Inbound',
          description: 'Penelusuran kronologis seluruh event inbound terpilih',
          ucId: 'UC-07',
          sprint: 'Sprint 2',
          role: 'Purchasing, Warehouse',
        },
      },
      {
        path: 'inbound/metrics',
        name: 'inbound-metrics',
        component: PlaceholderPage,
        meta: {
          title: 'Metrik Supplier',
          description: 'Pemantauan indikator keandalan inbound pemasok',
          ucId: 'UC-08',
          sprint: 'Sprint 2',
          role: 'Purchasing, Management',
        },
      },
      // Persediaan
      {
        path: 'inventory/import-stock',
        name: 'inventory-import-stock',
        component: PlaceholderPage,
        meta: {
          title: 'Impor Data Stok',
          description: 'Impor snapshot saldo akhir stok (QTY AKHIR) gudang',
          ucId: 'UC-09',
          sprint: 'Sprint 1 (S1-07)',
          role: 'Warehouse',
        },
      },
      {
        path: 'inventory/import-count',
        name: 'inventory-import-count',
        component: PlaceholderPage,
        meta: {
          title: 'Impor Hasil Hitung Fisik',
          description: 'Impor hasil stock count fisik gudang',
          ucId: 'UC-10',
          sprint: 'Sprint 2',
          role: 'Warehouse',
        },
      },
      {
        path: 'inventory/evidence',
        name: 'inventory-evidence',
        component: PlaceholderPage,
        meta: {
          title: 'Arsip Bukti Kartu Stok',
          description: 'Pengunggahan bukti foto/dokumen kartu stok fisik',
          ucId: 'UC-11',
          sprint: 'Sprint 3',
          role: 'Warehouse',
        },
      },
      {
        path: 'inventory/reconcile',
        name: 'inventory-reconcile',
        component: PlaceholderPage,
        meta: {
          title: 'Rekonsiliasi Stok',
          description: 'Eksekusi perbandingan stok sistem dengan hitung fisik',
          ucId: 'UC-12',
          sprint: 'Sprint 2',
          role: 'Warehouse',
        },
      },
      {
        path: 'inventory/history',
        name: 'inventory-history',
        component: PlaceholderPage,
        meta: {
          title: 'Riwayat Selisih Stok',
          description: 'Penelusuran riwayat rekonsiliasi dan hasil selisih',
          ucId: 'UC-13',
          sprint: 'Sprint 2',
          role: 'Warehouse, Management',
        },
      },
      {
        path: 'inventory/metrics',
        name: 'inventory-metrics',
        component: PlaceholderPage,
        meta: {
          title: 'Metrik Persediaan',
          description: 'Pemantauan akurasi persediaan dan tingkat selisih stok',
          ucId: 'UC-14',
          sprint: 'Sprint 3',
          role: 'Warehouse, Management',
        },
      },
      // Pengawasan
      {
        path: 'audit',
        name: 'audit',
        component: PlaceholderPage,
        meta: {
          title: 'Audit Proses',
          description: 'Audit log penelusuran proses impor dan rekonsiliasi',
          ucId: 'UC-15',
          sprint: 'Sprint 3',
          role: 'Warehouse',
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.afterEach((to) => {
  const pageTitle = to.meta.title as string | undefined;
  document.title = pageTitle ? `${pageTitle} — SIRIS` : 'SIRIS';
});
