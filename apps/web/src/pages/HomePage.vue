<script setup lang="ts">
import {
  FileSpreadsheet,
  Boxes,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-vue-next';

const quickTasks = [
  {
    title: 'Impor Referensi Inbound',
    description: 'Unggah file referensi PO/Inbound EXPECTED dari Erasoft.',
    path: '/inbound/import-reference',
    icon: FileSpreadsheet,
    badge: 'UC-01',
  },
  {
    title: 'Impor Data Stok',
    description: 'Unggah snapshot saldo akhir stok (QTY AKHIR) gudang.',
    path: '/inventory/import-stock',
    icon: Boxes,
    badge: 'UC-09',
  },
  {
    title: 'Pemeriksaan Exception Inbound',
    description: 'Tinjau delivery delay dan quantity mismatch supplier.',
    path: '/inbound/exceptions',
    icon: Clock,
    badge: 'UC-04',
  },
  {
    title: 'Rekonsiliasi Fisik vs Sistem',
    description: 'Bandingkan data stok sistem dengan hasil hitung fisik.',
    path: '/inventory/reconcile',
    icon: Layers,
    badge: 'UC-12',
  },
];
</script>

<template>
  <div class="space-y-6">
    <!-- Status Banner Fondasi Sprint 1 -->
    <div class="p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3">
      <CheckCircle2 class="w-5 h-5 text-siris-primary shrink-0 mt-0.5" />
      <div>
        <h2 class="text-sm font-semibold text-siris-primary">
          Status Fondasi S1-02 Aktif
        </h2>
        <p class="text-xs text-siris-muted mt-0.5">
          Fondasi monorepo (Vue 3, Express.js, TypeScript, shared contracts) telah siap. Modul aplikasi beroperasi dalam lingkungan pengujian berlabel UJI.
        </p>
      </div>
    </div>

    <!-- Quick Tasks Section -->
    <div>
      <h2 class="text-sm font-bold uppercase tracking-wider text-siris-muted mb-3">
        Alur Kerja Utama (Sprint 1)
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <router-link
          v-for="task in quickTasks"
          :key="task.path"
          :to="task.path"
          class="p-4 rounded-lg bg-white border border-siris-border hover:border-siris-primary hover:shadow-sm transition-all group flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-siris-muted border border-siris-border">
                {{ task.badge }}
              </span>
              <component
                :is="task.icon"
                class="w-5 h-5 text-siris-muted group-hover:text-siris-primary transition-colors"
              />
            </div>
            <h3 class="text-sm font-semibold text-siris-ink group-hover:text-siris-primary transition-colors mt-2">
              {{ task.title }}
            </h3>
            <p class="text-xs text-siris-muted mt-1 leading-relaxed">
              {{ task.description }}
            </p>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-siris-primary">
            <span>Buka tugas</span>
            <ArrowRight class="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </router-link>
      </div>
    </div>

    <!-- Technical Scope & Constraints Info -->
    <div class="p-4 rounded-lg bg-white border border-siris-border space-y-2">
      <h2 class="text-xs font-bold uppercase tracking-wider text-siris-muted">
        Batasan & Integritas Operasional
      </h2>
      <ul class="text-xs text-siris-muted space-y-1 list-disc list-inside">
        <li>Erasoft ERP tetap menjadi sistem transaksi utama; SIRIS membaca data melalui berkas impor.</li>
        <li>Tidak ada writeback langsung, OCR, penyesuaian stok otomatis, atau portal supplier eksternal.</li>
        <li>Seluruh data uji dipisahkan dari data operasional aktual mitra (PT Harina Chemicals Industry).</li>
      </ul>
    </div>
  </div>
</template>

