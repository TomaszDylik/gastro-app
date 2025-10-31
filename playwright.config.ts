import { defineConfig } from '@playwright/test';
export default defineConfig({
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
  testDir: 'tests/e2e',
});
