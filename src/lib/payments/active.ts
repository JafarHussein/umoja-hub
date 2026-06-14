import { PaymentProviderName } from '@/types';

// ---------------------------------------------------------------------------
// Active-provider resolution. Pure env reading, free of model/provider imports
// so it can be used (and tested) without loading the Mongoose-backed providers.
// ---------------------------------------------------------------------------

export function getActiveProviderName(): PaymentProviderName {
  const raw = (process.env['PAYMENT_PROVIDER'] ?? PaymentProviderName.SIMULATION).toLowerCase();
  if (raw === PaymentProviderName.DARAJA_SANDBOX) return PaymentProviderName.DARAJA_SANDBOX;
  if (raw === PaymentProviderName.DARAJA_PRODUCTION) return PaymentProviderName.DARAJA_PRODUCTION;
  return PaymentProviderName.SIMULATION;
}

export function isSimulationActive(): boolean {
  return getActiveProviderName() === PaymentProviderName.SIMULATION;
}
