import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { GovernancePage } from '@/components/website/GovernancePage';
import { AdminProfile } from '@/components/website/AdminProfile';
import type { AnchorSection } from '@/components/website/SectionAnchor';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Verification Team — UmojaHub',
  description:
    'Who performs verification decisions on UmojaHub, what criteria they apply, how decisions are attributed, and how to challenge a decision.',
};

const sections: AnchorSection[] = [
  { id: 'verification-administrators', label: 'Verification administrators' },
  { id: 'decision-attribution', label: 'Decision attribution' },
  { id: 'what-is-reviewed', label: 'What is reviewed' },
  { id: 'appeals-process', label: 'Appeals process' },
  { id: 'escalation', label: 'Escalation' },
];

interface VerificationType {
  name: string;
  documents: string[];
  decision: string;
  link: string;
}

const verificationTypes: VerificationType[] = [
  {
    name: 'Farmer identity verification',
    documents: [
      'Government-issued photo identification: National ID card, passport, or cooperative membership card',
      'Land use documentation: title deed, lease agreement, or signed tenancy letter',
      'Produce photograph: a clear photograph of the farm or produce being listed',
    ],
    decision:
      'APPROVED or REJECTED. If rejected, a specific reason is provided. Resubmission is permitted within 30 days of rejection.',
    link: '/trust#farmer-verification',
  },
  {
    name: 'Agricultural supplier verification',
    documents: [
      'KEBS registration number (Kenya Bureau of Standards)',
      'PCPB registration number (Pest Control Products Board) — for pesticide and agrochemical suppliers',
      'KEPHIS number (Kenya Plant Health Inspectorate Service) — for seed and planting material suppliers',
    ],
    decision:
      'APPROVED or REJECTED. Regulatory numbers are confirmed against the relevant public databases. Suppliers who cannot provide verifiable numbers are not listed.',
    link: '/trust#supplier-verification',
  },
  {
    name: 'Lecturer credential verification',
    documents: [
      'Academic credentials: degree certificates or professional qualification documentation',
      'Institutional affiliation evidence: institutional email, staff page URL, or staff identification document',
      'Teaching or industry experience: a brief description of relevant background in the subject areas they will review',
    ],
    decision:
      'APPROVED or REJECTED. After approval, the lecturer is eligible to review project submissions. Their name and institutional affiliation appear on verified portfolio entries.',
    link: '/trust#lecturer-verification',
  },
];

interface AppealType {
  who: string;
  window: string;
  process: string;
  outcome: string;
}

const appealTypes: AppealType[] = [
  {
    who: 'Farmers and suppliers with rejected verification',
    window: '30 days from the date of the rejection decision',
    process:
      'Submit an appeal through the dashboard. The appeal must include an explanation of why you believe the decision was incorrect, and may include supplementary documentation if the original submission was incomplete or unclear.',
    outcome:
      'Appeals are reviewed by an administrator who was not involved in the original decision. You will receive a response within 5 business days of submitting the appeal.',
  },
  {
    who: 'Lecturers with rejected credential review',
    window: '30 days from the date of the rejection decision',
    process:
      'Submit an appeal through the dashboard. Provide additional documentation supporting your qualifications — additional academic certificates, a link to your institutional staff page, or a letter from your department head confirming your affiliation.',
    outcome:
      'Appeals are reviewed by an administrator who was not involved in the original decision. You will receive a response within 5 business days.',
  },
  {
    who: 'Students with DENIED project decisions',
    window: '72 hours from the date of the DENIED decision',
    process:
      'Submit a second review request through the dashboard. The request must include a link to a new git commit or updated document that specifically addresses the rubric failures cited in the reviewer\'s feedback. A vague revision without addressing the specific feedback will not meet the criteria for a second review.',
    outcome:
      'A second reviewer — different from the first — assesses the revised work. If the second review also results in DENIED, the decision is final for that submission. Starting a new project engagement is always permitted.',
  },
];

export default function VerificationTeamPage(): React.ReactElement {
  return (
    <GovernancePage
      eyebrow="Governance · Verification Team"
      heading="Verification is performed by people, not algorithms. Here is who they are."
      intro="Every farmer identity document, every supplier credential, and every lecturer qualification is reviewed by a named platform administrator. This page shows who performs verification decisions, what criteria they apply, how decisions are attributed, and how decisions can be challenged."
      sections={sections}
      ctaHref="/contact"
      ctaLabel="Contact the verification team"
    >
      {/* Section 1 — Verification Administrators */}
      <section id="verification-administrators" className="py-12">
        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          01 · Verification administrators
        </p>
        <h2 className="font-display text-ws-section text-ws-text-primary mb-3">
          Who reviews submissions
        </h2>
        <p className="font-geist text-ws-body text-ws-text-secondary leading-[1.7] mb-8 max-w-3xl">
          Every administrator who reviews verification submissions is named, described by their
          professional background, and linked to the criteria they apply. Verification decisions
          are not made anonymously. The name and date of the reviewing administrator appear in
          every decision notification.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-ws-border-light mb-8">
          <AdminProfile
            name="Jafar H."
            title="Lead Verification Administrator · All Verification Types"
            background="Platform founder and lead administrator with a background in software engineering and agricultural technology. Reviews farmer identity and land documentation against the published verification criteria, confirms supplier regulatory credentials against KEBS, PCPB, and KEPHIS records, and evaluates lecturer academic and professional qualifications. Responsible for appeals review and all escalated disputes."
            reviewScope="Farmer & Supplier verification, Lecturer credential review, Student project appeals, All escalated disputes"
            activeSince="January 2025"
            criteriaHref="/trust"
          />
        </div>

        <div className="border border-ws-border-light p-5 max-w-3xl">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
            Administrator privacy
          </p>
          <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6] mb-3">
            Administrators are identified by first name and last initial only (e.g., &ldquo;Jafar H.&rdquo;).
            Full legal names are not published. This protects administrators from targeted pressure
            or harassment by applicants whose submissions were rejected.
          </p>
          <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
            Additional administrators will be added as platform verification volume grows. All
            administrators undergo the same credential review process that is applied to lecturers
            before they are granted review authority.
          </p>
        </div>
      </section>

      {/* Section 2 — Decision Attribution */}
      <section id="decision-attribution" className="py-12">
        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          02 · Decision attribution
        </p>
        <h2 className="font-display text-ws-section text-ws-text-primary mb-3">
          How decisions are attributed
        </h2>
        <p className="font-geist text-ws-body text-ws-text-secondary leading-[1.7] mb-8 max-w-3xl">
          Every verification decision on the platform is attributed to the administrator who
          made it. Attribution is not optional — anonymous authority is not trust. Named,
          credentialed authority is.
        </p>

        <div className="space-y-3 max-w-3xl mb-8">
          {[
            {
              actor: 'Farmer or supplier',
              sees: 'Decision reviewed by Administrator Jafar H. on [Date]. Reason: [specific reason if rejected]. Resubmission permitted within 30 days.',
            },
            {
              actor: 'Student',
              sees: 'Reviewed by Lecturer [Name], [Institution], [Date]. Administrative record: Administrator Jafar H. verified this reviewer\'s credentials on [Date].',
            },
            {
              actor: 'Employer viewing a portfolio',
              sees: 'VERIFIED by [Lecturer Name], [Institution], [Date]. Verified by a platform-confirmed reviewer whose credentials were reviewed by Administrator Jafar H.',
            },
          ].map((item) => (
            <div key={item.actor} className="border border-ws-border-light overflow-hidden">
              <div className="bg-ws-surface-raised px-5 py-2 border-b border-ws-border-light">
                <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase">
                  {item.actor}
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6] italic">
                  &ldquo;{item.sees}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-ws-border-light p-5 max-w-3xl">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
            Why attribution matters
          </p>
          <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
            The attribution chain is visible not because the platform wants to expose
            administrators to individual complaints, but because a platform built on transparency
            cannot claim to be trustworthy while making consequential decisions anonymously.
            If a decision is challenged, the attribution record makes it possible to verify who
            made it, when, and under what criteria — the foundation of a credible appeals process.
          </p>
        </div>
      </section>

      {/* Section 3 — What Is Reviewed */}
      <section id="what-is-reviewed" className="py-12">
        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          03 · What is reviewed
        </p>
        <h2 className="font-display text-ws-section text-ws-text-primary mb-3">
          Documents and criteria for each verification type
        </h2>
        <p className="font-geist text-ws-body text-ws-text-secondary leading-[1.7] mb-8 max-w-3xl">
          Each verification type has a specific list of required documents and a published set
          of criteria the administrator applies. The criteria are not confidential — they are
          linked from every verification outcome screen in the platform.
        </p>

        <div className="space-y-6 max-w-3xl">
          {verificationTypes.map((vt) => (
            <div key={vt.name} className="border border-ws-border-light overflow-hidden">
              <div className="bg-ws-surface-raised px-5 py-3 border-b border-ws-border-light">
                <p className="font-geist text-ws-body-sm font-semibold text-ws-text-primary">
                  {vt.name}
                </p>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div>
                  <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
                    Required documents
                  </p>
                  <div className="space-y-1.5">
                    {vt.documents.map((doc, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="font-geist-mono text-ws-caption text-ws-text-tertiary shrink-0 mt-0.5">
                          —
                        </span>
                        <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
                          {doc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t border-ws-border-light">
                  <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
                    Decision
                  </p>
                  <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6] mb-3">
                    {vt.decision}
                  </p>
                  <Link
                    href={vt.link}
                    className="font-geist-mono text-ws-caption text-ws-hub-green hover:opacity-80 transition-opacity duration-150"
                  >
                    View full criteria →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-ws-border-light p-5 max-w-3xl mt-6">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
            Student project review is not administrator review
          </p>
          <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
            Student project submissions are reviewed by verified lecturers, not by administrators.
            Administrators verify lecturer credentials before they can review. Once verified,
            lecturers review projects independently using the published four-dimension rubric.
            Administrators do not review the content of student projects — only the credentials
            of the lecturers who do.
          </p>
        </div>
      </section>

      {/* Section 4 — Appeals Process */}
      <section id="appeals-process" className="py-12">
        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          04 · Appeals process
        </p>
        <h2 className="font-display text-ws-section text-ws-text-primary mb-3">
          How to challenge a decision
        </h2>
        <p className="font-geist text-ws-body text-ws-text-secondary leading-[1.7] mb-8 max-w-3xl">
          Every verification decision can be challenged. The appeals process exists because a
          single reviewer decision should not permanently close a person&apos;s path without recourse.
          The process is different for each actor type.
        </p>

        <div className="space-y-6 max-w-3xl">
          {appealTypes.map((appeal) => (
            <div key={appeal.who} className="border border-ws-border-light overflow-hidden">
              <div className="bg-ws-surface-raised px-5 py-3 border-b border-ws-border-light">
                <p className="font-geist text-ws-body-sm font-semibold text-ws-text-primary">
                  {appeal.who}
                </p>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-start gap-4">
                  <span className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase shrink-0 w-16">
                    Window
                  </span>
                  <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
                    {appeal.window}
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <span className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase shrink-0 w-16">
                    Process
                  </span>
                  <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
                    {appeal.process}
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <span className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase shrink-0 w-16">
                    Outcome
                  </span>
                  <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
                    {appeal.outcome}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-ws-border-light p-5 max-w-3xl mt-6">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
            For students after the 72-hour window closes
          </p>
          <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
            If the 72-hour second-review window closes without a request, or if the second
            review also results in DENIED, the decision is final for that project submission.
            The previous DENIED submission is recorded in the audit log but does not appear in
            the student&apos;s public portfolio. Starting a new project engagement is always
            permitted — a DENIED decision on one submission does not affect eligibility for
            future projects.
          </p>
        </div>
      </section>

      {/* Section 5 — Escalation */}
      <section id="escalation" className="py-12">
        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          05 · Escalation
        </p>
        <h2 className="font-display text-ws-section text-ws-text-primary mb-3">
          When an appeal itself is disputed
        </h2>
        <p className="font-geist text-ws-body text-ws-text-secondary leading-[1.7] mb-8 max-w-3xl">
          If an appeal outcome is itself disputed — for instance, if a farmer believes the
          appeals review was conducted in bad faith, or a student believes a procedural error
          occurred in the second review — an escalation path exists.
        </p>

        <div className="border border-ws-border-light p-6 max-w-3xl mb-6">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3">
            Escalation process
          </p>
          <div className="space-y-3">
            {[
              'Escalated disputes are reviewed by a senior administrator. The senior administrator was not involved in the original decision or the initial appeal.',
              'The senior administrator reviews the full decision record: original submission, original decision rationale, appeal submission, and appeal decision.',
              'Both the applicant and the reviewing administrator may provide a written statement. Neither is required to communicate directly with the other.',
              'The senior administrator\'s determination is final. The platform does not have a further internal appeals tier.',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="font-geist-mono text-ws-caption text-ws-hub-green shrink-0 mt-0.5 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-ws-border-light p-5 max-w-3xl">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
            What escalation is not for
          </p>
          <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
            Escalation is not a mechanism for re-litigating a clear, well-reasoned rejection
            with the same documentation. It exists for procedural concerns — cases where a
            process step was skipped, where the stated reason for rejection does not match the
            submitted criteria, or where there is evidence that the review was not conducted
            in good faith. Escalation requests that do not identify a procedural concern will
            be acknowledged but are unlikely to result in a different outcome.
          </p>
        </div>

        <div className="border border-ws-border-light p-5 max-w-3xl mt-4">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
            Contacting the verification team
          </p>
          <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6] mb-3">
            All appeals are submitted through the platform dashboard. If you cannot access
            your dashboard or are experiencing a technical issue that prevents you from
            submitting an appeal within the stated window, contact us directly with the
            account email and a description of the issue. The clock will not run while a
            verified technical access issue is being resolved.
          </p>
          <Link
            href="/contact?subject=verification-appeal"
            className="font-geist-mono text-ws-caption text-ws-hub-green hover:opacity-80 transition-opacity duration-150"
          >
            Contact the verification team →
          </Link>
        </div>
      </section>
    </GovernancePage>
  );
}
