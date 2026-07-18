-- إصلاح placeholder وإضافة حديث "لا يؤمن أحدكم حتى يحب لأخيه ما يحب
-- لنفسه" لمقرر صحيح البخاري (sahih-bukhari، مسار hadith): العنصر الأول
-- كان عنواناً عاماً مطابقاً لعنوان الكورس بلا وصف (نفس نمط placeholder
-- المكتشف سابقاً هذه الجلسة). فحص تكرار مسبق (نصيحة/يحب لأخيه/لا
-- يعنيه/بني الإسلام): صفر تكرار. الحديث تحقَّق عبر WebFetch من
-- ar.wikisource.org (صحيح البخاري، كتاب الإيمان، حديث 13).
DO $$
DECLARE
  v_unit_id uuid := 'c6a272b8-5e6b-46e2-a4d5-6b6dabef72dc';
BEGIN
  UPDATE learning_items SET
    title = 'لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه',
    description = 'حديث أنس بن مالك رضي الله عنه، عن النبي ﷺ: «لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه» — رواه البخاري، كتاب الإيمان، باب: من الإيمان أن يحب لأخيه ما يحب لنفسه (حديث 13). يقرِّر هذا الحديث الجامع أن كمال الإيمان لا يتم إلا بتحقيق هذا الخُلُق العظيم: أن يتمنى المسلم لإخوانه المسلمين من الخير ما يتمناه لنفسه، ويكره لهم من الشر ما يكرهه لنفسه — وهو أصل عظيم في بناء الأخوة الإسلامية ونبذ الحسد والأثرة. أدرجه الإمام البخاري في أوائل كتاب الإيمان من صحيحه لبيان أن هذا الخُلُق من صميم الإيمان لا من كماليات الأخلاق المستحبة فحسب.',
    session_estimate = 1.0,
    weight = 20.00,
    sort_order = 1,
    status = 'published',
    is_approved = true,
    updated_at = now()
  WHERE unit_id = v_unit_id AND sort_order = 1;

  UPDATE learning_paths lp SET total_sessions = (
    SELECT sum(li.session_estimate)::int
    FROM path_stages ps JOIN courses c ON c.stage_id = ps.id
    JOIN course_units cu ON cu.course_id = c.id
    JOIN learning_items li ON li.unit_id = cu.id
    WHERE ps.path_id = lp.id
  ), updated_at = now() WHERE lp.slug = 'hadith';
END $$;
