# CLEANUP_MANIFEST — إثبات قبل الحذف (المرحلة 0)

**التاريخ:** 2026-08-08
**الأساس:** `c777bae1a`
**وسم التراجع:** `snapshot/pre-cleanup-2026-08` (مرفوع إلى origin)

## المنهج

1. رسم بياني لاستيرادات الدخول من `main.tsx` + `App.tsx` (ثابت + `import()` + استيراد جانبي CSS + `@import`).
2. فحص عكسي: لا مستورد لأي مرشّح حذف (بما فيه ملفات ميتة أخرى).
3. فحص سلسلة نصية لاسم الملف / مسار `@/…` في `src` و`.github` و`scripts` (والوثائق تُبقي الملف عند الذكر).
4. depcheck تقريبي لاستيرادات الحزم (كثير من الإيجابيات الكاذبة — Capacitor/@types/أدوات بناء = **مرتفع/إبقاء**).

## إحصاء

| مقياس | قيمة |
|---|---|
| ملفات src قابلة للوصول من الدخول | 1145 |
| غير قابلة للوصول (إنتاج، بلا اختبارات) | 301 |
| مرشّح حذف منخفض الخطر (A✓B✓C✓) | 160 |
| مرشّح متوسط | 9 |
| إبقاء (فشل C أو سياق خطر) عيّنة | 50 |
| حجم المرشّحين المنخفضين | 1.95 MB |

## حالة المراحل المكتملة مسبقاً على main

| المرحلة | PR | الحالة |
|---|---|---|
| 1 — exclude-nonprod | #928 | مدمج |
| 1 — capacitor-mirror | #929 | مدمج |
| 1 — remove-unused-css | #930 | مدمج |
| 5 — dedupe-components | #931 | مدمج |
| 5 — unify-design-tokens | #932 | مدمج |

## مرتفع الخطر — لا حذف في هذه الجولة

| المسار / الفئة | السبب |
|---|---|
| `artifacts/mushafi/**` | مرجع تسميع — ممنوع |
| `artifacts/majalis-mobile/**`, `majlisilm-flutter/**` | تجميد فقط |
| `public/data/**` (مصحف/كتب/…) | طلب ديناميكي بالاسم |
| حزم `@capacitor/*`, `@types/*`, `vite`/`tailwind` | بناء/أصلي/أنواع — إيجابيات كاذبة لـ depcheck |
| أي ملف ذُكر اسمه في workflow/سكربت/اختبار | فشل الفحص C |

## عيّنة مرشّحين منخفضي الخطر (أصغر 40)

| المسار | الحجم | الفحوص | الخطر |
|---|---|---|---|
| `artifacts/majalis/src/components/ui/aspect-ratio.tsx` | 140 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/hooks/useQuranEngineCore.ts` | 205 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/app/app.tsx` | 260 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/skeleton.tsx` | 266 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/collapsible.tsx` | 329 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/shared/config/brand.ts` | 396 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/widgets/SectionHeader.tsx` | 432 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/hooks/useSmartRecommendations.ts` | 476 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/hooks/use-mobile.tsx` | 565 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/textarea.tsx` | 649 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/label.tsx` | 724 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/separator.tsx` | 756 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/input.tsx` | 768 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/hooks/useIslamicTopicIndex.ts` | 799 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/progress.tsx` | 818 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/kbd.tsx` | 862 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/sonner.tsx` | 894 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/entities/scholar/hooks.ts` | 959 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/hooks/useDiagnostics.ts` | 984 B | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/checkbox.tsx` | 1.0 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/slider.tsx` | 1.0 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/hooks/useStorageReconciler.ts` | 1.0 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/badge.tsx` | 1.1 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/hooks/useClsReservedContent.ts` | 1.1 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/hooks/useEducationalProgress.ts` | 1.1 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/switch.tsx` | 1.1 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/shared/lib/knowledge-graph.ts` | 1.2 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/hover-card.tsx` | 1.2 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/tabs.tsx` | 1.2 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/tooltip.tsx` | 1.2 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/hooks/useQuranAppController.ts` | 1.2 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/hooks/useDeltaSync.ts` | 1.3 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/hooks/useMemoryPressureObserver.ts` | 1.3 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/hooks/useCrossTabSync.ts` | 1.3 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/popover.tsx` | 1.3 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/lib/client-error-logs-service.ts` | 1.3 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/hooks/useQuranKhatmah.ts` | 1.4 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/radio-group.tsx` | 1.4 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/avatar.tsx` | 1.4 KB | A✓ B✓ C✓ | منخفض |
| `artifacts/majalis/src/components/ui/toggle.tsx` | 1.5 KB | A✓ B✓ C✓ | منخفض |

## مرشّحون متوسطون (إبقاء مؤقت أو دفعة لاحقة حذرة)

| المسار | الحجم | ملاحظة |
|---|---|---|
| `artifacts/majalis/src/features/search/quick-nav.ts` | 1.4 KB | seeds/صفحات — إثبات إضافي قبل الحذف |
| `artifacts/majalis/src/features/search/unified-local.ts` | 1.4 KB | seeds/صفحات — إثبات إضافي قبل الحذف |
| `artifacts/majalis/src/pages/quran/MushafComingSoonPage.tsx` | 2.3 KB | seeds/صفحات — إثبات إضافي قبل الحذف |
| `artifacts/majalis/src/lib/researches/demo-seed.ts` | 4.7 KB | seeds/صفحات — إثبات إضافي قبل الحذف |
| `artifacts/majalis/src/lib/tafsir-seed.ts` | 32.3 KB | seeds/صفحات — إثبات إضافي قبل الحذف |
| `artifacts/majalis/src/lib/scientific-announcements-seed.ts` | 48.4 KB | seeds/صفحات — إثبات إضافي قبل الحذف |
| `artifacts/majalis/src/lib/researches/published-seed-fill.ts` | 119.3 KB | seeds/صفحات — إثبات إضافي قبل الحذف |
| `artifacts/majalis/src/lib/researches/published-seed-fill-b2.ts` | 185.7 KB | seeds/صفحات — إثبات إضافي قبل الحذف |
| `artifacts/majalis/src/lib/researches/published-seed-fill-b3.ts` | 196.6 KB | seeds/صفحات — إثبات إضافي قبل الحذف |

## دفعة الحذف المقترحة التالية (≤12، أيتام بلا مستورد)

- `artifacts/majalis/src/components/ui/aspect-ratio.tsx` (140 B)
- `artifacts/majalis/src/app/app.tsx` (260 B)
- `artifacts/majalis/src/components/ui/collapsible.tsx` (329 B)
- `artifacts/majalis/src/hooks/useSmartRecommendations.ts` (476 B)
- `artifacts/majalis/src/hooks/useIslamicTopicIndex.ts` (799 B)
- `artifacts/majalis/src/components/ui/progress.tsx` (818 B)
- `artifacts/majalis/src/components/ui/kbd.tsx` (862 B)
- `artifacts/majalis/src/components/ui/sonner.tsx` (894 B)
- `artifacts/majalis/src/hooks/useDiagnostics.ts` (984 B)
- `artifacts/majalis/src/components/ui/checkbox.tsx` (1.0 KB)
- `artifacts/majalis/src/components/ui/slider.tsx` (1.0 KB)
- `artifacts/majalis/src/hooks/useStorageReconciler.ts` (1.0 KB)

## ملاحظات Vite / الحزمة

- آخر `dist` محلي ≈ 191MB (يشمل أصول عامة كثيرة؛ ليس JS فقط).
- CSS الحرج بعد تنظيف #930/#932 ≈ 338KB (كان أعلى مع elite).
- لا تُحذف حزم قبل إعادة فحص يدوي لاستيرادات ديناميكية و`vite.config`.

