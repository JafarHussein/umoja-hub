# Component Architecture Strategy

**Reset deliverable 17** (Gate 4). How the app's components are structured — in Figma and in code, kept in parity.

## Three tiers

1. **Primitives** — `Button`, `Input`, `Select`, `Checkbox`, `Radio`, `Card`, `Badge`, `Tag`, `Avatar`, `Tooltip`, `Modal/Sheet`, `Tabs`, `Toast`, `Skeleton`. Token-bound, fully a11y-stateful. (The codebase already has base-ui/shadcn-style owned primitives — **keep that architecture**: own the code, accessibility in the primitive, re-skin to the new system.)
2. **Composites** — domain components built from primitives: `FormField` (label+input+helper+error), `ListingCard`, `OrderTimeline`, `ReviewRubric`, `ProjectWorkspace`, `VerificationQueueRow`, and the **trust vocabulary** (`TrustScore`, `VerificationBadge`, `StatusPill`, `TierIndicator`, `DecisionAttribution`).
3. **Patterns** — page templates and **role shells** (farmer / buyer / student / lecturer / admin), empty/error/loading templates, the onboarding wizard frame.

## Cross-cutting rules

- **The trust vocabulary is defined once and reused everywhere** (deliverable 07). One `VerificationBadge`, one `TrustScore`, consistent across both hubs — consistency is itself a trust cue.
- **Full state coverage is mandatory** per component: default / hover / focus-visible / active / disabled / **loading / error / empty**. A11y states (focus, ARIA, redundant non-colour encoding) are part of the component, not the screen.
- **Variant strategy:** `variant` (intent) × `size` × `state`; avoid variant explosion via slots/`INSTANCE_SWAP` for icons and composition.
- **Density-aware** where it matters (deliverable 18): components support a comfortable/compact expression via spacing tokens, not duplicate components.
- **Figma ↔ code parity** via Code Connect; every Figma component has a code counterpart and vice versa.

## Composition over configuration

Prefer composing primitives (slots/children) over mega-components with 30 props. Keeps the system legible and the trust components auditable.

## Sources

- Existing `src/components/ui/*` (base-ui/shadcn-style) architecture; trust-vocabulary requirement from [07](07_TRUST_VERIFICATION_UX_RESEARCH.md); density from [18](18_INFORMATION_DENSITY_STRATEGY.md).
