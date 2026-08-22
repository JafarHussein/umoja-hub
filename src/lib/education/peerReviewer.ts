// Who reads a student's work.
//
// The assignment used to be `User.findOne({ role: STUDENT, ... })` with no sort
// and no exclusion beyond the author, so MongoDB returned the same document
// every time: one student was handed effectively every peer review on the
// platform while everybody else was never asked. Peer review is meant to be
// something the whole cohort does.
//
// The rule now: spread the work by outstanding load, and give a resubmitted
// project a reader who has not already formed a view of it — but never refuse a
// submission for want of a fresh reader.

export interface PeerReviewerCandidate {
  id: string;
  /** Reviews assigned to this student that they have not yet submitted. */
  openAssignments: number;
}

export interface SelectPeerReviewerInput {
  candidates: PeerReviewerCandidate[];
  /** Students who have already reviewed this engagement on an earlier pass. */
  excludeIds?: string[];
  /** Injected so a tie-break is reproducible under test. */
  random?: () => number;
}

/**
 * Pick the reviewer with the least outstanding work, breaking ties at random.
 * Returns `null` only when there is genuinely nobody else to ask.
 */
export function selectPeerReviewer({
  candidates,
  excludeIds = [],
  random = Math.random,
}: SelectPeerReviewerInput): PeerReviewerCandidate | null {
  if (candidates.length === 0) return null;

  // Fresh eyes are preferred, not required: on a small cohort the only
  // available reader may be the one who read the previous revision, and a
  // student must not be blocked from submitting because of that.
  const excluded = new Set(excludeIds);
  const fresh = candidates.filter((c) => !excluded.has(c.id));
  const pool = fresh.length > 0 ? fresh : candidates;

  const lightest = Math.min(...pool.map((c) => c.openAssignments));
  const leastLoaded = pool.filter((c) => c.openAssignments === lightest);

  const index = Math.min(leastLoaded.length - 1, Math.floor(random() * leastLoaded.length));
  return leastLoaded[index] ?? null;
}
