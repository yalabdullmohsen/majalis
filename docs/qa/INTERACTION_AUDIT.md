# Interaction / Touch Audit — سُنّة

**Status:** `PARTIAL` — موجة مصحف + أهداف لمس أساسية.  
**لا يُعلن** `INTERACTION_SYSTEM_COMPLETE` قبل اختبار جهاز + Playwright hit-testing.  
**Base:** `origin/main` @ بدء الفرع · انظر JSON للقياس الحي.

---

## MEASURED (ساكن)

المصدر: `node artifacts/majalis/scripts/interaction-touch-static-audit.mjs`  
المخرج: `docs/qa/interaction-touch-under44-static.json`

| Metric | Value |
|---|---:|
| قواعد CSS تفاعلية بـ min-width/height صريح **&lt; 44px** قبل الإصلاح | **137** |
| بعد إصلاح مصحف الإنتاج + شريط سفلي + tabs/chips عالية الاستخدام | **127** |

### عقود المصحف (MEASURED بالكود + بوابة)

| Contract | Status |
|---|---|
| نقرة فارغة ↔ تبديل Chrome (`onTapEmpty` → `setChromeOpen(!v)`) | موجود |
| نقرة آية لا تقلب/لا تفتح Chrome (`mushaf-ayah-hit` في ignore) | معزّز في هذه الموجة |
| Long-press آية → قائمة | موجود (`LONG_PRESS_MS`) |
| Swipe → قلب صفحة فقط | موجود (pager) |
| مدة حركة Chrome | **180ms** (`--ss-chrome-motion`) ضمن 150–220 |
| أزرار أدوات المصحف min ≥ 48 | `--touch-comfortable` |
| أسهم التقليب ≥ 48 + hit slop | نعم |
| Bottom nav tab ≥ 48 min-height | نعم |

### عناصر أُصلحت في هذه الموجة (كود)

1. `.nm-controls__btn` / `__page` / compact — كانت ~32–35px → 48px  
2. `.nm-page-arrow` — 44px بصريًا + hit slop أوسع  
3. انتقال شريط الأدوات / الأسهم — 180ms  
4. `.bottom-nav__tab` — min-height مريح 48  
5. `.mj-pressable` — min 44  
6. `.content-hub-chip` / `.favorite-btn--compact` / `.reading-toolbar__btn` / `.tab-btn` / `.mj-tabs-trigger` / `.mj-menu-item` — رفع الحد الأدنى

### NOT_MEASURED

| Item |
|---|
| عدد العناصر التفاعلية الفريدة runtime |
| Hit-test فعلي `elementFromPoint` لكل زر |
| عناصر مغطاة overlay على الجهاز |
| Screenshots قبل/بعد |
| iPhone / iPad / Split View / Light-Dark matrix |
| Console errors بعد كل ضغطة |
| إزالة عناصر (REMOVED = 0 في هذه الموجة) |

---

## سلوك المصحف المطلوب — حالة التنفيذ

| سلوك | كود | جهاز |
|---|---|---|
| ضغطة فارغة تظهر/تخفي القوائم | ✅ | NOT_MEASURED |
| ضغطة آية لا تفتح القوائم | ✅ (ignore) | NOT_MEASURED |
| ضغط مطول → قائمة آية | ✅ | NOT_MEASURED |
| Swipe يقلب فقط | ✅ | NOT_MEASURED |
| Animation ناعمة بلا flicker | ✅ 180ms | NOT_MEASURED |

---

## Follow-ups

- بقية قواعد under-44 في `mushaf-madinah.css` / admin / search modal chips  
- Playwright matrix لأهداف اللمس  
- Cards full-bleed press audit runtime  
- Sheets: dismiss by scrim (موجود جزئيًا) — تدقيق شامل PR لاحق
