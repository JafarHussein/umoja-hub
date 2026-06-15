import type { Metadata } from 'next';
import Link from 'next/link';
import { MediaFrame } from '@/components/website/MediaFrame';

export const metadata: Metadata = {
  title: 'For Employers: Education Hub · UmojaHub',
  description:
    'Verify student portfolios built on real, assessed evidence, without registering or paying. Every entry is cryptographically locked and reviewed by a named lecturer.',
};

const VERIFICATION_CHAIN = [
  { step: 'Student submits', detail: 'Three documents uploaded and SHA-256 hashed before review begins.' },
  {
    step: 'Lecturer reviews',
    detail: "A named, verified lecturer from the student's institution assesses against a published rubric.",
  },
  { step: 'Platform anchors', detail: 'On approval, the hash and reviewer identity are recorded. Neither can be altered.' },
  {
    step: 'You verify',
    detail:
      'View the public portfolio entry. The hash is visible. Re-compute it from the submitted files to confirm authenticity independently.',
  },
] as const;

const INDEPENDENTLY_VERIFIABLE = [
  "The reviewer's institutional identity. Their name and role are listed on the entry.",
  "The submission hash. Compute it yourself from the student's documents to confirm integrity.",
  'The review rubric. Published publicly, the same rubric applied to every submission.',
  'The decision date. When the verification was issued and by whom.',
] as const;

const IS_NOT_ITEMS = [
  'A reference that can be influenced by the student after submission',
  'A self-certified course certificate',
  'A portfolio the student can edit after verification',
  'A placement or recruitment service',
] as const;

const CONTAINER = 'mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-20';
const H2 = 'text-3xl font-semibold leading-tight tracking-tight text-fg md:text-4xl';

export default function ForEmployersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className={`${CONTAINER} grid items-center gap-12 pt-24 pb-20 md:pb-28 lg:grid-cols-12`}>
          <div className="flex flex-col gap-6 lg:col-span-7">
            <p className="font-ibm-mono text-xs font-semibold uppercase tracking-widest text-brand">
              For employers
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-fg md:text-6xl">
              Verify portfolios
              <br />
              without asking the student.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
              Every portfolio entry is reviewed by a verified lecturer and cryptographically
              anchored. You can verify the submission hash and reviewer identity yourself, without
              registering or paying.
            </p>
            <Link
              href="/knowledge"
              className="inline-flex items-center justify-center self-start rounded-sm border border-border-strong px-7 py-4 font-medium text-fg transition-colors hover:bg-surface-sunken"
            >
              Read how verification works
            </Link>
          </div>
          <div className="lg:col-span-5">
            <MediaFrame
              alt="An employer reviewing a verified student portfolio"
              label="Reviewing a portfolio"
              aspect="aspect-[4/5]"
              priority
            />
          </div>
        </div>
      </section>

      {/* Verification chain */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col gap-12 py-24`}>
          <h2 className={H2}>Four steps from submission to your desk</h2>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {VERIFICATION_CHAIN.map((item, i) => (
              <div key={item.step} className="flex flex-col gap-3 bg-surface p-6">
                <p className="font-ibm-mono text-xs text-brand">0{i + 1}</p>
                <p className="font-semibold text-fg">{item.step}</p>
                <p className="text-sm leading-relaxed text-fg-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Independently verifiable */}
      <section className="bg-background">
        <div className={`${CONTAINER} grid grid-cols-1 gap-12 py-24 md:grid-cols-2`}>
          <div className="flex flex-col gap-5">
            <h2 className={H2}>Independently verifiable</h2>
            <ul className="flex flex-col gap-4">
              {INDEPENDENTLY_VERIFIABLE.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span className="text-fg-muted">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-5">
            <h2 className={H2}>Not part of this system</h2>
            <ul className="flex flex-col gap-4">
              {IS_NOT_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fg-subtle" />
                  <span className="text-fg-muted">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-surface-sunken">
        <div className={`${CONTAINER} flex flex-col items-center gap-6 py-24 text-center`}>
          <h2 className={H2}>Institutional partnerships</h2>
          <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
            If your organisation reviews many portfolios, contact us to discuss bulk access and API
            integration options.
          </p>
          <a
            href="mailto:partnerships@umojahub.org"
            className="inline-flex items-center justify-center rounded-sm bg-brand px-8 py-4 font-semibold text-brand-fg transition-colors hover:bg-brand-hover active:scale-95"
          >
            partnerships@umojahub.org
          </a>
        </div>
      </section>
    </>
  );
}
