# تقرير تحسينات المنتج الخفيفة — Majlisilm

**التاريخ:** 2026-08-16
**الفرع:** `improve/light-product-polish`

## الميزات التي أُضيفت / صُقلت

| ميزة | الحالة |
|---|---|
| أكمل من حيث توقفت | موجودة + إضافة **العلماء** + عرض قسم/عنوان + زر **متابعة** |
| ورد اليوم | موجود؛ زر **تم** / **أُنجز** + حفظ localStorage |
| سين جيم `/qa`→`/quiz` | سؤال واحد لليوم + 4 خيارات + شرح + حفظ النتيجة |
| الأذكار | عداد + **تم** للذكر مرة واحدة + **إعادة ضبط** / إعادة ضبط التقدّم |
| قصص الأنبياء | شريط تقدم + السابق/التالي + redirects زكريا (موجودة مسبقًا) |
| الجوال | إخفاء القائمة عند النزول (موجود مسبقًا عبر `useAutoHideBottomNav`) |

## الملفات المعدّلة

- `src/lib/continue-reading.ts`
- `src/components/home/HomeLocalResumeCard.tsx`
- `src/styles/components/home-local-resume.css`
- `src/components/home/DailyWirdCard.tsx`
- `src/components/quiz-game/DailyChallengeQuiz.tsx`
- `src/styles/components/daily-challenge-quiz.css`
- `src/pages/worship/ui/AdhkarView.tsx`
- `src/styles/pages/adhkar.css`
- `scripts/audit-feature-readiness.ts`
- `reports/light-product-improvements-report.md`

## نتائج التحقق

| أمر | النتيجة |
|---|---|
| typecheck | ✅ |
| lint | ✅ |
| build | ✅ |
| audit:feature-readiness | ✅ |

## ملاحظات مؤجلة

- لا Backend جديد ولا refactor.
- توسيع بنك أسئلة السين جيم الموثقة يبقى لاحقًا.
- TestFlight غير مطلوب لهذه الدفعة (ويب/SPA فقط).
