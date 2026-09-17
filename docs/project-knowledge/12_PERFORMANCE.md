# 12 — الأداء

**Commit:** `975505911116f6190e2d09fc97ced3dbbb02e37d` · لا اختراع baseline.

## ميزانيات مثبتة في الكود

| بوابة | حد | سكربت |
|---|---|---|
| Entry JS gzip | ≤ 120 KiB (+320B slack) | `scripts/test-bundle-budget.mjs` |
| Icons gzip | ≤ 30 KiB | نفس |
| Main CSS gzip | ≤ 100 KiB | نفس |
| منع mega-seeds في entry | نعم | نفس |
| Critical CSS | ضمن build | `test-critical-css-budget.mjs` |

قياس محلي سابق على فرع محتوى: entry ≈ **120.1 KiB** بعد فصل `ayah-ref-normalize` عن `quran-api` — رقم لجلسة محددة؛ أعد القياس بعد كل تغيير entry.

## آليات

- Lazy routes (AppRoutes كاملة تقريبًا).
- Prefetch مرتبط بـBottomNav.
- Service worker + `SW_BUILD_ID` لكسر كاش قديم.
- Prerender لـSEO (تكلفة بناء لا وقت تشغيل أول تفاعلي بالكامل).
- Mushaf: قياسات `mushaf-madinah/measure.mjs` + بوابات overflow.

## مشكلات / أولويات (بدليل)

| مشكلة | دليل | أثر | اختبار | أولوية |
|---|---|---|---|---|
| تجاوز entry budget | فشل bundle gate | فشل CI | test:bundle-budget | P0 |
| سحب quran-api مبكرًا | درس r7 | تضخم | budget + import graph | P0 |
| Waterfalls Supabase | نمط قوائم بدون أسرار | بطء قوائم | Unknown قياس حالي | P2 |
| صور/خطوط QPC | 604 ملفات | تحميل صفحة | mushaf measure | P1 |
| LHCI/PSI | سكربتات + CI | جودة إدراكية | lhci / psi gate | P1 |

`docs/PERFORMANCE_BASELINE.md` و`PERF_LOG.md` إن وُجدت أرقام — استخدمها كما هي دون اختراع.
