# Illustration Plan — Sign-in, Sign-up & Onboarding

**Owner-directed (2026-06-17).** Operationalizes [08 Illustration Strategy](08_ILLUSTRATION_STRATEGY.md) for the highest-stakes illustration surfaces, using the owner's approved resource list. **Rule (Foundation §12): every illustration has a job; none are random.**

---

> ## AMENDMENT — 2026-08-03 (owner-directed)
>
> **The role-card character illustrations are withdrawn.** The ON-02 Intent row
> below specified one Humaaans character per role, to help users self-identify by
> depicting their real context. In the built screen those characters competed with
> the text for attention on the one decision that has to be quick and unambiguous,
> and four figures at 56×80 could not carry enough detail to do the identifying
> job the plan claimed for them. They are replaced by **Lucide icons at icon
> weight** — scanning aids, not depictions — with the role name and description
> carrying the meaning.
>
> **Everything else in this plan stands.** In particular ON-09 (verification
> handoff) and X-01 (sign-in) keep their concept illustrations: those reduce a
> named anxiety rather than decorate a choice, and the Gate-1 finding behind ON-09
> has not changed.
>
> The cultural-authenticity guardrails below remain binding for every illustration
> that survives, and for any future character work.
>
> See [AUTH_ONBOARDING_FLOW_V3](AUTH_ONBOARDING_FLOW_V3.md) §7.

---

## Resource routing (which library for which kind of illustration)

| Use | Resource(s) | Why |
|---|---|---|
| **Characters** (farmer, buyer, student, lecturer) | **Humaaans**, **Blush**, **Open Doodles** | Customizable → **Kenyan cultural authenticity** (skin tone, dress, context). Humaaans explicitly supports farmers/buyers/students/lecturers. **Do NOT use unDraw for characters** — its defaults skew Western/generic. |
| **Concepts** (verification, trust, security, payment, agreement, success) | **unDraw**, **Storyset** | Clean SVG concept scenes; colours customizable to the (future) brand. |
| **Community / cooperative / education warmth** | **Open Doodles** | Hand-drawn, warm, fits cooperatives/NGO/education tone. |
| **Animated states** (success, loading, micro-interactions) | **LottieFiles**, **Storyset** | Motion for success/verification-complete/loading — **must honour reduced-motion + perf** (deliverable 09): lightweight, static fallback. |
| **Brand-adapted / gradient** | **IRA Design**, **Blush** | When colours must match the brand system (decided at Design System gate). |

**Performance (deliverable 08):** SVG, optimized, lazy, 2G-safe. Lottie only where motion does a job, with a static fallback.

## Screen-by-screen — illustration + its job

| Screen | Illustration JOB | Source · concept to pick |
|---|---|---|
| **X-01 Sign in** | Lower the stakes, signal legitimacy & safety (not a cold lock) | Storyset/unDraw — "secure login / authentication / welcome." Warm, trustworthy. |
| **ON-01 Welcome** | Warmth + belonging: "this platform is for people like me" | **Humaaans** — a Kenyan **farmer + student** standing together (authentic). |
| **ON-02 Intent** ("what brings you?") | Help users **self-identify** by depicting their real context | **Humaaans** — one small character per intent: farmer-with-produce · buyer · student-at-laptop · lecturer. Authenticity is critical here. |
| **ON-03 Education** ("how trust works") | **Explain the trust chain visually** (ID → check → badge → reputation) | **Storyset** — "verification / process / agreement"; a small 3-beat sequence. |
| **ON-04 Role confirmation** | Affirm + warmth ("you're a Farmer") | **Humaaans** — the chosen role character + a subtle success cue. |
| **ON-08 Role setup** (farmer) | Guide the task (farm/produce details) | unDraw/Storyset — "farming / harvest / listing." |
| **ON-09 Verification handoff** | **Reduce the #1 anxiety: handing over an ID** — show it's safe & fingerprinted | **Storyset/unDraw** — "data security / privacy / protected document." The single most important illustration in the flow (Gate-1 farmer fear). |
| **ON-10 Done / first-run** | Success + momentum into the app | **LottieFiles** success animation (static fallback) + Humaaans character. |
| **Empty / loading / error** (shared) | Soften dead-ends; guide to populate; recover | unDraw (empty/error) · LottieFiles (loading). |

## Cultural-authenticity guardrails (non-negotiable, deliverable 08)

- Characters depict **Kenyan farmers/students** — appropriate skin tones, dress, and context (markets, produce, laptops). Built/customized in Humaaans/Blush, **never generic Western defaults**.
- Concept scenes recoloured to the brand (at the Design System gate); no off-the-shelf purple/blue.
- Every illustration must pass: *does it explain, guide, reduce anxiety, or build trust?* If not, it's cut.

## Sourcing mechanism (how they actually get into Figma)

- **unDraw / Storyset / Open Doodles** export **SVG** → I import via `createNodeFromSvg`. Some I can fetch directly; for specific picks, exporting from the site (they're free) and dropping the SVG into the Figma file is the reliable path.
- **Humaaans / Blush** are *builders/generators* — characters are composed on the site and exported as SVG/PNG. These need an export step (best place to lock cultural authenticity).
- **LottieFiles** → Lottie JSON for the *code* build; in Figma use a still frame.
- For lo-fi/mid-fi I place the **chosen** illustration (or a clearly-labelled stand-in with the exact pick named); final optimized SVGs land by the hi-fi/Design-System gate.

## Next

On approval, I rebuild the sign-in + onboarding wireframes **with these specific illustrations placed** (real where fetchable, named stand-ins otherwise), so they stop being grey boxes and start doing their jobs.
