# Checkpoint 8 — Cleanup + Tests + PR Report

## Summary
إعادة تصميم منتجية على فرع `redesign/islamic-geometric-system` بنظام **Islamic Geometric Design System (IGDS)** مع الحفاظ على المسارات والبيانات وSupabase ومنطق الصلاة/الاختبارات.

### الصفحات المعاد تصميمها
- الرئيسية (`/`)
- Hubs: الدليل، علوم القرآن، الحفظ، المناسبات…
- الدروس (`/lessons`)
- الاختبار (`/quiz`)
- حسابي (`/my-learning`)
- الإعدادات (`/settings`)
- التنقل السفلي + ورقة المزيد

### المكوّنات الجديدة
`IgdsAppShell`, `IgdsButton`, `IgdsCard`, `IgdsBadge`, `IgdsPageHeader`, `IgdsSectionHeader`, `IgdsSearchInput`, `IgdsFilterChips`, `IgdsLoading/Empty/Error/Skeleton`

## Legacy Removed / Deferred
- تأجيل `patterns.css`, `majalis-v2.css`, `modern-2026.css` عن CSS الحرج
- إزالة اعتماد الرئيسية على `home.css` / hpv4
- إخفاء TopSectionBar على الجوال
- حسابي خرج من Bottom → المزيد؛ التعلم أصبح تبويبًا أساسيًا على `/lessons`

## New Design System
انظر `docs/redesign/02-design-system.md` — Emerald / Ivory / Sage / Charcoal / Soft Gold accent / Dark readiness / RTL logical props.

## Navigation Mapping
انظر `docs/redesign/04-navigation-mapping.md` — **لا تغيير routes**.

## Testing Results
- typecheck: نجح
- lint: نجح
- build: نجح (CSS حرج ~444KB ≤ 505KB)
- اختبارات تنقل محدّثة: نجح
- لا push إلى `main` / لا نشر إنتاج (حسب طلب المهمة)

## Risks / مؤجّل
- صفحات immersive (مصحف/صلاة) ما زالت بواجهة خاصة؛ تحتاج موجة تصميم لاحقة داخل الكروم الغامر.
- ودجات الرئيسية القديمة ما زالت تُحمَّل تحت الغلاف الجديد — توحيدها بصريًا بالكامل مؤجّل.
- `elite-2026.css` ما زال في المسار الحرج (حجم كبير) — إزالته تدريجيًا في PR لاحق.
- لا لقطات قبل/بعد مرفقة في هذا التقرير (يمكن توليدها من preview الفرع).

## Definition of Done (هذه الموجة)
- ✅ هوية tokens جديدة مركزية
- ✅ تنقل Mobile-first محدّث
- ✅ رئيسية مُعاد بناؤها
- ✅ صفحات نواة مغلفة بـ IGDS
- ✅ حالات Empty/Error موحّدة جزئيًا
- ✅ build/typecheck/lint خضراء
- ⏳ إزالة كاملة لكل أثر `elite`/بطاقات قديمة داخل كل صفحة محتوى (~200+)
- ⏳ Dark mode visual QA شامل لكل الصفحات
