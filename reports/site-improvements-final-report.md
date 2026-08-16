# تقرير تحسينات موقع Majlisilm

**التاريخ:** 2026-08-16  
**الفرع:** `improve/site-quality-seo-features`

## ما تم تحسينه

### 1) CI / SEO
- استبعاد `/admin/*` و`/dashboard/*` و`/internal/*` من فشل P0 لطول الوصف كان مفعّلاً أصلًا (`seo-path-class.mjs` + `test-seo.mjs` + `seo-admin-privacy.test.ts`).
- التحقق الحالي: `test:seo` = **0 P0** على 969 صفحة؛ admin = noindex وخارج sitemap.
- تخفيف ادّعاء «مقالة موثقة» في `seo.ts` إلى صياغة لا تدّعي التوثيق بلا مصدر ظاهر.

### 2) الصفحة الرئيسية
- قسم **ابدأ من هنا** بقي وأُعيد ترتيبه أعلى المحتوى المفيد.
- بطاقة **ورد اليوم**: آية + ذكر + حديث + فائدة من `daily-content`.
- **آخر الدروس**، **أكمل من حيث توقفت**، **الأكثر قراءة** (محليًا)، **اقتراح اليوم**.
- شريط أعداد حية من `content-counts.json` + عدد الأنبياء من `PROPHETS.length`.

### 3) الدروس
- الفلاتر (علم/شيخ/منطقة/يوم/وقت) كانت موجودة؛ أُضيف رابط **تقويم الدروس** + الأرشيف أعلى الصفحة.
- زر التقويم في تفاصيل الدرس موجود مسبقًا.

### 4) القرآن والمصحف
- شريط الآية / القارئ / التفسير / الموضع / safe-area مكتملة من دمج سابق — لم تُكسر في هذه الدفعة.

### 5) قصص الأنبياء
- 25 قصة + redirects زكريا + منهج «ما ثبت / بلا جزم» في نصوص القصص موجودة مسبقًا — بلا إسرائيليات كحقائق.

### 6) المكتبة والعلماء
- فلتر **حالة الكتاب** + شارات تنبيه منهجي على البطاقات.
- اشتقاق **roleType** و**cautionLevel** وعرضهما مع فلتر الدور (بدون تكرار النبذة في التفاصيل الموسَّعة).

### 7) سين جيم
- اللعبة على `/quiz` بمستويات وتصنيفات موجودة؛ لم تُضف ادّعاءات «موثقة بالأدلة» بلا مصدر.

### 8) البحث
- اقتراحات الكتابة توسّعت لتشمل **الأنبياء** و**المكتبة** مع إبراز المجموعة.

### 9) الأذكار
- حفظ التقدّم عبر `localStorage` (مع قراءة ترحيلية من sessionStorage).

### 10) الجوال
- إخفاء الكروم عند النزول موجود من الدفعة السابقة (`useAutoHideBottomNav`).

### 11) زاحف داخلي
- `scripts/audit-public-site.ts`
- أوامر: `pnpm --filter @workspace/majalis run audit:public-site` و`pnpm run audit:public-site` من الجذر.

## الصفحات/الملفات التي تغيّرت (أبرزها)

| ملف | الغرض |
|---|---|
| `components/home/HomeDailyWirdBand.tsx` | ورد اليوم |
| `components/home/HomeMostReadBand.tsx` | الأكثر قراءة + اقتراح اليوم |
| `components/home/HomeLiveStatsStrip.tsx` | أعداد حية |
| `pages/account/ui/HomeView.tsx` | ترتيب الأقسام |
| `pages/library/ui/LibraryView.tsx` | فلتر الحالة + شارات |
| `pages/library/ui/IslamicScholarsView.tsx` | دور العالم + تنبيه |
| `lib/scholar-roles.ts` | اشتقاق الدور/التنبيه |
| `lib/search-suggestions.ts` | أنبياء + مكتبة |
| `pages/worship/ui/AdhkarView.tsx` | استمرار التقدّم |
| `pages/lessons/ui/LessonsView.tsx` | روابط التقويم |
| `scripts/audit-public-site.ts` | الزاحف |
| `styles/m2030/home.css` / `scholars.css` | تنسيق |

## نتائج الفحص

| فحص | النتيجة |
|---|---|
| `pnpm typecheck` | ✅ |
| `pnpm lint` | ✅ |
| `pnpm --filter @workspace/majalis run build` | ✅ |
| `pnpm --filter @workspace/majalis run test:seo` | ✅ 0 P0 |
| `audit:public-site` | ✅ 0 أخطاء |
| `scholar-roles.test.ts` | ✅ |

## هل CI جاهز للدمج؟

نعم محليًا بعد نجاح typecheck/lint/build/SEO/audit. يُفضَّل إكمال `pnpm run verify:ci -- --changed` قبل الدفع ثم PR + auto-merge كالمعتاد.

## ما بقي للمرحلة القادمة

1. تعبئة `contentStatus` لعدد أكبر من كتب المكتبة (التغطية ضيقة حاليًا).
2. ربط FAQ الشرعي (`QaPage`) بمسار مستقل دون كسر `/qa` → `/quiz`.
3. اختبارات Playwright بصرية للرئيسية الجديدة (390×844).
4. توسيع «ما ثبت / ما لا يصح الجزم به» كأقسام UI منفصلة في صفحة تفاصيل النبي إن رُغب بعرض أوضح خارج نص Markdown.
5. فلتر مسجد كـ`<select>` صريح إن لزم فوق البحث النصي الحالي.
