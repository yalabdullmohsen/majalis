-- ═══════════════════════════════════════════════════════════════════════════
-- arbaeen_nawawiyya_deep_v1.sql
--
-- تعميق مقرر "الأربعون النووية" (hadith path) من عنصر واحد عام إلى 5
-- عناصر — نفس نمط "أركان الإيمان الستة" و"قصص سورة الكهف" الناجح: 4
-- عناصر جديدة لأربعة أحاديث محورية من المجموعة (متباعدة عمداً لتغطية
-- موضوعات مختلفة تماماً، ولا تتكرر مع حديث جبريل المُستخدَم فعلاً في
-- مقرر "أركان الإيمان الستة" بمسار aqeedah).
--
-- سلامة الاستشهاد: النصوص مأخوذة حرفياً من src/lib/arbaeen-nawawi-seed.ts
-- (بيانات محلية مُثرَاة ومُستخدَمة فعلياً في صفحة /arbaeen-nawawi الحية،
-- لا استشهاد جديد يحتاج تحققاً خارجياً — نفس النص المعروض للزوار).
--
-- الأحاديث المختارة (id في arbaeen-nawawi-seed.ts):
--   1  الأعمال بالنيات — متفق عليه (الحديث الافتتاحي، أشهر حديث في الإسلام)
--   6  الحلال بيّن والحرام بيّن — رواه مسلم (قاعدة الورع)
--   34 تغيير المنكر بالثلاث مراتب — رواه مسلم (الأمر بالمعروف والنهي عن المنكر)
--   42 من عادى لي ولياً — رواه البخاري (حديث قدسي، محبة الله وولايته، خاتمة المجموعة)
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_unit_id uuid := '61a8e0c3-b0aa-48eb-abd2-df18b35329e1';
  v_item1 uuid;
  v_item2 uuid;
  v_item3 uuid;
  v_item4 uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM learning_items WHERE unit_id = v_unit_id AND title = 'الحديث الأول: الأعمال بالنيات'
  ) THEN
    RAISE NOTICE 'عناصر الأربعون النووية موجودة مسبقاً — تخطّي';
    RETURN;
  END IF;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'الحديث الأول: الأعمال بالنيات', '«إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى» — متفق عليه. الحديث الافتتاحي لمجموع النووي، أساس تصحيح النية في كل عمل ديني ودنيوي.', 1, 15, 20, true, 'manual_confirm', null, 2, 'published', true)
  RETURNING id INTO v_item1;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'الحديث السادس: الحلال بيّن والحرام بيّن', '«إن الحلال بيّن وإن الحرام بيّن، وبينهما أمور مشتبهات» — رواه مسلم. قاعدة اتقاء الشبهات، شُبِّه فيه القلب بالراعي حول الحمى.', 1, 15, 20, true, 'manual_confirm', null, 3, 'published', true)
  RETURNING id INTO v_item2;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'الحديث الرابع والثلاثون: تغيير المنكر', '«من رأى منكم منكراً فليغيّره بيده، فإن لم يستطع فبلسانه، فإن لم يستطع فبقلبه» — رواه مسلم. مراتب الأمر بالمعروف والنهي عن المنكر الثلاث.', 1, 15, 20, true, 'manual_confirm', null, 4, 'published', true)
  RETURNING id INTO v_item3;

  INSERT INTO learning_items (id, unit_id, item_type, title, description, session_estimate, minutes_estimate, weight, is_required, completion_method, completion_threshold, sort_order, status, is_approved)
  VALUES
    (gen_random_uuid(), v_unit_id, 'book', 'الحديث الثاني والأربعون: من عادى لي ولياً', 'حديث قدسي — «من عادى لي ولياً فقد آذنته بالحرب...» رواه البخاري. خاتمة الأربعين النووية، في محبة الله لعبده المتقرب بالفرائض والنوافل.', 1, 15, 20, true, 'manual_confirm', null, 5, 'published', true)
  RETURNING id INTO v_item4;

  INSERT INTO course_books (id, learning_item_id, book_title, book_author, material_role, scope_description, inclusion_reason, source_name)
  VALUES
    (gen_random_uuid(), v_item1, 'الأربعون النووية', 'الإمام يحيى بن شرف النووي', 'أساسية إلزامية', 'الحديث الأول', 'الحديث الافتتاحي للمجموعة، أشهر حديث في الإسلام وأساس تصحيح النية', 'library-catalog.ts'),
    (gen_random_uuid(), v_item2, 'الأربعون النووية', 'الإمام يحيى بن شرف النووي', 'أساسية إلزامية', 'الحديث السادس', 'قاعدة اتقاء الشبهات', 'library-catalog.ts'),
    (gen_random_uuid(), v_item3, 'الأربعون النووية', 'الإمام يحيى بن شرف النووي', 'أساسية إلزامية', 'الحديث الرابع والثلاثون', 'قاعدة الأمر بالمعروف والنهي عن المنكر', 'library-catalog.ts'),
    (gen_random_uuid(), v_item4, 'الأربعون النووية', 'الإمام يحيى بن شرف النووي', 'أساسية إلزامية', 'الحديث الثاني والأربعون', 'خاتمة المجموعة، حديث قدسي في محبة الله ووَلايته', 'library-catalog.ts');

  UPDATE learning_items SET weight = 20 WHERE unit_id = v_unit_id AND title = 'الأربعون النووية';

  UPDATE learning_paths SET total_sessions = total_sessions + 4 WHERE slug = 'hadith';

  RAISE NOTICE 'أُدخلت 4 عناصر جديدة لمقرر الأربعون النووية + 4 صفوف course_books';
END $$;
