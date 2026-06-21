# مجالس — المنصة العلمية الشرعية

منصة عربية للدروس الشرعية والمشايخ والمكتبة العلمية والإعجاز العلمي والفوائد.

## Run & Operate

- Workflows start automatically — use the Replit preview to view the app
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifact: `artifacts/majalis/`)
- Database: Supabase (external — user's own Supabase project)
- Auth: Supabase Auth
- Fonts: Amiri (headings) + Almarai (body) via Google Fonts
- RTL Arabic layout throughout

## Where things live

- `artifacts/majalis/src/` — main React app
- `artifacts/majalis/src/lib/supabase.ts` — Supabase client + all data fetching functions
- `artifacts/majalis/src/lib/theme.ts` — color palette (C.*) and GOVERNORATES list
- `artifacts/majalis/src/components/` — NavBar, AuthProvider, ui-common
- `artifacts/majalis/src/pages/` — all page components
- `.migration-backup/01_schema.sql` — Supabase DB schema (run in Supabase SQL Editor)
- `.migration-backup/02_seed.sql` — seed data (optional, run after schema)

## Architecture decisions

- Directly connects to Supabase from the browser (no Express proxy needed for data)
- All auth, data reads, and writes go through `@supabase/supabase-js` client
- Color palette centralized in `lib/theme.ts` as the `C` object — used inline via `style={}` props
- No Tailwind — uses plain inline styles matching the original's custom CSS utility classes
- Supabase Row Level Security (RLS) enforces all access control at the DB level

## Product

- **الرئيسية** — hero landing page with recent lessons and fawaid preview
- **الدروس** — browse/search lessons with category and city filters; authenticated users can register
- **المشايخ** — list of verified sheikhs with detail pages showing their lessons
- **المكتبة** — scientific/religious library filtered by content type
- **الإعجاز العلمي** — scientific miracles articles filterable by category and source
- **الفوائد** — approved religious quotes; logged-in users can submit new ones
- **الأسئلة والأجوبة** — public religious Q&A; filter by category + search; each entry has ruling type (for أحكام شرعية), evidence, reference, review_status (approved/needs_review) and status (published/draft); admin CRUD section; categories live in `qa_categories`, questions in `qa_questions` (run `supabase/qa_questions.sql` in Supabase SQL Editor — note: it drops & recreates the two Q&A tables)
- **Admin** — moderators can approve/reject pending fawaid submissions
- **Auth** — email/password login and registration via Supabase Auth

## User preferences

_Populate as you build._

## Gotchas

- `VITE_SUPABASE_URL` must be the project URL (`https://xxx.supabase.co`), NOT the anon key
- `VITE_SUPABASE_ANON_KEY` must be the JWT anon key starting with `eyJ...`
- The Supabase DB schema must be applied manually via Supabase SQL Editor (see `.migration-backup/01_schema.sql`)
- Vite secrets with `VITE_` prefix are exposed to the browser at build/dev time

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
