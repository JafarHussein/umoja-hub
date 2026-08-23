/**
 * @jest-environment node
 *
 * Contract tests — `12_TESTING_STRATEGY.md` §3.1.
 *
 * These assert relationships that no single unit owns: between `vercel.json`
 * and the cron handlers it invokes, between a public page and the endpoints it
 * fetches, and between an API route and its declared authorization posture.
 *
 * Every defect found by review during the Price Intelligence programme was a
 * boundary failure of exactly this kind, and the unit suite passed throughout:
 *
 *   D6  — the cron routes exported POST while Vercel invokes GET. The handler
 *         had thorough, passing tests. Nothing checked the deployment contract.
 *   D14 — a public marketplace page fetched a FARMER/ADMIN-only endpoint. All
 *         three parts (middleware exemption, component fetch, route guard) were
 *         individually reasonable; only their relationship was wrong.
 *
 * Static analysis over source and config: no module loading, no database, no
 * mocks. Route modules import Mongoose models at the top level, so importing
 * them here would pull in the driver for no benefit.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..', '..');
const API_DIR = path.join(ROOT, 'src', 'app', 'api');

function read(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

/** Route ids are API-relative and slash-separated, e.g. `marketplace/suggest`. */
function routeId(absPath: string): string {
  return path
    .relative(API_DIR, path.dirname(absPath))
    .split(path.sep)
    .join('/');
}

function allRouteFiles(): string[] {
  return fs
    .readdirSync(API_DIR, { recursive: true, encoding: 'utf8' })
    .filter((entry) => path.basename(entry) === 'route.ts')
    .map((entry) => path.join(API_DIR, entry));
}

function routeFileFor(id: string): string {
  return path.join(API_DIR, ...id.split('/'), 'route.ts');
}

/** Matches `export async function GET`, `export function GET`, `export const GET`. */
function exportsMethod(source: string, method: string): boolean {
  return new RegExp(`export\\s+(async\\s+)?(function|const)\\s+${method}\\b`).test(source);
}

interface VercelConfig {
  crons?: { path: string; schedule: string }[];
}

const vercelConfig = JSON.parse(read(path.join(ROOT, 'vercel.json'))) as VercelConfig;
const scheduledPaths = (vercelConfig.crons ?? []).map((c) => c.path);

// ---------------------------------------------------------------------------
// Registries. A declared list that drifts is caught by these tests; an
// undeclared change is a review question. Each entry carries its reason,
// because an allowlist without reasons becomes a place to hide things.
// ---------------------------------------------------------------------------

/**
 * Cron routes deliberately absent from `vercel.json`. Their work is inlined
 * into `weekly-jobs` (see its route.ts §21-23) and they remain individually
 * invocable for manual re-runs. Two implementations of one job is a real
 * divergence risk, recorded in `12` §3.1 — this list makes it visible rather
 * than letting a fourth quietly join it.
 */
const UNSCHEDULED_CRON_ROUTES: Record<string, string> = {
  'cron/cleanup-sessions': 'inlined into weekly-jobs; manual invocation only',
  'cron/impact-summary': 'inlined into weekly-jobs; manual invocation only',
  'cron/market-insight': 'inlined into weekly-jobs; manual invocation only',
  'cron/prune-pending-accounts': 'inlined into weekly-jobs; manual invocation only',
};

/**
 * Endpoints fetched from pages served under a `middleware.ts` exempt prefix.
 * These MUST be reachable without a session — a signed-out visitor is the
 * normal case on these pages, not an edge case. This is the registry `12` §3.1
 * specifies in place of trying to infer fetches statically.
 */
const PUBLIC_PAGE_ENDPOINTS: { page: string; endpoints: string[] }[] = [
  { page: '/marketplace', endpoints: ['marketplace', 'marketplace/suggest'] },
  { page: '/marketplace/[listingId]', endpoints: ['marketplace/[listingId]/fairness'] },
];

/**
 * API routes that perform no session check at all, each with the reason it is
 * safe. Anything not listed here must call `requireRole`, call
 * `getServerSession` (ownership-scoped routes do their own checks), or verify
 * `CRON_SECRET`.
 */
const PUBLIC_API_ROUTES: Record<string, string> = {
  'auth/[...nextauth]': "NextAuth's own sign-in and callback endpoints",
  'auth/password-reset/confirm': 'pre-auth by definition; gated on a single-use token',
  'auth/register':
    'account creation; pre-auth by definition. Accepts no role field, so nothing in the body can grant privilege, and it is throttled per source address.',
  'auth/password-reset/request': 'pre-auth by definition; throttled',
  health: 'liveness probe',
  'marketplace/[listingId]/fairness': 'buyer price fairness on a public listing page (D14)',
  'marketplace/suggest': 'search suggestions for the public marketplace',
  suppliers: 'public verified-supplier directory',
  transparency: 'public transparency figures',
  'webhooks/daraja': 'M-Pesa callback; authenticated by the payment provider, not a session',
};

// ---------------------------------------------------------------------------

describe('cron deployment contract (D6)', () => {
  const cronRouteIds = allRouteFiles()
    .map(routeId)
    .filter((id) => id.startsWith('cron/'));

  it('finds the cron routes it intends to check', () => {
    // Guards against a silently-empty suite if the directory ever moves.
    expect(cronRouteIds.length).toBeGreaterThanOrEqual(5);
    expect(scheduledPaths.length).toBeGreaterThan(0);
  });

  it.each(scheduledPaths)('%s resolves to a route module', (cronPath) => {
    const id = cronPath.replace(/^\/api\//, '');
    expect(fs.existsSync(routeFileFor(id))).toBe(true);
  });

  it.each(scheduledPaths)('%s exports GET, which is how Vercel invokes it', (cronPath) => {
    // D6: every scheduled route exported POST only, so neither job ever ran in
    // production and nothing reported a failure.
    const id = cronPath.replace(/^\/api\//, '');
    expect(exportsMethod(read(routeFileFor(id)), 'GET')).toBe(true);
  });

  it.each(scheduledPaths)('%s verifies CRON_SECRET', (cronPath) => {
    const id = cronPath.replace(/^\/api\//, '');
    expect(read(routeFileFor(id))).toContain('CRON_SECRET');
  });

  it('every cron route is either scheduled or declared unscheduled', () => {
    const scheduledIds = scheduledPaths.map((p) => p.replace(/^\/api\//, ''));
    const undeclared = cronRouteIds.filter(
      (id) => !scheduledIds.includes(id) && !(id in UNSCHEDULED_CRON_ROUTES)
    );
    expect(undeclared).toEqual([]);
  });

  it('has no stale entries in the unscheduled-cron registry', () => {
    const scheduledIds = scheduledPaths.map((p) => p.replace(/^\/api\//, ''));
    for (const id of Object.keys(UNSCHEDULED_CRON_ROUTES)) {
      expect(cronRouteIds).toContain(id);
      // If it gets scheduled later, the registry entry must go.
      expect(scheduledIds).not.toContain(id);
    }
  });
});

describe('public surface contract (D14)', () => {
  const middlewareSource = read(path.join(ROOT, 'src', 'middleware.ts'));

  it.each(PUBLIC_PAGE_ENDPOINTS.map((s) => s.page))(
    '%s is served under a middleware exempt prefix',
    (page) => {
      // The page is only "public" if middleware lets a signed-out visitor reach
      // it. If that changes, the endpoint expectations below stop applying.
      const prefix = `/${page.split('/')[1]}`;
      expect(middlewareSource).toContain(`'${prefix}'`);
    }
  );

  const pairs = PUBLIC_PAGE_ENDPOINTS.flatMap((s) =>
    s.endpoints.map((endpoint) => [s.page, endpoint] as const)
  );

  it.each(pairs)('%s depends on /api/%s, which must exist', (_page, endpoint) => {
    expect(fs.existsSync(routeFileFor(endpoint))).toBe(true);
  });

  it.each(pairs)(
    '%s depends on /api/%s, which must not require a role',
    (_page, endpoint) => {
      // D14 exactly: PriceFairness sat on a public page and fetched
      // /api/prices/recommendation, whose contract reads "Auth: FARMER or
      // ADMIN". The 403 was swallowed and looked like thin data, so the signal
      // rendered for farmers and admins and never for a buyer.
      const source = read(routeFileFor(endpoint));
      const declaredAuth = /^\/\/ Auth: (.+)$/m.exec(source)?.[1] ?? '';

      expect(declaredAuth).toMatch(/none \(public\)|public/i);
      expect(declaredAuth).not.toMatch(/FARMER|BUYER|STUDENT|LECTURER|ADMIN/);
    }
  );
});

describe('API authorization contract', () => {
  const routeFiles = allRouteFiles();

  it('finds the API routes it intends to check', () => {
    expect(routeFiles.length).toBeGreaterThan(50);
  });

  it('every route authenticates, or is declared public with a reason', () => {
    const undeclared = routeFiles
      .map((file) => ({ id: routeId(file), source: read(file) }))
      .filter(
        ({ id, source }) =>
          !/requireRole|getServerSession|CRON_SECRET/.test(source) && !(id in PUBLIC_API_ROUTES)
      )
      .map(({ id }) => id);

    // A new unauthenticated route must be added to PUBLIC_API_ROUTES with a
    // stated reason, which makes it a review decision instead of an oversight.
    expect(undeclared).toEqual([]);
  });

  it('has no stale entries in the public-route registry', () => {
    const ids = routeFiles.map(routeId);
    for (const id of Object.keys(PUBLIC_API_ROUTES)) {
      expect(ids).toContain(id);
    }
  });

  it('no route declared public performs a role check', () => {
    // Catches the inverse drift: a route gains requireRole while still listed
    // as public, so callers that were told it is open start getting 403s.
    for (const id of Object.keys(PUBLIC_API_ROUTES)) {
      expect(read(routeFileFor(id))).not.toContain('requireRole');
    }
  });
});
