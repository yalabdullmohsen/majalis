# 01 — خريطة المستودع

**Commit:** `975505911116f6190e2d09fc97ced3dbbb02e37d` · **Root:** `/Users/alabdullmohsen/majlis-app`

## CONFLICTS_AND_UNKNOWNS

- وثائق تشير إلى جذر `/Users/alabdullmohsen/majalis-correct` بينما الجذر الفعلي `/Users/alabdullmohsen/majlis-app`. مصادر: `AGENTS.md`, `docs/REPO_INDEX.md`.
- `PROJECT_AUDIT.md` غير موجود بالاسم؛ البدائل: `AUDIT.md`, `AUDIT_REPORT.md`, `AUDIT_INVENTORY.md`.

## شجرة مختصرة (مهم فقط)

```
/Users/alabdullmohsen/majlis-app/
├── artifacts/majalis/          # PRODUCT — web + Capacitor source
├── artifacts/api-server/       # Express push API
├── artifacts/mushafi/          # REFERENCE — tasmee3 (do not delete)
├── artifacts/majalis-mobile/   # FROZEN Expo (not store path)
├── artifacts/majlisilm-flutter/# DEPRECATED (excluded from workspace)
├── artifacts/majalis-pitch|promo|mockup-sandbox/  # NON-PROD marketing
├── artifacts/supabase/         # tiny RLS addon
├── artifacts/data|content-audit|release-train|screenshots/
├── supabase/                   # root SQL packs + migrations/
├── scripts/                    # root verify/CI helpers (workspace pkg)
├── lib/                        # shared libs (db placeholder, integrations)
├── .github/workflows/          # CI/CD
├── docs/                       # documentation (+ project-knowledge/)
├── reports/                    # generated/audit reports (often dirty locally)
├── fastlane/                   # iOS release helpers
├── store/                      # store assets
└── package.json | pnpm-workspace.yaml | pnpm-lock.yaml
```

## المستوى الأعلى

| مسار | الغرض | التصنيف | typecheck/build/deploy؟ | تعديل؟ |
|---|---|---|---|---|
| `artifacts/` | منتجات فرعية | Mixed | حسب الحزمة | بحذر |
| `supabase/` | SQL منصة | Schema-in-repo | يدوي/workflows | موافقة مالك للتطبيق المستضاف |
| `scripts/` | تحقق وأتمتة جذر | Active | نعم (workspace) | نعم ضمن النطاق |
| `lib/` | مكتبات مشتركة | Partial | typecheck:libs | نعم بحذر |
| `docs/` | توثيق | Docs | لا build منتج | نعم |
| `.github/` | CI | Active | يشغّل CI | حساس — لا إضعاف بوابات |
| `fastlane/` | iOS | Native ops | workflows iOS | موافقة للمتجر |
| `store/` | أصول متجر | Assets | لا | بحذر |
| `reports/` | مخرجات تدقيق | Generated/audit | لا | غالبًا لا تُلتزم |
| `api/`, `app/`, `public/` (جذر) | بقايا/مساندة | Unknown/legacy mix | ليس مسار majalis الرئيسي | تجنب دون دليل |
| `.migration-backup/` | لقطة schema قديمة | Reference | يدوي | لا كمصدر وحيد |
| `node_modules/` | اعتماديات | Generated | — | لا تُلتزم |
| `.env.local` | أسرار محلية | Secrets | — | **لا تقرأ/لا تخرج قيم** |
| `.vercel/` | ربط Vercel محلي | Local | — | لا تخرج أسرار |

## Artifacts بالتفصيل

| Artifact | package name | دور | حالة | في build الجذر؟ |
|---|---|---|---|---|
| `majalis` | `@workspace/majalis` | ويب سُنّة + Capacitor | **Production** | نعم |
| `api-server` | `@workspace/api-server` | Push Expo | Production مساعد | مُستبعد من build الجذر؛ يُبنى عند الحاجة |
| `majalis-mobile` | `@workspace/majalis-mobile` | Expo | Frozen | مستبعد |
| `majalis-pitch` | — | تسويق | Non-prod | مستبعد |
| `majalis-promo` | — | تسويق | Non-prod | مستبعد |
| `mockup-sandbox` | — | تجارب | Non-prod | مستبعد |
| `mushafi` | Flutter/ASR | مرجع تسميع | Reference | منفصل (`tasmee3_ci.yml`) |
| `majlisilm-flutter` | — | مهجور | Deprecated | **مستبعد من workspace** |
| `supabase` | — | SQL صغير | Addon | يدوي |
| `data` / `content-audit` / `release-train` / `screenshots` | مساعدة | Support | حسب الحاجة |

المصادر: `PLATFORMS.md`, `pnpm-workspace.yaml`, `package.json`, `docs/REPO_INDEX.md`.

## منتج فعلي — تأكيد

1. **الموقع:** `artifacts/majalis` (Vite) يُنشر عبر Vercel (`artifacts/majalis/vercel.json`).
2. **تطبيق Capacitor:** نفس `artifacts/majalis`؛ `webDir: dist`؛ `appId: com.yousef.majlisilm`.
3. **مجمّد للمتجر:** `majalis-mobile`, `majlisilm-flutter`.
4. **`artifacts/mushafi`:** مرجع — ممنوع الحذف.
5. **Generated غير متتبَّع مطلوب للبناء/المزامنة:** `artifacts/majalis/dist/`؛ `ios/App/App/public/**` (gitignore باستثناء `.gitkeep`)؛ android assets public — تُملأ بـ `cap sync` بعد build.

## packages / workspace

- `pnpm-workspace.yaml`: `artifacts/*` مع استثناء `majlisilm-flutter`؛ `lib/*`؛ `lib/integrations/*`؛ `scripts`.
- لا مجلد `packages/` منفصل في الجذر (Confirmed: `ls`).

## مالك المسؤولية التقنية

- **Unknown** كأسماء أشخاص في المستودع.
- حوكمة وكيل/مالك: `docs/REQUIRES_EXPLICIT_APPROVAL.md`, `AGENTS.md`.
