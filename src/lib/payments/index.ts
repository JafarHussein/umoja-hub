import { simulationProvider } from '@/lib/payments/simulationProvider';
import { createDarajaProvider } from '@/lib/payments/darajaProvider';
import { getActiveProviderName } from '@/lib/payments/active';
import type { PaymentProvider } from '@/lib/payments/types';
import { PaymentProviderName } from '@/types';

// ---------------------------------------------------------------------------
// Payment provider factory.
//
// PAYMENT_PROVIDER selects the active provider; default is `simulation` so the
// platform runs end-to-end with zero M-Pesa credentials. Flipping to
// `daraja-sandbox` or `daraja-production` swaps the payment source with no
// business-logic changes anywhere else.
// ---------------------------------------------------------------------------

export function getPaymentProvider(): PaymentProvider {
  const name = getActiveProviderName();
  if (name === PaymentProviderName.SIMULATION) return simulationProvider;
  return createDarajaProvider(name);
}

export { getActiveProviderName, isSimulationActive } from '@/lib/payments/active';
export type { PaymentProvider } from '@/lib/payments/types';
