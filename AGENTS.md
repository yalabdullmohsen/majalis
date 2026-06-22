# AGENTS.md

## Cursor Cloud specific instructions

This is a **pnpm workspace monorepo** (Node.js 24, TypeScript 5.9) for **مجالس (Majalis)**, an
Arabic RTL Islamic scholarly platform. The primary product is the web app; there are also a mobile
(Expo) app, a small Express push-notification API server, and a few marketing/design artifacts.

### Services, ports, and run commands

Run commands are defined per-artifact in `artifacts/*/.replit-artifact/artifact.toml` and in each
package's `scripts`. Every Vite/Express service **requires a `PORT` env var (and the web app also
requires `BASE_PATH`) or it throws on startup** — this is the most common non-obvious gotcha.

| Service | Dev command | Required env | Port |
|---|---|---|---|
| Majalis web (primary) | `pnpm --filter @workspace/majalis run dev` | `PORT=24216 BASE_PATH=/` | 24216 |
| Majalis mobile (Expo) | `pnpm --filter @workspace/majalis-mobile run dev` | `PORT=18881` | 18881 |
| API server (push only) | `pnpm --filter @workspace/api-server run dev` | `PORT=8080` | 8080 |
| Pitch / Promo / Mockup (optional) | `pnpm --filter @workspace/<name> run dev` | `PORT=...` | see `artifact.toml` |

Example: `PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run dev`

### Supabase backend (required for data/auth)

All data reads/writes and auth go **directly from the browser/mobile to a hosted Supabase project**
(there is no local DB; `lib/db`'s Drizzle schema is an empty placeholder). Configure via secrets
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (mobile uses `EXPO_PUBLIC_SUPABASE_*`). The DB
schema must be applied manually in the Supabase SQL Editor (`.migration-backup/01_schema.sql`,
optional seed `02_seed.sql`, and `supabase/qa_questions.sql`).

Without these secrets the web app **still builds and runs** but falls back to a placeholder Supabase
client, so list pages stay in the loading/empty state and login/registration calls error — the UI
shell, RTL layout, and client-side routing all work regardless.

Non-obvious auth gotcha: the live Supabase project has **email confirmation enabled**, so a
successful signup creates the account and sends a confirmation email but does **not** return a
session — the app navigates home yet stays logged-out (NavBar shows the green "دخول"/Login button;
a logged-in NavBar instead shows the user's name plus a "خروج"/Logout button). To test
authenticated flows you need a pre-confirmed account or to confirm the email out of band.

### Lint / test / build

- There is **no ESLint/Prettier-script, and no automated test suite** wired up. The quality gate is
  TypeScript: `pnpm run typecheck` (root) or per package `pnpm --filter <pkg> run typecheck`.
- Build all: `pnpm run build` (runs typecheck first). Build only web: `PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build`.
- **Known pre-existing typecheck failure:** `pnpm run typecheck` reports 2 errors in
  `artifacts/majalis/src/components/ui/button-group.tsx` and `.../calendar.tsx` caused by two
  `@types/react` versions coexisting in the lockfile (19.1.17 pulled by Expo/React-Native deps and
  19.2.14 from the catalog). This is independent of Node version and does **not** affect the Vite
  dev server or `vite build` (neither runs `tsc`). Do not "fix" it by editing those components.
