import { Topic, Sub, Lead, P, Limitation } from '../stream';
import { topic } from '../streamTopics';

export function TopicProducer() {
  return (
    <Topic topic={topic('producer')}>
      <Sub id="producer-listings" title="Listing produce">
        <Lead>Once a farmer&rsquo;s identity is verified, they can list produce for sale.</Lead>
        <P>
          A listing carries a title, the crop, a description, the quantity and unit (kilogram, bag,
          crate, litre, or piece), an asking price, the pickup county (one of Kenya&rsquo;s 47) with
          pickup details, and one to five photos. Listings from verified farmers are marked verified
          automatically, and each new listing&rsquo;s asking price is recorded to the platform&rsquo;s
          price history.
        </P>
        <Limitation>
          <p>
            A farmer sets their own price; UmojaHub neither sets nor negotiates it. There is
            currently no way to delete a listing or take it offline by hand — a listing leaves the
            market automatically only when its stock reaches zero.
          </p>
        </Limitation>
      </Sub>

      <Sub id="producer-prices" title="Price intelligence">
        <P>
          Verified farmers get price intelligence. For ten major crops, the platform compares recent
          listing and transaction prices in a county against a typical middleman benchmark and shows
          the &ldquo;platform premium&rdquo; — how far above the usual broker price the platform&rsquo;s
          trade sits. Farmers can also set price alerts by crop, county, and target price.
        </P>
        <Limitation>
          <p>
            Coverage is ten crops; outside them no premium is shown. Insights update weekly and only
            where at least three data points exist, so thin markets show little. Price alerts are
            delivered by SMS only — the email option is not yet active. This is a farmer tool: buyers
            and the public do not have price-data access.
          </p>
        </Limitation>
      </Sub>

      <Sub id="producer-assistant" title="The farm assistant">
        <P>
          Farmers can ask an AI farm assistant questions in their language. It is grounded in Kenyan
          standards (KEBS, PCPB, KEPHIS, and the Kenya Veterinary Board) and tailored with the
          farmer&rsquo;s own crops and livestock and a seven-day county weather forecast.
        </P>
        <Limitation>
          <p>
            The assistant is informational guidance, not professional, veterinary, or regulatory
            advice, and it is rate-limited. It can be wrong; when a service is unavailable it returns
            a plain fallback rather than guessing. Treat it as a starting point, not an authority.
          </p>
        </Limitation>
      </Sub>
    </Topic>
  );
}
