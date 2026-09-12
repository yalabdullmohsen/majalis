# سُنّة — لوحة موانع الإطلاق (P0)

آخر تحديث: 2026-09-12 · فرع: `cursor/excellence-p0-reliability` · PR: #1974

تجميد الميزات: **مفعّل** — إصلاحات/ربط/أداء/وصول فقط حتى إغلاق P0.

## P0

| المعرف | الوصف | Route/ملف | السبب الجذري | الحالة | يمنع الإطلاق؟ |
|---|---|---|---|---|---|
| P0-CI-CONTRAST | بوابة التباين تتوقع `.asp-hero__eyebrow` على `/assistant` بينما البوابة coming-soon | `scripts/verify-color-contrast-gate.mjs` · `/assistant` | محدّد قديم بعد إخفاء المساعد | **FIXED** (محدّدات `.assistant-title`/`.assistant-intro`) | كان نعم |
| P0-ASSISTANT-API | واجهة `/api/assistant` عامة رغم علم الواجهة | `lib/api-handlers/assistant.js` | لا بوابة خادم | **FIXED** (افتراضيًا `disabled` حتى `ASSISTANT_ENABLED=1`) | كان نعم |
| P0-SEARCH-RESOLVER | `book`/`fatwa` → كيان خاطئ + تفضيل `hit.href` على المحلّل | `content-entity.ts` · `content-resolver.ts` | خريطة أنواع + override | **FIXED** (`app_route` + لا override للأنواع المعروفة) | كان نعم |
| P0-HADITH-HREF | روابط `book:num` | `content-href.ts` | مسار `#` فقط | **FIXED** في #1974 | لا |
| P0-MUSHAF-ROUTES | `/mushaf/page/:n` يعيد تركيب القارئ | `AppRoutes.tsx` | Redirect ناقص | **FIXED** في #1974 | لا |
| P0-NOTES-SYNC | ملاحظات المصحف خارج محرك المزامنة | `quran-personal.ts` · handlers | لا outbox | **FIXED** في #1974 | لا |
| P0-PRAYER-DUAL | جدولة مزدوجة adhan + alert | `App.tsx` · schedulers | ملكية صوت/إشعار غير موثّقة | **MITIGATED** (تعليق ملكية + `NATIVE_ALERTS_OWN_AUDIO`) — تحقق جهاز **NOT VERIFIED** | مشروط |
| P0-BRAND-NOWPLAYING | ألبوم MediaSession باسم قديم | `adhan-audio-service.ts` | نص قديم | **FIXED** (`سُنّة — أذان`) | جزئي |

## P1 (بعد إغلاق CI وP0 المتبقي)

| المعرف | الوصف | الحالة |
|---|---|---|
| P1-DEAD-READER | `VerifiedMushafReader` غير موصول | مؤجل حذفًا بعد دورة TestFlight |
| P1-DEAD-PRAYER-API | `prayer-notification-service` بلا مستوردين | مؤجل |
| P1-PROGRESS-SPLIT | تقدّم mushaf vs quran-engine | مؤجل — لا Home/Today قبل القياس |
| P1-GUEST-MERGE | دمج ضيف جزئي | مؤجل |
| P1-DUAL-SEARCH-UI | Home search vs `/search` | مؤجل |

## P2

صقل بصري / Home / Today / Continue — **ممنوع البدء** بوجود P0 مفتوح أو CI أحمر.

## Acceptance (قبل READY)

- [ ] CI أخضر على #1974 (Contrast + Verify build + ci-required)
- [ ] لا P0 مفتوح بلا تخفيف موثّق
- [ ] لا أنظمة مكرّرة فعّالة بلا عقد ملكية
- [ ] TestFlight: صلاة/صوت — **NOT VERIFIED** حتى الجهاز
