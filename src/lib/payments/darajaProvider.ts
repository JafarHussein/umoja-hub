import { initiateSTKPush, queryStkPushStatus } from '@/lib/integrations/darajaService';
import { logger } from '@/lib/utils';
import type {
  PaymentProvider,
  PaymentInitiationParams,
  PaymentInitiationResult,
  PaymentQueryResult,
} from '@/lib/payments/types';

// ---------------------------------------------------------------------------
// Daraja payment provider — thin adapter over the existing initiateSTKPush.
//
// Sandbox vs production URLs are selected inside darajaService by NODE_ENV (a
// production Vercel deploy hits the live endpoints); the provider name is
// retained for the factory + audit trail. This keeps the real M-Pesa path
// untouched so a future go-live needs only PAYMENT_PROVIDER=daraja-production.
// ---------------------------------------------------------------------------

export function createDarajaProvider(name: string): PaymentProvider {
  return {
    name,
    async initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult> {
      const result = await initiateSTKPush({
        amount: params.amount,
        phone: params.phone,
        orderId: params.orderReferenceId,
        description: params.description,
      });
      return {
        checkoutRequestId: result.CheckoutRequestID,
        merchantRequestId: result.MerchantRequestID,
        customerMessage: result.CustomerMessage,
      };
    },

    /**
     * Ask Safaricom what became of a payment whose callback never arrived.
     *
     * A thrown error here must not be allowed to read as a failure — the whole
     * point of the call is to distinguish "the buyer was not debited" from "we
     * do not know". So every fault answers UNKNOWN, and the caller decides.
     */
    async queryPaymentStatus(checkoutRequestId: string): Promise<PaymentQueryResult> {
      try {
        const result = await queryStkPushStatus(checkoutRequestId);

        if (result.stillProcessing) return { state: 'PENDING' };
        if (result.resultCode === undefined) return { state: 'UNKNOWN' };
        if (result.resultCode === 0) return { state: 'SUCCESS', resultCode: 0 };

        return {
          state: 'FAILED',
          resultCode: result.resultCode,
          resultDesc: result.resultDesc ?? 'The transaction failed.',
        };
      } catch (error) {
        logger.error('payments', 'STK query failed — treating outcome as unknown', {
          checkoutRequestId,
          error,
        });
        return { state: 'UNKNOWN' };
      }
    },
  };
}
