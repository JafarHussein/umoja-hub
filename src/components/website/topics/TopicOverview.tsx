import { Topic, Sub, Lead, P, Limitation } from '../stream';
import { topic } from '../streamTopics';

export function TopicOverview() {
  return (
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
            UmojaHub reduces the risk of dealing with a stranger; it does not remove it. Verification
            confirms identity and records evidence — it is not a guarantee of a sale, a price, or a
            job.
          </p>
        </Limitation>
      </Sub>

      <Sub id="overview-two-hubs" title="Two hubs, one spine">
        <P>UmojaHub runs two hubs on one shared verification spine.</P>
        <P>
          The <strong className="font-medium text-fg">Food Security Hub</strong> is a marketplace.
          Identity-verified farmers list produce; buyers pay by M-Pesa before dispatch; and every
          completed sale feeds a public, formula-driven Farmer Trust Score that anyone can read on a
          listing.
        </P>
        <P>
          The <strong className="font-medium text-fg">Education Hub</strong> verifies work, not
          attendance. CS students complete a project brief, document their process — problem
          breakdown, approach, blocker log, AI-usage log, and a final reflection — pass anonymous
          peer review, and receive a VERIFIED, REVISION_REQUIRED, or DENIED decision from a lecturer
          whose own credentials were verified. Each process document is fingerprinted (SHA-256) when
          submitted, so it cannot be silently changed later.
        </P>
        <P>
          The hubs differ in what they make trustworthy. The Food Hub&rsquo;s trust object is the
          farmer — a continuous score that moves with every transaction. The Education Hub&rsquo;s
          trust object is the project — a one-time, permanent decision backed by hashed evidence.
        </P>
        <Limitation>
          <p>
            The hubs share one account system and one set of named administrators, but are otherwise
            independent. Standing in one does not transfer to the other.
          </p>
        </Limitation>
      </Sub>

      <Sub id="overview-principles" title="Three principles">
        <P>Every verification on UmojaHub follows three rules, stated on the platform itself:</P>
        <ul className="space-y-2 font-body text-read-body text-fg">
          <li>
            <strong className="font-medium">Human Decision</strong> — a named person makes the call,
            not an opaque algorithm.
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
  );
}
