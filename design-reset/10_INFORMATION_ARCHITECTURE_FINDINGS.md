# 10 — Information Architecture Findings

**Status:** Evidence on IA, navigation, and findability — for both the (to-be-rebuilt) website and the app shell.

---

## 1. Visible navigation beats hidden navigation

NN/g research is unambiguous: **hiding primary navigation (hamburger-only) cuts discoverability roughly in half**, increases task time, and raises perceived difficulty. ([NN/g via summary](https://www.nngroup.com/articles/mega-menus-gone-wrong/), [Lovable](https://lovable.dev/guides/website-menu-examples))

**Hybrid rule (NN/g):** on mobile, show **3–5 critical items visibly** and tuck only secondary links behind a menu. ([summary](https://lovable.dev/guides/website-menu-examples))

**For UmojaHub:** the website nav must keep the few highest-value destinations visible even on small screens. The app shell's role-based sidebar should surface each role's top jobs directly, not bury them.

## 2. Mega menus help *large/complex* sites, hurt small ones

- Mega menus can cut clicks-to-content up to ~50% and are preferred by ~74% of users **on complex sites** (Baymard). ([KWSM](https://kwsmdigital.com/blog/mega-menus-enhancing-the-user-experience-on-your-website/), [Medium](https://medium.com/design-bootcamp/the-art-of-mega-menus-a-ux-designers-guide-e63edb812571))
- But "mega menus gone wrong" (poor grouping, hover traps, no structure) actively harm usability. ([NN/g](https://www.nngroup.com/articles/mega-menus-gone-wrong/))

**For UmojaHub:** the website is **not** large enough to need a mega menu. With a handful of audience pages (`/for/*`), trust, education, about — a **simple, flat, visible nav** is correct. Resist the mega-menu reflex. (The old site had many `/for/*` pages; consider consolidating audiences rather than building a mega menu to contain them.)

## 3. Match structure to mental models, not org charts

Jakob's Law + IA practice: label and group by **what users are trying to do**, in their language, not by internal taxonomy. ([UX Design Institute](https://www.uxdesigninstitute.com/blog/laws-of-ux/))

**For UmojaHub:** "Food Hub" / "Education Hub" are internal frames; audiences think "I'm a farmer / a buyer / a student / hiring." The `/for/<role>` model is sound *if* labels are user-language and the set is kept small.

## 4. Findability + low bandwidth interact

Deep hierarchies mean more page loads = more data cost (report 05). **Flatter IA = fewer paid round-trips.** Favor shallow structures and on-page disclosure over deep drill-downs for this audience.

---

## 5. IA principles for the foundation

1. **Visible primary nav** (3–5 items) on all breakpoints; menus for secondary only.
2. **No mega menu** — the site is small; keep nav flat and labeled in user language.
3. **Organize by user goal/role**, not internal hub taxonomy.
4. **Flat hierarchies** to minimize paid page loads; disclose on-page.
5. **Consistent help/nav placement** across pages (also WCAG 2.2 SC 3.2.6).

### Sources
- [NN/g — Mega menus gone wrong](https://www.nngroup.com/articles/mega-menus-gone-wrong/) · [NN/g — Navigation visibility (video)](https://www.nngroup.com/videos/navigation-menu-visibility/)
- [Lovable — Menu examples](https://lovable.dev/guides/website-menu-examples) · [KWSM — Mega menus](https://kwsmdigital.com/blog/mega-menus-enhancing-the-user-experience-on-your-website/) · [Design Bootcamp — Mega menus guide](https://medium.com/design-bootcamp/the-art-of-mega-menus-a-ux-designers-guide-e63edb812571)
- [UX Design Institute — Laws of UX](https://www.uxdesigninstitute.com/blog/laws-of-ux/)
