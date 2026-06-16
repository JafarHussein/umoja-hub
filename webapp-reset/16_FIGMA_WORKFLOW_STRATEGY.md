# Figma Workflow Strategy

**Reset deliverable 16** (Gate 4). Figma is the **source of truth** for app design (file `bHjVuFiAzzBQdViTAj2Twh`). Grounded in the Figma MCP capabilities and the lessons from this session's build.

## File structure (pages)

```
Foundations   — variables (tokens) + modes, text styles, spacing/radius, principles
Components     — primitives → composites → patterns (variant sets, all states)
Patterns       — page templates, role shells, the trust/verification vocabulary
Screens/Auth · Screens/Onboarding · Screens/Marketplace · Screens/Education · Screens/Admin
```

The **variable foundation already exists** (Primitives + Color w/ modes + Spacing + Radius + text styles). The next build is **component variants** (the open follow-on), then screens — never screens drawn from raw values.

## Token & component sync (Figma ↔ code)

- **Variables are the tokens.** Code tokens (`globals.css`/Tailwind) derive from Figma variables — ideally automated (Style Dictionary / Tokens Studio, deliverable 12) to prevent the drift this reset is fixing.
- **Code Connect** maps each Figma component to its code component, so design and implementation stay linked and the handoff is unambiguous.

## Hard workflow rules (learned this session)

1. **Bind everything to variables/styles — never hardcode hex/px.** (The login build proved the cost of getting this wrong.)
2. **Set the theme via an explicit mode on the artboard**; descendants inherit. Validate the resolved mode — don't assume.
3. **Wrapping text:** fixed width + `HEIGHT` auto-resize *after* applying a text style (applying a style resets auto-resize and collapses `FILL`). A concrete gotcha to encode in the component build.
4. **Work incrementally, screenshot every section, validate before proceeding** — atomic steps, returned node IDs.

## Gate workflow

Design in Figma → screenshot + Vercel preview for the **approval gate** → taste-skill critique → implement via Code Connect → chrome-devtools QA (Lighthouse a11y/perf, Slow-3G/4×CPU emulation). No code-first design; no skipping gates.

## Sources

- Figma MCP `figma-use` / `figma-generate-design` / `figma-generate-library` / `figma-code-connect`; gotchas observed building the (now-deleted) login screen this session.
