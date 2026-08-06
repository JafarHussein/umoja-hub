import { SimulatedOutcome } from '@/types';

// ---------------------------------------------------------------------------
// Payment provider abstraction.
//
// Both the real Daraja provider and the simulator implement PaymentProvider and
// return an identical PaymentInitiationResult. Everything downstream — the order
// route, the webhook processor, audit, notifications — is provider-agnostic.
// ---------------------------------------------------------------------------

export interface PaymentInitiationParams {
  /** Mongo _id of the order (string). */
  orderId: string;
  /** Human-readable order reference, used as the Daraja AccountReference. */
  orderReferenceId: string;
  amount: number;
  /** Kenyan phone in 07XXXXXXXX or +2547XXXXXXXX form. */
  phone: string;
  description: string;
  buyerId: string;
  farmerId: string;
}

export interface PaymentInitiationResult {
  checkoutRequestId: string;
  merchantRequestId: string;
  customerMessage: string;
}

/**
 * What the provider says about a payment when asked directly.
 *
 * The four cases are deliberately distinct, and UNKNOWN is the reason this type
 * exists. A callback that never arrives does not mean the payment failed — the
 * buyer may already have been debited and the notification lost in transit.
 * Collapsing "we could not find out" into "it failed" is what lets a platform
 * tell someone their money is safe when it is gone.
 */
export type PaymentQueryResult =
  | { state: 'SUCCESS'; resultCode: number; mpesaReceiptNumber?: string | undefined }
  | { state: 'FAILED'; resultCode: number; resultDesc: string }
  /** Still in flight. Ask again later; conclude nothing. */
  | { state: 'PENDING' }
  /** The provider could not answer. Never treat as failure. */
  | { state: 'UNKNOWN' };

export interface PaymentProvider {
  readonly name: string;
  /**
   * Begin a payment. Mirrors a real STK push: returns as soon as the prompt is
   * dispatched; the actual outcome arrives later as a callback.
   */
  initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResult>;
  /**
   * Ask the provider what actually happened to a payment.
   *
   * The third leg of the STK lifecycle, alongside initiate and callback. It is
   * what reconciliation consults before declaring a silent payment dead.
   */
  queryPaymentStatus(checkoutRequestId: string): Promise<PaymentQueryResult>;
}

// ---------------------------------------------------------------------------
// Outcome → real Daraja ResultCode mapping.
//
// These are the actual codes Safaricom returns, so the webhook processor and any
// downstream consumers behave identically whether the event came from Daraja or
// the simulator. LOST has no code — its callback is never delivered.
// Reference: Daraja STK callback ResultCodes.
// ---------------------------------------------------------------------------

export const OUTCOME_RESULT_CODE: Record<
  Exclude<SimulatedOutcome, SimulatedOutcome.LOST>,
  number
> = {
  [SimulatedOutcome.SUCCESS]: 0,
  [SimulatedOutcome.INSUFFICIENT_FUNDS]: 1,
  [SimulatedOutcome.USER_CANCELLED]: 1032,
  [SimulatedOutcome.TIMEOUT]: 1037, // DS timeout — user cannot be reached
  [SimulatedOutcome.PHONE_UNREACHABLE]: 1001, // unable to lock subscriber
  [SimulatedOutcome.NETWORK_FAILURE]: 1025, // unable to process request
  [SimulatedOutcome.UNKNOWN_ERROR]: 1, // generic failure
};

export const OUTCOME_RESULT_DESC: Record<
  Exclude<SimulatedOutcome, SimulatedOutcome.LOST>,
  string
> = {
  [SimulatedOutcome.SUCCESS]: 'The service request is processed successfully.',
  [SimulatedOutcome.INSUFFICIENT_FUNDS]: 'The balance is insufficient for the transaction.',
  [SimulatedOutcome.USER_CANCELLED]: 'Request cancelled by user.',
  [SimulatedOutcome.TIMEOUT]: 'DS timeout user cannot be reached.',
  [SimulatedOutcome.PHONE_UNREACHABLE]: 'Unable to lock subscriber, a transaction is already in process.',
  [SimulatedOutcome.NETWORK_FAILURE]: 'Unable to process the request.',
  [SimulatedOutcome.UNKNOWN_ERROR]: 'The transaction failed.',
};
