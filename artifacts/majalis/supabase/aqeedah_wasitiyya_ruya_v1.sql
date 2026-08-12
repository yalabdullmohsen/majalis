-- تعميق مقرر "العقيدة الواسطية" (aqeedah-wasitiyya، مسار aqeedah):
-- العنصر الأول كان عنواناً عاماً مطابقاً لعنوان الكورس بلا وصف (بلا
-- محتوى فعلي، session_estimate=10 وهمي). استُبدل بأول موضوع حقيقي من
-- متن الواسطية: رؤية المؤمنين لله تعالى يوم القيامة (ru'ya) — موضوع
-- محوري في المتن لم يكن مذكوراً. تحقُّق مسبق منع تكرار: عنصر آخر بعنوان
-- "القرآن كلام الله غير مخلوق" (الموضوع الرئيسي الآخر بالواسطية) موجود
-- بالفعل في aqeedah-tahawiyya باستشهاد من نص الطحاوية نفسها — لذا لم
-- يُضَف هنا لتفادي التكرار الموضوعي، واقتُصر على رؤية الله فقط (موضوع
-- منفصل كلياً لم يُغطَّ في أي كورس). الشاهد القرآني (القيامة: 22-23)
-- من ملفات public/data/quran المحلية حرفياً، وحديث جرير بن عبد الله
-- تحقَّق عبر WebFetch من ar.wikisource.org (صحيح البخاري).
DO $$
DECLARE
  v_unit_id uuid := '7527bfb6-dce0-4f3e-9bbb-53731cd002bd';
  v_item_id uuid;
BEGIN
  UPDATE learning_items SET
    title = 'رؤية الله تعالى في الآخرة',
    description = 'من عقيدة أهل السنة والجماعة الواردة في الواسطية: إثبات رؤية المؤمنين لربهم تبارك وتعالى يوم القيامة رؤية حقيقية بالأبصار، خلافاً لمن نفاها من المعتزلة وغيرهم. قال الله تعالى: ﴿وُجُوهٌ يَوْمَئِذٍ نَّاضِرَةٌ * إِلَىٰ رَبِّهَا نَاظِرَةٌ﴾ (القيامة: 22-23)، ومن السنة حديث جرير بن عبد الله رضي الله عنه، قال النبي ﷺ: «إنكم سترون ربكم كما ترون هذا القمر لا تُضامون في رؤيته، فإن استطعتم أن لا تُغلَبوا على صلاة قبل طلوع الشمس وقبل غروبها فافعلوا» — رواه البخاري (حديث 529)، وفيه تشبيه الرؤية بوضوحها وعدم التزاحم فيها برؤية القمر ليلة اكتماله، لا تشبيه لذات الله بالقمر. تكون هذه الرؤية في عرصات القيامة ثم تُستكمَل نعيماً لأهل الجنة بعد دخولها.',
    session_estimate = 1.0,
    weight = 20.00,
    sort_order = 1,
    status = 'published',
    is_approved = true,
    updated_at = now()
  WHERE unit_id = v_unit_id AND sort_order = 1
  RETURNING id INTO v_item_id;

  UPDATE learning_paths lp SET total_sessions = (
    SELECT sum(li.session_estimate)::int
    FROM path_stages ps JOIN courses c ON c.stage_id = ps.id
    JOIN course_units cu ON cu.course_id = c.id
    JOIN learning_items li ON li.unit_id = cu.id
    WHERE ps.path_id = lp.id
  ), updated_at = now() WHERE lp.slug = 'aqeedah';
END $$;
