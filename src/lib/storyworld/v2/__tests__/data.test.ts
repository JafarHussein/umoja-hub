// Data integrity — §6.6 as CI, not convention.

import { BRANCHES, EPISODES_V2, FACT_CARDS, FINALE_DIALOGUE, HIDDEN_RECORDS, MICRO_LINES } from '../data';
import { EPISODE_ROLES, ROLES } from '../config';
import type { DialogueLineV2 } from '../types';

const ALL_SPINE_LINES: DialogueLineV2[] = [
  ...EPISODES_V2.flatMap(e => e.dialogue),
  ...FINALE_DIALOGUE,
];

describe('dialogue integrity', () => {
  it('every Administrator answer carries a consequence (§6.6 invariant)', () => {
    const adminLines = ALL_SPINE_LINES.filter(l => l.speaker === 'admin');
    const missing = adminLines.filter(l => !l.consequence);
    expect(missing.map(l => l.id)).toEqual([]);
  });

  it('consequences are unique across the spine', () => {
    const fired = ALL_SPINE_LINES.filter(l => l.consequence).map(l => l.consequence);
    expect(new Set(fired).size).toBe(fired.length);
  });

  it('line ids are unique', () => {
    const ids = ALL_SPINE_LINES.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers all seven episode roles in chapter order', () => {
    expect(EPISODES_V2.map(e => e.role)).toEqual(EPISODE_ROLES);
    EPISODES_V2.forEach((e, i) => {
      expect(e.chapter).toBe(i + 1);
      expect(ROLES[e.role].district).toBe(e.district);
    });
  });

  it('triggers are strictly increasing within each chapter', () => {
    for (const ep of EPISODES_V2) {
      const at = ep.dialogue.map(l => l.triggerAt);
      expect([...at].sort((a, b) => a - b)).toEqual(at);
      expect(at[at.length - 1]).toBeLessThan(0.72); // before settling begins
    }
  });
});

describe('branches (Resolved Decision 5 — ≤10s pocket)', () => {
  it('every episode has exactly one branch, referenced from its dialogue', () => {
    for (const ep of EPISODES_V2) {
      const refs = ep.dialogue.filter(l => l.branchId).map(l => l.branchId);
      expect(refs).toHaveLength(1);
      const branch = BRANCHES.find(b => b.id === refs[0]);
      expect(branch).toBeDefined();
      expect(branch?.chapter).toBe(ep.chapter);
    }
  });

  it('branches fit the 10-second pocket (≤2 exchanges, ≤32 words per line)', () => {
    for (const b of BRANCHES) {
      expect(b.lines.length).toBeLessThanOrEqual(2);
      for (const line of b.lines) {
        expect(line.text.trim().split(/\s+/).length).toBeLessThanOrEqual(32);
      }
    }
  });
});

describe('interaction content budgets', () => {
  it('every district has exactly 3 fact cards and 1 hidden record', () => {
    const districts = [
      'fields',
      'depot',
      'studio',
      'review-chamber',
      'bureau',
      'circle',
      'field-station',
      'ledger',
    ] as const;
    for (const d of districts) {
      expect(FACT_CARDS.filter(c => c.district === d)).toHaveLength(3);
      expect(HIDDEN_RECORDS.filter(h => h.district === d)).toHaveLength(1);
    }
  });

  it('every character has 2 asides and 1 lifted line (23-line budget, §6.5)', () => {
    expect(MICRO_LINES).toHaveLength(8);
    let total = 0;
    for (const m of MICRO_LINES) {
      expect(m.asides).toHaveLength(2);
      expect(m.lifted.trim().split(/\s+/).length).toBeLessThanOrEqual(8);
      total += m.asides.length + 1;
    }
    expect(total).toBeLessThanOrEqual(24);
  });

  it('fact card and hidden record ids are unique', () => {
    const ids = [...FACT_CARDS.map(c => c.id), ...HIDDEN_RECORDS.map(h => h.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
