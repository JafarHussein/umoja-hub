// Education hub generator. Walks each student's engagements through the real
// state machine shape (brief → documents → peer review → lecturer review →
// verified/revision/denied), then materialises lecturer effectiveness (which no
// live route fully populates). All backdated and causally ordered.

import type mongoose from 'mongoose';
import type { SimContext, World } from '../world';
import type { Rng } from '../rng';
import { createDoc, pushNotification } from '../helpers';
import { between, daysAgo, daysAfter } from '../clock';
import { PROJECT_TITLES, TECH_STACKS, OSS_REPOSITORIES, LECTURER_PROJECTS } from '../dictionaries';
import {
  aiBrief, openSourceBrief, assignedBrief,
  blockerEntry, aiUsageEntry, lecturerComment, peerComment,
} from '../text';
import { reportSections } from '../content/reportContent';
import { buildReportPdf, type ReportPdfSection } from '../content/reportPdf';
import { REPORT_SECTIONS } from '../../../src/lib/education/reportStandard';
import { uploadDemoReport } from '../documents';
import type { SeedAcademicAnchor } from '../text';
import {
  spineFor, SELF_DECLARED_PROGRAMME_NAMES, PROGRAMME_SEMESTERS_PER_YEAR,
} from '../content/curriculum';
import {
  ProjectTrack, ProjectStatus, PeerReviewStatus, LecturerDecision,
  NotificationType, AcademicDiscipline, AcademicProvenance, ACADEMIC_PROVENANCE_LABEL,
  AssignmentAudience, AssignmentStatus, SubmissionStatus, DocumentationOutcome,
  DOCUMENTATION_CHECKLIST,
} from '../../../src/types';

/**
 * How many reports must still be sitting in a lecturer's review queue when the
 * seed finishes, after the demonstration phase has taken its share.
 *
 * Three, because one is what the readiness audit of 2026-08-24 emptied by
 * rehearsing the review once — leaving the Education Hub's centrepiece screen
 * reading "Nothing waiting on you" for the presentation itself. Rehearsing is
 * the correct thing for a presenter to do, so the world has to survive it.
 *
 * Asserted after every seed by `the review queue survives a rehearsal`.
 */
export const REVIEW_QUEUE_SURVIVAL_FLOOR = 3;

/**
 * How many queued reports the demonstration phase promotes away per lecturer —
 * one into a request waiting, one into a session coming up.
 *
 * It lives here because the education phase has to queue enough work to feed it
 * and still leave the floor above. The two phases disagreeing is precisely how
 * the queue came to hold a single report.
 */
export const DEMONSTRATIONS_PROMOTED_PER_LECTURER = 2;

// The Kenyan settings a seeded report is written against. Kept beside the rest
// of the seeder's vocabulary rather than in the content module.
const REPORT_SETTINGS = [
  'a county health facility',
  'a rural technical training institute',
  'a matatu sacco',
  'a dairy collection cooperative',
  'a community pharmacy chain',
  'a school administration office',
  'a smallholder irrigation scheme',
];

/** A filename a student would recognise as their own. */
function slugForFile(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'project'
  );
}

/**
 * The prose, in the standard's order and under the standard's headings.
 *
 * Ordered by `REPORT_SECTIONS` rather than by the object's key order, so a
 * seeded document reads in the sequence the standard actually specifies — which
 * is the sequence the lecturer's checklist walks in when they read it.
 */
function reportPdfSections(sections: Record<string, string>): ReportPdfSection[] {
  return REPORT_SECTIONS.filter((spec) => Boolean(sections[spec.key])).map((spec) => ({
    heading: `${spec.number}. ${spec.label}`,
    body: sections[spec.key] as string,
  }));
}

/**
 * A lecturer's decision on one seeded version.
 *
 * The checklist is answered in full for an accepted report and left with real
 * gaps on one sent back, because the gaps are what the student is being sent
 * back about. Nothing here is generated at random beyond which sentence is
 * used: a demo that showed a lecturer ticking thirteen boxes and then asking
 * for changes would read as noise.
 */
function seededReview(
  rng: Rng,
  lecturerId: mongoose.Types.ObjectId,
  outcome: DocumentationOutcome,
  reviewedAt: Date
): Record<string, unknown> {
  const accepted = outcome === DocumentationOutcome.READY_FOR_DEMONSTRATION;
  const unmet = accepted ? [] : ['architectureDocumented', 'testingDocumented', 'resultsPresented'];

  const lo = accepted ? 3 : 2;
  const hi = accepted ? 5 : 3;

  return {
    lecturerId,
    outcome,
    scores: {
      problemUnderstanding: rng.int(lo, hi),
      solutionQuality: rng.int(lo, hi),
      processQuality: rng.int(lo, hi),
      aiUsage: rng.int(lo, hi),
    },
    summary: accepted
      ? 'This reads as an account of a system you built rather than a description of a category, which is the hardest part and you have done it. The architecture section carries its own weight and the limitations are honest. Bring the parts you are least sure about to the demonstration — I will ask about the data model before anything else.'
      : 'You have clearly built something, but the report does not yet show me that you understand why you built it the way you did. The architecture section describes a pattern rather than your system, and the testing section sets out a strategy with no results in it. Both have to change before this is worth demonstrating against.',
    ...(accepted
      ? {
          strengths:
            'The problem statement is specific and the scope section says what you deliberately left out, which most reports do not.',
        }
      : {
          concerns:
            'Several figures are referred to in the text but are not in the document.',
          requiredChanges:
            'Rewrite the architecture section around the components you actually built and say why each is separate. Add the test results — what passed, what failed, and what you changed as a result. Include the figures you refer to.',
        }),
    questionsForDemonstration: accepted
      ? 'Why this data model rather than a normalised one, and what happens to the system when the network drops mid-transaction.'
      : undefined,
    pageNotes: accepted
      ? []
      : [
          { page: rng.int(8, 14), comment: 'This is the textbook definition. What is your architecture?' },
          { page: rng.int(18, 26), comment: 'A test plan, not test results. What actually ran?' },
        ],
    checklist: DOCUMENTATION_CHECKLIST.map((item) => ({
      item,
      met: !unmet.includes(item),
    })),
    reviewedAt,
  };
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

// How far along a student would plausibly be, used wherever the seeder has to
// name one student rather than leave a guarantee to the dice.
const ACTIVITY_RANK: Record<string, number> = {
  prolific: 4,
  high: 3,
  average: 2,
  revision: 1,
  new: 0,
};

interface LecturerStat {
  total: number; verified: number; revision: number; denied: number;
  scoreSum: number; scoreCount: number; lastAt: Date;
}

export interface StudentAcademics {
  anchor: SeedAcademicAnchor;
  interest: string;
}

// Every student is studying something, whether or not their university has
// published a curriculum here. Both provenances therefore exist in the demo
// world: a student at UoN or JKUAT picks their semester off the published
// programme, and a student at Strathmore or Moi types the same facts out. The
// second is the majority case in Kenya today, so a demonstration that only ever
// showed the first would be showing a product we do not have.
async function generateEnrolments(
  ctx: SimContext,
  world: World
): Promise<Map<string, StudentAcademics>> {
  const { rng, ledger } = ctx;

  const { default: AcademicProgramme } = await import('../../../src/lib/models/AcademicProgramme.model');
  const { default: CurriculumUnit } = await import('../../../src/lib/models/CurriculumUnit.model');
  const { default: StudentEnrolment } = await import('../../../src/lib/models/StudentEnrolment.model');

  const { default: User } = await import('../../../src/lib/models/User.model');

  const programmes = await AcademicProgramme.find({}).lean();
  const units = await CurriculumUnit.find({}).lean();
  const academics = new Map<string, StudentAcademics>();

  // The interest the account already declares, not a second one invented here —
  // a profile and a project that disagree about what a student is into is the
  // kind of thing a panel notices immediately.
  const interestOf = new Map(
    (
      await User.find({ _id: { $in: world.students.map((s) => s.id) } })
        .select('studentData.primaryInterest')
        .lean()
    ).map((u) => [String(u._id), u.studentData?.primaryInterest ?? 'Backend systems'])
  );

  const unitsByProgramme = new Map<string, typeof units>();
  for (const unit of units) {
    const key = String(unit.programmeId);
    const bucket = unitsByProgramme.get(key);
    if (bucket) bucket.push(unit);
    else unitsByProgramme.set(key, [unit]);
  }

  for (const student of world.students) {
    const discipline = rng.bool(0.65) ? AcademicDiscipline.CS : AcademicDiscipline.IT;
    // A first-year has not built anything yet; the archetypes that have
    // engagements behind them are further into the degree.
    const year = student.archetype === 'new' ? rng.int(1, 2) : rng.int(2, 4);
    const semester = rng.int(1, PROGRAMME_SEMESTERS_PER_YEAR);
    const recordedAt = daysAfter(student.joinedAt, rng.int(0, 6));

    const published = programmes.filter(
      (p) =>
        String(p.institutionId) === String(student.institutionId) && p.discipline === discipline
    );
    const programme = published[0];
    const semesterUnits = programme
      ? (unitsByProgramme.get(String(programme._id)) ?? []).filter(
          (u) => u.year === year && u.semester === semester
        )
      : [];

    // Nobody registers for every unit on offer — carrying a subset is normal.
    const enrolled =
      semesterUnits.length > 0
        ? rng.sample(semesterUnits, rng.int(Math.min(4, semesterUnits.length), semesterUnits.length))
        : [];

    const doc =
      programme && enrolled.length > 0
        ? {
            studentId: student.id,
            institutionId: student.institutionId,
            programmeId: programme._id,
            programmeName: programme.name,
            discipline,
            currentYear: year,
            currentSemester: semester,
            currentUnits: enrolled.map((u) => ({
              unitId: u._id,
              code: u.code,
              title: u.title,
              knowledgeAreas: u.knowledgeAreas,
            })),
            completedUnits: [],
            provenance: AcademicProvenance.INSTITUTION_CURRICULUM,
            provenanceRecordedAt: recordedAt,
          }
        : {
            studentId: student.id,
            ...(student.institutionId ? { institutionId: student.institutionId } : {}),
            programmeName: SELF_DECLARED_PROGRAMME_NAMES[discipline],
            discipline,
            currentYear: year,
            currentSemester: semester,
            // Typed out by the student: the unit names are the same subjects,
            // but nothing here carries institutional weight, and a code is only
            // present when the student happened to write one down.
            currentUnits: rng
              .sample(spineFor(discipline)[year - 1]![semester - 1] ?? [], rng.int(4, 5))
              .map((u) => ({
                title: u.title,
                knowledgeAreas: u.knowledgeAreas,
              })),
            completedUnits: [],
            provenance: AcademicProvenance.SELF_DECLARED,
            provenanceRecordedAt: recordedAt,
          };

    ledger.track(
      'StudentEnrolment',
      await createDoc(StudentEnrolment, { ...doc, createdAt: recordedAt, updatedAt: recordedAt })
    );

    academics.set(String(student.id), {
      anchor: {
        programmeName: doc.programmeName,
        year: doc.currentYear,
        semester: doc.currentSemester,
        units: doc.currentUnits.map((u) =>
          'code' in u && u.code ? `${u.code} ${u.title}` : u.title
        ),
        knowledgeAreas: [...new Set(doc.currentUnits.flatMap((u) => u.knowledgeAreas))],
        provenance: ACADEMIC_PROVENANCE_LABEL[doc.provenance],
      },
      interest: interestOf.get(String(student.id)) ?? 'Backend systems',
    });
  }

  return academics;
}

export interface SeededAssignment {
  _id: import('mongoose').Types.ObjectId;
  title: string;
  problemStatement: string;
  coreRequirements: string[];
  deliverables: string[];
  technicalConstraints: string[];
  knowledgeAreas: string[];
  targetYear: number;
  targetSemester: number;
  setBy: string;
}

/** What the assignment pass hands the engagement pass. */
interface SeededAssignments {
  /** Every open cohort offer, by institution — how a student finds theirs. */
  byInstitution: Map<string, SeededAssignment[]>;
  /**
   * The student who takes each offer up, by student id.
   *
   * Take-up is settled here rather than left to a coin toss in the engagement
   * loop, and settled per project rather than per institution. Both mattered:
   * an institution-wide guarantee was satisfied the moment any one of its
   * lecturers had a student, which is how the demo world came to have every
   * take-up sitting on generated lecturers while Dr Ndung'u — the account the
   * presentation actually opens — showed four projects and nobody on any of
   * them.
   */
  takeUp: Map<string, SeededAssignment>;
}

// Work the lecturers set themselves.
//
// A lecturer sets work for the semesters they teach, so each one writes the
// projects aimed at the cohorts they actually have. Dealing a single project
// per lecturer off a rotating list was the wrong shape: the year and semester
// it targeted agreed with any given student's roughly one time in eight, so an
// institution could hold a project no student it was written for would ever be
// offered.
async function generateAssignments(
  ctx: SimContext,
  world: World,
  academics: Map<string, StudentAcademics>
): Promise<SeededAssignments> {
  const { ledger } = ctx;
  const { default: ProjectAssignment } = await import(
    '../../../src/lib/models/ProjectAssignment.model'
  );

  const byInstitution = new Map<string, SeededAssignment[]>();
  // Which of the canonical projects an institution has already had written.
  // Two lecturers at one university both writing "Clinic queue and referral
  // tracker" is the same project offered twice by different people, which is
  // not a thing a student should ever see on the list.
  const spokenFor = new Map<string, Set<string>>();

  const write = async (
    lecturer: World['lecturers'][number],
    source: (typeof LECTURER_PROJECTS)[number],
    createdAt: Date,
    audience: AssignmentAudience,
    assignedStudentIds: mongoose.Types.ObjectId[]
  ): Promise<SeededAssignment> => {
    const doc = ledger.track(
      'ProjectAssignment',
      await createDoc(ProjectAssignment, {
        lecturerId: lecturer.id,
        institutionId: lecturer.institutionId,
        title: source.title,
        problemStatement: source.problemStatement,
        coreRequirements: source.coreRequirements,
        deliverables: source.deliverables,
        technicalConstraints: source.technicalConstraints,
        knowledgeAreas: source.knowledgeAreas,
        targetYear: source.targetYear,
        targetSemester: source.targetSemester,
        audience,
        assignedStudentIds,
        status: AssignmentStatus.OPEN,
        createdAt,
        updatedAt: createdAt,
      })
    );
    return { ...source, _id: doc._id, setBy: lecturer.fullName };
  };

  for (let i = 0; i < world.lecturers.length; i++) {
    const lecturer = world.lecturers[i]!;
    if (!lecturer.institutionId) continue;
    const key = String(lecturer.institutionId);
    const createdAt = daysAfter(lecturer.joinedAt, 20);

    const ownStudents = world.students.filter(
      (s) => s.institutionId && String(s.institutionId) === key
    );
    const cohortOf = (id: unknown): string | null => {
      const a = academics.get(String(id));
      return a ? `${a.anchor.year}-${a.anchor.semester}` : null;
    };
    const cohorts = new Set(
      ownStudents.map((s) => cohortOf(s.id)).filter((c): c is string => c !== null)
    );

    // Only the projects that reach somebody, and only the ones a colleague has
    // not already set. Falling back to a rotation entry when nothing matched —
    // which is what this did first — put an offer on the lecturer's screen
    // aimed at a semester none of their students are in: it could never be
    // accepted, and would sit there reading "0 students" for the length of the
    // demonstration. The lecturer still has work on file in that case, because
    // the named project below is written regardless.
    const taken = spokenFor.get(key) ?? new Set<string>();
    const written = LECTURER_PROJECTS.filter(
      (p) => cohorts.has(`${p.targetYear}-${p.targetSemester}`) && !taken.has(p.title)
    );
    for (const p of written) taken.add(p.title);
    spokenFor.set(key, taken);

    const offers = byInstitution.get(key) ?? [];
    for (const source of written) {
      offers.push(await write(lecturer, source, createdAt, AssignmentAudience.COHORT, []));
    }
    byInstitution.set(key, offers);

    // ---- One named project ----
    // That a lecturer naming a student overrules every cohort filter is the
    // strongest claim the feature makes, and nothing in the demo world
    // exercised it. So each lecturer also names the student their open offers
    // cannot reach — somebody out of step with the cohort, which is exactly the
    // case a lecturer would reach for this for.
    const outOfStep =
      ownStudents.find((s) => {
        const cohort = cohortOf(s.id);
        return (
          cohort !== null && !written.some((p) => `${p.targetYear}-${p.targetSemester}` === cohort)
        );
      }) ?? ownStudents.find((s) => cohortOf(s.id) !== null);

    if (outOfStep) {
      const spare =
        LECTURER_PROJECTS.find((p) => !taken.has(p.title)) ??
        LECTURER_PROJECTS[(i + 1) % LECTURER_PROJECTS.length]!;
      // Deliberately kept out of `offers`: a named project is left open and
      // untaken so a demonstration can show a student accepting one live.
      await write(lecturer, spare, createdAt, AssignmentAudience.NAMED, [outOfStep.id]);
    }
  }

  // Who takes what up. One student per open offer — the most active one in the
  // cohort it was aimed at, and a different student each time, so no lecturer
  // is left with an offer nobody accepted while a colleague's has three.
  const takeUp = new Map<string, SeededAssignment>();
  const claimed = new Set<string>();
  for (const [key, offers] of byInstitution) {
    for (const offer of offers) {
      const candidate = world.students
        .filter((s) => s.institutionId && String(s.institutionId) === key)
        .filter((s) => !claimed.has(String(s.id)))
        .filter((s) => {
          const a = academics.get(String(s.id));
          return (
            a !== undefined &&
            a.anchor.year === offer.targetYear &&
            a.anchor.semester === offer.targetSemester
          );
        })
        .sort((a, b) => (ACTIVITY_RANK[b.archetype] ?? 0) - (ACTIVITY_RANK[a.archetype] ?? 0))[0];
      if (!candidate) continue;
      claimed.add(String(candidate.id));
      takeUp.set(String(candidate.id), offer);
    }
  }

  return { byInstitution, takeUp };
}

export async function generateEducation(ctx: SimContext, world: World): Promise<void> {
  const { rng, ledger, batcher } = ctx;

  const academics = await generateEnrolments(ctx, world);
  const { byInstitution: assignmentsByInstitution, takeUp } = await generateAssignments(
    ctx,
    world,
    academics
  );

  if (world.students.length < 2 || world.lecturers.length === 0) return;

  const { default: User } = await import('../../../src/lib/models/User.model');
  const { default: ProjectEngagement } = await import('../../../src/lib/models/ProjectEngagement.model');
  const { default: PeerReview } = await import('../../../src/lib/models/PeerReview.model');
  const { default: LecturerReview } = await import('../../../src/lib/models/LecturerReview.model');
  const { default: LecturerEffectiveness } = await import('../../../src/lib/models/LecturerEffectiveness.model');
  const { default: ProjectDocumentation } = await import('../../../src/lib/models/ProjectDocumentation.model');

  const lecturerStats = new Map<string, LecturerStat>();
  // Every institution's lecturers must open their queue and find work in it.
  // Left to chance, a whole university's queue comes up empty — which is what
  // the presenter would discover in front of the panel.
  // How many projects each institution has sitting in front of a lecturer.
  //
  // How much work each institution must have in front of its lecturers, and why
  // it is not a flat number.
  //
  // The demonstration phase reads this same queue and promotes engagements out
  // of it into a request waiting and a session coming up — and it does that
  // once per lecturer, not once per institution, because a demonstrations
  // screen belongs to a lecturer. An institution with two lecturers therefore
  // loses twice as many as one with a single lecturer, from a queue they share.
  //
  // A flat three was the old value, and it left exactly one report per lecturer
  // at a single-lecturer institution and none to spare at a two-lecturer one.
  // One is non-empty, and one is what the readiness audit of 2026-08-24 emptied
  // by doing the obvious thing: rehearsing the review once. A presenter who
  // practises the centrepiece of the Education Hub the night before then walks
  // into the room with "Nothing waiting on you" on screen.
  //
  // So the target is what the demonstration phase will take, plus what has to
  // survive it. Both halves are asserted after every seed — by
  // `every institution has a demonstration request waiting` and by
  // `the review queue survives a rehearsal` — so the next person to change
  // either number finds out from the seed rather than from an audience.
  const queuedWorkTargetFor = (institutionKey: string): number => {
    const lecturersHere = world.lecturers.filter(
      (l) => l.institutionId && String(l.institutionId) === institutionKey
    ).length;
    return REVIEW_QUEUE_SURVIVAL_FLOOR + DEMONSTRATIONS_PROMOTED_PER_LECTURER * lecturersHere;
  };
  const queuedWorkByInstitution = new Map<string, number>();

  // The guarantee used to live inside `if (reviewable)`, which is decided by
  // the same dice it exists to override: an institution whose students all came
  // up 'new', or lost the 0.85 coin toss every time, never reached it and its
  // lecturer opened an empty screen. So one student per institution is named in
  // advance — the most active one, who would plausibly be furthest along — and
  // their first project is queued regardless of how the dice fall.
  const queueGuarantor = new Map<string, string>();
  for (const student of world.students) {
    if (!student.institutionId) continue;
    const key = String(student.institutionId);
    const hasFaculty = world.lecturers.some(
      (l) => l.institutionId && String(l.institutionId) === key
    );
    if (!hasFaculty) continue;
    const incumbent = queueGuarantor.get(key);
    const incumbentRank = incumbent
      ? (ACTIVITY_RANK[
          world.students.find((s) => String(s.id) === incumbent)?.archetype ?? 'new'
        ] ?? 0)
      : -1;
    if ((ACTIVITY_RANK[student.archetype] ?? 0) > incumbentRank) {
      queueGuarantor.set(key, String(student.id));
    }
  }

  for (const student of world.students) {
    const activity = activityFor(student.archetype);
    const academic = academics.get(String(student.id));
    if (!academic) continue;
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

    // A project their own lecturer set, aimed at the semester they are in.
    // Only the first engagement uses it: a student takes up an offer once.
    // The one they were named for wins over merely the first that matches, so
    // take-up spreads across the lecturers who set the work rather than piling
    // onto whichever of them the seeder happened to write first.
    const guaranteed = takeUp.get(String(student.id));
    const offered =
      guaranteed ??
      (assignmentsByInstitution.get(String(student.institutionId)) ?? []).find(
        (a) =>
          a.targetYear === academic.anchor.year && a.targetSemester === academic.anchor.semester
      );

    // A guarantor must have at least one project, or there is nothing to queue —
    // and the same holds for a student who is to take up their lecturer's work.
    const isGuarantor = queueGuarantor.get(String(student.institutionId)) === String(student.id);
    const drawn = rng.int(activity.engagements[0], activity.engagements[1]);
    const n = isGuarantor || guaranteed ? Math.max(1, drawn) : drawn;
    for (let e = 0; e < n; e++) {
      const title = rng.pick(PROJECT_TITLES);
      const stack = rng.sample(TECH_STACKS, rng.int(2, 4));
      const takesOffer =
        e === 0 && offered !== undefined && (guaranteed !== undefined || rng.bool(0.7));
      const track = takesOffer
        ? ProjectTrack.LECTURER_ASSIGNED
        : rng.bool(0.6)
          ? ProjectTrack.AI_BRIEF
          : ProjectTrack.OPEN_SOURCE;
      const startedAt = between(rng, student.joinedAt, daysAgo(5));
      const repo = track === ProjectTrack.OPEN_SOURCE ? rng.pick(OSS_REPOSITORIES) : null;

      // Where this engagement came to rest. A reviewed project carries a
      // lecturer decision; a share of the rest are still sitting in front of a
      // lecturer. That last state was never generated before, which is why the
      // review queue — the centrepiece of the lecturer's day — was structurally
      // empty in every demonstration.
      const institutionKey = String(student.institutionId);
      const mustQueue =
        faculty.length > 0 &&
        (queuedWorkByInstitution.get(institutionKey) ?? 0) < queuedWorkTargetFor(institutionKey);
      const reviewable =
        faculty.length > 0 &&
        (mustQueue || (student.archetype !== 'new' && rng.bool(0.85)));
      let decision: string | null = null;
      let awaitingLecturer = false;
      if (reviewable) {
        if (mustQueue || rng.bool(0.22)) awaitingLecturer = true;
        else if (rng.bool(activity.verifyRate)) decision = LecturerDecision.VERIFIED;
        // Never DENIED: the report review is accept-or-send-back, so no route
        // in the application writes that decision either.
        else decision = LecturerDecision.REVISION_REQUIRED;
      }
      if (awaitingLecturer) {
        queuedWorkByInstitution.set(
          institutionKey,
          (queuedWorkByInstitution.get(institutionKey) ?? 0) + 1
        );
      }

      // The second reading is decided here, not after the report has been
      // written.
      //
      // It used to be rolled further down, and when it verified a project that
      // had been sent back it moved the engagement to VERIFIED while the report
      // stayed marked "changes requested" — a completed project whose own
      // documentation said it was still being revised, which is a state the
      // application cannot produce. Knowing the ending up front lets the report
      // below be written as the two versions such a project must actually have.
      const revises = decision === LecturerDecision.REVISION_REQUIRED && rng.bool(0.5);
      const secondDecision = revises
        ? rng.bool(0.75)
          ? LecturerDecision.VERIFIED
          : LecturerDecision.REVISION_REQUIRED
        : null;
      const finalDecision = secondDecision ?? decision;

      const pbAt = daysAfter(startedAt, rng.int(1, 4));
      const frAt = daysAfter(pbAt, rng.int(6, 20));
      const peerAt = daysAfter(frAt, rng.int(1, 3));

      // Only the structured logs live on the engagement now. The three prose
      // documents that stood here are one uploaded report, written below.
      const documents = {
        blockerLog: Array.from({ length: rng.int(1, 3) }, () => ({ ...blockerEntry(rng), loggedAt: daysAfter(pbAt, rng.int(1, 5)) })),
        aiUsageLog: Array.from({ length: rng.int(1, 3) }, () => ({ ...aiUsageEntry(rng), loggedAt: daysAfter(pbAt, rng.int(1, 5)) })),
      };

      // Only states the application can actually produce.
      //
      // `DENIED` and `UNDER_PEER_REVIEW` were seeded here and no route in the
      // application writes either: DENIED belonged to a lecturer verdict that
      // the report-review cycle replaced, and UNDER_PEER_REVIEW to a submission
      // step that no longer gates anything. A demonstration seeded into a state
      // the product cannot reach is a demonstration of something that does not
      // exist — and it is the seeder, not the application, that has to give
      // way. A project a lecturer closed is now simply one sent back.
      const status = finalDecision
        ? (finalDecision === LecturerDecision.VERIFIED
            ? ProjectStatus.VERIFIED
            : ProjectStatus.REVISION_REQUIRED)
        : awaitingLecturer
          ? ProjectStatus.UNDER_LECTURER_REVIEW
          : rng.pick([ProjectStatus.IN_PROGRESS, ProjectStatus.BRIEF_GENERATED]);

      const engagement = ledger.track('ProjectEngagement', await createDoc(ProjectEngagement, {
        studentId: student.id, track, interest: academic.interest,
        status,
        ...(takesOffer && offered ? { assignmentId: offered._id } : {}),
        brief: takesOffer && offered
          ? assignedBrief(offered, academic.anchor, offered.setBy)
          : repo
            ? openSourceBrief(repo.url, repo.name, academic.anchor)
            : aiBrief(rng, title, academic.anchor, stack, academic.interest),
        githubRepoUrl: repo?.url,
        githubRepoName: repo?.name,
        documents,
        // No githubSnapshot. The application has no GitHub API integration, so
        // nothing in production can ever populate commit counts or hashes.
        // Seeding them fabricated evidence the platform cannot produce, and a
        // demonstration would have shown a panel commit history that was
        // invented here. A repository link is recorded; nothing is claimed
        // about what is inside it.
        // Clamped to the past: a project cannot have been signed off on a date
        // that has not arrived, and every date here is computed forward from
        // when the project started.
        verifiedAt:
          decision === LecturerDecision.VERIFIED
            ? (() => {
                const at = daysAfter(frAt, rng.int(2, 6));
                return at.getTime() < Date.now() ? at : daysAgo(rng.int(3, 12));
              })()
            : undefined,
        createdAt: startedAt,
        updatedAt: decision ? daysAfter(frAt, rng.int(2, 6)) : awaitingLecturer ? peerAt : frAt,
      }));

      // The report. Every project that has reached a lecturer has one, and it
      // is a real PDF in the same storage the application uploads to — the
      // lecturer's screen reads the file back through the application's own
      // authorised route, so a seeded version pointing at nothing would fail on
      // the first click.
      //
      // A project still being built has none, which is the honest state: the
      // report is written outside UmojaHub and arrives finished, so there is no
      // half-written one for the platform to hold.
      if (status !== ProjectStatus.BRIEF_GENERATED && status !== ProjectStatus.IN_PROGRESS) {
        const reportTitle = takesOffer && offered ? offered.title : repo ? repo.name : title;
        const sections = reportSections(rng, {
          title: reportTitle,
          stack,
          units: academic.anchor.units,
          programmeName: academic.anchor.programmeName,
          year: academic.anchor.year,
          semester: academic.anchor.semester,
          industry: rng.pick(REPORT_SETTINGS),
          interest: academic.interest,
        });

        const subtitle = `${student.fullName} — ${academic.anchor.programmeName}, Year ${academic.anchor.year} Semester ${academic.anchor.semester}`;
        const fileName = `${slugForFile(reportTitle)}-report.pdf`;

        // A project that was sent back and then accepted keeps both versions,
        // because that pair — the feedback and the answer to it — is the whole
        // point of the cycle and the demo should be able to show one.
        // Always for a project that was actually sent back and then accepted:
        // that is what happened to it, and the two versions are the record.
        const showsCycle =
          status === ProjectStatus.VERIFIED &&
          (secondDecision === LecturerDecision.VERIFIED || rng.bool(0.4));
        const lecturer = rng.pick(faculty);
        const versions: Record<string, unknown>[] = [];

        const firstAt = frAt;
        const firstPdf = buildReportPdf(reportTitle, subtitle, reportPdfSections(sections));
        const firstFile = await uploadDemoReport(firstPdf, fileName);

        const finalOutcome =
          status === ProjectStatus.VERIFIED
            ? DocumentationOutcome.READY_FOR_DEMONSTRATION
            : DocumentationOutcome.REVISION_REQUESTED;

        if (showsCycle) {
          versions.push({
            versionNumber: 1,
            fileName,
            publicId: firstFile.publicId,
            bytes: firstFile.bytes,
            pageCount: firstFile.pageCount,
            submittedAt: firstAt,
            status: SubmissionStatus.SUPERSEDED,
            review: seededReview(
              rng,
              lecturer.id,
              DocumentationOutcome.REVISION_REQUESTED,
              daysAfter(firstAt, rng.int(2, 6))
            ),
          });

          const secondAt = daysAfter(firstAt, rng.int(8, 20));
          const secondPdf = buildReportPdf(reportTitle, subtitle, reportPdfSections(sections));
          const secondFile = await uploadDemoReport(secondPdf, fileName);

          versions.push({
            versionNumber: 2,
            fileName,
            publicId: secondFile.publicId,
            bytes: secondFile.bytes,
            pageCount: secondFile.pageCount,
            submittedAt: secondAt,
            studentNote:
              'Rewrote the architecture section around the services I actually built, added the test results table, and replaced the placeholder screenshots with the running system.',
            status: SubmissionStatus.READY_FOR_DEMONSTRATION,
            review: seededReview(
              rng,
              lecturer.id,
              DocumentationOutcome.READY_FOR_DEMONSTRATION,
              daysAfter(secondAt, rng.int(2, 6))
            ),
          });
        } else {
          const awaitingRead = status === ProjectStatus.UNDER_LECTURER_REVIEW;

          versions.push({
            versionNumber: 1,
            fileName,
            publicId: firstFile.publicId,
            bytes: firstFile.bytes,
            pageCount: firstFile.pageCount,
            submittedAt: firstAt,
            status: awaitingRead
              ? SubmissionStatus.SUBMITTED
              : status === ProjectStatus.VERIFIED
                ? SubmissionStatus.READY_FOR_DEMONSTRATION
                : SubmissionStatus.REVISION_REQUESTED,
            ...(awaitingRead
              ? {}
              : {
                  review: seededReview(
                    rng,
                    lecturer.id,
                    finalOutcome,
                    daysAfter(firstAt, rng.int(2, 6))
                  ),
                }),
          });
        }

        ledger.track('ProjectDocumentation', await createDoc(ProjectDocumentation, {
          engagementId: engagement._id,
          studentId: student.id,
          versions,
          createdAt: firstAt,
          updatedAt: frAt,
        }));
      }

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
          rejectionReason: passDecision === LecturerDecision.DENIED ? 'The submission did not meet the engineering bar for the units it was set against.' : undefined,
          createdAt: at, updatedAt: at,
        }));

        await ProjectEngagement.updateOne({ _id: engagement._id }, { $set: { lecturerReviewId: lecReview._id } });

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
      if (revises && secondDecision) {
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

    await User.updateOne({ _id: student.id }, { $set: { 'studentData.completedProjectCount': verifiedCount } });
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
