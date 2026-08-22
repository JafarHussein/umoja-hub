import { ReportSectionKey, ReportSectionPart, SectionRequirement } from '@/types';

// ---------------------------------------------------------------------------
// The UmojaHub project report standard, as the application holds it.
//
// The canonical document is `webapp-reset/UMOJAHUB_PROJECT_REPORT_STANDARD_V1.md`.
// This file is that document's section list in a form the product can reason
// with: the workspace renders its guidance, validation checks its requirements,
// and the lecturer's review screen reads its labels. The two must agree, and
// when the standard is amended this file is amended with it.
//
// This is content, not logic. It is long because the guidance is the product —
// a section header with no explanation underneath it is how students end up
// writing a paragraph about what three-tier architecture is instead of
// describing the system they built.
// ---------------------------------------------------------------------------

export interface ReportSectionSpec {
  key: ReportSectionKey;
  /** Position in the report, matching the numbering in the standard. */
  number: number;
  part: ReportSectionPart;
  label: string;
  requirement: SectionRequirement;
  /**
   * For a conditional section: the circumstance that makes it required. Shown
   * to the student so "optional" never reads as "skip if busy".
   */
  condition?: string;
  /** One line naming what the section is for. */
  purpose: string;
  /** What belongs in it. Rendered as a checklist beside the editor. */
  guidance: string[];
  /** What does not belong in it. The commonest failures, named. */
  avoid?: string[];
  minWords: number;
  maxWords: number;
}

export const REPORT_SECTIONS: ReportSectionSpec[] = [
  // ---- Part A — Front matter ----
  {
    key: ReportSectionKey.TITLE,
    number: 1,
    part: ReportSectionPart.FRONT_MATTER,
    label: 'Title',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'Name the system and what it does.',
    guidance: [
      'Name the system and the problem it addresses.',
      'Be specific enough that a reader knows the domain before reading anything else.',
    ],
    avoid: ['Generic titles such as “A Web-Based Management System”.'],
    minWords: 4,
    maxWords: 30,
  },
  {
    key: ReportSectionKey.ABSTRACT,
    number: 2,
    part: ReportSectionPart.FRONT_MATTER,
    label: 'Abstract',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'A standalone summary of the whole project.',
    guidance: [
      'State the problem, what you built, how you approached it, what the results were, and what you concluded.',
      'Write it last, once the rest of the report is settled.',
      'A reader who reads only this should know whether the project is relevant to them.',
    ],
    avoid: [
      'Citations and figure references.',
      'Anything that does not also appear in the body of the report.',
    ],
    minWords: 150,
    maxWords: 300,
  },
  {
    key: ReportSectionKey.ORIGINALITY_AND_AI_USE,
    number: 3,
    part: ReportSectionPart.FRONT_MATTER,
    label: 'Originality and AI use',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'State that the work is yours, and where AI tooling was involved.',
    guidance: [
      'Confirm the work is your own and that sources are cited where used.',
      'Where you built on an existing codebase, template or open-source project, say what you inherited and what you added.',
      'Say where AI was used, why, what you verified, and what you changed or rejected.',
      'Say how you tested AI-assisted code, and what that testing found.',
    ],
    avoid: [
      'Treating AI use as a confession. It is not penalised — what is assessed is whether you understand the system.',
      'Claiming no AI was used where it was.',
    ],
    minWords: 150,
    maxWords: 400,
  },

  // ---- Part B — The problem ----
  {
    key: ReportSectionKey.INTRODUCTION,
    number: 4,
    part: ReportSectionPart.PROBLEM,
    label: 'Introduction and background',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'The setting, how it works now, and how the problem arises from it.',
    guidance: [
      'Introduce the area the project sits in and how things currently operate there.',
      'Name a concrete setting — an institution, a business, a community, a workflow.',
      'Finish with the reader understanding the context well enough that the problem feels inevitable.',
    ],
    avoid: ['Abstract sector description with no named setting.'],
    minWords: 400,
    maxWords: 900,
  },
  {
    key: ReportSectionKey.PROBLEM_STATEMENT,
    number: 5,
    part: ReportSectionPart.PROBLEM,
    label: 'Problem statement',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'The specific problem the system addresses.',
    guidance: [
      'State each distinct problem separately, with how it arises from the way work is currently done.',
      'Describe what goes wrong today, and for whom.',
    ],
    avoid: [
      'Stating the problem as the absence of a system. “There is a lack of a system” is not a problem — what goes wrong because it is absent is.',
      'General observations about a sector.',
    ],
    minWords: 250,
    maxWords: 600,
  },
  {
    key: ReportSectionKey.OBJECTIVES,
    number: 6,
    part: ReportSectionPart.PROBLEM,
    label: 'Objectives',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'What the project set out to achieve, checkably.',
    guidance: [
      'Write objectives that are specific, measurable, achievable, relevant and time-bound.',
      'Lead with verbs that commit to something checkable: design, implement, evaluate, measure, integrate.',
      'Write them so a reader can tell at the end whether each was met — your conclusion will return to this list.',
    ],
    avoid: [
      'Verbs that cannot be failed, and therefore cannot be passed: understand, explore, look into.',
    ],
    minWords: 150,
    maxWords: 400,
  },
  {
    key: ReportSectionKey.SCOPE_AND_JUSTIFICATION,
    number: 7,
    part: ReportSectionPart.PROBLEM,
    label: 'Scope and justification',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'What the project covers, what it deliberately does not, and why it is worth doing.',
    guidance: [
      'State what is in scope and — more usefully — what you deliberately excluded.',
      'Say who benefits, what the project makes possible, and why it is worth the effort.',
      'Name the engineering challenge in it, where there is one.',
    ],
    avoid: [
      'Leaving exclusions to the limitations section. A boundary stated up front is a design decision; the same boundary found later reads as something that ran out of time.',
    ],
    minWords: 250,
    maxWords: 600,
  },
  {
    key: ReportSectionKey.RELATED_WORK,
    number: 8,
    part: ReportSectionPart.PROBLEM,
    label: 'Related work and gap analysis',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'What already exists, and what it does not do that you do.',
    guidance: [
      'Examine existing systems and published work that address this problem or one close to it.',
      'For each: what it does, how, and where it succeeds.',
      'Then the gap: a named limitation in a named system that your project addresses. A comparison table works well.',
    ],
    avoid: [
      'Summarising sources without ever saying what they leave undone.',
      'Asserting in general that existing solutions are inadequate.',
    ],
    minWords: 600,
    maxWords: 1500,
  },

  // ---- Part C — The engineering ----
  {
    key: ReportSectionKey.REQUIREMENTS,
    number: 9,
    part: ReportSectionPart.ENGINEERING,
    label: 'Requirements',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'What the system must do, and what qualities it must hold.',
    guidance: [
      'Functional requirements: numbered, individually testable, written so the testing section can refer to them.',
      'Non-functional requirements: performance, availability, security, usability, maintainability, portability — each with a target where one can be stated.',
      'Say how the requirements were established: talking to people, observing a process, reading existing documents, or your own analysis of the domain.',
    ],
    avoid: [
      'Requirements that cannot be tested, such as “the system shall be user-friendly”.',
      'Inventing a survey or a sample that did not happen.',
    ],
    minWords: 500,
    maxWords: 1200,
  },
  {
    key: ReportSectionKey.SYSTEM_ANALYSIS,
    number: 10,
    part: ReportSectionPart.ENGINEERING,
    label: 'System analysis',
    requirement: SectionRequirement.CONDITIONAL,
    condition: 'Your project replaces or automates an existing process.',
    purpose: 'How the process works today, and where it breaks.',
    guidance: [
      'Describe the current process as you actually found it.',
      'Model it with whatever fits: a flow chart, a data-flow diagram, an activity diagram, a use-case diagram.',
      'Show where it breaks, and connect that to your problem statement.',
    ],
    avoid: ['Modelling an idealised version of the process rather than the real one.'],
    minWords: 400,
    maxWords: 1000,
  },
  {
    key: ReportSectionKey.SYSTEM_ARCHITECTURE,
    number: 11,
    part: ReportSectionPart.ENGINEERING,
    label: 'System architecture',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'The shape of the system you built, and why it is that shape.',
    guidance: [
      'Include an architecture diagram that matches your implementation.',
      'Describe each major component, what it is responsible for, and why it is separate.',
      'Say how components communicate — protocols, formats, synchronous or asynchronous.',
      'Say where state lives, and where the system boundary falls.',
      'Then the part that carries the most weight: why this architecture. What alternatives you considered, what each would have cost, and what decided it.',
    ],
    avoid: [
      'Explaining what an architectural pattern is in general. Describe yours.',
      'A diagram that does not correspond to what you built.',
    ],
    minWords: 600,
    maxWords: 1500,
  },
  {
    key: ReportSectionKey.DATABASE_DESIGN,
    number: 12,
    part: ReportSectionPart.ENGINEERING,
    label: 'Database design',
    requirement: SectionRequirement.CONDITIONAL,
    condition: 'Your system stores persistent data.',
    purpose: 'The data model, at all three levels, and the reasoning behind it.',
    guidance: [
      'Conceptual: the entities and their relationships, independent of any product.',
      'Logical: tables or collections, fields, types, keys, relationships.',
      'Physical: indexes, constraints, and the storage decisions that follow from your access patterns.',
      'Include an ER or schema diagram that corresponds to the schema the system actually runs on.',
      'Explain why this normalisation level, why these indexes, what queries the design favours, and what it is deliberately slow at.',
    ],
    avoid: ['A schema diagram that has drifted from the running schema.'],
    minWords: 500,
    maxWords: 1200,
  },
  {
    key: ReportSectionKey.INTERFACE_DESIGN,
    number: 13,
    part: ReportSectionPart.ENGINEERING,
    label: 'Interface design',
    requirement: SectionRequirement.CONDITIONAL,
    condition: 'Your system has a user interface, an API, or a command-line interface.',
    purpose: 'How people or programs interact with the system.',
    guidance: [
      'Show the main screens or interaction surfaces, what each is for, and how a user moves between them.',
      'Explain the design in terms of the user: who they are, on what device, under what conditions and what connection.',
      'Where the system is an API, a library or a CLI, that is its interface — document it here instead of screenshots.',
    ],
    avoid: ['Justifying the design on aesthetics rather than on who uses it and how.'],
    minWords: 300,
    maxWords: 800,
  },
  {
    key: ReportSectionKey.TECHNOLOGY_CHOICES,
    number: 14,
    part: ReportSectionPart.ENGINEERING,
    label: 'Technology choices and trade-offs',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'Every significant technology decision, and what decided it.',
    guidance: [
      'Language and framework, and what else you considered.',
      'Database: relational or not, which product, and what about your data made that right.',
      'Authentication and authorisation: the mechanism, and why it suits your threat model.',
      'Hosting and infrastructure, and any library the system depends on materially.',
      'For each: the alternatives, the trade-off, and what decided it. Constraints are legitimate deciders — existing knowledge, cost, hosting, offline requirements, deadline.',
    ],
    avoid: [
      'Describing what the technology is. The reader knows what a relational database is; they want to know why your project has one.',
      'Fabricating a benchmark to justify a choice you made for another reason.',
    ],
    minWords: 500,
    maxWords: 1200,
  },
  {
    key: ReportSectionKey.IMPLEMENTATION,
    number: 15,
    part: ReportSectionPart.ENGINEERING,
    label: 'Implementation and key technical decisions',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'How the system was actually built.',
    guidance: [
      'How the codebase is organised, and the convention a reader needs to find their way around it.',
      'The handful of decisions that shaped the implementation — each as: the problem, the options, the choice, the consequence.',
      'The two or three genuinely difficult parts, and how you solved them. Include the approach that did not work, if there was one.',
      'Error handling: what is retried, what reaches the user, what is logged, and what state the system is left in.',
      'Failure behaviour: what happens when the database, the network or an external service is unavailable.',
      'Short, specific code extracts attached to a point you are making.',
    ],
    avoid: [
      'A page of routine code. Ten lines showing how you prevented a race condition are worth more.',
      'A tour of every file in the repository.',
    ],
    minWords: 800,
    maxWords: 2000,
  },
  {
    key: ReportSectionKey.SECURITY,
    number: 16,
    part: ReportSectionPart.ENGINEERING,
    label: 'Security considerations',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'How the system protects what it holds.',
    guidance: [
      'Authentication: how users prove identity, how credentials are stored, how sessions are handled and expired.',
      'Authorisation: how the system decides who may do what, and where that is enforced. Enforcement in the interface only is not enforcement.',
      'Input validation: what is validated, where, and against what.',
      'Data protection: what is sensitive, and what is encrypted in transit and at rest.',
      'Known weaknesses: what you know is not adequately protected, and what it would take to fix.',
    ],
    avoid: [
      'Claiming the system has no security weaknesses. Naming your weakest assumption shows you understand it.',
      'A general essay on security threats that never reaches your system.',
    ],
    minWords: 400,
    maxWords: 1000,
  },
  {
    key: ReportSectionKey.TESTING,
    number: 17,
    part: ReportSectionPart.ENGINEERING,
    label: 'Testing and results',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'What you tested, what happened, and what you did about it.',
    guidance: [
      'Your testing strategy, and why those kinds of testing.',
      'Test cases traced back to the requirements they cover.',
      'Results: what passed, what failed, and what you changed in response.',
      'Evidence: real test output, a coverage figure, a screenshot of a passing run.',
      'What is not tested, and why. Every real system has untested parts.',
    ],
    avoid: [
      'A table of ticks with no output behind it.',
      'An account in which everything passed first time — that describes either a trivial system or an incomplete report.',
    ],
    minWords: 500,
    maxWords: 1200,
  },
  {
    key: ReportSectionKey.DEPLOYMENT,
    number: 18,
    part: ReportSectionPart.ENGINEERING,
    label: 'Deployment',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'Where the system runs, and how it got there.',
    guidance: [
      'The environment: hosting, runtime, database, managed services.',
      'How a deployment happens, and whether it is automated.',
      'How configuration and secrets are handled.',
      'How the running system is observed: logs, errors, uptime.',
      'If it runs only on your machine, say so plainly, with what deployment would require and why it was out of scope.',
    ],
    avoid: ['Claiming a deployment that does not exist. The demonstration will find it.'],
    minWords: 250,
    maxWords: 700,
  },

  // ---- Part D — Reflection ----
  {
    key: ReportSectionKey.CHALLENGES_AND_SOLUTIONS,
    number: 19,
    part: ReportSectionPart.REFLECTION,
    label: 'Challenges and solutions',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'The real difficulties, and how you got past them.',
    guidance: [
      'The genuine difficulties of the project — technical, and practical where relevant.',
      'How each was resolved or worked around.',
      'What you got wrong first, and what changed your approach.',
      'If you kept a blocker log while building, this is where that record becomes narrative.',
    ],
    avoid: [
      'An account with no difficulties in it. That describes either a trivial project or an incomplete report.',
    ],
    minWords: 400,
    maxWords: 1000,
  },
  {
    key: ReportSectionKey.LIMITATIONS,
    number: 20,
    part: ReportSectionPart.REFLECTION,
    label: 'Limitations',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'What the system does not do, and where it would not hold up.',
    guidance: [
      'Scope that was cut, requirements only partially met, and assumptions that would not survive real scale or real users.',
      'The conditions under which the system would fail.',
      'State them as engineering facts.',
    ],
    avoid: ['Apologising. A limitation you can name is a limitation you understand.'],
    minWords: 250,
    maxWords: 700,
  },
  {
    key: ReportSectionKey.FUTURE_IMPROVEMENTS,
    number: 21,
    part: ReportSectionPart.REFLECTION,
    label: 'Future improvements',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'What you would do next, and why it matters.',
    guidance: [
      'In priority order, with a sentence on why each matters.',
      'Specific enough that another engineer could pick one up.',
    ],
    avoid: ['A list of features with no reasoning about which matters most.'],
    minWords: 200,
    maxWords: 600,
  },
  {
    key: ReportSectionKey.CONCLUSION,
    number: 22,
    part: ReportSectionPart.REFLECTION,
    label: 'Conclusion',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'What was achieved, judged against your objectives.',
    guidance: [
      'Go through your objectives one by one and state whether each was met, partially met, or not met.',
      'Then what you take from the project: about the domain, about engineering, and about your own practice.',
    ],
    avoid: ['New material. Everything here should already appear in the body.'],
    minWords: 250,
    maxWords: 600,
  },
  {
    key: ReportSectionKey.DEMONSTRATION_READINESS,
    number: 23,
    part: ReportSectionPart.REFLECTION,
    label: 'Demonstration readiness',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'What you will show live, and what you already know is incomplete.',
    guidance: [
      'The specific flows you will run during the demonstration.',
      'What state it needs: data that must exist, accounts required, anything to prepare.',
      'What is known to be incomplete — the parts that do not work, or work only partly.',
      'Anything fragile, and what you will do if it fails on the day.',
    ],
    avoid: [
      'Hiding a broken feature and hoping it is not clicked. Declaring a known gap here is professional behaviour and is treated as such.',
    ],
    minWords: 200,
    maxWords: 500,
  },

  // ---- Part E — Back matter ----
  {
    key: ReportSectionKey.REFERENCES,
    number: 24,
    part: ReportSectionPart.BACK_MATTER,
    label: 'References',
    requirement: SectionRequirement.REQUIRED,
    purpose: 'Every source that shaped a decision.',
    guidance: [
      'Publications, documentation, standards, articles, repositories and any substantial technical resource you drew on.',
      'One recognised citation style, applied consistently. Harvard is the default.',
      'Documentation and repositories count as references and should be cited.',
    ],
    avoid: [
      'Listing works that appear nowhere in the body.',
      'An empty list. A project that consulted no external source in its lifetime is not credible.',
    ],
    minWords: 20,
    maxWords: 2000,
  },
  {
    key: ReportSectionKey.APPENDICES,
    number: 25,
    part: ReportSectionPart.BACK_MATTER,
    label: 'Appendices',
    requirement: SectionRequirement.CONDITIONAL,
    condition: 'You have supporting evidence too long to sit in the body.',
    purpose: 'Supporting evidence, referred to from the body.',
    guidance: [
      'Extended code, full schema definitions, complete API documentation, test output, user or technical guides.',
      'Reference every appendix from the section it supports.',
    ],
    avoid: [
      'Padding to reach a length. There is no minimum quantity of code in this standard.',
      'An appendix nothing in the body refers to.',
    ],
    minWords: 0,
    maxWords: 20000,
  },
];

/** Lookup by key — used everywhere a stored section has to be described. */
export const REPORT_SECTION_BY_KEY: Record<ReportSectionKey, ReportSectionSpec> =
  REPORT_SECTIONS.reduce(
    (acc, s) => {
      acc[s.key] = s;
      return acc;
    },
    {} as Record<ReportSectionKey, ReportSectionSpec>
  );

export const REQUIRED_SECTIONS: ReportSectionKey[] = REPORT_SECTIONS.filter(
  (s) => s.requirement === SectionRequirement.REQUIRED
).map((s) => s.key);

export const CONDITIONAL_SECTIONS: ReportSectionKey[] = REPORT_SECTIONS.filter(
  (s) => s.requirement === SectionRequirement.CONDITIONAL
).map((s) => s.key);

export const PART_LABEL: Record<ReportSectionPart, string> = {
  [ReportSectionPart.FRONT_MATTER]: 'Front matter',
  [ReportSectionPart.PROBLEM]: 'The problem',
  [ReportSectionPart.ENGINEERING]: 'The engineering',
  [ReportSectionPart.REFLECTION]: 'Reflection',
  [ReportSectionPart.BACK_MATTER]: 'Back matter',
};

