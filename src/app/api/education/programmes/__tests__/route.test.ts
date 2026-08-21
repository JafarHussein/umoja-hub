/**
 * @jest-environment node
 *
 * Tests for GET /api/education/programmes — the published curriculum of the
 * caller's institution. The load-bearing case is the empty one: a student whose
 * university has published nothing must get a normal, working response.
 */

import { NextRequest } from 'next/server';
import { AcademicDiscipline, KnowledgeArea } from '@/types';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: (...a: unknown[]) => mockUserFindById(...a) },
}));

const mockProgrammeFind = jest.fn();
jest.mock('@/lib/models/AcademicProgramme.model', () => ({
  __esModule: true,
  default: { find: (...a: unknown[]) => mockProgrammeFind(...a) },
}));

const mockUnitFind = jest.fn();
jest.mock('@/lib/models/CurriculumUnit.model', () => ({
  __esModule: true,
  default: { find: (...a: unknown[]) => mockUnitFind(...a) },
}));

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { GET } from '../route';

const STUDENT_SESSION = { user: { id: 'student-001', role: 'STUDENT', firstName: 'Amina' } };

function request(): NextRequest {
  return new NextRequest('http://localhost/api/education/programmes', { method: 'GET' });
}

function studentWithInstitution(institutionId: string | undefined): void {
  mockUserFindById.mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest
        .fn()
        .mockResolvedValue(institutionId ? { studentData: { institutionId } } : { studentData: {} }),
    }),
  });
}

interface ProgrammeResponse {
  data: Array<{ _id: string; name: string; units: Array<{ _id: string; code: string }> }>;
}

describe('GET /api/education/programmes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
  });

  it('returns each programme with its units attached', async () => {
    studentWithInstitution('inst-1');
    mockProgrammeFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: 'prog-1',
            name: 'BSc Computer Science',
            discipline: AcademicDiscipline.CS,
            durationYears: 4,
            semestersPerYear: 2,
          },
          {
            _id: 'prog-2',
            name: 'BSc Information Technology',
            discipline: AcademicDiscipline.IT,
            durationYears: 4,
            semestersPerYear: 2,
          },
        ]),
      }),
    });
    mockUnitFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: 'unit-1',
            programmeId: 'prog-1',
            code: 'SCS 231',
            title: 'Database Systems I',
            year: 2,
            semester: 1,
            knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
          },
          {
            _id: 'unit-2',
            programmeId: 'prog-2',
            code: 'SIT 231',
            title: 'Database Design and Administration',
            year: 2,
            semester: 1,
            knowledgeAreas: [KnowledgeArea.DATABASE_SYSTEMS],
          },
        ]),
      }),
    });

    const res = await GET(request());
    const body = (await res.json()) as ProgrammeResponse;

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]!.units).toHaveLength(1);
    expect(body.data[0]!.units[0]!.code).toBe('SCS 231');
    expect(body.data[1]!.units[0]!.code).toBe('SIT 231');
  });

  it('returns an empty list — not an error — when the institution has published nothing', async () => {
    studentWithInstitution('inst-1');
    mockProgrammeFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
    });

    const res = await GET(request());
    const body = (await res.json()) as ProgrammeResponse;

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(mockUnitFind).not.toHaveBeenCalled();
  });

  it('returns an empty list when the student has no institution on record', async () => {
    studentWithInstitution(undefined);

    const res = await GET(request());
    const body = (await res.json()) as ProgrammeResponse;

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(mockProgrammeFind).not.toHaveBeenCalled();
  });

  it('never offers another institution’s curriculum', async () => {
    studentWithInstitution('inst-1');
    mockProgrammeFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
    });

    await GET(request());
    expect(mockProgrammeFind).toHaveBeenCalledWith({ institutionId: 'inst-1' });
  });

  it('refuses a caller who is not a student', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'lect-1', role: 'LECTURER' },
    });
    const res = await GET(request());
    expect(res.status).toBe(403);
  });
});
