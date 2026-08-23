# UmojaHub Operational Runbook

**Audience**: On-call engineer or admin handling a production incident  
**Scope**: Zero-budget infrastructure (Vercel Hobby, MongoDB Atlas M0, free-tier services)

---

## 1. Restore from weekly backup

> **⚠ Read this before assuming a backup exists.**
>
> The weekly workflow **never once succeeded** between at least 2026-07-05 and 2026-08-23. Every
> Sunday it failed on its first step with `Input required and not supplied: token`, because
> `BACKUP_REPO_TOKEN` had never been set — so **no archive was ever written**. Confirm the current
> position yourself before relying on anything here:
>
> ```bash
> gh run list --workflow=backup.yml --limit 5
> ```
>
> Investigating the fix turned up something worse: `JafarHussein/umojahub-backups` was **public**.
> Had the token been supplied at any point, this workflow would have pushed a complete dump —
> names, emails, phone numbers, national ID document numbers, bcrypt password hashes and the URL
> of every uploaded verification document — into a public repository. The missing secret was
> accidentally preventing a data breach. The repository is now private, and the workflow refuses
> to run against a public one.

### 1a. Prerequisites — the workflow fails loudly without all of them

| | What | Why |
|---|---|---|
| Repo | `umojahub-backups` must be **private** | Checked against the API before `mongodump` is installed |
| Secret | `BACKUP_REPO_NAME` | `owner/repo` of the backup repository |
| Secret | `BACKUP_REPO_TOKEN` | Fine-grained PAT, that repo only, **Contents: read+write** |
| Secret | `BACKUP_PASSPHRASE` | AES-256 passphrase. **Store it where you can reach it without GitHub — losing it loses every backup it has ever made** |
| Secret | `MONGODB_URI` | The Atlas connection string to dump |
| Atlas | Network Access allows `0.0.0.0/0` | GitHub runners have no stable egress IP. This is the usual reason a dump comes back empty; the workflow rejects any archive under 64KB rather than committing one |

### 1b. Restoring

Archives are **encrypted** `.gz.gpg` files in the private `umojahub-backups` repository, written
every Sunday at 02:00 UTC by `.github/workflows/backup.yml`.

1. Clone the backup repository:
   ```bash
   git clone https://github.com/JafarHussein/umojahub-backups
   cd umojahub-backups
   ```

2. Identify the most recent archive:
   ```bash
   ls -lt backup-*.gz.gpg | head -5
   ```

3. Decrypt it:
   ```bash
   gpg --batch --decrypt --passphrase "$BACKUP_PASSPHRASE" \
       --output backup.gz backup-YYYYMMDD-HHMMSS.gz.gpg
   ```

4. Restore **to a scratch target first**, and count before you trust it:
   ```bash
   mongorestore --uri="<SCRATCH_MONGODB_URI>" --gzip --archive=backup.gz
   ```

5. Verify document counts in the Atlas Data Explorer — `users`, `orders`, `projectengagements`
   and `projectdocumentations` are the four that matter — before switching any traffic.

6. Shred the plaintext when you are done:
   ```bash
   shred -u backup.gz
   ```

**Important.** Restoring overwrites the target. Use a new cluster or an empty database. The archive
covers the state at the last Sunday 02:00 UTC run, so a weekly cadence means **up to seven days of
orders, escrow movements and submitted reports are unrecoverable**. If that window is too wide, the
fix is not a better script — it is a paid Atlas tier with snapshot backups. M0 has none, which is
why this workflow is the whole of the disaster-recovery story.

**Known limitation of using git as the store.** Pruning deletes the working file, but every archive
stays in git history forever, so the backup repository grows by roughly one archive per week
regardless of the prune step. At ~2MB/week that is ~100MB a year — survivable, but it is not a
retention policy. If it becomes a problem, move the archives to release assets, which are not git
objects.

**A backup nobody has restored is a hypothesis.** The workflow proves each archive *parses*
(`mongorestore --dryRun`) before committing it, which is not the same as having seen the data come
back. Do step 4 against a scratch database at least once.

---

## 2. Cancel stuck payment orders

Stuck orders (PENDING_PAYMENT for >15 minutes) are reconciled automatically by the `price-alert-check` cron every 15 minutes. If you need to cancel manually:

**Via MongoDB Atlas Data Explorer:**

1. Open Atlas → Browse Collections → `orders`
2. Filter: `{ "paymentStatus": "PENDING_PAYMENT", "createdAt": { "$lt": { "$date": "<ISO timestamp 15+ min ago>" } } }`
3. For each matching order:
   - Update `paymentStatus` → `"FAILED"`
   - Note the `listingId` and `quantityOrdered`
4. Open the `marketplacelistings` collection
5. For each listing: increment `quantityAvailable` by the order's `quantityOrdered`, set `listingStatus` → `"AVAILABLE"`

**Via curl (preferred — runs the cron manually):**
```bash
curl -X POST https://yourdomain.com/api/cron/price-alert-check \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 3. Rotate Daraja credentials without downtime

1. Obtain new credentials from Safaricom Daraja portal.
2. In Vercel dashboard → Project → Settings → Environment Variables:
   - Update `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY` for the production environment.
   - Leave `MPESA_SHORTCODE` and `MPESA_CALLBACK_URL` unchanged unless Safaricom changes them.
3. Trigger a new Vercel deployment (or redeploy from the Deployments tab) to pick up the new env vars.
4. Test with a KES 1 STK Push to your own phone number to confirm the new credentials work.
5. The in-memory OAuth token cache in `darajaService.ts` expires in 55 minutes — after a redeployment, the first request fetches a new token automatically.

---

## 4. Manually verify a farmer via API

If the admin UI fails (dashboard error, session issue):

```bash
curl -X PATCH https://yourdomain.com/api/admin/verify-farmer \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<admin-session-cookie>" \
  -d '{"farmerId": "<MongoDB ObjectId>", "decision": "APPROVED"}'
```

To reject:
```bash
curl -X PATCH https://yourdomain.com/api/admin/verify-farmer \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<admin-session-cookie>" \
  -d '{"farmerId": "<MongoDB ObjectId>", "decision": "REJECTED", "rejectionReason": "Document unclear"}'
```

Get the admin session cookie from browser DevTools → Application → Cookies → `next-auth.session-token`.

---

## 5. Weekly payment reconciliation

Run every Monday against the previous week's data.

**Steps:**

1. Log in to Safaricom Daraja Business Manager and export the week's successful transactions (CSV).
2. In MongoDB Atlas, run:
   ```json
   db.orders.find({
     "paymentStatus": "PAID",
     "paidAt": { "$gte": ISODate("<Monday 00:00>"), "$lt": ISODate("<Sunday 23:59>") }
   }, { "orderReferenceId": 1, "mpesaTransactionId": 1, "totalAmountKES": 1 })
   ```
3. Cross-reference: every `mpesaTransactionId` in the DB should have a matching receipt in the Daraja export.
4. If an order is marked PAID in the DB but not in Daraja export: contact Safaricom support with the `CheckoutRequestID` and `MpesaReceiptNumber`.
5. If Daraja shows a successful transaction not in the DB: the webhook callback was lost. Manually update the order and restore the payment status.

---

## 6. Respond to Vercel downtime

Vercel Hobby has no SLA. Typical downtime is edge outages or deployment errors.

1. Check [status.vercel.com](https://status.vercel.com) for ongoing incidents.
2. If it is a deployment error: roll back in Vercel dashboard → Deployments → select previous deployment → "Promote to Production".
3. If it is a regional edge outage: no action — Vercel routes to available regions automatically.
4. Notify users via the admin phone number (ADMIN_PHONE_NUMBER) if downtime exceeds 30 minutes.
5. UptimeRobot will have already sent an SMS alert to ADMIN_PHONE_NUMBER when `/api/health` went down.

---

## 7. Upgrade trigger checklist

Move from free to paid when any of these conditions is met:

| Service | Free tier limit | Upgrade trigger | Paid plan |
|---------|----------------|-----------------|-----------|
| MongoDB Atlas M0 | 512MB storage | DB size reaches 400MB | Atlas M10 (~$57/month) |
| MongoDB Atlas M0 | No backups | First financial audit or investor due diligence | Atlas M10 |
| Vercel Hobby | 2 cron jobs | Need >2 scheduled jobs | Vercel Pro ($20/month) |
| Vercel Hobby | 100GB bandwidth | Bandwidth warning emails | Vercel Pro |
| Upstash Redis | 10,000 commands/day | Rate limit count reaches 7,000/day regularly | Upstash Pay-as-you-go |
| Resend | 3,000 emails/month | Monthly email count reaches 2,000 | Resend Starter ($20/month) |
| Axiom | 500MB/day logs | Log ingestion warning | Axiom Hobby ($25/month) |

---

## 8. Redeploy after environment variable changes

Vercel caches env vars at build time. After any env var update:

1. Vercel dashboard → Project → Deployments
2. Find the current production deployment → three-dot menu → "Redeploy"
3. Wait for deployment to complete (typically 2–3 minutes)
4. Confirm `/api/health` returns `{ "status": "ok", "db": true }`

## 9. Dev server throwing ENOENT on a `.next` chunk, or `[object Event]` in the browser

**Cause: `npm run build` was run while `npm run dev` was still running.** They share the same
`.next` directory. The production build rewrites it and deletes the chunks the dev server compiled
on demand, so the next request that lazily `require()`s one of them dies with something like:

```
ENOENT: no such file or directory, open '.next/server/_rsc_src_lib_models_Counter_model_ts.js'
    at generateOrderReferenceId (src/lib/foodhub/orderUtils.ts)
```

In the browser this surfaces as a **Runtime Error reading `[object Event]`** — a failed chunk load
is reported as an `Event`, which the dev overlay cannot stringify into anything useful. The message
says nothing about the real cause, so check the dev server log, not the overlay.

It is not an application defect and nothing in the code needs changing. The lazy model imports it
trips over are required by the serverless cold-start rule and build correctly.

**Fix:**
1. Stop the dev server.
2. `Remove-Item -Recurse -Force .next`
3. `npm run dev`

**Avoid:** do not run `npm run build` while a dev server is up. If you need both, stop dev first, or
build with a separate output directory.
