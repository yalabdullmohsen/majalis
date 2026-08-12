-- إصلاح placeholder في arbaeen-nawawiyya (مسار hadith): العنصر الأول
-- عنوان عام مطابق للكورس بلا وصف (session_estimate=10 وهمي). فحص
-- تكرار مسبق حاسم: تجنَّبتُ حديث "لا يؤمن أحدكم حتى يحب لأخيه ما يحب
-- لنفسه" (الحديث 13 من الأربعين، وهو نفسه المُستخدَم بالفعل لإصلاح
-- placeholder صحيح البخاري في دفعة سابقة هذه الجلسة). اخترتُ بدلاً منه
-- الحديث الخامس عشر من الأربعين النووية (حديث الإيمان وحسن الجوار
-- والضيافة والقول)، مُتحقَّقاً عبر WebFetch من ar.wikisource.org (بخاري،
-- كتاب الأدب، حديث 5672).
DO $$
BEGIN
  UPDATE learning_items SET
    title = 'الحديث الخامس عشر: من كان يؤمن بالله واليوم الآخر',
    description = 'حديث أبي هريرة رضي الله عنه، قال رسول الله ﷺ: «من كان يؤمن بالله واليوم الآخر فلا يؤذِ جاره، ومن كان يؤمن بالله واليوم الآخر فليكرم ضيفه، ومن كان يؤمن بالله واليوم الآخر فليقل خيراً أو ليصمت» — متفق عليه (رواه البخاري، كتاب الأدب، حديث 5672، ومسلم). يربط هذا الحديث الجامع بين كمال الإيمان وثلاثة أخلاق عملية: عدم إيذاء الجار (سلبي: كفّ الأذى)، وإكرام الضيف (إيجابي: بذل المعروف)، وضبط اللسان بالقول الخير أو الصمت — فجعل النبي ﷺ هذه الأخلاق الثلاثة من علامات صدق الإيمان لا من كمالياته المستحبة فحسب.',
    session_estimate = 1.0,
    weight = 20.00,
    updated_at = now()
  WHERE id = 'fa4bb875-24ce-4d00-96e5-c780b5c489b6';

  UPDATE learning_paths lp SET total_sessions = (
    SELECT sum(li.session_estimate)::int
    FROM path_stages ps JOIN courses c ON c.stage_id = ps.id
    JOIN course_units cu ON cu.course_id = c.id
    JOIN learning_items li ON li.unit_id = cu.id
    WHERE ps.path_id = lp.id
  ), updated_at = now() WHERE lp.slug = 'hadith';
END $$;
