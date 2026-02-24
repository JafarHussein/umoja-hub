/**
 * Peer reviewer assignment algorithm.
 * File: src/lib/educationhub/peerReviewRouter.ts
 * Spec: BUSINESS_LOGIC.md §8
 */

import mongoose from 'mongoose';
import User from '@/lib/models/User.model';
import { StudentTier } from '@/types';

interface EngagementForRouting {
  studentId: string | mongoose.Types.ObjectId;
  tier: string;
  brief?: {
    suggestedTechStack?: string[];
  };
}

/**
 * Returns eligible tiers for a peer reviewer given the submitting student's tier.
 * BEGINNER submitters can be reviewed by any tier.
 * INTERMEDIATE submitters need INTERMEDIATE or ADVANCED.
 * ADVANCED submitters need ADVANCED only.
 */
function eligibleReviewerTiers(studentTier: string): string[] {
  if (studentTier === StudentTier.BEGINNER) {
    return [StudentTier.BEGINNER, StudentTier.INTERMEDIATE, StudentTier.ADVANCED];
  }
  if (studentTier === StudentTier.INTERMEDIATE) {
    return [StudentTier.INTERMEDIATE, StudentTier.ADVANCED];
  }
  return [StudentTier.ADVANCED];
}

/**
 * Assigns a peer reviewer for the given engagement.
 * Returns the selected reviewer's ObjectId, or null if no eligible reviewer is found.
 * A null result means peer review should be waived (PeerReview.status = 'WAIVED').
 */
export async function assignPeerReviewer(
  engagement: EngagementForRouting
): Promise<mongoose.Types.ObjectId | null> {
  const tiers = eligibleReviewerTiers(engagement.tier);
  const techStack = engagement.brief?.suggestedTechStack ?? [];

  const query: Record<string, unknown> = {
    role: 'STUDENT',
    _id: { $ne: engagement.studentId },
    'studentData.currentTier': { $in: tiers },
  };

  // Require at least one tech stack match when the brief specifies one
  if (techStack.length > 0) {
    query['studentData.techStackPreferences'] = {
      $elemMatch: { $in: techStack },
    };
  }

  const candidates = await User.find(query).limit(10).lean();

  if (candidates.length === 0) {
    return null;
  }

  // Random selection among eligible candidates — prevents bias
  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  if (!selected) return null;
  return selected._id as mongoose.Types.ObjectId;
}
