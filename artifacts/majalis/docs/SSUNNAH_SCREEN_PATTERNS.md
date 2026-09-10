# أنماط شاشات سُنّة — هوية واحدة · تخطيط متنوع

مبدأ: **الثوابت البصرية موحّدة**؛ **التخطيط والكثافة يتنوّعان** حسب طبيعة المحتوى.

## الثوابت (ممنوع اختلافها بين الشاشات)

| ثابت | المصدر |
|---|---|
| ألوان | `theme.css` → `--ss-color-*` / `--mj-*` |
| Typography | مكوّنات `SsText` / `--ss-type-*` |
| أزرار وحقول | `design-system/Buttons` + حقول البحث المشتركة |
| بطاقة أساسية | `AppCard` / `soft-card` (زوايا، ظل، padding) |
| مسافات وحواف | `--ss-space-*` · `--ss-radius-*` |
| رأس داخلي · شريط سفلي · حركة | القوالب والتخطيط العام للتطبيق |
| loading / empty / error | `ScreenShell` + أنماط TopicPage / EmptyState |
| فاتح / داكن | نظام الثيم الحالي |

## الأنماط ومتى تُستخدم

| النمط | المكوّن | متى |
|---|---|---|
| GridScreen | شبكة بطاقات | أقسام، تصنيفات، مسارات |
| ListScreen | قائمة رأسية | دروس، نتائج بحث |
| ReaderScreen | قارئ نص | حديث/شرح/تعريف |
| ScriptureScreen | متن/مصحف | قرآن ومتون (خط موثّق؛ بلا مساس بالنص) |
| PlayerScreen | مشغّل | صوت/فيديو + بيانات |
| DetailScreen | تفاصيل + إجراءات | محاضرة، عالم، سلسلة |
| DashboardScreen | لوحة مختلطة | الرئيسية، الصلاة |
| UtilityScreen | أدوات | إعدادات، حساب |

`compose="mark"`: تبنّي تدريجي بلا إعادة تخطيط فورية.  
`compose="layout"`: يفعّل شبكة/قائمة النمط من CSS.

## ربط الشاشات (دفعة 1)

انظر `src/lib/ssunnah-screen-patterns.ts` → `SS_SCREEN_ROUTE_PATTERN`.

| مسار | نمط |
|---|---|
| `/` | dashboard |
| `/sections` · `/fiqh` · `/hadith` | grid |
| `/search` · `/lessons` | list |
| `/hadith/:id` | reader |
| `/lessons/:id` | detail |
| `/prayer-times` | dashboard |
| `/settings` | utility |
| `/mushaf` | scripture |

دفعة 2+: تفسير، أذكار، مركز قرآن، دخول، … ثم توسيع `compose="layout"` حيث يناسب.

## تنويع مسموح / ممنوع

**مسموح:** أعمدة، كثافة بطاقة، ترتيب أقسام، Hero بسيط/موسّع، فلاتر/مشغّل خاص بالمحتوى.  
**ممنوع:** ألوان/خطوط/أزرار/radius/أيقونات/تنقّل/حركة/حالات محلية خارج النظام.

## حوكمة

- شاشة جديدة → أحد الأنماط أعلاه (أو نمط جديد في النظام، لا تصميم منفصل).
- بوابة: `ssunnah-screen-patterns-gate.test.ts`
- قيم مباشرة: بوابة الأنماط + قيود ESLint على طبقة `design-system/screens` (انظر أيضًا أساس Typography).
