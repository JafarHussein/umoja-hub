// StoryWorld V2 — "The Commons" type system.
// See STORYWORLD_V2_EXPERIENCE_ARCHITECTURE.md for the governing architecture.

export type RoleId =
  | 'farmer'
  | 'buyer'
  | 'student'
  | 'lecturer'
  | 'employer'
  | 'cooperative'
  | 'ngo'
  | 'admin';

export type DistrictId =
  | 'fields'
  | 'depot'
  | 'studio'
  | 'review-chamber'
  | 'bureau'
  | 'circle'
  | 'field-station'
  | 'ledger';

/** Character behavior state machine (§2.3). AWARE is an overlay, not a base state. */
export type BehaviorState = 'dormant' | 'arriving' | 'engaged' | 'settling' | 'resident';

/** Chapter 0 = prologue, 1–7 = episodes, 8 = finale. */
export type Chapter = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Every Administrator answer is bound to one of these world events (§6.6). */
export type ConsequenceId =
  | 'buyer-verification'
  | 'escrow-flow'
  | 'trust-score-increment'
  | 'named-verification'
  | 'portfolio-docked'
  | 'hash-sealed'
  | 'review-queue'
  | 'review-on-record'
  | 'chain-unfolded'
  | 'dual-review'
  | 'group-order'
  | 'methodology-published'
  | 'impact-stream'
  | 'audit-logged'
  | 'record-permanence'
  | 'visit-recorded';

export type RecordKind = 'consequence' | 'settlement' | 'discovery' | 'interaction';

/** One ring on the Ledger column (§1.4). The world remembers. */
export interface LedgerRecord {
  id: string;
  role: RoleId;
  kind: RecordKind;
  /** Monotonic sequence — order on the column. */
  seq: number;
}

export type InteractionVerb = 'notice' | 'inspect' | 'ask' | 'turn' | 'lift';

export interface DialogueLineV2 {
  id: string;
  speaker: RoleId;
  text: string;
  /** 0–1 within the chapter at which this line triggers. */
  triggerAt: number;
  /** Required on every Administrator answer — enforced by data integrity test. */
  consequence?: ConsequenceId;
  /** Attaches a follow-up chip to this line (§6.4). */
  branchId?: string;
}

export interface BranchDef {
  id: string;
  /** Episode chapter (1–7) or 8 for finale. */
  chapter: Chapter;
  chipLabel: string;
  lines: { speaker: RoleId; text: string }[];
}

export interface EpisodeV2 {
  /** Chapter number 1–7. */
  chapter: Chapter;
  role: Exclude<RoleId, 'admin'>;
  district: Exclude<DistrictId, 'ledger'>;
  dialogue: DialogueLineV2[];
}

export interface FactCard {
  id: string;
  district: DistrictId;
  /** World-space offset from district center. */
  offset: [number, number, number];
  title: string;
  body: string;
  /** Optional IBM Plex Mono detail line (hash fragment, record id). */
  mono?: string;
}

export interface HiddenRecordDef {
  id: string;
  district: DistrictId;
  offset: [number, number, number];
  title: string;
  body: string;
}

export interface MicroLines {
  role: RoleId;
  asides: string[];
  lifted: string;
}

export interface WorldState {
  settled: RoleId[];
  records: LedgerRecord[];
  discoveredHidden: DistrictId[];
  firstInteractions: InteractionVerb[];
  consequencesFired: ConsequenceId[];
  /** Monotonic record sequence counter. */
  nextSeq: number;
}

export interface ChapterState {
  chapter: Chapter;
  chapterProgress: number;
}
