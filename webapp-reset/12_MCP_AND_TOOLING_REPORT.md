# MCP & Tooling Report

**Reset deliverable 12** (Gate 4). Grounded in the tooling actually available in this workspace, plus recommended additions.

## Already available (use these — no procurement needed)

| Capability | Tool (present) | Role in the reset |
|---|---|---|
| **Design source of truth** | **Figma MCP** + skills (`figma-use`, `figma-generate-design`, `figma-generate-library`, `figma-code-connect`) | Variables/tokens, components/variants, screens, and **Code Connect** (Figma↔code mapping). Already holds the token library (`bHjVuFiAzzBQdViTAj2Twh`). |
| **Visual + a11y + perf QA** | **chrome-devtools MCP** | Lighthouse (a11y / performance / best-practices), performance traces, screenshots, and **device + network + CPU emulation** — critical for validating the **2G / low-end-Android** reality (already used to verify the website at Slow-3G/4×CPU). |
| **Interaction testing** | **Playwright MCP** | Flow/interaction validation, keyboard paths. |
| **Design critique / anti-slop** | **taste-skill** | A standing critique gate against generic AI-design tells. |
| **AI illustration/image generation** | **glif MCP** (`run_glif`, `search_glifs`) + design/image skills | Production path for the mandated illustration system (deliverable 08), under art direction. |
| **Deploy/preview** | **Vercel MCP** | Preview deployments for review at gates. |

## Recommended additions (gaps to close)

1. **Design-token sync** — Style Dictionary or Tokens Studio to keep **Figma variables ↔ code tokens** in lockstep (avoids the drift this reset is correcting). High priority, since Figma is now source of truth.
2. **Automated a11y in CI** — axe-core (e.g. `jest-axe` / Playwright-axe) so accessibility regressions fail the build, complementing manual screen-reader passes.
3. **Visual-regression testing** — Playwright snapshots (or Chromatic) for the component library, so the design system can't silently drift.
4. **Real low-end-device testing** — a physical mid-range Android or a device-farm pass; emulation is necessary but not sufficient for the target users.

## Recommended pipeline

**Design** in Figma (bound to variables/styles) → **review** at each gate (screenshots + Vercel preview) → **critique** with taste-skill → **implement** from Figma via Code Connect → **QA gate** with chrome-devtools (Lighthouse a11y/perf + Slow-3G/4×CPU emulation) + axe in CI + visual-regression. The stack is ~80% already present.

## Sources

- Direct inventory of this workspace's MCP servers and skills; chrome-devtools/Figma capabilities verified in use this session.
