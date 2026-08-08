# الاعتمادات والتراخيص — المجلس العلمي

صفحة التطبيق الموازية: `/sources` (`SourcesLicensesPage`).

| المصدر | الاستخدام | ترخيص / إسناد (حالة) | رابط |
|---|---|---|---|
| Tanzil / نص عثماني (عبر AlQuran Cloud وملفات محلية) | نص القرآن في المصحف والبحث | راجع `docs/quran-data-source.md` — **يُراجع قبل المتجر** | https://tanzil.net / https://alquran.cloud |
| Quran.com CDN / QUL — تخطيط QPC V2 وخطوط الصفحات | عرض المصحف (QPC) | منظومة QUL — **يُراجع بند التوزيع** | https://quran.com / https://qul.tarteel.ai |
| Quran.com API v4 — تفاسير | تفسير الآية في شيت المصحف | شروط Quran.com API — **يُراجع** | https://api.quran.com |
| AlQuran Cloud — ترجمات | ترجمات اختيارية في شيت الآية | شروط الخدمة — **يُراجع** | https://alquran.cloud |
| مجمع الملك فهد — التفسير الميسّر (عبر Quran.com) | طبعة تفسير | إسناد لجهة الإصدار — **يُؤكد الترخيص** | — |
| everyayah.com — بث آية بآية | صوت تلاوة حي (HTTP stream) | روابط خارجية؛ **لا تُضمَّن ملفات في الحزمة**؛ إسناد + رابط في `/sources` | https://everyayah.com |
| mp3quran.net — بث/تنزيل اختياري لسور كاملة | صوت سورة كاملة؛ تنزيل اختياري محلي بحدود حجم | روابط خارجية؛ التخزين المحلي اختياري للمستخدم فقط | https://mp3quran.net |
| خطوط الواجهة (Alexandria وغيرها في `index.html`) | واجهة المنصة | حسب ملفات الخط — انظر OFL حيث وُجد | — |
| مكتبات npm (React, Vite, Capacitor, …) | تشغيل التطبيق | رخص الحزم في `node_modules` / lockfile | — |
| محتوى المكتبة (~117 كتاباً) | صفحات الكتب | **فهرسة فردية ناقصة** — انظر `LICENSE_RISKS.md` | داخلي |

أي صف «يُراجع» أو مخاطر = لا يُوسَّع استخدامه في 1.0.0 حتى يُحسم في `LICENSE_RISKS.md`.

## سياسة صوت التلاوة

1. **البث فقط في الحزمة:** لا تُشحن ملفات MP3 داخل تطبيق المتجر.
2. **التنزيل الاختياري:** المستخدم يطلبه صراحةً؛ سقف التطبيق ≈ ١٫٥ غيغابايت وبحد أقصى قارئان كاملان (`quran-audio-downloads.ts`).
3. **مصدر غير واضح الترخيص:** لا يُضاف قارئ جديد حتى يُوثَّق المجلد/`server` هنا وفي `LICENSE_RISKS.md`.
4. **إسناد:** صفحة `/sources` تذكر everyayah وmp3quran مع رابط العودة.

## قرّاء التلاوة المفعّلون (بث)

كل صف: مجلد everyayah للآية + مسار mp3quran للسورة. الحالة «مفتوح مراجعة ToS» = مسموح بالبث الحي مع الإسناد؛ لا إعادة توزيع مجمّعة خارج التطبيق.

| id | الاسم | everyayah | mp3quran | ملاحظة |
|---|---|---|---|---|
| alafasy | مشاري راشد العفاسي | Alafasy_64kbps | server8…/afs | مميّز |
| abdulsamad | عبد الباسط عبد الصمد | Abdul_Basit_Murattal_64kbps | server7…/basit | مميّز |
| husary | محمود خليل الحصري | Husary_64kbps | server13…/husr | مميّز |
| minshawi | محمد صديق المنشاوي | Minshawy_Murattal_128kbps | server10…/minsh | مميّز |
| sudais | عبد الرحمن السديس | Abdurrahmaan_As-Sudais_64kbps | server11…/sds | مميّز |
| maher | ماهر المعيقلي | Maher_AlMuaiqly_64kbps | server12…/maher | مميّز |
| shuraim | سعود الشريم | Saood_ash-Shuraym_64kbps | server7…/shur | مميّز |
| dosari | ياسر الدوسري | Yasser_Ad-Dussary_128kbps | server11…/yasser | مميّز |
| ghamdi | سعد الغامدي | Ghamadi_40kbps | server7…/s_gmd | مميّز |
| ajamy | أحمد بن علي العجمي | Ahmed_ibn_Ali_al-Ajamy_64kbps_QuranExplorer.Com | server10…/ajm/128 | مميّز |
| hudhaify | علي بن عبد الرحمن الحذيفي | Hudhaify_64kbps | server9…/hthfi | مميّز |
| shatri | أبو بكر الشاطري | Abu_Bakr_Ash-Shaatree_128kbps | server11…/shatri | مميّز |
| ali_jaber | علي جابر | Ali_Jaber_64kbps | server11…/a_jbr | مميّز |
| ayyoub | محمد أيوب | Muhammad_Ayyoub_128kbps | server8…/ayyub | |
| jibreel | محمد جبريل | Muhammad_Jibreel_64kbps | server8…/jbrl | |
| qatami | ناصر القطامي | Nasser_Alqatami_128kbps | server6…/qtm | |
| rifai | هاني الرفاعي | Hani_Rifai_192kbps | server8…/hani | |
| basfar | عبد الله بصفر | Abdullah_Basfar_192kbps | server6…/bsfr | |
| fares | فارس عباد | Fares_Abbad_64kbps | server8…/frs_a | |
| mustafa_ismail | مصطفى إسماعيل | Mustafa_Ismail_48kbps | server8…/mustafa | |
| tablawi | محمد محمود الطبلاوي | Mohammad_al_Tablaway_128kbps | server12…/tblawi | |
| budair | صلاح البدير | Salah_Al_Budair_128kbps | server6…/s_bud | |
| qasim | عبد المحسن القاسم | Muhsin_Al_Qasim_192kbps | server8…/qasm | |
| matrood | عبد الله المطرود | Abdullah_Matroud_128kbps | server8…/mtrod | |
| akhdar | إبراهيم الأخضر | Ibrahim_Akhdar_32kbps | server6…/akdr | |
| bukhatir | صلاح بو خاطر | Salaah_AbdulRahman_Bukhatir_128kbps | server8…/bu_khtr | |

المصدر البرمجي للقائمة: `artifacts/majalis/src/lib/quran-audio.ts`.
