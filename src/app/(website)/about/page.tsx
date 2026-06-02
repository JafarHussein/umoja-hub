import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { GovernancePage } from '@/components/website/GovernancePage';
import type { AnchorSection } from '@/components/website/SectionAnchor';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'About — UmojaHub',
  description:
    'Why UmojaHub was built, what it has built, where it operates, and how to contact the platform.',
};

const sections: AnchorSection[] = [
  { id: 'why-it-exists', label: 'Why it exists' },
  { id: 'what-we-have-built', label: 'What we have built' },
  { id: 'geographic-focus', label: 'Geographic focus' },
  { id: 'contact', label: 'Contact' },
];

interface PlatformComponent {
  name: string;
  what: string;
  status: string;
  statusType: 'operational' | 'pending';
}

interface GeographicFact {
  label: string;
  detail: string;
}

interface ContactType {
  subject: string;
  examples: string;
}

const foodHubComponents: PlatformComponent[] = [
  {
    name: 'Verified farmer directory',
    what: 'Farmers submit identity documents, land documentation, and a produce photograph. A platform administrator reviews each submission and issues an APPROVED or REJECTED decision with a specific reason. Verified farmers receive a Trust Score and their listings appear in the marketplace.',
    status: 'Operational',
    statusType: 'operational',
  },
  {
    name: 'Trust Score system',
    what: 'A score between 0 and 100 assigned to every verified farmer. Calculated from four components: verification status (40 points), transaction volume (25 points), buyer ratings (20 points), and order reliability (15 points). Recalculated automatically after each completed or failed order.',
    status: 'Operational',
    statusType: 'operational',
  },
  {
    name: 'M-Pesa marketplace',
    what: "Buyers browse verified listings and place orders. Payment is collected via Safaricom STK Push — the buyer enters their M-Pesa PIN on their device. Funds are held by the platform until the buyer confirms receipt. Farmers receive payment release to their M-Pesa account on confirmation. The order and payment flow is built and tested in sandbox mode.",
    status: 'Pending Safaricom go-live approval',
    statusType: 'pending',
  },
  {
    name: 'Price Intelligence',
    what: 'Aggregated pricing data across crops and counties. Draws from active listings and completed orders. Farmers can view what comparable produce is selling for in their county and in neighbouring counties before setting a price.',
    status: 'Operational',
    statusType: 'operational',
  },
  {
    name: 'Cooperative Groups',
    what: 'Verified farmers can form or join cooperative groups. Groups can coordinate bulk input purchase orders through verified agricultural suppliers. The group coordinator submits the order on behalf of all members.',
    status: 'Operational',
    statusType: 'operational',
  },
  {
    name: 'Verified supplier directory',
    what: 'Agricultural input suppliers are verified against KEBS, PCPB, and KEPHIS registration credentials before appearing in the platform. Verified suppliers can receive cooperative bulk input orders from farmer groups.',
    status: 'Operational',
    statusType: 'operational',
  },
  {
    name: 'Farm Analytics Tool',
    what: 'A structured guidance tool that answers questions about crops, soil health, pest management, weather conditions, and market timing. Uses rule-based agricultural knowledge to help farmers reason through crop decisions. Does not make buying or selling decisions on behalf of farmers. Powered by Groq.',
    status: 'Operational',
    statusType: 'operational',
  },
  {
    name: 'Knowledge Hub',
    what: 'Curated agricultural articles published by the platform. Covers crop management, soil science, post-harvest handling, and market access. Articles are reviewed before publication.',
    status: 'Operational',
    statusType: 'operational',
  },
];

const educationHubComponents: PlatformComponent[] = [
  {
    name: 'Structured brief generator',
    what: 'Two tracks: AI_BRIEF (the platform generates a project brief from East African agricultural industry contexts) and OPEN_SOURCE (the student provides a GitHub repository URL and receives a brief based on a selected open-source project). Briefs specify the problem, deliverables, target users, and evaluation criteria. Powered by OpenAI.',
    status: 'Operational',
    statusType: 'operational',
  },
  {
    name: 'Project Guidance Tool',
    what: 'A structured guidance tool that provides project planning templates and relevant technical documentation. Designed to help students reason through their approach independently rather than providing direct answers. Has context about the brief and the current submission stage. Will not write documents. Powered by Groq.',
    status: 'Operational',
    statusType: 'operational',
  },
  {
    name: 'Three-document submission system',
    what: 'Students submit three documents in sequence: a Breakdown Document (problem analysis, approach, and technology choices), a Plan Document (structured implementation plan with milestones and timeline), and a Reflection Document (honest self-assessment of what was completed, what was not, and what was learned). Each submission is timestamped and locked on submission.',
    status: 'Operational',
    statusType: 'operational',
  },
  {
    name: 'Peer review system',
    what: 'After all three documents are submitted, students are assigned as reviewers to a peer project. They receive the brief and all three documents. They produce a structured review on four dimensions: clarity, methodology, documentation quality, and reflection depth.',
    status: 'Operational',
    statusType: 'operational',
  },
  {
    name: 'Lecturer review system',
    what: 'Verified lecturers perform the final review. They have access to the brief, all three documents, and the peer review. They issue one of three decisions: VERIFIED, REVISIONS_REQUESTED, or FAILED. Decisions are final and irreversible.',
    status: 'Operational',
    statusType: 'operational',
  },
  {
    name: 'Verified portfolio',
    what: 'VERIFIED project entries are published to a permanent, shareable public URL. Each entry includes the brief type, all three documents, the peer review summary, the lecturer decision, and a document hash. Employers can independently confirm what the entry contains. URLs remain accessible even if the student deletes their account.',
    status: 'Operational',
    statusType: 'operational',
  },
];

const kenyaFacts: GeographicFact[] = [
  {
    label: 'M-Pesa infrastructure',
    detail:
      "Safaricom's M-Pesa is the dominant payment method in Kenya and is used by the majority of smallholder farmers who have mobile phones but no bank accounts. The Daraja API allows the platform to initiate payments directly to farmer M-Pesa accounts without requiring banking infrastructure. This makes it possible to handle payments for farmers who have never used a bank.",
  },
  {
    label: 'County-level geography',
    detail:
      "Kenya's 47-county administrative structure is the geographic unit the platform uses for produce location, price aggregation, and buyer search. The county system is well-understood by farmers and buyers and maps to the scale at which most smallholder agricultural trading already occurs.",
  },
  {
    label: 'CS graduate market',
    detail:
      'Kenya has a substantial CS graduate population across universities including the University of Nairobi, Strathmore University, Jomo Kenyatta University of Agriculture and Technology, and Meru University of Science and Technology. The verification problem — portfolios that cannot be independently confirmed — is particularly acute in a competitive graduate market where employers have been misled before.',
  },
  {
    label: 'Safaricom licensing',
    detail:
      'Production M-Pesa payment go-live requires a formal Safaricom application and approval process separate from technical integration. The marketplace order and payment flow is built and tested in sandbox mode. Full production activation is pending Safaricom approval and represents the critical path to full marketplace operation.',
  },
];

const eastAfricaFacts: GeographicFact[] = [
  {
    label: 'Shared structural failures',
    detail:
      'The three problems the platform addresses — farmers who cannot prove reliability, buyers who have no verified directory, students whose documented capability cannot be independently confirmed — are present across Rwanda, Uganda, Tanzania, and Ethiopia. They are not Kenya-specific.',
  },
  {
    label: 'Mobile money ecosystem',
    detail:
      "M-Pesa operates in Tanzania alongside Safaricom's regional presence. MTN Mobile Money covers Uganda and Rwanda. The platform payment architecture is designed to accommodate multiple mobile money providers, though the initial integration is Safaricom Kenya only. Expanding to additional providers requires separate API integrations.",
  },
  {
    label: 'Agricultural domain briefs',
    detail:
      'The Education Hub structured brief generator draws project contexts from East African agricultural industry problems — irrigation data management, crop disease detection, supply chain logistics, cooperative coordination. CS students in any East African country can receive and work on contextually relevant briefs even before the platform operates in their country.',
  },
];

const contactTypes: ContactType[] = [
  {
    subject: 'Verification questions',
    examples:
      "What a rejection reason means, how to correct and resubmit documents, what a Trust Score reflects, or what the verification administrator checked.",
  },
  {
    subject: 'Portfolio verification',
    examples:
      "Employers or institutions who wish to confirm the contents of a public portfolio URL, or who need to verify a document hash against the platform's records.",
  },
  {
    subject: 'Partnership and research inquiries',
    examples:
      'NGOs, government agencies, research institutions, or agricultural organisations who wish to discuss data access agreements, pilot programmes, or integration possibilities.',
  },
  {
    subject: 'Platform issues',
    examples:
      'Payment failures, submission errors, review delays beyond stated timelines, or account access problems not resolvable through the Help Center.',
  },
  {
    subject: 'Security disclosures',
    examples:
      'Responsible disclosure of security vulnerabilities. See the Security page for the disclosure process and what information to include in a report.',
  },
];

export default function AboutPage(): React.ReactElement {
  return (
    <GovernancePage
      eyebrow="About UmojaHub"
      heading="Two platforms built to address three structural failures in Kenya's agricultural and technology sectors."
      intro="UmojaHub is a verified farmer marketplace for East Africa and a verified portfolio system for Kenyan CS students. This page explains the motivation, current state, and geographic scope."
      sections={sections}
      ctaHref="/contact"
      ctaLabel="Contact us"
    >
      {/* Section 1 — Why it exists */}
      <section id="why-it-exists" className="py-12">
        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          01 · Why it exists
        </p>
        <h2 className="font-display text-ws-section text-ws-text-primary mb-6">
          Three structural failures
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-ws-border-light mb-6">
          <div className="bg-ws-surface-base p-6 flex flex-col gap-3">
            <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase">
              The farmer problem
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
              A smallholder farmer who consistently fulfils orders on time has no mechanism to prove
              that reliability to a buyer in a different county who has never met them. The price
              they receive is quoted by traders who also control the price information — they cannot
              independently verify whether the offer reflects market demand.
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
              Their track record exists only in informal memory. A new buyer cannot distinguish them
              from an unreliable farmer without a physical introduction or a trusted referral.
              Neither scales past a small radius.
            </p>
          </div>
          <div className="bg-ws-surface-base p-6 flex flex-col gap-3">
            <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase">
              The buyer problem
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
              A buyer who wants to purchase directly from a farmer — for freshness, lower cost, and
              accountability — has no searchable, verified directory of available produce. There is
              no public record of who has fulfilled orders reliably and who has not.
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
              Without that information, the only basis for choosing a farmer is price or referral.
              Neither scales. Most buyers end up purchasing through brokers anyway — not because
              they prefer it, but because there is no reliable alternative.
            </p>
          </div>
          <div className="bg-ws-surface-base p-6 flex flex-col gap-3">
            <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase">
              The student problem
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
              A Kenyan CS student who built real projects during their degree cannot prove the depth
              of their capability to an employer who does not know them. Their degree certifies which
              subjects they studied. A GitHub portfolio is self-reported — the code could have been
              copied, generated, or written without genuine problem-solving.
            </p>
            <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
              Employers who have been misled before respond by discounting portfolios entirely. This
              advantages students from well-known universities regardless of actual capability.
            </p>
          </div>
        </div>

        <div className="border-l-2 border-ws-hub-green pl-6 py-2">
          <p className="font-geist text-ws-body text-ws-text-secondary leading-[1.7] mb-3">
            UmojaHub was built to address these three specific failures. The Food Security Hub
            creates a public, verifiable record of farmer reliability — built from verified identity,
            completed transactions, and independently submitted buyer ratings. The Education Hub
            creates a public, verifiable record of student capability — built from structured
            documentation reviewed by verified lecturers against defined criteria.
          </p>
          <p className="font-geist text-ws-body text-ws-text-secondary leading-[1.7]">
            In both cases, the purpose is the same: to make trust verifiable where it previously was
            not.
          </p>
        </div>
      </section>

      {/* Section 2 — What we have built */}
      <section id="what-we-have-built" className="py-12">
        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          02 · What we have built
        </p>
        <h2 className="font-display text-ws-section text-ws-text-primary mb-3">
          Current platform state
        </h2>
        <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6] mb-8">
          The components below are built. Where a component is pending an external dependency (such
          as Safaricom production approval), this is stated explicitly.
        </p>

        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          Food Security Hub
        </p>
        <div className="bg-ws-surface-raised border border-ws-border-light overflow-hidden mb-8">
          {foodHubComponents.map((component) => (
            <div
              key={component.name}
              className="px-5 py-5 border-b border-ws-border-light last:border-0"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <p className="font-geist text-ws-body-sm font-semibold text-ws-text-primary">
                  {component.name}
                </p>
                <p
                  className={`font-geist-mono text-ws-caption uppercase shrink-0 ${
                    component.statusType === 'operational'
                      ? 'text-ws-hub-green'
                      : 'text-ws-status-pending'
                  }`}
                >
                  {component.status}
                </p>
              </div>
              <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
                {component.what}
              </p>
            </div>
          ))}
        </div>

        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          Education Hub
        </p>
        <div className="bg-ws-surface-raised border border-ws-border-light overflow-hidden">
          {educationHubComponents.map((component) => (
            <div
              key={component.name}
              className="px-5 py-5 border-b border-ws-border-light last:border-0"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <p className="font-geist text-ws-body-sm font-semibold text-ws-text-primary">
                  {component.name}
                </p>
                <p
                  className={`font-geist-mono text-ws-caption uppercase shrink-0 ${
                    component.statusType === 'operational'
                      ? 'text-ws-hub-green'
                      : 'text-ws-status-pending'
                  }`}
                >
                  {component.status}
                </p>
              </div>
              <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
                {component.what}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — Geographic focus */}
      <section id="geographic-focus" className="py-12">
        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          03 · Geographic focus
        </p>
        <h2 className="font-display text-ws-section text-ws-text-primary mb-3">
          Kenya first. East Africa in scope.
        </h2>
        <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6] mb-8">
          The initial build targets Kenya because the payment infrastructure required — M-Pesa via
          Safaricom Daraja — is Kenya-native. The structural failures being addressed are regional.
        </p>

        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          Why Kenya
        </p>
        <div className="bg-ws-surface-raised border border-ws-border-light overflow-hidden mb-8">
          {kenyaFacts.map((fact) => (
            <div key={fact.label} className="px-5 py-5 border-b border-ws-border-light last:border-0">
              <p className="font-geist text-ws-body-sm font-semibold text-ws-text-primary mb-2">
                {fact.label}
              </p>
              <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
                {fact.detail}
              </p>
            </div>
          ))}
        </div>

        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          East Africa in scope
        </p>
        <div className="bg-ws-surface-raised border border-ws-border-light overflow-hidden mb-6">
          {eastAfricaFacts.map((fact) => (
            <div key={fact.label} className="px-5 py-5 border-b border-ws-border-light last:border-0">
              <p className="font-geist text-ws-body-sm font-semibold text-ws-text-primary mb-2">
                {fact.label}
              </p>
              <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
                {fact.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="border border-ws-border-light p-5">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
            Current scope
          </p>
          <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
            The platform currently operates in Kenya only. County data, phone number validation, and
            payment processing are all Kenya-specific. Expansion to additional East African markets
            depends on payment provider integrations and regulatory requirements in each country.
          </p>
        </div>
      </section>

      {/* Section 4 — Contact */}
      <section id="contact" className="py-12">
        <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
          04 · Contact
        </p>
        <h2 className="font-display text-ws-section text-ws-text-primary mb-3">
          What we handle
        </h2>
        <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6] mb-8">
          UmojaHub is an independent platform project. The following types of inquiry can be
          directed to the platform through the contact form.
        </p>

        <div className="bg-ws-surface-raised border border-ws-border-light overflow-hidden mb-6">
          {contactTypes.map((type) => (
            <div key={type.subject} className="px-5 py-5 border-b border-ws-border-light last:border-0">
              <p className="font-geist text-ws-body-sm font-semibold text-ws-text-primary mb-2">
                {type.subject}
              </p>
              <p className="font-geist text-ws-body-sm text-ws-text-secondary leading-[1.6]">
                {type.examples}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center min-h-[44px] px-6 border border-ws-border-light text-ws-text-secondary font-geist text-ws-body-sm hover:border-ws-border-medium hover:text-ws-text-primary transition-colors duration-150"
          >
            Contact form
          </Link>
          <Link
            href="/security"
            className="inline-flex items-center justify-center min-h-[44px] px-6 border border-ws-border-light text-ws-text-secondary font-geist text-ws-body-sm hover:border-ws-border-medium hover:text-ws-text-primary transition-colors duration-150"
          >
            Security disclosure process
          </Link>
        </div>
      </section>
    </GovernancePage>
  );
}
