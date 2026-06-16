# 12 — MCP / Plugin Report

**Status:** Focused inventory and recommendation for Model Context Protocol servers and plugins, for design+verification workflows. (Skills are covered in report 11; this report is MCP/plugin-specific.)

---

## 1. Available MCP servers (this environment)

| MCP server | Design-relevant capabilities | Verdict |
|---|---|---|
| **Figma** (`plugin:figma:figma`) | `get_design_context`, `get_variable_defs`, `get_screenshot`, `generate_figma_design`, `create_new_file`, Code Connect (`add_code_connect_map`), `search_design_system`, `get_libraries` | **Adopt** — the design source-of-truth bridge; build the post-foundation token/component library here |
| **chrome-devtools** | `lighthouse_audit`, `performance_start_trace`/`analyze_insight`, `emulate` (CPU/network), `take_snapshot` (a11y tree), `take_screenshot`, console/network inspection | **Adopt as QA gate** — the single most valuable verification MCP for UmojaHub's low-bandwidth audience |
| **playwright** | navigate, click, fill, snapshot, screenshot, network, `browser_evaluate` | **Adopt** — interaction/flow verification and visual regression |
| **claude_ai_Vercel** / **vercel** | deploy, preview URLs, build/runtime logs, docs search | **Use** — ship + observe loop |
| **github** | PRs, reviews, file ops, code search | **Use** — already in workflow |
| **glif** | image-generation pipelines | **Optional** — brand/asset generation only |
| **claude_ai_Google_Drive** | file read/search | Not design-relevant |

## 2. Plugin/skill toolchains

- **Figma plugin skills** (`figma-use`, `figma-generate-design`, `figma-generate-library`, `figma-code-connect`, `figma-create-new-file`) — mandatory companions to the Figma MCP write tools. The **figma-generate-library** skill is the right vehicle to build UmojaHub's token/component library *from* the approved foundation.
- **Vercel skills** (`shadcn`, `react-best-practices`, `nextjs`, `vercel-functions`) — `react-best-practices` and `shadcn` are directly useful for hardening the `ui/` primitives; `nextjs` for the rebuilt website (App Router, performance).

## 3. Recommended MCP workflow (post-foundation)

1. **Define** tokens/components in Figma (Figma MCP + `figma-generate-library`), seeded by the foundation.
2. **Implement** in code with `design-taste-frontend` + shadcn/Radix primitives.
3. **Bridge** with Code Connect so Figma components map to code.
4. **Verify** every change through chrome-devtools: Lighthouse (perf + a11y), **2G/CPU emulation**, a11y tree snapshot; playwright for flows.
5. **Ship** via Vercel preview URLs; observe runtime logs.

## 4. Gaps / cautions

- **No dedicated "design critique" MCP** is installed beyond the taste/redesign *skills*. The chrome-devtools Lighthouse + a11y snapshot is the closest objective critique tool — lean on it.
- **Figma MCP requires a Figma file/account context**; if unavailable, fall back to code-first with the taste skills and verify via chrome-devtools.
- Avoid plugin sprawl: adopt the five-step chain above, not every available server.

### Sources
- [Figma — Design Context, everywhere you build](https://www.figma.com/blog/design-context-everywhere-you-build/) · [Figma — MCP server guide](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server)
