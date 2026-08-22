// Shared enums — import from here, never use magic strings in the codebase
// ---------------------------------------------------------------------------

export enum Role {
  FARMER = 'FARMER',
  BUYER = 'BUYER',
  STUDENT = 'STUDENT',
  LECTURER = 'LECTURER',
  ADMIN = 'ADMIN',
  // An institution hosts students and lecturers, and is the Education Hub's
  // academic-context integration: it supplies what a student is actually
  // studying so project recommendations can be grounded in their coursework
  // rather than guessed. Provisioned by an administrator, never self-selected.
  //
  // NGO and EMPLOYER were removed (2026-08-04). Neither had a path to existence
  // — they were absent from `roleSelectionSchema`, so no real person could
  // become one, and they existed only in seeded data. The Education Hub vision
  // reset then removed the recruitment surface EMPLOYER was built for.
  INSTITUTION = 'INSTITUTION',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum VerificationStatus {
  UNSUBMITTED = 'UNSUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Which kind of buyer an account is. The platform serves both a hotel group
// sourcing by the tonne and a household buying a crate, and it used to model
// only the first: organisation name, business registration number and a KRA tax
// compliance certificate were required of everyone. An individual has none of
// the three, so the funnel — which had no "not applicable" and no way out —
// collected fabricated ones instead, and the platform then reported them back
// as fact. What is asked for follows from this field.
export enum BuyerType {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS',
}

export const BUYER_TYPE_LABEL: Record<BuyerType, string> = {
  [BuyerType.INDIVIDUAL]: 'Individual buyer',
  [BuyerType.BUSINESS]: 'Business or organisation',
};

// Progressive onboarding funnel (Decision 02-A). A new OAuth user has no role
// and walks ROLE_SELECTION → IDENTITY_INPUT → VERIFICATION_UPLOAD → COMPLETED.
// AUTH-02 writes the starting stage on OAuth account creation; AUTH-05 advances
// it as each onboarding step is submitted.
export enum OnboardingStage {
  // AUTH_ONBOARDING_FLOW_V3: OAuth comes first and creates the account, so a
  // brand-new user lands here — authenticated, but with no password and no role
  // yet. Everything before this stage is handled by the identity provider.
  PASSWORD_SETUP = 'PASSWORD_SETUP',
  ROLE_SELECTION = 'ROLE_SELECTION',
  IDENTITY_INPUT = 'IDENTITY_INPUT',
  /**
   * @deprecated Legacy terminal stage — never written by any route. Setup now
   * completes at IDENTITY_INPUT, because holding the whole product behind a
   * document upload locked out users who did not have one to hand. Kept so rows
   * and unexpired tokens created before that change still resolve; treated as
   * complete by `isOnboardingComplete`.
   */
  VERIFICATION_UPLOAD = 'VERIFICATION_UPLOAD',
  COMPLETED = 'COMPLETED',
}

// Identity provider a user authenticated with (Decision 01-B). Absent for
// legacy credentials accounts until the CredentialsProvider is retired (AUTH-07).
export enum OAuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
}

export enum OrderPaymentStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  // The outcome could not be established. An STK callback that never arrives
  // does NOT mean the buyer kept their money — the debit may have gone through
  // and only the notification been lost. Without this state the only way to
  // close such a payment was to call it FAILED, which asserts the buyer was not
  // charged; that assertion cannot be made truthfully without asking the
  // provider, and sometimes it cannot be made at all. An order here is never
  // releasable and is raised for an administrator to settle by hand.
  UNRESOLVED = 'UNRESOLVED',
}

export enum OrderFulfillmentStatus {
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  IN_FULFILLMENT = 'IN_FULFILLMENT',
  RECEIVED = 'RECEIVED',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
}

// Buyer-facing display labels for the order lifecycle. One source of truth so
// the orders list and the order detail screen never drift (Kenyan localization
// pass — display text only; the enum values above are the API/DB contract).
// Fulfilment progress within IN_FULFILLMENT — a descriptive axis, deliberately
// SEPARATE from OrderFulfillmentStatus.
//
// Escrow custody and fulfilment progress are different questions. The escrow
// held-guard, the balance aggregation, the mediation gate and the admin ledger
// all key on `fulfillmentStatus === IN_FULFILLMENT`; putting delivery progress
// on its own field means the farmer can narrate the journey without any of
// those invariants having to change. Nothing here moves money.
export enum FulfillmentStage {
  PREPARING = 'PREPARING',
  READY = 'READY',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
}

// Forward-only. A farmer may skip ahead (produce collected straight from the
// farm never sits READY) but may never walk a stage back — the buyer has
// already been told, and a reversal would make the trail a lie.
export const FULFILLMENT_STAGE_ORDER: FulfillmentStage[] = [
  FulfillmentStage.PREPARING,
  FulfillmentStage.READY,
  FulfillmentStage.IN_TRANSIT,
  FulfillmentStage.DELIVERED,
];

export const FULFILLMENT_STAGE_LABEL: Record<FulfillmentStage, string> = {
  [FulfillmentStage.PREPARING]: 'Preparing produce',
  [FulfillmentStage.READY]: 'Ready for collection',
  [FulfillmentStage.IN_TRANSIT]: 'On the way',
  [FulfillmentStage.DELIVERED]: 'Delivered',
};

export const ORDER_FULFILLMENT_LABEL: Record<OrderFulfillmentStatus, string> = {
  [OrderFulfillmentStatus.AWAITING_PAYMENT]: 'Awaiting payment',
  [OrderFulfillmentStatus.IN_FULFILLMENT]: 'Being prepared',
  [OrderFulfillmentStatus.RECEIVED]: 'Received',
  [OrderFulfillmentStatus.COMPLETED]: 'Completed',
  [OrderFulfillmentStatus.DISPUTED]: 'Disputed',
};

export const ORDER_PAYMENT_LABEL: Record<OrderPaymentStatus, string> = {
  [OrderPaymentStatus.PENDING_PAYMENT]: 'Awaiting payment',
  [OrderPaymentStatus.PAID]: 'Paid',
  [OrderPaymentStatus.FAILED]: 'Payment failed',
  [OrderPaymentStatus.REFUNDED]: 'Refunded',
  // Not "failed". The buyer is told we are checking, because we do not yet know
  // whether their money left their account.
  [OrderPaymentStatus.UNRESOLVED]: 'Payment being checked',
};

export enum ListingStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD_OUT = 'SOLD_OUT',
  INACTIVE = 'INACTIVE',
}

export enum ListingUnit {
  KG = 'KG',
  BAG = 'BAG',
  CRATE = 'CRATE',
  LITRE = 'LITRE',
  PIECE = 'PIECE',
}

// Marketplace produce taxonomy (Marketplace Rebuild, Stage 3). Powers the feed
// category nav, filters, and the create-listing form. Extensible by design:
// adding a category is a one-line change to the enum + the two constants below —
// no schema migration and no admin UI required.
export enum ListingCategory {
  VEGETABLES = 'VEGETABLES',
  FRUITS = 'FRUITS',
  CEREALS = 'CEREALS',
  LEGUMES = 'LEGUMES',
  LIVESTOCK = 'LIVESTOCK',
  DAIRY = 'DAIRY',
  POULTRY = 'POULTRY',
  SEEDS = 'SEEDS',
  FARM_INPUTS = 'FARM_INPUTS',
  EQUIPMENT = 'EQUIPMENT',
}

// Display order for the category nav and pickers — one source of truth so the
// feed, filters, and listing form never drift.
export const LISTING_CATEGORY_ORDER: ListingCategory[] = [
  ListingCategory.VEGETABLES,
  ListingCategory.FRUITS,
  ListingCategory.CEREALS,
  ListingCategory.LEGUMES,
  ListingCategory.LIVESTOCK,
  ListingCategory.DAIRY,
  ListingCategory.POULTRY,
  ListingCategory.SEEDS,
  ListingCategory.FARM_INPUTS,
  ListingCategory.EQUIPMENT,
];

export const LISTING_CATEGORY_LABEL: Record<ListingCategory, string> = {
  [ListingCategory.VEGETABLES]: 'Vegetables',
  [ListingCategory.FRUITS]: 'Fruits',
  [ListingCategory.CEREALS]: 'Cereals & Grains',
  [ListingCategory.LEGUMES]: 'Legumes',
  [ListingCategory.LIVESTOCK]: 'Livestock',
  [ListingCategory.DAIRY]: 'Dairy',
  [ListingCategory.POULTRY]: 'Poultry',
  [ListingCategory.SEEDS]: 'Seeds',
  [ListingCategory.FARM_INPUTS]: 'Farm Inputs',
  [ListingCategory.EQUIPMENT]: 'Equipment',
};

export enum DocumentType {
  NATIONAL_ID = 'NATIONAL_ID',
  COOPERATIVE_CARD = 'COOPERATIVE_CARD',
  PASSPORT = 'PASSPORT',
}

/**
 * How a document type is written for a person to read. Lives here beside the
 * enum because it was previously declared three times — once in the admin
 * farmer detail, once inside a render function in the verification queue, and
 * not at all on the farmer's own profile, which showed them the raw
 * `NATIONAL_ID`.
 */
export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  [DocumentType.NATIONAL_ID]: 'National ID',
  [DocumentType.COOPERATIVE_CARD]: 'Cooperative card',
  [DocumentType.PASSPORT]: 'Passport',
};

export enum FarmerTrustTier {
  NEW = 'NEW',
  ESTABLISHED = 'ESTABLISHED',
  TRUSTED = 'TRUSTED',
  PREMIUM = 'PREMIUM',
}

// ---------------------------------------------------------------------------
// Academic context
//
// Kenyan CS/IT curricula are developed against CUE guidelines benchmarked to
// the IEEE/ACM computing curricula: institutions name the same subject
// differently — SCS 301, BCS 2205, ICS 2304 and CIT 3151 may all be Database
// Systems II — but the discipline underneath does not vary. The platform
// therefore reasons about subject matter and never about institutional unit
// codes; a per-institution unit is a *label* mapped onto this closed,
// platform-owned taxonomy. Onboarding a new university is then a mapping
// exercise rather than a new integration.
// ---------------------------------------------------------------------------

export enum KnowledgeArea {
  PROGRAMMING_FUNDAMENTALS = 'PROGRAMMING_FUNDAMENTALS',
  DATA_STRUCTURES_ALGORITHMS = 'DATA_STRUCTURES_ALGORITHMS',
  DATABASE_SYSTEMS = 'DATABASE_SYSTEMS',
  NETWORKING = 'NETWORKING',
  OPERATING_SYSTEMS = 'OPERATING_SYSTEMS',
  SOFTWARE_ENGINEERING = 'SOFTWARE_ENGINEERING',
  WEB_DEVELOPMENT = 'WEB_DEVELOPMENT',
  MOBILE_DEVELOPMENT = 'MOBILE_DEVELOPMENT',
  ARTIFICIAL_INTELLIGENCE = 'ARTIFICIAL_INTELLIGENCE',
  MACHINE_LEARNING = 'MACHINE_LEARNING',
  DATA_ENGINEERING = 'DATA_ENGINEERING',
  CLOUD_COMPUTING = 'CLOUD_COMPUTING',
  DISTRIBUTED_SYSTEMS = 'DISTRIBUTED_SYSTEMS',
  INFORMATION_SECURITY = 'INFORMATION_SECURITY',
  HUMAN_COMPUTER_INTERACTION = 'HUMAN_COMPUTER_INTERACTION',
  SYSTEMS_ANALYSIS_DESIGN = 'SYSTEMS_ANALYSIS_DESIGN',
  COMPUTER_ARCHITECTURE = 'COMPUTER_ARCHITECTURE',
  RESEARCH_METHODS = 'RESEARCH_METHODS',
}

/** The only two disciplines in scope. Other faculties are future scope. */
export enum AcademicDiscipline {
  CS = 'CS',
  IT = 'IT',
}

/**
 * How the platform came to believe a student's academic record. These are the
 * rungs of the capability ladder that are actually implemented; self-declared
 * data is never presented as though it had been confirmed by anyone.
 */
export enum AcademicProvenance {
  SELF_DECLARED = 'SELF_DECLARED',
  INSTITUTION_CURRICULUM = 'INSTITUTION_CURRICULUM',
}

export const ACADEMIC_PROVENANCE_LABEL: Record<AcademicProvenance, string> = {
  [AcademicProvenance.SELF_DECLARED]: 'You told us this',
  [AcademicProvenance.INSTITUTION_CURRICULUM]: 'From your institution’s published curriculum',
};

/** Kenyan degrees run two teaching semesters a year; a few run three. */
export const MAX_SEMESTERS_PER_YEAR = 3;
export const MAX_PROGRAMME_YEARS = 6;
/** How many units a student may declare as current. A Kenyan semester is 5–8. */
export const MAX_CURRENT_UNITS = 10;

export enum ProjectTrack {
  OPEN_SOURCE = 'OPEN_SOURCE',
  AI_BRIEF = 'AI_BRIEF',
  // A brief a lecturer wrote themselves. Their knowledge of their own cohort
  // beats any generator, and a platform that cannot accept that is telling
  // academics their judgement is unwelcome.
  LECTURER_ASSIGNED = 'LECTURER_ASSIGNED',
}

/**
 * Where a lecturer's project stands. A draft is theirs alone; an open project
 * can be taken up; a closed one keeps its history but takes nobody new.
 */
export enum AssignmentStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

/** How a student came to be working on a lecturer's project. */
export enum AssignmentAudience {
  /** Offered to the lecturer's cohort; a student chooses it. */
  COHORT = 'COHORT',
  /** Given to named students; nobody else sees it. */
  NAMED = 'NAMED',
}

export enum ProjectStatus {
  BRIEF_GENERATED = 'BRIEF_GENERATED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  UNDER_PEER_REVIEW = 'UNDER_PEER_REVIEW',
  UNDER_LECTURER_REVIEW = 'UNDER_LECTURER_REVIEW',
  /**
   * The report has been accepted and the student may book a demonstration.
   *
   * A report is reviewed before a demonstration is scheduled, so that a
   * lecturer arrives at the meeting having read the project rather than
   * meeting it for the first time — and so that lecturer time, the binding
   * constraint on this whole workflow, is spent on work worth demonstrating.
   */
  READY_FOR_DEMONSTRATION = 'READY_FOR_DEMONSTRATION',
  /** A demonstration is booked and accepted; the meeting has not happened yet. */
  DEMONSTRATION_SCHEDULED = 'DEMONSTRATION_SCHEDULED',
  /**
   * The project is complete: report accepted, system demonstrated live,
   * demonstration approved. Shown to students as "Complete" — the enum keeps
   * its original name because it is written into existing records, but the
   * credential framing it was named for is retired.
   */
  VERIFIED = 'VERIFIED',
  REVISION_REQUIRED = 'REVISION_REQUIRED',
  DENIED = 'DENIED',
}

/**
 * The statuses in which a project is still the student's current work.
 *
 * Three routes ask this same question — which project is the student on, may
 * they start another, and what is the mentor talking about — and each kept its
 * own copy of the answer. When the demonstration stage added two statuses, all
 * three lists were left behind, so a student whose report had just been
 * accepted lost their project from their own workspace at exactly the moment
 * the assessment moved to the part that matters.
 *
 * Terminal statuses are excluded: a verified or closed project is history, not
 * current work. Anything that is neither finished nor abandoned belongs here,
 * and a status added to the lifecycle without being considered here is a bug of
 * the kind this constant now exists to make impossible.
 */
export const ACTIVE_PROJECT_STATUSES: ProjectStatus[] = [
  ProjectStatus.BRIEF_GENERATED,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.SUBMITTED,
  ProjectStatus.UNDER_PEER_REVIEW,
  ProjectStatus.UNDER_LECTURER_REVIEW,
  ProjectStatus.READY_FOR_DEMONSTRATION,
  ProjectStatus.DEMONSTRATION_SCHEDULED,
  ProjectStatus.REVISION_REQUIRED,
];

export enum LecturerDecision {
  VERIFIED = 'VERIFIED',
  REVISION_REQUIRED = 'REVISION_REQUIRED',
  DENIED = 'DENIED',
}

// ---------------------------------------------------------------------------
// The project report.
//
// One report replaces the three separate prose documents a student used to
// maintain. The structured logs they kept while building — blockers and AI
// usage — remain as structured data; it is the *academic deliverable* that
// becomes single, not the platform's record of the work.
//
// The section list is the UmojaHub Project Report Standard V1
// (`webapp-reset/UMOJAHUB_PROJECT_REPORT_STANDARD_V1.md`), held in the
// application at `src/lib/education/reportStandard.ts`.
// ---------------------------------------------------------------------------

/**
 * The sections the UmojaHub Project Report Standard asks for.
 *
 * These are **not** fields a student fills in. The student writes their report
 * in whatever they normally use and uploads the finished PDF; this list is the
 * standard they write it against, and it is what the lecturer's review
 * checklist is built from. UmojaHub provides the standard and receives the
 * document — it is not a document editor.
 */
export enum ReportSectionKey {
  TITLE = 'title',
  ABSTRACT = 'abstract',
  ORIGINALITY_AND_AI_USE = 'originalityAndAiUse',
  INTRODUCTION = 'introduction',
  PROBLEM_STATEMENT = 'problemStatement',
  OBJECTIVES = 'objectives',
  SCOPE_AND_JUSTIFICATION = 'scopeAndJustification',
  RELATED_WORK = 'relatedWork',
  REQUIREMENTS = 'requirements',
  SYSTEM_ANALYSIS = 'systemAnalysis',
  SYSTEM_ARCHITECTURE = 'systemArchitecture',
  DATABASE_DESIGN = 'databaseDesign',
  INTERFACE_DESIGN = 'interfaceDesign',
  TECHNOLOGY_CHOICES = 'technologyChoices',
  IMPLEMENTATION = 'implementation',
  SECURITY = 'security',
  TESTING = 'testing',
  DEPLOYMENT = 'deployment',
  CHALLENGES_AND_SOLUTIONS = 'challengesAndSolutions',
  LIMITATIONS = 'limitations',
  FUTURE_IMPROVEMENTS = 'futureImprovements',
  CONCLUSION = 'conclusion',
  DEMONSTRATION_READINESS = 'demonstrationReadiness',
  REFERENCES = 'references',
  APPENDICES = 'appendices',
}

/** The five parts the standard groups its sections into. */
export enum ReportSectionPart {
  FRONT_MATTER = 'FRONT_MATTER',
  PROBLEM = 'PROBLEM',
  ENGINEERING = 'ENGINEERING',
  REFLECTION = 'REFLECTION',
  BACK_MATTER = 'BACK_MATTER',
}

/**
 * Whether the standard asks for a section of every project.
 *
 * `CONDITIONAL` is not "optional if busy" — it is required whenever its stated
 * condition holds. A lecturer checking a report against the standard is told
 * the condition, and decides.
 */
export enum SectionRequirement {
  REQUIRED = 'REQUIRED',
  CONDITIONAL = 'CONDITIONAL',
}

// ---------------------------------------------------------------------------
// Submitted project documentation.
//
// The student's formal academic deliverable is a file they wrote elsewhere and
// uploaded. Every submission is kept: a revision never overwrites what it
// replaced, because the history of a project — what was asked for, what
// changed, what the lecturer said — is academic record and deleting it would
// destroy the only account of how the work developed.
// ---------------------------------------------------------------------------

/**
 * Where one submitted version stands.
 *
 * There is no "approved" here on purpose. A lecturer reading a document decides
 * whether the project is worth demonstrating, not whether it has passed — the
 * project passes at the demonstration, when the system runs.
 */
export enum SubmissionStatus {
  /** With the lecturer, not yet read. */
  SUBMITTED = 'SUBMITTED',
  /** Read, and sent back with what has to change. */
  REVISION_REQUESTED = 'REVISION_REQUESTED',
  /** Read, and good enough to demonstrate against. */
  READY_FOR_DEMONSTRATION = 'READY_FOR_DEMONSTRATION',
  /** Replaced by a later version. Kept, never deleted. */
  SUPERSEDED = 'SUPERSEDED',
}

/** A lecturer's decision on one submitted version. */
export enum DocumentationOutcome {
  REVISION_REQUESTED = 'REVISION_REQUESTED',
  READY_FOR_DEMONSTRATION = 'READY_FOR_DEMONSTRATION',
}

/**
 * The lecturer's checklist when reading a submission.
 *
 * Taken from the UmojaHub Project Report Standard rather than invented here, so
 * what a lecturer is asked to look for is exactly what the student was told to
 * write. Each item maps to a section of the standard.
 */
export const DOCUMENTATION_CHECKLIST = [
  'problemDefined',
  'objectivesPresent',
  'academicConnectionClear',
  'requirementsDocumented',
  'architectureDocumented',
  'designExplained',
  'implementationExplained',
  'testingDocumented',
  'resultsPresented',
  'limitationsIdentified',
  'referencesProvided',
  'evidenceCredible',
  'reflectsActualProject',
] as const;

export type DocumentationChecklistItem = (typeof DOCUMENTATION_CHECKLIST)[number];

export const DOCUMENTATION_CHECKLIST_LABEL: Record<DocumentationChecklistItem, string> = {
  problemDefined: 'Problem clearly defined',
  objectivesPresent: 'Objectives present and checkable',
  academicConnectionClear: 'Connection to their coursework is clear',
  requirementsDocumented: 'Requirements documented, functional and non-functional',
  architectureDocumented: 'System architecture documented',
  designExplained: 'Design explained — data model and interfaces',
  implementationExplained: 'Implementation and technical decisions explained',
  testingDocumented: 'Testing documented',
  resultsPresented: 'Results presented, not just a plan',
  limitationsIdentified: 'Limitations identified honestly',
  referencesProvided: 'References provided and cited in the body',
  evidenceCredible: 'Evidence appears credible',
  reflectsActualProject: 'Documentation reflects a system that was actually built',
};

/** Which section of the standard each checklist item is asking about. */
export const DOCUMENTATION_CHECKLIST_SECTION: Record<
  DocumentationChecklistItem,
  ReportSectionKey
> = {
  problemDefined: ReportSectionKey.PROBLEM_STATEMENT,
  objectivesPresent: ReportSectionKey.OBJECTIVES,
  academicConnectionClear: ReportSectionKey.INTRODUCTION,
  requirementsDocumented: ReportSectionKey.REQUIREMENTS,
  architectureDocumented: ReportSectionKey.SYSTEM_ARCHITECTURE,
  designExplained: ReportSectionKey.DATABASE_DESIGN,
  implementationExplained: ReportSectionKey.IMPLEMENTATION,
  testingDocumented: ReportSectionKey.TESTING,
  resultsPresented: ReportSectionKey.TESTING,
  limitationsIdentified: ReportSectionKey.LIMITATIONS,
  referencesProvided: ReportSectionKey.REFERENCES,
  evidenceCredible: ReportSectionKey.IMPLEMENTATION,
  reflectsActualProject: ReportSectionKey.DEMONSTRATION_READINESS,
};

// ---------------------------------------------------------------------------
// The physical demonstration.
//
// The centre of assessment. The academic guideline this workflow follows
// weighted the system demonstration at 60 marks of 100 against 30 for
// documentation: a report can be fabricated, generated or written by somebody
// else, and marking one tells you about a student's writing. A system running
// in front of you, with questions, tells you whether they built it.
//
// The lecturer schedules it once they have read the documentation, so they
// arrive knowing the project rather than meeting it for the first time.
// ---------------------------------------------------------------------------

/**
 * Where one published slot in a lecturer's diary stands.
 *
 * A slot is the lecturer's offer of time, not the appointment itself: the
 * appointment is a `Demonstration`. Keeping the two apart is what lets a
 * declined or cancelled demonstration hand the time back rather than lose it.
 *
 * `WITHDRAWN` rather than deleted, because a lecturer taking back an hour they
 * had offered should not erase a record a student may have been reading a
 * minute earlier.
 */
export enum SlotStatus {
  OPEN = 'OPEN',
  BOOKED = 'BOOKED',
  WITHDRAWN = 'WITHDRAWN',
}

/**
 * How the demonstration is held.
 *
 * Two, and no more. The platform does not host the call and does not book the
 * room — it records which of the two this is and where, so a student and a
 * lecturer arrive at the same place. Anything beyond that is a calendar
 * product, and this is not one.
 */
export enum DemonstrationFormat {
  VIDEO_CALL = 'VIDEO_CALL',
  IN_PERSON = 'IN_PERSON',
}

export enum DemonstrationStatus {
  /**
   * The student has asked for a slot. The time is held, but the lecturer has
   * not agreed to it yet — a booking nobody accepted is a meeting only one
   * person is expecting to attend.
   */
  REQUESTED = 'REQUESTED',
  SCHEDULED = 'SCHEDULED',
  /** The lecturer refused the request. The slot goes back on offer. */
  DECLINED = 'DECLINED',
  CANCELLED = 'CANCELLED',
  /** It took place. Only a lecturer may say so. */
  COMPLETED = 'COMPLETED',
  EVALUATED = 'EVALUATED',
}

/**
 * The outcome of a demonstration.
 *
 * `NOT_READY` is distinct from `REVISION_REQUIRED` and the difference is
 * worth keeping: one says the work needs specific changes, the other says it
 * was not in a state to be assessed at all. A student told which is which knows
 * whether they are finishing something or restarting it.
 */
export enum DemonstrationOutcome {
  APPROVED = 'APPROVED',
  REVISION_REQUIRED = 'REVISION_REQUIRED',
  NOT_READY = 'NOT_READY',
}

/** How long a demonstration may run. A demonstration is not a lecture. */
export const DEMONSTRATION_MIN_MINUTES = 15;
export const DEMONSTRATION_MAX_MINUTES = 180;

/**
 * The six things a lecturer judges at a demonstration.
 *
 * These extend the four documentation-review dimensions rather than replacing
 * them: reading a report establishes what a student wrote, and a demonstration
 * establishes what they understand. `designJustification` and
 * `responseToQuestioning` have no equivalent on paper, which is the point.
 */
export const DEMONSTRATION_CRITERIA = [
  'problemUnderstanding',
  'systemFunctionality',
  'technicalDepth',
  'designJustification',
  'responseToQuestioning',
  'engineeringPractice',
] as const;

export type DemonstrationCriterion = (typeof DEMONSTRATION_CRITERIA)[number];

export const DEMONSTRATION_CRITERION_LABEL: Record<DemonstrationCriterion, string> = {
  problemUnderstanding: 'Problem understanding',
  systemFunctionality: 'System functionality',
  technicalDepth: 'Technical depth',
  designJustification: 'Design justification',
  responseToQuestioning: 'Response to questioning',
  engineeringPractice: 'Engineering practice',
};

export const DEMONSTRATION_CRITERION_PROMPT: Record<DemonstrationCriterion, string> = {
  problemUnderstanding: 'Do they know what they built and who it is for?',
  systemFunctionality: 'Does the system actually work, in the flows they showed you?',
  technicalDepth: 'Do they understand their own implementation below the surface?',
  designJustification:
    'Can they defend their architecture, schema and technology choices, including the alternatives they rejected?',
  responseToQuestioning:
    'Can they reason about their system in real time, including about things they had not prepared?',
  engineeringPractice:
    'Testing, error handling, security, deployment, and honesty about limitations.',
};

export enum PriceHistorySource {
  LISTING_CREATED = 'LISTING_CREATED',
  ORDER_COMPLETED = 'ORDER_COMPLETED',
  EXTERNAL_INGESTION = 'EXTERNAL_INGESTION',
}

export enum KnowledgeCategory {
  FERTILIZER_VERIFICATION = 'FERTILIZER_VERIFICATION',
  SEED_VERIFICATION = 'SEED_VERIFICATION',
  ANIMAL_HEALTH = 'ANIMAL_HEALTH',
  PEST_DISEASE = 'PEST_DISEASE',
  SEASONAL_CALENDAR = 'SEASONAL_CALENDAR',
  POST_HARVEST = 'POST_HARVEST',
  MARKET_DYNAMICS = 'MARKET_DYNAMICS',
  NEW_METHODS = 'NEW_METHODS',
}

export enum SupplierInputCategory {
  FERTILIZER = 'FERTILIZER',
  SEED = 'SEED',
  PESTICIDE = 'PESTICIDE',
  VETERINARY = 'VETERINARY',
  EQUIPMENT = 'EQUIPMENT',
}

export enum SupplierVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  SUSPENDED = 'SUSPENDED',
}

export enum GroupStatus {
  ACTIVE = 'ACTIVE',
  DISSOLVED = 'DISSOLVED',
}

export enum GroupOrderStatus {
  OPEN = 'OPEN',
  MINIMUM_MET = 'MINIMUM_MET',
  CLOSED = 'CLOSED',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
}

export enum PriceAlertNotificationMethod {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  BOTH = 'BOTH',
}

export enum PeerReviewStatus {
  ASSIGNED = 'ASSIGNED',
  SUBMITTED = 'SUBMITTED',
  WAIVED = 'WAIVED',
}

export enum FulfillmentType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

export enum BuyerContactPreference {
  PHONE = 'PHONE',
  PLATFORM_MESSAGE = 'PLATFORM_MESSAGE',
}

export enum WithdrawalRequestStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
}

export enum MediationRequestStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
}

export enum MediationCategory {
  NOT_DELIVERED = 'NOT_DELIVERED',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  WRONG_QUANTITY = 'WRONG_QUANTITY',
  OTHER = 'OTHER',
  // Farmer-side: the buyer has the produce but has not confirmed receipt, so
  // the escrow will not release. Previously the farmer had no way to raise this
  // at all — only buyers could escalate.
  RECEIPT_NOT_CONFIRMED = 'RECEIPT_NOT_CONFIRMED',
}

// Which party raised an escalation. Both can now; the gates and the categories
// available differ by side.
export enum MediationInitiator {
  BUYER = 'BUYER',
  FARMER = 'FARMER',
}

// Categories each side may file under.
export const BUYER_MEDIATION_CATEGORIES: MediationCategory[] = [
  MediationCategory.NOT_DELIVERED,
  MediationCategory.QUALITY_ISSUE,
  MediationCategory.WRONG_QUANTITY,
  MediationCategory.OTHER,
];

export const FARMER_MEDIATION_CATEGORIES: MediationCategory[] = [
  MediationCategory.RECEIPT_NOT_CONFIRMED,
  MediationCategory.OTHER,
];

// ---------------------------------------------------------------------------
// Payments — provider abstraction + simulation layer
// The order/webhook contract is provider-agnostic: the simulator emits the same
// Daraja-shaped callbacks the real provider would, through the same processor.
// ---------------------------------------------------------------------------

export enum PaymentProviderName {
  SIMULATION = 'simulation',
  DARAJA_SANDBOX = 'daraja-sandbox',
  DARAJA_PRODUCTION = 'daraja-production',
}

// Outcomes a simulated STK push can resolve to. Each maps to a real Daraja
// ResultCode so the downstream contract is identical to production.
export enum SimulatedOutcome {
  SUCCESS = 'SUCCESS',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  USER_CANCELLED = 'USER_CANCELLED',
  PHONE_UNREACHABLE = 'PHONE_UNREACHABLE',
  TIMEOUT = 'TIMEOUT',
  NETWORK_FAILURE = 'NETWORK_FAILURE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  // The callback is never delivered — exercises the stuck-payment/reconciliation
  // path (the order sits PENDING_PAYMENT until the cron reconciles it).
  LOST = 'LOST',
}

export enum SimulatedPaymentStatus {
  SCHEDULED = 'SCHEDULED',
  DELIVERED = 'DELIVERED',
  LOST = 'LOST',
  CANCELLED = 'CANCELLED',
}

export enum PaymentEventType {
  INITIATED = 'INITIATED',
  CALLBACK_RECEIVED = 'CALLBACK_RECEIVED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  DUPLICATE = 'DUPLICATE',
  TIMEOUT = 'TIMEOUT',
  LOST = 'LOST',
  RECONCILED = 'RECONCILED',
  // Reconciliation asked the provider what happened and got no usable answer.
  // Distinct from RECONCILED, which records a payment we established had failed.
  UNRESOLVED = 'UNRESOLVED',
}

/**
 * Who caused a payment event.
 *
 * The log recorded buyerId and farmerId on every row — the parties to the
 * order — but never which of them, or neither, actually acted. A buyer
 * cancelling on their handset, Safaricom timing the prompt out, and our own
 * reconciliation closing the payment are three different things, and the log
 * could not tell them apart after the fact. Causation, not participation.
 */
export enum PaymentEventActor {
  /** The buyer acted: opened a payment session, entered or refused a PIN. */
  BUYER = 'BUYER',
  /** M-Pesa spoke — a callback, a status query answer, an expiry. */
  PROVIDER = 'PROVIDER',
  /** UmojaHub itself acted with nobody prompting it: reconciliation, sweeps. */
  SYSTEM = 'SYSTEM',
  /** An administrator acted by hand. */
  ADMIN = 'ADMIN',
}

// ---------------------------------------------------------------------------
// Escrow — a derived view over Order + MediationRequest, not a stored wallet.
// The platform receives buyer funds to its M-Pesa shortcode at payment (PAID),
// holds them through fulfilment, and they become releasable to the farmer only
// once the buyer confirms receipt (order COMPLETED). An open mediation blocks
// release; an admin refund returns the funds to the buyer (REFUNDED/DISPUTED).
// EscrowState is the per-order projection surfaced to all three roles.
// ---------------------------------------------------------------------------

export enum EscrowState {
  // Order not yet paid (PENDING_PAYMENT) or payment failed — nothing is held.
  NO_FUNDS = 'NO_FUNDS',
  // The payment timed out and the provider could not say whether the buyer was
  // charged (OrderPaymentStatus.UNRESOLVED).
  //
  // This used to project to NO_FUNDS, which made every escrow surface state
  // that nothing had been taken from the buyer's account — on the same order
  // whose notification told them to check their M-Pesa messages because the
  // money may well have gone. Not knowing is not the same as knowing nothing
  // was taken, and it is the one distinction this platform is careful about
  // everywhere else. It is a state of its own so that no surface can collapse
  // it into a claim by accident: the maps that switch on EscrowState are
  // exhaustive, so anything that renders escrow must now say what it means.
  UNKNOWN = 'UNKNOWN',
  // Paid and in fulfilment, farmer has not yet confirmed dispatch.
  HELD = 'HELD',
  // Paid and in fulfilment, farmer confirmed dispatch — awaiting buyer receipt.
  HELD_DISPATCHED = 'HELD_DISPATCHED',
  // An open/in-review mediation is blocking release.
  HELD_UNDER_REVIEW = 'HELD_UNDER_REVIEW',
  // Buyer confirmed receipt (COMPLETED) — funds count toward the farmer's
  // releasable balance and may be settled via a payout request.
  RELEASABLE = 'RELEASABLE',
  // Funds returned to the buyer by an admin dispute resolution.
  REFUNDED = 'REFUNDED',
}

// Admin's terminal decision when resolving a mediation, applied to the held
// funds. NONE = resolved without moving money (order continues on its track).
export enum MediationOutcome {
  RELEASE = 'RELEASE',
  REFUND = 'REFUND',
  NONE = 'NONE',
}

// Append-only escrow milestone trail (mirrors PaymentEventLog). HELD when funds
// enter custody at payment; RELEASED when the buyer (or an admin resolution)
// confirms receipt and funds become the farmer's; REFUND_ISSUED when an admin
// returns held funds to the buyer.
export enum EscrowEventType {
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  REFUND_ISSUED = 'REFUND_ISSUED',
}

// ---------------------------------------------------------------------------
// Simulation profiles — named test fixtures, NOT statistics.
//
// The simulator used to carry a single fixed weighting (75% success, 10%
// insufficient funds, and so on). Those numbers were indefensible: asked "why
// 75%?", there is no honest answer, because UmojaHub has never observed a real
// M-Pesa population and any figure would be invented authority.
//
// A profile answers a different and answerable question — not "how often does
// M-Pesa fail?" but "which workflow do I want to exercise right now?". Each one
// is chosen to drive a specific path through the system, the way a test fixture
// is chosen, and is documented as such.
// ---------------------------------------------------------------------------
export enum SimulationProfile {
  /** Every payment succeeds promptly. For walking the happy path uninterrupted. */
  HAPPY_PATH = 'HAPPY_PATH',
  /** A mixed run: mostly success, with each failure mode represented. The default. */
  TYPICAL = 'TYPICAL',
  /** Slow and lost callbacks dominate — exercises reconciliation and the query leg. */
  NETWORK_TROUBLE = 'NETWORK_TROUBLE',
  /** Declines dominate — exercises retry, inventory restoration and buyer messaging. */
  PAYMENT_FAILURE = 'PAYMENT_FAILURE',
  /** Every payment is lost, so every order needs reconciling. For the admin drill. */
  RECONCILIATION_DRILL = 'RECONCILIATION_DRILL',
}

// ---------------------------------------------------------------------------
// Ecosystem extensions — Institution, notifications
// ---------------------------------------------------------------------------

export enum InstitutionType {
  UNIVERSITY = 'UNIVERSITY',
  COLLEGE = 'COLLEGE',
  POLYTECHNIC = 'POLYTECHNIC',
  TVET = 'TVET',
}

// Persisted in-app notification taxonomy. The channel records how it was also
// delivered out-of-band (the existing fire-and-forget SMS/email), if at all.
export enum NotificationType {
  WELCOME = 'WELCOME',
  ORDER_UPDATE = 'ORDER_UPDATE',
  ESCROW_UPDATE = 'ESCROW_UPDATE',
  VERIFICATION_UPDATE = 'VERIFICATION_UPDATE',
  PAYOUT_UPDATE = 'PAYOUT_UPDATE',
  REVIEW_UPDATE = 'REVIEW_UPDATE',
  GROUP_UPDATE = 'GROUP_UPDATE',
  SYSTEM = 'SYSTEM',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
}

// Lifecycle of one ecosystem-simulation run. The SimulationRun ledger records
// every entity a run created so a reset can delete exactly those documents and
// never touch genuine user data.
export enum SimulationRunStatus {
  BUILDING = 'BUILDING',
  ACTIVE = 'ACTIVE',
  RESETTING = 'RESETTING',
  RESET = 'RESET',
}

// ---------------------------------------------------------------------------
// Kenyan counties (used in validation and seed data)
// ---------------------------------------------------------------------------

export const KENYAN_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet',
  'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado',
  'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga',
  'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia',
  'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', "Murang'a", 'Nairobi',
  'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
  'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga',
  'Wajir', 'West Pokot',
] as const;

export type KenyanCounty = (typeof KENYAN_COUNTIES)[number];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_GROUP_MEMBERS = 50;
export const MIN_GROUP_ORDER_MEMBERS = 5;
export const CHAT_SESSION_TTL_DAYS = 90;
export const MENTOR_SESSION_TTL_DAYS = 30;
export const PRICE_ALERT_COOLDOWN_HOURS = 24;
export const MAX_LISTING_IMAGES = 5;
export const BCRYPT_SALT_ROUNDS = 12;
export const REVIEW_MIN_WORD_COUNT = 50;

/**
 * The floor on one demonstration criterion's comment.
 *
 * Lower than `REVIEW_MIN_WORD_COUNT` on purpose. That figure governs a single
 * summary; a demonstration is judged on six criteria, and demanding fifty words
 * of each would be three hundred words per session from a lecturer who may hold
 * several in a week. A form that is abandoned is a feature that does not exist,
 * and an evaluation nobody completes is worth less than a shorter one they do.
 * Fifteen words is still a sentence with a reason in it rather than a grade.
 */
export const DEMONSTRATION_COMMENT_MIN_WORDS = 15;
export const MAX_ASSISTANT_MESSAGE_CHARS = 1000;
export const GITHUB_CACHE_TTL_MINUTES = 60;
export const MEDIATION_ESCALATION_HOURS = 48;

// How long a farmer waits, after confirming dispatch, before they may ask
// UmojaHub to review a buyer who has not confirmed receipt.
//
// This is also the platform's answer to "when do I get paid?": release is the
// buyer's to give, but it is not open-ended. Seven days is long enough for
// upcountry transport and a buyer's inspection, short enough that a farmer's
// money is never stranded indefinitely by silence.
export const FARMER_ESCALATION_HOURS = 168;

/**
 * How long a payment may sit unconfirmed before reconciliation goes and asks
 * the provider what happened to it.
 *
 * The STK prompt itself lives roughly 30 seconds, and the usual guidance is to
 * begin sweeping after about five minutes — long enough that a merely slow
 * callback has arrived, short enough that a buyer is not left watching a dead
 * screen with produce reserved against a payment nobody is chasing.
 *
 * Lives here rather than in `lib/payments/reconcile` because it is also what an
 * operator is told on the Payment Lab, and that is a client component: importing
 * it from the reconciler would pull mongoose, the models and the DB singleton
 * into the browser bundle to read one number. `reconcile` re-exports it, so
 * there is still exactly one definition.
 */
export const STUCK_PAYMENT_TIMEOUT_MINUTES = 5;
