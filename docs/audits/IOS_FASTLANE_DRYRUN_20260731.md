# iOS native build & Fastlane dry-run — 2026-07-31

**PR:** #672 (`cursor/ios-cicd-automation-38ac`)  
**Bundle ID:** `com.yousef.majlisilm` (unchanged)  
**Team:** `5D8TX37HTS`

## Environment of this agent

| Capability | Available? |
|---|---|
| Linux static iOS gates (`test:ios-gates`) | Yes |
| macOS / Xcode / Simulator | **No** (cloud Linux runner) |
| Fastlane `bundle exec` | Ruby/Bundler not installed here |
| App Store Connect API secrets | Not injected into this agent |

Therefore: native `xcodebuild` and live `fastlane beta` uploads are **documented as CI/workflow contracts**; verified here via static gates + Fastfile/workflow review.

---

## 1) Static iOS gates (executed)

```bash
pnpm --filter @workspace/majalis run test:ios-gates
```

**Result:** PASS (includes new Keychain gates: `KeychainStore.swift` present, `persistSession` uses Keychain only, no UserDefaults token blob writes).

Also:

```bash
pnpm run verify:no-unsafe-auto-merge
# includes supabase-migrations.yml pins + apply/include-all gates
python3 -c "import yaml; …"  # ios-testflight / supabase-migrations / vercel-check
```

**Result:** PASS (2026-07-31 agent re-run after Keychain + Supabase hardening).

---

## 2) iOS native build (macOS CI on PR #672)

Workflow: `.github/workflows/ios-native-macos.yml` — job **`xcodebuild-simulator`**.

On paths under `artifacts/majalis/ios/**` it runs:

1. `pnpm build` + `cap sync ios`
2. **Debug** simulator `xcodebuild clean build`
3. **Release** `CODE_SIGNING_ALLOWED=NO` archive-style build

**PR #672 — Keychain revision (`73689613a`):** ✅ **SUCCESS** —  
https://github.com/yalabdullmohsen/majalis/actions/runs/30617503045  

**Earlier revision (pre-Keychain):** ✅ SUCCESS —  
https://github.com/yalabdullmohsen/majalis/actions/runs/30612558151  

Agent Linux environment cannot execute local `xcodebuild`; macOS CI above is the native proof.

---

## 3) Fastlane dry-run contract

Workflow: `.github/workflows/ios-testflight-deploy.yml`  
Lane: `fastlane/Fastfile` → `ios beta` and `ios build_only`

| Step | Dry-run expectation |
|---|---|
| `bundle install` | Requires Ruby 3.3 + `Gemfile` |
| `xcodebuild -resolvePackageDependencies` | SPM resolve for CapApp-SPM |
| `fastlane ios build_only` | Archive with `CODE_SIGNING_ALLOWED=NO` (no upload) |
| `fastlane ios beta` | Needs ASC secrets; increments TestFlight build; `gym` + `pilot` |

**Local dry-run (owner macOS):**

```bash
cd /path/to/majalis
bundle install
pnpm install --frozen-lockfile
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
cd artifacts/majalis && pnpm exec cap sync ios && cd ../..
bundle exec fastlane ios build_only
```

**Agent status:** Fastfile reviewed; `build_only` lane present for signing-free smoke. Live TestFlight upload intentionally not attempted without ASC secrets.

---

## 4) Auth token storage (this PR revision)

| Before | After |
|---|---|
| `UserDefaults` session blob | `KeychainStore` (`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`) |
| — | Legacy UserDefaults key purged on restore |

Gate enforced in `scripts/test-ios-capacitor-gates.mjs`.

---

## 5) Supabase CLI / db push (this PR revision)

| Setting | Value |
|---|---|
| CLI version | **pinned `2.110.0`** (not `latest`) |
| Apply path | **`workflow_dispatch` + `apply=true` only** |
| `--include-all` | Only if `confirm_include_all=true` as well |
| Push to `main` | List/status only |

---

## Sign-off checklist for reviewers

- [x] Title no longer misleading `[DRAFT]` once Ready for review  
- [x] Keychain token storage + gate  
- [x] Supabase CLI pinned  
- [x] Production `db push` dispatch-gated; `--include-all` double-confirmed  
- [ ] Owner: run `fastlane ios build_only` on macOS once ASC/Xcode available  
- [ ] Owner: confirm `ios-native-macos` / TestFlight workflow greens with secrets
