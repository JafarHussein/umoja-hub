/**
 * @jest-environment node
 *
 * queryPaymentStatus — the third leg of the STK lifecycle.
 *
 * Initiating a push and receiving a callback are only two of the three calls a
 * real integration needs. The callback is not guaranteed to arrive, and when it
 * does not, the transaction is NOT known to have failed — the buyer may already
 * have been debited. This is the call that tells the difference.
 */

const mockSimFindOne = jest.fn();
jest.mock('@/lib/models/SimulatedPayment.model', () => ({
  __esModule: true,
  default: { findOne: (...a: unknown[]) => mockSimFindOne(...a) },
}));

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

import { simulationProvider } from '../simulationProvider';
import { SimulatedOutcome } from '@/types';

function wire(row: unknown): void {
  mockSimFindOne.mockReturnValue({
    select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(row) }),
  });
}

const PAST = new Date(Date.now() - 60_000);
const FUTURE = new Date(Date.now() + 60_000);

describe('simulationProvider.queryPaymentStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reports a settled success with its receipt', async () => {
    wire({
      outcome: SimulatedOutcome.SUCCESS,
      mpesaReceiptNumber: 'QGR1ABCD23',
      deliverAt: PAST,
    });

    const result = await simulationProvider.queryPaymentStatus('ws_CO_sim_1');

    expect(result).toEqual({
      state: 'SUCCESS',
      resultCode: 0,
      mpesaReceiptNumber: 'QGR1ABCD23',
    });
  });

  it('answers UNKNOWN for a lost callback, never FAILED', async () => {
    // The whole reason this method exists. A LOST outcome is precisely the case
    // a real integration cannot resolve on its own. Answering FAILED here would
    // make the simulator kinder than reality — the one thing it must never be —
    // and would let reconciliation tell a buyer their money was safe on the
    // strength of a guess the simulator had quietly made for it.
    wire({ outcome: SimulatedOutcome.LOST, deliverAt: PAST });

    const result = await simulationProvider.queryPaymentStatus('ws_CO_sim_1');

    expect(result).toEqual({ state: 'UNKNOWN' });
    expect(result.state).not.toBe('FAILED');
  });

  it('reports a real failure with its Daraja result code', async () => {
    wire({ outcome: SimulatedOutcome.USER_CANCELLED, deliverAt: PAST });

    const result = await simulationProvider.queryPaymentStatus('ws_CO_sim_1');

    expect(result).toMatchObject({ state: 'FAILED', resultCode: 1032 });
  });

  it('reports PENDING while the prompt is still with the buyer', async () => {
    wire({ outcome: SimulatedOutcome.SUCCESS, deliverAt: FUTURE });

    const result = await simulationProvider.queryPaymentStatus('ws_CO_sim_1');

    expect(result).toEqual({ state: 'PENDING' });
  });

  it('answers UNKNOWN when there is no record of the session at all', async () => {
    wire(null);

    const result = await simulationProvider.queryPaymentStatus('ws_CO_sim_missing');

    expect(result).toEqual({ state: 'UNKNOWN' });
  });
});
