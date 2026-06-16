# UmojaHub UI/UX Reset — Research & Audit Outputs

This folder holds the **research and audit deliverables** produced during the UI/UX reset (not designs). Per the reset directive, no new design work begins until **`/UMOJAHUB_DESIGN_FOUNDATION_V1.md`** (repo root) is approved.

**Backend, business logic, data model, and integrations were not touched.** The reset is UI/UX only. The product (dashboard/marketplace/onboarding/auth) still type-checks, lints, and passes all 659 tests after the reset.

## Index

| # | Report | Purpose |
|---|---|---|
| 01 | [UI/UX Audit](01_UIUX_AUDIT.md) | Forensic account of the UI/UX layer at reset time |
| 02 | [Existing Design Deletion Report](02_EXISTING_DESIGN_DELETION_REPORT.md) | Visual-system / token deletion plan |
| 03 | [Obsolete Document Deletion Report](03_OBSOLETE_DOCUMENT_DELETION_REPORT.md) | Which design docs were deleted / kept / flagged |
| 04 | [Obsolete Component Deletion Report](04_OBSOLETE_COMPONENT_DELETION_REPORT.md) | Website routes/components deletion plan |
| 05 | [Design Research Findings](05_DESIGN_RESEARCH_FINDINGS.md) | Cross-cutting evidence synthesis |
| 06 | [Modern Web App UX Findings](06_MODERN_WEBAPP_UX_FINDINGS.md) | App-shell UX evidence |
| 07 | [Modern Onboarding Findings](07_MODERN_ONBOARDING_FINDINGS.md) | Onboarding/activation evidence |
| 08 | [Motion Design Findings](08_MOTION_DESIGN_FINDINGS.md) | Functional, accessible, low-cost motion |
| 09 | [Accessibility Findings](09_ACCESSIBILITY_FINDINGS.md) | WCAG 2.2 AA + audience-specific a11y |
| 10 | [Information Architecture Findings](10_INFORMATION_ARCHITECTURE_FINDINGS.md) | Navigation & findability evidence |
| 11 | [Design Tooling Report](11_DESIGN_TOOLING_REPORT.md) | Installed + external design tools |
| 12 | [MCP / Plugin Report](12_MCP_PLUGIN_REPORT.md) | MCP servers for design + verification |
| 13 | [Open Source Design Resource Report](13_OPEN_SOURCE_DESIGN_RESOURCE_REPORT.md) | Primitives, tokens, fonts, references |
| 14 | [Interaction Design Report](14_INTERACTION_DESIGN_REPORT.md) | Forms, feedback, latency-aware interaction |
| 15 | [Design Anti-Patterns Report](15_DESIGN_ANTIPATTERNS_REPORT.md) | The "do not do" list |

## Method

- **Audit**: read the repo's tokens, component tree, route map, and full design-doc corpus; traced the import graph to find the website↔product boundary.
- **Research**: deep web research across HCI, accessibility (WCAG 2.2), onboarding/activation, motion, IA, forms, dark patterns, low-bandwidth design, web credibility, and design-token maturity. Every claim is sourced inline.
- **Deletion**: scorched-earth on the website layer + obsolete docs, surgical on shared tokens to keep the product building.

## What survives (and why)

- The **dark product theme**, dashboard tokens, `ui/` primitives, and all feature components — the working app.
- The **brand green `#007f4e`** — the one continuous identity element.
- The **semantic token architecture** — the right mechanism.
- **Product-truth docs** (capabilities reference, ecosystem maps, journeys, non-visual strategy) — the foundation's evidence base.
