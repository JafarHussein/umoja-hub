import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EduHubPage } from '@/components/website/EduHubPage';
import { LimitationPanel } from '@/components/website/LimitationPanel';
import { FaqItem } from '@/components/website/FaqItem';
import type { AnchorSection } from '@/components/website/SectionAnchor';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'For Students — UmojaHub Education Hub',
  description:
    'What the Education Hub requires, how the review process works, what VERIFIED means and what it does not, and what a completed portfolio entry shows employers. A complete guide before registering.',
};

const SECTIONS: AnchorSection[] = [
  { id: 'the-problem', label: 'The problem' },
  { id: 'why-existing-fail', label: 'Why existing tools fail' },
  { id: 'how-it-responds', label: 'How UmojaHub responds' },
  { id: 'the-two-tracks', label: 'The two tracks' },
  { id: 'the-three-documents', label: 'The three documents' },
  { id: 'project-guidance-tool', label: 'Project Guidance Tool' },
  { id: 'real-scenario', label: 'A real scenario' },
  { id: 'complete-workflow', label: 'The complete workflow' },
  { id: 'responsibilities', label: 'Responsibilities' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'faq', label: 'FAQ' },
  { id: 'misconceptions', label: 'Misconceptions' },
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

const EXISTING_TOOLS = [
  {
    name: 'CV / Resume',
    provides: 'A formatted summary of claimed experience, skills, and projects.',
    fails:
      "Every claim is self-asserted. No independent reviewer exists. Employers who have interviewed candidates who could not explain work listed on their CVs have learned to treat CVs as aspirational documents — and discount them accordingly. The discount is larger for students from smaller institutions, where the institutional name does not partially substitute for the individual claim.",
  },
  {
    name: 'GitHub Portfolio',
    provides: 'A record of committed code, README documentation, commit history, and project variety.',
    fails:
      "GitHub shows output, not reasoning. Commits can be backdated, pushed under a single account for group work, or produced by AI. AI code generation tools now produce code that passes cursory technical review — a portfolio built entirely with AI assistance is visually indistinguishable from one built through genuine learning. No qualified person reviewed the code. Employers who want to know how a junior developer thinks cannot find that evidence in a repository.",
  },
  {
    name: 'LinkedIn Profile',
    provides: 'Professional identity, skill endorsements, and recommendations from connections.',
    fails:
      "Skill endorsements are self-selected — a connection clicked a button without reviewing your work. Recommendations are written by people with a relationship with the student, not neutral assessors. Credentials are unverified. Employers treat LinkedIn as a marketing document and use it for contact information and broad background context, not capability assessment.",
  },
  {
    name: 'Academic Transcript',
    provides: 'A record of grades across a structured program of study.',
    fails:
      "Grades measure performance on defined assessments in structured academic environments. They do not measure: planning discipline, documentation quality, honest self-assessment, or the ability to work on unstructured problems without instructions. A CS degree certifies attendance and exam performance. It does not certify the ability to build, document, and reflect on real software.",
  },
] as const;

const FIVE_RESPONSES = [
  {
    number: '01',
    heading: 'Fixed brief — not student-chosen',
    body: "The platform generates your brief or derives it from a real repository. You do not choose an easy problem. This is by design: self-selected projects are invariably problems the student already knows how to solve. An externally specified brief forces engagement with a problem that has not been pre-solved.",
  },
  {
    number: '02',
    heading: 'Three documents that expose reasoning',
    body: 'The Breakdown, Plan, and Reflection are not a writing exercise. They are structured evidence of how you think: how you decompose a problem, how you plan before you execute, and how honestly you assess what you built and what you did not. This is the evidence GitHub portfolios cannot produce.',
  },
  {
    number: '03',
    heading: 'Peer review before lecturer',
    body: "Before your submission reaches the lecturer queue, another student reviews it against the same rubric the lecturer will use. This raises the floor. It also serves a second purpose: reviewing another student's Reflection teaches you what a strong Reflection looks like in a way that abstract guidance cannot.",
  },
  {
    number: '04',
    heading: 'Named, credentials-confirmed lecturer',
    body: "A platform administrator reviewed the credentials of every lecturer before they can access the review queue. Their name and institutional affiliation appear in your portfolio entry. An employer can look them up. The verification chain is traceable — this is what makes the VERIFIED decision meaningful.",
  },
  {
    number: '05',
    heading: 'Permanent, hashable portfolio',
    body: "When your project is verified, it is recorded permanently with a SHA-256 document hash. The portfolio is publicly accessible via URL. It does not disappear when you graduate. An employer can read all three of your documents in full — not just the project title.",
  },
] as const;

const PROJECT_DOCUMENTS = [
  {
    name: 'Problem Breakdown',
    reveals: 'Whether you understood the brief and can decompose a complex problem',
    mustShow: [
      'Decomposition of the problem into its components',
      'Analysis of the chosen technical approach',
      'Explanation of why this approach was chosen over alternatives that were considered and rejected',
      'Identification of technical risks and unknowns',
    ],
    reviewerNote:
      "Reviewers look for evidence that you engaged with this specific problem's constraints — not a generic description of the problem category. A Breakdown that reads like it was written before reading the brief will not pass.",
  },
  {
    name: 'Approach Plan',
    reveals: 'Whether you planned before you coded',
    mustShow: [
      'Implementation milestones with sequencing logic',
      'Task decomposition and dependency identification',
      'Timeline with reasonable estimates',
      'Resource and risk identification',
    ],
    reviewerNote:
      'The Plan must be logically prior to the implementation — a plan reconstructed after the fact will read differently from one written before. Reviewers distinguish between the two.',
  },
  {
    name: 'Final Reflection',
    reveals: 'Professional maturity and honest self-assessment',
    mustShow: [
      'What was completed and what was not, with specific reasons',
      'What was learned technically — not what you already knew',
      'What was learned about your own process and working habits',
      'What you would do differently, with specific reasoning',
      'What a proper solution to any unsolved problems would require',
    ],
    reviewerNote:
      'Reviewers weight the Reflection most heavily. A polished Breakdown with a superficial Reflection is a weaker submission than a modest Breakdown with a deeply honest Reflection. The Reflection is where professional thinking becomes visible — or where its absence becomes visible.',
  },
] as const;

interface WorkflowStage {
  readonly label: string;
  readonly actor: string;
  readonly detail: string;
  readonly note: string | null;
}

const WORKFLOW_STAGES: readonly WorkflowStage[] = [
  {
    label: 'Register',
    actor: 'Student',
    detail:
      'Create an account with your name, email, and academic institution. Select the Student role. Verify your email via the link sent to your inbox. Your account is created immediately.',
    note: null,
  },
  {
    label: 'Select a track',
    actor: 'Student',
    detail:
      'Choose between AI_BRIEF (the platform generates your brief from agricultural industry contexts) or OPEN_SOURCE (you provide a GitHub repository URL and the platform generates a brief from its actual needs). Track selection is per project — you can choose differently on your next engagement.',
    note: null,
  },
  {
    label: 'Receive your brief',
    actor: 'System',
    detail:
      'On AI_BRIEF: the system generates a brief specifying the problem, target users, technical constraints, and evaluation criteria. The brief is fixed — you cannot negotiate its scope. On OPEN_SOURCE: the platform analyzes your repository and generates a brief based on its real needs and open issues.',
    note: 'AI_BRIEF briefs are assigned, not chosen. This prevents self-selection of easy or already-solved problems.',
  },
  {
    label: 'Produce three documents and code',
    actor: 'Student',
    detail:
      'Work on your project. Produce your Problem Breakdown, Approach Plan, and Final Reflection. Develop and submit your code or link to your repository. The Project Guidance Tool is available throughout this stage.',
    note: 'The documents are produced progressively as you work — not written at the end. Breakdown before implementation. Plan before coding. Reflection after.',
  },
  {
    label: 'Submit',
    actor: 'Student',
    detail:
      'When all three documents are complete and your code is ready, submit the project. This is a one-way action — it cannot be undone. At submission, the platform creates a SHA-256 cryptographic hash of your document content and records it in the audit log with a timestamp.',
    note: 'After submission, your documents cannot be altered. The hash recorded here must match the documents in your portfolio entry at any future point.',
  },
  {
    label: 'Complete your assigned peer review',
    actor: 'Student',
    detail:
      "The platform assigns you as reviewer for another student's submission. You receive their brief, all three documents, and the rubric. Score on four dimensions — clarity, methodology, documentation quality, reflection depth — and submit written commentary. This must be completed before your own submission advances to the lecturer queue.",
    note: "Peer review is mandatory. It cannot be bypassed. Reviewing another student's Reflection against the rubric is one of the most effective ways to understand what a strong Reflection looks like for your own work.",
  },
  {
    label: 'Enter the lecturer review queue',
    actor: 'System',
    detail:
      'After peer review is complete, your submission enters the queue. A verified lecturer in your track is assigned. They review all three documents, your code, the peer score, and the rubric. They assess independently — the peer score informs but does not determine their decision.',
    note: 'Queue time varies with the number of active verified lecturers for your track and their current workload. There is no guaranteed turnaround.',
  },
  {
    label: 'Receive the decision',
    actor: 'Lecturer',
    detail:
      'The lecturer issues one of three decisions: VERIFIED (the submission meets the standard — your portfolio updates permanently), REVISION_REQUIRED (specific documented weaknesses identified — you revise and resubmit), or DENIED (the submission does not meet the standard and revision cannot remedy it — you may start a new project).',
    note: null,
  },
  {
    label: 'If REVISION_REQUIRED: address the feedback and resubmit',
    actor: 'Student',
    detail:
      "The lecturer's commentary identifies specific weaknesses on specific dimensions. Read it carefully. Address the identified gap — not by adding a paragraph that restates the concern, but by genuinely engaging with the underlying issue. Revised submissions re-enter the review process.",
    note: null,
  },
  {
    label: 'Portfolio entry published',
    actor: 'System',
    detail:
      "A VERIFIED decision permanently adds the project to your public portfolio. The entry shows: project title, track, brief type, verification date, reviewer name and institutional affiliation, peer scores on four dimensions, skills demonstrated, and all three documents in full. The document hash is included and independently verifiable.",
    note: null,
  },
];

const RESPONSIBILITIES = [
  {
    label: 'Document authorship',
    detail:
      'Your Breakdown, Plan, and Reflection must be written by you. Using an AI tool to generate the text of these documents is a violation of platform terms and produces submissions that do not survive reviewer scrutiny — reviewers with domain expertise can distinguish genuinely authored documents from generated text.',
  },
  {
    label: 'AI tools for research, not writing',
    detail:
      'AI tools may be used to research your problem domain, check technical information, think through approaches, and explore alternatives. They may not be used to generate the text of your documents or to produce code you submit as your own work product.',
  },
  {
    label: 'Peer review honesty',
    detail:
      'When assigned a peer review, assess the submission honestly against the rubric. Submit specific, substantive commentary. Peer review quality is tracked — reviews that are consistently superficial or misaligned with eventual lecturer decisions affect your reviewer standing.',
  },
  {
    label: 'Code authenticity',
    detail:
      'The code or repository you submit must represent work you did for this project engagement. Submitting code that is entirely AI-generated, copied from another source, or produced by someone else misrepresents what the reviewer is being asked to verify.',
  },
  {
    label: 'Accurate documentation',
    detail:
      'Your Reflection describes what you built and what you did not build. Claiming completion of work not done, or omitting significant failures from your Reflection, misrepresents the work the reviewer is assessing.',
  },
  {
    label: 'One submission per project',
    detail:
      "Each project engagement is unique. You cannot resubmit a project you previously submitted in a prior engagement, and you cannot reuse another student's brief as the basis for your submission.",
  },
] as const;

const LIMITATIONS = [
  {
    heading: 'VERIFIED is not a hiring credential',
    detail:
      'VERIFIED means a named, credentials-confirmed reviewer assessed all three documents and the code against a defined rubric and determined the submission met the documented minimum standard. It does not mean you are qualified for any specific role. It does not mean your code is production-ready. It does not mean the reviewer found your work exceptional — VERIFIED means it met the standard, not that it exceeded it.',
  },
  {
    heading: 'The document hash proves integrity, not authorship',
    detail:
      'The SHA-256 hash created at submission proves that the documents currently visible in your portfolio are identical to what was submitted at review. It does not prove you wrote the documents. An employer who verifies the hash is confirming document integrity — that they are reading the same documents the reviewer read — not that the student authored them.',
  },
  {
    heading: 'Queue time varies and is not guaranteed',
    detail:
      'How long your submission waits in the lecturer queue depends on the number of active verified lecturers for your track and their current workload. A track with few active lecturers will have longer wait times. The platform does not provide a specific turnaround commitment.',
  },
  {
    heading: 'Reviewer is assigned, not chosen',
    detail:
      'You cannot request a specific lecturer. The platform assigns from the pool of verified lecturers for your track who have no documented conflict of interest with your submission. If no lecturers are available for your track, your submission waits in the queue.',
  },
  {
    heading: 'REVISION_REQUIRED requires genuine revision',
    detail:
      'A REVISION_REQUIRED decision identifies a specific gap. Addressing it means filling that gap genuinely — not adding a paragraph that restates the concern. Resubmissions that do not address the specific feedback can result in a second REVISION_REQUIRED or a DENIED decision.',
  },
  {
    heading: 'DENIED closes the submission, not the student',
    detail:
      'A DENIED decision means the submission does not meet the standard and revision within the current project scope cannot remedy it. The project does not appear in your portfolio. You may immediately start a new project engagement. DENIED decisions are relatively rare and do not affect your ability to participate in future projects.',
  },
  {
    heading: 'The Project Guidance Tool has no memory across sessions',
    detail:
      'Each conversation with the Project Guidance Tool begins from zero context. It does not remember previous sessions. When starting a new session, provide your brief and current stage as context at the beginning of the conversation.',
  },
] as const;

const FAQ_ITEMS = [
  {
    question: 'How long does the review process take from submission to decision?',
    answer:
      "There is no guaranteed timeline. After submission, you must complete your assigned peer review before your project enters the lecturer queue. Once in the queue, wait time depends on the number of active verified lecturers for your track and their workload. A track with an active reviewer pool typically completes reviews within several days to two weeks. A thin reviewer pool takes longer. The platform does not provide a specific turnaround commitment.",
  },
  {
    question: 'What does REVISION_REQUIRED mean and how should I respond?',
    answer:
      "REVISION_REQUIRED means the submission has specific documented weaknesses that revision can address. The lecturer's commentary will identify which dimensions fell short and what needs to improve.\n\nRespond by addressing the specific gap — not by expanding the document to be longer, but by genuinely engaging with the underlying issue identified. If the feedback concerns your Reflection's treatment of a technical failure, that section needs to be rewritten with deeper analysis of what went wrong and why — not just supplemented with additional text. Resubmit when you have genuinely addressed the identified weakness.",
  },
  {
    question: 'What does DENIED mean — can I start again?',
    answer:
      "DENIED means the submission does not meet the minimum standard and revision within the current project scope cannot remedy it. The submission does not appear in your public portfolio.\n\nYes, you can start again immediately. A DENIED decision does not preclude participation in future projects. You can begin a new project engagement with a new brief. DENIED decisions do not appear in your public profile — only VERIFIED projects are visible.",
  },
  {
    question: 'Can I use AI tools like ChatGPT during my project?',
    answer:
      "AI tools may be used for research, checking technical information, and thinking through approaches. They may not be used to generate the text of your Breakdown, Plan, or Reflection, or to produce code you submit as your own work.\n\nThe distinction matters: using AI to understand how offline-first synchronization works is research. Using AI to write the section of your Reflection describing your experience implementing it is document generation. Reviewers with domain expertise identify documents that lack genuine personal engagement — the irregular texture of authentic thinking is detectable.",
  },
  {
    question: 'What does the document hash prove?',
    answer:
      "The SHA-256 hash created at submission proves document integrity: the documents currently visible in your portfolio are identical to what was submitted at review. If any content had been altered after submission, the hash would not match.\n\nThe hash does not prove authorship. It does not prove that your documents accurately describe work actually done. It proves that what an employer reads today is the same content the reviewer read when they issued their decision.",
  },
  {
    question: 'Who reviews my submission and how are they verified?',
    answer:
      "A verified lecturer — whose academic or professional credentials were reviewed and confirmed by a platform administrator — is assigned from the pool of lecturers for your track. The platform prevents assignment of lecturers with a documented conflict of interest.\n\nYou cannot request a specific lecturer. The assignment is made by the platform based on track and availability. The reviewer's name and institutional affiliation appear in your portfolio entry after a VERIFIED decision.",
  },
  {
    question: 'Can I see who my peer reviewer is?',
    answer:
      "Peer reviews are not anonymous — the reviewer's identity is visible to you after the review is complete. You do not know who is reviewing your submission while the review is in progress.",
  },
  {
    question: 'What if my assigned peer reviewer submits a superficial or unhelpful review?',
    answer:
      "The peer review score is visible to the lecturer and informs but does not determine their decision. A peer reviewer who consistently provides superficial reviews has their reviewer quality tracked — persistent misalignment with eventual lecturer decisions affects their review standing.\n\nIf you believe your peer review was conducted in bad faith, you can report it to platform administrators. This does not affect your submission timeline.",
  },
  {
    question: 'Can I do multiple projects simultaneously?',
    answer:
      "The platform allows one active project engagement at a time. To begin a new project, your current engagement must reach a terminal state: VERIFIED, DENIED, or withdrawn.",
  },
  {
    question: 'What happens to my portfolio after I graduate?',
    answer:
      "Your portfolio is permanently accessible via your public portfolio URL. It does not disappear when you graduate or stop using the platform. VERIFIED entries are permanent records.\n\nAn employer can view your portfolio years after graduation. The verification information — reviewer name, institutional affiliation, decision date, document hash — remains in the entry.",
  },
  {
    question: 'Can employers view my portfolio without creating an account?',
    answer:
      "Yes. Portfolio entries are publicly accessible via URL without registration. An employer can read all three documents, see the reviewer's name and institutional affiliation, view the peer score, and see the verification date without creating an account.",
  },
  {
    question: 'Can I reuse a class project I built for a course?',
    answer:
      "On the AI_BRIEF track: the generated brief specifies a problem with constraints assigned by the platform — it is unlikely to match a class project you already built. You must work from the generated brief.\n\nOn the OPEN_SOURCE track: you must produce three new documents from the brief derived from the repository. A Reflection that summarizes your existing contributions rather than documenting genuine engagement with the specific brief will not meet the reviewer's standard.",
  },
  {
    question: "What if I disagree with the lecturer's REVISION_REQUIRED or DENIED decision?",
    answer:
      "The platform does not have a formal appeals process. The lecturer's decision is final for that review cycle.\n\nA REVISION_REQUIRED decision contains specific commentary identifying what needs to improve. The appropriate response is to address the identified weakness and resubmit. If you believe feedback was issued in error or bad faith, you can contact platform support — but removal of a review decision is not a standard outcome.",
  },
] as const;

const MISCONCEPTIONS = [
  {
    belief: 'I can use the Project Guidance Tool to help write my documents faster.',
    correction:
      "The tool responds to questions by asking questions back. If you ask it to write your Breakdown, it will ask what part of your brief you found most underspecified. Your document comes from working through those questions — the tool does not produce text you can paste into your submission. This is by design: a document written by the tool would show no evidence of your thinking.",
  },
  {
    belief: 'VERIFIED means I am ready to be hired.',
    correction:
      "VERIFIED means a credentials-confirmed reviewer assessed your submission against a defined rubric and determined it met the minimum standard. It does not mean you are hireable for any specific role, that your code is production-ready, or that the reviewer found your work exceptional. Employers who read your portfolio understand what VERIFIED represents: an independently reviewed record of your documented reasoning process, not a hiring recommendation.",
  },
  {
    belief: 'The document hash proves I wrote the documents.',
    correction:
      "The SHA-256 hash proves that the documents in the portfolio are identical to what was submitted at review — document integrity, not authorship. A reviewer who suspects documents were AI-generated cannot use the hash to verify authorship. They use their domain expertise to assess whether the documents show genuine engagement with the specific brief's constraints.",
  },
  {
    belief: 'A DENIED decision means I cannot participate in the Education Hub again.',
    correction:
      "DENIED means this submission does not meet the standard and revision cannot remedy it. The project does not appear in your portfolio. You can start a new project engagement immediately. DENIED decisions are relatively rare and do not preclude future participation. Your public profile shows only VERIFIED projects.",
  },
  {
    belief: "I should choose the OPEN_SOURCE track because I already have a project — it will be easier.",
    correction:
      "The OPEN_SOURCE track generates a brief from the actual needs of the repository you select. You must produce three new documents from that brief: a Breakdown of the specific problem it identifies, a Plan for addressing it, and a Reflection on what you did. An OPEN_SOURCE submission where the documents are a summary of your existing contributions — rather than documentation of genuine engagement with the generated brief — will not meet the standard.",
  },
] as const;

export default function StudentsPage(): React.ReactElement {
  return (
    <EduHubPage
      audience="For Students"
      heading="You built projects. Your reasoning is invisible to employers."
      intro="This page covers what the Education Hub requires, how the review process works, what VERIFIED means and what it does not, and what a completed portfolio entry shows. Read it before you register."
      sections={SECTIONS}
      registerHref="/auth/register?role=student"
      registerLabel="Register as a student"
    >
      {/* ── The problem ── */}
      <section id="the-problem" className="py-12 border-b border-ws-border-light">
        <SectionLabel>The problem</SectionLabel>
        <SectionH2>Three structural failures in how student capability is currently evidenced</SectionH2>

        <div className="space-y-5 max-w-3xl">
          <Body>
            Every portfolio tool currently available to CS students shares the same fundamental
            limitation: the claims in them are made by the person who benefits from those claims. A
            CV says you built a machine learning model. GitHub shows you committed code. LinkedIn
            shows you received endorsements. None of these involve a qualified third party reviewing
            the work and making an independent determination of what it demonstrates. Employers who
            rely on these signals know they are self-asserted — and they discount them accordingly.
          </Body>
          <Body>
            The second failure is more recent and more severe. AI code generation tools now produce
            coherent, functional code for almost any standard project specification. A GitHub
            portfolio built with AI assistance is visually indistinguishable from one built through
            years of genuine learning — unless a qualified reviewer engages deeply with the design
            decisions and reasoning behind the code, which hiring managers cannot do at scale for
            every candidate. The result: code-based portfolios have significantly degraded as
            evidence of individual capability.
          </Body>
          <Body>
            The third failure is structural and predates both of the above. A CS degree from a
            well-known institution carries an institutional signal in addition to the individual
            student&apos;s performance signal. Students from smaller or newer institutions receive no such
            amplification. Their actual work quality may be identical or superior, but they compete
            without a supporting signal. The mechanism that should differentiate capability — the
            actual project work — is invisible to employers because there is no independent review
            creating a portable, verifiable record of it.
          </Body>
          <Body>
            These three failures — the self-assertion problem, the AI evidence crisis, and the
            institutional signal gap — are the specific problems the Education Hub was built to
            address.
          </Body>
        </div>
      </section>

      {/* ── Why existing tools fail ── */}
      <section id="why-existing-fail" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Why existing tools fail</SectionLabel>
        <SectionH2>What each tool provides — and where its evidence is weak</SectionH2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-ws-border-light mb-8">
          {EXISTING_TOOLS.map((tool) => (
            <div key={tool.name} className="bg-ws-surface-raised p-6 flex flex-col gap-3">
              <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase">
                {tool.name}
              </p>
              <p className="font-geist text-ws-body text-ws-text-secondary border-b border-ws-border-light pb-3 italic">
                {tool.provides}
              </p>
              <p className="font-geist text-ws-body text-ws-text-secondary">{tool.fails}</p>
            </div>
          ))}
        </div>

        <div className="border-l-2 border-ws-border-medium pl-6 max-w-3xl">
          <Body>
            UmojaHub does not create capability in students. It creates a mechanism for making
            existing capability visible to employers who could not see it before — through structured
            documentation of reasoning, human review from a named and credentials-confirmed reviewer,
            and a permanent, publicly accessible record with cryptographic integrity.
          </Body>
        </div>
      </section>

      {/* ── How UmojaHub responds ── */}
      <section id="how-it-responds" className="py-12 border-b border-ws-border-light">
        <SectionLabel>How UmojaHub responds</SectionLabel>
        <SectionH2>Five structural responses to five structural gaps</SectionH2>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-px bg-ws-border-light">
          {FIVE_RESPONSES.map((item) => (
            <div key={item.number} className="bg-ws-surface-base p-6 flex flex-col gap-3">
              <span className="font-geist-mono text-ws-caption text-ws-hub-blue tabular-nums">
                {item.number}
              </span>
              <h3 className="font-display text-ws-subsection text-ws-text-primary">{item.heading}</h3>
              <p className="font-geist text-ws-body-sm text-ws-text-secondary">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The two tracks ── */}
      <section id="the-two-tracks" className="py-12 border-b border-ws-border-light">
        <SectionLabel>The two tracks</SectionLabel>
        <SectionH2>AI_BRIEF and OPEN_SOURCE — what each involves and when to choose each</SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          At the start of each project engagement, you choose one of two tracks. The track
          determines how your brief is generated. Both tracks require the same three documents and
          the same review process.
        </p>

        <div className="bg-ws-surface-raised border border-ws-border-light overflow-hidden mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 px-5 py-5 border-b border-ws-border-light">
            <div className="sm:w-40 shrink-0">
              <p className="font-geist-mono text-ws-data font-medium text-ws-text-primary">
                AI_BRIEF
              </p>
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <p className="font-geist text-ws-body text-ws-text-secondary">
                The platform generates your brief from its library of Kenyan agricultural industry
                problem contexts. The brief specifies the problem to solve, the target users,
                technical constraints, and evaluation criteria. The brief is fixed — you cannot
                negotiate its scope or requirements. This prevents cherry-picking familiar or
                already-solved problems.
              </p>
              <p className="font-geist text-ws-body text-ws-text-secondary">
                Choose AI_BRIEF if you do not have an existing project you want to document, or if
                you want to demonstrate capability on a problem outside your usual area.
              </p>
              <p className="font-geist text-ws-body-sm text-ws-text-tertiary border-l border-ws-border-light pl-3">
                Briefs are assigned, not chosen. You do not select the specific industry context
                within the Agriculture domain — the system assigns one. This is intentional.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-4 px-5 py-5">
            <div className="sm:w-40 shrink-0">
              <p className="font-geist-mono text-ws-data font-medium text-ws-text-primary">
                OPEN_SOURCE
              </p>
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <p className="font-geist text-ws-body text-ws-text-secondary">
                You provide a GitHub repository URL of an open-source project. The platform analyzes
                the repository — its codebase, open issues, and documentation state — and generates
                a brief based on its actual needs. You produce all three documents from this brief
                and submit your code alongside them.
              </p>
              <p className="font-geist text-ws-body text-ws-text-secondary">
                Choose OPEN_SOURCE if you have been contributing to an open-source project and want
                to document that work, or if you have a substantial existing project with domain
                knowledge you want reviewed.
              </p>
              <p className="font-geist text-ws-body-sm text-ws-text-tertiary border-l border-ws-border-light pl-3">
                OPEN_SOURCE is not easier than AI_BRIEF. The generated brief specifies real work
                that needs doing in the repository — you cannot substitute a description of your
                existing contributions for engagement with the brief.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── The three documents ── */}
      <section id="the-three-documents" className="py-12 border-b border-ws-border-light">
        <SectionLabel>The three documents</SectionLabel>
        <SectionH2>What each document must demonstrate and what reviewers look for</SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          All three documents are required before submission. They are assessed on the same
          four-dimension rubric: clarity of problem understanding, methodology appropriateness,
          documentation quality, and reflection depth. Each document is designed to evidence a
          different kind of thinking.
        </p>

        <div className="bg-ws-surface-raised border border-ws-border-light overflow-hidden">
          {PROJECT_DOCUMENTS.map((doc, i) => (
            <div
              key={doc.name}
              className="flex flex-col gap-4 px-5 py-5 border-b border-ws-border-light last:border-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-1">
                    Document {i + 1}
                  </p>
                  <p className="font-display text-ws-subsection text-ws-text-primary">{doc.name}</p>
                </div>
                <p className="font-geist text-ws-body-sm text-ws-text-tertiary text-right max-w-[200px] leading-snug shrink-0">
                  {doc.reveals}
                </p>
              </div>
              <div>
                <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
                  Must show
                </p>
                <ul className="space-y-1">
                  {doc.mustShow.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-[7px] h-1 w-1 bg-ws-text-tertiary shrink-0" />
                      <p className="font-geist text-ws-body text-ws-text-secondary">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="font-geist text-ws-body-sm text-ws-text-tertiary border-l border-ws-border-light pl-3">
                {doc.reviewerNote}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Project Guidance Tool ── */}
      <section id="project-guidance-tool" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Project Guidance Tool</SectionLabel>
        <SectionH2>A Socratic guide — it asks questions, it does not write your documents</SectionH2>

        <div className="space-y-5 max-w-3xl mb-8">
          <Body>
            The Project Guidance Tool is available throughout your project. It knows your brief and
            your current stage. Its method is Socratic: when you ask it a question, it asks a
            question back. When you describe your approach, it asks what alternatives you considered
            and why you rejected them. When you explain what you built, it asks what you would need
            to do differently to solve the part you did not build.
          </Body>
          <Body>
            The purpose of this design is not to obstruct you. It is to ensure that the reasoning in
            your documents is yours. A document written with the tool&apos;s help through Socratic
            questioning will show evidence of genuine engagement. A document generated by an AI tool
            and submitted directly will not. Reviewers with domain expertise can distinguish between
            the two.
          </Body>
        </div>

        <div className="bg-ws-surface-raised border border-ws-border-light p-5 mb-6">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-4">
            Example interaction
          </p>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="font-geist-mono text-ws-caption text-ws-text-tertiary shrink-0 w-16 pt-0.5">
                Student
              </span>
              <p className="font-geist text-ws-body text-ws-text-secondary">
                &quot;Can you help me write my Problem Breakdown document?&quot;
              </p>
            </div>
            <div className="flex gap-3 border-t border-ws-border-light pt-4">
              <span className="font-geist-mono text-ws-caption text-ws-hub-blue shrink-0 w-16 pt-0.5">
                Tool
              </span>
              <p className="font-geist text-ws-body text-ws-text-secondary">
                &quot;What part of your brief do you think is most underspecified? What would you need to
                know before you could begin decomposing it?&quot;
              </p>
            </div>
          </div>
        </div>

        <div className="border border-ws-border-light p-5 max-w-3xl">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3">
            What the Project Guidance Tool does not do
          </p>
          <ul className="space-y-2 mb-4">
            {[
              'Generate text for your Breakdown, Plan, or Reflection documents',
              'Tell you the correct technical approach without asking you to reason through it first',
              'Write code for your project',
              'Remember previous sessions — each conversation begins from zero context',
            ].map((point) => (
              <li key={point} className="flex items-start gap-2">
                <span className="mt-[7px] h-1 w-1 bg-ws-text-tertiary shrink-0" />
                <p className="font-geist text-ws-body text-ws-text-secondary">{point}</p>
              </li>
            ))}
          </ul>
          <p className="font-geist text-ws-body-sm text-ws-text-tertiary border-t border-ws-border-light pt-4">
            When starting a new session, provide your brief and your current stage as context at the
            beginning of the conversation. The tool has no memory of previous sessions.
          </p>
        </div>
      </section>

      {/* ── A real scenario ── */}
      <section id="real-scenario" className="py-12 border-b border-ws-border-light">
        <SectionLabel>A real scenario</SectionLabel>
        <SectionH2>
          What a complete project engagement looks like — David, CS student, Strathmore
        </SectionH2>

        <div className="border-l-2 border-ws-border-medium pl-6 space-y-8 max-w-3xl">
          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Before registration
            </p>
            <Body>
              David is a third-year CS student. He has built several projects for class but has
              nothing a prospective employer can independently verify. A classmate mentions the
              Education Hub. He visits the website, reads what the review process involves, reads the
              VERIFIED and REVISION_REQUIRED sections, and reads what VERIFIED does not mean. He
              decides to register.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Brief received — AI_BRIEF track
            </p>
            <Body>
              He selects the AI_BRIEF track and the Agriculture domain. The system generates his
              brief: a mobile-accessible tool for smallholder farmers to document crop health
              observations and receive actionable guidance. Constraints: must function with
              intermittent connectivity. Deliverables: data model, interaction flow, and
              implementation notes. This is not a project he has built before.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Producing the documents — week one
            </p>
            <Body>
              He opens the Project Guidance Tool. &quot;Can you help me write my breakdown document?&quot;
              The tool responds: &quot;What problem in your brief do you think is most underspecified?
              What would you need to know to solve it?&quot; He answers. The tool asks another question.
              He works for two hours, reasoning through his answers to its questions. He never
              receives text he can paste into a document. He receives questions that force him to
              articulate his own thinking. He writes his Breakdown — longer than expected, with three
              alternative approaches he considered and why he rejected two of them.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Weeks two and three — implementation
            </p>
            <Body>
              He designs the data model, writes his Plan document, and begins building. He encounters
              two significant problems: the intermittent connectivity requirement is harder than
              anticipated. He solves one problem. He works around the second.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Week four — the Reflection
            </p>
            <Body>
              He writes his Reflection document. He is honest: the connectivity problem he worked
              around is not properly solved. He documents what a proper solution would require. He
              describes what he learned about offline-first data synchronization that he did not know
              before starting.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Submission and peer review
            </p>
            <Body>
              He submits all three documents and his GitHub repository link. The system creates a
              SHA-256 hash and records it in the audit log. He is assigned a peer review for another
              student&apos;s submission. He finds the process clarifying — applying the rubric to their
              Reflection makes him think about his own.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Lecturer decision — REVISION_REQUIRED
            </p>
            <Body>
              A verified lecturer in the Agriculture track reviews his submission. The decision:
              REVISION_REQUIRED. The commentary (63 words):
            </Body>
            <div className="bg-ws-surface-raised border border-ws-border-light p-4 mt-3">
              <p className="font-geist text-ws-body text-ws-text-secondary italic">
                &quot;The Reflection section on the connectivity workaround is the weakest part of this
                submission. You acknowledge the problem but do not explain what you tried before
                accepting the workaround, why other approaches failed, or what implementing a real
                solution would require technically. This section needs to demonstrate deeper reasoning
                about the technical constraint you encountered, not just acknowledge that the
                workaround exists.&quot;
              </p>
            </div>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              Revision
            </p>
            <Body>
              David reads the feedback. It is specific. He rewrites the Reflection section on
              connectivity: what he tried first (client-side queueing with timestamp collision
              detection), why it failed (clock drift between devices), why proper offline-first
              synchronization requires a conflict resolution algorithm he did not have time to
              implement, and what that algorithm would involve. The revised section is 400 words.
              He resubmits.
            </Body>
          </div>

          <div>
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              VERIFIED — portfolio published
            </p>
            <Body>
              The revised submission receives VERIFIED. His portfolio entry is published. It shows:
              project title, AI_BRIEF track, Agriculture domain, verification date, the lecturer&apos;s
              name and institutional affiliation, peer scores on four dimensions, all three documents
              readable in full — including the Reflection with the connectivity analysis — and the
              document hash. He shares the URL with a prospective employer. They read the Reflection,
              schedule an interview, and ask him to walk through the offline-first problem live. He
              can.
            </Body>
          </div>

          <div className="border border-ws-border-light p-5">
            <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-2">
              What this scenario does not show
            </p>
            <p className="font-geist text-ws-body text-ws-text-secondary">
              David&apos;s path was relatively smooth. Not every engagement follows this path. Some
              submissions receive DENIED decisions. Some wait longer in the queue. Some students find
              the Project Guidance Tool&apos;s Socratic approach frustrating when under deadline. The
              scenario is accurate but not universal. The limitations section of this page documents
              what can go wrong.
            </p>
          </div>
        </div>
      </section>

      {/* ── Complete workflow ── */}
      <section id="complete-workflow" className="py-12 border-b border-ws-border-light">
        <SectionLabel>The complete workflow</SectionLabel>
        <SectionH2>Every stage from registration to portfolio entry</SectionH2>

        <div className="bg-ws-surface-raised border border-ws-border-light overflow-hidden">
          {WORKFLOW_STAGES.map((stage, i) => (
            <div
              key={stage.label}
              className="flex items-start gap-4 px-5 py-5 border-b border-ws-border-light last:border-0"
            >
              <span className="font-geist-mono text-ws-caption text-ws-text-tertiary tabular-nums shrink-0 pt-0.5 w-6">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <p className="font-display text-ws-subsection text-ws-text-primary">{stage.label}</p>
                  <span className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase shrink-0">
                    {stage.actor}
                  </span>
                </div>
                <p className="font-geist text-ws-body text-ws-text-secondary">{stage.detail}</p>
                {stage.note !== null && (
                  <p className="font-geist text-ws-body-sm text-ws-text-tertiary mt-2 border-l border-ws-border-light pl-3">
                    {stage.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Responsibilities ── */}
      <section id="responsibilities" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Responsibilities</SectionLabel>
        <SectionH2>What you agree to when you submit a project</SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          These are stated here because understanding them before you submit is the purpose of this
          page. They are not buried in a terms document.
        </p>

        <div className="bg-ws-surface-raised border border-ws-border-light overflow-hidden">
          {RESPONSIBILITIES.map((item) => (
            <div
              key={item.label}
              className="flex flex-col sm:flex-row sm:items-start gap-4 px-5 py-5 border-b border-ws-border-light last:border-0"
            >
              <p className="font-display text-ws-subsection text-ws-text-primary sm:w-48 shrink-0">
                {item.label}
              </p>
              <p className="font-geist text-ws-body text-ws-text-secondary">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Limitations ── */}
      <section id="limitations" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Limitations</SectionLabel>
        <SectionH2>What VERIFIED means — and what it explicitly does not mean</SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-6 max-w-2xl">
          Disclosing limitations before you encounter them is the honest version of building trust.
          The most important limitation is the meaning of VERIFIED itself.
        </p>

        <div className="border border-ws-border-light p-5 mb-6 max-w-3xl">
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3">
            VERIFIED means
          </p>
          <p className="font-geist text-ws-body text-ws-text-secondary mb-4">
            A named, credentials-confirmed reviewer assessed all three documents and the code against
            a defined rubric and determined the submission met the documented minimum standard. The
            decision is timestamped and recorded in the audit log. The reviewer&apos;s name and
            institutional affiliation appear in your portfolio entry.
          </p>
          <p className="font-geist-mono text-ws-caption text-ws-text-tertiary uppercase mb-3 border-t border-ws-border-light pt-4">
            VERIFIED does not mean
          </p>
          <ul className="space-y-2">
            {[
              'That you can be hired for any specific role',
              'That your code is production-ready',
              'That you wrote every line without AI assistance',
              'That the reviewer found your work exceptional',
              'That the platform endorses you',
            ].map((point) => (
              <li key={point} className="flex items-start gap-2">
                <span className="mt-[7px] h-1 w-1 bg-ws-text-tertiary shrink-0" />
                <p className="font-geist text-ws-body text-ws-text-secondary">{point}</p>
              </li>
            ))}
          </ul>
        </div>

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
        <SectionH2>Questions students ask before registering.</SectionH2>
        <div className="divide-y divide-ws-border-light border-y border-ws-border-light">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </section>

      {/* ── Misconceptions ── */}
      <section id="misconceptions" className="py-12 border-b border-ws-border-light">
        <SectionLabel>Misconceptions</SectionLabel>
        <SectionH2>Common beliefs that lead to poor submissions or wrong expectations.</SectionH2>

        <div className="space-y-3">
          {MISCONCEPTIONS.map((item) => (
            <div key={item.belief} className="border border-ws-border-light overflow-hidden">
              <div className="bg-ws-surface-raised px-5 py-4 border-b border-ws-border-light">
                <p className="font-geist text-ws-body font-medium text-ws-text-primary italic">
                  &quot;{item.belief}&quot;
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="font-geist text-ws-body text-ws-text-secondary">{item.correction}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Next steps ── */}
      <section id="next-steps" className="py-12">
        <SectionLabel>What to do next</SectionLabel>
        <SectionH2>If you have read this page and want to begin.</SectionH2>
        <p className="font-geist text-ws-body-lg text-ws-text-secondary leading-[1.7] mb-8 max-w-2xl">
          Registration takes a few minutes. The commitment is to the project that follows — three
          documents, peer review, and the review process. Read the Limitations section before
          registering if you have not done so.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/register?role=student"
            className="inline-flex items-center justify-center min-h-[44px] px-6 border border-ws-hub-blue text-ws-hub-blue font-geist text-ws-body hover:bg-ws-hub-blue hover:text-white transition-colors duration-150"
          >
            Register as a student
          </Link>
          <Link
            href="/for/employers"
            className="inline-flex items-center justify-center min-h-[44px] px-6 border border-ws-border-light text-ws-text-secondary font-geist text-ws-body hover:border-ws-border-medium transition-colors duration-150"
          >
            Read the For Employers page →
          </Link>
        </div>
      </section>
    </EduHubPage>
  );
}
