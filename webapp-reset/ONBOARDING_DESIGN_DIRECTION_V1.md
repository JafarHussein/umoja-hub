# Onboarding Design Direction — V1

**Owner-directed (2026-06-17).** Replaces the current role-first wizard (`role-selection → identity-input → verification-upload`). Status: **capture for confirmation.** Governed by the [Foundation](UMOJAHUB_WEBAPP_FOUNDATION_V1.md).

## Philosophy

**Onboarding teaches and listens — it does not interrogate.** It **educates** the user about the platform, **gathers context conversationally without feeling like a survey**, and treats **role selection as the conclusion, not the first question.** The user should understand UmojaHub *before* they're asked to commit to a role.

> Selecting a role is the last thing, not the first.

## Principles

1. **Conversational, one thing at a time.** Never a form wall. Each step is a single, warm, plain-language moment — closer to a guided introduction than a questionnaire.
2. **The platform explains itself as you go.** Short, illustrated education interludes interleave with the questions: *how trust works here · what verification gives you · what the platform will not pretend to do* (honesty, Foundation §3.2).
3. **Every ask has a payoff, framed for the user.** We never collect data "because we need it." We ask because it *helps them* ("so we can connect you to buyers near you"). If an ask has no user-facing payoff, we don't make it.
4. **Role emerges, it isn't picked cold.** We learn intent through conversation ("what brings you here?"), educate, and then *confirm* the role at the end — informed, not guessed.
5. **Progressive & resumable.** Don't front-load. Works on a slow phone in few steps; can be paused and resumed (Gate-1 farmers are the highest drop-off risk).

## Proposed flow (confirm / adjust)

```
1. Welcome            warm intro; one line on what UmojaHub is; set expectation
2. Context (conversational, role-agnostic, each with a "why it helps you"):
      · Language       (also a real access decision — Foundation §15)
      · Location       (county — "to connect you with people near you")
      · "What brings you here?"   (sell produce / buy produce / build a verified
                                   build real projects / review student work) — intent surfaces
                                   the role WITHOUT a cold "pick a role"
3. Education interludes   short illustrated explainers, tailored as intent clarifies
                          (how trust works · what verification gives you · honest limits)
4. Role confirmation (LAST)  "From what you've told us, you're here to ___. Right?"
5. Role-specific setup    only now: farmer (farm/produce), student (institution),
                          lecturer (credentials), buyer (buying context)
6. Verification handoff   explain what/why + "what happens to your documents"
                          (reduce the top farmer anxiety) → the verification step
7. Land in role home      gentle first-run, not an empty dashboard
```

## Tone & craft

- Plain, warm, honest. Never salesy, never urgent.
- **Illustration does real work here** (Foundation §12): warmth at welcome, reducing anxiety at verification, explaining trust visually.
- **Respects the backend reality:** sign-in *is* sign-up (OAuth); this flow runs post-auth. Provider↔role constraints (e.g. GitHub→student) still hold and are handled gracefully, not surfaced as errors.

## Open / to confirm

- **Format:** chat-style conversation vs. one-question-per-screen with warmth? (Both can feel non-survey; chat leans more "conversational" but is heavier to build/localize.)
- **Exact context fields** to collect before role (proposed: language, location, intent — anything else?).
- **How much education** in-flow vs. discoverable later (don't bloat the funnel).
- **Language** support itself (English-only vs. Swahili) — the Foundation §16 open question; affects this flow most directly.

## What this changes

- Replaces the role-first wizard; updates the **IA onboarding section** and the journey map's onboarding screens.
- Role selection moves from step 1 → the end (post-education, post-context).
