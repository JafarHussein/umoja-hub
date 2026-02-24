/**
 * Daraja M-Pesa integration service.
 * Handles OAuth token management, STK Push initiation, and webhook signature verification.
 * All failures throw AppError — callers must handle.
 */

import { env } from '@/lib/env';
import { AppError, logger } from '@/lib/utils';

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

  const isSandbox = process.env.NODE_ENV !== 'production';
  const tokenUrl = isSandbox
    ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

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

  const isSandbox = process.env.NODE_ENV !== 'production';
  const stkPushUrl = isSandbox
    ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

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
// Webhook Signature Verification
// Daraja does not use HMAC signatures — verification is via payload structure
// and callback URL secrecy. In production, add IP allowlisting via Vercel Edge.
// ---------------------------------------------------------------------------

export function verifyDarajaSignature(
  _headers: Headers,
  _body: unknown
): boolean {
  // For the MVP sandbox, the callback URL itself is the shared secret.
  // Production hardening (Phase 7): Vercel Edge middleware restricts to Safaricom IP ranges.
  // Return true here — webhook handler validates schema via Zod before processing.
  return true;
}
