import { Topic, Sub, Lead, P, Limitation } from '../stream';
import { topic } from '../streamTopics';

export function TopicEducation() {
  return (
    <Topic topic={topic('education')}>
      <Sub id="education-process" title="Process over artifact">
        <Lead>The Education Hub verifies how a student worked, not just what they produced.</Lead>
        <P>
          A student takes a project brief — either an AI-generated brief set in a real Kenyan
          business context, or a contribution to an open-source repository — and documents the work
          in three written pieces: a problem breakdown, an approach plan, and a final reflection.
          Alongside these they keep a running blocker log and an AI-usage log: which tool, what
          prompt, and what they did with the output. Each document is fingerprinted with SHA-256 the
          moment it is submitted, so it cannot be quietly edited afterwards.
        </P>
        <Limitation>
          <p>
            The hub measures documented process and review — not real-world deployment, grades, or
            employment. The AI-usage log is recorded as the student enters it: it is honesty-based,
            not automatically captured from their tools.
          </p>
        </Limitation>
      </Sub>

      <Sub id="education-review" title="Peer review, then lecturer">
        <P>
          Submitted work passes through two human layers. First, another student peer-reviews it
          anonymously — the reviewer sees the brief and the three documents but not the
          author&rsquo;s identity — and scores code quality and documentation clarity. Then a
          lecturer, whose own credentials an administrator has verified, makes the final decision,
          scoring four dimensions — problem understanding, solution quality, process quality, and AI
          usage — with at least fifty words of written justification for each.
        </P>
        <Limitation>
          <p>
            Peer reviewers are assigned automatically and cannot be chosen or declined. The lecturer
            can see the peer scores when deciding — so although those scores are locked once
            submitted, the lecturer&rsquo;s assessment is not blind to them. Lecturer verification is
            a single approval, not a per-subject credential.
          </p>
        </Limitation>
      </Sub>

      <Sub id="education-outcomes" title="The three outcomes">
        <P>
          A decision is one of three: <strong className="font-medium text-fg">VERIFIED</strong> — the
          project joins the student&rsquo;s verified record, with the document hashes frozen into an
          append-only audit log; <strong className="font-medium text-fg">REVISION_REQUIRED</strong>;
          or <strong className="font-medium text-fg">DENIED</strong>. Each is a named
          person&rsquo;s decision, backed by recorded evidence.
        </P>
        <Limitation>
          <p>
            Two honest gaps today. REVISION_REQUIRED is currently a dead end: a student told to
            revise cannot yet re-open the project to resubmit. And the employer-facing side is not
            built — there is no public portfolio page or shareable link an employer can use to verify
            a result independently yet, and the verified record currently shows a count of verified
            projects rather than a full project list.
          </p>
        </Limitation>
      </Sub>
    </Topic>
  );
}
