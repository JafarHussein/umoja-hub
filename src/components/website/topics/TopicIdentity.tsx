import { Topic, Sub, Lead, P, Limitation, FlowDiagram } from '../stream';
import { topic } from '../streamTopics';

export function TopicIdentity() {
  return (
    <Topic topic={topic('identity')}>
      <Sub id="identity-farmers" title="Verifying a farmer">
        <Lead>Before a farmer can sell, an administrator verifies their identity.</Lead>
        <P>
          A farmer submits an identity document — a national ID, cooperative card, or passport — with
          its number and a photo. An administrator reviews it and either approves or rejects it. On
          approval, the farmer becomes verified, receives an SMS, and their Trust Score starts at 40
          (ESTABLISHED). On rejection, the farmer is sent the reason by SMS and can correct and
          resubmit.
        </P>
        <FlowDiagram
          caption="Farmer identity verification"
          steps={[
            { label: 'Submit', note: 'Identity document, its number, and a photo.' },
            { label: 'Admin review', note: 'A named administrator checks the document.' },
          ]}
          outcomes={[
            { label: 'Approved → verified, score 40', tone: 'success' },
            { label: 'Rejected → reason sent, resubmit', tone: 'warning' },
          ]}
        />
        <Limitation>
          <p>
            Verification checks a claimed identity against a submitted document. It is not a
            background check, a credit check, or a guarantee of conduct — it establishes who someone
            is, not how they will behave.
          </p>
        </Limitation>
      </Sub>

      <Sub id="identity-lecturers" title="Verifying a lecturer">
        <P>
          Lecturers who make final decisions in the Education Hub are themselves verified by an
          administrator before they can review anything. An unverified lecturer account cannot reach
          any review function at all.
        </P>
        <Limitation>
          <p>
            Lecturer verification is a single approval — verified or not — rather than a per-track or
            per-subject credential, and there is no automated revocation flow: removing a
            lecturer&rsquo;s standing is a manual action.
          </p>
        </Limitation>
      </Sub>

      <Sub id="identity-documents" title="What happens to your documents">
        <P>
          Identity document images are uploaded to a dedicated media store and attached to the
          verification record an administrator reviews. Education process documents are handled
          differently: their text is fingerprinted (SHA-256) at submission, and the fingerprints are
          re-frozen into an append-only audit log when a decision is made.
        </P>
        <Limitation>
          <p>
            A hash proves a document was not changed after submission; it does not by itself prove
            authorship. There is currently no public endpoint for an outside party to check a hash
            independently.
          </p>
        </Limitation>
      </Sub>
    </Topic>
  );
}
