# تقرير إعادة تصميم UI/UX 2026 — المجلس العلمي

**التاريخ:** 2026-06-26  
**الفرع:** `cursor/full-ui-redesign-2026-92e6`  
**النطاق:** إعادة تصميم شاملة للواجهة مع الحفاظ على جميع Routes وAPIs وقاعدة البيانات.

---

## 1. تحليل ما قبل التصميم

### نقاط الضعف المكتشفة

| المجال | المشكلة |
|--------|---------|
| **نظام التصميم** | تضارب `--majalis-*` vs `--ds-*` vs `--v3` في ملفات CSS متعددة |
| **index.css** | ملف ضخم (~12k سطر) يحتوي styles قديمة ومتكررة |
| **البطاقات** | 10+ مكوّن بطاقة مختلف + 4 أنماط CSS |
| **القائمة** | 9 عناصر في PRIMARY_NAV — تكدّس بصري |
| **الرئيسية** | Hero بسيط؛ 11 مكوّن home غير مستخدم |
| **Footer** | تصميم v3 باهت؛ لا يتناسق مع Hero |
| **Auth** | login-page قديم بـ classes منفصلة |
| **404** | inline styles بدلاً من design system |
| **shadcn/ui** | 56 مكوّن مثبت — استخدام محدود |

### الصفحات الم analyzed

162 view في `src/views/` — التصميم الجديد يطبّق عبر **طبقة CSS موحّدة** + **مكوّنات shell** دون تعديل كل صفحة على حدة (zero route breakage).

---

## 2. استراتيجية التنفيذ

### المبدأ: Foundation-First

بدلاً من تعديل 162 صفحة يدوياً:

1. **`ui-2026.css`** — طبقة تصميم 2026 تُ override جميع `.ui-card`, `.ds-btn`, `.navbar-v3`, `.page-shell`, forms, tags
2. **`html.ui-2026`** — class على `<html>` لتفعيل التصميم globally
3. **Shell redesign** — NavBar, SiteFooter, HomePage, Login, Register, 404
4. **Shared primitives** — `ui-common.tsx` Loading + Card محسّnan
5. **CI guard** — `verify:ui-2026` (15 فحص)

---

## 3. مواصفات التصميم 2026

| العنصر | القيمة |
|--------|--------|
| **Minimal** | مساحات بيضاء واسعة، typography واضحة |
| **Glass UI** | Navbar + search bar + auth cards — `backdrop-filter: blur(16px)` |
| **Cards** | `--ui26-radius-lg: 1.25rem`, shadow خفيف، hover `-3px` |
| **Colors** | Emerald `#145a46` · Gold `#b8922a` · Surface `#ffffff` |
| **Typography** | Cairo/Tajawal · `--ui26-font-display: clamp(2rem, 5vw, 3.25rem)` |
| **Animations** | `ui26-page-in`, shimmer skeleton, spinner loading |
| **Accessibility** | `prefers-reduced-motion: reduce` support |
| **Dark mode** | tokens محدّثة في `html[data-theme="dark"]` |

---

## 4. ما تم تنفيذه

### أ) طبقة التصميم (`ui-2026.css`)

- ~650 سطر tokens + overrides
- Navbar glass + pill tabs
- Unified cards (`.ui-card`, `.page-card`, `.unified-content-card`, `.lesson-unified-card`)
- Buttons pill-shaped
- Forms focus rings
- Content hub polish
- Settings/profile cards

### ب) الصفحة الرئيسية (`HomePage.tsx`)

- Hero جديد مع gradient mesh + logo glass card
- Search bar عائم (glass)
- **HomePlatformStats** — إحصائيات حية من Supabase
- **HomeFeatureGrid** — 11 بطاقة أقسام
- **HomeMoreSections** — 12 رابط إضافي
- Grid ثنائي للأقسام اليومية
- جميع الأقسام السابقة محفوظة (دروس، سؤال، فائدة، قرآن، أذكار، صلاة، إذاعة، بث)

### ج) شريط التنقل

- PRIMARY_NAV: 9 → **7** عناصر (أقل تكدّس)
- إضافة **المشايخ** · إزالة الحلقات/الدورات/عن المنصة من الشريط (متوفرة في القائمة الجانبية)
- إزالة inline styles — CSS tokens فقط
- Search box محسّن مع focus ring

### د) Footer

- `site-footer--v2026` — emerald background احترافي
- Grid responsive للمجموعات

### هـ) Auth + Errors

- Login / Register — `auth-page--v2026` + glass card
- 404 — `not-found-page--v2026`

### و) UX

- Loading spinner جديد
- Card hover موحّد
- Skeleton shimmer animation

---

## 5. الملفات المعدّلة

| ملف | التغيير |
|-----|---------|
| `src/styles/ui-2026.css` | **جديد** — طبقة التصميم 2026 |
| `src/views/HomePage.tsx` | إعادة بناء كاملة |
| `src/components/home/HomePlatformStats.tsx` | **جديد** |
| `src/components/home/HomeFeatureGrid.tsx` | **جديد** |
| `src/components/home/HomeMoreSections.tsx` | **جديد** |
| `src/components/NavBar.tsx` | إزالة inline styles |
| `src/components/SiteFooter.tsx` | v2026 footer |
| `src/components/ui-common.tsx` | Loading + Card |
| `src/components/AppShell.tsx` | ui-2026 class |
| `src/views/not-found.tsx` | redesign |
| `src/views/LoginPage.tsx` | redesign |
| `src/views/RegisterPage.tsx` | redesign |
| `src/lib/navigation.ts` | streamlined PRIMARY_NAV |
| `src/main.tsx` | import ui-2026.css |
| `src/App.tsx` | ui-2026-app class |
| `src/app/layout.tsx` | html.ui-2026 |
| `src/app/page.tsx` | stats v2026 classes |
| `scripts/verify-ui-2026-redesign.mjs` | **جديد** CI guard |
| `.github/workflows/ci.yml` | verify:ui-2026 step |

---

## 6. ما لم يُكسر

- ✅ جميع Routes (`App.tsx` — 80+ route)
- ✅ جميع APIs وSupabase queries
- ✅ Code splitting (lazy routes)
- ✅ Admin panel (يستفيد من card/button overrides)
- ✅ Sin Jeem (CSS منفصل — لم يُمس)
- ✅ RTL + dark mode

---

## 7. التحقق

| الفحص | النتيجة |
|-------|---------|
| `pnpm run typecheck` | ✅ |
| `pnpm run verify:ui-2026` | ✅ 15/15 |
| `pnpm run build` | ✅ (~495KB main bundle — +7KB فقط) |

---

## 8. Lighthouse / Performance

- **JS increase:** ~7KB gzip على main bundle (CSS-only layer + 3 home components)
- **No new dependencies**
- **Code splitting preserved**
- Lighthouse ≥95 يتطلب قياس post-deploy على Production

---

## 9. المرحلة التالية (اختياري)

1. دمج PR ونشر Production
2. Migrate feature CSS (`quran-v2.css`, `adhkar-v3.css`) إلى ui-2026 tokens
3. Admin panel dedicated refresh
4. Lighthouse audit post-deploy

---

*تم إعداد هذا التقرير ضمن Full UI/UX Redesign 2026.*
