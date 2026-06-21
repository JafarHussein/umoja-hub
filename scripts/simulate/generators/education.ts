// Education hub generator. Walks each student's engagements through the real
// state machine shape (brief → documents → peer review → lecturer review →
// verified/revision/denied), then materialises the portfolio + lecturer
// effectiveness (which no live route fully populates) and employer portfolio
// views. All backdated and causally ordered.

import crypto from 'crypto';
import type { SimContext, World } from '../world';
import { createDoc, pushNotification } from '../helpers';
import { between, daysAgo, daysAfter } from '../clock';
import { PROJECT_TITLES, TECH_STACKS, SKILL_CATEGORIES } from '../dictionaries';
import {
  aiBrief, problemBreakdown, approachPlan, finalReflection,
  blockerEntry, aiUsageEntry, lecturerComment, peerComment,
} from '../text';
import {
  ProjectTrack, ProjectStatus, PeerReviewStatus, LecturerDecision,
  StudentTier, PortfolioStrength, PortfolioVisibility, NotificationType, Role,
} from '../../../src/types';

function sha256(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

interface StudentActivity { engagements: [number, number]; verifyRate: number; }
function activityFor(archetype: string): StudentActivity {
  switch (archetype) {
    case 'high': return { engagements: [2, 4], verifyRate: 0.85 };
    case 'portfolio': return { engagements: [3, 4], verifyRate: 0.9 };
    case 'average': return { engagements: [1, 3], verifyRate: 0.6 };
    case 'revision': return { engagements: [1, 2], verifyRate: 0.3 };
    default: return { engagements: [0, 1], verifyRate: 0 }; // 'new'
  }
}

function strengthFor(count: number): string {
  if (count >= 5) return PortfolioStrength.EXCEPTIONAL;
  if (count >= 3) return PortfolioStrength.STRONG;
  if (count >= 1) return PortfolioStrength.DEVELOPING;
  return PortfolioStrength.BUILDING;
}

interface LecturerStat {
  total: number; verified: number; revision: number; denied: number;
  scoreSum: number; scoreCount: number; lastAt: Date;
}

let slugSeq = 0;

export async function generateEducation(ctx: SimContext, world: World): Promise<void> {
  const { rng, ledger } = ctx;
  if (world.students.length < 2 || world.lecturers.length === 0) return;

  const { default: User } = await import('../../../src/lib/models/User.model');
  const { default: ProjectEngagement } = await import('../../../src/lib/models/ProjectEngagement.model');
  const { default: PeerReview } = await import('../../../src/lib/models/PeerReview.model');
  const { default: LecturerReview } = await import('../../../src/lib/models/LecturerReview.model');
  const { default: LecturerEffectiveness } = await import('../../../src/lib/models/LecturerEffectiveness.model');
  const { default: StudentPortfolioStatus } = await import('../../../src/lib/models/StudentPortfolioStatus.model');
  const { default: VerificationAuditLog } = await import('../../../src/lib/models/VerificationAuditLog.model');
  const { default: PortfolioView } = await import('../../../src/lib/models/PortfolioView.model');

  const lecturerStats = new Map<string, LecturerStat>();

  for (const student of world.students) {
    const activity = activityFor(student.archetype);
    const tier = rng.pick([StudentTier.BEGINNER, StudentTier.INTERMEDIATE, StudentTier.ADVANCED]);
    const verifiedProjects: Record<string, unknown>[] = [];
    const verifiedSkills: Record<string, unknown>[] = [];
    const techStacksUsed = new Set<string>();
    const reviewerInstitutions = new Set<string>();
    const scores: number[] = [];

    const n = rng.int(activity.engagements[0], activity.engagements[1]);
    for (let e = 0; e < n; e++) {
      const title = rng.pick(PROJECT_TITLES);
      const stack = rng.sample(TECH_STACKS, rng.int(2, 4));
      const track = rng.bool(0.6) ? ProjectTrack.AI_BRIEF : ProjectTrack.OPEN_SOURCE;
      const startedAt = between(rng, student.joinedAt, daysAgo(5));

      // Decide terminal state.
      const reviewable = student.archetype !== 'new' && rng.bool(0.85);
      let decision: string | null = null;
      if (reviewable) {
        if (rng.bool(activity.verifyRate)) decision = LecturerDecision.VERIFIED;
        else decision = rng.bool(0.8) ? LecturerDecision.REVISION_REQUIRED : LecturerDecision.DENIED;
      }

      const pbAt = daysAfter(startedAt, rng.int(1, 4));
      const apAt = daysAfter(pbAt, rng.int(1, 3));
      const frAt = daysAfter(apAt, rng.int(2, 8));
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
        : rng.pick([ProjectStatus.IN_PROGRESS, ProjectStatus.BRIEF_GENERATED, ProjectStatus.UNDER_PEER_REVIEW]);

      const engagement = ledger.track('ProjectEngagement', await createDoc(ProjectEngagement, {
        studentId: student.id, track, tier,
        status,
        brief: track === ProjectTrack.AI_BRIEF ? aiBrief(rng, title, tier) : { title, repo: 'open-source issue', tier },
        githubRepoUrl: track === ProjectTrack.OPEN_SOURCE ? `https://github.com/oss/${title.split(' ')[0]?.toLowerCase()}` : undefined,
        githubRepoName: track === ProjectTrack.OPEN_SOURCE ? title.split(' ')[0] : undefined,
        documents,
        githubSnapshot: { commitCount: rng.int(8, 60), lastCommitHash: sha256(title).slice(0, 12), commitTimelineHash: sha256(title + 'tl').slice(0, 16), snapshotAt: frAt },
        verifiedAt: decision === LecturerDecision.VERIFIED ? daysAfter(frAt, rng.int(2, 6)) : undefined,
        createdAt: startedAt,
        updatedAt: decision ? daysAfter(frAt, rng.int(2, 6)) : frAt,
      }));

      if (!decision) continue;

      // Peer review by a different student.
      const reviewer = rng.pick(world.students.filter((s) => s.id !== student.id));
      const peerAt = daysAfter(frAt, rng.int(1, 3));
      const peerGood = rng.bool(0.7);
      const peer = ledger.track('PeerReview', await createDoc(PeerReview, {
        engagementId: engagement._id, reviewerId: reviewer.id, submittedAt: peerAt,
        status: PeerReviewStatus.SUBMITTED,
        scores: { codeQuality: rng.int(peerGood ? 3 : 2, 5), documentationClarity: rng.int(peerGood ? 3 : 2, 5) },
        comments: { codeQuality: peerComment(rng, peerGood), documentationClarity: peerComment(rng, peerGood) },
        createdAt: daysAfter(frAt, 1), updatedAt: peerAt,
      }));

      // Lecturer review.
      const lecturer = rng.pick(world.lecturers);
      const lecAt = daysAfter(peerAt, rng.int(1, 5));
      const verified = decision === LecturerDecision.VERIFIED;
      const baseLo = verified ? 3 : decision === LecturerDecision.DENIED ? 1 : 2;
      const baseHi = verified ? 5 : decision === LecturerDecision.DENIED ? 3 : 4;
      const sc = {
        problemUnderstanding: rng.int(baseLo, baseHi),
        solutionQuality: rng.int(baseLo, baseHi),
        processQuality: rng.int(baseLo, baseHi),
        aiUsage: rng.int(baseLo, baseHi),
      };
      const lecReview = ledger.track('LecturerReview', await createDoc(LecturerReview, {
        engagementId: engagement._id, lecturerId: lecturer.id, decision,
        scores: sc,
        comments: {
          problemUnderstanding: lecturerComment(rng, 'problemUnderstanding', verified),
          solutionQuality: lecturerComment(rng, 'solutionQuality', verified),
          processQuality: lecturerComment(rng, 'processQuality', verified),
          aiUsage: lecturerComment(rng, 'aiUsage', verified),
          overallFeedback: verified ? 'Strong, honest work — verified.' : 'See per-dimension feedback.',
        },
        rejectionReason: decision === LecturerDecision.DENIED ? 'The submission did not meet the verification bar for this tier.' : undefined,
        createdAt: lecAt, updatedAt: lecAt,
      }));

      await ProjectEngagement.updateOne({ _id: engagement._id }, { $set: { peerReviewId: peer._id, lecturerReviewId: lecReview._id } });

      // Verification audit log (immutable trail).
      ledger.track('VerificationAuditLog', await createDoc(VerificationAuditLog, {
        engagementId: engagement._id, studentId: student.id, lecturerId: lecturer.id, decision,
        documentHashes: { problemBreakdown: documents.problemBreakdown.hash, approachPlan: documents.approachPlan.hash, finalReflection: documents.finalReflection.hash },
        githubSnapshot: { commitCount: rng.int(8, 60), lastCommitHash: sha256(title).slice(0, 12), commitTimelineHash: sha256(title + 'tl').slice(0, 16) },
        reviewScores: sc,
        recordedAt: lecAt,
      }));

      // Lecturer effectiveness accumulation.
      const lid = String(lecturer.id);
      const stat = lecturerStats.get(lid) ?? { total: 0, verified: 0, revision: 0, denied: 0, scoreSum: 0, scoreCount: 0, lastAt: lecAt };
      stat.total += 1;
      if (verified) stat.verified += 1;
      else if (decision === LecturerDecision.DENIED) stat.denied += 1;
      else stat.revision += 1;
      const avgSc = (sc.problemUnderstanding + sc.solutionQuality + sc.processQuality + sc.aiUsage) / 4;
      stat.scoreSum += avgSc; stat.scoreCount += 1;
      if (lecAt > stat.lastAt) stat.lastAt = lecAt;
      lecturerStats.set(lid, stat);

      await pushNotification(ledger, {
        userId: student.id, type: NotificationType.REVIEW_UPDATE,
        title: verified ? 'Project verified' : decision === LecturerDecision.DENIED ? 'Project not verified' : 'Revision requested',
        body: verified ? 'A lecturer verified your project. It now counts toward your portfolio.' : 'A lecturer reviewed your project — see the feedback.',
        relatedEntity: { kind: 'ProjectEngagement', id: engagement._id }, createdAt: lecAt,
      });

      if (verified) {
        const lecturerInstitution = world.institutions.find((i) => i.county === lecturer.county)?.name ?? world.institutions[0]?.name;
        verifiedProjects.push({ engagementId: engagement._id, title, tier, techStack: stack, verifiedAt: daysAfter(frAt, rng.int(2, 6)), averageScore: Math.round(avgSc * 10) / 10, lecturerInstitution });
        for (const skill of stack) {
          techStacksUsed.add(skill);
          if (!verifiedSkills.some((s) => s.skillName === skill)) {
            verifiedSkills.push({ skillName: skill, category: SKILL_CATEGORIES[skill] ?? 'General', tierDemonstrated: tier, firstVerifiedAt: daysAfter(frAt, rng.int(2, 6)), projectTitle: title, engagementId: engagement._id });
          }
        }
        if (lecturerInstitution) reviewerInstitutions.add(lecturerInstitution);
        scores.push(avgSc);
      }
    }

    // Portfolio status.
    const verifiedCount = verifiedProjects.length;
    const isPublic = verifiedCount > 0;
    slugSeq++;
    const slug = `${student.firstName}-${student.lastName}-${slugSeq}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
    ledger.track('StudentPortfolioStatus', await createDoc(StudentPortfolioStatus, {
      studentId: student.id, currentTier: tier, portfolioStrength: strengthFor(verifiedCount),
      verifiedProjects, verifiedSkills,
      tierProgressionTimeline: [{ tier: StudentTier.BEGINNER, unlockedAt: student.joinedAt }],
      stats: {
        verifiedProjectCount: verifiedCount, totalProjectCount: n,
        averageScore: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0,
        techStacksUsed: [...techStacksUsed], reviewerInstitutions: [...reviewerInstitutions],
      },
      visibility: isPublic ? PortfolioVisibility.PUBLIC : PortfolioVisibility.PRIVATE,
      publicSlug: isPublic ? slug : undefined,
      lastRecalculatedAt: new Date(),
      createdAt: student.joinedAt, updatedAt: new Date(),
    }));

    await User.updateOne({ _id: student.id }, { $set: { 'studentData.completedProjectCount': verifiedCount, 'studentData.currentTier': tier } });

    // Employer views of public portfolios.
    if (isPublic && world.employers.length > 0) {
      const viewers = rng.sample(world.employers, rng.int(0, Math.min(3, world.employers.length)));
      for (const emp of viewers) {
        const viewedAt = between(rng, daysAgo(45), daysAgo(0));
        ledger.track('PortfolioView', await createDoc(PortfolioView, {
          studentId: student.id, viewerId: emp.id, viewerRole: Role.EMPLOYER, viewedAt,
        }));
        await pushNotification(ledger, {
          userId: student.id, type: NotificationType.PORTFOLIO_VIEW,
          title: 'An employer viewed your portfolio',
          body: 'Your public portfolio was opened by an employer on UmojaHub.',
          relatedEntity: { kind: 'User', id: student.id }, createdAt: viewedAt,
        });
      }
    }
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
