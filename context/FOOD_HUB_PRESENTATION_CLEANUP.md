# Food Hub — presentation cleanup and E2E database isolation

Closing record for the Food Hub presentation audit. Dated **2026-08-17**, branch
`fix/demo-seed-determinism`. This is a reliability and environment document: no feature was added,
no workflow was redesigned, and the Food Hub's behaviour is unchanged except where a defect made it
unreliable.

The question it answers: **if the demo runs tomorrow and the Food Hub is used normally in front of
a panel, is the environment isolated, clean, reproducible, and safe from the E2E contamination
problem?**

---

## 1 · The problem

Running the automated test suite changed the database used for the demonstration.

Observed before this work, on the administrator's own screens:

- **`E2E Unverified Farmer`** sat at the top of the verification queue, with a blank county and `—`
  where the identity document should be.
- **`E2E-FAR-0002`** sat at the top of the mediation queue, reading *"Farmer: Unknown farmer"*.
- **`E2E Sukuma Wiki — Grade A`** from *"E2E Farmer"* appeared in the public marketplace.

Those are the two screens a panel is most likely to be shown. Worse, the contamination was not a
one-off residue that could be cleared before a demonstration: it came back by itself on the next
test run.

Measured baseline: **26 contaminated documents**, plus **6 orders with no buyer, 7 orders with no
farmer and 2 mediations with no farmer** — dangling references the fixtures create deliberately.

## 2 · Root cause of O3

`e2e/support/global-setup.ts` called `connectDB()`, which reads **`MONGODB_URI`** — the same
variable the development server and the demo seeder use. Locally that is the presentation database.
The harness then upserted, by design, seven users, three orders, a marketplace listing, a mediation
request, a farmer group, a group order, a verified supplier, three project engagements, a peer
review and a withdrawal request.

There was **no `globalTeardown`** — the Playwright config declared only `globalSetup`. The fixtures
were written to be idempotent and were simply left in place, on the assumption recorded in
`e2e/support/auth.ts` that they "never touch the seed data set and are safe to run against any
database". That assumption was the defect: safe against *collisions* is not the same as *invisible*,
and an administrator's queue sorts a fixture to the top exactly as it sorts a real record.

CI was never affected — `.github/workflows/e2e.yml` already pointed at an ephemeral
`mongodb://localhost:27017/umojahub-e2e`. **This was a local-only contamination**, which is why it
survived so long: the failure could only be seen on the machine the demonstration runs from.

## 3 · Chosen isolation architecture

The harness owns a database of its own, and cannot reach any other.

```
MONGODB_URI            ->  presentation / development database  (demo world, never touched by tests)
MONGODB_E2E_URI        ->  harness database                     (created, used, and DROPPED per run)
```

`playwright.config.ts` resolves `MONGODB_E2E_URI` at config-load time and **redirects
`process.env.MONGODB_URI` onto it for the whole run** — both for its own process, which runs global
setup and teardown, and for the web server it starts, via `webServer.env`. Redirecting one variable
moves everything, because `connectDB()` and every model already read it. Redirecting only the
harness process would have been worse than doing nothing: fixtures would land in the test database
while the application under test kept reading the demo one.

Two further decisions follow from the same goal:

- **The harness runs on port 3100**, not 3000, so it can never be confused with a `npm run dev`
  serving the demo database.
- **`reuseExistingServer: false`.** A server already listening was started by something else, and
  the one thing that cannot be verified about it is which database it is connected to — which is
  the only thing that matters here.

## 4 · Files changed

| File | Change |
| --- | --- |
| `e2e/support/database.ts` | **New.** Resolves the E2E URI, both guards, bare-connection ownership check, drop, marker. |
| `e2e/support/global-teardown.ts` | **New.** Drops the harness database and removes minted sessions. |
| `e2e/support/global-setup.ts` | Drops and claims the harness database before building fixtures. Fixtures themselves unchanged. |
| `playwright.config.ts` | Requires + redirects the E2E database, registers teardown, port 3100, no server reuse, built app instead of `next dev`. |
| `.env.local.example` | Documents `MONGODB_E2E_URI`. |
| `.github/workflows/e2e.yml` | Adds `MONGODB_E2E_URI`; `MONGODB_URI` given a distinct name so the guard is meaningful in CI too. |
| `scripts/demo/reset.ts` | **`clearOrphanedRecords()`** — removes records whose owner no longer exists (see §10). |
| `scripts/demo/cli.ts` | Runs that sweep as part of `demo` and `demo:reset`. |

Two fixes made earlier on this branch stand unchanged: `72daae2` (D10) and `dda13a2` (D11).

## 5 · Environment variables required

```
MONGODB_E2E_URI      # Playwright only. Never read by the application.
```

Not added to `src/lib/env.ts` — it is test infrastructure, and the application must not require it
to boot. Documented in `.env.local.example`. Locally it is the same Atlas cluster with a different
database name (`umojahub_e2e`); the presentation database is the cluster default, `test`.

No credential appears in source, in the workflow, or in any error message: failures identify a
database as `host/database` with the credentials stripped (`describeUri`).

## 6 · How E2E tests now connect

1. `playwright.config.ts` loads `.env.local`, resolves `MONGODB_E2E_URI`, and **throws with an
   explanation** if it is missing.
2. It checks the harness database is not the application's, then redirects `MONGODB_URI`.
3. `globalSetup` proves ownership, **drops** the database, connects, writes the marker, and builds
   the fixtures.
4. The web server is started by Playwright on port 3100 with the same redirected `MONGODB_URI`.
5. `globalTeardown` proves ownership again and drops the database.

## 7 · How teardown works

`globalTeardown` drops the harness database and deletes `e2e/.auth/` — those minted cookies
authenticate users that no longer exist, and keeping them only invites a confusing failure later.

Setup **also** drops, before building. That is not redundant: a run killed mid-flight never reaches
its teardown, so dropping on the way in is what makes the next run deterministic regardless of how
the last one ended. Repeated runs cannot accumulate anything.

A teardown that throws would fail an otherwise green run, so cleanup errors are reported and
swallowed. The ownership guard refuses *before* deleting, so a refusal is printed loudly and the
database is left exactly as it was.

## 8 · How accidental demo-database usage is prevented

**There is no fallback.** `MONGODB_E2E_URI || MONGODB_URI` is precisely the behaviour that caused
this problem; a missing variable is loud instead.

**Guard 1 — the URIs must differ.** Compared once, in the config, while both values are still their
own. (Checked there rather than in setup because the config redirects `MONGODB_URI`, so from the
second evaluation onward the two are equal by construction — a guard reading the live value fires
on every correct run and never on a broken one. This was found by testing, not by reasoning: the
first implementation did exactly that and failed 38 tests.)

**Guard 2 — the harness only drops what it owns.** A database qualifies if it is empty, carries the
`__e2e_harness` marker, or contains **no documents at all**. Anything else is refused, untouched.

Guard 2 is the one that matters: the worst outcome of a misconfigured URI is a refusal to run,
never a dropped presentation. Two details make it real rather than nominal:

- The check runs on a **bare connection with no models bound**, before `connectDB()`. An earlier
  version checked after connecting and left **eleven empty collections** in the database it then
  refused to touch — Mongoose builds indexes on connect, and that creates collections. A guard that
  writes is not a guard.
- Ownership is decided on **documents, not collection names**, because Playwright starts the web
  server *before* global setup: the application connects first and creates an empty collection per
  model. Judging by collection count made the harness refuse the very database it owned.

## 9 · D10 verification — the payout collision

**Not assumed. Re-run.** `npm run demo` executed **four consecutive times**, each with an
independently derived seed (`1202461904`, `1937277823`, `2196568379`, `2646436063`):

| Run | Seed | Result | Validation | Farmers with >1 open payout |
| --- | --- | --- | --- | --- |
| 1 | 1202461904 | exit 0, 2701 docs | 39/39 passed | 0 |
| 2 | 1937277823 | exit 0, 2158 docs | 39/39 passed | 0 |
| 3 | 2196568379 | exit 0, 2531 docs | 39/39 passed | 0 |
| 4 | 2646436063 | exit 0, 2736 docs | 39/39 passed | 0 |

Each run reset the previous one completely — totals stayed in the 2.1–2.9k range rather than
growing, so no partial state accumulated. Multiple farmers received payout records in every run.

The constraint itself was verified **in the database**, not just in the schema:

```
withdrawalrequests   farmerId_1   key={"farmerId":1}   unique=true   partial={"status":"REQUESTED"}
```

The rule was **not weakened to make the seeder pass** — it cannot be. It exists because a farmer
with two open requests could be paid twice for the same balance; the generator was changed to obey
it. Under the old code the collision arose about 9% of the time per eligible farmer and killed
roughly half of all runs, so four clean runs is roughly a 1-in-40 outcome by chance alone —
alongside a generator that is now structurally incapable of emitting two open requests for one
farmer.

## 10 · D11 verification — the retired model

**Reproduced deliberately.** Two ledger rows naming `NgoOrganization` — confirmed unregistered
(`mongoose.modelNames()` does not contain it) — were planted into the live run's ledger, exactly
the condition that once killed the reset. Then `npm run demo:reset`:

```
[demo] clearing 1 previous run(s)...
[demo]   NgoOrganization: SKIPPED — no such model is registered any more (2 ids left in place)
[demo] reset run demo-20260817125151-9m9e12 — removed 3032 documents + the run record.
[demo] clearing leftovers from the retired seed script...
exit=0
```

Verified: the retired model is **skipped and reported**, not silently ignored; the reset did **not**
stop halfway (3032 of 3034 — the two skipped are the planted phantom ids); current models reset
correctly; a subsequent seed and demo work.

**One gap D11 did not cover, found here and closed.** The reset removes exactly what its ledger
tracked, which is the right rule — and anything created through the *running application* is in no
ledger. Placing an order during this smoke test and then rebuilding the world left that order
behind, pointing at a buyer and a farmer who had both been replaced. That is the same shape as the
original wreckage, and it is how the mediation queue came to read *"Farmer: Unknown farmer"*.

`clearOrphanedRecords()` now runs as part of `demo` and `demo:reset`. It is safe by construction
rather than by fingerprint: a record is removed only when the user it belongs to cannot be found,
and a genuine user's records always have their user. On the verification run it removed exactly the
two orders placed during the smoke test, their escrow event, and their two notifications.

**Result: after a reset there are no orphaned users, listings or orders, and no record references a
nonexistent user.**

## 11 · E2E isolation test results

The presentation database was snapshotted before and after, field by field — every collection
count, every role tally, every order state, every scan result and every integrity figure.

| Scenario | Presentation database |
| --- | --- |
| Full suite, 123 tests, all passing | **IDENTICAL** |
| Deliberately failing spec | **IDENTICAL** |
| Run killed mid-flight | **IDENTICAL** |
| Recovery run over a dirty database | **IDENTICAL** |

The fail-safes were each tested by breaking the configuration on purpose:

| Test | Result |
| --- | --- |
| `MONGODB_E2E_URI` removed from `.env.local` | Refused before starting: *"MONGODB_E2E_URI is not set — refusing to run the E2E suite."* |
| `MONGODB_E2E_URI` set equal to `MONGODB_URI` | Refused: *"addresses the same database as MONGODB_URI"*, no credentials printed |
| Pointed at a populated database it does not own | Refused: *"It holds documents … Nothing was changed."* Decoy verified afterwards: **2 collections, 3 documents, untouched** |

**Failure recovery.** A deliberately failing spec still tore down cleanly — harness database left
at 0 collections, presentation database identical. A dirty state was then planted (a stale
`__e2e_harness` marker from an "interrupted run" plus 4 leftover documents); the next ordinary run
**passed 8/8**, the leftovers were gone, and teardown dropped the database. A failed or killed run
does not make future runs unusable.

## 12 · Database contamination test results

| | Before | After |
| --- | --- | --- |
| Contaminated documents | 26 | **0** |
| Orders with missing buyer | 6 | **0** |
| Orders with missing farmer | 7 | **0** |
| Mediations with missing farmer | 2 | **0** |
| Farmers with >1 open payout | 0 | **0** |

Scanned for `E2E`, `e2e+`, `Playwright`, `Test User`, `Test Farmer`, `Test Buyer`, `Fixture`,
`Automated Test`, `Dummy`, `Placeholder`, `umojahub.test` and `Unknown farmer` across users,
listings, orders, mediations, suppliers, groups, group orders, engagements and notifications.

**The source was fixed first.** The historical residue — everything written by every run made
before the isolation existed — was then removed once, by fingerprint: the harness's own users
(`@umojahub.test`), everything referencing them, its fixed-name and fixed-id fixtures, and the
collection of the retired `NgoOrganization` model. That removal was possible only because nothing
can put them back.

## 13 · Clean presentation database state

`=== APP DATABASE :: test ===` · **2806 documents across 35 collections** · contamination scan
**CLEAN** · referential integrity **0 orphans in every category**.

| | |
| --- | --- |
| **Users** | 59 total — 21 FARMER, 13 BUYER, 15 STUDENT, 5 LECTURER, 4 INSTITUTION, 1 ADMIN |
| **Farmer verification** | 18 APPROVED, 3 PENDING (the live approval demo) |
| **Listings** | 47 — 29 AVAILABLE, 18 SOLD_OUT · 38 verified, 9 unverified |
| **Orders** | 219 — 176 PAID, 30 FAILED, 13 REFUNDED |
| **Fulfilment** | 143 COMPLETED, 33 IN_FULFILLMENT, 30 AWAITING_PAYMENT, 13 DISPUTED |
| **Escrow ledger** | 189 HELD, 143 RELEASED, 13 REFUND_ISSUED |
| **Payments** | 221 simulated payments delivered · 663 payment event log entries |
| **Payouts** | 24 requests — 10 PAID, 6 REQUESTED, 5 APPROVED, 3 REJECTED |
| **Mediation** | 21 — 8 OPEN, 13 RESOLVED |
| **Verification records** | 33 audit log entries |
| **Notifications** | 359 |
| **Price intelligence** | 210 market insights over 238 price-history records · 7 price alerts |
| **Trust & ratings** | 18 trust scores, 115 ratings |
| **Suppliers / groups** | 7 verified suppliers, 3 farmer groups, 3 group orders |
| **Knowledge** | 5 articles |

The world is realistic, not sanitised: failed payments, refunds, disputes and rejected payouts are
all present, because a marketplace with none of them is not believable.

## 14 · Final Food Hub smoke-test results

Driven in a real browser against the clean presentation database, through a dev server on port
3000 — deliberately not the isolated harness, since the point was to exercise the environment the
panel will see. **All 18 requested steps, all passing.**

| Step | Result |
| --- | --- |
| 1–2 · Marketplace as an anonymous visitor | Renders, produce count shown |
| 3 · Search and filter | `tomatoes` narrows; nonsense query gives a clean empty state |
| 4–5 · Sign in, role recognised | Farmer lands on `/dashboard/farmer/listings` |
| 6 · Farmer surfaces | Listings, orders, ledger, prices all render with real figures |
| 7 · Unverified farmer | Publication blocked: *"Your verification is being reviewed"* |
| 8 · Farmer listing workflow | "My Produce" with pause/reactivate and "Add produce" |
| 9–10 · Buyer marketplace and listing detail | Both render, with price guidance |
| 11 · Real order through the supported flow | Placed via checkout and the payment simulator |
| 12 · Payment state | First attempt **failed** — reported honestly: *"This payment did not go through. Nothing left your account."* with a retry path. A second order **succeeded**: *"Amount paid KSh 34"*, M-Pesa receipt `ALSSFFHS09`, "Simulated payment" badge |
| 13 · Escrow state | *"Held by UmojaHub until you confirm the produce arrived. Chebet has not been paid."* Release gated behind "Mark as received" |
| 14 · Administrator visibility | Verification queue, escrow (KSh 1,357,714 held across 42 orders), payouts, mediation — asserted free of any test-infrastructure wording |
| 15 · Notifications | 359 present in the clean world |
| 16–18 · Logout, sign back in | Logout redirects a guarded page to `/auth/login?callbackUrl=…` — intent preserved — and signing back in restores the correct role and data |

Three apparent failures during this smoke test were **the probe's faults, not the app's**, and are
recorded so they are not chased again:

- **"Eight payment retries all failed."** Every retry returned **HTTP 429**. The order route caps a
  buyer at five orders an hour; the automation had spent the allowance. The platform correctly
  refusing to be hammered. Re-run as a second buyer, the first payment succeeded.
- **"Sign out does nothing."** The control carries `role="menuitem"`, which overrides the implicit
  button role — correct ARIA, wrong selector. `GET /api/auth/signout` only renders NextAuth's
  confirmation page, so the fallback silently proved nothing.
- **"No `h1` on the marketplace."** True, and left alone — see §18.

## 15 · Test suite results

| Check | Result |
| --- | --- |
| `npm run type-check` | **Pass** — 0 errors |
| `npm run lint` | **Pass** — 0 errors, 5 pre-existing warnings (3 `no-console` in a figure-render script, 2 `next/image` in website/knowledge components) |
| `npm run test` | **1261 passed / 109 suites**, 0 failures |
| `npm run test:e2e` | **121 passed, 2 skipped, 0 failed** (3.8 min) |

The E2E suite failed 38 tests once during this work, and the cause was recorded rather than
suppressed: with server reuse removed, `next dev` compiled routes on demand and pushed tests past
the 30-second timeout — worst on the first project to reach each route, tapering as later ones found
it warm. Nothing was wrong with those tests; they were timing the compiler. CI has always tested a
production build, which is why it stayed green. **The local harness now builds too**, so a spec
means the same thing in both places. Runtime fell from 12.6 minutes to 3.8, and no test was
weakened, skipped or deleted.

## 16 · Build results

`npm run build` — **exit 0**. Compiled successfully in 10.7s; **116 static pages generated**;
middleware 56.2 kB. Two `next/image` warnings, the same pre-existing pair lint reports, in the
website and knowledge components that are out of scope for the app reset. The Mongoose
duplicate-index warnings appear here too — noisy, harmless, filed under POST-PRESENTATION.

The build is also exercised on every E2E run now, since the harness serves a production build
rather than `next dev`.

**Final isolation proof.** With the clean world in place, the *entire* gate was run — type-check,
lint, 1261 unit tests, 123 E2E tests, and a production build — and the presentation database was
snapshotted again afterwards:

> **IDENTICAL.** Every collection count, role tally, order state, escrow figure, scan result and
> integrity number unchanged.

## 17 · Remaining known issues

- **The Daraja query path has never met the live API** (O4 in the audit register). `PAYMENT_PROVIDER`
  defaults to `simulation`; the query leg is unit-tested but never executed against Safaricom.
- **An unresolved payment has no administrator action** — the queue is read-only by design, and
  `UNRESOLVED` has no metric.
- **The marketplace Verified-badge decision** from PR #63 is still open. Deliberately untouched.
- **The presentation database is named `test`** — the MongoDB default, because `MONGODB_URI` carries
  no database name in its path. Harmless, and left alone: changing it before a demonstration would
  risk far more than it fixes.

## 18 · Intentionally left unchanged

- **The Education Hub** — not examined, not modified.
- **Every Food Hub workflow that works** — no redesign of marketplace cards, payment pages, escrow,
  or any screen.
- **The E2E fixtures themselves.** Only where they are written changed, not what they are.
- **The marketplace has no `h1`.** It opens straight into filters and the feed. A real accessibility
  observation, filed under POST-PRESENTATION and untouched during the freeze.
- **`escroweventlogs` has no `event` field** (it is `eventType`) — that was a flaw in the temporary
  audit tool, not in the application.

### POST-PRESENTATION

1. Give the public marketplace a level-1 heading.
2. Consider whether the presentation database should carry an explicit name rather than defaulting
   to `test`.
3. Resolve the duplicate Mongoose schema-index warnings (`User.email`, `Order.mpesaTransactionId`,
   `Order.orderReferenceId`, `FarmerTrustScore`) — noisy on every boot, harmless.
4. Decide the marketplace Verified badge (carried over from PR #63).

## 19 · Final presentation readiness assessment

**Isolated.** The harness has its own database, cannot fall back to the demo one, refuses to run
without one, and refuses to touch a database it cannot prove it owns. Proven by breaking the
configuration three different ways and watching it stop each time — once against a populated decoy
that was afterwards verified byte-for-byte intact.

**Clean.** Zero test-infrastructure artifacts and zero orphaned records, from a database rebuilt by
the project's own `npm run demo`. Nothing was hand-patched into place: the source was fixed, the
historical residue removed once, and the world regenerated.

**Reproducible.** Four consecutive seeds, all green, all validating 39/39, with no accumulation
between them. The reset survives a retired model, and now also clears what a live demonstration
leaves behind — so the world can be rebuilt immediately before the panel arrives, as many times as
wanted.

**Safe.** Running the entire test suite — passing, failing, or killed halfway — leaves the
presentation database bit-for-bit unchanged.

**Answer: yes.** The one operational note worth keeping: the presentation database is rebuilt with
`npm run demo`, and that is now the only thing that changes it.
