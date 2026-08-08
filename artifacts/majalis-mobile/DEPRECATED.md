# DEPRECATED — غلاف Expo مجمَّد

**الحالة:** مجمَّد — ليس مسار المتجر ولا مسار الإنتاج.

## القرار (2026-08-08)

بعد الجرد: الحزمة غلاف Expo رفيع (~39 ملفاً) يعتمد بناؤها على متغيرات Replit
(`REPLIT_*` / `EXPO_PUBLIC_DOMAIN`)، ومستبعدة أصلاً من بناء الـmonorepo، وبلا Vercel/fastlane/CI مخصّص.

**لا يوجد استخدام إنتاجي مستقل** يبرّر الإبقاء كسطح نشط بجانب Capacitor.

## مسار المتجر الرسمي

- **الويب:** `artifacts/majalis`
- **iOS/Android للمتجر:** Capacitor حول `artifacts/majalis`
- هذا المجلد **ليس** تطبيق المتجر.

## قواعد الصيانة

1. لا ميزات جديدة هنا.
2. مستبعد من `pnpm typecheck` / `pnpm build` الجذريين. استبعاده من `pnpm-workspace` مؤجَّل حتى ما بعد TestFlight (لتفادي انفجار `pnpm-lock`).
3. **لا تحذف** المجلد الآن — الحذف لاحقاً فقط بعد وسم `snapshot/pre-cleanup-2026-08` واستقرار TestFlight ≥ أسبوع، وبدفعات ≤ 12 ملفاً لكل PR.

## بديل الموبايل

تجربة المستخدم على الهاتف = ويب responsive + غلاف Capacitor من `artifacts/majalis`.
