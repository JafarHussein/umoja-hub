# UmojaHub — Application Onboarding Architecture (v1.1)

**Jurisdiction:** authenticated app shell, `/onboarding/*`. Reconciled against the shipped auth migration (AUTH-01…07).

**Status:** v1.1 — onboarding is OAuth-first and fully implemented. This document is the field-by-field source of truth.

---

## 0. Corrections applied

1. Onboarding is **progressive and OAuth-only** — no password/registration path exists (CredentialsProvider removed, AUTH-07).
2. **Buyer KYC ruling applied: option (a)** — a buyer-verification admin queue consuming `taxComplianceCertificate` (BE-09), **not** dropped from onboarding.
3. **Farmer Stage 3 reuses `verificationStatus: PENDING`** + the existing admin verification queue — no parallel mechanism.
4. **County is a flat enum only** (`KENYAN_COUNTIES`) — there is no sub-county field.
5. Every field below is tagged **existing** (already in the schema) or **net-new** (added by AUTH-01/05).

---

## 1. Funnel & stage machine

`OnboardingStage`: `ROLE_SELECTION → IDENTITY_INPUT → VERIFICATION_UPLOAD → COMPLETED`. The middleware redirects an incomplete user to `/onboarding/<stage>` and bounces a completed user back to their dashboard. After each stage the client calls NextAuth `update()` so the JWT refreshes.

| Stage | Route | Advances to |
| --- | --- | --- |
| Role selection | `POST /api/onboarding/role` | IDENTITY_INPUT |
| Identity | `POST /api/onboarding/identity` | VERIFICATION_UPLOAD |
| Verification (farmer/buyer/lecturer) | `POST /api/onboarding/verification` | COMPLETED |
| Verification (student) | `POST /api/onboarding/institutional-email` + `/verify` | COMPLETED |

**Provider↔role:** GitHub → STUDENT only; Google → FARMER/BUYER/LECTURER (ADMIN via allowlist only). Enforced at role selection.

`onboarding COMPLETED ≠ verified`: finishing the funnel does not set `isVerified`; an admin still approves farmer/buyer/lecturer submissions.

---

## 2. Field-by-field mapping

### Top-level `User` (`src/lib/models/User.model.ts`)

| Field | Status | Stage written |
| --- | --- | --- |
| `email`, `firstName` | existing | OAuth sign-in (`signIn`) |
| `role` (nullable) | net-new (AUTH-01) | Stage 1 |
| `onboardingStage` | net-new (AUTH-01) | each stage |
| `oauthProvider` | net-new (AUTH-01) | OAuth sign-in |
| `lastName`, `phoneNumber`, `county` | existing (now optional) | Stage 2 |
| `isEmailVerified` | existing | OAuth sign-in (provider-asserted) |

`county` validates against the `KENYAN_COUNTIES` enum. No sub-county.

### `farmerData`

| Field | Status | Stage |
| --- | --- | --- |
| `verificationStatus`, `isVerified`, `cropsGrown`, `livestockKept` | existing | seeded Stage 1 (`buildRoleDefaults`) |
| `primaryLanguage` | existing | Stage 2 (optional) |
| `documentType`, `documentNumber`, `documentImageUrl` | existing | Stage 3 → `verificationStatus: PENDING` |
| `landOwnershipToken` | net-new (AUTH-01) | Stage 3 (optional) |

Stage 3 reuses the existing farmer verification queue (`/api/admin/verification-queue`, `/api/admin/verify-farmer`).

### `buyerData`

| Field | Status | Stage |
| --- | --- | --- |
| `verificationStatus`, `isVerified` | net-new (BE-09) | seeded Stage 1 |
| `organizationName`, `businessRegistrationNumber`, `corporatePaybill`, `procurementScale` | net-new (AUTH-01) | Stage 2 |
| `taxComplianceCertificate` | net-new (BE-09) | Stage 3 → `verificationStatus: PENDING` |

Stage 3 feeds the **buyer-verification admin queue** (`/api/admin/buyer-verification-queue`, `/api/admin/verify-buyer`).

### `studentData`

| Field | Status | Stage |
| --- | --- | --- |
| `currentTier`, `techStackPreferences`, `completedProjectCount` | existing | seeded Stage 1 |
| `githubUsername` | existing | **OAuth profile** (read-only, never hand-typed) |
| `universityAffiliation`, `academicRegistrationNumber`, `primaryInterest` | net-new / existing | Stage 2 |
| `institutionalEmail`, `institutionalEmailVerified` | net-new (AUTH-01) | Stage 3 |
| `institutionalEmailPin`, `institutionalEmailPinExpiry` | net-new (AUTH-05) | Stage 3 (hashed, transient) |

Stage 3 is the institutional-email pin flow (6-digit, bcrypt-hashed, 15-min TTL, university-domain allowlist in `src/lib/auth/universityDomains.ts`).

### `lecturerData`

| Field | Status | Stage |
| --- | --- | --- |
| `isVerified`, `universityAffiliation` | existing | seeded Stage 1 / Stage 2 |
| `departmentAssignment`, `academicStaffId`, `facultyCredentialLetterUrl` | net-new (AUTH-01) | Stage 2 / Stage 3 |

Lecturers carry no `verificationStatus`; the admin lecturer queue works off `isVerified`.

---

## 3. Admin bootstrap

ADMIN accounts are never self-selected. A Google email in `ADMIN_EMAIL_ALLOWLIST` is provisioned to `role: ADMIN`, `onboardingStage: COMPLETED` at first sign-in (`signIn`), skipping the funnel.
