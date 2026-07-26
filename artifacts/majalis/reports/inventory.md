# جرد المحتوى — قسم العقيدة

**تاريخ الجرد:** 2026-07-26  
**فرع العمل:** `cursor/content-full-audit-d4d2`  
**ملاحظة معمارية:** لا يوجد مسار `/aqeedah` ولا CMS ماركداون بـ frontmatter. بوابة العقيدة العامة هي `/tawhid`، والدروس المنظَّمة تحت `/learn/aqeedah-tawheed` (Supabase SQL).

## صفحات الواجهة (React)

| المسار | الملف | الحالة | ملاحظات |
|---|---|---|---|
| `/tawhid` | `src/views/TawhidPage.tsx` | مكتمل هيكليًا / يحتاج تدقيق | شبكة أقسام + أنواع التوحيد + مسائل + معاينة أسماء + كتب |
| `/arkan-iman` | `src/views/ArkanImanPage.tsx` | مكتمل هيكليًا | أركان الإيمان الستة |
| `/arkan` | `src/views/ArkanIslamPage.tsx` | مكتمل هيكليًا | أركان الإسلام |
| `/asma-husna` | `src/views/AsmaaHusnaPage.tsx` | ناقص منهجيًا | يعتمد تعداد الترمذي الضعيف لأسماء محددة |
| `/janna-naar` | `src/views/JannaNaarPage.tsx` | مكتمل هيكليًا | يحتاج مرور أدلة |
| `/alamat-saah` | `src/views/AlamatSaahPage.tsx` | مكتمل هيكليًا | حارس: لا تنزيل على معاصرين |
| `/malaika` | `src/views/MalaikaPage.tsx` | مكتمل هيكليًا | |
| `/iman-topics` | `src/views/ImanTopicsPage.tsx` + `iman-topics-data.ts` | متوسط | موضوعات مختصرة |
| `/learn/aqeedah-tawheed` | Supabase learn library | جزئي | دروس batch1+2 موجودة؛ أربعة منشورون بلا درس مخصّص سابقًا |

## تصنيفات التعلّم تحت `aqeedah-tawheed`

| slug | الاسم | درس SQL | نشر |
|---|---|---|---|
| aqeedah-intro | مدخل إلى العقيدة | batch1 | نعم |
| iman-malaika … iman-qadar | أركان الإيمان الخمسة بعد الإيمان بالله | batch1 | نعم |
| mana-ibadah / shirk / kufr / wala | معانٍ ونواقض جزئية | batch1 | نعم |
| sahaba-al-bayt … athar-iman | حزمة batch2 | batch2 | نعم |
| asma-wa-sifat / nubuwat / wasitiyya | taxonomy requested | batch2 | نعم |
| **iman-billah** | الإيمان بالله | **مكتمل (بذرة واجهة + SQL batch3 موسّع)** | درس «الإيمان بالله» متاح عبر البذرة فورًا |
| **aqsam-tawheed** | أقسام التوحيد | **مكتمل (بذرة واجهة + SQL batch3)** | |
| **nawaqid-islam** | نواقض الإسلام | **مكتمل (بذرة واجهة + SQL batch3)** | |
| **aqeedat-ahl-sunnah** | عقيدة أهل السنة | **مكتمل — ١٠ دروس** | بذرة `learn-library-aqeedah-batch3-seed.ts` + SQL موسّع |

## غير موجود كصفحة مستقلة (يُغطى جزئيًا داخل `/tawhid` أو دروس التعلّم)

مدخل العقيدة المنفصل، السنة والبدعة كصفحة مستقلة، مصادر القسم كصفحة زائر موحّدة (توجد `/methodology`).
