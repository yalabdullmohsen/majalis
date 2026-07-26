-- تدقيق `qa_questions` — الدفعة الثانية (35 صفًّا): تمام صنف «القرآن الكريم» (٦٧ صفًّا).
-- (ج-٢٢٧). المصدر التاسع والعشرون في تسلسل التدقيق الشامل. تكملة للدفعة الأولى
-- `qa_questions_quran_citations_verify_batch1.sql` (٣٠ صفًّا) ⇒ بهذين الملفَّين يكتمل
-- الصنف كلّه: ٣٠ + ٣٥ + صفّان بلا استشهاد قرآني (موصوفان في ذيل هذا الملف) = ٦٧.
--
-- ═══ منهج التحقُّق (آليّ بالكامل، بلا اعتماد على معرفة عامّة) ═══
-- 1) مصدر المقابلة: نصّ المصحف المحلّي في `artifacts/majalis/public/data/quran/surah-XXX.json`
--    (رواية حفص عن عاصم، الرسم العثماني، نصّ مشروع تنزيل عبر AlQuran Cloud — راجع
--    `docs/quran-data-source.md`)، وسلامته محقَّقة ببصمات SHA-256 في `manifest.json`.
-- 2) الأداة: `scripts/verify-quran-citations.py` — تنتزع كل مقتبس بين ﴿﴾ ووسم موضعه
--    [سورة: آية] من حقل `evidence`، ثم تقابل المقتبس بنصّ **الآية المُشار إليها بعينها**
--    لا ببحث حرّ في المصحف، فتكشف خطأ النصّ وخطأ الموضع معًا.
-- 3) **ضبط سالب**: أُعيد الفحص كله بعد إزاحة رقم كل آية بواحد ⇒ سقطت ٣٧/٣٧ (0 نجحت)،
--    فالمقابلة مميِّزة فعلًا ولا تقبل موضعًا خاطئًا.
--
-- ═══ 🔑 تشديد في الأداة أُضيف في هذه الدفعة — وهو الذي كشف العيب الوحيد ═══
-- كانت المقابلة طبقتين: مطابقة حرفيّة (OK)، أو تطابق «الهيكل الصامت» الذي يُسقط حروف
-- العلّة كلها ليتساوى الرسمان العثماني والإملائي (OK_IMLAI). والهيكل الصامت **أعمى عن
-- فرق الواو والياء**: «وَإِذَا» و«إِذَا» هيكلهما واحد (ذ)، فتمرّ واو مقحَمة في مقتبس
-- قرآني بلا أن يلحظها الفحص. فأُضيفت طبقة وسطى `rasm()` تُسقط الألف والهمزة وحدهما
-- (فيتساوى أَمْوَٰلِهِمْ بأَمْوَالِهِمْ وءَايَٰتٍ بآيَاتٍ) وتُبقي الواو والياء، وصارت
-- الحالات ثلاثًا: OK ⇐ OK_IMLAI ⇐ OK_SKELETON_ONLY (لم يتطابق إلا الهيكل ⇒ **تجب قراءته
-- كلمةً كلمةً**). فانخفضت القراءة اليدوية اللازمة من ٢١ مقتبسًا إلى ٣ في هذه الدفعة،
-- وظهر فيها العيب الحقيقي (الصفّ ٢٢ أدناه).
--
-- ═══ النتيجة ═══
-- • ٣٧ استشهادًا قرآنيًّا في ٣٥ صفًّا: **٣٦ صحيحة نصًّا وموضعًا**، و**واحد فيه واو مقحَمة**
--   (الطلاق: ١) صُحِّح بالحذف نقلًا عن المصحف المحلّي — تصحيح مطابقة لا اجتهاد.
-- • **٣٢ موضعًا متمايزًا** حُقِّق رابطه فرديًّا على quran.com: طُلب `quran.com/<رقم>/<آية>`
--   واتُّبع تحويله الدائم (308) إلى صيغته القانونية `quran.com/<اسم السورة>/<آية>`، وقُرئ
--   `<title>` وطُوبق على «Surah … Ayah N» ⇒ ٣٢/٣٢ ✔، وطُوبق اسم السورة في الرابط على
--   اسمها في المصحف المحلّي (غافر⇐ghafir، الطلاق⇐at-talaq، الصافات⇐as-saffat، …).
-- • **إعادة مسح الجدول كله (٣٧١ صفًّا، ٨٩ استشهادًا) بالأداة المشدَّدة**: ١١ استشهادًا
--   نزل إلى OK_SKELETON_ONLY فقُرئ كل واحد منها كلمةً كلمةً بمواجهة الآية ⇒ عشرة منها
--   فروق رسم محضة (ٱلصَّلَوٰةِ⇐الصَّلَاةِ، زَكَّىٰهَا⇐زَكَّاهَا، ٱلزِّنَىٰٓ⇐الزِّنَا،
--   ٱلَّٰتِىٓ⇐اللَّاتِي، ءَاتَىٰنِىَ⇐آتَانِيَ، ٱلنَّبِيِّۦنَ⇐النَّبِيِّينَ)، والحادي عشر
--   هو عيب الطلاق: ١ المُصحَّح هنا. **فلا عيب قرآنيًّا آخر في الجدول كله.**
--
-- التغيير في كل صفّ: `verification_status` ⇐ 'verified'، و`source_url` ⇐ رابط الآية
-- المتحقَّق (كان NULL في الجدول كلّه)، و`reference` ⇐ تعيين الموضع بدل «القرآن الكريم»
-- المجرَّدة، بنقل اسم السورة ورقم الآية **كما هما مكتوبان في `evidence` نفسه حرفًا**
-- (بلا صياغة جديدة)، مع إبقاء ذيل «| الكلمات المفتاحية: …» كما هو لأنه بنية قائمة في
-- ٣٦٤ من ٣٧١ صفًّا وترحيلها مهمة مستقلّة مسجَّلة في CONTINUATION_PLAN.md.
--
-- idempotent: كل عبارة مقيَّدة بـ`id` وبالنصّ الأصلي لحقل `reference` (أو `evidence` في
-- صفّ التصحيح)، فإعادة التشغيل بعد أول تطبيق لا تغيّر شيئًا.
--
-- ⚠️ لم يُطبَّق هذا الملف على القاعدة الحيّة في دورة إنشائه — لنفس عائق ج-٢٢٢…ج-٢٢٦:
--    `artifacts/majalis/.env.local` يحوي `VITE_SUPABASE_URL` و`VITE_SUPABASE_ANON_KEY`
--    فقط (يقرأ ولا يكتب)، ولا `SUPABASE_SERVICE_ROLE_KEY` ولا `DATABASE_URL`، ولا
--    psql/supabase CLI. يُطبَّق يدويًّا في SQL Editor.

BEGIN;


-- 1) ما حكمة مشروعية الزكاة في الإسلام؟
--    الموضع: 9:103=OK_IMLAI — الرابط المتحقَّق: https://quran.com/at-tawbah/103
UPDATE qa_questions SET reference='القرآن الكريم — سورة التوبة: ١٠٣ | الكلمات المفتاحية: حكمة الزكاة',
       source_url='https://quran.com/at-tawbah/103', verification_status='verified', updated_at=now()
 WHERE id='2c8bcc8d-6bed-4e3d-9526-61977c5fd297' AND reference='القرآن الكريم | الكلمات المفتاحية: حكمة الزكاة';

-- 2) ما حكمة مشروعية الزواج في الإسلام؟
--    الموضع: 30:21=OK_IMLAI — الرابط المتحقَّق: https://quran.com/ar-rum/21
UPDATE qa_questions SET reference='القرآن الكريم — سورة الروم: ٢١ | الكلمات المفتاحية: حكمة النكاح',
       source_url='https://quran.com/ar-rum/21', verification_status='verified', updated_at=now()
 WHERE id='ea32d2fa-99f4-4476-b1f7-d4ea43d749c3' AND reference='القرآن الكريم | الكلمات المفتاحية: حكمة النكاح';

-- 3) ما عقوبة منع الزكاة في الآخرة؟
--    الموضع: 9:35=OK — الرابط المتحقَّق: https://quran.com/at-tawbah/35
UPDATE qa_questions SET reference='القرآن الكريم — سورة التوبة: ٣٥ | الكلمات المفتاحية: عقوبة منع الزكاة',
       source_url='https://quran.com/at-tawbah/35', verification_status='verified', updated_at=now()
 WHERE id='0654e13e-2f56-40a4-a513-fc1c4ca2b12a' AND reference='القرآن الكريم | الكلمات المفتاحية: عقوبة منع الزكاة';

-- 4) ما فضل العفو والصفح عن الناس؟
--    الموضع: 5:13=OK — الرابط المتحقَّق: https://quran.com/al-maidah/13
UPDATE qa_questions SET reference='القرآن الكريم — سورة المائدة: ١٣ | الكلمات المفتاحية: فضل العفو',
       source_url='https://quran.com/al-maidah/13', verification_status='verified', updated_at=now()
 WHERE id='d79970cf-6e17-47bc-a7ee-0ad6acff158c' AND reference='القرآن الكريم | الكلمات المفتاحية: فضل العفو';

-- 5) ما فضل ليلة القدر؟
--    الموضع: 97:3=OK — الرابط المتحقَّق: https://quran.com/al-qadr/3
UPDATE qa_questions SET reference='القرآن الكريم — سورة القدر: ٣ | الكلمات المفتاحية: ليلة القدر',
       source_url='https://quran.com/al-qadr/3', verification_status='verified', updated_at=now()
 WHERE id='3f7fc649-222b-4118-a3fc-0f2f3c303219' AND reference='القرآن الكريم | الكلمات المفتاحية: ليلة القدر';

-- 6) ما كفارة اليمين إذا حنث فيها الحالف؟
--    الموضع: 5:89=OK_IMLAI — الرابط المتحقَّق: https://quran.com/al-maidah/89
UPDATE qa_questions SET reference='القرآن الكريم — سورة المائدة: ٨٩ | الكلمات المفتاحية: كفارة اليمين',
       source_url='https://quran.com/al-maidah/89', verification_status='verified', updated_at=now()
 WHERE id='c4252330-e40e-435a-851e-a9778d79e273' AND reference='القرآن الكريم | الكلمات المفتاحية: كفارة اليمين';

-- 7) ما مبدأ الشورى في نظام الحكم الإسلامي؟
--    الموضع: 3:159=OK — الرابط المتحقَّق: https://quran.com/ali-imran/159
UPDATE qa_questions SET reference='القرآن الكريم — سورة آل عمران: ١٥٩ | الكلمات المفتاحية: الشورى',
       source_url='https://quran.com/ali-imran/159', verification_status='verified', updated_at=now()
 WHERE id='96abea2e-bdd7-415b-8830-5de53aa5db6a' AND reference='القرآن الكريم | الكلمات المفتاحية: الشورى';

-- 8) ما معنى "المحكم والمتشابه" في القرآن الكريم؟
--    الموضع: 3:7=OK_IMLAI — الرابط المتحقَّق: https://quran.com/ali-imran/7
UPDATE qa_questions SET reference='القرآن الكريم — سورة آل عمران: ٧ | الكلمات المفتاحية: المحكم والمتشابه',
       source_url='https://quran.com/ali-imran/7', verification_status='verified', updated_at=now()
 WHERE id='ec058008-a8dd-49f3-8eca-d8038703b4ab' AND reference='القرآن الكريم | الكلمات المفتاحية: المحكم والمتشابه';

-- 9) ما معنى "رفع الحرج" كمقصد من مقاصد الشريعة الإسلامية؟
--    الموضع: 2:185=OK — الرابط المتحقَّق: https://quran.com/al-baqarah/185
UPDATE qa_questions SET reference='القرآن الكريم — سورة البقرة: ١٨٥ | الكلمات المفتاحية: رفع الحرج، اليسر في الشريعة',
       source_url='https://quran.com/al-baqarah/185', verification_status='verified', updated_at=now()
 WHERE id='e2173d05-577c-4acb-ada2-216ccbb06e55' AND reference='القرآن الكريم | الكلمات المفتاحية: رفع الحرج، اليسر في الشريعة';

-- 10) ما معنى إعجاز القرآن اللغوي؟
--    الموضع: 17:88=OK_IMLAI — الرابط المتحقَّق: https://quran.com/al-isra/88
UPDATE qa_questions SET reference='القرآن الكريم — سورة الإسراء: ٨٨ | الكلمات المفتاحية: إعجاز القرآن',
       source_url='https://quran.com/al-isra/88', verification_status='verified', updated_at=now()
 WHERE id='ea1e0290-cd03-4798-9b70-fb35eb37f1f5' AND reference='القرآن الكريم | الكلمات المفتاحية: إعجاز القرآن';

-- 11) ما معنى الإيمان بالقدر؟
--    الموضع: 54:49=OK_IMLAI — الرابط المتحقَّق: https://quran.com/al-qamar/49
UPDATE qa_questions SET reference='القرآن الكريم — سورة القمر: ٤٩ | الكلمات المفتاحية: الإيمان بالقدر',
       source_url='https://quran.com/al-qamar/49', verification_status='verified', updated_at=now()
 WHERE id='7339aa28-173d-4e8c-b78b-8bc5d2c2d82a' AND reference='القرآن الكريم | الكلمات المفتاحية: الإيمان بالقدر';

-- 12) ما معنى الربا، ولماذا حُرِّم في الإسلام؟
--    الموضع: 2:275=OK_IMLAI — الرابط المتحقَّق: https://quran.com/al-baqarah/275
UPDATE qa_questions SET reference='القرآن الكريم — سورة البقرة: ٢٧٥ | الكلمات المفتاحية: الربا، تحريم الربا',
       source_url='https://quran.com/al-baqarah/275', verification_status='verified', updated_at=now()
 WHERE id='a7a1f1cf-00d7-4fe2-928d-361e665e777f' AND reference='القرآن الكريم | الكلمات المفتاحية: الربا، تحريم الربا';

-- 13) ما معنى الشرك الأكبر؟
--    الموضع: 4:48=OK — الرابط المتحقَّق: https://quran.com/an-nisa/48
UPDATE qa_questions SET reference='القرآن الكريم — سورة النساء: ٤٨ | الكلمات المفتاحية: الشرك الأكبر، التوحيد، العقيدة',
       source_url='https://quran.com/an-nisa/48', verification_status='verified', updated_at=now()
 WHERE id='26ce27eb-2549-4da4-a497-0dc6378763e3' AND reference='القرآن الكريم | الكلمات المفتاحية: الشرك الأكبر، التوحيد، العقيدة';

-- 14) ما معنى الشفاعة العظمى يوم القيامة؟
--    الموضع: 17:79=OK — الرابط المتحقَّق: https://quran.com/al-isra/79
UPDATE qa_questions SET reference='القرآن الكريم — سورة الإسراء: ٧٩ | الكلمات المفتاحية: الشفاعة العظمى، المقام المحمود',
       source_url='https://quran.com/al-isra/79', verification_status='verified', updated_at=now()
 WHERE id='e1ca1a32-2770-42f3-bc93-da7d3bca02e6' AND reference='القرآن الكريم | الكلمات المفتاحية: الشفاعة العظمى، المقام المحمود';

-- 15) ما معنى قاعدة "المشقة تجلب التيسير"؟
--    الموضع: 2:185=OK — الرابط المتحقَّق: https://quran.com/al-baqarah/185
UPDATE qa_questions SET reference='القرآن الكريم — سورة البقرة: ١٨٥ | الكلمات المفتاحية: قاعدة المشقة تجلب التيسير',
       source_url='https://quran.com/al-baqarah/185', verification_status='verified', updated_at=now()
 WHERE id='6bae9b8b-24d0-4fef-9d24-6fb2256d2f71' AND reference='القرآن الكريم | الكلمات المفتاحية: قاعدة المشقة تجلب التيسير';

-- 16) ما منهج الدعوة إلى الله كما أمر القرآن؟
--    الموضع: 16:125=OK_IMLAI — الرابط المتحقَّق: https://quran.com/an-nahl/125
UPDATE qa_questions SET reference='القرآن الكريم — سورة النحل: ١٢٥ | الكلمات المفتاحية: منهج الدعوة، الحكمة',
       source_url='https://quran.com/an-nahl/125', verification_status='verified', updated_at=now()
 WHERE id='ba29b582-784a-4bf4-b1b9-9f235d0f9ff4' AND reference='القرآن الكريم | الكلمات المفتاحية: منهج الدعوة، الحكمة';

-- 17) ما منهج النبي ﷺ في دعوة أهل الكتاب؟
--    الموضع: 3:64=OK_IMLAI — الرابط المتحقَّق: https://quran.com/ali-imran/64
UPDATE qa_questions SET reference='القرآن الكريم — سورة آل عمران: ٦٤ | الكلمات المفتاحية: دعوة أهل الكتاب',
       source_url='https://quran.com/ali-imran/64', verification_status='verified', updated_at=now()
 WHERE id='4d5e7a75-f355-4eaf-be1f-60361b8f911d' AND reference='القرآن الكريم | الكلمات المفتاحية: دعوة أهل الكتاب';

-- 18) ما هو الهدي في الحج؟
--    الموضع: 2:196=OK — الرابط المتحقَّق: https://quran.com/al-baqarah/196
UPDATE qa_questions SET reference='القرآن الكريم — سورة البقرة: ١٩٦ | الكلمات المفتاحية: الهدي في الحج',
       source_url='https://quran.com/al-baqarah/196', verification_status='verified', updated_at=now()
 WHERE id='6faeef12-d2e6-4382-94fb-fd36a1dda143' AND reference='القرآن الكريم | الكلمات المفتاحية: الهدي في الحج';

-- 19) ما هو ميراث الإخوة والأخوات لأم (الكلالة)؟
--    الموضع: 4:12=OK_IMLAI — الرابط المتحقَّق: https://quran.com/an-nisa/12
UPDATE qa_questions SET reference='القرآن الكريم — سورة النساء: ١٢ | الكلمات المفتاحية: ميراث الإخوة لأم',
       source_url='https://quran.com/an-nisa/12', verification_status='verified', updated_at=now()
 WHERE id='44ef4746-30c3-44ae-8813-5f05306c2e4a' AND reference='القرآن الكريم | الكلمات المفتاحية: ميراث الإخوة لأم';

-- 20) ما هو ميراث الزوجين؟
--    الموضع: 4:12=OK_IMLAI — الرابط المتحقَّق: https://quran.com/an-nisa/12
UPDATE qa_questions SET reference='القرآن الكريم — سورة النساء: ١٢ | الكلمات المفتاحية: ميراث الزوجين',
       source_url='https://quran.com/an-nisa/12', verification_status='verified', updated_at=now()
 WHERE id='2e7c8453-84ec-4411-a617-d8615d98e4b2' AND reference='القرآن الكريم | الكلمات المفتاحية: ميراث الزوجين';

-- 21) ما هي حقوق الزوجة على زوجها؟
--    الموضع: 4:19=OK — الرابط المتحقَّق: https://quran.com/an-nisa/19
UPDATE qa_questions SET reference='القرآن الكريم — سورة النساء: ١٩ | الكلمات المفتاحية: حقوق الزوجة',
       source_url='https://quran.com/an-nisa/19', verification_status='verified', updated_at=now()
 WHERE id='2098f51a-d48f-4163-b476-59cbfb99bf0d' AND reference='القرآن الكريم | الكلمات المفتاحية: حقوق الزوجة';

-- 22) ما هي عدة المطلقة؟
--    الموضع: 65:1=OK_SKELETON_ONLY — الرابط المتحقَّق: https://quran.com/at-talaq/1
--    🚩 تصحيح مطابقة نصّ (لا اجتهاد): المقتبس كان يفتتح بـ«وَإِذَا طَلَّقْتُمُ» بواو،
--    ونصّ الآية في المصحف المحلّي (surah-065.json، آية ١): «يَٰٓأَيُّهَا ٱلنَّبِىُّ إِذَا
--    طَلَّقْتُمُ ٱلنِّسَآءَ فَطَلِّقُوهُنَّ لِعِدَّتِهِنَّ وَأَحْصُوا۟ ٱلْعِدَّةَ» — بلا واو.
--    فحُذفت الواو المقحَمة وحدها، وبقي سائر المقتبس على رسمه الإملائي كما هو،
--    إذ كل حرف فيه بعدها مطابق للآية. (الواو الوحيدة الباقية «وَأَحْصُوا» في الآية.)
--    وبرهان أن الواو كانت الفرق الوحيد: النصّ بعد التصحيح يرتفع من OK_SKELETON_ONLY إلى
--    **OK** أي المطابقة الحرفيّة للآية بعد إزالة التشكيل — بلا أي فرق آخر.
UPDATE qa_questions SET evidence='قال تعالى: ﴿إِذَا طَلَّقْتُمُ النِّسَاءَ فَطَلِّقُوهُنَّ لِعِدَّتِهِنَّ وَأَحْصُوا الْعِدَّةَ﴾ [الطلاق: ١].',
       reference='القرآن الكريم — سورة الطلاق: ١ | الكلمات المفتاحية: عدة المطلقة',
       source_url='https://quran.com/at-talaq/1', verification_status='verified', updated_at=now()
 WHERE id='3caaf717-c6da-472b-8fc0-32f35f899086' AND evidence='قال تعالى: ﴿وَإِذَا طَلَّقْتُمُ النِّسَاءَ فَطَلِّقُوهُنَّ لِعِدَّتِهِنَّ وَأَحْصُوا الْعِدَّةَ﴾ [الطلاق: ١].';

-- 23) ما هي قصة خلق آدم عليه السلام كما وردت في القرآن؟
--    الموضع: 2:30=OK_IMLAI — الرابط المتحقَّق: https://quran.com/al-baqarah/30
UPDATE qa_questions SET reference='القرآن الكريم — سورة البقرة: ٣٠ | الكلمات المفتاحية: قصة خلق آدم',
       source_url='https://quran.com/al-baqarah/30', verification_status='verified', updated_at=now()
 WHERE id='4d70155e-62d7-4e00-9336-aa1944fea56d' AND reference='القرآن الكريم | الكلمات المفتاحية: قصة خلق آدم';

-- 24) ما هي قصة نبي الله يونس عليه السلام مع الحوت؟
--    الموضع: 37:139=OK 37:142=OK — الرابط المتحقَّق: https://quran.com/as-saffat/139
UPDATE qa_questions SET reference='القرآن الكريم — سورة الصافات: ١٣٩، ١٤٢ | الكلمات المفتاحية: قصة يونس والحوت',
       source_url='https://quran.com/as-saffat/139', verification_status='verified', updated_at=now()
 WHERE id='b5b444de-bffa-4a46-8602-d2334c955f98' AND reference='القرآن الكريم | الكلمات المفتاحية: قصة يونس والحوت';

-- 25) ما هي وصية لقمان الحكيم لابنه كما وردت في القرآن؟
--    الموضع: 31:13=OK_IMLAI — الرابط المتحقَّق: https://quran.com/luqman/13
UPDATE qa_questions SET reference='القرآن الكريم — سورة لقمان: ١٣ | الكلمات المفتاحية: وصية لقمان',
       source_url='https://quran.com/luqman/13', verification_status='verified', updated_at=now()
 WHERE id='2bd60737-d68a-4af1-bc47-f9ce9fc7c034' AND reference='القرآن الكريم | الكلمات المفتاحية: وصية لقمان';

-- 26) ما هي يمين اللغو التي لا مؤاخذة فيها؟
--    الموضع: 5:89=OK_IMLAI — الرابط المتحقَّق: https://quran.com/al-maidah/89
UPDATE qa_questions SET reference='القرآن الكريم — سورة المائدة: ٨٩ | الكلمات المفتاحية: يمين اللغو',
       source_url='https://quran.com/al-maidah/89', verification_status='verified', updated_at=now()
 WHERE id='0e479bf4-7cdb-4dc4-af6b-eba79ceea147' AND reference='القرآن الكريم | الكلمات المفتاحية: يمين اللغو';

-- 27) ماذا قال نبي الله عيسى عليه السلام عن نفسه بحسب القرآن؟
--    الموضع: 19:30=OK_SKELETON_ONLY — الرابط المتحقَّق: https://quran.com/maryam/30
UPDATE qa_questions SET reference='القرآن الكريم — سورة مريم: ٣٠ | الكلمات المفتاحية: عيسى ينطق في المهد',
       source_url='https://quran.com/maryam/30', verification_status='verified', updated_at=now()
 WHERE id='937417d5-f0e3-4e6b-9389-831ef60aed48' AND reference='القرآن الكريم | الكلمات المفتاحية: عيسى ينطق في المهد';

-- 28) متى نزل القرآن الكريم أول مرة؟
--    الموضع: 97:1=OK_IMLAI 2:185=OK_IMLAI — الرابط المتحقَّق: https://quran.com/al-qadr/1
UPDATE qa_questions SET reference='القرآن الكريم — سورة القدر: ١ وسورة البقرة: ١٨٥ | الكلمات المفتاحية: بداية نزول القرآن',
       source_url='https://quran.com/al-qadr/1', verification_status='verified', updated_at=now()
 WHERE id='62db4cf7-a4ca-4503-8bf6-614a95882e4a' AND reference='القرآن الكريم | الكلمات المفتاحية: بداية نزول القرآن';

-- 29) من أصحاب العصبات في الميراث؟
--    الموضع: 4:11=OK_IMLAI — الرابط المتحقَّق: https://quran.com/an-nisa/11
UPDATE qa_questions SET reference='القرآن الكريم — سورة النساء: ١١ | الكلمات المفتاحية: أصحاب العصبات',
       source_url='https://quran.com/an-nisa/11', verification_status='verified', updated_at=now()
 WHERE id='fcb3f44f-4054-47be-b394-6f0e18ac9368' AND reference='القرآن الكريم | الكلمات المفتاحية: أصحاب العصبات';

-- 30) من هم أولو العزم من الرسل؟
--    الموضع: 33:7=OK_SKELETON_ONLY — الرابط المتحقَّق: https://quran.com/al-ahzab/7
UPDATE qa_questions SET reference='القرآن الكريم — سورة الأحزاب: ٧ | الكلمات المفتاحية: أولو العزم، الأنبياء',
       source_url='https://quran.com/al-ahzab/7', verification_status='verified', updated_at=now()
 WHERE id='664e9821-ddc5-42f7-b0d0-80c28c71a21d' AND reference='القرآن الكريم | الكلمات المفتاحية: أولو العزم، الأنبياء';

-- 31) من هم مصارف الزكاة الثمانية؟
--    الموضع: 9:60=OK_IMLAI — الرابط المتحقَّق: https://quran.com/at-tawbah/60
UPDATE qa_questions SET reference='القرآن الكريم — سورة التوبة: ٦٠ | الكلمات المفتاحية: مصارف الزكاة، أصناف الزكاة',
       source_url='https://quran.com/at-tawbah/60', verification_status='verified', updated_at=now()
 WHERE id='16c73027-7c27-4c43-9c8c-7856632151ce' AND reference='القرآن الكريم | الكلمات المفتاحية: مصارف الزكاة، أصناف الزكاة';

-- 32) من يُرخَّص له الفطر في رمضان مع وجوب القضاء أو الفدية؟
--    الموضع: 2:185=OK — الرابط المتحقَّق: https://quran.com/al-baqarah/185
UPDATE qa_questions SET reference='القرآن الكريم — سورة البقرة: ١٨٥ | الكلمات المفتاحية: رخصة الفطر، قضاء الصيام',
       source_url='https://quran.com/al-baqarah/185', verification_status='verified', updated_at=now()
 WHERE id='5de7f8f7-170a-47ae-8998-2372e3b08d2c' AND reference='القرآن الكريم | الكلمات المفتاحية: رخصة الفطر، قضاء الصيام';

-- 33) هل الدعوة إلى الله واجبة على كل مسلم؟
--    الموضع: 3:104=OK — الرابط المتحقَّق: https://quran.com/ali-imran/104
UPDATE qa_questions SET reference='القرآن الكريم — سورة آل عمران: ١٠٤ | الكلمات المفتاحية: وجوب الدعوة، فرض كفاية',
       source_url='https://quran.com/ali-imran/104', verification_status='verified', updated_at=now()
 WHERE id='0e959438-20fa-4400-81ac-fadc856a7e93' AND reference='القرآن الكريم | الكلمات المفتاحية: وجوب الدعوة، فرض كفاية';

-- 34) هل ذُكر جميع الأنبياء بأسمائهم في القرآن الكريم؟
--    الموضع: 40:78=OK — الرابط المتحقَّق: https://quran.com/ghafir/78
UPDATE qa_questions SET reference='القرآن الكريم — سورة غافر: ٧٨ | الكلمات المفتاحية: عدد الأنبياء، قصص الأنبياء',
       source_url='https://quran.com/ghafir/78', verification_status='verified', updated_at=now()
 WHERE id='725cec8f-4d2f-4017-aafd-b8d6673eac63' AND reference='القرآن الكريم | الكلمات المفتاحية: عدد الأنبياء، قصص الأنبياء';

-- 35) هل يجوز الدعوة بلغة غير العربية؟
--    الموضع: 14:4=OK — الرابط المتحقَّق: https://quran.com/ibrahim/4
UPDATE qa_questions SET reference='القرآن الكريم — سورة إبراهيم: ٤ | الكلمات المفتاحية: الدعوة بلغة المدعو',
       source_url='https://quran.com/ibrahim/4', verification_status='verified', updated_at=now()
 WHERE id='7b194726-4db1-418c-a6a2-e7baa7d69108' AND reference='القرآن الكريم | الكلمات المفتاحية: الدعوة بلغة المدعو';

COMMIT;

-- ═══ صفّان لا يُلمسان في هذه الدفعة (مرجعهما «القرآن الكريم» بلا استشهاد بعينه) ═══
-- `060849ce-80ac-4fde-93aa-ad8647ad2cc0` «ما هي أبرز قصص الأنبياء المذكورة في القرآن؟»
-- `0af047b6-d0c1-497e-8a32-4ad2ef29838a` «ما هي قصة نبي الله موسى عليه السلام مع فرعون؟»
-- حقل `evidence` فيهما إحالة عامّة («قصص مذكورة تفصيلًا في مواضع متعددة من القرآن الكريم»)
-- بلا آية واحدة بين ﴿﴾ ولا وسم موضع، والجواب تلخيص تحريريّ لا نقل حرفيّ ⇒ لا شيء يُقابَل
-- بالمصحف، وتعيين مواضع لهما يكون اختيارًا اجتهاديًّا مني لا نقلًا. فتُركا على
-- `needs_review` وسُجِّلا في `artifacts/majalis/data/needs-post-review.jsonl`.

