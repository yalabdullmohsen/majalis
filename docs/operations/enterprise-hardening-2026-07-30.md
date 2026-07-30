# Enterprise Hardening — 2026-07-30

Code changes on branch `cursor/enterprise-hardening-security-38ac` (report-only delivery; **no PR** per owner request).

## Security (root-cause)

| Change | Why |
|---|---|
| Default `rateLimit` on all `/api/admin/*`, search-family routes, `/api/webhook/telegram`, `/api/learning-path` | Stolen JWT / public search / webhook flood |
| Telegram webhook fail-closed when `TELEGRAM_WEBHOOK_SECRET` missing in production/preview | Unsigned webhook acceptance |
| Search CORS allowlist includes `https://majlisilm.com` | Apex origin completeness |
| Submissions / researches / search / intelligent-search / scholarly-search / recommendations / citations: no raw `error.message` | Info disclosure |
| `lib/api/postgrest-escape.mjs` + wired into search, admin telegram, RAG, lesson-extractor | PostgREST `.or()` filter injection |
| Knowledge-graph UUID validation for node ids | Filter injection via `.or(eq.…)` |
| `/api/healthz?full=1` redacts secret **names** (`missingCount` only) | Recon / secret inventory leak |
| Sidebar cookie `SameSite=Lax` + `Secure` on HTTPS | Cookie hygiene |
| Express CSP + HSTS + Permissions-Policy + COOP + DNS-Prefetch parity with `vercel.json` | Local/preview header drift |
| Express `/api/healthz` uses shared production handler | Contract drift (`majalis-web` vs `majlisilm-web`) |
| `platform_hardening_security_v1.sql` added to `MIGRATION_FILES` inventory | Discovery / apply order (still approval-gated) |
| `lib/__tests__/enterprise-security-gates.test.mjs` | Regression gates |

### Still manual (dashboard / SQL Editor)

- Supabase Leaked Password Protection
- MFA for admin accounts
- Redirect URL allowlist
- Apply `platform_hardening_security_v1.sql` + `p0_security_definer_grants_v2.sql` on Production (after Staging/clone if available)
- Ensure `TELEGRAM_WEBHOOK_SECRET` and Upstash Redis env on Vercel
- CSP still allows `'unsafe-inline'` for scripts/styles (Vite/legacy) — nonce migration deferred to avoid breakage
- Express local routes still bypass some dispatch rate limits for non-Vercel preview (production uses `api-dispatch`)

## Performance

- React Query: `mutations.retry = false` (no double-submit)
- Performance monitor: no `console.warn` in production builds
- Fonts already consolidated (Alexandria primary + deferred display fonts) — left intact

## Reliability

- Platform health remote probes use `AbortSignal.timeout(8000)`
- Shared ErrorBoundary / RequestManager / circuit / readyz left intact (readyz green after owner SQL)
- Phase-8 reliability gates updated for shared healthz handler

## Testing

- `pnpm --filter @workspace/majalis run test:enterprise-security`
- Wired into package `test` script
- Verified: typecheck, lint `--max-warnings=0`, full `pnpm test`, production `build`
