import { OUTCOME_RESULT_CODE, OUTCOME_RESULT_DESC } from '@/lib/payments/types';
import type { DarajaCallbackInput } from '@/lib/validation/orderSchema';
import { SimulatedOutcome } from '@/types';

// ---------------------------------------------------------------------------
// Pure construction of a Daraja-shaped STK callback payload from a simulated
// outcome. Kept free of any DB/model imports so it is trivially unit-testable
// and so consumers (the dispatcher) feed the exact shape the real webhook
// validates.
// ---------------------------------------------------------------------------

function transactionDateNumber(d: Date): number {
  const pad = (n: number) => String(n).padStart(2, '0');
  return Number(
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
      `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

export function buildCallbackPayload(sim: {
  outcome: string;
  checkoutRequestId: string;
  merchantRequestId: string;
  amount: number;
  mpesaReceiptNumber?: string | null;
}): DarajaCallbackInput {
  const base = {
    MerchantRequestID: sim.merchantRequestId,
    CheckoutRequestID: sim.checkoutRequestId,
  };

  if (sim.outcome === SimulatedOutcome.SUCCESS) {
    return {
      Body: {
        stkCallback: {
          ...base,
          ResultCode: 0,
          ResultDesc: OUTCOME_RESULT_DESC[SimulatedOutcome.SUCCESS],
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: sim.amount },
              { Name: 'MpesaReceiptNumber', Value: sim.mpesaReceiptNumber ?? '' },
              { Name: 'TransactionDate', Value: transactionDateNumber(new Date()) },
            ],
          },
        },
      },
    };
  }

  const outcome = sim.outcome as Exclude<SimulatedOutcome, SimulatedOutcome.LOST>;
  return {
    Body: {
      stkCallback: {
        ...base,
        ResultCode: OUTCOME_RESULT_CODE[outcome] ?? 1,
        ResultDesc: OUTCOME_RESULT_DESC[outcome] ?? 'The transaction failed.',
      },
    },
  };
}
