# تقرير نظام الحركة واللمس

> الفرع: `cursor/motion-touch-system` · النطاق: الوحدة ١ فقط (لا a11y / dashboard / share cards).

## قاعدة القياس

الأرقام أدناه من **بوابات ثابتة واختبارات وحدة**.  
قيم **fps / CLS / زمن اللمس المقيس على جهاز** لم تُسجَّل في هذه الجلسة (لا ملف تعريف أداء جهاز مرفق) — تُملأ في تمريرة قياس لاحقة قبل اعتبار البوابات ١–٣ خضراء إنتاجيًا.

| مقياس | حالة الجلسة | مصدر |
|---|---|---|
| مصدر الحركة الواحد | ✅ | `motion-single-source.test.ts` |
| Capacitor haptics path | ✅ | `haptics.ts` + `phase-a-tactile` |
| شيت: نسب إغلاق/مطاطية من الرموز | ✅ | `AppBottomSheet` + `MOTION_SHEET` |
| انتقال مسار + إيماءة حافة | ✅ موصول | `RouteTransition` + `useEdgeBackGesture` |
| متوسط fps انتقالات | ⏳ غير مقيس على جهاز | — |
| CLS الرئيسية/مصحف/مكتبة | ⏳ غير مقيس على جهاز | — |
| زمن touchstart→:active | ⏳ غير مقيس؛ CSS = `--mj-motion-instant` (100ms) | — |

## جدول الانتقالات (مواصفة الرموز)

| النوع | المدة | المنحنى | fps المقيس |
|---|---|---|---|
| دخول شاشة | `page` 280ms | `decelerate` | ⏳ |
| خروج شاشة | `fast` 160ms | `accelerate` | ⏳ |
| دخول شيت | `base` 220ms | `spring` | ⏳ |
| سحب شيت / ارتداد | فوري (style) ثم `motion-sheet` | `spring` | ⏳ |
| تقليل حركة | 120ms | linear / تلاشي | — |

## أهداف اللمس &lt;44px

لم يُشغَّل فحص DOM آلي على كل الشاشات في هذه الجلسة.  
المضاف: أداة `.mj-hit-slop` + `--mj-hit-slop: 8px`، و`--mj-touch-min: 48px` في theme (فوق الحد الأدنى 44).

## قرارات هندسية

1. **مصدر واحد:** `src/design/motion.ts` + `src/design/motion.css`.
2. **شيت:** إزالة `useState` لكل إطار؛ offset عبر `ref` + `style`؛ إغلاق عند 30% أو ≥0.5 px/ms؛ مطاطية 0.55؛ قفل تمرير بـ `overflow:hidden` + تعويض شريط التمرير (بدون `position:fixed`).
3. **اهتزاز:** `haptics.ts` يفضّل `@capacitor/haptics` عبر `capacitor-utils`، و`vibrate` للويب.
4. **وحدات ٢–٥ مؤجّلة** حسب خطة البرومبت (PRs مستقلة).
5. **فيديو ١٥ث / html2canvas / مشاركة Capacitor:** خارج نطاق هذا الـPR (ملاحظات للوحدة ٤/١ لاحقًا).

## بوابات المصحف

لم تُعدَّل ملفات المصحف في هذا الـPR — المتوقع بقاء بوابات المصحف كما هي على `main`.

## التحقق المحلي

```bash
pnpm run test:motion-system
pnpm run typecheck
```
