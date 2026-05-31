/**
 * @jest-environment node
 *
 * Tests for POST /api/mentor/chat
 * Covers: success (Groq called), Groq failure (fallback returned), 404 engagement not found,
 * 429 rate limit, 400 invalid engagementId, 400 validation, 403, 401.
 */

import { NextRequest } from 'next/server';
import { ProjectStatus } from '@/types';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/env', () => ({ env: jest.fn((key: string) => `test-${key}`) }));

const mockEngagementFindOne = jest.fn();
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...a: unknown[]) => mockEngagementFindOne(...a)),
  },
}));

const mockMentorFindOne = jest.fn();
const mockMentorCreate = jest.fn();
jest.mock('@/lib/models/MentorSession.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...a: unknown[]) => mockMentorFindOne(...a)),
    create: jest.fn((...a: unknown[]) => mockMentorCreate(...a)),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST } from '../route';

const STUDENT_SESSION = { user: { id: 'student-001', role: 'STUDENT', firstName: 'Amina' } };
const FARMER_SESSION = { user: { id: 'farmer-001', role: 'FARMER', firstName: 'Kamau' } };
const VALID_ENGAGEMENT_ID = '64a1b2c3d4e5f6a7b8c9d0e1';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/mentor/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const ACTIVE_ENGAGEMENT = {
  _id: VALID_ENGAGEMENT_ID,
  studentId: 'student-001',
  status: ProjectStatus.IN_PROGRESS,
  track: 'AI_BRIEF',
  tier: 'BEGINNER',
  brief: { title: 'Farm Inventory System' },
};

function makeMockSession(messages: unknown[] = []) {
  return {
    _id: 'session-001',
    studentId: 'student-001',
    engagementId: VALID_ENGAGEMENT_ID,
    messages,
    lastActivityAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    save: jest.fn().mockResolvedValue(undefined),
  };
}

const VALID_BODY = { message: 'How should I approach the database schema?', engagementId: VALID_ENGAGEMENT_ID };

describe('POST /api/mentor/chat', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  it('calls Groq and returns the assistant response with sessionId', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(ACTIVE_ENGAGEMENT) });
    mockMentorFindOne.mockResolvedValue(makeMockSession());
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: 'Think about your data relationships first.' } }] }),
    });

    const res = await POST(makeRequest(VALID_BODY));
    const body = await res.json() as { data: { response: string; sessionId: string; messageCount: number } };

    expect(res.status).toBe(200);
    expect(body.data.response).toBe('Think about your data relationships first.');
    expect(body.data.sessionId).toBe('session-001');
    expect(body.data.messageCount).toBe(2); // user + assistant
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('creates a new MentorSession when none exists', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(ACTIVE_ENGAGEMENT) });
    mockMentorFindOne.mockResolvedValue(null);
    mockMentorCreate.mockResolvedValue(makeMockSession());
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: 'Welcome to the mentor!' } }] }),
    });

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(mockMentorCreate).toHaveBeenCalled();
  });

  it('returns the fallback response when Groq call fails, without throwing', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(ACTIVE_ENGAGEMENT) });
    mockMentorFindOne.mockResolvedValue(makeMockSession());
    mockFetch.mockRejectedValue(new Error('Network failure'));

    const res = await POST(makeRequest(VALID_BODY));
    const body = await res.json() as { data: { response: string } };

    expect(res.status).toBe(200);
    expect(body.data.response).toContain("I'm having trouble");
  });

  it('returns 429 when the rate limit is exceeded', async () => {
    const now = Date.now();
    const recentMessages = Array.from({ length: 10 }, (_, i) => ({
      role: 'user' as const,
      content: `msg ${i}`,
      timestamp: new Date(now - i * 30000), // within last 10 min
      autoLogged: true,
    }));
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(ACTIVE_ENGAGEMENT) });
    mockMentorFindOne.mockResolvedValue(makeMockSession(recentMessages));

    const res = await POST(makeRequest(VALID_BODY));
    const body = await res.json() as { code: string };

    expect(res.status).toBe(429);
    expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('returns 404 when the engagement is not found or not active', async () => {
    mockEngagementFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(404);
  });

  it('returns 400 when engagementId is not a valid ObjectId', async () => {
    const res = await POST(makeRequest({ message: 'Hello', engagementId: 'not-valid' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when message is missing', async () => {
    const res = await POST(makeRequest({ engagementId: VALID_ENGAGEMENT_ID }));
    expect(res.status).toBe(400);
  });

  it('returns 403 when a non-STUDENT calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });
});
