# تقرير تحسينات الميزات — المرحلة 2

**التاريخ:** 2026-08-16  
**الفرع:** `improve/feature-ux-phase2`

## الميزات التي أضيفت

| ميزة | التفاصيل |
|---|---|
| **DailyWirdCard** | آية (سورة+رقم) · حديث بمصدر · ذكر · فائدة · زر «تم اليوم» في localStorage |
| **أكمل من حيث توقفت** | تتبع mushaf/lessons/prophets/adhkar/library مع استثناء admin/auth/search |
| **بحث موحّد** | شارات قيد الإكمال/المراجعة · فلتر admin · تمييز الكلمة موجود |
| **سين جيم** | `DailyChallengeQuiz`: أقسام · مستويات · 4 اختيارات · نقاط · «قيد إضافة المصدر» |
| **دروس** | «الوقت قيد التأكيد» · زر تقويم على البطاقة المختصرة |
| **أنبياء** | أقسام: ما ثبت في القرآن/السنة · ما لا يصح الجزم به · prev/next موجودة |
| **مصحف/جوال** | لم تُكسر؛ شريط الآية + auto-hide موجودان |

## الملفات المعدّلة (أبرزها)

- `components/home/DailyWirdCard.tsx`
- `lib/continue-reading.ts`
- `components/home/HomeLocalResumeCard.tsx`
- `components/quiz-game/DailyChallengeQuiz.tsx`
- `pages/account/QuizPage.tsx` · `SearchView.tsx`
- `components/lessons/UnifiedLessonCard.tsx`
- `views/ProphetStoriesPage.tsx`
- `scripts/audit-feature-readiness.ts`
- `App.tsx` (تتبع المتابعة)

## ما تم تأجيله

1. إعادة بناء كاملة لسين جيم اللوحية (Jeopardy) — أُبقيَت مع التحدي اليومي فوقها.
2. تعبئة مصادر لكل سؤال في بنك اللعبة.
3. فلتر مسجد كـ select مستقل (البحث النصي يكفي حاليًا).
4. Playwright بصري جديد للمرحلة 2.

## نتائج الأوامر

| أمر | النتيجة |
|---|---|
| `pnpm typecheck` | ✅ |
| `pnpm lint` | ✅ |
| `pnpm run audit:feature-readiness` | ✅ |
| `pnpm --filter @workspace/majalis run test:seo` | ✅ 0 P0 |
| `pnpm build` (majalis) | يُشغَّل قبل الدفع |

## هل الموقع جاهز للدمج؟

نعم بعد نجاح build + verify:ci على الفرع.
