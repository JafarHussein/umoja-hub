# 04 — Obsolete Component & Route Deletion Report

**Status:** Deletion plan for website-only components and routes built for the abandoned direction.
**Policy:** Delete, do not archive.
**Hard constraint:** Zero impact on the working product (dashboard, marketplace, onboarding, auth). Verified by import-graph analysis below.

---

## 1. Import-graph basis for the cut

ripgrep over `src/` establishes a **clean isolation boundary**:

- `src/components/website/*` is imported **only** by `src/app/(website)/*` pages (plus one internal lazy wrapper). **No** product route or component imports it.
- `src/app/(website)/*` pages import `components/website/*` and the website tokens — and **nothing in the product imports them back**.
- `src/components/ui/*` (the primitives) is imported by the **product** (dashboard/marketplace/onboarding/auth/foodhub/education/shared) and by **zero** website pages.

Therefore deleting the website layer cannot break the product.

---

## 2. DELETE — website route group (`src/app/(website)/`)

All 15 files:

```
src/app/(website)/layout.tsx
src/app/(website)/page.tsx                 (homepage)
src/app/(website)/about/page.tsx
src/app/(website)/education/page.tsx
src/app/(website)/how-it-works/page.tsx
src/app/(website)/team/page.tsx
src/app/(website)/transparency/page.tsx
src/app/(website)/trust/page.tsx
src/app/(website)/for/farmers/page.tsx
src/app/(website)/for/students/page.tsx
src/app/(website)/for/buyers/page.tsx
src/app/(website)/for/lecturers/page.tsx
src/app/(website)/for/cooperatives/page.tsx
src/app/(website)/for/employers/page.tsx
src/app/(website)/for/ngos/page.tsx
```

→ Delete the entire `(website)` route group directory. The public marketing site goes to zero, to be rebuilt against the new foundation. (This is the explicit, user-confirmed "scorched earth" choice; the public `/` route will 404 until the website is rebuilt.)

---

## 3. DELETE — website component folder (`src/components/website/`)

All 7 files:

```
src/components/website/Nav.tsx
src/components/website/Footer.tsx
src/components/website/AnimateIn.tsx
src/components/website/D01Diagram.tsx
src/components/website/D01DiagramLazy.tsx
src/components/website/ImageSlot.tsx
src/components/website/MediaFrame.tsx
```

→ Delete the entire `src/components/website/` directory.

---

## 4. KEEP — everything the product uses

| Path | Why kept |
|---|---|
| `src/components/ui/*` | Product primitives (button, Card, Input, Modal, Badge, VerifiedBadge, SkeletonLoader). Dark-coupled; the foundation will decide their evolution, but they ship the working app today. |
| `src/components/foodhub/*`, `src/components/education/*` | Feature components for the working dashboard/marketplace |
| `src/components/shared/*` | App shell (Header, Sidebar, Providers, LayoutWrapper, IdentityRecords, VerificationLockout) |
| `src/app/dashboard/*`, `src/app/marketplace/*`, `src/app/onboarding/*`, `src/app/auth/*`, `src/app/knowledge/*` | The working product surfaces |

---

## 5. Collateral checks after deletion

1. **Root layout** (`src/app/layout.tsx`) must not import anything from `(website)` or `components/website`. If it injects website fonts via `next/font` (jakarta / ibm-plex-mono) that are now unused, those font imports may be removed as a tidy-up (non-blocking — unused imports are lint-flagged).
2. **No dangling imports**: `grep -rn "components/website" src` must return zero after deletion.
3. **Build gate**: `npm run type-check` then `npm run build` must pass. A 404 on `/` is expected and acceptable; a *build error* is not.
4. **Tests**: `npm run test` — no website tests are expected; any that exist are deleted with their subjects.

---

## 6. Net effect

- 15 routes + 7 components removed; one route group and one component folder gone.
- The product (dashboard/marketplace/onboarding/auth) is untouched and continues to build and run.
- The website is at zero — a clean slate for the post-foundation rebuild.
