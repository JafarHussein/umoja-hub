import { Topic, Sub, Lead, P, Limitation } from '../stream';
import { topic } from '../streamTopics';

export function TopicEvidence() {
  return (
    <Topic topic={topic('evidence')}>
      <Sub id="evidence-transparency" title="The public numbers">
        <Lead>UmojaHub publishes its own numbers, with no account required.</Lead>
        <P>
          A public Transparency page reports a small set of aggregate indicators about the platform —
          how many farmers are verified, how many orders have completed, how many counties are
          represented, how many student projects are verified, and similar counts. The figures are
          computed from real platform activity and refreshed on a weekly schedule.
        </P>
        <Limitation>
          <p>
            These are aggregate counts, not a live feed or a downloadable dataset, and they refresh
            weekly rather than in real time. There is no public data export.
          </p>
        </Limitation>
      </Sub>

      <Sub id="evidence-honesty" title="Small numbers, honestly">
        <P>
          When the platform is early, the numbers are small — and they are published small. A
          platform that shows honest small numbers is more trustworthy than one that implies a scale
          it does not have. As real activity grows, the same indicators grow with it.
        </P>
        <Limitation>
          <p>
            Because the figures update weekly, a number you read may lag the latest activity by up to
            a week. Treat them as an honest periodic snapshot, not a real-time dashboard.
          </p>
        </Limitation>
      </Sub>
    </Topic>
  );
}
