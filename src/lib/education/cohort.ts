import type mongoose from 'mongoose';
import { Role } from '@/types';

// Which students a lecturer is responsible for.
//
// Every lecturer surface — the review queue, the review detail, the decision
// itself — used to be scoped by status alone, so a verified lecturer at one
// university was offered, could open, and could pass judgement on the work of
// students at another. The vision has the lecturer as *this* student's
// engineering mentor; the institution they were verified against is the line
// that makes that true in the data.

export interface LecturerInstitution {
  institutionId?: mongoose.Types.ObjectId | undefined;
  universityAffiliation?: string | undefined;
}

/**
 * The ids of the students in this lecturer's institution.
 *
 * Returns `null` — meaningfully different from an empty array — when the
 * lecturer has no institution on record at all. There is no honest answer to
 * "whose work is this lecturer responsible for?" in that case, and falling back
 * to "everybody's" is the defect this exists to prevent.
 */
export async function cohortStudentIds(
  lecturerData: LecturerInstitution | undefined
): Promise<mongoose.Types.ObjectId[] | null> {
  if (!lecturerData) return null;

  // The Institution document is the trust anchor; the affiliation string is the
  // fallback for accounts recorded before institutions were first-class.
  const match: Record<string, unknown>[] = [];
  if (lecturerData.institutionId) {
    match.push({ 'studentData.institutionId': lecturerData.institutionId });
  }
  if (lecturerData.universityAffiliation) {
    match.push({ 'studentData.universityAffiliation': lecturerData.universityAffiliation });
  }
  if (match.length === 0) return null;

  const { default: User } = await import('@/lib/models/User.model');
  return User.find({ role: Role.STUDENT, $or: match } as object).distinct('_id');
}
