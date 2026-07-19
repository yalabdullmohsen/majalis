-- أول دفعة ترجمة إنجليزية حقيقية (بشرية، لا آلية) — تنفيذًا لطلب
-- "ترجم بلغات كثيرة". النطاق يطابق ما حدّده التكليف الأصلي بدقة:
-- عناوين وملخصات فقط (لا الشرح المفصَّل الكامل)، ومحصور أولًا في
-- المحتوى الأعلى أولوية لجمهور غير عربي: الأسئلة البينية الموجَّهة
-- لأصحاب ديانات أخرى (target_religion) والمقالات التعريفية السبعة.
-- كل الترجمات status='in_review' — منشورة للمراجعة لا للجمهور مباشرة
-- (published يتطلب أيضًا is_approved=true على العنصر الأصلي، وهو
-- false افتراضيًا لكل هذا المحتوى بعد). is_machine_generated=false
-- لأنها صياغة بشرية أصلية لا ترجمة آلية خام.

-- 1) عناوين/ملخصات المقالات — أعمدة مباشرة على dawah_articles نفسها
UPDATE dawah_articles SET
  title_en = 'What Is Islam?',
  summary_en = 'A simple general introduction to the meaning of Islam and its core pillars, for first-time learners.'
WHERE slug = 'what-is-islam';

UPDATE dawah_articles SET
  title_en = 'Who Is Muhammad ﷺ?',
  summary_en = 'A brief overview of the life of the Prophet Muhammad ﷺ and his standing in Islam.'
WHERE slug = 'who-is-muhammad';

UPDATE dawah_articles SET
  title_en = 'An Introduction to the Noble Quran',
  summary_en = 'An overview of the Quran: its revelation, compilation, and standing as the primary source of Islamic law.'
WHERE slug = 'introduction-to-quran';

UPDATE dawah_articles SET
  title_en = 'The Five Pillars of Islam, Explained',
  summary_en = 'A concise explanation of each of the five practical pillars of Islam and what it means.'
WHERE slug = 'five-pillars-of-islam';

UPDATE dawah_articles SET
  title_en = 'The Quran and the Sunnah: The Two Sources of Islamic Law',
  summary_en = 'How the Quran (the word of God) and the Sunnah of the Prophet ﷺ (his practical explanation) work together as the two foundational sources of Islamic law.'
WHERE slug = 'quran-and-sunnah-as-sources';

UPDATE dawah_articles SET
  title_en = 'Tawhid: The Common Thread of Every Divine Message',
  summary_en = 'How Islam views the call to worship one God alone as the core message shared by every prophet throughout history, not a new invention of Islam.'
WHERE slug = 'tawhid-common-thread';

UPDATE dawah_articles SET
  title_en = 'Simple Islamic Manners for Daily Life',
  summary_en = 'A collection of simple daily manners Islam recommends in dealing with food, people, and time.'
WHERE slug = 'islamic-manners-daily-life';

-- 2) عناوين/ملخصات الأسئلة البينية الإحدى عشرة — عبر جدول
-- dawah_translations المخصَّص (entity_type='question')
INSERT INTO dawah_translations (entity_type, entity_id, lang, title, summary, status, is_machine_generated) VALUES

('question', (SELECT id FROM dawah_questions WHERE slug='christian-trinity-islamic-view'), 'en',
'I''m Christian — how does Islam view the doctrine of the Trinity?',
'Islam honors the sanctity of Jesus (peace be upon him) in Christianity, but holds that pure monotheism — one God without a plurality of persons — is the core message of every prophet, including Jesus himself, and does not accept the concept of three persons as a description of God''s essence.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='jesus-crucifixion-islamic-view'), 'en',
'I''m Christian — why doesn''t Islam believe Jesus was crucified as atonement for humanity?',
'Christianity teaches that Jesus was actually crucified and died to atone for humanity''s sins, then rose from the dead; Islam holds that God raised Jesus to Himself and that he was neither killed nor actually crucified, and that salvation in Islam comes through direct repentance to God, not a blood atonement.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='jewish-covenant-new-prophet'), 'en',
'I''m Jewish — why does Islam claim a new prophecy after the Torah?',
'Judaism holds to an eternal covenant between God and the Children of Israel through Abraham and Moses, with the Torah as a complete, final law for traditional Judaism; Islam sees Muhammad ﷺ as a continuation of that same line of monotheistic prophecy, this time addressed to all of humanity rather than one nation.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='hindu-concept-of-god-islamic-view'), 'en',
'I''m Hindu — how does Islam view the multiplicity of divine manifestations in Hinduism?',
'Hinduism is an internally diverse tradition: some of its philosophical schools (such as Advaita Vedanta) are monist or monotheistic in a deep philosophical sense (Brahman as one absolute reality), while many adherents ritually worship multiple deities and manifestations often understood as expressions of that one reality; Islam holds that pure, direct monotheism without intermediaries or manifestations is the essence of true religion.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='buddhist-no-creator-islamic-view'), 'en',
'I''m Buddhist and don''t believe in a creator God — how does Islam address me?',
'Classical Buddhism (especially Theravada) is not centered on a creator God at all, but on liberation from suffering through the Four Noble Truths and the Eightfold Path; Islam offers a fundamentally different framework that places belief in one Creator at the foundation of meaning and purpose, while also addressing your search for liberation from suffering from a different angle.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='sikh-guru-granth-islamic-view'), 'en',
'I''m Sikh — how does Islam view the Sikh belief in one God and the ten Gurus?',
'Sikhism shares with Islam the monotheism of one God (Ik Onkar) and the rejection of idols and priestly mediation, but differs in regarding the Guru Granth Sahib (the sacred scripture) as a living, eternal Guru succeeding ten human Gurus; Islam holds that true revelation ended with the final Prophet, Muhammad ﷺ.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='jain-no-creator-god-islamic-view'), 'en',
'I''m Jain and don''t believe in a creator God — how does Islam address me?',
'Jainism teaches that the universe is eternal and uncreated, governed by fixed natural laws (karma), with liberation achieved through individual effort rooted in absolute nonviolence (ahimsa) toward every living being; Islam presents a radically different picture: a created universe willed by one merciful Creator, with salvation as a relationship with that Creator, not solitary individual effort alone.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='zoroastrian-dualism-islamic-view'), 'en',
'I''m Zoroastrian — how does Islam view the duality of good and evil under Ahura Mazda?',
'Zoroastrianism believes in one supreme God (Ahura Mazda) representing light and goodness, locked in cosmic struggle with an opposing evil force (Angra Mainyu), with fire as a sacred symbol of Ahura Mazda''s light rather than an object of worship itself; Islam holds to absolute monotheism with no such duality — God alone creates everything, and apparent good and evil are both part of His comprehensive wisdom, not a struggle between two comparably powerful forces.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='bahai-progressive-revelation-islamic-view'), 'en',
'I''m Baha''i — why doesn''t Islam accept the idea of continuing revelation after Muhammad ﷺ?',
'The Baha''i Faith believes divine revelation is "progressive," continuing through successive Manifestations of God (including Abraham, Moses, Jesus, Muhammad, and Baha''u''llah); Islam explicitly states that Muhammad ﷺ is the Seal of the Prophets, and that any claim of prophecy or new revelation after him directly contradicts this definitive Quranic text.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='chinese-tradition-tian-dao-islamic-view'), 'en',
'I follow Chinese traditions (Confucian/Taoist) — how does Islam view the concepts of "Tian" and the "Tao"?',
'Chinese traditions blend ethical-philosophical elements (Confucianism: social harmony and filial piety), contemplation of the "Tao" (the natural cosmic Way in Taoism), reverence for "Tian" (Heaven), and ancestor veneration — often closer to an integrated ethical-philosophical-spiritual system than to a theistic religion in the sense of a personal creator God as in Islam.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='secular-humanism-vs-islam'), 'en',
'I''m an atheist who believes in secular humanism — why would I need religion at all to be a good person?',
'Secular humanism builds ethics on rational human consensus without a transcendent reference point, and this can genuinely produce real ethical commitment — but Islam raises a deeper question: does that commitment rest on a stable foundation that holds across differing societies and eras, or is it ultimately a collective preference liable to shift as radically as the consensus itself?',
'in_review', false)

ON CONFLICT (entity_type, entity_id, lang) DO NOTHING;
