import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  outputDir: '.next/cache/playwright',
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${process.env.M2RF_APP_PORT || '54783'}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
});
