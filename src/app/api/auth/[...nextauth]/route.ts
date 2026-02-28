import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { type NextRequest } from 'next/server';
import { applyRateLimit } from '@/lib/rateLimit';

// The standard NextAuth handler handles all methods
const handler = NextAuth(authOptions);

// GET passes through directly (CSRF token, session checks, etc.)
export { handler as GET };

// POST is rate-limited — 10 sign-in attempts per IP per minute
// Returns 429 SERVER_RATE_LIMITED when exceeded
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> },
): Promise<Response> {
  const rateLimitResponse = applyRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  return handler(req as unknown as Parameters<typeof handler>[0], context);
}
