# إعداد Vercel Preview — majalis-majalis

## المشروع الأساسي

- **Project:** `majalis-majalis`
- **Project ID:** `prj_W2pUhYZqBRzwplLCrr5wU4lha1DV`
- **Root Directory:** `artifacts/majalis`
- **Production Domain:** `https://majlisilm.com`
- **Node:** 24.x — **pnpm:** 10.34.4

## سبب Ignored بعد PR #616

في `artifacts/majalis/vercel.json` كان:

```json
"git": { "deploymentEnabled": { "*": false, "main": true } }
```

هذا يلغي Preview لكل الفروع غير `main`.

## الإصلاح في المستودع

- `deploymentEnabled: true` لكل الفروع (PR Preview مفعّل).
- Production ما زال من `main` عبر حماية الفرع + عدم الدمج التلقائي.

## قيم Dashboard المطلوبة (يدوي إن لزم)

| Setting | Value |
|---|---|
| Root Directory | `artifacts/majalis` |
| Install Command | من `vercel.json` (corepack + pnpm من جذر الـmonorepo) |
| Build Command | `pnpm run build` |
| Output | `dist` |
| Ignored Build Step | فارغ / لا تستبعد فروع `cursor/*` |
| Preview env | انسخ غير السرية من Production؛ **لا** تستخدم Production DB |
| Production Branch | `main` فقط |

## مشروع majalis-api-server

- عطّل Git deployments للـPRs إن لم يكن مطلوبًا، أو اربط Root منفصلًا حتى لا ينتج Deploy مزدوج مربك.

## التحقق

1. افتح PR → Deployment Preview لـ`majalis-majalis` بحالة Ready.
2. URL يشير لنفس commit SHA لرأس الـPR.
3. لا تعتمد على GitHub Actions كـdeploy بديل للويب الأساسي.
