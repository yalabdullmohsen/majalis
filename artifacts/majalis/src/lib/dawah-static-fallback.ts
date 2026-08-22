/**
 * محتوى ثابت احتياطي لبوابة «اكتشف الإسلام» عند فراغ Supabase.
 * لا يُعرض كحقيقة قطعية خارج ما ثبت في الكتاب والسنة المعتمدة.
 */
import type { DawahArticle, DawahQuestion, NewMuslimDay } from "@/lib/dawah-service";

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
];

export function getStaticArticleBySlug(slug: string): DawahArticle | null {
  return STATIC_DAWAH_ARTICLES[slug] ?? null;
}

export function getStaticQuestionBySlug(slug: string): DawahQuestion | null {
  return STATIC_DAWAH_QUESTIONS.find((q) => q.slug === slug) ?? null;
}
