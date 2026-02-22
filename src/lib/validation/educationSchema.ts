import { z } from 'zod';
import { ProjectTrack, StudentTier, LecturerDecision, REVIEW_MIN_WORD_COUNT } from '@/types';

const countWords = (text: string): number =>
  text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

export const briefRequestSchema = z.object({
  track: z.enum([ProjectTrack.OPEN_SOURCE, ProjectTrack.AI_BRIEF]),
  tier: z.enum([StudentTier.BEGINNER, StudentTier.INTERMEDIATE, StudentTier.ADVANCED]),
  githubRepoUrl: z.string().url('Must be a valid GitHub URL').optional(),
});

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

export type BriefRequestInput = z.infer<typeof briefRequestSchema>;
export type DocumentSubmissionInput = z.infer<typeof documentSubmissionSchema>;
export type BlockerLogEntryInput = z.infer<typeof blockerLogEntrySchema>;
export type AIUsageLogEntryInput = z.infer<typeof aiUsageLogEntrySchema>;
export type PeerReviewInput = z.infer<typeof peerReviewSchema>;
export type LecturerReviewInput = z.infer<typeof lecturerReviewSchema>;
