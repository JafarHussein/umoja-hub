import React from 'react';
import type { Metadata } from 'next';
import { AudiencePage } from '@/components/website/AudiencePage';
import { FaqAccordion, type FaqItem } from '@/components/website/FaqAccordion';
import type { AnchorSection } from '@/components/website/SectionAnchor';

interface ReviewDimension {
  label: string;
  whatItMeasures: string;
  strongEvidence: string;
  weakEvidence: string;
  commentaryGuidance: string;
}

interface DecisionType {
  decision: string;
  whenItApplies: string;
  whatHappens: string;
  commentaryNote: string;
}

interface TrackingMetric {
  metric: string;
  whatItCaptures: string;
  deviationSignal: string;
}

interface Limitation {
  heading: string;
  detail: string;
}

export const metadata: Metadata = {
  title: 'For Lecturers — UmojaHub Education Hub',
  description:
    'What reviewer participation involves, how the four-dimension assessment works, how effectiveness is tracked, and what conflict-of-interest protections exist and do not exist.',
};

const sections: AnchorSection[] = [
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

const reviewDimensions: ReviewDimension[] = [
  {
    label: 'Clarity of problem understanding',
    whatItMeasures:
      'Whether the Problem Breakdown document demonstrates that the student understood the brief — not that they restated it. A student who understood the brief identifies the parts of the problem that are underspecified, decompose the problem into components, analyzes alternative approaches, and explains why they rejected the ones they did not pursue.',
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
      'Milestones have specific, assessable criteria. Technology choices reference the brief constraints (e.g., "used SQLite for local storage because it supports offline-first access without network dependency"). Timeline is realistic for the scope. Testing approach is described before implementation results are reported.',
    weakEvidence:
      'Generic milestone names: "Week 1: Research. Week 2: Development. Week 3: Testing." Technology choices are listed without justification. The plan reads as though it was written after the project was finished.',
    commentaryGuidance:
      'Be specific about which milestones are insufficient: "Milestone 3 is labeled \'backend implementation\' with no specific deliverable. A plan-level milestone should state what \'done\' looks like — not just which part of the system is being built." Do not write: "The plan needs more detail."',
  },
  {
    label: 'Documentation quality',
    whatItMeasures:
      'Whether the three documents together give a reader — who has not seen the brief — a complete and accurate account of the student\'s problem understanding, implementation plan, and project outcome. Quality means: structured, appropriately technical, coherent, and sufficient for an external reader to assess the work without guessing.',
    strongEvidence:
      'Documents are internally consistent — the Breakdown\'s analysis connects to the Plan\'s approach connects to the Reflection\'s assessment. Terminology is consistent and appropriately technical. Each document can be understood independently. A reader unfamiliar with the brief can reconstruct the project context from the documents.',
    weakEvidence:
      'Significant gaps between documents — Breakdown mentions an approach that does not appear in the Plan. Terminology shifts between documents for the same concept. Stream-of-consciousness prose without structure. Critical information in one document is not referred to in documents where it would be relevant.',
    commentaryGuidance:
      'Note specific inconsistencies: "The Breakdown describes a REST API architecture, but the Plan and Reflection never mention it — either the approach changed without explanation, or the Breakdown was written independently of the actual implementation." Do not write: "The documentation quality is uneven."',
  },
  {
    label: 'Reflection depth',
    whatItMeasures:
      'Whether the Reflection document demonstrates professional self-assessment. Depth means: specific failures documented, what was tried before accepting a workaround, what a proper solution would have required technically, what would be done differently and why, and evidence that the student learned something they did not know before starting. The Reflection is the most significant document in the submission. It reveals professional thinking quality more directly than any other artifact.',
    strongEvidence:
      'The student names a specific technical failure, explains what they tried first and why it failed technically (not just "it didn\'t work"), describes the workaround they accepted and what it costs, and states what a proper solution would require — even if they did not implement it. The student distinguishes between what they understood before starting and what they understand now.',
    weakEvidence:
      '"The project went well. I learned a lot about web development. Some parts were challenging but I figured them out." No specific failures documented. No technical reasoning for what went wrong. No proposed improvement. The Reflection reads as a project summary, not a self-assessment.',
    commentaryGuidance:
      'Point to the exact failure in the Reflection: "The Reflection acknowledges that the synchronization logic did not work but does not explain what was tried, why it failed, or what a working solution would require. A thorough reflection on a synchronization failure would describe the conflict scenarios, what approaches were attempted, and what data structure or algorithm would handle them correctly." Do not write: "The reflection needs to be deeper."',
  },
];

const decisionTypes: DecisionType[] = [
  {
    decision: 'VERIFIED',
    whenItApplies:
      'The submission meets the documented standard across all four dimensions. Not every dimension needs to be exceptional — each must clear the minimum threshold. A submission where two dimensions are strong and two are barely adequate may still be VERIFIED if all four clear the threshold. VERIFIED is the assessment that this student demonstrated the capability the platform is designed to verify.',
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
      'The student receives your commentary. They revise the specific identified sections and resubmit. The revised submission re-enters the peer review queue (unless your platform\'s policy skips peer review on revisions) and then the lecturer queue. You may or may not be assigned the revised submission.',
    commentaryNote:
      'REVISION_REQUIRED commentary must be actionable. The student needs to read your feedback and know exactly what to write. "The reflection needs more depth" is not actionable. "The reflection identifies the connectivity problem but does not explain what you tried before accepting the workaround, why that approach failed, or what a proper solution would require technically — address these three points specifically" is actionable.',
  },
  {
    decision: 'DENIED',
    whenItApplies:
      'The submission does not meet the standard and revision within the current project scope cannot remedy it. DENIED is appropriate when: the fundamental problem understanding is absent (not shallow — absent), the documentation is incoherent to the degree that revision cannot rescue it, or the Reflection suggests the student did not engage with the project at all. DENIED is rare. Most submissions that reach the lecturer queue after peer review have at least some substance — they just need revision.',
    whatHappens:
      'The submission does not appear in the student\'s public portfolio. The student is notified and can begin a new project engagement. The submission is preserved in the audit log. The student\'s public profile does not indicate that a DENIED decision was issued.',
    commentaryNote:
      'DENIED commentary must explain why revision cannot address the problem. "The Breakdown, Plan, and Reflection are all generic enough that they could have been written for any project brief. None of them demonstrate engagement with the specific agricultural connectivity constraints in this brief. Revision of individual sections would not address the underlying absence of project-specific reasoning — the submission requires a fresh start from the brief." This explanation helps the student understand what to do differently in their next project.',
  },
];

const trackingMetrics: TrackingMetric[] = [
  {
    metric: 'Review count',
    whatItCaptures: 'The number of reviews completed over time. A reviewer who registers and then completes no reviews in six months is visible in this metric.',
    deviationSignal: 'Absence of activity after registration. No threshold exists for minimum reviews — participation is voluntary. But low activity is visible to the platform.',
  },
  {
    metric: 'Decision distribution',
    whatItCaptures:
      'The proportion of VERIFIED, REVISION_REQUIRED, and DENIED decisions across all reviews completed. A reviewer who issues VERIFIED on every submission has a distribution of 100/0/0. A reviewer who issues DENIED on every submission has 0/0/100.',
    deviationSignal:
      'An unusually high VERIFIED rate — particularly from a reviewer who reviews quickly — suggests that reviews may not be thorough. An unusually high DENIED rate — particularly with short commentary — suggests that the reviewer may be applying a higher standard than the rubric specifies, or may not be engaging with the submissions carefully.',
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
      'How a lecturer\'s scores compare to the peer scores on the same submission. Large, consistent divergence — a lecturer who scores 4/5 on every dimension where the peer scored 2/5 — is a signal.',
    deviationSignal:
      'Consistent over-inflation relative to peer scores. This does not mean peer scores are always right — the lecturer\'s independent judgment is the point. But systematic divergence without explanation is a pattern the platform can see.',
  },
];

const limitations: Limitation[] = [
  {
    heading: 'Your verification is point-in-time',
    detail:
      'Platform administrators reviewed your credentials at the time of registration. They confirmed your credentials were consistent with your claimed position. They do not verify your current academic standing on an ongoing basis. If your institutional affiliation changes, update the platform. A verified credential associated with a position you no longer hold is a misrepresentation, even if the platform does not automatically detect it.',
  },
  {
    heading: 'The platform cannot verify your impartiality',
    detail:
      'The effectiveness tracking metrics can detect patterns of unusually consistent decisions and score distributions. They cannot detect a reviewer who carefully varies their scores to avoid detection while systematically favoring or disfavoring certain types of submissions. The platform\'s accountability mechanism is the combination of your name being on the decision and the metrics being tracked — not forensic analysis of your judgment quality.',
  },
  {
    heading: 'Commentary quality is not systematically graded',
    detail:
      'The platform enforces a 50-word minimum per dimension. It does not grade the quality of the commentary. Commentary that technically exceeds 50 words but offers no specific, actionable observation passes the length check. The professional standard for commentary is higher than the enforced minimum. A reviewer whose commentary consistently passes the length check while offering no specific observation is not violating the platform\'s rule — they are not meeting the professional standard that makes the review system meaningful.',
  },
  {
    heading: 'Your decision can affect a student\'s job search timeline',
    detail:
      'A REVISION_REQUIRED decision returns the submission to the queue. The revised submission waits for peer review (if applicable) and then for the next available lecturer. The total delay from your decision to the student\'s portfolio update may be weeks. A DENIED decision is final and requires the student to start a new project. These are consequential decisions. The commentaries you write are read by people making real plans.',
  },
  {
    heading: 'VERIFIED decisions are permanent and associated with your name',
    detail:
      'Once issued, a VERIFIED decision is recorded in the audit log and published in the student\'s portfolio. Your name and institutional affiliation appear on that entry permanently. If you later believe a decision you issued was incorrect, contact the platform. The decision cannot be unilaterally revised after the fact — the audit log is designed to be permanent.',
  },
];

const faqItems: FaqItem[] = [
  {
    question: 'What credentials do I need to register as a reviewer?',
    answer:
      'You need to be an academic staff member or industry professional with domain expertise in one of the platform\'s tracks — Agriculture, Health, Finance, or Infrastructure — and with a CS background sufficient to assess student code submissions. You submit your credentials (academic qualifications, employment or affiliation documentation) to platform administrators during registration. They review and confirm before you can access the queue.',
  },
  {
    question: 'Am I required to review a minimum number of submissions?',
    answer:
      'No minimum is enforced. Participation is voluntary. However, reviewers who register and complete no reviews are visible in the platform\'s activity data. The review system depends on active participation from the reviewer pool — a track with few active reviewers has longer queue wait times for students.',
  },
  {
    question: 'Can I review projects outside my primary area of expertise?',
    answer:
      'You are verified for specific tracks based on your credentials. You can only select submissions from tracks in which you are verified. Within your verified tracks, you can specialize informally by choosing submissions from the types of projects you are most qualified to assess — the queue shows project titles and brief descriptions before you commit to a review.',
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
    question: 'Can I see the student\'s name and institution when I review?',
    answer:
      'No. The student\'s name and institutional affiliation are hidden until after you submit your decision. You see the brief, the three documents, the code repository, and the peer score and commentary. This is a bias reduction measure — your assessment should be of the work, not of the student\'s background.',
  },
  {
    question: 'What happens if I receive a submission from a student I know?',
    answer:
      'Recuse yourself. Contact the platform to have the submission reassigned. You are responsible for identifying this situation — the platform does not structurally prevent personal relationship conflicts across institutions. If you review a submission from a student you know personally and this is later discovered, your review will be invalidated and reassigned. Do not rely on the anonymization to substitute for your professional judgment.',
  },
  {
    question: 'How long should I spend on a review?',
    answer:
      'A thorough review of three documents — typically 2,000–5,000 words of student writing — with substantive commentary on four dimensions takes 30–60 minutes for a careful reviewer. If you are completing a review in 10 minutes, you are not writing substantive commentary on four dimensions. A superficial review that passes the length check is a failure of professional standard even if it does not violate a platform rule.',
  },
  {
    question: 'What if a student disputes my decision?',
    answer:
      'The platform does not currently have a formal student appeals process. Your decision stands. Platform administrators may review a flagged decision if a student escalates. Your commentary — preserved in the audit log — is the record of your reasoning. Specific, documented commentary protects your decision against challenge. Vague commentary does not.',
  },
  {
    question: 'What happens to my account if my institutional affiliation changes?',
    answer:
      'Update the platform. Your verification is associated with the credentials you submitted. A reviewer whose listed institution no longer reflects their actual affiliation is presenting stale information to students and employers who see their name on portfolio entries. Contact the platform to submit updated credentials.',
  },
  {
    question: 'Can a student see my peer score commentary when you review?',
    answer:
      'Students do not receive the peer score commentary directly alongside your decision. The peer score and commentary are visible to you during review. The peer score appears in the published portfolio entry — the scores on four dimensions are visible to the student and to anyone viewing the portfolio. Your decision commentary is the substantive content the student receives.',
  },
  {
    question: 'What if the peer reviewer gave a very low score that I disagree with?',
    answer:
      'Your decision is independent of the peer score. The peer score informs but does not determine your judgment. If you find a submission strong despite a low peer score, VERIFIED is still the correct decision if the work meets the standard. Note in your commentary that you assessed the work independently and found it met the threshold — this is useful context for the student and for the peer reviewer who will see the outcome.',
  },
];

export default function LecturersPage(): React.ReactElement {
  return (
    <AudiencePage
      eyebrow="Education Hub · For Lecturers"
      heading="Your name on a VERIFIED decision is what makes it mean something."
      intro="This page covers what reviewer participation involves, how the four-dimension assessment works, what substantive commentary requires, how effectiveness is tracked, and what conflict-of-interest protections exist and do not exist. Read it in full before submitting your first review."
      sections={sections}
      registerHref="/auth/register?role=lecturer"
      registerLabel="Register as a reviewer"
    >
      {/* ── Why lecturers matter ── */}
      <section id="why-lecturers-matter" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Why lecturers matter
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          Without a named, credentials-confirmed reviewer, the credential is a self-report.
        </h2>
        <div className="space-y-5 font-body text-t4 text-text-secondary leading-relaxed max-w-3xl">
          <p>
            The Education Hub&apos;s portfolio system works because of a single design decision: every
            VERIFIED decision is associated with a named person whose credentials have been
            independently confirmed. An employer who reads a portfolio entry can see who reviewed
            the work, verify that person&apos;s institutional affiliation, and follow the chain back to
            your decision. That chain is what makes the credential meaningful — not the badge itself.
          </p>
          <p>
            An anonymous review creates no traceable accountability. A platform-administered score
            without a named human reviewer creates no external verification point. The value of
            the verification system flows entirely from the fact that a real, identifiable person
            made a judgment and that judgment is recorded with their name on it.
          </p>
          <p>
            This has an implication for you as a reviewer: the quality of your assessments is
            publicly associated with your name. A VERIFIED decision you issue appears on a
            student&apos;s portfolio permanently, next to your name and institution, readable by any
            employer who clicks the URL. Perfunctory reviews reflect on you. Substantive reviews
            build a track record that makes the credential worth more over time.
          </p>
          <p>
            Your institution benefits indirectly as well. A department whose faculty actively
            review submissions sees its graduates accumulate verified portfolio entries from
            external reviewers — portfolio entries that carry weight because they were assessed
            by people with no relationship to the student&apos;s institution. Faculty who review
            submissions from other institutions develop assessment skills that inform their own
            teaching.
          </p>
        </div>
      </section>

      {/* ── What you are asked to do ── */}
      <section id="what-you-are-asked-to-do" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          What you are asked to do
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          Concrete obligations before you register.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          Know what you are committing to before submitting your credentials. There is no minimum
          required number of reviews — but each review you do accept has specific standards.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden max-w-3xl mb-8">
          {[
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
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-4 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <div className="shrink-0 w-40">
                <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
                  {item.label}
                </p>
              </div>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="border border-zinc-800/50 rounded-sm p-5 max-w-3xl">
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">The professional standard: </span>
            The platform enforces a 50-word minimum. The professional standard is higher. A review
            that technically passes the length check but offers no specific observation is a failure
            of the standard that makes the credential meaningful — even if it passes the system&apos;s
            rule.
          </p>
        </div>
      </section>

      {/* ── Verification process ── */}
      <section id="verification-process" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Verification process
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          What happens between registration and accessing the review queue.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          You cannot access the review queue until your credentials are reviewed and confirmed
          by a platform administrator. There is no self-service verification path.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden max-w-3xl mb-8">
          {[
            {
              step: '1',
              actor: 'You',
              action: 'Register with your name, email, institutional affiliation, and the track(s) you are applying for.',
            },
            {
              step: '2',
              actor: 'You',
              action: 'Submit your credentials: academic qualifications relevant to your track(s) and employment or affiliation documentation confirming your current position.',
            },
            {
              step: '3',
              actor: 'Administrator',
              action: 'Reviews the submitted documents. Confirms the credentials are consistent with the claimed position. Makes a VERIFIED or REJECTED decision.',
            },
            {
              step: '4',
              actor: 'Platform',
              action: 'Notifies you of the decision. If VERIFIED, you can access the review queue for your approved tracks. If REJECTED, the notification includes the reason and you can resubmit with corrected documentation.',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-4 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <div className="shrink-0 w-24">
                <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
                  Step {item.step}
                </p>
                <p className="font-mono text-t6 text-accent-green mt-0.5">{item.actor}</p>
              </div>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.action}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 max-w-3xl">
          <div className="border border-zinc-800/50 rounded-sm p-5">
            <p className="font-body text-t5 text-text-primary font-semibold mb-1">
              What verification confirms
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed">
              That your credentials are consistent with the claimed position at the time of review.
              Your name and institutional affiliation as listed in the verified record will appear
              on every portfolio entry you produce.
            </p>
          </div>
          <div className="border border-zinc-800/50 rounded-sm p-5">
            <p className="font-body text-t5 text-text-primary font-semibold mb-1">
              What verification does not confirm
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed">
              That you are the best possible reviewer for any specific submission. That your
              assessments are free from bias. That the reviewing institution endorses the platform.
              That your credentials remain current — verification is point-in-time. If your
              affiliation changes, you are responsible for updating the platform.
            </p>
          </div>
        </div>
      </section>

      {/* ── The review queue ── */}
      <section id="the-review-queue" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          The review queue
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          What you see, what you do not see, and how assignment works.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          Submissions enter the queue after passing peer review. You select submissions to review —
          they are not assigned to you without your acceptance.
        </p>

        <div className="border-l-2 border-zinc-800/50 pl-6 space-y-8 max-w-3xl mb-8">
          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              When a submission enters the queue
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              A submission is eligible for lecturer review after a peer reviewer has completed
              their assessment. The peer score is locked before the submission enters the queue.
              The queue shows you: the project title, the track, the brief type (AI_BRIEF or
              OPEN_SOURCE), the peer score summary, and the submission date.
            </p>
          </div>

          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              What you see when you open a submission
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              The full project brief. All three student documents. The code repository link.
              The peer reviewer&apos;s score on each of the four dimensions and their written
              commentary.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed mt-3">
              <span className="font-semibold text-text-primary">What you do not see: </span>
              the student&apos;s name, institutional affiliation, or any identifying information
              until after you submit your decision. This is a bias reduction measure — your
              assessment is of the work, not the student.
            </p>
          </div>

          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              Queue depth and wait times
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              The review queue&apos;s depth at any time depends on the number of active verified
              lecturers for each track and the rate of student submissions. A track with few
              active reviewers produces longer wait times for students. This is a structural
              constraint of the volunteer reviewer model — the platform&apos;s throughput on any
              track is bounded by the number of active lecturers in that track.
            </p>
          </div>

          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              Revised submissions
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              If you issue REVISION_REQUIRED, the student revises and resubmits. The revised
              submission re-enters the queue. You may or may not be assigned the revised
              submission — assignment is not guaranteed to the original reviewer.
            </p>
          </div>
        </div>
      </section>

      {/* ── Four dimensions ── */}
      <section id="four-dimensions" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          The four dimensions
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          What each dimension measures, what evidence looks like at each extreme, and what
          substantive commentary requires.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          All four dimensions apply the same 1–5 scale. Peer reviewers and lecturers use the
          same rubric. Your score on each dimension should be accompanied by commentary specific
          enough that a student reading it knows exactly what to change.
        </p>

        <div className="space-y-4">
          {reviewDimensions.map((dim, i) => (
            <div key={i} className="border border-zinc-800/50 rounded-sm overflow-hidden">
              <div className="bg-surface-elevated px-5 py-4 border-b border-zinc-800/50">
                <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
                  Dimension {i + 1}
                </p>
                <p className="font-heading text-t3 font-semibold text-text-primary">{dim.label}</p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
                    What it measures
                  </p>
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">
                    {dim.whatItMeasures}
                  </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="bg-surface-secondary border border-zinc-800/50 rounded-sm p-4">
                    <p className="font-mono text-t6 text-accent-green uppercase tracking-widest mb-2">
                      Strong evidence
                    </p>
                    <p className="font-body text-t5 text-text-secondary leading-relaxed">
                      {dim.strongEvidence}
                    </p>
                  </div>
                  <div className="bg-surface-secondary border border-zinc-800/50 rounded-sm p-4">
                    <p className="font-mono text-t6 text-red-400 uppercase tracking-widest mb-2">
                      Weak evidence
                    </p>
                    <p className="font-body text-t5 text-text-secondary leading-relaxed">
                      {dim.weakEvidence}
                    </p>
                  </div>
                </div>
                <div className="border-l-2 border-zinc-800/50 pl-4">
                  <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
                    Commentary guidance
                  </p>
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">
                    {dim.commentaryGuidance}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Three decisions ── */}
      <section id="three-decisions" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          The three decisions
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          When each decision applies and what follows from it.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          All three decisions are permanent as issued. Commentary is required for all three —
          including VERIFIED. A student who receives VERIFIED with no commentary learns nothing
          and has a weaker portfolio entry than one who received specific positive assessment.
        </p>

        <div className="space-y-4">
          {decisionTypes.map((dt) => (
            <div key={dt.decision} className="border border-zinc-800/50 rounded-sm overflow-hidden">
              <div className="bg-surface-elevated px-5 py-3 border-b border-zinc-800/50 flex items-center gap-3">
                <span
                  className={`font-mono text-t6 uppercase tracking-widest ${
                    dt.decision === 'VERIFIED'
                      ? 'text-accent-green'
                      : dt.decision === 'REVISION_REQUIRED'
                        ? 'text-amber-400'
                        : 'text-red-400'
                  }`}
                >
                  {dt.decision}
                </span>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
                    When it applies
                  </p>
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">
                    {dt.whenItApplies}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
                    What happens
                  </p>
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">
                    {dt.whatHappens}
                  </p>
                </div>
                <div className="border-l-2 border-zinc-800/50 pl-4">
                  <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-1">
                    Commentary note
                  </p>
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">
                    {dt.commentaryNote}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── A real review ── */}
      <section id="a-real-review" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          A real review
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          What the review process looks like from the reviewer&apos;s side.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          This scenario traces a single review from queue selection to decision — including what
          the reviewer sees, how they weigh the peer score, and what their commentary says.
        </p>

        <div className="border-l-2 border-zinc-800/50 pl-6 space-y-8 max-w-3xl">
          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              Starting state
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              Dr. Wachira is a CS lecturer at a Kenyan university. She is verified in the
              Agriculture and Health tracks. She opens the review queue. She sees three submissions
              awaiting review in the Agriculture track. She selects one: an AI_BRIEF project
              on a crop health observation tool for smallholder farmers, submitted five days ago,
              peer score 3.5/5.0.
            </p>
          </div>

          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              Reading the brief
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              She reads the generated brief first. She notes the specific constraint: the tool must
              function with intermittent connectivity. This is the constraint that determines whether
              the student understood the hardest part of the problem.
            </p>
          </div>

          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              Reading the documents
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              The Problem Breakdown is strong. The student identified three alternative data
              architectures and rejected two with technical reasoning. She notes this.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed mt-3">
              The Approach Plan is adequate. The milestones are specific enough. The testing
              methodology section is sparse — the student states they will &quot;test the offline
              functionality&quot; without describing how.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed mt-3">
              The Reflection describes the connectivity workaround. The student acknowledges the
              limitation but does not explain what they tried before accepting it, why it failed,
              or what a proper solution would require. The peer reviewer gave 2.5/5 on this
              dimension with the comment: &quot;The reflection identifies what didn&apos;t work but doesn&apos;t
              explain why.&quot; Dr. Wachira agrees.
            </p>
          </div>

          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              The decision
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              She scores: Clarity 4/5, Methodology 3/5, Documentation 3.5/5, Reflection 2/5.
              She issues REVISION_REQUIRED. Her commentary on the Reflection dimension (72 words):
            </p>
            <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm p-4 mt-3">
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
                Reviewer commentary · Reflection depth
              </p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed italic">
                &quot;Your Problem Breakdown is the strongest part of this submission — the alternative
                approach analysis is unusually thorough. Your Reflection correctly identifies the
                offline-sync limitation. The Approach Plan needs more specificity in the testing
                section: how did you plan to verify that the connectivity handling worked before
                implementation? Please revise the Plan document to address this gap specifically.&quot;
              </p>
            </div>
          </div>

          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              What followed
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              The student received the REVISION_REQUIRED decision with the commentary. They revised
              the Approach Plan to add a specific testing methodology for the connectivity scenario.
              The revised submission entered the queue. Dr. Wachira was not assigned the second
              review. A different lecturer in the Agriculture track assessed the revised submission
              and issued VERIFIED.
            </p>
            <p className="font-body text-t4 text-text-disabled leading-relaxed mt-3">
              The student&apos;s portfolio entry credited Dr. Wachira&apos;s original REVISION_REQUIRED
              decision as part of the audit trail visible in the verification record — the path
              through revision is preserved, not hidden.
            </p>
          </div>
        </div>
      </section>

      {/* ── Effectiveness tracking ── */}
      <section id="effectiveness-tracking" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Effectiveness tracking
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          What the platform tracks about your reviews and what deviation looks like.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          Effectiveness tracking exists because the review system&apos;s credibility depends on the
          assessments being genuine. This is not a disciplinary mechanism — it is the accountability
          structure that makes the credential trustworthy to employers.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden mb-6">
          {trackingMetrics.map((m, i) => (
            <div
              key={i}
              className="flex items-start gap-4 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <div className="shrink-0 w-48">
                <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
                  {m.metric}
                </p>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  {m.whatItCaptures}
                </p>
                <p className="font-body text-t5 text-text-disabled leading-relaxed pl-3 border-l border-zinc-800/50">
                  <span className="text-text-disabled font-mono text-t6 uppercase tracking-widest mr-1">
                    Deviation signal:
                  </span>
                  {m.deviationSignal}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-zinc-800/50 rounded-sm p-5 max-w-3xl">
          <p className="font-body text-t5 text-text-primary font-semibold mb-1">
            What happens when deviation is detected
          </p>
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            Platform administrators review the case. Deviation triggers a review, not automatic
            action. A reviewer whose pattern suggests superficial engagement may be contacted by
            the platform and asked to explain their approach. In persistent cases, review access
            may be restricted. The goal is accurate assessments — the tracking exists to protect
            the credential quality, not to penalize reviewers for independent judgment.
          </p>
        </div>
      </section>

      {/* ── Conflict of interest ── */}
      <section id="conflict-of-interest" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Conflict of interest
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          What the platform enforces structurally and what remains your professional responsibility.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-zinc-800/50 mb-8">
          <div className="bg-surface-primary p-6">
            <p className="font-mono text-t6 text-accent-green uppercase tracking-widest mb-4">
              Structurally enforced
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed mb-3">
              The platform prevents you from reviewing submissions from students at your own
              institution. This is enforced at the assignment level — submissions from students
              registered with the same institution as you will not appear in your queue.
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed">
              Student names and institutional affiliations are also hidden from you until after
              you submit your decision. This is a partial bias reduction measure — you assess
              the work without knowing who produced it.
            </p>
          </div>
          <div className="bg-surface-primary p-6">
            <p className="font-mono text-t6 text-amber-400 uppercase tracking-widest mb-4">
              Self-policed
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed mb-3">
              Personal relationship conflicts — knowing a student personally, regardless of
              institutional affiliation — are not structurally enforced. The platform cannot
              detect whether you know a student from outside your institution. This is your
              professional responsibility.
            </p>
            <p className="font-body text-t5 text-text-secondary leading-relaxed">
              If you open a submission and recognize the work or writing style as someone you
              know personally: recuse yourself. Contact the platform to have the submission
              reassigned. Do not proceed.
            </p>
          </div>
        </div>

        <div className="border border-zinc-800/50 rounded-sm p-5 max-w-3xl">
          <p className="font-body text-t5 text-text-primary font-semibold mb-1">
            Why this is disclosed
          </p>
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            An accurate picture of what the platform enforces and what it cannot enforce is more
            trustworthy than a claim of comprehensive conflict-of-interest prevention. Personal
            relationship conflicts across institutions are a real risk in a small academic
            community. The platform&apos;s structural protections reduce the risk; professional judgment
            closes the gap the structure cannot reach. Both matter.
          </p>
        </div>
      </section>

      {/* ── Limitations ── */}
      <section id="limitations" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Limitations
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          What the platform cannot tell you and what you cannot undo.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          These limitations are real. Know them before you submit your first review.
        </p>
        <div className="space-y-3">
          {limitations.map((item) => (
            <div key={item.heading} className="border border-zinc-800/50 rounded-sm p-5">
              <p className="font-body text-t4 font-semibold text-text-primary mb-2">
                {item.heading}
              </p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          FAQ
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-8">
          Questions reviewers ask.
        </h2>
        <FaqAccordion items={faqItems} />
      </section>

      {/* ── Next steps ── */}
      <section id="next-steps" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          What to do next
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-8">
          If you want to register as a reviewer.
        </h2>
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden max-w-2xl">
          {[
            {
              n: '1',
              action: 'Register a lecturer account.',
              detail:
                'Use the registration link on this page. Select the track(s) you are applying for: Agriculture, Health, Finance, or Infrastructure.',
            },
            {
              n: '2',
              action: 'Submit your credentials.',
              detail:
                'Your academic qualifications relevant to the selected tracks and your employment or affiliation documentation. The format does not need to be formal — a scanned letter, a PDF of your contract, or an institutional ID with supporting documentation is sufficient.',
            },
            {
              n: '3',
              action: 'Await administrator review.',
              detail:
                'A platform administrator will review your submitted credentials. You will be notified of the decision by email. If your application is rejected, the notification includes the reason and you can resubmit with corrected documentation.',
            },
            {
              n: '4',
              action: 'Access the queue and begin reviewing.',
              detail:
                'Once verified, you can access the review queue for your approved tracks. Select submissions at your own pace. There is no minimum required.',
            },
          ].map((item) => (
            <div
              key={item.n}
              className="flex items-start gap-4 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <span className="font-mono text-t6 text-text-disabled shrink-0 mt-0.5 w-4">
                {item.n}.
              </span>
              <div>
                <p className="font-body text-t5 font-semibold text-text-primary mb-1">
                  {item.action}
                </p>
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AudiencePage>
  );
}
