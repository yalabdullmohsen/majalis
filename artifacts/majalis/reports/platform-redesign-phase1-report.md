# تقرير المرحلة الأولى — إعادة تصميم المنصة 2026

## ما الذي تم تحسينه

### Design System
- **`tokens-2026.css`**: Palette موحّدة (Primary, Secondary, Surface, Success, Warning, Error, Info) + Dark Mode
- **جسر `--majalis-*` و `--ds-*`**: مصدر واحد للألوان عبر `--mi-*`
- **`icons.tsx`**: سجل Lucide موحّد — بديل عن Emoji في الواجهات العامة
- **`theme.ts`**: إضافة semantic tokens

### الصفحة الرئيسية (v4)
- شبكة **وصول سريع** (12 بطاقة: مصحف، دروس، أبحاث، حلقات، مشايخ، مكتبة، …)
- أقسام جديدة: **المشايخ، الأبحاث، الحلقات، الدورات، المكتبة، آخر الإضافات**
- بحث محسّن مع أيقونة Lucide
- إحصائيات حية (موجودة في `app/page.tsx` — HomeStatsBar)

### التنقل
- **`NAV_GROUPS`**: 4 مجموعات منطقية (استكشف، محتوى، قرآن، عبادات) — بدون تكرار
- **`PRIMARY_NAV`**: 8 عناصر واضحة
- **`MOBILE_MORE_NAV`**: مكمّل بدون ازدواجية

### الإذاعة
- **واجهة v2**: Now Playing، موجة صوتية، بحث، مفضلة
- **Mini Player** عبر الموقع (`RadioPlayerProvider`)
- **Media Session API** لشاشة القفل
- **إزالة محطة المنشاوي المكررة** (9 قرّاء بدل 10)
- **إزالة عرض «السورة الحالية» الوهمي** (لم يكن يعمل)

### المصحف
- **604 صفحة / 114 سورة** — مؤكد (`verify:kuwait-mushaf` PASS)
- **فهرس صفحات كامل** (إزالة حد 120)
- **مزامنة URL** (`?page=N`) عند التنقل
- **Redirect** `/kuwait-mushaf` → `/quran/mushaf`

## ما الذي تم إصلاحه

| المشكلة | الإصلاح |
|---|---|
| تضارب `--ds-*` vs `--majalis-*` | tokens-2026.css |
| Emoji في المكتبة والسؤال وجواب | Lucide icons |
| محطة منشاوي مكررة | حذف `minshawi` |
| nowPlaying دائماً فارغ | إزالة UI المضلّل |
| فهرس مصحف 120 صفحة فقط | 604 صفحة |
| لا redirect لـ kuwait-mushaf | Route redirect |

## الاختبارات

```bash
pnpm --filter @workspace/majalis run verify:platform-redesign  # 15/15 PASS
pnpm --filter @workspace/majalis run verify:kuwait-mushaf      # PASS
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build  # PASS
```

## ما لم يُنفّذ بعد (مراحل لاحقة)

- إعادة تصميم **كل** الصفحات الداخلية (دروس، إدارة، قرآن نصي، …) — Phase 1 ركّز على الأساس + الرئيسية + الإذاعة + المصحف
- إزالة Emoji من **sin-jeem seed data** و **rulings categories** (~110 emoji في البيانات)
- دمج shadcn/ui بالكامل أو إزالة dead deps (`react-icons`)
- Lighthouse audit رسمي + Visual regression
- Unit/Integration test suite (غير موجود في المشروع حالياً)
- Supabase Storage للمرفقات / Realtime للدردشة

## الملفات الرئيسية المعدّلة

```
src/styles/tokens-2026.css
src/styles/design-system.css (home v4)
src/styles/quran-media.css (radio v2)
src/lib/icons.tsx
src/lib/navigation.ts
src/lib/theme.ts
src/views/HomePage.tsx
src/views/QuranRadioPage.tsx
src/components/radio/RadioPlayerProvider.tsx
src/components/home/* (FeatureCards, Library, Sheikhs, Research, Circles)
src/hooks/useKuwaitMushaf.ts
src/components/mushaf/MushafSidebar.tsx
scripts/verify-platform-redesign-phase1.mjs
```
