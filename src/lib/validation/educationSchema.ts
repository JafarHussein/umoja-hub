import { z } from 'zod';
import {
  ProjectTrack,
  LecturerDecision,
  KnowledgeArea,
  AssignmentAudience,
  AssignmentStatus,
  MAX_PROGRAMME_YEARS,
  MAX_SEMESTERS_PER_YEAR,
  REVIEW_MIN_WORD_COUNT,
  MAX_ASSISTANT_MESSAGE_CHARS,
} from '@/types';

const countWords = (text: string): number =>
  text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

const objectId = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'Not a valid identifier');

export const briefRequestSchema = z.object({
  track: z.enum([
    ProjectTrack.OPEN_SOURCE,
    ProjectTrack.AI_BRIEF,
    ProjectTrack.LECTURER_ASSIGNED,
  ]),
  // The student's engineering interest — a filter over valid projects, not a
  // difficulty dial. The difficulty tier this replaced was the one project
  // origin the Hub's premise forbids.
  interest: z.string().trim().min(2).max(60).optional(),
  githubRepoUrl: z.string().url('Must be a valid GitHub URL').optional(),
  /** Required for LECTURER_ASSIGNED — which of their projects was chosen. */
  assignmentId: objectId.optional(),
});

// ---------------------------------------------------------------------------
// A lecturer writing their own project.
//
// The floors are deliberately low. A lecturer with sixty students and four
// hours a week will not fill in a long form, and a form they abandon is a
// feature that does not exist — so this asks for the problem, what has to be
// built, and what it exercises, and treats everything else as optional.
// ---------------------------------------------------------------------------

const trimmedList = (max: number, message: string) =>
  z.array(z.string().trim().min(3, message).max(300)).max(max);

// The rules, written once. Both schemas below are built from these, and the
// defaults are added only where they belong — see the note on editing.
const assignmentFields = {
  title: z.string().trim().min(5, 'Give the project a name').max(140),
  problemStatement: z
    .string()
    .trim()
    .min(40, 'Describe the problem in a couple of sentences')
    .max(2000),
  coreRequirements: trimmedList(12, 'Each requirement needs a few words')
    .min(1, 'Say what has to be built'),
  deliverables: trimmedList(10, 'Each deliverable needs a few words'),
  technicalConstraints: trimmedList(10, 'Each constraint needs a few words'),
  knowledgeAreas: z
    .array(z.enum(Object.values(KnowledgeArea) as [KnowledgeArea, ...KnowledgeArea[]]))
    .min(1, 'Say which subjects this project exercises')
    .max(6, 'Six subjects is more than one project can carry'),
  targetYear: z.number().int().min(1).max(MAX_PROGRAMME_YEARS),
  targetSemester: z.number().int().min(1).max(MAX_SEMESTERS_PER_YEAR),
  audience: z.enum([AssignmentAudience.COHORT, AssignmentAudience.NAMED]),
  assignedStudentIds: z.array(objectId).max(60),
  capacity: z.number().int().min(1).max(200).optional(),
  status: z.enum([AssignmentStatus.DRAFT, AssignmentStatus.OPEN, AssignmentStatus.CLOSED]),
};

export const projectAssignmentSchema = z.object({
  ...assignmentFields,
  // A project written without deliverables has none, and a cohort offer names
  // nobody. On the way in, absent genuinely does mean empty.
  deliverables: assignmentFields.deliverables.default([]),
  technicalConstraints: assignmentFields.technicalConstraints.default([]),
  assignedStudentIds: assignmentFields.assignedStudentIds.default([]),
});

/**
 * Editing an existing project — every field optional, same rules, and
 * deliberately *not* `projectAssignmentSchema.partial()`.
 *
 * `.partial()` makes a field optional but leaves its default in place, so a
 * request carrying nothing but `{ status: 'CLOSED' }` parsed into four keys:
 * the status the lecturer sent, plus empty deliverables, empty constraints and
 * an empty student list they never mentioned. Two things followed. Closing an
 * offer counted as rewriting the brief, so a lecturer could not withdraw a
 * project once anybody had started it — the one escape hatch the refusal
 * itself points them to. And any small edit to an untaken project silently
 * cleared its deliverables and constraints, and un-named every student on a
 * named project, which is what makes such a project visible at all.
 *
 * On the way in an absent list means an empty one; on the way through an edit
 * it means "leave this alone", and the two must not share a schema.
 */
export const projectAssignmentUpdateSchema = z.object(assignmentFields).partial();

export type ProjectAssignmentInput = z.infer<typeof projectAssignmentSchema>;

export const documentSubmissionSchema = z.object({
  documentType: z.enum([
    'problemBreakdown',
    'approachPlan',
    'finalReflection',
  ]),
  content: z
    .string()
    .trim()
    .min(50, 'Document content must be at least 50 characters'),
});

export const blockerLogEntrySchema = z.object({
  stuckOn: z.string().trim().min(10, 'Describe what you are stuck on'),
  resolution: z.string().trim().min(10, 'Describe how you resolved it'),
  durationHours: z.number().positive('Duration must be positive'),
});

export const aiUsageLogEntrySchema = z.object({
  toolUsed: z.string().trim().min(1, 'Tool name is required'),
  prompt: z.string().trim().min(10, 'Prompt must be at least 10 characters'),
  outputReceived: z.string().trim().min(10, 'Output must be at least 10 characters'),
  studentAction: z.string().trim().min(10, 'Describe your action after receiving output'),
});

export const peerReviewSchema = z.object({
  scores: z.object({
    codeQuality: z.number().int().min(1).max(5),
    documentationClarity: z.number().int().min(1).max(5),
  }),
  comments: z.object({
    codeQuality: z.string().trim().min(1, 'Code quality comment is required'),
    documentationClarity: z
      .string()
      .trim()
      .min(1, 'Documentation clarity comment is required'),
  }),
});

export const lecturerReviewSchema = z
  .object({
    decision: z.enum([
      LecturerDecision.VERIFIED,
      LecturerDecision.REVISION_REQUIRED,
      LecturerDecision.DENIED,
    ]),
    scores: z.object({
      problemUnderstanding: z.number().int().min(1).max(5),
      solutionQuality: z.number().int().min(1).max(5),
      processQuality: z.number().int().min(1).max(5),
      aiUsage: z.number().int().min(1).max(5),
    }),
    comments: z.object({
      problemUnderstanding: z
        .string()
        .trim()
        .refine(
          (val) => countWords(val) >= REVIEW_MIN_WORD_COUNT,
          `Problem understanding comment must be at least ${REVIEW_MIN_WORD_COUNT} words`
        ),
      solutionQuality: z
        .string()
        .trim()
        .refine(
          (val) => countWords(val) >= REVIEW_MIN_WORD_COUNT,
          `Solution quality comment must be at least ${REVIEW_MIN_WORD_COUNT} words`
        ),
      processQuality: z
        .string()
        .trim()
        .refine(
          (val) => countWords(val) >= REVIEW_MIN_WORD_COUNT,
          `Process quality comment must be at least ${REVIEW_MIN_WORD_COUNT} words`
        ),
      aiUsage: z
        .string()
        .trim()
        .refine(
          (val) => countWords(val) >= REVIEW_MIN_WORD_COUNT,
          `AI usage comment must be at least ${REVIEW_MIN_WORD_COUNT} words`
        ),
      overallFeedback: z.string().trim().optional(),
    }),
    rejectionReason: z.string().trim().optional(),
  })
  .refine(
    (data) =>
      data.decision !== LecturerDecision.DENIED ||
      (data.rejectionReason !== undefined && data.rejectionReason.length > 0),
    { message: 'Rejection reason is required when decision is DENIED', path: ['rejectionReason'] }
  );

export const adminVerifyLecturerSchema = z.object({
  lecturerId: z.string().min(1, 'Lecturer ID is required'),
});

const briefContextEntrySchema = z.object({
  id: z.string().min(1, 'Context ID is required'),
  industryName: z.string().min(1, 'Industry name is required'),
  description: z.string().min(1, 'Description is required'),
  clientPersonaTemplate: z.object({
    businessTypes: z.array(z.string().min(1)),
    counties: z.array(z.string().min(1)),
    contexts: z.array(z.string().min(1)),
  }),
  problemDomains: z.array(z.string().min(1)),
  kenyanConstraints: z.array(z.string().min(1)),
  exampleProjects: z.array(z.string().min(1)),
});

export const briefContextLibraryUpdateSchema = z.object({
  contexts: z.array(briefContextEntrySchema).min(1, 'At least one context is required'),
});

export const mentorChatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(MAX_ASSISTANT_MESSAGE_CHARS, `Message must be at most ${MAX_ASSISTANT_MESSAGE_CHARS} characters`),
  engagementId: z.string().min(1, 'Engagement ID is required'),
});

export type BriefRequestInput = z.infer<typeof briefRequestSchema>;
export type DocumentSubmissionInput = z.infer<typeof documentSubmissionSchema>;
export type BlockerLogEntryInput = z.infer<typeof blockerLogEntrySchema>;
export type AIUsageLogEntryInput = z.infer<typeof aiUsageLogEntrySchema>;
export type PeerReviewInput = z.infer<typeof peerReviewSchema>;
export type LecturerReviewInput = z.infer<typeof lecturerReviewSchema>;
export type AdminVerifyLecturerInput = z.infer<typeof adminVerifyLecturerSchema>;
export type MentorChatInput = z.infer<typeof mentorChatSchema>;
export type BriefContextLibraryUpdateInput = z.infer<typeof briefContextLibraryUpdateSchema>;
