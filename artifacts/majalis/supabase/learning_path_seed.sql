-- ═══════════════════════════════════════════════════════════════════════════
-- بيانات تجريبية لخارطة طالب العلم
-- تحذير: هذه بيانات Placeholder للتحقق من عمل الواجهة فقط.
-- يجب استبدالها بمحتوى معتمد من مصادر موثوقة قبل النشر الفعلي.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── المستويات الستة ───────────────────────────────────────────────────────
INSERT INTO lp_levels (name, slug, sort_order, description, color) VALUES
  ('تمهيدي',   'tamhidi',   0, 'للمبتدئين الجدد في طلب العلم',               '#22c55e'),
  ('الأول',    'awwal',     1, 'المرحلة الأولى في بناء الأساس العلمي',        '#84cc16'),
  ('الثاني',   'thani',     2, 'تعمق في المفاهيم الأساسية',                   '#eab308'),
  ('الثالث',   'thalith',   3, 'بناء ملكة الفهم والاستدلال',                  '#f97316'),
  ('الرابع',   'rabi',      4, 'التخصص والتعمق في المسائل الدقيقة',           '#ef4444'),
  ('متقدم',    'mutaqaddim',5, 'مستوى الاجتهاد والبحث العلمي المعمق',         '#8b5cf6')
ON CONFLICT (slug) DO NOTHING;

-- ── العلوم الشرعية العشرة ─────────────────────────────────────────────────
INSERT INTO lp_sciences (name, slug, description, why_study, icon, color, sort_order) VALUES
  ('العقيدة',         'aqeeda',         'أصول الإيمان وما يجب اعتقاده',                'العقيدة أساس الدين وعليها تبنى الأعمال',             '🌟', '#6366f1', 0),
  ('الحديث',          'hadith',          'سنة النبي ﷺ وعلم مصطلح الحديث',              'الحديث المصدر الثاني للتشريع بعد القرآن',            '📖', '#059669', 1),
  ('الفقه',           'fiqh',            'الأحكام الشرعية العملية في العبادات والمعاملات','الفقه ضرورة لكل مسلم لمعرفة حدود الله',             '⚖️', '#0891b2', 2),
  ('التفسير',         'tafsir',          'علم تفسير آيات القرآن الكريم',                'التفسير يفتح بصيرتك لمعاني كلام الله',              '📜', '#7c3aed', 3),
  ('تلاوة القرآن',   'quran-recitation','أحكام التلاوة والضبط',                         'التلاوة الصحيحة فريضة على كل مسلم',                '🌙', '#0284c7', 4),
  ('التجويد',         'tajweed',         'أحكام تجويد القرآن الكريم',                   'التجويد يحول التلاوة من صواب إلى إتقان',             '🎵', '#d97706', 5),
  ('السيرة النبوية',  'seerah',          'سيرة النبي ﷺ وحياته وغزواته',               'السيرة مدرسة الحياة لكل مسلم',                      '🕌', '#b45309', 6),
  ('الآداب الشرعية', 'adab',            'آداب الإسلام في الحياة اليومية',              'الآداب تُجمّل العبادة وتُحسّن التعامل',             '✨', '#0f766e', 7),
  ('أصول الفقه',     'usul-fiqh',       'القواعد التي يُستنبط منها الفقه',             'أصول الفقه آلة الاجتهاد والاستنباط',                '🔬', '#be185d', 8),
  ('مصطلح الحديث',   'mustalah',        'علم الجرح والتعديل وتصنيف الأحاديث',          'مصطلح الحديث يُميّز الصحيح من الضعيف',             '🔍', '#15803d', 9)
ON CONFLICT (slug) DO NOTHING;

-- ── بعض كتب تجريبية (Placeholder) للتحقق من الواجهة ─────────────────────
-- تحذير: هذه بيانات وهمية للاختبار فقط
DO $$
DECLARE
  v_aqeeda_id uuid;
  v_hadith_id  uuid;
  v_fiqh_id    uuid;
  v_tamhidi_id uuid;
  v_awwal_id   uuid;
  v_thani_id   uuid;
BEGIN
  SELECT id INTO v_aqeeda_id FROM lp_sciences WHERE slug = 'aqeeda';
  SELECT id INTO v_hadith_id  FROM lp_sciences WHERE slug = 'hadith';
  SELECT id INTO v_fiqh_id    FROM lp_sciences WHERE slug = 'fiqh';
  SELECT id INTO v_tamhidi_id FROM lp_levels WHERE slug = 'tamhidi';
  SELECT id INTO v_awwal_id   FROM lp_levels WHERE slug = 'awwal';
  SELECT id INTO v_thani_id   FROM lp_levels WHERE slug = 'thani';

  -- كتب العقيدة المستوى التمهيدي
  INSERT INTO lp_books (title, author, science_id, level_id, summary, difficulty, estimated_hours, order_in_level)
  VALUES
    ('[Placeholder] الأصول الثلاثة', '[Placeholder] الشيخ محمد بن عبد الوهاب', v_aqeeda_id, v_tamhidi_id,
     'بيانات تجريبية — يجب استبدالها بمحتوى معتمد', 'easy', 5, 0),
    ('[Placeholder] القواعد الأربع', '[Placeholder] الشيخ محمد بن عبد الوهاب', v_aqeeda_id, v_tamhidi_id,
     'بيانات تجريبية — يجب استبدالها بمحتوى معتمد', 'easy', 3, 1),
    ('[Placeholder] كشف الشبهات',   '[Placeholder] الشيخ محمد بن عبد الوهاب', v_aqeeda_id, v_awwal_id,
     'بيانات تجريبية — يجب استبدالها بمحتوى معتمد', 'medium', 8, 0),
    ('[Placeholder] كتاب التوحيد',  '[Placeholder] الشيخ محمد بن عبد الوهاب', v_aqeeda_id, v_thani_id,
     'بيانات تجريبية — يجب استبدالها بمحتوى معتمد', 'medium', 12, 0)
  ON CONFLICT DO NOTHING;

  -- كتب الحديث المستوى التمهيدي
  INSERT INTO lp_books (title, author, science_id, level_id, summary, difficulty, estimated_hours, order_in_level)
  VALUES
    ('[Placeholder] الأربعون النووية', '[Placeholder] الإمام النووي', v_hadith_id, v_tamhidi_id,
     'بيانات تجريبية — يجب استبدالها بمحتوى معتمد', 'easy', 6, 0),
    ('[Placeholder] عمدة الأحكام',     '[Placeholder] الإمام المقدسي',  v_hadith_id, v_awwal_id,
     'بيانات تجريبية — يجب استبدالها بمحتوى معتمد', 'medium', 15, 0)
  ON CONFLICT DO NOTHING;

  -- كتب الفقه المستوى التمهيدي
  INSERT INTO lp_books (title, author, science_id, level_id, summary, difficulty, estimated_hours, order_in_level)
  VALUES
    ('[Placeholder] مسائل الصلاة',    '[Placeholder] Placeholder', v_fiqh_id, v_tamhidi_id,
     'بيانات تجريبية — يجب استبدالها بمحتوى معتمد', 'easy', 4, 0)
  ON CONFLICT DO NOTHING;
END $$;
