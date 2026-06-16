import { Topic, Sub, Lead, P, Limitation, FlowDiagram } from '../stream';
import { topic } from '../streamTopics';

export function TopicPayments() {
  return (
    <Topic topic={topic('payments')}>
      <Sub id="payments-flow" title="How payment works">
        <Lead>Payment uses M-Pesa STK Push, and it happens before dispatch.</Lead>
        <P>
          When a buyer orders, the platform reserves the stock atomically — so two buyers can never
          buy the same units — creates the order with a reference, and sends an STK push; the buyer
          enters their M-Pesa PIN. If the push fails, the order is cancelled and the stock released.
          The buyer&rsquo;s screen waits up to 90 seconds and then shows the order as paid or failed.
        </P>
        <FlowDiagram
          caption="The order & payment lifecycle"
          steps={[
            { label: 'Order placed', note: 'Stock is reserved atomically, so two buyers can never claim the same units.' },
            { label: 'STK push sent', note: 'The buyer enters their M-Pesa PIN.' },
            { label: 'Paid', note: 'Payment is confirmed. If it fails, the order is cancelled and the stock released.' },
            { label: 'Receipt confirmed', note: 'The buyer marks the order received.' },
            { label: 'Completed', note: "The farmer's Trust Score recalculates." },
          ]}
        />
        <Limitation>
          <p>
            The buyer commits money first, then confirms receipt. There is no escrow: the platform
            does not hold funds pending delivery.
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
            Because the pilot simulates settlement, no real funds move yet, and the platform does not
            currently disburse money to farmers — live M-Pesa would pay the platform&rsquo;s
            shortcode, and farmer payout is not part of the pilot. We state this plainly because it
            changes what &ldquo;payment&rdquo; means today.
          </p>
        </Limitation>
      </Sub>

      <Sub id="payments-commission" title="No commission">
        <P>
          UmojaHub takes no commission on a sale. The price a buyer pays is the price the farmer set.
        </P>
        <Limitation>
          <p>
            No commission also means there is no platform-funded refund pool or buyer-protection
            fund. Recourse is the rating system (see <em>The buyer path</em>), not a chargeback.
          </p>
        </Limitation>
      </Sub>
    </Topic>
  );
}
