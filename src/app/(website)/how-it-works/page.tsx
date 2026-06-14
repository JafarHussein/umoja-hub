import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works — UmojaHub',
  description:
    'The complete end-to-end walkthrough for all three platform flows. Food Security Hub, Education Hub, and Cooperative Group purchasing — from first step to final outcome.',
};

const FOOD_STEPS = [
  {
    n: '1',
    title: 'Register as a farmer',
    body: 'Create an account and select the FARMER role. Provide your basic profile information.',
  },
  {
    n: '2',
    title: 'Submit verification documents',
    body: 'Upload your National ID or passport, land documentation, and a farm photograph. All documents are reviewed by a platform administrator.',
  },
  {
    n: '3',
    title: 'Administrator reviews your submission',
    body: 'A named administrator reviews your documents for consistency, plausibility, and completeness. Decision: APPROVED or REJECTED with specific, correctable reasons.',
  },
  {
    n: '4',
    title: 'Receive APPROVED status',
    body: 'Your Trust Score initializes. You are assigned the NEW tier. Your account is now active and you can create listings.',
  },
  {
    n: '5',
    title: 'Create your first listing',
    body: 'Add a produce listing: crop type, quantity, price per kg, county, harvest date. The listing is visible to all marketplace visitors immediately.',
  },
  {
    n: '6',
    title: 'Buyer places an order',
    body: "A buyer selects your listing, reviews your Trust Score, and initiates an order. An STK Push is sent to the buyer's phone for M-Pesa payment authorization.",
  },
  {
    n: '7',
    title: 'Payment confirms',
    body: 'The buyer enters their M-Pesa PIN. Payment confirmation triggers your dispatch obligation. You receive notification.',
  },
  {
    n: '8',
    title: 'Dispatch and confirm',
    body: 'Dispatch the produce and confirm dispatch on the platform. The buyer is notified.',
  },
  {
    n: '9',
    title: 'Order received and rated',
    body: 'The buyer confirms receipt and submits a rating. The rating recalculates your Trust Score buyer rating component.',
  },
] as const;

const EDUCATION_STEPS = [
  {
    n: '1',
    title: 'Register as a student',
    body: 'Create an account and select the STUDENT role. Enroll on a project track that matches your field of study.',
  },
  {
    n: '2',
    title: 'Receive a project brief',
    body: 'The platform assigns a structured brief. The brief defines a specific problem, constraints, and deliverable requirements.',
  },
  {
    n: '3',
    title: 'Produce three documents',
    body: 'Problem Breakdown (analysis of the problem), Approach Plan (proposed methodology), Final Reflection (what was built, what failed, what was learned).',
  },
  {
    n: '4',
    title: 'Documents are hashed at submission',
    body: 'At submission, a SHA-256 hash of the combined documents is created and recorded with timestamp and submission ID. The documents are locked.',
  },
  {
    n: '5',
    title: 'Peer review',
    body: 'Another student on the same track reviews your documents against the four-dimension rubric and assigns a score with written commentary. Peer scores are locked before entering the lecturer queue.',
  },
  {
    n: '6',
    title: 'Lecturer review',
    body: 'A verified, named lecturer receives your submission. They assess independently using the same rubric — without seeing the peer score. Decision: VERIFIED, REVISION_REQUIRED, or DENIED.',
  },
  {
    n: '7',
    title: 'Decision recorded in portfolio',
    body: 'The decision, reviewer name, decision date, document hash, and full commentary are recorded in your public portfolio entry. The full decision history is preserved.',
  },
  {
    n: '8',
    title: 'Portfolio entry is public',
    body: 'Employers can access your portfolio entry without registering. The verification chain — documents, hash, peer score, lecturer decision — is all visible.',
  },
] as const;

const COOPERATIVE_STEPS = [
  {
    n: '1',
    title: 'Be a verified farmer first',
    body: 'Cooperative group access requires farmer verification. Complete the farmer verification flow before joining or creating a group.',
  },
  {
    n: '2',
    title: 'Create or join a cooperative group',
    body: 'Create a new group from your dashboard, or join an existing group in your county. Groups are visible to all verified farmers.',
  },
  {
    n: '3',
    title: 'Agree on a collective order',
    body: 'Group members agree on the specific inputs required: seed type, fertilizer grade, quantity. The group nominates a verified supplier from the platform directory.',
  },
  {
    n: '4',
    title: 'Submit the collective order',
    body: 'The group submits the collective order to the nominated supplier. Payment coordination is handled through the group — not individually.',
  },
  {
    n: '5',
    title: 'Supplier fulfills',
    body: 'The verified supplier fulfills the order. Delivery logistics are coordinated between the supplier and group. The platform records the transaction for all participating members.',
  },
] as const;

interface Step {
  readonly n: string;
  readonly title: string;
  readonly body: string;
}

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';

function FlowStep({ step }: { step: Step }) {
  return (
    <div className="flex w-full items-start gap-8 border-b border-border py-7">
      <div className="flex shrink-0 items-center rounded-sm bg-surface-raised px-3.5 py-2">
        <span className="font-semibold leading-snug text-brand-text">{step.n}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5">
        <p className="text-lg font-semibold leading-snug text-fg">{step.title}</p>
        <p className="leading-relaxed text-fg-muted">{step.body}</p>
      </div>
    </div>
  );
}

function FlowHeader({ tag, title }: { tag: string; title: string }) {
  return (
    <div className="flex w-full flex-col gap-4 pb-12">
      <div className="inline-flex self-start rounded-sm bg-surface-raised px-3 py-1.5">
        <p className="font-ibm-mono text-xs uppercase tracking-wide text-brand-text">{tag}</p>
      </div>
      <p className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl">
        {title}
      </p>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex flex-col gap-7 py-24`}>
          <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-fg-subtle">
            How It Works
          </p>
          <h1 className="max-w-4xl text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
            Every actor.
            <br />
            Every step.
            <br />
            In sequence.
          </h1>
          <p className="max-w-3xl text-xl leading-relaxed text-fg-muted">
            The complete end-to-end walkthrough for all three platform flows. Food Security Hub,
            Education Hub, and Cooperative Group purchasing — from first step to final outcome.
          </p>
        </div>
      </section>

      {/* S1 — Food Security Flow */}
      <section className="theme-product bg-surface">
        <div className={`${CONTAINER} flex w-full flex-col items-start py-24`}>
          <FlowHeader tag="Food Security Hub" title="Farmer to first transaction" />
          {FOOD_STEPS.map((step) => (
            <FlowStep key={step.n} step={step} />
          ))}
        </div>
      </section>

      {/* S2 — Education Flow */}
      <section className="theme-product bg-background">
        <div className={`${CONTAINER} flex w-full flex-col items-start py-24`}>
          <FlowHeader tag="Education Hub" title="Student to VERIFIED portfolio entry" />
          {EDUCATION_STEPS.map((step) => (
            <FlowStep key={step.n} step={step} />
          ))}
        </div>
      </section>

      {/* S3 — Cooperative Flow */}
      <section className="theme-product bg-surface">
        <div className={`${CONTAINER} flex w-full flex-col items-start py-24`}>
          <FlowHeader tag="Cooperative Group" title="Group formation to input order fulfillment" />
          {COOPERATIVE_STEPS.map((step) => (
            <FlowStep key={step.n} step={step} />
          ))}
        </div>
      </section>
    </>
  );
}
