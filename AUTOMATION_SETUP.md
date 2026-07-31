# Automation Setup — iOS TestFlight + Supabase + Vercel + GitHub

Unified CI/CD for **مجالس العلم (Majalis Al-Ilm)** monorepo.

| Component | Path in this repo |
|---|---|
| Fastlane | `fastlane/Appfile`, `fastlane/Fastfile`, root `Gemfile` |
| iOS project | `artifacts/majalis/ios/App/App.xcodeproj` (scheme `App`) |
| Bundle ID | `com.yousef.majlisilm` (**do not change**) |
| Native config | `artifacts/majalis/ios/App/App/Config/AppConfig.swift` |
| Native networking | `artifacts/majalis/ios/App/App/Services/NetworkService.swift` |
| Supabase migrations | `artifacts/majalis/supabase/migrations/` |
| Vercel app | `artifacts/majalis/` (`vercel.json`, `api/index.js`) |

---

## Required GitHub Secrets

| Secret | Purpose | How to generate |
|---|---|---|
| `APP_STORE_CONNECT_API_KEY_ID` | ASC API Key ID (JWT `kid`) | App Store Connect → Users and Access → Keys → App Store Connect API → **+** → copy **Key ID** |
| `APP_STORE_CONNECT_ISSUER_ID` | ASC Issuer UUID (JWT `iss`) | Same page — copy **Issuer ID** at the top |
| `APP_STORE_CONNECT_API_KEY_KEY` | Base64-encoded `.p8` private key | Download `.p8` once → `base64 -i AuthKey_XXXX.p8 \| tr -d '\n'` → paste as secret |
| `APPLE_ID` | Apple ID email for Appfile | Your Apple Developer account email |
| `ITC_TEAM_ID` | App Store Connect Team ID (optional if single team) | ASC → Users and Access → or `fastlane produce` / Membership details |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI personal access token | [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) → Generate new token |
| `SUPABASE_PROJECT_ID` | Project ref | Dashboard → Project Settings → General → **Reference ID** (`ngmvmlulzacrlicuagyp`) |
| `VERCEL_TOKEN` | Vercel CLI / API token | Vercel → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Vercel team/org id | `vercel link` locally or Project Settings → General |
| `VERCEL_PROJECT_ID` | Vercel project id for `majalis-majalis` | Project Settings → General → Project ID (`prj_W2pUhYZqBRzwplLCrr5wU4lha1DV`) |

### Optional / recommended

| Name | Type | Purpose |
|---|---|---|
| `MATCH_PASSWORD` | Secret | Only if you later enable Fastlane Match |
| `ALLOW_SUPABASE_AUTO_MIGRATE` | **Repository variable** (`true`) | Allows `supabase db push` on push to `main` when migrations change. **Default: off** (list-only). Prefer `workflow_dispatch` with `apply=true`. |

---

## Workflows

### 1. iOS TestFlight — `.github/workflows/ios-testflight-deploy.yml`

**Triggers:** git tag `v*.*.*` **or** Actions → *iOS TestFlight Deploy* → Run workflow.

**What it does:**
1. Builds the Vite web app and runs `cap sync ios`
2. Sets up Ruby + Fastlane
3. Resolves SPM
4. Runs `bundle exec fastlane ios beta` (ASC API Key JWT → increment build → `gym` → `pilot`)

**Release command:**
```bash
git tag v1.2.3
git push origin v1.2.3
```

### 2. Supabase migrations — `.github/workflows/supabase-migrations.yml`

**Triggers:** push to `main` touching `artifacts/majalis/supabase/migrations/**`, or manual dispatch.

**Safety:** `supabase db push` runs only when:
- `workflow_dispatch` with **apply = true**, or
- repository variable `ALLOW_SUPABASE_AUTO_MIGRATE=true` on push

Otherwise the job links the project and lists migrations only (no Production apply).

### 3. Vercel check — `.github/workflows/vercel-check.yml`

**Triggers:** every PR → `main`.

Runs `pnpm typecheck`, ESLint `--max-warnings=0`, production `build`, and `git diff --exit-code`.

---

## Local Fastlane bootstrap

```bash
cd /path/to/majalis
bundle install
export APP_STORE_CONNECT_API_KEY_ID=...
export APP_STORE_CONNECT_ISSUER_ID=...
export APP_STORE_CONNECT_API_KEY_KEY="$(base64 -i AuthKey_XXX.p8 | tr -d '\n')"
export APPLE_TEAM_ID=5D8TX37HTS
export APP_IDENTIFIER=com.yousef.majlisilm
# After web build + cap sync:
bundle exec fastlane ios beta
```

Archive-only smoke (no upload):
```bash
bundle exec fastlane ios build_only
```

---

## Native Swift integration

`AppConfig` reads `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `VERCEL_API_BASE_URL`, `APP_ENVIRONMENT` from Info.plist (injected via `artifacts/majalis/ios/App/Config.xcconfig` or CI xcconfig). Defaults in source are placeholders only — set real values in local xcconfig / CI secrets (never commit production anon keys).

`NetworkService`:
- Supabase Auth password grant + refresh (`/auth/v1/token`)
- Forwards `Authorization: Bearer <access_token>` to Vercel `/api/*`
- Offline cache fallback via `getVercelData(path:cacheKey:)`
- Typed `NetworkServiceError`

Example:
```swift
Task {
  let session = try await NetworkService.shared.signIn(email: email, password: password)
  struct Health: Decodable { let ok: Bool }
  let health = try await NetworkService.shared.getVercelAPI(path: "/api/healthz", as: Health.self)
  print(session.userId ?? "", health.ok)
}
```

---

## Enabling auto-deploy on git push

1. Add all secrets above in GitHub → Settings → Secrets and variables → Actions.
2. **Web (Vercel):** already deploys from `main` when `deploymentEnabled.main=true` in `artifacts/majalis/vercel.json`.
3. **iOS:** push a semver tag `vX.Y.Z` (or run the workflow manually).
4. **Supabase:** keep auto-migrate **off** until reviewed; then either dispatch with apply, or set `ALLOW_SUPABASE_AUTO_MIGRATE=true`.

---

## Rollback notes

- TestFlight: halt testing in ASC; ship previous build to testers.
- Vercel: promote previous deployment in Vercel Dashboard.
- Supabase: do **not** auto-revert DDL; use the paired `*_ROLLBACK.sql` packs under `artifacts/majalis/supabase/` when available, after owner review.
