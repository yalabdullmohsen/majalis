-- إصلاح placeholder وإضافة "باب التواضع" لمقرر رياض الصالحين
-- (riyadh-saliheen، مسار hadith): العنصر الأول كان عنواناً عاماً مطابقاً
-- لعنوان الكورس بلا وصف (نفس نمط placeholder المكتشف سابقاً في
-- fiqh-women وaqeedah-wasitiyya، session_estimate=24 وهمي). استُبدل
-- ببابٍ جديد حقيقي من الكتاب. تحقُّق تكرار مسبق حاسم: كورس "akhlaq-sunnah"
-- يحوي بالفعل عنصرين موصوفين صراحةً بأنهما "الباب الأول من رياض
-- الصالحين" و"من أوائل أبواب رياض الصالحين" (الإخلاص والصدق) — فتجنَّبتُ
-- هذين البابين تحديداً رغم كونهما من رياض الصالحين، واخترتُ "باب
-- التواضع" (لم يُذكر إطلاقاً في أي كورس). الحديث تحقَّق عبر WebFetch من
-- ar.wikisource.org (صحيح مسلم، كتاب البر والصلة والآداب).
DO $$
DECLARE
  v_unit_id uuid := 'd700b47a-c79b-425a-9156-e8ee1f8e3a9d';
BEGIN
  UPDATE learning_items SET
    title = 'باب التواضع: ما تواضع أحد لله إلا رفعه الله',
    description = 'حديث أبي هريرة رضي الله عنه، قال رسول الله ﷺ: «ما نقصت صدقة من مال، وما زاد الله عبداً بعفو إلا عزاً، وما تواضع أحد لله إلا رفعه الله» — رواه مسلم، كتاب البر والصلة والآداب، باب استحباب العفو والتواضع (حديث 2588). يجمع الحديث ثلاث فوائد: أن الصدقة لا تُنقِص المال حقيقةً وإن نقصت صورةً، وأن العفو عن المسيء يزيد صاحبه عزاً لا ذلاً، وأن التواضع لله (لا للناس رياءً) سببٌ لرفعة صاحبه، خلافاً لمن ظن أن التواضع يُذهب القدر أو المكانة.',
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
