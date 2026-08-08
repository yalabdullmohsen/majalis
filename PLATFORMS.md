# منصات المجلس العلمي — تصنيف رسمي (2026-08-08)

| المسار | التصنيف | الدور |
|---|---|---|
| `artifacts/majalis` | **منتج فعلي** | Vite + React + wouter، Tailwind v4 عبر `@tailwindcss/vite`، Supabase، Vercel، Capacitor/iOS، fastlane، كل workflows الإنتاج |
| `artifacts/majalis-mobile` | **غلاف مجمَّد** | Expo رفيع؛ بناء Replit؛ ليس مسار المتجر — انظر `DEPRECATED.md` |
| `artifacts/majlisilm-flutter` | **تجربة مهجورة مجمَّدة** | Legacy Flutter — انظر `DEPRECATED.md` |
| `artifacts/mushafi` | **مرجع تسميع قادم** | Flutter + خادم ASR؛ جرد: `artifacts/mushafi/TASMEE3_INVENTORY.md` |

## سطر إلزامي

**`artifacts/mushafi` مرجع لميزة قادمة — ممنوع حذفه أو تجميده حذفاً.**

قرار المالك: التسميع يُدمج لاحقاً داخل المجلس العلمي (مسار 1.1)، وليس تطبيقاً مستقلاً من المتجر لـ1.0.0.

## مسار المتجر 1.0.0

Capacitor حول `artifacts/majalis` فقط (iOS/Android). لا Expo ولا Flutter للمتجر في هذا الإصدار.

## تنظيف لاحق

الحذف الفعلي للمنصات المجمَّدة (`majalis-mobile`, `majlisilm-flutter`) فقط بعد:

1. وسم git `snapshot/pre-cleanup-2026-08`
2. نجاح TestFlight واستقراره ≥ أسبوع
3. دفعات PR ≤ 12 ملفاً لكل حذف
