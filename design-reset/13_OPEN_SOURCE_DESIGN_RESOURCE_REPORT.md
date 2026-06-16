# 13 — Open Source Design Resource Report

**Status:** Survey of open-source design resources (component primitives, token tooling, references) suitable for a research-led, accessibility-first, low-bandwidth rebuild.

---

## 1. Accessible headless primitives (recommended foundation)

- **Radix Primitives** — open-source, WAI-ARIA-compliant primitives (dialog, dropdown, popover, tooltip…) with built-in keyboard nav + screen-reader support. Maintained by WorkOS; the foundation under shadcn and many libraries. ([Radix](https://www.radix-ui.com/primitives/docs/overview/introduction), [GitHub](https://github.com/radix-ui/primitives))
- **Base UI** — newer headless library from the creators of Radix/Floating UI/MUI; shadcn (Dec 2025) supports it as an alternative primitive base. ([Untitled UI](https://www.untitledui.com/blog/react-component-libraries))
- **shadcn/ui** — not a dependency but a copy-in component model built on Radix/Base UI, sharing tokens so components "look like they belong together." ([Magic Patterns](https://www.magicpatterns.com/blog/top-open-source-react-component-libraries-2025), [shadcn.io](https://www.shadcn.io/ui))

**Fit for UmojaHub:** the repo **already imports `shadcn/tailwind.css`** and has `ui/` primitives. Standardizing those primitives on **Radix (a11y by default)** + shadcn's copy-in model aligns the working app with WCAG 2.2 (report 09) without a heavy runtime dependency — important for bundle size on 2G.

## 2. Token tooling (open source)

- **Style Dictionary** (Amazon) — transforms design tokens to any platform; supports the three-tier global→semantic→component model (report 05).
- **Tokens Studio** — Figma-side token management that exports to code; pairs with the Figma MCP workflow (report 12).
- **Open Props** — open-source CSS custom-property "design tokens as variables" set; a lightweight reference for a sane default scale (spacing, type, easing) even if not adopted wholesale.

## 3. Type & assets (open, license-safe)

- **Google Fonts / Fontsource** — self-hostable, subsettable fonts (critical: subset to Latin + needed glyphs to cut bytes on 2G). The repo already uses `next/font/google` (Sora, IBM Plex, JetBrains) — keep one, subset aggressively.
- **Lucide** (open-source icon set, shadcn default) — consistent, tree-shakeable icons; pair icon **+ label** per report 09.
- **Heroicons / Phosphor** — open alternatives if a warmer/agrarian tone is wanted post-foundation.

## 4. Reference libraries (patterns, not aesthetics)

- **W3C WAI-ARIA Authoring Practices (APG)** — canonical accessible-pattern reference; the authority behind Radix's behavior.
- **Inclusive Components** (Heydon Pickering) — accessible component patterns.
- **NN/g articles** — IA/navigation/forms evidence (cited across reports 06/07/10).

## 5. Recommendation

| Need | Open-source choice |
|---|---|
| Accessible primitives | **Radix** (+ shadcn copy-in, already present) |
| Token transform/lint | **Style Dictionary** (+ Tokens Studio if Figma-led) |
| Token scale reference | **Open Props** |
| Icons | **Lucide** (icon+label) |
| Fonts | **next/font** self-hosted, **subset** to cut bytes |
| Accessible patterns | **WAI-ARIA APG**, Inclusive Components |

> Principle: prefer **copy-in / headless + tokens** over heavy component frameworks. Every KB matters for farmers on metered 2G (report 05).

### Sources
- [Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction) · [Radix GitHub](https://github.com/radix-ui/primitives)
- [Untitled UI — React component libraries](https://www.untitledui.com/blog/react-component-libraries) · [Magic Patterns — OSS libraries 2025](https://www.magicpatterns.com/blog/top-open-source-react-component-libraries-2025) · [shadcn.io](https://www.shadcn.io/ui)
