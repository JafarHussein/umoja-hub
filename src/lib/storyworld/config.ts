import type { CharacterId, EpisodeDef } from './types';

export type Vector3Tuple = [number, number, number];

// ─── Character Definitions ────────────────────────────────────────────────────

export interface CharacterDef {
  id: CharacterId;
  color: string;
  label: string;
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  C01: { id: 'C01', color: '#8B5E3C', label: 'FARMER' },
  C02: { id: 'C02', color: '#4A5568', label: 'BUYER' },
  C03: { id: 'C03', color: '#5B7FA6', label: 'STUDENT' },
  C04: { id: 'C04', color: '#6B7280', label: 'LECTURER' },
  C05: { id: 'C05', color: '#374151', label: 'EMPLOYER' },
  C06: { id: 'C06', color: '#5C7A4A', label: 'COOPERATIVE' },
};

// Character arrival paths and conversation positions
export const CHARACTER_ARRIVAL: Record<CharacterId, Vector3Tuple> = {
  C01: [-9.0, 0, 5.0],
  C02: [9.0, 0, 5.0],
  C03: [-9.0, 0, -2.5],
  C04: [-7.5, 0, -4.5],
  C05: [9.0, 0, -2.5],
  C06: [-11.0, 0, 1.0],
};

// Where each character stands during their conversation
export const CHARACTER_CONVO_POS: Record<CharacterId, Vector3Tuple> = {
  C01: [-2.8, 0, 2.2],
  C02: [2.8, 0, 2.2],
  C03: [-2.8, 0, -0.5],
  C04: [-3.2, 0, -1.8],
  C05: [2.8, 0, -0.5],
  C06: [-3.8, 0, 0.8],
};

// Council Ring positions — where they stand after crossing
export const COUNCIL_RING_POS: Record<CharacterId, Vector3Tuple> = {
  C01: [-2.5, 0, 2.0],
  C02: [2.5, 0, 2.0],
  C03: [-2.8, 0, -1.5],
  C04: [-1.5, 0, -3.2],
  C05: [2.8, 0, -1.5],
  C06: [-3.2, 0, 0.5],
};

// ─── Guide ────────────────────────────────────────────────────────────────────

export const GUIDE_POS: Vector3Tuple = [0, 0, 1.5];
export const GUIDE_COLOR = '#2a3540';
export const GUIDE_EMISSIVE = '#56a8a2';

// ─── Scroll Layout ────────────────────────────────────────────────────────────

export const SECTION_VH = 500;
export const INTRO_END = 0.032;   // 3.2% = 16vh
export const OUTRO_START = 0.896; // 6 episodes × 0.144 each + intro

const EP_DURATION = (OUTRO_START - INTRO_END) / 6; // ~0.144 each

export const EPISODE_RANGES = Array.from({ length: 6 }, (_, i) => ({
  start: INTRO_END + i * EP_DURATION,
  end: INTRO_END + (i + 1) * EP_DURATION,
}));

export function deriveEpisodeState(progress: number) {
  if (progress < INTRO_END) {
    return { phase: 'intro' as const, episodeIndex: -1, episodeProgress: 0 };
  }
  if (progress >= OUTRO_START) {
    return { phase: 'outro' as const, episodeIndex: -1, episodeProgress: 1 };
  }
  const idx = EPISODE_RANGES.findIndex(r => progress >= r.start && progress < r.end);
  const range = EPISODE_RANGES[idx];
  if (!range) return { phase: 'outro' as const, episodeIndex: -1, episodeProgress: 1 };
  const ep = (progress - range.start) / (range.end - range.start);
  return { phase: 'episode' as const, episodeIndex: idx, episodeProgress: Math.min(1, Math.max(0, ep)) };
}

// ─── Episodes ─────────────────────────────────────────────────────────────────

export const EPISODES: EpisodeDef[] = [
  // ── Episode 0: Farmer ──────────────────────────────────────────────────────
  {
    index: 0,
    characterId: 'C01',
    arrivalAt: 0.0,
    demoAt: 0.42,
    demoType: 'payment-flow',
    crossingAt: 0.78,
    dialogue: [
      {
        id: 'E0-L1',
        speaker: 'participant',
        text: 'I have sold through brokers my whole life. They know the buyer. I do not. How is this different?',
        triggerAt: 0.14,
      },
      {
        id: 'E0-L2',
        speaker: 'guide',
        text: 'Every buyer is verified before they can place an order. You can read their transaction history before you accept anything.',
        triggerAt: 0.28,
      },
      {
        id: 'E0-L3',
        speaker: 'participant',
        text: 'And the money? A broker pays me when he is ready. Sometimes I wait weeks.',
        triggerAt: 0.52,
      },
      {
        id: 'E0-L4',
        speaker: 'guide',
        text: 'Payment is held through M-Pesa before you confirm dispatch. You do not send anything until the funds are confirmed. They release when you mark the order complete.',
        triggerAt: 0.65,
      },
    ],
  },

  // ── Episode 1: Buyer ───────────────────────────────────────────────────────
  {
    index: 1,
    characterId: 'C02',
    arrivalAt: 0.0,
    demoAt: 0.42,
    demoType: 'trust-score',
    crossingAt: 0.78,
    dialogue: [
      {
        id: 'E1-L1',
        speaker: 'participant',
        text: 'The Trust Score — who creates it? Anyone can write reviews.',
        triggerAt: 0.14,
      },
      {
        id: 'E1-L2',
        speaker: 'guide',
        text: 'It is not reviews. It is completed transaction records. Each fulfilled order adds to it. Each dispute becomes part of it. The score is the history, not an opinion.',
        triggerAt: 0.28,
      },
      {
        id: 'E1-L3',
        speaker: 'participant',
        text: "And the farmer's identity — how is it verified?",
        triggerAt: 0.52,
      },
      {
        id: 'E1-L4',
        speaker: 'guide',
        text: 'National ID, land documentation, and a farm photograph reviewed by a named administrator. Their name is on the approval. Not an algorithm. A person.',
        triggerAt: 0.65,
      },
    ],
  },

  // ── Episode 2: Student ─────────────────────────────────────────────────────
  {
    index: 2,
    characterId: 'C03',
    arrivalAt: 0.0,
    demoAt: 0.42,
    demoType: 'portfolio-card',
    crossingAt: 0.78,
    dialogue: [
      {
        id: 'E2-L1',
        speaker: 'participant',
        text: 'My GitHub has three years of work on it. Employers look at it for two seconds. How does verified mean anything different?',
        triggerAt: 0.14,
      },
      {
        id: 'E2-L2',
        speaker: 'guide',
        text: 'A GitHub repo tells you what was committed. A portfolio entry here tells you what was reviewed — by whom, with what credentials, with what decision, and why.',
        triggerAt: 0.28,
      },
      {
        id: 'E2-L3',
        speaker: 'participant',
        text: 'The hash — what is it for?',
        triggerAt: 0.52,
      },
      {
        id: 'E2-L4',
        speaker: 'guide',
        text: 'It proves the document was not changed after submission. The hash on record and the hash of your original file will always match.',
        triggerAt: 0.65,
      },
    ],
  },

  // ── Episode 3: Lecturer ────────────────────────────────────────────────────
  {
    index: 3,
    characterId: 'C04',
    arrivalAt: 0.0,
    demoAt: 0.42,
    demoType: 'none',
    crossingAt: 0.78,
    dialogue: [
      {
        id: 'E3-L1',
        speaker: 'participant',
        text: 'I review ten student submissions per semester in my department. How much time would this require in addition?',
        triggerAt: 0.14,
      },
      {
        id: 'E3-L2',
        speaker: 'guide',
        text: 'Reviewers are matched to their subject area. There is no quota. You review when a submission reaches your queue.',
        triggerAt: 0.28,
      },
      {
        id: 'E3-L3',
        speaker: 'participant',
        text: 'My institution requires that I disclose affiliations. Is my institution name published on my reviews?',
        triggerAt: 0.52,
      },
      {
        id: 'E3-L4',
        speaker: 'guide',
        text: 'Yes. Your name, your institution, and your credentials are on every review you submit. The students you review deserve a reviewer who is known.',
        triggerAt: 0.65,
      },
    ],
  },

  // ── Episode 4: Employer ────────────────────────────────────────────────────
  {
    index: 4,
    characterId: 'C05',
    arrivalAt: 0.0,
    demoAt: 0.42,
    demoType: 'verification-chain',
    crossingAt: 0.78,
    dialogue: [
      {
        id: 'E4-L1',
        speaker: 'participant',
        text: 'I can see the portfolio entry. But how do I verify that the reviewer is who they say they are?',
        triggerAt: 0.14,
      },
      {
        id: 'E4-L2',
        speaker: 'guide',
        text: 'Each reviewer\'s institution is linked. Their credentials are on record with their academic institution\'s public directory. The chain does not end at this platform.',
        triggerAt: 0.28,
      },
      {
        id: 'E4-L3',
        speaker: 'participant',
        text: 'What if the reviewer colludes with the student?',
        triggerAt: 0.52,
      },
      {
        id: 'E4-L4',
        speaker: 'guide',
        text: 'The peer reviewer and the lecturer reviewer are different people. The peer reviewer is anonymous to the student. Two independent assessments with different accountability structures.',
        triggerAt: 0.65,
      },
    ],
  },

  // ── Episode 5: Cooperative ─────────────────────────────────────────────────
  {
    index: 5,
    characterId: 'C06',
    arrivalAt: 0.0,
    demoAt: 0.42,
    demoType: 'group-cluster',
    crossingAt: 0.78,
    dialogue: [
      {
        id: 'E5-L1',
        speaker: 'participant',
        text: 'I represent fourteen farmers. Before I bring them to any platform, I need to understand what happens when something fails.',
        triggerAt: 0.14,
      },
      {
        id: 'E5-L2',
        speaker: 'guide',
        text: 'Every failure leaves a record. The record is public. The administrator who made the decision is named. The appeal process is open.',
        triggerAt: 0.28,
      },
      {
        id: 'E5-L3',
        speaker: 'participant',
        text: 'And the pricing — who sets it?',
        triggerAt: 0.52,
      },
      {
        id: 'E5-L4',
        speaker: 'guide',
        text: 'The farmers. Market benchmarks are visible on the platform. No one sets a price for you.',
        triggerAt: 0.65,
      },
    ],
  },
];
