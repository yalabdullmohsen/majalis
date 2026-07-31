# VERCEL PROJECT INVENTORY

## Claimed production

| Field | Value |
|---|---|
| Project ID | `prj_W2pUhYZqBRzwplLCrr5wU4lha1DV` |
| Name | `majalis-majalis` |
| Domains | `majlisilm.com`, `www.majlisilm.com` |
| Repo | `yalabdullmohsen/majalis` |
| Root Directory (expected) | `artifacts/majalis` |
| Framework in repo `vercel.json` | `vite` |
| Dashboard framework claim | May show **Next.js** in UI (cosmetic mismatch). Repo + buildCommand are Vite. Do **not** flip Production preset without Preview proof. |
| Preview from non-main | Controlled by `git.deploymentEnabled` |

## majalis-api-server (secondary)

| Field | Value |
|---|---|
| Artifact | `artifacts/api-server` (`@workspace/api-server`) |
| `artifacts/api-server/vercel.json` | `ignoreCommand` **exits 0** — intentionally skips rebuild in that Vercel project |
| Role | Push-notification / Express API; **not** the public web production surface (`majlisilm.com`) |
| Dashboard status often `CANCELED` | Expected when ignoreCommand skips the build — **do not** treat as web Production failure |
| Root `typecheck` | Excludes api-server by design |

If api-server becomes required for a release, remove/adjust `ignoreCommand` and add a CI build step for `@workspace/api-server` before merge. Until then, web readiness = `majalis-majalis` only.

## Other similarly named projects

Do **not** delete until compared: Git link, domains, env, build, output, production branch.

## REQUIRES_EXPLICIT_APPROVAL

- Unlink Git from non-prod projects
- Domain moves
- Framework preset change on production (`vite` ↔ Next.js UI)
- Deletion of projects
- Enabling api-server as a production dependency
