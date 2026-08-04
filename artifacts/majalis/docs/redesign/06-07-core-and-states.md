# Checkpoint 6 — Core Pages Redesign

## ما تغيّر
| الصفحة | المسار | التغيير |
|--------|--------|---------|
| Hubs (دليل/علوم/حفظ/مناسبات…) | عبر `MergedSectionHubPage` | غلاف IGDS + بطاقات `IgdsCard` |
| الدروس | `/lessons` | tokens + تخفيف الزخرفة الهندسية |
| الاختبار | `/quiz` | `IgdsPageHeader` + غلاف الصفحة |
| حسابي | `/my-learning` | ألوان/hero/بطاقات عبر `core-pages.css` |
| الإعدادات | `/settings` | غلاف LegalPage بألوان IGDS |

## Immersive (مصحف/صلاة)
لم تُكسر الشاشات الغامرة؛ تستفيد من جسر الرموز اللوني دون تغيير منطق الحساب/القراءة.

# Checkpoint 7 — States + RTL + A11y

- `AsyncDataView` يستخدم `IgdsEmptyState` / `IgdsErrorState` / `IgdsSkeleton`.
- المكوّنات IGDS تستخدم logical properties و`focus-visible` و`prefers-reduced-motion` و`min 44px`.
- Bottom nav: safe-area + aria.
