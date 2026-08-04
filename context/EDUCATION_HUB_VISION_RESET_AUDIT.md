# Education Hub — Vision Reset Audit

**Date**: 2026-08-04
**Status**: **DELETION PASS COMPLETE** (2026-08-04, branch `refactor/education-hub-vision-reset`).
All six decisions in §6 were approved. §3 is executed except for `StudentTier` and
`ProjectTrack`, which are **deferred to the rebuild** — see the note at the end of §3.3.
§4 (rewrite) and the new foundation (§7 step 2) are still outstanding.
**Directive**: The Education Hub is not a portfolio, credential, or recruitment platform. It is the
practical execution layer beside a Kenyan CS/IT degree: it turns theoretical coursework into
continuous, real engineering experience from first semester to graduation.

This document is the complete account of what exists today, what exists *only* because of the
retired vision, and what each item's fate should be. It is the input to the deletion pass and to
the new architectural foundation.

---

## 1. What the Education Hub actually is today (code-true)

A student picks **a track** (`AI_BRIEF` or `OPEN_SOURCE`) and **a self-selected difficulty tier**
(`BEGINNER` / `INTERMEDIATE` / `ADVANCED`). OpenAI generates a one-shot client brief from an
industry context library. The student builds it and files three prose documents (Problem Breakdown,
Approach Plan, Final Reflection) plus a blocker log and an AI-usage log. Each document is SHA-256
hashed on submission. An anonymous peer scores 2 dimensions; an admin-verified lecturer then scores
4 dimensions and issues one terminal verdict — `VERIFIED` / `REVISION_REQUIRED` / `DENIED`.
`VERIFIED` materialises a **StudentPortfolioStatus** aggregate (verified projects, verified skills,
portfolio *strength*, tier progression) which is published at a **public slug**
`/portfolio/[slug]`, read without an account by employers, whose views are recorded as
**PortfolioView** documents and pushed to the student as `PORTFOLIO_VIEW` notifications.

Every one of the emphasised nouns is the retired vision.

**The defect underneath**: the unit of work is *one project, chosen by the student, sized by the
student, ending in a credential*. The new vision's unit of work is *one system, chosen by the
curriculum, growing across semesters, ending in an engineer*. Nothing in the current model has a
concept of a semester, a unit, a syllabus, a milestone, a team, a demonstration, or a second
iteration of the same project. `REVISION_REQUIRED` is a dead end in code — there is no resubmission
path — which is the clearest single proof that the system was built to terminate in a badge.

---

## 2. Classification

Three buckets. **DELETE** = exists only to serve portfolio/recruitment. **REWRITE** = the concept
survives but its foundation is wrong. **KEEP** = unaffected or newly load-bearing.

---

## 3. DELETE — exists purely for the portfolio / recruitment vision

### 3.1 Data models

| Item | Why it no longer fits |
|---|---|
| `src/lib/models/StudentPortfolioStatus.model.ts` | The showcase aggregate. `portfolioStrength`, `verifiedSkills`, `visibility`, `publicSlug`, `reviewerInstitutions` exist only so an outsider can be impressed. Progress in the new vision is *academic* (units completed, milestones approved), not a strength rating. |
| `src/lib/models/PortfolioView.model.ts` | Records that an employer opened a student's page. Pure recruitment analytics. There is no employer. |

### 3.2 Routes and pages

| Item | Why it no longer fits |
|---|---|
| `src/app/portfolio/[slug]/page.tsx` | The public, LinkedIn-style student profile. Students own their portfolio; we are not it. |
| `src/app/api/portfolio/[slug]/route.ts` | The unauthenticated JSON feed of that profile — built so an employer could query a credential. |
| `src/app/api/students/me/portfolio/route.ts` (+ `__tests__`) | Reads the aggregate and toggles PUBLIC/PRIVATE visibility. Both halves are showcase mechanics. |
| `src/app/dashboard/student/portfolio/page.tsx` (217 lines) | The portfolio builder screen. |
| `Portfolio` nav entry in `src/app/dashboard/student/_components/StudentShell.tsx:47` | Ditto. |
| `Portfolio` nav entry in `src/components/shared/Sidebar.tsx:55` | Ditto (legacy shell). |

### 3.3 Types and enums

| Item | Why it no longer fits |
|---|---|
| `PortfolioStrength` (`types/index.ts:218`) | BUILDING/DEVELOPING/STRONG/EXCEPTIONAL is a showcase rating. |
| `PortfolioVisibility` (`types/index.ts:458`) | Public/private only matters if there is a public. |
| `StudentTier` (`types/index.ts:212`) | **Self-selected** difficulty. In the new vision difficulty is *derived* from where the student is in their degree and which unit the project applies. A student choosing ADVANCED in first year is exactly the fabrication we are removing. |
| `ProjectTrack` (`types/index.ts:225`) | `AI_BRIEF` vs `OPEN_SOURCE` frames the platform as a project-source menu. Projects now begin with academic context. (`OPEN_SOURCE` may return later as a *mode* of a unit-anchored project — it does not survive as a top-level track.) |
| `NotificationType.PORTFOLIO_VIEW` (`types/index.ts:472`) + policy line in `src/lib/notifications/notify.ts:24` | Notifies a student that a recruiter looked at them. |
| `IVerifiedProject`, `IVerifiedSkill`, `ITierProgressionEntry`, `IStudentPortfolioStatus` (`types/education.ts:123-164`) | Interfaces for the above. |

> **Deferred: `StudentTier` and `ProjectTrack` were NOT deleted.** Both are listed above
> and both should go — but they are the *inputs* to the brief generator, the engagement
> model, the validation schema, the lecturer queue and the demo pipeline, all of which
> are §4 **rewrite** items with no replacement built yet. Deleting the enums in this pass
> would have forced the rebuild to happen inside a deletion commit, or left project
> creation broken with nothing behind it — and the directive was explicit that the new
> Education Hub is not implemented in this task. They die with the mechanism that
> replaces them: difficulty derived from where a student is in their degree, and projects
> sourced from academic context rather than a track menu. Their portfolio-facing uses
> (portfolio strength, tier progression, verified-skill tiers) are already gone.

### 3.4 Aggregation and cron

| Item | Why it no longer fits |
|---|---|
| `PlatformImpactSummary.education` block + its producers in `src/app/api/cron/impact-summary/route.ts` and `src/app/api/cron/weekly-jobs/route.ts` | Aggregates `verifiedProjectCount`, `skillsIssuedCount`, `averageProjectScore` off `StudentPortfolioStatus` — credential-issuance metrics. The new equivalent measures engineering practice (milestones approved, demos held, units applied), not credentials minted. |

### 3.5 Copy that states the old mission as fact

| Item | Why it no longer fits |
|---|---|
| `src/lib/auth/welcome.ts:21` | "…start building the public portfolio employers can see." |
| `src/app/onboarding/_components/roleOptions.tsx:40` | Student role described as "Build a lecturer-verified portfolio". |
| `src/lib/ai/platformKnowledge.ts:39-46` | Teaches the AI assistant that the product is a portfolio employers discover via talent search. Actively propagates the retired vision to users. |
| `src/app/dashboard/student/page.tsx:66-77` | "Finished projects become your public portfolio — the thing an employer can check"; hint "what employers see when they look you up". |
| `src/app/dashboard/student/projects/new/page.tsx:235` | "A harder tier carries more weight in your portfolio." |

### 3.6 Documentation and planning

| Item | Why it no longer fits |
|---|---|
| `context/EDUCATION_HUB_ECOSYSTEM_MAP.md` (208 lines) | The old vision's constitution. Employers are named "the endpoint of the trust chain"; the entire document is about transferring trust to a hiring manager. Unsalvageable — **delete, do not amend**. |
| `webapp-reset/06_EDUCATION_UX_RESEARCH.md` | Thesis: "Kenya's graduate crisis is a credibility gap… the cure is digital portfolios." That is the premise we have rejected. Must be replaced by research into the *theory-to-practice* gap. |
| README §Education Hub rows "Verified portfolios" / "Employer discovery" (l. 209-210), l. 42, l. 80-81, l. 97, l. 102, Act VI (l. 161-167), role table Employer row (l. 252), student row (l. 250), flow `VER --> EMP` (l. 306-309), ER edge `PORTFOLIO_VIEW` (l. 407), model list (l. 422), demo table rows 6-8 (l. 615-617), roadmap "Richer employer tooling" (l. 695), lesson l. 704-706 | The README is declared the single source of truth for the project; it currently certifies the retired vision in ~15 places. |
| Screenshot slots `portfolio-public.png`, `student-portfolio.png`, `employer-talent-search.png` + their entries in `scripts/capture-screenshots.ts` | Assets of screens that will not exist. |
| `webapp-reset/IA_INFORMATION_ARCHITECTURE_V1.md:42,76` | "Portfolio (`/student/portfolio`) — the showable, verified artifact"; journey ends "→ portfolio". |
| `webapp-reset/UMOJAHUB_WEBAPP_FOUNDATION_V1.md:15,56` | Defines the student persona as "How do I prove capability when a degree isn't enough?" and the student↔employer pair as one of the two trust relationships the whole app exists for. This is a **Gate-approved constitution** — it needs an amendment through the gates, not a silent edit (see §6.1). |
| `context/APPLICATION_USER_JOURNEYS.md`, `context/PRODUCTION_ROADMAP.md`, `context/CORRECTIVE_ACTIONS_CHECKLIST.md`, `context/SIMULATION_PLATFORM_ANALYSIS.md`, `webapp-reset/04_USER_RESEARCH_FINDINGS.md`, `webapp-reset/BUILD_CHECKLIST.md`, `webapp-reset/EXPERIENCE_JOURNEYS_ALL_ROLES_V1.md`, `webapp-reset/JOURNEY_AND_SCREEN_MAP_V1.md`, `webapp-reset/CHARACTER_SET_BRIEF_V1.md`, `webapp-reset/ONBOARDING_DESIGN_DIRECTION_V1.md` | Each carries portfolio/employer references. Historical records (checklists of completed work) can keep theirs with a header note; forward-looking planning docs must be corrected. Itemised at deletion time. |
| `CLAUDE.md` | Lists "education workflows" under **DO NOT TOUCH PLATFORM LOGIC**. That instruction now blocks this directive and must be amended (see §6.1). |

### 3.7 Demo / seed data

| Item | Why it no longer fits |
|---|---|
| `scripts/demo/phases/education.ts:206-243` | Materialises portfolio status, public slugs, and fabricated *employer views* of portfolios with `PORTFOLIO_VIEW` notifications. |
| The `'portfolio'` student archetype (`phases/education.ts:29`, `phases/people.ts:408`, `phases/foundation.ts:92`) | An archetype defined by portfolio strength. |
| `scripts/demo/registry.ts:22,24`; `scripts/demo/reset.ts:96,102` | Model registration + reset entries for the two deleted models. |
| `scripts/demo/orchestrate.ts:10,17,64,101` | Narrates the run as ending "into public portfolios employers browse". |

### 3.8 Tests

`src/app/api/students/me/portfolio/__tests__/route.test.ts` deletes with its route. The engagement,
peer-review, lecturer-review, and mentor test suites survive the deletion pass but will be rewritten
with their subjects (§4).

---

## 4. REWRITE — right concept, wrong foundation

These are **not** old-vision artefacts to delete; they are load-bearing pieces built on assumptions
the new mission replaces. They stay in the tree through the deletion pass and are redesigned in the
foundation.

| Item | What has to change |
|---|---|
| `ProjectEngagement.model.ts` | Has no `unitId`, no `semester`, no parent project, no milestones, no team. Today one engagement = one disposable project. It must become **one evolving system** with per-semester, per-unit increments. This is the single biggest model change. |
| `openaiService.generateAIBrief()` | Prompts on `(tier, industry)`. Must prompt on `(unit syllabus, student interest, prior state of their project)`. The `TIER_COMPLEXITY_MAP` "simple CRUD app" ↔ BEGINNER mapping is exactly the toy-assignment output the directive rejects. |
| `BriefContextLibrary.model.ts` + `scripts/demo/content/briefs.ts` | **Good news**: already 8 domains — agriculture, health, SME finance, secondary education, transport, water, tourism, waste. Agriculture is *already* one of many, so §"Agriculture is no longer the default" is nearly satisfied. Rewrite is scope-narrowing (`targetTiers` → academic level) plus adding government/energy/retail/logistics/manufacturing. |
| `LecturerReview.model.ts` + `/api/lecturer/reviews` + `ReviewScoreForm.tsx` | A single terminal verdict scored on 4 prose dimensions. Must become **repeatable milestone approval**: architecture review, documentation review, code review, scheduled demonstration, approve/reject-with-direction — with a demo weighted above the written report. |
| `LecturerEffectiveness.model.ts` | Measures verdict-issuing volume. Recast around mentorship, or drop. |
| `PeerReview.model.ts` + `/api/peer-reviews` + `/dashboard/student/peer-review` | Peer review exists today as a *lecturer-queue filter*. Under "industry-style learning" (code reviews are explicitly listed), it has a genuine home — but as **code review practice**, not as a gate that unlocks a credential. Needs a decision (§6.4). |
| `MentorSession.model.ts` + `/api/mentor/chat` + `MentorChat.tsx` | Survives, but must be grounded in the student's current unit and project state rather than a generic mentor. |
| `VerificationAuditLog.model.ts` + SHA-256 document hashing | Built so an employer could independently verify a credential. With no employer, tamper-evidence still serves academic integrity — but at a much lower priority. Needs a decision (§6.5). |
| `DocumentsTab.tsx`, `BlockersTab.tsx`, `AIUsageTab.tsx`, `ProjectStatusStepper.tsx` | The artefacts are right (documentation and honest AI disclosure are engineering practice); the fixed three-document, one-shot lifecycle they render is wrong. |
| `ProjectStatus` enum | Models a one-way pipeline to `VERIFIED`, with `REVISION_REQUIRED` as a dead end. Must model a cycle. |
| `src/lib/validation/educationSchema.ts` (+ tests) | Validates the current shapes; rewritten with them. |
| `src/components/website/topics/TopicEducation.tsx` | Publicly documents the retired process in detail, including "the employer-facing side is not built". Website is out of scope for the design reset — but it cannot keep publishing a mission we have abandoned. Needs a decision (§6.2). |

---

## 5. KEEP — unaffected, or newly load-bearing

| Item | Note |
|---|---|
| `Role.INSTITUTION` + `Institution.model.ts` + `/dashboard/institution` | **Newly central.** The role comment already reads: "the Education Hub's academic-context integration: it supplies what a student is actually studying so project recommendations can be grounded in their coursework rather than guessed." That is the new vision, already written down. It is the anchor to build institution integration on. |
| `User.studentData`: `institutionalEmail(+Verified/Pin)`, `academicRegistrationNumber`, `programme`, `graduationYear`, `institutionId` | The beginnings of an academic record. `programme` becomes the CS/IT scope gate. |
| `User.lecturerData` + `/api/admin/verify-lecturer` + `/dashboard/admin/lecturer-verification` | Lecturer credentialing stays — a mentor must still be a real, verified academic. |
| `/api/onboarding/institutional-email/verify` | Institution binding. Keep. |
| Notification infrastructure, `notify()`, in-app inbox | Keep (minus `PORTFOLIO_VIEW`). |
| Everything outside the Education Hub | Marketplace, escrow, payments, trust scoring, farmer/buyer/supplier/group/price/knowledge, auth. **Untouched.** |

---

## 6. Decisions I need before deleting

### 6.1 `CLAUDE.md` and the approved Foundation both forbid this work
`CLAUDE.md` lists **"education workflows"**, **"DB schema"**, and **"API contracts"** under
*DO NOT TOUCH PLATFORM LOGIC*, and `webapp-reset/UMOJAHUB_WEBAPP_FOUNDATION_V1.md` is an
**APPROVED (2026-06-16)** constitution that defines the student persona in employer terms and says
amendments go through the gates, never silently. This directive overrides both, but I will not edit
an approved gate document on my own authority. **Confirm**: I amend `CLAUDE.md` and file a dated
amendment to the Foundation as part of this work.

### 6.2 The public website
`src/components/website/topics/TopicEducation.tsx` is live, shipped, and declared out of scope — but
it is the most detailed public statement of the retired vision. Options: (a) delete the education
topic from the website until the new hub exists, (b) rewrite it to the new mission, (c) leave it and
accept the contradiction until the rebuild ships. My recommendation: **(a)** — no public claim is
better than a false one.

### 6.3 CS/IT scope enforcement
Scope is now CS and IT only. Nothing in the code gates on `programme`. Should the new foundation
specify a **hard gate** (non-CS/IT students cannot create projects) or a **soft scope** (the hub only
knows how to generate CS/IT work, and everything else is simply unsupported)? Recommendation: soft
now, hard once institution integration supplies a trustworthy programme value.

### 6.4 Peer review — keep, recast, or cut?
Justifiable under "industry-style learning: code reviews". Not mentioned anywhere in the directive.
Recommendation: **recast as code review** between students on the same unit, removing its role as a
credential gate.

### 6.5 Document hashing / tamper-evidence — keep or cut?
It was built for employer-verifiable credentials. Recommendation: **cut the audit-log and hashing
machinery** in the rebuild — it is meaningful cost with no remaining consumer — unless you want it
retained for university academic-integrity reasons, which is a real argument.

### 6.6 Branch hygiene
This work would land on `fix/session-lifecycle-and-buyer-archetype`, which currently carries an
**unrelated, uncommitted in-flight change** (staged deletion of the NGO and Employer roles, plus
modified `middleware.ts`, `types/index.ts`, `dashboards.ts`, `Header.tsx`). Recommendation: commit
that work first, then branch `refactor/education-hub-vision-reset` for this. Related: the NGO/Employer
removal already deleted the employer *talent search*, so part of the recruitment surface is going
regardless — but `User.ngoData` / `User.employerData` remain in the User model and should be swept
in that commit, not this one.

---

## 7. Sequence after approval

1. **Deletion pass** — §3 only, in dependency order (routes/pages → nav/copy → types/enums → models →
   demo/seed → docs/README). Gate green (`type-check`, `lint`, `test`, `build`) before commit.
2. **Foundation** — `webapp-reset/EDUCATION_HUB_FOUNDATION_V2.md`: product vision, core principles,
   student lifecycle, lecturer lifecycle, institution integration strategy, academic data model,
   project recommendation philosophy, project evolution model, team workflow, assessment workflow,
   demonstration workflow, technical architecture, expansion roadmap — each decision justified.
3. **No implementation** in this task.
