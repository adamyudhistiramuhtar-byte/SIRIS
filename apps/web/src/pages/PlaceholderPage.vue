<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Info, Clock } from 'lucide-vue-next';

const route = useRoute();

const useCaseId = computed(() => (route.meta.ucId as string) || 'UC-XX');
const plannedSprint = computed(() => (route.meta.sprint as string) || 'Sprint 1 / 2');
const targetRole = computed(() => (route.meta.role as string) || 'Purchasing / Warehouse');
</script>

<template>
  <div class="space-y-6">
    <!-- Feature Context Notice -->
    <div class="p-6 rounded-lg bg-white border border-siris-border space-y-4">
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-siris-primary">
              {{ useCaseId }}
            </span>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
              Jadwal: {{ plannedSprint }}
            </span>
          </div>
          <h2 class="text-base font-semibold text-siris-ink mt-2">
            Struktur Antarmuka: {{ route.meta.title }}
          </h2>
          <p class="text-xs text-siris-muted mt-1 max-w-2xl leading-relaxed">
            Halaman ini telah terdaftar dalam sistem routing SIRIS sesuai spesifikasi <em>design.md §3.3</em>. Implementasi komponen logika bisnis, upload handler, dan integrasi API akan diselesaikan pada cabang fitur yang relevan.
          </p>
        </div>

        <div class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-50 border border-siris-border text-xs text-siris-muted">
          <Clock class="w-4 h-4 text-siris-muted" />
          <span>Otorisasi: {{ targetRole }}</span>
        </div>
      </div>

      <!-- Low-fidelity Zone Spec Card (Design contract) -->
      <div class="p-4 rounded bg-slate-50 border border-dashed border-slate-300 space-y-3">
        <div class="flex items-center gap-2 text-xs font-semibold text-siris-ink">
          <Info class="w-4 h-4 text-siris-primary" />
          <span>Spesifikasi Tata Letak (design.md §3.4 Wireframe Zoning)</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div class="p-3 bg-white rounded border border-siris-border">
            <span class="font-bold text-siris-muted block mb-1">Zona A / Header</span>
            <span class="text-siris-ink">Context Strip: Gudang aktif, Mode UJI, dan status cutoff.</span>
          </div>
          <div class="p-3 bg-white rounded border border-siris-border">
            <span class="font-bold text-siris-muted block mb-1">Zona B / Kontrol</span>
            <span class="text-siris-ink">FilterBar / Stepper alur impor validasi 4-tahap.</span>
          </div>
          <div class="p-3 bg-white rounded border border-siris-border">
            <span class="font-bold text-siris-muted block mb-1">Zona C & D / Data</span>
            <span class="text-siris-ink">Tabel rincian, ringkasan sumber data, dan aksi validasi.</span>
          </div>
        </div>
      </div>

      <div class="text-[11px] text-siris-muted">
        Catatan: Fondasi monorepo S1-02 telah memverifikasi struktur routing, shell layout, dan kontrak DTO untuk halaman ini.
      </div>
    </div>
  </div>
</template>

