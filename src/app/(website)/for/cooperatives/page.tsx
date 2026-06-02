import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FoodHubPage } from '@/components/website/FoodHubPage';
import { WorkflowStep } from '@/components/website/WorkflowStep';
import { LimitationPanel } from '@/components/website/LimitationPanel';
import { FaqItem } from '@/components/website/FaqItem';
import type { AnchorSection } from '@/components/website/SectionAnchor';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'For Cooperatives — UmojaHub Food Security Hub',
  description:
    'How cooperative groups of farmers collectively purchase agricultural inputs from verified suppliers, what bulk ordering involves, and how payment coordination currently differs from individual marketplace payments — including what the platform does not handle.',
};

const SECTIONS: AnchorSection[] = [
  { id: 'why-cooperative-groups-exist', label: 'Why cooperative groups exist' },
  { id: 'forming-a-group', label: 'Forming a group' },
  { id: 'how-bulk-ordering-works', label: 'How bulk ordering works' },
  { id: 'payment-coordination', label: 'Payment coordination' },
  { id: 'a-real-scenario', label: 'A real scenario' },
  { id: 'responsibilities', label: 'Responsibilities' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'faq', label: 'FAQ' },
  { id: 'how-to-start', label: 'How to start' },
];

// ─── Layout primitives ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p className="font-geist-mono text-ws-caption text-ws-hub-green uppercase mb-3">{children}</p>
  );
}

function SectionH2({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <h2 className="font-display text-ws-section text-ws-text-primary mb-4 max-w-2xl">{children}</h2>
  );
}

function Body({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7]">{children}</p>
  );
}

// ─── Data ──────────────────────────────────────────────────────────────────

const INPUT_CATEGORIES = [
  {
    category: 'Seeds',
    detail:
      'Certified hybrid and open-pollinated seed varieties from KEBS-certified and KEPHIS-registered seed companies. Bulk orders unlock access to seed varieties with minimum pack sizes individual farmers cannot meet.',
  },
  {
    category: 'Fertilizers',
    detail:
      'CAN, DAP, NPK, and organic fertilizers from KEBS-certified distributors. Fertilizer pricing scales significantly with order volume — the per-bag cost difference between 10 bags and 100 bags is material.',
  },
  {
    category: 'Pesticides and herbicides',
    detail:
      'PCPB-licensed crop protection products. Individual farmers often pay retail prices at agri-input shops that themselves buy at bulk rates. Group orders access the same tier these shops buy at.',
  },
] as const;

interface GroupRequirement {
  readonly label: string;
  readonly detail: string;
  readonly note: string | null;
}

const GROUP_REQUIREMENTS: readonly GroupRequirement[] = [
  {
    label: 'Creator must be verified',
    detail:
      'The farmer who creates the group must have completed identity verification on the platform. Unverified farmers cannot create groups.',
    note: null,
  },
  {
    label: 'All members must be verified',
    detail:
      'Every farmer invited to join the group must also be individually verified. A farmer with PENDING verification or a rejected application cannot join or participate in bulk orders until their verification is resolved.',
    note: 'This requirement protects the group. When payment terms and order specifications are negotiated directly with a supplier, all participating members need verified identities on record. An unverified member introduces an accountability gap that the group bears.',
  },
  {
    label: 'Group name and member limit',
    detail:
      'The creator sets the group name and a maximum member cap when the group is created. The cap determines how many farmers can join. This is set once at creation — it can be updated by the creator if needed.',
    note: null,
  },
  {
    label: 'Invitations and acceptance',
    detail:
      'The creator invites other verified farmers by their registered phone number or platform username. Invited farmers see the invitation in their dashboard and can accept or decline. A farmer who declines an invitation can be re-invited.',
    note: null,
  },
];

interface BulkOrderStep {
  readonly step: string;
  readonly actor: string;
  readonly action: string;
  readonly detail: string;
  readonly note: string | null;
}

const BULK_ORDER_STEPS: readonly BulkOrderStep[] = [
  {
    step: '01',
    actor: 'Group member',
    action: 'Propose the bulk input order',
    detail:
      'Any group member proposes a bulk order: specifies the product category (seeds, fertilizer, pesticide, herbicide, or farm tools), total quantity, per-member contribution, and nominates a supplier from the verified directory.',
    note: 'The nominated supplier must be in the verified directory. Groups cannot nominate unlisted suppliers. If a supplier you want to work with is not listed, they can contact the platform to apply for directory inclusion.',
  },
  {
    step: '02',
    actor: 'Group members',
    action: 'Members confirm or decline participation',
    detail:
      'All group members review the proposed order. Each member who confirms is committing to their stated per-member quantity. Members who decline are excluded from the order and do not contribute to the total quantity.',
    note: null,
  },
  {
    step: '03',
    actor: 'Platform',
    action: 'Platform checks minimum participation threshold',
    detail:
      'The platform checks whether the confirmed order meets the minimum participation threshold. If the confirmed total quantity falls below the minimum, the order cannot advance. The group creator is notified and can attempt to recruit additional members or adjust the per-member quantity.',
    note: null,
  },
  {
    step: '04',
    actor: 'Administrator',
    action: 'Administrator notified — contacts nominated supplier',
    detail:
      'When the threshold is met, a platform administrator is notified. The administrator contacts the nominated supplier with the order specification: product category, total quantity, per-member breakdown, and group contact details.',
    note: null,
  },
  {
    step: '05',
    actor: 'Group and supplier',
    action: 'Negotiate terms directly',
    detail:
      'The group creator and the supplier negotiate terms directly: price per unit, payment schedule, delivery location (typically a central collection point accessible to all members), and delivery timeline. The platform is not a party to these terms.',
    note: 'Payment coordination is not handled through the platform. See the payment coordination section for the full explanation of how this differs from individual marketplace payments.',
  },
  {
    step: '06',
    actor: 'Supplier',
    action: 'Supplier delivers to the collection point',
    detail:
      "The supplier delivers the agreed input quantity to the designated central collection point. Group members collect their individual share from the collection point.",
    note: null,
  },
  {
    step: '07',
    actor: 'Group creator',
    action: 'Mark order complete on the platform',
    detail:
      'The group marks the order complete on the platform once delivery and member collection are confirmed.',
    note: null,
  },
];

const LIMITATIONS = [
  {
    heading: 'Payment coordination is manual — there is no escrow',
    detail:
      "Individual marketplace purchases work through M-Pesa STK Push: the buyer's payment is automatically confirmed, held during fulfillment, and released when the order is marked received. None of this applies to cooperative group bulk orders. Payment for group orders is coordinated directly between the group and the supplier. No M-Pesa transaction appears in the platform. There is no escrow, no automated payment release, and no platform-level protection if the supplier does not deliver after receiving advance payment.",
  },
  {
    heading: 'Orders require minimum participation — and maintaining it',
    detail:
      'A bulk order that does not reach the minimum total quantity cannot advance to the supplier. If members confirm participation and later withdraw, the remaining members must absorb the shortfall or restructure the order. The platform does not prevent mid-order withdrawals.',
  },
  {
    heading: 'Member exits after confirmation raise per-member costs',
    detail:
      "When a committed member withdraws from an in-progress order, the group's total committed quantity falls. Remaining members may face: a higher per-unit cost (the bulk rate was negotiated for the original total), a need to increase individual contributions to maintain the minimum threshold, or the need to renegotiate the entire order with the supplier.",
  },
  {
    heading: 'The supplier is not obligated to fulfill every nomination',
    detail:
      "A supplier's verified status in the directory confirms their regulatory credentials. It does not bind them to fulfill every group order they receive. A supplier may decline for capacity reasons, geographic coverage, or because the group's total quantity falls below their minimum. The platform does not guarantee supplier availability.",
  },
  {
    heading: "Central collection point logistics are the group's responsibility",
    detail:
      'The platform does not coordinate transport or storage for delivered inputs. The group is responsible for identifying a collection point, arranging transport from the collection point to individual farms, and managing any storage requirements between delivery and member distribution. For groups spread across counties, this coordination is significant.',
  },
  {
    heading: 'The platform does not verify group coordination capacity',
    detail:
      "A platform-based cooperative group can be formed by any set of verified farmers. The platform verifies individual identities — not whether the group has the social infrastructure to coordinate payment collection, logistics, and member contributions that bulk ordering requires. A group that forms for a bulk order but cannot coordinate advance payment collection from its members will not be able to complete the order.",
  },
] as const;

const FAQ_ITEMS = [
  {
    question: 'Does every member of a group need to be verified?',
    answer:
      "Yes. Every farmer in the group — the creator and all members — must have completed the platform's identity verification. A farmer whose verification is PENDING or rejected cannot join or participate in bulk orders until their verification status is resolved.",
  },
  {
    question: 'How many members does a group need to place a bulk order?',
    answer:
      'There is a minimum participation threshold for bulk orders. The threshold depends on the product category and the nominated supplier. The platform shows this threshold when an order is being created — before you commit. If your group cannot meet the threshold for a specific supplier, you may need more members or a different supplier whose minimums you can meet.',
  },
  {
    question: 'Can I be a member of more than one group?',
    answer:
      'Yes. A verified farmer can join multiple groups simultaneously. There is no limit on how many groups a farmer can belong to.',
  },
  {
    question: 'Can we nominate a supplier who is not in the verified directory?',
    answer:
      'No. Bulk orders can only be placed with suppliers in the verified directory. If a supplier you want to work with is not listed, they can contact the platform to apply. The verification process for suppliers involves confirming their business registration and regulatory certifications (KEBS, PCPB, or KEPHIS as applicable). See the For Suppliers page for details on that process.',
  },
  {
    question: 'How does payment work for group orders?',
    answer:
      "Payment for group orders is coordinated directly between the group and the supplier — not through the platform's M-Pesa payment system. The group creator negotiates payment terms with the supplier (for example, a percentage advance payment, with the remainder due on delivery), then collects each member's share using direct M-Pesa transfers. The platform records the order status but does not process the payment.",
  },
  {
    question: 'What if the supplier cannot deliver after we have paid an advance?',
    answer:
      'The group must negotiate resolution directly with the supplier. The platform does not intervene in supplier fulfillment failures for group orders and provides no payment protection for advance payments made outside the platform. This is a documented limitation — there is no escrow for group orders. Due diligence on the supplier (checking their directory listing, verifying their regulatory credentials) is the primary protection.',
  },
  {
    question: 'What happens if a member withdraws after committing to an order?',
    answer:
      "The committed quantity falls. Depending on how much, the remaining members may need to increase their individual contributions to maintain the minimum threshold, accept a higher per-unit cost, or renegotiate the order with the supplier. The platform does not prevent withdrawals after confirmation. This is a risk the group manages through member commitment and the social relationships that underlie the group.",
  },
  {
    question: 'Can farmers from different counties form a group?',
    answer:
      "Yes. Platform-based cooperative groups have no geographic restriction. However, delivery logistics become more complex when members are spread across a large area — the group needs to agree on a central collection point accessible to all members, and transport from the collection point to individual farms is the group's responsibility.",
  },
  {
    question:
      'We already belong to a registered cooperative society. Can we use the platform alongside our existing structure?',
    answer:
      'Yes. Any verified farmer in an existing cooperative society can form a platform-based group with other verified members of that society. The platform does not require the cooperative to register as an entity — individual verified farmers form the group. Platform-based groups complement existing cooperative structures by providing access to the verified supplier directory and a formal order record. They do not replace existing cooperative governance.',
  },
  {
    question: 'What input categories can we order through the directory?',
    answer:
      "The verified supplier directory includes suppliers of seeds, fertilizers, pesticides, herbicides, and farm tools. Not every supplier stocks every category — each supplier's directory listing specifies their product categories. Groups can filter the directory by category to find suppliers relevant to their specific input need.",
  },
  {
    question: "What if our total quantity is below the supplier's minimum order?",
    answer:
      "If your group's total confirmed quantity falls below the supplier's minimum, they may decline the order. Options: recruit additional members to increase the total, increase each member's individual contribution, or select a different supplier whose minimums you can meet. The platform shows minimum thresholds before an order is created.",
  },
] as const;

const CREATOR_RESPONSIBILITIES = [
  'Set an accurate group name and member limit when creating the group.',
  'Invite only farmers who have genuinely agreed to participate. Do not invite farmers without their consent.',
  'Coordinate advance payment collection from members before transferring to the supplier.',
  'Communicate supplier terms, delivery timeline, and collection logistics clearly to all members before the order advances.',
  'Manage the central collection point — confirm delivery, notify members when their share is available.',
  'Mark the order complete on the platform only after delivery and member collection are confirmed.',
] as const;

const MEMBER_RESPONSIBILITIES = [
  'Only confirm participation in an order you intend to fulfill your portion of. Confirming and then withdrawing increases costs for other members.',
  'Transfer your advance payment contribution to the group creator promptly when requested — delays in advance collection delay the entire order.',
  'Collect your share of the delivered input within the agreed collection window. Input left at the collection point creates logistics and storage problems for the group.',
  'Notify the group creator as early as possible if circumstances change and you need to withdraw from a committed order.',
  'Transfer your remaining balance payment promptly after delivery and before the group marks the order complete.',
] as const;

interface StartStep {
  readonly n: string;
  readonly action: string;
  readonly detail: string;
  readonly link: { readonly label: string; readonly href: string } | null;
}

const START_STEPS: readonly StartStep[] = [
  {
    n: '01',
    action: 'Complete your farmer verification',
    detail:
      'You must be a verified farmer before you can create or join a group. If your verification is PENDING, wait for the administrator decision. If you have not yet submitted documents, complete that first.',
    link: null,
  },
  {
    n: '02',
    action: 'Identify farmers who want to participate',
    detail:
      'Talk to the farmers you want to include before creating the group on the platform. Confirm they are willing to join a bulk order, that they have or will complete verification, and that they agree on the input they want to purchase collectively.',
    link: null,
  },
  {
    n: '03',
    action: 'Create the group and invite verified members',
    detail:
      'In your farmer dashboard, create a cooperative group with a name and member limit. Invite the farmers who are already verified. Those who are not yet verified can join once their verification is complete.',
    link: null,
  },
  {
    n: '04',
    action: 'Browse the supplier directory before proposing an order',
    detail:
      'Review the verified supplier directory for suppliers in the product category you need. Check their listed regulatory certifications and the input categories they supply.',
    link: { label: 'Read the For Suppliers page', href: '/for/suppliers' },
  },
  {
    n: '05',
    action: 'Propose the bulk order and coordinate',
    detail:
      'Once your group has enough verified members to meet the threshold, propose the order. When it advances to the supplier, be prepared to negotiate terms directly and coordinate advance payment collection from your members without platform automation.',
    link: null,
  },
];

export default function CooperativesPage(): React.ReactElement {
  return (
    <FoodHubPage
      audience="For Cooperatives"
      heading="Individual farmers pay retail for agricultural inputs. Groups access bulk rates — when the order is large enough, the group is coordinated, and the supplier is verified."
      intro="This page explains what cooperative groups can do on the platform, how to form a group, how bulk ordering works step by step, and — critically — how payment coordination currently differs from individual marketplace payments. Read the payment coordination section before forming a group."
      sections={SECTIONS}
      registerHref="/auth/register?role=farmer"
      registerLabel="Register as a farmer to form a group"
    >
      {/* ── Why cooperative groups exist ── */}
      <section id="why-cooperative-groups-exist" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Why cooperative groups exist</SectionLabel>
        <SectionH2>
          The economics of bulk purchasing only work when the order is large enough — and individual
          smallholders rarely reach that threshold alone.
        </SectionH2>
        <div className="space-y-5 mb-8 max-w-3xl">
          <Body>
            Agricultural input suppliers — seed companies, fertilizer distributors, pesticide
            stockists — price by volume. A farmer buying 50 kg of fertilizer pays retail. A group of
            twenty farmers buying 1,000 kg pays a significantly lower per-unit price. The price
            difference is real, consistent, and documented across Kenyan agricultural markets. It is
            why large-scale farms access inputs at prices smallholders cannot.
          </Body>
          <Body>
            The coordination problem is also real. To access bulk pricing, a group of farmers needs
            to: agree on what to order, agree on how much each member contributes, find a supplier
            whose credentials are verifiable, and trust each other enough to coordinate advance
            payments. Without a platform, this coordination depends entirely on existing social
            relationships and informal trust. The platform provides the structure for groups of
            verified farmers to organize bulk orders without requiring pre-existing formal cooperative
            registration.
          </Body>
          <Body>
            Platform-based cooperative groups are distinct from traditional agricultural cooperative
            societies. They do not replace them. Many Kenyan farmers already belong to coffee, tea,
            or dairy cooperatives — organizations with formal legal status, governance structures,
            and commodity-specific mandates. Platform groups are narrower: they exist specifically
            to coordinate collective bulk purchasing of agricultural inputs from verified suppliers.
            Any verified farmer can form one, regardless of existing cooperative membership.
          </Body>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-ws-border-light">
          {INPUT_CATEGORIES.map((item) => (
            <div key={item.category} className="bg-ws-surface-base p-6">
              <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
                {item.category}
              </p>
              <p className="font-geist text-ws-body-sm text-ws-text-secondary">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Forming a group ── */}
      <section id="forming-a-group" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Forming a group</SectionLabel>
        <SectionH2>What is required before a group can form and place bulk orders.</SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          Every requirement listed here exists to protect the group. Bulk ordering requires
          commitment and coordination — members who are not verified or cannot be contacted through
          the platform create risks for the rest of the group.
        </p>

        <div className="bg-ws-surface-raised border border-ws-border-light overflow-hidden max-w-3xl">
          {GROUP_REQUIREMENTS.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-4 px-5 py-5 border-b border-ws-border-light last:border-0"
            >
              <div className="shrink-0 w-44">
                <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase">
                  {item.label}
                </p>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-geist text-ws-body text-ws-text-secondary">{item.detail}</p>
                {item.note !== null && (
                  <p className="font-geist text-ws-body-sm text-ws-text-tertiary pl-3 border-l border-ws-border-light">
                    {item.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How bulk ordering works ── */}
      <section id="how-bulk-ordering-works" className="py-12 border-b border-ws-border-light">
        <SectionLabel>How bulk ordering works</SectionLabel>
        <SectionH2>
          Seven steps from order proposal to completion, with the actor and what happens at each
          stage.
        </SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          The bulk ordering process is more involved than an individual marketplace purchase. Some
          steps are automated by the platform; others require direct coordination between the group
          and the supplier.
        </p>

        <div className="flex flex-col max-w-3xl mb-6">
          {BULK_ORDER_STEPS.map((s, i) => {
            const isActuallyLast = i === BULK_ORDER_STEPS.length - 1;
            return (
              <div key={s.step}>
                <WorkflowStep
                  step={s.step}
                  actor={s.actor}
                  action={s.action}
                  detail={s.detail}
                  hub="food"
                  isLast={true}
                />
                {s.note !== null && (
                  <div className="border-x border-ws-border-light px-4 pb-3">
                    <p className="font-geist text-ws-body-sm text-ws-text-tertiary pl-3 border-l border-ws-border-medium">
                      {s.note}
                    </p>
                  </div>
                )}
                {!isActuallyLast && (
                  <div className="flex justify-center" aria-hidden>
                    <div className="w-px h-6 bg-ws-border-medium" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Payment coordination ── */}
      <section id="payment-coordination" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Payment coordination</SectionLabel>
        <SectionH2>
          How payment for group orders differs from individual marketplace purchases — and what this
          means in practice.
        </SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          This is the most significant operational difference between using the platform as an
          individual farmer and using it as a cooperative group. Read this section before forming a
          group or committing to a bulk order.
        </p>

        <div className="mb-8 max-w-3xl">
          <LimitationPanel eyebrow="Current implementation">
            Cooperative group bulk orders are <strong>not</strong> processed through the
            platform&apos;s M-Pesa payment system. Payment for group orders is coordinated directly
            between the group and the supplier, outside the platform. There is no STK Push, no
            automated payment confirmation, no escrow, and no payment release mechanism for group
            orders.
          </LimitationPanel>
        </div>

        <div className="border-l-2 border-ws-border-medium pl-6 space-y-8 max-w-3xl">
          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              How individual marketplace payments work
            </p>
            <Body>
              When a buyer purchases produce from a farmer, the platform initiates an M-Pesa STK
              Push to the buyer&apos;s phone. The buyer enters their PIN. Safaricom confirms. The order
              updates to PAID. Payment is held during fulfillment. When the buyer marks the order
              received, payment is released to the farmer. The platform handles every step
              automatically.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              How group order payments work
            </p>
            <Body>
              The group creator negotiates payment terms directly with the supplier — for example,
              40% advance payment before dispatch, 60% on delivery. The creator then collects each
              member&apos;s share using direct M-Pesa transfers between members. The total advance is
              then transferred from the group to the supplier&apos;s M-Pesa business number. None of
              this appears as a transaction in the platform. The platform records the order status,
              not the payment.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              What this means for risk
            </p>
            <div className="space-y-3">
              <Body>
                Individual marketplace payments have a protection: the platform holds payment during
                fulfillment and releases it only when the buyer confirms receipt. This protection does
                not exist for group orders.
              </Body>
              <Body>
                If a group pays an advance and the supplier does not deliver, the group must resolve
                this directly with the supplier. The platform does not intervene in supplier
                fulfillment failures for group orders and does not guarantee compensation.
              </Body>
              <Body>
                The primary protection for groups is the supplier directory: every supplier in the
                directory has had their business registration and regulatory certifications reviewed
                by a platform administrator. Before committing advance payment, groups should verify
                the supplier&apos;s listed credentials independently — the regulatory body certification
                numbers are visible in the directory listing and can be cross-referenced with KEBS,
                PCPB, or KEPHIS directly.
              </Body>
            </div>
          </div>
        </div>
      </section>

      {/* ── A real scenario ── */}
      <section id="a-real-scenario" className="py-12 border-b border-ws-border-light">
        <SectionLabel>A real scenario</SectionLabel>
        <SectionH2>
          A maize farming group in Nakuru coordinates a fertilizer bulk order — including what they
          discovered about the coordination involved.
        </SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          This scenario documents the complete process, including the waiting periods, the
          negotiation, and the manual coordination that the platform does not automate.
        </p>

        <div className="border-l-2 border-ws-border-medium pl-6 space-y-8 max-w-3xl">
          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Starting state
            </p>
            <Body>
              Kamau is a maize and bean farmer in Nakuru County, verified on the platform for six
              months. He has five farming neighbors who all need CAN fertilizer for the upcoming long
              rains. Retail price at the nearest agri-input shop: KES 72 per kilogram. They want to
              bulk-order together and access a lower rate.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Forming the group
            </p>
            <Body>
              Kamau creates the group: &quot;Nakuru Maize — Long Rains 2026.&quot; He invites his five
              neighbors. Four are already verified. The fifth registered on the platform two weeks
              ago but has not yet completed verification — he cannot join until his documents are
              reviewed and approved. Kamau invites the four who are ready. Three accept within two
              days.
            </Body>
            <div className="mt-3">
              <Body>
                The group has four members: Kamau and three neighbors. Together they need 200 kg of
                CAN fertilizer — 50 kg per member.
              </Body>
            </div>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Selecting the supplier
            </p>
            <Body>
              Kamau searches the verified supplier directory. He finds three suppliers with
              KEBS-certified fertilizer listed. He reads each supplier&apos;s listing — business
              registration number, KEBS certification number, county of operation, and product
              categories. He selects a Nakuru-based distributor whose listing shows fertilizer as
              their primary category and whose certification is current.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Proposing the order
            </p>
            <Body>
              Kamau proposes the bulk order: CAN fertilizer, 200 kg total, 50 kg per member,
              nominated supplier. The other three members confirm participation. The platform checks
              the minimum threshold — 200 kg meets it for this supplier and product category. The
              order advances.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Supplier negotiation
            </p>
            <Body>
              The platform administrator contacts the supplier with the order specification. The
              supplier responds within two days. They can supply 200 kg. Their price: KES 58 per
              kilogram (Kamau hoped for 55, but 58 is still below the KES 72 retail rate). They
              require 40% advance payment before dispatch, with the balance due on delivery. Delivery
              to Kamau&apos;s farm as the central collection point, five days after the advance clears.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Payment coordination
            </p>
            <Body>
              Total order: KES 58 × 200 kg = KES 11,600. Per member: KES 2,900. Advance (40%): KES
              1,160 per member.
            </Body>
            <div className="mt-3">
              <Body>
                Kamau sends each of the three other members their advance amount via M-Pesa
                individually. He then transfers the full group advance — four members at KES 1,160
                each, totaling KES 4,640 — directly to the supplier&apos;s M-Pesa business number. No
                part of this appears as a platform transaction. The platform records the order as in
                progress.
              </Body>
            </div>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Delivery and completion
            </p>
            <Body>
              Five days later, the supplier delivers 200 kg of CAN fertilizer to Kamau&apos;s farm. Each
              member comes to collect their 50 kg. Kamau confirms all members have collected. The
              group transfers the remaining 60% balance (KES 6,960) to the supplier directly. Kamau
              marks the order complete on the platform.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              What they learned
            </p>
            <Body>
              The bulk rate (KES 58 vs KES 72 retail) saved each member KES 14 per kilogram — KES
              700 per member on a 50 kg purchase. For a group of four, the total saving was KES
              2,800. The supplier negotiation added a week to the timeline. Collecting advance
              payments from three members and coordinating transfer to the supplier required Kamau to
              chase two members who were slow to transfer. The platform provided the supplier
              directory and the order structure; it did not handle any of the financial coordination.
            </Body>
            <div className="mt-3">
              <p className="font-geist text-ws-body-lg text-ws-text-tertiary leading-[1.7]">
                The fifth neighbor — the one who hadn&apos;t completed verification in time — watched the
                process from the outside. He completed his verification two weeks later and joined the
                group. The next bulk order cycle included him.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Responsibilities ── */}
      <section id="responsibilities" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Responsibilities</SectionLabel>
        <SectionH2>
          What the group creator is accountable for — and what each member commits to.
        </SectionH2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-ws-border-light mb-6">
          <div className="bg-ws-surface-base p-6">
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
              Group creator
            </p>
            <div className="space-y-3">
              {CREATOR_RESPONSIBILITIES.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="font-geist-mono text-ws-caption text-ws-text-tertiary shrink-0 mt-0.5">
                    —
                  </span>
                  <p className="font-geist text-ws-body text-ws-text-secondary">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-ws-surface-base p-6">
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
              Group members
            </p>
            <div className="space-y-3">
              {MEMBER_RESPONSIBILITIES.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="font-geist-mono text-ws-caption text-ws-text-tertiary shrink-0 mt-0.5">
                    —
                  </span>
                  <p className="font-geist text-ws-body text-ws-text-secondary">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-ws-border-light p-5 max-w-3xl">
          <p className="font-display text-ws-subsection text-ws-text-primary mb-1">
            The platform&apos;s role in enforcing responsibilities
          </p>
          <p className="font-geist text-ws-body text-ws-text-secondary">
            The platform does not enforce most of the responsibilities listed above. It records the
            order, tracks participation, and marks status changes. It does not compel advance
            payment transfers, prevent late withdrawals, or penalize members who fail to collect
            their share. The social relationship within the group — and the verified identities of
            all members — is the primary accountability mechanism.
          </p>
        </div>
      </section>

      {/* ── Limitations ── */}
      <section id="limitations" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Limitations</SectionLabel>
        <SectionH2>What the platform cannot do for cooperative groups.</SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          These limitations are real. Know them before forming a group or committing to an order.
        </p>
        <div className="space-y-3">
          {LIMITATIONS.map((item) => (
            <LimitationPanel key={item.heading} eyebrow={item.heading}>
              {item.detail}
            </LimitationPanel>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-12 border-b border-ws-border-light">
        <SectionLabel>FAQ</SectionLabel>
        <SectionH2>Questions from farmers considering cooperative groups.</SectionH2>
        <div className="divide-y divide-ws-border-light border-y border-ws-border-light">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </section>

      {/* ── How to start ── */}
      <section id="how-to-start" className="py-12">
        <SectionLabel>How to start</SectionLabel>
        <SectionH2>What to do if you want to form a cooperative group or join one.</SectionH2>

        <div className="bg-ws-surface-raised border border-ws-border-light overflow-hidden max-w-2xl mb-6">
          {START_STEPS.map((item) => (
            <div
              key={item.n}
              className="flex items-start gap-4 px-5 py-5 border-b border-ws-border-light last:border-0"
            >
              <span className="font-geist-mono text-ws-caption text-ws-hub-green shrink-0 mt-0.5 w-6">
                {item.n}.
              </span>
              <div>
                <p className="font-display text-ws-subsection text-ws-text-primary mb-1">
                  {item.action}
                </p>
                <p className="font-geist text-ws-body text-ws-text-secondary mb-2">{item.detail}</p>
                {item.link !== null && (
                  <Link
                    href={item.link.href}
                    className="font-geist text-ws-body text-ws-text-tertiary hover:text-ws-text-secondary transition-colors duration-150 underline underline-offset-2"
                  >
                    {item.link.label} →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border border-ws-border-light p-5 max-w-2xl">
          <p className="font-geist text-ws-body text-ws-text-secondary">
            <span className="font-semibold text-ws-text-primary">Joining an existing group: </span>
            If another verified farmer has already formed a group and invites you, you will see the
            invitation in your dashboard. Accept if you intend to participate in bulk orders. Do not
            accept invitations to groups whose purpose or members you do not trust — you will be
            asked to commit advance payment for orders this group places.
          </p>
        </div>
      </section>
    </FoodHubPage>
  );
}
