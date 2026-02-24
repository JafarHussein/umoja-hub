/**
 * @jest-environment node
 *
 * Integration tests for POST /api/cron/price-alert-check
 * Tests: missing bearer, valid token, alert matching, 24h throttle
 */

import { NextRequest } from 'next/server';

// Mock DB connection
jest.mock('@/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

// Mock models
jest.mock('@/lib/models/PriceAlert.model', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findByIdAndUpdate: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('@/lib/models/PriceHistory.model', () => ({
  __esModule: true,
  default: {
    aggregate: jest.fn(),
  },
}));

jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

// Mock smsService — non-blocking
jest.mock('@/lib/integrations/smsService', () => ({
  sendSMS: jest.fn().mockResolvedValue({ success: true }),
}));

import PriceAlert from '@/lib/models/PriceAlert.model';
import PriceHistory from '@/lib/models/PriceHistory.model';
import User from '@/lib/models/User.model';
import { POST } from '../route';

const VALID_CRON_SECRET = 'test-cron-secret-123';

function makeRequest(body: unknown = {}, token?: string): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['authorization'] = `Bearer ${token}`;
  return new NextRequest('http://localhost:3000/api/cron/price-alert-check', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('POST /api/cron/price-alert-check', () => {
  beforeAll(() => {
    process.env['CRON_SECRET'] = VALID_CRON_SECRET;
  });

  afterAll(() => {
    delete process.env['CRON_SECRET'];
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const req = makeRequest({});
    const res = await POST(req);

    expect(res.status).toBe(401);
    const data = await res.json() as { code: string };
    expect(data.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('returns 401 when Bearer token is wrong', async () => {
    const req = makeRequest({}, 'wrong-token');
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 200 with checked/triggered counts for valid token with no alerts', async () => {
    (PriceAlert.find as jest.Mock).mockReturnValue({
      limit: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    const req = makeRequest({}, VALID_CRON_SECRET);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json() as { data: { checked: number; triggered: number } };
    expect(data.data.checked).toBe(0);
    expect(data.data.triggered).toBe(0);
  });

  it('triggers notification when current price exceeds target', async () => {
    const alertId = 'alert-123';
    const farmerId = 'farmer-456';

    (PriceAlert.find as jest.Mock).mockReturnValue({
      limit: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: alertId,
            farmerId,
            cropName: 'maize',
            county: 'Kiambu',
            targetPricePerUnit: 40,
            notificationMethod: 'SMS',
            isActive: true,
            lastTriggeredAt: null,
          },
        ]),
      }),
    });

    // Current average: KES 45/kg — above target of KES 40
    (PriceHistory.aggregate as jest.Mock).mockResolvedValue([{ avgPrice: 45 }]);

    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          firstName: 'Peter',
          phoneNumber: '+254712345678',
          email: 'peter@test.com',
        }),
      }),
    });

    const req = makeRequest({}, VALID_CRON_SECRET);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json() as { data: { checked: number; triggered: number } };
    expect(data.data.triggered).toBe(1);
    expect(data.data.checked).toBe(1);
  });

  it('skips alert re-trigger within 24h cooldown', async () => {
    const alertId = 'alert-789';
    const farmerId = 'farmer-321';
    // lastTriggeredAt = 1 hour ago — within 24h cooldown
    const recentlyTriggered = new Date(Date.now() - 60 * 60 * 1000);

    (PriceAlert.find as jest.Mock).mockReturnValue({
      limit: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: alertId,
            farmerId,
            cropName: 'beans',
            county: 'Nakuru',
            targetPricePerUnit: 100,
            notificationMethod: 'SMS',
            isActive: true,
            lastTriggeredAt: recentlyTriggered,
          },
        ]),
      }),
    });

    (PriceHistory.aggregate as jest.Mock).mockResolvedValue([{ avgPrice: 120 }]);

    const req = makeRequest({}, VALID_CRON_SECRET);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json() as { data: { triggered: number } };
    // Should NOT trigger because it was triggered within 24h
    expect(data.data.triggered).toBe(0);
  });

  it('does not trigger when current price is below target', async () => {
    (PriceAlert.find as jest.Mock).mockReturnValue({
      limit: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: 'alert-999',
            farmerId: 'farmer-999',
            cropName: 'tomatoes',
            county: 'Meru',
            targetPricePerUnit: 80,
            notificationMethod: 'SMS',
            isActive: true,
            lastTriggeredAt: null,
          },
        ]),
      }),
    });

    // Current average: KES 60/kg — BELOW target of KES 80
    (PriceHistory.aggregate as jest.Mock).mockResolvedValue([{ avgPrice: 60 }]);

    const req = makeRequest({}, VALID_CRON_SECRET);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json() as { data: { triggered: number } };
    expect(data.data.triggered).toBe(0);
  });
});
