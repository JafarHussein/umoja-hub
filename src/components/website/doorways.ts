/**
 * Audience doorways (foundation §13, §15.3). A doorway is a thin entry layer
 * over the shared Documentation Stream — a short orientation plus curated links
 * INTO canonical topic sections on `/`. It never holds content that isn't
 * reachable in the Stream. Five doorways, decided in the foundation.
 */

export interface DoorwayLink {
  /** Absolute anchor into the Stream on the homepage, e.g. "/#trust-score". */
  href: string;
  label: string;
  why: string;
}

export interface Doorway {
  slug: string;
  audience: string;
  title: string;
  lead: string;
  links: DoorwayLink[];
}

export const doorways: Doorway[] = [
  {
    slug: 'farmers',
    audience: 'Farmers',
    title: 'For farmers',
    lead: 'You grow produce and want to sell it directly, get paid, and build a reputation that buyers you have never met can actually see.',
    links: [
      { href: '/#overview-two-hubs', label: 'How the Food Security Hub works', why: 'The marketplace, end to end.' },
      { href: '/#identity-farmers', label: 'Getting verified', why: 'What you submit and what approval gives you.' },
      { href: '/#producer-listings', label: 'Listing your produce', why: 'What a listing carries, and what you control.' },
      { href: '/#trust-score', label: 'Your Trust Score', why: 'How buyers read your reliability — and how it is built.' },
      { href: '/#payments-flow', label: 'How payment works', why: 'M-Pesa before dispatch — and what the pilot simulates.' },
      { href: '/#risks-farmers', label: 'Your risks & recourse', why: 'What can go wrong, and what you can do about it.' },
    ],
  },
  {
    slug: 'buyers',
    audience: 'Buyers',
    title: 'For buyers',
    lead: 'You want to buy produce directly from farmers you can actually evaluate before you pay.',
    links: [
      { href: '/#buyer-browse', label: 'Browsing the marketplace', why: 'Open to everyone, no account needed.' },
      { href: '/#buyer-reading-trust', label: 'Reading a Trust Score', why: 'How to weigh a farmer before ordering.' },
      { href: '/#payments-flow', label: 'How payment works', why: 'You pay before dispatch — here is the exact flow.' },
      { href: '/#buyer-recourse', label: 'If something goes wrong', why: 'Your recourse today, stated plainly.' },
      { href: '/#risks-buyers', label: 'Your risks & recourse', why: 'No escrow or chargeback — what protects you instead.' },
    ],
  },
  {
    slug: 'students',
    audience: 'Students',
    title: 'For students',
    lead: 'You are a computer-science student who wants verifiable proof of how you work — not just a certificate of attendance.',
    links: [
      { href: '/#overview-two-hubs', label: 'How the Education Hub works', why: 'Verifying work, not attendance.' },
      { href: '/#education-process', label: "What you'll produce", why: 'Three documents, two logs, hashed on submission.' },
      { href: '/#education-review', label: 'How review works', why: 'Anonymous peer review, then a verified lecturer.' },
      { href: '/#education-outcomes', label: 'The possible outcomes', why: 'VERIFIED, REVISION_REQUIRED, or DENIED — and the gaps.' },
      { href: '/#identity-documents', label: 'What happens to your work', why: 'How tamper evidence works.' },
      { href: '/#risks-students', label: 'Risks & recourse', why: 'What is and is not built yet.' },
    ],
  },
  {
    slug: 'employers',
    audience: 'Employers',
    title: 'For employers',
    lead: 'You are evaluating a candidate and want to know exactly what was verified, by whom, and on what evidence.',
    links: [
      { href: '/#education-review', label: 'Who reviews student work', why: 'Credential-verified lecturers, with written justification.' },
      { href: '/#education-outcomes', label: 'What "VERIFIED" means', why: 'The decision behind the label.' },
      { href: '/#identity-documents', label: 'Tamper evidence', why: 'How documents are fingerprinted.' },
      { href: '/#governance-who', label: 'Who makes decisions', why: 'Named humans, not an algorithm.' },
      { href: '/#risks-students', label: 'What you can rely on today', why: 'Honest about what is not built yet.' },
    ],
  },
  {
    slug: 'institutions',
    audience: 'Institutions & Partners',
    title: 'For institutions & partners',
    lead: 'You are assessing UmojaHub’s methodology, governance, or impact — likely without creating an account. This covers NGOs, government, academic institutions, researchers, and funders.',
    links: [
      { href: '/#governance-who', label: 'Governance & who decides', why: 'How accountability is structured.' },
      { href: '/#governance-record', label: 'What is recorded', why: 'The audit trail, and its current limits.' },
      { href: '/#evidence-transparency', label: 'The public numbers', why: 'Aggregate indicators, no account required.' },
      { href: '/#services-data', label: 'Data governance', why: 'What is stored, where, and for how long.' },
      { href: '/#trust', label: 'The trust methodology', why: 'The full Trust Score formula and tiers.' },
      { href: '/#governance-appeals', label: 'Appeals & recourse', why: 'How decisions are corrected today.' },
    ],
  },
];

export function doorway(slug: string): Doorway | undefined {
  return doorways.find((d) => d.slug === slug);
}
