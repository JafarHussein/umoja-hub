/**
 * @jest-environment node
 */

import { Types } from 'mongoose';

const mockUserFind = jest.fn();
jest.mock('@/lib/models/User.model', () => ({
  __esModule: true,
  default: { find: jest.fn((...a: unknown[]) => mockUserFind(...a)) },
}));

import { cohortStudentIds } from '../cohort';
import { Role } from '@/types';

const INSTITUTION_ID = new Types.ObjectId();
const STUDENT_IDS = [new Types.ObjectId(), new Types.ObjectId()];

function findReturns(ids: Types.ObjectId[]): void {
  mockUserFind.mockReturnValue({ distinct: jest.fn().mockResolvedValue(ids) });
}

describe('cohortStudentIds', () => {
  beforeEach(() => jest.clearAllMocks());

  it('matches students by their institution document', async () => {
    findReturns(STUDENT_IDS);

    const ids = await cohortStudentIds({ institutionId: INSTITUTION_ID });

    expect(ids).toEqual(STUDENT_IDS);
    expect(mockUserFind).toHaveBeenCalledWith({
      role: Role.STUDENT,
      $or: [{ 'studentData.institutionId': INSTITUTION_ID }],
    });
  });

  it('also matches on the affiliation string, for accounts recorded before institutions', async () => {
    findReturns(STUDENT_IDS);

    await cohortStudentIds({
      institutionId: INSTITUTION_ID,
      universityAffiliation: 'University of Nairobi',
    });

    expect(mockUserFind).toHaveBeenCalledWith({
      role: Role.STUDENT,
      $or: [
        { 'studentData.institutionId': INSTITUTION_ID },
        { 'studentData.universityAffiliation': 'University of Nairobi' },
      ],
    });
  });

  // Null, not []: there is no honest answer for an unscopeable lecturer, and
  // the callers must be able to tell that apart from "nobody is enrolled".
  it('returns null when the lecturer has no institution at all', async () => {
    expect(await cohortStudentIds({})).toBeNull();
    expect(await cohortStudentIds(undefined)).toBeNull();
    expect(mockUserFind).not.toHaveBeenCalled();
  });

  it('returns an empty list when the institution has no students yet', async () => {
    findReturns([]);

    expect(await cohortStudentIds({ institutionId: INSTITUTION_ID })).toEqual([]);
  });
});
