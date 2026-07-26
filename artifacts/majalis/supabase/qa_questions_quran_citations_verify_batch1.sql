-- تدقيق `qa_questions` — الدفعة الأولى (30 صفًّا): الصفوف التي مرجعها «القرآن الكريم»
-- (ج-٢٢٦). المصدر التاسع والعشرون في تسلسل التدقيق الشامل، وأول دفعة في هذا الجدول (371 صفًّا).
--
-- ═══ منهج التحقُّق (آليّ بالكامل، بلا اعتماد على معرفة عامّة) ═══
-- 1) مصدر المقابلة: نصّ المصحف المحلّي في `artifacts/majalis/public/data/quran/surah-XXX.json`
--    (رواية حفص عن عاصم، الرسم العثماني، نصّ مشروع تنزيل عبر AlQuran Cloud — راجع
--    `docs/quran-data-source.md`)، وسلامته محقَّقة ببصمات SHA-256 في `manifest.json`
--    عبر `scripts/verify-quran-integrity.mjs` المُدرَج في `pnpm run test:regression`.
-- 2) لكل صفّ: انتُزع كل مقتبس بين ﴿﴾ ووسم موضعه [سورة: آية] من حقل `evidence`، ثم قوبل
--    نصّ المقتبس بنصّ الآية المُشار إليها بعينها — لا ببحث حرّ في المصحف. المقابلة تُطبّع
--    التشكيل وتُوحّد الألف والياء والتاء المربوطة وتُسقط حروف العلّة والهمزات وتطوي الحرف
--    المكرَّر، ليتساوى الرسم العثماني (يكتب الألف المحذوفة ألفًا خنجرية: ٱلطَّلَٰقُ) بالرسم
--    الإملائي المعاصر المستعمَل في هذه الصفوف (الطَّلَاقُ) — وهما نصّ واحد بلا فرق.
-- 3) **ضبط سالب**: أُعيد الفحص كله بعد إزاحة رقم كل آية بواحد ⇒ سقطت 67/67 (0 نجحت)،
--    فالمقابلة مميِّزة فعلًا ولا تقبل موضعًا خاطئًا.
-- 4) الصفوف السبعة عشر المكتوبة بالرسم الإملائي قُرئت **كلمةً كلمةً** بمواجهة نصّ الآية
--    العثماني إضافةً إلى الفحص الآلي، فلا فرق إلا في الرسم (ٱ⇐ا، ٰ⇐ا، ءَامَنُوا⇐آمَنُوا،
--    يَٰٓأَيُّهَا⇐يَا أَيُّهَا، ٱلصَّلَوٰةَ⇐الصَّلَاةَ، ٱلزِّنَىٰٓ⇐الزِّنَا، ٱلَّٰتِىٓ⇐اللَّاتِي، فِى⇐فِي).
-- 5) الروابط: عُوِّل على `quran.com/<اسم السورة>/<رقم الآية>` بعد **التحقُّق من كل رابط**
--    على حدة (26 موضعًا متمايزًا): طُلبت الصفحة واتُّبع تحويلها الدائم (308) إلى صيغتها
--    القانونية، وقُرئ `<title>` وطُوبق على «Surah … Ayah N» ⇒ 26/26 ✔.
--
-- ═══ النتيجة: صفر خطأ في الثلاثين ═══
-- كل آية منقولة بنصّها الصحيح، وكل وسم موضع [سورة: آية] صحيح. فلا تصحيح نصّ في هذا الملف،
-- والتغيير كلّه توثيقيّ: (أ) `verification_status` ⇐ 'verified' بدل 'needs_review'،
-- (ب) `source_url` ⇐ رابط الآية المتحقَّق منه (كان NULL في الجدول كلّه: 0/371)،
-- (ج) `reference` ⇐ تعيين الموضع بدل «القرآن الكريم» المجرَّدة، بنقل اسم السورة ورقم الآية
--     **كما هما مكتوبان في `evidence` نفسه حرفًا** (بلا صياغة جديدة)، مع إبقاء ذيل
--     «| الكلمات المفتاحية: …» كما هو لأنه بنية قائمة في 364 من 371 صفًّا (راجع الملاحظة أدناه).
--
-- 🚩 ملاحظة بنيوية مرصودة لا تُعالَج هنا (تحتاج قرارًا وترحيلًا شاملًا لا دفعة جزئية):
--    ذيل «| الكلمات المفتاحية: …» **يُعرَض للقارئ** ضمن سطر «المرجع» في `QaCard.tsx:51`،
--    ومصدره `qa_phase4_seed.sql:97` الذي يُلحق الكلمات المفتاحية بحقل `reference` لأن
--    الجدول بلا عمود `keywords`. الإصلاح الجذري (عمود مستقلّ + ترحيل الـ364 صفًّا + عرضها
--    وسومًا في الواجهة) خارج نطاق دفعة محتوى، ومسجَّل في CONTINUATION_PLAN.md كمهمة مستقلّة.
--
-- idempotent: كل عبارة مقيَّدة بـ`id` وبالنصّ الأصلي لحقل `reference`، فإعادة التشغيل بعد
-- أول تطبيق لا تغيّر شيئًا.
--
-- ⚠️ لم يُطبَّق هذا الملف على القاعدة الحيّة في دورة إنشائه — لنفس عائق ج-٢٢٢…ج-٢٢٥ (أُعيد
--    التحقُّق منه هذه الدورة): `artifacts/majalis/.env.local` يحوي `VITE_SUPABASE_URL` و
--    `VITE_SUPABASE_ANON_KEY` فقط (يقرأ ولا يكتب)، ولا `SUPABASE_SERVICE_ROLE_KEY` ولا
--    `DATABASE_URL`، ولا psql/supabase CLI. يُطبَّق يدويًّا في SQL Editor. صفوفه مستقلّة
--    تمامًا عن الملفات المعلَّقة الأخرى (جدول مختلف).
BEGIN;

-- 1) كم عدد الطلقات التي يملك بها الزوج مراجعة زوجته؟
--    الآية: سُورَةُ البَقَرَةِ — البقرة: ٢٢٩ (2:229) ✔ مطابقة نصًّا وموضعًا، بالرسم الإملائي
--    الرابط المتحقَّق: Surah Al-Baqarah Ayah 229 - Read, Listen, Translation, Taf
UPDATE qa_questions SET reference='القرآن الكريم — سورة البقرة: ٢٢٩ | الكلمات المفتاحية: عدد الطلقات، الطلاق الرجعي',
       source_url='https://quran.com/al-baqarah/229', verification_status='verified', updated_at=now()
 WHERE id='54fbd4cf-78cb-4312-8b9d-48647445b123' AND reference='القرآن الكريم | الكلمات المفتاحية: عدد الطلقات، الطلاق الرجعي';

-- 2) كيف بشّرت الملائكة مريم عليها السلام بولادة عيسى عليه السلام؟
--    الآية: سُورَةُ آلِ عِمۡرَانَ — آل عمران: ٤٥ (3:45) ✔ مطابقة نصًّا وموضعًا، بالرسم الإملائي
--    الرابط المتحقَّق: Surah Ali 'Imran Ayah 45 - Read, Listen, Translation,
UPDATE qa_questions SET reference='القرآن الكريم — سورة آل عمران: ٤٥ | الكلمات المفتاحية: بشارة ولادة عيسى',
       source_url='https://quran.com/ali-imran/45', verification_status='verified', updated_at=now()
 WHERE id='ec2b2af3-db32-4d26-b58d-fa9f302ff6de' AND reference='القرآن الكريم | الكلمات المفتاحية: بشارة ولادة عيسى';

-- 3) كيف تحفظ الشريعة "حفظ العقل" كمقصد أساسي؟
--    الآية: سُورَةُ المَائـِدَةِ — المائدة: ٩٠ (5:90) ✔ مطابقة نصًّا وموضعًا، بالرسم الإملائي، وفيها حذف موضَّح بـ«...» وهو حذف صحيح من وسط الآية
--    الرابط المتحقَّق: Surah Al-Ma'idah Ayah 90 - Read, Listen, Translation,
UPDATE qa_questions SET reference='القرآن الكريم — سورة المائدة: ٩٠ | الكلمات المفتاحية: حفظ العقل',
       source_url='https://quran.com/al-maidah/90', verification_status='verified', updated_at=now()
 WHERE id='5209ae9e-00c9-4b50-b25d-71641b6ce2de' AND reference='القرآن الكريم | الكلمات المفتاحية: حفظ العقل';

-- 4) كيف تحفظ الشريعة "حفظ النسل" كمقصد أساسي؟
--    الآية: سُورَةُ الإِسۡرَاءِ — الإسراء: ٣٢ (17:32) ✔ مطابقة نصًّا وموضعًا، بالرسم الإملائي
--    الرابط المتحقَّق: Surah Al-Isra Ayah 32 - Read, Listen, Translation, Tafsir 
UPDATE qa_questions SET reference='القرآن الكريم — سورة الإسراء: ٣٢ | الكلمات المفتاحية: حفظ النسل',
       source_url='https://quran.com/al-isra/32', verification_status='verified', updated_at=now()
 WHERE id='e302dd23-ae90-41f6-b59c-c17453fecf92' AND reference='القرآن الكريم | الكلمات المفتاحية: حفظ النسل';

-- 5) كيف تحفظ الشريعة "حفظ النفس" كمقصد أساسي؟
--    الآية: سُورَةُ النِّسَاءِ — النساء: ٩٣ (4:93) ✔ مطابقة نصًّا وموضعًا، مطابقة حرفيّة للرسم العثماني
--    الرابط المتحقَّق: Surah An-Nisa Ayah 93 - Read, Listen, Translation, Tafsir 
UPDATE qa_questions SET reference='القرآن الكريم — سورة النساء: ٩٣ | الكلمات المفتاحية: حفظ النفس',
       source_url='https://quran.com/an-nisa/93', verification_status='verified', updated_at=now()
 WHERE id='0f0d00d8-cbf6-49eb-b9f4-932bf7d4c88e' AND reference='القرآن الكريم | الكلمات المفتاحية: حفظ النفس';

-- 6) كيف تُصلَّى صلاة الخوف؟
--    الآية: سُورَةُ النِّسَاءِ — النساء: ١٠٢ (4:102) ✔ مطابقة نصًّا وموضعًا، بالرسم الإملائي
--    الرابط المتحقَّق: Surah An-Nisa Ayah 102 - Read, Listen, Translation, Tafsir
UPDATE qa_questions SET reference='القرآن الكريم — سورة النساء: ١٠٢ | الكلمات المفتاحية: صلاة الخوف',
       source_url='https://quran.com/an-nisa/102', verification_status='verified', updated_at=now()
 WHERE id='6a4ec283-cde3-448c-8bf3-65d7f7996189' AND reference='القرآن الكريم | الكلمات المفتاحية: صلاة الخوف';

-- 7) لماذا يرث الرجل أحيانًا ضعف نصيب المرأة في الإسلام؟
--    الآية: سُورَةُ النِّسَاءِ — النساء: ١١ (4:11) ✔ مطابقة نصًّا وموضعًا، مطابقة حرفيّة للرسم العثماني
--    الرابط المتحقَّق: Surah An-Nisa Ayah 11 - Read, Listen, Translation, Tafsir 
UPDATE qa_questions SET reference='القرآن الكريم — سورة النساء: ١١ | الكلمات المفتاحية: ميراث المرأة، أصحاب الفروض',
       source_url='https://quran.com/an-nisa/11', verification_status='verified', updated_at=now()
 WHERE id='1d73ecf1-1fa9-4546-83a8-9ecf812c9f88' AND reference='القرآن الكريم | الكلمات المفتاحية: ميراث المرأة، أصحاب الفروض';

-- 8) ما آداب الاستئذان قبل دخول بيوت الآخرين؟
--    الآية: سُورَةُ النُّورِ — النور: ٢٧ (24:27) ✔ مطابقة نصًّا وموضعًا، بالرسم الإملائي
--    الرابط المتحقَّق: Surah An-Nur Ayah 27 - Read, Listen, Translation, Tafsir -
UPDATE qa_questions SET reference='القرآن الكريم — سورة النور: ٢٧ | الكلمات المفتاحية: آداب الاستئذان',
       source_url='https://quran.com/an-nur/27', verification_status='verified', updated_at=now()
 WHERE id='007ac535-dc64-4019-91c7-09e6e2699475' AND reference='القرآن الكريم | الكلمات المفتاحية: آداب الاستئذان';

-- 9) ما آداب الحديث والكلام مع الآخرين؟
--    الآية: سُورَةُ الإِسۡرَاءِ — الإسراء: ٥٣ (17:53) ✔ مطابقة نصًّا وموضعًا، مطابقة حرفيّة للرسم العثماني
--    الرابط المتحقَّق: Surah Al-Isra Ayah 53 - Read, Listen, Translation, Tafsir 
UPDATE qa_questions SET reference='القرآن الكريم — سورة الإسراء: ٥٣ | الكلمات المفتاحية: آداب الكلام',
       source_url='https://quran.com/al-isra/53', verification_status='verified', updated_at=now()
 WHERE id='301c9029-9cec-4d27-841b-b937ebd57cd3' AND reference='القرآن الكريم | الكلمات المفتاحية: آداب الكلام';

-- 10) ما آداب المجلس في الإسلام؟
--    الآية: سُورَةُ المُجَادلَةِ — المجادلة: ١١ (58:11) ✔ مطابقة نصًّا وموضعًا، بالرسم الإملائي
--    الرابط المتحقَّق: Surah Al-Mujadila Ayah 11 - Read, Listen, Translation, Taf
UPDATE qa_questions SET reference='القرآن الكريم — سورة المجادلة: ١١ | الكلمات المفتاحية: آداب المجلس',
       source_url='https://quran.com/al-mujadila/11', verification_status='verified', updated_at=now()
 WHERE id='e3d656c1-17f1-489f-add5-77f38c9ff0fe' AND reference='القرآن الكريم | الكلمات المفتاحية: آداب المجلس';

-- 11) ما آداب المناظرة والحوار في الدعوة إلى الله؟
--    الآية: سُورَةُ النَّحۡلِ — النحل: ١٢٥ (16:125) ✔ مطابقة نصًّا وموضعًا، بالرسم الإملائي
--    الرابط المتحقَّق: Surah An-Nahl Ayah 125 - Read, Listen, Translation, Tafsir
UPDATE qa_questions SET reference='القرآن الكريم — سورة النحل: ١٢٥ | الكلمات المفتاحية: آداب المناظرة',
       source_url='https://quran.com/an-nahl/125', verification_status='verified', updated_at=now()
 WHERE id='79c48660-4f2d-4285-ba2f-f4176aa9de7f' AND reference='القرآن الكريم | الكلمات المفتاحية: آداب المناظرة';

-- 12) ما أهمية الدعوة بالقدوة العملية لا القول فقط؟
--    الآية: سُورَةُ الأَحۡزَابِ — الأحزاب: ٢١ (33:21) ✔ مطابقة نصًّا وموضعًا، مطابقة حرفيّة للرسم العثماني
--    الرابط المتحقَّق: Surah Al-Ahzab Ayah 21 - Read, Listen, Translation, Tafsir
UPDATE qa_questions SET reference='القرآن الكريم — سورة الأحزاب: ٢١ | الكلمات المفتاحية: الدعوة بالقدوة',
       source_url='https://quran.com/al-ahzab/21', verification_status='verified', updated_at=now()
 WHERE id='3df78b42-0e50-40fc-83aa-1aef061b01a2' AND reference='القرآن الكريم | الكلمات المفتاحية: الدعوة بالقدوة';

-- 13) ما أهمية القدوة في التربية الإسلامية؟
--    الآية: سُورَةُ الأَحۡزَابِ — الأحزاب: ٢١ (33:21) ✔ مطابقة نصًّا وموضعًا، مطابقة حرفيّة للرسم العثماني
--    الرابط المتحقَّق: Surah Al-Ahzab Ayah 21 - Read, Listen, Translation, Tafsir
UPDATE qa_questions SET reference='القرآن الكريم — سورة الأحزاب: ٢١ | الكلمات المفتاحية: القدوة في التربية',
       source_url='https://quran.com/al-ahzab/21', verification_status='verified', updated_at=now()
 WHERE id='99d86623-cb12-471f-aca5-be11b4f2d190' AND reference='القرآن الكريم | الكلمات المفتاحية: القدوة في التربية';

-- 14) ما الفرق بين الحج والعمرة؟
--    الآية: سُورَةُ البَقَرَةِ — البقرة: ١٩٦ (2:196) ✔ مطابقة نصًّا وموضعًا، مطابقة حرفيّة للرسم العثماني
--    الرابط المتحقَّق: Surah Al-Baqarah Ayah 196 - Read, Listen, Translation, Taf
UPDATE qa_questions SET reference='القرآن الكريم — سورة البقرة: ١٩٦ | الكلمات المفتاحية: الحج والعمرة، الفرق بينهما',
       source_url='https://quran.com/al-baqarah/196', verification_status='verified', updated_at=now()
 WHERE id='c3aedc9c-2147-45d9-9e36-47879b79ced8' AND reference='القرآن الكريم | الكلمات المفتاحية: الحج والعمرة، الفرق بينهما';

-- 15) ما حقوق الوالدين على أبنائهما في الإسلام؟
--    الآية: سُورَةُ الإِسۡرَاءِ — الإسراء: ٢٣ (17:23) ✔ مطابقة نصًّا وموضعًا، بالرسم الإملائي
--    الرابط المتحقَّق: Surah Al-Isra Ayah 23 - Read, Listen, Translation, Tafsir 
UPDATE qa_questions SET reference='القرآن الكريم — سورة الإسراء: ٢٣ | الكلمات المفتاحية: بر الوالدين، الأسرة',
       source_url='https://quran.com/al-isra/23', verification_status='verified', updated_at=now()
 WHERE id='0ca433e8-e0ee-4218-96bd-b4485466f700' AND reference='القرآن الكريم | الكلمات المفتاحية: بر الوالدين، الأسرة';

-- 16) ما حكم التبرع بالدم في الإسلام؟
--    الآية: سُورَةُ المَائـِدَةِ — المائدة: ٣٢ (5:32) ✔ مطابقة نصًّا وموضعًا، مطابقة حرفيّة للرسم العثماني
--    الرابط المتحقَّق: Surah Al-Ma'idah Ayah 32 - Read, Listen, Translation,
UPDATE qa_questions SET reference='القرآن الكريم — سورة المائدة: ٣٢ | الكلمات المفتاحية: التبرع بالدم',
       source_url='https://quran.com/al-maidah/32', verification_status='verified', updated_at=now()
 WHERE id='572313c3-af15-4c2a-be71-65ee3d74784b' AND reference='القرآن الكريم | الكلمات المفتاحية: التبرع بالدم';

-- 17) ما حكم التحكيم في فض النزاعات بديلاً عن القضاء الرسمي؟
--    الآية: سُورَةُ النِّسَاءِ — النساء: ٣٥ (4:35) ✔ مطابقة نصًّا وموضعًا، مطابقة حرفيّة للرسم العثماني
--    الرابط المتحقَّق: Surah An-Nisa Ayah 35 - Read, Listen, Translation, Tafsir 
UPDATE qa_questions SET reference='القرآن الكريم — سورة النساء: ٣٥ | الكلمات المفتاحية: التحكيم',
       source_url='https://quran.com/an-nisa/35', verification_status='verified', updated_at=now()
 WHERE id='5085204a-5b6a-4fb1-95b2-14989782c770' AND reference='القرآن الكريم | الكلمات المفتاحية: التحكيم';

-- 18) ما حكم التدخين في الإسلام؟
--    الآية: سُورَةُ البَقَرَةِ — البقرة: ١٩٥ (2:195) ✔ مطابقة نصًّا وموضعًا، مطابقة حرفيّة للرسم العثماني
--    الرابط المتحقَّق: Surah Al-Baqarah Ayah 195 - Read, Listen, Translation, Taf
UPDATE qa_questions SET reference='القرآن الكريم — سورة البقرة: ١٩٥ | الكلمات المفتاحية: حكم التدخين',
       source_url='https://quran.com/al-baqarah/195', verification_status='verified', updated_at=now()
 WHERE id='474462cf-7f15-457f-a502-3cb25eac3cf9' AND reference='القرآن الكريم | الكلمات المفتاحية: حكم التدخين';

-- 19) ما حكم التيمم عند فقد الماء؟
--    الآية: سُورَةُ المَائـِدَةِ — المائدة: ٦ (5:6) ✔ مطابقة نصًّا وموضعًا، مطابقة حرفيّة للرسم العثماني
--    الرابط المتحقَّق: Surah Al-Ma'idah Ayah 6 - Read, Listen, Translation, 
UPDATE qa_questions SET reference='القرآن الكريم — سورة المائدة: ٦ | الكلمات المفتاحية: التيمم، فقد الماء',
       source_url='https://quran.com/al-maidah/6', verification_status='verified', updated_at=now()
 WHERE id='1c1afbac-47f5-400e-aafc-bda60b82af2e' AND reference='القرآن الكريم | الكلمات المفتاحية: التيمم، فقد الماء';

-- 20) ما حكم الغيبة والنميمة في الإسلام؟
--    الآية: سُورَةُ الحُجُرَاتِ — الحجرات: ١٢ (49:12) ✔ مطابقة نصًّا وموضعًا، مطابقة حرفيّة للرسم العثماني
--    الرابط المتحقَّق: Surah Al-Hujurat Ayah 12 - Read, Listen, Translation, Tafs
UPDATE qa_questions SET reference='القرآن الكريم — سورة الحجرات: ١٢ | الكلمات المفتاحية: تحريم الغيبة والنميمة',
       source_url='https://quran.com/al-hujurat/12', verification_status='verified', updated_at=now()
 WHERE id='e20f06af-85e2-47d7-ae20-35c939353588' AND reference='القرآن الكريم | الكلمات المفتاحية: تحريم الغيبة والنميمة';

-- 21) ما حكم القضاء بشهادة رجل واحد وامرأتين في المعاملات المالية؟
--    الآية: سُورَةُ البَقَرَةِ — البقرة: ٢٨٢ (2:282) ✔ مطابقة نصًّا وموضعًا، مطابقة حرفيّة للرسم العثماني
--    الرابط المتحقَّق: Surah Al-Baqarah Ayah 282 - Read, Listen, Translation, Taf
UPDATE qa_questions SET reference='القرآن الكريم — سورة البقرة: ٢٨٢ | الكلمات المفتاحية: شهادة المرأة في المعاملات',
       source_url='https://quran.com/al-baqarah/282', verification_status='verified', updated_at=now()
 WHERE id='f7e67693-9980-49b6-8674-ec32b7261c16' AND reference='القرآن الكريم | الكلمات المفتاحية: شهادة المرأة في المعاملات';

-- 22) ما حكم المهر في عقد الزواج؟
--    الآية: سُورَةُ النِّسَاءِ — النساء: ٤ (4:4) ✔ مطابقة نصًّا وموضعًا، بالرسم الإملائي
--    الرابط المتحقَّق: Surah An-Nisa Ayah 4 - Read, Listen, Translation, Tafsir -
UPDATE qa_questions SET reference='القرآن الكريم — سورة النساء: ٤ | الكلمات المفتاحية: المهر، حقوق الزوجة',
       source_url='https://quran.com/an-nisa/4', verification_status='verified', updated_at=now()
 WHERE id='9c75f044-3bb8-4efe-8aac-e770980d1110' AND reference='القرآن الكريم | الكلمات المفتاحية: المهر، حقوق الزوجة';

-- 23) ما حكم الوصية للأقارب غير الوارثين؟
--    الآية: سُورَةُ البَقَرَةِ — البقرة: ١٨٠ (2:180) ✔ مطابقة نصًّا وموضعًا، بالرسم الإملائي
--    الرابط المتحقَّق: Surah Al-Baqarah Ayah 180 - Read, Listen, Translation, Taf
UPDATE qa_questions SET reference='القرآن الكريم — سورة البقرة: ١٨٠ | الكلمات المفتاحية: الوصية للأقارب',
       source_url='https://quran.com/al-baqarah/180', verification_status='verified', updated_at=now()
 WHERE id='d4b34449-3e33-4460-949b-8a97d0e8f97e' AND reference='القرآن الكريم | الكلمات المفتاحية: الوصية للأقارب';

-- 24) ما حكم بر الوالدين غير المسلمين؟
--    الآية: سُورَةُ لُقۡمَانَ — لقمان: ١٥ (31:15) ✔ مطابقة نصًّا وموضعًا، بالرسم الإملائي
--    الرابط المتحقَّق: Surah Luqman Ayah 15 - Read, Listen, Translation, Tafsir -
UPDATE qa_questions SET reference='القرآن الكريم — سورة لقمان: ١٥ | الكلمات المفتاحية: بر الوالدين غير المسلمين',
       source_url='https://quran.com/luqman/15', verification_status='verified', updated_at=now()
 WHERE id='5e928686-cec8-42e4-94d3-cbb914007cc6' AND reference='القرآن الكريم | الكلمات المفتاحية: بر الوالدين غير المسلمين';

-- 25) ما حكم رضاعة الطفل من غير أمه (الرضاعة المحرِّمة)؟
--    الآية: سُورَةُ النِّسَاءِ — النساء: ٢٣ (4:23) ✔ مطابقة نصًّا وموضعًا، بالرسم الإملائي
--    الرابط المتحقَّق: Surah An-Nisa Ayah 23 - Read, Listen, Translation, Tafsir 
UPDATE qa_questions SET reference='القرآن الكريم — سورة النساء: ٢٣ | الكلمات المفتاحية: الرضاعة المحرِّمة',
       source_url='https://quran.com/an-nisa/23', verification_status='verified', updated_at=now()
 WHERE id='25cbf5d5-20eb-468d-8ad2-7d0b0eed6b86' AND reference='القرآن الكريم | الكلمات المفتاحية: الرضاعة المحرِّمة';

-- 26) ما حكم سوء الظن بالمسلمين؟
--    الآية: سُورَةُ الحُجُرَاتِ — الحجرات: ١٢ (49:12) ✔ مطابقة نصًّا وموضعًا، بالرسم الإملائي
--    الرابط المتحقَّق: Surah Al-Hujurat Ayah 12 - Read, Listen, Translation, Tafs
UPDATE qa_questions SET reference='القرآن الكريم — سورة الحجرات: ١٢ | الكلمات المفتاحية: تحريم سوء الظن',
       source_url='https://quran.com/al-hujurat/12', verification_status='verified', updated_at=now()
 WHERE id='d7a091b5-2924-4763-89ca-8631d36d0333' AND reference='القرآن الكريم | الكلمات المفتاحية: تحريم سوء الظن';

-- 27) ما حكم قصر الصلاة الرباعية في السفر؟
--    الآية: سُورَةُ النِّسَاءِ — النساء: ١٠١ (4:101) ✔ مطابقة نصًّا وموضعًا، بالرسم الإملائي
--    الرابط المتحقَّق: Surah An-Nisa Ayah 101 - Read, Listen, Translation, Tafsir
UPDATE qa_questions SET reference='القرآن الكريم — سورة النساء: ١٠١ | الكلمات المفتاحية: قصر الصلاة، صلاة المسافر',
       source_url='https://quran.com/an-nisa/101', verification_status='verified', updated_at=now()
 WHERE id='ee4aa6c8-07c8-4b87-a3d4-b2e528eb8f3e' AND reference='القرآن الكريم | الكلمات المفتاحية: قصر الصلاة، صلاة المسافر';

-- 28) ما حكم كتابة الدَّين وتوثيقه في المعاملات؟
--    الآية: سُورَةُ البَقَرَةِ — البقرة: ٢٨٢ (2:282) ✔ مطابقة نصًّا وموضعًا، بالرسم الإملائي
--    الرابط المتحقَّق: Surah Al-Baqarah Ayah 282 - Read, Listen, Translation, Taf
UPDATE qa_questions SET reference='القرآن الكريم — سورة البقرة: ٢٨٢ | الكلمات المفتاحية: كتابة الدَّين، آية المداينة',
       source_url='https://quran.com/al-baqarah/282', verification_status='verified', updated_at=now()
 WHERE id='b65b8037-9643-4f95-9a9f-dc2ab5f7540a' AND reference='القرآن الكريم | الكلمات المفتاحية: كتابة الدَّين، آية المداينة';

-- 29) ما حكم كتمان العلم الشرعي عمن يحتاجه؟
--    الآية: سُورَةُ البَقَرَةِ — البقرة: ١٥٩ (2:159) ✔ مطابقة نصًّا وموضعًا، بالرسم الإملائي، وفيها حذف موضَّح بـ«...» وهو حذف صحيح من وسط الآية
--    الرابط المتحقَّق: Surah Al-Baqarah Ayah 159 - Read, Listen, Translation, Taf
UPDATE qa_questions SET reference='القرآن الكريم — سورة البقرة: ١٥٩ | الكلمات المفتاحية: تحريم كتمان العلم',
       source_url='https://quran.com/al-baqarah/159', verification_status='verified', updated_at=now()
 WHERE id='84d4ad09-b05c-4f7f-a8cc-7dcbb7ce2e65' AND reference='القرآن الكريم | الكلمات المفتاحية: تحريم كتمان العلم';

-- 30) ما حكم من أُحصر (مُنع) عن إتمام الحج بعد الإحرام؟
--    الآية: سُورَةُ البَقَرَةِ — البقرة: ١٩٦ (2:196) ✔ مطابقة نصًّا وموضعًا، مطابقة حرفيّة للرسم العثماني
--    الرابط المتحقَّق: Surah Al-Baqarah Ayah 196 - Read, Listen, Translation, Taf
UPDATE qa_questions SET reference='القرآن الكريم — سورة البقرة: ١٩٦ | الكلمات المفتاحية: الإحصار في الحج',
       source_url='https://quran.com/al-baqarah/196', verification_status='verified', updated_at=now()
 WHERE id='449f1b53-6251-4668-8e7f-678f6e014e15' AND reference='القرآن الكريم | الكلمات المفتاحية: الإحصار في الحج';

-- تحقُّق ختامي: يجب أن يعود 30 صفًّا كلها verified وبروابط غير فارغة.
SELECT count(*) AS verified_rows FROM qa_questions
 WHERE verification_status='verified' AND source_url LIKE 'https://quran.com/%';

COMMIT;
