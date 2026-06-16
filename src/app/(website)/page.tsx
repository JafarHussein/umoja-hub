import { Topic, Sub, Lead, P, Limitation } from '@/components/website/stream';
import { topic } from '@/components/website/streamTopics';

/**
 * The Documentation Stream (foundation §13). Topics are rendered in canonical
 * spine order; each is complete and self-contained with deep-link anchors and a
 * paired limitation. Content is fact-checked against
 * UMOJAHUB_PLATFORM_CAPABILITIES_REFERENCE.md — no marketing, no aspiration
 * (WEBSITE_PURPOSE_V1 Principles 1, 3, 4 and Communication Principle 4).
 */
export default function WebsiteHome() {
  return (
    <article className="pb-10">
      <header className="mb-12 max-w-reading">
        <h1 className="font-heading text-display-sm text-fg md:text-display">UmojaHub</h1>
        <p className="mt-4 font-body text-read-lead text-fg-muted">
          Verification infrastructure for Kenyan farmers and computer-science students. This
          documentation explains how the platform works and what it does not guarantee — read it in
          full, no account required.
        </p>
      </header>

      {/* Topic 0 — Overview */}
      <Topic topic={topic('overview')}>
        <Sub id="overview-thesis" title="Trust cannot be assumed">
          <Lead>
            Most online platforms assume trust. A buyer on a payments site trusts that the money is
            real; a developer trusts that a code repository is real. UmojaHub&rsquo;s users do not
            arrive with that assumption.
          </Lead>
          <P>
            Smallholder farmers have sold through brokers who knew the end-market price when they did
            not. Buyers have no way to confirm a farmer&rsquo;s reliability before paying. Students
            hold degrees that certify attendance and portfolios that no employer can independently
            check — and employers have seen AI-generated work and inflated credentials.
          </P>
          <P>
            These are the same problem: there is no mechanism to establish trust between strangers
            before a consequential transaction. UmojaHub exists to build that mechanism — human
            verification, recorded evidence, and decisions that can be checked and corrected.
          </P>
          <Limitation>
            <p>
              UmojaHub reduces the risk of dealing with a stranger; it does not remove it.
              Verification confirms identity and records evidence — it is not a guarantee of a sale,
              a price, or a job.
            </p>
          </Limitation>
        </Sub>

        <Sub id="overview-two-hubs" title="Two hubs, one spine">
          <P>UmojaHub runs two hubs on one shared verification spine.</P>
          <P>
            The <strong className="font-medium text-fg">Food Security Hub</strong> is a marketplace.
            Identity-verified farmers list produce; buyers pay by M-Pesa before dispatch; and every
            completed sale feeds a public, formula-driven Farmer Trust Score that anyone can read on
            a listing.
          </P>
          <P>
            The <strong className="font-medium text-fg">Education Hub</strong> verifies work, not
            attendance. CS students complete a project brief, document their process — problem
            breakdown, approach, blocker log, AI-usage log, and a final reflection — pass anonymous
            peer review, and receive a VERIFIED, REVISION_REQUIRED, or DENIED decision from a
            lecturer whose own credentials were verified. Each process document is fingerprinted
            (SHA-256) when submitted, so it cannot be silently changed later.
          </P>
          <P>
            The hubs differ in what they make trustworthy. The Food Hub&rsquo;s trust object is the
            farmer — a continuous score that moves with every transaction. The Education Hub&rsquo;s
            trust object is the project — a one-time, permanent decision backed by hashed evidence.
          </P>
          <Limitation>
            <p>
              The hubs share one account system and one set of named administrators, but are
              otherwise independent. Standing in one does not transfer to the other.
            </p>
          </Limitation>
        </Sub>

        <Sub id="overview-principles" title="Three principles">
          <P>Every verification on UmojaHub follows three rules, stated on the platform itself:</P>
          <ul className="space-y-2 font-body text-read-body text-fg">
            <li>
              <strong className="font-medium">Human Decision</strong> — a named person makes the
              call, not an opaque algorithm.
            </li>
            <li>
              <strong className="font-medium">Evidence on Record</strong> — the decision is backed by
              documents and data that are kept.
            </li>
            <li>
              <strong className="font-medium">Correctable</strong> — every decision has an appeals
              path; mistakes can be fixed.
            </li>
          </ul>
          <Limitation>
            <p>
              These principles govern how decisions are made and reviewed. They do not promise that a
              decision will go in your favour.
            </p>
          </Limitation>
        </Sub>
      </Topic>

      {/* Topic 1 — Trust architecture */}
      <Topic topic={topic('trust')}>
        <Sub id="trust-score" title="The Farmer Trust Score">
          <Lead>
            Every verified farmer has a Trust Score: a single number from 0 to 100, shown publicly on
            each of their listings alongside a tier label.
          </Lead>
          <P>
            The score is formula-driven, not editorial — no one types in a number. It is computed
            from four components and recalculated automatically after each completed order and each
            buyer rating, never adjusted by hand. When a farmer&rsquo;s identity is first approved,
            the score starts at 40 (tier ESTABLISHED).
          </P>
          <Limitation>
            <p>
              The score measures a farmer&rsquo;s verified activity on UmojaHub. It says nothing
              about reputation built off the platform, and it is not a prediction: a high score
              reflects past recorded behaviour, not a promise about the next sale.
            </p>
          </Limitation>
        </Sub>

        <Sub id="trust-components" title="The four components">
          <P>The score (maximum 100) is the sum of four parts:</P>
          <table className="w-full max-w-reading border-collapse font-body text-read-body">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 font-medium text-fg">Component</th>
                <th className="py-2 pr-4 font-medium text-fg">Max</th>
                <th className="py-2 font-medium text-fg">How it is earned</th>
              </tr>
            </thead>
            <tbody className="text-fg-muted">
              <tr className="border-b border-border">
                <td className="py-2 pr-4 text-fg">Verification</td>
                <td className="py-2 pr-4">40</td>
                <td className="py-2">The full 40 once identity is approved; 0 before. Identity comes first.</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 text-fg">Transaction</td>
                <td className="py-2 pr-4">25</td>
                <td className="py-2">
                  Completed orders and total sales volume, each capped — steady real trade raises it,
                  no single large sale dominates.
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 text-fg">Rating</td>
                <td className="py-2 pr-4">20</td>
                <td className="py-2">
                  The average of buyer ratings — but only after at least three exist, so one early
                  review cannot swing it.
                </td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 text-fg">Reliability</td>
                <td className="py-2 pr-4">15</td>
                <td className="py-2">
                  Rewards confirming paid orders within 24 hours; reduced by disputes.
                </td>
              </tr>
            </tbody>
          </table>
          <Limitation>
            <p>
              Rating contributes nothing until a farmer has at least three ratings, so new and
              low-volume farmers carry a 0 there even when their few buyers were satisfied. The score
              also has no public memory — only the current value is shown, not its history.
            </p>
          </Limitation>
        </Sub>

        <Sub id="trust-tiers" title="Tiers & recalculation">
          <P>
            The number maps to a tier shown next to it: PREMIUM at 80 and above, TRUSTED at 60–79,
            ESTABLISHED at 40–59, and NEW below 40.
          </P>
          <P>
            Recalculation happens at only two moments: when a buyer confirms they received an order,
            and when a buyer submits a rating. It never runs while someone is simply reading a page,
            so the score you see is the one from the farmer&rsquo;s last real transaction.
          </P>
          <Limitation>
            <p>
              Because approval seeds the score at 40, a brand-new verified farmer and a long-inactive
              one can show the same ESTABLISHED tier. The tier reflects accumulated verified
              activity, not recency.
            </p>
          </Limitation>
        </Sub>
      </Topic>
    </article>
  );
}
