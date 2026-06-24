# Security Report - Majalis

## Scope

Reviewed:

- Supabase schema and RLS policies in `.migration-backup/*.sql` and `supabase/*.sql`
- Majalis web authentication, admin panel, user-scoped mutations, and API route
- Frontend environment variables and public assets
- `robots.txt` and `sitemap.xml` generated for `https://majlisilm.com`

## Fixed in this branch

### 1. Supabase RLS hardening

Added `supabase/security_hardening.sql` with the following fixes:

- Hardened `public.is_admin()` with `set search_path = public`.
- Added a trigger to stop non-admin users from changing privileged profile fields: `role`, `points`, and `level`.
- Replaced public profile enumeration with own-profile/admin profile reads.
- Added admin profile management policy for the Users admin panel.
- Replaced permissive profile insert policy with an own-profile insert policy using default user privileges.
- Forced user-submitted `fawaid` rows to `status = 'pending'`.
- Added admin CRUD policy for `fawaid`, including delete.
- Required `qa_questions` public reads to be both `status = 'published'` and `review_status = 'approved'`.
- Split `tasmee_requests` policies so admins can update other users' requests.
- Added admin management policy for `achievements`.

### 2. Admin panel access

- Added `RequireAdmin` as an explicit route guard around `/admin`.
- The admin sections no longer mount unless `AuthProvider` reports `isAdmin`.
- Real enforcement remains in Supabase RLS via `security_hardening.sql`.

### 3. Email verification

- The repository instructions state the live Supabase project already has email confirmation enabled.
- No frontend secret is needed for email verification.
- Production must keep Supabase Auth email confirmation enabled in the dashboard.

### 4. Rate limiting

- Added client-side cooldown for login/register attempts: 5 failures trigger a 15 minute cooldown for the email/mode pair.
- Added IP-based rate limiting to `/api/assistant`: 20 requests per minute with `Retry-After` on 429.

### 5. CAPTCHA

- Added Cloudflare Turnstile CAPTCHA to login and registration.
- `signIn` and `signUp` now pass `captchaToken` to Supabase Auth.
- Added `VITE_TURNSTILE_SITE_KEY` to `.env.local.example`.
- The Turnstile secret key must stay only in Supabase Auth Bot Protection settings.

### 6. Cross-user data changes

- Removed caller-supplied `userId` from user-owned Supabase helper calls.
- `registerForLesson`, `unregisterFromLesson`, `getMyRegistrations`, `submitFawaid`, and `getMyAchievements` now derive the user ID from `supabase.auth.getUser()`.
- RLS still provides the hard security boundary.

### 7. API route security

Reviewed `artifacts/majalis/api/assistant.js`:

- Only API route found: `/api/assistant`.
- Anthropic key remains server-only and is not exposed to frontend code.
- Added body size cap for JSON requests.
- Added IP rate limiting.
- Existing logging avoids printing the Anthropic key value.

### 8. Frontend secrets

- No service-role keys or Anthropic keys are used with a `VITE_` prefix.
- Public Supabase anon key remains a browser variable as intended by Supabase.
- CAPTCHA uses only the public Turnstile site key in the browser.

### 9. SEO public files

- `robots.txt` is generated with:

  `User-agent: *`, `Allow: /`, and `Sitemap: https://majlisilm.com/sitemap.xml`.

- `sitemap.xml` is generated from the shared SEO route catalog during build.
- Local preview verified both:
  - `http://localhost:24216/robots.txt`
  - `http://localhost:24216/sitemap.xml`

## Remaining external actions

These cannot be completed purely in repo code:

1. Run `supabase/security_hardening.sql` in the production Supabase SQL Editor.
2. Keep Supabase Auth email confirmation enabled.
3. Enable Supabase Auth CAPTCHA/Bot Protection with the Turnstile secret key.
4. Configure production `VITE_TURNSTILE_SITE_KEY`.
5. Configure Supabase Auth rate limits in the dashboard.
6. Prefer a durable server-side rate limiter for `/api/assistant` in production, such as Redis/Upstash, because in-memory limits reset across serverless instances.
7. Vercel deploy requires a valid project link/token; the local CLI token was invalid in this environment.

## Residual risks

- `/api/assistant` remains publicly callable by design; it now has body and IP limits, but a durable distributed limiter is recommended.
- Supabase RLS changes are only effective after applying `supabase/security_hardening.sql` to the live database.
- Client-side login cooldown is defense-in-depth only; Supabase Auth dashboard limits remain the authoritative control.
