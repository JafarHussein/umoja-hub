import type {
  ProjectTrack,
  ProjectStatus,
  LecturerDecision,
  PeerReviewStatus,
  KnowledgeArea,
  AcademicDiscipline,
  AcademicProvenance,
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
  interest?: string;
  industryName?: string;
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

// ---------------------------------------------------------------------------
// Academic context
//
// Three entities, deliberately separate. A programme and its units belong to an
// institution and change once a curriculum is revised. An enrolment belongs to
// a student and changes every semester. Keeping them apart is what lets a
// student at an institution that has never heard of UmojaHub still record what
// they are studying.
// ---------------------------------------------------------------------------

export interface IAcademicProgramme {
  _id: string;
  institutionId: string;
  name: string;
  discipline: AcademicDiscipline;
  durationYears: number;
  semestersPerYear: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICurriculumUnit {
  _id: string;
  programmeId: string;
  /** The institution's own code — a label, never reasoned about. */
  code: string;
  title: string;
  /** Where this unit normally sits in the programme. */
  year: number;
  semester: number;
  /** The mapping onto the canonical taxonomy. This is the integration surface. */
  knowledgeAreas: KnowledgeArea[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A unit as it stands on a student's record — a snapshot, not a reference.
 * `unitId` is present when it came from a published curriculum and absent when
 * the student typed it; either way the record survives a curriculum revision.
 */
export interface IEnrolledUnit {
  unitId?: string;
  code?: string;
  title: string;
  knowledgeAreas: KnowledgeArea[];
}

export interface IStudentEnrolment {
  _id: string;
  studentId: string;
  institutionId?: string;
  programmeId?: string;
  /** Free text when no published programme was chosen. */
  programmeName: string;
  discipline: AcademicDiscipline;
  currentYear: number;
  currentSemester: number;
  currentUnits: IEnrolledUnit[];
  completedUnits: IEnrolledUnit[];
  provenance: AcademicProvenance;
  provenanceRecordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
