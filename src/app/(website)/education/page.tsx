import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Education Hub — UmojaHub',
  description:
    'The UmojaHub Education Hub helps CS students build independently reviewed project portfolios. Three documents, peer review, a named lecturer decision, and a permanently public audit trail.',
};

const AUDIENCE_LINKS = [
  {
    audience: 'For Students',
    href: '/for/students',
    description:
      'What the project tracks involve, how the three-document structure works, what VERIFIED means and does not mean, and what your portfolio shows employers.',
  },
  {
    audience: 'For Lecturers',
    href: '/for/lecturers',
    description:
      'What reviewer participation involves, how the four-dimension rubric works, how effectiveness is tracked, and what conflict-of-interest protections exist.',
  },
  {
    audience: 'For Employers',
    href: '/for/employers',
    description:
      'What a VERIFIED portfolio entry represents, how the verification chain works, and how to use the portfolio as an interview preparation tool.',
  },
  {
    audience: 'For Institutions',
    href: '/for/institutions',
    description:
      'How individual faculty become verified reviewers, how students participate independently, and what accumulates over time.',
  },
] as const;

const REVIEW_CHAIN = [
  {
    step: '01',
    actor: 'Platform',
    heading: 'Brief assignment',
    detail:
      'AI_BRIEF: the system generates a problem brief from Kenyan agricultural industry contexts. OPEN_SOURCE: the student provides a GitHub repository and the platform generates a brief from its real needs. The brief is fixed — not negotiable.',
  },
  {
    step: '02',
    actor: 'Student',
    heading: 'Three documents and code',
    detail:
      'Problem Breakdown (did they understand the brief?), Approach Plan (did they plan before coding?), Final Reflection (can they honestly assess what they built and what they did not?). All three are required for submission.',
  },
  {
    step: '03',
    actor: 'Student',
    heading: 'Peer review',
    detail:
      'Before a submission advances to the lecturer queue, another registered student reviews it on four dimensions against the same rubric. Peer review is mandatory — it cannot be bypassed. It raises the floor and teaches reviewers what strong submissions look like.',
  },
  {
    step: '04',
    actor: 'Verified lecturer',
    heading: 'Named reviewer decision',
    detail:
      'A named academic or industry professional whose credentials were confirmed by platform administrators. They assess independently against the four-dimension rubric and issue a decision: VERIFIED, REVISION_REQUIRED, or DENIED. Their name and institutional affiliation appear in the portfolio entry.',
  },
  {
    step: '05',
    actor: 'Platform',
    heading: 'Permanent portfolio entry',
    detail:
      'A VERIFIED decision permanently publishes the project to the student\'s public portfolio. The entry includes: all three documents in full, peer scores, the reviewer\'s name and affiliation, decision date, and a SHA-256 document hash for independent integrity verification. No registration required to view.',
  },
] as const;

export default function EducationOverviewPage(): React.ReactElement {
  return (
    <>
      {/* Dark header */}
      <header className="bg-ws-surface-dark border-b border-ws-border-dark">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-12 lg:pt-28 lg:pb-16">
          <p className="font-geist-mono text-ws-caption text-ws-hub-blue uppercase mb-4">
            Education Hub
          </p>
          <h1 className="font-display text-display-3 lg:text-display-2 text-ws-text-bright mb-5 max-w-3xl">
            CS students have the capability. Employers cannot see it. The Education Hub closes that
            gap.
          </h1>
          <p className="font-geist text-ws-body-lg text-ws-text-dim max-w-2xl leading-[1.7]">
            A structured portfolio system where student projects are reviewed by named, credentials-
            confirmed lecturers against a documented rubric, producing a permanent public record with
            cryptographic document integrity. One platform, two hubs — connected by the same
            verification infrastructure.
          </p>
        </div>
      </header>

      {/* The connection to the Food Security Hub */}
      <div className="bg-ws-surface-dark-2 border-b border-ws-border-dark">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="max-w-3xl">
            <p className="font-geist-mono text-ws-caption text-ws-text-faint uppercase mb-4">
              Why a marketplace and an education program share one platform
            </p>
            <p className="font-geist text-ws-body-lg text-ws-text-dim leading-[1.7] mb-4">
              CS students at UmojaHub work on project briefs drawn from Kenya&apos;s agricultural industry
              — the same sector the Food Security Hub serves. The Education Hub does not produce
              generic portfolios. It produces developers who have documented, reviewed work in the
              domain their future employers are building for.
            </p>
            <p className="font-geist text-ws-body text-ws-text-faint">
              The two hubs share a verification infrastructure: the same administrator-reviewed
              credentials, the same audit log, the same cryptographic integrity mechanism. The
              underlying architecture is identical — only the domain and the credential type differ.
            </p>
          </div>
        </div>
      </div>

      {/* The review chain */}
      <div className="bg-ws-surface-base border-b border-ws-border-light">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <p className="font-geist-mono text-ws-caption text-ws-hub-blue uppercase mb-3">
            The review chain
          </p>
          <h2 className="font-display text-ws-section text-ws-text-primary mb-2 max-w-2xl">
            Five steps from brief assignment to permanent portfolio entry.
          </h2>
          <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-10 max-w-2xl">
            Every VERIFIED portfolio entry has passed through this sequence. No shortcuts, no
            self-reported outcomes.
          </p>

          <div className="flex flex-col max-w-3xl">
            {REVIEW_CHAIN.map((item, i) => (
              <div key={item.step}>
                <div className="border border-ws-border-light bg-ws-surface-base p-5 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-geist-mono text-[13px] leading-5 font-medium tabular-nums shrink-0 text-ws-hub-blue">
                      {item.step}
                    </span>
                    <span className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase">
                      {item.actor}
                    </span>
                  </div>
                  <p className="font-display text-ws-subsection text-ws-text-primary">{item.heading}</p>
                  <p className="font-geist text-ws-body text-ws-text-secondary">{item.detail}</p>
                </div>
                {i < REVIEW_CHAIN.length - 1 && (
                  <div className="flex justify-center" aria-hidden>
                    <div className="w-px h-6 bg-ws-border-medium" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What VERIFIED means / does not mean — two-column */}
      <div className="bg-ws-surface-raised border-b border-ws-border-light">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <p className="font-geist-mono text-ws-caption text-ws-hub-blue uppercase mb-3">
            Before you act on a portfolio entry
          </p>
          <h2 className="font-display text-ws-section text-ws-text-primary mb-10 max-w-2xl">
            VERIFIED is a specific, bounded claim.
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-ws-border-light max-w-3xl">
            <div className="bg-ws-surface-base p-6">
              <p className="font-geist-mono text-ws-caption text-ws-hub-blue uppercase mb-4">
                VERIFIED means
              </p>
              <ul className="space-y-3">
                {[
                  'A named, credentials-confirmed reviewer assessed all three documents and the code.',
                  'The submission met the documented minimum standard across all four rubric dimensions.',
                  'The decision is timestamped, recorded in the audit log, and attributed to the reviewer by name.',
                  'The document hash at submission matches what is currently visible in the portfolio.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="font-geist-mono text-ws-caption text-ws-hub-blue mt-0.5 shrink-0">
                      —
                    </span>
                    <span className="font-geist text-ws-body text-ws-text-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-ws-surface-base p-6">
              <p className="font-geist-mono text-ws-caption text-ws-status-denied uppercase mb-4">
                VERIFIED does not mean
              </p>
              <ul className="space-y-3">
                {[
                  'The student will perform well in your specific role.',
                  'The code is production-ready.',
                  'The documents were authored entirely without AI assistance.',
                  "The reviewer found the submission exceptional — VERIFIED means the threshold was met.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="font-geist-mono text-ws-caption text-ws-status-denied mt-0.5 shrink-0">
                      —
                    </span>
                    <span className="font-geist text-ws-body text-ws-text-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Audience routing */}
      <div className="bg-ws-surface-base border-b border-ws-border-light">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <p className="font-geist-mono text-ws-caption text-ws-hub-blue uppercase mb-3">
            Pages for each audience
          </p>
          <h2 className="font-display text-ws-section text-ws-text-primary mb-10 max-w-2xl">
            Each page covers what that audience needs to know before engaging.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-ws-border-light">
            {AUDIENCE_LINKS.map((item) => (
              <Link
                key={item.audience}
                href={item.href}
                className="bg-ws-surface-base p-6 flex flex-col gap-3 hover:bg-ws-surface-raised transition-colors duration-150 group"
              >
                <p className="font-geist-mono text-ws-caption text-ws-hub-blue uppercase group-hover:text-ws-hub-blue-dark transition-colors duration-150">
                  {item.audience}
                </p>
                <p className="font-geist text-ws-body text-ws-text-secondary">{item.description}</p>
                <span className="font-geist text-ws-body-sm text-ws-hub-blue mt-auto">
                  Read the page →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-ws-surface-raised">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-display text-ws-subsection text-ws-text-primary mb-1">
              Ready to register?
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary">
              Students register with a phone number and select a track. Lecturers submit credentials
              for administrator review.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/auth/register?role=student"
              className="inline-flex items-center justify-center min-h-[44px] px-6 border border-ws-hub-blue text-ws-hub-blue font-geist text-ws-body hover:bg-ws-hub-blue hover:text-white transition-colors duration-150"
            >
              Register as a student
            </Link>
            <Link
              href="/auth/register?role=lecturer"
              className="inline-flex items-center justify-center min-h-[44px] px-6 border border-ws-border-light text-ws-text-secondary font-geist text-ws-body hover:border-ws-border-medium transition-colors duration-150"
            >
              Register as a lecturer
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
