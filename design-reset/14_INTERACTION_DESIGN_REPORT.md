# 14 — Interaction Design Report

**Status:** Evidence on micro-interaction and flow-level interaction design — how individual controls and multi-step processes should behave.

---

## 1. The governing laws (applied to interaction)

- **Hick's Law** — decision time grows with number/complexity of choices. **Segment** big decisions; default the common case. ([Dovetail](https://dovetail.com/ux/hicks-law/), [Laws of UX](https://lawsofux.com/))
- **Miller's Law** — **chunk** into ≤7 groups; for novice users aim lower. ([Perpetual](https://www.perpetualny.com/blog/ux-design-principle-004-millers-law))
- **Jakob's Law** — behave like the apps users already know (M-Pesa, WhatsApp, mobile banking). ([UX Design Institute](https://www.uxdesigninstitute.com/blog/laws-of-ux/))

## 2. Forms — the highest-stakes interaction here

UmojaHub is form-heavy (listings, checkout, onboarding, project submission, verification). Evidence:

- **Single-column layouts**: users complete them ~**15.4 s faster** than multi-column; multi-column breaks reading flow and raises errors. ([Parachute](https://parachutedesign.ca/blog/web-form-design-best-practices/), [CXL](https://cxl.com/blog/form-design-best-practices/))
- **Top-aligned, clear labels** scan fastest and work best on mobile; never use clever/vague labels. ([Parachute](https://parachutedesign.ca/blog/web-form-design-best-practices/))
- **Error handling**: say *what* is wrong, *where*, and *how to fix it*, inline at the field; frustration → abandonment. ([Buildform](https://buildform.ai/blog/form-design-best-practices/))
- Teams applying these report **25–300% conversion improvement** depending on starting point. ([Parachute](https://parachutedesign.ca/blog/web-form-design-best-practices/))
- **WCAG 2.2**: don't force **redundant entry** (3.3.7); keep **help consistent** (3.2.6). (report 09)

**Interaction rules for UmojaHub forms:**
1. **One column, top-aligned labels**, mobile-first.
2. **Inline, specific, recoverable errors**; validate at the right moment (on blur / on submit, not aggressively per-keystroke).
3. **Don't re-ask** for data already provided.
4. **Generous touch targets** (≥24px AA, ≥44px primary).
5. **Show progress** in multi-step flows; allow back without data loss.

## 3. Feedback & state

- Every action needs immediate, legible **feedback** (loading, success, error). The repo's skeleton shimmer is a good loading primitive; pair with clear success/empty/error states (report 06).
- **Optimistic UI** is fine on fast paths but must reconcile honestly on failure (no silent loss) — relevant to payment/order flows where trust is paramount.
- **Confirmation** for destructive/irreversible actions; **no** confirmation friction on safe, reversible ones (avoid nag patterns — report 15).

## 4. Latency-aware interaction (UmojaHub-specific)

On 2G, perceived performance dominates:
- Show skeletons/placeholders immediately; never a blank frozen screen.
- Prefer **server-rendered, progressively-enhanced** interactions over heavy client JS.
- Make actions **resilient to flaky connectivity** (clear retry, no double-charge on payment retries — coordinate with the existing payment simulation/idempotency logic; *logic untouched*, but the UI must expose safe retry).

## 5. Motion in interaction

Per report 08: micro-interactions ≤200–300 ms, functional only, reduced-motion respected. Use motion to *confirm state*, not to entertain.

---

## 6. Interaction principles for the foundation

1. **Familiar mental models** (M-Pesa/WhatsApp) for money and messaging flows.
2. **Single-column, top-labeled, inline-error** forms.
3. **Chunk** flows; ≤4 decisions/step; visible progress; no data loss on back.
4. **Immediate, honest feedback**; safe retry on flaky networks.
5. **Confirm only the irreversible.**
6. **Functional micro-motion**, reduced-motion safe.

### Sources
- [Parachute — Form best practices](https://parachutedesign.ca/blog/web-form-design-best-practices/) · [CXL — Form design (empirical)](https://cxl.com/blog/form-design-best-practices/) · [Buildform — Form design 2025](https://buildform.ai/blog/form-design-best-practices/)
- [Dovetail — Hick's Law](https://dovetail.com/ux/hicks-law/) · [Laws of UX](https://lawsofux.com/) · [Perpetual — Miller's Law](https://www.perpetualny.com/blog/ux-design-principle-004-millers-law) · [UX Design Institute — Laws of UX](https://www.uxdesigninstitute.com/blog/laws-of-ux/)
