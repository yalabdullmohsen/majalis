# TOTAL TRUST — المرحلة 2 و3

**الفرع:** `cursor/sunnah-total-trust-p2`  
**أساس:** `origin/main` بعد دمج Phase 0 (#2141)

## المرحلة 2 — حالات المسارات الحرجة

تدقيق مصدر لـ 10 مسارات عامة حرجة: `/` · `/mushaf` · `/lessons` · `/prayer-times` · `/adhkar` · `/search` · `/sections` · `/quran-hub` · `/hadith` · `/fiqh`

| فحص | نتيجة |
|---|---|
| OfflineBanner عام (`EMPTY.offline`) | مطلوب PASS |
| empty / error / loading من المصدر | `PASS_SOURCE` أو `NEEDS_REVIEW` |
| مخرجات | `reports/total-trust/phase2-route-states.json` + تحديث المصفوفة |

لا اختراع محتوى؛ إن نُقص ملف مصدر → `POST_RELEASE_FIX`.

## المرحلة 3 — حدود المصحف

صفحات: **1, 2, 5, 100, 221, 300, 459, 604** + `pages-manifest` = 604 + `verify:protected-quran-byte-lock`.

| قاعدة | سلوك |
|---|---|
| انحراف بايت / صفحة ناقصة | `RELEASE_BLOCKER_CRITICAL` — بلا إصلاح آلي للنص |
| تطابق | توثيق فقط في `reports/total-trust/phase3-mushaf-boundary.json` |

## أوامر

```bash
node scripts/total-trust-route-states.mjs
node scripts/total-trust-mushaf-boundary.mjs
pnpm --filter @workspace/majalis run test:total-trust-phase2
```

## App Store

لا تعديل Connect. لا سحب من المراجعة.
