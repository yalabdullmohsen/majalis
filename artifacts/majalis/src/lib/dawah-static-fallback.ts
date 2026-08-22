/**
 * محتوى ثابت احتياطي لبوابة «اكتشف الإسلام» عند فراغ Supabase.
 * لا يُعرض كحقيقة قطعية خارج ما ثبت في الكتاب والسنة المعتمدة.
 */
import type { DawahArticle, DawahQuestion, DawahShubha, NewMuslimDay } from "@/lib/dawah-service";

const STATIC_TS = "2026-08-22T00:00:00.000Z";

export const STATIC_DAWAH_ARTICLES: Record<string, DawahArticle> = {
  "what-is-islam": {
    id: "static-article-what-is-islam",
    category_id: null,
    slug: "what-is-islam",
    title_ar: "ما الإسلام؟",
    title_en: "What is Islam?",
    summary_ar: "الإسلام دين التوحيد: إقرارُ أن لا إله إلا الله وأن محمدًا رسول الله، مع أركان الإيمان والإسلام.",
    summary_en: null,
    body_ar: `الإسلام في لغة الكلمة: الاستسلام والانقياد. وشرعًا: الاستسلام لله بالتوحيد، والانقياد له بالطاعة، والبراءة مما سواه.

أركان الإسلام خمسة: الشهادتان، وإقام الصلاة، وإيتاء الزكاة، وصوم رمضان، وحج البيت لمن استطاع إليه سبيلًا. وأركان الإيمان ستة: الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر خيره وشره.

الإسلام ليس مجرد هوية ثقافية ولا عادات اجتماعية؛ هو عقد بين العبد وربه: يعبّد العبد ربه وحده، ويتبع رسوله محمدًا ﷺ فيما جاء به من الهدى.

لا يُشترط للدخول في الإسلام حضور وسيط أو موافقة جهة؛ يكفي الإيمان بالقلب ونطق الشهادتين. والتعلم بعد ذلك تدريجي، والله يُحب التأني في العمل.`,
    cover_image_url: null,
    tags: ["تعريف", "أساسيات"],
    updated_at: STATIC_TS,
  },
  "who-is-muhammad": {
    id: "static-article-who-is-muhammad",
    category_id: null,
    slug: "who-is-muhammad",
    title_ar: "من هو محمد ﷺ؟",
    title_en: "Who is Muhammad?",
    summary_ar: "محمد بن عبد الله ﷺ آخر الأنبياء وخاتمهم، أُرسل بالقرآن هدايةً للعالمين.",
    summary_en: null,
    body_ar: `محمد ﷺ ابن عبد الله بن عبد المطلب، من قبيلة قريش في مكة. وُلد عام الفيل، ونشأ يُعرف بالصدق والأمانة قبل البعثة، فكان يُلقّب بالصادق الأمين.

نزل عليه الوحي وهو ابن أربعين سنة في غار حراء، فحمل رسالة التوحيد: أن لا يُعبد إلا الله وحده لا شريك له. دعا قومه إلى الإسلام فآمن معه قلة ثم كثر المسلمون، وهاجر إلى المدينة حيث أسّس أول مجتمع إسلامي على العدل والشورى.

ختم الله به النبوة؛ فلا نبي بعده. القرآن الكريم وحيٌ أُنزل عليه، وسنته التطبيق العملي لهذا الوحي في العبادة والمعاملة والأخلاق.

المسلمون يحبّون النبي ﷺ ويتبعون هديه، ولا يُعبدونه ولا يُرفعونه فوق مقامه؛ فالعبادة لله وحده.`,
    cover_image_url: null,
    tags: ["نبوة", "سيرة"],
    updated_at: STATIC_TS,
  },
  "pillars-of-faith": {
    id: "static-article-pillars-of-faith",
    category_id: null,
    slug: "pillars-of-faith",
    title_ar: "أركان الإيمان والإسلام",
    title_en: "Pillars of Faith and Islam",
    summary_ar: "أركان الإسلام خمسة وأركان الإيمان ستة؛ فهمها يضبط المسار الشرعي للمسلم الجديد.",
    summary_en: null,
    body_ar: `أركان الإسلام خمسة: الشهادتان، وإقام الصلاة، وإيتاء الزكاة، وصوم رمضان، وحج البيت لمن استطاع إليه سبيلًا.

وأركان الإيمان ستة: الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر خيره وشره.

الفرق بينهما: الإسلام أعمال ظاهرة يُعرف بها المسلم، والإيمان اعتقاد بالقلب يُظهره العمل. المسلم الجديد يبدأ بالشهادتين ثم يتعلم الصلاة تدريجيًا، ولا يُثقّل عليه بإتقان كل الفقه دفعة واحدة.`,
    cover_image_url: null,
    tags: ["عقيدة", "أساسيات"],
    updated_at: STATIC_TS,
  },
  "prayer-in-islam": {
    id: "static-article-prayer-in-islam",
    category_id: null,
    slug: "prayer-in-islam",
    title_ar: "الصلاة في الإسلام",
    title_en: "Prayer in Islam",
    summary_ar: "الصلاة ركن من أركان الإسلام؛ صلة بين العبد وربه خمس مرات يوميًا بأوقات مضبوطة.",
    summary_en: null,
    body_ar: `الصلاة في الإسلام عبادة يومية مفروضة خمس مرات: الفجر والظهر والعصر والمغرب والعشاء. وهي أول ما يُحاسب عليه العبد يوم القيامة.

تبدأ الصلاة بالوضوء: غسل الوجه واليدين ومسح الرأس وغسل الرجلين. ثم تقف مستقبل القبلة وتقرأ الفاتحة وسورة قصيرة في الركعات الأولى، مع الركوع والسجود والجلوس بين السجدتين.

المسلم الجديد لا يُطالب بإتقان كل التفاصيل دفعة واحدة؛ يبدأ بصلاة واحدة يتقنها، ثم يضيف الباقي تدريجيًا. والصلاة في جماعة عند المسجد مُستحبّة لمن استطاع.

الصلاة ليست مجرد حركات؛ هي ذكر وخشوع ودعاء. قال النبي ﷺ: «أرحنا بها يا بلال» — فهي راحة القلب ورُباط العبد بربه.`,
    cover_image_url: null,
    tags: ["عبادة", "صلاة"],
    updated_at: STATIC_TS,
  },
  "zakat-in-islam": {
    id: "static-article-zakat-in-islam",
    category_id: null,
    slug: "zakat-in-islam",
    title_ar: "الزكاة في الإسلام",
    title_en: "Zakat in Islam",
    summary_ar: "الزكاة ركن من أركان الإسلام؛ تطهير للمال ونصرة للفقير بضوابط شرعية.",
    summary_en: null,
    body_ar: `الزكاة فريضة على من ملك النصاب وحال عليه الحول في أغلب الأموال. هي حق معلوم في المال، لا منّة من الغني على الفقير.

مصارفها ثمانية ذكرها القرآن: الفقراء والمساكين والعاملين عليها والمؤلفة قلوبهم وفي الرقاب والغارمين وفي سبيل الله وابن السبيل.

المسلم الجديد لا يُطالب بحساب الزكاة فور دخوله؛ يتعلم أولًا الأركان والصلاة، ثم يسأل عالمًا أو جهة موثوقة عند استقرار دخله. الصدقة التطوعية مفتوحة في كل وقت.

الزكاة تطهّر النفس من الشحّ، وتُصلح المجتمع بتقليل الحاجة، وهي عبادة مالية لا ضريبة مدنية فقط.`,
    cover_image_url: null,
    tags: ["عبادة", "زكاة"],
    updated_at: STATIC_TS,
  },
  "sawm-in-islam": {
    id: "static-article-sawm-in-islam",
    category_id: null,
    slug: "sawm-in-islam",
    title_ar: "الصوم في الإسلام",
    title_en: "Fasting in Islam",
    summary_ar: "صوم رمضان ركن من أركان الإسلام؛ تربية للنفس وتقوى، بضوابط واضحة للمقيم والمسافر والمريض.",
    summary_en: null,
    body_ar: `صوم رمضان فريضة على كل مسلم بالغ عاقل قادر. حقيقته الإمساك عن المفطرات من طلوع الفجر إلى غروب الشمس، مع النية.

من مقاصده: تقوى الله، وكسر الشهوة، ومواساة الفقير، وتدريب الإرادة. ليس مجرد جوع وعطش، بل عبادة قلبية وبدنية.

رُخّص للمريض والمسافر الفطر مع القضاء. والحامل والمرضع لهما أحكام يُسأل عنها أهل العلم. والمسلم الجديد يتعلّم الصوم تدريجيًا ولا يُحمَّل فوق طاقته في أول رمضان.

بعد الإفطار يُستحب الدعاء والصدقة وقيام الليل بحسب الاستطاعة. رمضان مدرسة سنوية لا موسمًا اجتماعيًا فقط.`,
    cover_image_url: null,
    tags: ["عبادة", "صوم"],
    updated_at: STATIC_TS,
  },
  "hajj-in-islam": {
    id: "static-article-hajj-in-islam",
    category_id: null,
    slug: "hajj-in-islam",
    title_ar: "الحج في الإسلام",
    title_en: "Hajj in Islam",
    summary_ar: "الحج ركن من أركان الإسلام على المستطيع؛ رحلة توحيد وتوبة واجتماع للأمة.",
    summary_en: null,
    body_ar: `الحج فريضة مرة في العمر على كل مسلم بالغ عاقل مستطيع. حقيقته قصد البيت الحرام لأداء مناسك معلومة في أشهر الحج.

من مقاصده: توحيد الله، والتوبة، والتذكير بيوم القيامة، واجتماع المسلمين على اختلاف ألسنتهم وألوانهم في صعيد واحد.

أركانه الأساسية تشمل الإحرام والوقوف بعرفة وطواف الإفاضة والسعي على التفصيل الفقهي. والعمرة سنة مؤكدة أو واجبة عند بعض العلماء.

المسلم الجديد لا يُطالب بالحج فور دخوله إن لم يستطع؛ يتعلم الأركان اليومية أولًا، ثم يستعد للحج متى تيسّر المال والصحة والأمن.`,
    cover_image_url: null,
    tags: ["عبادة", "حج"],
    updated_at: STATIC_TS,
  },
};

export const STATIC_DAWAH_QUESTIONS: DawahQuestion[] = [
  {
    id: "static-q-god",
    category_id: null,
    slug: "why-believe-in-god",
    title: "لماذا يُؤمن المسلم بوجود الله؟",
    short_answer: "لأن هذا الكون المُحكم يدلّ على خالق قادر عالم، ولأن الفطرة السليمة تميل إلى معرفة خالقها.",
    detailed_answer: "الإيمان بالله ليس تعصّبًا أعمى؛ بل هو استجابة لدلائل العقل والفطرة: نظام الكون، وتنوع المخلوقات، وضبط القوانين الكونية، وإدراك العبد لحاجته إلى معبود يستند إليه. والقرآن يدعو إلى التفكر في الآيات والنظر في ملكوت السماوات والأرض.",
    evidences: [{ type: "quran", ref: "آل عمران: 190-191", text: "إن في خلق السماوات والأرض واختلاف الليل والنهار لآيات لأولي الألباب" }],
    glossary_terms: [],
    sources: [],
    related_question_ids: [],
    keywords: ["الله", "وجود", "دليل"],
    target_religion: "atheist_agnostic",
    reviewed_at: STATIC_TS,
    view_count: 0,
    updated_at: STATIC_TS,
  },
  {
    id: "static-q-quran",
    category_id: null,
    slug: "what-is-quran",
    title: "ما القرآن؟",
    short_answer: "القرآن كلام الله المنزل على محمد ﷺ باللفظ والمعنى، معجز بلفظه، وهو آخر الكتب المنزلة.",
    detailed_answer: "القرآن وحيٌ أُنزل على النبي ﷺ عبر جبريل عليه السلام، جُمع في عهده ونُقل بالتواتر. هو معجز في بيانه وبلاغته، وهو مصدر التشريع الأول بعد السنة النبوية.",
    evidences: [{ type: "quran", ref: "البقرة: 185", text: "شهر رمضان الذي أُنزل فيه القرآن هدى للناس" }],
    glossary_terms: [],
    sources: [],
    related_question_ids: [],
    keywords: ["قرآن", "وحي"],
    target_religion: null,
    reviewed_at: STATIC_TS,
    view_count: 0,
    updated_at: STATIC_TS,
  },
  {
    id: "static-q-purpose",
    category_id: null,
    slug: "purpose-of-life",
    title: "لماذا خُلق الإنسان؟",
    short_answer: "ليعبد الله وحده ويستخلف في الأرض على ضوء هدايته.",
    detailed_answer: "قال تعالى: ﴿وما خلقت الجن والإنس إلا ليعبدون﴾. العبادة هنا شاملة: توحيد القلب، وطاعة الأمر، واجتناب النهي، والعمل الصالح. والحياة الدنيا مزرعة للآخرة.",
    evidences: [{ type: "quran", ref: "الذاريات: 56", text: "وما خلقت الجن والإنس إلا ليعبدون" }],
    glossary_terms: [],
    sources: [],
    related_question_ids: [],
    keywords: ["هدف", "حياة"],
    target_religion: null,
    reviewed_at: STATIC_TS,
    view_count: 0,
    updated_at: STATIC_TS,
  },
  {
    id: "static-q-prophet",
    category_id: null,
    slug: "why-muhammad",
    title: "لماذا يُؤمن المسلم بمحمد ﷺ؟",
    short_answer: "لأنه الرسول الخاتم الذي بُعث بالقرآن، وثبتت نبوته بالمعجزات والسيرة والتواتر.",
    detailed_answer: "آمن المسلمون بمحمد ﷺ لأن القرآن وحيٌ معجز، ولأن سيرته شاهدة على صدقه وأمانته، ولأن دعوته أكملت رسالات الأنبياء قبله في التوحيد والعدل.",
    evidences: [{ type: "quran", ref: "الأحزاب: 40", text: "ما كان محمد أبا أحد من رجالكم ولكن رسول الله وخاتم النبيين" }],
    glossary_terms: [],
    sources: [],
    related_question_ids: [],
    keywords: ["نبي", "محمد"],
    target_religion: null,
    reviewed_at: STATIC_TS,
    view_count: 0,
    updated_at: STATIC_TS,
  },
  {
    id: "static-q-worship",
    category_id: null,
    slug: "why-worship-god",
    title: "لماذا نعبد الله؟",
    short_answer: "لأنه الخالق الرازق المالك، والعبادة حقه وشكر نعمه وطريق السعادة في الدارين.",
    detailed_answer: "العبادة استحقاق لله باعتباره الرب الحق، وهي أيضًا مصلحة العبد: تُنظّم حياته، وتُطهّر قلبه، وتُقربه إلى ربه. ولا تناقض بين العقل والعبادة حين تُفهم على ضوء الوحي الصحيح.",
    evidences: [{ type: "quran", ref: "الذاريات: 56", text: "وما خلقت الجن والإنس إلا ليعبدون" }],
    glossary_terms: [],
    sources: [],
    related_question_ids: [],
    keywords: ["عبادة", "توحيد"],
    target_religion: null,
    reviewed_at: STATIC_TS,
    view_count: 0,
    updated_at: STATIC_TS,
  },
  {
    id: "static-q-convert",
    category_id: null,
    slug: "how-to-enter-islam",
    title: "كيف أدخل الإسلام؟",
    short_answer: "بنطق الشهادتين مع اعتقاد معناهما: لا إله إلا الله، محمد رسول الله.",
    detailed_answer: "لا يُشترط وسيط أو موعد أو احتفال. يكفي أن يعتقد القلب وينطق اللسان بالشهادتين. بعدها يتعلّم المسلم الصلاة والعبادات تدريجيًا. للتفاصيل العملية راجع صفحة «كيف أصبح مسلمًا».",
    evidences: [],
    glossary_terms: [],
    sources: [],
    related_question_ids: [],
    keywords: ["إسلام", "شهادة"],
    target_religion: null,
    reviewed_at: STATIC_TS,
    view_count: 0,
    updated_at: STATIC_TS,
  },
];

export const STATIC_NEW_MUSLIM_PATH: NewMuslimDay[] = [
  { id: "static-nm-1", day_number: 1, audience: "all", title: "الشهادتان ومعناهما", content_ar: "راجع معنى «لا إله إلا الله»: إفراد الله بالعبادة. و«محمد رسول الله»: اتباع ما جاء به من الهدى. إن لم تنطق الشهادتين بعد، فهذا اليوم مناسب لذلك بلا استعجال.", content_en: null },
  { id: "static-nm-2", day_number: 2, audience: "all", title: "الوضوء خطوة بخطوة", content_ar: "تعلّم أركان الوضوء: النية، غسل الوجه واليدين، مسح الرأس، غسل الرجلين. الوضوء مفتاح الصلاة؛ خذ وقتك في التطبيق العملي.", content_en: null },
  { id: "static-nm-3", day_number: 3, audience: "all", title: "صلاة واحدة تتقنها", content_ar: "ابدأ بصلاة واحدة (الفجر أو الظهر) وتعلّم أفعالها الأساسية: القيام والركوع والسجود. لا تُثقّل على نفسك بمحاولة إتقان الخمس دفعة واحدة.", content_en: null },
  { id: "static-nm-4", day_number: 4, audience: "all", title: "سورة الفاتحة", content_ar: "الفاتحة ركن في كل ركعة. اقرأها بتركيز على معانيها العامة: الحمد لله، الرحمن الرحيم، مالك يوم الدين، إياك نعبد وإياك نستعين.", content_en: null },
  { id: "static-nm-5", day_number: 5, audience: "all", title: "أذكار الصباح والمساء", content_ar: "اختر ثلاثة أذكار بسيطة من قسم الأذكار: مثل «أصبحنا وأصبح الملك لله»، و«أعوذ بكلمات الله التامات». الاستمرار أهم من الكثرة.", content_en: null },
  { id: "static-nm-6", day_number: 6, audience: "all", title: "اللباس والطهارة", content_ar: "تعلّم ما يجب ستره في الصلاة، وما يُستحب من النظافة والطيب. الإسلام يُكرّم الجسد ولا يُهينه.", content_en: null },
  { id: "static-nm-7", day_number: 7, audience: "all", title: "مراجعة الأسبوع الأول", content_ar: "راجع ما تعلّمته: الشهادتان، الوضوء، صلاة واحدة، الفاتحة، أذكار بسيطة. اسأل عما لم يتضح. الدين يُتعلّم تدريجيًا ولا عيب في السؤال.", content_en: null },
  { id: "static-nm-8", day_number: 8, audience: "all", title: "الصلوات الخمس", content_ar: "وسّع ما تعلّمته: أضف صلاة ثانية ثم ثالثة. تعلّم أوقات الصلاة تقريبية من التقويم أو تطبيق مواقيت. لا تُؤخر الصلاة عن وقتها قدر الإمكان.", content_en: null },
  { id: "static-nm-9", day_number: 9, audience: "all", title: "الزكاة والصدقة", content_ar: "الزكاة ركن على من ملك النصاب؛ والصدقة تطوع. ابدأ بفهم أن المال حق لله والعباد شُرِكوا فيه. لا يُطالب المسلم الجديد بالزكاة فورًا قبل استقرار دخله.", content_en: null },
  { id: "static-nm-10", day_number: 10, audience: "all", title: "الصوم في رمضان", content_ar: "صوم رمضان ركن سنوي. تعلّم أركانه: النية، الإمساك عن المفطرات من الفجر إلى المغرب. إن كان رمضان بعيدًا، اقرأ عنه استعدادًا دون ضغط.", content_en: null },
  { id: "static-nm-11", day_number: 11, audience: "all", title: "الأخلاق اليومية", content_ar: "الصدق، الأمانة، حسن الجوار، وبر الوالدين من أصول الإسلام. اختر خلقًا واحدًا تركز عليه هذا الأسبوع: مثل الصدق في الكلام.", content_en: null },
  { id: "static-nm-12", day_number: 12, audience: "all", title: "الطعام الحلال", content_ar: "تعلّم أساسيات الحلال: ذبح ذبيحة مسلم، تجنب الخنزير والخمر، والتسمية عند الأكل. لا تُعقّد الأمور؛ اسأل عند الشك من مصدر موثوق.", content_en: null },
  { id: "static-nm-13", day_number: 13, audience: "all", title: "القرآن والتلاوة", content_ar: "اقرأ قصيرًا من القرآن يوميًا ولو آية. تعلّم سورة قصيرة مثل الإخلاص أو الفلق. التلاوة عبادة ولا يُشترط إتقان التجويد من أول يوم.", content_en: null },
  { id: "static-nm-14", day_number: 14, audience: "all", title: "مراجعة الأسبوعين", content_ar: "راجع تقدّمك: الصلاة، الأذكار، الأخلاق، الحلال. حدّد سؤالًا واحدًا تبحث عنه أو تسأل داعيةً عنه. المسار يستمر بعد اليوم 14 — لا نهاية قسرية.", content_en: null },
];

export const STATIC_DAWAH_SHUBUHAT: DawahShubha[] = [
  {
    id: "static-sh-1",
    category_id: null,
    slug: "spread-by-sword",
    title: "هل انتشر الإسلام بالسيف؟",
    complexity_level: "basic",
    shubha_text: "يُقال إن الإسلام انتشر بالقوة والغزو لا بالقناعة.",
    why_spread: "خلط بين الفتوحات السياسية وقبول الناس للدين.",
    short_answer: "الإسلام دين عقيدة؛ والفتوحات التاريخية لا تعني إكراهًا على الإيمان، والقرآن ينهى عن ذلك صراحة.",
    detailed_refutation: "قال تعالى: ﴿لا إكراه في الدين﴾. وتاريخيًا دخل كثير من الناس في الإسلام بقناعة بعد معاينة أخلاق المسلمين وعدلهم، ومنهم من بقي على دينه بعهد وأمان. الفتوحات كانت ظاهرة سياسية عسكرية تُروى بتمحيص دون تبسيط إلى «سيف فقط».",
    assumption_correction: "الخلط بين توسع الدولة وبين قبول الأفراد للإيمان.",
    historical_linguistic_context: null,
    evidences: [{ type: "quran", ref: "البقرة: 256", text: "لا إكراه في الدين" }],
    sources: [],
    objections_and_responses: [],
    conclusion: "الدعوة إلى الإسلام تقوم على البيان والحجة لا على الإكراه.",
    updated_at: STATIC_TS,
  },
  {
    id: "static-sh-2",
    category_id: null,
    slug: "women-oppressed",
    title: "هل الإسلام يُقصي المرأة؟",
    complexity_level: "basic",
    shubha_text: "يُصوَّر الإسلام أحيانًا بأنه يحرم المرأة حقوقها.",
    why_spread: "سوء فهم لأحكام شرعية أو خلطها بعادات ثقافية قديمة.",
    short_answer: "الإسلام أعطى المرأة حقوق الملكية والتعلم والشهادة والميراث قبل كثير من النظم القديمة، مع ضوابط شرعية تُفهم في سياقها لا بعزلها عن العصر.",
    detailed_refutation: "القرآن والسنة فيهما نصوص صريحة في حق المرأة في المال والعلم والكرامة. ما يُنسب أحيانًا للإسلام من قهر قد يكون من عادات مجتمعية أو تطبيق خاطئ. يُميَّز بين النص الشرعي والتطبيق البشري.",
    assumption_correction: "اعتبار كل ممارسة مجتمعية حكمًا شرعيًا.",
    historical_linguistic_context: null,
    evidences: [{ type: "quran", ref: "النساء: 1", text: "يا أيها الناس اتقوا ربكم الذي خلقكم من نفس واحدة" }],
    sources: [],
    objections_and_responses: [],
    conclusion: "المراجعة الشرعية تفصل بين الحكم الثابت والتطبيق المعيب.",
    updated_at: STATIC_TS,
  },
  {
    id: "static-sh-3",
    category_id: null,
    slug: "quran-copied-bible",
    title: "هل نُسخ القرآن من الكتاب المقدس؟",
    complexity_level: "intermediate",
    shubha_text: "يُزعم تشابه بعض القصص بين القرآن والتوراة والإنجيل.",
    why_spread: "عدم تمييز بين القصص المشتركة في الأنبياء وبين النسخ الحرفي.",
    short_answer: "التشابه في قصص الأنبياء متوقع لأن المصدر واحد: الله. والقرآن يصحح ما حُرف ويخبر بما لم يكن عند أهل الكتاب.",
    detailed_refutation: "القرآن يخاطب أهل الكتاب ويُنكر عليهم التحريف، ويأتي بقصص موسى وعيسى وإبراهيم عليهم السلام بضبط شرعي. المعجزة القرآنية في اللغة والبيان والإعجاز العلمي لا تُختزل إلى «نسخ».",
    assumption_correction: "أن التشابه في القصص يعني النسخ من مصدر بشري واحد.",
    historical_linguistic_context: null,
    evidences: [{ type: "quran", ref: "يونس: 37", text: "وما كان هذا القرآن أن يفترى من دون الله" }],
    sources: [],
    objections_and_responses: [],
    conclusion: "القرآن وحي مستقل مع تصحيح لما سبقه من كتب.",
    updated_at: STATIC_TS,
  },
  {
    id: "static-sh-4",
    category_id: null,
    slug: "too-many-rules",
    title: "لماذا كثير من الأحكام في الإسلام؟",
    complexity_level: "basic",
    shubha_text: "يُشعر البعض أن الإسلام يقيّد الحياة بكثرة الأوامر والنواهي.",
    why_spread: "نظرة من خارج الدين دون فهم مقصد التشريع.",
    short_answer: "الأحكام تنظّم العبادة والمعاملة والأخلاق؛ والتدرج في التعلم يخفف الحِمل على المبتدئ.",
    detailed_refutation: "الإسلام لا يطالب المسلم الجديد بإتقان كل الفقه دفعة واحدة. يبدأ بالأركان، ثم يتعلم تدريجيًا. كثير من الأحكام رحمة: في الطعام والزواج والمال والعدل. ما يُرى قيدًا قد يكون حماية للنفس والمجتمع.",
    assumption_correction: "أن كثرة الأحكام تعني تعقيدًا بلا منفعة.",
    historical_linguistic_context: null,
    evidences: [],
    sources: [],
    objections_and_responses: [],
    conclusion: "التعلم التدريجي جزء من منهج الإسلام نفسه.",
    updated_at: STATIC_TS,
  },
  {
    id: "static-sh-5",
    category_id: null,
    slug: "science-contradicts-islam",
    title: "هل العلم يتعارض مع الإسلام؟",
    complexity_level: "intermediate",
    shubha_text: "يُزعم أحيانًا أن الإسلام يعارض العلم الحديث أو يتعارض مع الاكتشافات.",
    why_spread: "خلط بين نتائج علمية مؤقتة وبين نصوص شرعية مُساء فهمها، أو بين نظريات فلسفية وحقائق مثبتة.",
    short_answer: "الإسلام يحث على التفكر والنظر في الآيات الكونية؛ ولا تعارض بين الوحي الصحيح والعلم المثبت إذا فُهم كل منهما في مجاله.",
    detailed_refutation: "القرآن يدعو إلى التفكر في خلق السماوات والأرض والنظر في ملكوت الله. كثير من العلماء المسلمين ساهموا في الطب والفلك والرياضيات. ما يُنسب للإسلام من تعارض غالبًا ناتج عن قراءة خاطئة للنص أو تقديس نظرية علمية قابلة للمراجعة. يُميَّز بين الحقيقة العلمية المثبتة والتفسير الفلسفي لها.",
    assumption_correction: "أن كل نظرية علمية حديثة حقيقة مطلقة لا تُراجع.",
    historical_linguistic_context: null,
    evidences: [{ type: "quran", ref: "آل عمران: 190-191", text: "إن في خلق السماوات والأرض واختلاف الليل والنهار لآيات لأولي الألباب" }],
    sources: [],
    objections_and_responses: [],
    conclusion: "الإسلام يدعو إلى العلم والتفكر لا إلى الجهل أو رفض المعرفة.",
    updated_at: STATIC_TS,
  },
  {
    id: "static-sh-6",
    category_id: null,
    slug: "islam-equals-violence",
    title: "هل الإسلام دين عنف؟",
    complexity_level: "basic",
    shubha_text: "يُربط الإسلام أحيانًا بالعنف بسبب جرائم يرتكبها بعض المنتسبين إليه.",
    why_spread: "خلط بين فعل أفراد أو جماعات متطرفة وبين أحكام الدين ونصوصه.",
    short_answer: "الإسلام يحرّم قتل النفس المعصومة والعدوان؛ وما يقع من جرائم يُحاسب عليه مرتكبوه ولا يُنسب للدين كأصل.",
    detailed_refutation: "قال تعالى: ﴿من قتل نفسًا بغير نفس أو فساد في الأرض فكأنما قتل الناس جميعًا﴾. والجهاد في الشرع له ضوابط وشروط لا تُبرر الاعتداء على المدنيين. التطرف ظاهرة بشرية تُواجه بالنص والعلم والعدل لا بتعميم على مليار مسلم.",
    assumption_correction: "أن جريمة فرد أو جماعة تمثّل الإسلام كله.",
    historical_linguistic_context: null,
    evidences: [{ type: "quran", ref: "المائدة: 32", text: "من قتل نفسًا بغير نفس أو فساد في الأرض فكأنما قتل الناس جميعًا" }],
    sources: [],
    objections_and_responses: [],
    conclusion: "يُحاكم الفاعل بنص الشرع والقانون؛ ولا تُحمَّل الرسالة وزر المسيء.",
    updated_at: STATIC_TS,
  },
  {
    id: "static-sh-7",
    category_id: null,
    slug: "hadith-unreliable",
    title: "هل الحديث النبوي غير موثوق؟",
    complexity_level: "intermediate",
    shubha_text: "يُزعم أن الأحاديث كُتبت متأخرة فلا يُوثق بها، أو أن السنة لا تلزم.",
    why_spread: "جهل بمنهج المحدثين، وخلط بين الحديث الصحيح والضعيف والموضوع.",
    short_answer: "السنة وحي بالمعنى، ونقلها علماء الجرح والتعديل بأسانيد مضبوطة؛ والصحيح منها حجة مع القرآن.",
    detailed_refutation: "حفظ الصحابة السنة وبلّغوها، ثم دوّنها الأئمة كالبخاري ومسلم وفق شروط صارمة. علم مصطلح الحديث يميّز الصحيح من الضعيف. رفض السنة جملةً يهدم فهم القرآن نفسه؛ لأن الصلاة والزكاة والحج فُصّلت بالسنة. يُناقش كل حديث بمنهجه لا بتعميم.",
    assumption_correction: "أن كل ما نُسب للنبي ﷺ متساوٍ في القوة، أو أن التأخر النسبي في التدوين يعني الاختلاق.",
    historical_linguistic_context: null,
    evidences: [{ type: "quran", ref: "الحشر: 7", text: "وما آتاكم الرسول فخذوه وما نهاكم عنه فانتهوا" }],
    sources: [],
    objections_and_responses: [],
    conclusion: "يُقبل الصحيح ويُردّ الموضوع؛ والمنهج العلمي للمحدثين أساس الثقة لا الهوى.",
    updated_at: STATIC_TS,
  },
  {
    id: "static-sh-8",
    category_id: null,
    slug: "islam-against-reason",
    title: "هل الإسلام ضد العقل؟",
    complexity_level: "basic",
    shubha_text: "يُزعم أن الإيمان الإسلامي يلغي التفكير ويطلب التسليم الأعمى.",
    why_spread: "خلط بين التسليم للوحي الصحيح وبين رفض النظر والاستدلال الذي دعا إليه القرآن.",
    short_answer: "القرآن يحث على التفكر والنظر في الآيات؛ والعقل في الإسلام وسيلة لفهم الخطاب لا لمعارضة الوحي الثابت.",
    detailed_refutation: "آيات كثيرة تأمر بالتفكر: ﴿أفلا يعقلون﴾ و﴿إن في ذلك لآيات لقوم يعقلون﴾. العقل يُدرك وجود الخالق ويُميّز الحسن من القبيح في الجملة، ثم ينقاد للوحي في تفاصيل الغيب والشرع. ما يُسمّى «ضد العقل» غالبًا هو رفض أهواء فلسفية لا العقل السليم نفسه.",
    assumption_correction: "أن كل ما لا يوافق مزاجًا فلسفيًا معاصرًا فهو ضد العقل.",
    historical_linguistic_context: null,
    evidences: [{ type: "quran", ref: "البقرة: 164", text: "إن في خلق السماوات والأرض واختلاف الليل والنهار... لآيات لقوم يعقلون" }],
    sources: [],
    objections_and_responses: [],
    conclusion: "الإسلام يكرّم العقل ويدعو للتفكر، ويضع الوحي هاديًا فيما لا تستقل العقول بإدراكه.",
    updated_at: STATIC_TS,
  },
];

export function getStaticArticleBySlug(slug: string): DawahArticle | null {
  return STATIC_DAWAH_ARTICLES[slug] ?? null;
}

export function getStaticQuestionBySlug(slug: string): DawahQuestion | null {
  return STATIC_DAWAH_QUESTIONS.find((q) => q.slug === slug) ?? null;
}

export function getStaticShubhaBySlug(slug: string): DawahShubha | null {
  return STATIC_DAWAH_SHUBUHAT.find((s) => s.slug === slug) ?? null;
}
