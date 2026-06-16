# 11 — Design Tooling Report

**Status:** Audit of design/UX tooling available to this project right now (installed skills + MCP servers) and external tools worth adopting. Goal: separate tools that **improve design quality and verification** from tools that merely **generate more artifacts**.

---

## 1. Installed skills relevant to design (this environment)

UmojaHub's environment already exposes a large library of design skills. Triaged by usefulness *for a research-led, anti-slop reset*:

### High value — taste/quality enforcement & redesign
- **`design-taste-frontend`** (v2, current default) and **`taste-skill`** — anti-slop frontend skills: read brief, infer direction, avoid templated output, audit-first on redesigns, strict pre-flight. **This is the closest match to the directive's referenced taste-skill and the right default for building post-foundation.**
- **`design-taste-frontend-v1` / `taste-skill-v1`** — preserved originals; use only for exact backward-compat. (UmojaHub's memory already records taste-skill as the standing UI workflow — see `feedback_taste_skill`.)
- **`redesign-existing-projects` / `redesign-skill`** — audit current design, find generic AI patterns, upgrade without breaking functionality. Useful for the app-shell hardening (which we evolve, not restart).
- **`ui-ux-pro-max`** — broad design intelligence (styles, palettes, font pairings, UX guidelines, chart types) with shadcn MCP integration. Good as a reference/checklist engine.

### Medium value — direction & visual exploration
- **`high-end-visual-design` / `soft-skill`**, **`minimalist-ui` / `minimalist-skill`**, **`industrial-brutalist-ui` / `brutalist-skill`**, **`frontend-design`** — opinionated style systems. Useful *after* the foundation picks a direction; dangerous *before* (they impose an aesthetic).
- **`stitch-design-taste` / `stitch-skill`** — generates agent-friendly `DESIGN.md` enforcing premium standards. Pattern is relevant: the foundation itself plays this role.
- **`gpt-taste` / `gpt-tasteskill`** — GSAP-heavy motion/editorial. **Caution:** its motion-maximalism conflicts with report 08 (functional, reduced motion). Use selectively, not wholesale.

### Image-generation skills (reference only, not code)
- **`imagegen-frontend-web`**, **`imagegen-frontend-mobile`**, **`image-to-code`**, **`brandkit`** — generate visual references/brand boards. Useful for *exploring* a direction and for brand/identity boards once the foundation is set. They do not ship product code.

### Output discipline
- **`full-output-enforcement` / `output-skill`** — prevents truncated/placeholder code. Useful when implementing the rebuilt website.

## 2. Installed MCP servers relevant to design

- **Figma MCP** (`plugin:figma:figma`) — design↔code in both directions; read design context/variables, generate designs, Code Connect. **Highest-value design MCP available.** Pairs with the figma-* skills.
- **chrome-devtools MCP** — includes **`lighthouse_audit`**, performance traces, a11y snapshot, device emulation, network throttling. **Critical for this audience**: lets us verify performance on emulated 2G and run Lighthouse a11y/perf as a design QA gate.
- **playwright MCP** — browser automation for interaction/visual verification and flow testing.
- **vercel MCP + skills** — deployment, preview URLs, runtime logs (build/ship loop).
- **glif MCP** — image/asset generation pipelines (brand assets).

## 3. External tools worth adopting (from research)

- **Figma MCP server** (official) — exposes frames/components/tokens/variables as structured data for codegen; supports accessibility annotations that flow into generated code. ([Figma blog](https://www.figma.com/blog/design-systems-ai-mcp/), [Figma Learn](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server))
- **Lighthouse / axe-core** — automated perf + a11y scoring (axe catches ~30–40% of a11y issues; pair with manual). Available via chrome-devtools MCP.
- **Token tooling** — Style Dictionary / Tokens Studio class tooling for multi-platform token export + linting (report 05 maturity practices).

## 4. Recommendation

| Phase | Tools |
|---|---|
| **Now (reset/foundation)** | This report + research; **no** style/imagegen skills yet (avoid premature aesthetic) |
| **Direction-setting** | `imagegen-frontend-web` + `brandkit` for exploration; Figma MCP for a token/component library |
| **Build (post-foundation)** | `design-taste-frontend` (default) + `redesign-existing-projects` for app-shell; `full-output-enforcement` for completeness |
| **QA gate (every change)** | chrome-devtools **Lighthouse + 2G emulation + a11y**; playwright for flows |

> Guardrail: the directive warns against tools that "generate screenshots but not conversions." Image/style skills are explicitly **exploration aids**, gated behind the approved foundation — never a substitute for it.

### Sources
- [Figma — Design systems & AI MCP](https://www.figma.com/blog/design-systems-ai-mcp/) · [Figma Learn — MCP server guide](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server) · [Figma — Introducing Dev Mode MCP](https://www.figma.com/blog/introducing-figma-mcp-server/)
