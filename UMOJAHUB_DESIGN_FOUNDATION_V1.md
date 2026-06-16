# UMOJAHUB_DESIGN_FOUNDATION_V1

**Status: APPROVED — 2026-06-16.**
This is the single source of truth that replaces every prior, contradictory "authoritative" design document. With approval, the build phase (§16) is unlocked: all new UI/UX work — screens, components, visual systems, style documents — must conform to this foundation and trace to its evidence. Changes to it are made by amendment, not by spawning a competing "authoritative" doc.

**Evidence base:** `design-reset/01`–`15` (audit + sourced research) and the surviving product-truth docs (`UMOJAHUB_PLATFORM_CAPABILITIES_REFERENCE.md`, `context/FOOD_HUB_ECOSYSTEM_MAP.md`, `context/EDUCATION_HUB_ECOSYSTEM_MAP.md`, `context/APPLICATION_USER_JOURNEYS.md`, `context/WEBSITE_PURPOSE_V1.md`). Every decision below cites evidence; none is preference.

**Scope:** UI/UX only. Backend, data model, business logic, auth/RBAC, payments, and integrations are out of scope and unchanged.

---

## 0. Why this document exists

UmojaHub's engineering is strong; its UI/UX layer churned through five+ resets, leaving three palettes, two font systems, and several competing "authoritative" documents (`design-reset/01`). The cause was **aesthetic-first, evidence-never** decision-making and **resetting instead of converging** (`design-reset/15 §3`). This document is the convergence point. After it, decisions are traceable to evidence, and there is one source of truth.

---

## 1. Who are the users?

From the ecosystem maps and capabilities reference:

- **Smallholder Kenyan farmers** — 0.5–5 acres, often no formal business registration, frequently on **low-end Android over 2G/3G**, paying **per megabyte**, sometimes outdoors in bright sun, varied literacy and English-as-second-language. *Primary, most-constrained user.*
- **Buyers** — purchasing produce from farmers they have **no prior relationship with**; arrive skeptical of quality and legitimacy.
- **CS students** — building **verifiable** portfolio/project evidence; institutions may lack global brand recognition, so verifiability is the value.
- **Lecturers** — reviewing/scoring student work; time-constrained.
- **Admins** — verification, mediation, payouts, oversight.

**The unifying truth:** every audience "arrives in an environment where trust cannot be assumed" (`WEBSITE_PURPOSE_V1`). Stripe/GitHub users arrive already trusting the medium; UmojaHub's do not.

## 2. How do they think?

(`design-reset/05, 14`)
- **Skeptical first.** Credibility must be *shown*, not asserted. Surface cues carry trust (Stanford Web Credibility).
- **Cost-aware.** Data is money; a heavy page is a financial and emotional barrier.
- **Pattern-transfer.** They reason from apps they already trust — **M-Pesa, WhatsApp, mobile banking** (Jakob's Law). Novel metaphors cost them.
- **Limited cognitive surplus** for learning software while doing real, money-bearing work (Hick's/Miller's Laws).

## 3. What are they trying to accomplish?

| User | Core job | First-value moment |
|---|---|---|
| Farmer | Sell produce and **get paid** | First listing live |
| Buyer | Find a **verified** supplier and transact safely | First verified supplier found |
| Student | Build a **verified** project/portfolio item | First project created |
| Lecturer | Review and score efficiently | First review submitted |
| Admin | Verify, mediate, pay out with confidence | Queue cleared |

Design serves these jobs. Everything else is secondary.

---

## 4. What should UmojaHub *feel* like?

Three words, in priority order: **Trustworthy. Clear. Grounded.**

- **Trustworthy** — it looks and behaves like a place where real money and real reputations are safe. Verification, provenance, and status are visible and legible. Coherence itself signals competence (`design-reset/05 §1`).
- **Clear** — every screen has one obvious primary action; nothing is hidden behind cleverness; language is plain and in the user's terms (`design-reset/06, 14`).
- **Grounded** — calm, fast, and lightweight; it respects the user's data, device, and attention. It feels *engineered*, not *decorated* — matching the quality of the system underneath.

Distinctiveness comes from **doing the trustworthy/clear/grounded thing better than anyone**, not from spectacle.

## 5. What should UmojaHub *not* feel like?

(`design-reset/15`)
- Not a **flashy startup landing page** — no scroll-jacking, parallax, heavy hero video, or motion spectacle. These cost farmers money and exclude them.
- Not a **generic AI-template SaaS** — no soft-rounded gray cards with drop shadows for their own sake (also the deprecated direction in `CLAUDE.md`).
- Not a **novelty showcase** — no "memorable" invented navigation (the retired StoryWorld direction).
- Not **manipulative** — no dark patterns, fake urgency, or confirmshaming. For a trust platform these are self-defeating.
- Not **incoherent** — never again multiple palettes / type systems / sources of truth.

---

## 6. Non-negotiable design principles

1. **Trust is the product; the UI is its first proof.** Coherence, verifiable cues, and honest surfaces come before beauty. *(05 §1)*
2. **Evidence over taste.** Every notable design decision traces to `design-reset/` evidence or is escalated as an explicit open question. *(whole folder)*
3. **One source of truth.** This document + the semantic token set. No parallel "authoritative" docs, no parallel token systems. Legacy tokens carry a deprecation date, never "indefinitely." *(01, 05 §5)*
4. **One semantic token system, themed by mode.** Global → semantic → component tiers; theme via modes, never via a second parallel system. Brand green `#007f4e` is the fixed anchor. *(05 §5)*
5. **Performance is a design constraint.** Hard budgets; assume 2G + low-end Android. Default to server-rendered, progressively-enhanced, minimal-JS. Subset fonts; WebP/AVIF; lazy non-critical assets. *(05 §4, 06, 14)*
6. **WCAG 2.2 AA is the floor, enforced by default in tokens/components.** *(09)*
7. **Familiar mental models.** Mirror M-Pesa/WhatsApp/mobile-banking conventions, especially for money and messaging. *(05 §2, 14)*
8. **Progressive disclosure.** Lead with the core job per role; reveal complexity on demand; never a blank/void empty state. *(06, 07)*
9. **Motion is functional or absent.** *(08)*
10. **Plain, inclusive language; icon + label.** Second-language and low-literacy friendly. *(09)*

## 7. Forbidden principles (hard "no")

(`design-reset/15`)
- ❌ Dark patterns of any kind (sneaking, forced continuity, confirmshaming, preselected opt-ins, fake urgency, roach motel, obstruction).
- ❌ Hamburger-only / hidden primary navigation.
- ❌ Heavy hero animation, parallax, scroll-jacking, autoplay carousels without controls.
- ❌ Mega menus (the site is small).
- ❌ Icon-only controls for key actions; placeholder-as-label; low-contrast "aesthetic" text.
- ❌ Multi-column forms.
- ❌ Novel/"memorable" navigation metaphors that violate Jakob's Law.
- ❌ Reintroducing a second theme/palette/font system outside this foundation.
- ❌ Choosing inspiration from a product (Stripe/Linear/etc.) *before* the problem — inspiration is selected, with rationale, only after this foundation.

---

## 8. Visual patterns that support the goals

> This foundation fixes **principles and constraints**, not final pixels. Specific scales/values are ratified in a follow-up "Visual System V1" *after this doc is approved*, built in Figma + tokens (`design-reset/11–13`).

- **Color:** one semantic set; **brand green `#007f4e`** as the single accent that does the work; color carries **meaning** (success/warning/danger/info/verified), never decoration; all combinations meet AA, validated in sunlight/cheap-screen conditions. *(01 T-2, 09)*
- **Surfaces (DECIDED — see §15.1):** **one token set, themed by mode.** The product (dashboard) keeps its **dark** theme; the website is a **light** mode of the *same* semantic tokens — chosen because the Documentation Stream is dense, long-form reading where a light, document-like surface is more readable and reads as research-grade to auditors/institutions. The two are modes of one system, never parallel palettes. *(02; §13)*
- **Typography (DECIDED — see §15.2):** **one typographic voice across the whole platform** — **Sora** (headings) / **IBM Plex Sans** (body) / **JetBrains Mono** (mono), the fonts the product already ships. No new website typeface. **Aggressively subset** (Latin + needed glyphs) — font payload is a performance requirement for mid-range Android on 2G, not an aesthetic choice. Type scale optimized for small-screen readability, not display drama. *(01 T-3, 13)*
- **Components:** standardize `ui/` primitives on **Radix-backed, a11y-by-default** behavior (shadcn copy-in already present), evolving the working app rather than restarting it. *(06 §5, 13)*
- **Verification/trust cues:** a consistent, legible visual language for "verified," provenance, status, and scores — this is UmojaHub's signature surface, the place to invest distinctiveness. *(05 §1)*

## 9. Interaction patterns that support the goals

(`design-reset/14`)
- One **clear primary action** per screen; defaults for the common case.
- **Single-column, top-labeled forms**; inline, specific, recoverable errors; no redundant entry.
- **Chunked flows**, ≤4 decisions/step, visible progress, no data loss on back.
- **Immediate, honest feedback**; skeletons on slow networks; **safe retry** on flaky connectivity (no double-charge — surface the existing idempotent payment behavior, logic unchanged).
- **Confirm only the irreversible.**
- Generous **touch targets** (≥24px AA, ≥44px primary), one-handed reach.

## 10. Motion patterns that support the goals

(`design-reset/08`)
- Motion only to **communicate state** (loading, success, transition).
- **≤200–300 ms**; no large scale/pan/parallax; prefer opacity/color/small transforms.
- **`prefers-reduced-motion` honored globally** (reduced = fade/instant).
- **Pause/stop** for anything auto-playing; nothing essential conveyed by motion alone.
- Motion has a **bandwidth budget** — if it adds weight, justify it against data cost.

## 11. Accessibility requirements

(`design-reset/09`) — **WCAG 2.2 AA**, with emphasis on:
- Target size **≥24px (AA)** / **≥44px primary**; focus visible and **never obscured**; full keyboard operability.
- **Contrast** ≥4.5:1 text / 3:1 large & UI — treated as a *field requirement* (sunlight, cheap screens), not just compliance.
- **No cognitive-test authentication** (supports OAuth-first); **no redundant entry**; **consistent help** placement.
- **Icon + label**, plain language, second-language friendly.
- Reduced motion as a first-class mode. Verified via Lighthouse/axe **and** manual keyboard/screen-reader passes.

## 12. Onboarding philosophy

(`design-reset/07`)
- **Goal-first, per role** — move users toward their first real outcome, not a feature tour.
- **Activation, not registration** — instrument each role's first-value moment.
- **Don't gate seeing value behind verification** — gate only transacting.
- **Explain the *why*** of every sensitive step (identity/verification) — transparency reduces fear-driven abandonment and is itself a trust lever.
- **Chunk**; ≤4 choices/step; the existing 3-step flow stays single-purpose.
- First post-signup screen = **instructive empty state**.

---

## 13. Website information architecture — the Documentation Stream

**Purpose.** This is the architectural pattern for the public website. It operationalizes `WEBSITE_PURPOSE_V1` Content Principles 6–8 (completeness over rationing; paired limitation; functional visuals). It **supersedes the earlier "endless scroll" proposal**: it delivers the same all-out, un-rationed consumption of the truth while resolving the findability, deep-linking, performance, and accessibility costs a single endless surface would impose. *(Evidence: `design-reset/10` IA, `15` anti-patterns, `05`/`08` performance & motion, `09` accessibility.)*

**The non-negotiable it must satisfy.** A visitor can reach total understanding of any platform mechanic **without leaving to hunt across fragments and without rationing** — complete depth, continuously readable, on demand.

**The pattern: a documentation surface — not a marketing site, and not one endless page.**

1. **Persistent index (table of contents).** Every topic is reachable from a visible, persistent index — a sidebar on wide screens; an accessible, always-available menu on small screens (never hamburger-only for the primary index, per `design-reset/10`). The whole truth is always one deliberate action away. This is how "never ration, never leave to find" is satisfied.
2. **Deep, self-contained topic sections.** Each topic is explained completely *inline*, top to bottom, as one continuous reading unit — no "read more," no pagination, no truncation within a topic. This is where the original goal — *linear, uninterrupted consumption of the truth* — actually lives: within a topic you move through its full depth without interruption.
3. **A canonical reading spine.** Topics are ordered into one recommended front-to-back path for the visitor who wants to read the platform cover-to-cover. The spine serves the linear reader; the index serves the question-driven reader. Both reach total understanding; neither is forced through the other's path. *(Resolves the conflict with `WEBSITE_PURPOSE_V1` Communication Principle 2 — "answer the question being asked, not a designed narrative.")*
4. **Addressable anchors.** Every section and subsection has a stable, deep-linkable URL fragment. A researcher cites "trust-score methodology"; a student sends an employer a link straight to "what Portfolio Verified means." Deep-linking is a trust feature for the auditor/employer audiences (`WEBSITE_PURPOSE_V1` Rule 2) — a single endless page degrades it.
5. **Per-topic loading; lazy, lightweight assets.** Topics and their diagrams load as the visitor reaches them, not all at once. Reading one module never costs — in seconds or megabytes — the entire platform's documentation. This is the decisive reason to reject one endless surface: it would force the Wajir-farmer-on-2G (`WEBSITE_PURPOSE_V1` Communication Principle 1) to download everything to read anything. Diagrams follow `design-reset/08`: lightweight formats, no decorative motion, reduced-motion safe.
6. **Limitation pairing is structural.** Per `WEBSITE_PURPOSE_V1` Principle 7, each capability's limitation renders in the *same reading unit* as the capability — adjacent, never footnoted.

**Why this beats endless scroll on its own terms.** The endless-scroll aim was "force linear, uninterrupted consumption so the visitor can't ration the truth." The Documentation Stream keeps the uninterrupted depth (within-topic continuity + a canonical spine) and adds what a single surface cannot: instant findability, citable deep links, and a load cost proportional to what is actually read. The proposal's own reference — **Stripe's documentation — works exactly this way: navigable, deep-linkable, topic-fragmented, and complete.** Depth comes *through* navigability, not the absence of it.

**Content map — the complete owned surface.** The Stream's topics are the *full* set the website owns (`WEBSITE_PURPOSE_V1` "Information Ownership Rules"), not a subset:

- **0. What UmojaHub is & why it exists** — orientation; the trust-cannot-be-assumed thesis
- **1. Trust architecture** — the four trust-score components, weightings, recalculation triggers
- **2. The producer interface (farmer)** — listings, price intelligence, AI farm assistant + limitations
- **3. The buyer path** — marketplace browse, reading trust scores, recourse
- **4. Payments & money** — the M-Pesa lifecycle from both sides; no commission
- **5. The academic / student verification engine** — three-document structure, four-dimension assessment, outcomes (VERIFIED / REVISION_REQUIRED / DENIED), the lecturer role
- **6. Verification & identity** — process, criteria, timeline, what happens to documents
- **7. Governance & accountability** — named administrators + credentials, decision criteria, the appeals/recourse protocol with timelines
- **8. Evidence & metrics** — live operational numbers, published honestly however small
- **9. Third-party services & data governance** — which services, why, what data
- **10. Risks & recourse, per audience** — what happens when something goes wrong

*(The original four-module proposal maps to topics 1, 2, 5, 7; topics 3, 4, 6, 8, 9, 10 were missing and are required by `WEBSITE_PURPOSE_V1`'s ownership list.)*

**Audience entry points (DECIDED — see §15.3).** Because the website does not know a visitor's role (`WEBSITE_PURPOSE_V1` Rule 4), audience framings become **curated doorways into the Stream** — a short orientation that links into the relevant topics — not separate, parallel bodies of content. One canonical truth; audience-specific entrances into it. The approved set is **five doorways**:

1. **Farmers** — the producers
2. **Buyers** — the market
3. **Students** — the Education Hub
4. **Employers** — the verifiers
5. **Institutions & Partners** — consolidating NGOs, government, academic institutions, researchers, and funders (they share governance/methodology/impact information needs, so one analytical doorway serves them; aligns with `WEBSITE_PURPOSE_V1` Rule 4 Role Independence and the findability evidence in `design-reset/10`)

A doorway is a thin entry layer over the shared Stream; it never holds content that isn't reachable canonically in the Stream.

---

## 14. What carries over (not reset)

- The **working product** (dashboard/marketplace/onboarding/auth) — plumbing, RBAC, 659 passing tests. We **evolve** its identity, not its logic.
- **Brand green `#007f4e`** — the one continuous identity element.
- The **semantic token architecture** (`rgb(var(--x)/<alpha>)`).
- **Product-truth docs** as the ongoing evidence base.

## 15. Decisions & open questions

**Resolved (owner sign-off recorded):**

1. ✅ **Default surface theme — LIGHT (website).** The website is a **light mode of the one shared token set**; the product stays **dark**. Rationale: the Documentation Stream is dense long-form reading, where a light, document-like surface is more readable and reads as research-grade to auditors/institutions. Constraint affirmed: **one token set, themed by mode — never two parallel systems.** *(applied in §8 Surfaces)*
2. ✅ **Unifying typeface — KEEP EXISTING.** **Sora / IBM Plex Sans / JetBrains Mono** across the entire platform; no new website typeface. Rationale: a single typographic voice is a trust signal, and minimizing font payload is a performance requirement for mid-range Android on 2G. Mandate: **aggressive subsetting.** *(applied in §8 Typography)*
3. ✅ **Audience doorways — FIVE, CONSOLIDATED.** Farmers · Buyers · Students · Employers · Institutions & Partners (NGOs + government + academic institutions + researchers + funders). Rationale: reduces menu clutter while serving the analytical institutional audience through one doorway with shared information needs. *(applied in §13 Audience entry points)*

4. ✅ **Flagged docs — KEPT.** `WEBSITE_PURPOSE_V1`, `WEBSITE_WEBAPP_BOUNDARY`, `WEBSITE_ENFORCEMENT_RULES`, and `APPLICATION_USER_JOURNEYS` are retained as the foundation's cited evidence base (this foundation references `WEBSITE_PURPOSE_V1` throughout; deleting it would orphan those references).

*All open questions resolved. Foundation approved 2026-06-16.*

## 16. What approval unlocks

**Unlocked (approved 2026-06-16).** The next (separate) deliverables, each conforming to this foundation:
1. **Visual System V1** — final color/type/spacing/component tokens in Figma + code tokens, implementing the §8 decisions (light website mode of the shared token set; Sora/IBM Plex Sans/JetBrains Mono, subset).
2. **App-shell hardening** — a11y (WCAG 2.2 AA), empty states, performance — evolve the working product, don't restart it.
3. **Website build** — implement the Documentation Stream (§13): the persistent index, the canonical spine, the five audience doorways (§13), deep-linkable topics, per-topic lazy loading, and the complete content map — performance-budgeted and trust-forward.

These run against this foundation as the source of truth; it is amended, never superseded by a competing doc.
