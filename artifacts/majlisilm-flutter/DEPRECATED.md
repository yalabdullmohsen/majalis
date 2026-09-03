# DEPRECATED — تجربة Flutter مهجورة

**الحالة:** Legacy / مجمَّد — لا يُبنى ولا يُنشر ولا يُربط بمسار المتجر.

## ماذا كان هذا؟

مشروع Flutter تجريبي (`majlisilm_flutter`) لواجهة قرآن/تسميع مبكرة داخل monorepo سُنّة.

## مسار المتجر الرسمي

- **الويب والإنتاج:** `artifacts/majalis` (Vite + React)
- **تطبيق المتجر (iOS/Android):** Capacitor حول `artifacts/majalis` (`artifacts/majalis/ios`، fastlane في جذر المستودع)
- **ليس** هذا المجلد، وليس `artifacts/majalis-mobile` (غلاف Expo منفصل)

## قواعد الصيانة

1. لا تُضاف ميزات جديدة هنا.
2. لا تُربط workflows / Vercel / fastlane بهذا المسار.
3. مستبعد من `pnpm-workspace` ومن فحوصات الـmonorepo.
4. **لا تحذف** المجلد في هذه المرحلة — الحذف لاحقاً فقط بعد نجاح TestFlight واستقراره ≥ أسبوع، وبعد وسم `snapshot/pre-cleanup-2026-08`، وبدفعات ≤ 12 ملفاً لكل PR.

## بديل التسميع القادم

مرجع منطق التسميع القابل لإعادة البناء: `artifacts/mushafi` (انظر `TASMEE3_INVENTORY.md`) — يُدمج لاحقاً كميزة داخل سُنّة، وليس كتطبيق Flutter مستقل من هذا المجلد.
