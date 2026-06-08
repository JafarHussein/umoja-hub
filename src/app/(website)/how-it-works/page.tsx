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

function FlowStep({ step, numColor }: { step: Step; numColor: string }) {
  return (
    <div className="border-b border-[#2A3138] py-[28px] flex gap-[32px] items-start w-full">
      <div className="bg-[#2A3138] px-[14px] py-[8px] shrink-0 flex items-center">
        <span className={`font-jakarta font-600 text-[1rem] leading-[1.3] ${numColor}`}>
          {step.n}
        </span>
      </div>
      <div className="flex-1 flex flex-col gap-[10px]">
        <p className="font-jakarta font-600 text-[1.125rem] leading-[1.3] text-[#F2F0EC]">
          {step.title}
        </p>
        <p className="font-jakarta font-400 text-[1rem] leading-[1.6] text-[#A9A29A]">
          {step.body}
        </p>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#131619] px-[160px] py-[120px] flex flex-col gap-7">
        <p className="font-jakarta font-500 text-[0.875rem] tracking-[0.02em] text-[#878078]">
          How It Works
        </p>
        <h1 className="font-jakarta font-800 text-[4.5rem] leading-[1.05] tracking-[-0.03em] text-[#F2F0EC] w-[900px]">
          Every actor.
          <br />
          Every step.
          <br />
          In sequence.
        </h1>
        <p className="font-jakarta font-400 text-[1.25rem] leading-[1.6] text-[#A9A29A] w-[840px]">
          The complete end-to-end walkthrough for all three platform flows. Food Security Hub,
          Education Hub, and Cooperative Group purchasing — from first step to final outcome.
        </p>
      </section>

      {/* S1 — Food Security Flow */}
      <section className="bg-[#1B2025] px-[160px] py-[96px] flex flex-col items-start w-full">
        <div className="flex flex-col gap-[16px] pb-[48px] w-full">
          <div className="bg-[#4A3A2A] px-[12px] py-[6px] inline-flex self-start">
            <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.02em] text-[#D88A5A]">
              Food Security Hub
            </p>
          </div>
          <p className="font-jakarta font-600 text-[2.5rem] tracking-[-0.02em] leading-[1.15] text-[#F2F0EC] w-[900px]">
            Farmer to first transaction
          </p>
        </div>
        {FOOD_STEPS.map((step) => (
          <FlowStep key={step.n} step={step} numColor="text-[#D88A5A]" />
        ))}
      </section>

      {/* S2 — Education Flow */}
      <section className="bg-[#131619] px-[160px] py-[96px] flex flex-col items-start w-full">
        <div className="flex flex-col gap-[16px] pb-[48px] w-full">
          <div className="bg-[#1E3535] px-[12px] py-[6px] inline-flex self-start">
            <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.02em] text-[#56A8A2]">
              Education Hub
            </p>
          </div>
          <p className="font-jakarta font-600 text-[2.5rem] tracking-[-0.02em] leading-[1.15] text-[#F2F0EC] w-[900px]">
            Student to VERIFIED portfolio entry
          </p>
        </div>
        {EDUCATION_STEPS.map((step) => (
          <FlowStep key={step.n} step={step} numColor="text-[#56A8A2]" />
        ))}
      </section>

      {/* S3 — Cooperative Flow */}
      <section className="bg-[#1B2025] px-[160px] py-[96px] flex flex-col items-start w-full">
        <div className="flex flex-col gap-[16px] pb-[48px] w-full">
          <div className="bg-[#4A3A2A] px-[12px] py-[6px] inline-flex self-start">
            <p className="font-jakarta font-500 text-[0.75rem] tracking-[0.02em] text-[#D88A5A]">
              Cooperative Group
            </p>
          </div>
          <p className="font-jakarta font-600 text-[2.5rem] tracking-[-0.02em] leading-[1.15] text-[#F2F0EC] w-[900px]">
            Group formation to input order fulfillment
          </p>
        </div>
        {COOPERATIVE_STEPS.map((step) => (
          <FlowStep key={step.n} step={step} numColor="text-[#D88A5A]" />
        ))}
      </section>
    </>
  );
}
