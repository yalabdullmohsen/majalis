/**
 * أبواب أصول الفقه — هيكل تعليمي يربط المحتوى الموجود دون اختراع أحكام تفصيلية.
 * المصادر المذكورة من متون معتمدة (روضة الناظر، الورقات).
 */
export type UsulTopicStatus = "ready" | "structure";

export type UsulTopicSource = {
  book: string;
  author: string;
  ref: string;
};

export type UsulDetailBlock = {
  title: string;
  summary: string;
  evidence?: string;
  source: UsulTopicSource;
};

export type UsulHubTopic = {
  id: string;
  title: string;
  summary: string;
  kind: string;
  status: UsulTopicStatus;
  /** رابط خارجي إن وُجد (مثل القواعد) */
  href?: string;
  source?: UsulTopicSource;
  details?: UsulDetailBlock[];
};

/** المحتوى الجاهز من الصفحة السابقة — أدلة + إجماع + قياس */
const ADILLA_DETAILS: UsulDetailBlock[] = [
  {
    title: "الكتاب",
    summary: "القرآن أصل الأدلة، لا يُقدَّم عليه غيره، ويُفهم بعربيته ودلالة السلف.",
    evidence: "قال تعالى: ﴿وَنَزَّلْنَا عَلَيْكَ الْكِتَابَ تِبْيَانًا لِّكُلِّ شَيْءٍ﴾ النحل: 89.",
    source: {
      book: "روضة الناظر وجنة المناظر",
      author: "موفق الدين ابن قدامة المقدسي",
      ref: "باب الأدلة، الكتاب",
    },
  },
  {
    title: "السنة",
    summary: "السنة وحي بيان، حجة في الأحكام إذا صحت، وتشمل القول والفعل والتقرير.",
    evidence:
      "قال تعالى: ﴿وَمَا آتَاكُمُ الرَّسُولُ فَخُذُوهُ﴾ الحشر: 7. وقال ﷺ: «عليكم بسنتي» رواه أبو داود والترمذي.",
    source: {
      book: "روضة الناظر وجنة المناظر",
      author: "موفق الدين ابن قدامة المقدسي",
      ref: "باب الأدلة، السنة",
    },
  },
];

const IJMA_DETAIL: UsulDetailBlock = {
  title: "الإجماع",
  summary:
    "إجماع علماء العصر من الأمة على حكم شرعي حجة قاطعة عند أهل السنة، وأعلاه إجماع الصحابة.",
  evidence:
    "قال ﷺ: «لا تجتمع أمتي على ضلالة» رواه ابن ماجه وغيره بطرق يشد بعضها بعضًا. واستدل الأصوليون بقوله تعالى: ﴿وَمَن يُشَاقِقِ الرَّسُولَ مِن بَعْدِ مَا تَبَيَّنَ لَهُ الْهُدَىٰ وَيَتَّبِعْ غَيْرَ سَبِيلِ الْمُؤْمِنِينَ﴾ النساء: 115.",
  source: {
    book: "روضة الناظر وجنة المناظر",
    author: "موفق الدين ابن قدامة المقدسي",
    ref: "باب الإجماع",
  },
};

const QIYAS_DETAIL: UsulDetailBlock = {
  title: "القياس",
  summary:
    "إلحاق فرع بأصل في حكم لعلة جامعة، وهو حجة عند جماهير أهل العلم إذا استوفى أركانه.",
  evidence:
    "حديث معاذ حين بعثه إلى اليمن: «أجتهد رأيي ولا آلو» رواه أبو داود والترمذي، وتلقاه أهل العلم بالقبول في باب الاجتهاد.",
  source: {
    book: "الورقات",
    author: "عبد الملك بن عبد الله الجويني",
    ref: "باب القياس",
  },
};

export const USUL_HUB_TOPICS: UsulHubTopic[] = [
  {
    id: "adilla",
    title: "الأدلة",
    summary: "أدلة الأحكام الإجمالية: الكتاب والسنة — أصل الاستدلال.",
    kind: "باب",
    status: "ready",
    details: ADILLA_DETAILS,
  },
  {
    id: "hukm",
    title: "الحكم الشرعي",
    summary: "هيكل: تكليفي (واجب، مندوب، مباح، مكروه، محرم) ووضعي — بلا تفصيل أحكام هنا.",
    kind: "باب",
    status: "structure",
    source: {
      book: "الورقات",
      author: "عبد الملك بن عبد الله الجويني",
      ref: "باب الأحكام",
    },
  },
  {
    id: "amr-nahy",
    title: "الأمر والنهي",
    summary: "هيكل دلالات الأمر والنهي في النصوص — يُستكمل من المتون المعتمدة.",
    kind: "باب",
    status: "structure",
    source: {
      book: "الورقات",
      author: "عبد الملك بن عبد الله الجويني",
      ref: "باب الأوامر والنواهي",
    },
  },
  {
    id: "amm-khass",
    title: "العام والخاص",
    summary: "هيكل ألفاظ العموم والتخصيص — هيكل تعليمي دون مسائل تفصيلية.",
    kind: "باب",
    status: "structure",
    source: {
      book: "روضة الناظر وجنة المناظر",
      author: "موفق الدين ابن قدامة المقدسي",
      ref: "باب العموم والخصوص",
    },
  },
  {
    id: "mutlaq-muqayyad",
    title: "المطلق والمقيد",
    summary: "هيكل الإطلاق والتقييد في الأدلة اللفظية.",
    kind: "باب",
    status: "structure",
    source: {
      book: "روضة الناظر وجنة المناظر",
      author: "موفق الدين ابن قدامة المقدسي",
      ref: "باب المطلق والمقيد",
    },
  },
  {
    id: "naskh",
    title: "الناسخ والمنسوخ",
    summary: "هيكل النسخ في الأدلة: رفع حكم متقدم بدليل متأخر — بلا تعداد مسائل.",
    kind: "باب",
    status: "structure",
    source: {
      book: "الورقات",
      author: "عبد الملك بن عبد الله الجويني",
      ref: "باب النسخ",
    },
  },
  {
    id: "ijma",
    title: "الإجماع",
    summary: "حجية إجماع الأمة عند أهل السنة، وأعلاه إجماع الصحابة.",
    kind: "باب",
    status: "ready",
    details: [IJMA_DETAIL],
  },
  {
    id: "qiyas",
    title: "القياس",
    summary: "أركان القياس وشروطه عند الجمهور — من متن الورقات.",
    kind: "باب",
    status: "ready",
    details: [QIYAS_DETAIL],
  },
  {
    id: "qawaid",
    title: "القواعد الأصولية",
    summary: "اربط بالقواعد الفقهية الكبرى المعروضة في قسم مستقل.",
    kind: "رابط",
    status: "ready",
    href: "/fiqh-qawaid",
  },
];
