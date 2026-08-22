// Report prose for the demo world.
//
// A seeded report has to survive being read. A presenter opens a student's
// project in front of a panel and scrolls through twenty sections; anything
// generic, repetitive or obviously templated is noticed immediately, and
// "Lorem ipsum" would be caught by the validator anyway.
//
// So each section is written as a student would write it about *this* project:
// the title, the stack, the units they are taking and the domain the brief was
// set in all appear in the prose. The result is not literature, but it is an
// account of a system rather than a description of a category — which is the
// distinction the standard itself is built on.

import type { Rng } from '../rng';
import { ReportSectionKey } from '../../../src/types';

export interface ReportContentInput {
  title: string;
  stack: string[];
  units: string[];
  programmeName: string;
  year: number;
  semester: number;
  /** The Kenyan setting the brief was written in. */
  industry: string;
  interest: string;
  repoUrl?: string | undefined;
}

const DATABASES = ['PostgreSQL', 'MongoDB', 'MySQL', 'SQLite'];

function pickDb(stack: string[]): string {
  return stack.find((s) => DATABASES.includes(s)) ?? 'PostgreSQL';
}

function primaryLanguage(stack: string[]): string {
  return stack[0] ?? 'TypeScript';
}

/**
 * Every section of one student's report.
 *
 * Returns a map keyed by `ReportSectionKey`. Conditional sections that this
 * generator does not write are simply absent, and the seeder records a waiver
 * for them — the same shape a real student's report has.
 */
export function reportSections(
  rng: Rng,
  input: ReportContentInput
): Record<string, string> {
  const { title, stack, units, programmeName, year, semester, industry } = input;
  const db = pickDb(stack);
  const lang = primaryLanguage(stack);
  const unitList = units.slice(0, 3).join(', ') || 'this semester’s units';
  const first = units[0] ?? 'the unit';

  const alternative = rng.pick([
    'a single server rendering everything',
    'a set of small services behind a gateway',
    'a mobile-only application with no backend of its own',
    'a scheduled batch job writing to a shared database',
  ]);

  return {
    [ReportSectionKey.TITLE]: title,

    [ReportSectionKey.ABSTRACT]: `This report describes ${title}, a system built for ${industry} in Kenya. The work was carried out during year ${year}, semester ${semester} of ${programmeName}, and was set against ${unitList}. The problem addressed is that the process it replaces is carried out on paper and in spreadsheets, so records go missing, nobody can say what the current position is, and the people who depend on the information receive it too late to act on. The system was built with ${stack.slice(0, 3).join(', ')} and stores its data in ${db}. It was developed incrementally, beginning with the data model and the part of the problem carrying the most risk, and tested with a mixture of automated tests and manual scenarios drawn from the requirements. The result is a working system covering the core flows, deployed and demonstrable, with the limitations recorded honestly in this report. The main finding is that the difficulty in this domain is not the interface but the behaviour of the system when the network, the hardware or the people using it do not cooperate.`,

    [ReportSectionKey.ORIGINALITY_AND_AI_USE]: `This project is my own work. Where I have drawn on documentation, articles or open-source code I have cited it in the references, and no part of this system was submitted for any other assessment. The codebase was written from an empty repository rather than from a template.

I used an AI assistant during development, mainly for two things: explaining unfamiliar library behaviour, and drafting boilerplate such as validation schemas and test scaffolding. I did not use it to design the system. Every suggestion it produced was read before it was used, and a substantial number were rejected — most usefully, it proposed an approach to the synchronisation problem that would have lost writes when two devices reconnected in the wrong order, which I found by writing a test for that exact case. Where I kept AI-assisted code I tested it the same way I tested my own, and the decisions in this report about architecture, schema, and technology are mine. Anything wrong in this system is my responsibility.`,

    [ReportSectionKey.INTRODUCTION]: `${industry} in Kenya operates on a mixture of paper records, phone calls and spreadsheets maintained by one or two people. The organisation this project was set against follows the same pattern. Information is captured by hand at the point where the work happens, carried physically or by phone to whoever compiles it, and typed into a spreadsheet at the end of the day or the week. That spreadsheet is the only complete picture anybody has, and it lives on one machine.

This works, in the sense that the organisation functions. It fails in specific and predictable ways. Records are lost between the point of capture and the point of entry, and nobody can tell which are missing because there is no independent count. The compiled position is always out of date by the length of the compilation cycle, so decisions are made on last week's information. And because there is one copy, a lost or corrupted file loses the history.

Connectivity is the constraint that shapes everything here. Coverage is intermittent rather than absent: it works for part of the day, at part of the site, and drops without warning. A system that assumes a connection is not one that will be used, because the first time it fails during a task the user goes back to paper and does not return. This was the single most important fact in the design, and it is why the offline behaviour described in the architecture section is not a feature added at the end but the shape of the whole system.

The project was undertaken as part of ${programmeName}, against ${unitList}, and the design decisions in this report are deliberately connected to what those units cover.`,

    [ReportSectionKey.PROBLEM_STATEMENT]: `Three distinct problems arise from the way the work is currently done.

First, records are lost in transit. Data is written down where the work happens and entered into a spreadsheet somewhere else, often hours or days later. Because there is no reconciliation between the two, a sheet that never arrives is simply absent, and its absence is invisible. Staff described discovering gaps weeks afterwards, by which point the original information could not be reconstructed.

Second, nobody can state the current position. The compiled record is only as current as the last compilation, so any question about today is answered from memory or by telephone. When the answer matters — whether something has been done, where something is, how long somebody has been waiting — the delay is the difference between acting and not acting.

Third, there is no history that survives a single point of failure. One spreadsheet on one machine holds everything. There is no audit of who changed what, so a disputed figure cannot be traced, and a corrupted file loses the record entirely.

These are not problems of effort. The people doing the work are careful; the process is what fails them, and it fails in ways more care cannot fix.`,

    [ReportSectionKey.OBJECTIVES]: `The objectives of this project were:

1. To analyse the current process and document how information moves through it, identifying the specific points at which records are lost, by the end of the third week.
2. To design a data model that supports capture at the point of work and reconciliation afterwards, with the invariants stated explicitly.
3. To implement a system that allows a user to record and retrieve information while the device has no network connection, and to synchronise reliably when the connection returns.
4. To implement role-based access so that each user sees and can change only what their role requires.
5. To test the synchronisation behaviour against defined failure scenarios, including delayed, duplicated and out-of-order delivery, and to record the results.
6. To deploy the system to an environment reachable from outside my own machine, and to demonstrate it running.
7. To evaluate the result against these objectives and record what was not achieved.

The conclusion returns to each of these and states the outcome.`,

    [ReportSectionKey.SCOPE_AND_JUSTIFICATION]: `Scope. The system covers capture, storage, synchronisation, retrieval and role-based access for the core records in this process, together with the summary that is currently compiled by hand. It has a web interface usable on a low-end mobile browser.

Deliberately out of scope: payments and any financial integration, SMS and USSD channels, multi-organisation tenancy, and reporting beyond the single summary named above. Each was excluded at the start rather than abandoned later. Payments would have doubled the compliance surface for a project whose problem is record-keeping. SMS was considered seriously and rejected because it cannot carry the structured records the process needs, though it would be the obvious next channel. Multi-tenancy is a real requirement for anything beyond one organisation and is recorded under future improvements.

Justification. The value is in the reconciliation, not in the data entry. Replacing paper with a form saves a little time; making it possible to state, at any moment, what has been recorded and what is missing changes what the organisation can do. The engineering interest is in the offline behaviour: the system has to be correct when two devices have been apart, have both recorded work, and reconnect in an order nobody controls. That is a genuinely difficult problem and it connects directly to ${first}, which is why it was worth building rather than describing.`,

    [ReportSectionKey.RELATED_WORK]: `Several categories of existing system address parts of this problem.

General-purpose form tools such as KoBoToolbox and Google Forms with offline collection are widely used across Kenya for exactly this kind of field capture. They are mature, well-documented and free at this scale, and they solve the capture problem properly. What they do not do is reconcile. They collect submissions into a table; they have no model of the entity being tracked over time, so they cannot answer "what is the current state of this record" or "which expected records have not arrived". For a process whose failure mode is silent absence, that gap is the whole problem.

Commercial management systems for ${industry} exist and do model the domain. They assume continuous connectivity, are priced per seat in a currency the organisation does not earn in, and are configured by a vendor. The connectivity assumption alone rules them out.

Spreadsheet-based workflows with cloud sync — the current practice, essentially — are worth taking seriously because they are what the system has to beat. They are flexible and everybody knows them. They provide no validation, no concurrent editing story worth the name, no access control below file level, and no audit trail.

The academic literature on offline-first synchronisation, particularly work on conflict-free replicated data types and on operational transformation, was directly useful. Both offer stronger guarantees than this project needs; the value was in the framing of what "conflict" means, which shaped the reconciliation rule described in the implementation.

Gap analysis. Nothing found combines three things this problem requires together: an explicit model of the record's state over time, correct behaviour when devices reconnect out of order, and operation on hardware and connections that actually exist here. The form tools have the last, the commercial systems have the first, and neither has the second. That combination is what this project builds.`,

    [ReportSectionKey.REQUIREMENTS]: `Requirements were established by walking through the existing process with the people who carry it out, reading the spreadsheets and paper forms currently in use, and observing a full cycle of the work. No survey was conducted; the population is small enough that observation and conversation gave better information than a questionnaire would have.

Functional requirements

FR1. A user shall record a new entry while the device has no network connection.
FR2. The system shall store an unsynchronised entry locally and retain it across a browser restart.
FR3. The system shall synchronise pending entries when connectivity returns, without duplicating any entry.
FR4. The system shall reconcile entries recorded on two devices during the same period and present a determinate result.
FR5. A user shall see which of their entries have not yet reached the server.
FR6. The system shall produce the periodic summary currently compiled by hand.
FR7. The system shall record who created or changed an entry, and when.
FR8. An administrator shall be able to see entries expected but not received.
FR9. Each role shall see only the records its role requires.

Non-functional requirements

NFR1. The interface shall remain usable for a full working day with no connection.
NFR2. The application shall load and operate on a device with 1 GB of RAM over a 3G connection; first contentful paint under four seconds on that profile.
NFR3. Passwords shall never be stored in recoverable form.
NFR4. Every write shall be attributable to an authenticated user.
NFR5. A synchronisation of one day's entries shall complete within thirty seconds on the target connection.
NFR6. The system shall be operable by a user who has not been trained beyond a single walkthrough.

FR3, FR4 and NFR1 are the requirements that shaped the architecture. The rest follow from them.`,

    [ReportSectionKey.SYSTEM_ANALYSIS]: `The current process runs in four stages. Work happens and is recorded on a paper form at the point it happens. The forms are gathered, usually at the end of a shift or a day. Somebody enters them into a spreadsheet, typically in one sitting. The spreadsheet is then used to answer questions and to produce the periodic summary.

Two of the four stages are where the process breaks.

Between capture and gathering, forms are lost. There is no manifest of what was captured, so a form that does not arrive leaves no trace. Observation of one cycle found discrepancies that nobody had noticed, and no way to determine whether they were lost forms or work that had not been recorded at all.

Between gathering and entry, the delay accumulates. Entry happens in batches because it is tedious, so the spreadsheet is behind by the length of the batch. Every question asked in that window is answered from memory.

Modelled as a data flow, the process has one store — the spreadsheet — and no feedback path from it back to the point of capture. Nothing downstream tells anybody upstream that something is missing. That absent feedback path is the single structural fault, and the requirement for a reconciliation view (FR8) exists to supply it.`,

    [ReportSectionKey.SYSTEM_ARCHITECTURE]: `The system is a client-heavy web application with a thin server, in four parts.

The client is a ${lang} application built with ${stack.slice(0, 2).join(' and ')}. It owns a local store — IndexedDB through a small wrapper — which is the source of truth for the user's own session. The interface reads from and writes to this local store only. It never waits on the network to complete a user action, which is the concrete expression of NFR1.

The synchronisation queue sits between the local store and the API. Every write produces an entry in an append-only outbox with a client-generated identifier and a monotonic sequence number. The queue drains when connectivity is available and retries with backoff when it is not. Because the identifier is generated on the client and the server treats it as a natural key, replaying the queue is safe: a duplicated request writes nothing new.

The API is a stateless ${lang} service exposing a small set of endpoints for pushing queued writes, pulling changes since a given point, and reading the summary. It holds no session state, so it can be restarted or scaled without coordination.

The data store is ${db}. It holds the authoritative record, the identity data, and the change history.

Why this shape. The alternative I considered most seriously was ${alternative}. That would have been simpler to build and easier to reason about, and it fails NFR1 immediately: any design in which the user's action requires a round trip is unusable here. Having accepted that the client must work alone, the outbox pattern follows almost forcibly — the interesting decision is not whether to queue but what the queue's identifiers are, and generating them on the client is what makes retries idempotent.

I deliberately did not split the server into multiple services. There is one team, one deployment, and no component with a different scaling profile, so the operational cost of separation would have bought nothing. Under a different load profile — particularly if the summary computation grew expensive — separating the read path would be the first thing I would do.

The system boundary is narrow: the API, the database, and nothing else. There is no external service on the critical path, which is a deliberate consequence of the connectivity constraint.`,

    [ReportSectionKey.DATABASE_DESIGN]: `Conceptual. There are four entities. A **user** belongs to an organisation and holds a role. A **record** is the unit of work being tracked; it belongs to an organisation, was created by a user, and moves through states. A **change** is one modification to a record, attributed to a user and stamped with a time. A **sync batch** is one delivery from one device, holding the client identifiers it carried.

Records and changes are one-to-many: a record has many changes, and the record's current state is a materialised result of them rather than the only copy of the truth. That separation is what makes FR7 possible without a second audit mechanism.

Logical. In ${db}, "records" holds the current state with the client identifier as a unique natural key alongside the surrogate primary key. "changes" holds record identifier, user identifier, the field changed, previous and new value, the client sequence number, and the timestamp. "users" holds identity, hashed credential, organisation and role. "sync_batches" holds device identifier, arrival time and the client identifiers included, which is what lets a redelivered batch be recognised.

Physical. Three indexes carry the real load. A unique index on the client identifier is the idempotency guarantee — it is what makes FR3 a database property rather than an application hope, and it is the most important single line in the schema. A compound index on organisation and state serves every list view. An index on record identifier and client sequence number orders the change history for reconciliation.

The design is normalised to third normal form with one deliberate exception: the record's current state is stored on the record as well as being derivable from its changes. That is denormalisation, and it was chosen because every list view needs the current state and replaying a change log per row would make the commonest query the slowest. The cost is that the two can drift; the mitigation is that state is only ever written by the same code path that appends the change, and a consistency check is part of the test suite.

The design is deliberately slow at one thing: reconstructing a record's state at an arbitrary past moment requires replaying its changes. That query is rare and was not worth optimising for.`,

    [ReportSectionKey.INTERFACE_DESIGN]: `The interface has four surfaces: a capture form, a list of the user's own records with their sync state, a reconciliation view for administrators, and the summary.

The design is shaped by who uses it and where. The primary user is recording work on a phone, often outdoors, sometimes one-handed, with a connection that may or may not exist. That produces specific decisions. Targets are large enough for imprecise taps. The capture form is a single column with no horizontal scrolling at 360 px. Nothing is hidden behind a hover. Every record in the list carries a visible sync state, because a user who cannot tell whether their work has been saved will write it on paper as well, and at that point the system has failed.

The reconciliation view is the one screen designed for a desk. It is dense on purpose: its user is comparing expected against received, and that comparison is easier with more on screen at once.

Colour is not the only signal for sync state; each state carries a text label as well as a colour, so the interface remains usable in bright sunlight and to a colour-blind user.`,

    [ReportSectionKey.TECHNOLOGY_CHOICES]: `Language and framework. ${stack.slice(0, 2).join(' with ')}. The alternatives I weighed were a native Android application and a server-rendered application with progressive enhancement. Native would have given better offline storage guarantees and a more reliable background sync, and I rejected it because the organisation's devices are mixed and a web application reaches all of them without an installation step the users would have to be walked through. Server-rendered was rejected outright: it cannot satisfy NFR1. The deciding factor was reach, and I would revisit it if the deployment were ever to a controlled fleet of devices.

Database: ${db}. ${
      db === 'MongoDB'
        ? 'The records are a single aggregate that is always read whole, and the schema was still moving during development, so a document store fitted the access pattern and cost me less migration work. The trade-off I accepted is weaker cross-entity constraints; the idempotency key is enforced with a unique index, which is the one constraint I could not do without.'
        : 'The data is relational and the constraints matter — particularly the unique client identifier that makes synchronisation idempotent, and the foreign key from changes to records. A document store would have been quicker to start with and would have made those guarantees my problem instead of the database’s.'
    } I also considered SQLite on the server for its simplicity, and rejected it because concurrent writes from multiple devices are exactly its weak point.

Authentication. Session-based authentication with an HTTP-only cookie and a server-side session record, over a token held in local storage. The threat model here is a shared device: a token in local storage survives the user walking away, and cannot be revoked centrally when it should be. A cookie with a short expiry and server-side revocation fits a context where devices are shared between shifts. Passwords are hashed with bcrypt at a cost factor chosen by measuring on the deployment hardware rather than copied from a tutorial.

Hosting. A managed platform with a free tier, because there is no budget and no operations capacity. The trade-off is a cold start on the first request after idle, which is acceptable for this usage pattern and would not be for a system with a latency requirement.

Libraries. The only substantial dependency beyond the framework is the validation library, used because the same schema validates on both the client and the server and a single definition means the two cannot disagree.`,

    [ReportSectionKey.IMPLEMENTATION]: `The codebase is organised by feature rather than by layer. Each feature directory holds its own components, its API handlers, its validation schemas and its tests. A reader looking for how synchronisation works finds all of it in one directory rather than assembling it from four. The shared directory holds only what genuinely has more than one caller.

Key decisions.

Client-generated identifiers. The problem was that a request whose response is lost is indistinguishable, from the client, from a request that never arrived. The options were server-generated identifiers with a separate deduplication token, or generating the identifier on the client and treating it as the natural key. I chose the second because it collapses two mechanisms into one: the identity of the record *is* the deduplication key, so there is nothing to keep in step. The consequence is that identifiers are UUIDs rather than sequential integers, which costs index size and readability.

Last-write-wins per field, not per record. When two devices have edited the same record, resolving at record granularity discards one device's work entirely. Resolving per field, ordered by the client sequence number and broken by device identifier, keeps both edits when they touched different fields. It is not a general solution — two devices editing the same field still lose one — but it matches how the work actually happens, where two people record different aspects of the same item. This rule is stated on screen where a reconciliation occurs, because a silent resolution is worse than a visible one.

An append-only change log. Every mutation writes a change row before the record's state is updated, in a transaction. This gives FR7 for free and made a class of bug findable during development that would otherwise have been invisible.

The hard parts. Synchronisation ordering took the longest. My first implementation drained the outbox in parallel for speed, which meant a create and its subsequent update could arrive in either order; the update would then fail against a record that did not yet exist, and the retry logic would loop. I rewrote it to drain strictly in sequence per record while allowing parallelism across records, which is slower and correct. The second was the local store's behaviour on a browser storage eviction — IndexedDB can be cleared by the browser under pressure, which I discovered on a low-memory test device and not before.

Error handling. Errors are classified into three kinds and handled differently. A validation error is the user's to fix and is shown inline against the field. A transient error — network failure, a 5xx, a timeout — is retried with exponential backoff and jitter, and after the retry budget is exhausted the item stays in the outbox and is surfaced as "not yet saved" rather than discarded. A programming error is logged with its context and shown to the user as a generic failure, because a stack trace tells them nothing and tells an attacker something.

Failure behaviour. If the database is unavailable the API returns 503 and writes nothing; the client's outbox retains the item and retries, so the user's work is not lost. If the network is unavailable the client does not notice, by design. If the client's local store is unavailable the application refuses to start rather than running in a mode where writes appear to succeed and vanish — that was a deliberate decision after the eviction bug, and it is the only place where the system chooses to stop rather than degrade.`,

    [ReportSectionKey.SECURITY]: `Authentication. Users authenticate with an email and a password. Passwords are hashed with bcrypt; the cost factor was chosen by timing on the deployment hardware to land around 250 ms, which is slow enough to be expensive to attack and fast enough not to be a denial-of-service vector. Sessions are held server-side and referenced by an HTTP-only, Secure, SameSite cookie, so a cross-site script cannot read the session and a session can be revoked centrally when a shared device changes hands. Sessions expire after eight hours, which is one working shift.

Authorisation. Every API handler checks the caller's role before it does anything, and the check is against the session's role rather than anything supplied in the request. Ownership is expressed in the query rather than as a check afterwards — a request for another organisation's record returns nothing rather than returning a record and then refusing it, so a missing check cannot leak existence. The interface also hides what a role cannot use, but that is a convenience and not the control; every restriction is enforced server-side, and I tested that by calling the endpoints directly.

Input validation. Every request body is validated against a schema at the boundary before it reaches any handler logic. The same schema runs on the client, so the two cannot disagree about what is acceptable. Database access is through parameterised queries only; no query is assembled by string concatenation.

Data protection. Transport is TLS throughout. Passwords are the only stored secret and are hashed, not encrypted. The records themselves are not encrypted at rest beyond the platform's own disk encryption, which is a decision rather than an oversight: the threat model here is unauthorised access through the application, not physical access to the provider's disks.

Known weaknesses. Three, stated plainly. There is no rate limiting on the login endpoint, so credential stuffing is not currently resisted; this is the first thing I would add and it is a small change. The synchronisation endpoint trusts the client's sequence numbers, so a malicious client could reorder its own history — it cannot affect another user's data, but the audit trail would be wrong. And there is no protection against a user of a shared device leaving a session open beyond the eight-hour expiry, which a shorter idle timeout would improve at some cost in usability.`,

    [ReportSectionKey.TESTING]: `Strategy. Three levels, chosen by where the risk is. Unit tests cover the reconciliation rule and the validation schemas, because both are pure logic with many cases and are cheap to test exhaustively. Integration tests cover the API handlers against a real database instance rather than a mock, because the guarantees I depend on — the unique index, the transaction around the change log — are database behaviour and a mock would assert my assumptions rather than the truth. End-to-end tests cover three critical paths through a real browser: capture while offline, sync on reconnect, and the reconciliation view.

Test cases and results, traced to requirements.

FR1, FR2 (offline capture and persistence): tested end-to-end with the browser's network disabled and with a full reload between capture and reconnection. Passed. An earlier run failed because the outbox was held in memory only; that failure is what produced the persistence requirement being tested explicitly rather than assumed.

FR3 (no duplication): tested by replaying an identical batch five times and asserting one row. Passed. Also tested by killing the client mid-request, which was the case that mattered — the first implementation created a duplicate here, and the unique index is what fixed it.

FR4 (reconciliation): fourteen unit tests covering two devices editing different fields, the same field, a create racing an update, and out-of-order arrival. Twelve passed initially. The two failures were both the same defect: ordering fell back to arrival time when sequence numbers matched, which is non-deterministic. Fixed by breaking ties on device identifier, which is arbitrary but stable.

FR9 (role separation): each endpoint called directly with a session of every role. Passed, after fixing one handler that checked the role in the interface but not on the server — found by this test and not by using the application.

NFR2 (low-end performance): measured on a throttled 3G profile with 4× CPU throttling. First contentful paint 3.1 s against a 4 s target. Passed.

NFR5 (sync duration): a day's entries, sixty records, synchronised in 11 s on the target profile. Passed.

Coverage across the codebase is 71% of lines. The reconciliation module, where the risk is, is at 96%.

Not tested: the browser storage eviction path, because I could not reproduce it reliably enough to assert on; concurrent access by more than three devices, because I did not have the hardware; and the deployment platform's cold-start behaviour under real load. All three are recorded as limitations rather than left implied.`,

    [ReportSectionKey.DEPLOYMENT]: `The system is deployed and reachable. The client and API run on a managed platform's free tier; ${db} is a managed instance from the same provider's marketplace.

Deployment is automated from the repository: a push to the main branch triggers a build, runs the test suite, and promotes the build if the tests pass. A failing test stops the deployment, which has happened three times and worked as intended each time.

Configuration is by environment variable, injected by the platform. No secret is in the repository, and the application refuses to start if a required variable is missing rather than starting and failing later in a way that is harder to diagnose — that check is a deliberate addition after an early deployment came up with an unset database URL and failed on first request instead of at boot.

Observation is thin and I know it. The platform provides request logs and error reporting, which is enough to see that something broke and roughly where. There is no uptime monitoring, no alerting, and no metric on synchronisation success rate — which is the number I would actually want. Adding it is recorded under future improvements.`,

    [ReportSectionKey.CHALLENGES_AND_SOLUTIONS]: `Synchronisation ordering was the hardest problem and consumed roughly a third of the build. The symptom was that a small proportion of records arrived incomplete, and it was not reproducible on demand. What made it hard was that my mental model was wrong: I was thinking of the outbox as a list of records to send, when it is a list of *operations* whose order is part of their meaning. Draining it in parallel was fast and lost that meaning. The fix — sequential per record, parallel across records — was a small change that took a long time to see, and the thing that produced it was writing down the ordering guarantee I actually needed before touching the code again.

The IndexedDB eviction problem was found by accident on a low-memory test device and would not have been found otherwise. A browser under storage pressure can clear the local store without warning. My first reaction was to try to detect and recover; I abandoned that because there is nothing to recover — the data is gone. What I did instead was make the failure loud: the application checks its store at startup and refuses to run rather than silently accepting writes it cannot keep. That is worse for the user in the moment and much better than the alternative.

Reconciling two devices took two attempts. The first resolved at record level and quietly discarded a device's work, which I only noticed when testing with a scenario drawn from how the work is actually done. Moving to per-field resolution fixed the common case and made me state the rule explicitly, which then had to be shown on screen — a design consequence that came out of a correctness problem.

A practical difficulty worth recording: I lost about a week early on to a development environment that behaved differently from the deployment target, particularly around time zones. Standardising on UTC everywhere internally, and converting only at the display boundary, removed a class of bug I had been fixing case by case.`,

    [ReportSectionKey.LIMITATIONS]: `The reconciliation rule resolves per field but still discards one edit when two devices change the same field. This is correct behaviour under the rule and it is not always the right answer for the user. A system needing better would have to keep both and ask, which means an interface for resolving conflicts that this project does not have.

The system supports one organisation. Nothing in the schema prevents a second, but nothing enforces separation between them either beyond the organisation column, and I have not tested it. Deploying for a second organisation today would mean a second deployment.

Testing at scale did not happen. The largest test was three devices and roughly two hundred records. The synchronisation design should hold further than that, but "should" is doing real work in that sentence and I have not measured it.

There is no offline authentication. A user who has never signed in on a device cannot use it offline, because the initial session requires the server. In practice this means a device must be online once at the start of a shift, which is a real operational constraint I would want to remove.

Observability is inadequate for anything beyond a demonstration. There is no alerting, and the number I would most want — the proportion of queued writes that eventually land — is not measured.

The summary reproduces the one the organisation compiles today and nothing more. Any question outside it still requires an export.`,

    [ReportSectionKey.FUTURE_IMPROVEMENTS]: `In priority order.

Rate limiting on authentication. The largest security gap and the smallest fix — a counter keyed on address and account with a backoff. Half a day's work.

Synchronisation success metric and alerting. Currently I cannot tell whether writes are landing without asking a user. Instrumenting the outbox to report queue depth and drain success, and alerting when depth grows, would turn a class of silent failure into a visible one.

Offline authentication via a cached credential with a short local validity. Removes the once-per-shift connectivity requirement, which is the constraint most likely to push a user back to paper.

A conflict resolution interface for same-field edits, so the system can stop discarding work. This is the largest of these and the one that would most change what the system is.

Multi-organisation support, tested rather than assumed, so a second organisation does not require a second deployment.

Export beyond the single summary — most likely a general query view, because the requests users made during testing were all variations on "the same thing but filtered differently".`,

    [ReportSectionKey.CONCLUSION]: `Against the objectives:

1. Analyse and document the current process — **met**. The analysis identified the missing feedback path, which shaped requirement FR8.
2. Design a data model supporting capture and reconciliation — **met**. The record/change separation and the client identifier are the load-bearing parts.
3. Implement offline capture and reliable synchronisation — **met**, and tested against delayed, duplicated and out-of-order delivery.
4. Role-based access — **met**, and verified by calling the API directly rather than through the interface.
5. Test synchronisation against failure scenarios and record results — **met**. Fourteen reconciliation cases, two initial failures, both fixed and retested.
6. Deploy to a reachable environment — **met**.
7. Evaluate and record what was not achieved — **met**; the limitations section is deliberately specific.

Objective 3 is the one I would defend most confidently and the one that took the longest, which is not a coincidence.

What I take from the project. The engineering that mattered was not in any feature; it was in deciding what the system does when things go wrong, and most of my time went there. I also learned that a wrong mental model is much more expensive than a wrong line of code — the synchronisation bug was cheap to fix and expensive to see, because I was thinking about the wrong thing. Finally, writing the reconciliation rule down in a sentence before implementing it was the single most useful thing I did, and I did it only after failing twice without it.`,

    [ReportSectionKey.DEMONSTRATION_READINESS]: `What I will show, in order:

1. Signing in, and the record list with sync states visible.
2. Capturing a record with the network disabled in developer tools, then a full page reload to show it survived, then reconnecting and watching the outbox drain.
3. Two browser profiles editing the same record while both are offline, reconnecting in the wrong order, and the reconciliation result — including the on-screen note explaining which edit won and why.
4. The administrator's reconciliation view showing an expected-but-missing record.
5. The API refusing a request from a role that should not have it, called directly.

What it needs: two browser profiles signed in as different users, and the seeded dataset already loaded — I will have both ready before we start.

What is incomplete, and I would rather say now than have you find it. The summary export produces the correct figures but the formatting is rough and the column order is not what the organisation uses. There is no rate limiting on login. And the reconciliation view does not paginate, so with a large dataset it becomes slow — I will demonstrate it with about sixty records, which is realistic, but I want to be clear that I have not solved it rather than have it look solved.

Where it might fail: the deployment platform's free tier cold-starts after idle, so the first request may take several seconds. I will make a request a minute before we begin to warm it. If it fails during the demonstration I will show the same flows against my local instance and say what the difference is.`,

    [ReportSectionKey.REFERENCES]: `KLEPPMANN, M. (2017) Designing Data-Intensive Applications. Sebastopol: O'Reilly Media.

SHAPIRO, M., PREGUIÇA, N., BAQUERO, C. and ZAWIRSKI, M. (2011) Conflict-free replicated data types. In: Stabilization, Safety, and Security of Distributed Systems. Berlin: Springer, pp. 386–400.

FOWLER, M. (2005) Event Sourcing [WWW] martinfowler.com. Available from: https://martinfowler.com/eaaDev/EventSourcing.html [Accessed 12 March 2026].

MOZILLA DEVELOPER NETWORK (2026) IndexedDB API [WWW] MDN Web Docs. Available from: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API [Accessed 3 March 2026].

OWASP FOUNDATION (2025) OWASP Top Ten Web Application Security Risks [WWW] OWASP. Available from: https://owasp.org/www-project-top-ten/ [Accessed 21 March 2026].

PROVOS, N. and MAZIÈRES, D. (1999) A future-adaptable password scheme. In: Proceedings of the USENIX Annual Technical Conference. Monterey: USENIX Association, pp. 81–91.

COMMUNICATIONS AUTHORITY OF KENYA (2025) Second Quarter Sector Statistics Report for the Financial Year 2024/2025. Nairobi: Communications Authority of Kenya.`,
  };
}

