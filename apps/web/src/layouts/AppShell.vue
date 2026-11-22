<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Menu, X, LogOut, Warehouse } from 'lucide-vue-next';
import { ROLE_LABELS } from '../shared/access/access-matrix';
import { getNavigationFor } from '../shared/access/navigation';
import { sessionStore } from '../shared/session/session-context';

const route = useRoute();
const router = useRouter();
const isMobileMenuOpen = ref(false);

const session = sessionStore.state;

// Menu mengikuti matriks halaman UJI SRS-36 §6.2; halaman yang tidak diizinkan tidak ditampilkan.
const navigationGroups = computed(() => getNavigationFor(session.role, session.mode));

const roleLabel = computed(() => ROLE_LABELS[session.role]);
const warehouseName = computed(() => sessionStore.activeWarehouse.value?.name ?? 'Belum ada gudang aktif');
const warehouseCode = computed(() => sessionStore.activeWarehouse.value?.code ?? '-');
const modeLabel = computed(() => (session.mode === 'UJI' ? 'UJI (Simulasi)' : session.mode));

const currentTitle = computed(() => {
  return (route.meta.title as string) || 'Sistem Informasi Rekonsiliasi & Inbound';
});

const currentDescription = computed(() => {
  return (route.meta.description as string) || 'Website pendamping Erasoft Warehouse PT Harina Chemicals Industry';
});

function handleLogout() {
  router.push('/login');
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-siris-canvas text-siris-ink">
    <!-- Top Header (64px desktop / 56px mobile) -->
    <header class="h-14 lg:h-16 bg-white border-b border-siris-border px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
      <div class="flex items-center gap-3">
        <!-- Mobile hamburger toggle -->
        <button
          type="button"
          class="lg:hidden p-2 text-siris-muted hover:text-siris-ink focus:outline-none focus:ring-2 focus:ring-siris-primary rounded"
          aria-label="Toggle navigasi"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <Menu
            v-if="!isMobileMenuOpen"
            class="w-5 h-5"
          />
          <X
            v-else
            class="w-5 h-5"
          />
        </button>

        <!-- Brand: Teks SIRIS murni tanpa logo per design.md -->
        <router-link
          to="/"
          class="flex items-baseline gap-2"
        >
          <span class="text-xl font-bold tracking-tight text-siris-primary">SIRIS</span>
          <span class="hidden sm:inline text-xs text-siris-muted font-medium">PT Harina Chemicals Industry</span>
        </router-link>
      </div>

      <!-- Right Header context badges & actions -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Active Warehouse Badge -->
        <div class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-xs font-medium text-siris-ink border border-siris-border">
          <Warehouse class="w-3.5 h-3.5 text-siris-muted" />
          <span>{{ warehouseName }}</span>
        </div>

        <!-- Mode Badge (Default UJI) -->
        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          MODE {{ session.mode }}
        </span>

        <!-- User role info -->
        <div class="hidden md:flex flex-col text-right">
          <span class="text-xs font-semibold text-siris-ink">{{ session.displayName }}</span>
          <span class="text-[10px] text-siris-muted">{{ roleLabel }} / Tim 42</span>
        </div>

        <!-- Logout button -->
        <button
          type="button"
          class="p-2 text-siris-muted hover:text-siris-danger hover:bg-red-50 rounded transition-colors"
          title="Keluar"
          aria-label="Keluar dari sesi"
          @click="handleLogout"
        >
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden">
      <!-- Left Sidebar (240px desktop) -->
      <aside
        class="fixed inset-y-0 left-0 top-14 lg:top-16 z-20 w-60 bg-white border-r border-siris-border transform transition-transform duration-200 lg:translate-x-0 overflow-y-auto"
        :class="isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      >
        <nav class="p-3 space-y-6">
          <div
            v-for="group in navigationGroups"
            :key="group.title"
            class="space-y-1"
          >
            <h2 class="px-3 text-[11px] font-bold uppercase tracking-wider text-siris-muted">
              {{ group.title }}
            </h2>
            <div class="mt-1 space-y-0.5">
              <router-link
                v-for="item in group.items"
                :key="item.path"
                :to="item.path"
                class="flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-colors"
                :class="
                  route.path === item.path
                    ? 'bg-siris-primary-light text-siris-primary font-semibold border-l-4 border-siris-primary'
                    : 'text-siris-ink hover:bg-slate-50 hover:text-siris-primary'
                "
                @click="isMobileMenuOpen = false"
              >
                <component
                  :is="item.icon"
                  class="w-4 h-4 shrink-0"
                />
                <span class="truncate">{{ item.name }}</span>
              </router-link>
            </div>
          </div>
        </nav>
      </aside>

      <!-- Backdrop for mobile drawer -->
      <div
        v-if="isMobileMenuOpen"
        class="fixed inset-0 bg-slate-900/30 z-10 lg:hidden"
        @click="isMobileMenuOpen = false"
      />

      <!-- Main Workspace -->
      <main class="flex-1 lg:pl-60 flex flex-col min-w-0 overflow-y-auto">
        <!-- Page Header & Context Strip (design.md signature) -->
        <div class="bg-white border-b border-siris-border px-4 sm:px-6 lg:px-8 py-4">
          <div class="max-w-7xl mx-auto">
            <h1 class="text-xl sm:text-2xl font-semibold text-siris-ink tracking-tight">
              {{ currentTitle }}
            </h1>
            <p class="mt-1 text-xs sm:text-sm text-siris-muted">
              {{ currentDescription }}
            </p>

            <!-- Context Strip: design.md §2 signature element -->
            <div class="mt-3 py-1.5 px-3 bg-siris-canvas rounded border border-siris-border flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-siris-muted">
              <span class="font-medium text-siris-ink">Konteks:</span>
              <span>Peran: <strong class="text-siris-ink font-semibold">{{ roleLabel }}</strong></span>
              <span class="text-slate-300">|</span>
              <span>Gudang: <strong class="text-siris-ink font-semibold">{{ warehouseName }} ({{ warehouseCode }})</strong></span>
              <span class="text-slate-300">|</span>
              <span>Mode: <strong class="text-amber-700 font-semibold">{{ modeLabel }}</strong></span>
              <span class="text-slate-300">|</span>
              <span>Periode: <strong class="text-siris-ink font-semibold">Sprint 1 (9–15 Nov 2026)</strong></span>
              <span class="text-slate-300">|</span>
              <span>Koneksi Erasoft: <strong class="text-siris-ink font-semibold">Berkas Impor (Bukan Online Sync)</strong></span>
            </div>
          </div>
        </div>

        <!-- Main Content View -->
        <div class="flex-1 p-4 sm:p-6 lg:p-8">
          <div class="max-w-7xl mx-auto">
            <router-view />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
