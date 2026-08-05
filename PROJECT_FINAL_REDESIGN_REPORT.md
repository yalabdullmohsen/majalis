# Project Final Redesign Report

## Scope

- React site: `artifacts/majalis`
- Flutter app: `artifacts/mushafi`

هدف الجولة: تجهيز تجربة إطلاق تجريبية داخلية — مصحف جديد أصلي عالي الجودة، تسميع جديد فقط، واجهة موقع منظّمة، بلا نشر/دمج/TestFlight وبلا نسخ تطبيق خارجي.

## Initial Findings

- المصحف الجديد موجود أصلاً في `artifacts/mushafi/lib/features/mushaf/` مع شاشات كاملة تقريباً.
- المصحف القديم معزول في `lib/deprecated/legacy_mushaf/` وغير موصول بالتنقل.
- التسميع الجديد في `lib/features/tasmee3/`؛ المسارات القديمة `/ai-recitation` تعيد التوجيه إليه.
- موقع majalis سبق أن حصل على تنظيف تنقّل + إعادة تصميم هوية/هيدر/رئيسية على فروع سابقة؛ هذه الجولة أكملت التلميع وربط التقارير النهائية.

## Old Mushaf Locations

- `artifacts/mushafi/lib/deprecated/legacy_mushaf/` (`legacy_mushaf_screen.dart` وأدواته)
- `artifacts/mushafi/lib/deprecated/legacy_shell/` (بحث/ختمة/علامات قديمة)
- Route توافق: `/old-mushaf` → `/mushaf-home`
- لا يظهر في HomeShell ولا في قوائم المصحف الجديد

## New Mushaf Locations

- `lib/features/mushaf/presentation/` — Home / Screen / Search / Khatmah / Favorites / Bookmarks / AyahActionsSheet / Settings hub
- Routes: `/`, `/mushaf-home`, `/mushaf`, `/mushaf/page/:page`, `/search`, `/khatmah`, `/mushaf-settings`, …
- نص القرآن من الأصول الداخلية الموثّقة فقط (`assets` + repository محلي)

## Old Tasmee3 / AI Recitation Locations

- لا شاشة AI قديمة في التنقل الفعال
- `/ai-recitation` و`/tasmee3-dashboard` → `/tasmee3`
- أي بقايا توثيقية فقط داخل README/deprecated إن وُجدت

## New Tasmee3 Locations

- `lib/features/tasmee3/` — Entry / Dashboard / Screen / ASR settings / widgets
- شارة «التسميع الجديد» في HomeShell والداشبورد
- عبارة واجهة: «دقة تقريبية» و«أداة مساعدة» — بلا «دقة نهائية» أو «حكم شرعي»

## UI Problems

- بطاقة التسميع كانت ناقصة من شبكة `MushafHomeScreen`
- لا مركز إعدادات باسم `MushafSettingsScreen`
- ألوان التوكنات قريبة لكن ليست مطابقة تماماً للهوية المطلوبة
- `dart-define` كان قادراً نظرياً على تفعيل رفع الصوت/PCM افتراضياً
- HomeShell كان بأزرار مسطّحة أقل وضوحاً للشارات

## Planned Fixes

- إضافة التسميع + الإعدادات لشبكة المصحف
- إنشاء `MushafSettingsScreen`
- ضبط `mushaf_design_tokens` للألوان المطلوبة
- فرض تعطيل upload/WS/PCM افتراضياً من التفضيلات فقط
- تحديث HomeShell ببطاقات أوضح
- تلميع بطاقات أهم الأقسام في majalis
- كتابة تقارير الإطلاق النهائية وتشغيل الفحوصات
