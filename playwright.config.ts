import { defineConfig, devices } from '@playwright/test';

const port = process.env.M2RF_PREVIEW_PORT || '54784';
const baseURL = `http://127.0.0.1:${port}/m2rf/`;

export default defineConfig({
  outputDir: '.next/cache/playwright',
  testDir: './tests/e2e',
  timeout: 30_000,
  workers: 2,
  webServer: {
    command: 'pnpm run preview',
    url: baseURL,
    reuseExistingServer: false,
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
