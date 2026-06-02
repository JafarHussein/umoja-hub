import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EduHubPage } from '@/components/website/EduHubPage';
import { LimitationPanel } from '@/components/website/LimitationPanel';
import { FaqItem } from '@/components/website/FaqItem';
import type { AnchorSection } from '@/components/website/SectionAnchor';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'For Institutions — UmojaHub Education Hub',
  description:
    'How universities and colleges relate to the Education Hub: individual faculty as verified reviewers, student participation independent of institutional permission, what the institution cannot control, and what accumulates over time.',
};

const SECTIONS: AnchorSection[] = [
  { id: 'why-institutions-matter', label: 'Why institutions matter' },
  { id: 'how-participation-works', label: 'How participation works' },
  { id: 'student-participation', label: 'Student participation' },
  { id: 'what-institutions-do-not-control', label: 'What you do not control' },
  { id: 'what-accumulates', label: 'What accumulates over time' },
  { id: 'a-real-scenario', label: 'A real scenario' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'faq', label: 'FAQ' },
  { id: 'how-to-engage', label: 'How to engage' },
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

interface FacultyStep {
  readonly step: string;
  readonly actor: string;
  readonly action: string;
  readonly note: string | null;
}

const FACULTY_STEPS: readonly FacultyStep[] = [
  {
    step: '1',
    actor: 'Faculty member',
    action:
      'Registers an individual account. Selects one or more tracks to apply for: Agriculture, Health, Finance, or Infrastructure. No institutional sign-up, no institutional permission required.',
    note: null,
  },
  {
    step: '2',
    actor: 'Faculty member',
    action:
      'Submits credentials: academic qualifications relevant to the selected track(s) and current employment or affiliation documentation. The format does not need to be formal — a scanned letter, PDF of a contract, or an institutional ID with supporting documentation is sufficient.',
    note: null,
  },
  {
    step: '3',
    actor: 'Administrator',
    action:
      'Reviews the submitted documents. Confirms the credentials are consistent with the claimed position. Makes a VERIFIED or REJECTED decision. If REJECTED, the notification explains the reason and the faculty member can resubmit with corrected documentation.',
    note: 'Administrators perform a document consistency check. They do not contact your institution to confirm current employment unless the submitted documentation is unclear or ambiguous.',
  },
  {
    step: '4',
    actor: 'Faculty member',
    action:
      'Once verified, accesses the review queue for approved tracks. Selects submissions to review at their own pace — assignment is not forced. Reviews submissions from students at other institutions only. The system structurally prevents reviewing submissions from students at their own institution.',
    note: null,
  },
];

const INSTITUTION_CONTRIBUTES = [
  {
    label: 'Reviewer capacity',
    detail:
      'Each verified faculty member is one additional reviewer in the pool for their tracks. A track with more active reviewers has shorter queue wait times for students submitting in that track. An institution with several active verified faculty members contributes meaningfully to the system capacity.',
  },
  {
    label: 'Assessment quality',
    detail:
      "Faculty members who review submissions carefully — writing specific, substantive commentary on each of the four dimensions — raise the quality of feedback students receive. Their commentary is preserved in the audit log and appears in the student's portfolio entry. The quality of a VERIFIED decision is partly determined by the depth of the commentary behind it.",
  },
  {
    label: "Graduates' verified track record",
    detail:
      "When graduates of an institution consistently produce VERIFIED portfolio entries, a visible track record accumulates over time. This track record is a byproduct of public portfolios — not a managed institutional profile. An employer who has hired several graduates from the same institution and finds their portfolio entries consistently strong draws their own conclusions. The platform does not manufacture or manage this reputation.",
  },
] as const;

const WHAT_YOU_DO_NOT_CONTROL = [
  {
    item: "Who reviews your students' submissions",
    explanation:
      'Reviewer assignment is determined by the platform based on track availability and conflict of interest rules. No institution can request a specific reviewer or prevent a specific reviewer from being assigned.',
  },
  {
    item: "The rubric applied to your students' submissions",
    explanation:
      'The four-dimension rubric — clarity of problem understanding, methodology appropriateness, documentation quality, and reflection depth — is fixed. It does not adapt to institutional teaching context, institutional standards, or course-level expectations.',
  },
  {
    item: 'Whether any specific student receives VERIFIED, REVISION_REQUIRED, or DENIED',
    explanation:
      "The outcome of each review is the assigned reviewer's independent judgment. VERIFIED means the submission met the standard. DENIED means it did not. No institutional relationship influences this decision.",
  },
  {
    item: 'Which students from your institution participate',
    explanation:
      "Students register and participate as individuals. You cannot register students on their behalf, require them to participate, or exclude them from participating. Participation is entirely the individual student's decision.",
  },
  {
    item: "How your institution's graduates are perceived by employers",
    explanation:
      "Employer perceptions form based on what they read in portfolio entries — the documents, the reviewer's commentary, the quality of the reflection. The platform does not manage, amplify, or suppress any signal about any institution.",
  },
] as const;

const LIMITATIONS = [
  {
    heading: 'No institutional visibility into student participation',
    detail:
      "The platform does not share student participation data with institutions. A department head cannot query how many of their students are using the Education Hub, which track they chose, or whether any are currently in the review queue. Students participate as individuals with no institutional data linkage that the platform makes available externally. If an institution wants to understand student participation, they need to ask their students directly.",
  },
  {
    heading: 'No formal institutional partnership currently exists',
    detail:
      'There is no institutional partnership agreement the platform currently offers. Individual faculty verification is the only formal engagement path. For organizations that require a formal institutional framework before faculty participation, the platform does not currently provide this. Contact the platform to discuss your specific situation — the product team may be able to accommodate particular institutional requirements.',
  },
  {
    heading: 'Faculty verification is point-in-time',
    detail:
      "When a faculty member is verified, the platform confirms their credentials as of the date of administrator review. The platform does not monitor ongoing employment status. If a faculty member's institutional affiliation changes or they leave the institution, they are responsible for updating the platform. A verified credential associated with a position no longer held is a misrepresentation even if the platform does not automatically detect it.",
  },
  {
    heading: "The institution's standing in the system is a byproduct, not a managed metric",
    detail:
      "There is no institutional score, institutional tier, or institutional ranking on the platform. An institution's standing is an indirect consequence of how its graduates' portfolio entries are perceived by employers who read them. The platform has no mechanism by which an institution can improve or manage its standing directly — it accumulates through genuine student performance on actual projects reviewed by external faculty.",
  },
  {
    heading: 'Your faculty review students from other institutions, not your own',
    detail:
      "Faculty who register from your institution will not see your own students in their queue. The conflict of interest protection routes your students to reviewers from other institutions. This is structural enforcement, not a matter of judgment. If your faculty are primarily motivated by wanting to assess their own students more formally, the platform does not serve that purpose — it is designed specifically to separate institutional affiliation from reviewer assignment.",
  },
] as const;

const FAQ_ITEMS = [
  {
    question: 'Does our institution need to sign up or register to participate?',
    answer:
      'No. There is no institutional account or institutional registration. Individual faculty members register their own accounts. The institution has no formal presence on the platform — only individual verified faculty members do.',
  },
  {
    question: 'Do our students need institutional permission or endorsement to participate?',
    answer:
      'No. Students register individually and participate as individuals. The platform does not require or request institutional permission. A student at any Kenyan university can register and submit projects without any involvement from their institution.',
  },
  {
    question: 'Can our faculty review submissions from our own students?',
    answer:
      "No. The platform's conflict of interest system prevents faculty from reviewing submissions from students at their own institution. This is enforced at the assignment level — submissions from students registered with the same institution as a faculty reviewer will not appear in that reviewer's queue.",
  },
  {
    question: 'How would we know which of our students are participating?',
    answer:
      "You would not know through the platform. The platform does not provide institutional participation reports. Students' participation is their own individual activity. If you want to understand how many of your students are using the Education Hub, you would need to ask them directly or include it in a program survey.",
  },
  {
    question: 'What tracks are available for our faculty?',
    answer:
      'The current tracks are Agriculture, Health, Finance, and Infrastructure. Faculty apply for the tracks in which they have relevant domain expertise and a CS background sufficient to assess student code and documentation. A faculty member with expertise across multiple areas can apply for multiple tracks simultaneously.',
  },
  {
    question: 'How long does faculty verification take?',
    answer:
      'Verification time depends on the current administrator review queue. The typical review time is several business days. Faculty who submit clear, complete documentation are reviewed faster. There is no expedited path. Faculty receive email notification when the decision is made.',
  },
  {
    question: 'Is there compensation for faculty who participate as reviewers?',
    answer:
      'The current platform version does not offer monetary compensation. Faculty participate as professional contributors. If a compensation model is introduced in the future, registered reviewers will be notified. This is a relevant factor for departments considering how to support and recognize faculty participation.',
  },
  {
    question: "What happens to our graduates' portfolios after they leave our institution?",
    answer:
      "Portfolios are permanent and publicly accessible via URL regardless of the student's current enrollment status. Graduation does not affect portfolio access or visibility. A verified portfolio entry's audit trail — reviewer name and affiliation, decision date, document hash — remains permanently associated with the entry.",
  },
  {
    question: 'Can we formally promote or endorse the Education Hub credential in our program materials?',
    answer:
      'You can mention the Education Hub as a resource available to students in your program materials. The platform does not currently offer a formal co-branding or institutional endorsement program. If you want to discuss formal collaboration arrangements, contact the platform.',
  },
  {
    question: 'Can we access data about our institution for accreditation or program assessment purposes?',
    answer:
      "The platform does not produce formal institutional reporting. Individual students' verified portfolio entries are publicly accessible — each student could choose to share their portfolio data with their institution. If you need aggregate participation data from students at your institution for accreditation or program evaluation purposes, contact the platform to discuss what may be accessible.",
  },
] as const;

const ENGAGE_STEPS = [
  {
    n: '01',
    action: 'Interested faculty register individually.',
    detail:
      'Any faculty member who has relevant domain expertise and a CS background can register for the track(s) they are qualified for. No institutional action is required.',
    link: { label: 'Read the For Lecturers page', href: '/for/lecturers' },
  },
  {
    n: '02',
    action: 'Mention the Education Hub to students as a resource.',
    detail:
      'Students who want a verified record of their project work can register individually. You can include the Education Hub in program orientation materials or a final-year project brief as an option students may choose to pursue — not as an institutional requirement.',
    link: { label: 'Read the For Students page', href: '/for/students' },
  },
  {
    n: '03',
    action: 'Contact the platform to discuss institutional engagement.',
    detail:
      'If your institution has specific requirements for formal participation — data agreements, formal recognition, or other arrangements — contact the platform to discuss your situation. The product team may be able to accommodate particular requirements.',
    link: null as { label: string; href: string } | null,
  },
] as const;

export default function InstitutionsPage(): React.ReactElement {
  return (
    <EduHubPage
      audience="For Institutions"
      heading="Your institution cannot register as a partner. Your faculty can. Here is what that means."
      intro="This page explains how universities and colleges relate to the Education Hub: how individual faculty become verified reviewers, how students participate independently of their institution, what the institution cannot control in the review system, and what accumulates over time as your graduates and faculty engage."
      sections={SECTIONS}
      registerHref="/contact?subject=institution-engagement"
      registerLabel="Contact us about institutional engagement"
    >
      {/* ── Why institutions matter ── */}
      <section id="why-institutions-matter" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Why institutions matter</SectionLabel>
        <SectionH2>
          The Education Hub&apos;s verification capacity depends on the reviewer pool. That pool is made
          of individual verified faculty — not institutional agreements.
        </SectionH2>
        <div className="space-y-5 mb-8 max-w-3xl">
          <Body>
            Every VERIFIED portfolio entry is associated with a named, credentials-confirmed reviewer.
            That reviewer is a faculty member or industry professional who registered individually,
            submitted their credentials, and was reviewed by a platform administrator. The institution
            that employs them appears on the portfolio entry — not as a partner, but as the reviewer&apos;s
            affiliation at the time of their review.
          </Body>
          <Body>
            An institution with no verified faculty members on the platform still has students who can
            participate — those students are reviewed by faculty from other institutions. An
            institution with several active verified faculty members contributes capacity to the system
            and produces a body of reviews associated with their name. Over time, as their graduates
            accumulate verified portfolio entries from external reviewers, a visible track record
            forms.
          </Body>
          <Body>
            That track record is not managed or manufactured. There is no institutional profile to
            curate, no institutional score, no institutional tier. What accumulates is a public record
            of what your graduates built, how they documented it, and how external reviewers assessed
            it — permanently readable by any employer who clicks a portfolio URL.
          </Body>
        </div>

        <div className="space-y-3 max-w-3xl">
          {INSTITUTION_CONTRIBUTES.map((item) => (
            <div key={item.label} className="border border-ws-border-light p-5">
              <p className="font-display text-ws-subsection text-ws-text-primary mb-2">
                {item.label}
              </p>
              <p className="font-geist text-ws-body text-ws-text-secondary">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How participation works ── */}
      <section id="how-participation-works" className="py-12 border-b border-ws-border-light">
        <SectionLabel>How participation works</SectionLabel>
        <SectionH2>
          Individual faculty register, submit credentials, and are verified — without any
          institutional action required.
        </SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          There is no institutional account, no MOU, no institutional onboarding process. If a
          faculty member at your institution wants to become a verified reviewer, here is what they
          do:
        </p>

        <div className="bg-ws-surface-raised border border-ws-border-light overflow-hidden max-w-3xl mb-8">
          {FACULTY_STEPS.map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-4 px-5 py-5 border-b border-ws-border-light last:border-0"
            >
              <div className="shrink-0 w-24">
                <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase">
                  Step {item.step}
                </p>
                <p className="font-geist-mono text-ws-caption text-ws-hub-blue mt-0.5">
                  {item.actor}
                </p>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-geist text-ws-body text-ws-text-secondary">{item.action}</p>
                {item.note !== null && (
                  <p className="font-geist text-ws-body-sm text-ws-text-tertiary pl-3 border-l border-ws-border-light">
                    {item.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-3xl">
          <div className="border border-ws-border-light p-5">
            <p className="font-display text-ws-subsection text-ws-text-primary mb-2">
              What verification confirms
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary">
              That the faculty member&apos;s credentials are consistent with the claimed position at the
              time of review. Their name and institutional affiliation as listed in the verified
              record will appear on every portfolio entry they produce.
            </p>
          </div>
          <div className="border border-ws-border-light p-5">
            <p className="font-display text-ws-subsection text-ws-text-primary mb-2">
              What verification does not confirm
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary">
              That the institution endorses the platform. That the reviewer&apos;s credentials remain
              current beyond the date of review. That the reviewing institution approves of or is
              aware of their faculty member&apos;s participation. Participation is entirely the individual
              faculty member&apos;s decision.
            </p>
          </div>
        </div>
      </section>

      {/* ── Student participation ── */}
      <section id="student-participation" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Student participation</SectionLabel>
        <SectionH2>
          Students participate independently. Their institution&apos;s faculty cannot review their
          submissions.
        </SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          Two things are true simultaneously: students do not need institutional permission to
          participate, and students at your institution will not be reviewed by your own faculty. Both
          are by design.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-ws-border-light mb-6">
          <div className="bg-ws-surface-base p-6">
            <p className="font-geist-mono text-ws-caption text-ws-hub-blue uppercase mb-4">
              Student independence
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary mb-3">
              Any student at any Kenyan university can register on the Education Hub and submit
              projects. No institutional permission is required. No institutional email address is
              required. The platform does not notify institutions when their students register.
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary">
              Students select their own track, receive their own brief, produce their own documents,
              and submit for review — independently of any institutional process. The verified
              portfolio entry they earn is their own individual credential, not an institutional
              credential.
            </p>
          </div>
          <div className="bg-ws-surface-base p-6">
            <p className="font-geist-mono text-ws-caption text-ws-status-pending uppercase mb-4">
              Conflict of interest protection
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary mb-3">
              Students at your institution are reviewed by faculty from other institutions. The
              system enforces this at the assignment level — a reviewer from your institution will
              never see a submission from a student registered with your institution in their queue.
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary">
              This means: a VERIFIED decision received by a student at your institution was issued by
              a reviewer who has no relationship to your institution. It was not influenced by
              institutional relationships, familiarity with the student, or knowledge of the
              institution&apos;s teaching context.
            </p>
          </div>
        </div>

        <div className="border border-ws-border-light p-5 max-w-3xl">
          <p className="font-display text-ws-subsection text-ws-text-primary mb-1">
            Why this matters for how you read a VERIFIED decision
          </p>
          <p className="font-geist text-ws-body text-ws-text-secondary">
            A student who receives VERIFIED did so through external review — not internal review by
            people familiar with the student, the course context, or your institution&apos;s assessment
            culture. The credential is independent because the reviewer is independent. This is the
            design choice that makes the credential meaningful across institutional boundaries.
          </p>
        </div>
      </section>

      {/* ── What institutions do not control ── */}
      <section
        id="what-institutions-do-not-control"
        className="py-12 border-b border-ws-border-light"
      >
        <SectionLabel>What you do not control</SectionLabel>
        <SectionH2>
          The outcomes of the review system are not available for institutional influence. This is
          the most important transparency disclosure on this page.
        </SectionH2>

        <div className="space-y-3 max-w-3xl mb-6">
          {WHAT_YOU_DO_NOT_CONTROL.map((row) => (
            <div key={row.item} className="border border-ws-border-light overflow-hidden">
              <div className="bg-ws-surface-raised px-5 py-3 border-b border-ws-border-light">
                <p className="font-display text-ws-subsection text-ws-text-primary">{row.item}</p>
              </div>
              <div className="px-5 py-4">
                <p className="font-geist text-ws-body text-ws-text-secondary">{row.explanation}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-ws-border-light p-5 max-w-3xl">
          <p className="font-display text-ws-subsection text-ws-text-primary mb-1">
            What an institution can do
          </p>
          <p className="font-geist text-ws-body text-ws-text-secondary">
            Encourage interested faculty to register as reviewers. Mention the Education Hub in
            program orientation materials as a resource for students. Incorporate the platform&apos;s
            three-document framework into how you prepare students for independent project work —
            problem breakdown, approach planning, and honest reflection are skills that improve any
            submission. None of these actions require formal institutional engagement with the
            platform.
          </p>
        </div>
      </section>

      {/* ── What accumulates over time ── */}
      <section id="what-accumulates" className="py-12 border-b border-ws-border-light">
        <SectionLabel>What accumulates over time</SectionLabel>
        <SectionH2>
          Two things build gradually: a visible graduate track record and better-prepared faculty
          assessors.
        </SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          Neither is the result of institutional action. Both are byproducts of genuine participation
          — students submitting real projects, faculty reviewing real submissions.
        </p>

        <div className="border-l-2 border-ws-border-medium pl-6 space-y-10 max-w-3xl">
          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3">
              The graduate track record
            </p>
            <div className="space-y-4">
              <Body>
                Every verified portfolio entry is permanently public. An employer who has hired
                multiple graduates from the same institution over several years has read multiple
                portfolio entries from students at that institution. The quality of those entries —
                the depth of the Reflection documents, the coherence of the Breakdown and Plan, the
                specificity of the reviewer&apos;s commentary — accumulates into an impression that no
                institutional marketing can substitute for.
              </Body>
              <Body>
                An institution whose graduates consistently produce strong verified portfolios builds
                a real signal over time. An institution whose graduates consistently receive
                REVISION_REQUIRED or do not participate builds a different signal — or no signal.
                The platform does not aggregate this or report it — employers draw their own
                conclusions from reading individual entries.
              </Body>
            </div>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3">
              The teaching feedback loop
            </p>
            <div className="space-y-4">
              <Body>
                A faculty member who has reviewed forty Reflection documents from students at other
                institutions develops a precise understanding of what strong professional
                self-assessment looks like — and what the gap between adequate and weak looks like at
                every point on the scale. This is assessment experience that is difficult to build any
                other way.
              </Body>
              <Body>
                Most CS curricula teach students what to build, not how to reflect on what they
                built. The Reflection document — which the review rubric treats as the most
                significant of the three — asks students to document failures honestly, explain what
                they tried before accepting a workaround, and propose what a proper solution would
                require. A faculty member who has reviewed dozens of these documents understands
                exactly what that standard requires, which they can communicate to their own students
                before they submit.
              </Body>
            </div>
          </div>
        </div>
      </section>

      {/* ── A real scenario ── */}
      <section id="a-real-scenario" className="py-12 border-b border-ws-border-light">
        <SectionLabel>A real scenario</SectionLabel>
        <SectionH2>
          How a department head encounters the Education Hub and what they learn about their options.
        </SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          This scenario traces how institutional engagement typically begins — not with a formal
          outreach, but with a department head finding out that their students are already
          participating.
        </p>

        <div className="border-l-2 border-ws-border-medium pl-6 space-y-8 max-w-3xl">
          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Starting state
            </p>
            <Body>
              A head of the CS department at a Kenyan polytechnic receives a message from a hiring
              manager at a Nairobi software company. The hiring manager has interviewed a recent
              graduate and was impressed by their UmojaHub portfolio entry — specifically, the Final
              Reflection document, which described a technical failure and what the student would have
              done differently. The hiring manager asks whether the polytechnic formally partners with
              UmojaHub.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              What the department head investigates
            </p>
            <Body>
              The department head reads this page. They learn: there is no institutional partnership.
              The graduate participated independently. The reviewer who issued VERIFIED was a faculty
              member from a different institution. The polytechnic was not involved in any part of the
              process.
            </Body>
            <div className="mt-3">
              <Body>
                They ask their final-year students how many are using the Education Hub. Of 38
                students, six are currently engaged with projects. Three have already received VERIFIED
                decisions. Two are in the review queue. One is revising in response to a
                REVISION_REQUIRED decision.
              </Body>
            </div>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              What the department head learns about their options
            </p>
            <Body>
              Two faculty members in the department have credentials that would qualify them as
              verified reviewers: one in the Agriculture track, one in the Health track. Those faculty
              members cannot review submissions from the polytechnic&apos;s own students — but they can
              review submissions from students at other institutions. This contributes reviewer
              capacity to the system and allows their faculty to develop assessment experience.
            </Body>
            <div className="mt-3">
              <Body>
                The department head can mention the Education Hub in the final-year project
                orientation as a resource — not as a required step, but as an option for students who
                want a verified record of their project work. No formal partnership is required for
                this.
              </Body>
            </div>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              What the department head cannot do
            </p>
            <Body>
              They cannot create an institutional account. They cannot nominate students for
              participation. They cannot request that their graduates&apos; portfolios be highlighted. They
              cannot see aggregate data about how many of their students are participating. They cannot
              influence the review decisions their students receive.
            </Body>
            <div className="mt-3">
              <p className="font-geist text-ws-body-lg text-ws-text-tertiary leading-[1.7]">
                The verified portfolio entries that exist belong to the individual graduates who earned
                them. The polytechnic&apos;s connection to those entries is their graduates&apos; names and
                the reviewer&apos;s affiliation — which, in this case, is a different institution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Limitations ── */}
      <section id="limitations" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Limitations</SectionLabel>
        <SectionH2>What the platform cannot provide to institutions.</SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          These limitations are real. Know them before encouraging faculty or student engagement.
        </p>
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
        <SectionH2>Questions from university administrators and department heads.</SectionH2>
        <div className="divide-y divide-ws-border-light border-y border-ws-border-light">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </section>

      {/* ── How to engage ── */}
      <section id="how-to-engage" className="py-12">
        <SectionLabel>How to engage</SectionLabel>
        <SectionH2>Three paths, none of which require an institutional agreement.</SectionH2>

        <div className="bg-ws-surface-raised border border-ws-border-light overflow-hidden max-w-2xl mb-6">
          {ENGAGE_STEPS.map((item) => (
            <div
              key={item.n}
              className="flex items-start gap-4 px-5 py-5 border-b border-ws-border-light last:border-0"
            >
              <span className="font-geist-mono text-ws-caption text-ws-hub-blue shrink-0 mt-0.5 w-6">
                {item.n}.
              </span>
              <div>
                <p className="font-display text-ws-subsection text-ws-text-primary mb-1">
                  {item.action}
                </p>
                <p className="font-geist text-ws-body text-ws-text-secondary mb-2">{item.detail}</p>
                {item.link !== null && (
                  <Link
                    href={item.link.href}
                    className="font-geist text-ws-body text-ws-text-tertiary hover:text-ws-text-secondary transition-colors duration-150 underline underline-offset-2"
                  >
                    {item.link.label} →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border border-ws-border-light p-5 max-w-2xl">
          <p className="font-geist text-ws-body text-ws-text-secondary">
            <span className="font-semibold text-ws-text-primary">If formal engagement matters: </span>
            Contact the platform with your institution&apos;s specific requirements. The product team
            reviews institutional requests and may be able to accommodate specific data, recognition,
            or partnership arrangements — but there is no standard program available on a self-service
            basis.
          </p>
        </div>
      </section>
    </EduHubPage>
  );
}
