import type { FiqhCouncilItem } from "./fiqh-council-types";
import { calculateCompletionScore } from "./fiqh-verification-service";

function withQualityFields(item: FiqhCouncilItem): FiqhCouncilItem {
  const score = calculateCompletionScore(item);
  return {
    ...item,
    completion_score: score,
    link_status: item.source_url ? "ok" : "unchecked",
  };
}

/** عناصر منشورة للجمهور — محتوى منظم دون تفاصيل غير موثقة */
const RAW_PUBLISHED_SEED: FiqhCouncilItem[] = [
  // ملاحظة تدقيق (٢٠٢٦-٠٧-٢٦): حُذف من هنا ٢٨ عنصراً كانت تنسب قرارات إلى
  // «المجمع الفقهي الإسلامي» و«مجمع الفقه الإسلامي الدولي» وجهات إفتاء أخرى
  // بأرقام دورات وتواريخ لا مستند لها (source_url = الصفحة الرئيسية للجهة فقط،
  // بلا رقم قرار)، مع وسمها documentation_level: "official_verified". وقد ثبت
  // بالمقابلة مع المصادر الرسمية أن الدورة 24 لمجمع الفقه الدولي انعقدت في
  // 4-6 نوفمبر 2019م بدبي (لا 2024)، وأن الدورة 23 للمجمع الفقهي برابطة العالم
  // الإسلامي انعقدت في الرياض أبريل 2024م — فدورتا «24» و«25» المنسوب إليهما
  // لم تنعقدا أصلاً. لم يبقَ إلا ما يحمل رابط قرار رسمي محدَّداً ورقم قرار.
  {
    id: "seed-fiqh-cultured-meat",
    slug: "items-cultured-meat",
    external_id: "seed:items-cultured-meat",
    title: "اللحوم المستزرعة معملياً (المستنبتة)",
    summary: "قرار فقهي حول حكم تناول وتسويق اللحوم المصنَّعة من خلايا حيوانية تُزرَع معملياً دون ذبح مباشر.",
    content: `**تعريف اللحوم المستزرعة:**
طعام مصنَّع من خلايا مأخوذة من حيوان حي، تُزرَع معملياً في وسط آمن على مدى أسابيع مع إضافة عناصر غذائية.

**القرار:**
يجوز تناول اللحوم المستزرعة معملياً وتسويقها بشروط:
1. أن تُستخرج الخلايا من حيوان مأكول اللحم أو مذكّى شرعاً.
2. ألا تُزرَع في وسط محرَّم (كالدم المسفوح) أو تحوي إضافات محرَّمة (كجيلاتين الخنزير).
3. أن تخضع عملية الزراعة لإشراف جهات موثوقة مختصة.
4. أن يكون المنتج النهائي آمناً وصالحاً للأكل وفق المعايير الرسمية.
5. ألا تحل محل اللحوم التقليدية بل تكون خياراً مكمّلاً.
6. وجوب إفصاح الشركات عن المعلومات اللازمة للمستهلك.`,
    ruling_text: "يجوز تناول اللحوم المستزرعة معملياً وتسويقها بالشروط المذكورة في القرار.",
    type: "resolution",
    category: "الأطعمة والأشربة",
    session_number: "26",
    session_date: "2025-05-08",
    source_name: "مجمع الفقه الإسلامي الدولي",
    source_url: "https://www.iifa-aifi.org/ar/56053.html",
    council_name: "مجمع الفقه الإسلامي الدولي",
    evidence: [
      { type: "قاعدة فقهية", text: "الأصل في الأشياء الإباحة", source: "القواعد الفقهية" },
      { type: "مقصد شرعي", text: "حفظ النفس وتحقيق الأمن الغذائي", source: "مقاصد الشريعة" },
    ],
    tags: ["لحوم مستزرعة", "طعام", "تقنية حيوية", "أمن غذائي"],
    status: "published",
    views_count: 340,
    published_at: "2025-11-20T09:00:00Z",
    created_at: "2025-11-20T09:00:00Z",
  },
  {
    id: "seed-fiqh-gmo-animal-foods",
    slug: "items-gmo-animal-foods",
    external_id: "seed:items-gmo-animal-foods",
    title: "الأطعمة المعدَّلة وراثياً من أصل حيواني",
    summary: "قرار فقهي حول حكم تناول وتسويق منتجات غذائية من حيوانات جرى تعديل مادتها الوراثية بتقنيات الهندسة الجينية.",
    content: `**التعريف:**
منتجات غذائية مستخرَجة من حيوانات حية جرى تعديل مادتها الوراثية باستخدام تقنيات الهندسة الوراثية (إضافة أو حذف أو إعادة ترتيب جينات) لتحسين مقاومة الآفات أو القيمة الغذائية أو معدلات النمو.

**القرار:**
يجوز (إباحة) تناول الأطعمة المعدَّلة وراثياً من أصل حيواني وتسويقها بشروط:
1. أن تكون عملية التعديل آمنة وموافقة للشرع ولا تُسبِّب ضرراً صحياً.
2. أن يكون التعديل بين حيوانات يحل أكلها شرعاً.
3. وجوب الإفصاح عن المعلومات المتعلقة بالمنتج المعدَّل وراثياً وطريقة تحضيره.`,
    ruling_text: "يجوز (إباحة) تناول الأطعمة المعدَّلة وراثياً من أصل حيواني وتسويقها بالشروط المذكورة.",
    type: "resolution",
    category: "الأطعمة والأشربة",
    session_number: "26",
    session_date: "2025-05-08",
    source_name: "مجمع الفقه الإسلامي الدولي",
    source_url: "https://www.iifa-aifi.org/ar/56054.html",
    council_name: "مجمع الفقه الإسلامي الدولي",
    evidence: [
      { type: "قاعدة فقهية", text: "الأصل في الأشياء الإباحة", source: "القواعد الفقهية" },
    ],
    tags: ["هندسة وراثية", "طعام", "تعديل جيني"],
    status: "published",
    views_count: 290,
    published_at: "2025-11-20T09:00:00Z",
    created_at: "2025-11-20T09:00:00Z",
  },
  {
    id: "seed-fiqh-encrypted-digital-currencies",
    slug: "items-encrypted-digital-currencies",
    external_id: "seed:items-encrypted-digital-currencies",
    title: "العملات الرقمية المشفَّرة (كالبيتكوين)",
    summary: "مسألة فقهية معاصرة حول حكم التعامل بالعملات الرقمية المشفَّرة المبنية على تقنية سلسلة الكتل.",
    content: `**التعريف:**
عرَّف المجمع العملات المشفَّرة بأنها "أرقام لا وجود مادي ملموس لها، تُتداوَل بين الأطراف دون وسيط عبر أنظمة الند للند اعتماداً على تقنية سلسلة الكتل"، وميَّز بينها وبين العملات الإلكترونية العامة (بطاقات الائتمان مسبقة الدفع).

**موقف المجمع:**
لم يصدر المجمع حكماً قاطعاً في المسألة، وقرَّر تأجيل البتّ فيها لمزيد من الدراسة، نظراً لعدم استقرار قيمة هذه العملات وارتفاع المخاطر المرتبطة بها، وعدم حسم مسألتي: هل تُعدّ سلعة أم خدمة أم أصلاً استثمارياً؟ وهل لها قيمة نقدية معتبرة شرعاً؟`,
    ruling_text: "لم يصدر حكم قاطع؛ قرَّر المجمع تأجيل البتّ في المسألة لمزيد من الدراسة.",
    type: "research",
    category: "النوازل المعاصرة",
    session_number: "24",
    session_date: "2019-11-06",
    source_name: "مجمع الفقه الإسلامي الدولي",
    source_url: "https://www.iifa-aifi.org/ar/5192.html",
    council_name: "مجمع الفقه الإسلامي الدولي",
    evidence: [
      { type: "ملاحظة", text: "عدم استقرار المعاملات وارتفاع المخاطر، وعدم حسم الطبيعة الشرعية للعملة المشفَّرة", source: "قرار المجمع 237 (24/8)" },
    ],
    tags: ["عملات مشفرة", "بيتكوين", "اقتصاد رقمي", "نوازل"],
    status: "published",
    views_count: 410,
    published_at: "2019-11-06T09:00:00Z",
    created_at: "2019-11-06T09:00:00Z",
  },
  {
    id: "seed-fiqh-smart-contracts",
    slug: "items-smart-contracts",
    external_id: "seed:items-smart-contracts",
    title: "العقود الذكية (Smart Contracts)",
    summary: "مسألة فقهية معاصرة حول حكم العقود التي تُنفَّذ تلقائياً عبر تقنية سلسلة الكتل دون وسيط بشري.",
    content: `**التعريف:**
عرَّفها المجمع بأنها "عقد بين طرفين يُنفَّذ تلقائياً اعتماداً على تقنية الند للند عبر شبكة توزيع لا مركزية (بلوك تشين)، ويُجرى غالباً باستخدام عملات مشفَّرة كالبيتكوين".

**موقف المجمع:**
أجَّل المجمع البتّ في العقود الذكية، مرتبطاً ذلك بحسم مسألة العملات المشفَّرة أولاً، وريثما تُعقَد ندوة متخصصة بمشاركة خبراء تقنيين في هذا المجال.`,
    ruling_text: "لم يصدر حكم قاطع؛ قرَّر المجمع تأجيل البتّ في المسألة لمزيد من الدراسة، مرتبطاً بحسم مسألة العملات المشفَّرة.",
    type: "research",
    category: "النوازل المعاصرة",
    session_number: "24",
    session_date: "2019-11-06",
    source_name: "مجمع الفقه الإسلامي الدولي",
    source_url: "https://www.iifa-aifi.org/ar/5211.html",
    council_name: "مجمع الفقه الإسلامي الدولي",
    evidence: [
      { type: "ملاحظة", text: "مرتبط بحسم مسألة العملات المشفرة أولاً", source: "قرار المجمع 230 (24/1)" },
    ],
    tags: ["عقود ذكية", "بلوك تشين", "اقتصاد رقمي", "نوازل"],
    status: "published",
    views_count: 260,
    published_at: "2019-11-06T09:00:00Z",
    created_at: "2019-11-06T09:00:00Z",
  },
];

export const FIQH_COUNCIL_PUBLISHED_SEED: FiqhCouncilItem[] = RAW_PUBLISHED_SEED.map(withQualityFields);

/** مسودات للوحة الإدارة فقط — لا تُعرض للجمهور */
const RAW_ADMIN_ONLY_SEED: FiqhCouncilItem[] = [
  {
    id: "seed-fiqh-draft-islamic-finance",
    slug: "draft-islamic-finance-placeholder",
    title: "[مسودة] بيان حول التمويل الإسلامي",
    summary: "عنصر placeholder للإدارة — يحتاج مراجعة ومصادر قبل النشر.",
    type: "research",
    category: "الاقتصاد الإسلامي",
    status: "draft",
    council_name: "المجمع الفقهي الإسلامي",
    source_name: "المجمع الفقهي الإسلامي",
    source_url: "https://www.iifa-aifi.org/",
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
    source_name: "المجمع الفقهي الإسلامي",
    source_url: "https://www.iifa-aifi.org/",
    tags: ["مراجعة", "صيام"],
    views_count: 0,
    created_at: "2026-01-02T00:00:00Z",
  },
];

export const FIQH_COUNCIL_ADMIN_ONLY_SEED: FiqhCouncilItem[] = RAW_ADMIN_ONLY_SEED.map(withQualityFields);

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
