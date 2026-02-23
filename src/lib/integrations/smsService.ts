/**
 * SMS service via Africa's Talking.
 * All failures are non-blocking — logged but never thrown to the caller.
 * Uses sandbox in non-production environments.
 */

import { env } from '@/lib/env';
import { logger } from '@/lib/utils';

interface ISendSMSResult {
  success: boolean;
  messageId?: string;
}

/**
 * Send an SMS via Africa's Talking.
 * Safe to call from any trigger chain — never throws.
 */
export async function sendSMS(to: string, message: string): Promise<ISendSMSResult> {
  try {
    const username = env('AFRICASTALKING_USERNAME');
    const apiKey = env('AFRICASTALKING_API_KEY');

    // Africa's Talking uses different base URLs for sandbox vs production
    const isSandbox = username === 'sandbox' || process.env.NODE_ENV !== 'production';
    const baseUrl = isSandbox
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging';

    const params = new URLSearchParams({
      username,
      to,
      message,
    });

    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        apiKey,
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const errorBody: unknown = await res.json();
      logger.error('smsService', 'Africa\'s Talking returned non-200', {
        status: res.status,
        to,
        error: errorBody,
      });
      return { success: false };
    }

    const data = (await res.json()) as {
      SMSMessageData?: { Recipients?: Array<{ messageId: string; status: string }> };
    };

    const recipient = data.SMSMessageData?.Recipients?.[0];

    if (!recipient || recipient.status !== 'Success') {
      logger.error('smsService', 'SMS delivery failed', { to, data });
      return { success: false };
    }

    logger.info('smsService', 'SMS sent', { to, messageId: recipient.messageId });
    return { success: true, messageId: recipient.messageId };
  } catch (error) {
    logger.error('smsService', 'EXT_SMS_FAILED — unexpected error', { to, error });
    // Non-blocking: never rethrow
    return { success: false };
  }
}
