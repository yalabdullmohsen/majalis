-- تكملة توسعة منهج «تعلّم» — الفجوات المتبقية من الفهرس العلمي المعتمد
-- بعد supabase/learn_library_v2_requested_taxonomy.sql (الجناية على النفس،
-- الحدود والتعازير، القواعد الفقهية، المقاصد، الفرق والملل).
-- بنية موضوعات فقط بحالة draft؛ لا محتوى، لا نص شرعي. Idempotent ولا يعدّل
-- أي محتوى قائم.

CREATE OR REPLACE FUNCTION _seed_requested_topic_2(
  p_parent_slug TEXT, p_slug TEXT, p_name TEXT, p_sort INT
) RETURNS VOID AS $$
DECLARE v_parent UUID;
BEGIN
  SELECT id INTO v_parent FROM categories WHERE slug = p_parent_slug;
  IF v_parent IS NULL THEN
    RAISE NOTICE 'Skipped %, parent % is missing', p_slug, p_parent_slug;
    RETURN;
  END IF;
  INSERT INTO categories (parent_id, slug, name, sort_order, status)
  VALUES (v_parent, p_slug, p_name, p_sort, 'draft')
  ON CONFLICT (slug) DO NOTHING;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- الجناية على النفس وما دونها + الحدود والتعازير — تحت jinayat-qada
-- القائم بالفعل (يحمل حاليًا فقط فروع الدعوى/الإثبات/الإقرار/الشهادات).
SELECT _seed_requested_topic_2('jinayat-qada','jinayat-nafs','الجناية على النفس وما دونها',11);
SELECT _seed_requested_topic_2('jinayat-qada','hudud-taazir','جرائم الحدود والتعازير',12);
SELECT _seed_requested_topic_2('jinayat-qada','diyat','الديات',13);

-- القواعد الفقهية والمقاصد — تحت usul-fiqh القائم (منهجية استنباط الأحكام).
SELECT _seed_requested_topic_2('usul-fiqh','qawaid-fiqhiyya','القواعد الفقهية',23);
SELECT _seed_requested_topic_2('usul-fiqh','maqasid-shariah','مقاصد الشريعة',24);

-- الفرق والملل — موضوع مستقل (فرق إسلامية تاريخية وأديان مقارَنة)، لا يندرج
-- تحت afkar-muasira (أفكار معاصرة تحديدًا: شيوعية/علمانية/إلحاد...).
INSERT INTO categories (slug,name,sort_order,status) VALUES
('firaq-milal','الفرق والملل',33,'draft')
ON CONFLICT (slug) DO NOTHING;
SELECT _seed_requested_topic_2('firaq-milal','firaq-islamiyya-tarikhiyya','الفرق الإسلامية التاريخية',1);
SELECT _seed_requested_topic_2('firaq-milal','adyan-muqarana','الأديان المقارنة',2);

DROP FUNCTION _seed_requested_topic_2(TEXT,TEXT,TEXT,INT);
