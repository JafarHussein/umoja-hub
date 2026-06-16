import { Topic, Sub, Lead, P, Limitation } from '../stream';
import { topic } from '../streamTopics';

export function TopicServices() {
  return (
    <Topic topic={topic('services')}>
      <Sub id="services-used" title="Services we rely on">
        <Lead>UmojaHub runs on a small set of named third-party services.</Lead>
        <ul className="space-y-2 font-body text-read-body text-fg">
          <li>
            <strong className="font-medium">M-Pesa (Safaricom Daraja)</strong> — payments (currently
            simulated in the pilot; see <em>Payments &amp; money</em>).
          </li>
          <li>
            <strong className="font-medium">Africa&rsquo;s Talking</strong> — outbound SMS
            notifications.
          </li>
          <li>
            <strong className="font-medium">Cloudinary</strong> — storage for identity-document and
            listing photos and project images.
          </li>
          <li>
            <strong className="font-medium">Groq</strong> — the AI farm assistant and AI mentor.
          </li>
          <li>
            <strong className="font-medium">OpenAI</strong> — AI brief generation and content
            moderation.
          </li>
          <li>
            <strong className="font-medium">OpenWeatherMap</strong> — county weather for the farm
            assistant.
          </li>
          <li>
            <strong className="font-medium">MongoDB Atlas</strong> — the platform database.
          </li>
        </ul>
        <Limitation>
          <p>
            Relying on these services means some data passes through them: uploaded images go to
            Cloudinary, assistant and mentor prompts go to the AI providers, and phone numbers go to
            the SMS and payment providers. SMS is the active notification channel; some email flows
            are configured but not yet switched on.
          </p>
        </Limitation>
      </Sub>

      <Sub id="services-data" title="What is stored, and where">
        <P>
          The platform stores your account and role; for farmers, a profile and the identity document
          submitted for verification; listings and orders; and for students, project briefs, the
          process documents (with their SHA-256 fingerprints), blocker and AI-usage logs, and review
          decisions. AI conversations are kept only temporarily and then deleted automatically —
          farm-assistant chats after 90 days, mentor chats after 30.
        </P>
        <Limitation>
          <p>
            There is no self-service data export or in-product account-deletion flow yet; data
            requests are handled by contacting the platform. Trust scores and price figures are
            derived from platform activity and are not edited by hand.
          </p>
        </Limitation>
      </Sub>
    </Topic>
  );
}
