# Premium Interaction P0 — خط الأساس والقياس

تاريخ التوثيق: 2026-09-12  
الفرع: `cursor/premium-interaction-p0`  
بيئة القياس المطلوبة: **Release أو Profile Build على جهاز حقيقي** (ليس Simulator وحده).

## حالة القياس

كل المقاييس التالية **NOT MEASURED** في هذه الجولة لأن بيئة الوكيل لا تملك جهازًا ماديًا ولا Instruments/Perfetto متصلة.

| مقياس | قبل | بعد | طريقة القياس المطلوبة |
|------|-----|-----|------------------------|
| Touch-to-Visual-Response | NOT MEASURED | NOT MEASURED | Signpost `ix:touchVisual` + Instruments Animation Hitches / JankStats |
| Touch-to-Navigation-Start | NOT MEASURED | NOT MEASURED | Signpost `ix:navStart` على Release |
| Touch-to-First-Useful-Frame | NOT MEASURED | NOT MEASURED | Frame Timing + Points of Interest |
| Transition Duration | NOT MEASURED | NOT MEASURED | Core Animation / Perfetto |
| Frame Time / Dropped / Hitch Ratio | NOT MEASURED | NOT MEASURED | Animation Hitches (iOS) · FrameTimingMetric (Android) |
| Main/Render Thread Work أثناء اللمس | NOT MEASURED | NOT MEASURED | Time Profiler / Perfetto |
| Re-render / Layout / Measure counts | NOT MEASURED | NOT MEASURED | React Profiler + Layout instrumentation |
| Memory / CPU بعد تمرير 3 دقائق | NOT MEASURED | NOT MEASURED | Allocations / Memory Profiler |
| Search keystroke → first result | NOT MEASURED | NOT MEASURED | Signpost `ix:searchFirstResult` |
| Mushaf page turn hitch | NOT MEASURED | NOT MEASURED | Signpost `ix:mushafPageTurn` + Hitches |

**قاعدة:** أي رقم يُذكر لاحقًا دون مصدر جهاز/أداء يُرفض.

## ما نُفّذ في P0 (كود — قابل للتحقق في CI)

1. رموز تفاعل مركزية: `MOTION_DURATION_MS` / `GESTURE_THRESHOLDS` / `HAPTIC_POLICY`.
2. `runSingleFlight` لمنع الضغط المزدوج.
3. قفل تنقّل خفيف في `navigateTo` (screen) ضد Double Push.
4. `ActionButton` + `Pressable` — feedback فوري / loading بلا تغيّر عرض.
5. `FavoriteButton` — optimistic + `busy` يمنع الضغط المزدوج + `mj-pressable`.
6. CSS `[data-pressed]` + احترام `prefers-reduced-motion`.
7. تأجيل `resource-prewarm` و`init-final-polish` من entry (ميزانية الحزمة).
8. بوابة `premium-interaction-p0-gate`.

## ما لم يُكتمل بعد (P0 جهاز / P1)

- قياس Release على iPhone 120Hz + جهاز 60Hz + Android متوسط.
- Interactive Back / Sheets تتبع الإصبع بشكل كامل عبر كل السطوح.
- Virtualization تدقيق لكل القوائم الطويلة.
- نقل JSON/indexing الثقيل عن UI thread بقياسات قبل/بعد.

## تأكيدات

- لا تعديل لمحتوى شرعي (قرآن/حديث/نصوص).
- لا نسخ تصميم أو كود أو حركة مميزة من تطبيقات أخرى.
- لا إضافة مكتبة حركة جديدة (لا framer-motion).
