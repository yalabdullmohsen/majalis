# خط أساس الأداء — Performance Baseline

تاريخ القياس: **2026-08-26** · الفرع: `cursor/perf-bundle-200` · جذر البناء: `artifacts/majalis`

## منهجية القياس

### حجم الحزمة (محلي، نفس أمر البناء)

```bash
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
node artifacts/majalis/scripts/test-bundle-budget.mjs
```

| الحالة | Entry JS gzip | Icons gzip | CSS gzip |
|--------|---------------|------------|----------|
| قبل (main @ `626bad58`) | **110.2 KiB** | 21.8 KiB | 36.3 KiB |
| بعد (هذا الفرع) | **101.8 KiB** | 21.8 KiB | 35.0 KiB |

### Lighthouse (CLI)

```bash
# معاينة محلية بعد البناء
PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run start
pnpm dlx lighthouse@12.8.2 http://127.0.0.1:24216/ \
  --only-categories=performance --form-factor=mobile \
  --output=json --output-path=/tmp/perf-after.json \
  --chrome-flags="--headless --no-sandbox --disable-gpu"
```

مرجع إنتاج (CDN، قبل نشر هذا الفرع) حُفظ في `/tmp/perf-before.json` للمقارنة السياقية فقط — **لا يُقارن مباشرةً** بمعاينة محلية بلا CDN.

## جدول المقارنة (أرقام فعليّة)

| المقياس (Metric) | قبل التحسين | بعد التحسين | النسبة |
|---|---|---|---|
| حجم حزمة الإقلاع (Entry JS gzip) | 110.2 KiB | 101.8 KiB | ⬇️ 7.7% |
| CSS الرئيسي (gzip) | 36.3 KiB | 35.0 KiB | ⬇️ 3.6% |
| ميزانية البوابة `INITIAL_JS_GZIP` | 164 KiB | **120 KiB** | إحكام بوابة |
| Lighthouse Performance (معاينة محلية بعد) | — | **76 / 100** | قياس بعد فقط |
| LCP (معاينة محلية بعد، mobile simulate) | — | **5.0 s** | قياس بعد فقط |
| TBT (معاينة محلية بعد) | — | **20 ms** | قياس بعد فقط |
| CLS (معاينة محلية بعد) | — | **0** | قياس بعد فقط |
| إنتاج CDN (مرجع قبل النشر) | Performance **92** · LCP **3.4 s** · FCP **0.9 s** | يُعاد القياس بعد الدمج | سياق |

> ملاحظة صدق هندسي: هدف «−40% حزمة / +200% أداء» غير واقعي مع `react`+`react-dom` (~58 KiB gzip منفصلين عن الـentry). التحسين الفعلي هنا على كود التطبيق في الـentry + الشبكة/الـDOM.

## ما نُفِّذ في هذه الجولة

### حزمة الإقلاع / إعادة الرندر

- كسول: `FirstVisitIntro`, `UpdateAvailableBanner`, `PwaInstallBanner`, `FocusArrival`, `NavProgressBar`, `EdgeSwipeBack`, `RouteEnterMotion`, `DeferredAchievementBoot`
- `local-notifications` ديناميكي داخل `IslamicReminderBootstrap`
- `React.memo` على `SectionCard` / `HubCard` / `FaidahCard` / `UniversityCard`
- شيت الأذكار كسول: `AdhkarDhikrSheet`
- ميزانية entry gzip: **120 KiB**

### جلب البيانات

- `resolveRulingByIdentifier`: `Promise.all` لـ id/key/slug بدل شلال `await`
- أعمدة صريحة: `RULING_DETAIL_COLUMNS`, `LESSON_DETAIL_COLUMNS` (بدل `select('*')` في المسارات العامة)
- `lesson-stats`: `select("id", { count, head })` بدل `*`
- دعوة: قوائم البحث/المميزة بحقول أضيق
- فوائد: ترقيم واجهة + `IntersectionObserver` (`FAWAID_PAGE_SIZE = 24`)

### أصول / PWA

- `fetchPriority` لصور المشايخ ذات الأولوية
- SW: SWR لـ `/api/fawaid` و`/api/prayer` + cache-first لـ `/brand/*`

## معايير القبول — حالة

| معيار | حالة |
|--------|------|
| −40% حجم entry | ❌ غير محقّق (فعلي ≈ −7.7%) — موثّق بصدق |
| Lazy للمودالات/الكروم الثانوي | ✅ |
| memo للقوائم الشائعة | ✅ |
| Promise.all لمسارات مستقلة | ✅ أحكام |
| تقليل over-fetch | ✅ دروس/أحكام/إحصاء/دعوة |
| ترقيم/تمرير لانهائي | ✅ فوائد |
| توثيق قبل/بعد رقمي | ✅ هذا الملف |
| Web Vitals أخضر تام محليًا | ⚠️ Performance 76 محليًا؛ CLS/TBT ممتازان؛ LCP يحتاج CDN بعد النشر |
| `.github/workflows/performance-gate.yml` بـ minScore 90 | ❌ **مرفوض عمدًا** — مثال معطّل فقط في `docs/performance/performance-gate.workflow.example.yml` |
| أرقام تسويقية (480→145 KB / LH 96 / LCP 0.9s) | ❌ **ليست قياس هذه الجولة** — لا تُنسخ إلى التقارير |

## قائمة مراجعة دمج (صادقة)

- [x] تخفيض entry فعلي (~−7.7% gzip) + lazy للكروم الثانوي + إزالة `recharts` الميت
- [x] لمس/تمرير: `passive` + `touch-action: manipulation` (قائم؛ لا ادّعاء إلغاء 300ms منفصل كإنجاز جديد)
- [x] بوابات CI الحية: bundle-budget + LHCI معاينة (~0.75) + RUM — **بلا** بوابة 90 على المعاينة المحلية
- [x] `docs/PERFORMANCE_BASELINE.md` + `docs/PERFORMANCE_GUIDELINES.md`
- [ ] دمج `#1460` → `main` ثم إعادة قياس إنتاج CDN

## إعادة القياس بعد النشر

```bash
pnpm dlx lighthouse@12.8.2 https://majlisilm.com/ \
  --only-categories=performance --form-factor=mobile \
  --output=json --output-path=/tmp/perf-prod-after.json \
  --chrome-flags="--headless --no-sandbox --disable-gpu"
```

حدّث صف «إنتاج CDN» أعلاه عند نجاح النشر.


## RUM ومراقبة الإنتاج (المهمة ١٠)

| عنصر | قيمة |
|------|------|
| عميل | `src/lib/rum-telemetry.ts` (LCP/INP/CLS/TTFB) بعد موافقة التحليلات |
| مسار | `POST /api/rum` |
| تنبيه | `RUM_ALERT_WEBHOOK` / `SLACK_WEBHOOK_URL` عند LCP>2.5s أو INP>200ms |
| API بطيء | `PERF_API_SLOW_MS = 500` في `performance-monitor.ts` |
| إرشادات | `docs/PERFORMANCE_GUIDELINES.md` |

لا يُضاف `web-vitals` كحزمة entry — المُجمّع يستخدم PerformanceObserver بنفس دلالات العتبات لتفادي تضخيم الإقلاع مع احترام الخصوصية.
