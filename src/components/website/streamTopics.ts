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
  {
    n: 5,
    id: 'education',
    title: 'The student verification engine',
    sections: [
      { id: 'education-process', title: 'Process over artifact' },
      { id: 'education-review', title: 'Peer review, then lecturer' },
      { id: 'education-outcomes', title: 'The three outcomes' },
    ],
  },
  {
    n: 6,
    id: 'identity',
    title: 'Verification & identity',
    sections: [
      { id: 'identity-farmers', title: 'Verifying a farmer' },
      { id: 'identity-lecturers', title: 'Verifying a lecturer' },
      { id: 'identity-documents', title: 'What happens to your documents' },
    ],
  },
  {
    n: 7,
    id: 'governance',
    title: 'Governance & accountability',
    sections: [
      { id: 'governance-who', title: 'Who decides' },
      { id: 'governance-record', title: 'What is recorded' },
      { id: 'governance-appeals', title: 'Appeals & recourse' },
    ],
  },
  {
    n: 8,
    id: 'evidence',
    title: 'Evidence & metrics',
    sections: [
      { id: 'evidence-transparency', title: 'The public numbers' },
      { id: 'evidence-honesty', title: 'Small numbers, honestly' },
    ],
  },
  {
    n: 9,
    id: 'services',
    title: 'Third-party services & data',
    sections: [
      { id: 'services-used', title: 'Services we rely on' },
      { id: 'services-data', title: 'What is stored, and where' },
    ],
  },
  {
    n: 10,
    id: 'risks',
    title: 'Risks & recourse, by audience',
    sections: [
      { id: 'risks-farmers', title: 'Farmers' },
      { id: 'risks-buyers', title: 'Buyers' },
      { id: 'risks-students', title: 'Students & employers' },
    ],
  },
];
