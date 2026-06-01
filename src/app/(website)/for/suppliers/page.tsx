import React from 'react';
import type { Metadata } from 'next';
import { AudiencePage } from '@/components/website/AudiencePage';
import { FaqAccordion, type FaqItem } from '@/components/website/FaqAccordion';
import type { AnchorSection } from '@/components/website/SectionAnchor';

interface VerificationRequirement {
  label: string;
  detail: string;
  note: string | null;
}

interface ListingField {
  label: string;
  whatItShows: string;
  visibleTo: string;
}

interface OrderStep {
  label: string;
  actor: string;
  detail: string;
  note: string | null;
}

interface Responsibility {
  heading: string;
  detail: string;
}

interface Limitation {
  heading: string;
  detail: string;
}

export const metadata: Metadata = {
  title: 'For Suppliers — UmojaHub Food Security Hub',
  description:
    'What the verified supplier directory is, how cooperative group orders work, what verification involves, and how to apply to be listed.',
};

const sections: AnchorSection[] = [
  { id: 'why-the-directory-exists', label: 'Why the directory exists' },
  { id: 'how-cooperative-orders-work', label: 'How cooperative orders work' },
  { id: 'what-verification-involves', label: 'What verification involves' },
  { id: 'what-appears-in-your-listing', label: 'What appears in your listing' },
  { id: 'payment-coordination', label: 'Payment coordination' },
  { id: 'a-real-scenario', label: 'A real scenario' },
  { id: 'responsibilities', label: 'Responsibilities' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'faq', label: 'FAQ' },
  { id: 'how-to-apply', label: 'How to apply' },
];

const verificationRequirements: VerificationRequirement[] = [
  {
    label: 'Business registration certificate',
    detail:
      'Your company registration certificate from the Business Registration Service (BRS) or equivalent authority. Confirms the entity applying for listing is a registered legal entity.',
    note: null,
  },
  {
    label: 'KRA PIN certificate',
    detail:
      'Your Kenya Revenue Authority PIN certificate. Confirms the entity has a recognized tax identity in Kenya.',
    note: null,
  },
  {
    label: 'Regulatory certifications',
    detail:
      'The certificates relevant to your input categories. KEBS certification numbers for fertilizers, seeds, and farm tools. PCPB registration for pesticide and herbicide products. KEPHIS phytosanitary certification for seed products. Not all categories require all three — submit what applies to your product range.',
    note: 'Administrators review the documents you submit. They confirm the certification numbers and issuing bodies are consistent with your claimed credentials. They do not query the issuing regulatory body in real time — this is a document consistency check, not a live registry verification.',
  },
  {
    label: 'Premises photograph',
    detail:
      'A photograph of your business premises: warehouse, showroom, or primary operating location. Used as a plausibility check — is the scale of your operation consistent with the products and certifications you are claiming?',
    note: null,
  },
];

const listingFields: ListingField[] = [
  {
    label: 'Business name',
    whatItShows: 'Your registered business name as it appears on your registration certificate.',
    visibleTo: 'All users browsing the supplier directory and cooperative groups selecting a supplier for a group order.',
  },
  {
    label: 'County of operation',
    whatItShows: 'The county or counties where you can fulfill group orders. Used by cooperative groups to filter for suppliers within practical logistics range.',
    visibleTo: 'All users.',
  },
  {
    label: 'Input categories',
    whatItShows: 'The categories of agricultural inputs you supply: seeds, fertilizers, pesticides, herbicides, farm tools, or combinations.',
    visibleTo: 'All users.',
  },
  {
    label: 'Regulatory credential numbers',
    whatItShows: 'The specific certification numbers issued to your business: KEBS, PCPB, and/or KEPHIS numbers where applicable. Cooperative groups and farmers can cross-reference these independently with the issuing regulatory bodies.',
    visibleTo: 'All users.',
  },
  {
    label: 'Verified status indicator',
    whatItShows: 'A platform-administered confirmation that your credentials were reviewed and found consistent. Distinguishes you from unlisted suppliers.',
    visibleTo: 'All users.',
  },
];

const orderSteps: OrderStep[] = [
  {
    label: 'Step 1',
    actor: 'Farmer group',
    detail:
      'A cooperative group of verified farmers on the platform decides to place a collective input order. They agree on: the product category, the total quantity they need, and the supplier they want to order from.',
    note: null,
  },
  {
    label: 'Step 2',
    actor: 'Farmer group',
    detail:
      'The group nominates a supplier from the verified directory. The nominated supplier must be listed in the directory — unlisted suppliers cannot be nominated.',
    note: null,
  },
  {
    label: 'Step 3',
    actor: 'Platform',
    detail:
      'The platform records the group order specification: supplier, product category, total quantity, participating members, and per-member contribution.',
    note: null,
  },
  {
    label: 'Step 4',
    actor: 'Platform / Administrator',
    detail:
      'The order specification is communicated to the supplier through the platform and through administrator coordination. The supplier confirms they can fulfill the order at the quantity requested.',
    note: 'Payment coordination at this stage is currently outside the platform\'s M-Pesa payment system. Read the Payment coordination section on this page before assuming the payment flow works like individual marketplace transactions.',
  },
  {
    label: 'Step 5',
    actor: 'Supplier',
    detail:
      'The supplier fulfills the group order. Delivery is coordinated between the supplier and the cooperative group, typically through the group\'s nominated contact person and the platform administrator.',
    note: null,
  },
  {
    label: 'Step 6',
    actor: 'Farmer group',
    detail:
      'Group members confirm receipt. The order is marked complete on the platform.',
    note: null,
  },
];

const responsibilities: Responsibility[] = [
  {
    heading: 'Keep your credentials current',
    detail:
      'Your directory listing reflects the credentials you submitted at verification time. If your certifications expire, lapse, or are revoked, you are responsible for notifying the platform. Operating with lapsed regulatory credentials while listed as verified is a violation that results in removal from the directory.',
  },
  {
    heading: 'Respond to group order nominations in reasonable time',
    detail:
      'When a cooperative group nominates you for a group order, a timely response — confirming you can fulfill, or declining with a reason — is expected. Groups that cannot get confirmation from a nominated supplier may nominate an alternative. Repeated non-response is a factor in directory listing review.',
  },
  {
    heading: 'Fulfill confirmed orders as agreed',
    detail:
      'Once you confirm a group order, you are committed to fulfilling it at the agreed quantity and price. Unfulfilled confirmed orders, or significant shortfalls without prior communication, affect your standing in the directory.',
  },
  {
    heading: 'Do not misrepresent product specifications',
    detail:
      'The products you supply must match the categories and credentials in your listing. Supplying uncertified products, substituting lower-grade products for certified ones, or misrepresenting formulations is a serious violation. It is also a regulatory matter under KEBS, PCPB, and KEPHIS rules independently of the platform.',
  },
];

const limitations: Limitation[] = [
  {
    heading: 'You cannot self-register or manage your own listing',
    detail:
      'There is no supplier portal or self-service account management. Your listing is created and maintained by platform administrators based on the credentials you submit. Any updates to your listing — new certifications, expanded coverage area, updated contact information — require you to contact the platform and submit updated documentation for administrator review.',
  },
  {
    heading: 'The platform cannot guarantee minimum order volumes',
    detail:
      'Being listed in the verified supplier directory does not guarantee that cooperative groups will nominate you or that any minimum order volume will be placed. The directory is a searchable mechanism — cooperative groups choose suppliers based on product category, county coverage, and their own preferences. The platform does not route orders to suppliers or guarantee purchase volumes.',
  },
  {
    heading: 'The platform cannot control group composition changes',
    detail:
      'A cooperative group that nominates you may lose members before the order is fulfilled. If the remaining members fall below the minimum participation threshold or cannot meet the per-unit commitment, the order may be reduced or cancelled. This is an inherent feature of the cooperative group model — the platform records the order specification but cannot prevent group dynamics from affecting it.',
  },
  {
    heading: 'Regulatory credential verification is document-based, not live',
    detail:
      'Administrators reviewed the certification documents you submitted. They did not query KEBS, PCPB, or KEPHIS in real time to confirm your current standing with those bodies. Your verified status reflects a point-in-time document review. A supplier whose certifications have since been revoked but whose listing remains active is a risk that the platform\'s verification mechanism does not automatically detect.',
  },
  {
    heading: 'Payment is not through the platform\'s payment system',
    detail:
      'Group order payments are currently coordinated outside the platform\'s M-Pesa STK Push system. There is no automated payment confirmation or escrow mechanism for cooperative group transactions equivalent to what exists for individual marketplace orders. Payment terms are agreed between the group and the supplier, coordinated through the platform administrator.',
  },
];

const faqItems: FaqItem[] = [
  {
    question: 'Can we register ourselves as a supplier on the platform?',
    answer:
      'No. Suppliers are not self-registered. You contact the platform to apply, submit your credentials, and platform administrators review and list you if your credentials are verified. There is no supplier registration form on the platform.',
  },
  {
    question: 'What happens after we submit our credentials?',
    answer:
      'An administrator reviews the documents you submitted. If your credentials are consistent and complete, you are added to the verified supplier directory. Your listing goes live. You are notified when the review is complete. The typical review time depends on the current queue — contact the platform for an estimate when you apply.',
  },
  {
    question: 'Which certifications do we need?',
    answer:
      'It depends on your product categories. Fertilizer suppliers need KEBS certification. Pesticide and herbicide suppliers need PCPB registration. Seed suppliers need KEPHIS phytosanitary certification. Farm tool suppliers typically need KEBS quality certification. Submit all certifications that apply to your product range. Certifications that are not relevant to your categories are not required.',
  },
  {
    question: 'What if we supply products in multiple categories?',
    answer:
      'Submit certifications for all categories you supply. Your listing will reflect all certified categories. A supplier who holds KEBS and PCPB certifications and supplies both fertilizers and pesticides will appear in searches for both categories.',
  },
  {
    question: 'Can we update our listing after it is live?',
    answer:
      'Yes, but not directly. Contact the platform with the updated information and supporting documentation. An administrator reviews the update and applies it to your listing. You cannot modify your listing through a self-service interface.',
  },
  {
    question: 'What information will appear in our directory listing?',
    answer:
      'Your business name, county of operation, input categories, regulatory certification numbers and issuing bodies, and your verified status indicator. Contact information is accessible to platform administrators and cooperative groups through the platform\'s coordination process — it is not publicly visible in a form that bypasses the platform.',
  },
  {
    question: 'How do cooperative groups find us?',
    answer:
      'Groups browse the verified supplier directory filtered by county and product category. Your listing appears in searches for categories you are certified in, within your listed county coverage area. Groups nominate suppliers by name from the directory — you cannot be nominated if you are not listed.',
  },
  {
    question: 'Can we decline a group order nomination?',
    answer:
      'Yes. Being nominated does not obligate you to fulfill the order. You can decline if you cannot fulfill the quantity, if the delivery location is outside your practical logistics range, or for any other operational reason. Repeated declines without explanation may affect how groups perceive your responsiveness — the platform records nomination outcomes.',
  },
  {
    question: 'How are payments for group orders processed?',
    answer:
      'Group order payments are currently coordinated between the cooperative group and the supplier outside the platform\'s M-Pesa payment system. The platform records the order specification and coordinates communication through administrators, but payment is not processed through the automated STK Push mechanism used for individual marketplace transactions. Payment terms are agreed directly between you and the group.',
  },
  {
    question: 'What happens if our certifications expire or are revoked?',
    answer:
      'You are responsible for notifying the platform. Contact the platform to update your listing. If administrators become aware that your certifications have lapsed — through a complaint, a routine review, or your own notification — your listing will be suspended until updated credentials are submitted and reviewed.',
  },
  {
    question: 'Can we be removed from the directory?',
    answer:
      'Yes. Reasons for removal include: expired or revoked regulatory certifications, sustained non-response to group order nominations, confirmed order fulfillment failures, or misrepresentation of product specifications. Removal is an administrator decision. You will be notified of the reason. Updated credentials can be resubmitted for review.',
  },
  {
    question: 'Is there a fee for being listed in the directory?',
    answer:
      'There is no listing fee in the current implementation. The platform does not take a commission on group orders processed through it. This may change — listed suppliers will be notified if a pricing model is introduced.',
  },
];

export default function SuppliersPage(): React.ReactElement {
  return (
    <AudiencePage
      eyebrow="Food Security Hub · For Suppliers"
      heading="Cooperative groups of farmers need input suppliers whose regulatory credentials they can see before they commit to a bulk order."
      intro="This page covers what the verified supplier directory is, how cooperative group orders work, what verification involves, what appears in your listing, how payment coordination currently works, and how to apply. Read it before contacting the platform to apply."
      sections={sections}
      registerHref="/contact?subject=supplier-directory"
      registerLabel="Contact us to apply"
    >
      {/* ── Why the directory exists ── */}
      <section id="why-the-directory-exists" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Why the directory exists
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          The problem the verified supplier directory solves.
        </h2>
        <div className="space-y-5 font-body text-t4 text-text-secondary leading-relaxed max-w-3xl mb-8">
          <p>
            A smallholder farmer buying fertilizer individually pays retail. A cooperative group of
            thirty farmers buying collectively pays significantly less per unit. The economics of
            bulk purchasing are well understood. The structural problem is coordination: which
            supplier has the right certifications, can fulfill the required quantity, and operates
            within practical logistics range of the group?
          </p>
          <p>
            Counterfeit seeds, unlicensed pesticides, and adulterated fertilizers are documented
            risks in Kenya&apos;s agricultural input market. A farmer who buys uncertified inputs may
            experience crop failure, chemical crop damage, or regulatory issues. KEBS, PCPB, and
            KEPHIS certifications exist because these risks are real. But a cooperative group has
            no reliable mechanism to verify a supplier&apos;s regulatory standing before committing
            to a bulk purchase.
          </p>
          <p>
            The verified supplier directory addresses this by making regulatory credential
            information visible and administrator-reviewed before a group order is placed. A
            supplier in the directory has submitted their business registration, KRA PIN, and
            relevant regulatory certifications to a platform administrator who reviewed them.
            The certification numbers visible in a listing are the ones the administrator
            confirmed.
          </p>
          <p>
            Being in the directory is the precondition for receiving cooperative group order
            nominations. A supplier that is not listed cannot be nominated. A listed supplier
            that has had their certifications reviewed is distinguishable from an unlisted
            supplier whose credentials are unknown.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-zinc-800/50">
          {[
            {
              label: 'KEBS',
              full: 'Kenya Bureau of Standards',
              relevance:
                'Certifies that fertilizers, seeds, and farm tools meet quality and safety standards. A product without KEBS certification for its category cannot legally be sold as meeting the standard.',
            },
            {
              label: 'PCPB',
              full: 'Pest Control Products Board',
              relevance:
                'Licenses pesticide and herbicide products sold in Kenya. A product without PCPB registration cannot legally be sold as a registered pest control product. Selling unlicensed products is a regulatory offence.',
            },
            {
              label: 'KEPHIS',
              full: 'Kenya Plant Health Inspectorate Service',
              relevance:
                'Certifies seed products for phytosanitary safety. Relevant for seed suppliers — a seed batch without KEPHIS certification has not passed phytosanitary inspection.',
            },
          ].map((body) => (
            <div key={body.label} className="bg-surface-primary p-6">
              <p className="font-mono text-t6 text-accent-green uppercase tracking-widest mb-1">
                {body.label}
              </p>
              <p className="font-body text-t5 text-text-disabled mb-3">{body.full}</p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">
                {body.relevance}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How cooperative orders work ── */}
      <section id="how-cooperative-orders-work" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          How cooperative orders work
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          The complete sequence from group formation to order fulfillment.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          Understand this sequence before assuming the cooperative group model works the way
          individual marketplace transactions work. It does not. The differences are material.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-6">
          {orderSteps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <div className="shrink-0 w-24">
                <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
                  {step.label}
                </p>
                <p className="font-mono text-t6 text-accent-green mt-0.5">{step.actor}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  {step.detail}
                </p>
                {step.note && (
                  <p className="font-body text-t5 text-amber-400/80 mt-3 pl-3 border-l border-amber-900/30 leading-relaxed">
                    {step.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border border-zinc-800/50 rounded-sm p-5 max-w-3xl">
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">The minimum participation threshold: </span>
            A group order requires a minimum number of participating members before it can be
            placed. This threshold is set at the group level. An order that falls below the
            threshold — because members leave the group or reduce their contribution — may
            be reduced or cancelled before it reaches you. Confirm the group size and commitment
            level before finalizing fulfillment arrangements.
          </p>
        </div>
      </section>

      {/* ── What verification involves ── */}
      <section id="what-verification-involves" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          What verification involves
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          What you submit, what administrators check, and what the verified status confirms.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          There is no self-service verification path. Submit your credentials through the
          application process and a platform administrator reviews them.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-8">
          {verificationRequirements.map((req, i) => (
            <div
              key={i}
              className="flex items-start gap-4 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <div className="shrink-0 w-48">
                <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
                  {req.label}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  {req.detail}
                </p>
                {req.note && (
                  <p className="font-body text-t5 text-text-disabled mt-3 pl-3 border-l border-zinc-800/50 leading-relaxed">
                    {req.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-3xl">
          <div className="border border-zinc-800/50 rounded-sm p-5">
            <p className="font-body text-t5 text-text-primary font-semibold mb-2">
              What verified status confirms
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed">
              That your credentials were submitted and reviewed by a platform administrator who
              found them consistent with your claimed business registration and regulatory
              standing at the time of review. Your certification numbers appear in your listing
              and can be cross-referenced by cooperative groups.
            </p>
          </div>
          <div className="border border-zinc-800/50 rounded-sm p-5">
            <p className="font-body text-t5 text-text-primary font-semibold mb-2">
              What verified status does not confirm
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed">
              That your certifications remain current — verification is point-in-time. That your
              products meet any specific quality standard beyond what your certifications claim.
              That the platform endorses your products or guarantees their performance.
            </p>
          </div>
        </div>
      </section>

      {/* ── What appears in your listing ── */}
      <section id="what-appears-in-your-listing" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          What appears in your listing
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          What cooperative groups see when they search the directory.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          Your listing is created by administrators from the credentials you submit. You
          cannot modify it directly. The fields below reflect what cooperative groups use
          to evaluate and nominate suppliers.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden">
          {listingFields.map((field, i) => (
            <div
              key={i}
              className="flex items-start gap-4 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <div className="shrink-0 w-48">
                <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
                  {field.label}
                </p>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  {field.whatItShows}
                </p>
                <p className="font-mono text-t6 text-text-disabled">
                  Visible to: {field.visibleTo}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Payment coordination ── */}
      <section id="payment-coordination" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Payment coordination
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          How group order payments work — and how they differ from individual marketplace
          transactions.
        </h2>

        <div className="border border-amber-900/30 bg-amber-950/10 rounded-sm p-5 mb-8 max-w-3xl">
          <p className="font-mono text-t6 text-amber-400 uppercase tracking-widest mb-2">
            Current implementation
          </p>
          <p className="font-body text-t4 text-text-secondary leading-relaxed">
            Group order payments are currently coordinated outside the platform&apos;s M-Pesa payment
            system. There is no automated STK Push mechanism for cooperative group transactions.
            Payment terms are agreed between the supplier and the cooperative group, coordinated
            through the platform administrator. This is a current implementation limitation, not
            a permanent design decision.
          </p>
        </div>

        <div className="space-y-5 font-body text-t4 text-text-secondary leading-relaxed max-w-3xl">
          <p>
            For individual marketplace transactions — a buyer purchasing directly from a farmer —
            the platform initiates an M-Pesa STK Push, Safaricom confirms payment, and the
            platform holds payment in escrow until the buyer marks the order received. This
            process is automated.
          </p>
          <p>
            For cooperative group orders, this automation does not currently exist. When a group
            nominates you for an order, the platform records the order specification. Payment
            coordination then happens through the administrator: the group arranges payment
            with you according to terms you agree on, and the administrator records the
            outcome in the platform.
          </p>
          <p>
            In practice, this means: you need to agree payment terms directly with the
            cooperative group. You should not assume payment will arrive before you fulfill
            the order unless the terms specify this. You should not assume the platform
            holds payment in escrow during fulfillment — it does not, for group orders,
            in the current implementation.
          </p>
        </div>
      </section>

      {/* ── A real scenario ── */}
      <section id="a-real-scenario" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          A real scenario
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          A KEBS-certified seed supplier joins the directory and receives their first
          group order nomination.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          This scenario covers the application path, what happens during review, and what
          the first nomination looks like operationally.
        </p>

        <div className="border-l-2 border-zinc-800/50 pl-6 space-y-8 max-w-3xl">
          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              Starting state
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              A seed distribution company in Nakuru County holds KEBS and KEPHIS certifications
              for the seed varieties they supply. A field officer from an agricultural NGO tells
              them that cooperative groups on UmojaHub place bulk seed orders from verified
              suppliers. They visit the website.
            </p>
          </div>

          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              The application
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              They contact the platform using the application process on this page. They submit:
              their business registration certificate, their KRA PIN certificate, their KEBS
              certification for seed quality standards, their KEPHIS phytosanitary certification,
              and a photograph of their warehouse.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed mt-3">
              An administrator reviews the documents. The business name on the registration
              certificate matches the KEBS and KEPHIS certification records. The certification
              numbers are present and the documents appear current. The administrator creates
              their listing in the verified supplier directory.
            </p>
          </div>

          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              The listing goes live
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              The supplier is notified. Their listing appears in the directory showing: business
              name, Nakuru County coverage, Seeds category, their KEBS and KEPHIS certification
              numbers, and a verified status indicator. They cannot modify the listing directly.
              They did not create an account on the platform.
            </p>
          </div>

          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              First nomination
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              Six weeks after listing, a cooperative group of fourteen farmers in Nakuru and
              Laikipia counties nominates them for a collective seed order: 280 kg of certified
              hybrid maize seed, 20 kg per member. The platform administrator contacts the
              supplier with the order specification and the group&apos;s nominated contact farmer.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed mt-3">
              The supplier confirms they can fulfill 280 kg at their listed price. They negotiate
              payment terms directly with the group&apos;s nominated contact: 50% upfront, 50% on
              delivery. Payment is handled outside the platform — the group collects contributions
              from members through M-Pesa and transfers to the supplier directly.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed mt-3">
              Delivery is made to an agreed central collection point. The group contact confirms
              receipt. The administrator marks the order complete on the platform.
            </p>
          </div>

          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              What this scenario reveals
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              The platform coordinated the nomination and recorded the outcome. The actual
              payment and logistics were handled outside the platform. The supplier&apos;s verified
              listing made them discoverable and credible to the group. Their response speed
              and willingness to fulfill the specific quantity determined whether the nomination
              became an order.
            </p>
          </div>
        </div>
      </section>

      {/* ── Responsibilities ── */}
      <section id="responsibilities" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Responsibilities
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          What a listed supplier is responsible for maintaining.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          Listing in the directory is a commitment to maintain accurate credentials and respond
          to group order nominations in good faith.
        </p>
        <div className="space-y-3">
          {responsibilities.map((item) => (
            <div key={item.heading} className="border border-zinc-800/50 rounded-sm p-5">
              <p className="font-body text-t4 font-semibold text-text-primary mb-2">
                {item.heading}
              </p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Limitations ── */}
      <section id="limitations" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Limitations
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          What the platform cannot guarantee.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          Read these before deciding to apply for directory listing.
        </p>
        <div className="space-y-3">
          {limitations.map((item) => (
            <div key={item.heading} className="border border-zinc-800/50 rounded-sm p-5">
              <p className="font-body text-t4 font-semibold text-text-primary mb-2">
                {item.heading}
              </p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          FAQ
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-8">
          Questions suppliers ask.
        </h2>
        <FaqAccordion items={faqItems} />
      </section>

      {/* ── How to apply ── */}
      <section id="how-to-apply" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          How to apply
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-8">
          What to prepare and how to submit it.
        </h2>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden max-w-2xl mb-8">
          {[
            {
              n: '1',
              action: 'Gather your credentials.',
              detail:
                'Business registration certificate, KRA PIN certificate, regulatory certifications for your input categories (KEBS, PCPB, KEPHIS as applicable), and a premises photograph.',
            },
            {
              n: '2',
              action: 'Contact the platform.',
              detail:
                'Use the contact link on this page or email the platform directly. State that you are applying for supplier directory listing and attach your credentials.',
            },
            {
              n: '3',
              action: 'Await administrator review.',
              detail:
                'An administrator reviews your submitted documents. You will be notified of the outcome — either your listing is created and you are notified, or you receive a rejection with a specific reason and the opportunity to resubmit.',
            },
            {
              n: '4',
              action: 'Confirm your listing details.',
              detail:
                'Once listed, verify that the information in your directory entry is accurate: business name, county coverage, input categories, and certification numbers. Contact the platform if anything needs correction.',
            },
          ].map((item) => (
            <div
              key={item.n}
              className="flex items-start gap-4 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <span className="font-mono text-t6 text-text-disabled shrink-0 mt-0.5 w-4">
                {item.n}.
              </span>
              <div>
                <p className="font-body text-t5 font-semibold text-text-primary mb-1">
                  {item.action}
                </p>
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-zinc-800/50 rounded-sm p-5 max-w-2xl">
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">Before applying: </span>
            Confirm that your regulatory certifications are current. An application with
            expired certifications will be rejected. There is no penalty for a rejected
            application — you can resubmit with corrected documentation — but the review
            process restarts from the beginning.
          </p>
        </div>
      </section>
    </AudiencePage>
  );
}
