# الاعتمادات والتراخيص — المجلس العلمي

**الجرد الكامل وحالات الإذن:** [`docs/LICENSES.md`](./docs/LICENSES.md) (وحدة ٤٨).  
**مخاطر ما قبل المتجر:** [`LICENSE_RISKS.md`](./LICENSE_RISKS.md).  
صفحة التطبيق: `/sources` (`SourcesLicensesPage`).

| المصدر | الاستخدام | ترخيص / إسناد (حالة) | رابط |
|---|---|---|---|
| Tanzil / نص عثماني (عبر AlQuran Cloud وملفات محلية) | نص القرآن في المصحف والبحث | راجع `docs/LICENSES.md` و`artifacts/majalis/docs/quran-data-source.md` — **جزئي / مطلوب للمتجر** | https://tanzil.net / https://alquran.cloud |
| Quran.com CDN / QUL — تخطيط QPC V2 وخطوط الصفحات | عرض المصحف (QPC) | منظومة QUL/KFG — **مطلوب تأكيد توزيع** | https://quran.com / https://qul.tarteel.ai |
| Quran.com API v4 — تفاسير | تفسير الآية في شيت المصحف | شروط Quran.com API — **جزئي** | https://api.quran.com |
| AlQuran Cloud — ترجمات | ترجمات اختيارية في شيت الآية | شروط الخدمة — **جزئي** | https://alquran.cloud |
| مجمع الملك فهد — التفسير الميسّر (عبر Quran.com) | طبعة تفسير | إسناد لجهة الإصدار — **يُؤكد الترخيص** | — |
| تفسير صوتي (مصحف) | بث دروس تفسير مرتبطة بآية/مقطع | **معطّل عمدًا** — كتالوج فارغ | — |
| everyayah.com — بث آية بآية | صوت تلاوة حي (HTTP stream) | **جزئي** — لا ملفات في الحزمة | https://everyayah.com |
| mp3quran.net — بث/تنزيل اختياري لسور كاملة | صوت سورة كاملة؛ تنزيل اختياري محلي بحدود حجم | **جزئي** | https://mp3quran.net |
| حصن المسلم (أذكار مستندة) | أذكار/أدعية مع إسناد | حقوق الجمع — **مطلوب** | — |
| خطوط الواجهة (Alexandria وغيرها في `index.html`) + Amiri Quran | واجهة + احتياطي يونيكود | OFL — **ممنوح** | — |
| شارة السورة وخرطوش وعلامة الآية Unicode (SVG) | واجهة المصحف | **رسم أصلي — ممنوح** | داخلي |
| مكتبات npm (React, Vite, Capacitor, …) | تشغيل التطبيق | بوابة `test:licenses` ترفض GPL/AGPL الصِّرف | — |
| محتوى المكتبة (~١٧٣ كتابًا) | صفحات الكتب | **غير محسوم** — فهرسة فردية ناقصة | داخلي |
| mohsalvi/adhan-audio (عبر jsDelivr) | بث أذان حي | **جزئي** — نسبة شخصية موقوفة | https://github.com/mohsalvi/adhan-audio |

أي صف «مطلوب» أو «غير محسوم» = لا يُوسَّع في 1.0.0 حتى يُحسم في `docs/LICENSES.md` و`LICENSE_RISKS.md`.


## تسجيلات الأذان (بث)

المصدر البرمجي: `artifacts/majalis/src/lib/adhan-audio.ts` + `adhan-patterns.ts`.  
مفتاح التعطيل: `artifacts/majalis/public/data/adhan-audio-remote.json` (إخفاء تسجيل/مصدر/نمط بلا إصدار تطبيق).

| id | الاسم المعروض | النمط | المسجد | سنة | ملف عام | ملف فجر | نسبة | ترخيص / ملاحظة |
|---|---|---|---|---|---|---|---|---|
| makkah | أذان الحرم المكي | مكي | المسجد الحرام | — | general/makkah-haram-01.mp3 | fajr/makkah-fajr-01.mp3 | نمط فقط | mohsalvi — قيد مراجعة الحقوق |
| alharam | أذان الحرم المكي (كلاسيكي) | مكي | المسجد الحرام | — | general/al-haram-01.mp3 | — | نمط فقط | mohsalvi — قيد مراجعة الحقوق |
| madinah | أذان المسجد النبوي | مدني | المسجد النبوي | — | general/madinah-01.mp3 | — | نمط فقط | mohsalvi — قيد مراجعة الحقوق |
| egypt | أذان مصري | مصري | — | — | general/egypt-traditional-01.mp3 | — | نمط فقط | mohsalvi — قيد مراجعة الحقوق |
| abdulbasit | أذان مصري (تسجيل ثانٍ) | مصري | — | — | general/abdul-basit-abdul-samad-01.mp3 | — | نمط فقط (اسم ملف غير موثّق) | mohsalvi |
| alafasy | أذان خليجي معاصر | مكي* | — | — | general/mishary-alafasy-01.mp3 | fajr/mishary-alafasy-fajr-01.mp3 | نمط فقط | mohsalvi |
| qatami | أذان خليجي (تسجيل ثانٍ) | مكي* | — | — | general/nasser-al-qatami-01.mp3 | — | نمط فقط | mohsalvi |
| nafees | أذان حجازي | مكي | — | — | general/ahmad-al-nafees-01.mp3 | — | نمط فقط | mohsalvi |
| mansour | أذان سعودي رسمي | مكي | — | — | general/mansour-al-zahrani-01.mp3 | fajr/mansour-al-zahrani-fajr-01.mp3 | نمط فقط | mohsalvi |
| aqsa-pending | أذان المسجد الأقصى | الأقصى | المسجد الأقصى | — | — | — | نمط فقط | **لا ملف مرخّص بعد** |
| levantine-pending | أذان شامي | شامي | — | — | — | — | نمط فقط | **لا ملف مرخّص بعد** |
| turkish-pending | أذان تركي / عثماني | تركي | — | — | — | — | نمط فقط | **لا ملف مرخّص بعد** |

\* مصنَّف تحت المكي كأقرب نمط منتجيًا حتى يتوفّر تصنيف أدق أو مصدر مرخّص مستقل.

### جودة المقاطع المضمّنة (عند التوريد)

- الهدف: AAC/MP3 ‎128–192kbps، أحادي مقبول، جهارة ≈ ‎-16 LUFS، قصّ صمت الطرفين + تلاشٍ ناعم.
- أداة التطبيع: `pnpm --filter @workspace/majalis run adhan:normalize -- in.mp3 out.mp3`
- بوابة CI: `test:adhan-audio-quality` على `public/sounds/adhan/` (قصير/تكبير ≤ ٢٨ث؛ بلا clipping).
- الاستماع اليدوي لعينة من كل ملف قبل الاعتماد إلزامي.

## سياسة صوت التلاوة

1. **البث فقط في الحزمة:** لا تُشحن ملفات MP3 داخل تطبيق المتجر.
2. **التنزيل الاختياري:** المستخدم يطلبه صراحةً؛ سقف التطبيق ≈ ١٫٥ غيغابايت وبحد أقصى قارئان كاملان (`quran-audio-downloads.ts`).
3. **مصدر غير واضح الترخيص:** لا يُضاف قارئ جديد حتى يُوثَّق المجلد/`server` هنا وفي `LICENSE_RISKS.md`.
4. **إسناد:** صفحة `/sources` تذكر everyayah وmp3quran مع رابط العودة.

## قرّاء التلاوة المفعّلون (بث)

كل صف: مجلد everyayah للآية + مسار mp3quran للسورة. الحالة «مفتوح مراجعة ToS» = مسموح بالبث الحي مع الإسناد؛ لا إعادة توزيع مجمّعة خارج التطبيق.

| id | الاسم | everyayah | mp3quran | جودة / ملاحظة |
|---|---|---|---|---|
| dosari | ياسر الدوسري | Yasser_Ad-Dussary_128kbps | server11…/yasser | 128kbps · مميّز · حفص |
| ali_jaber | علي جابر | Ali_Jaber_64kbps | server11…/a_jbr | 64kbps · مميّز · حفص |
| abdulsamad | عبد الباسط عبد الصمد | Abdul_Basit_Murattal_192kbps | server7…/basit | 192kbps · مميّز · حفص |
| minshawi | محمد صديق المنشاوي | Minshawy_Murattal_128kbps | server10…/minsh | 128kbps · مميّز · حفص |
| husary | محمود خليل الحصري | Husary_128kbps | server13…/husr | 128kbps · مميّز · حفص |
| alafasy | مشاري راشد العفاسي | Alafasy_128kbps | server8…/afs | 128kbps · مميّز · حفص |
| ghamdi | سعد الغامدي | Ghamadi_40kbps | server7…/s_gmd | 40kbps · مميّز · حفص |
| maher | ماهر المعيقلي | MaherAlMuaiqly128kbps | server12…/maher | 128kbps · مميّز · حفص |
| sudais | عبد الرحمن السديس | Abdurrahmaan_As-Sudais_192kbps | server11…/sds | 192kbps · مميّز · حفص |
| shuraim | سعود الشريم | Saood_ash-Shuraym_128kbps | server7…/shur | 128kbps · مميّز · حفص |
| ajamy | أحمد بن علي العجمي | …Ajamy_64kbps… | server10…/ajm/128 | 64kbps · مميّز · حفص |
| qatami | ناصر القطامي | Nasser_Alqatami_128kbps | server6…/qtm | 128kbps · مميّز · حفص |
| shatri | أبو بكر الشاطري | Abu_Bakr_Ash-Shaatree_128kbps | server11…/shatri | 128kbps · مميّز · حفص |
| balilah | بندر بليلة | — (سورة فقط) | server6…/balilah | mp3quran فقط · حفص |
| jaleel | خالد الجليل | — (سورة فقط) | server10…/jleel | mp3quran فقط · حفص |
| abkar | إدريس أبكر | — (سورة فقط) | server6…/abkr | mp3quran فقط · حفص |
| fares | فارس عباد | Fares_Abbad_64kbps | server8…/frs_a | 64kbps · مميّز · حفص |
| rifai | هاني الرفاعي | Hani_Rifai_192kbps | server8…/hani | 192kbps · مميّز · حفص |
| hudhaify | علي بن عبد الرحمن الحذيفي | Hudhaify_128kbps | server9…/hthfi | 128kbps · حفص |
| ayyoub | محمد أيوب | Muhammad_Ayyoub_128kbps | server8…/ayyub | 128kbps |
| jibreel | محمد جبريل | Muhammad_Jibreel_64kbps | server8…/jbrl | 64kbps |
| basfar | عبد الله بصفر | Abdullah_Basfar_192kbps | server6…/bsfr | 192kbps |
| mustafa_ismail | مصطفى إسماعيل | Mustafa_Ismail_48kbps | server8…/mustafa | 48kbps |
| tablawi | محمد محمود الطبلاوي | Mohammad_al_Tablaway_128kbps | server12…/tblawi | 128kbps |
| budair | صلاح البدير | Salah_Al_Budair_128kbps | server6…/s_bud | 128kbps |
| qasim | عبد المحسن القاسم | Muhsin_Al_Qasim_192kbps | server8…/qasm | 192kbps |
| matrood | عبد الله المطرود | Abdullah_Matroud_128kbps | server8…/mtrod | 128kbps |
| akhdar | إبراهيم الأخضر | Ibrahim_Akhdar_32kbps | server6…/akdr | 32kbps |
| bukhatir | صلاح بو خاطر | Salaah_AbdulRahman_Bukhatir_128kbps | server8…/bu_khtr | 128kbps |

المصدر البرمجي: `artifacts/majalis/src/lib/quran-audio.ts` + `quran-audio-source.ts`.  
مفتاح التعطيل التشغيلي: `artifacts/majalis/public/data/quran-audio-remote.json` (إخفاء قارئ أو مصدر everyayah/mp3quran بلا إصدار تطبيق جديد).
