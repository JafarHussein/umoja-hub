/**
 * @jest-environment node
 *
 * Integration tests for POST /api/assistant
 * Tests: FARMER access, BUYER forbidden, Groq failure graceful degradation
 */

import { NextRequest } from 'next/server';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock auth options
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

// Mock DB connection
jest.mock('@/lib/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

// Mock groqService — we test the route in isolation
jest.mock('@/lib/integrations/groqService', () => ({
  farmAssistantChat: jest.fn(),
}));

import { getServerSession } from 'next-auth';
import { farmAssistantChat } from '@/lib/integrations/groqService';
import { POST } from '../route';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockFarmAssistantChat = farmAssistantChat as jest.MockedFunction<typeof farmAssistantChat>;

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/assistant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when user is BUYER', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'buyer-id', role: 'BUYER', email: 'buyer@test.com' },
      expires: '2099-01-01',
    });

    const req = makeRequest({ message: 'Hello' });
    const res = await POST(req);

    expect(res.status).toBe(403);
    const data = await res.json() as { code: string };
    expect(data.code).toBe('AUTH_FORBIDDEN');
  });

  it('returns 403 when user is STUDENT', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'student-id', role: 'STUDENT', email: 'student@test.com' },
      expires: '2099-01-01',
    });

    const req = makeRequest({ message: 'Hello' });
    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it('returns 401 when session is missing', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const req = makeRequest({ message: 'Hello' });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 when message is empty', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'farmer-id', role: 'FARMER', email: 'farmer@test.com' },
      expires: '2099-01-01',
    });

    const req = makeRequest({ message: '' });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json() as { code: string };
    expect(data.code).toBe('VALIDATION_FAILED');
  });

  it('returns 400 when message exceeds 1000 characters', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'farmer-id', role: 'FARMER', email: 'farmer@test.com' },
      expires: '2099-01-01',
    });

    const req = makeRequest({ message: 'a'.repeat(1001) });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns 200 with response and sessionId for valid FARMER request', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'farmer-id', role: 'FARMER', email: 'farmer@test.com' },
      expires: '2099-01-01',
    });

    mockFarmAssistantChat.mockResolvedValue({
      response: 'Maize requires 3 waterings per week during dry season.',
      sessionId: 'session-123',
      weatherContext: {
        county: 'Kiambu',
        forecast: 'Sunny, 22°C, 10% rain',
      },
    });

    const req = makeRequest({ message: 'How often should I water my maize?' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json() as { data: { response: string; sessionId: string; weatherContext: unknown } };
    expect(body.data.response).toBe('Maize requires 3 waterings per week during dry season.');
    expect(body.data.sessionId).toBe('session-123');
    expect(body.data.weatherContext).toBeDefined();
  });

  it('returns 200 with fallback response when Groq fails (not 503)', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'farmer-id', role: 'FARMER', email: 'farmer@test.com' },
      expires: '2099-01-01',
    });

    // Simulate Groq failure — groqService still returns a fallback, never throws
    mockFarmAssistantChat.mockResolvedValue({
      response: "I'm having trouble connecting right now. Please try again in a moment.",
      sessionId: 'session-456',
      weatherContext: null,
    });

    const req = makeRequest({ message: 'Is my soil good for tomatoes?' });
    const res = await POST(req);

    // Must be 200 — not 503
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { response: string } };
    expect(body.data.response).toContain("I'm having trouble");
  });

  it('passes existing sessionId to groqService', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'farmer-id', role: 'FARMER', email: 'farmer@test.com' },
      expires: '2099-01-01',
    });

    mockFarmAssistantChat.mockResolvedValue({
      response: 'Great question about your beans!',
      sessionId: 'existing-session',
      weatherContext: null,
    });

    const req = makeRequest({ message: 'Tell me about beans', sessionId: 'existing-session' });
    await POST(req);

    expect(mockFarmAssistantChat).toHaveBeenCalledWith(
      'Tell me about beans',
      'farmer-id',
      'existing-session'
    );
  });

  it('omits sessionId from groqService call when not provided', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'farmer-id', role: 'FARMER', email: 'farmer@test.com' },
      expires: '2099-01-01',
    });

    mockFarmAssistantChat.mockResolvedValue({
      response: 'Here is some advice.',
      sessionId: 'new-session',
      weatherContext: null,
    });

    const req = makeRequest({ message: 'Tell me about maize' });
    await POST(req);

    expect(mockFarmAssistantChat).toHaveBeenCalledWith(
      'Tell me about maize',
      'farmer-id',
      undefined
    );
  });
});
