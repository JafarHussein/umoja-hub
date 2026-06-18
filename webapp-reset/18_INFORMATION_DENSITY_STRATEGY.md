# Information Density Strategy

**Reset deliverable 18** (Gate 4). The platform's defining UX tension, made systematic.

## The core finding (from Gates 1–2): density must adapt by role

One density for all roles fails. Two populations:

- **Farmers / buyers** — mixed literacy, weak devices, high-anxiety, few-but-critical decisions → **low density, large targets, generous space, minimal choices per screen, high clarity.**
- **Lecturers / admins** — expert tool-users processing queues and evidence → **high density, scannable data surfaces, more information per view.**
- **Students** — in between: a serious workspace that's information-rich but not cramped.

## The mechanism: a density scale + progressive disclosure (not duplicate UIs)

1. **A spacing/density token scale** (built on the existing 8-pt grid) with **comfortable vs. compact** expressions, applied per surface/role — components flex via tokens, not forks (deliverable 17).
2. **Progressive disclosure** as the universal reconciler: **glance → detail.** The Trust Score is the archetype — a tier/number a low-literacy buyer acts on at a glance, with the four-component breakdown on demand. Same pattern for orders, projects, verification records.
3. **Proper data-surface patterns** for genuinely dense views (lecturer queue, admin triage, audit log, order history): scannable rows, clear hierarchy, sort/filter — **real tables, not cramped cards** (lesson from Carbon, deliverable 13).

## Discipline (anti-patterns to avoid)

- **False density** — cramming to look "data-rich" (banned, deliverable 15).
- **Lazy over-spacing of real data** — making a lecturer scroll through air to read a queue.
- **Dumping expert density on a farmer** — or infantilizing an admin with farmer-level spacing.

## How density meets accessibility

Compact mode must still honour **≥44px touch targets and AA contrast** — density buys information, never accessibility. Large-text mode (deliverable 11) composes over any density.

## Sources

- Synthesis of [04](04_USER_RESEARCH_FINDINGS.md), [05](05_MARKETPLACE_UX_RESEARCH.md), [06](06_EDUCATION_UX_RESEARCH.md); data-density patterns from Carbon ([13](13_DESIGN_SYSTEMS_RESEARCH.md)).
