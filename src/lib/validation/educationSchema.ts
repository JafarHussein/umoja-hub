import { z } from 'zod';
import { ProjectTrack, StudentTier, LecturerDecision } from '@/types';

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
      // Structural validation only — word count enforcement is done server-side
      // to return VALIDATION_COMMENT_TOO_SHORT with per-field error codes
      problemUnderstanding: z.string().trim().min(1, 'Problem understanding comment is required'),
      solutionQuality: z.string().trim().min(1, 'Solution quality comment is required'),
      processQuality: z.string().trim().min(1, 'Process quality comment is required'),
      aiUsage: z.string().trim().min(1, 'AI usage comment is required'),
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
