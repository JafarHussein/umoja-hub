/**
 * @jest-environment node
 *
 * Tests for GET /api/students/me/portfolio
 * Covers: portfolio found, scaffold returned when no record, 403 wrong role, 401 unauthenticated.
 */

import { NextRequest } from 'next/server';
import { PortfolioStrength, StudentTier } from '@/types';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockPortfolioFindOne = jest.fn();
jest.mock('@/lib/models/StudentPortfolioStatus.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...a: unknown[]) => mockPortfolioFindOne(...a)),
  },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET } from '../route';

const STUDENT_SESSION = { user: { id: 'student-001', role: 'STUDENT', firstName: 'Amina' } };
const FARMER_SESSION = { user: { id: 'farmer-001', role: 'FARMER', firstName: 'Kamau' } };

const EXISTING_PORTFOLIO = {
  _id: '64a1b2c3d4e5f6a7b8c9d0e1',
  studentId: 'student-001',
  currentTier: StudentTier.INTERMEDIATE,
  portfolioStrength: PortfolioStrength.DEVELOPING,
  verifiedProjects: [],
  verifiedSkills: [],
  tierProgressionTimeline: [],
  stats: { verifiedProjectCount: 2, totalProjectCount: 3, techStacksUsed: ['React'], reviewerInstitutions: [] },
  lastRecalculatedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest() {
  return new NextRequest('http://localhost/api/students/me/portfolio', { method: 'GET' });
}

describe('GET /api/students/me/portfolio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
  });

  it('returns the portfolio when a record exists for the student', async () => {
    mockPortfolioFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(EXISTING_PORTFOLIO) });

    const res = await GET(makeRequest());
    const body = await res.json() as { data: { currentTier: string; stats: { verifiedProjectCount: number } } };

    expect(res.status).toBe(200);
    expect(body.data.currentTier).toBe(StudentTier.INTERMEDIATE);
    expect(body.data.stats.verifiedProjectCount).toBe(2);
    expect(mockPortfolioFindOne).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: STUDENT_SESSION.user.id })
    );
  });

  it('returns a zero-state scaffold when no portfolio record exists', async () => {
    mockPortfolioFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    const res = await GET(makeRequest());
    const body = await res.json() as {
      data: {
        studentId: string;
        currentTier: string;
        portfolioStrength: string;
        verifiedProjects: unknown[];
        stats: { verifiedProjectCount: number };
        lastRecalculatedAt: null;
      };
    };

    expect(res.status).toBe(200);
    expect(body.data.studentId).toBe(STUDENT_SESSION.user.id);
    expect(body.data.currentTier).toBe(StudentTier.BEGINNER);
    expect(body.data.portfolioStrength).toBe(PortfolioStrength.BUILDING);
    expect(body.data.verifiedProjects).toHaveLength(0);
    expect(body.data.stats.verifiedProjectCount).toBe(0);
    expect(body.data.lastRecalculatedAt).toBeNull();
  });

  it('returns 403 when a non-STUDENT role calls the endpoint', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(FARMER_SESSION);
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });
});
