import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  // Where E2E tests live
  testDir: './e2e',
  testMatch: '**/*.spec.ts',

  // Run each test in isolation
  fullyParallel: false,

  // Retry once on CI
  retries: process.env.CI ? 1 : 0,

  // Single worker for stability during dev
  workers: 1,

  // Reporter
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

  use: {
    // Base URL — assumes npm run dev is running
    baseURL: 'http://localhost:3000',

    // Collect traces on failure for debugging
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Headless by default — set to false to watch
    headless: true,
  },

  // Timeout per test
  timeout: 30_000,
};

export default config;
