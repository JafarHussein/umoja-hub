import type {
  StudentTier,
  PortfolioStrength,
  ProjectTrack,
  ProjectStatus,
  LecturerDecision,
  PeerReviewStatus,
} from './index';

// ---------------------------------------------------------------------------
// Project Engagement
// ---------------------------------------------------------------------------

export interface IBlockerLogEntry {
  stuckOn: string;
  resolution: string;
  durationHours: number;
  loggedAt: Date;
}

export interface IAIUsageLogEntry {
  toolUsed: string;
  prompt: string;
  outputReceived: string;
  studentAction: string;
  loggedAt: Date;
  source: string;
}

export interface IProcessDocument {
  content: string;
  hash: string;
  submittedAt: Date;
}

export interface IGithubSnapshot {
  commitCount?: number;
  lastCommitHash?: string;
  commitTimelineHash?: string;
  snapshotAt?: Date;
}

export interface IProjectEngagement {
  _id: string;
  studentId: string;
  track: ProjectTrack;
  tier: StudentTier;
  status: ProjectStatus;
  brief?: Record<string, unknown>;
  briefContextId?: string;
  githubRepoUrl?: string;
  githubRepoName?: string;
  issueUrl?: string;
  documents: {
    problemBreakdown?: IProcessDocument;
    approachPlan?: IProcessDocument;
    blockerLog: IBlockerLogEntry[];
    aiUsageLog: IAIUsageLogEntry[];
    finalReflection?: IProcessDocument;
  };
  githubSnapshot: IGithubSnapshot;
  peerReviewId?: string;
  lecturerReviewId?: string;
  verificationUrl?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Peer Review
// ---------------------------------------------------------------------------

export interface IPeerReview {
  _id: string;
  engagementId: string;
  reviewerId: string;
  submittedAt?: Date;
  status: PeerReviewStatus;
  scores: {
    codeQuality?: number;
    documentationClarity?: number;
  };
  comments: {
    codeQuality?: string;
    documentationClarity?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Lecturer Review
// ---------------------------------------------------------------------------

export interface ILecturerReview {
  _id: string;
  engagementId: string;
  lecturerId: string;
  decision: LecturerDecision;
  scores: {
    problemUnderstanding: number;
    solutionQuality: number;
    processQuality: number;
    aiUsage: number;
  };
  comments: {
    problemUnderstanding: string;
    solutionQuality: string;
    processQuality: string;
    aiUsage: string;
    overallFeedback?: string;
  };
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Student Portfolio Status
// ---------------------------------------------------------------------------

export interface IVerifiedProject {
  engagementId: string;
  title: string;
  tier: StudentTier;
  techStack: string[];
  verifiedAt: Date;
  averageScore: number;
  lecturerInstitution: string;
}

export interface IVerifiedSkill {
  skillName: string;
  category: string;
  tierDemonstrated: StudentTier;
  firstVerifiedAt: Date;
  projectTitle: string;
  engagementId: string;
}

export interface ITierProgressionEntry {
  tier: StudentTier;
  unlockedAt: Date;
}

export interface IStudentPortfolioStatus {
  _id: string;
  studentId: string;
  currentTier: StudentTier;
  portfolioStrength: PortfolioStrength;
  verifiedProjects: IVerifiedProject[];
  verifiedSkills: IVerifiedSkill[];
  tierProgressionTimeline: ITierProgressionEntry[];
  stats: {
    verifiedProjectCount: number;
    totalProjectCount: number;
    techStacksUsed: string[];
    reviewerInstitutions: string[];
  };
  lastRecalculatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Verification Audit Log
// ---------------------------------------------------------------------------

export interface IVerificationAuditLog {
  _id: string;
  engagementId: string;
  studentId: string;
  lecturerId: string;
  decision: LecturerDecision;
  documentHashes: {
    problemBreakdown: string;
    approachPlan: string;
    finalReflection: string;
  };
  githubSnapshot: {
    commitCount: number;
    lastCommitHash: string;
    commitTimelineHash: string;
  };
  reviewScores: {
    problemUnderstanding: number;
    solutionQuality: number;
    processQuality: number;
    aiUsage: number;
  };
  recordedAt: Date;
}

// ---------------------------------------------------------------------------
// Brief Context Library
// ---------------------------------------------------------------------------

export interface IBriefContext {
  id: string;
  industryName: string;
  description: string;
  clientPersonaTemplate: {
    businessTypes: string[];
    counties: string[];
    contexts: string[];
  };
  problemDomains: string[];
  kenyanConstraints: string[];
  exampleProjects: string[];
  targetTiers: StudentTier[];
}

export interface IBriefContextLibrary {
  _id: string;
  version: number;
  updatedBy: string;
  contexts: IBriefContext[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Mentor Session
// ---------------------------------------------------------------------------

export interface IMentorMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  autoLogged: boolean;
}

export interface IMentorSession {
  _id: string;
  studentId: string;
  engagementId: string;
  messages: IMentorMessage[];
  lastActivityAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Lecturer Effectiveness
// ---------------------------------------------------------------------------

export interface ILecturerEffectiveness {
  _id: string;
  lecturerId: string;
  totalReviews: number;
  verifiedCount: number;
  deniedCount: number;
  revisionCount: number;
  averageScoresGiven: {
    problemUnderstanding: number;
    solutionQuality: number;
    processQuality: number;
    aiUsage: number;
    overall: number;
  };
  averageCommentWordCount: number;
  lastReviewAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
