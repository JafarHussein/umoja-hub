/**
 * @jest-environment node
 *
 * Tests for DELETE /api/prices/alerts/[alertId]
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockFindOneAndDelete = jest.fn();
jest.mock('@/lib/models/PriceAlert.model', () => ({
  __esModule: true,
  default: {
    findOneAndDelete: jest.fn((...a: unknown[]) => mockFindOneAndDelete(...a)),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { DELETE } from '../route';

const ALERT_ID = '507f1f77bcf86cd799439011';
const FARMER_SESSION = { user: { id: 'farmer-001', role: 'FARMER', firstName: 'Aisha' } };

function makeRequest(alertId = ALERT_ID) {
  return new NextRequest(`http://localhost/api/prices/alerts/${alertId}`, { method: 'DELETE' });
}

function makeParams(alertId = ALERT_ID) {
  return { params: Promise.resolve({ alertId }) };
}

describe('DELETE /api/prices/alerts/[alertId]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes the alert and returns 204', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    mockFindOneAndDelete.mockResolvedValue({ _id: ALERT_ID, farmerId: 'farmer-001' });

    const res = await DELETE(makeRequest(), makeParams());

    expect(res.status).toBe(204);
    expect(mockFindOneAndDelete).toHaveBeenCalledWith({
      _id: ALERT_ID,
      farmerId: 'farmer-001',
    });
  });

  it('returns 404 when alert does not belong to the farmer', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    mockFindOneAndDelete.mockResolvedValue(null);

    const res = await DELETE(makeRequest(), makeParams());

    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid alertId', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);

    const res = await DELETE(makeRequest('not-an-id'), makeParams('not-an-id'));

    expect(res.status).toBe(400);
    expect(mockFindOneAndDelete).not.toHaveBeenCalled();
  });

  it('returns 403 when a non-FARMER calls DELETE', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'buyer-001', role: 'BUYER', firstName: 'Buyer' },
    });

    const res = await DELETE(makeRequest(), makeParams());

    expect(res.status).toBe(403);
  });
});
