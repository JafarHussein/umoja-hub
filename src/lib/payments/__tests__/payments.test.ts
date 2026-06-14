import { buildCallbackPayload } from '../callbackPayload';
import { OUTCOME_RESULT_CODE } from '../types';
import { getActiveProviderName, isSimulationActive } from '../active';
import { SimulatedOutcome, PaymentProviderName } from '@/types';

describe('buildCallbackPayload', () => {
  const base = {
    checkoutRequestId: 'ws_CO_sim_1',
    merchantRequestId: '12345-6789012-1',
    amount: 4000,
  };

  it('builds a success payload with ResultCode 0 and the receipt in metadata', () => {
    const payload = buildCallbackPayload({
      ...base,
      outcome: SimulatedOutcome.SUCCESS,
      mpesaReceiptNumber: 'QGR1ABCD23',
    });
    const cb = payload.Body.stkCallback;
    expect(cb.ResultCode).toBe(0);
    expect(cb.CheckoutRequestID).toBe('ws_CO_sim_1');
    const receipt = cb.CallbackMetadata?.Item.find((i) => i.Name === 'MpesaReceiptNumber');
    expect(receipt?.Value).toBe('QGR1ABCD23');
  });

  it('maps each failure outcome to its real Daraja ResultCode with no metadata', () => {
    const failures: Exclude<SimulatedOutcome, SimulatedOutcome.LOST>[] = [
      SimulatedOutcome.INSUFFICIENT_FUNDS,
      SimulatedOutcome.USER_CANCELLED,
      SimulatedOutcome.TIMEOUT,
      SimulatedOutcome.PHONE_UNREACHABLE,
      SimulatedOutcome.NETWORK_FAILURE,
    ];
    for (const outcome of failures) {
      const payload = buildCallbackPayload({ ...base, outcome });
      const cb = payload.Body.stkCallback;
      expect(cb.ResultCode).toBe(OUTCOME_RESULT_CODE[outcome]);
      expect(cb.CallbackMetadata).toBeUndefined();
    }
  });

  it('uses 1032 for a user cancellation', () => {
    expect(OUTCOME_RESULT_CODE[SimulatedOutcome.USER_CANCELLED]).toBe(1032);
  });
});

describe('payment provider factory', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('defaults to the simulation provider', () => {
    delete process.env['PAYMENT_PROVIDER'];
    expect(getActiveProviderName()).toBe(PaymentProviderName.SIMULATION);
    expect(isSimulationActive()).toBe(true);
  });

  it('selects a real Daraja provider when configured', () => {
    process.env['PAYMENT_PROVIDER'] = 'daraja-sandbox';
    expect(getActiveProviderName()).toBe(PaymentProviderName.DARAJA_SANDBOX);
    expect(isSimulationActive()).toBe(false);
  });

  it('falls back to simulation for an unknown value', () => {
    process.env['PAYMENT_PROVIDER'] = 'paypal';
    expect(getActiveProviderName()).toBe(PaymentProviderName.SIMULATION);
  });
});
