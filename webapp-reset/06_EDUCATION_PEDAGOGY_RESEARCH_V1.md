# EDUCATION HUB — PEDAGOGICAL AND ARCHITECTURAL RESEARCH — V1

**Status: RESEARCH. No approval sought for implementation. No code, no models, no APIs.**

**Purpose.** `EDUCATION_HUB_FOUNDATION_V2.md` is a draft constitution that states a solution.
It is honest enough to admit, in its own §18, that its strongest claim — one system grown
across a degree — "is currently a conviction, not a finding." This document is the research
that was owed *before* that draft: it tests the convictions against the educational
literature and against Kenyan conditions, generates genuinely different alternatives,
compares them, and recommends one.

**It fills the slot vacated by the deleted `06_EDUCATION_UX_RESEARCH.md`**, whose thesis
("Kenya's graduate crisis is a credibility gap; the cure is digital portfolios") was rejected
by the vision reset. `context/EDUCATION_HUB_VISION_RESET_AUDIT.md` §3.6 required its
replacement to be "research into the *theory-to-practice* gap." This is that replacement.

**Relationship to Foundation V2.** This document does not supersede it. It **confirms most of
it, corrects three things, adds one principle it lacks entirely, and answers four of its six
open questions.** The corrections are in §10 and are proposed as amendments through the gate,
not as silent edits.

**Governing constraint.** The Education Hub is **not a commercial product** (§0.1). That
constraint is stated before the analysis because it changes the analysis — read §0.1 before
§1.

---

## 0. How to read the evidence claims

The Education Hub was previously built on a plausible-sounding diagnosis that turned out to
be wrong. To avoid repeating that, every substantive claim below is labelled:

| Label | Meaning |
|---|---|
| **[Strong]** | Multiple independent studies, meta-analysis, or a recognised curricular standard |
| **[Moderate]** | Documented practice with reported outcomes, but limited or non-transferable measurement |
| **[Contested]** | Serious published disagreement exists; both sides are stated |
| **[Analogous]** | Evidence is real but from an adjacent domain (e.g. secondary science, not CS) |
| **[Conviction]** | No evidence found either way. Held as a belief and marked as one |

**Nothing labelled [Conviction] may be presented to a panel as a finding.** Two of Foundation
V2's load-bearing principles are [Conviction]. They are named in §12.

---

## 0.1 The governing constraint — education before profit

**The Education Hub is not a commercial product and must not be architected as one.**

It exists to improve the quality of Computer Science and Information Technology education by
giving students continuous, practical engineering experience alongside their coursework. It is
not a subscription, not a recruitment marketplace, not a freelancing or consulting platform,
not an incubator, and not a portfolio marketplace. **Sustainability and funding models are out
of scope for this research and must not influence any decision recorded here.**

This is not a values statement appended to a technical document. It is a **design constraint
with teeth**, and it is stated here — before the analysis rather than after it — because it
changes conclusions. Three examples, each developed in full later:

- It **inverts** the decision about who owns the brief library. Under commercial logic the
  library is the moat and is kept proprietary; under educational logic it is a curricular
  commons and is given away. (§9.1, D5.)
- It **surfaces an ethical exposure** in the recommended architecture that a purely technical
  reading misses: students contributing to a seed codebase owned by a company that also runs a
  commercial marketplace. (§7 Architecture E, §11.5, §12.8.)
- It **changes the definition of success**, and therefore what gets built. Engagement, growth,
  and retention are not goals here; several are actively misleading. (§13.1.)

### 0.1.1 The test every proposal must pass

Alongside Foundation V2 §9.3's load-bearing test, every feature must answer:

> **Does this exist to make a student a better engineer, or to make the platform more
> valuable?** If the honest answer is the second, it does not belong — regardless of how
> defensible it looks.

### 0.1.2 This constraint has already been applied once, and it worked

The vision reset that produced Foundation V2 was, read in this light, **the removal of a
commercial gravity well.** The retired vision's centre was employer discovery: public student
profiles, verified skills, portfolio strength ratings, and recorded employer views. That is a
recruitment marketplace, and recruitment marketplaces are how education platforms monetise.
`context/EDUCATION_HUB_VISION_RESET_AUDIT.md` names the consequence precisely — the system
"optimised the *evidence* of a capability the degree had not produced."

**The mechanism to notice, because it will recur:** nobody set out to build a recruitment
product. The commercial surface was the part with an obvious external consumer, so it accreted
features while the educational core did not. **Commercial drift in this hub will not announce
itself as monetisation. It will arrive as a reasonable-sounding feature with an unusually
motivated stakeholder.** §12.8 lists the specific forms it is most likely to take.

### 0.1.3 What this constraint does *not* license

Two failure modes hide behind non-commercial intent and both must be refused:

- **It is not permission to ignore cost.** §12.3's seed-system maintenance cost is real. But the
  reason to be frugal is educational, not financial: **an initiative that collapses under its
  own running cost takes its students' unfinished work with it.** Cost discipline here is a
  duty of care to a four-year cohort, not a margin exercise.
- **It is not permission to be unserious about quality.** "It's free and well-intentioned" is
  not a defence for a brief that fails the load-bearing test or a workflow that wastes a
  lecturer's afternoon. A student's semester is not a cheaper resource than money.

---

# PART I — THE PROBLEM

## 1. Refined problem definition

Foundation V2 §1 states the problem as: knowledge is never converted into practice, and the
conversion is left until it is nearly too late. That is right, and the research supports it,
but it is not yet *precise enough to design against*. Two refinements matter.

### 1.1 The deficit is not the volume of practice. It is its distribution and its coupling.

Kenyan CS degrees are not devoid of practical work. Every accredited programme has an
industrial attachment; most have a final-year project; many have lab components. The
University of Nairobi's BSc Computer Science, for example, requires an industrial attachment
of **eight weeks, taken between semester 2 of year three and semester 1 of year four, worth
the equivalent of two course units.** ([UoN CS
programme](https://computerscience.uonbi.ac.ke/admission-content-type/bachelor-science-computer-science))

So practice exists. Its problems are structural:

- **It is terminal.** It arrives at the end, when there is no remaining semester in which to
  apply what it taught.
- **It is short.** Eight weeks against roughly 160 weeks of degree.
- **It is decoupled.** The attachment is graded independently. Nothing requires it to
  exercise Database Systems, and nothing feeds it back into the unit that taught it.
- **It is unrepeated.** One exposure, no second iteration.

**Restated: the theory-to-practice gap in Kenyan CS is a *scheduling and coupling* failure,
not a content failure.** The right theory is taught and some practice is provided; they are
simply never made to touch, and the practice is placed where it cannot compound.

This reframing matters enormously for what follows, because **a software platform cannot fix
a content failure but it is unusually well-suited to fixing a scheduling and coupling
failure.** (§3.)

### 1.2 The formal name for the failure is constructive misalignment

Biggs's constructive alignment holds that intended learning outcomes, teaching activities and
assessment must cohere; where they do not, students rationally optimise for the assessment and
the stated outcome goes unmet. **[Strong]** ([Biggs, *Enhancing teaching through constructive
alignment*](https://link.springer.com/article/10.1007/BF00138871);
[QMUL primer](https://www.qmul.ac.uk/queenmaryacademy/educators/resources/curriculum-design/constructive-alignment/))

Kenyan CS programmes declare outcomes in the language of engineering competence and then
assess predominantly by written examination. The student is not failing to learn what the
system asks of them; **they are learning exactly what the system asks of them, and the system
asks for recall.** Kenyan employer-facing research reports precisely the predicted symptom:
graduates "often lacking coding experience, technical hands-on training," curricula "some of
which have not been revised in over a decade," and students who "graduate without knowledge of
current programming languages or agile methods." **[Moderate]** ([The
Standard](https://standardmedia.co.ke/counties/article/2001357812/glaring-gaps-in-computer-science-classes-hitting-hard-on-job-skills);
[People Daily](https://peopledaily.digital/insights/harsh-employability-reality-for-graduates))

This gives the Education Hub a defensible academic thesis, which the panel will recognise:

> **The Education Hub is a constructive-alignment instrument. It supplies the missing
> assessment-and-activity layer that makes a Kenyan CS unit's declared outcomes actually
> assessable in practice, distributed across every semester rather than concentrated in a
> terminal attachment.**

That sentence is defensible in a way that "we turn theory into practice" is not, because it
names the mechanism, the standard it appeals to, and the thing being added.

---

## 2. Analysis of the gap

Four structural findings, each with a design consequence.

### 2.1 The regulator's own staffing standard is breached by roughly four times

The Commission for University Education requires a full-time-teaching-staff-to-student ratio
of **1:10 in Applied Sciences and 1:10 in Pure and Natural Sciences** (1:15 Arts and
Humanities, 1:7 Medical). The actual national ratio is **1:39**, with some programmes at
40:1 even counting part-time staff. Teaching staff grew 14,349 → 15,383 between 2023 and 2024
(+7.2%), with growth uneven across institutions. **[Strong]** ([KIPPRA on public university
performance](https://kippra.or.ke/improving-the-performance-of-public-universities-in-delivering-higher-education-in-kenya/);
[CUE University Statistics](https://www.cue.or.ke/index.php?option=com_phocadownload&view=category&download=276:universities-data-report-2022-2023&id=18:universities-data-0-3&Itemid=187))

**Design consequence — the hardest constraint in this document.** Any workflow requiring
individually-mentored engineering supervision is asking a lecturer to do at 39 students what
the regulator sized for 10, on top of teaching, research and administration. Foundation V2
§12.3 already says "if a workflow only works at low volume, it does not work." The number puts
a figure on it. **Lecturer capacity is not a risk to be mitigated; it is the design's primary
input.** §7 evaluates every architecture against it first.

### 2.2 Infrastructure is a real, not rhetorical, constraint

Reviews of CDIO adoption in Africa identify the binding obstacle as resources: "lack of
laboratories, workshop facilities, and software tools" hindering hands-on and project-based
learning. **[Moderate]** ([CDIO in
Africa](https://cdioinstitute.org/education-amp-global-collaboration/how-the-cdio-approach-is-transforming-engineering-education-in-africa/);
[Frontiers, emerging-economy engineering
education](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2026.1824281/full))
Kenyan digital-learning research reports power and internet as "extremely unreliable." **[Moderate]**
([Pulte Institute](https://pulte.nd.edu/news/towards-equitable-and-inclusive-digital-learning-in-kenya/))

**Design consequence.** Software engineering is the one discipline where this constraint is
weakest — no wet lab, no workshop, no consumables — which is a genuine argument for CS as the
proving ground beyond Foundation V2 §5's "the model doesn't generalise." But it is not zero:
any requirement for always-on connectivity, hosted cloud deployment, or high-bandwidth live
video is a requirement some students will fail on grounds unrelated to their engineering.

### 2.3 Existing practical-training alternatives are outside the degree, and that is their weakness

Kenya has a mature private practical-training sector: Moringa School (≈5-month intensive,
partnered with Hack Reactor), ALX (≈KES 650/month via Mastercard Foundation sponsorship),
Zindua, GoMyCode, and historically Andela's multi-year fellowship. Reported placement figures
are strong. But the documented failure mode of the most scalable of them is instructive: ALX
learners "who thrive with self-directed learning report strong outcomes, while others find the
limited mentor interaction and **high dropout rate** of the model challenging." **[Moderate]**
([Zindua comparison](https://zinduaschool.com/zindua-vs-moringa-vs-alx/);
[Course Report Nairobi](https://www.coursereport.com/cities/nairobi))

**Design consequence, and the answer to a question the panel will certainly ask —
"why not just send students to Moringa?"** Because these programmes are *substitutes* for the
degree's practical content, sold separately, paid for separately, and taken after or alongside
it. They do not fix the degree; they route around it. Two consequences follow: the student pays
twice, and the 1:39 lecturer never becomes a better mentor. **The Education Hub's distinctive
claim is that it repairs the degree rather than compensating for it** — which also means it
must not become a bootcamp bolted onto a university, because the bootcamps are better at being
bootcamps.

*And the consequence that follows from §0.1:* **the practical-training market already exists,
and it is priced.** A student who can pay gets practical engineering experience; a student who
cannot gets the theoretical degree alone. That is the gap widening along ability-to-pay, in a
country where the degree is already the expensive thing a family sacrificed for. **The
non-commercial mandate is therefore not adjacent to the educational mission — it is the
mission.** Charging students for practical experience would reproduce the exact stratification
the hub exists to remove, and would turn the platform into a competitor to Moringa rather than
a repair to the university. This is the strongest argument for §0.1, and it is an educational
argument, not an ethical flourish.

### 2.4 The assessment substrate the gap relies on has just been destroyed by generative AI

Any design that assesses a student by what they submit is, in 2026, assessing what a model
produced. The computing-education literature has moved decisively toward oral defence in
response: viva voce is documented as an effective detector of contract cheating, and oral
examination is described as "not a technological fix to cheating but a redesign of assessment
that makes cheating structurally difficult while rewarding genuine understanding." CS1-specific
implementations with code-review interviews are now published. **[Strong, and recent]**
([Times Higher
Education](https://www.timeshighereducation.com/opinion/sampled-vivas-are-pivotal-combating-ai-cheating);
[Combating Harms of Generative AI in CS1 with Code Review Interviews](https://arxiv.org/pdf/2605.21374);
[Beyond the Benefits: systematic review of harms of GenAI in computing
education](https://arxiv.org/pdf/2510.04443))

**Design consequence.** Foundation V2's §P6 (demonstration over documentation) and §15 are the
best-evidenced decisions in the entire draft. This is worth stating plainly to a panel: the
demonstration is not a stylistic preference, it is the only assessment mechanism in this
design that a language model cannot sit for. Everything else — documents, code, commit
history — is now forgeable at zero cost.

---

## 3. What a software platform can and cannot do

The most common way a project like this fails its defence is by implying that software
teaches. It does not. Naming the limit precisely is what makes the rest credible.

**A platform cannot:** teach, motivate a disengaged student, create lecturer hours, replace
mentorship, or make a badly-designed curriculum good.

**A platform can do four things unusually well, and all four are exactly the failures
identified in §1.1:**

| Capability | Why it is the platform's to own | Which failure it addresses |
|---|---|---|
| **Author the problem** | Designing a brief in which a unit's concept is *structurally necessary* is expert, slow work. A lecturer cannot author 39 distinct ones per semester. This is the single most expensive thing a human does here and the most reusable once done. | Decoupling |
| **Hold continuity** | Nobody in a Kenyan university owns the state of a student's engineering work across semesters. The registry tracks marks; the lecturer changes; the unit ends. **This custodial role is institutionally vacant.** | Terminality |
| **Structure and compress review** | Turning "review this student's work" into a bounded, evidence-first, few-minutes action is a software problem. | Lecturer capacity |
| **Record provenance honestly** | Distinguishing a claim from a fact — self-declared vs institution-confirmed, student-written vs AI-assisted. | Integrity |

**This is the Education Hub's actual product definition**, and it is more defensible than
Foundation V2's: *a continuity substrate, a brief authority, and a review harness for
engineering work that human mentors still supervise.*

---

# PART II — WHAT THE WORLD ALREADY KNOWS

## 4. Global educational models

### 4.1 Project- and problem-based learning — strong for higher-order skills, contested for novices

Meta-analyses report large positive effects for PBL: achievement d = 0.871 in secondary
science; critical thinking summary effect 0.57 (95% CI 0.15–1.00); problem-solving 1.33 (CI
0.58–2.08). **[Strong, but [Analogous]** — these are predominantly secondary-science samples,
not undergraduate CS; the effect sizes must not be quoted as if they were measured on Kenyan
CS undergraduates.] ([PBL and science achievement
meta-analysis](https://eric.ed.gov/?id=EJ1318989); [PBL and critical thinking
meta-analysis](https://www.eu-jer.com/a-meta-analysis-of-the-effectiveness-of-problem-based-learning-on-critical-thinking);
[PBL and problem-solving meta-analysis](https://www.tused.org/index.php/tused/article/view/2961))

Against this sits the most serious published objection, which a CS panel will know:
Kirschner, Sweller and Clark argue that minimally-guided instruction is *less* effective and
less efficient than guided instruction, because free exploration of a complex environment
imposes a working-memory load that novices — lacking schemas to integrate new information —
cannot absorb; students "become lost and frustrated," and confusion produces misconceptions.
Critically, **"the advantage of guidance begins to recede only when learners have sufficiently
high prior knowledge to provide internal guidance."** **[Contested — this is the live
disagreement in the field, and both sides are correct about different learners.]**
([Kirschner, Sweller & Clark
2006](https://www.tandfonline.com/doi/abs/10.1207/s15326985ep4102_1);
[full text](https://www.sfu.ca/~jcnesbit/EDUC220/ThinkPaper/KirschnerSweller2006.pdf))

The reconciliation the literature offers is not "pick a side" but **fading**: scaffolding is
heavy where prior knowledge is low and withdrawn as it grows. Bayesian meta-analysis finds
computer-based scaffolding "pivotal" in making PBL work for higher-order skills in STEM.
**[Strong]** ([Educational Psychology
Review](https://link.springer.com/article/10.1007/s10648-017-9419-1))

> **This is the single most important finding in this document for correcting Foundation V2.**
> V2's project spine (§10.1) starts a first-year student on an open-ended `DATABASE_SYSTEMS`
> increment in Y1S2 — designing a schema for a 400,000-row clinical system from scratch. That
> is a textbook instance of the failure mode Kirschner et al. describe. See §10.1 for the
> correction.

### 4.2 Cognitive apprenticeship — the mentor role, already named in the literature

Collins, Brown and Newman's cognitive apprenticeship defines six methods: **modelling,
coaching, scaffolding, articulation, reflection, exploration**, with strategic control
transferred to the learner by **fading**. It makes expert *thinking* visible, which is
precisely what a rubric-scored report cannot do. **[Strong]**
([ISLS](https://www.isls.org/research-topics/cognitive-apprenticeship/); [Collins, Brown &
Holum in *American Educator*](https://www.aft.org/ae/winter1991/collins_brown_holum);
[Guzdial's review](https://computinged.wordpress.com/2017/01/20/a-review-of-one-of-my-papers-cognitive-apprenticeship-collins-brown-newman/))

**Consequence.** Foundation V2 §P5's shift from adjudicator to engineering mentor is not an
invention; it is cognitive apprenticeship, and should be defended by that name. It also gives
the mentor's job a specification rather than a sentiment: *model a decision, coach a decision,
require the student to articulate a decision, require reflection, then withdraw.* V2's
"architecture review before implementation" (§14.1 milestone 2) is coaching at the point of
maximum leverage — correct, and now justifiable by citation.

### 4.3 CS2023 — competence is knowledge *plus skills plus dispositions*, and dispositions are stage-dependent

The ACM/IEEE-CS/AAAI Computing Curricula 2023 complements the knowledge model with a
competency model of **knowledge ("know-what") + skills ("know-how") + dispositions
("know-why")**. Crucially: *"Some dispositions are more important at certain stages in a
student's development than others, e.g., **persistent** is important in introductory courses,
whereas **self-directed** is important in advanced courses."* **[Strong — this is a curricular
standard, not a study.]** ([CS2023 Version
Gamma](https://csed.acm.org/wp-content/uploads/2023/09/Version-Gamma.pdf); [Toward CS2023,
ACM Inroads](https://dl.acm.org/doi/fullHtml/10.1145/3571092))

**Consequence — this is the standards body independently arriving at §4.1's conclusion.**
Expecting self-direction from a first-year is contrary to the curriculum standard the Kenyan
curricula are themselves benchmarked against. It also supplies the Education Hub with a
progression axis that is *not* self-selected difficulty (the retired `StudentTier`) and *not*
purely the unit: **autonomy**. Year 1 asks for persistence; year 4 asks for self-direction.

### 4.4 CDIO — the closest whole-programme analogue, and its warning

CDIO (Conceive–Design–Implement–Operate) sets engineering fundamentals in the context of the
process engineers actually use, with 12 standards covering outcomes, integrated curriculum
design and aligned assessment; 116+ universities across seven regions including Africa.
**[Strong as a framework; [Moderate] on outcomes.]** ([CDIO: an international
initiative](https://www.researchgate.net/publication/277291833_CDIO_An_international_initiative_for_reforming_engineering_education);
[CDIO in Africa](https://cdioinstitute.org/education-amp-global-collaboration/how-the-cdio-approach-is-transforming-engineering-education-in-africa/))

**Consequence, and a warning.** CDIO is a *programme reform*, adopted by a department, with
curriculum redesign and faculty development. UmojaHub cannot reform a curriculum; it has no
standing to. **The Education Hub must therefore be adoptable by a single willing lecturer in a
single unit without institutional reform** — otherwise it inherits CDIO's adoption cost with
none of CDIO's authority. This directly shapes §7's evaluation.

### 4.5 Vertically Integrated Projects — the closest precedent for "one system, grown", and it is *team*-based

VIP is the strongest existing evidence for Foundation V2's §P2. Undergraduates join
long-lived, faculty-led projects and **remain on them across multiple semesters and years**,
progressing from new member to experienced contributor to mentor. Teams are large — "fifteen
or more students from different disciplines" and vertically integrated across year levels.
Participation is **for academic credit**, not stipend. The consortium spans 44 institutions
across 16 US states and 13 countries, 40+ universities, 4,500+ students per term, and won the
2019 ABET Innovation Award. **[Moderate — widely adopted with reported gains in equity,
leadership and job placement; the published descriptions are program-level rather than
controlled outcome studies.]** ([VIP
Consortium](http://www.vip-consortium.org/homepage); [VIP: multidisciplinary projects with
homes in any discipline](https://www.vip-consortium.org/publication/vertically-integrated-projects-vip-programs-multidisciplinary-projects-homes-any);
[CUR: a pathway to systemic
reform](https://www.cur.org/journal-article/a-pathway-to-systemic-reform-vip-programs-and-the-vip-consortium/);
[ABET Innovation Award](https://provost.gatech.edu/news/vip-consortium-receives-2019-abet-innovation-award))

> **The decisive detail.** VIP's own account of *why it scales* is that it is **"scalable
> (team-based rather than individual mentoring)."** The one global model that has actually
> sustained multi-year student projects at volume achieves it by having one faculty member
> supervise a *team of fifteen*, with senior students mentoring junior ones — not by having
> one faculty member supervise fifteen individuals.
>
> **Foundation V2 proposes multi-year continuity with individual ownership and individual
> mentorship, at a 1:39 ratio. That is VIP's structure with VIP's scaling mechanism removed.**
> This is the second correction (§10.2).

### 4.6 Real-client software engineering courses — the instructor-burden problem, named

Bruegge, Krusche and Alperowitz's TOCE study of project courses with industrial clients names
the central tension exactly: *"how to make the project complex enough to enrich students'
software engineering experience, yet realistic enough to have a teaching environment that does
not unduly burden students or the instructor."* Their Rugby process model structures the
semester around a small number of fixed milestones — Kickoff, Team Allocation, **Design
Review**, and a **Client Acceptance Test** — and they report that release-management and
collaboration-workflow tooling *reduced effort during delivery and increased deliverable
quality*. **[Strong for the design; [Moderate] for outcomes.]** ([Software Engineering Project
Courses with Industrial Clients, ACM TOCE](https://dl.acm.org/doi/10.1145/2732155);
[PDF](https://ase.in.tum.de/lehrstuhl_1/research/paper/bruegge2015projectcourses.pdf))

**Consequence.** Two things transfer directly. First, **few fixed milestones beat continuous
supervision** — V2's six-milestone set (§14.1) is at the upper limit of what the literature
supports and should be treated as a maximum, not a floor. Second, this is published evidence
that *tooling reduces instructor burden in exactly this workflow* — the closest thing this
research found to direct support for building the Education Hub at all.

### 4.7 HFOSS — students learning inside real, pre-existing codebases

Humanitarian FOSS places students in genuine open-source projects serving real social needs.
A multi-institutional study and a six-year longitudinal study of student attitudes report
increased interest in computing, improved learning, and increased appreciation of computing's
societal impact. **[Moderate]** ([A Multi-Institutional Study of Learning via Student
Involvement in HFOSS](https://dl.acm.org/doi/abs/10.1145/2787622.2787726); [Using HFOSS to
introduce computing for the social good](https://dl.acm.org/doi/abs/10.1145/2809957.2809967))

**Consequence.** This is the strongest evidence for an option Foundation V2 does not consider:
that a student's first increments could be **contributions to an existing system rather than
authorship of a new one**. It is also how the profession actually onboards juniors — nobody's
first industry task is a greenfield build. Brownfield work is harder in a specific,
teachable way: "you must understand what exists before you can safely change it."
([Brownfield development](https://en.wikipedia.org/wiki/Brownfield_(software_development)))
That difficulty is *scaffolding*, not an obstacle: the architecture is given, so the student's
whole cognitive budget goes to the unit's concept.

### 4.8 Peer assessment — usable, but only in a specific shape

Peer marks correlate with instructor marks at **r ≈ 0.69 across 48 higher-education studies**.
Reliability is high even for first-years; **validity is not** — first-year peer assessment
shows low validity on detail-level dimensions while holding up better on higher-level ones.
More raters per item improves validity. And, importantly for interface design: **peer marks
align with teacher marks better when peers make *global judgments against clearly defined
criteria* than when they fill in fragmented, dimension-specific ratings.** **[Strong]**
([Changes in reliability and validity of peer assessment across the college
years](https://www.lrdc.pitt.edu/schunn/papers/zhangetal-reliabilityvaliditychange.pdf);
[Peer assessment, self-assessment and resultant
feedback](https://www.tandfonline.com/doi/full/10.1080/03043797.2023.2185769))

**Consequence.** Foundation V2 §13.3's decision to strip peer review of any gating power is
vindicated — first-year peer judgment is not valid enough to gate anything. But the finding
also *upgrades* peer review's value: multiple peers making holistic judgments against explicit
criteria is a genuine capacity multiplier, and it is the mechanism by which a 1:39 lecturer
can see filtered signal instead of raw volume.

### 4.9 Spiral curriculum — the name for what V2 is proposing

Bruner's spiral curriculum has learners revisit topics and key concepts repeatedly, building
on previous material cyclically. **[Strong as an established curricular approach.]**
([Edinburgh IAD, useful curriculum
approaches](https://institute-academic-development.ed.ac.uk/prog-course-design/about/useful-curriculum-approaches))

**Consequence.** Foundation V2's §P2 has a name in the literature, which helps its defence —
but note what the spiral actually specifies: *concepts* recur at increasing depth. It does not
specify that the *artefact* persists. Those are different claims, and V2 conflates them. §12.1.

---

## 5. Suitability for the Kenyan context

Filtering the above through §2's constraints.

| Global model | Transfers to Kenya? | Reasoning |
|---|---|---|
| **PBL / problem-based** | **Partially** | Effective for higher-order skills, but the guidance requirement (§4.1) is expensive in staff time — the resource Kenya has least of. Viable only with heavy pre-authored scaffolding, which is exactly what software can supply. |
| **CDIO** | **Principles yes, adoption no** | Requires departmental curriculum reform and faculty development. UmojaHub has no standing to demand either. Borrow the C-D-I-O arc; do not require the programme. |
| **VIP** | **Yes — best structural fit** | Credit-bearing, team-based, faculty-led, explicitly built for scale. Its 15:1 team structure is *closer to Kenya's 1:39 reality* than any individual-supervision model. Its dependence on faculty *research* programmes is the part that does not transfer; Kenyan CS departments are teaching-loaded, not research-loaded. |
| **Real-client SE courses** | **Yes, with a caveat** | Bruegge's milestone structure transfers cleanly. Sourcing genuine industrial clients for every student at scale does not. The brief library substitutes an authored realistic client for a scarce real one — a deliberate, disclosable trade. |
| **HFOSS** | **Yes — and cheaply** | Requires only internet and a repository. No lab, no client, no licences. Directly addresses §2.2. Its weakness is that upstream maintainers are not accountable to a Kenyan student's semester. |
| **Capstone-only** | **This is the status quo** | It is what already exists and what is failing. Not a candidate. |
| **Bootcamp** | **No** | Substitutes for the degree rather than repairing it (§2.3), and the sector already does it better. |
| **Oral defence / viva** | **Yes, and urgently** | Low infrastructure cost, high integrity value, GenAI-resistant. Bandwidth is the only constraint, and audio-only degrades gracefully. |

**Synthesis.** The Kenyan-viable set is: *authored problems + brownfield entry + few fixed
milestones + team/cohort supervision + peer filtering + oral defence.* That set is derived
from constraints, not preferences, and it is what §7 and §9 build from.

---

# PART III — CHALLENGING THE ASSUMPTIONS

## 6. Assumption register

Each assumption is stated, tested, and given a verdict. Several are Foundation V2's own.

| # | Assumption | Verdict | Reasoning |
|---|---|---|---|
| A1 | We need university APIs / SIS integration | **REJECTED** | No Kenyan university publishes one (V2 §8.1), and the platform's core loop does not require one. V2's capability ladder already degrades correctly. Confirmed, not changed. |
| A2 | Lecturers must record grades in the platform | **REJECTED** | Grades of record belong to the university. Duplicating them creates a reconciliation liability and an LMS we said we are not building. Approval of a milestone is not a grade. |
| A3 | The platform must generate every brief with an LLM | **REJECTED — this is a change to V2** | See §10.3. Brief authoring is the highest-expertise, most-reusable, most-quality-sensitive artefact in the system. Free generation optimises for the wrong thing (novelty) at the point where we need reliability. V2 §18.5 left this open; this document closes it. |
| A4 | Each student needs their own project | **REJECTED — this is a change to V2** | Individual ownership is what makes supervision unscalable (§4.5) and what puts a novice in front of a blank repository (§4.1). See §10.2. |
| A5 | Difficulty must be modelled | **CONFIRMED, but re-axed** | V2 correctly killed self-selected `StudentTier`. But "difficulty derives from academic level" is incomplete. CS2023 supplies the better axis: **autonomy** (persistent → self-directed, §4.3). Difficulty is *how much scaffolding is withdrawn*, not *how hard the problem is*. |
| A6 | A student must build the same system for four years | **NOT ESTABLISHED — [Conviction]** | The spiral curriculum supports revisiting *concepts*; nothing found supports persisting the *artefact* for four years, and VIP persists the *project* while rotating *students*. §12.1. |
| A7 | Live demonstration must be the primary assessment | **STRONGLY CONFIRMED** | §2.4, §4.9. The best-evidenced decision in V2. |
| A8 | Revision must be a cycle, not a terminal state | **CONFIRMED** | Formative feedback that cannot be acted on is not formative. Both cognitive apprenticeship (coaching) and constructive alignment require the loop. V2 §P7 stands without qualification. |
| A9 | The hub can be voluntary / co-curricular | **REJECTED — the most dangerous assumption in the project** | §6.1 below. |
| A10 | Agriculture should anchor the domains | **REJECTED** | Already resolved by V2 §P8; the seeded library already spans eight domains. No change. |
| A11 | Tamper-evidence / document hashing is needed | **CONFIRMED as retired** | With no external verifier, hashing a prose document protects nothing. Repository history and live defence are stronger and cost us no subsystem. V2 §14.3 stands. |
| A12 | Institutions must onboard before students benefit | **REJECTED** | V2's T0 tier is right: the hub must be useful to a student whose university has never heard of us, or it never reaches the university. Confirmed. |
| A13 | A sustainability or funding model must be designed alongside the product | **REJECTED — out of scope by mandate** | §0.1. More than a scoping call: designing for future revenue now would silently reintroduce the surfaces §12.8 lists, because architecture outlives intentions. Funding is a later, separate question that must be answered *within* the constraints fixed here, never by relaxing them. |
| A14 | The brief library is the platform's competitive advantage and should be proprietary | **REJECTED — inverted** | The only argument for withholding it is commercial, and §0.1 removes that argument. Every curricular framework this design borrows from propagated *because* it was open. D5. |

### 6.1 A9 in full — voluntary participation is a design failure, not a rollout strategy

This is the assumption most likely to sink the project, and Foundation V2 §18.6 names it as
the question "that decides whether any of it matters" while leaving it open.

The evidence is not neutral. Participation in non-credit-bearing activity is **not uniform**:
students face "competing academic demands," and **"socioeconomic disparities continue to
influence engagement, with students from lower-income households participating less."**
Universities are consequently moving to make such engagement "institutionalised and
credit-bearing." **[Strong]** ([Students' involvement in co- and extra-curricular
programs](https://www.researchgate.net/publication/404273744_Students'_Involvement_in_Co-_and_Extra-Curricular_Programs_and_Activities_Insights_into_Participation_and_Leadership_Engagement);
[How do universities recognise student
volunteering?](https://www.tandfonline.com/doi/full/10.1080/21568235.2021.1919170))

Two conclusions, both hard:

1. **A voluntary Education Hub selects for students who already have time, devices,
   connectivity and confidence — the students least in need of it.** It would widen the gap it
   exists to close, while producing flattering engagement metrics from a self-selected cohort.
   This is the same class of error as the retired portfolio vision: optimising a visible proxy
   while the underlying deficit is untouched.
2. **The corollary applies to lecturers with equal force.** A lecturer who mentors on the
   platform *in addition to* their teaching load is volunteering against a 1:39 ratio. That
   lecturer exists, will be the pilot, and will not scale.

> **Therefore: the design target is not "students use the platform." It is "the platform
> becomes how a unit's existing practical assessment is run."** Adoption must *displace*
> work, not add it — for both actors. This is the single largest strategic consequence of
> this research, and it drives the recommendation in §9.

---

# PART IV — SOLUTION ARCHITECTURES

## 7. Six candidate architectures

Each is a genuinely different answer to "how does theory become practice", not a feature
variation. Each is stated at its strongest before being criticised.

---

### A — Self-Directed Practice Ladder
*The platform serves the student directly. No institution, no lecturer.*

A student declares their units. The platform issues unit-anchored briefs, an AI mentor
coaches, peers review each other's code, and progress is self-tracked. The university is
irrelevant to the loop.

- **Mechanism:** authored problems + AI coaching + peer review.
- **Strongest argument:** ships immediately, needs no partner, works for a student at any
  institution, and is the only architecture with *zero* dependence on the 1:39 constraint.
- **Fatal weakness:** it is ALX's model, and ALX's documented failure mode is dropout with
  limited mentor interaction (§2.3). It also abandons §1.2 entirely — it does not repair the
  degree's misalignment, it routes around it. And it is exactly the voluntary, self-selecting
  structure §6.1 rejects.
- **Verdict:** **Not viable alone. Essential as the T0 floor** — the state the platform is in
  before any institution engages.

---

### B — Individually Mentored Evolving System *(Foundation V2 as drafted)*
*One student, one system, one lecturer, growing across the degree.*

The student owns a `SystemProject` from year one. Each semester an increment anchored to a
current unit extends it. A lecturer mentors through milestones and a live demonstration.

- **Mechanism:** spiral curriculum + cognitive apprenticeship + unit coupling.
- **Strongest argument:** the most pedagogically coherent story of the six, and the only one
  in which coursework demonstrably compounds. The graduate artefact — a deployed, tested,
  secured system with three years of real history — is genuinely unlike anything the status
  quo produces.
- **Weaknesses, in order of severity:**
  1. **Supervision does not scale.** Individual mentorship at 1:39, against a standard of
     1:10, with live demonstrations. §2.1, §4.5.
  2. **It puts novices in front of a blank repository.** §4.1 predicts they will be lost.
  3. **Four-year artefact persistence is [Conviction]**, not finding. §12.1.
  4. Lock-in: a first-year's naive domain choice constrains a final-year student. V2 §10.3's
     escape hatches acknowledge this; heavy use of them would falsify §P2.
- **Verdict:** **Correct spine, unscalable body.** Keep the continuity thesis; replace the
  supervision and onboarding models.

---

### C — Cohort Studio *(VIP-derived)*
*One lecturer, one unit, one cohort of squads. Seniors mentor juniors.*

The unit of supervision is the **squad**, not the student. A lecturer running Database Systems
opens a studio for the semester; students work in vertically-integrated squads on
unit-anchored increments; review happens in **batched studio sessions** where squads present
to each other with the lecturer adjudicating; senior students act as first-line reviewers.

- **Mechanism:** VIP's team-based scaling + Bruegge's fixed milestones + peer filtering.
- **Strongest argument:** it is the only architecture whose supervision cost is
  **sub-linear in student count**, and it is the one with real-world precedent at scale (40+
  universities, 4,500+ students/term). It also converts §4.8's peer-review finding from a
  nice-to-have into the load-bearing capacity mechanism. Batched review is also how sprint
  reviews and design reviews actually work in industry — so the scaling mechanism is *itself*
  an industry practice, not a compromise.
- **Weaknesses:** individual attribution is harder (mitigated by V2 §13.2's individual demo
  segments); a weak squad can carry a passenger; requires the lecturer to run a session rather
  than review asynchronously, which is a different, not smaller, ask.
- **Verdict:** **This is the missing half of B.** Recommended as B's supervision layer.

---

### D — Curriculum-Embedded Coursework *(the unit's assessment, run here)*
*The platform is where the unit's existing practical assignment lives.*

A lecturer adopts the Education Hub as the delivery mechanism for the coursework they already
set and already mark. The platform supplies the brief, the milestone structure, and the review
harness. **Nothing is added to anyone's workload; existing work is displaced.**

- **Mechanism:** constructive alignment applied to one unit at a time.
- **Strongest argument:** it is the only architecture that survives §6.1 for *both* actors. It
  requires no institutional reform (unlike CDIO), no curriculum change, no committee — one
  lecturer can adopt it for one unit. And it makes the student's participation
  non-optional-in-the-right-way: it is their coursework.
- **Weaknesses:** it surrenders the continuity thesis if taken alone — a unit's coursework
  ends when the unit ends, which reproduces the disconnected-assignments failure. It also
  makes the platform dependent on lecturer adoption for any value at all, and cedes control of
  quality to whatever the lecturer chooses to assign.
- **Verdict:** **This is the adoption strategy the others lack.** Recommended as the entry
  mode — but only if continuity is preserved *across* adopting units, which is precisely what
  the platform (and only the platform) can do.

---

### E — Shared Domain Commons *(HFOSS-derived)*
*Students join existing long-lived systems instead of each owning one.*

The platform hosts a small number of real, long-lived codebases in Kenyan problem domains.
Students enter as contributors, take unit-anchored issues against them, and rise from
bug-fixer to feature-owner to maintainer across their degree.

- **Mechanism:** legitimate peripheral participation + brownfield scaffolding.
- **Strongest argument:** it solves §4.1's novice problem *structurally* — the architecture is
  given, so the novice's cognitive budget goes entirely to the unit's concept. It is how the
  profession actually onboards juniors. It concentrates the platform's scarce authoring effort
  into a few excellent systems rather than thousands of mediocre ones. And **UmojaHub itself is
  such a system** — a production platform with real users, payments, escrow, RBAC and trust
  scoring, whose codebase the student can read. That is an asset no competitor has.
- **Weaknesses:** ownership and pride are diluted — the student cannot say "I built this";
  maintaining shared codebases is a real, ongoing platform cost; and contribution-shaped work
  can be too narrow to exercise a whole unit.
- **The exposure §0.1 surfaces, and it is serious.** UmojaHub is a company that runs a
  commercial agricultural marketplace. This architecture has students writing code against a
  codebase that company owns. **Stated uncharitably — and a panel will state it uncharitably —
  that is a business extracting unpaid engineering labour from undergraduates under the
  description of education.** The charge is not answered by intent; it is answered by
  structure. See §11.5 for the three structural guarantees that must hold, and §12.8 for why
  this is the most likely single route by which the hub drifts commercial.
- **Verdict:** **The right answer for the early years specifically — conditional on the §11.5
  guarantees.** Recommended as the scaffolded entry stage, before ownership is granted. If the
  guarantees cannot be made structural, this architecture must be dropped and its scaffolding
  benefit obtained from a third-party HFOSS codebase instead, at the cost of losing §11.5's
  domain realism.

---

### F — Attachment-Distributed Model
*Take the eight-week attachment and spread it across eight semesters.*

The platform simulates the attachment experience — a supervisor, a ticket queue, a standup
cadence, a deliverable — repeatedly and in miniature, from year one.

- **Mechanism:** distribute the one thing that already works.
- **Strongest argument:** it needs no new pedagogical claim; it argues only that the existing,
  regulator-sanctioned practical component is mistimed and too short. That is a very easy
  argument to win with a panel, and it maps onto an existing accredited structure.
- **Weaknesses:** simulating a workplace without a real supervisor produces theatre; ticket
  queues teach execution, not design, and the gap §1 identifies is largely a *design* gap; and
  it has no mechanism for coupling to specific units.
- **Verdict:** **Rejected as an architecture.** Its framing, however, is the best available
  way to explain the project to Kenyan academics, and should be borrowed for that purpose.

---

## 8. Comparative analysis

Scored against the eleven criteria in the mission brief. **H/M/L** = high/medium/low; for cost
and complexity, **L is better**.

| Criterion | A Self-directed | B Individual (V2) | C Cohort studio | D Curriculum-embedded | E Shared commons | F Attachment-distributed |
|---|---|---|---|---|---|---|
| Educational effectiveness | L | **H** | **H** | M–H | M–H | M |
| Ease of adoption | **H** | L | M | **H** | M | M |
| Student experience | M | **H** | M–H | M | M | L |
| **Lecturer workload** (L is better) | **L (none)** | **H — fails §2.1** | **L–M** | **L (displaces)** | M | M |
| Scalability | **H** | **L** | **H** | **H** | **H** | M |
| Technical complexity (L better) | M | H | H | **L–M** | H | M |
| Cost (L better) | **L** | M | M | **L** | H | M |
| Sustainability | L (dropout) | L (mentor burnout) | **H** | **H** | M | M |
| Fit with Kenyan conditions | M | L | **H** | **H** | **H** | **H** |
| Fit with UmojaHub | M | **H** | **H** | **H** | **H** | M |
| Future extensibility | L | M | **H** | **H** | M | L |

**Reading the table.** No single column wins, and the pattern is consistent: **B is the only
architecture with high educational effectiveness *and* a fatal operational profile; C, D and E
each solve exactly one of B's three weaknesses and none solves the others.**

- **B** owns the *why* (continuity, compounding, a real graduate artefact).
- **C** fixes B's supervision scaling.
- **D** fixes B's adoption and workload-addition problem.
- **E** fixes B's novice-scaffolding problem.
- **A** is what the product is before any institution says yes.
- **F** is the explanation, not the architecture.

That is not a compromise; it is a decomposition. Each candidate addresses a different one of
the four failures in §1.1, which is why the recommendation composes them rather than choosing.

---

# PART V — RECOMMENDATION

## 9. Recommended architecture: **Scaffolded Cohort Continuity**

> **A student's engineering work is one system that grows across their degree (B). They enter
> it as a contributor to an existing codebase and earn ownership as they progress (E). It is
> supervised in cohort studios by unit, not per student, with senior students as first-line
> reviewers (C). It is adopted by lecturers as the delivery mechanism for coursework they
> already set (D). Where no lecturer has adopted it yet, it degrades to a self-directed ladder
> that still works (A). And it is explained to Kenyan academics as distributing the industrial
> attachment across the whole degree (F).**

### 9.1 The six load-bearing decisions

D1–D4 follow from the pedagogical and capacity evidence. **D5–D6 follow from §0.1** and would
read differently — in D5's case, oppositely — under commercial logic.

**D1 — Continuity is the product; ownership is earned, not granted.**
The `SystemProject` persists across semesters, as Foundation V2 says. But the student does not
start as its author. Years 1–2 are **extension increments against a platform-maintained seed
system** in their chosen domain — real code, real constraints, architecture already made. The
student's cognitive budget goes to the unit's concept, which is the only thing the increment
is assessing. Ownership — the right to fork the seed into *their* `SystemProject` and take it
where they want — is **granted at the transition to advanced standing**, typically year 3,
when CS2023's *self-directed* disposition becomes the appropriate expectation (§4.3).

*Justification:* Kirschner/Sweller/Clark on novice cognitive load (§4.1); CS2023 on
stage-dependent dispositions (§4.3); HFOSS on learning inside real systems (§4.7); brownfield
work as deliberate scaffolding (§4.7). This also dissolves V2 §10.4's "a student who joins in
year three has no history" limitation — a late joiner starts where every student starts, at
the seed.

**D2 — Supervision is by cohort, and review is batched.**
A lecturer opens a **studio** for a unit they teach, for a semester. Students in that unit
work in vertically-integrated squads. Milestones are reviewed in batched studio sessions —
squads present, peers question, the lecturer adjudicates and directs. Senior students are
first-line reviewers of junior work. **Individual assessment is preserved** through V2 §13.2's
individual demonstration segments.

*Justification:* VIP is the only model that has sustained multi-year student projects at
volume, and its stated scaling mechanism is team-based rather than individual mentoring
(§4.5). Bruegge et al. show few fixed milestones and tooled workflows reduce instructor effort
(§4.6). Peer judgment is reliable and — with multiple raters making holistic judgments against
explicit criteria — valid enough for filtering (§4.8). And the 1:39 ratio (§2.1) admits no
alternative.

**D3 — The platform enters as coursework, never as an addition.**
The first thing a lecturer can do is take an assignment they *already set and already mark* and
run it here. No curriculum reform, no committee, no institutional agreement. Continuity is the
platform's contribution across those adoptions: individual lecturers own single semesters;
**only the platform holds the thread between them** (§3).

*Justification:* §6.1 — voluntary participation selects for the already-advantaged among
students and for the already-overloaded among lecturers, and the equity evidence is
unambiguous. CDIO's adoption ceiling in Africa (§4.4) shows what requiring reform costs.

**D4 — Briefs are a curated library with generated variation, not free generation.**
Foundation V2's load-bearing test (§9.3) is the highest-value idea in the entire design and
is retained without change. But the way to *pass* it reliably is not free LLM generation.
The platform maintains an **expert-authored brief library**, keyed to `KnowledgeArea` ×
domain × autonomy stage, each entry carrying its load-bearing criteria and anti-patterns.
Generation *varies* an entry — domain, scale, constraints, dataset, seed-system state — within
authored bounds. Every new library entry passes human review before any student sees it.

*Justification:* this closes V2's open question §18.5 rather than deferring it. Brief authoring
is the most expertise-dense and most reusable artefact in the system (§3); reliability matters
more than novelty there; and §4.6 shows the value of a *realistic authored client* as a
substitute for a scarce real one. It is also the cheaper answer, and the only one whose
quality can be audited before it reaches a student.

**D5 — The brief library is a public curricular commons, not an asset.**
The library from D4 is the most expensive and most valuable artefact the platform will ever
produce. **It is published openly, under a licence permitting reuse and adaptation, and
lecturers may contribute entries and take them elsewhere.**

*Justification — and note that this decision inverts under commercial logic.* A company would
keep the library proprietary; it is the defensible moat, the reason an institution cannot
leave, and the thing a competitor cannot copy. §0.1 removes that reasoning entirely, and once
removed the educational case is one-sided:

- **The mission is to improve Kenyan CS education, not to improve Kenyan CS education *on
  UmojaHub*.** A load-bearing Database Systems brief that a lecturer at a non-participating
  university uses in their own classroom is the mission succeeding. Withholding it to protect
  adoption would be sacrificing the goal for the metric.
- **Every framework this design borrows from is a commons.** The ACM/IEEE curricula, CDIO's 12
  standards, and HFOSS are all openly published, and that is *why* they propagated (§4.3, §4.4,
  §4.7). A closed curricular library has no precedent in this literature because closed
  curricular libraries do not spread.
- **It converts the platform's biggest cost into a shared one.** Contribution from lecturers
  at other institutions is the only realistic path to library breadth across 18 knowledge areas
  and a dozen domains, and nobody contributes to an asset they cannot use.
- **It is the strongest available proof of §0.1 to a sceptical panel.** Giving away the most
  commercially valuable thing in the project is an argument that cannot be made rhetorically.

*Boundary:* the commons covers **briefs, load-bearing criteria, anti-patterns and milestone
structures** — the curricular content. It does not obligate open-sourcing the UmojaHub
application itself, which is a separate question this document takes no position on.

**D6 — No student ever pays, and no institutional arrangement may gate student access.**
Student use is free at every tier of §8's capability ladder, including T0. Should an
institution ever be involved in funding, **that arrangement must never become a condition of a
student's access** — a student whose department declines to participate keeps the full T0
product (§9, Architecture A). Academic data is never sold, licensed, or used to produce
comparative rankings between institutions. Demonstration recordings belong to the student
(V2 §15.5).

*Justification:* §2.3's stratification argument, and §6.1's finding that the students most
excluded by any access barrier are precisely the students the hub exists for. This decision
also protects the capability ladder's design: T0 only stays honest if it stays free.

### 9.2 What this preserves from Foundation V2, unchanged

The spine survives, and most of the draft is confirmed rather than corrected:

- §P1 academic context first, §P3 the load-bearing test, §P4 real software, §P6 demonstration
  over documentation, §P7 revision as a cycle, §P8 all Kenyan domains, §P9 CS/IT only,
  §P10 not the student's shop window — **all confirmed.**
- §7's canonical `KnowledgeArea` taxonomy and the mapping strategy — **confirmed as the right
  integration surface**, and now additionally justified: CS2023's competency model gives the
  taxonomy an external standard to anchor to (§4.3).
- §8's capability ladder and the hard rule against ever touching student portal credentials —
  **confirmed without qualification.** T0-works-alone is the same conclusion this document
  reaches for Architecture A.
- §8.4 provenance shown, never a claim presented as a fact — **confirmed**, and it is the same
  principle the marketplace already runs on.
- §14.3 retiring document hashing — **confirmed.**
- §15's demonstration workflow — **confirmed and strengthened** (§2.4).

### 9.3 Why this survives a panel

The four questions a Kenyan academic panel will actually ask, and the answers:

1. *"Where is your evidence that this works?"* — Every component is borrowed from a documented
   model with reported outcomes: VIP for multi-year team projects, HFOSS for learning in real
   codebases, Bruegge for milestone-structured project courses, cognitive apprenticeship for
   the mentor role, CS2023 for the progression axis, the viva literature for assessment. The
   *composition* is novel; the parts are not, and that is deliberate.
2. *"How does one lecturer supervise 39 students?"* — They do not supervise 39 students. They
   run one studio, review batched squad presentations, and adjudicate reviews that seniors and
   peers have already filtered. This is the only question that killed three of the six
   candidate architectures, and D2 exists solely to answer it.
3. *"How do you know the student did the work, when a model can write the code?"* — We do not
   rely on the submission. Assessment weight sits on live demonstration and questioning, which
   is where the computing-education literature has moved for exactly this reason (§2.4).
4. *"Why should the university let you near this?"* — Because we are not asking to change the
   curriculum, issue credentials, hold grades of record, or replace any system. We are asking
   one lecturer to run one existing assignment through a tool that reduces their marking
   effort and remembers what the student built last semester.
5. *"What are you getting out of our students?"* — The sharpest question in the room, and it
   deserves a structural answer rather than a reassurance. Students never pay (D6). Their
   academic data is never sold and never used to rank institutions against each other (D6).
   There is no employer, no talent search, and no hiring signal anywhere in the model — that
   entire surface was deleted, not deprecated. The most commercially valuable artefact the
   project produces, the brief library, is **published openly for any lecturer to use without
   us** (D5). And student contributions to a seed codebase never reach UmojaHub production
   (§11.5). The honest answer to what we get is: a CS/IT graduate pipeline in Kenya that is
   better at engineering than it is today, in a country where that is the constraint on
   everything else this platform is trying to do.

---

## 10. Proposed amendments to Foundation V2

Four, offered as gated amendments. Each names what it replaces.

**A1 — §10.1, §11 stages 4–5: staged autonomy.** The project spine currently begins with a
student authoring a system in year one. Replace with: **contribution to a platform-maintained
seed system in years 1–2, ownership earned at advanced standing.** Add **autonomy stage** as a
first-class attribute of a `ProjectIncrement`, replacing the deleted `StudentTier`'s function
without reintroducing self-selection. (Evidence: §4.1, §4.3, §4.7.)

**A2 — §12, §15: cohort supervision.** The lecturer lifecycle is written per student.
Replace with: **the studio is the unit of supervision** — a lecturer, a unit, a semester, a
cohort of squads, batched review sessions, senior students as first-line reviewers.
Individual attribution is preserved via §13.2's demonstration segments. This also supplies the
answer V2 §15 leaves open about how demonstration scales: **batched by default, individually
questioned within the batch, live-and-individual reserved for the increment's final
demonstration.** (Evidence: §2.1, §4.5, §4.6, §4.8.)

**A3 — §9.2, §16.2, §18.5: curated library, generated variation.**
`generateAIBrief` is currently scheduled for a rewrite into free generation on a richer prompt.
Replace with: **an expert-authored, human-reviewed brief library that generation varies within
bounds.** The load-bearing test (§9.3) becomes a property of a library *entry*, checked once by
a human, rather than a filter run against every generation. (Evidence: §3, §4.6, and V2's own
§18.5.)

**A4 — §3 (new principle P11): the non-commercial constraint is missing from V2 entirely.**
Foundation V2 has ten principles and none of them says the hub is not a commercial product.
This is a genuine gap, not a pedantic one: V2's §P10 ("we are not the student's shop window")
states the *conclusion* of the non-commercial argument without ever stating the argument, which
leaves it looking like a scoping preference rather than a constraint. **Add P11 — "Education
before profit"** — with §0.1's test attached, and re-derive §P10 from it. Add the three
structural guarantees of §11.5 and the D5/D6 decisions to §16 as architectural commitments,
so they survive as constraints on future work rather than as a statement of good intentions in
a preamble.

*Why this matters more than it appears:* §0.1.2 shows that the retired vision drifted commercial
without anyone deciding to make it commercial. A constitution that does not name the constraint
cannot detect the drift. **The single cheapest defence against repeating the portfolio mistake
is a written principle that a proposed feature can be tested against.**

**Consequential note.** A1 and A2 together substantially reduce the new-model surface V2 §16.3
proposes, because a seed system and a studio are both *shared* objects — far fewer per-student
entities than a per-student system with per-student milestones and per-student demonstrations.
This is a secondary benefit, not the justification.

---

## 11. Fit within UmojaHub

The Education Hub must feel like another room in the same building. It does, on five counts —
and one of them is an asset nothing else in the market has.

**11.1 It reuses the platform's existing spine, not a parallel one.** NextAuth with the
existing five-role RBAC (`STUDENT`, `LECTURER`, `INSTITUTION`, `ADMIN`), `requireRole`,
`connectDB` → session → role → Zod → DB, `AppError`/`handleApiError`, models in
`src/lib/models/*.model.ts`, validation in `src/lib/validation/`. Nothing in this
recommendation requires a new architectural pattern. Foundation V2 §16.4 already states this;
it remains true under the amendments.

**11.2 It reuses the communication layer as-is.** `notify()`/`notifyAdmins()`, the
`Notification` inbox and the SMTP lifecycle email already carry the marketplace's
time-sensitive events. Studio sessions, milestone outcomes, review requests and demonstration
bookings are the same shape of event. **No new notification infrastructure is needed** — which
is a real integration benefit, since the alternative is a second messaging system.

**11.3 It reuses the AI layer with a better grounding.** `MentorSession` and the Groq-backed
mentor already exist. Under this recommendation the mentor gains what it currently lacks:
the student's unit, their increment, and the state of their seed system. The same is true of
`platformKnowledge.ts`, which currently teaches the assistant the *retired* vision and must be
rewritten regardless.

**11.4 It inherits the platform's philosophy, which is the same philosophy.** The marketplace
direction is trust-based sourcing — *confidence over speed*, claims never rendered as facts.
Foundation V2 §8.4's provenance rule is that principle applied to academic data, and it was
learned the hard way in this codebase: the buyer-verification funnel that made users fabricate
business registration numbers is the same defect in a different room. The Education Hub gets
this for free because the platform already believes it.

**11.5 UmojaHub is itself the best seed system available.** Architecture E requires real,
long-lived codebases in Kenyan problem domains for students to enter. UmojaHub is a production
system with real users, M-Pesa payments, escrow with a state machine, RBAC, trust scoring,
price intelligence, and a notification layer — in a Kenyan domain, with tests, CI, and three
years of commit history. **A `DATABASE_SYSTEMS` increment against real escrow-ledger query
load, or an `INFORMATION_SECURITY` increment against real RBAC, is not a simulation.** No
bootcamp and no other platform can offer this. It is the strongest single argument that the
Education Hub belongs inside UmojaHub rather than beside it.

**But this is also the project's sharpest ethical exposure** (§7 Architecture E), and the
strength of the asset is exactly what makes it dangerous: the more genuinely useful student
work against this codebase becomes, the more tempting it is to use. Intent does not answer the
charge. **Three guarantees must be structural, not policy:**

1. **The seed is a one-way teaching copy.** Student work flows *from* the seed, never *back into*
   UmojaHub production. No pull request from a student increment is ever merged into the running
   platform. This is not a review rule that a busy maintainer can waive under deadline — the
   seed must be a separate repository with no merge path home, so that violating it requires a
   deliberate act rather than an oversight.
2. **No student work is ever used commercially.** Not in the marketplace, not in the product,
   not in a demo of the product, not as training data. If a student's idea is good enough to
   want, the correct response is to say so and leave it theirs.
3. **The student owns what they write** — their repository, their code, their licence choice,
   their recording. UmojaHub takes no ownership stake, no assignment of rights, and no
   exclusivity. This is Foundation V2 §P10 applied to the artefact rather than the profile.

`CLAUDE.md`'s prohibition on touching platform logic is strengthened by this, not weakened:
production is not merely off-limits to the redesign, it is off-limits to the teaching seed in
both directions.

**If any of the three cannot be made structural, drop Architecture E's UmojaHub-as-seed
advantage** and take the scaffolding benefit from a third-party HFOSS codebase instead. Losing
domain realism is a real cost; being unable to answer §9.3's fifth question is a fatal one.

---

## 12. Risks, limitations and trade-offs

Stated at full strength. Anything softened here would be found by a panel anyway.

### 12.1 The four-year single-artefact claim is still unproven — and it is now weaker than V2 assumed

**[Conviction, and the weakest point in the design.]** Bruner's spiral supports revisiting
*concepts* at increasing depth; it says nothing about persisting an artefact. VIP persists the
*project* while *students* rotate through it — the opposite arrangement. No study was found
measuring outcomes for an individual student maintaining one codebase across a full degree.

*What this document does about it:* D1's seed-system entry substantially de-risks it, because
years 1–2 continuity is now the platform's responsibility (the seed persists regardless) and
only years 3–4 depend on the student sustaining their own system. **That is a two-year claim,
not a four-year one** — materially more defensible. But it remains a conviction. V2 §18.4's
falsification test (watch how often the escape hatches are used) is retained and is the right
one.

### 12.2 Lecturer adoption is unproven and is the whole project's single point of failure

Every architecture except A depends on a lecturer choosing to run a studio. D3 minimises the
ask — displace existing work, do not add to it — but it does not eliminate it, and a lecturer
at 1:39 with a research obligation may still decline. **[Conviction, unavoidably, until a
pilot runs.]** This is V2 §18.1 and it remains the first thing to test.

### 12.3 The seed system is a real, recurring platform cost

Architecture E's benefits come from codebases that are genuinely good, genuinely maintained,
and genuinely instructive. That is engineering work with no end date, and it is a cost V2 does
not currently carry. Starting with UmojaHub itself (§11.5) defers but does not remove it —
a second and third domain will eventually be needed, since a hub that only teaches agriculture
violates §P8.

### 12.4 Batched review trades depth for feasibility, and that is a real loss

Individual mentorship is better teaching than cohort studio review. D2 chooses the worse
pedagogy because the better one cannot be staffed. **This should be conceded openly to a
panel rather than dressed up** — the honest claim is that a studio session that happens beats
individual mentorship that does not.

### 12.5 Attribution remains gameable

Commit history is forgeable, declared ownership is self-reported, and a model can write a
convincing increment. The demonstration is the only real control, and it is only as good as
the questioning. V2 §13.2 already states this; nothing in this research improves it.

### 12.6 Equity risks inside the design

Live demonstration privileges good bandwidth; squad work privileges students who can
coordinate outside class; seed-system contribution privileges students with a working laptop.
Each has a mitigation (audio-only fallback, asynchronous recorded demonstrations for lower-stakes
milestones, offline-tolerant workflows) and each mitigation is a design obligation, not an
optional nicety — §6.1's finding is precisely that unexamined designs quietly exclude the
students they were built for.

### 12.7 What this design deliberately gives up

- **Speed.** Curated briefs (D4) are slower to produce than generated ones.
- **Student autonomy in years 1–2.** Deliberately traded for scaffolding (D1).
- **Individual pride of authorship early.** A seed contributor cannot say "I built this."
- **Institutional data richness.** No grades, no SIS integration, no portal access — by choice.
- **Any employer-facing surface.** Permanently, per V2 §P10.
- **The brief library as a competitive asset.** Given away by decision (D5).

### 12.8 Commercial drift — the specific forms it will take

§0.1.2's lesson is that drift arrives as a reasonable feature with a motivated stakeholder, not
as a decision to monetise. These are the concrete proposals to expect, each of which will sound
sensible in the room where it is raised. **Recognising them in advance is the whole defence.**

| Proposal, as it will be phrased | What it actually reintroduces | Verdict |
|---|---|---|
| "Employers keep asking to see the good students" | Recruitment marketplace. The retired vision, exactly. | **Refuse.** No employer exists in the model. |
| "Let students take paid client work through the platform" | Freelancing marketplace; also destroys the unit-coupling that makes work educational. | **Refuse.** |
| "Charge institutions for the dashboard" | Gates student access behind a department's budget; breaks D6 and the T0 floor. | **Refuse** in any form that touches student access. |
| "Premium tier: more AI mentor sessions / faster review" | Rations education by ability to pay — §2.3's stratification, inside our own product. | **Refuse.** |
| "The best student projects could become UmojaHub features" | §11.5's guarantee 1, breached by enthusiasm rather than intent. **The most likely single breach**, because it will feel like a compliment to the student. | **Refuse.** Structural, per §11.5. |
| "Keep the brief library private — it's our advantage" | Withholds the mission's main output to protect the metric. | **Refuse** per D5. |
| "Rank institutions by student outcomes; departments would pay for it" | Turns academic data into a product and makes the platform a judge of universities. | **Refuse** per D6. |
| "Sponsor-branded project briefs" | Curriculum content sold to the highest bidder; the load-bearing test loses to the sponsor's product. | **Refuse.** |

*The pattern worth naming:* every entry above is more *legible* than the educational core — it
has an obvious buyer, an obvious metric, and an obvious next step, whereas "a graduate who is
better at engineering" has none of those for four years. **Commercial features win by being
easier to measure, not by being more valuable.** That asymmetry is permanent and must be
designed against rather than resolved.

---

## 13. Validation plan — what would falsify this

### 13.1 What success means here — and what must never be measured as success

§0.1 changes the instrument panel, not just the intent. **The metrics that would ordinarily
indicate a healthy platform are, in this hub, either irrelevant or actively misleading**, and
naming them now prevents a future team from optimising the wrong thing in good faith.

**Rejected as measures of success:**

| Metric | Why it is rejected |
|---|---|
| **Revenue / conversion** | Out of scope by mandate (§0.1). |
| **User growth / signups** | A student who signs up and completes nothing has been counted, not helped. §6.1 shows growth would come disproportionately from the students least in need. |
| **Engagement / time in product** | **Inverted here.** Students should spend their time in their editor and their repository, not in our interface. A rising session duration is a sign we have added friction. |
| **Retention / DAU** | The correct cadence is per-semester (V2 §11), not daily. Daily return would mean we had become a second workload — the exact §6.1 failure. |
| **Projects created** | The retired vision's error in a new costume: counting artefacts produced rather than capability gained. |
| **Briefs generated** | Measures our output, not their learning. D4 deliberately prefers fewer, better briefs. |

**Accepted as measures of success**, in the order they become observable:

1. **Did the unit's concept end up load-bearing?** Sampled review of completed increments
   against §9.3's test — the closest available proxy for the thing we actually claim to do.
2. **Did the lecturer's workload go down?** Hours spent supervising through the platform versus
   hours the displaced marking took (V2 in §13.2). If this is not negative, nothing else counts.
3. **Did revision actually cycle?** Count of `CHANGES_REQUESTED` → resubmission → approval
   loops. A hub where this is near zero has quietly rebuilt the terminal verdict.
4. **Did students return the next semester without being chased**, and did their system carry
   forward rather than restart? (§P2's real test; see V6.)
5. **Did lecturers return the next semester without being chased?** The single strongest signal
   available, because a time-poor lecturer at 1:39 volunteering a second semester is an
   unfakeable judgement on whether it worked.
6. **Do students arrive at industrial attachment demonstrably ahead of their peers?**
   Supervisor feedback, comparing participants and non-participants in the same cohort. This is
   the outcome the whole project claims and it is **four years out** — which is precisely why
   metrics 1–5 exist as leading indicators, and why none of them may be substituted for it.

*The uncomfortable implication, stated deliberately:* **this project cannot prove it worked for
roughly four years.** Every earlier number is a proxy. A team that needs to demonstrate success
sooner will reach for the rejected metrics in the left column, because those are available
immediately. **That pressure is the mechanism by which §12.8's drift happens**, and the defence
is to have written down, in advance, which numbers do not count.

### 13.2 Falsification tests

A recommendation that cannot be falsified is not research. Each claim below has a test that
could kill it, ordered by how cheaply it can be run.

| # | Claim | Test | Falsified if |
|---|---|---|---|
| V1 | A lecturer will adopt this in place of existing coursework (D3) | Show the studio concept to 5 CS lecturers at 2 institutions before building anything | Fewer than 2 would run it for an existing assignment |
| V2 | Batched studio review fits a real lecturer's week (D2) | Run one studio, one unit, one semester. **Measure hours.** | It exceeds the hours the displaced marking took |
| V3 | Curated briefs can pass the load-bearing test reliably (D4) | Author 10 briefs across 3 knowledge areas; have 3 lecturers try to complete each *without* applying the unit's concept | Any brief is completable without the concept |
| V4 | Seed-system entry beats blank-repository start for novices (D1) | Two first-year groups, same unit, one seeded and one greenfield | Greenfield students produce comparable working systems |
| V5 | A department will publish its curriculum (T1) | Ask one department to enter one programme's unit structure | It does not happen within a semester |
| V6 | Continuity holds (§P2) | Track escape-hatch usage across two semesters | Fork/restart is the common case rather than the exception |
| V7 | It does not become a second workload (§6.1) | Ask students in the pilot what it displaced | Students report it as additional to coursework |
| V8 | The §11.5 seed guarantees can be made structural, not policy | Attempt to configure the seed repository with no merge path to production before any student uses it | The separation depends on a human remembering — in which case drop UmojaHub-as-seed per §7 Architecture E |

**V1 and V2 are cheap and gate everything else. Neither requires a line of code.** V1 in
particular can be run this month, and if it fails, the correct response is to redesign the
adoption model rather than build any of this.

---

## 14. Future evolution path

Sequenced so that no later stage complicates an earlier one, and so that each stage is
independently valuable if the next never happens.

**Stage 0 — Validate (no code).** V1 and V2 above. This is the current stage.

**Stage 1 — Academic context.** V2 §17 Stage 1 unchanged: `KnowledgeArea`, `AcademicProgramme`,
`CurriculumUnit`, `StudentEnrolment`, T0 and T1, provenance shown. *Nothing else is possible
without this.*

**Stage 2 — Seed increments (A + E).** The brief library, one seed system (UmojaHub itself),
extension increments, self-directed ladder. **Ships without a single lecturer.** This is the
T0 product and it must stand alone.

**Stage 3 — The studio (C + D).** Lecturer opens a studio for a unit, adopts an existing
assignment, batched milestone review, `CHANGES_REQUESTED` as a cycle. **This is where the
project either works or does not**, and the earliest point at which V2's `REVISION_REQUIRED`
dead end finally dies.

**Stage 4 — Demonstration.** Booking, batched sessions, individual questioning, weighting.
Audio-only and asynchronous fallbacks are part of this stage, not a later polish.

**Stage 5 — Ownership transfer and continuity.** Fork from seed to owned `SystemProject`,
cross-semester carry-forward, escape hatches. **This is when §P2 becomes testable** (V6).

**Stage 6 — Squads and peer review.** Vertical integration, senior-as-reviewer, individual
attribution.

**Stage 7 — Deeper integration.** T2 lecturer attestation, then T3 adapters with a willing
partner. Aggregate institutional insight, strictly own-students, never comparative.

**Beyond.** Other disciplines only after CS/IT demonstrably works, on V2 §17's evidence bar:
a cohort with multiple completed increments, lecturers who return unprompted, and graduates
arriving at attachment ahead of their peers. **Nothing before Stage 7 should be designed to
accommodate it.**

**What keeps the first release simple:** Stages 1–2 contain no lecturer workflow, no studio, no
teams, no demonstrations, and no ownership transfer. A student gets academic context, a seed
system, and unit-anchored increments. That is a complete, honest, shippable product — and it
is the T0 floor the whole capability ladder was designed around.

**What no stage introduces:** a payment surface, a paid tier, an employer, a client, a ranking,
or any gate on student access. **No stage in this roadmap is a step toward monetisation**, and
none is designed to leave room for one later (§0.1, A13). If a future stage requires one, that
is a decision to change the mission and must be argued as such — not slipped in as a stage 8.

---

## 15. Summary for the record

1. The gap is **constructive misalignment** — a scheduling and coupling failure, not a content
   failure. That is a problem software can genuinely address (§1, §3).
2. **Lecturer capacity at 1:39 against a regulatory standard of 1:10 is the binding
   constraint** and eliminated three of six candidate architectures (§2.1, §8).
3. **Foundation V2's spine is right and its supervision model is not.** Continuity, the
   load-bearing test, demonstration-first, revision-as-cycle and provenance-honesty all
   survive; individual mentorship, blank-repository starts, and free brief generation do not
   (§9, §10).
4. **Voluntary participation would widen the gap it exists to close.** The platform must
   displace existing work for both students and lecturers, never add to it (§6.1).
5. **UmojaHub itself is the best seed codebase available**, and that is the strongest argument
   that this hub belongs inside this platform (§11.5).
6. **Two claims remain convictions** — four-year artefact persistence, and lecturer adoption.
   Both have cheap falsification tests that require no code, and both should be run before
   anything is built (§12.1, §12.2, §13.2).
7. **The hub is not a commercial product, and that constraint changed the design** rather than
   decorating it: it inverted who owns the brief library (D5, published openly), added the
   student-access guarantees (D6), and surfaced the seed-codebase labour exposure that a purely
   technical reading missed (§11.5, §12.8). Foundation V2 never states this constraint —
   amendment A4 adds it, because **a constitution that does not name the constraint cannot
   detect the drift**, which is how the portfolio vision happened (§0.1.2).
8. **This project cannot prove it worked for about four years**, and the metrics available
   sooner are the ones that mislead. §13.1 fixes in advance which numbers count and which are
   forbidden, because that pressure is the actual mechanism of commercial drift.

---

## Sources

**Curricular standards and frameworks**
- [Computer Science Curricula 2023 (CS2023), Version Gamma — ACM/IEEE-CS/AAAI](https://csed.acm.org/wp-content/uploads/2023/09/Version-Gamma.pdf)
- [Toward computer science curricular guidelines 2023 — ACM Inroads](https://dl.acm.org/doi/fullHtml/10.1145/3571092)
- [CDIO: An international initiative for reforming engineering education](https://www.researchgate.net/publication/277291833_CDIO_An_international_initiative_for_reforming_engineering_education)
- [How the CDIO approach is transforming engineering education in Africa](https://cdioinstitute.org/education-amp-global-collaboration/how-the-cdio-approach-is-transforming-engineering-education-in-africa/)
- [Transforming engineering education in emerging economies — Frontiers in Education](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2026.1824281/full)

**Learning theory**
- [Kirschner, Sweller & Clark (2006), Why minimal guidance during instruction does not work — Educational Psychologist](https://www.tandfonline.com/doi/abs/10.1207/s15326985ep4102_1) ([full text](https://www.sfu.ca/~jcnesbit/EDUC220/ThinkPaper/KirschnerSweller2006.pdf))
- [Cognitive Apprenticeship — ISLS](https://www.isls.org/research-topics/cognitive-apprenticeship/) · [Collins, Brown & Holum, *American Educator*](https://www.aft.org/ae/winter1991/collins_brown_holum) · [Guzdial's review](https://computinged.wordpress.com/2017/01/20/a-review-of-one-of-my-papers-cognitive-apprenticeship-collins-brown-newman/)
- [Biggs, Enhancing teaching through constructive alignment — Higher Education](https://link.springer.com/article/10.1007/BF00138871) · [QMUL primer](https://www.qmul.ac.uk/queenmaryacademy/educators/resources/curriculum-design/constructive-alignment/)
- [Spiral curriculum and other curriculum approaches — Edinburgh IAD](https://institute-academic-development.ed.ac.uk/prog-course-design/about/useful-curriculum-approaches)
- [Effectiveness of computer-based scaffolding in PBL for STEM — Educational Psychology Review](https://link.springer.com/article/10.1007/s10648-017-9419-1)
- [PBL and science achievement: a meta-analysis](https://eric.ed.gov/?id=EJ1318989) · [PBL and critical thinking](https://www.eu-jer.com/a-meta-analysis-of-the-effectiveness-of-problem-based-learning-on-critical-thinking) · [PBL and problem-solving](https://www.tused.org/index.php/tused/article/view/2961)

**Computing and engineering education practice**
- [Vertically Integrated Projects Consortium](http://www.vip-consortium.org/homepage) · [VIP: multidisciplinary projects with homes in any discipline](https://www.vip-consortium.org/publication/vertically-integrated-projects-vip-programs-multidisciplinary-projects-homes-any) · [CUR: a pathway to systemic reform](https://www.cur.org/journal-article/a-pathway-to-systemic-reform-vip-programs-and-the-vip-consortium/) · [VIP Consortium receives 2019 ABET Innovation Award](https://provost.gatech.edu/news/vip-consortium-receives-2019-abet-innovation-award)
- [Bruegge, Krusche & Alperowitz, Software Engineering Project Courses with Industrial Clients — ACM TOCE](https://dl.acm.org/doi/10.1145/2732155) ([PDF](https://ase.in.tum.de/lehrstuhl_1/research/paper/bruegge2015projectcourses.pdf))
- [A Multi-Institutional Study of Learning via Student Involvement in HFOSS Projects — ICER](https://dl.acm.org/doi/abs/10.1145/2787622.2787726) · [Using HFOSS to introduce computing for the social good — ACM SIGCAS](https://dl.acm.org/doi/abs/10.1145/2809957.2809967)
- [Changes in the reliability and validity of peer assessment across the college years](https://www.lrdc.pitt.edu/schunn/papers/zhangetal-reliabilityvaliditychange.pdf) · [Peer assessment, self-assessment and resultant feedback](https://www.tandfonline.com/doi/full/10.1080/03043797.2023.2185769)

**Assessment integrity under generative AI**
- [Sampled vivas are pivotal in combating AI cheating — Times Higher Education](https://www.timeshighereducation.com/opinion/sampled-vivas-are-pivotal-combating-ai-cheating)
- [Combating Harms of Generative AI in CS1 with Code Review Interviews and a Flipped Classroom](https://arxiv.org/pdf/2605.21374)
- [Beyond the Benefits: A Systematic Review of the Harms and Consequences of Generative AI in Computing Education](https://arxiv.org/pdf/2510.04443)

**Kenyan context**
- [KIPPRA — Improving the performance of public universities in delivering higher education in Kenya](https://kippra.or.ke/improving-the-performance-of-public-universities-in-delivering-higher-education-in-kenya/)
- [Commission for University Education — University Statistics 2022/23](https://www.cue.or.ke/index.php?option=com_phocadownload&view=category&download=276:universities-data-report-2022-2023&id=18:universities-data-0-3&Itemid=187) · [CUE Standards and Guidelines](https://www.cue.or.ke/index.php?option=com_phocadownload&view=category&id=16:standards-and-guidelines&Itemid=494)
- [University of Nairobi — BSc Computer Science programme structure and industrial attachment](https://computerscience.uonbi.ac.ke/admission-content-type/bachelor-science-computer-science)
- [Glaring gaps in computer science classes hitting hard on job skills — The Standard](https://standardmedia.co.ke/counties/article/2001357812/glaring-gaps-in-computer-science-classes-hitting-hard-on-job-skills) · [Harsh employability reality for graduates — People Daily](https://peopledaily.digital/insights/harsh-employability-reality-for-graduates)
- [University graduates' employability skills mismatch and labour market demands in Kenya](https://www.researchgate.net/publication/368803932_UNIVERSITY_GRADUATES'_EMPLOYABILITY_SKILLS'_MISMATCH_ND_THE_LABOUR_MARKET_DEMANDS_IN_KENYA)
- [Towards equitable and inclusive digital learning in Kenya — Pulte Institute, Notre Dame](https://pulte.nd.edu/news/towards-equitable-and-inclusive-digital-learning-in-kenya/)
- [Comparing Kenyan coding schools: Zindua vs Moringa vs ALX vs GoMyCode](https://zinduaschool.com/zindua-vs-moringa-vs-alx/) · [Nairobi coding bootcamps — Course Report](https://www.coursereport.com/cities/nairobi)

**Participation and equity**
- [Students' involvement in co- and extra-curricular programs and activities](https://www.researchgate.net/publication/404273744_Students'_Involvement_in_Co-_and_Extra-Curricular_Programs_and_Activities_Insights_into_Participation_and_Leadership_Engagement)
- [How do universities recognise student volunteering? — European Journal of Higher Education](https://www.tandfonline.com/doi/full/10.1080/21568235.2021.1919170)
- [Higher education student motivations for extracurricular activities — Journal of Education and Work](https://www.tandfonline.com/doi/full/10.1080/13639080.2023.2167955)
