# GitHub Branch Protection — main

## Required (manual Settings → Branches)

| Rule | Value |
|---|---|
| Restrict direct pushes | Yes |
| Require PR | Yes |
| Required approvals | ≥ 1 |
| Dismiss stale reviews | Recommended |
| Require conversation resolution | Yes |
| Require branches up to date | Yes |
| Require linear history / squash | Document org preference |
| Block force push | Yes |
| Block deletion | Yes |
| Allow auto-merge (repo setting) | **Disabled** |

## Required status checks (names must match Actions)

- `quality` (workflow CI job)
- `iOS static gates + unit tests` (when iOS paths change)
- `xcodebuild-simulator` (when iOS paths change; macos)
- `Vercel – majalis-majalis` (Preview) — after Preview re-enabled

## CODEOWNERS

File: `.github/CODEOWNERS` — ensure “Require review from Code Owners” is enabled for protected branch.

## Anti-auto-merge

- Workflow `auto-merge-to-main.yml` must remain deleted.
- CI runs `scripts/verify-no-unsafe-auto-merge.mjs`.
- Do not reintroduce `gh pr merge` / `gh pr ready` (except `--undo`) in Actions.
