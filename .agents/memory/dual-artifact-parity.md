---
name: Majalis dual-artifact parity
description: Web and mobile are separate artifacts with duplicated Supabase data layers that must be kept in sync.
---

مجالس ships as two product artifacts that share one external Supabase: `artifacts/majalis` (React+Vite web) and `artifacts/majalis-mobile` (Expo). Each has its OWN copy of the data-fetching layer (`src/lib/supabase.ts` vs `lib/supabase.ts`).

**Why:** there is no shared package for queries — the two libs drift independently.

**How to apply:** when adding/changing a content section (e.g. Q&A), add the fetch functions to BOTH supabase libs, and surface it in both UIs. If you change `searchEverything`'s return shape (web only), also update the `Results` type + `total` + `<Group>` rows in `SearchPage.tsx`, or the new groups silently won't render.
