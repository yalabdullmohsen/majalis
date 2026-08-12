-- أول دفعة ترجمة فرنسية حقيقية (بشرية، لا آلية) — فرنسا وأفريقيا
-- الفرنكوفونية يضمان جمهورًا كبيرًا محتملًا لهذا القسم، والفرنسية من
-- اللغات الست التي تملك بالفعل قاموس واجهة مستخدم حقيقي كامل
-- (src/locales/fr.ts) لا اعتماد على fallback إنجليزي فقط. نفس النطاق
-- والمنهج المتّبع في دفعة الإنجليزية: عناوين وملخصات فقط، محصورة أولًا
-- في المحتوى الأعلى أولوية لجمهور غير عربي (الأسئلة البينية) + عناوين
-- المقالات الاثني عشر. status='in_review' لكل الترجمات — لا تُعرَض
-- للزوار عبر RLS إلا بعد اعتماد بشري صريح (status='approved').

-- 1) عناوين/ملخصات المقالات — عبر dawah_translations (لا أعمدة مخصَّصة
-- كما في الإنجليزية؛ هذه هي المسار العام القابل للتوسع لأي لغة أخرى)
INSERT INTO dawah_translations (entity_type, entity_id, lang, title, summary, status, is_machine_generated) VALUES

('article', (SELECT id FROM dawah_articles WHERE slug='what-is-islam'), 'fr',
'Qu''est-ce que l''Islam ?',
'Une introduction générale simple au sens de l''Islam et à ses piliers fondamentaux, pour ceux qui le découvrent pour la première fois.',
'in_review', false),

('article', (SELECT id FROM dawah_articles WHERE slug='who-is-muhammad'), 'fr',
'Qui est Muhammad ﷺ ?',
'Un bref aperçu de la vie du Prophète Muhammad ﷺ et de sa place dans l''Islam.',
'in_review', false),

('article', (SELECT id FROM dawah_articles WHERE slug='introduction-to-quran'), 'fr',
'Introduction au Noble Coran',
'Un aperçu du Coran : sa révélation, sa compilation, et sa place en tant que première source de la législation islamique.',
'in_review', false),

('article', (SELECT id FROM dawah_articles WHERE slug='five-pillars-of-islam'), 'fr',
'Les cinq piliers de l''Islam expliqués',
'Une explication concise de chacun des cinq piliers pratiques de l''Islam et de sa signification.',
'in_review', false),

('article', (SELECT id FROM dawah_articles WHERE slug='quran-and-sunnah-as-sources'), 'fr',
'Le Coran et la Sunna : les deux sources du droit islamique',
'Comment le Coran (la parole de Dieu) et la Sunna du Prophète ﷺ (son explication pratique) fonctionnent ensemble comme les deux sources fondamentales du droit islamique.',
'in_review', false),

('article', (SELECT id FROM dawah_articles WHERE slug='tawhid-common-thread'), 'fr',
'Le Tawhid : le fil conducteur de chaque message divin',
'Comment l''Islam considère l''appel à adorer un Dieu unique comme le message central partagé par tous les prophètes à travers l''histoire, et non une nouvelle invention de l''Islam.',
'in_review', false),

('article', (SELECT id FROM dawah_articles WHERE slug='islamic-manners-daily-life'), 'fr',
'Des manières islamiques simples pour la vie quotidienne',
'Un ensemble de manières quotidiennes simples que l''Islam recommande dans les rapports avec la nourriture, les gens et le temps.',
'in_review', false),

('article', (SELECT id FROM dawah_articles WHERE slug='women-in-islam'), 'fr',
'La femme en Islam : dignité et droits selon les textes',
'Un regard objectif sur la place de la femme en Islam : droits financiers, éducatifs et sociaux, et réponse à des perceptions courantes erronées.',
'in_review', false),

('article', (SELECT id FROM dawah_articles WHERE slug='how-islam-views-previous-prophets'), 'fr',
'Comment l''Islam considère Moïse, Jésus et les prophètes antérieurs',
'La croyance en tous les prophètes antérieurs est un pilier fondamental de la foi musulmane ; comment l''Islam comprend la relation entre son message et ceux qui l''ont précédé.',
'in_review', false),

('article', (SELECT id FROM dawah_articles WHERE slug='family-and-marriage-in-islam'), 'fr',
'La famille et le mariage en Islam : un fondement d''affection et de miséricorde',
'Comment l''Islam organise la relation conjugale et familiale sur la base de l''affection et du consentement mutuel, et non de la domination ou de la contrainte.',
'in_review', false),

('article', (SELECT id FROM dawah_articles WHERE slug='work-wealth-ethics-in-islam'), 'fr',
'Le travail, la richesse et l''éthique en Islam',
'Comment l''Islam encadre le gain et la dépense de l''argent dans un cadre éthique qui équilibre la recherche de ce bas monde et la responsabilité envers l''au-delà.',
'in_review', false),

('article', (SELECT id FROM dawah_articles WHERE slug='islamic-view-of-death-and-purpose'), 'fr',
'La mort et le sens de l''existence dans la vision islamique',
'Comment l''Islam relie la conception de la mort et de l''au-delà à un sens et un but clairs donnés à la vie terrestre.',
'in_review', false),

-- 2) عناوين/ملخصات الأسئلة البينية الإحدى عشرة (نفس المحتوى الذي
-- تُرجِم للإنجليزية، صياغة فرنسية مستقلة لا ترجمة آلية من الإنجليزية)
('question', (SELECT id FROM dawah_questions WHERE slug='christian-trinity-islamic-view'), 'fr',
'Je suis chrétien(ne) — comment l''Islam considère-t-il la doctrine de la Trinité ?',
'L''Islam honore la sainteté de Jésus (paix sur lui) dans le christianisme, mais soutient que le monothéisme pur — un Dieu unique sans pluralité de personnes — est le message central de chaque prophète, y compris Jésus lui-même, et n''accepte pas le concept de trois personnes comme description de l''essence de Dieu.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='jesus-crucifixion-islamic-view'), 'fr',
'Je suis chrétien(ne) — pourquoi l''Islam ne croit-il pas que Jésus a été crucifié en expiation pour l''humanité ?',
'Le christianisme enseigne que Jésus a été réellement crucifié et est mort pour expier les péchés de l''humanité, puis est ressuscité ; l''Islam soutient que Dieu a élevé Jésus vers Lui et qu''il n''a été ni tué ni réellement crucifié, et que le salut en Islam s''obtient par le repentir direct envers Dieu, non par une expiation sanglante.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='jewish-covenant-new-prophet'), 'fr',
'Je suis juif/juive — pourquoi l''Islam revendique-t-il une nouvelle prophétie après la Torah ?',
'Le judaïsme s''appuie sur une alliance éternelle entre Dieu et les Enfants d''Israël à travers Abraham et Moïse, avec la Torah comme loi complète et définitive pour le judaïsme traditionnel ; l''Islam considère Muhammad ﷺ comme la continuation de cette même lignée de prophétie monothéiste, cette fois adressée à toute l''humanité plutôt qu''à une seule nation.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='hindu-concept-of-god-islamic-view'), 'fr',
'Je suis hindou(e) — comment l''Islam considère-t-il la multiplicité des manifestations divines dans l''hindouisme ?',
'L''hindouisme est une tradition intérieurement diverse : certaines de ses écoles philosophiques (comme l''Advaita Vedanta) sont monistes ou monothéistes dans un sens philosophique profond (Brahman comme réalité absolue unique), tandis que de nombreux adeptes vénèrent rituellement plusieurs divinités souvent comprises comme des expressions de cette réalité unique ; l''Islam soutient qu''un monothéisme pur et direct, sans intermédiaires ni manifestations, est l''essence de la vraie religion.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='buddhist-no-creator-islamic-view'), 'fr',
'Je suis bouddhiste et je ne crois pas en un Dieu créateur — comment l''Islam s''adresse-t-il à moi ?',
'Le bouddhisme classique (en particulier le Theravada) n''est pas du tout centré sur un Dieu créateur, mais sur la libération de la souffrance par les Quatre Nobles Vérités et le Noble Sentier Octuple ; l''Islam offre un cadre fondamentalement différent qui place la croyance en un Créateur unique au fondement du sens et du but, tout en répondant également à votre quête de libération de la souffrance sous un angle différent.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='sikh-guru-granth-islamic-view'), 'fr',
'Je suis sikh — comment l''Islam considère-t-il la croyance sikhe en un Dieu unique et les dix Gourous ?',
'Le sikhisme partage avec l''Islam le monothéisme d''un Dieu unique (Ik Onkar) et le rejet des idoles et de la médiation sacerdotale, mais diffère en considérant le Guru Granth Sahib (l''écriture sacrée) comme un Gourou vivant et éternel succédant à dix Gourous humains ; l''Islam soutient que la véritable révélation s''est achevée avec le Prophète final, Muhammad ﷺ.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='jain-no-creator-god-islamic-view'), 'fr',
'Je suis jaïn et je ne crois pas en un Dieu créateur — comment l''Islam s''adresse-t-il à moi ?',
'Le jaïnisme enseigne que l''univers est éternel et incréé, régi par des lois naturelles fixes (le karma), la libération s''obtenant par l''effort individuel fondé sur la non-violence absolue (ahimsa) envers tout être vivant ; l''Islam présente une vision radicalement différente : un univers créé par la volonté d''un Créateur unique et miséricordieux, le salut étant une relation avec ce Créateur, non un simple effort individuel solitaire.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='zoroastrian-dualism-islamic-view'), 'fr',
'Je suis zoroastrien(ne) — comment l''Islam considère-t-il la dualité du bien et du mal sous Ahura Mazda ?',
'Le zoroastrisme croit en un Dieu suprême unique (Ahura Mazda) représentant la lumière et la bonté, engagé dans une lutte cosmique contre une force maléfique opposée (Angra Mainyu), le feu étant un symbole sacré de la lumière d''Ahura Mazda plutôt qu''un objet de culte lui-même ; l''Islam soutient un monothéisme absolu sans une telle dualité — Dieu seul crée toute chose, et le bien et le mal apparents font tous deux partie de Sa sagesse globale, non d''une lutte entre deux forces de puissance comparable.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='bahai-progressive-revelation-islamic-view'), 'fr',
'Je suis bahá''í — pourquoi l''Islam n''accepte-t-il pas l''idée d''une révélation continue après Muhammad ﷺ ?',
'La foi bahá''íe croit que la révélation divine est « progressive », se poursuivant à travers des Manifestations de Dieu successives (dont Abraham, Moïse, Jésus, Muhammad et Bahá''u''lláh) ; l''Islam affirme explicitement que Muhammad ﷺ est le Sceau des Prophètes, et que toute prétention à la prophétie ou à une nouvelle révélation après lui contredit directement ce texte coranique définitif.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='chinese-tradition-tian-dao-islamic-view'), 'fr',
'Je suis attaché(e) aux traditions chinoises (confucianisme/taoïsme) — comment l''Islam considère-t-il les concepts de « Tian » et du « Tao » ?',
'Les traditions chinoises mêlent des éléments éthico-philosophiques (le confucianisme : harmonie sociale et piété filiale), une contemplation du « Tao » (la Voie cosmique naturelle dans le taoïsme), une vénération du « Tian » (le Ciel), et un culte des ancêtres — s''apparentant souvent davantage à un système éthico-philosophico-spirituel intégré qu''à une religion théiste au sens d''un Dieu créateur personnel comme en Islam.',
'in_review', false),

('question', (SELECT id FROM dawah_questions WHERE slug='secular-humanism-vs-islam'), 'fr',
'Je suis athée et je crois en l''humanisme séculier — pourquoi aurais-je besoin d''une religion pour être quelqu''un de bien ?',
'L''humanisme séculier construit l''éthique sur un consensus humain rationnel sans point de référence transcendant, et cela peut réellement produire un engagement éthique authentique — mais l''Islam soulève une question plus profonde : cet engagement repose-t-il sur un fondement stable qui tient à travers des sociétés et des époques différentes, ou est-il finalement une préférence collective susceptible de changer aussi radicalement que le consensus lui-même ?',
'in_review', false)

ON CONFLICT (entity_type, entity_id, lang) DO NOTHING;
