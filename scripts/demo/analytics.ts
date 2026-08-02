// Analytics. Once all records exist, run the REAL cron handlers — not a
// reimplementation — so PlatformImpactSummary and MarketInsight are aggregated
// from the simulated ecosystem exactly as they would be in production. We invoke
// each route's POST with a request carrying the configured CRON_SECRET, the same
// way the scheduled job does. market-insight runs first because impact-summary
// reads the resulting platform-premium average.

import { NextRequest } from 'next/server';
import { log } from './db';

async function invoke(
  handler: (req: NextRequest) => Promise<Response>,
  path: string,
  secret: string
): Promise<void> {
  const req = new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${secret}` },
  });
  const res = await handler(req);
  const body = (await res.json()) as { data?: unknown; error?: string };
  if (res.status !== 200) {
    throw new Error(`${path} returned ${res.status}: ${body.error ?? 'unknown error'}`);
  }
  log(`  ${path}: ${JSON.stringify(body.data ?? {})}`);
}

export async function runAnalytics(): Promise<void> {
  const secret = process.env['CRON_SECRET'] ?? '';
  const { POST: marketInsight } = await import('../../src/app/api/cron/market-insight/route');
  const { POST: impactSummary } = await import('../../src/app/api/cron/impact-summary/route');

  log('running analytics crons...');
  await invoke(marketInsight, '/api/cron/market-insight', secret);
  await invoke(impactSummary, '/api/cron/impact-summary', secret);
}
