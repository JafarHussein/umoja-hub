import React from 'react';
import type { Metadata } from 'next';
import { AudiencePage } from '@/components/website/AudiencePage';
import { FaqAccordion, type FaqItem } from '@/components/website/FaqAccordion';
import type { AnchorSection } from '@/components/website/SectionAnchor';

interface ExistingTool {
  name: string;
  provides: string;
  fails: string;
}

interface VerificationStep {
  label: string;
  actor: string;
  detail: string;
  note: string | null;
}

interface Limitation {
  heading: string;
  detail: string;
}

interface Misconception {
  belief: string;
  correction: string;
}

export const metadata: Metadata = {
  title: 'For Employers — UmojaHub Education Hub',
  description:
    'What a verified portfolio entry means, how the review chain works, what VERIFIED does not guarantee, and how to use a student portfolio as an interview preparation tool.',
};

const sections: AnchorSection[] = [
  { id: 'the-problem', label: 'The problem' },
  { id: 'what-existing-tools-show', label: 'What existing tools show' },
  { id: 'the-verification-chain', label: 'The verification chain' },
  { id: 'what-verified-means', label: 'What VERIFIED means' },
  { id: 'reading-the-reflection', label: 'Reading the Reflection' },
  { id: 'as-an-interview-tool', label: 'As an interview tool' },
  { id: 'independent-verification', label: 'Independent verification' },
  { id: 'a-real-scenario', label: 'A real scenario' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'faq', label: 'FAQ' },
  { id: 'misconceptions', label: 'Misconceptions' },
  { id: 'next-steps', label: 'What to do next' },
];

const existingTools: ExistingTool[] = [
  {
    name: 'CV / Resume',
    provides: 'A formatted list of claimed projects, skills, and experience.',
    fails:
      'Every claim is made by the person who benefits from the claim. There is no independent review. Employers cannot distinguish a student who built a machine learning model from scratch from one who ran a tutorial, adjusted a parameter, and called it their own project.',
  },
  {
    name: 'GitHub Portfolio',
    provides: 'A record of committed code with commit history and README files.',
    fails:
      'GitHub shows what was committed. It does not show who wrote it — commit authorship is trivially falsifiable. AI-generated code passes cursory review. The portfolio shows output, not reasoning. A student whose entire repository was AI-generated is visually indistinguishable from one who wrote everything themselves, unless the reviewer goes deep into every file for every candidate — which most hiring pipelines cannot do at scale.',
  },
  {
    name: 'LinkedIn Profile',
    provides: 'Professional identity aggregation — education, skills, endorsements, recommendations.',
    fails:
      'Skills endorsements are self-selected button-clicks by connections who have not reviewed the student&apos;s work. Recommendations are written by advocates. LinkedIn does not verify credentials. The profile is a marketing document, and employers treat it as one.',
  },
  {
    name: 'Academic Degree',
    provides: 'Confirmation that the student completed a defined program and met graduation requirements.',
    fails:
      'A degree certifies attendance and exam performance on structured assessments. It does not certify: the ability to work on an unstructured brief, planning discipline before beginning, documentation quality for a non-academic reader, or the capacity for honest self-assessment. A Computer Science degree from any institution does not tell you whether the graduate can read an ambiguous problem and produce something useful.',
  },
];

const verificationSteps: VerificationStep[] = [
  {
    label: 'Step 1',
    actor: 'Student',
    detail:
      'Receives a fixed project brief (AI_BRIEF track) or brings an open-source repository (OPEN_SOURCE track). Cannot negotiate the brief scope. Produces three documents — Problem Breakdown, Approach Plan, Final Reflection — plus a code submission or repository link.',
    note: null,
  },
  {
    label: 'Step 2',
    actor: 'Platform',
    detail:
      'At the moment of submission, creates a SHA-256 cryptographic hash of the document content and records it in the verification audit log with a timestamp. From this point, the documents cannot be altered without the hash failing to match.',
    note: 'The hash is visible in the published portfolio entry. You can use it to independently confirm the documents you read are the ones that were reviewed.',
  },
  {
    label: 'Step 3',
    actor: 'Peer reviewer',
    detail:
      'A registered student who has completed their own submission reviews the work on four dimensions: clarity of problem understanding, methodology appropriateness, documentation quality, and reflection depth. Scores 1–5 per dimension with written commentary. The score and commentary are locked before the lecturer sees the submission.',
    note: null,
  },
  {
    label: 'Step 4',
    actor: 'Verified lecturer',
    detail:
      'A named academic or industry professional whose credentials have been reviewed by platform administrators. They receive the brief, all three documents, the code repository, and the peer score with commentary. They assess independently against the same four-dimension rubric. They issue a decision — VERIFIED, REVISION_REQUIRED, or DENIED — with a minimum of 50 substantive words of written commentary.',
    note: 'The lecturer cannot review submissions from their own institution. Their name and institutional affiliation appear in the published portfolio entry.',
  },
  {
    label: 'Step 5',
    actor: 'Platform',
    detail:
      'If VERIFIED: publishes the portfolio entry with the full audit trail — reviewer name, decision date, peer scores, all three document texts visible in full, and the document hash. Portfolio pages are public. No registration is required to view them.',
    note: null,
  },
];

const limitations: Limitation[] = [
  {
    heading: 'VERIFIED does not confirm authorship',
    detail:
      'The document hash confirms the documents you read are identical to the documents the reviewer reviewed. It does not confirm the student wrote them. A student who submitted documents written by someone else would produce a consistent hash. Authorship cannot be cryptographically proven. Reviewers assess whether documentation reflects genuine engagement — they look for the irregular texture of real thinking, documented uncertainty, specific failures — but this is not a forensic authorship test.',
  },
  {
    heading: 'VERIFIED does not predict post-hire performance',
    detail:
      'A VERIFIED portfolio entry is evidence of a documented process at a point in time. It does not predict how the student will perform in your specific environment, on your codebase, in your team structure. The portfolio gives you better pre-interview evidence than you would otherwise have. It does not substitute for a thorough hiring process.',
  },
  {
    heading: 'VERIFIED does not mean the code is production-ready',
    detail:
      'The code submitted is assessed as part of the review — reviewers consider whether the implementation reflects the thinking documented in the three documents. Code is not assessed against production standards: security, scalability, observability, or style conventions. A VERIFIED submission means the reviewer found the process documentation met the standard. The code is evidence of execution discipline, not engineering maturity.',
  },
  {
    heading: 'VERIFIED means the standard was met, not exceeded',
    detail:
      'The rubric has a threshold. Submissions that clear the threshold are VERIFIED. Some VERIFIED submissions substantially exceed the threshold; others barely clear it. These are different things. Reading the Reflection document directly is more informative than the status badge. The reviewer&apos;s written commentary is the substantive assessment — the badge is the administrative decision.',
  },
  {
    heading: 'The reviewer&apos;s credentials are point-in-time',
    detail:
      'Platform administrators reviewed the lecturer&apos;s credentials at the time of registration. They did not verify current academic standing. A reviewer who has since left their institution is not automatically removed from the platform. If currency of credentials matters for a specific hiring decision, you can contact the platform to request a status check.',
  },
  {
    heading: 'Claims within the documents are not verified for accuracy',
    detail:
      'A Reflection document that says "I tried approach X but it failed because of Y" describes what the student wrote, not necessarily what happened. The hash proves the document was not altered after submission. It does not prove the account is accurate. Read the Reflection as a window into the student&apos;s thinking, not as a factual audit of their project timeline.',
  },
  {
    heading: 'The platform does not track employment outcomes',
    detail:
      'UmojaHub does not follow up with students or employers after the portfolio is published. There is no outcome data on which verified students were hired, in which roles, or how they performed. The portfolio system is a pre-hire evidence mechanism. It is not an employment placement service.',
  },
];

const faqItems: FaqItem[] = [
  {
    question: 'What does the verified badge on a portfolio entry actually mean?',
    answer:
      "It means a named, credentials-confirmed reviewer read all three of the student's documents — Problem Breakdown, Approach Plan, Final Reflection — and their code, assessed them against a defined rubric across four dimensions, and determined the submission met the documented standard. The reviewer's name and institutional affiliation are listed on the portfolio entry.",
  },
  {
    question: 'Who are the reviewers and how are their credentials verified?',
    answer:
      "Reviewers are academic staff or industry professionals with domain expertise in a relevant track (Agriculture, Health, Finance, Infrastructure). They submit their credentials — academic qualifications, employment or affiliation documentation — to UmojaHub administrators. Administrators review the documents and confirm credentials are consistent with the claimed position. Reviewers cannot review submissions from their own institution.",
  },
  {
    question: 'Can I view a portfolio without registering?',
    answer:
      'Yes. Portfolio pages are fully public. No registration is required. Any person with the portfolio URL can read the portfolio entry, including all three document texts, peer scores, the reviewer name, and the document hash.',
  },
  {
    question: 'What is the document hash and how do I verify it?',
    answer:
      "The document hash is a SHA-256 cryptographic hash of the submitted documents created at the moment of submission and recorded in the audit log. To verify: download a document from the portfolio page and compute its SHA-256 hash. It should match the hash displayed on the page. A match confirms the documents you read are the same documents the reviewer reviewed. A mismatch would indicate alteration after submission.",
  },
  {
    question: 'What does VERIFIED mean for a student from a smaller institution?',
    answer:
      'The verification chain is institution-independent. The reviewer was assigned from the verified reviewer pool, not from the student’s institution. The student’s institution does not appear as a factor in the review decision. A student from a regional university who received VERIFIED from a named, credentials-confirmed lecturer at a different institution has evidence that is portable and does not depend on institutional prestige. That is a deliberate design decision.',
  },
  {
    question: 'Can I contact the reviewing lecturer directly?',
    answer:
      "The reviewer's name and institutional affiliation appear on the portfolio entry. You can use that information to contact them through their institutional channels if you need to discuss a specific review. The platform does not provide reviewer contact details directly but does not prevent you from finding the reviewer independently.",
  },
  {
    question: 'Can I search for students with specific skills or track types?',
    answer:
      'Portfolio pages are individually linked. There is no current public employer-facing search interface for finding students by skill or project type. If you are looking to source candidates at scale, contact the platform to discuss available options.',
  },
  {
    question: 'What happens if I believe a portfolio entry has been misrepresented?',
    answer:
      'Contact the platform with the portfolio URL and a description of your concern. Administrators can review the audit log, compare documents against the submission hash, and investigate claims of misrepresentation. They cannot retroactively prove authorship, but they can verify document integrity and review the full submission history.',
  },
  {
    question: 'What is the OPEN_SOURCE track?',
    answer:
      "The OPEN_SOURCE track allows students to submit documentation for an existing open-source project they have contributed to. They produce the same three documents in relation to their specific contribution. The review process is identical. The track indicator on the portfolio entry tells you which path the student followed — it is not a distinction of quality, only of project origin.",
  },
  {
    question: 'What is the peer score visible in the portfolio entry?',
    answer:
      'Before a submission reaches a verified lecturer, another registered student reviews it on the same four-dimension rubric. Their score (1–5 per dimension) and commentary are locked and passed to the lecturer. The peer score is visible in the portfolio. It is informational — the lecturer’s decision is independent and final. A peer score of 3.5/5 with a VERIFIED decision means the lecturer found the work met the standard despite the peer’s more modest assessment.',
  },
  {
    question: 'Is there a formal employer partnership program?',
    answer:
      'Formal partnership arrangements are not currently available on a self-service basis. If you are an organization looking to engage with the platform as a source of verified candidates, contact the team directly.',
  },
];

const misconceptions: Misconception[] = [
  {
    belief: 'A VERIFIED badge is equivalent to a passing grade in a university course.',
    correction:
      'A university course grade reflects performance on defined assessments within a structured curriculum. A VERIFIED portfolio entry reflects performance on an independent project with an unstructured brief, reviewed by a named external reviewer against a documented rubric. They measure different things. Neither is a subset of the other.',
  },
  {
    belief: 'VERIFIED means the student did not use AI to write the documents.',
    correction:
      'The review process assesses whether documentation reflects genuine engagement — reviewers look for evidence of real thinking, documented failure, and specific reasoning that AI-generated text tends not to produce authentically. But the system cannot forensically prove authorship. VERIFIED is a process assessment, not an authorship certificate. A student whose documents show evidence of genuine engagement may be VERIFIED regardless of what tools they used. A student whose documents reveal generic, unspecific reasoning will be DENIED.',
  },
  {
    belief: 'I can use a portfolio entry as a substitute for a technical interview.',
    correction:
      'The portfolio is an interview preparation tool, not a hiring decision. It tells you what the student documented and how a qualified reviewer assessed it. It does not tell you how the student performs under time pressure, how they communicate verbally, how they engage with feedback in real time, or how they function in a team. Read the portfolio before the interview. Use it to direct the interview. Do not use it to skip the interview.',
  },
  {
    belief: 'If the reviewer found it VERIFIED, the submission was impressive.',
    correction:
      'VERIFIED means the submission met the defined rubric threshold. Some VERIFIED submissions substantially exceeded the threshold; others barely cleared it. The badge does not convey which. Reading the Reflection document directly is more informative. The reviewer&apos;s written commentary is the substantive assessment — the badge is the administrative decision.',
  },
  {
    belief: 'A student from Strathmore or USIU with a VERIFIED portfolio is more credible than one from a smaller institution.',
    correction:
      'The reviewer was assigned from the verified reviewer pool without regard to the student&apos;s institution. The reviewing institution is independent of the submitting institution. An institution&apos;s prestige is not a factor in the rubric. The verification chain is designed to be institution-independent precisely because institutional prestige has historically disadvantaged capable students from smaller universities.',
  },
];

export default function EmployersPage(): React.ReactElement {
  return (
    <AudiencePage
      eyebrow="Education Hub · For Employers"
      heading="A candidate sent you a link. You need to know what it means before you act on it."
      intro="This page covers what a VERIFIED portfolio entry represents, how the review chain works, what VERIFIED does not guarantee, how to use the portfolio as an interview preparation tool, and how to independently verify authenticity. Read it before making a hiring decision based on a portfolio entry."
      sections={sections}
      registerHref="/auth/register?role=employer"
      registerLabel="Register as an employer"
    >
      {/* ── The problem ── */}
      <section id="the-problem" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          The problem
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          The junior developer hiring pipeline charges you for every screening failure.
        </h2>
        <div className="space-y-5 font-body text-t4 text-text-secondary leading-relaxed max-w-3xl">
          <p>
            Technical interviews exist because no pre-interview artifact reliably signals capability
            for junior developers. CVs are self-reported. GitHub portfolios show output but not
            reasoning, and cannot distinguish authored code from AI-generated. Degrees certify
            examination performance within a structured curriculum, not the ability to work on an
            unstructured problem.
          </p>
          <p>
            The result: employers bear the full cost of screening — time, interviewer attention,
            pipeline throughput — for every candidate, including many who would have been eliminated
            earlier if better evidence existed. A hiring manager who conducts ten first-round
            interviews to find two candidates worth advancing has spent eight interviews producing
            no useful information.
          </p>
          <p>
            The AI code generation crisis has made this worse. Before AI coding assistants, a GitHub
            portfolio required at least some real work. Now, a repository filled with coherent,
            well-commented code is not evidence of the student who created it — it may be evidence
            of a well-prompted language model. The distinguishing signal between authored and
            generated code has degraded at exactly the moment when junior developers are most
            likely to have been trained on that signal.
          </p>
          <p>
            What employers actually need to see — and almost never get before an interview — is how
            a candidate thinks. Not the code they produced. Not the title they claimed on their CV.
            The reasoning behind the decisions they made, documented honestly, including what did
            not work. That evidence exists. Students produce it. The problem is that no mechanism
            has existed to make it verifiable and portable.
          </p>
          <p>
            The Education Hub&apos;s portfolio system is a partial solution to this problem. It does not
            solve everything. Read the limitations section before drawing conclusions from a
            portfolio entry.
          </p>
        </div>
      </section>

      {/* ── What existing tools show ── */}
      <section id="what-existing-tools-show" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          What existing tools show
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          What each portfolio mechanism provides and where it structurally fails.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          These are not criticisms of individual candidates. They are structural features of how
          each mechanism was designed, which determine what it can and cannot prove.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-zinc-800/50">
          {existingTools.map((tool) => (
            <div key={tool.name} className="bg-surface-primary p-6">
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
                {tool.name}
              </p>
              <p className="font-body text-t5 text-text-secondary mb-3">
                <span className="text-text-primary italic">Provides: </span>
                {tool.provides}
              </p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{tool.fails}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 border border-zinc-800/50 rounded-sm p-5">
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">What UmojaHub adds: </span>
            A structured process documentation requirement (three documents) reviewed by a named,
            credentials-confirmed third party against a defined rubric, with a cryptographic
            integrity check and a public audit trail. It does not replace any of the above — it
            supplements them with a different category of evidence.
          </p>
        </div>
      </section>

      {/* ── The verification chain ── */}
      <section id="the-verification-chain" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          The verification chain
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          Who reviewed this entry, in what sequence, with what constraints.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          Trust in this system is not asserted. It is constructed from a chain of verified
          decisions, each of which can be traced independently.
        </p>
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden">
          {verificationSteps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-4 px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <div className="shrink-0 w-24">
                <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
                  {step.label}
                </p>
                <p className="font-mono text-t6 text-accent-green mt-0.5">{step.actor}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  {step.detail}
                </p>
                {step.note && (
                  <p className="font-body text-t5 text-text-disabled mt-3 pl-3 border-l border-zinc-800/50 leading-relaxed">
                    {step.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 font-body text-t5 text-text-secondary leading-relaxed max-w-3xl">
          <p>
            An employer can follow this chain. They know who made the decision. They know the
            decision is timestamped. They know the documents they are reading are the same documents
            that were reviewed. They can look up the reviewer&apos;s credentials. None of this requires
            trusting the platform&apos;s claim — each step is independently verifiable.
          </p>
        </div>
      </section>

      {/* ── What VERIFIED means ── */}
      <section id="what-verified-means" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          What VERIFIED means
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-8">
          Read this section before making any hiring decision based on a portfolio entry.
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-zinc-800/50 mb-8">
          <div className="bg-surface-primary p-6">
            <p className="font-mono text-t6 text-accent-green uppercase tracking-widest mb-4">
              VERIFIED means
            </p>
            <ul className="space-y-3">
              {[
                'A named reviewer submitted credentials that a UmojaHub administrator reviewed and confirmed.',
                'That reviewer independently read all three documents and the code against a defined rubric.',
                'The reviewer issued a written decision with substantive commentary of minimum 50 words.',
                'The decision was timestamped and recorded in the audit log.',
                'The document hash at the time of submission matches the documents currently visible in the portfolio.',
                'The submission met the documented standard across all four rubric dimensions.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="font-mono text-t6 text-accent-green mt-0.5 shrink-0">—</span>
                  <span className="font-body text-t5 text-text-secondary">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-surface-primary p-6">
            <p className="font-mono text-t6 text-red-400 uppercase tracking-widest mb-4">
              VERIFIED does not mean
            </p>
            <ul className="space-y-3">
              {[
                'The student will perform well in the specific role you are hiring for.',
                'The code is production-ready or meets your engineering standards.',
                'The student wrote every line of code or every word of the documents themselves.',
                'The student\'s claims within the documents are accurate.',
                'The platform endorses the student or their work product.',
                'The reviewer found the submission exceptional — it means the standard was met.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="font-mono text-t6 text-red-400 mt-0.5 shrink-0">—</span>
                  <span className="font-body text-t5 text-text-secondary">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border border-zinc-800/50 rounded-sm p-5 max-w-3xl">
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">The calibration point: </span>
            Treat VERIFIED the way you would treat a reference from a credible source — it raises
            confidence, it does not resolve uncertainty. Read the Reflection document. That is the
            most informative artifact in the portfolio. The reviewer&apos;s commentary is the
            substantive assessment; the badge is the administrative decision.
          </p>
        </div>
      </section>

      {/* ── Reading the Reflection ── */}
      <section id="reading-the-reflection" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Reading the Reflection
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          The Reflection document is the most useful hiring artifact in the portfolio.
        </h2>
        <div className="space-y-5 font-body text-t4 text-text-secondary leading-relaxed max-w-3xl mb-8">
          <p>
            Technical interviewers spend significant time trying to understand how a candidate
            thinks about failure. How do they describe what went wrong? Do they take ownership or
            deflect? Can they explain the technical reason for a failure at depth? Do they have a
            hypothesis about what would have worked differently?
          </p>
          <p>
            The Reflection document, written before any interview, answers these questions in
            advance. The student documented what they built, what they did not finish, why they
            did not finish it, and what they would do differently. This is qualitatively different
            from asking &quot;what was your greatest challenge?&quot; in a generic interview — the Reflection
            gives a specific challenge already documented before the interview begins.
          </p>
          <p>
            Strong Reflection documents have a specific texture: they describe failure with
            specificity, they explain what the student tried before accepting a workaround, and
            they propose what a proper solution would require — even if that solution was beyond
            the student&apos;s capacity at the time. Weak Reflection documents acknowledge that
            something was hard without explaining why or what was learned.
          </p>
        </div>

        <p className="font-body text-t5 text-text-disabled mb-3">Example — what a strong Reflection extract looks like</p>
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm p-5 max-w-3xl">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
            Excerpt · Final Reflection · Agriculture track
          </p>
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            &quot;The offline-first synchronization requirement was the weakest part of my implementation.
            My initial approach used client-side queueing with timestamps to sequence operations
            from multiple devices. This failed during testing because of clock drift — two devices
            queuing the same observation within seconds could generate conflicting timestamps that
            the merge logic could not resolve deterministically. I worked around this by restricting
            the data model to single-device entry for each field session, which eliminates the
            conflict but also eliminates collaborative data collection. A proper solution would
            require a conflict-resolution algorithm — most likely a variant of vector clocks or
            CRDTs — that I did not have time to implement. I understand the approach now but did
            not implement it. The workaround is in the code; the explanation of what it costs is
            in this section.&quot;
          </p>
        </div>
        <p className="font-body text-t5 text-text-disabled mt-3 max-w-3xl">
          This kind of Reflection — documenting what was tried, why it failed, what a real solution
          would require — is more useful to an interviewer than any code review. It gives you a
          specific technical conversation to have before the candidate says a word.
        </p>
      </section>

      {/* ── As an interview tool ── */}
      <section id="as-an-interview-tool" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          As an interview tool
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          How to use the portfolio before, during, and after the interview.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          The portfolio is not a hiring decision. It is a preparation tool that makes interviews
          more efficient by directing attention to the most revealing evidence before the
          conversation begins.
        </p>

        <div className="border-l-2 border-zinc-800/50 pl-6 space-y-8 max-w-3xl">
          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              Before the interview
            </p>
            <p className="font-body text-t4 font-semibold text-text-primary mb-2">
              Read the Reflection document in full.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              Identify the two or three specific technical challenges the student documented. Note
              the points where they acknowledged failure, made a workaround, or described what a
              better solution would require. These are your interview questions — already written
              by the candidate before you spoke to them.
            </p>
          </div>

          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              During the interview
            </p>
            <p className="font-body text-t4 font-semibold text-text-primary mb-2">
              Ask the candidate to extend the reasoning they documented.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              Do not ask them to re-explain what they wrote — ask them to go further. If their
              Reflection describes a synchronization failure, ask: &quot;You mentioned vector clocks
              as the proper solution. Walk me through how that would work.&quot; If they can extend
              the reasoning fluently, the portfolio entry is validated by the interview. If they
              cannot explain what they wrote, that is also useful information — and a more
              informative signal than a generic technical question would have produced.
            </p>
          </div>

          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              After the interview
            </p>
            <p className="font-body text-t4 font-semibold text-text-primary mb-2">
              Calibrate the portfolio against what you observed.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              A candidate who could fluently extend the reasoning documented in their Reflection
              gives you high confidence that the portfolio reflects genuine work. A candidate
              who could not explain their documented reasoning at depth gives you a different
              signal. In both cases, the portfolio made the interview more efficient than a
              cold technical screen would have been.
            </p>
          </div>
        </div>
      </section>

      {/* ── Independent verification ── */}
      <section id="independent-verification" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Independent verification
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          How to confirm a portfolio entry is authentic without trusting the platform.
        </h2>

        <div className="space-y-5 font-body text-t4 text-text-secondary leading-relaxed max-w-3xl mb-8">
          <p>
            Every VERIFIED portfolio entry displays a SHA-256 document hash. This hash was computed
            from the submitted document content at the moment of submission and recorded in the
            verification audit log. It is the cryptographic anchor for the entire entry.
          </p>
        </div>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden max-w-3xl mb-8">
          <div className="px-5 py-3 border-b border-zinc-800/50">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
              How to verify independently
            </p>
          </div>
          {[
            {
              step: '1',
              action: 'Open the portfolio entry.',
              detail: 'Note the SHA-256 hash displayed on the page. Note the reviewer name and institutional affiliation.',
            },
            {
              step: '2',
              action: 'Download the Reflection document (or any document you want to verify).',
              detail: 'The portfolio page provides download links for each document.',
            },
            {
              step: '3',
              action: 'Compute the SHA-256 hash of the downloaded file.',
              detail:
                'On macOS: shasum -a 256 filename.pdf. On Windows: certutil -hashfile filename.pdf SHA256. On Linux: sha256sum filename.',
            },
            {
              step: '4',
              action: 'Compare the computed hash to the hash displayed on the portfolio page.',
              detail:
                'A match confirms: the document you read is identical to the document the reviewer reviewed. A mismatch indicates alteration after submission.',
            },
            {
              step: '5',
              action: 'Look up the reviewer independently.',
              detail:
                'The reviewer name and institutional affiliation are listed. You can search for them through the institution\'s directory. If you cannot find them, contact the platform to request a verification.',
            },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4 px-5 py-4 border-b border-zinc-800/50 last:border-0">
              <span className="font-mono text-t6 text-text-disabled shrink-0 mt-0.5">
                {item.step}.
              </span>
              <div>
                <p className="font-body text-t5 text-text-primary font-semibold mb-1">
                  {item.action}
                </p>
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-zinc-800/50 rounded-sm p-5 max-w-3xl">
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">What a matching hash confirms: </span>
            The documents you read are the same documents the reviewer reviewed. It does not confirm
            the student wrote them, that their claims are accurate, or that the reviewer&apos;s decision
            was correct. It is an integrity check, not an authorship proof.
          </p>
        </div>
      </section>

      {/* ── A real scenario ── */}
      <section id="a-real-scenario" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          A real scenario
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          A hiring manager encounters a verified portfolio for the first time.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          This scenario traces what actually happened — including the skepticism, the verification
          steps, and the decision at the end.
        </p>

        <div className="border-l-2 border-zinc-800/50 pl-6 space-y-8 max-w-3xl">
          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              Starting state
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              A hiring manager at a Nairobi fintech is reviewing CVs for a junior developer role.
              A shortlisted candidate has included a UmojaHub portfolio URL alongside their CV and
              GitHub link. The hiring manager has not seen this before. They click the link with
              low expectations.
            </p>
          </div>

          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              Reading the entry
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              The portfolio page loads without requiring registration. They see: a project title
              (crop health observation tool for smallholder farmers), Agriculture track, AI_BRIEF
              type, verification date, a reviewer name and institutional affiliation, a peer score
              of 3.8/5.0 across four dimensions, and three expandable documents.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed mt-3">
              They click the Reflection document. They read that the student built an offline-first
              mobile tool, attempted client-side timestamp queueing for sync conflict resolution,
              discovered the approach failed due to clock drift between devices, and documented both
              what they tried and what a proper solution — CRDTs or vector clocks — would require.
              They proposed the solution they did not implement and stated why they ran out of time.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed mt-3">
              The hiring manager has spent years conducting technical interviews trying to get this
              information. In most interviews, they get a version polished for performance. This was
              written before any interview, under no pressure, and it documents failure with
              specificity. That is unusual.
            </p>
          </div>

          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              The skepticism
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              Could this be fabricated? The hiring manager notes the document hash displayed at the
              bottom of the entry. They download the Reflection document. They run a SHA-256 hash.
              It matches the hash on the page. The documents they read are the same documents the
              reviewer reviewed.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed mt-3">
              They search the reviewer name. The reviewer is a lecturer in the Department of
              Computer Science at a Kenyan university. They exist. They teach there. The
              institutional affiliation is verifiable.
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed mt-3">
              Remaining question: did the student write the documents? The hash does not answer
              this. The hiring manager decides to find out in the interview.
            </p>
          </div>

          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              The interview
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              They ask the student: &quot;Your Reflection mentions CRDTs as the solution you did not
              have time to implement. Walk me through how a CRDT would address the clock drift
              problem you described.&quot;
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed mt-3">
              The student explains. They do not reach for their phone. They describe merge semantics
              at depth, acknowledge where their understanding ends, and ask a clarifying question
              about the fintech&apos;s data consistency requirements that suggests they were thinking
              about production concerns, not just the interview question.
            </p>
          </div>

          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              The outcome
            </p>
            <p className="font-body text-t4 text-text-secondary leading-relaxed">
              The hiring manager advanced the candidate. The portfolio entry did not make the
              hiring decision — the interview did. But the portfolio made the interview more
              efficient by providing a specific technical conversation before it began, and by
              giving the hiring manager a way to calibrate whether the documentation reflected
              genuine understanding.
            </p>
            <p className="font-body text-t4 text-text-disabled leading-relaxed mt-3">
              The student&apos;s GitHub portfolio had six repositories. The hiring manager had not looked
              at them. The Reflection document had taken ten minutes to read and had provided more
              useful information about how the candidate thinks than any code review would have.
            </p>
          </div>
        </div>
      </section>

      {/* ── Limitations ── */}
      <section id="limitations" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Limitations
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          What the platform cannot tell you.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          These limitations are real and consequential. Read them before making a hiring decision
          based on a portfolio entry.
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
          Questions employers ask.
        </h2>
        <FaqAccordion items={faqItems} />
      </section>

      {/* ── Misconceptions ── */}
      <section id="misconceptions" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Misconceptions
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          Common misreadings of a verified portfolio entry.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          These misconceptions lead to either overestimating or underestimating the evidence.
          Both are avoidable.
        </p>
        <div className="space-y-3">
          {misconceptions.map((item, i) => (
            <div key={i} className="border border-zinc-800/50 rounded-sm overflow-hidden">
              <div className="bg-surface-elevated px-5 py-3 border-b border-zinc-800/50">
                <p className="font-body text-t5 text-text-secondary">
                  <span className="text-text-disabled font-mono text-t6 uppercase tracking-widest mr-2">
                    Belief
                  </span>
                  {item.belief}
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  <span className="text-accent-green font-mono text-t6 uppercase tracking-widest mr-2">
                    Correction
                  </span>
                  {item.correction}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Next steps ── */}
      <section id="next-steps" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          What to do next
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-8">
          If a candidate has shared a portfolio URL.
        </h2>
        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden max-w-2xl">
          {[
            {
              n: '1',
              action: 'Open the portfolio page.',
              detail:
                'No registration required. Read the project title, track, and verification date first.',
            },
            {
              n: '2',
              action: 'Read the Reflection document.',
              detail:
                'This is the most useful document. Identify the specific technical challenges the student documented honestly.',
            },
            {
              n: '3',
              action: 'Note the reviewer name and look them up.',
              detail:
                'The reviewer&apos;s name and institutional affiliation are listed. A few minutes of search confirms they exist.',
            },
            {
              n: '4',
              action: 'Verify the document hash if you need independent confirmation.',
              detail:
                'Download a document and run SHA-256. A matching hash confirms the documents were not altered after submission.',
            },
            {
              n: '5',
              action: 'Use the Reflection to prepare your interview questions.',
              detail:
                'Ask the candidate to extend the reasoning they documented. Their response tells you whether the portfolio reflects genuine understanding.',
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
