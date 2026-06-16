/**
 * Documentation Stream — topic index (foundation §13).
 * The persistent index and the canonical reading spine both derive from this
 * single list, so the two never drift. Only topics that are fully written
 * appear here — no placeholder/"coming soon" entries (CLAUDE.md code style).
 */

export interface StreamSubsection {
  id: string;
  title: string;
}

export interface StreamTopic {
  /** Position in the canonical spine (0-indexed, matches the content map). */
  n: number;
  id: string;
  title: string;
  sections: StreamSubsection[];
}

/** Typed lookup by id — avoids unchecked array indexing under strict TS. */
export function topic(id: string): StreamTopic {
  const found = streamTopics.find((t) => t.id === id);
  if (!found) throw new Error(`Unknown stream topic: ${id}`);
  return found;
}

export const streamTopics: StreamTopic[] = [
  {
    n: 0,
    id: 'overview',
    title: 'What UmojaHub is & why it exists',
    sections: [
      { id: 'overview-thesis', title: 'Trust cannot be assumed' },
      { id: 'overview-two-hubs', title: 'Two hubs, one spine' },
      { id: 'overview-principles', title: 'Three principles' },
    ],
  },
  {
    n: 1,
    id: 'trust',
    title: 'Trust architecture',
    sections: [
      { id: 'trust-score', title: 'The Farmer Trust Score' },
      { id: 'trust-components', title: 'The four components' },
      { id: 'trust-tiers', title: 'Tiers & recalculation' },
    ],
  },
  {
    n: 2,
    id: 'producer',
    title: 'The producer interface (farmer)',
    sections: [
      { id: 'producer-listings', title: 'Listing produce' },
      { id: 'producer-prices', title: 'Price intelligence' },
      { id: 'producer-assistant', title: 'The farm assistant' },
    ],
  },
  {
    n: 3,
    id: 'buyer',
    title: 'The buyer path',
    sections: [
      { id: 'buyer-browse', title: 'Browsing the marketplace' },
      { id: 'buyer-reading-trust', title: 'Reading a Trust Score' },
      { id: 'buyer-recourse', title: 'If something goes wrong' },
    ],
  },
  {
    n: 4,
    id: 'payments',
    title: 'Payments & money',
    sections: [
      { id: 'payments-flow', title: 'How payment works' },
      { id: 'payments-pilot', title: 'Pilot mode' },
      { id: 'payments-commission', title: 'No commission' },
    ],
  },
];
