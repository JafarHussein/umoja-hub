# Documentation

Supporting documentation and assets for the root [`README.md`](../README.md).

## Structure

```
docs/
├── README.md              ← you are here (index + asset conventions)
├── SCREENSHOT_PLAN.md     ← screenshot acquisition plan, checklist, exact filenames
├── DIAGRAMS.md            ← full Mermaid diagram pack (context, architecture, ER,
│                            trust, escrow, verification, RBAC, roles)
└── screenshots/           ← PNG assets referenced by the README
    └── README.md            (how to capture them)
```

## How the pieces fit

| File | Purpose | Produced by |
|---|---|---|
| `../README.md` | The single source of truth for the whole project. | Hand-authored from the codebase. |
| `SCREENSHOT_PLAN.md` | Exact filenames + routes + accounts for every README image. | Hand-authored. |
| `DIAGRAMS.md` | Presentation-ready Mermaid diagrams (a superset of the README's inline ones). | Hand-authored. |
| `screenshots/*.png` | The visual narrative. | `tsx scripts/capture-screenshots.ts` against a seeded dev server. |

## Asset conventions

- **Filenames are stable.** The README references them by exact name; the capture script
  writes the same names. Re-running the script overwrites in place.
- **One image, one purpose.** Each screenshot maps to a row in the README showcase with a
  title, what it shows, and why it matters.
- **Light theme.** The app and website ship a light theme today; the token system is built
  to add dark/accessibility themes later (see the UI/UX section of the README).

## Deeper reference docs

Beyond this folder, the repository carries design and architecture references in
[`context/`](../context) (escrow architecture, Food/Education ecosystem maps, user
journeys, runbook, production roadmap) and the gated app-redesign research in
[`webapp-reset/`](../webapp-reset) (foundation, IA, UX research, multi-theme architecture,
accessibility, motion, illustration).
