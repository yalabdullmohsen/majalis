# Vercel Preview configuration

## Change in this PR

`artifacts/majalis/vercel.json`: `git.deploymentEnabled: true` so non-`main` branches receive Preview deployments (previously only `main`).

## Production project

- ID: `prj_W2pUhYZqBRzwplLCrr5wU4lha1DV` (`majalis-majalis`)
- Root Directory: `artifacts/majalis`
- Domains: `majlisilm.com`, `www.majlisilm.com`

## REQUIRES_EXPLICIT_APPROVAL

- Changing Dashboard framework preset (Vite vs Next.js claim)
- Unlinking/deleting other similarly named Vercel projects
