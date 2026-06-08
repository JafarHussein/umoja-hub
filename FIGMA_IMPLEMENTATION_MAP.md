# Figma Implementation Map
**File:** UmojaHub Website — Wireframes & Structure  
**Key:** XXsQQO7h2vopeYczJo9pKc  
**Audited:** 2026-06-08  
**Source node:** 184:2 — Homepage (1440×5160)

---

## Page Inventory

Only one Figma page exists: `00 — Cover & Structure`.  
Only one top-level frame is audited in this session: **Homepage** (node 184:2).  
Additional frames (other pages) must be fetched as the user provides node links.

---

## Homepage — Section Inventory

| # | Name | Node | Background | Height |
|---|------|------|-----------|--------|
| — | Nav | 184:3 | `#f0eee9` | 72px |
| S1 | Section/Hero | 184:12 | `#131619` | 793px |
| S2 | Section/WhyVerification | 184:24 | `#f5f4f0` | 763px |
| S3 | Section/DualHub | 184:42 | `#f0eee9` | 1037px |
| S4 | Section/VerificationInPractice | 184:60 | `#f5f4f0` | 753px |
| S5 | Section/LiveEvidence | 184:138 | `#131619` | 482px |
| S6 | Section/ForYourRole | 184:158 | `#f5f4f0` | 871px |
| — | Footer | 184:199 | `#1d232a` | 389px |

**No CTA section at the bottom** — the current "Ready to get started?" section does not exist in Figma. It must be removed.

---

## Navigation

- **Height:** 72px (not 64px)
- **Background:** `#f0eee9` (canvas-elevated, always — no scroll state change)
- **Border:** always `border-b border-[#d8d3cc]` (not conditional)
- **Horizontal padding:** `px-[48px]`
- **Wordmark:** Plus Jakarta Sans Bold, 18px, `#1d232a`, tracking -0.18px
- **Nav links (desktop):** 4 only, gap-32, Medium 14px, `#353c45`
  1. Food Security Hub ↓ (has dropdown arrow)
  2. Education Hub ↓ (has dropdown arrow)
  3. How It Works
  4. Transparency
- **No sign-in link** in the desktop nav — button only
- **CTA button:** `bg-[#b86a3d]`, px-[20px] py-[10px], rounded-[4px], SemiBold 14px, `#f5f4f0`

---

## S1 — Hero

- **Background:** `#131619`
- **Padding:** `px-[120px] py-[128px]`
- **Layout:** `flex-col gap-[24px] items-center` + explicit spacers
- **Eyebrow:** SemiBold 11px, `#56a8a2`, tracking 0.88px, uppercase
- **Spacer:** 8px
- **Headline:** ExtraBold 72px, `#f2f0ec`, tracking -2.16px (-0.03em), leading 1.05, max-w [1080px], centered
- **Spacer:** 8px (between headline and sub already in gap)
- **Sub:** Regular 18px, `#a9a29a`, leading 1.6, w-[760px], centered
- **Spacer:** 16px
- **CTAs:** gap-[16px]
  - Primary: `bg-[#b86a3d]`, px-[28px] py-[16px], rounded-[4px], SemiBold 16px, `#f5f4f0`
  - Secondary: `border border-[#39414a]`, px-[28px] py-[16px], rounded-[4px], SemiBold 16px, `#d6d1cb`
- **Trust signal:** Medium 13px, `#636c76`, tracking 0.13px, centered

---

## S2 — WhyVerification

- **Background:** `#f5f4f0`
- **Padding:** `px-[120px] py-[96px]`
- **Layout:** `flex-col gap-[56px]`
- **Header block:** `flex-col gap-[12px]`
  - Eyebrow: SemiBold 11px, `#b86a3d`, tracking 0.66px
  - Headline: SemiBold 36px, `#1d232a`, tracking -0.72px, leading 1.15 — two lines
- **Panels:** `flex gap-[32px]` (two equal columns)
  - Surface: `bg-[#ece8e1]` border `border-[#d8d3cc]`, p-[40px], rounded-[2px]
  - Hub label row: dot (6px circle) + SemiBold 11px hub text
  - Panel title: SemiBold 22px, `#1d232a`, tracking -0.22px
  - Panel body: Regular 16px, `#353c45`, leading 1.6
  - **NO "Structural consequence" sub-paragraph** — remove from current code
- **Conclusion text:** Medium 18px, `#636c76`, leading 1.6, tracking -0.09px, **text-center**, w-[800px]

---

## S3 — DualHub (Verification Philosophy)

- **Background:** `#f0eee9`
- **Padding:** `px-[120px] py-[96px]`
- **Layout:** `flex-col gap-[48px] items-center`
- **Header block:** centered, gap-12
  - Eyebrow: SemiBold 11px, `#2e7d78`, tracking 0.66px
  - Headline: SemiBold 36px, `#1d232a`, tracking -0.72px — two lines
  - Body: Regular 16px, `#636c76`, leading 1.6, w-[680px]
- **D01 Diagram placeholder** (node 184:47):
  - `bg-[#e5e1da]` border `border-[#c8c2ba]`, h-[400px], p-[48px], rounded-[2px], w-full
  - Centered text in `#8a919a`
  - Label: IBM Plex Mono Regular 12px, tracking 0.24px — "D01 — Verification Spine Diagram"
  - Sub: Regular 14px, leading 1.5, w-[600px]
- **3 Principle cards:** `flex gap-[24px]`
  - Each: `bg-[#e5e1da]` border `border-[#c8c2ba]`, p-[28px], rounded-[2px], flex-1, gap-10
  - Label: SemiBold 13px, `#2e7d78`, tracking 0.13px — uppercase
  - Body: Regular 15px, `#353c45`, leading 1.55
- **NO 2-column hub list panels** — remove from current code

---

## S4 — VerificationInPractice

- **Background:** `#f5f4f0`
- **Padding:** `px-[120px] py-[96px]`
- **Layout:** `flex-col gap-[48px]`
- **Eyebrow:** SemiBold 11px, `#b86a3d`, tracking 0.66px
- **Headline:** SemiBold 36px, `#1d232a`, tracking -0.72px
- **Two panels:** `flex gap-[32px]`
  - **Farmer panel:** `bg-[#ece8e1]` border `border-[#d8d3cc]`, p-[40px], rounded-[2px]
    - Hub label: SemiBold 11px, `#b86a3d`, tracking 0.44px
    - Spacer: 20px
    - Steps 1–5 with copper (#b86a3d) 28px circles, gap-16
    - Step title: SemiBold 14px, `#1d232a`
    - Step desc: Regular 13px, `#636c76`, leading 1.55
    - Between steps: 24px spacer
  - **Education panel:** `bg-[#e5ece8]` border `border-[#d8d3cc]`, p-[40px], rounded-[2px]
    - Hub label: SemiBold 11px, `#2e7d78`, tracking 0.44px
    - Steps 1–5 with teal (#2e7d78) 28px circles
    - **Step 2 text:** "Peer review" / "Anonymised review from fellow students." (not "Platform hash")

---

## S5 — LiveEvidence (Stats)

- **Background:** `#131619` (NOT `#1d232a`)
- **Padding:** `px-[120px] py-[80px]`
- **Layout:** `flex-col gap-[48px] items-center text-center`
- **Eyebrow:** SemiBold 11px, `#56a8a2`, tracking 0.66px
- **Stats row:** `flex items-start w-full` (4 equal flex-1 columns, **NO dividers**)
  - Each stat: p-[32px], flex-col gap-[8px] items-center
  - Value: SemiBold 48px, `#f2f0ec`, tracking -0.96px
  - Label: Medium 14px, `#d6d1cb`
  - Sub: IBM Plex Mono Regular 11px, `#49515a`
- **Disclaimer:** Regular 13px, `#49515a`, leading 1.5, w-[700px]

---

## S6 — ForYourRole

- **Background:** `#f5f4f0`
- **Padding:** `px-[120px] py-[96px]`
- **Layout:** `flex-col gap-[48px] items-start`
- **Eyebrow:** SemiBold 11px, `#6b5a9a`, tracking 0.66px
- **Headline:** SemiBold 36px, `#1d232a`, tracking -0.72px
- **Two separate rows** of 3 cards each, `flex gap-[24px]`:
  - Row 1: Farmers, Students, Buyers
  - Row 2: Employers, Lecturers, NGOs & Government
- **Each card:** `bg-[#ece8e1]` border `border-[#d8d3cc]`, p-[32px], rounded-[2px], flex-1
  - Layout: `flex-col gap-[12px]`
  - Hub label: SemiBold 10px, hub accent color, tracking 0.4px
  - Role name: SemiBold 20px, `#1d232a`, tracking -0.2px
  - Description: Regular 14px, `#636c76`, leading 1.55
  - Spacer: 8px
  - CTA text: SemiBold 13px, hub accent color

---

## Footer

- **Background:** `#1d232a`
- **Padding:** `pb-[48px] pt-[64px] px-[120px]`
- **Layout:** `flex-col gap-[48px]`
- **Columns row:** `flex items-start` — 5 equal `flex-1` columns
  - Brand col: wordmark SemiBold 16px `#f2f0ec` tracking -0.16px, tagline Regular 13px `#636c76` leading 1.55 w-[240px]
  - Column heading: SemiBold 12px `#878078` tracking 0.24px
  - Links: Regular 14px `#636c76`
  - PLATFORM: About, Team, Transparency, Trust & Verification, How It Works
  - HUBS: Food Security Hub, Education Hub, Marketplace, Knowledge Hub
  - PARTICIPANTS: Farmers, Students, Buyers, Lecturers, Employers
  - GOVERNANCE: Appeals & Disputes, Platform Status — **NO Contact link**
- **Divider:** `bg-[#2a3138] h-px w-full`
- **Bottom row:** Regular 12px `#636c76`, `flex justify-between items-center`

---

## Deviation Log (Current Code → Figma)

| File | Issue | Priority |
|------|-------|----------|
| Nav.tsx | bg canvas-base → canvas-elevated (#f0eee9) | HIGH |
| Nav.tsx | h-16 (64px) → h-[72px] | HIGH |
| Nav.tsx | Border always visible, not scroll-conditional | HIGH |
| Nav.tsx | 5 nav links → 4 links, first 2 with ↓ arrows | HIGH |
| Nav.tsx | Has sign-in link — remove | HIGH |
| Nav.tsx | Button padding px-4 py-2 → px-[20px] py-[10px] | MEDIUM |
| page.tsx S2 | "Structural consequence" paragraphs — remove | HIGH |
| page.tsx S2 | Conclusion text not centered — fix | HIGH |
| page.tsx S3 | 2-col hub panels — remove entirely | HIGH |
| page.tsx S3 | Missing D01 diagram placeholder — add | HIGH |
| page.tsx S3 | Principle card colors wrong (#surface-secondary → #e5e1da) | MEDIUM |
| page.tsx S4 | Education step 2: wrong text ("Platform hash" → "Peer review") | HIGH |
| page.tsx S5 | Background #1d232a → #131619 | HIGH |
| page.tsx S5 | Border-r dividers between stats — remove | HIGH |
| page.tsx S6 | Single grid → two rows of 3 | HIGH |
| page.tsx S6 | Card font sizes wrong | MEDIUM |
| page.tsx S7 | "Ready to get started?" section — remove entirely | HIGH |
| Footer.tsx | Grid layout → flex with 5 equal columns | MEDIUM |
| Footer.tsx | "Contact" link in Governance — remove | MEDIUM |
| Footer.tsx | Padding values wrong | LOW |

---

## Asset Inventory

| ID | Description | Status |
|----|-------------|--------|
| D01 | Verification Spine Diagram — shared infrastructure visual | Placeholder only in wireframe |
| D02–D18 | Additional diagrams (other pages) | Not yet audited |

---

## Pages Still to Audit

Share node-specific Figma URLs for each to proceed:
- For Farmers
- For Buyers  
- For Students
- For Employers
- For Lecturers
- For NGOs
- Education Hub
- How It Works
- Transparency
- Trust & Verification
- About
- Team
