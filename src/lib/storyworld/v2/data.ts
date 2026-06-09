// StoryWorld V2 — narrative data. Dialogue voice is governed by the architecture
// document: questions are earned, answers are specific, every Administrator answer
// carries a consequence (§6.6 — enforced by __tests__/data.test.ts).

import type {
  BranchDef,
  DialogueLineV2,
  EpisodeV2,
  FactCard,
  HiddenRecordDef,
  MicroLines,
} from './types';

// ─── Episode spines ───────────────────────────────────────────────────────────

export const EPISODES_V2: EpisodeV2[] = [
  {
    chapter: 1,
    role: 'farmer',
    district: 'fields',
    dialogue: [
      {
        id: 'e1-q1',
        speaker: 'farmer',
        text: 'I have sold through brokers my whole life. They know the buyer. I do not. How is this different?',
        triggerAt: 0.2,
      },
      {
        id: 'e1-a1',
        speaker: 'admin',
        text: 'Every buyer is verified before they can place an order. You can read their transaction history before you accept anything.',
        triggerAt: 0.32,
        consequence: 'buyer-verification',
      },
      {
        id: 'e1-q2',
        speaker: 'farmer',
        text: 'And the money? A broker pays me when he is ready. Sometimes I wait weeks.',
        triggerAt: 0.48,
        branchId: 'b1-dispute',
      },
      {
        id: 'e1-a2',
        speaker: 'admin',
        text: 'Payment is held through M-Pesa before you confirm dispatch. You send nothing until the funds are confirmed. They release when you mark the order complete.',
        triggerAt: 0.6,
        consequence: 'escrow-flow',
      },
    ],
  },
  {
    chapter: 2,
    role: 'buyer',
    district: 'depot',
    dialogue: [
      {
        id: 'e2-q1',
        speaker: 'buyer',
        text: 'The Trust Score — who creates it? Anyone can write reviews.',
        triggerAt: 0.2,
      },
      {
        id: 'e2-a1',
        speaker: 'admin',
        text: 'It is not reviews. It is completed transaction records. Each fulfilled order adds to it. Each dispute becomes part of it. The score is the history, not an opinion.',
        triggerAt: 0.32,
        consequence: 'trust-score-increment',
      },
      {
        id: 'e2-q2',
        speaker: 'buyer',
        text: "And the farmer's identity — how is it verified?",
        triggerAt: 0.48,
        branchId: 'b2-quality',
      },
      {
        id: 'e2-a2',
        speaker: 'admin',
        text: 'National ID, land documentation, and a farm photograph reviewed by a named administrator. Their name is on the approval. Not an algorithm. A person.',
        triggerAt: 0.6,
        consequence: 'named-verification',
      },
    ],
  },
  {
    chapter: 3,
    role: 'student',
    district: 'studio',
    dialogue: [
      {
        id: 'e3-q1',
        speaker: 'student',
        text: 'My GitHub has three years of work on it. Employers look at it for two seconds. How does verified mean anything different?',
        triggerAt: 0.2,
      },
      {
        id: 'e3-a1',
        speaker: 'admin',
        text: 'A repo tells you what was committed. A portfolio entry here tells you what was reviewed — by whom, with what credentials, with what decision, and why.',
        triggerAt: 0.32,
        consequence: 'portfolio-docked',
      },
      {
        id: 'e3-q2',
        speaker: 'student',
        text: 'The hash — what is it for?',
        triggerAt: 0.48,
        branchId: 'b3-public-url',
      },
      {
        id: 'e3-a2',
        speaker: 'admin',
        text: 'It proves the document was not changed after submission. The hash on record and the hash of your original file will always match.',
        triggerAt: 0.6,
        consequence: 'hash-sealed',
      },
    ],
  },
  {
    chapter: 4,
    role: 'lecturer',
    district: 'review-chamber',
    dialogue: [
      {
        id: 'e4-q1',
        speaker: 'lecturer',
        text: 'I review ten student submissions per semester in my department. How much time would this require in addition?',
        triggerAt: 0.2,
      },
      {
        id: 'e4-a1',
        speaker: 'admin',
        text: 'Reviewers are matched to their subject area. There is no quota. You review when a submission reaches your queue.',
        triggerAt: 0.32,
        consequence: 'review-queue',
      },
      {
        id: 'e4-q2',
        speaker: 'lecturer',
        text: 'My institution requires that I disclose affiliations. Is my institution name published on my reviews?',
        triggerAt: 0.48,
        branchId: 'b4-liability',
      },
      {
        id: 'e4-a2',
        speaker: 'admin',
        text: 'Yes. Your name, your institution, and your credentials are on every review you submit. The students you review deserve a reviewer who is known.',
        triggerAt: 0.6,
        consequence: 'review-on-record',
      },
    ],
  },
  {
    chapter: 5,
    role: 'employer',
    district: 'bureau',
    dialogue: [
      {
        id: 'e5-q1',
        speaker: 'employer',
        text: 'I can see the portfolio entry. But how do I verify that the reviewer is who they say they are?',
        triggerAt: 0.2,
      },
      {
        id: 'e5-a1',
        speaker: 'admin',
        text: "Each reviewer's institution is linked. Their credentials are on record with their institution's public directory. The chain does not end at this platform.",
        triggerAt: 0.32,
        consequence: 'chain-unfolded',
      },
      {
        id: 'e5-q2',
        speaker: 'employer',
        text: 'What if the reviewer colludes with the student?',
        triggerAt: 0.48,
        branchId: 'b5-collusion',
      },
      {
        id: 'e5-a2',
        speaker: 'admin',
        text: 'The peer reviewer and the lecturer reviewer are different people. The peer reviewer is anonymous to the student. Two independent assessments with different accountability structures.',
        triggerAt: 0.6,
        consequence: 'dual-review',
      },
    ],
  },
  {
    chapter: 6,
    role: 'cooperative',
    district: 'circle',
    dialogue: [
      {
        id: 'e6-q1',
        speaker: 'cooperative',
        text: 'I represent fourteen farmers. Before I bring them to any platform, I need to understand what happens when something fails.',
        triggerAt: 0.2,
      },
      {
        id: 'e6-a1',
        speaker: 'admin',
        text: 'Every failure leaves a record. The record is public. The administrator who made the decision is named. The appeal process is open.',
        triggerAt: 0.32,
        consequence: 'group-order',
      },
      {
        id: 'e6-q2',
        speaker: 'cooperative',
        text: 'My farmers have been told many times that something will be transparent. It is almost never transparent.',
        triggerAt: 0.48,
        branchId: 'b6-pricing',
      },
      {
        id: 'e6-a2',
        speaker: 'admin',
        text: 'The Trust Score methodology is published. The verification criteria are published. The appeals process is published. Not as a promise — as a document you can read today.',
        triggerAt: 0.6,
        consequence: 'methodology-published',
      },
    ],
  },
  {
    chapter: 7,
    role: 'ngo',
    district: 'field-station',
    dialogue: [
      {
        id: 'e7-q1',
        speaker: 'ngo',
        text: 'We need to demonstrate impact to funders. Not describe it. Demonstrate it. With data. What data does this platform produce?',
        triggerAt: 0.2,
      },
      {
        id: 'e7-a1',
        speaker: 'admin',
        text: 'Transaction records with timestamps. Regional breakdowns by farmer location. Verification completion rates. Dispute resolution rates.',
        triggerAt: 0.32,
        consequence: 'impact-stream',
      },
      {
        id: 'e7-q2',
        speaker: 'ngo',
        text: 'And the methodology — how is impact defined here? We have seen platforms define impact as registrations.',
        triggerAt: 0.48,
        branchId: 'b7-quarterly',
      },
      {
        id: 'e7-a2',
        speaker: 'admin',
        text: 'Impact here is completed verified transactions between verified parties. Registration is not counted. Attempted but uncompleted actions are not counted.',
        triggerAt: 0.6,
        consequence: 'audit-logged',
      },
    ],
  },
];

// ─── Finale exchange (chapter 8) — the record-permanence material ─────────────

export const FINALE_DIALOGUE: DialogueLineV2[] = [
  {
    id: 'f-q1',
    speaker: 'cooperative',
    text: 'And if this platform fails, like the others failed? What happens to all of this?',
    triggerAt: 0.18,
  },
  {
    id: 'f-a1',
    speaker: 'admin',
    text: 'Every record here is hashed before storage. The hash lives apart from the operational database. If the platform fails, the hashes survive.',
    triggerAt: 0.32,
    consequence: 'record-permanence',
  },
  {
    id: 'f-a2',
    speaker: 'admin',
    text: 'Each participant holds their own record. The platform stores a verification of it. They are not the same thing, and they are not stored together.',
    triggerAt: 0.52,
    consequence: 'visit-recorded',
  },
];

// ─── Branches (§5.4) — each authored to ≤10 seconds ───────────────────────────

export const BRANCHES: BranchDef[] = [
  {
    id: 'b1-dispute',
    chapter: 1,
    chipLabel: 'And if they dispute after receiving?',
    lines: [
      { speaker: 'farmer', text: 'What if they dispute after receiving?' },
      {
        speaker: 'admin',
        text: 'Every order creates a record. Your dispatch confirmation. Their receipt. The timestamps. If there is a dispute, the record is public.',
      },
    ],
  },
  {
    id: 'b2-quality',
    chapter: 2,
    chipLabel: 'And if quality does not match the listing?',
    lines: [
      { speaker: 'buyer', text: 'And if produce arrives and the quality does not match the listing?' },
      {
        speaker: 'admin',
        text: "The dispute goes on record. If a pattern develops, the seller's Trust Score reflects it. And the administrator who verified them is notified.",
      },
    ],
  },
  {
    id: 'b3-public-url',
    chapter: 3,
    chipLabel: 'Can I show this without them registering?',
    lines: [
      { speaker: 'student', text: 'Can I show this to someone without them needing an account?' },
      {
        speaker: 'admin',
        text: 'Yes. Every portfolio entry has a public URL. No registration required to read it.',
      },
    ],
  },
  {
    id: 'b4-liability',
    chapter: 4,
    chipLabel: 'Could that create liability for me?',
    lines: [
      { speaker: 'lecturer', text: 'That could create liability if I approve work that later proves problematic.' },
      {
        speaker: 'admin',
        text: 'It could. That is also true of every reference letter you have ever written. This makes what you already do legible to the people who need it.',
      },
    ],
  },
  {
    id: 'b5-collusion',
    chapter: 5,
    chipLabel: 'Has anyone given you a specific answer?',
    lines: [
      { speaker: 'employer', text: 'That is the first time I have heard a specific answer to that question.' },
      {
        speaker: 'admin',
        text: 'There is no anonymous approval here. If a reviewed project is later shown to be fabricated, the reviewer is identified.',
      },
    ],
  },
  {
    id: 'b6-pricing',
    chapter: 6,
    chipLabel: 'And the pricing — who sets it?',
    lines: [
      { speaker: 'cooperative', text: 'And the pricing — who sets it?' },
      {
        speaker: 'admin',
        text: 'The farmers. Market benchmarks are visible on the platform. No one sets a price for you.',
      },
    ],
  },
  {
    id: 'b7-quarterly',
    chapter: 7,
    chipLabel: 'Can it produce quarterly reports?',
    lines: [
      { speaker: 'ngo', text: 'Our funders ask for impact data quarterly. Can this platform generate quarterly reports?' },
      {
        speaker: 'admin',
        text: 'The audit log can be filtered by time range. Export is available in standard formats.',
      },
    ],
  },
];

// ─── Fact cards (§4.4) — every sentence is platform-true ──────────────────────

export const FACT_CARDS: FactCard[] = [
  // The Fields
  {
    id: 'fc-fields-scale',
    district: 'fields',
    offset: [1.4, 0.5, 0.6],
    title: 'The scale',
    body: 'Listings carry weight and grade, confirmed at dispatch. What the buyer reads is what the farmer weighed.',
  },
  {
    id: 'fc-fields-crate',
    district: 'fields',
    offset: [-1.2, 0.4, 0.9],
    title: 'Harvest crate',
    body: 'Each crate maps to a listing record: produce, grade, quantity, and the verified farm it came from.',
  },
  {
    id: 'fc-fields-stall',
    district: 'fields',
    offset: [0.2, 0.8, -1.4],
    title: 'The stall ledger',
    body: 'Price is set by the farmer. Market benchmarks are visible on the platform. No broker sets a price for you.',
  },
  // The Depot
  {
    id: 'fc-depot-plinth',
    district: 'depot',
    offset: [1.2, 0.7, 0.4],
    title: 'Sample plinth',
    body: 'Every listing links to a verified farmer profile — identity, land documentation, and the name of the approving administrator.',
  },
  {
    id: 'fc-depot-board',
    district: 'depot',
    offset: [-1.3, 1.0, -0.5],
    title: 'Comparison board',
    body: 'Trust Scores are completed transaction history, not reviews. Each fulfilled order adds to it. Each dispute becomes part of it.',
  },
  {
    id: 'fc-depot-dispute',
    district: 'depot',
    offset: [0.4, 0.4, 1.3],
    title: 'Dispute slate',
    body: 'Disputes are records — public, timestamped, permanent. A pattern of disputes is visible before you place an order.',
  },
  // The Studio
  {
    id: 'fc-studio-draft',
    district: 'studio',
    offset: [1.1, 0.7, 0.5],
    title: 'Submission hash',
    body: 'The document is hashed at submission. It can never be silently changed — the hash on record always matches the original file.',
    mono: 'sha256:9f86d08…0f00a08',
  },
  {
    id: 'fc-studio-spine',
    district: 'studio',
    offset: [-1.2, 1.1, -0.4],
    title: 'Portfolio entry',
    body: 'Every entry has a public URL. Anyone can read it — no account required.',
  },
  {
    id: 'fc-studio-shelf',
    district: 'studio',
    offset: [0.3, 0.6, -1.3],
    title: 'The shelf',
    body: 'Submission history is preserved, including revisions. It shows someone who worked toward something. That is also visible.',
  },
  // The Review Chamber
  {
    id: 'fc-chamber-lectern',
    district: 'review-chamber',
    offset: [1.0, 0.8, 0.4],
    title: 'The lectern',
    body: 'Reviewer name, institution, and credentials are on every review. There is no anonymous approval here.',
  },
  {
    id: 'fc-chamber-rail',
    district: 'review-chamber',
    offset: [-1.2, 0.5, 0.7],
    title: 'The queue rail',
    body: 'Reviewers are matched to their subject area. There is no quota — submissions reach your queue when they fit your field.',
  },
  {
    id: 'fc-chamber-wall',
    district: 'review-chamber',
    offset: [0.2, 1.0, -1.3],
    title: 'Credential wall',
    body: 'Reviews remain as historical records. If a reviewer leaves, their affiliation is marked inactive from that date. Records do not disappear.',
  },
  // The Bureau
  {
    id: 'fc-bureau-tile',
    district: 'bureau',
    offset: [1.1, 1.0, -0.5],
    title: 'Portfolio wall',
    body: "The verification chain does not end at this platform — reviewer credentials link to their institution's public directory.",
  },
  {
    id: 'fc-bureau-rail',
    district: 'bureau',
    offset: [-1.2, 0.7, 0.5],
    title: 'Shortlist rail',
    body: 'Two independent assessments with different accountability structures: an anonymous peer review and a named lecturer review.',
  },
  {
    id: 'fc-bureau-chain',
    district: 'bureau',
    offset: [0.3, 0.5, 1.2],
    title: 'The chain',
    body: 'Hash, peer review, named review — each link is a separate record with a separate owner. Collusion requires defeating all three.',
  },
  // The Circle
  {
    id: 'fc-circle-stone',
    district: 'circle',
    offset: [0, 0.6, 0],
    title: 'The ledger stone',
    body: 'One group order, fourteen individually verified members, one cooperative account. The order confirmation routes to the group.',
  },
  {
    id: 'fc-circle-seat',
    district: 'circle',
    offset: [1.3, 0.3, 0.6],
    title: 'A member seat',
    body: 'Each cooperative member is individually verified. The group is not a shortcut around verification — it is verification, fourteen times.',
  },
  {
    id: 'fc-circle-slab',
    district: 'circle',
    offset: [-1.3, 0.4, -0.6],
    title: 'Methodology slab',
    body: 'The Trust Score methodology, the verification criteria, and the appeals process are published — readable before anyone registers.',
  },
  // The Field Station
  {
    id: 'fc-station-grid',
    district: 'field-station',
    offset: [0.2, 1.0, -0.9],
    title: 'The impact grid',
    body: 'Impact is defined as completed verified transactions between verified parties. Registrations do not count.',
  },
  {
    id: 'fc-station-marker',
    district: 'field-station',
    offset: [1.2, 0.4, 0.6],
    title: 'Survey marker',
    body: 'Regional breakdowns by farmer location, with timestamps. Summary statistics are public.',
  },
  {
    id: 'fc-station-stack',
    district: 'field-station',
    offset: [-1.2, 0.4, 0.5],
    title: 'Report stack',
    body: 'Granular data requires a formal audit request. The request and the response are both logged.',
  },
  // The Ledger grounds
  {
    id: 'fc-ledger-plinth',
    district: 'ledger',
    offset: [1.6, 0.6, 0.8],
    title: 'The registry',
    body: 'A verification record: the name of the approving administrator, the date, and the evidence reviewed. Signed.',
    mono: 'approved-by: A. Wanjiru · 2026-03-14',
  },
  {
    id: 'fc-ledger-lantern',
    district: 'ledger',
    offset: [-1.5, 0.5, 0.9],
    title: 'Audit lantern',
    body: 'Records are hashed before storage. The hashes are stored apart from the operational database. If the platform fails, the hashes survive.',
  },
  {
    id: 'fc-ledger-column',
    district: 'ledger',
    offset: [0, 2.0, 0],
    title: 'The Ledger',
    body: 'Every ring is one record from this visit — verifications, settlements, and the things you chose to look at. The world remembers.',
  },
];

// ─── Hidden records (§4.6) — the layer beneath the marketing layer ────────────

export const HIDDEN_RECORDS: HiddenRecordDef[] = [
  {
    id: 'hr-fields',
    district: 'fields',
    offset: [-1.8, 0.01, -1.2],
    title: 'A rejected verification',
    body: 'Application #1187 was rejected: the land document photo was unreadable. The rejection includes the reason and the path to resubmit. It was approved eleven days later.',
  },
  {
    id: 'hr-depot',
    district: 'depot',
    offset: [1.7, 0.01, -1.1],
    title: 'A lost dispute',
    body: 'A buyer disputed grade on order #4413 and lost — the dispatch photos matched the listing. The dispute stayed on record anyway. Records are not curated.',
  },
  {
    id: 'hr-studio',
    district: 'studio',
    offset: [-1.6, 0.01, 1.2],
    title: 'A third submission',
    body: 'This portfolio entry was rejected twice before it passed review. All three attempts are in the history. The third version is the one employers see first — not the only one they can see.',
  },
  {
    id: 'hr-chamber',
    district: 'review-chamber',
    offset: [1.5, 0.01, 1.1],
    title: 'A disagreement',
    body: 'A peer reviewer and a lecturer disagreed on the same project. Both assessments are on record. A disagreement is not a problem — it is more information.',
  },
  {
    id: 'hr-bureau',
    district: 'bureau',
    offset: [-1.5, 0.01, -1.2],
    title: 'A withdrawn affiliation',
    body: 'A reviewer left their institution in March. Their reviews remain, marked with the affiliation dates. The records did not disappear. The context changed.',
  },
  {
    id: 'hr-circle',
    district: 'circle',
    offset: [1.6, 0.01, -1.0],
    title: 'An appeal that won',
    body: 'A cooperative appealed a rejected member verification and won. The reversal is signed by a different administrator than the original decision.',
  },
  {
    id: 'hr-station',
    district: 'field-station',
    offset: [-1.4, 0.01, -1.1],
    title: 'An audit request',
    body: 'A funder requested granular regional data in January. The request, the approval, and the export are all in the audit log. All three are readable.',
  },
  {
    id: 'hr-ledger',
    district: 'ledger',
    offset: [2.1, 0.01, -1.3],
    title: 'The first record',
    body: 'Record #0001: the platform verified its own first administrator. The steward is subject to the same process as everyone they verify.',
  },
];

// ─── Micro-lines (§6.5): 2 asides + 1 lifted line per character ───────────────

export const MICRO_LINES: MicroLines[] = [
  {
    role: 'farmer',
    asides: ['The scale does not argue.', 'Third season on this plot.'],
    lifted: 'Careful. The tomatoes bruise.',
  },
  {
    role: 'buyer',
    asides: ['Grade A. The record agrees.', 'I read the history first now.'],
    lifted: 'I was comparing those.',
  },
  {
    role: 'student',
    asides: ['Version three. The good one.', 'The hash never lies.'],
    lifted: 'Mind the drafts!',
  },
  {
    role: 'lecturer',
    asides: ['This one shows real work.', 'My name goes on this.'],
    lifted: 'I was mid-annotation.',
  },
  {
    role: 'employer',
    asides: ['The chain checks out.', 'Shortlisted. Verified twice.'],
    lifted: 'I am evaluating, you know.',
  },
  {
    role: 'cooperative',
    asides: ['Fourteen names. One order.', 'The circle decides together.'],
    lifted: 'I carry fourteen people.',
  },
  {
    role: 'ngo',
    asides: ['Counted. Not claimed.', 'The funders can read this one.'],
    lifted: 'The data stays with me.',
  },
  {
    role: 'admin',
    asides: ['Every ring is a record.', 'Ask anything. It is all on record.'],
    lifted: 'The steward stays with the ledger.',
  },
];
