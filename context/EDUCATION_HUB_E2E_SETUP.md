# Education Hub — E2E setup

How to run the Playwright suite on your own machine, and what to do when it complains.

---

## 1. What the E2E environment is

Playwright drives a **production build** of the app on **port 3100**, against a **database of its
own**, with sessions minted directly rather than driven through OAuth.

```
.env.local  →  MONGODB_E2E_URI  →  own database (dropped + rebuilt each run)
                                        │
                        global-setup mints session cookies + writes fixtures
                                        │
              playwright starts `npm run build && npm run start` on :3100
                                        │
                                 the specs run
                                        │
                     global-teardown drops the database again
```

Three things are worth knowing before anything else:

- **The app is built, never `next dev`.** A dev server compiles routes on first request, which put
  38 of 123 tests over the 30-second timeout — they were timing the compiler, not the app. Both CI
  and local now test a build, so a spec means the same thing in both places.
- **The harness never reuses a running server.** It cannot verify which database somebody else's
  server is attached to, and that is the only thing that matters here.
- **There is no fallback to `MONGODB_URI`.** A missing `MONGODB_E2E_URI` stops the run with an
  explanation. A fallback is what used to inject `E2E Unverified Farmer` into the top of the
  administrator's queue in the presentation database.

---

## 2. Which database it uses

`MONGODB_E2E_URI`, and nothing else. It is a **separate database name** — the same cluster as
`MONGODB_URI` is fine, a different database on it is the point:

```
MONGODB_E2E_URI="<same cluster as MONGODB_URI>/umojahub_e2e?<same options>"
```

Two guards stand between the harness and anything real, in `e2e/support/database.ts`:

1. **Distinctness** — checked once in `playwright.config.ts`, while both URIs are still their
   original selves. `MONGODB_E2E_URI` may not address the same host and database as `MONGODB_URI`.
2. **Ownership** — the harness only drops a database it can prove is its own: empty, or carrying
   the `__e2e_harness` marker collection it writes after every drop.

Guard 2 is the one that matters. The worst outcome of a misconfigured URI is a refusal to run.

The whole run — the harness process *and* the app under test — is redirected onto that database by
setting `MONGODB_URI` in both. Setting it in only one would put fixtures in the test database while
the app read the real one.

---

## 3. Configure it once

`.env.local` already carries every other variable the app needs. Add one line:

```
MONGODB_E2E_URI="mongodb+srv://…/umojahub_e2e?retryWrites=true&w=majority"
```

Nothing needs seeding — the harness creates and drops that database itself.

No external service is required for the suite to pass. Cloudinary, OpenAI, Groq, M-Pesa and SMTP are
never called by a spec: the fixtures write records directly, and the one place a stored file is
referenced (`e2e/support/global-setup.ts`, the submitted report versions) uses a `publicId` that
deliberately names no stored object, because the specs assert the document is *offered* and never
fetch it.

---

## 4. Running it

```bash
npm run test:e2e                              # everything, three viewports — what CI runs
npm run test:e2e:fast                         # everything, desktop only — the tight loop
npm run test:e2e:education                     # the Education Hub specs only
npm run test:e2e -- e2e/developer-log.spec.ts  # one spec
npm run test:e2e -- e2e/developer-log.spec.ts --project=desktop   # one spec, one viewport
npm run test:e2e:report                       # open the HTML report from the last run
```

A full three-viewport run takes about **3.5 minutes** on a warm `.next`; a single spec on one
viewport about **1.5**. The first run after a source change pays for the build.

**Read the failure, do not guess at it.** On every failure Playwright writes
`test-results/<test>/error-context.md`, which contains an accessibility snapshot of the page exactly
as it was when the assertion failed — every heading, every role, every visible string. Most spec
failures are answered by that file alone.

---

## 5. Resetting the database

You do not have to. Setup drops it before building fixtures, so a run that crashed before its
teardown cannot poison the next one, and teardown drops it after, so repeated runs never accumulate.

To clear it by hand, drop the database named in `MONGODB_E2E_URI`. The next run recreates it.

---

## 6. How the fixtures work

Everything is written by `e2e/support/global-setup.ts` at fixed ObjectIds, so a spec can address a
record by literal id. Nothing is random: the only non-deterministic values are the harness run id
and session expiry timestamps, neither of which any assertion reads.

Sessions are minted, not driven. The app is OAuth-only, so `global-setup` signs a NextAuth JWT per
role and saves it as Playwright storage state; a spec picks one with
`test.use({ storageState: authFile('lecturer') })`.

### The fixture map, and who owns what

| Fixture | Id | Owns | Why it is its own thing |
|---|---|---|---|
| `student` | minted | engagement `…0020` (IN_PROGRESS), and is the assigned peer reviewer | the developer-log workspace |
| peer author | `…0023` | engagement `…0021` + its documentation | **never created as a user** — the peer-review pane must show no identity |
| report author | `…0031` | engagement `…0024` + its documentation | a real student in the lecturer's institution, so the review queue can see the report |
| `lecturer` / `lecturer-unverified` | minted | — | share institution `…0030` with the two students above |

### The rule that bit hardest

**One student, one active project.** `/api/education/engagements/me` answers "which project is this
student on?" with their most recent *active* one, and the entire student workspace resolves through
it. Giving one student a second active engagement does not fail where you wrote it — it silently
moves another spec's workspace onto a different project, and that spec fails elsewhere with a
missing heading.

`assertOneActiveEngagementPerStudent()` runs at the end of setup and refuses the run, naming the
student and both engagements. If you need another engagement, give it another student.

### Parallelism

`fullyParallel: true`, all three viewports at once, locally. It is safe because **no spec writes**:
they read seeded state and assert on it, and the few that exercise a form stop before submitting.
Two specs deliberately never mutate (`lecturer-review` fills the decision form but never presses
either button). Keep it that way — a spec that writes needs its own fixtures, not a serial suite.

CI runs `workers: 1` for stable visual snapshots, not because parallelism is unsafe.

---

## 7. Troubleshooting

**`MONGODB_E2E_URI is not set — refusing to run the E2E suite.`**
Add it to `.env.local`. See §3. This is the harness protecting your presentation data.

**`MONGODB_E2E_URI addresses the same database as MONGODB_URI`**
Change the database name in the E2E URI. The same cluster is fine.

**`Refusing to use …/x as the E2E database.`**
It holds documents and carries no harness marker, so it is somebody's real database. Point the
variable at a name reserved for testing.

**`http://127.0.0.1:3100/auth/login is already used`**
A previous run was killed and orphaned its server. The harness will not reuse a server it cannot
verify, so clear the port:

```bash
netstat -ano | grep LISTENING | grep :3100     # find the PID
taskkill //PID <pid> //F                       # Windows
```

**A test times out waiting for a locator that is obviously on the page.**
Read `test-results/<test>/error-context.md`. Two common causes, both real:
- *strict mode violation* — the string matches two elements. Use `{ exact: true }`, or
  `getByRole('heading', …)` to name the one you meant.
- *wrong role* — the workspace switcher is a `tablist`, so its items are `tab`, not `button`.

**A landing page test passes but the page is broken.**
It should not any more: `smoke.spec.ts` now asserts `response.ok()`. It previously only asserted "no
redirect", which is true of a 404 page — which is how every lecturer route survived being deleted.

---

## 8. How CI differs

| | Local | CI |
|---|---|---|
| Database | `MONGODB_E2E_URI` from `.env.local` (Atlas database `umojahub_e2e`) | `mongodb://localhost:27017/umojahub-e2e` — a `mongo:7` service container |
| Build | `npm run build && npm run start`, in the webServer command | built in its own step; webServer only serves |
| Workers | all cores | `1` |
| Retries | `0` | `1` |
| Reporter | `list` + html | `github` + html |

The differences are deliberate. CI serialises and retries so visual snapshots are stable on shared
runners; locally you want the whole suite in three minutes and a failure that reproduces on the
first try. The **specs, fixtures and application build are identical**.

The one real gap: locally the E2E database is on Atlas, so the suite needs a network. CI's is a
container on the runner. Both are dedicated databases with the same guards; neither can reach the
development or presentation data.
