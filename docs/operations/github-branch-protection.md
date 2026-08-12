# Branch protection (manual — requires repo admin)

Required status checks on `main` (do not skip):

1. `Verify build` — tsc -b, typecheck, lint 0, full tests, deterministic build, `git diff --exit-code`, migration verify (static)
2. `postgres-integration` — always on PRs/pushes via CI
3. `preview-smoke` — Ready PRs must resolve a Vercel Preview for the same head SHA
4. `xcodebuild-simulator` — when iOS/Capacitor paths change (`ios-native-macos.yml`)
5. `iOS static gates + unit tests` — when Capacitor paths change (`ios-capacitor-gates.yml`)

Also enable:

- Require a pull request before merging
- Require conversation resolution (optional)
- Do **not** allow bypass without admin
- Auto-merge: enabled (squash)
- Delete branch on merge: enabled

CODEOWNERS routes review for workflows/SQL/iOS; required reviews still need enabling in settings if desired.
