import { Topic, Sub, Lead, P, Limitation, FlowDiagram } from '../stream';
import { topic } from '../streamTopics';

export function TopicPayments() {
  return (
    <Topic topic={topic('payments')}>
      <Sub id="payments-flow" title="How payment works">
        <Lead>
          Payment uses M-Pesa STK Push before dispatch, and the platform holds the funds in escrow
          until the buyer confirms receipt.
        </Lead>
        <P>
          When a buyer orders, the platform reserves the stock atomically — so two buyers can never
          buy the same units — creates the order with a reference, and sends an STK push; the buyer
          enters their M-Pesa PIN. If the push fails, the order is cancelled and the stock released.
          The buyer&rsquo;s screen waits up to 90 seconds and then shows the order as paid or failed.
          Once paid, the money is held in escrow: it is released to the farmer only when the buyer
          confirms the produce arrived, and an open dispute holds it until an administrator resolves
          the mediation — releasing it to the farmer or refunding the buyer.
        </P>
        <FlowDiagram
          caption="The order, escrow & settlement lifecycle"
          steps={[
            { label: 'Order placed', note: 'Stock is reserved atomically, so two buyers can never claim the same units.' },
            { label: 'STK push sent', note: 'The buyer enters their M-Pesa PIN.' },
            { label: 'Held in escrow', note: 'Payment is confirmed and held by the platform. If it fails, the order is cancelled and the stock released.' },
            { label: 'Receipt confirmed', note: 'The buyer marks the order received — this releases the funds to the farmer.' },
            { label: 'Released & settled', note: "Funds become releasable; the farmer requests a payout and the Trust Score recalculates." },
          ]}
        />
        <Limitation>
          <p>
            This escrow is platform-custodied, not a regulated trust account: in production M-Pesa
            settles to the platform&rsquo;s shortcode, and releasing a payout is an explicit
            administrator action. The hold is enforced by the order lifecycle, and disputes are
            resolved by human mediation rather than an automated guarantee.
          </p>
        </Limitation>
      </Sub>

      <Sub id="payments-pilot" title="Pilot mode">
        <P>
          During the current pilot, the platform runs against a payment <strong className="font-medium text-fg">simulation</strong>{' '}
          provider by default — not live M-Pesa settlement. The payment flow, the order lifecycle, and
          the Trust Score all behave exactly as they will in production; only the money movement is
          simulated. The system is built so that switching to M-Pesa sandbox or production is a
          configuration change, with no change to the code.
        </P>
        <Limitation>
          <p>
            Because the pilot simulates settlement, no real funds move yet. The full escrow-and-payout
            flow is modelled end to end — funds are held, released on receipt, and settled through
            administrator-approved payout requests — but the underlying M-Pesa transfer is simulated.
            We state this plainly because it changes what &ldquo;payment&rdquo; means today.
          </p>
        </Limitation>
      </Sub>

      <Sub id="payments-commission" title="No commission">
        <P>
          UmojaHub takes no commission on a sale. The price a buyer pays is the price the farmer set.
        </P>
        <Limitation>
          <p>
            No commission means there is no platform-funded refund pool. Buyer protection instead
            comes from escrow — the buyer&rsquo;s own funds are held until they confirm receipt, and
            platform mediation can refund them — backed by the rating system (see{' '}
            <em>The buyer path</em>), not a card chargeback.
          </p>
        </Limitation>
      </Sub>
    </Topic>
  );
}
