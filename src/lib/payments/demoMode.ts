import { getActiveProviderName } from '@/lib/payments/active';
import { PaymentProviderName } from '@/types';

// ---------------------------------------------------------------------------
// The real-STK demonstration mode.
//
// Two facts, established by testing the Daraja sandbox directly on 2026-08-17,
// shape everything in this file.
//
//   1. A real STK Push works. Safaricom authenticates us, accepts the request,
//      issues a real CheckoutRequestID and POSTs a real callback to our
//      endpoint from its own IP range. That leg is genuine and needs no help.
//
//   2. The sandbox cannot produce a PAID outcome. Its test handset
//      (254708374149) has no one to enter a PIN, so the callback that arrives
//      says `1037 · No response from user`. A real Kenyan number is rejected
//      outright with `E3008 · the user has a bad debt contract` and never rings.
//      Only production Go-Live, against a registered paybill or till, can end an
//      STK Push in a successful debit.
//
// So the payment leg is real up to and including the callback, and the
// *successful* outcome is the one thing the sandbox cannot give us. This module
// governs the two places that touch:
//
//   - what amount is sent to Safaricom (nominal, so a demonstration is not
//     charging thousands of shillings against a sandbox shortcode), and
//   - whether the demonstration bridge may be used at all.
//
// Nothing here fabricates a provider response. The bridge is an explicit,
// audited, administrator-invoked action that says in the record exactly what it
// is, and it is unavailable unless this mode is switched on deliberately.
// ---------------------------------------------------------------------------

/**
 * `PAYMENT_MODE=REAL_STK_DEMO` — the academic demonstration configuration.
 *
 * Off by default. It changes no business logic: order totals, escrow, release
 * eligibility and the audit trail are identical either way.
 */
export function isRealStkDemo(): boolean {
  return (process.env['PAYMENT_MODE'] ?? '').toUpperCase() === 'REAL_STK_DEMO';
}

/** The nominal amount, in KES. `DEMO_AMOUNT`, defaulting to 1. */
export function demoAmountKES(): number {
  const raw = Number(process.env['DEMO_AMOUNT'] ?? 1);
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 1;
}

/**
 * What to actually charge the provider for an order.
 *
 * The order keeps its true total everywhere — on the order, in escrow, in the
 * farmer's ledger, on the receipt. Only the figure handed to Safaricom is
 * nominal, and only in demonstration mode. KES 1 is deliberately NOT hard-coded
 * into the payment architecture: with the mode off, this returns the real total
 * and the same code path would charge it.
 */
export function providerAmountFor(orderTotalKES: number): number {
  return isRealStkDemo() ? demoAmountKES() : orderTotalKES;
}

/** True when the amount sent to the provider differs from the order total. */
export function isNominalCharge(orderTotalKES: number): boolean {
  return providerAmountFor(orderTotalKES) !== orderTotalKES;
}

/**
 * May the demonstration bridge be used?
 *
 * Deliberately narrow. It requires the demonstration mode to be on AND a Daraja
 * provider to be active, because the bridge exists for exactly one situation:
 * a real STK Push was made and the sandbox cannot complete it. Under the
 * simulator there is nothing to bridge — the simulator can already produce a
 * success — and under `daraja-production` a real payment can succeed on its
 * own, so bridging would be falsifying a real financial outcome.
 */
export function isDemoBridgeAvailable(): boolean {
  if (!isRealStkDemo()) return false;
  const provider = getActiveProviderName();
  return provider === PaymentProviderName.DARAJA_SANDBOX;
}

/**
 * The provider name recorded against a bridged confirmation.
 *
 * Never 'daraja-sandbox'. The audit trail must not be able to suggest that
 * Safaricom confirmed a payment it did not confirm.
 */
export const DEMO_BRIDGE_PROVIDER = 'umojahub-demo-bridge';

/**
 * The reference minted for a bridged confirmation.
 *
 * Deliberately NOT shaped like an M-Pesa receipt. A real one is ten uppercase
 * alphanumerics (`QK4H7T2M9P`); this is prefixed `DEMO-` so it cannot be
 * mistaken for one at a glance, in a database, or in a screenshot — and so the
 * UI can detect it and label the row honestly without being told.
 */
export function mintDemoReference(orderReferenceId: string): string {
  return `DEMO-${orderReferenceId.replace(/^UMJ-/, '')}`;
}

/** Is this reference a demonstration artefact rather than an M-Pesa receipt? */
export function isDemoReference(reference: string | null | undefined): boolean {
  return typeof reference === 'string' && reference.startsWith('DEMO-');
}

/**
 * Which leg of the payment an ORDER actually used.
 *
 * Derived, never stored, from two facts already on the record: the active
 * provider, and whether the order's payment reference is a bridge artefact.
 * One derivation so the buyer's screen, the farmer's, the receipt and the
 * admin transaction view cannot disagree about the same payment — which is the
 * failure that started this whole programme.
 *
 * Note it is per-order, not per-deployment: an order paid last week under the
 * simulator keeps saying so after the provider is switched to the sandbox.
 */
export function paymentModeForOrder(reference: string | null | undefined): string {
  if (isDemoReference(reference)) return 'demo-bridge';
  return getActiveProviderName();
}
