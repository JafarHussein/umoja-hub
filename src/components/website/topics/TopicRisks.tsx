import { Topic, Sub, Lead, P, Limitation } from '../stream';
import { topic } from '../streamTopics';

export function TopicRisks() {
  return (
    <Topic topic={topic('risks')}>
      <Sub id="risks-farmers" title="Farmers">
        <Lead>A farmer&rsquo;s main risks are a buyer who never confirms receipt, or a low rating.</Lead>
        <P>
          Recourse runs through the same mechanisms described above: an identity rejection comes with
          a reason and can be corrected and resubmitted, and reliability and rating recover with
          subsequent good transactions.
        </P>
        <Limitation>
          <p>
            There is no order-cancellation or dispute-filing tool for farmers, and no in-product
            payout view. In the pilot, settlement is simulated (see <em>Payments &amp; money</em>).
          </p>
        </Limitation>
      </Sub>

      <Sub id="risks-buyers" title="Buyers">
        <P>
          A buyer pays before dispatch, but the payment is held in escrow and released to the farmer
          only when the buyer confirms receipt. Their protections are this hold, the platform
          mediation that can refund it, the public Trust Score — read it before ordering — and the
          rating they leave once the order completes.
        </P>
        <Limitation>
          <p>
            There is no card chargeback, and the escrow is platform-custodied rather than a regulated
            trust account: a refund is an administrator&rsquo;s mediation decision, not an automated
            guarantee. A public low rating with a comment remains part of the buyer&rsquo;s recourse.
          </p>
        </Limitation>
      </Sub>

      <Sub id="risks-students" title="Students">
        <P>
          A student&rsquo;s reviewed project carries a named lecturer&rsquo;s decision and their
          written reasoning. The value is the feedback and the engineering practice it forces — not
          a badge.
        </P>
        <Limitation>
          <p>
            The Education Hub is being rebuilt from its foundations, so what is described here will
            change. Today a student cannot resubmit after REVISION_REQUIRED. Appeals are handled by
            email. UmojaHub makes no claim to an employer on a student&rsquo;s behalf.
          </p>
        </Limitation>
      </Sub>
    </Topic>
  );
}
