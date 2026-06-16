import { Topic, Sub, Lead, P, Limitation } from '../stream';
import { topic } from '../streamTopics';

export function TopicTrust() {
  return (
    <Topic topic={topic('trust')}>
      <Sub id="trust-score" title="The Farmer Trust Score">
        <Lead>
          Every verified farmer has a Trust Score: a single number from 0 to 100, shown publicly on
          each of their listings alongside a tier label.
        </Lead>
        <P>
          The score is formula-driven, not editorial — no one types in a number. It is computed from
          four components and recalculated automatically after each completed order and each buyer
          rating, never adjusted by hand. When a farmer&rsquo;s identity is first approved, the score
          starts at 40 (tier ESTABLISHED).
        </P>
        <Limitation>
          <p>
            The score measures a farmer&rsquo;s verified activity on UmojaHub. It says nothing about
            reputation built off the platform, and it is not a prediction: a high score reflects past
            recorded behaviour, not a promise about the next sale.
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
              <td className="py-2">Rewards confirming paid orders within 24 hours; reduced by disputes.</td>
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
          and when a buyer submits a rating. It never runs while someone is simply reading a page, so
          the score you see is the one from the farmer&rsquo;s last real transaction.
        </P>
        <Limitation>
          <p>
            Because approval seeds the score at 40, a brand-new verified farmer and a long-inactive
            one can show the same ESTABLISHED tier. The tier reflects accumulated verified activity,
            not recency.
          </p>
        </Limitation>
      </Sub>
    </Topic>
  );
}
