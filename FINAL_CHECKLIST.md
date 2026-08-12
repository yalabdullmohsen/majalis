# Final Checklist

## Flutter (`artifacts/mushafi`)

- [x] flutter pub get
- [x] flutter analyze
- [x] flutter test
- [x] Quran asset check if available *(نجح مع تحذير metadata: صفحتان بدل 604)*
- [ ] App starts *(يحتاج جهاز/محاكي + CocoaPods محلياً)*
- [x] New Mushaf visible *(HomeShell → `/mushaf-home`, شارة المصحف الجديد)*
- [x] New Tasmee3 visible *(HomeShell → `/tasmee3`, شارة التسميع الجديد)*
- [x] Old routes not visible *(legacy معزول في `lib/deprecated/`)*

## React (`artifacts/majalis`)

- [x] dependencies installed *(workspace pnpm)*
- [x] lint passed
- [ ] tests passed if available *(لم تُشغَّل حزمة اختبارات كاملة منفصلة؛ build يتضمن حراسات محتوى)*
- [x] build passed
- [x] Arabic content reviewed *(أسطح التسويق/الخصوصية/المنهجية/الرئيسية)*
- [ ] responsive checked *(تحقق يدوي مطلوب في المتصفح)*

## Content

- [x] Arabic spelling checked *(تصحيحات مستهدفة)*
- [x] No misleading claims
- [x] No unsupported religious claims *(لم تُضف فتاوى جديدة)*
- [x] No AI-generated Quran text
- [x] Privacy wording clear

## Release

- [x] Ready for internal testing *(مع قيد CocoaPods لـ iOS TestFlight)*
- [x] Remaining issues documented *(في PROJECT_IMPROVEMENT_REPORT.md)*
