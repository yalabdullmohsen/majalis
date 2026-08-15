# تقرير فحص نهائي — قصص الأنبياء

**التاريخ:** 2026-08-15  
**الفرع:** `cursor/prophets-zakariya-redirect-20260815`

## الخلاصة

| البند | النتيجة |
|---|---|
| عدد القصص في `/prophets` | **25** |
| الرابط الرسمي لزكريا | `/prophets/zakariyya` |
| redirect من `/prophets/zakariya` | **301 → `/prophets/zakariyya`** |
| alias `zakaria` | **→ zakariyya** |
| أي رابط قائمة يحوّل للرئيسية؟ | **لا** |
| جاهزة للنشر؟ | **نعم** (بعد دمج هذا الفرع ونشر الإنتاج) |

## عدد القصص والـslugs

الإجمالي: **25** قصة (مطابق لـ `PROPHETS` + ملفات `public/data/knowledge/prophets/*.json`).

| # | slug | الاسم | حالة الصفحة |
|---|---|---|---|
| 1 | `adam` | آدم | صفحة قصة حقيقية |
| 2 | `idris` | إدريس | صفحة قصة حقيقية |
| 3 | `nuh` | نوح | صفحة قصة حقيقية |
| 4 | `hud` | هود | صفحة قصة حقيقية |
| 5 | `salih` | صالح | صفحة قصة حقيقية |
| 6 | `ibrahim` | إبراهيم | صفحة قصة حقيقية |
| 7 | `lut` | لوط | صفحة قصة حقيقية |
| 8 | `ismail` | إسماعيل | صفحة قصة حقيقية |
| 9 | `is-haq` | إسحاق | صفحة قصة حقيقية |
| 10 | `yaqub` | يعقوب | صفحة قصة حقيقية |
| 11 | `yusuf` | يوسف | صفحة قصة حقيقية |
| 12 | `ayyub` | أيوب | صفحة قصة حقيقية |
| 13 | `shuayb` | شعيب | صفحة قصة حقيقية |
| 14 | `musa` | موسى | صفحة قصة حقيقية |
| 15 | `harun` | هارون | صفحة قصة حقيقية |
| 16 | `dhul-kifl` | ذو الكفل | صفحة قصة حقيقية |
| 17 | `dawud` | داود | صفحة قصة حقيقية |
| 18 | `sulayman` | سليمان | صفحة قصة حقيقية |
| 19 | `ilyas` | إلياس | صفحة قصة حقيقية |
| 20 | `al-yasa` | اليسع | صفحة قصة حقيقية |
| 21 | `yunus` | يونس | صفحة قصة حقيقية |
| 22 | `zakariyya` | زكريا | صفحة قصة حقيقية |
| 23 | `yahya` | يحيى | صفحة قصة حقيقية |
| 24 | `isa` | عيسى | صفحة قصة حقيقية |
| 25 | `muhammad` | محمد | صفحة قصة حقيقية |

## Redirects المضافة

| المصدر | الوجهة | النوع |
|---|---|---|
| `/prophets/zakariya` | `/prophets/zakariyya` | 301 (vercel) + Redirect (App) |
| `/prophets/zakaria` | `/prophets/zakariyya` | 301 (vercel) + Redirect (App) |

Aliases في `PROPHET_SLUG_ALIASES` أيضاً:

- `zakariya` → `zakariyya`
- `zakaria` → `zakariyya`
- (إضافة مساعدة) `sulaiman` → `sulayman`، `shuaib` → `shuayb`

## إصلاحات مرافقة

- شجرة الأنساب كانت تستخدم `zakariya` / `sulaiman` / `shuaib` → صُحّحت إلى الـslugs الرسمية حتى لا تفتح صفحة «غير موجود».
- اختبار جديد: `src/lib/__tests__/prophets-final-routes.test.ts` يفشل إذا نقصت قصة، أو وُجد homepage fallback، أو ظهرت عبارات الحشو القديمة.

## التحقق

- `pnpm run test:prophets-content` ✓
- `pnpm run typecheck` ✓
- `pnpm run lint` ✓
- `pnpm run build` (يُشغَّل مع الإغلاق)

## هل قصص الأنبياء جاهزة للنشر؟

**نعم** — العدد 25 مكتمل، الروابط الرسمية تعمل، و`/prophets/zakariya` لم يعد يسقط بلا قصة (يُحوَّل 301 إلى `/prophets/zakariyya`).
