# Contributing to UmojaHub

This document governs all contributions to the UmojaHub codebase. Read it completely before opening a pull request.

---

## Branch Strategy

```
main        → Production. Protected. Requires PR + passing CI.
develop     → Staging. All feature branches target this.
feature/*   → New features. Branch from develop.
fix/*       → Bug fixes. Branch from develop. If critical, may target main.
chore/*     → Non-functional changes (deps, config, docs).
test/*      → Test additions only.
```

**Branch naming:**
```
feature/auth-setup
feature/farmer-listing-crud
feature/mpesa-stk-push
feature/farm-assistant-groq
fix/daraja-idempotency
fix/trust-score-calculation
chore/update-dependencies
```

Never commit directly to `main` or `develop`.

---

## Commit Message Format

Every commit must follow this format exactly:

```
type(scope): short description in present tense, max 72 chars

Optional body: explain what and why, not how.
```

**Types:**
```
feat     → new feature
fix      → bug fix
chore    → maintenance, deps, config
docs     → documentation only
style    → formatting, no logic change
refactor → code restructure, no behaviour change
test     → adding or fixing tests
perf     → performance improvement
```

**Scopes:**
```
auth · farmer · buyer · student · lecturer · admin
marketplace · knowledge · assistant · prices · groups · suppliers
education · briefs · mentor · peer-review · portfolio · verification
webhooks · db · ui · seed · config · ci
```

**Examples:**
```
feat(auth): add NextAuth credentials provider with 5 role JWT
feat(farmer): add Mongoose model with composite trust score indexes
feat(marketplace): add crop listing CRUD API with Zod validation
feat(daraja): add M-Pesa STK Push initiation and webhook handler
fix(daraja): add idempotency check using mpesaTransactionId unique index
fix(trust): cap transaction score contribution at 25 points
chore(db): add MongoDB connection singleton with pooling for serverless
style(ui): apply design system tokens to FarmerListingCard component
test(trust): add unit tests for farmerTrustCalculator all edge cases
docs(api): add OpenAPI spec for farmer registration endpoint
```

**Banned commit messages:**
```
"fix stuff"
"update"
"changes"
"WIP"
"final"
"final final"
"asdf"
"test commit"
```

---

## Pull Request Rules

1. Every PR targets `develop` (not `main`).
2. PR title follows the same format as commit messages.
3. PR description must include:
   - What this PR does
   - Which section of `EXECUTION_PLAN.md` it implements
   - How to test it
4. CI must pass before merge: type-check, lint, tests, build.
5. No PR merges with TypeScript errors.
6. No PR merges with ESLint errors.
7. No PR merges with failing tests.
8. No PR merges if coverage drops below thresholds.

---

## Code Standards

All code standards are defined in `INSTRUCTIONS.md` and `EXECUTION_PLAN.md`. This section is a summary only.

- TypeScript strict mode. Zero `any` types.
- All API routes follow the pattern in `INSTRUCTIONS.md` §4.2.
- All components use design system tokens. No hardcoded hex values.
- All new Mongoose models have indexes defined in the schema.
- All external API calls have try/catch with graceful degradation.
- No `console.log` in committed code.
- No placeholder text, dummy data, or TODO comments in committed code.

---

## File Creation Rules

Before creating any file, verify it exists in the canonical folder structure in `EXECUTION_PLAN.md` §1.3. If the file is not in the plan, justify its existence in the PR description before creating it.

---

## Testing Requirements

- New business logic in `src/lib/` must have unit tests.
- New API routes must have integration tests covering the happy path, auth failure, and validation failure.
- Test files live adjacent to the file they test in a `__tests__/` folder.
- Run `npm test` before every commit.
