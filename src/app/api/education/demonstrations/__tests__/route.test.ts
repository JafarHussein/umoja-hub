/**
 * @jest-environment node
 *
 * Tests for POST /api/education/demonstrations — a student booking a time.
 *
 * The rule this route exists to hold is that two students cannot take the same
 * slot. Every check before the write happens on data both callers read while
 * the slot was still open, so the guarantee has to be the conditional update at
 * the end — and that is what most of these tests are about.
 */

import { NextRequest } from 'next/server';
import { ProjectStatus, SlotStatus, DemonstrationStatus } from '@/types';

jest.mock('@/lib/db', () => ({ connectDB: jest.fn().mockResolvedValue(undefined) }));

const mockEngagementFindOne = jest.fn();
jest.mock('@/lib/models/ProjectEngagement.model', () => ({
  __esModule: true,
  default: { findOne: jest.fn((...a: unknown[]) => mockEngagementFindOne(...a)) },
}));

const mockDemoFindOne = jest.fn();
const mockDemoCreate = jest.fn();
const mockDemoFind = jest.fn();
jest.mock('@/lib/models/Demonstration.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn((...a: unknown[]) => mockDemoFindOne(...a)),
    create: jest.fn((...a: unknown[]) => mockDemoCreate(...a)),
    find: jest.fn((...a: unknown[]) => mockDemoFind(...a)),
  },
}));

const mockSlotFindById = jest.fn();
const mockSlotFindOneAndUpdate = jest.fn();
const mockSlotUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
jest.mock('@/lib/models/DemonstrationSlot.model', () => ({
  __esModule: true,
  default: {
    findById: jest.fn((...a: unknown[]) => mockSlotFindById(...a)),
    findOneAndUpdate: jest.fn((...a: unknown[]) => mockSlotFindOneAndUpdate(...a)),
    updateOne: jest.fn((...a: unknown[]) => mockSlotUpdateOne(...a)),
  },
}));

const mockUserFindById = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { findById: jest.fn((...a: unknown[]) => mockUserFindById(...a)) },
}));

jest.mock('@/lib/notifications/notify', () => ({ notify: jest.fn().mockResolvedValue(undefined) }));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth/options', () => ({ authOptions: {} }));

import { getServerSession } from 'next-auth';
import { POST } from '../route';

const STUDENT_SESSION = { user: { id: 'student-001', role: 'STUDENT' } };
const LECTURER_SESSION = { user: { id: 'lecturer-001', role: 'LECTURER' } };
const ENGAGEMENT_ID = '64a1b2c3d4e5f6a7b8c9d0e1';
const SLOT_ID = '64a1b2c3d4e5f6a7b8c9d0e2';

const NOTES =
  'I will show offline capture, the reconnect draining the queue, and the reconciliation. The export is unfinished.';

function futureSlot(overrides: Record<string, unknown> = {}) {
  return {
    _id: SLOT_ID,
    lecturerId: 'lecturer-001',
    institutionId: 'institution-001',
    startsAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    durationMinutes: 45,
    format: 'VIDEO_CALL',
    location: 'https://meet.example.com/x',
    status: SlotStatus.OPEN,
    ...overrides,
  };
}

function engagementIs(status: string): void {
  mockEngagementFindOne.mockReturnValue({
    select: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: ENGAGEMENT_ID,
        status,
        revisionNumber: 0,
        brief: { title: 'Attendance register' },
      }),
    }),
  });
}

function request(body: unknown = { engagementId: ENGAGEMENT_ID, slotId: SLOT_ID, studentNotes: NOTES }) {
  return new NextRequest('http://localhost/api/education/demonstrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/education/demonstrations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(STUDENT_SESSION);
    engagementIs(ProjectStatus.READY_FOR_DEMONSTRATION);
    mockDemoFindOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    mockSlotFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(futureSlot()) });
    mockUserFindById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          firstName: 'Brian',
          lastName: 'Otieno',
          studentData: { institutionId: 'institution-001' },
        }),
      }),
    });
    mockSlotFindOneAndUpdate.mockResolvedValue(futureSlot({ status: SlotStatus.BOOKED }));
    mockDemoCreate.mockImplementation((doc: Record<string, unknown>) => Promise.resolve(doc));
    mockSlotUpdateOne.mockResolvedValue({ modifiedCount: 1 });
  });

  it('books a slot for a student whose report has been accepted', async () => {
    const res = await POST(request());

    expect(res.status).toBe(201);
    expect(mockDemoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        engagementId: ENGAGEMENT_ID,
        studentId: 'student-001',
        lecturerId: 'lecturer-001',
        status: DemonstrationStatus.REQUESTED,
      })
    );
  });

  // The whole point of the ordering: a lecturer reads the report first, so they
  // arrive at the session knowing the project.
  it('refuses a booking before the report has been accepted', async () => {
    engagementIs(ProjectStatus.IN_PROGRESS);

    const res = await POST(request());
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('REPORT_NOT_ACCEPTED');
    expect(mockSlotFindOneAndUpdate).not.toHaveBeenCalled();
  });

  // Without this a student could request every slot a lecturer published and
  // hold the whole cohort's capacity.
  it('refuses a second booking while one is outstanding', async () => {
    mockDemoFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'demo-001', status: DemonstrationStatus.REQUESTED }),
    });

    const res = await POST(request());
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('DEMONSTRATION_ALREADY_REQUESTED');
  });

  it('refuses a slot at another institution as though it did not exist', async () => {
    mockSlotFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(futureSlot({ institutionId: 'institution-999' })),
    });

    const res = await POST(request());

    expect(res.status).toBe(404);
    expect(mockSlotFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('refuses a slot in the past', async () => {
    mockSlotFindById.mockReturnValue({
      lean: jest
        .fn()
        .mockResolvedValue(futureSlot({ startsAt: new Date(Date.now() - 60 * 60 * 1000) })),
    });

    const res = await POST(request());
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('SLOT_IN_PAST');
  });

  it('refuses a slot too soon for the lecturer to have read the report', async () => {
    mockSlotFindById.mockReturnValue({
      lean: jest
        .fn()
        .mockResolvedValue(futureSlot({ startsAt: new Date(Date.now() + 10 * 60 * 1000) })),
    });

    const res = await POST(request());
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('SLOT_TOO_SOON');
  });

  // The failure a scheduling system exists to prevent. Both callers pass every
  // check above; the database decides, and the loser is told plainly.
  it('gives the slot to exactly one of two simultaneous bookings', async () => {
    mockSlotFindOneAndUpdate.mockResolvedValue(null);

    const res = await POST(request());
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(409);
    expect(body.code).toBe('SLOT_NOT_OPEN');
    expect(mockDemoCreate).not.toHaveBeenCalled();
    // The update is conditional on the slot still being open — that condition
    // is the guarantee, not the check that preceded it.
    expect(mockSlotFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: SLOT_ID, status: SlotStatus.OPEN }),
      expect.anything(),
      expect.anything()
    );
  });

  // A slot booked against a demonstration that was never written is invisible
  // wreckage: unbookable, and belonging to nothing.
  it('gives the slot back if the demonstration cannot be written', async () => {
    mockDemoCreate.mockRejectedValue(new Error('write failed'));

    const res = await POST(request());

    expect(res.status).toBe(500);
    expect(mockSlotUpdateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: SLOT_ID }),
      expect.objectContaining({ $set: { status: SlotStatus.OPEN } })
    );
  });

  it('refuses a request that does not say what will be shown', async () => {
    const res = await POST(
      request({ engagementId: ENGAGEMENT_ID, slotId: SLOT_ID, studentNotes: 'ready' })
    );
    const body = (await res.json()) as { code: string };

    expect(res.status).toBe(400);
    expect(body.code).toBe('VALIDATION_FAILED');
  });

  it('refuses another student’s project', async () => {
    mockEngagementFindOne.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });

    const res = await POST(request());

    expect(res.status).toBe(404);
    // Ownership is in the query, so somebody else's project is
    // indistinguishable from one that does not exist.
    expect(mockEngagementFindOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: ENGAGEMENT_ID, studentId: 'student-001' })
    );
  });

  it('returns 403 when a lecturer tries to book', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(LECTURER_SESSION);
    expect((await POST(request())).status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
  });
});
