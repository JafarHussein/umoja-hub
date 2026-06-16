import { Topic, Sub, Lead, P, Limitation } from '../stream';
import { topic } from '../streamTopics';

export function TopicGovernance() {
  return (
    <Topic topic={topic('governance')}>
      <Sub id="governance-who" title="Who decides">
        <Lead>Every verification on UmojaHub is a named person&rsquo;s decision, not an algorithm&rsquo;s.</Lead>
        <P>
          Administrators decide farmer, lecturer, and supplier verifications; credential-verified
          lecturers decide project outcomes. The platform&rsquo;s commitment is that the people who
          make these calls are identified, not anonymous — because someone handing over identity
          documents deserves to know who is on the other side. Reviewers are measured too: every
          lecturer decision updates an effectiveness record.
        </P>
        <Limitation>
          <p>
            This documentation describes how decisions are made and by which roles — not a roster of
            individuals. Current names and credentials are a matter of platform policy and are shown
            on the platform itself.
          </p>
        </Limitation>
      </Sub>

      <Sub id="governance-record" title="What is recorded">
        <P>
          Decisions are recorded. Farmer approvals and rejections (with the rejection reason),
          lecturer verifications, supplier decisions, and project outcomes are written to an
          append-only audit log, and project decisions freeze the evidence hashes at the moment of
          the call.
        </P>
        <Limitation>
          <p>
            The audit log is currently write-only: it is kept for integrity, but there is no public
            or in-product viewer yet. Accountability today means the record exists and cannot be
            rewritten — not that anyone can browse it on demand.
          </p>
        </Limitation>
      </Sub>

      <Sub id="governance-appeals" title="Appeals & recourse">
        <P>
          Every decision is meant to be correctable — the third platform principle. A rejected farmer
          can fix and resubmit; a buyer&rsquo;s recourse on an order is a public rating.
        </P>
        <Limitation>
          <p>
            A formal in-product appeals workflow — with published handlers and turnaround times — is
            not yet built. Beyond the resubmit path, appeals and corrections are handled by
            contacting the platform directly. We say so plainly rather than imply a process that does
            not yet exist.
          </p>
        </Limitation>
      </Sub>
    </Topic>
  );
}
