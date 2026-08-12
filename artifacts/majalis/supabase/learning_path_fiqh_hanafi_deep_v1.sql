-- ═══════════════════════════════════════════════════════════════════════════
-- learning_path_fiqh_hanafi_deep_v1.sql
--
-- سياق: Phase 3 — باب فقهي إضافي بنفس نمط "الغزوات الكبرى"/"تفسير سورة
-- يوسف" (تفصيل موضوع-فموضوع داخل مسار موجود فعلاً لكنه ضحل). مسار fiqh
-- هو آخر مسار من دفعة الاكتشاف الأصلية (hadith/fiqh/tafseer/seerah/
-- tawheed) لم يُعمَّق بعد — كل الأربعة الأخرى عُمِّقت في دفعات سابقة.
--
-- تحقّقتُ مباشرة: مرحلة "فقه مقارن وتخصصي" (sort_order=3) بها 3 مقررات
-- (fiqh-hanafi، fiqh-shafii، fiqh-women) كل واحد بعنصر تعليمي واحد عام
-- بلا أي course_books مربوط إطلاقاً — نفس نمط "عنصر عام واحد لكل مقرر"
-- المكتشَف سابقاً.
--
-- هذا الملف يضيف مرحلة رابعة جديدة "الفقه الحنفي بعمق" (بعد "فقه مقارن
-- وتخصصي") بمقرر مخصَّص لأبواب الفقه الحنفي الأساسية عبر "الهداية شرح
-- بداية المبتدي" للمرغيناني (موجود مسبقاً في المكتبة، وُصف في فهرسها
-- بأنه «ذروة الفقه الحنفي») — أول مقرر في هذا المسار يُربط فعلياً بكتاب
-- حقيقي عبر course_books. اختير الفقه الحنفي تحديداً (لا الشافعي أو
-- فقه المرأة) لأن الكتاب الأنسب له موجود مسبقاً بجودة عالية في الفهرس
-- (لا حاجة لإضافة كتاب جديد)، بخلاف "فقه المرأة" الذي لا كتاب مخصَّص له
-- في الفهرس بعد.
--
-- التحقق العلمي: تحقّقتُ عبر WebSearch أن كتاب "بداية المبتدي" (أصل
-- الهداية) يغطي الأبواب الفقهية القياسية (الطهارة والصلاة والزكاة
-- وغيرها) بترتيب كتب الفقه الحنفي المعتاد (جمع بين مختصر القدوري
-- والجامع الصغير للشيباني) — لا ادّعاء غير مؤكَّد ببناء تفصيلي دقيق
-- للأبواب الفرعية. كل الآيات مستخرَجة حرفياً من public/data/quran/
-- surah-*.json: المائدة:6 (الوضوء)، النساء:103 (مواقيت الصلاة)،
-- التوبة:103 (الزكاة)، البقرة:275 (حل البيع وحرمة الربا).
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_path_id    uuid;
  v_stage_id   uuid;
  v_course_id  uuid;
  v_unit_id    uuid;
  v_i1 uuid; v_i2 uuid; v_i3 uuid; v_i4 uuid;
BEGIN
  SELECT id INTO v_path_id FROM learning_paths WHERE slug = 'fiqh';
  IF v_path_id IS NULL THEN RAISE EXCEPTION 'مسار fiqh غير موجود'; END IF;

  IF EXISTS (SELECT 1 FROM courses WHERE slug = 'fiqh-hanafi-abwab') THEN
    RAISE NOTICE 'مُنجَز مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO path_stages (id, path_id, slug, title, description, sort_order, status)
  VALUES (gen_random_uuid(), v_path_id, 'hanafi-deep', 'الفقه الحنفي بعمق',
    'قراءة موجَّهة في أبواب الفقه الحنفي الأساسية عبر «الهداية شرح بداية المبتدي» للمرغيناني، ذروة كتب الفقه الحنفي.',
    4, 'published')
  RETURNING id INTO v_stage_id;

  INSERT INTO courses (id, stage_id, slug, title, description, learning_goal, level, sort_order, pass_percentage, outcomes, status)
  VALUES (gen_random_uuid(), v_stage_id, 'fiqh-hanafi-abwab', 'أبواب الفقه الحنفي الأساسية',
    'قراءة موجَّهة في أربعة أبواب أساسية من أبواب الفقه: الطهارة، والصلاة، والزكاة، والبيوع، كما فصَّلها المرغيناني في الهداية على المذهب الحنفي.',
    'معرفة الأحكام الأساسية لكل باب من الأبواب الأربعة على المذهب الحنفي، مع دليله القرآني.',
    'intermediate', 4, 70,
    '["معرفة أحكام الطهارة الأساسية ودليلها القرآني","معرفة أحكام الصلاة ومواقيتها","معرفة أحكام الزكاة ودليلها القرآني","معرفة أحكام البيوع الأساسية وحرمة الربا"]'::jsonb,
    'published')
  RETURNING id INTO v_course_id;

  INSERT INTO course_units (id, course_id, title, sort_order)
  VALUES (gen_random_uuid(), v_course_id, 'الدروس', 1) RETURNING id INTO v_unit_id;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'كتاب الطهارة',
    'أول أبواب الفقه المعتادة في كتب المذهب الحنفي: أحكام الوضوء وموجباته ونواقضه، والغسل من الجنابة، والتيمم عند فقد الماء أو المرض أو السفر. قال تعالى: ﴿يَٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓا۟ إِذَا قُمْتُمْ إِلَى ٱلصَّلَوٰةِ فَٱغْسِلُوا۟ وُجُوهَكُمْ وَأَيْدِيَكُمْ إِلَى ٱلْمَرَافِقِ وَٱمْسَحُوا۟ بِرُءُوسِكُمْ وَأَرْجُلَكُمْ إِلَى ٱلْكَعْبَيْنِ﴾ (سورة المائدة: 6).',
    1, 25, true, 'manual_confirm', 100, 1, 'published', true) RETURNING id INTO v_i1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'كتاب الصلاة',
    'شروط الصلاة وأركانها ومواقيتها الخمسة، وصفة أدائها، وأحكام صلاة الجماعة والجمعة على المذهب الحنفي. قال تعالى: ﴿فَإِذَا قَضَيْتُمُ ٱلصَّلَوٰةَ فَٱذْكُرُوا۟ ٱللَّهَ قِيَٰمًا وَقُعُودًا وَعَلَىٰ جُنُوبِكُمْ ۚ فَإِذَا ٱطْمَأْنَنتُمْ فَأَقِيمُوا۟ ٱلصَّلَوٰةَ ۚ إِنَّ ٱلصَّلَوٰةَ كَانَتْ عَلَى ٱلْمُؤْمِنِينَ كِتَٰبًا مَّوْقُوتًا﴾ (سورة النساء: 103).',
    1, 25, true, 'manual_confirm', 100, 2, 'published', true) RETURNING id INTO v_i2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'كتاب الزكاة',
    'أنصبة الزكاة ومقاديرها في الأموال المختلفة (النقدين، الأنعام، عروض التجارة، الزروع والثمار)، ومصارفها الثمانية، على المذهب الحنفي. قال تعالى: ﴿خُذْ مِنْ أَمْوَٰلِهِمْ صَدَقَةًۭ تُطَهِّرُهُمْ وَتُزَكِّيهِم بِهَا وَصَلِّ عَلَيْهِمْ إِنَّ صَلَوٰتَكَ سَكَنٌ لَّهُمْ﴾ (سورة التوبة: 103).',
    1, 25, true, 'manual_confirm', 100, 3, 'published', true) RETURNING id INTO v_i3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES (gen_random_uuid(), v_unit_id, 'book', 'كتاب البيوع',
    'أركان البيع وشروطه، والبيوع الفاسدة والباطلة، وحرمة الربا بأنواعه، على المذهب الحنفي. قال تعالى: ﴿ٱلَّذِينَ يَأْكُلُونَ ٱلرِّبَوٰا۟ لَا يَقُومُونَ إِلَّا كَمَا يَقُومُ ٱلَّذِى يَتَخَبَّطُهُ ٱلشَّيْطَٰنُ مِنَ ٱلْمَسِّ ۚ ذَٰلِكَ بِأَنَّهُمْ قَالُوٓا۟ إِنَّمَا ٱلْبَيْعُ مِثْلُ ٱلرِّبَوٰا۟ ۗ وَأَحَلَّ ٱللَّهُ ٱلْبَيْعَ وَحَرَّمَ ٱلرِّبَوٰا۟﴾ (سورة البقرة: 275).',
    1, 25, true, 'manual_confirm', 100, 4, 'published', true) RETURNING id INTO v_i4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_i1, 'الهداية شرح بداية المبتدي', 'برهان الدين المرغيناني', 'أساسية إلزامية', 'كتاب الطهارة', 'ذروة الفقه الحنفي والمرجع الأساسي في الدراسات اللاحقة لهذا المذهب. موجود في مكتبة المنصة (/library/book-hidayah-marghinani)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i2, 'الهداية شرح بداية المبتدي', 'برهان الدين المرغيناني', 'أساسية إلزامية', 'كتاب الصلاة', 'موجود في مكتبة المنصة (/library/book-hidayah-marghinani)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i3, 'الهداية شرح بداية المبتدي', 'برهان الدين المرغيناني', 'أساسية إلزامية', 'كتاب الزكاة', 'موجود في مكتبة المنصة (/library/book-hidayah-marghinani)', 'مكتبة المجلس العلمي'),
    (gen_random_uuid(), v_i4, 'الهداية شرح بداية المبتدي', 'برهان الدين المرغيناني', 'أساسية إلزامية', 'كتاب البيوع', 'موجود في مكتبة المنصة (/library/book-hidayah-marghinani)', 'مكتبة المجلس العلمي');

  UPDATE learning_paths SET total_sessions = total_sessions + 4, updated_at = now() WHERE id = v_path_id;

  RAISE NOTICE 'fiqh hanafi deep: stage_id=%, course_id=%', v_stage_id, v_course_id;
END $$;
