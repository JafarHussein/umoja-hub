# Decision Record 03/08-C — Group Token Join (amended)

**Topic:** how farmers join a cooperative (`FarmerGroup`) and what the Group Operations hub exposes.

**Status:** v1.1 — amended to match the shipped models and endpoints (BE-06, BE-07, FIX-06). Supersedes the original 03/08-C.

---

## Amendments applied

1. **Ownership field is `createdBy`, not `manager`.** `FarmerGroup` (`src/lib/models/FarmerGroup.model.ts`) has `createdBy: ObjectId` (+ `members`, `memberCount`, `status`). There is no `manager` field. The "manager variant" of the hub keys off `createdBy === session.user.id`.
2. **Strike "absence of membership endpoints" rationale.** A membership write path exists and is atomic: `PATCH /api/groups/[groupId]` performs `$addToSet`/`$inc` (ADD/REMOVE), and `POST /api/groups/redeem-token` reuses the same write. Any reasoning that assumed no endpoint is void.
3. **Strike "regional cooperative analytics feed."** There is no data source for cross-group regional analytics. Replace it with an **own-group read-only view** (the group's roster and its `GroupOrder` state histories) — nothing aggregated across groups.
4. **Strike the per-member "active flag."** Members are simply present in `members[]`; there is no per-member active/inactive status. Pre-FIX-06 unverified members remain in rosters but cannot join/propose orders.
5. **Append the GroupJoinToken prerequisite list** (below).

---

## Decision (corrected)

- Joining a group is **out-of-band**: an admin mints a single-use token (`POST /api/admin/group-tokens`) and distributes it via SMS; a **verified** farmer redeems it (`POST /api/groups/redeem-token`). Redemption is the only self-service path into a roster.
- The FIX-06 verified-farmer gate applies to **all** membership writes (ADD, group-order PROPOSE, group-order JOIN, and token redemption) → 403 `FARMER_NOT_VERIFIED`.
- The Group Operations hub (UI-04) is **read-only**: roster + `GroupOrder` histories; a manager variant (when `createdBy` matches) but **no** interactive member controls and **no** per-member payment badges. Plain-text notice: "payment coordinated off-platform".

## GroupJoinToken prerequisite list

`GroupJoinToken` (`src/lib/models/GroupJoinToken.model.ts`) must provide, and does:

- `token` — uppercase, unique-indexed, server-generated (8-char unambiguous charset).
- `groupId`, `mintedBy`, `expiresAt`.
- `redeemedBy` (default `null`), `redeemedAt`.
- **Single-use** enforced at redemption via the atomic `redeemedBy: null` guard.
- Rows are **never deleted** after redemption/expiry — they are the join audit trail.

Redemption order of checks: verified-farmer gate → token exists → not already redeemed → not expired → group ACTIVE → not already a member → member cap → atomic claim → roster `$addToSet`/`$inc`.
