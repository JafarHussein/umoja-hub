import React from 'react';
import type { Metadata } from 'next';
import { EduHubPage } from '@/components/website/EduHubPage';
import { LimitationPanel } from '@/components/website/LimitationPanel';
import { FaqItem } from '@/components/website/FaqItem';
import type { AnchorSection } from '@/components/website/SectionAnchor';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'For Lecturers — UmojaHub Education Hub',
  description:
    'What reviewer participation involves, how the four-dimension assessment works, how effectiveness is tracked, and what conflict-of-interest protections exist and do not exist.',
};

const SECTIONS: AnchorSection[] = [
  { id: 'why-lecturers-matter', label: 'Why lecturers matter' },
  { id: 'what-you-are-asked-to-do', label: 'What you are asked to do' },
  { id: 'verification-process', label: 'Verification process' },
  { id: 'the-review-queue', label: 'The review queue' },
  { id: 'four-dimensions', label: 'The four dimensions' },
  { id: 'three-decisions', label: 'The three decisions' },
  { id: 'a-real-review', label: 'A real review' },
  { id: 'effectiveness-tracking', label: 'Effectiveness tracking' },
  { id: 'conflict-of-interest', label: 'Conflict of interest' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'faq', label: 'FAQ' },
  { id: 'next-steps', label: 'What to do next' },
];

// ─── Layout primitives ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p className="font-geist-mono text-ws-caption text-ws-hub-blue uppercase mb-3">{children}</p>
  );
}

function SectionH2({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <h2 className="font-display text-ws-section text-ws-text-primary mb-4 max-w-2xl">{children}</h2>
  );
}

function Body({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7]">{children}</p>
  );
}

// ─── Data ──────────────────────────────────────────────────────────────────

const OBLIGATIONS = [
  {
    label: 'Time per review',
    detail:
      '30–60 minutes for a thorough reading of three documents (2,000–5,000 words of student writing), the project brief, the code or repository, and the peer score and commentary. Plus the time to write substantive commentary on four dimensions.',
  },
  {
    label: 'What you read',
    detail:
      'The project brief (AI-generated or open-source). The Problem Breakdown document. The Approach Plan document. The Final Reflection document. The code submission or repository link. The peer review score and written commentary.',
  },
  {
    label: 'What you produce',
    detail:
      'A score on each of the four rubric dimensions (1–5). Written commentary of a minimum of 50 substantive words per dimension — specific enough that a student reading it knows exactly what to improve. A decision: VERIFIED, REVISION_REQUIRED, or DENIED.',
  },
  {
    label: 'Compensation',
    detail:
      'None currently. Lecturers participate as professional contributors. This may change — registered reviewers will be notified if a compensation model is introduced.',
  },
  {
    label: 'Track commitment',
    detail:
      'You are verified for specific tracks based on your credentials. You review only submissions in tracks where you are verified. You select submissions from the queue — assignments are not forced.',
  },
] as const;

const VERIFICATION_STEPS = [
  {
    step: '01',
    actor: 'You',
    action:
      'Register with your name, email, institutional affiliation, and the track(s) you are applying for.',
  },
  {
    step: '02',
    actor: 'You',
    action:
      'Submit your credentials: academic qualifications relevant to your track(s) and employment or affiliation documentation confirming your current position.',
  },
  {
    step: '03',
    actor: 'Administrator',
    action:
      'Reviews the submitted documents. Confirms the credentials are consistent with the claimed position. Makes a VERIFIED or REJECTED decision.',
  },
  {
    step: '04',
    actor: 'Platform',
    action:
      'Notifies you of the decision. If VERIFIED, you can access the review queue for your approved tracks. If REJECTED, the notification includes the reason and you can resubmit with corrected documentation.',
  },
] as const;

interface ReviewDimension {
  readonly label: string;
  readonly whatItMeasures: string;
  readonly strongEvidence: string;
  readonly weakEvidence: string;
  readonly commentaryGuidance: string;
}

const REVIEW_DIMENSIONS: readonly ReviewDimension[] = [
  {
    label: 'Clarity of problem understanding',
    whatItMeasures:
      'Whether the Problem Breakdown document demonstrates that the student understood the brief — not that they restated it. A student who understood the brief identifies the parts of the problem that are underspecified, decomposes the problem into components, analyzes alternative approaches, and explains why they rejected the ones they did not pursue.',
    strongEvidence:
      'The student names at least two alternative technical approaches with reasoning for each. They identify specific constraints in the brief that shaped their choice. They acknowledge what remains ambiguous and how they handled the ambiguity.',
    weakEvidence:
      'The Breakdown document restates the brief requirements in different words. No alternatives are considered. The student states what they will build without explaining why this approach addresses the problem better than others.',
    commentaryGuidance:
      'Name the specific gap: "The Breakdown identifies the correct problem domain but does not analyze alternative data architectures — a mobile offline-first system has at least two viable approaches, and neither is discussed." Do not write: "The breakdown could be more detailed."',
  },
  {
    label: 'Methodology appropriateness',
    whatItMeasures:
      'Whether the Approach Plan reflects appropriate planning discipline before implementation began. The Plan document should show milestone structure, task decomposition, technology justification, and evidence that the student thought about the work before starting it — not a post-hoc description of what they did.',
    strongEvidence:
      'Milestones have specific, assessable criteria. Technology choices reference the brief constraints. Timeline is realistic for the scope. Testing approach is described before implementation results are reported.',
    weakEvidence:
      'Generic milestone names: "Week 1: Research. Week 2: Development. Week 3: Testing." Technology choices are listed without justification. The plan reads as though it was written after the project was finished.',
    commentaryGuidance:
      'Be specific about which milestones are insufficient: "Milestone 3 is labeled \'backend implementation\' with no specific deliverable. A plan-level milestone should state what \'done\' looks like — not just which part of the system is being built." Do not write: "The plan needs more detail."',
  },
  {
    label: 'Documentation quality',
    whatItMeasures:
      "Whether the three documents together give a reader — who has not seen the brief — a complete and accurate account of the student's problem understanding, implementation plan, and project outcome. Quality means: structured, appropriately technical, coherent, and sufficient for an external reader to assess the work without guessing.",
    strongEvidence:
      "Documents are internally consistent — the Breakdown's analysis connects to the Plan's approach connects to the Reflection's assessment. Terminology is consistent and appropriately technical. Each document can be understood independently.",
    weakEvidence:
      "Significant gaps between documents — Breakdown mentions an approach that does not appear in the Plan. Terminology shifts between documents for the same concept. Stream-of-consciousness prose without structure.",
    commentaryGuidance:
      'Note specific inconsistencies: "The Breakdown describes a REST API architecture, but the Plan and Reflection never mention it — either the approach changed without explanation, or the Breakdown was written independently of the actual implementation." Do not write: "The documentation quality is uneven."',
  },
  {
    label: 'Reflection depth',
    whatItMeasures:
      'Whether the Reflection document demonstrates professional self-assessment. Depth means: specific failures documented, what was tried before accepting a workaround, what a proper solution would have required technically, what would be done differently and why, and evidence that the student learned something they did not know before starting. The Reflection is the most significant document in the submission.',
    strongEvidence:
      "The student names a specific technical failure, explains what they tried first and why it failed technically (not just \"it didn't work\"), describes the workaround they accepted and what it costs, and states what a proper solution would require — even if they did not implement it.",
    weakEvidence:
      '"The project went well. I learned a lot about web development. Some parts were challenging but I figured them out." No specific failures documented. No technical reasoning for what went wrong. The Reflection reads as a project summary, not a self-assessment.',
    commentaryGuidance:
      'Point to the exact failure in the Reflection: "The Reflection acknowledges that the synchronization logic did not work but does not explain what was tried, why it failed, or what a working solution would require." Do not write: "The reflection needs to be deeper."',
  },
];

interface DecisionType {
  readonly decision: string;
  readonly whenItApplies: string;
  readonly whatHappens: string;
  readonly commentaryNote: string;
}

const DECISION_TYPES: readonly DecisionType[] = [
  {
    decision: 'VERIFIED',
    whenItApplies:
      'The submission meets the documented standard across all four dimensions. Not every dimension needs to be exceptional — each must clear the minimum threshold. A submission where two dimensions are strong and two are barely adequate may still be VERIFIED if all four clear the threshold.',
    whatHappens:
      'The portfolio entry is published permanently. The student receives the decision and sees their portfolio updated. The entry includes the verification date, the reviewer name and affiliation, the peer scores, all three document texts, and the document hash.',
    commentaryNote:
      'VERIFIED decisions still require substantive commentary on each dimension. A student who receives VERIFIED with no commentary learns nothing. A student who receives VERIFIED with specific observation of what they did well — particularly in the Reflection — has a richer portfolio entry.',
  },
  {
    decision: 'REVISION_REQUIRED',
    whenItApplies:
      'The submission has specific identified weaknesses on one or more dimensions that can be addressed through revision. The key word is specific: you must be able to name what is wrong and describe what a revised submission would need to contain. If you cannot write a specific revision instruction, the submission is either already VERIFIED or should be DENIED.',
    whatHappens:
      "The student receives your commentary. They revise the specific identified sections and resubmit. The revised submission re-enters the peer review queue and then the lecturer queue. You may or may not be assigned the revised submission.",
    commentaryNote:
      'REVISION_REQUIRED commentary must be actionable. The student needs to read your feedback and know exactly what to write. "The reflection needs more depth" is not actionable. "The reflection identifies the connectivity problem but does not explain what you tried before accepting the workaround, why that approach failed, or what a proper solution would require technically — address these three points specifically" is actionable.',
  },
  {
    decision: 'DENIED',
    whenItApplies:
      'The submission does not meet the standard and revision within the current project scope cannot remedy it. DENIED is appropriate when: the fundamental problem understanding is absent (not shallow — absent), the documentation is incoherent to the degree that revision cannot rescue it, or the Reflection suggests the student did not engage with the project at all. DENIED is rare.',
    whatHappens:
      "The submission does not appear in the student's public portfolio. The student is notified and can begin a new project engagement. The submission is preserved in the audit log. The student's public profile does not indicate that a DENIED decision was issued.",
    commentaryNote:
      'DENIED commentary must explain why revision cannot address the problem. "The Breakdown, Plan, and Reflection are all generic enough that they could have been written for any project brief. None of them demonstrate engagement with the specific agricultural connectivity constraints in this brief. Revision of individual sections would not address the underlying absence of project-specific reasoning — the submission requires a fresh start from the brief."',
  },
];

const TRACKING_METRICS = [
  {
    metric: 'Review count',
    whatItCaptures:
      'The number of reviews completed over time. A reviewer who registers and then completes no reviews in six months is visible in this metric.',
    deviationSignal:
      'Absence of activity after registration. No threshold exists for minimum reviews — participation is voluntary. But low activity is visible to the platform.',
  },
  {
    metric: 'Decision distribution',
    whatItCaptures:
      'The proportion of VERIFIED, REVISION_REQUIRED, and DENIED decisions across all reviews completed. A reviewer who issues VERIFIED on every submission has a distribution of 100/0/0.',
    deviationSignal:
      'An unusually high VERIFIED rate — particularly from a reviewer who reviews quickly — suggests that reviews may not be thorough. An unusually high DENIED rate with short commentary suggests the reviewer may be applying a higher standard than the rubric specifies.',
  },
  {
    metric: 'Score distribution per dimension',
    whatItCaptures:
      'The average score given on each of the four dimensions across all reviews completed. A reviewer who consistently gives 5/5 on Reflection depth regardless of submission quality has a distinct signature.',
    deviationSignal:
      'Consistently high scores across all dimensions from a reviewer whose VERIFIED rate is high — the combination suggests compression toward the top of the scale regardless of submission quality.',
  },
  {
    metric: 'Score alignment with peer scores',
    whatItCaptures:
      "How a lecturer's scores compare to the peer scores on the same submission. Large, consistent divergence — a lecturer who scores 4/5 on every dimension where the peer scored 2/5 — is a signal.",
    deviationSignal:
      'Consistent over-inflation relative to peer scores. This does not mean peer scores are always right — the lecturer\'s independent judgment is the point. But systematic divergence without explanation is a pattern the platform can see.',
  },
] as const;

const LIMITATIONS = [
  {
    heading: 'Your verification is point-in-time',
    detail:
      'Platform administrators reviewed your credentials at the time of registration. They confirmed your credentials were consistent with your claimed position. They do not verify your current academic standing on an ongoing basis. If your institutional affiliation changes, update the platform. A verified credential associated with a position you no longer hold is a misrepresentation, even if the platform does not automatically detect it.',
  },
  {
    heading: 'The platform cannot verify your impartiality',
    detail:
      "The effectiveness tracking metrics can detect patterns of unusually consistent decisions and score distributions. They cannot detect a reviewer who carefully varies their scores to avoid detection while systematically favoring or disfavoring certain types of submissions. The platform's accountability mechanism is the combination of your name being on the decision and the metrics being tracked — not forensic analysis of your judgment quality.",
  },
  {
    heading: 'Commentary quality is not systematically graded',
    detail:
      'The platform enforces a 50-word minimum per dimension. It does not grade the quality of the commentary. Commentary that technically exceeds 50 words but offers no specific, actionable observation passes the length check. The professional standard for commentary is higher than the enforced minimum.',
  },
  {
    heading: "Your decision can affect a student's job search timeline",
    detail:
      "A REVISION_REQUIRED decision returns the submission to the queue. The revised submission waits for peer review and then for the next available lecturer. The total delay from your decision to the student's portfolio update may be weeks. A DENIED decision is final and requires the student to start a new project. These are consequential decisions.",
  },
  {
    heading: 'VERIFIED decisions are permanent and associated with your name',
    detail:
      "Once issued, a VERIFIED decision is recorded in the audit log and published in the student's portfolio. Your name and institutional affiliation appear on that entry permanently. If you later believe a decision you issued was incorrect, contact the platform. The decision cannot be unilaterally revised after the fact — the audit log is designed to be permanent.",
  },
] as const;

const FAQ_ITEMS = [
  {
    question: 'What credentials do I need to register as a reviewer?',
    answer:
      "You need to be an academic staff member or industry professional with domain expertise in one of the platform's tracks — Agriculture, Health, Finance, or Infrastructure — and with a CS background sufficient to assess student code submissions. You submit your credentials (academic qualifications, employment or affiliation documentation) to platform administrators during registration. They review and confirm before you can access the queue.",
  },
  {
    question: 'Am I required to review a minimum number of submissions?',
    answer:
      "No minimum is enforced. Participation is voluntary. However, reviewers who register and complete no reviews are visible in the platform's activity data. The review system depends on active participation from the reviewer pool — a track with few active reviewers has longer queue wait times for students.",
  },
  {
    question: 'Can I review projects outside my primary area of expertise?',
    answer:
      'You are verified for specific tracks based on your credentials. You can only select submissions from tracks in which you are verified. Within your verified tracks, you can specialize informally by choosing submissions from the types of projects you are most qualified to assess.',
  },
  {
    question: 'Can I change a decision after I submit it?',
    answer:
      'No. Decisions are recorded in the audit log at submission and cannot be revised. If you believe you made a significant error in a decision — particularly a DENIED decision — contact the platform administrators. They can review the case and may assign a second reviewer. Do not submit a decision you are not confident in.',
  },
  {
    question: 'Is there compensation for completing reviews?',
    answer:
      'No. The current platform does not offer monetary compensation. Lecturers participate as professional contributors. If the platform introduces compensation in the future, registered reviewers will be notified.',
  },
  {
    question: "Can I see the student's name and institution when I review?",
    answer:
      "No. The student's name and institutional affiliation are hidden until after you submit your decision. You see the brief, the three documents, the code repository, and the peer score and commentary. This is a bias reduction measure — your assessment should be of the work, not of the student's background.",
  },
  {
    question: 'What happens if I receive a submission from a student I know?',
    answer:
      'Recuse yourself. Contact the platform to have the submission reassigned. You are responsible for identifying this situation — the platform does not structurally prevent personal relationship conflicts across institutions. If you review a submission from a student you know personally and this is later discovered, your review will be invalidated and reassigned.',
  },
  {
    question: 'How long should I spend on a review?',
    answer:
      'A thorough review of three documents — typically 2,000–5,000 words of student writing — with substantive commentary on four dimensions takes 30–60 minutes for a careful reviewer. If you are completing a review in 10 minutes, you are not writing substantive commentary on four dimensions. A superficial review that passes the length check is a failure of professional standard even if it does not violate a platform rule.',
  },
  {
    question: "What if a student disputes my decision?",
    answer:
      "The platform does not currently have a formal student appeals process. Your decision stands. Platform administrators may review a flagged decision if a student escalates. Your commentary — preserved in the audit log — is the record of your reasoning. Specific, documented commentary protects your decision against challenge. Vague commentary does not.",
  },
  {
    question: 'What happens to my account if my institutional affiliation changes?',
    answer:
      "Update the platform. Your verification is associated with the credentials you submitted. A reviewer whose listed institution no longer reflects their actual affiliation is presenting stale information to students and employers who see their name on portfolio entries. Contact the platform to submit updated credentials.",
  },
  {
    question: 'Can a student see my peer score commentary when you review?',
    answer:
      "Students do not receive the peer score commentary directly alongside your decision. The peer score and commentary are visible to you during review. The peer score appears in the published portfolio entry — the scores on four dimensions are visible to the student and to anyone viewing the portfolio. Your decision commentary is the substantive content the student receives.",
  },
  {
    question: 'What if the peer reviewer gave a very low score that I disagree with?',
    answer:
      "Your decision is independent of the peer score. The peer score informs but does not determine your judgment. If you find a submission strong despite a low peer score, VERIFIED is still the correct decision if the work meets the standard. Note in your commentary that you assessed the work independently and found it met the threshold.",
  },
] as const;

export default function LecturersPage(): React.ReactElement {
  return (
    <EduHubPage
      audience="For Lecturers"
      heading="Your name on a VERIFIED decision is what makes it mean something."
      intro="This page covers what reviewer participation involves, how the four-dimension assessment works, what substantive commentary requires, how effectiveness is tracked, and what conflict-of-interest protections exist and do not exist. Read it in full before submitting your first review."
      sections={SECTIONS}
      registerHref="/auth/register?role=lecturer"
      registerLabel="Register as a reviewer"
    >
      {/* ── Why lecturers matter ── */}
      <section id="why-lecturers-matter" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Why lecturers matter</SectionLabel>
        <SectionH2>
          Without a named, credentials-confirmed reviewer, the credential is a self-report.
        </SectionH2>
        <div className="space-y-5 max-w-3xl">
          <Body>
            The Education Hub&apos;s portfolio system works because of a single design decision: every
            VERIFIED decision is associated with a named person whose credentials have been
            independently confirmed. An employer who reads a portfolio entry can see who reviewed
            the work, verify that person&apos;s institutional affiliation, and follow the chain back to
            your decision. That chain is what makes the credential meaningful — not the badge itself.
          </Body>
          <Body>
            An anonymous review creates no traceable accountability. A platform-administered score
            without a named human reviewer creates no external verification point. The value of the
            verification system flows entirely from the fact that a real, identifiable person made a
            judgment and that judgment is recorded with their name on it.
          </Body>
          <Body>
            This has an implication for you as a reviewer: the quality of your assessments is
            publicly associated with your name. A VERIFIED decision you issue appears on a student&apos;s
            portfolio permanently, next to your name and institution, readable by any employer who
            clicks the URL. Perfunctory reviews reflect on you. Substantive reviews build a track
            record that makes the credential worth more over time.
          </Body>
          <Body>
            Your institution benefits indirectly as well. A department whose faculty actively review
            submissions sees its graduates accumulate verified portfolio entries from external
            reviewers — portfolio entries that carry weight because they were assessed by people with
            no relationship to the student&apos;s institution.
          </Body>
        </div>
      </section>

      {/* ── What you are asked to do ── */}
      <section
        id="what-you-are-asked-to-do"
        className="py-12 border-b border-ws-border-light"
      >
        <SectionLabel>What you are asked to do</SectionLabel>
        <SectionH2>Concrete obligations before you register.</SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          Know what you are committing to before submitting your credentials. There is no minimum
          required number of reviews — but each review you do accept has specific standards.
        </p>

        <div className="bg-ws-surface-raised border border-ws-border-light overflow-hidden max-w-3xl mb-6">
          {OBLIGATIONS.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-4 px-5 py-5 border-b border-ws-border-light last:border-0"
            >
              <div className="shrink-0 w-40">
                <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase">
                  {item.label}
                </p>
              </div>
              <p className="font-geist text-ws-body text-ws-text-secondary">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="border border-ws-border-light p-5 max-w-3xl">
          <p className="font-geist text-ws-body text-ws-text-secondary">
            <span className="font-semibold text-ws-text-primary">The professional standard: </span>
            The platform enforces a 50-word minimum. The professional standard is higher. A review
            that technically passes the length check but offers no specific observation is a failure
            of the standard that makes the credential meaningful — even if it passes the system&apos;s
            rule.
          </p>
        </div>
      </section>

      {/* ── Verification process ── */}
      <section id="verification-process" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Verification process</SectionLabel>
        <SectionH2>What happens between registration and accessing the review queue.</SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          You cannot access the review queue until your credentials are reviewed and confirmed by a
          platform administrator. There is no self-service verification path.
        </p>

        <div className="flex flex-col max-w-3xl mb-6">
          {VERIFICATION_STEPS.map((item, i) => (
            <div key={item.step}>
              <div className="border border-ws-border-light bg-ws-surface-base p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-geist-mono text-[13px] leading-5 font-medium tabular-nums shrink-0 text-ws-hub-blue">
                    {item.step}
                  </span>
                  <span className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase">
                    {item.actor}
                  </span>
                </div>
                <p className="font-geist text-ws-body text-ws-text-secondary">{item.action}</p>
              </div>
              {i < VERIFICATION_STEPS.length - 1 && (
                <div className="flex justify-center" aria-hidden>
                  <div className="w-px h-6 bg-ws-border-medium" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-3xl">
          <div className="border border-ws-border-light p-5">
            <p className="font-display text-ws-subsection text-ws-text-primary mb-2">
              What verification confirms
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary">
              That your credentials are consistent with the claimed position at the time of review.
              Your name and institutional affiliation as listed in the verified record will appear on
              every portfolio entry you produce.
            </p>
          </div>
          <div className="border border-ws-border-light p-5">
            <p className="font-display text-ws-subsection text-ws-text-primary mb-2">
              What verification does not confirm
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary">
              That you are the best possible reviewer for any specific submission. That your
              assessments are free from bias. That the reviewing institution endorses the platform.
              That your credentials remain current — verification is point-in-time.
            </p>
          </div>
        </div>
      </section>

      {/* ── The review queue ── */}
      <section id="the-review-queue" className="py-12 border-b border-ws-border-light">
        <SectionLabel>The review queue</SectionLabel>
        <SectionH2>What you see, what you do not see, and how assignment works.</SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          Submissions enter the queue after passing peer review. You select submissions to review —
          they are not assigned to you without your acceptance.
        </p>

        <div className="border-l-2 border-ws-border-medium pl-6 space-y-8 max-w-3xl">
          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              When a submission enters the queue
            </p>
            <Body>
              A submission is eligible for lecturer review after a peer reviewer has completed their
              assessment. The peer score is locked before the submission enters the queue. The queue
              shows you: the project title, the track, the brief type (AI_BRIEF or OPEN_SOURCE),
              the peer score summary, and the submission date.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              What you see when you open a submission
            </p>
            <Body>
              The full project brief. All three student documents. The code repository link. The peer
              reviewer&apos;s score on each of the four dimensions and their written commentary.
            </Body>
            <div className="mt-3">
              <Body>
                <span className="font-semibold text-ws-text-primary">What you do not see: </span>
                the student&apos;s name, institutional affiliation, or any identifying information until
                after you submit your decision. This is a bias reduction measure — your assessment
                is of the work, not the student.
              </Body>
            </div>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Queue depth and wait times
            </p>
            <Body>
              The review queue&apos;s depth at any time depends on the number of active verified lecturers
              for each track and the rate of student submissions. A track with few active reviewers
              produces longer wait times for students. This is a structural constraint of the
              volunteer reviewer model — the platform&apos;s throughput on any track is bounded by the
              number of active lecturers in that track.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Revised submissions
            </p>
            <Body>
              If you issue REVISION_REQUIRED, the student revises and resubmits. The revised
              submission re-enters the queue. You may or may not be assigned the revised submission
              — assignment is not guaranteed to the original reviewer.
            </Body>
          </div>
        </div>
      </section>

      {/* ── Four dimensions ── */}
      <section id="four-dimensions" className="py-12 border-b border-ws-border-light">
        <SectionLabel>The four dimensions</SectionLabel>
        <SectionH2>
          What each dimension measures, what evidence looks like at each extreme, and what
          substantive commentary requires.
        </SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          All four dimensions apply the same 1–5 scale. Peer reviewers and lecturers use the same
          rubric. Your score on each dimension should be accompanied by commentary specific enough
          that a student reading it knows exactly what to change.
        </p>

        <div className="space-y-4">
          {REVIEW_DIMENSIONS.map((dim, i) => (
            <div key={dim.label} className="border border-ws-border-light overflow-hidden">
              <div className="bg-ws-surface-raised px-5 py-4 border-b border-ws-border-light">
                <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-1">
                  Dimension {i + 1}
                </p>
                <p className="font-display text-ws-subsection text-ws-text-primary">{dim.label}</p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
                    What it measures
                  </p>
                  <p className="font-geist text-ws-body text-ws-text-secondary">
                    {dim.whatItMeasures}
                  </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="bg-ws-surface-recessed border border-ws-border-light p-4">
                    <p className="font-geist-mono text-ws-caption text-ws-hub-blue uppercase mb-2">
                      Strong evidence
                    </p>
                    <p className="font-geist text-ws-body text-ws-text-secondary">
                      {dim.strongEvidence}
                    </p>
                  </div>
                  <div className="bg-ws-surface-recessed border border-ws-border-light p-4">
                    <p className="font-geist-mono text-ws-caption text-ws-status-denied uppercase mb-2">
                      Weak evidence
                    </p>
                    <p className="font-geist text-ws-body text-ws-text-secondary">
                      {dim.weakEvidence}
                    </p>
                  </div>
                </div>
                <div className="border-l-2 border-ws-border-medium pl-4">
                  <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-1">
                    Commentary guidance
                  </p>
                  <p className="font-geist text-ws-body text-ws-text-secondary">
                    {dim.commentaryGuidance}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Three decisions ── */}
      <section id="three-decisions" className="py-12 border-b border-ws-border-light">
        <SectionLabel>The three decisions</SectionLabel>
        <SectionH2>When each decision applies and what follows from it.</SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          All three decisions are permanent as issued. Commentary is required for all three —
          including VERIFIED. A student who receives VERIFIED with no commentary learns nothing and
          has a weaker portfolio entry than one who received specific positive assessment.
        </p>

        <div className="space-y-4">
          {DECISION_TYPES.map((dt) => {
            const labelColor =
              dt.decision === 'VERIFIED'
                ? 'text-ws-hub-blue'
                : dt.decision === 'REVISION_REQUIRED'
                  ? 'text-ws-status-pending'
                  : 'text-ws-status-denied';
            return (
              <div key={dt.decision} className="border border-ws-border-light overflow-hidden">
                <div className="bg-ws-surface-raised px-5 py-3 border-b border-ws-border-light">
                  <span
                    className={`font-geist-mono text-ws-caption uppercase font-medium ${labelColor}`}
                  >
                    {dt.decision}
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-1">
                      When it applies
                    </p>
                    <p className="font-geist text-ws-body text-ws-text-secondary">
                      {dt.whenItApplies}
                    </p>
                  </div>
                  <div>
                    <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-1">
                      What happens
                    </p>
                    <p className="font-geist text-ws-body text-ws-text-secondary">
                      {dt.whatHappens}
                    </p>
                  </div>
                  <div className="border-l-2 border-ws-border-medium pl-4">
                    <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-1">
                      Commentary note
                    </p>
                    <p className="font-geist text-ws-body text-ws-text-secondary">
                      {dt.commentaryNote}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── A real review ── */}
      <section id="a-real-review" className="py-12 border-b border-ws-border-light">
        <SectionLabel>A real review</SectionLabel>
        <SectionH2>What the review process looks like from the reviewer&apos;s side.</SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          This scenario traces a single review from queue selection to decision — including what the
          reviewer sees, how they weigh the peer score, and what their commentary says.
        </p>

        <div className="border-l-2 border-ws-border-medium pl-6 space-y-8 max-w-3xl">
          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Starting state
            </p>
            <Body>
              Dr. Wachira is a CS lecturer at a Kenyan university. She is verified in the Agriculture
              and Health tracks. She opens the review queue and selects an AI_BRIEF project on a crop
              health observation tool for smallholder farmers, submitted five days ago, peer score
              3.5/5.0.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Reading the brief
            </p>
            <Body>
              She reads the generated brief first. She notes the specific constraint: the tool must
              function with intermittent connectivity. This is the constraint that determines whether
              the student understood the hardest part of the problem.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Reading the documents
            </p>
            <Body>
              The Problem Breakdown is strong — the student identified three alternative data
              architectures and rejected two with technical reasoning. The Approach Plan is adequate
              but sparse on testing methodology. The Reflection describes the connectivity workaround
              but does not explain what was tried before accepting it, why it failed, or what a
              proper solution would require. The peer reviewer gave 2.5/5 on this dimension with the
              comment: &quot;The reflection identifies what didn&apos;t work but doesn&apos;t explain why.&quot; Dr.
              Wachira agrees.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              The decision
            </p>
            <Body>
              She scores: Clarity 4/5, Methodology 3/5, Documentation 3.5/5, Reflection 2/5. She
              issues REVISION_REQUIRED. Her commentary on the Reflection dimension:
            </Body>
            <div className="mt-3 bg-ws-surface-raised border border-ws-border-light p-4">
              <p className="font-geist text-ws-body text-ws-text-secondary italic">
                &quot;The Reflection acknowledges that the offline-first synchronization did not work as
                intended but does not explain what was attempted before accepting the workaround, why
                the initial approach failed technically, or what a correct implementation would
                require. A Reflection on a synchronization failure should name what was tried, what
                the technical constraint was (clock drift, conflict resolution, etc.), and what
                algorithm or data structure would address it. Without this, the section describes a
                limitation rather than reflects on it.&quot;
              </p>
            </div>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              The outcome
            </p>
            <Body>
              The student receives the decision and reads the commentary. It is specific — they know
              exactly what to rewrite and what depth is required. The Reflection section is revised.
              The resubmission receives VERIFIED. Dr. Wachira&apos;s name appears on the published
              portfolio entry.
            </Body>
          </div>
        </div>
      </section>

      {/* ── Effectiveness tracking ── */}
      <section id="effectiveness-tracking" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Effectiveness tracking</SectionLabel>
        <SectionH2>How the platform monitors for patterns that signal review quality problems.</SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          The platform does not grade your assessments individually. It tracks patterns across your
          review history that may indicate problems with thoroughness or calibration. These metrics
          are visible to platform administrators, not to students.
        </p>

        <div className="bg-ws-surface-raised border border-ws-border-light overflow-hidden">
          {TRACKING_METRICS.map((item) => (
            <div
              key={item.metric}
              className="flex items-start gap-4 px-5 py-5 border-b border-ws-border-light last:border-0"
            >
              <div className="shrink-0 w-48">
                <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase">
                  {item.metric}
                </p>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-geist text-ws-body text-ws-text-secondary">
                  {item.whatItCaptures}
                </p>
                <p className="font-geist text-ws-body-sm text-ws-text-tertiary pl-3 border-l border-ws-border-light">
                  <span className="font-medium text-ws-status-pending">Deviation signal: </span>
                  {item.deviationSignal}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Conflict of interest ── */}
      <section id="conflict-of-interest" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Conflict of interest</SectionLabel>
        <SectionH2>
          What the platform prevents structurally — and what it cannot prevent.
        </SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          The conflict of interest system is structural, not forensic. It prevents the most common
          forms of institutional bias. It does not prevent all possible forms.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-3xl mb-6">
          <div className="border border-ws-border-light p-5">
            <p className="font-display text-ws-subsection text-ws-text-primary mb-2">
              What the platform prevents
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary">
              Lecturers cannot review submissions from students at their own institution. This is
              enforced at the assignment level — submissions from students registered with the same
              institution as a reviewer will not appear in their queue. You do not need to recuse
              yourself from your own institution&apos;s students; the system does this automatically.
            </p>
          </div>
          <div className="border border-ws-border-light p-5">
            <p className="font-display text-ws-subsection text-ws-text-primary mb-2">
              What the platform cannot prevent
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary">
              Personal relationships that cross institutional lines. A lecturer who is a friend or
              mentor of a student at a different institution will not be blocked from their queue.
              You are responsible for identifying and disclosing this — recuse yourself and contact
              the platform for reassignment. The platform relies on your professional judgment for
              conflicts it cannot detect structurally.
            </p>
          </div>
        </div>

        <div className="border border-ws-border-light p-5 max-w-3xl">
          <p className="font-geist text-ws-body text-ws-text-secondary">
            <span className="font-semibold text-ws-text-primary">The accountability mechanism: </span>
            Your name is on every decision. If a conflict of interest is discovered after a review
            is issued, the review will be reassigned. The student&apos;s submission is not penalized — but
            your review record is. Disclose conflicts before reviewing, not after.
          </p>
        </div>
      </section>

      {/* ── Limitations ── */}
      <section id="limitations" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Limitations</SectionLabel>
        <SectionH2>What the platform cannot guarantee about the review system.</SectionH2>
        <div className="space-y-3">
          {LIMITATIONS.map((item) => (
            <LimitationPanel key={item.heading} eyebrow={item.heading}>
              {item.detail}
            </LimitationPanel>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-12 border-b border-ws-border-light">
        <SectionLabel>FAQ</SectionLabel>
        <SectionH2>Questions reviewers ask before registering.</SectionH2>
        <div className="divide-y divide-ws-border-light border-y border-ws-border-light">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </section>

      {/* ── Next steps ── */}
      <section id="next-steps" className="py-12">
        <SectionLabel>What to do next</SectionLabel>
        <SectionH2>If you want to become a verified reviewer.</SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          Registration requires submitting your credentials — academic qualifications and employment
          or affiliation documentation. Platform administrators review the submission before granting
          queue access. The review is a document consistency check, not a live verification with
          your institution.
        </p>
        <a
          href="/auth/register?role=lecturer"
          className="inline-flex items-center justify-center min-h-[44px] px-6 border border-ws-hub-blue text-ws-hub-blue font-geist text-ws-body hover:bg-ws-hub-blue hover:text-white transition-colors duration-150"
        >
          Register as a reviewer
        </a>
      </section>
    </EduHubPage>
  );
}
