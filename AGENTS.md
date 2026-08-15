# AGENTS.md

## Throughput + CI-safe (إلزامي)

قبل أي مهمة: اتبع `docs/AGENT_THROUGHPUT.md` وقاعدة `.cursor/rules/majlisilm-ci-safe.mdc`.
فهرس المسارات: `docs/REPO_INDEX.md`. قياس CI: `docs/CI_THROUGHPUT.md`.

**قبل الدفع:** من جذر git (`cd "$(git rev-parse --show-toplevel)"`) شغّل:
`corepack enable && pnpm install --frozen-lockfile && pnpm run verify:ci`
لا commit/push عند الفشل. لا تضعف الفحوصات.

**بعد الدفع:** راقب الحرجة بـ `gh pr checks --watch --fail-fast`. الدمج بعد نجاح Verify build + repo-gates + build + static-checks (وContrast/UI أو native حسب نطاق الـPR).

## Cursor Cloud specific instructions

This is a **pnpm workspace monorepo** (Node.js 24, TypeScript 5.9) for **مجالس العلم (Majalis Al-Ilm)**, an
Arabic RTL Islamic scholarly platform. The primary product is the web app; there are also a mobile
(Expo) app, a small Express push-notification API server, and a few marketing/design artifacts.

### Services, ports, and run commands

Run commands are defined per-artifact in `artifacts/*/.replit-artifact/artifact.toml` and in each
package's `scripts`. Every Vite/Express service **requires a `PORT` env var (and the web app also
requires `BASE_PATH`) or it throws on startup** — this is the most common non-obvious gotcha.

| Service | Dev command | Required env | Port |
|---|---|---|---|
| Majalis Al-Ilm web (primary) | `pnpm --filter @workspace/majalis run dev` | `PORT=24216 BASE_PATH=/` | 24216 |
| Majalis Al-Ilm mobile (Expo) | `pnpm --filter @workspace/majalis-mobile run dev` | `PORT=18881` | 18881 |
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

### ⚠️ قاعدة Git الحرجة — يجب اتباعها دائماً

**جذر git الصحيح:** `/Users/alabdullmohsen/majalis-correct/` (جذر الـ monorepo)

جميع عمليات `git add / commit / push` **يجب** تنفيذها من هذا المسار، لأن:
- Vercel يبني من `artifacts/majalis/` داخل المستودع
- أي commit من داخل `artifacts/majalis/` يضع الملفات في `src/` بجذر المستودع — **مسار خاطئ** لا يُبنى

```bash
# ✅ الطريقة الصحيحة دائماً
cd /Users/alabdullmohsen/majalis-correct
git add artifacts/majalis/src/index.css   # المسار يبدأ بـ artifacts/majalis/
git commit -m "..."
git push origin main

# ❌ خطأ — يُفسد النشر
cd /Users/alabdullmohsen/majalis-correct/artifacts/majalis
git add src/index.css   # يذهب لجذر المستودع وليس artifacts/majalis/
```

**التحقق السريع:** `git rev-parse --show-toplevel` يجب أن يُعيد `/Users/alabdullmohsen/majalis-correct`

### Lint / test / build

- Quality gates: root `pnpm run typecheck`; package lint via `pnpm --filter @workspace/majalis run lint`
  (ESLint flat config, `--max-warnings 50`); majalis embeds content-guard and regression checks in `build`.
- Build all: `pnpm run build` (runs typecheck first). Build only web: `PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build`.
- Production web serve: `PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run start` (Vite preview; assistant API is under `/api/assistant` on Vercel).
- `ANTHROPIC_API_KEY` must be set as a server secret for the assistant API in production.
- **Latent dual `@types/react`:** the lockfile can resolve both catalog `19.2.x` (web) and Expo `19.1.x`
  (mobile). `skipLibCheck: true` keeps typecheck green. Unused shadcn leftovers that previously surfaced
  this (`button-group`, `calendar`) were removed; do **not** “fix” dual versions by editing UI kits.
  Prefer a future pnpm override only after verifying both web and mobile typecheck.

### أتمتة الدمج والنشر (إلزامي للوكلاء)

المستودع مضبوط على **دمج تلقائي بلا تدخل يدوي**:

| آلية | الملف / الإعداد | السلوك |
|---|---|---|
| حماية `main` | Branch protection (يدوي من المالك) | **Verify build** فحص إلزامي؛ لا دمج بدونه |
| CI على كل PR → main | `.github/workflows/ci.yml` | typecheck + lint + build (= Verify build) + اختبارات المحتوى |
| Ready + Auto-merge (squash) | `.github/workflows/auto-merge-to-main.yml` | تحديث من main إن لزم → Draft→Ready → auto-merge squash فقط بعد نجاح Verify build؛ مسح كل 15 دقيقة |
| إلغاء الدمج عند فشل CI | نفس الملف (`cancel-on-ci-failure`) | `--disable-auto` + تعليق على الـ PR |
| إغلاق المكدّسات القديمة | نفس الملف (`close-stale-non-main-prs`) | يغلق PRs المفتوحة التي قاعدتها ليست `main` |
| تحديث/حل تعارض من main | `.github/workflows/resolve-pr-conflicts.yml` | دمج `main` عند CONFLICTING أو BEHIND |
| نشر الإنتاج | Vercel على `main` (`deploymentEnabled.main=true`) + `.github/workflows/auto-deploy.yml` | بعد كل push ناجح لـ main |
| إعدادات المستودع | `allow_auto_merge=true`, `delete_branch_on_merge=true` | مفعّلة على مستوى المستودع |

**قواعد الوكلاء (لا تُخالف):**

1. **PR واحد لكل مهمة.** يُمنع فتح سلسلة PRs متتابعة (phase2→phase3→…) للمهمة الواحدة. إن احتاجت المهمة مراحل، أبقِ العمل على فرع واحد وحدّث نفس الـ PR، أو ادمج التعديلات في الفرع الحالي قبل أي طلب جديد.
2. القاعدة دائمًا `main` (ما عدا `automation/content` و`automation/tasks` اللتين تُدمجان عبر `release-majlisilm.yml`).
3. **كل مهمة تنتهي تُدمَج وتُنشَر.** بعد نجاح الفحوصات: ادفع → PR Ready واحد إلى `main` → تابع Auto-merge + نشر Vercel/`auto-deploy.yml` حتى يظهر الـcommit على الإنتاج. المهمة غير مكتملة ما دام الفرع غير مدموج أو النشر لم يكتمل. لا تطلب من المستخدم دمجًا/نشرًا يدويًا.
4. لا تترك PRs مفتوحة/Draft/فاشلة CI بعد اكتمال العمل. أصلِح Verify build فورًا وأعد الدفع؛ إن بقي PR قديم متسلسل، أغلقه لصالح PR واحد يستهدف `main`.
5. استثناء نافذتَي `automation/content` و`automation/tasks` يبقى عبر `release-majlisilm.yml` فقط.
