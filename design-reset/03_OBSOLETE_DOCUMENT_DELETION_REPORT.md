# 03 — Obsolete Document Deletion Report

**Status:** Deletion plan for design/UX **documents** that encode abandoned visual, experience, motion, or Figma directions.
**Policy:** Delete, do not archive. No legacy folders. The `context/archive/` folder is itself deleted (a museum is exactly what the reset forbids).
**Rule applied:** Delete a document **iff** it encodes a now-abandoned *visual / experience / motion / IA-for-visual / Figma / design-system* direction. **Keep** documents that describe *product truth, domain reality, or non-visual strategy* — these are the evidence base the new foundation cites.

---

## 1. DELETE — obsolete design-direction documents

### Repo root
| File | What it is | Why deleted |
|---|---|---|
| `UI_UX_STRATEGY.md` | The "authoritative" V3 design strategy | The direction being reset |
| `REDESIGN_BOUNDARY_AUDIT.md` | Audit scoping a prior redesign | Superseded by this reset's audit (report 01) |
| `ROLE_VISUAL_IDENTITY_SYSTEM.md` | Per-role visual identity system | Abandoned visual direction |
| `STORYWORLD_V2_EXPERIENCE_ARCHITECTURE.md` | "The Commons" StoryWorld V2 | StoryWorld is cut |
| `UMOJAHUB_STORYWORLD_EXPERIENCE_ARCHITECTURE.md` | StoryWorld experience architecture | StoryWorld is cut |
| `PEOPLE_ECOSYSTEM_EXPERIENCE_ARCHITECTURE.md` | Experience architecture for a prior direction | Abandoned experience direction |
| `FIGMA_IMPLEMENTATION_MAP.md` | Figma node → code mapping for old visuals | Abandoned Figma direction |

### `context/`
| File | What it is | Why deleted |
|---|---|---|
| `FRONTEND.md` | Website design system (Söhne/type/color) | Deprecated per CLAUDE.md's own note; abandoned |
| `WEBSITE_IA_V3.md` | Website IA bound to a visual direction | Reset |
| `APPLICATION_DESIGN_SYSTEM.md` | App-shell design system v1.1 | Abandoned design system |
| `APPLICATION_EXPERIENCE_ARCHITECTURE.md` | App-shell experience architecture | Abandoned experience direction |
| `APPLICATION_FIGMA_BLUEPRINT.md` | App-shell Figma blueprint | Abandoned Figma direction |
| `APPLICATION_ONBOARDING_ARCHITECTURE.md` | Onboarding *design* architecture | Visual/flow direction reset (logic untouched) |
| `APPLICATION_SCREEN_INVENTORY.md` | Screen inventory for old direction | Reset |
| `STORYTELLING_FRAMEWORK.md` | Narrative/visual storytelling framework | Tied to StoryWorld/website direction |
| `FIGMA_WORK_PLAN.md` | Figma production plan | Abandoned Figma direction |
| `WEBSITE_DELETION_AUDIT.md` | A *prior* website deletion audit | Superseded by reports 02–04 |
| `ASSET_INVENTORY.md` | Visual assets for abandoned directions | Assets reset |
| `DIAGRAM_INVENTORY.md` | Diagram inventory for abandoned directions | Reset |

### `context/archive/` — DELETE THE ENTIRE FOLDER
`WEBSITE_INFORMATION_ARCHITECTURE.md`, `SPRINT_1_GAP_ANALYSIS.md`, `SPRINT_2_UNDERSTANDING_FIRST_PLAN.md`, `TRANSPARENCY_CONTENT_ARCHITECTURE.md`, `USER_JOURNEY_LIBRARY.md`, `STATUS_QUO_ANALYSIS.md`, `IA_GAP_REPORT.md`, `WEBSITE_EXPERIENCE_ARCHITECTURE_V2.md` — all are explicitly archived, superseded V1/V2 material. The directive forbids museums; the archive is deleted wholesale.

---

## 2. KEEP — product truth & domain evidence (NOT design direction)

These survive because they describe what the platform *is*, not how it should *look*. The foundation cites them.

| File | Why kept |
|---|---|
| `UMOJAHUB_PLATFORM_CAPABILITIES_REFERENCE.md` | Source-cited account of every real capability — primary foundation input |
| `context/FOOD_HUB_ECOSYSTEM_MAP.md` | Who the food-hub users are, incentives, failure modes |
| `context/EDUCATION_HUB_ECOSYSTEM_MAP.md` | Who the education-hub users are |
| `context/PRODUCTION_ROADMAP.md` | Operational/launch reality (constraints) |
| `context/RUNBOOK.md` | Operations |
| `context/DECISION_RECORD_03-08-C.md` | Backend/domain decision record |
| `context/CORRECTIVE_ACTIONS_CHECKLIST.md` | Program history (complete) |
| `IMPLEMENTATION_PLAN.md` | Gitignored internal plan; project context |
| `CLAUDE.md`, `CONTRIBUTING.md`, `README.md` | Project instructions/meta (CLAUDE.md's design section is *updated*, not deleted — see report/foundation) |

---

## 3. FLAGGED — non-visual strategy (default KEEP, user may veto)

These contain enduring purpose/audience/boundary and explicitly state "no design, no UI, no visual system." They are valuable foundation input. **Default: keep.** If the user wants a truly bare slate, they can be deleted too — flagged here for an explicit call.

| File | Nature | Recommendation |
|---|---|---|
| `context/WEBSITE_PURPOSE_V1.md` | Why the website exists; audiences; trust thesis | **Keep** — foundation cites it |
| `context/WEBSITE_WEBAPP_BOUNDARY.md` | Architectural law: website vs app shell | **Keep** — still true post-reset |
| `context/WEBSITE_ENFORCEMENT_RULES.md` | "Does this require a session?" content test | **Keep** — enduring principle |
| `context/APPLICATION_USER_JOURNEYS.md` | Authenticated-app journeys, reconciled to live API | **Keep** — describes the working product |

---

## 4. Net effect

- ~20 obsolete design documents removed; one `archive/` folder removed.
- The contradictory "five authoritative documents" problem collapses to a single future source of truth (`UMOJAHUB_DESIGN_FOUNDATION_V1.md`) plus a small set of cited, durable product-truth documents.
- No product-truth or domain knowledge is lost.
