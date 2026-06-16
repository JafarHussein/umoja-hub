# VISUAL SYSTEM V1 — Scope

**Status: SCOPE / PROPOSED.** This defines *what Visual System V1 produces and how* — not the final pixel values, which are ratified during execution (Figma + code). It is the first deliverable unlocked by `UMOJAHUB_DESIGN_FOUNDATION_V1.md` §16.
**Conforms to:** `UMOJAHUB_DESIGN_FOUNDATION_V1.md` (approved 2026-06-16). Where this scope and the foundation disagree, the foundation wins.
**Scope:** UI/UX tokens + the `ui/` primitives' token bindings. Backend untouched. This is *not* the website build (§16.3) and *not* a component redesign — it is the **token + theming layer** both of those depend on.

---

## 1. Objective & definition of done

Produce **one** token system — primitive → semantic → component — that:
- expresses **two modes off the same semantic set**: `product` (dark) and `website` (light);
- finalizes color, typography, spacing, radius/elevation, and motion values;
- binds the existing `ui/` primitives to semantic tokens so they render correctly in **both** modes;
- ships as **Figma variables + code tokens** (`globals.css` + `tailwind.config.ts`) that are the single source for all subsequent UI work;
- retires the legacy/parallel token remnants on a committed schedule.

**Done when:** the dashboard renders unchanged in `product` mode, a `website` (light) mode renders the same primitives correctly, every value is a semantic token (no raw hex in components), all combinations pass WCAG 2.2 AA, and the legacy aliases have a deprecation date.

## 2. Foundation decisions this implements (locked — not re-opened)

- **One token set, themed by mode** — product = dark, website = light. *(§8 Surfaces)*
- **Brand green `#007f4e`** is the fixed anchor; one accent; color carries meaning. *(§4, §8)*
- **Sora / IBM Plex Sans / JetBrains Mono** platform-wide; subset aggressively. *(§8 Typography)*
- **WCAG 2.2 AA** floor; 24px (AA) / 44px (primary) targets; visible focus. *(§11)*
- **Functional motion only**, ≤200–300 ms, `prefers-reduced-motion` global. *(§10)*
- **No second/parallel system**, no shadow-for-depth SaaS styling (borders/surfaces carry depth). *(§5, §7)*

## 3. Token architecture (three tiers)

Build on the mechanism already in the repo (`rgb(var(--x) / <alpha-value>)`), formalized into three tiers per `design-reset/05 §5`:

| Tier | Example | Rule |
|---|---|---|
| **Primitive** (raw, mode-agnostic) | `--green-600: 0 127 78` | Never referenced directly by components. The palette of available values. |
| **Semantic** (role + intent, mode-aware) | `--bg`, `--surface`, `--fg`, `--brand`, `--border`, `--success`… | The only tier components consume. Re-mapped per mode. |
| **Component** (scoped, optional) | `--btn-bg`, `--card-border` | Inherit from semantic; add only when a component needs a value the semantic tier can't express. |

The current `:root`/`.theme-product` semantic tokens are the starting point for tier 2; today's hard-coded values become tier-1 primitives.

## 4. Workstreams

### 4.1 Color
- **Product (dark):** already exists and ships — formalize current values as the canonical `product` mode; no visual change intended.
- **Website (light):** author a **light mode of the same semantic token names** (`--bg`, `--surface`, `--fg`, `--border`, `--brand`, state colors). This re-introduces a light theme — but as a clean, single-system, AA-validated mode, **not** the deleted warm-editorial palette (no copper/teal/violet, no parallel `--ws-*`).
- **State colors** (success/warning/danger/info) + a first-class **`verified`** semantic (the platform's signature cue, §8) — defined in both modes, each meeting AA.
- **Validation:** every text/UI pairing checked at AA, **including sunlight/low-end-screen legibility** (§9), in both modes.

### 4.2 Typography
- Roles: **Sora** (headings), **IBM Plex Sans** (body/UI), **JetBrains Mono** (code/data).
- Finalize **one type scale** that serves both the dashboard (compact, data-dense — current `t1–t6`) and the website's long-form reading (comfortable measure, larger body, generous line-height). Same family, two density contexts — not two systems.
- **Subsetting plan:** Latin + required glyphs only; `next/font` with `display: swap`; document the byte budget. Drop unused weights.

### 4.3 Spacing & layout
- Confirm/normalize the **8-pt grid** (current `--space-*`). Define container widths and the documentation **reading measure** (~60–75ch) for the Stream.

### 4.4 Radius & elevation
- Confirm restrained radius (current 6px / 4px). **Depth via borders + surface steps, not drop shadows** (§7 forbids shadow-based SaaS depth). Define the surface elevation steps (`bg` → `surface` → `surface-raised`) for both modes.

### 4.5 Motion
- Tokenize durations/easings (current set is a good base). Add a **global `prefers-reduced-motion` rule** (reduced = fade/instant). No motion token exceeds the §10 budget.

### 4.6 Component tokens — the critical task
The `ui/` primitives (`button`, `Card`, `Input`, `Modal`, `Badge`, `VerifiedBadge`, `SkeletonLoader`) are currently **dark-coupled**: the shadcn variable remap in `globals.css` is hard-coded dark-only (`--background:#0d1117`, etc.). For a light website mode to work, these must bind to **semantic tokens that flip per mode**, not to fixed dark hex.
- Re-map the shadcn variables (`--background`, `--card`, `--primary`, `--border`, `--ring`…) to the semantic tokens so they resolve per mode.
- Audit each primitive for any remaining hard-coded color/spacing; replace with semantic tokens.
- No API/behavior change to the primitives — token bindings only.

## 5. Theming model

- **Default = `product` (dark)** on `:root` (the app shell).
- **`website` (light)** applied via a mode class/data-attribute on the website layout root — the same pattern the deleted `.theme-website` used, done correctly this time (one semantic set, no `--ws-*` fork).
- A dark band inside a light page (e.g., an inverted CTA) flips its subtree back to `product` via the mode class — already supported by the `.theme-product` scoping.
- **Single switch point per surface**; modes never coexist as two token *systems*, only as two value maps over one set.

## 6. Constraints baked in (non-negotiable)

- WCAG 2.2 AA in **both** modes; focus visible and never obscured; targets ≥24px / ≥44px primary.
- Font payload subset and budgeted (2G reality).
- No parallel token system; no shadow-depth; no decorative motion.
- Brand green is the only accent; color = meaning.

## 7. Deliverables

1. **Figma variables/library** — primitives + semantic tokens with **light/dark modes**, type styles, spacing, radius, motion (via Figma MCP + `figma-generate-library`).
2. **Code tokens** — refactored `globals.css` (3-tier, both modes) + `tailwind.config.ts` (semantic utilities), with **Code Connect** mapping Figma ↔ code where useful.
3. **`design-system/TOKENS.md`** — the human-readable token reference (names, roles, modes, usage rules).
4. **`ui/` primitive re-binding** — primitives consume semantic tokens; verified in both modes.
5. **Legacy deprecation** — the dashboard legacy aliases (`--color-*`, `--text-*`, `surface.primary/elevated/secondary`) get a migration map + a committed removal milestone (no more "indefinite legacy").

## 8. Phasing

1. **P1 — Primitives & semantic spine:** extract primitives, formalize `product` semantic tokens (no visual change), add 3-tier structure + Figma variables. — ✅ **CODE DONE** (TIER 1 primitives + TIER 2 product semantics in `globals.css`, value-identical; type-check/lint/test/build green). *Figma variables deferred to the Figma library step (needs a Figma file context).*
2. **P2 — Light mode:** author `website` light values for every semantic token; AA-validate both modes. — ✅ **DONE.** `.theme-website` block + light-side TIER 1 primitives (warm-neutral ramp, dark-green accents, AA-tuned state hues) in `globals.css`. WCAG 2.2 AA computed for all light-mode text/UI pairings: `fg` 15.99:1, `fg-muted` 6.63:1, `fg-subtle` 4.83:1, `brand-text` 6.27:1, white-on-brand 5.07:1, state ≥5.0:1 (success/warning darkened from dark-mode hues to clear 4.5:1 on `--bg`). Dark mode unchanged (shipping palette). Not yet *applied* (no website root yet) and primitives not yet flipping — that's P3. Build/test green.
3. **P3 — Component re-binding:** fix the shadcn remap + primitive audits; verify primitives in both modes (Storybook-style harness or a scratch route). — ✅ **DONE.** Audit found the `ui/` primitives (button, Card, Input, Modal, Badge) already style with semantic utilities, so they flip per mode with no `.tsx` changes. Real fix was the shadcn shim: it hard-coded `--ring:#007f4e` (a hex) which won on `:root` and made `rgb(var(--ring))` invalid — **dashboard focus rings were broken**; rebinding the shim to semantic tokens and dropping its `--border`/`--ring` overrides restores valid, mode-aware focus rings (an a11y fix per foundation §11). Verified live in both modes via the preview route. *Deviation: the route is `/tokens-preview`, not `/__tokens` — Next.js treats `_`-prefixed folders as private (non-routed). Throwaway; deleted at end of V1.* Build/type-check/lint/test green.
4. **P4 — Type + motion + spacing finalization:** scales, subsetting, reduced-motion rule.
5. **P5 — Legacy migration + docs:** migrate/remove legacy aliases, publish `TOKENS.md`, Code Connect.

Each phase gated by `npm run type-check && npm run lint && npm run test` + a visual check that the dashboard is unchanged.

## 9. Acceptance criteria (DoD checklist)

- [ ] One semantic token set; two modes (`product` dark, `website` light); no `--ws-*` / parallel system.
- [ ] Dashboard visually unchanged in `product` mode (regression check).
- [ ] All `ui/` primitives render correctly in **both** modes; zero hard-coded color in components.
- [ ] Every text/UI pairing passes WCAG 2.2 AA in both modes (documented).
- [ ] Fonts subset; payload budget documented; only used weights shipped.
- [ ] `prefers-reduced-motion` honored globally; no motion token exceeds §10.
- [ ] `TOKENS.md` published; Figma variables match code tokens.
- [ ] Legacy aliases have a migration map + removal milestone.
- [ ] type-check / lint / test green.

## 10. Out of scope (explicitly)

- The **website build** (Documentation Stream, §16.3) — consumes these tokens, separate deliverable.
- **App-shell hardening** (empty states, a11y passes on flows, §16.2) — separate, though it consumes V1 tokens.
- **Component redesign / new components** — V1 re-binds existing primitives; new patterns come with the consuming work.
- **Illustrations/diagrams** for the Stream (`WEBSITE_PURPOSE_V1` Principle 8) — separate asset workstream.

## 11. Decisions (locked — 2026-06-16)

1. ✅ **Light surface tone — restrained warm off-white.** A neutral, low-glare off-white document surface for the website mode — calmer for long-form reading than near-pure white, but **neutral**, not the old editorial warmth (no copper/cream character). Validated at AA in sunlight/low-end-screen conditions during P2.
2. ✅ **Legacy migration — fast-follow.** V1 ships the token/theming spine; the dashboard's legacy aliases (`--color-*`, `--text-*`, `surface.primary/elevated/secondary`) are migrated and removed **immediately after V1** as its own tracked task (P5 produces the migration map + removal milestone; execution is the fast-follow). Keeps V1 focused; no indefinite legacy.
3. ✅ **Verification harness — throwaway preview route.** A temporary internal route renders every `ui/` primitive in both modes for eyeballing during P3; no Storybook dependency added; deleted at the end of V1. *Implemented at `/tokens-preview` (not `/__tokens` — Next.js excludes `_`-prefixed folders from routing).*

## 12. Risks

- **Light mode exposes hidden dark-coupling** in primitives → mitigated by P3 audit + the preview harness.
- **Legacy aliases mask un-migrated surfaces** → the migration map (P5) makes them visible before removal.
- **Scope creep into redesign** → §10 boundary is firm: V1 is tokens + bindings, not new looks.
