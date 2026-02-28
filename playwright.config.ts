import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for UmojaHub.
 *
 * Runs against the locally running Next.js dev or production server.
 * The server must be seeded (`npm run db:seed`) before running E2E tests.
 *
 * Usage:
 *   npx playwright test               — run all tests headless
 *   npx playwright test --ui          — interactive UI mode
 *   npx playwright test e2e/01-farmer — run a single file
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Serial — tests share seeded DB state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Automatically start the dev server if not already running in CI
  ...(!process.env.CI && {
    webServer: {
      command: 'npm run dev',
      url: BASE_URL,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  }),
});
