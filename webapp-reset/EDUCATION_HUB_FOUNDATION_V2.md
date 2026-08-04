# EDUCATION HUB FOUNDATION — V2

**The constitution of the UmojaHub Education Hub.** Status: **DRAFT — awaiting approval.**
Until approved, no Education Hub design or implementation work begins.

**Authority.** When approved, this is the single source of truth for the Education Hub —
its product direction, its data model, and its workflows. It supersedes
`context/EDUCATION_HUB_ECOSYSTEM_MAP.md` and `webapp-reset/06_EDUCATION_UX_RESEARCH.md`,
both deleted. It is amended in the open, never silently superseded.

**Relationship to the web-app Foundation.** `UMOJAHUB_WEBAPP_FOUNDATION_V1.md` governs the
**presentation layer** of the whole app and continues to do so, as amended by A1. This
document governs the Education Hub's **product logic** — what exists, what it means, and
how it behaves. Where the two touch, V1 owns the pixels and this document owns the
substance.

**Preceded by.** `context/EDUCATION_HUB_VISION_RESET_AUDIT.md` — what the retired vision
was, what was deleted, and why.

**The honesty rule (inherited).** Every claim here is either **built**, **designed**, or
**open**. Sections state which. Nothing is described as working because we intend it to.

---

## 1. The problem

Kenyan Computer Science and Information Technology education is overwhelmingly
theoretical, and it is examined on paper.

A student can pass Database Systems without ever having designed a schema that had to
survive real query load. They can pass Networking without deploying anything across a
network. They can pass Operating Systems, Software Engineering, Artificial Intelligence
and Web Development, accumulate a transcript of respectable grades, and arrive at
Industrial Attachment in third or fourth year having **never built software that a real
person used**. Attachment is, for many, the first encounter with actual engineering — and
it lasts three months, at the end of a four-year degree.

The gap is not knowledge. The gap is that **knowledge is never converted into practice**,
and the conversion is left until it is nearly too late to matter.

**This is a curriculum-delivery problem, not a credentialing problem.** The previous
version of this hub misdiagnosed it as the latter — it assumed the student's difficulty
was proving capability to a skeptical employer, and built a portfolio and verification
system accordingly. That system could have worked perfectly and the student would still
have graduated without engineering experience. It optimised the *evidence* of a capability
the degree had not produced.

---

## 2. Product vision

> **The Education Hub is the practical execution layer that sits beside a Kenyan CS or IT
> degree. It transforms theoretical coursework into continuous, real engineering
> experience — from the first semester to graduation.**

Concretely: when a student is studying Database Systems, the platform knows that, and
gives them real engineering work in which a database is genuinely load-bearing. Next
semester, when they are studying Networking, the platform gives them work that takes
**the same system** and makes it operate across a network. By graduation the student has
not completed ten disconnected assignments. They have built one real system, incrementally,
under supervision, applying each unit as they were taught it.

The measure of success is not a badge, a score, or a profile. It is that a graduate of
this platform **has already been an engineer for three years** by the time they attend
their first interview.

---

## 3. Core principles

**P1 — Academic context comes first.** Work begins from what the student is actually
studying this semester. Nothing is recommended, generated, or assessed in ignorance of
their curriculum. Where the platform does not know the curriculum, it says so rather than
guessing.

**P2 — One system, grown.** The default unit of work is a **single system that evolves
across the degree**, not a sequence of unrelated projects. Continuity is the mechanism by
which coursework compounds into engineering experience.

**P3 — The concept must be load-bearing.** A project earns its unit only if the unit's
concept is *structurally necessary* to complete it. An app that stores rows in a database
does not teach Database Systems; a system that cannot function without correct indexing,
transactions, and a considered schema does. **This is the single quality bar for every
generated brief.** (§10.3.)

**P4 — Real software, not exercises.** Requirements gathering, architecture, code review,
version control, testing, documentation, deployment, demonstration, iteration. If a
workflow would be unrecognisable inside a working engineering team, it does not belong.

**P5 — The lecturer is an engineering mentor.** Their job is to direct engineering
decisions, reject bad ones with reasons, and approve milestones — not to mark a document
against a rubric and issue a verdict.

**P6 — Demonstration over documentation.** A student who can demonstrate a working system
and answer questions about it has proven more than any report can. The final
demonstration carries more weight than the final report. (§15.)

**P7 — Revision is a cycle, never a dead end.** The current system's `REVISION_REQUIRED`
terminates: a student told to revise cannot resubmit. That is the most damaging defect in
the hub, because it converts formative feedback into a punishment. **Iteration is the
core loop, not an error path.**

**P8 — Solve Kenyan problems, in every domain.** Healthcare, education, transport,
agriculture, government, finance, retail, logistics, manufacturing, energy, public
services. Agriculture is **one** domain among many, never the default.

**P9 — Depth before breadth.** CS and IT only, done exceptionally, before any other
faculty is considered. (§5.)

**P10 — We are not the student's shop window.** Students own their portfolios, their
GitHub, their CVs, their personal sites. UmojaHub creates the experience those later
showcase. It does not host, aggregate, rank, or broker it.

---

## 4. What this is not

Stated explicitly, because each was proposed or built before:

- **Not a portfolio platform.** No public profiles, no shareable verified records, no
  skill inventories, no strength ratings, no view analytics.
- **Not a recruitment platform.** No employers, no talent search, no candidate discovery,
  no hiring signals. There is no employer in the model at all.
- **Not an LMS.** We do not replace Moodle or Google Classroom. We do not host lectures,
  course materials, quizzes, attendance, or grades of record.
- **Not a university portal.** We do not replace SMIS, SIS, or registration systems. We
  *read from* them where possible (§9).
- **Not a code host.** We do not replace GitHub. The student's repository is theirs and
  lives where they put it.
- **Not a certificate issuer.** The degree is the credential. We are what makes it mean
  something.

---

## 5. Scope

**Computer Science and Information Technology students at Kenyan institutions. Nothing
else.** No Engineering, Business, Agriculture, Health, Law, or Architecture.

*Decision — why so narrow.* The value of this platform is entirely in the quality of the
match between a unit's subject matter and the engineering work generated from it. That
match requires a deep, opinionated model of a discipline: what Operating Systems actually
teaches, what makes a project genuinely exercise it, what a good architectural decision
looks like in that context. That model does not generalise. Building a shallow version for
six faculties produces a system that serves none of them. CS is the proof of concept and
the litmus test; expansion is §17.

**Scope enforcement (decision 6.3 of the audit): soft, not hard.** The platform will only
*know how* to generate CS/IT work — a non-CS student would find nothing useful rather than
being blocked at a gate. A hard gate on `programme` waits until institution integration
(§9) supplies a programme value the platform can trust; gating on a self-declared string
today would reject real students over a typo.

---

## 6. The actors

The Education Hub has **three** actors. There is no fourth.

### Student — *"I can pass the exam; I have never built the thing."*
A CS or IT undergraduate, typically 19–25, the most tech-comfortable role on the platform
and under real economic pressure. Wants work that is genuinely real and feedback that is
genuinely technical. Intolerant of busywork, toy assignments, and dead ends.

### Lecturer — *"Is this sound engineering, and is this student actually learning?"*
A credential-verified academic. Time-poor; their name is on every decision. Needs
evidence-first surfaces, fast milestone review, and the ability to say "this architecture
is wrong, here is why" without writing an essay. **Their role changes from adjudicator to
mentor** — the most significant behavioural change in this reset.

### Institution — *"What are our students actually studying, and how are they doing?"*
A university, college, polytechnic or TVET. Supplies the academic context that makes
everything else possible (§9), and hosts the lecturers who mentor. Provisioned by an
administrator, never self-selected.

*Built today:* `Role.INSTITUTION`, the `Institution` model, institutional-email
verification, lecturer credential verification, and the institution overview screen. This
is the foundation the rest of §9 builds on.

---

## 7. The academic data model

This is the load-bearing addition. Everything in §10–§11 depends on it.

### 7.1 The problem it solves

Institutions name the same subject differently. `SCS 301`, `BCS 2205`, `ICS 2304` and
`CIT 3151` may all be Database Systems II. Their syllabi differ in ordering and emphasis
but converge on the same body of knowledge, because Kenyan CS curricula are developed
against **CUE guidelines benchmarked to the IEEE/ACM Computing Curricula** — the
institutions differ, the discipline does not.

*Decision.* The platform reasons about **subject matter**, never about institutional unit
codes. A per-institution unit is a *label* that maps onto a platform-owned canonical
taxonomy. This is what makes multi-institution support tractable: onboarding a new
university is a **mapping exercise**, not a new integration.

### 7.2 The entities

**`KnowledgeArea`** — platform-owned, canonical, closed enum. The vocabulary the
recommendation engine actually reasons in. Derived from the IEEE/ACM knowledge areas,
narrowed to what Kenyan CS/IT degrees actually teach:

`PROGRAMMING_FUNDAMENTALS · DATA_STRUCTURES_ALGORITHMS · DATABASE_SYSTEMS · NETWORKING ·
OPERATING_SYSTEMS · SOFTWARE_ENGINEERING · WEB_DEVELOPMENT · MOBILE_DEVELOPMENT ·
ARTIFICIAL_INTELLIGENCE · MACHINE_LEARNING · DATA_ENGINEERING · CLOUD_COMPUTING ·
DISTRIBUTED_SYSTEMS · INFORMATION_SECURITY · HUMAN_COMPUTER_INTERACTION ·
SYSTEMS_ANALYSIS_DESIGN · COMPUTER_ARCHITECTURE · RESEARCH_METHODS`

Each area carries what the platform needs to generate work from it: the capabilities it
teaches, the architectural pressures that make it load-bearing, and the anti-patterns that
mean a project is *claiming* the area without exercising it.

**`AcademicProgramme`** — one degree at one institution. `institutionId`, name
(`BSc Computer Science`), discipline (`CS` | `IT`), duration in years, semesters per year.

**`CurriculumUnit`** — one unit within one programme. `programmeId`, institutional `code`,
`title`, the `year` and `semester` it is normally taken, and **`knowledgeAreas[]`** — the
mapping. The mapping is the integration surface: everything upstream can be messy, and
everything downstream only sees knowledge areas.

**`StudentEnrolment`** — where one student currently stands. `studentId`, `programmeId`,
`currentYear`, `currentSemester`, `currentUnits[]`, `completedUnits[]`, and — critically —
**`provenance`**: how the platform came to believe this (§9.2). Performance data
(`grade`) is optional, permissioned, and never required for anything.

*Decision — performance is optional and never load-bearing.* The directive allows academic
performance "where available and permitted". No workflow may depend on it. Grades are the
most sensitive, least portable, most politically fraught data an institution holds;
designing dependence on them would make integration impossible with the institutions
least able to share and would let a weak transcript narrow a student's opportunities on a
platform whose entire purpose is to widen them.

### 7.3 Limitation

None of §7 is built. `User.studentData` today holds `programme`, `graduationYear`,
`academicRegistrationNumber` and `institutionId` as free text — enough to identify a
student, nowhere near enough to reason about their coursework.

---

## 8. Institution integration strategy

### 8.1 What we found

Research into how Kenyan universities expose academic information (August 2026):

- **No Kenyan university publishes a public academic-data API.** None was found for any
  major institution.
- **Every major institution runs a login-gated human portal.** University of Nairobi has
  SMIS (`smis.uonbi.ac.ke`) covering registration, results, CAT marks, fees and
  timetables. Kenyatta University runs a Student Information System. JKUAT runs a student
  portal for enrolment and grades.
- **These portals are legacy and fragile.** JKUAT's own registry improvement proposals
  document system outages, data inconsistencies, and legacy architecture affecting
  critical academic processes. Any design that assumes a reliable real-time feed is
  designing against a system that does not exist.
- **Portal authentication is dangerous to touch.** UoN SMIS authenticates with the
  registration number as username and the **national ID or passport number** as password.
- **Curricula are per-institution but convergent**, developed against CUE guidelines and
  benchmarked to IEEE/ACM computing curricula.

### 8.2 The hard rule

> **UmojaHub will never ask a student for their university portal credentials, will never
> proxy a login, and will never scrape a student portal.**

*Justification.* At UoN those credentials **are a national ID number**. Requesting them
would be soliciting national identity data under the guise of convenience, normalising
credential sharing for a population that will be asked for the same thing by worse actors,
and creating a breach liability out of all proportion to the feature. Scraping additionally
takes on the institution's data-accuracy problems while violating its terms. There is no
version of this that is worth it.

### 8.3 The capability ladder

Because no API exists, the design cannot depend on one. It degrades deliberately: **every
tier delivers a working product**, and higher tiers improve the *confidence and effort*,
never unlock the core loop.

| Tier | Source | What the platform knows | Effort | Confidence |
|---|---|---|---|---|
| **T0 — Self-declared** | The student | Programme, year, semester, units — typed in | Student, minutes | Low |
| **T1 — Published curriculum** | Institution admin | The real unit structure of the programme; student picks only their semester | Institution, once | Medium |
| **T2 — Lecturer-attested** | A verified lecturer | Confirmed enrolment in units that lecturer teaches | Lecturer, seconds | High |
| **T3 — System feed** | An adapter | Enrolment synced from an institutional export or endpoint | Engineering, per institution | High |

**T0 works with no institution on the platform at all.** This is deliberate: the hub must
be useful to a student at an institution that has never heard of us, or it will never
reach the institutions.

**T1 is the realistic target for most institutions** and the best effort-to-value ratio on
the ladder — a department publishes its programme structure once, and every student at
that institution stops typing unit names forever.

**T2 is how trust is earned without an API.** A lecturer confirming "yes, these are my
students in this unit this semester" is a stronger signal than most feeds, costs seconds,
and reuses a relationship that already exists.

**T3 is opportunistic.** Where an institution can produce a CSV export, an SFTP drop, or a
REST endpoint, we write an adapter behind one interface (§16.3). We build the abstraction
now and the adapters when a partner appears — never the reverse.

*Decision — do not hardcode around one institution.* Every tier is expressed in terms of
`AcademicProgramme` / `CurriculumUnit` / `StudentEnrolment`. No institution-specific logic
exists above the adapter boundary. The first integration must not become the shape of the
system.

### 8.4 Provenance is recorded, and it is shown

`StudentEnrolment.provenance` records which tier the data came from and when. The UI
states it plainly — "you told us this" reads differently from "Strathmore confirmed this",
and a student should always know which one is on screen. **The platform never presents
self-declared academic data as though it were verified.** This is the same defect, in a
new place, as the buyer-verification funnel that made users fabricate business
registration numbers: a system that cannot tell the difference between a claim and a fact
will eventually report the claim as a fact.

---

## 9. Project recommendation philosophy

### 9.1 The inputs

A recommendation is a function of four things, in priority order:

1. **Academic context** — the knowledge areas of the units the student is taking *now*.
2. **The state of their system** — what already exists, what it does, where it is weak.
3. **Engineering interest** — backend, AI, security, distributed systems, cloud, DevOps,
   data engineering, mobile, and so on. Asked, not assumed.
4. **Problem domain** — a real Kenyan context (§P8), chosen for fit, varied deliberately.

*Decision — interest is a filter, not a driver.* The unit decides **what must be
exercised**; interest decides **which of several valid projects** the student gets. A
student who loves AI and is taking Operating Systems gets an OS-heavy project with an ML
workload on top — not an ML project with a nod to processes. Letting interest drive would
recreate self-selection of easy work, which is what the retired `StudentTier` selector did.

### 9.2 What is generated

Not a project. **An increment to their system** (§11) — a brief that states the capability
to add, the unit concept that must carry it, the architectural change it forces, the
constraints it must survive, and the demonstration it must pass.

### 9.3 The load-bearing test — the quality bar

Every generated brief must pass this before a student sees it:

> **Could a competent student complete this without genuinely applying the unit's
> concept?** If yes, the brief is rejected and regenerated.

Worked example — `DATABASE_SYSTEMS`:

- ❌ *"Build a clinic appointment app with a patient table."* A database is present.
  Nothing about the unit is required. This is the CRUD tutorial the directive rejects.
- ✅ *"The clinic has 14 years of records — 400,000 visits. Reception needs patient lookup
  under 200ms on the clinic's existing hardware, appointments must never double-book under
  concurrent booking, and the daily report must not lock the table while reception is
  working."* Now indexing, transaction isolation, and query planning are the only way
  through. The unit is load-bearing.

Each `KnowledgeArea` carries its own load-bearing criteria and its own anti-patterns.
**This test is the single highest-value thing in this document**; the difference between a
platform that produces engineers and one that produces submissions lives here.

### 9.4 What is retained from what exists

`BriefContextLibrary` and its seeded contexts survive and are extended. They already span
**agriculture, community health, SME finance, secondary education, transport, water,
tourism and waste** — eight domains, agriculture merely one of them. §P8 is therefore
nearly satisfied already; the work is adding government, energy, retail, logistics and
manufacturing, and re-keying contexts from `targetTiers` to knowledge areas and academic
level.

---

## 10. The project evolution model

### 10.1 The spine

```
SystemProject  ── the long-lived system, owned by the student, one repository
   │
   ├── ProjectIncrement  · Y1S2 · DATABASE_SYSTEMS      → build the data layer
   ├── ProjectIncrement  · Y2S1 · NETWORKING            → operate it across a network
   ├── ProjectIncrement  · Y2S2 · OPERATING_SYSTEMS     → containerise, profile, optimise
   ├── ProjectIncrement  · Y3S1 · SOFTWARE_ENGINEERING  → tests, CI/CD, architecture
   ├── ProjectIncrement  · Y3S2 · CLOUD_COMPUTING       → deploy to real infrastructure
   └── ProjectIncrement  · Y4S1 · INFORMATION_SECURITY  → authn/authz, auditing, hardening
```

By graduation the artefact is a deployed, tested, secured, documented system with three
years of real commit history — and the student has made every architectural decision in
it, under review, at the moment they were being taught the theory behind it.

### 10.2 The continuity rule

An increment must **build on the previous increment's artefact**: same repository, same
running system, additive history. A student may not silently restart. This rule *is* the
product — without it the hub degenerates back into a sequence of assignments.

### 10.3 Escape hatches

Continuity that cannot be escaped becomes a trap. A first-year's choice must not imprison
a final-year student.

- **Fork** — start a second `SystemProject`, once, with a lecturer's approval. For the
  student whose original idea genuinely cannot carry the units ahead of it.
- **Retire** — mark a system closed. Its increments and history remain; nothing is deleted.
- **Pivot** — an increment may substantially redirect the system's purpose while keeping
  its codebase. This is normal engineering, not failure, and should be named as such.

*Decision — approval required for fork, not for pivot.* Forking discards accumulated
context and is the one action that can quietly defeat §P2; a mentor should be in that
conversation. Pivoting is what real systems do.

### 10.4 Honest limitations

- **A student who joins in year three has no history.** They start where they are, with a
  shorter ladder. The platform must not treat this as deficiency.
- **Not every unit fits every system.** Some pairings will be forced. The recommendation
  engine must be able to say "this unit does not fit your current system; here is a
  standalone increment instead" rather than manufacturing a bad fit. **Standalone
  increments are a legitimate outcome, not a failure mode.**
- **Repeated or trailing units** are common in Kenyan universities. The model must handle
  a student taking a second-year unit in their fourth year without confusion.

---

## 11. Student lifecycle

| Stage | What happens | Built today? |
|---|---|---|
| **1. Join** | OAuth → role → institutional email verification → registration number | ✅ Built |
| **2. Academic context** | Programme + year + semester + current units, at whatever tier §8 supports | ❌ New |
| **3. Interest** | Engineering interests; revisited each year, not asked once | ⚠️ Partial (`primaryInterest`) |
| **4. Start or continue** | Create the `SystemProject`, or open the existing one | ❌ New |
| **5. Receive an increment** | Unit-anchored brief; regenerate or negotiate scope with the mentor | ⚠️ Rewrite |
| **6. Build** | Real work in their own repository, over the semester | ✅ Repo linking built |
| **7. Milestones** | Requirements → architecture → implementation → testing → deployment, each reviewed | ❌ New |
| **8. Code review** | Give and receive structured review with peers on the same unit | ⚠️ Recast (§13.3) |
| **9. Demonstrate** | Scheduled live demonstration with Q&A | ❌ New |
| **10. Feedback & iterate** | Written engineering feedback; revision is a cycle | ⚠️ Fix `REVISION_REQUIRED` |
| **11. Close the increment** | Approved; the system carries forward to next semester | ❌ New |
| **12. Next semester** | Return to stage 2 with new units and an existing system | ❌ New |

**The loop is stages 2 → 11, once per semester, for the length of the degree.** That
cadence is the product.

---

## 12. Lecturer lifecycle

### 12.1 The change

| Retired role — adjudicator | New role — engineering mentor |
|---|---|
| Reviews finished documents | Reviews decisions while they can still change |
| One terminal verdict | Repeated milestone approvals |
| Scores four prose dimensions | Reviews architecture, code, and a live demo |
| Reads a report | Watches it run and asks questions |
| Cannot assign work | Creates and assigns custom projects |
| Individual submissions only | Individuals and teams |

### 12.2 Capabilities

- **Onboard** — credential verification by an administrator. *Built today; unchanged.*
- **Declare units taught** — the basis of T2 attestation (§8.3) and of routing student
  work to the right mentor. *New.*
- **Create custom projects** — a lecturer's own brief, overriding generation. Their
  knowledge of their cohort beats any generator, and a platform that cannot accept that is
  telling academics their judgement is unwelcome. *New.*
- **Assign** — to an individual or a team. *New.*
- **Review architecture** — before implementation, when redirection is still cheap. *New.*
- **Review code** — against the repository, at a commit. *New.*
- **Schedule and run demonstrations.** *New.*
- **Approve or reject milestones** — reject *with direction*, always. *New.*
- **Reject poor engineering decisions** as a first-class action, not a low score. *New.*

### 12.3 Constraints

- Only credential-verified lecturers may approve milestones. *Built.*
- A lecturer mentors within units they teach or knowledge areas they are competent in.
- **Every rejection carries a reason and a direction.** A rejection without a next step is
  not mentorship.
- Lecturer capacity is finite and is the platform's binding throughput constraint. The
  workflow must be built for a lecturer with 60 students and four hours a week, not for an
  idealised reviewer. **If a workflow only works at low volume, it does not work.**

---

## 13. Team project workflow

### 13.1 Teams form per increment, not per system

*Decision.* A `SystemProject` has one owner. A `ProjectIncrement` may have a team. Real
teams form around a piece of work and dissolve; binding a team to a four-year system
means one member's withdrawal damages everyone's degree.

### 13.2 Attribution

Assessment remains **individual** even when work is collective. Three mechanisms:

1. **Repository history** — commits attribute authorship natively. We read it; we do not
   reinvent it.
2. **Declared ownership** — each member declares the components they own at the start,
   confirmed by the team.
3. **Individual demonstration segments** — each member demonstrates and answers questions
   on their own contribution (§14).

*Limitation, stated plainly.* Commit history is gameable and declared ownership is
self-reported. The demonstration is the real control: **a student who cannot explain code
they claim to have written is visible in ninety seconds.** This is by design — it is also
exactly how a technical interview works.

### 13.3 Peer code review

*Decision (audit 6.4) — peer review is retained and recast.* It exists today as a queue
filter that gated a credential. It becomes what it should always have been: **code review
between students working on the same knowledge area**, an explicitly listed industry
practice (§P4). It reviews *code in a repository*, not prose documents, and it no longer
gates anything — it is practice for the reviewer as much as feedback for the author.

---

## 14. Assessment workflow

### 14.1 Milestone-based, repeatable

Assessment happens **at milestones through the semester**, not once at the end. The
milestone set per increment, adapted to the unit:

1. **Requirements** — has the student understood the problem?
2. **Architecture** — is the design sound *before* it is built? The highest-leverage
   review point on the ladder.
3. **Implementation** — does the code work, and is it code a professional would accept?
4. **Testing & documentation** — is it verifiable and comprehensible by someone else?
5. **Deployment** — does it run somewhere real?
6. **Demonstration** — §15.

Each milestone is `PENDING → SUBMITTED → UNDER_REVIEW → APPROVED | CHANGES_REQUESTED`.
**`CHANGES_REQUESTED` returns to `PENDING`.** There is no terminal failure state inside an
increment — §P7 in the schema, not merely in prose.

### 14.2 Dimensions

Engineering dimensions, not essay dimensions:

- **Problem understanding** — do they know what they are building and why?
- **Architectural soundness** — are the structural decisions defensible?
- **Implementation quality** — correctness, readability, error handling, tests.
- **Application of the unit** — is the unit's concept genuinely load-bearing? (§9.3.)
- **Engineering practice** — version control, documentation, iteration on feedback.
- **Demonstration** — can they show it and defend it? **Weighted highest.** (§P6.)

### 14.3 Tamper evidence

*Decision (audit 6.5) — the SHA-256 document-hashing and `VerificationAuditLog` machinery
is retired with the credential it protected.* It existed so an employer could verify a
record independently; there is no employer. Assessment integrity now rests on repository
history (externally timestamped, not ours to forge) and live demonstration — both stronger
signals than a hash of a prose document, and neither costing us a subsystem to maintain.

`AdminAuditLog` for administrative actions is unaffected and stays.

---

## 15. Demonstration workflow

**The demonstration is the centre of assessment.** (§P6.)

**Why.** A written report can be fabricated, generated, or ghostwritten, and marking one
tells you about a student's writing. A live demonstration with questions tells you whether
they built it, whether they understand it, and whether it works. It is also the closest
thing in the degree to a technical interview and to a sprint review — the two situations
this experience is preparing them for.

**The workflow.**

1. **Schedule** — the lecturer opens slots; the student books one. Remote by default;
   Kenyan students are geographically distributed and bandwidth is uneven, so the format
   must survive a poor connection.
2. **Prepare** — the student states what they will show and what they know is incomplete.
   Declaring a known gap is professional behaviour and is treated as such, not penalised.
3. **Demonstrate** — the system runs. Live, not slides. Failure during a demo is a real
   engineering event and is assessed on the response to it, not on its occurrence.
4. **Question** — the mentor probes decisions: *why this schema, what happens under load,
   what would you change.* This is where understanding is actually established.
5. **Record** — an optional recording, owned by the student, for their own use.
6. **Outcome** — approved, or changes requested with direction. Back to §14.1.

*Limitation.* Live demonstrations do not scale linearly and are the binding constraint on
lecturer capacity (§12.3). Mitigations to design: batched cohort sessions, asynchronous
recorded demonstrations with asynchronous questioning for lower-stakes milestones, and
reserving the live format for the increment's final demonstration. **This is an open
question, not a solved one (§18).**

---

## 16. Technical architecture

### 16.1 What stands

Unchanged, and reused: `Role.INSTITUTION`, `Institution`, `User.studentData` /
`lecturerData`, institutional-email verification, lecturer credential verification and its
admin queue, `Notification` + `notify()`, `MentorSession` and the AI mentor, and every
platform system outside the Education Hub. Auth, RBAC, marketplace, escrow, payments and
trust scoring are **untouched by this document**.

### 16.2 What changes

| Existing | Fate |
|---|---|
| `ProjectEngagement` | **Split** into `SystemProject` + `ProjectIncrement` (§10) |
| `ProjectStatus` | **Replaced** by a milestone state machine with no terminal failure (§14.1) |
| `StudentTier`, `ProjectTrack` | **Deleted** — difficulty derives from academic level; work derives from units. These survived the deletion pass only because they had no replacement; this document is that replacement. |
| `LecturerReview` | **Becomes** `MilestoneReview` — repeatable, per milestone |
| `PeerReview` | **Recast** as code review (§13.3) |
| `BriefContextLibrary` | **Extended** and re-keyed to knowledge areas (§9.4) |
| `openaiService.generateAIBrief` | **Rewritten** — prompts on unit + interest + system state, gated by the load-bearing test (§9.3) |
| `VerificationAuditLog` + document hashing | **Retired** (§14.3) |
| `LecturerEffectiveness` | **Recast** around mentorship, or dropped — decide during design |

### 16.3 What is new

**Academic layer** — `AcademicProgramme`, `CurriculumUnit`, `StudentEnrolment`,
`KnowledgeArea` (enum + metadata).

**Project layer** — `SystemProject`, `ProjectIncrement`, `Milestone`, `MilestoneReview`,
`Demonstration`, `IncrementTeam`.

**The integration boundary.** One interface, four implementations, no institution-specific
logic above it:

```ts
interface AcademicSource {
  readonly tier: AcademicSourceTier;
  resolveEnrolment(student: StudentRef): Promise<EnrolmentSnapshot | null>;
}
```

`SelfDeclaredSource` (T0), `PublishedCurriculumSource` (T1), `LecturerAttestedSource` (T2),
and per-institution `FeedSource` adapters (T3). Resolution walks the ladder highest-first
and records provenance (§8.4). Adding an institution is configuration plus, at most, one
adapter.

### 16.4 Conventions

Unchanged from `CLAUDE.md`: `connectDB()` → `getServerSession` → `requireRole` → Zod
`safeParse` → DB; `AppError` + `handleApiError`; models in `src/lib/models/*.model.ts`
with indexes in schema; lazy model imports inside async functions; validation in
`src/lib/validation/`; tests adjacent in `__tests__/`. **This document changes what the
Education Hub is, not how the codebase is written.**

---

## 17. Expansion roadmap

Sequenced by dependency, not ambition. Each stage is separately approvable.

**Stage 1 — Academic context.** The academic layer, T0 and T1, and student enrolment
capture. *Nothing else is possible without this.*

**Stage 2 — The evolving project.** `SystemProject` / `ProjectIncrement`, the continuity
rule, and unit-anchored generation with the load-bearing test.

**Stage 3 — Mentorship.** Milestones, architecture and code review, `CHANGES_REQUESTED` as
a cycle. **This is where `REVISION_REQUIRED` finally stops being a dead end.**

**Stage 4 — Demonstration.** Scheduling, the live workflow, weighting.

**Stage 5 — Teams.** Team increments, attribution, code review between peers.

**Stage 6 — Deeper integration.** T2 attestation, then T3 adapters with a willing partner
institution.

**Stage 7 — Institutional insight.** What an institution can see about its own cohort —
strictly aggregate, strictly its own students, never comparative between institutions.

**Beyond — other disciplines.** Only after CS/IT is demonstrably working: a cohort that has
completed multiple increments, lecturers who return without being chased, and evidence
that graduates arrive at attachment ahead of their peers. Engineering is the most natural
second discipline. **This is years away and nothing before Stage 7 should be designed to
accommodate it.**

---

## 18. Open questions

Named, not assumed. None may be treated as settled without validation.

1. **Will lecturers actually do this?** The workflow asks materially more of them than
   marking reports. Their capacity is the platform's binding constraint (§12.3). *Validate
   by running one real increment with a real lecturer and a real cohort, and measuring
   hours.*
2. **How does demonstration scale?** (§15.) The highest-value assessment mechanism is the
   least scalable. *Prototype batched and asynchronous formats early.*
3. **Will any institution publish its curriculum (T1)?** The whole ladder's midpoint
   depends on a department doing a one-off data-entry task. *Test with one department.*
4. **Is one evolving system right for every student?** §P2 is the strongest claim in this
   document and it is currently a conviction, not a finding. *Watch how often the escape
   hatches (§10.3) are used; heavy use falsifies the principle.*
5. **Can generation reliably pass the load-bearing test?** (§9.3.) If a model cannot
   produce briefs that clear the bar without human curation, the answer may be a curated
   library with generated variation rather than free generation. *Test before building.*
6. **Does this work alongside coursework, or compete with it?** A student already has
   assignments and CATs. If the hub becomes a second workload rather than a better use of
   the same one, it fails regardless of quality. *This is the question that decides whether
   any of it matters — validate first.*

---

## 19. What approval unlocks

Approval of this foundation permits, in order and each stopping for approval:

**Information Architecture (Education Hub) → Lo-fi → Mid-fi → Hi-fi → Prototype → Design
System application → Implementation Plan → Code.**

Presentation work remains governed by `UMOJAHUB_WEBAPP_FOUNDATION_V1.md` and the Figma
source of truth. **No Education Hub implementation begins until this document is approved
and the gates below it are walked.**
