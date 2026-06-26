# Vercel Deployment — المجلس العلمي (majalis)

هذا المشروع **Vite + React SPA** مع **Serverless API** (`api/index.js`).  
**ليس Next.js** — لا تستخدم إعدادات Next.js في Vercel.

---

## الإعداد الصحيح في Vercel Dashboard

| الحقل | القيمة |
|---|---|
| **Root Directory** | `artifacts/majalis` |
| **Framework Preset** | **Vite** |
| **Build Command** | `pnpm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `cd ../.. && pnpm install` |

---

## ما يفعله البناء

```bash
pnpm run build
# = pnpm run generate:seo && vite build
```

1. `generate:seo` — يولّد `public/sitemap.xml`, `public/robots.txt`, `public/feed.xml`
2. `vite build` — يُخرج SPA إلى **`dist/`** (وليس `dist/public`)

---

## ممنوع

| ❌ لا تستخدم | السبب |
|---|---|
| `dist/public` | خاص بمشاريع pitch/promo فقط — يسبب 404 |
| `next build` | المشروع Vite وليس Next.js |
| `.next` كـ Output | ليس مخرج هذا المشروع |
| `next.config.mjs` في جذر المشروع | Vercel يكتشف Next.js تلقائيًا — أعد تسميته إلى `.legacy` |

---

## التحقق قبل النشر

```bash
cd artifacts/majalis
pnpm run build
pnpm run verify:deploy
```

يجب أن يمر `verify:deploy` بدون أخطاء.

---

## SPA Fallback (vercel.json)

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

- `/api/*` → Serverless functions
- كل مسار آخر → `index.html` (Wouter client routing)
- الملفات الثابتة (`sitemap.xml`, `robots.txt`, assets) تُخدم من `dist/` مباشرة

---

## إذا ظهر 404: NOT_FOUND

### 1. تحقق من Output Directory

```bash
pnpm run build
ls -la dist/index.html dist/sitemap.xml dist/robots.txt
pnpm run verify:deploy
```

### 2. تحقق من Vercel Dashboard

- Framework = **Vite** (ليس Next.js)
- Output Directory = **`dist`** (ليس `dist/public` ولا `.next`)
- Root Directory = **`artifacts/majalis`**
- Build Command = **`pnpm run build`**

### 3. تحقق من vercel.json

يجب أن يحتوي على:

```json
{
  "framework": "vite",
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist"
}
```

### 4. تحقق من آخر Deployment

- Branch: `main`
- Status: **Ready**
- Environment: **Production**
- Project: `majalis-majalis`

### 5. اختبر بعد النشر

```bash
curl -I https://majlisilm.com/
curl -I https://majlisilm.com/lessons
curl -I https://majlisilm.com/sitemap.xml
curl -I https://majlisilm.com/robots.txt
curl https://majlisilm.com/api/healthz
```

---

## خطأ Output Directory

| الخطأ | الحل |
|---|---|
| `dist/public` not found | غيّر Output إلى `dist` |
| `.next` not found | غيّر Framework إلى Vite و Output إلى `dist` |
| Homepage 404 | تأكد من وجود `dist/index.html` + SPA rewrite |
| `/lessons` 404 | أضف SPA rewrite إلى `/index.html` |
| `/sitemap.xml` 404 | شغّل `pnpm run generate:seo` قبل البناء |

---

## API و Cron

- API entry: `api/index.js`
- Cron jobs: مُعرّفة في `vercel.json` → `/api/cron/*`
- لا تغيّر rewrite الـ API عند إصلاح SPA

---

## اختبار محلي

```bash
pnpm run build
pnpm run verify:deploy
npx serve dist -l 3000
# افتح http://localhost:3000/lessons — يجب أن يعمل (SPA)
```

---

## منع تكرار الخطأ

1. **لا تدمج PR** يغيّر `build` إلى `next build` بدون مراجعة DevOps
2. شغّل **`pnpm run verify:deploy`** في CI قبل النشر
3. راجع **`vercel.json`** — يجب أن يبقى `"framework": "vite"` و `"outputDirectory": "dist"`
4. **`dist/public`** مخصص فقط لـ `majalis-pitch` و `majalis-promo`
