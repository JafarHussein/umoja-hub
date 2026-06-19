# UmojaHub App Design System — V1 (RATIFIED)

**Phase 5 gate deliverable.** Ratifies [HIFI_VISUAL_LANGUAGE_V1.md](HIFI_VISUAL_LANGUAGE_V1.md) (the proposal) into a tokenized system. Rationale + Foundation-law citations live in that doc; this is the **canonical token inventory + Figma variable structure**, and the mirror target for the Phase 6 code tokens. Governed by `UMOJAHUB_WEBAPP_FOUNDATION_V1.md`.

Figma source of truth: file `bHjVuFiAzzBQdViTAj2Twh`, page **"Design System"** (`247:2`) — Foundations board `247:3` (Light; flip the board's App Color mode to Dark to preview).

## Token architecture

Two-tier (semantic tokens carry per-mode theme values; a separate primitive layer was deliberately **not** abstracted for a palette this small — revisit only if it grows). Figma **variable collections**:

| Collection | Modes | Holds |
|---|---|---|
| **App Color** (`245:2`) | `Light` (`245:0`) · `Dark` (`245:1`) | 24 semantic color tokens, themed per mode |
| **App Radius** (`245:27`) | `Value` | 4 radius tokens |
| *Spacing* (existing) | `Value` | reused: 4 / 8 / 12 / 16 / 24 / 32 |

Website collections (`Color`/Website mode, `Primitives`) are **untouched** — app and website stay separate.

## Color — App Color (Light / Dark)

| Token | Light | Dark | Scopes |
|---|---|---|---|
| `bg/canvas` | `#F7F6F2` | `#15140F` | fill |
| `bg/card` | `#FFFFFF` | `#1E1C16` | fill |
| `bg/sunken` | `#EEEDE7` | `#100F0B` | fill |
| `border/hairline` | `#E4E2DA` | `#322F26` | stroke |
| `border/strong` | `#CDCAC0` | `#4A463A` | stroke |
| `text/ink` | `#1C1B17` | `#F3F1EA` | text |
| `text/body` | `#45433B` | `#CFCBBE` | text |
| `text/muted` | `#6E6B61` | `#98948A` | text |
| `text/faint` | `#97938A` | `#7C786E` | text |
| `brand` | `#1E5C45` | `#5FB893` | fill·text·stroke |
| `brand/hover` | `#184C39` | `#54A483` | fill |
| `brand/surface` | `#E8F0EB` | `#1C3A2E` | fill |
| `brand/border` | `#BFD6C8` | `#2E5A45` | stroke |
| `murram` | `#B5631F` | `#D98A45` | fill·stroke |
| `murram/surface` | `#F6ECE0` | `#3A2A1B` | fill |
| `success` | `#1E5C45` | `#5FB893` | fill·text·stroke |
| `success/surface` | `#E8F0EB` | `#1C3A2E` | fill |
| `warning` | `#9A5B12` | `#D99A3C` | fill·text·stroke |
| `warning/surface` | `#F7ECDD` | `#3A2C18` | fill |
| `danger` | `#A52A1F` | `#E27A6E` | fill·text·stroke |
| `danger/surface` | `#F7E6E3` | `#3A201C` | fill |
| `info` | `#2C5A73` | `#6FA3C0` | fill·text·stroke |
| `info/surface` | `#E6EDF1` | `#1B2C36` | fill |
| `focus/ring` | `#1E5C45` | `#5FB893` | stroke |

`success == brand` is intentional — one honest meaning-model (green = good/verified/proceed), always paired with icon + shape + text. Dark values are a parallel value-map (no pure `#000`/`#fff`); `text/faint`, `brand/hover`, and the `*-surface` darks were derived at this gate to hold meaning + contrast. Contrast pairings to be axe-validated when the code mirror lands.

## Radius — App Radius

`radius/card` 10 · `radius/control` 8 · `radius/pill` 999 (full) · `radius/cell` 6. Scope: corner-radius.

## Typography (ratified)

Canonical ramp = the applied **`HiFi/*`** text styles (kept as-is to avoid churning 60 hi-fi screens; `MidFi/*` retained only for the preserved mid-fi page). **Hanken Grotesk** (UI) + **Spline Sans Mono** (data/figures only), tabular numerals on all data. Styles: `Display · H1 · H2 · Title · Body · Body Strong · Label · Meta · Nav · Data XL · Data L · Data M` (sizes/weights in the hi-fi doc §1).

## Code mirror (Phase 6)

Mirror App Color → CSS custom properties under a `.theme-app` scope with a `[data-theme="dark"]` (or `.dark`) override, names matching the token paths (`--bg-canvas`, `--text-ink`, `--brand`, `--state-warning`…); radius → `--radius-card` etc.; map to Tailwind via `theme.extend`. Website tokens/fonts stay untouched; build stays green.

## Components

Page **"Components"** (`250:2`). All bound to App Color/Radius variables; validated Light + Dark.

| Component | Node | Variants / properties |
|---|---|---|
| **StatusPill** | `250:18` | `State` = Verified · Pending · In transit · Completed · Denied (tinted pill, icon+shape+text) |
| **VerificationBadge** | `251:11` | `State` = Verified · Pending · Denied (bordered pill — identity verification) |
| **TrustScore** | `251:12` | glance pill `◆ Verified · Trust NN`; `Score` TEXT property (mono number) |
| **DeliveryConfidence** | `252:12` | `State` = Building (no %) · Established (`NN%` mono + denominator + "not an estimate") |
| **DecisionAttribution** | `254:2` | named human + evidence; `Reviewer` · `Date` · `Basis` TEXT properties |
| **Button** | `257:27` | `Variant` (Primary·Secondary·Ghost·Danger) × `State` (Default·Hover·Disabled); `Label` TEXT prop |
| **Input** | `258:18` | `State` = Default · Focus (brand 2px) · Error (danger) · Disabled; label above field |
| **Card** | `258:19` | surface container, mono price |
| **Nav item** | `259:8` | `State` = Default · Active (brand-surface pill) |
| **Tab** | `259:15` | `State` = Default · Active (brand underline) |
| **Table row** | `260:10` | `State` = Default · Hover; mono figure cells, bottom hairline |
| **Modal / Sheet** | `262:3` | floating panel; `Elevation/Float` effect style; composes Button instances |

Extra token added with Button: `text/on-brand` (Light `#FFFFFF` / Dark `#15140F`, TEXT scope) for text on brand/danger fills → **25** color tokens. Effect style **`Elevation/Float`** = warm-tinted shadow `0 1px 2px rgba(28,27,23,.05), 0 8px 24px rgba(28,27,23,.08)` (floating layers only).

## Status / next

- [x] Token foundation: App Color (Light/Dark, 24) + App Radius (4) variables; typography ratified; Foundations board built + validated both themes.
- [x] **Trust components** (the heart): StatusPill, VerificationBadge, TrustScore, DeliveryConfidence, DecisionAttribution — built with variants/properties + bound variables, validated Light + Dark.
- [x] **Base components** — Button, Input, Card, Nav item, Table row, Tab, Modal/Sheet — built with variants + bound App Color/Radius variables, validated Light + Dark (Button `text/on-brand` ink + Modal `Elevation/Float` confirmed on dark canvas).
- [ ] **Phase 5 gate** — design system complete; awaiting owner sign-off to advance to Phase 6 (code mirror).
- [ ] Code mirror (Phase 6).
