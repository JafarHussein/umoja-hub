import { NextRequest, NextResponse } from 'next/server';
import { darajaCallbackSchema } from '@/lib/validation/orderSchema';
import { verifyDarajaSignature } from '@/lib/integrations/darajaService';
import { processStkCallback } from '@/lib/payments/processCallback';
import { getActiveProviderName } from '@/lib/payments';
import { logger } from '@/lib/utils';

// ---------------------------------------------------------------------------
// POST /api/webhooks/daraja — M-Pesa STK Push callback from Safaricom
// Auth: IP allowlisting enforced in middleware (Safaricom IP range only)
// CRITICAL: Always return HTTP 200 — Daraja retries indefinitely on non-200
//
// This route is a thin transport wrapper: it authenticates + validates the
// Daraja payload, then hands off to the shared processStkCallback — the exact
// same processor the payment simulator uses. All state transitions, idempotency,
// notifications, and audit logging live there, so a real Safaricom callback and
// a simulated one are processed identically.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ack = { ResultCode: 0, ResultDesc: 'Acknowledged' };
  const requestId = crypto.randomUUID();

  try {
    const body: unknown = await req.json();

    // Step 1: Verify signature (always first)
    if (!verifyDarajaSignature(req.headers, body)) {
      logger.error('daraja', 'Invalid webhook signature', { requestId, body });
      // Return 200 with non-zero ResultCode — Daraja will stop retrying
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid signature' });
    }

    // Step 2: Validate payload schema
    const parsed = darajaCallbackSchema.safeParse(body);
    if (!parsed.success) {
      logger.error('daraja', 'Invalid webhook payload schema', {
        requestId,
        error: parsed.error.flatten(),
      });
      return NextResponse.json(ack); // Ack to prevent retries
    }

    // Step 3: Process via the shared callback processor.
    const { ack: resultAck } = await processStkCallback(parsed.data, {
      provider: getActiveProviderName(),
      requestId,
    });

    return NextResponse.json(resultAck);
  } catch (error) {
    logger.error('daraja', 'Unexpected error in webhook handler', { requestId, error });
    // CRITICAL: Still return 200 to prevent Daraja retries
    return NextResponse.json(ack);
  }
}
