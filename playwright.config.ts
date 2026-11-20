import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: 'test-results/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['json', {outputFile:'test-results/playwright.json'}]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    launchOptions: process.env.SIRIS_UJI_CHROME ? {executablePath:process.env.SIRIS_UJI_CHROME} : {},
    trace: 'retain-on-failure',
  },
  webServer: [
    {command:'npm run dev --workspace=@siris/web -- --host 127.0.0.1 --port 4173 --strictPort', url:'http://127.0.0.1:4173', reuseExistingServer:false},
    {command:'npm run start --workspace=@siris/api', url:'http://127.0.0.1:3101/health', env:{PORT:'3101',NODE_ENV:'test'}, reuseExistingServer:false},
  ],
});
