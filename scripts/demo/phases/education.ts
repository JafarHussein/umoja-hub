// Education hub generator. Walks each student's engagements through the real
// state machine shape (brief → documents → peer review → lecturer review →
// verified/revision/denied), then materialises lecturer effectiveness (which no
// live route fully populates). All backdated and causally ordered.

import crypto from 'crypto';
import type { SimContext, World } from '../world';
import { createDoc, pushNotification } from '../helpers';
import { between, daysAgo, daysAfter } from '../clock';
import { PROJECT_TITLES, TECH_STACKS, OSS_REPOSITORIES } from '../dictionaries';
import {
  aiBrief, openSourceBrief, problemBreakdown, approachPlan, finalReflection,
  blockerEntry, aiUsageEntry, lecturerComment, peerComment,
} from '../text';
import {
  ProjectTrack, ProjectStatus, PeerReviewStatus, LecturerDecision,
  StudentTier, NotificationType,
} from '../../../src/types';

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

interface StudentActivity { engagements: [number, number]; verifyRate: number; }
function activityFor(archetype: string): StudentActivity {
  switch (archetype) {
    case 'high': return { engagements: [2, 4], verifyRate: 0.85 };
    case 'prolific': return { engagements: [3, 4], verifyRate: 0.9 };
    case 'average': return { engagements: [1, 3], verifyRate: 0.6 };
    case 'revision': return { engagements: [1, 2], verifyRate: 0.3 };
    default: return { engagements: [0, 1], verifyRate: 0 }; // 'new'
  }
}

interface LecturerStat {
  total: number; verified: number; revision: number; denied: number;
  scoreSum: number; scoreCount: number; lastAt: Date;
}

export async function generateEducation(ctx: SimContext, world: World): Promise<void> {
  const { rng, ledger, batcher } = ctx;
  if (world.students.length < 2 || world.lecturers.length === 0) return;

  const { default: User } = await import('../../../src/lib/models/User.model');
  const { default: ProjectEngagement } = await import('../../../src/lib/models/ProjectEngagement.model');
  const { default: PeerReview } = await import('../../../src/lib/models/PeerReview.model');
  const { default: LecturerReview } = await import('../../../src/lib/models/LecturerReview.model');
  const { default: LecturerEffectiveness } = await import('../../../src/lib/models/LecturerEffectiveness.model');
  const { default: VerificationAuditLog } = await import('../../../src/lib/models/VerificationAuditLog.model');

  const lecturerStats = new Map<string, LecturerStat>();
  // Every institution's lecturers must open their queue and find work in it.
  // Left to chance, a whole university's queue comes up empty — which is what
  // the presenter would discover in front of the panel.
  const institutionsWithQueuedWork = new Set<string>();

  for (const student of world.students) {
    const activity = activityFor(student.archetype);
    const tier = rng.pick([StudentTier.BEGINNER, StudentTier.INTERMEDIATE, StudentTier.ADVANCED]);
    let verifiedCount = 0;

    // A lecturer may only review their own institution's students, so this
    // student's work can only reach a review if their institution has a
    // verified lecturer. Where it does not, their projects stay in the states
    // before review rather than being judged by a stranger the application
    // would never have shown the work to.
    const faculty = world.lecturers.filter(
      (l) => l.institutionId && String(l.institutionId) === String(student.institutionId)
    );

    // Peers, in the order the application would choose them: a reader from the
    // student's own cohort where one exists, anyone else where it does not.
    const others = world.students.filter((s) => s.id !== student.id);
    const cohort = others.filter((s) => String(s.institutionId) === String(student.institutionId));
    const peerPool = cohort.length > 0 ? cohort : others;

    const n = rng.int(activity.engagements[0], activity.engagements[1]);
    for (let e = 0; e < n; e++) {
      const title = rng.pick(PROJECT_TITLES);
      const stack = rng.sample(TECH_STACKS, rng.int(2, 4));
      const track = rng.bool(0.6) ? ProjectTrack.AI_BRIEF : ProjectTrack.OPEN_SOURCE;
      const startedAt = between(rng, student.joinedAt, daysAgo(5));
      const repo = track === ProjectTrack.OPEN_SOURCE ? rng.pick(OSS_REPOSITORIES) : null;

      // Where this engagement came to rest. A reviewed project carries a
      // lecturer decision; a share of the rest are still sitting in front of a
      // lecturer. That last state was never generated before, which is why the
      // review queue — the centrepiece of the lecturer's day — was structurally
      // empty in every demonstration.
      const reviewable = faculty.length > 0 && student.archetype !== 'new' && rng.bool(0.85);
      const institutionKey = String(student.institutionId);
      const firstForInstitution =
        faculty.length > 0 && !institutionsWithQueuedWork.has(institutionKey);
      let decision: string | null = null;
      let awaitingLecturer = false;
      if (reviewable) {
        if (firstForInstitution || rng.bool(0.22)) awaitingLecturer = true;
        else if (rng.bool(activity.verifyRate)) decision = LecturerDecision.VERIFIED;
        else decision = rng.bool(0.8) ? LecturerDecision.REVISION_REQUIRED : LecturerDecision.DENIED;
      }
      if (awaitingLecturer) institutionsWithQueuedWork.add(institutionKey);

      const pbAt = daysAfter(startedAt, rng.int(1, 4));
      const apAt = daysAfter(pbAt, rng.int(1, 3));
      const frAt = daysAfter(apAt, rng.int(2, 8));
      const peerAt = daysAfter(frAt, rng.int(1, 3));
      const pb = problemBreakdown(title);
      const ap = approachPlan(stack);
      const fr = finalReflection(title);

      const documents = {
        problemBreakdown: { content: pb, hash: sha256(pb), submittedAt: pbAt },
        approachPlan: { content: ap, hash: sha256(ap), submittedAt: apAt },
        blockerLog: Array.from({ length: rng.int(1, 3) }, () => ({ ...blockerEntry(rng), loggedAt: daysAfter(pbAt, rng.int(1, 5)) })),
        aiUsageLog: Array.from({ length: rng.int(1, 3) }, () => ({ ...aiUsageEntry(rng), loggedAt: daysAfter(pbAt, rng.int(1, 5)) })),
        finalReflection: { content: fr, hash: sha256(fr), submittedAt: frAt },
      };

      const status = decision
        ? (decision === LecturerDecision.VERIFIED ? ProjectStatus.VERIFIED
          : decision === LecturerDecision.DENIED ? ProjectStatus.DENIED : ProjectStatus.REVISION_REQUIRED)
        : awaitingLecturer
          ? ProjectStatus.UNDER_LECTURER_REVIEW
          : rng.pick([ProjectStatus.IN_PROGRESS, ProjectStatus.BRIEF_GENERATED, ProjectStatus.UNDER_PEER_REVIEW]);

      const engagement = ledger.track('ProjectEngagement', await createDoc(ProjectEngagement, {
        studentId: student.id, track, tier,
        status,
        brief: repo ? openSourceBrief(repo.url, repo.name) : aiBrief(rng, title, tier, stack),
        githubRepoUrl: repo?.url,
        githubRepoName: repo?.name,
        documents,
        // No githubSnapshot. The application has no GitHub API integration, so
        // nothing in production can ever populate commit counts or hashes.
        // Seeding them fabricated evidence the platform cannot produce, and a
        // demonstration would have shown a panel commit history that was
        // invented here. A repository link is recorded; nothing is claimed
        // about what is inside it.
        verifiedAt: decision === LecturerDecision.VERIFIED ? daysAfter(frAt, rng.int(2, 6)) : undefined,
        createdAt: startedAt,
        updatedAt: decision ? daysAfter(frAt, rng.int(2, 6)) : awaitingLecturer ? peerAt : frAt,
      }));

      if (!decision && !awaitingLecturer) continue;

      // Peer review by a different student. It is submitted in both cases —
      // an engagement only reaches a lecturer once a peer has read it.
      const reviewer = rng.pick(peerPool);
      const peerGood = rng.bool(0.7);
      const peer = ledger.track('PeerReview', await createDoc(PeerReview, {
        engagementId: engagement._id, reviewerId: reviewer.id, submittedAt: peerAt,
        status: PeerReviewStatus.SUBMITTED,
        scores: { codeQuality: rng.int(peerGood ? 3 : 2, 5), documentationClarity: rng.int(peerGood ? 3 : 2, 5) },
        comments: { codeQuality: peerComment(rng, peerGood), documentationClarity: peerComment(rng, peerGood) },
        createdAt: daysAfter(frAt, 1), updatedAt: peerAt,
      }));

      // Still in front of a lecturer: the peer has read it, nobody has judged it
      // yet. This is the record the review queue is built from.
      if (!decision) {
        await ProjectEngagement.updateOne({ _id: engagement._id }, { $set: { peerReviewId: peer._id } });
        continue;
      }

      await ProjectEngagement.updateOne({ _id: engagement._id }, { $set: { peerReviewId: peer._id } });

      // One pass of the review cycle: a lecturer judges the work as it stands at
      // this revision, and everything that follows from the judgement is
      // recorded — the immutable audit entry, the lecturer's effectiveness, and
      // the student's notification.
      const reviewPass = async (revisionNumber: number, passDecision: string, at: Date): Promise<void> => {
        const lecturer = rng.pick(faculty);
        const passVerified = passDecision === LecturerDecision.VERIFIED;
        const baseLo = passVerified ? 3 : passDecision === LecturerDecision.DENIED ? 1 : 2;
        const baseHi = passVerified ? 5 : passDecision === LecturerDecision.DENIED ? 3 : 4;
        const sc = {
          problemUnderstanding: rng.int(baseLo, baseHi),
          solutionQuality: rng.int(baseLo, baseHi),
          processQuality: rng.int(baseLo, baseHi),
          aiUsage: rng.int(baseLo, baseHi),
        };
        const lecReview = ledger.track('LecturerReview', await createDoc(LecturerReview, {
          engagementId: engagement._id, lecturerId: lecturer.id, revisionNumber, decision: passDecision,
          scores: sc,
          comments: {
            problemUnderstanding: lecturerComment(rng, 'problemUnderstanding', passVerified),
            solutionQuality: lecturerComment(rng, 'solutionQuality', passVerified),
            processQuality: lecturerComment(rng, 'processQuality', passVerified),
            aiUsage: lecturerComment(rng, 'aiUsage', passVerified),
            overallFeedback: passVerified
              ? revisionNumber > 0
                ? 'The revisions addressed the feedback — verified.'
                : 'Strong, honest work — verified.'
              : 'See per-dimension feedback.',
          },
          rejectionReason: passDecision === LecturerDecision.DENIED ? 'The submission did not meet the verification bar for this tier.' : undefined,
          createdAt: at, updatedAt: at,
        }));

        await ProjectEngagement.updateOne({ _id: engagement._id }, { $set: { lecturerReviewId: lecReview._id } });

        // Verification audit log (immutable trail).
        batcher.add(VerificationAuditLog, 'VerificationAuditLog', {
          engagementId: engagement._id, studentId: student.id, lecturerId: lecturer.id, decision: passDecision,
          documentHashes: { problemBreakdown: documents.problemBreakdown.hash, approachPlan: documents.approachPlan.hash, finalReflection: documents.finalReflection.hash },
          // No githubSnapshot — see the note on the engagement above. The live
          // route writes zeros here because nothing gathers commit evidence; the
          // seeder must not claim more than the platform can.
          reviewScores: sc,
          recordedAt: at,
        });

        // Lecturer effectiveness accumulation.
        const lid = String(lecturer.id);
        const stat = lecturerStats.get(lid) ?? { total: 0, verified: 0, revision: 0, denied: 0, scoreSum: 0, scoreCount: 0, lastAt: at };
        stat.total += 1;
        if (passVerified) stat.verified += 1;
        else if (passDecision === LecturerDecision.DENIED) stat.denied += 1;
        else stat.revision += 1;
        const avgSc = (sc.problemUnderstanding + sc.solutionQuality + sc.processQuality + sc.aiUsage) / 4;
        stat.scoreSum += avgSc; stat.scoreCount += 1;
        if (at > stat.lastAt) stat.lastAt = at;
        lecturerStats.set(lid, stat);

        await pushNotification(batcher, {
          userId: student.id, type: NotificationType.REVIEW_UPDATE,
          title: passVerified ? 'Project verified' : passDecision === LecturerDecision.DENIED ? 'Project not verified' : 'Revision requested',
          body: passVerified ? 'A lecturer signed off your project.' : 'A lecturer reviewed your project — see the feedback.',
          relatedEntity: { kind: 'ProjectEngagement', id: engagement._id }, createdAt: at,
        });

        if (passVerified) verifiedCount++;
      };

      const lecAt = daysAfter(peerAt, rng.int(1, 5));
      await reviewPass(0, decision, lecAt);

      // Some of the students asked to revise went back and did the work. This
      // is the loop the whole Hub exists for — feedback, revision, a second
      // reading — and until the revision transition existed the platform could
      // not represent it at all, so no demonstration could ever show it.
      if (decision === LecturerDecision.REVISION_REQUIRED && rng.bool(0.5)) {
        const resumedAt = daysAfter(lecAt, rng.int(1, 4));
        const rePeerAt = daysAfter(resumedAt, rng.int(4, 12));
        const reReviewer = rng.pick(peerPool);
        const rePeer = ledger.track('PeerReview', await createDoc(PeerReview, {
          engagementId: engagement._id, reviewerId: reReviewer.id, submittedAt: rePeerAt,
          status: PeerReviewStatus.SUBMITTED,
          scores: { codeQuality: rng.int(3, 5), documentationClarity: rng.int(3, 5) },
          comments: { codeQuality: peerComment(rng, true), documentationClarity: peerComment(rng, true) },
          createdAt: daysAfter(resumedAt, 1), updatedAt: rePeerAt,
        }));

        const reLecAt = daysAfter(rePeerAt, rng.int(1, 5));
        const secondDecision = rng.bool(0.75) ? LecturerDecision.VERIFIED : LecturerDecision.REVISION_REQUIRED;
        await reviewPass(1, secondDecision, reLecAt);

        await ProjectEngagement.updateOne({ _id: engagement._id }, {
          $set: {
            revisionNumber: 1,
            peerReviewId: rePeer._id,
            status: secondDecision === LecturerDecision.VERIFIED ? ProjectStatus.VERIFIED : ProjectStatus.REVISION_REQUIRED,
            ...(secondDecision === LecturerDecision.VERIFIED ? { verifiedAt: daysAfter(reLecAt, rng.int(1, 3)) } : {}),
            updatedAt: reLecAt,
          },
        });
      }
    }

    await User.updateOne({ _id: student.id }, { $set: { 'studentData.completedProjectCount': verifiedCount, 'studentData.currentTier': tier } });
  }

  // Write lecturer effectiveness aggregates.
  for (const [lid, stat] of lecturerStats) {
    ledger.track('LecturerEffectiveness', await createDoc(LecturerEffectiveness, {
      lecturerId: lid,
      totalReviews: stat.total, verifiedCount: stat.verified, deniedCount: stat.denied, revisionCount: stat.revision,
      averageScoresGiven: { overall: stat.scoreCount ? Math.round((stat.scoreSum / stat.scoreCount) * 10) / 10 : 0 },
      averageCommentWordCount: 28,
      lastReviewAt: stat.lastAt,
    }));
  }
}
