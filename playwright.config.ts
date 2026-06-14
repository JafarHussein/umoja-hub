import { defineConfig, devices } from '@playwright/test';

// ---------------------------------------------------------------------------
// Phase 4 visual-regression + smoke harness (HARNESS-0).
//
// Every authenticated app-shell screen sits behind OAuth -> onboarding-lock ->
// role middleware. We never drive the real OAuth flow; instead `global-setup`
// mints a signed NextAuth session JWT per role and persists it as Playwright
// storage state (see e2e/support/). Specs load the relevant role via
// `test.use({ storageState: authFile('farmer') })`.
//
// Locally the dev server is reused if already running; in CI the app is built
// first (npm run build) and served with `npm run start` for deterministic
// snapshots. Animations are disabled at capture time so transitions never flake
// the baselines.
// ---------------------------------------------------------------------------

const PORT = 3000;
// The browser navigates to `localhost` so the minted session cookie (domain
// `localhost`) is sent. The webServer readiness probe uses the IPv4 loopback
// explicitly: on Windows `localhost` can resolve to IPv6 `::1` while the dev
// server binds IPv4, which would hang the probe.
const baseURL = `http://localhost:${PORT}`;
// Readiness probe: the app has no `/` route (the public marketing site is a
// separate project), so `/` returns 404 — which Playwright treats as "not
// ready". `/auth/login` is a stable public 200. IPv4 loopback avoids the
// Windows `localhost` -> IPv6 `::1` resolution hang.
const probeURL = `http://127.0.0.1:${PORT}/auth/login`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/support/global-setup.ts',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: {
    timeout: 10_000,
    // Visual-regression tolerance. Tight enough to catch real layout drift,
    // loose enough to absorb sub-pixel font rendering across machines.
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // The app shell is dark-only; pin the colour scheme so snapshots are stable.
    colorScheme: 'dark',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'tablet',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } },
    },
  ],
  webServer: {
    command: isCI ? 'npm run start' : 'npm run dev',
    url: probeURL,
    timeout: 120_000,
    reuseExistingServer: !isCI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
