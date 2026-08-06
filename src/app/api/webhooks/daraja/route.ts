import { NextRequest, NextResponse } from 'next/server';
import { darajaCallbackSchema } from '@/lib/validation/orderSchema';
import { processStkCallback } from '@/lib/payments/processCallback';
import { getActiveProviderName } from '@/lib/payments';
import { logger } from '@/lib/utils';

// ---------------------------------------------------------------------------
// POST /api/webhooks/daraja — M-Pesa STK Push callback from Safaricom
//
// Authenticity is established BEFORE this handler runs, and not by it:
// `src/middleware.ts` allow-lists Safaricom's published callback IP ranges for
// this exact path ahead of any other handling. Replay is stopped downstream by
// the unique index on the order's mpesaTransactionId. Daraja does not sign its
// callbacks, so there is no signature to check here — this route used to call a
// verifyDarajaSignature() that ignored its arguments and returned true, which
// made it look authenticated when it was not. That has been removed.
//
// CRITICAL: always answer HTTP 200 within 30s. Safaricom retries on anything
// else and eventually gives up, which loses real payments.
//
// Otherwise a thin transport wrapper: validate the payload, hand off to the
// shared processStkCallback — the same processor the simulator feeds — so a
// real callback and a simulated one are processed identically.
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ack = { ResultCode: 0, ResultDesc: 'Acknowledged' };
  const requestId = crypto.randomUUID();

  try {
    const body: unknown = await req.json();

    // Validate the payload shape. Anything that is not a Daraja callback is
    // acknowledged and dropped — never retried at us.
    const parsed = darajaCallbackSchema.safeParse(body);
    if (!parsed.success) {
      logger.error('daraja', 'Invalid webhook payload schema', {
        requestId,
        error: parsed.error.flatten(),
      });
      return NextResponse.json(ack); // Ack to prevent retries
    }

    // Process via the shared callback processor.
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
