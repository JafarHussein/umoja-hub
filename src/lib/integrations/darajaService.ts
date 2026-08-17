/**
 * Daraja M-Pesa integration service.
 * Handles OAuth token management, STK Push initiation, and webhook signature verification.
 * All failures throw AppError — callers must handle.
 */

import { env } from '@/lib/env';
import { AppError, logger } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Which Safaricom to talk to.
//
// This was `process.env.NODE_ENV !== 'production'`, which is the wrong
// authority in both directions: a production Vercel build running
// PAYMENT_PROVIDER=daraja-sandbox would post sandbox credentials to the LIVE
// api.safaricom.co.ke and fail, and there was no way to run the sandbox from a
// production build — which is exactly what a deployed demonstration needs.
//
// PAYMENT_PROVIDER is the single authority for which provider is active, so it
// is the single authority for which environment that provider talks to.
// ---------------------------------------------------------------------------

function isSandboxEnvironment(): boolean {
  return (process.env.PAYMENT_PROVIDER ?? 'simulation') !== 'daraja-production';
}

const HOST = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
} as const;

function darajaHost(): string {
  return isSandboxEnvironment() ? HOST.sandbox : HOST.production;
}

/** Exposed for the audit trail and the admin transaction view. */
export function darajaEnvironmentName(): 'sandbox' | 'production' {
  return isSandboxEnvironment() ? 'sandbox' : 'production';
}

// ---------------------------------------------------------------------------
// OAuth token cache (in-memory, scoped to the serverless function instance)
// ---------------------------------------------------------------------------

interface ICachedToken {
  token: string;
  expiresAt: number; // Unix ms
}

let cachedToken: ICachedToken | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // Cache for 55 minutes (token expires at 60 minutes)
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }

  const consumerKey = env('MPESA_CONSUMER_KEY');
  const consumerSecret = env('MPESA_CONSUMER_SECRET');
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const tokenUrl = `${darajaHost()}/oauth/v1/generate?grant_type=client_credentials`;

  const res = await fetch(tokenUrl, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!res.ok) {
    throw new AppError(
      'Could not initiate M-Pesa payment. Please try again.',
      502,
      'PAYMENT_STK_FAILED'
    );
  }

  const data = (await res.json()) as { access_token: string; expires_in: string };

  cachedToken = {
    token: data.access_token,
    expiresAt: now + 55 * 60 * 1000, // 55 minutes
  };

  return cachedToken.token;
}

// ---------------------------------------------------------------------------
// STK Push
// ---------------------------------------------------------------------------

interface ISTKPushParams {
  amount: number;
  phone: string; // Kenyan format: 07XXXXXXXX or +2547XXXXXXXX
  orderId: string;
  description: string;
}

interface ISTKPushResult {
  CheckoutRequestID: string;
  MerchantRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

/**
 * Normalise phone to international format required by Daraja: 2547XXXXXXXX
 */
function normaliseDarajaPhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.startsWith('+254')) return cleaned.slice(1); // remove +
  if (cleaned.startsWith('0')) return `254${cleaned.slice(1)}`;
  return cleaned; // already in 254XXXXXXXXX format
}

function buildPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

function getTimestamp(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
}

export async function initiateSTKPush(params: ISTKPushParams): Promise<ISTKPushResult> {
  const shortcode = env('MPESA_SHORTCODE');
  const passkey = env('MPESA_PASSKEY');
  const callbackUrl = env('MPESA_CALLBACK_URL');

  const timestamp = getTimestamp();
  const password = buildPassword(shortcode, passkey, timestamp);
  const phone = normaliseDarajaPhone(params.phone);

  const stkPushUrl = `${darajaHost()}/mpesa/stkpush/v1/processrequest`;

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (error) {
    logger.error('darajaService', 'Failed to obtain OAuth token', { error });
    throw new AppError(
      'Could not initiate M-Pesa payment. Please try again.',
      502,
      'PAYMENT_STK_FAILED'
    );
  }

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(params.amount),
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: params.orderId,
    TransactionDesc: params.description.slice(0, 13), // Daraja max 13 chars
  };

  try {
    const res = await fetch(stkPushUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as ISTKPushResult & { errorCode?: string; errorMessage?: string };

    if (!res.ok || data.errorCode) {
      logger.error('darajaService', 'STK Push failed', {
        orderId: params.orderId,
        status: res.status,
        error: data,
      });
      throw new AppError(
        'Could not initiate M-Pesa payment. Please try again.',
        502,
        'PAYMENT_STK_FAILED'
      );
    }

    logger.info('darajaService', 'STK Push initiated', {
      orderId: params.orderId,
      checkoutRequestId: data.CheckoutRequestID,
    });

    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('darajaService', 'Unexpected STK Push error', { orderId: params.orderId, error });
    throw new AppError(
      'Could not initiate M-Pesa payment. Please try again.',
      502,
      'PAYMENT_STK_FAILED'
    );
  }
}

// ---------------------------------------------------------------------------
// STK Push Query — the third leg of the STK lifecycle.
//
// Initiating a push and receiving a callback are only two of the three calls a
// production integration needs. The callback is not guaranteed to arrive: the
// server may be briefly unreachable, or Safaricom may be under load at
// month-end. When it does not arrive, the transaction is NOT known to have
// failed — the customer may already have been debited. Asking Safaricom
// directly is the only way to tell the difference between "did not pay" and
// "paid, but we never heard".
//
// Endpoint: /mpesa/stkpushquery/v1/query
// ---------------------------------------------------------------------------

export interface ISTKQueryResult {
  /** 0 = the payment succeeded. Any other value is a real failure code. */
  resultCode?: number | undefined;
  resultDesc?: string | undefined;
  /** True when Safaricom says the transaction is still being processed. */
  stillProcessing: boolean;
}

// Safaricom says "still running" in two different shapes, and only one of them
// was handled.
//
// `500.001.1001` arrives as an `errorCode`. But a live query on 2026-08-17
// answered HTTP 200, no errorCode at all, and `ResultCode: "4999"` with
// `ResultDesc: "The transaction is still under processing"`. That fell straight
// through to the success/failure branch, where any non-zero code is a failure —
// so `reconcileStuckPayments` would have marked a payment FAILED, returned the
// produce to the marketplace and told the buyer "no money left your account",
// while Safaricom was saying the transaction was still running and the buyer
// may already have been debited.
//
// This is the exact failure the reconciliation rebuild exists to prevent, and
// it was sitting in the real provider where the simulator could never reach it.
const QUERY_IN_PROGRESS_ERROR_CODES = ['500.001.1001'];

/**
 * ResultCodes that mean "not finished", not "failed".
 *
 * 4999 is the one observed from the live sandbox. 1032 (cancelled by user) and
 * 1037 (no response) are genuine terminal failures and are deliberately absent.
 */
const QUERY_IN_PROGRESS_RESULT_CODES = new Set([4999]);

export async function queryStkPushStatus(checkoutRequestId: string): Promise<ISTKQueryResult> {
  const shortcode = env('MPESA_SHORTCODE');
  const passkey = env('MPESA_PASSKEY');

  const timestamp = getTimestamp();
  const password = buildPassword(shortcode, passkey, timestamp);

  const queryUrl = `${darajaHost()}/mpesa/stkpushquery/v1/query`;

  const accessToken = await getAccessToken();

  const res = await fetch(queryUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  const data = (await res.json()) as {
    ResultCode?: string | number;
    ResultDesc?: string;
    errorCode?: string;
    errorMessage?: string;
  };

  if (data.errorCode && QUERY_IN_PROGRESS_ERROR_CODES.includes(data.errorCode)) {
    return { stillProcessing: true };
  }

  // The 200-with-ResultCode shape. Checked before the failure branch below,
  // because that branch treats every non-zero code as a terminal failure.
  if (data.ResultCode !== undefined && QUERY_IN_PROGRESS_RESULT_CODES.has(Number(data.ResultCode))) {
    logger.info('darajaService', 'STK query: transaction still processing', {
      checkoutRequestId,
      resultCode: data.ResultCode,
    });
    return { stillProcessing: true };
  }

  if (!res.ok || data.errorCode !== undefined || data.ResultCode === undefined) {
    // Safaricom could not tell us. Deliberately not an error and deliberately
    // not a failure — the caller must be able to distinguish "no answer" from
    // "answered: failed", because only one of those means the buyer kept their
    // money.
    logger.warn('darajaService', 'STK query returned no usable result', {
      checkoutRequestId,
      status: res.status,
      error: data.errorCode ?? null,
    });
    return { stillProcessing: false };
  }

  return {
    resultCode: Number(data.ResultCode),
    resultDesc: data.ResultDesc ?? '',
    stillProcessing: false,
  };
}

// ---------------------------------------------------------------------------
// Callback authenticity — where it actually lives.
//
// Safaricom Daraja does NOT sign callbacks: no HMAC, no message authentication
// code, nothing in the payload or headers that proves the sender. There is
// therefore nothing for a verify-signature function to verify, and this file
// used to export one anyway. It took a Headers and a body, ignored both, and
// returned true. The webhook called it as "Step 1: Verify signature (always
// first)", so the route read as though it authenticated its caller.
//
// It did not, and a security control that only appears to exist is worse than
// an absent one: it stops anybody looking for the real thing. Removed rather
// than left "for interface consistency".
//
// The genuine controls, all of which are real and in force:
//   1. HTTPS-only callback URLs — Daraja refuses to POST to plain HTTP.
//   2. IP allow-listing against Safaricom's published callback ranges, applied
//      in `src/middleware.ts` before any other handling of this route.
//   3. Replay protection — a unique sparse index on the order's
//      mpesaTransactionId, so a receipt number can only ever be credited once.
//      `processStkCallback` checks it first and no-ops cleanly on a repeat.
// ---------------------------------------------------------------------------
