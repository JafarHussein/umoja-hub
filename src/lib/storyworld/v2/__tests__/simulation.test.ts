import { deriveChapter, EPISODE_ROLES, FINALE_START, PROLOGUE_END } from '../config';
import {
  behaviorRank,
  constellationEarned,
  createWorld,
  deriveBehavior,
  episodeChapterOf,
  worldDiscover,
  worldFireConsequence,
  worldFirstInteraction,
  worldSettle,
} from '../simulation';
import type { DistrictId, WorldState } from '../types';

describe('deriveChapter', () => {
  it('maps 0 to the prologue', () => {
    expect(deriveChapter(0)).toEqual({ chapter: 0, chapterProgress: 0 });
  });

  it('maps the prologue range to chapter 0 with rising progress', () => {
    const mid = deriveChapter(PROLOGUE_END / 2);
    expect(mid.chapter).toBe(0);
    expect(mid.chapterProgress).toBeCloseTo(0.5);
  });

  it('maps each episode band to chapters 1–7', () => {
    for (let i = 0; i < 7; i++) {
      const p = PROLOGUE_END + (i + 0.5) * 0.12;
      const st = deriveChapter(p);
      expect(st.chapter).toBe(i + 1);
      expect(st.chapterProgress).toBeCloseTo(0.5);
    }
  });

  it('maps the finale band to chapter 8', () => {
    expect(deriveChapter(FINALE_START).chapter).toBe(8);
    expect(deriveChapter(1).chapter).toBe(8);
    expect(deriveChapter(1).chapterProgress).toBe(1);
  });

  it('clamps out-of-range progress', () => {
    expect(deriveChapter(-0.5).chapter).toBe(0);
    expect(deriveChapter(1.5).chapter).toBe(8);
  });
});

describe('deriveBehavior', () => {
  it('is dormant before its own chapter', () => {
    expect(deriveBehavior('buyer', 1, 0.9, false)).toBe('dormant');
    expect(deriveBehavior('ngo', 0, 0.5, false)).toBe('dormant');
  });

  it('walks through arriving → engaged → settling → resident within its chapter', () => {
    expect(deriveBehavior('farmer', 1, 0.05, false)).toBe('arriving');
    expect(deriveBehavior('farmer', 1, 0.4, false)).toBe('engaged');
    expect(deriveBehavior('farmer', 1, 0.8, false)).toBe('settling');
    expect(deriveBehavior('farmer', 1, 0.97, false)).toBe('resident');
  });

  it('is resident after its chapter has passed', () => {
    expect(deriveBehavior('farmer', 3, 0.1, false)).toBe('resident');
  });

  it('settled overrides everything — scrubbing back never un-settles (§1.5)', () => {
    expect(deriveBehavior('farmer', 0, 0, true)).toBe('resident');
    expect(deriveBehavior('ngo', 1, 0.2, true)).toBe('resident');
  });

  it('orders states by rank', () => {
    expect(behaviorRank('dormant')).toBeLessThan(behaviorRank('arriving'));
    expect(behaviorRank('arriving')).toBeLessThan(behaviorRank('engaged'));
    expect(behaviorRank('engaged')).toBeLessThan(behaviorRank('settling'));
    expect(behaviorRank('settling')).toBeLessThan(behaviorRank('resident'));
  });

  it('maps every episode role to its chapter', () => {
    EPISODE_ROLES.forEach((role, i) => {
      expect(episodeChapterOf(role)).toBe(i + 1);
    });
    expect(episodeChapterOf('admin')).toBeNull();
  });
});

describe('world reducer — monotonicity and idempotence', () => {
  it('settles a role exactly once and writes one settlement record', () => {
    let w = createWorld();
    w = worldSettle(w, 'farmer');
    const after = worldSettle(w, 'farmer');
    expect(after).toBe(w);
    expect(w.settled).toEqual(['farmer']);
    expect(w.records).toHaveLength(1);
    expect(w.records[0]).toMatchObject({ kind: 'settlement', role: 'farmer', seq: 1 });
  });

  it('fires a consequence exactly once', () => {
    let w = createWorld();
    w = worldFireConsequence(w, 'escrow-flow', 'admin');
    const after = worldFireConsequence(w, 'escrow-flow', 'admin');
    expect(after).toBe(w);
    expect(w.consequencesFired).toEqual(['escrow-flow']);
    expect(w.records).toHaveLength(1);
  });

  it('assigns strictly increasing sequence numbers across event kinds', () => {
    let w = createWorld();
    w = worldSettle(w, 'farmer');
    w = worldFireConsequence(w, 'escrow-flow', 'admin');
    w = worldDiscover(w, 'fields');
    w = worldFirstInteraction(w, 'inspect');
    expect(w.records.map(r => r.seq)).toEqual([1, 2, 3, 4]);
  });

  it('records discoveries idempotently and earns the constellation at 8', () => {
    const districts: DistrictId[] = [
      'fields',
      'depot',
      'studio',
      'review-chamber',
      'bureau',
      'circle',
      'field-station',
      'ledger',
    ];
    let w: WorldState = createWorld();
    for (const d of districts) {
      w = worldDiscover(w, d);
      w = worldDiscover(w, d);
    }
    expect(w.discoveredHidden).toHaveLength(8);
    expect(constellationEarned(w)).toBe(true);
  });

  it('records each first interaction verb once', () => {
    let w = createWorld();
    w = worldFirstInteraction(w, 'inspect');
    w = worldFirstInteraction(w, 'inspect');
    w = worldFirstInteraction(w, 'lift');
    expect(w.firstInteractions).toEqual(['inspect', 'lift']);
    expect(w.records).toHaveLength(2);
  });
});
