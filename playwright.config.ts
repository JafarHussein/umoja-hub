import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';
import { resolveE2EDatabaseUri, assertDistinctFromAppDatabase } from './e2e/support/database';

// ---------------------------------------------------------------------------
// Phase 4 visual-regression + smoke harness (HARNESS-0).
//
// Every authenticated app-shell screen sits behind OAuth -> onboarding-lock ->
// role middleware. We never drive the real OAuth flow; instead `global-setup`
// mints a signed NextAuth session JWT per role and persists it as Playwright
// storage state (see e2e/support/). Specs load the relevant role via
// `test.use({ storageState: authFile('farmer') })`.
//
// The app is always started by Playwright, never reused, and always on its own
// port against its own database. See the DATABASE ISOLATION note below — this
// is the whole reason the harness can no longer touch the demo data.
//
// In CI the app is built first (npm run build) and served with `npm run start`
// for deterministic snapshots. Animations are disabled at capture time so
// transitions never flake the baselines.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// DATABASE ISOLATION
//
// `.env.local` is loaded here, at config time, so the checks below run before
// Playwright does anything at all — a misconfigured harness fails on startup
// with an explanation rather than part-way through a suite.
//
// `MONGODB_E2E_URI` is required and never falls back to `MONGODB_URI`.
// `resolveE2EDatabaseUri` throws a full explanation when it is missing or when
// it points at the same database as the app.
//
// The redirect below is what makes the isolation total. `connectDB` reads
// `MONGODB_URI`, and so does every model the fixtures and the running app
// import, so pointing that one variable at the harness database in *both*
// processes — this one, for global setup and teardown, and the web server, for
// the app under test — moves the entire run onto it. Setting it only here
// would be worse than useless: fixtures would land in the test database while
// the app kept reading the demo one.
// ---------------------------------------------------------------------------
loadEnvConfig(process.cwd());
const e2eDatabaseUri = resolveE2EDatabaseUri();

// The application's own URI, preserved before the redirect below overwrites it.
//
// This file is evaluated more than once: Playwright re-imports it in every
// worker process, and those workers inherit the parent's environment — in which
// MONGODB_URI has already been redirected onto the harness database. Comparing
// the live variable therefore reports "same database" on every correctly
// configured run, from the second evaluation onward. Stashing the original once
// gives every later evaluation the value the check actually means.
process.env.E2E_ORIGINAL_MONGODB_URI ??= process.env.MONGODB_URI ?? '';
assertDistinctFromAppDatabase(process.env.E2E_ORIGINAL_MONGODB_URI || undefined, e2eDatabaseUri);

process.env.MONGODB_URI = e2eDatabaseUri;

// The harness runs on its own port so it can never be confused with — or
// silently attach to — a `npm run dev` serving the demo database on 3000.
const PORT = 3100;
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
  // The rehearsal drives real file storage, which CI does not have credentials
  // for. It is run deliberately — `npm run test:e2e:rehearsal` — rather than
  // failing every CI run for a reason that says nothing about the product.
  testIgnore: ['**/rehearsal.spec.ts'],
  globalSetup: './e2e/support/global-setup.ts',
  globalTeardown: './e2e/support/global-teardown.ts',
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
    // Built, not `next dev`, in both environments.
    //
    // The harness used to run against whatever dev server happened to be up,
    // which quietly supplied something it depends on: warm, already-compiled
    // routes. Once it started its own server (it must — see reuseExistingServer
    // below) the dev server's on-demand compilation put 38 of 123 tests over
    // the 30s timeout, worst on the first project to reach each route and
    // tapering as later ones found it warm. Nothing was wrong with those tests;
    // they were timing the compiler.
    //
    // CI has always tested a production build, which is why it stayed green.
    // Local now does the same, so a spec means the same thing in both places.
    // CI builds in its own step, so it only needs the serve half.
    command: isCI ? 'npm run start' : 'npm run build && npm run start',
    url: probeURL,
    // Room for the build on a cold .next directory.
    timeout: 420_000,
    // Never reuse. A server already listening on this port was started by
    // something else, and the one thing the harness cannot verify about it is
    // the database it is connected to — which is the only thing that matters
    // here. Starting our own is the only way to know.
    reuseExistingServer: false,
    env: {
      PORT: String(PORT),
      // The app under test reads the harness database, not the demo one.
      MONGODB_URI: e2eDatabaseUri,
      // NextAuth builds absolute URLs from this; on the harness port the
      // default would send redirects to a server that is not the one running.
      NEXTAUTH_URL: baseURL,
    },
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
