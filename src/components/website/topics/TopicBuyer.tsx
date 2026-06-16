import { Topic, Sub, Lead, P, Limitation } from '../stream';
import { topic } from '../streamTopics';

export function TopicBuyer() {
  return (
    <Topic topic={topic('buyer')}>
      <Sub id="buyer-browse" title="Browsing the marketplace">
        <Lead>Anyone can browse the marketplace without an account.</Lead>
        <P>
          Listings can be filtered by crop, county, price range, and verified-only. Each card shows
          the produce, the price per unit, the quantity available, the farmer&rsquo;s name and
          county, and their Trust Score and tier — so a buyer can compare strangers before
          committing.
        </P>
        <Limitation>
          <p>
            Browsing is open; placing an order requires an account. The platform lists what farmers
            post — it does not inspect or grade produce quality before a sale.
          </p>
        </Limitation>
      </Sub>

      <Sub id="buyer-reading-trust" title="Reading a Trust Score">
        <P>
          The Trust Score (see <em>Trust architecture</em>) tells a buyer how much verified activity
          stands behind a farmer. The higher tiers — TRUSTED and PREMIUM — reflect more completed
          transactions and ratings; ESTABLISHED is the starting point after identity verification;
          NEW is below that.
        </P>
        <Limitation>
          <p>
            A score reflects the past, not a guarantee about your specific order, and a high score
            does not certify the quality of a particular harvest. Read it as one signal among your
            own judgement, not a warranty.
          </p>
        </Limitation>
      </Sub>

      <Sub id="buyer-recourse" title="If something goes wrong">
        <P>
          A buyer pays before dispatch, then confirms receipt in the app — which completes the order
          and lets them rate the farmer from 1 to 5 with a comment. That rating feeds the
          farmer&rsquo;s public Trust Score, so it carries real weight for future buyers.
        </P>
        <Limitation>
          <p>
            A formal dispute workflow is not yet available to users. Today, a buyer&rsquo;s recourse
            if something goes wrong is an honest low rating with a comment — which is public and
            lowers the farmer&rsquo;s score. There is no chargeback or platform refund.
          </p>
        </Limitation>
      </Sub>
    </Topic>
  );
}
