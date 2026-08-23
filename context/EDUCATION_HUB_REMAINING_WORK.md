# Education Hub — remaining work

Execution plan derived from `context/UMOJAHUB_CURRENT_STATE_AUDIT.md` (2026-08-23).
Education Hub completion at time of writing: **74%** against the implemented workflow,
**≈40%** against the full ambition of `webapp-reset/EDUCATION_HUB_FOUNDATION_V2.md`.

Priority: **P0** blocks the core workflow or the presentation · **P1** needed for a complete
product workflow · **P2** quality · **P3** future / gated design work.

Hub isolation: **do not start this plan until the Food Hub P0/P1 work is complete, verified and
frozen.**

---

## Execution record — 2026-08-23

Food Hub P0/P1 was completed, verified and frozen first. Every P0 and P1 item below that was mine
to decide is **done and verified by running it**. Two remain open, both deliberately.

| ID | | Verified how |
|---|---|---|
| **E-P0-1** | ☑ done | A student with an empty project list started an `AI_BRIEF` project and received a complete brief — anchored to their real units, set in a Kisumu community-health NGO, with an offline-sync consistency problem that makes Distributed Systems load-bearing. `OPEN_SOURCE` also generates again. |
| **E-P0-2** | ☑ done | The mentor answered an architecture question about the student's own project |
| **E-P1-3** | ☑ done | Brief Contexts renders all eight domains with **zero** console and page errors, at both viewports |
| **E-P1-4** | ☐ open | **Deliberately not built — see below.** |
| **E-P2-1** | ☐ open | Retiring three enum members is a migration; not started while E-P1-4 stands open |
| **E-P2-2** | ☐ open | Needs a one-line confirmation of the intended emphasis |

### How E-P0-1 was actually fixed

Two causes, not one, and the second only became visible once the first was out of the way.

1. **The provider.** `openaiService.ts` called OpenAI's `gpt-4o-mini` hard-coded, and that
   account's credit balance was exhausted. The transport is the OpenAI chat-completions shape,
   which Groq implements verbatim — and this deployment's Groq key works. Endpoint, model and
   credential are now configuration (`BRIEF_API_URL`, `BRIEF_MODEL`, `BRIEF_API_KEY_VAR`), all
   optional, defaulting to the provider the deployment can actually reach. Moving briefs back to
   OpenAI is three environment variables.
2. **The token budget.** With the provider reachable, generation still failed —
   `"Brief generation returned incomplete data"`. `max_tokens: 1000` is too small for a brief of
   eleven fields, four of them arrays of five to seven sentences, and far too small on a reasoning
   model, whose internal trace is charged against the same budget. Measured against the real
   prompt: at 1,000 the response came back with **no content at all**; at 3,000 every one of the
   eleven keys was present. Raised to 3,000.

The second cause is worth recording as a class: the schema check reported *"incomplete data"*
about a model that had simply been cut off mid-thought. The error named the symptom accurately
and the cause not at all.

**What deliberately did not change.** Generation still throws when it fails. The removed
generic-paragraph fallback stayed removed: a brief that claims an academic link it does not have
is worse than no brief.

The file is now `src/lib/integrations/briefService.ts`. It was renamed because a module called
`openaiService` that calls Groq is the same defect class this audit kept finding — a name or a
comment describing something the code does not do.

### Why E-P1-4 was not built

A curriculum-publishing surface is a **new Education Hub screen**, and Foundation V2 §19 requires
IA → Lo-fi → Mid-fi → Hi-fi → Prototype → Design System → Implementation Plan → Code, stopping at
every gate. Building it here would have skipped all of them. The constitution already answers the
question the task said was open — §8.3 says *"Institution admin … a department publishes its
programme structure once"* — so the actor is not in doubt; the **gates** are what is outstanding.
It stays open, and it stays P1, because until it exists every real institution is stuck at T0.

---

## E-P0-1 · Two of the three ways to start a project return 503

**Why it matters.** This is the entry point of the entire hub. Verified live:

```
POST /api/education/engagements {"track":"AI_BRIEF"}          → 503 AI_SERVICE_ERROR
POST /api/education/engagements {"track":"OPEN_SOURCE"}       → 503 AI_SERVICE_ERROR
POST /api/education/engagements {"track":"LECTURER_ASSIGNED"} → 200
```

A student whose lecturer has not published a project cannot begin at all. The seeded world hides
this completely — every student in the demo already has a project — which is exactly the
"works with seeded data, fails for a real user" case the audit brief names.

**Current state.** `OPENAI_API_KEY` is valid but the account returns
`429 credit_balance_exhausted — "You have no credits remaining."` for `gpt-4o-mini`.
`src/lib/integrations/openaiService.ts` correctly refuses to fabricate a brief and throws
`AppError('Brief generation is temporarily unavailable.', 503, 'AI_SERVICE_ERROR')`. **That
refusal is right and must not be softened into a generic brief** — the comment at `openaiService.ts:258`
records that a generic-paragraph fallback was deliberately removed, and reinstating it would put a
brief in front of a student that claims an academic link it does not have.

**Expected outcome.** A student can start a project again. Three routes to that, in order of
preference:

1. **Restore provider access** — add credits, or switch brief generation to a provider that works.
   Groq's account offers `openai/gpt-oss-120b` and `qwen/qwen3.6-27b` at 131k context, and the
   service already speaks the OpenAI-compatible chat-completions shape, so the transport is
   identical. **Make the provider and model configurable** so the next deprecation is a config
   change.
2. **A curated brief library as the fallback** — Foundation V2 §18 open question 5 anticipates
   exactly this: *"If a model cannot produce briefs that clear the bar without human curation, the
   answer may be a curated library with generated variation rather than free generation."* A
   curated brief selected against the student's knowledge areas is honest, passes the load-bearing
   test by construction, and removes a hard external dependency from the hub's entry point. This
   is a design decision, not a patch — raise it rather than assume it.
3. **At minimum, an honest screen.** Today the student sees a 503 with no explanation of what to do
   next. If generation is genuinely unavailable, the page should say so and point at the lecturer-set
   projects that *are* available.

**Files likely affected**
- `src/lib/integrations/openaiService.ts` (model/provider constant, transport)
- `src/app/api/education/engagements/route.ts` (only if a fallback path is chosen)
- `src/app/dashboard/student/projects/new/page.tsx` (the failure message)
- `src/lib/env.ts`, `.env.local.example`, `CLAUDE.md` if variables are added

**Database implications.** None for options 1 and 3. Option 2 extends `BriefContextLibrary` or
adds a curated-brief store — a schema decision that must go through the owner.

**API implications.** The contract is unchanged. `aiBriefSchema` / `openSourceBriefSchema`
validation and the `academicAnchor` contract must survive untouched — 40/40 briefs in the world
currently validate against it and `demo:validate` checks that.

**UI implications.** The new-project page must explain a generation failure in a sentence and
offer the working alternative, rather than surfacing a bare 503.

**Testing requirements.** Existing brief unit tests must keep passing. Add a test for the failure
path's user-facing message. Add the provider to the live smoke script (S-P2-2 in the Food Hub plan).

**Dependencies.** Owner decision if option 2 is taken. Option 1 may need account action.

**Acceptance criteria.** A student with a recorded enrolment and no active project starts an
`AI_BRIEF` project and receives a brief carrying a correct `academicAnchor` for their units — with
no seeded data involved. If generation is unavailable, the screen says so and offers a route
forward.

- [x] Establish which of the three routes the owner wants
- [x] Make the brief provider and model configurable
- [x] Verify the chosen provider live before committing
- [x] Confirm generated briefs still pass `aiBriefSchema` and carry `academicAnchor`
- [x] Confirm the load-bearing quality of a generated brief by reading one
- [x] Make the failure screen honest and actionable
- [x] Do **not** reinstate a generic fallback brief
- [x] Test as a real student, end to end, from an empty project list
- [x] Run the regression gate

**Status:** ☑ **done and verified live** — a student with an empty project list started an `AI_BRIEF` project and received a complete brief anchored to their real units, set in a Kisumu community-health NGO, with an offline-sync consistency problem that makes Distributed Systems load-bearing. `OPEN_SOURCE` generates again too. Route 1 was taken (provider made configurable, defaulting to one that works); no fallback brief was reinstated. See the execution record above for the second cause — the token budget.

---

## E-P0-2 · The AI Mentor answers nothing

**Why it matters.** The mentor is on the student's navigation and in the presentation script. It
returns the same canned sentence to every message.

**Current state.** `src/app/api/mentor/chat/route.ts:15` pins
`GROQ_MODEL = 'llama-3.3-70b-versatile'` — the same decommissioned model as
`src/lib/integrations/groqService.ts:20`. Live: `404 model_not_found`. Verified through the real
route with a valid `engagementId`: *"I'm having trouble connecting right now. Please try again in
a moment."*

Everything around it is sound and must be preserved: session persistence, ownership scoping, the
10-per-10-minutes rate limit, `EDUCATION_PLATFORM_KNOWLEDGE` in the system prompt, and the
engagement context that now correctly survives through `READY_FOR_DEMONSTRATION` and
`DEMONSTRATION_SCHEDULED`.

**Expected outcome.** The mentor answers again, with the same project context it already builds.
The model constant lives in one place, not two.

**Files likely affected**
- `src/app/api/mentor/chat/route.ts`
- `src/lib/integrations/groqService.ts` (same fix — see F-P0-2)

**Database implications.** None. **API implications.** None to the contract.
**UI implications.** None.

**Testing requirements.** Existing mocked tests keep passing. Live smoke check via S-P2-2.

**Dependencies.** Executes as one change with F-P0-2. Because it touches a Food Hub file, do it
**during Phase A** (Food Hub) rather than duplicating the edit here — noted in both plans so
neither loses it.

**Acceptance criteria.** A student asks the mentor an architecture question about their own
project and receives a substantive answer that references the project. The rate limit still holds.

- [x] Single source of truth for the Groq model, configurable
- [x] Confirm the engagement context still reaches the prompt on the new model
- [x] Confirm the rate limit and session persistence are unaffected
- [x] Ask a real question through `/dashboard/student/mentor` and read the answer
- [x] Run the regression gate

**Status:** ☑ **done and verified live** — the mentor answered an architecture question about the student’s own project. Model constant now lives once, in `src/lib/ai/groq.ts`.

---

## E-P1-3 · `/dashboard/admin/brief-contexts` throws on load

**Why it matters.** It is the only administrative surface governing what every generated brief is
grounded in, and it has been completely broken for as long as `targetTiers` has been absent from
the model. The page renders nothing.

**Current state.** Browser page error at both viewports:

```
TypeError: Cannot read properties of undefined (reading 'map')
```

`src/app/dashboard/admin/brief-contexts/page.tsx:252` renders `ctx.targetTiers.map(...)`.
`src/lib/models/BriefContextLibrary.model.ts` has no `targetTiers` field — it was removed with
`StudentTier`. The page's local `IContextEntry` interface (`:14`), its `PLACEHOLDER_JSON` (`:50`)
and its publishing instructions (`:209`) all still describe the retired field, so an administrator
following the on-screen instructions would publish a library shaped for a vision that no longer
exists. These four lines are the **only** surviving references to `targetTiers` in the codebase.

**Expected outcome.** The page loads and lists the library's contexts. The retired field is gone
from the interface, the placeholder and the instructions. Foundation V2 §9.4 says contexts should
be re-keyed *to knowledge areas and academic level* — if that re-keying is wanted, it is a separate,
larger task; this one just stops the page lying and crashing.

**Files likely affected** `src/app/dashboard/admin/brief-contexts/page.tsx` only.

**Database implications.** None. The 1 library document in the world is already correctly shaped.

**API implications.** None. `GET`/`PUT /api/admin/brief-contexts` are correct;
`briefContextLibraryUpdateSchema` does not mention `targetTiers`.

**UI implications.** Remove the tier pills. Correct the placeholder JSON to the fields the schema
actually requires (`id`, `industryName`, `description`, `clientPersonaTemplate`, `problemDomains`,
`kenyanConstraints`, `exampleProjects`). Correct the instruction sentence to match.

**Testing requirements.** Load the page as an admin in a browser — the gate that was missing.
Consider adding it to the E2E smoke landing set so an admin screen that throws fails a run.

**Dependencies.** None. Smallest, highest-certainty fix in this plan.

**Acceptance criteria.** An administrator opens Brief Contexts, sees version 1 and its contexts
listed with zero console and zero page errors, and the publish form's instructions match the
schema the route will actually accept.

- [x] Remove `targetTiers` from the interface, the render and the placeholder
- [x] Correct the publishing instructions to the real required fields
- [x] Verify the page loads clean at 1280×900 and 390×844
- [x] Verify publishing a valid library still works
- [ ] Add the page to the E2E smoke set so this class of defect fails a run
- [x] Run the regression gate

**Status:** ☑ **done** — the page renders all eight domains with zero console and zero page errors at both viewports, and the publish instructions now name the fields the route actually requires. One follow-up left open above: the page is still not in the E2E smoke set, so an admin screen that throws would not fail a run.

---

## E-P1-4 · Published curriculum (T1) has no writer

**Why it matters.** Foundation V2 §8.3 calls T1 *"the realistic target for most institutions and
the best effort-to-value ratio on the ladder."* The read side is fully built and working — the
seeded world has 4 programmes and 160 mapped units, students pick their semester rather than
typing units, and their enrolment carries verified provenance that the UI displays. But
`AcademicProgramme` and `CurriculumUnit` are written **only by `scripts/demo/phases/foundation.ts`**.
There is no route, no admin screen and no institution screen.

In production, no institution could ever reach T1. Every real student would be T0 self-declared
forever, and the whole provenance distinction the hub carefully displays would only ever have one
value.

**Current state.** Read path complete: `GET /api/education/programmes` resolves programmes and
units for an institution; `academicContext.ts:190-213` resolves a student's enrolment against them
and records `INSTITUTION_CURRICULUM` provenance. Write path: absent.

**Expected outcome.** A person can publish a programme and its units for their institution, and a
student at that institution then picks their semester instead of typing unit names.

**Open question — who publishes?** Foundation V2 §8.3 says *"Institution admin … a department
publishes its programme structure once."* The `INSTITUTION` role exists, is seeded, and has a
working (read-only) dashboard, which makes it the natural home. A platform `ADMIN` route would be
faster to build and would let UmojaHub onboard an institution on its behalf. **Raise this with the
owner rather than choosing silently** — it decides whose screen this is.

**Files likely affected**
- `src/app/api/education/programmes/route.ts` (add `POST`) or a new institution-scoped route —
  **search first**
- `src/lib/validation/academicSchema.ts` (a create schema)
- `src/app/dashboard/institution/page.tsx` or a new sub-page
- possibly `src/app/dashboard/admin/` if the admin route is chosen

**Database implications.** No schema change — both models exist with their indexes. Writes must be
scoped to the actor's own `institutionId`, and every unit must map onto at least one
`KnowledgeArea` (the model already validates this).

**API implications.** New `POST`. Must follow the house order:
`connectDB → getServerSession → requireRole → Zod safeParse → DB`. Institution scoping on every
write — an institution must not be able to publish a programme for another.

**UI implications.** A form or a bulk paste. 160 units for 4 programmes suggests bulk entry is the
realistic shape; the Brief Contexts screen's JSON-paste pattern is a precedent that already exists
in the codebase.

**Testing requirements.** Unit tests for the schema and for cross-institution refusal. An E2E test
that publishes a programme and then confirms a student at that institution can select it and gets
`INSTITUTION_CURRICULUM` provenance.

**Dependencies.** Owner decision on the actor.

**Acceptance criteria.** Starting from a database with no programmes, someone publishes one
through the UI; a student at that institution selects their semester rather than typing units;
their enrolment records `INSTITUTION_CURRICULUM`; the screen says the institution published it;
and an actor from another institution is refused.

- [ ] Decide the actor with the owner (INSTITUTION vs ADMIN)
- [ ] Search for any existing partial implementation before building
- [ ] Zod create schema, knowledge-area mapping required per unit
- [ ] `POST` route with institution scoping on the write
- [ ] Publishing screen
- [ ] Verify a student then reaches T1 and the provenance label changes
- [ ] Test cross-institution refusal
- [ ] Run the regression gate including `test:e2e:education`

**Status:** ☐ **open — deliberately not built.** A curriculum-publishing surface is a new Education Hub screen, and Foundation V2 §19 requires IA → Lo-fi → Mid-fi → Hi-fi → Prototype → Design System → Implementation Plan → Code, stopping at every gate. Building it inside a defect-fix pass would have skipped all of them. The constitution already answers the actor question (§8.3: *"Institution admin … a department publishes its programme structure once"*), so what is outstanding is the **gates**, not the decision. Stays P1: until it exists, every real institution is stuck at self-declared T0.

---

## E-P2-1 · Retire three `ProjectStatus` members nothing writes

**Why it matters.** `SUBMITTED`, `UNDER_PEER_REVIEW` and `DENIED` remain in the enum and are
written by no route. They were retired by the report-review rebuild. Leaving them means the enum
describes a state machine that no longer exists, and the seeder had to be taught not to produce
them (defect D6 in the final validation).

**Current state.** Present in `ProjectStatus`; the final validation recorded them as a deliberate
deferral: *"kept only because records may carry them … a migration, not a validation-pass edit."*

**Expected outcome.** A migration confirms no live record carries them, then they are removed.

**Files likely affected** `src/types/index.ts`, plus anything switching exhaustively over
`ProjectStatus` (the compiler will find these).

**Database implications.** A read-only check first: count documents in each retired state. If any
exist, decide where they map before removing anything.

**API implications.** None expected. **UI implications.** Any status label map loses three entries.

**Testing requirements.** Type-check is the main gate — exhaustive `Record<ProjectStatus, …>` maps
will fail to compile if anything is missed. Confirm `demo:validate` still passes.

**Dependencies.** Do after E-P0-1 and E-P1-3.

**Acceptance criteria.** Zero documents in any retired state; the enum holds only reachable states;
every exhaustive map compiles; `demo:validate` still passes 73/73.

- [ ] Count live documents in each retired state
- [ ] Map or migrate any that exist
- [ ] Remove the three members
- [ ] Let the compiler find every exhaustive map
- [ ] Run the regression gate including `demo:validate`

**Status:** ☐ open — a migration, not an edit. P2.

---

## E-P2-2 · The seeded demonstration mix contradicts the vision's emphasis

**Why it matters.** The workflow this hub is built around centres on the student **meeting the
lecturer and showing the running system**. The seeded world is 29/35 slots and 23/26 demonstrations
`VIDEO_CALL` with Jitsi links — so the screens a panel is shown mostly depict a video call, not the
physical demonstration the product is about.

Foundation V2 §15 does say *"remote by default"* on bandwidth grounds, so this is a genuine
tension, not a plain error. But the audit brief describes the core workflow as *"Student meets
lecturer physically → Student demonstrates the actual project"*, and the demo world should show
the product's centre of gravity.

**Current state.** `DemonstrationFormat` supports both; `DemonstrationSlot.model.ts:39` defaults to
`VIDEO_CALL`; the seeder weights toward it heavily.

**Expected outcome.** The seeded mix leans toward `IN_PERSON` with `VIDEO_CALL` as the documented
accommodation, so the demonstration screens show the workflow the product is built around.

**Files likely affected** `scripts/demo/phases/demonstrations.ts`.

**Database implications.** None — seed weighting only.
**API implications.** None. **UI implications.** None.

**Testing requirements.** `npm run demo:validate` must still pass 73/73. Consider a check asserting
both formats appear.

**Dependencies.** Confirm the intended default with the owner — one sentence, not a design cycle.

**Acceptance criteria.** The seeded world shows a majority of in-person demonstrations with video
calls present as the accommodation, and the lecturer's demonstrations screen reads accordingly.

- [ ] Confirm the intended emphasis with the owner
- [ ] Adjust the seeder weighting
- [ ] Ensure an `IN_PERSON` demonstration carries a plausible physical location, not a Jitsi URL
- [ ] Add a validation check that both formats appear
- [ ] `npm run demo` and confirm 73/73

**Status:** ☐ open — needs a one-line confirmation of the intended emphasis.

---

## E-P3 · Foundation V2 scope not yet built

**These are not defects.** They are gated design work under
`webapp-reset/EDUCATION_HUB_FOUNDATION_V2.md` §19, which requires
IA → Lo-fi → Mid-fi → Hi-fi → Prototype → Design System → Implementation Plan → Code, stopping at
every gate. **No code should be written for any of these without walking those gates.** Listed so
the distance is visible.

| Foundation V2 | Stage | Status |
|---|---|---|
| `SystemProject` / `ProjectIncrement`, the continuity rule (§10), fork/retire/pivot (§10.3) | 2 | Not built. **This is §P2, the strongest claim in the vision** — one system grown across the degree rather than ten unrelated projects. Its absence is the largest gap between the built hub and the stated vision. |
| Six-milestone state machine (§14.1) — requirements → architecture → implementation → testing → deployment → demonstration | 3 | Not built. Assessment today is one report plus one demonstration. `CHANGES_REQUESTED`-as-a-cycle (§P7) **is** built and verified. |
| Six engineering assessment dimensions (§14.2) | 3 | Partial — four prose dimensions plus the demonstration outcome. "Application of the unit" and "engineering practice" are not separately assessed. |
| Teams per increment, attribution, peer code review of a repository (§13) | 5 | Not built. Peer review exists but reads a PDF, not code. |
| T2 lecturer attestation · T3 feed adapters · the `AcademicSource` interface (§16.3) | 6 | Not built. |
| Institutional insight — aggregate, own-students-only (§17 Stage 7) | 7 | Not built. The institution surface is a member roster. |
| A custom in-app PDF viewer with page index, zoom and search | — | Deliberately deferred; the browser's viewer is adequate and honestly described. |
| GitHub repository verification | — | Deliberately **not** built. The demonstration establishes the same thing better and the platform fabricates no commit evidence. Do not reintroduce. |
| Past-project context for the AI mentor | — | Deliberately out of scope. |

**Also stale and worth correcting when convenient (P3):**
`EDUCATION_HUB_FOUNDATION_V2.md` §7.3 says *"None of §7 is built"* — the academic layer now is.
§16.3's `AcademicSource` interface is still accurate as unbuilt.

---

## Regression gate for every task above

```
npm run type-check && npm run lint && npm run test && npm run build
npm run test:e2e:education
npm run test:e2e:rehearsal          # the strongest gate — real storage, real database
npm run demo:validate
```

Plus a browser pass of the student and lecturer surfaces at 1280×900 and 390×844.
`test:e2e:rehearsal` is the one that matters: it drove three report versions, two revision cycles
and two demonstrations through the real stack and passed during this audit.

**Before any presentation:** `npm run demo` — the audit left a project on
`wairimu.karanja@gmail.com` that the seeder did not create.
