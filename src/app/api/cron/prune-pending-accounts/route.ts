import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { prunePendingAccounts, PENDING_ACCOUNT_TTL_MS } from '@/lib/auth/pendingAccounts';
import { logger } from '@/lib/utils';

// ---------------------------------------------------------------------------
// POST /api/cron/prune-pending-accounts — reclaim abandoned onboarding accounts
// Auth: Bearer CRON_SECRET
// Schedule: none of its own. Vercel Hobby allows two cron entries, so this runs
//   as a sub-task of /api/cron/weekly-jobs. This route exists for manual
//   invocation and testing, matching cleanup-sessions / market-insight /
//   impact-summary, which are scheduled the same way.
//
// AUTH_ONBOARDING_FLOW_V3 §8. A pending account is one created by the OAuth
// callback whose owner never set a password: a verified email and a derived
// username, nothing else. Deleting it costs the user nothing — returning with
// the same provider-verified email produces a fresh one.
// ---------------------------------------------------------------------------

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '').trim();
  return token === process.env['CRON_SECRET'];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_UNAUTHORIZED' }, { status: 401 });
  }

  await connectDB();

  const requestId = crypto.randomUUID();
  const { deleted } = await prunePendingAccounts();

  logger.info('cron/prune-pending-accounts', 'Pending account sweep complete', {
    requestId,
    pendingAccountsDeleted: deleted,
    ttlMinutes: PENDING_ACCOUNT_TTL_MS / 60_000,
  });

  return NextResponse.json({ data: { pendingAccountsDeleted: deleted } });
}

// Vercel Cron invokes scheduled paths with GET; both verbs run the same job
// behind the same Bearer CRON_SECRET check.
export async function GET(req: NextRequest): Promise<NextResponse> {
  return POST(req);
}
