-- توسعة منهج «تعلّم» وفق الفهرس العلمي المعتمد للإطلاق.
-- هذا الملف يضيف بنية موضوعات فقط بحالة draft؛ لا ينشر درسًا بلا متن موثق
-- ومراجع ومراجعة بشرية. Idempotent ولا يعدّل أي محتوى قائم.

CREATE OR REPLACE FUNCTION _seed_requested_topic(
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

-- العقيدة
SELECT _seed_requested_topic('aqeedah-tawheed','aqeedah-wasitiyya','العقيدة الواسطية',23);
SELECT _seed_requested_topic('aqeedah-tawheed','asma-wa-sifat','الأسماء والصفات',24);
SELECT _seed_requested_topic('aqeedah-tawheed','nubuwat','النبوات',25);

-- استكمال أبواب الفقه
SELECT _seed_requested_topic('ibadat','atima-ashriba','الأطعمة والأشربة',10);
SELECT _seed_requested_topic('ibadat','libas-zina','اللباس والزينة',11);
SELECT _seed_requested_topic('fiqh-usrah','zihar-lian','الظهار واللعان',7);
SELECT _seed_requested_topic('fiqh-usrah','idad','العدد',8);
SELECT _seed_requested_topic('fiqh-usrah','nafaqat','النفقات',9);
SELECT _seed_requested_topic('jinayat-qada','dawa','الدعوى',7);
SELECT _seed_requested_topic('jinayat-qada','ithbat','البينات والإثبات',8);
SELECT _seed_requested_topic('jinayat-qada','iqrar','الإقرار',9);
SELECT _seed_requested_topic('jinayat-qada','shahadat','الشهادات',10);
SELECT _seed_requested_topic('muamalat','wikala','الوكالة',11);
SELECT _seed_requested_topic('muamalat','hajr','الحجر',12);
SELECT _seed_requested_topic('muamalat','daman-kafala-hawala','الضمان والكفالة والحوالة',13);
SELECT _seed_requested_topic('muamalat','sulh-shufaa','الصلح والشفعة',14);
SELECT _seed_requested_topic('muamalat','ghasb-luqata','الغصب واللقطة',15);
SELECT _seed_requested_topic('muamalat','wadia-ariya','الوديعة والعارية',16);
SELECT _seed_requested_topic('muamalat','sharika-mudaraba','الشركة والمضاربة',17);
SELECT _seed_requested_topic('muamalat','musaqat-muzaraa','المساقاة والمزارعة',18);
SELECT _seed_requested_topic('muamalat','ijara-juala','الإجارة والجعالة',19);
SELECT _seed_requested_topic('muamalat','salam-rahn-qard','السلم والرهن والقرض',20);
SELECT _seed_requested_topic('muamalat','uqud-haditha','العقود الحديثة',21);

-- الاقتصاد الإسلامي والمعاملات المالية
SELECT _seed_requested_topic('iqtisad-maliyya-islamiyya','nuqud','المال والنقود',8);
SELECT _seed_requested_topic('iqtisad-maliyya-islamiyya','bunuk-muqarana','البنوك التقليدية والإسلامية',9);
SELECT _seed_requested_topic('iqtisad-maliyya-islamiyya','sukuk-ashum','الصكوك والأسهم',10);
SELECT _seed_requested_topic('iqtisad-maliyya-islamiyya','tamin-takaful','التأمين والتكافل',11);
SELECT _seed_requested_topic('iqtisad-maliyya-islamiyya','murabaha','المرابحة',12);
SELECT _seed_requested_topic('iqtisad-maliyya-islamiyya','musharaka-mudaraba','المشاركة والمضاربة',13);
SELECT _seed_requested_topic('iqtisad-maliyya-islamiyya','ijara-tamlik','الإجارة المنتهية بالتمليك',14);
SELECT _seed_requested_topic('iqtisad-maliyya-islamiyya','aswaq-maliya','الأسواق المالية',15);
SELECT _seed_requested_topic('iqtisad-maliyya-islamiyya','hawkamah-maayir','الحوكمة والمعايير الشرعية',16);
SELECT _seed_requested_topic('iqtisad-maliyya-islamiyya','nawazil-masrifiyya','النوازل المصرفية',17);

-- تفصيل أصول الفقه
SELECT _seed_requested_topic('usul-fiqh','quran-dalil','القرآن دليلًا',10);
SELECT _seed_requested_topic('usul-fiqh','sunnah-dalil','السنة دليلًا',11);
SELECT _seed_requested_topic('usul-fiqh','ijma','الإجماع',12);
SELECT _seed_requested_topic('usul-fiqh','qiyas','القياس',13);
SELECT _seed_requested_topic('usul-fiqh','istishab','الاستصحاب',14);
SELECT _seed_requested_topic('usul-fiqh','masalih-mursala','المصالح المرسلة',15);
SELECT _seed_requested_topic('usul-fiqh','sadd-dharai','سد الذرائع',16);
SELECT _seed_requested_topic('usul-fiqh','urf','العرف',17);
SELECT _seed_requested_topic('usul-fiqh','aam-khas','العام والخاص',18);
SELECT _seed_requested_topic('usul-fiqh','mutlaq-muqayyad','المطلق والمقيد',19);
SELECT _seed_requested_topic('usul-fiqh','amr-nahy','الأمر والنهي',20);
SELECT _seed_requested_topic('usul-fiqh','mujmal-mubayyan','المجمل والمبين',21);
SELECT _seed_requested_topic('usul-fiqh','takhrij-tanqih-manat','تخريج المناط وتنقيحه',22);

-- علوم الحديث
SELECT _seed_requested_topic('mustalah-hadith','sahih-hasan-daif','الصحيح والحسن والضعيف',10);
SELECT _seed_requested_topic('mustalah-hadith','shuruh-hadith','شروح الحديث',11);

-- تفسير آيات الأحكام
SELECT _seed_requested_topic('ahkam-quran','ayat-ahkam-ibadat','آيات أحكام الطهارة والصلاة والصيام والحج',1);
SELECT _seed_requested_topic('ahkam-quran','ayat-ahkam-usrah','آيات أحكام الأسرة والمواريث',2);
SELECT _seed_requested_topic('ahkam-quran','ayat-ahkam-muamalat','آيات أحكام المعاملات',3);
SELECT _seed_requested_topic('ahkam-quran','ayat-ahkam-qada-jinayat','آيات أحكام القضاء والجنايات والحدود',4);
SELECT _seed_requested_topic('ahkam-quran','ayat-ahkam-huquq','آيات الأخلاق والحقوق والعلاقات',5);

-- نوازل معاصرة
INSERT INTO categories (slug,name,sort_order,status) VALUES
('nawazil-muasira','النوازل المعاصرة',26,'draft') ON CONFLICT (slug) DO NOTHING;
SELECT _seed_requested_topic('nawazil-muasira','nawazil-maliya','النوازل المالية',1);
SELECT _seed_requested_topic('nawazil-muasira','nawazil-tiqniyya','النوازل التقنية والذكاء الاصطناعي والخصوصية',2);
SELECT _seed_requested_topic('nawazil-muasira','nawazil-usariyya','النوازل الأسرية',3);
SELECT _seed_requested_topic('nawazil-muasira','nawazil-biiya','النوازل البيئية',4);
SELECT _seed_requested_topic('nawazil-muasira','uqud-electronic','العقود الإلكترونية والعمل عن بعد',5);
SELECT _seed_requested_topic('nawazil-muasira','fada-ibadat','الفضاء والعبادات',6);

-- فقه الأقليات
INSERT INTO categories (slug,name,sort_order,status) VALUES
('fiqh-aqalliyat','فقه الأقليات',27,'draft') ON CONFLICT (slug) DO NOTHING;
SELECT _seed_requested_topic('fiqh-aqalliyat','aqalliyat-ibadat','العبادات والطعام',1);
SELECT _seed_requested_topic('fiqh-aqalliyat','aqalliyat-amal-muamalat','العمل والمعاملات',2);
SELECT _seed_requested_topic('fiqh-aqalliyat','aqalliyat-usrah-abna','الأسرة وتعليم الأبناء',3);
SELECT _seed_requested_topic('fiqh-aqalliyat','aqalliyat-muwatana','المواطنة والاندماج والعلاقات المجتمعية',4);
SELECT _seed_requested_topic('fiqh-aqalliyat','aqalliyat-darura','الضرورة والحاجة واختلاف البلاد',5);

-- التاريخ، القضاء، الولاية والعلاقات الدولية
INSERT INTO categories (slug,name,sort_order,status) VALUES
('tarikh-tashri','تاريخ التشريع الإسلامي',28,'draft'),
('qada-dawa-ithbat','القضاء والدعوى والإثبات',29,'draft'),
('wilaya-islamiyya','الولاية في الإسلام',30,'draft'),
('alaqat-dawliyya','العلاقات الدولية في الإسلام',31,'draft'),
('afkar-muasira','المذاهب والأفكار المعاصرة',32,'draft')
ON CONFLICT (slug) DO NOTHING;
SELECT _seed_requested_topic('tarikh-tashri','tashri-nubuwwa-sahaba','التشريع في عصر النبوة والصحابة والتابعين',1);
SELECT _seed_requested_topic('tarikh-tashri','madaris-tadwin','المدارس الفقهية وتدوين الفقه',2);
SELECT _seed_requested_topic('tarikh-tashri','madhahib-arbaa-tarikh','تاريخ المذاهب الأربعة والاجتهاد والقضاء',3);
SELECT _seed_requested_topic('tarikh-tashri','tashri-muasir','المجامع الفقهية والتقنين المعاصر',4);
SELECT _seed_requested_topic('qada-dawa-ithbat','shurut-qadi','شروط القاضي وأطراف الدعوى',1);
SELECT _seed_requested_topic('qada-dawa-ithbat','wasail-ithbat','البينة والشهادة والقرائن والإقرار واليمين',2);
SELECT _seed_requested_topic('qada-dawa-ithbat','ithbat-electronic','الكتابة والإثبات الإلكتروني',3);
SELECT _seed_requested_topic('qada-dawa-ithbat','tahkim-tanfidh','التحكيم والصلح وتنفيذ الأحكام',4);
SELECT _seed_requested_topic('wilaya-islamiyya','wilaya-khassa','الولاية الخاصة وولاية الأب والمال والوصاية',1);
SELECT _seed_requested_topic('wilaya-islamiyya','wilaya-amma','الولاية العامة والإمامة والقضاء والحسبة',2);
SELECT _seed_requested_topic('alaqat-dawliyya','silm-uhud-aman','السلم والعهود والأمان والوفاء بالعقود',1);
SELECT _seed_requested_topic('alaqat-dawliyya','huquq-ghayr-muslimin','حقوق غير المسلمين والجوار والسفراء',2);
SELECT _seed_requested_topic('alaqat-dawliyya','nizaat-asra','النزاعات والأسرى والقانون الدولي الإنساني',3);
SELECT _seed_requested_topic('alaqat-dawliyya','hiwar-ittifaqiyat','الدعوة والحوار والاتفاقيات المعاصرة',4);

SELECT _seed_requested_topic('afkar-muasira','shuyuiyya','الشيوعية',1);
SELECT _seed_requested_topic('afkar-muasira','rasmaliyya','الرأسمالية',2);
SELECT _seed_requested_topic('afkar-muasira','almaniyya','العلمانية',3);
SELECT _seed_requested_topic('afkar-muasira','liberaliyya','الليبرالية',4);
SELECT _seed_requested_topic('afkar-muasira','qawmiyya','القومية',5);
SELECT _seed_requested_topic('afkar-muasira','ilhad-maddiyya','الإلحاد والمادية',6);
SELECT _seed_requested_topic('afkar-muasira','hadatha','الحداثة وما بعد الحداثة',7);
SELECT _seed_requested_topic('afkar-muasira','fardaniyya-awlama','الفردانية والعولمة',8);

DROP FUNCTION _seed_requested_topic(TEXT,TEXT,TEXT,INT);
