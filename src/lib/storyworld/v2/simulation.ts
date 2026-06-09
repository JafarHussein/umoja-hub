// StoryWorld V2 — simulation core (§8.2). Pure functions only: behavior derivation
// and the monotonic world reducer. No Three.js, no React — fully unit-testable.

import { EPISODE_ROLES } from './config';
import type {
  BehaviorState,
  Chapter,
  ConsequenceId,
  DistrictId,
  InteractionVerb,
  LedgerRecord,
  RoleId,
  WorldState,
} from './types';

// ─── Behavior derivation (§2.3) ───────────────────────────────────────────────
// The Story Clock proposes a state from scroll; the monotonic World Clock can only
// raise it (a settled character never un-settles when the visitor scrubs back).

const ARRIVE_END = 0.18;
const ENGAGE_END = 0.72;
const SETTLE_END = 0.95;

const ORDER: BehaviorState[] = ['dormant', 'arriving', 'engaged', 'settling', 'resident'];

export function episodeChapterOf(role: RoleId): Chapter | null {
  const idx = EPISODE_ROLES.indexOf(role as (typeof EPISODE_ROLES)[number]);
  return idx === -1 ? null : ((idx + 1) as Chapter);
}

export function deriveBehavior(
  role: Exclude<RoleId, 'admin'>,
  chapter: Chapter,
  chapterProgress: number,
  settled: boolean
): BehaviorState {
  if (settled) return 'resident';
  const myChapter = episodeChapterOf(role);
  if (myChapter === null || chapter < myChapter) return 'dormant';
  if (chapter > myChapter) return 'resident';
  if (chapterProgress < ARRIVE_END) return 'arriving';
  if (chapterProgress < ENGAGE_END) return 'engaged';
  if (chapterProgress < SETTLE_END) return 'settling';
  return 'resident';
}

export function behaviorRank(state: BehaviorState): number {
  return ORDER.indexOf(state);
}

/** Settling is recorded once chapter progress passes this point. */
export const SETTLE_RECORD_AT = SETTLE_END;

// ─── World reducer — monotonic (§1.5): events accumulate, never rewind ────────

export function createWorld(): WorldState {
  return {
    settled: [],
    records: [],
    discoveredHidden: [],
    firstInteractions: [],
    consequencesFired: [],
    nextSeq: 1,
  };
}

function pushRecord(
  w: WorldState,
  id: string,
  role: RoleId,
  kind: LedgerRecord['kind']
): WorldState {
  if (w.records.some(r => r.id === id)) return w;
  const record: LedgerRecord = { id, role, kind, seq: w.nextSeq };
  return { ...w, records: [...w.records, record], nextSeq: w.nextSeq + 1 };
}

export function worldSettle(w: WorldState, role: Exclude<RoleId, 'admin'>): WorldState {
  if (w.settled.includes(role)) return w;
  const next = { ...w, settled: [...w.settled, role] };
  return pushRecord(next, `settle:${role}`, role, 'settlement');
}

export function worldFireConsequence(
  w: WorldState,
  id: ConsequenceId,
  role: RoleId
): WorldState {
  if (w.consequencesFired.includes(id)) return w;
  const next = { ...w, consequencesFired: [...w.consequencesFired, id] };
  return pushRecord(next, `consequence:${id}`, role, 'consequence');
}

export function worldDiscover(w: WorldState, district: DistrictId): WorldState {
  if (w.discoveredHidden.includes(district)) return w;
  const next = { ...w, discoveredHidden: [...w.discoveredHidden, district] };
  return pushRecord(next, `discover:${district}`, 'admin', 'discovery');
}

export function worldFirstInteraction(w: WorldState, verb: InteractionVerb): WorldState {
  if (w.firstInteractions.includes(verb)) return w;
  const next = { ...w, firstInteractions: [...w.firstInteractions, verb] };
  return pushRecord(next, `interaction:${verb}`, 'admin', 'interaction');
}

/** The constellation fires when every district's hidden record is found (§5.7). */
export function constellationEarned(w: WorldState): boolean {
  return w.discoveredHidden.length >= 8;
}
