import type { FiqhCouncilItem } from "./fiqh-council-types";

/** عناصر منشورة للجمهور — محتوى منظم دون تفاصيل غير موثقة */
export const FIQH_COUNCIL_PUBLISHED_SEED: FiqhCouncilItem[] = [
  {
    id: "seed-fiqh-crypto-2024",
    slug: "fiqh-crypto-2024",
    external_id: "seed:fiqh-crypto-2024",
    title: "حكم التعامل بالعملات الرقمية (المشفّرة)",
    summary: "بيان حول حكم التعامل بالعملات الرقمية من حيث البيع والشراء والاستثمار.",
    content: `قرّر المجمع الفقهي أن التعامل بالعملات الرقمية يخضع لأحكام العُملات والمعاملات المالية في الشريعة.

**القرار:**
1. العملات الرقمية التي لا تُغطّى بأصول حقيقية ولا تُقبل في التبادل الواسع لا تُعدّ نقوداً شرعية.
2. التداول المضاربي فيها يُعدّ من الغرر والجهالة المنهي عنهما.
3. يُستثنى ما أقرّته الدولة رسمياً كوسيلة دفع معتمدة وفق ضوابط شرعية.
4. يُنصح طالب العلم بمراجعة فتاوى الهيئات الشرعية المعتمدة في بلده.`,
    ruling_text: "لا تُعدّ العملات الرقمية غير المُغطّاة بأصول حقيقية نقوداً شرعية؛ والتداول المضاربي فيها فيه غرر وجهالة.",
    type: "resolution",
    category: "الاقتصاد الإسلامي",
    session_number: "24",
    session_date: "2024-03-15",
    source_name: "المجمع الفقهي الإسلامي",
    source_url: "https://www.islamweb.net/fatwa/",
    council_name: "المجمع الفقهي الإسلامي",
    evidence: [
      { type: "قرآن", text: "يَا أَيُّهَا الَّذِينَ آمَنُوا لَا تَأْكُلُوا أَمْوَالَكُمْ بَيْنَكُمْ بِالْبَاطِلِ", source: "سورة النساء: 29" },
      { type: "حديث", text: "البيعان بالخيار ما لم يتفرقا", source: "رواه البخاري ومسلم" },
    ],
    tags: ["عملات رقمية", "اقتصاد", "معاملات"],
    subcategory: "الاقتصاد",
    nawazil_topic: "crypto",
    key_points: [
      "العملات غير المغطاة بأصول لا تُعد نقوداً شرعية",
      "التداول المضاربي فيها فيه غرر وجهالة",
      "ما أقرّته الدولة كوسيلة دفع يُستثنى وفق ضوابط",
    ],
    confidence_level: "source_verified",
    summary_source: "source",
    status: "published",
    views_count: 1240,
    published_at: "2024-03-15T10:00:00Z",
    created_at: "2024-03-15T10:00:00Z",
  },
  {
    id: "seed-fiqh-organ-donation",
    slug: "fiqh-organ-donation",
    external_id: "seed:fiqh-organ-donation",
    title: "حكم التبرع بالأعضاء بعد الوفاة",
    summary: "توصية بشأن التبرع بالأعضاء لإنقاذ حياة المرضى وفق ضوابط شرعية.",
    content: `**التوصية:**
يجوز التبرع بالأعضاء بعد الوفاة إذا تحققت الشروط التالية:
- موافقة المتبرّع أو ورثته قبل الوفاة.
- أن يكون التبرع لإنقاذ حياة مريض محتاج.
- ألا يُؤدي إلى إهانة جثمان المسلم.
- أن يكون بإذن الجهات الطبية والشرعية المعتمدة.`,
    ruling_text: "يجوز التبرع بالأعضاء بعد الوفاة عند تحقق الشروط الشرعية والطبية.",
    type: "recommendation",
    category: "الطب والنوازل",
    session_number: "22",
    session_date: "2023-11-08",
    council_name: "المجمع الفقهي الإسلامي",
    evidence: [
      { type: "قرآن", text: "وَمَنْ أَحْيَاهَا فَكَأَنَّمَا أَحْيَا النَّاسَ جَمِيعًا", source: "سورة المائدة: 32" },
    ],
    tags: ["تبرع", "أعضاء", "طب"],
    subcategory: "الطب",
    nawazil_topic: "organ-donation",
    key_points: [
      "يجوز التبرع بعد الوفاة بشروط",
      "موافقة المتبرّع أو ورثته",
      "لإنقاذ حياة مريض محتاج",
    ],
    confidence_level: "source_verified",
    summary_source: "source",
    status: "published",
    views_count: 890,
    published_at: "2023-11-08T09:00:00Z",
    created_at: "2023-11-08T09:00:00Z",
  },
  {
    id: "seed-fiqh-minorities-rights",
    slug: "fiqh-minorities-rights",
    external_id: "seed:fiqh-minorities-rights",
    title: "حقوق الأقليات المسلمة في البلدان غير الإسلامية",
    summary: "بيان يؤكّد حقوق المسلمين في ممارسة شعائرهم والحفاظ على هويتهم.",
    content: `**البيان:**
1. للمسلمين في البلدان غير الإسلامية حق ممارسة العبادات والصيام والحج وفق القوانين المحلية.
2. يجب على المسلمين الالتزام بعقودهم وعهودهم مع الدول التي يقيمون فيها.
3. يُستحب إقامة المراكز الإسلامية والمدارس لتعليم الأبناء.
4. يُحرّم الانخراط في ما يُخالف ثوابت الدين.`,
    type: "ruling",
    category: "الأقليات المسلمة",
    session_number: "21",
    session_date: "2023-06-20",
    council_name: "المجمع الفقهي الإسلامي",
    tags: ["أقليات", "حقوق", "الغربة"],
    status: "published",
    views_count: 650,
    published_at: "2023-06-20T08:00:00Z",
    created_at: "2023-06-20T08:00:00Z",
  },
  {
    id: "seed-fiqh-marriage-contract",
    slug: "fiqh-marriage-contract",
    external_id: "seed:fiqh-marriage-contract",
    title: "ضوابط عقد النكاح الإلكتروني",
    summary: "بحث في صحة عقد النكاح عبر الوسائل الإلكترونية والشروط اللازمة.",
    content: `**البحث:**
- عقد النكاح عبر الإنترنت يصح إذا توفرت أركانه وشروطه الشرعية.
- يشترط حضور الشاهدين أو سماعهما الإيجاب والقبول.
- يُفضّل إثبات العقد في المحاكم أو الجهات الرسمية.
- لا يجوز التحايل على شروط الولاية والرضا.`,
    type: "research",
    category: "الأسرة",
    session_number: "20",
    session_date: "2023-04-12",
    council_name: "المجمع الفقهي الإسلامي",
    tags: ["نكاح", "عقد", "إلكتروني"],
    status: "published",
    views_count: 1100,
    published_at: "2023-04-12T07:00:00Z",
    created_at: "2023-04-12T07:00:00Z",
  },
  {
    id: "seed-fiqh-zakat-stocks",
    slug: "fiqh-zakat-stocks",
    external_id: "seed:fiqh-zakat-stocks",
    title: "زكاة الأسهم والصناديق الاستثمارية",
    summary: "قرار يبيّن كيفية إخراج زكاة الأسهم والصناديق الاستثمارية.",
    content: `**القرار:**
1. تُزكّى الأسهم المُقصود منها التجارة بقيمتها السوقية سنوياً.
2. الأسهم المُقصود منها الاستثمار طويل الأجل تُزكّى أرباحها فقط إن بلغت النصاب.
3. يُستثنى ما يُخصّص للضرورة أو الدين.
4. يُرجع في التفاصيل إلى فتاوى الهيئات الشرعية للصناديق.`,
    ruling_text: "تُزكّى الأسهم التجارية بقيمتها السوقية؛ والاستثمارية أرباحها عند بلوغ النصاب.",
    type: "resolution",
    category: "الزكاة والوقف",
    session_number: "19",
    session_date: "2022-12-05",
    council_name: "المجمع الفقهي الإسلامي",
    tags: ["زكاة", "أسهم", "استثمار"],
    status: "published",
    views_count: 2100,
    published_at: "2022-12-05T06:00:00Z",
    created_at: "2022-12-05T06:00:00Z",
  },
  {
    id: "seed-fiqh-collective-fatwa-hajj",
    slug: "fiqh-collective-fatwa-hajj",
    external_id: "seed:fiqh-collective-fatwa-hajj",
    title: "فتوى جماعية: حكم تأخير الحج لمن استطاع مادياً",
    summary: "فتوى جماعية بشأن وجوب الحج على الفور لمن توفرت شروطه.",
    content: `**الفتوى:**
الحج واجب على الفور لمن استطاع إليه سبيلاً، ولا يجوز تأخيره بلا عذر شرعي.
من عذر شرعي: مرض يمنع السفر، أو خوف على النفس أو المال، أو عدم توفر التأشيرة.`,
    ruling_text: "الحج واجب على الفور لمن استطاع إليه سبيلاً بلا عذر شرعي.",
    type: "fatwa",
    category: "الحج والعمرة",
    session_number: "18",
    session_date: "2022-08-01",
    council_name: "المجمع الفقهي الإسلامي",
    tags: ["حج", "وجوب", "تأخير"],
    status: "published",
    views_count: 980,
    published_at: "2022-08-01T05:00:00Z",
    created_at: "2022-08-01T05:00:00Z",
  },
];

/** مسودات للوحة الإدارة فقط — لا تُعرض للجمهور */
export const FIQH_COUNCIL_ADMIN_ONLY_SEED: FiqhCouncilItem[] = [
  {
    id: "seed-fiqh-draft-islamic-finance",
    slug: "draft-islamic-finance-placeholder",
    title: "[مسودة] بيان حول التمويل الإسلامي",
    summary: "عنصر placeholder للإدارة — يحتاج مراجعة ومصادر قبل النشر.",
    type: "research",
    category: "الاقتصاد الإسلامي",
    status: "draft",
    council_name: "المجمع الفقهي الإسلامي",
    tags: ["مسودة", "تمويل"],
    views_count: 0,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "seed-fiqh-review-fasting-travel",
    slug: "review-fasting-travel-placeholder",
    title: "[قيد المراجعة] أحكام الصيام للمسافر",
    summary: "عنصر placeholder للإدارة — بانتظار اعتماد المراجع.",
    type: "fatwa",
    category: "العبادات",
    status: "needs_review",
    council_name: "المجمع الفقهي الإسلامي",
    tags: ["مراجعة", "صيام"],
    views_count: 0,
    created_at: "2026-01-02T00:00:00Z",
  },
];

export const FIQH_COUNCIL_ALL_SEED: FiqhCouncilItem[] = [
  ...FIQH_COUNCIL_PUBLISHED_SEED,
  ...FIQH_COUNCIL_ADMIN_ONLY_SEED,
];

export function findFiqhCouncilItemBySlug(slug: string) {
  return FIQH_COUNCIL_PUBLISHED_SEED.find((item) => item.slug === slug) || null;
}

export function findFiqhCouncilItemForAdmin(slug: string) {
  return FIQH_COUNCIL_ALL_SEED.find((item) => item.slug === slug) || null;
}

/** @deprecated استخدم FIQH_COUNCIL_PUBLISHED_SEED */
export const FIQH_COUNCIL_SEED = FIQH_COUNCIL_PUBLISHED_SEED;

/** @deprecated */
export function findFiqhDecisionById(id: string) {
  return FIQH_COUNCIL_PUBLISHED_SEED.find((d) => d.slug === id || d.id === id) || null;
}
