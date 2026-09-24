# Interactive Elements Audit — سُنّة

**Program status:** `PARTIAL` — PR-0 فقط (جرد + فحص ساكن + خط أساس).  
**لا يُعلن** `SUNNAH_ALL_INTERACTIONS_VERIFIED` في هذه المرحلة.  
**Base commit:** `36ec6a62b` (`origin/main` عند بدء PR-0)  
**Measured at:** انظر `docs/qa/interactive-static-findings.json` → `measuredAt`

---

## 0) قواعد الأرقام

| رمز | المعنى |
|---|---|
| **MEASURED** | ناتج سكربت/بوابة/CI على الـcommit المذكور |
| **NOT_MEASURED** | لم يُنفَّذ اختبار runtime / جهاز / TestFlight بعد |
| **FORBIDDEN** | ممنوع وضع رقم تقديري |

أي خلية `NOT_MEASURED` **ليست صفرًا** وليست «سليمًا».

---

## 1) PR-0 — ما تم قياسه

### 1.1 Routes (MEASURED)

| Metric | Value | Source |
|---|---:|---|
| Routes in `src/app/router/routes.ts` PATHS | **385** | `docs/qa/interactive-routes-registry.json` |
| Runtime route smoke (كل Route) | **NOT_MEASURED** | PR-2+ |

### 1.2 Tag inventory في `src/**/*.tsx` (MEASURED — تعداد وسوم، ليس إثبات وظيفة)

| Metric | Value |
|---|---:|
| Source files scanned | see JSON `sourceFilesScanned` |
| `<button` open tags | **1337** |
| `<a` open tags | **129** |
| `role="button"` | **24** |
| `onClick=` attributes | **1461** |

> هذه أعداد ظهور في الكود، **ليست** عدد عناصر تفاعلية فريدة وقت التشغيل، وليست PASS/BROKEN.

### 1.3 Static anti-patterns (MEASURED)

| Pattern | Count |
|---|---:|
| `href="#"` | **0** |
| `onClick={() => {}}` | **0** |
| `href="javascript:..."` | **0** |
| `Not Implemented` / TODO action (line scan) | **0** |

المصدر: `node artifacts/majalis/scripts/interactive-elements-static-audit.mjs`  
المخرج: `docs/qa/interactive-static-findings.json`

### 1.4 Runtime interaction results (NOT_MEASURED في PR-0)

| Status bucket | Count |
|---|---:|
| PASS before fixes | NOT_MEASURED |
| BROKEN before fixes | NOT_MEASURED |
| NO_OP | NOT_MEASURED |
| BLOCKED_BY_OVERLAY | NOT_MEASURED |
| WRONG_DESTINATION | NOT_MEASURED |
| UNAVAILABLE_FEATURE | NOT_MEASURED |
| INACCESSIBLE | NOT_MEASURED |
| FIXED | NOT_MEASURED |
| REMOVED | NOT_MEASURED |
| OWNER_ACTION | NOT_MEASURED |
| STILL_BLOCKED | NOT_MEASURED |

---

## 2) Mushaf display mode — SYSTEM / LIGHT / DARK

### 2.1 مسار الإنتاج (مثبت بالكود)

- Route: `/mushaf` → `MushafReaderPage` → **`NewMushafReader`** (ليس `VerifiedMushafReader`).
- UI: `MushafDisplayModeControl` في:
  - `MushafControlsLayer` (المزيد داخل القارئ)
  - `MushafSettingsSheet`
  - `SettingsView` (قسم القراءة)
- Store: `ssunnah-mushaf-appearance-v1` عبر `appearance-prefs.ts` / `QuranSettingsRepository`
- DOM: `data-mushaf-appearance="light"|"night"` على `html` و `.nm-root`
- لا `key={displayMode|appearance}` على `NewMushafReader` (بوابة PR-0)

### 2.2 دليل وحدة (MEASURED في بوابة PR-0)

`interactive-audit-pr0-gate.test.ts` يثبت:

- حفظ `SYSTEM` / `LIGHT` / `DARK`
- `apply` يضع `data-mushaf-appearance` الصحيح
- لا React key مربوط بالوضع على القارئ الإنتاجي

### 2.3 فرضيات عطل مرئي — تحتاج runtime (NOT_MEASURED على جهاز)

| Hypothesis | Evidence so far | Class |
|---|---|---|
| A. المستخدم يغيّر من الإعدادات خارج `/mushaf` فلا يرى ورق المصحف فورًا | متوقع سلوكيًا إن لم يكن على صفحة المصحف | UX / needs device |
| B. فرق LIGHT vs SYSTEM (الجهاز نهاري) غير ملحوظ بصريًا | كلاهما → `light` | expected |
| C. مسار تراثي `VerifiedMushafReader` ما زال يحمل `themeChoice` + `data-mushaf-theme` | موجود في الكود؛ **غير** مسار `/mushaf` الإنتاجي | PR-1 cleanup risk |
| D. Remount بسبب key | **مرفوض** على NewMushafReader (فحص كود + بوابة) | ruled out for prod reader |
| E. mushaf-gates فشل #2265 | `mushaf-performance-engine-gate` توقع `بيج دافئ`؛ أُصلح ودُمج `8b5502d6` | **FIXED on main** |

### 2.4 نتيجة SYSTEM/LIGHT/DARK على الجهاز

| Check | Result |
|---|---|
| iPhone / iPad runtime | **NOT_MEASURED** |
| Release / TestFlight | **NOT_MEASURED** |
| Page 1/2/3/100/604 after mode switch | **NOT_MEASURED** |

---

## 3) مرشّحات NO_OP بصرية (كود فقط — ليست تعداد runtime)

في `MushafSettingsSheet.tsx` صفوف تظهر كخيارات مفعّلة بلا `onClick`:

- «نوع المصحف» / «المصحف»
- «اتجاه التمرير» / «صفحة»

الحالة المقترحة للمراجعة في PR-1/PR-4: `UNAVAILABLE_FEATURE` أو إزالة المظهر التفاعلي الزائف.  
**لم تُحسب في أرقام BROKEN** لأن PR-0 لا يطلق PASS/BROKEN بدون اختبار ضغط فعلي.

---

## 4) فشل mushaf-gates التاريخي (#2265)

| Field | Value |
|---|---|
| CI step | `Unit + active-page-lines + flip-perf` |
| Failing test | `mushaf-performance-engine-gate.test.ts:30` |
| expected | `/بيج دافئ/` |
| actual | محتوى الإعدادات بعد SYSTEM/LIGHT/DARK |
| Root cause | عقد بوابة قديم ≠ واجهة جديدة (ليس remount) |
| Fix commit | `7fd91a9c7` |
| Merge | `8b5502d6` — mushaf-gates / Verify build / ci-required **PASS** |

---

## 5) خطة PRs (كما في الطلب)

| PR | هدف | حالة |
|---|---|---|
| **0** | Inventory + static audit + baseline | **هذا المستند** |
| 1 | إصلاح جذري SYSTEM/LIGHT/DARK + تنظيف ثيم تراثي | Pending |
| 2 | Nav / Header / Bottom nav runtime | Pending |
| 3 | Search + Filters + Tabs | Pending |
| 4 | Forms + Dialogs + Sheets | Pending |
| 5 | Content cards + destinations | Pending |
| 6 | Mushaf interactions + audio | Pending |
| 7 | Floating layer collisions | Pending |
| 8 | a11y + Keyboard + VoiceOver | Pending |
| 9 | Device matrix + Release | Pending |
| 10 | Legacy deletion + final counts | Pending |

---

## 6) أوامر إعادة القياس

```bash
cd "$(git rev-parse --show-toplevel)/artifacts/majalis"
node scripts/interactive-elements-static-audit.mjs
node --import tsx src/lib/__tests__/interactive-audit-pr0-gate.test.ts
pnpm run test:interactive-audit-pr0
```

---

## 7) Acceptance — PR-0 فقط

- [x] Routes registry extracted (385)
- [x] Static anti-pattern scan executed
- [x] Tag counts recorded without claiming functional PASS
- [x] Display-mode store→DOM unit proof
- [x] Remount-via-key ruled out for production reader
- [x] Historical mushaf-gates root cause documented
- [ ] Full interactive element runtime inventory
- [ ] Device / TestFlight verification
- [ ] `SUNNAH_ALL_INTERACTIONS_VERIFIED` — **ممنوع حتى PR-10 + أجهزة**
