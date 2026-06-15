import type { Metadata } from 'next';
import { MediaFrame } from '@/components/website/MediaFrame';

export const metadata: Metadata = {
  title: 'How It Works · UmojaHub',
  description:
    'The complete end-to-end walkthrough for all three platform flows. Food Security Hub, Education Hub, and Cooperative Group purchasing, from first step to final outcome.',
};

const FOOD_STEPS = [
  { n: '1', title: 'Register as a farmer', body: 'Create an account and select the FARMER role. Provide your basic profile information.' },
  { n: '2', title: 'Submit verification documents', body: 'Upload your National ID or passport, land documentation, and a farm photograph. All documents are reviewed by a platform administrator.' },
  { n: '3', title: 'Administrator reviews your submission', body: 'A named administrator reviews your documents for consistency, plausibility, and completeness. Decision: approved or rejected with specific, correctable reasons.' },
  { n: '4', title: 'Receive approved status', body: 'Your Trust Score initializes. You are assigned the New tier. Your account is active and you can create listings.' },
  { n: '5', title: 'Create your first listing', body: 'Add a produce listing: crop type, quantity, price per kg, county, harvest date. The listing is visible to all marketplace visitors immediately.' },
  { n: '6', title: 'Buyer places an order', body: "A buyer selects your listing, reviews your Trust Score, and initiates an order. An STK Push is sent to the buyer's phone for M-Pesa authorization." },
  { n: '7', title: 'Payment confirms', body: 'The buyer enters their M-Pesa PIN. Payment confirmation triggers your dispatch obligation. You receive notification.' },
  { n: '8', title: 'Dispatch and confirm', body: 'Dispatch the produce and confirm dispatch on the platform. The buyer is notified.' },
  { n: '9', title: 'Order received and rated', body: 'The buyer confirms receipt and submits a rating. The rating recalculates your Trust Score buyer rating component.' },
] as const;

const EDUCATION_STEPS = [
  { n: '1', title: 'Register as a student', body: 'Create an account and select the STUDENT role. Enroll on a project track that matches your field of study.' },
  { n: '2', title: 'Receive a project brief', body: 'The platform assigns a structured brief. The brief defines a specific problem, constraints, and deliverable requirements.' },
  { n: '3', title: 'Produce three documents', body: 'Problem Breakdown (analysis of the problem), Approach Plan (proposed methodology), Final Reflection (what was built, what failed, what was learned).' },
  { n: '4', title: 'Documents are hashed at submission', body: 'At submission, a SHA-256 hash of the combined documents is created and recorded with timestamp and submission ID. The documents are locked.' },
  { n: '5', title: 'Peer review', body: 'Another student on the same track reviews your documents against the four-dimension rubric and assigns a score with written commentary. Peer scores are locked before entering the lecturer queue.' },
  { n: '6', title: 'Lecturer review', body: 'A verified, named lecturer receives your submission and assesses it independently using the same rubric, without seeing the peer score. Decision: verified, revision required, or denied.' },
  { n: '7', title: 'Decision recorded in portfolio', body: 'The decision, reviewer name, decision date, document hash, and full commentary are recorded in your public portfolio entry. The full decision history is preserved.' },
  { n: '8', title: 'Portfolio entry is public', body: 'Employers can access your portfolio entry without registering. The verification chain (documents, hash, peer score, lecturer decision) is all visible.' },
] as const;

const COOPERATIVE_STEPS = [
  { n: '1', title: 'Be a verified farmer first', body: 'Cooperative group access requires farmer verification. Complete the farmer verification flow before joining or creating a group.' },
  { n: '2', title: 'Create or join a cooperative group', body: 'Create a new group from your dashboard, or join an existing group in your county. Groups are visible to all verified farmers.' },
  { n: '3', title: 'Agree on a collective order', body: 'Group members agree on the specific inputs required: seed type, fertilizer grade, quantity. The group nominates a verified supplier from the platform directory.' },
  { n: '4', title: 'Submit the collective order', body: 'The group submits the collective order to the nominated supplier. Payment coordination is handled through the group, not individually.' },
  { n: '5', title: 'Supplier fulfills', body: 'The verified supplier fulfills the order. Delivery logistics are coordinated between the supplier and group. The platform records the transaction for all participating members.' },
] as const;

interface Step {
  readonly n: string;
  readonly title: string;
  readonly body: string;
}

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const H2 = 'text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl';

function Flow({ title, steps }: { title: string; steps: readonly Step[] }) {
  return (
    <div className={`${CONTAINER} flex flex-col gap-10 py-24`}>
      <h2 className={H2}>{title}</h2>
      <div className="grid grid-cols-1 divide-y divide-border border-y border-border">
        {steps.map((step) => (
          <div key={step.n} className="flex items-start gap-6 py-7">
            <div className="flex shrink-0 items-center rounded-sm bg-surface-sunken px-3.5 py-2">
              <span className="font-semibold text-brand">{step.n}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <p className="text-lg font-semibold leading-snug text-fg">{step.title}</p>
              <p className="leading-relaxed text-fg-muted">{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className={`${CONTAINER} grid items-center gap-12 pt-24 pb-20 md:pb-28 lg:grid-cols-12`}>
          <div className="flex flex-col gap-6 lg:col-span-7">
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              How it works
            </p>
            <h1 className="text-5xl font-extrabold leading-none tracking-tight text-fg md:text-6xl">
              Every actor.
              <br />
              Every step, in sequence.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
              The complete end-to-end walkthrough for all three platform flows: Food Security Hub,
              Education Hub, and Cooperative Group purchasing, from first step to final outcome.
            </p>
          </div>
          <div className="lg:col-span-5">
            <MediaFrame
              alt="A farmer and a student using the platform"
              label="The platform in use"
              aspect="aspect-[4/5]"
              priority
            />
          </div>
        </div>
      </section>

      <section className="bg-surface-sunken">
        <Flow title="Farmer to first transaction" steps={FOOD_STEPS} />
      </section>
      <section className="bg-background">
        <Flow title="Student to verified portfolio entry" steps={EDUCATION_STEPS} />
      </section>
      <section className="bg-surface-sunken">
        <Flow title="Group formation to input order fulfillment" steps={COOPERATIVE_STEPS} />
      </section>
    </>
  );
}
