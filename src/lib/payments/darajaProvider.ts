import { initiateSTKPush } from '@/lib/integrations/darajaService';
import type {
  PaymentProvider,
  PaymentInitiationParams,
  PaymentInitiationResult,
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
  };
}
