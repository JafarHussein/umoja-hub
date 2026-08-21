import { KnowledgeArea } from '@/types';

// ---------------------------------------------------------------------------
// The canonical taxonomy the Hub reasons in.
//
// A unit at a university is a label — `SCS 301`, `BCS 2205`, `ICS 2304` and
// `CIT 3151` can all be Database Systems II. Nothing downstream of the
// curriculum mapping ever sees a unit code: it sees knowledge areas, and every
// institution's messiness stops at that boundary.
//
// Each area carries the three things a brief needs to be *about* it rather than
// merely adjacent to it:
//
//   capabilities             what a student can do afterwards that they could
//                            not do before — the thing the project must make
//                            them practise
//   architecturalPressures   the forces that make the area load-bearing in a
//                            real system; a project that removes these is not
//                            exercising the area
//   antiPatterns             the shapes a project takes when it *claims* the
//                            area without exercising it — the quality bar a
//                            generated brief is checked against
//
// This file is content, not configuration: it is the vocabulary the brief
// generator and the lecturer rubric both speak.
// ---------------------------------------------------------------------------

export interface KnowledgeAreaProfile {
  /** Human-readable name, as a Kenyan CS/IT student would recognise it. */
  label: string;
  /** One sentence on what the area is actually about. */
  summary: string;
  capabilities: string[];
  architecturalPressures: string[];
  antiPatterns: string[];
}

export const KNOWLEDGE_AREAS: Record<KnowledgeArea, KnowledgeAreaProfile> = {
  [KnowledgeArea.PROGRAMMING_FUNDAMENTALS]: {
    label: 'Programming Fundamentals',
    summary: 'Writing correct, readable programs: control flow, functions, types and state.',
    capabilities: [
      'decompose a problem into functions with clear inputs and outputs',
      'handle invalid input and edge cases deliberately rather than by accident',
      'read and debug code they did not write',
    ],
    architecturalPressures: [
      'behaviour that must stay correct as the input space widens',
      'state that outlives a single function call',
    ],
    antiPatterns: [
      'a tutorial project copied end to end with the names changed',
      'no error path anywhere — every function assumes the happy case',
    ],
  },
  [KnowledgeArea.DATA_STRUCTURES_ALGORITHMS]: {
    label: 'Data Structures and Algorithms',
    summary: 'Choosing representations and procedures whose cost is understood, not guessed.',
    capabilities: [
      'choose a data structure from the access pattern rather than from habit',
      'reason about time and space cost before writing the code',
      'measure a hot path instead of speculating about it',
    ],
    architecturalPressures: [
      'a data volume large enough that a linear scan is visibly wrong',
      'a latency budget the naive implementation cannot meet',
    ],
    antiPatterns: [
      'a dataset small enough that any structure would do',
      'complexity asserted in the report and never measured in the system',
    ],
  },
  [KnowledgeArea.DATABASE_SYSTEMS]: {
    label: 'Database Systems',
    summary: 'Modelling data, querying it efficiently, and keeping it consistent under change.',
    capabilities: [
      'design a schema from the queries the system must answer',
      'use transactions and constraints to make invalid states unrepresentable',
      'read a query plan and act on it with an index',
    ],
    architecturalPressures: [
      'two writers who can touch the same record at the same time',
      'a report query that must stay fast as rows accumulate',
      'a rule the application must never be able to violate',
    ],
    antiPatterns: [
      'one table per screen, with the joins done in application code',
      'every consistency rule enforced only in the UI',
    ],
  },
  [KnowledgeArea.NETWORKING]: {
    label: 'Computer Networks',
    summary: 'How processes on different machines find each other and exchange bytes reliably.',
    capabilities: [
      'choose a protocol from the delivery guarantees the feature needs',
      'design for latency, loss and reconnection rather than assuming a perfect link',
      'inspect traffic to explain what a system is really doing',
    ],
    architecturalPressures: [
      'an intermittent connection that drops mid-operation',
      'a payload size or round-trip count that matters on a mobile data bundle',
    ],
    antiPatterns: [
      'every network call assumed to succeed instantly',
      'the network reduced to a single `fetch` in the UI layer',
    ],
  },
  [KnowledgeArea.OPERATING_SYSTEMS]: {
    label: 'Operating Systems',
    summary: 'Processes, threads, scheduling, memory and the resources programs contend for.',
    capabilities: [
      'reason about concurrency: what runs at the same time and what must not',
      'use processes, threads or async work deliberately',
      'find and fix a resource leak',
    ],
    architecturalPressures: [
      'work that must proceed while the user is doing something else',
      'a shared resource two units of work can reach at once',
    ],
    antiPatterns: [
      'concurrency claimed but everything runs on one request thread',
      'a race condition described in the report as a rare bug',
    ],
  },
  [KnowledgeArea.SOFTWARE_ENGINEERING]: {
    label: 'Software Engineering',
    summary: 'Building software that other people can change: structure, tests, versioning, review.',
    capabilities: [
      'separate a system into parts with boundaries that hold',
      'write tests that would actually fail if the behaviour broke',
      'work in reviewable increments with an honest commit history',
    ],
    architecturalPressures: [
      'a requirement that changes after the design is set',
      'a second person who has to understand the code',
    ],
    antiPatterns: [
      'tests that assert the code does what it does',
      'one commit at the end of the semester',
    ],
  },
  [KnowledgeArea.WEB_DEVELOPMENT]: {
    label: 'Web Development',
    summary: 'Client, server and the contract between them, over HTTP.',
    capabilities: [
      'design an API contract and hold both sides to it',
      'manage state that lives in a browser, a session and a database at once',
      'handle authentication, validation and errors on the server, not only the client',
    ],
    architecturalPressures: [
      'a client the server cannot trust',
      'a page that must remain usable on a slow mobile connection',
    ],
    antiPatterns: [
      'validation and authorisation performed only in the browser',
      'a "backend" that is a single file of database calls',
    ],
  },
  [KnowledgeArea.MOBILE_DEVELOPMENT]: {
    label: 'Mobile Development',
    summary: 'Software on a device with a battery, a data bundle and an unreliable link.',
    capabilities: [
      'design for offline use and later reconciliation',
      'budget battery, storage and data deliberately',
      'handle a lifecycle where the OS can suspend or kill the app',
    ],
    architecturalPressures: [
      'a user who goes offline mid-task and returns hours later',
      'two devices that edited the same record while apart',
    ],
    antiPatterns: [
      'a mobile app that is unusable without a connection',
      'sync described as "the app refreshes on open"',
    ],
  },
  [KnowledgeArea.ARTIFICIAL_INTELLIGENCE]: {
    label: 'Artificial Intelligence',
    summary: 'Search, reasoning and decision-making under uncertainty and incomplete information.',
    capabilities: [
      'formulate a problem as states, actions and an objective',
      'choose a technique from the problem structure rather than from fashion',
      'evaluate a decision system against a baseline',
    ],
    architecturalPressures: [
      'a decision that must be made from partial information',
      'a search space too large to enumerate',
    ],
    antiPatterns: [
      'an API call to a hosted model described as the AI component',
      'no baseline, so nothing shows the technique helped',
    ],
  },
  [KnowledgeArea.MACHINE_LEARNING]: {
    label: 'Machine Learning',
    summary: 'Learning a function from data, and knowing whether it generalises.',
    capabilities: [
      'build an honest train/validation/test split for the real deployment condition',
      'choose metrics that reflect the cost of each kind of error',
      'serve a model and monitor what happens to it afterwards',
    ],
    architecturalPressures: [
      'data that shifts after the model is trained',
      'a prediction that must be produced inside a request budget',
    ],
    antiPatterns: [
      'accuracy reported on the training set',
      'a notebook that never becomes part of the system',
    ],
  },
  [KnowledgeArea.DATA_ENGINEERING]: {
    label: 'Data Engineering',
    summary: 'Moving data between systems reliably, and making it fit to use on arrival.',
    capabilities: [
      'build a pipeline that can be re-run without corrupting its output',
      'validate data at the boundary and quarantine what fails',
      'model data for analysis rather than for transactions',
    ],
    architecturalPressures: [
      'a source that delivers late, twice, or malformed',
      'a volume that cannot be reprocessed from scratch each time',
    ],
    antiPatterns: [
      'a one-off import script presented as a pipeline',
      'no idempotency, so a retry doubles the data',
    ],
  },
  [KnowledgeArea.CLOUD_COMPUTING]: {
    label: 'Cloud Computing',
    summary: 'Running software on infrastructure you configure rather than own.',
    capabilities: [
      'deploy repeatably from a definition rather than by hand',
      'reason about cost as an engineering constraint',
      'use managed services without losing the ability to explain them',
    ],
    architecturalPressures: [
      'an instance that can disappear without warning',
      'load that varies by an order of magnitude across a day',
    ],
    antiPatterns: [
      'a single manually configured server called a cloud deployment',
      'secrets and configuration committed alongside the code',
    ],
  },
  [KnowledgeArea.DISTRIBUTED_SYSTEMS]: {
    label: 'Distributed Systems',
    summary: 'Several machines cooperating, any of which may fail or be unreachable.',
    capabilities: [
      'design for partial failure instead of treating it as an exception',
      'choose a consistency model and defend the choice',
      'make an operation safe to retry',
    ],
    architecturalPressures: [
      'a component that is down while the rest keeps serving',
      'a message that arrives twice, or out of order',
    ],
    antiPatterns: [
      'two services on one machine sharing one database and called distributed',
      'a failure path that exists only in the diagram',
    ],
  },
  [KnowledgeArea.INFORMATION_SECURITY]: {
    label: 'Information Security',
    summary: 'Protecting data and access against someone who is actively trying.',
    capabilities: [
      'reason about a threat model rather than a checklist',
      'implement authentication and authorisation that hold at the server',
      'store and transmit sensitive data defensibly',
    ],
    architecturalPressures: [
      'an input written by someone who wants the system to misbehave',
      'data whose disclosure would harm a real person',
    ],
    antiPatterns: [
      'security equated with a login page',
      'roles checked in the interface and nowhere else',
    ],
  },
  [KnowledgeArea.HUMAN_COMPUTER_INTERACTION]: {
    label: 'Human–Computer Interaction',
    summary: 'Designing for the person who has to use the thing, and testing that claim.',
    capabilities: [
      'turn an observed task into an interface, not a form per table',
      'test with real users and change the design because of it',
      'design for accessibility and for low-literacy or bilingual users',
    ],
    architecturalPressures: [
      'a user whose task does not match the data model',
      'an error the user must be able to recover from unaided',
    ],
    antiPatterns: [
      'usability asserted without a single user having touched it',
      'a redesign justified by taste alone',
    ],
  },
  [KnowledgeArea.SYSTEMS_ANALYSIS_DESIGN]: {
    label: 'Systems Analysis and Design',
    summary: 'Turning a real organisation’s problem into a specification a system can meet.',
    capabilities: [
      'elicit requirements from people who describe symptoms, not needs',
      'model the current process before proposing a new one',
      'trace every feature back to a requirement and a stakeholder',
    ],
    architecturalPressures: [
      'a workflow that already exists on paper and cannot simply be replaced',
      'stakeholders whose stated requirements conflict',
    ],
    antiPatterns: [
      'requirements invented to match a system already decided on',
      'diagrams produced after the code, to satisfy the report',
    ],
  },
  [KnowledgeArea.COMPUTER_ARCHITECTURE]: {
    label: 'Computer Architecture',
    summary: 'What the machine actually does: instructions, memory hierarchy, I/O.',
    capabilities: [
      'explain performance in terms of memory access and instruction cost',
      'work close to the hardware or to a constrained device',
      'reason about representation — bytes, encodings and alignment',
    ],
    architecturalPressures: [
      'a device with hard memory or compute limits',
      'a workload whose cost is dominated by data movement',
    ],
    antiPatterns: [
      'architecture discussed only as a diagram of boxes',
      'performance claims with no measurement of the machine',
    ],
  },
  [KnowledgeArea.RESEARCH_METHODS]: {
    label: 'Research Methods',
    summary: 'Asking an answerable question and producing evidence that survives scrutiny.',
    capabilities: [
      'state a hypothesis that could be wrong',
      'design a comparison with a control and defensible sampling',
      'report results honestly, including the ones that did not help',
    ],
    architecturalPressures: [
      'a claim that must be supported by data the student gathered',
      'a result that must be reproducible by the reader',
    ],
    antiPatterns: [
      'a literature review with no question behind it',
      'evidence selected after the conclusion was chosen',
    ],
  },
};

export const ALL_KNOWLEDGE_AREAS = Object.keys(KNOWLEDGE_AREAS) as KnowledgeArea[];

/** True when `value` is one of the canonical areas. */
export function isKnowledgeArea(value: unknown): value is KnowledgeArea {
  return typeof value === 'string' && value in KNOWLEDGE_AREAS;
}

export function knowledgeAreaLabel(area: KnowledgeArea): string {
  return KNOWLEDGE_AREAS[area].label;
}

/** Labels for a list of areas, unknown values dropped rather than rendered raw. */
export function knowledgeAreaLabels(areas: readonly string[]): string[] {
  return areas.filter(isKnowledgeArea).map(knowledgeAreaLabel);
}
