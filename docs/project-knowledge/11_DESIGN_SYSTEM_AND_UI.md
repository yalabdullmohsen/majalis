# 11 — نظام التصميم والواجهة

**Commit:** `975505911116f6190e2d09fc97ced3dbbb02e37d`

## مصادر الثيم

- تهيئة ثيم/وضع داكن عبر CSS tokens وclasses؛ ملفات مستوردة من `main.tsx` مذكورة في `docs/REPO_INDEX.md` (theme.css, tokens.css, brand-v4*, design-system, m2030/*, ios-edge, a11y-release-gate, …).
- توثيق رموز: `docs/design-tokens.md`, تقارير contrast.

## Light / Dark

- يجب أن تبقى النصوص قابلة للقراءة في الوضعين؛ بوابات Color contrast Playwright في CI عند path-lane البصري.
- مخاطر موثّقة تاريخيًا: نص داكن على سطح داكن، أسطح mint كبيرة، neon/glow — راجع `docs/CONTRAST_*`, `UI_FIX_REPORT.md`, `visual-fix-report.md` مع ربط الصفحات وقت الإصلاح.

## مكوّنات وأنماط

| عنصر | أين |
|---|---|
| Bottom nav | BottomNavBar + registry |
| Cards/Buttons/Inputs | brand-v4-components + Tailwind |
| Typography عربي | خطوط محلية/QPC للمصحف؛ اتساق عبر verify:fonts |
| Safe areas | capacitor-native-ux / ios-edge |
| Loading/Empty/Error | أنماط صفحات + ErrorBoundary + chunk recovery |
| Back FAB | تجنّب تغطية المحتوى (متطلبات جودة سابقة) |

## Responsive

- تصميم mobile-first؛ LHCI home mobile في CI.
- Breakpoints في CSS/Tailwind — التفاصيل في tokens.

## مشكلات تُربط عند التشخيص

عند الإبلاغ اربط: **الصفحة + الملف + selector/المكوّن**. لا تعمم. أمثلة مصادر أدلة: `docs/UI_LOG.md`, تقارير visual، اختبارات contrast.
