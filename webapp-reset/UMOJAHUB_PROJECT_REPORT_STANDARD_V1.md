# UMOJAHUB PROJECT REPORT STANDARD — V1

**Status:** Canonical. This is the project-report standard for the UmojaHub Education Hub.
**Applies to:** Computer Science and Information Technology practical projects.
**Companion document:** `EDUCATION_HUB_FOUNDATION_V2.md` (what the Education Hub is).

---

## 0. What this document is

A student who builds something real needs one place to explain it. This is that place, and
this document is the standard it is written against.

The standard is **institution-neutral**. It names no university, department, school,
supervisor, registration format or grading regulation. It is written so that a student at a
public university, a student at a private university, and a student working independently
through UmojaHub are all held to the same account, and so that any lecturer can review any
report without first learning a local convention.

It is derived from a real undergraduate project-paper guideline used by a Kenyan university
for its Information Technology degrees. The academic substance of that guideline is
preserved. Its institutional wrapping is not, and several of its requirements have been
changed because they no longer serve a software project. §11 records exactly what changed
and why, so that nothing here is mistaken for invention where it is inheritance, or for
inheritance where it is a deliberate departure.

---

## 1. The question the report must answer

> **Can this student clearly explain what they built, why they built it, how they built it,
> and why their technical decisions make sense?**

Everything below serves that question. A section that does not help answer it does not
belong, however traditional it is.

Three consequences follow, and they govern how every section is written.

**A report is evidence, not description.** A student may not pass by describing what
three-tier architecture is. They must show the architecture *they* built and say why it is
that shape. Textbook exposition with the student's project name substituted in is the
single most common failure of academic project reports and it is not acceptable here.

**A report is read by someone who was not there.** The lecturer did not watch the system
being built. Every claim must be legible to a competent engineer encountering the project
for the first time.

**A report is not the assessment.** It is half of it. The other half is the live
demonstration (§10), where the student is asked why. A report that cannot be defended out
loud has not established anything.

---

## 2. Report structure

Twenty-five sections in five parts. Twenty-one are required; four are conditional and are
required only when they apply to the project in hand.

Conditional sections are not optional in the sense of "skip if busy". They are required
whenever the condition holds, and the student states which condition failed when it does
not.

### Part A — Front matter

| # | Section | Required | Guide length |
|---|---|---|---|
| 1 | Title | Required | one line |
| 2 | Abstract | Required | 150–300 words |
| 3 | Originality and AI use | Required | 150–400 words |

### Part B — The problem

| # | Section | Required | Guide length |
|---|---|---|---|
| 4 | Introduction and background | Required | 400–900 words |
| 5 | Problem statement | Required | 250–600 words |
| 6 | Objectives | Required | 150–400 words |
| 7 | Scope and justification | Required | 250–600 words |
| 8 | Related work and gap analysis | Required | 600–1,500 words |

### Part C — The engineering

| # | Section | Required | Guide length |
|---|---|---|---|
| 9 | Requirements | Required | 500–1,200 words |
| 10 | System analysis | Conditional — an existing process was replaced or automated | 400–1,000 words |
| 11 | System architecture | Required | 600–1,500 words |
| 12 | Database design | Conditional — the system stores persistent data | 500–1,200 words |
| 13 | Interface design | Conditional — the system has a user interface | 300–800 words |
| 14 | Technology choices and trade-offs | Required | 500–1,200 words |
| 15 | Implementation and key technical decisions | Required | 800–2,000 words |
| 16 | Security considerations | Required | 400–1,000 words |
| 17 | Testing and results | Required | 500–1,200 words |
| 18 | Deployment | Required | 250–700 words |

### Part D — Reflection

| # | Section | Required | Guide length |
|---|---|---|---|
| 19 | Challenges and solutions | Required | 400–1,000 words |
| 20 | Limitations | Required | 250–700 words |
| 21 | Future improvements | Required | 200–600 words |
| 22 | Conclusion | Required | 250–600 words |
| 23 | Demonstration readiness | Required | 200–500 words |

### Part E — Back matter

| # | Section | Required | Guide length |
|---|---|---|---|
| 24 | References | Required | — |
| 25 | Appendices | Conditional — evidence exists that is too long for the body | — |

Guide lengths are guidance, not gates. UmojaHub warns when a section is far below its
range, because a 40-word architecture section is almost never a complete one, but it does
not refuse a submission on word count alone. A concise section that answers the question is
better than a padded one that does not, and the lecturer is the judge of that.

The total lands in the region of **9,000–16,000 words** for a full project. This standard
does not set a page count; see §11.

---

## 3. What each section must contain

### 1 · Title

One line. Names the system and what it does. Specific enough that a reader knows the domain
and the problem before reading anything else.

- Good: *"An offline-first attendance register for institutions with intermittent connectivity"*
- Bad: *"A Web-Based Management System"*

### 2 · Abstract

A standalone summary: the problem, what was built, how it was approached, what the results
were, and what was concluded. A reader who reads only the abstract should know whether the
project is relevant to them.

Written last. Contains no citation, no figure reference, and nothing that does not also
appear in the body.

### 3 · Originality and AI use

Two things, in one section.

**Originality.** A statement that the work is the student's own, that sources are cited
where used, and that the system described was built by the student. Where the project builds
on an existing codebase, template, or open-source project, that is stated plainly here with
what was inherited and what the student added. Building on other people's work is normal
engineering; not saying so is not.

**AI use.** See §7. This is not a confession and does not reduce the assessment. It is a
statement of where AI tooling was used, what the student verified, and what remains their
responsibility.

### 4 · Introduction and background

What area the project sits in, how things work there now, and how the problem arises out of
that. The reader should finish this section understanding the context well enough for the
problem statement to feel inevitable.

Concrete. A named setting — an institution, a business, a community, a workflow — beats an
abstract sector.

### 5 · Problem statement

The specific problem the system addresses. Not a general observation about a sector: a
problem that someone has, that shows up in how work is currently done, and that software can
change.

Each distinct problem is stated separately, with a short account of how it arises. If the
problem cannot be stated without using the word "lack" — *"there is a lack of a system"* —
it has not been found yet. The absence of a system is not a problem; what goes wrong because
it is absent is.

### 6 · Objectives

What the project set out to achieve, as a short list. Objectives are **specific,
measurable, achievable, relevant and time-bound**, and are written so that a reader can tell
at the end whether each was met.

Lead with verbs that commit to something checkable — *design, implement, evaluate, measure,
integrate*. Avoid *understand, explore, look into*, which cannot be failed and therefore
cannot be passed.

The conclusion (§22) returns to this list and states the outcome of each.

### 7 · Scope and justification

**Scope.** What the project covers and, more usefully, what it deliberately does not. A
boundary stated up front is a design decision; the same boundary discovered in the
limitations section reads as something that ran out of time.

**Justification.** Why this project is worth doing — who benefits, what it makes possible,
and why now. Where the project has an engineering challenge worth the effort, name it here.

### 8 · Related work and gap analysis

Two parts, and the second is the one that matters.

**Related work.** Existing systems, published work, and approaches that address this problem
or one close to it. Each is examined, not merely listed. What does it do, how does it do it,
and where does it succeed?

**Gap analysis.** What those systems do not do that this project does. This is the section
that justifies the project's existence, and it must be concrete: a named limitation in a
named system, not a general assertion that existing solutions are inadequate.

Comparison in a table works well here. A literature review that summarises five papers
without ever saying what they leave undone has not done the job.

### 9 · Requirements

**Functional requirements** — what the system does. Numbered, individually testable, and
written so the testing section (§17) can refer to them. *"The system shall allow a user to
record an attendance entry while offline"* is testable. *"The system shall be user-friendly"*
is not.

**Non-functional requirements** — the qualities the system must hold: performance,
availability, security, usability, maintainability, portability, and any constraint the
setting imposes. Each carries a target where one can be stated. *"Usable on a device with
1 GB of RAM"* is a requirement; *"fast"* is a wish.

Where requirements were established by talking to people, observing a process, or reading
existing documents, say which, and say who. Where they were derived from the student's own
analysis of the domain, say that instead. Both are legitimate. Inventing a survey that did
not happen is not.

### 10 · System analysis — conditional

Required when the project replaces or automates an existing process.

How that process works today, and where it breaks. Model it with whatever tool fits — a flow
chart, a data-flow diagram, an activity diagram, a use-case diagram. The model must describe
the process as actually found, not an idealised version of it.

Not required for a system with no predecessor. A student who is building something new says
so in one sentence and moves on.

### 11 · System architecture

**The most important section in the report, and the one the source guideline omitted
entirely.**

The shape of the system the student built. Its major components, what each is responsible
for, how they communicate, and where the boundaries fall. At minimum:

- A **system architecture diagram** that matches the implementation (§8 of the figure rules).
- What each component does and why it is a separate component.
- How the components communicate — protocols, formats, synchronous or asynchronous.
- Where state lives.
- Where the system's boundaries are: what is inside, what is an external dependency.

Then the part that carries the marks: **why this architecture**. What alternatives were
considered, what each would have cost, and what decided it. A monolith chosen deliberately
and defended is stronger than a microservice architecture adopted because it sounded
advanced.

If the student cannot say what would have been different under another architecture, they
have not made an architectural decision — they have followed a tutorial, and the
demonstration will establish that.

### 12 · Database design — conditional

Required when the system stores persistent data.

- **Conceptual** — the entities and their relationships, independent of any product.
- **Logical** — tables or collections, fields, types, keys, relationships.
- **Physical** — indexes, constraints, and the storage decisions that follow from expected
  access patterns.

An **ER diagram or schema diagram** is expected, and it must correspond to the schema the
system actually runs on.

Then the reasoning: why this normalisation level, why these indexes, why this is one table
and not two, what queries the design is optimised for, and what it is deliberately slow at.
Where the design denormalises, say what that bought.

### 13 · Interface design — conditional

Required when the system has a user interface.

The main screens or interaction surfaces, what each is for, and how a user moves between
them. Screenshots or wireframes belong here.

The reasoning is about the user, not the aesthetics: who uses this, under what conditions,
with what device and what connection, and how the design answers that. A system for a
shared workstation used by staff changing shift has different interface requirements from
one used on a personal phone, and the design should show it.

Where the system is an API, a library or a command-line tool, that is its interface — the
same section covers it, and **API documentation** replaces screenshots.

### 14 · Technology choices and trade-offs

Every significant technology choice, with the reasoning. At minimum:

- **Language and framework** — and what else was considered.
- **Database** — relational or not, which product, and what about the data made that right.
- **Authentication and authorisation** — the mechanism, and why it suits the threat model.
- **Hosting and infrastructure.**
- **Any significant library** the system depends on materially.

For each: what the alternatives were, what the trade-off was, and what decided it.
Constraints are legitimate deciders — existing knowledge, cost, hosting availability,
offline requirements, team familiarity — and saying "I chose this because I already knew it
and the deadline was real" is an honest engineering answer, better than a fabricated
benchmark.

What does not belong: a description of what the technology is. The reader knows what a
relational database is. They want to know why this project has one.

### 15 · Implementation and key technical decisions

How the system was actually built.

- **Structure** — how the codebase is organised, and the convention a reader would need to
  find their way around it.
- **Key technical decisions** — the handful of decisions that shaped the implementation.
  Each stated as: the problem, the options, the choice, the consequence.
- **The hard parts** — the two or three things that were genuinely difficult, and how they
  were solved. Include the approach that did not work, where there was one.
- **Error handling** — what the system does when something fails. What is retried, what is
  surfaced to the user, what is logged, and what state the system is left in.
- **Failure behaviour** — what happens when a dependency is unavailable: the database, the
  network, an external API, a payment provider.

Code extracts are welcome here and must be short, specific, and attached to a point being
made. A page of routine code proves nothing. Ten lines that show how a race condition was
prevented prove a great deal.

### 16 · Security considerations

Not present in the source guideline. Required here, because a system handling anyone's data
that has not thought about security is not finished.

- **Authentication** — how users prove identity, how credentials are stored, session
  handling and expiry.
- **Authorisation** — how the system decides who may do what, and where that is enforced.
  Enforcement in the interface only is not enforcement.
- **Input validation** — what is validated, where, and against what.
- **Data protection** — what is sensitive, what is encrypted, in transit and at rest.
- **Known weaknesses** — what the student knows is not adequately protected, and what it
  would take to fix.

That last point is not a penalty. A student who can name their system's weakest security
assumption understands it better than one who claims there is none.

### 17 · Testing and results

The source guideline asked for a test plan and an approach. This standard asks for
**results**, because a plan without results is a statement of intent.

- **Strategy** — what kinds of testing were done and why those.
- **Test cases** — what was tested, traced back to the requirements in §9.
- **Results** — what passed, what failed, and what was done about the failures.
- **Evidence** — test output, a coverage figure, a screenshot of a passing run. Real output,
  not a table of ticks.
- **What is not tested** — and why. Every real system has untested parts.

A testing section in which everything passed on the first attempt describes either a trivial
system or an incomplete account.

### 18 · Deployment

Where the system runs, and how it got there.

- The environment — hosting, runtime, database, and any managed services.
- How a deployment happens, and whether it is automated.
- Configuration and secret handling.
- How the running system is observed: logs, errors, uptime.

Where the system runs only on the student's machine, that is stated plainly, along with what
would be required to deploy it and why that was out of scope. An honest "not deployed, and
here is what it would take" is a legitimate answer. Claiming a deployment that does not
exist is not, and the demonstration will find it.

### 19 · Challenges and solutions

The genuine difficulties of the project — technical, and where relevant practical — and how
each was resolved or worked around.

This section is evidence of real work. A project that presented no difficulty was either
trivial or is not being described honestly. Include the things that were got wrong first,
and what changed the approach. Where the platform's blocker log was used during the build,
this section is where that record becomes narrative.

### 20 · Limitations

What the system does not do, what it does not do well, and the conditions under which it
would not hold up. Includes scope that was cut, requirements only partially met, and
assumptions that would not survive contact with real scale or real users.

Stated as engineering facts, not apologies.

### 21 · Future improvements

What would be done next, in priority order, with a sentence on why each matters and roughly
what it would involve. Specific enough that another engineer could pick one up.

### 22 · Conclusion

What was achieved, judged against the objectives in §6 — each objective, and whether it was
met, partially met, or not met. Then what the student takes from the project: what they
learned about the domain, about engineering, and about their own practice.

No new material appears here.

### 23 · Demonstration readiness

Written immediately before requesting a demonstration, and read by the lecturer beforehand.

- **What will be shown** — the specific flows the student will run live.
- **What state it needs** — data that must exist, accounts required, anything to prepare.
- **What is known to be incomplete** — the parts that do not work, or work only partly.
- **Where it might fail** — anything fragile, and what the student will do if it does.

**Declaring a known gap here is professional behaviour and is treated as such.** A student
who names a broken feature in advance is demonstrating engineering judgement. A student who
hopes the lecturer will not click that button is demonstrating something else, and usually
finds out during the demonstration.

### 24 · References

Every source drawn on: publications, documentation, standards, articles, repositories, and
any substantial technical resource that shaped a decision.

A single recognised citation style, applied consistently. **Harvard is the default**, being
the style the source guideline required, but any consistent recognised style is acceptable —
this standard is not the place to legislate a house style across institutions.

Every reference is cited somewhere in the body. A reference list containing works that
appear nowhere in the text is padding, and reads as such.

Documentation and repositories count as references and should be cited. A project that
consulted no external source in its entire lifetime is not credible.

### 25 · Appendices — conditional

Evidence that supports the body but is too long to sit inside it: extended code, full schema
definitions, complete API documentation, test output, user or technical guides, instruments
used to gather requirements.

Every appendix is referenced from the body at the point it supports. An appendix nothing
refers to is not evidence; it is volume.

The source guideline required a minimum number of pages of code. **This standard does not.**
Pasting code to reach a page count proves nothing about whether the student wrote or
understands it. Include the code that supports a point, and no more.

---

## 4. Evidence

The report distinguishes three things, and so does the assessment:

| | |
|---|---|
| **What the student claims** | Assertions in prose. Weakest. |
| **What the report demonstrates** | Diagrams, code, test output, screenshots — checkable without the student present. |
| **What the demonstration verifies** | The system running, under questioning. Strongest. |

Move claims into the second column wherever possible, and expect the third column to test
both.

Evidence worth including: architecture and schema diagrams, screenshots of the system doing
the thing being described, test output, deployment evidence, API documentation, targeted
code extracts, and repository history where it exists.

Evidence not worth including: screenshots of a login page that add nothing, code with no
attached point, diagrams unconnected to the text, and statistics with no stated source.

**Every figure supports an explanation.** If a figure can be removed without weakening an
argument, remove it.

---

## 5. Repository evidence

Where the project has a repository, link it, and the commit history becomes part of the
evidence. It is externally timestamped and not ours to forge, which makes it a stronger
signal than anything the student writes about their own process.

**UmojaHub does not read repository contents and does not count commits.** It records the
link the student provides. No commit statistic in this platform is generated by inspecting a
repository, and none is displayed as though it were. The lecturer may open the repository
themselves; the platform makes no claim about what is inside it.

A project with no repository is not disqualified. Some legitimate work is not version
controlled, though a Computer Science project generally should be, and the demonstration is
a reasonable place to ask why not.

---

## 6. Figures and diagrams

**A diagram must describe the system that was built.** A generic three-tier diagram that
does not correspond to the implementation is worse than no diagram: it is a claim about the
system that the system contradicts, and the demonstration will surface the gap.

Which diagrams a project needs depends on the project. Choose what explains this system.

| Diagram | Use it when |
|---|---|
| System architecture | Always. Every system has a shape. |
| ER / schema diagram | The system stores persistent data. |
| Use-case diagram | Multiple user roles with materially different capabilities. |
| Data-flow diagram | Explaining an existing process, or a pipeline. |
| Sequence diagram | An interaction across components is hard to follow in prose — authentication, payment, a multi-step transaction. |
| Class diagram | The design has non-obvious object structure worth showing. |
| Deployment diagram | The runtime topology is not obvious from the architecture diagram. |
| State diagram | An entity moves through a lifecycle with rules about transitions. |
| Flow chart | An algorithm or decision process needs stepping through. |

**No project needs all of these.** Producing every diagram in the list is a sign the student
is satisfying a checklist rather than explaining a system.

Rules that apply to all of them:

- Numbered, captioned, and referred to from the text by number.
- Legible at the size shown; a diagram that has to be zoomed is not a diagram.
- Consistent notation within a diagram. Recognised notation where one exists.
- Redrawn if the design changed. A diagram of an earlier version, presented as current, is
  an inaccuracy.

---

## 7. AI use

Students may use AI tools. This standard treats that as a normal condition of contemporary
software work and does not penalise it.

**What is assessed is whether the student understands the system they submitted.** That is
established by the report and by the demonstration, and it is unaffected by which tools were
used to reach it.

The disclosure in §3 covers:

- **Where** AI was used — which parts of the work, at what stage.
- **Why** — what it was for.
- **What was verified** — how the student checked the output, and against what.
- **What was changed** — what was rejected, corrected, or rewritten, and why. This is
  usually the most informative part.
- **What was tested** — how AI-assisted code was tested, and what that found.
- **What remains the student's responsibility** — which is everything submitted.

Where the student used UmojaHub's AI usage log during the build, that record is the raw
material for this section. The log stays as structured data; this section is where it
becomes an account.

**Two things are not acceptable**, and both are about understanding rather than about AI:

1. Submitting code the student cannot explain. The demonstration is designed to find this.
2. Claiming no AI was used where it was. The disclosure costs nothing; the misstatement is a
   integrity matter.

---

## 8. Preparing the report in UmojaHub

**The report is written wherever the student normally writes, and uploaded to UmojaHub as a
PDF.** UmojaHub is not a document editor and does not hold the report's prose.

That is a deliberate position, not a gap. A project report has to be printable, has to be
submittable to a department that has its own requirements, has to survive being opened in
five years, and has to be defensible as the student's own document. None of that survives
being locked inside a web form, and a platform that owned the text would be asking students
to write their most important academic document in the weakest tool available to them.

PDF, and only PDF, because it is the one format that renders for the lecturer exactly as it
rendered for the student. Layout is part of what is being assessed — a figure that has moved
or a table that has reflowed is a different document.

What the platform does instead:

- **publishes the standard** — this document's section list, with each section's purpose,
  what belongs in it, and what does not, shown while the student prepares their upload;
- **receives the document** and keeps it, unmodified, byte for byte;
- **keeps every version.** A revision never overwrites the version it replaces. The earlier
  file stays, and so does the feedback that prompted the change;
- **asks what changed** on every version after the first, so a lecturer reading a
  resubmission is not left to diff two PDFs by eye;
- **gives the lecturer somewhere to read it** — the document beside the review, with the
  checklist in §9, a page-referenced note facility, and the decision;
- **controls who may read it.** The student, a verified lecturer at their institution, and
  the peer asked to read it. Every read is authorised at the moment it happens rather than
  by a storage link that, once issued, can never be withdrawn.

**The platform does not write the report.** Where AI assistance is offered, it explains what
belongs in a section and asks questions about the student's project. It does not generate
content about a system it has never seen, because a section written by a model about a
system it does not know is a fabrication with the student's name on it — and it collapses at
the demonstration.

---

## 9. Checking that the report is complete

Completeness is checked by **the lecturer**, as the first part of their review, against a
checklist drawn from this standard.

It is not checked by the platform, and this document previously said it was. The reason for
the change is simple: the platform receives a PDF and does not read it. Software that cannot
parse a document cannot report which of its sections are missing, and a completeness tick
generated without reading the document would be the platform's word on a question it has no
evidence about — worth less than nothing, because a student would trust it.

The lecturer is asked, of the report in front of them:

- Is the problem clearly defined?
- Are the objectives present and checkable?
- Is the connection to the student's coursework clear?
- Are the requirements documented, functional and non-functional?
- Is the system architecture documented?
- Is the design explained — data model and interfaces?
- Is the implementation explained, with its technical decisions?
- Is the testing documented?
- Are results presented, rather than only a plan?
- Are the limitations identified honestly?
- Are references provided, and cited in the body?
- Does the evidence appear credible?
- Does the documentation reflect a system that was actually built?

Each item maps to a section of §3, so what the lecturer is asked to look for is exactly what
the student was told to write.

**The checklist is a record, not a gate.** A lecturer who has read the report and written
their assessment has done the work; a decision refused because a box was left unticked
teaches lecturers to tick boxes. What the platform does refuse is a report sent back with
nothing named — a student told only that their work "needs changes" cannot tell where to
start, so a rejection must carry either what has to change or a note on the page it is on.

**Academic judgement belongs to the lecturer.** The platform will not score writing quality,
will not detect plagiarism, and will not assess whether an argument holds. It carries the
document, the standard and the decision, and stays out of the way.

---

## 10. The live demonstration

The report is half the assessment. The demonstration is the other half, and under the source
guideline's own weighting it is the larger half.

**Why it exists.** A report can be fabricated, generated, or written by someone else, and
marking one tells you about a student's writing. A live demonstration with questions tells
you whether they built it, whether they understand it, and whether it works. It is also the
closest thing in a degree to a technical interview and to a sprint review.

**How it runs.**

1. **Report accepted.** The lecturer reviews the report first. The demonstration is
   scheduled only once the report is good enough to be worth demonstrating against.
2. **Scheduled.** The lecturer publishes availability; the student requests a slot and says
   what they will show. The lecturer accepts or declines with a reason.
3. **Prepared.** The lecturer reads the report and the demonstration-readiness section
   before the meeting. They arrive knowing the project.
4. **Demonstrated.** The system runs. Live, not slides. **A failure during a demonstration
   is a real engineering event and is assessed on the response to it, not on the fact of
   it** — diagnosing a failure under pressure is a better signal than a rehearsed
   happy path.
5. **Questioned.** The lecturer probes the decisions: why this schema, what happens under
   load, what breaks first, what would you change. This is where understanding is
   established, and it is the reason the demonstration cannot be replaced by a recording.
6. **Evaluated.** An outcome, with reasons, against the criteria in §10.1.

**What the student should expect to be asked.** Why this architecture. Why this database.
Why this framework. Why the schema is shaped this way. How authentication works. How
authorisation is enforced, and where. What happens when a dependency fails. How it was
tested. What they would change with more time. Where AI was used and what they verified.

None of these are trick questions. All of them are answerable by a student who built the
system, and difficult for one who did not.

### 10.1 Demonstration criteria

The lecturer evaluates six things. These extend the existing UmojaHub review dimensions to
what a live demonstration can establish and a document cannot.

| Criterion | What it establishes |
|---|---|
| **Problem understanding** | Do they know what they built and who it is for? |
| **System functionality** | Does the system actually work, in the flows shown? |
| **Technical depth** | Do they understand their own implementation below the surface? |
| **Design justification** | Can they defend their architecture, schema and technology choices, including the alternatives they rejected? |
| **Response to questioning** | Can they reason about their system in real time, including about things they had not prepared? |
| **Engineering practice** | Testing, error handling, security, deployment, and honesty about limitations. |

The outcome is **approved** or **revision required**, with reasons in every case. A
demonstration that goes badly is not a dead end: the student is told what to change, does
the work, and demonstrates again.

---

## 11. What changed from the source guideline, and why

The source is a Kenyan university's undergraduate project-paper guideline for its
Information Technology degrees, dated March 2017. This section records every departure, so
the standard can be defended and its inheritance is not misrepresented.

### 11.1 Removed — institutional

Removed because they identify one institution and cannot apply to another. No academic
substance was lost.

| Removed | Note |
|---|---|
| University, school and department names | Replaced throughout by *institution*. |
| Title-page format naming a specific degree award | Replaced by a title and abstract. |
| Declaration page with signature block and supervisor certification | Substance preserved as §3, *Originality and AI use*. |
| Supervisor approval and countersignature | The Education Hub has lecturers, not supervisors of record. |
| Registration-number formats | Institution-specific. |
| Submission instructions — three bound copies to a project coordinator | Submission is to the platform. |
| Departmental examination board, disciplinary committee, grading regulations | Not ours to legislate. |
| Programme references (BBIT, BIT) | Replaced by Computer Science and Information Technology generally. |

### 11.2 Removed — obsolete or counterproductive

Removed on the merits, not because they were institutional.

| Removed | Why |
|---|---|
| **Budget and resources** (hardware, software, human cost) | A student building on free tooling has no budget. The requirement reliably produced invented cost tables. Real cost constraints now appear where they belong — as deciders in §14. |
| **Target population and sampling techniques** | Survey-research method imported into a software build. It fits a project that genuinely surveyed users and produced fabricated sample sizes for every project that did not. §9 now asks how requirements were established and accepts several honest answers. |
| **Gantt chart, network diagram, critical path** | Project-management artefacts a solo student reconstructs retroactively for the report. They evidence nothing about the software. |
| **Proposed change-over techniques** (direct, parallel, phased cutover) | Describes replacing a mainframe in an organisation. Superseded by §18, *Deployment*. |
| **Minimum four pages of code in the appendix** | A page count is the wrong unit and rewards padding. §25 asks for code that supports a point. |
| **Print-production rules** — paper weight, printer type, photocopy quality, binding | The report is digital. |
| **Page counts per chapter** (35–50 pages, 2–3 pages, 8–10 pages) | Page counts depend on formatting and cannot be validated. Replaced by word ranges, which can. |
| **Dedication and acknowledgement pages** | Already optional in the source and carrying no academic weight. Nothing prevents a student thanking anyone; the standard simply does not specify a page for it. |
| **"Written in past tense"** | A style prescription that adds nothing. Write clearly. |
| **Table of contents, list of tables, list of figures as authored sections** | Generated, not written. The platform produces them from the report's own structure. |

### 11.3 Added — missing for modern software projects

The largest category, and the reason this is a new standard rather than a reprint.

| Added | Why |
|---|---|
| **§11 System architecture** | **The source's design chapter covered only database design and input/output forms.** It had no architecture section at all. For a software project this is the single most serious omission, and it is now the most important section in the report. |
| **§14 Technology choices and trade-offs** | The source never asked why a technology was chosen. Justifying a choice against rejected alternatives is the clearest available evidence of engineering judgement. |
| **§16 Security considerations** | Entirely absent from the source. Not defensible in a Computer Science project today. |
| **§18 Deployment** | The source had cutover techniques instead. Whether the system runs anywhere real is a question worth asking. |
| **§17 test results and evidence** | The source required a test plan and an approach; it never required the outcome. |
| **Error handling and failure behaviour** (in §15) | Absent. How a system behaves when things go wrong is most of what separates a prototype from software. |
| **§3 / §7 AI use and verification** | The source predates the question by several years. |
| **§5 Repository evidence** | Version control is not mentioned in the source. |
| **§23 Demonstration readiness** | New, and the bridge between report and demonstration. Declaring known gaps in advance is treated as professional conduct. |
| **Non-functional requirements, named** (in §9) | The source said "requirement definitions and specifications" without distinguishing them. |
| **Gap analysis, named** (in §8) | The source told students not to merely compile others' work. This makes the instruction concrete and checkable. |
| **§4 evidence hierarchy** | Distinguishing claim, demonstration and verification makes the report's relationship to the live demonstration explicit. |

### 11.4 Preserved

Kept because it was right, and the standard is weaker without it.

- The **chapter progression** — problem, background, related work, requirements, analysis,
  design, implementation, testing, limitations, conclusions, recommendations. It is a sound
  spine and this standard follows it.
- **SMART objectives**, and returning to them in the conclusion.
- **Problem statements grounded in how work is currently done**, rather than in the absence
  of a system.
- **Critical engagement with related work**, not compilation.
- **Database design across conceptual, logical and physical levels** — a genuinely good
  requirement that many modern guidelines have dropped.
- **Limitations, conclusions and recommendations as reflective work**, not as an apology.
- **Consistent citation**, Harvard by default.
- **Appendices as supporting evidence** referred to from the body.
- **The evaluation weighting**, which put the system demonstration at 60 of 100 against
  documentation at 30. This standard's central structural claim — that the demonstration is
  the larger half of the assessment — is inherited from the source, not invented here.

---

## 12. Neutrality rules for anyone extending this document

1. Name no institution, department, school, faculty or programme.
2. Say *lecturer*, not supervisor, examiner, coordinator or moderator of record.
3. Say *institution*, not university, when the sentence is about the organisation.
4. Legislate no grading scale, pass mark, credit weighting or submission deadline. Those
   belong to institutions.
5. Mandate no registration-number, cover-page or binding format.
6. Assume no specific technology stack. The standard must hold for a mobile application, an
   API, an embedded system and a data pipeline alike.
7. Where a rule holds only for some projects, mark the section conditional and state the
   condition. Do not make it required and expect students to ignore it.

---

## 13. Version

**V1.** Derived from a Kenyan university undergraduate project-paper guideline (March 2017,
Information Technology degrees), with the departures recorded in §11.

**Amended 2026-08-22 — §8 and §9.** The standard originally had the report written inside
UmojaHub section by section, with the platform checking structural completeness before
submission. It is now written wherever the student writes and uploaded as a PDF, and
completeness is checked by the lecturer against the checklist in §9. Everything about *what
a report must contain* is unchanged: §1 to §7 and §10 to §12 stand exactly as approved. What
changed is where the document is authored and who answers the question the platform could
only answer while it held the prose.
