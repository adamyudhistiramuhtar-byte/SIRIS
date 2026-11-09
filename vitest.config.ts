import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./apps/web/src', import.meta.url)),
      '@siris/contracts': fileURLToPath(new URL('./packages/contracts/src/index.ts', import.meta.url)),
    },
  },
  test: {
    globals: true,
    projects: [
      {
        plugins: [vue()],
        test: {
          name: 'web',
          include: ['apps/web/**/*.{test,spec}.ts'],
          environment: 'jsdom',
          globals: true,
        },
      },
      {
        test: {
          name: 'api',
          include: ['apps/api/**/*.{test,spec}.ts', 'tests/integration/**/*.{test,spec}.ts'],
          environment: 'node',
          globals: true,
        },
      },
    ],
  },
});
