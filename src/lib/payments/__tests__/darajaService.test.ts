/**
 * @jest-environment node
 *
 * Daraja service — the two things a live probe of the sandbox proved wrong.
 *
 * Both were unreachable by every existing test, because the suite runs on the
 * simulator and this file only executes when a Daraja provider is active. They
 * were found by calling Safaricom directly on 2026-08-17 and reading what came
 * back, and the responses below are the recorded ones, quoted.
 */

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

function mockFetchOnce(body: unknown, status = 200): jest.Mock {
  const fn = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe('STK query — "still processing" is not "failed"', () => {
  // The recorded sandbox response. HTTP 200, no errorCode at all, and the
  // in-progress state carried in ResultCode. The old guard only matched an
  // errorCode of 500.001.1001, so this fell through to the branch that treats
  // every non-zero code as terminal — and reconcileStuckPayments would have
  // marked the order FAILED, returned the produce to the marketplace and told
  // the buyer no money left their account, while Safaricom was still running
  // the transaction and the buyer may already have been debited.
  const STILL_PROCESSING = {
    ResponseCode: '0',
    ResponseDescription: 'The service request has been accepted successfully',
    MerchantRequestID: '8838-48ab-bdad-1f4dc54697c831554',
    CheckoutRequestID: 'ws_CO_170820261404032708374149',
    ResultCode: '4999',
    ResultDesc: 'The transaction is still under processing',
  };

  it('reads ResultCode 4999 as still processing, not as a failure', async () => {
    process.env['PAYMENT_PROVIDER'] = 'daraja-sandbox';
    process.env['MPESA_SHORTCODE'] = '174379';
    process.env['MPESA_PASSKEY'] = 'k';
    process.env['MPESA_CONSUMER_KEY'] = 'k';
    process.env['MPESA_CONSUMER_SECRET'] = 's';

    const fetchMock = jest.fn();
    // 1st call: OAuth. 2nd: the query.
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 't', expires_in: '3599' }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => STILL_PROCESSING });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { queryStkPushStatus } = await import('@/lib/integrations/darajaService');
    const result = await queryStkPushStatus('ws_CO_170820261404032708374149');

    expect(result.stillProcessing).toBe(true);
    // Critically: no result code is handed up, so nothing downstream can read
    // this as an outcome.
    expect(result.resultCode).toBeUndefined();
  });

  it('still reports a genuine terminal failure as one', async () => {
    process.env['PAYMENT_PROVIDER'] = 'daraja-sandbox';
    process.env['MPESA_SHORTCODE'] = '174379';
    process.env['MPESA_PASSKEY'] = 'k';
    process.env['MPESA_CONSUMER_KEY'] = 'k';
    process.env['MPESA_CONSUMER_SECRET'] = 's';

    const fetchMock = jest.fn();
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 't', expires_in: '3599' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        // 1037 is what the real sandbox callback returned when nobody entered
        // a PIN. It is terminal and must not be swallowed as "in progress".
        json: async () => ({ ResultCode: '1037', ResultDesc: 'No response from user.' }),
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { queryStkPushStatus } = await import('@/lib/integrations/darajaService');
    const result = await queryStkPushStatus('ws_CO_x');

    expect(result.stillProcessing).toBe(false);
    expect(result.resultCode).toBe(1037);
  });
});

describe('environment selection', () => {
  // This used to key off NODE_ENV, which is the wrong authority in both
  // directions: a production build running the sandbox provider posted sandbox
  // credentials to the LIVE endpoint, and there was no way to demonstrate the
  // sandbox from a production deploy.
  async function hostFor(provider: string): Promise<string> {
    process.env['PAYMENT_PROVIDER'] = provider;
    process.env['MPESA_CONSUMER_KEY'] = 'k';
    process.env['MPESA_CONSUMER_SECRET'] = 's';
    const fetchMock = mockFetchOnce({ access_token: 't', expires_in: '3599' });
    const { queryStkPushStatus } = await import('@/lib/integrations/darajaService');
    process.env['MPESA_SHORTCODE'] = '174379';
    process.env['MPESA_PASSKEY'] = 'k';
    await queryStkPushStatus('ws_CO_x').catch(() => undefined);
    return String(fetchMock.mock.calls[0]?.[0] ?? '');
  }

  it('uses the sandbox host for daraja-sandbox even in a production build', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
    expect(await hostFor('daraja-sandbox')).toContain('sandbox.safaricom.co.ke');
  });

  it('uses the live host only for daraja-production', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
    expect(await hostFor('daraja-production')).toContain('api.safaricom.co.ke');
  });
});
