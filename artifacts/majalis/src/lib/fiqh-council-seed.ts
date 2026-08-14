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
  //
  // ملاحظة تدقيق ثانية (٢٠٢٦-٠٧-٢٧): قوبل كلُّ عنصرٍ بصفحة قراره الرسمية على
  // iifa-aifi.org، فأُضيف `decision_number` للأربعة (265 (10/26) و266 (11/26)
  // و237 (24/8) و230 (24/1))، ورُدَّت التعريفاتُ والشروطُ إلى نصّها الحرفيّ:
  // كان الشرط الأول في اللحوم المستزرعة «من حيوان مأكول اللحم أو مذكّى شرعاً»
  // وقد سقط منه قيدا «إذا كان حيًّا» و«فيما تشترط له الذكاة»، وكان تعريفُ
  // العملات المشفَّرة والعقود الذكية معروضاً بين علامتي اقتباس بلفظٍ غيرِ لفظ
  // القرار. وحُذفت من العنصرين الإداريين نسبتُهما إلى «المجمع الفقهي الإسلامي»
  // برابط مجمع الفقه الإسلامي الدولي (جهتان مختلفتان) وهما placeholder بلا مصدر.
  {
    id: "seed-fiqh-cultured-meat",
    slug: "items-cultured-meat",
    external_id: "seed:items-cultured-meat",
    title: "اللحوم المستزرعة معملياً (المستنبتة)",
    summary: "قرار مجمع الفقه الإسلامي الدولي رقم 265 (10/26) في دورته السادسة والعشرين بالدوحة (4-8 مايو 2025م): إباحة تناول اللحوم المستزرعة معملياً وتسويقها بستة شروط، أهمُّها استخلاص الخلايا من حيوان مباح الأكل وعدم استزراعها في وسط محرَّم.",
    content: `**تعريف اللحوم المستزرعة (بنصّ القرار):**
«اللحوم المستزرَعة: غذاء مُصنّعٌ من خلايا تؤخذ من حيوان حي في الغالب، ثم تُزرع في مختبر آمِنٍ على مدار أسابيع بإضافة عناصر غذائية أساسية كالجلكوز، والفيتامينات، والأملاح غير العضوية، وغيرها، وتُعرف بـاللحوم المنتجة مخبريًا، أو اللحوم المصنعة، أو اللحوم المستنبتة، أو اللحوم النظيفة».

**القرار:**
يجوز تناول اللحوم المستزرعة معملياً وتسويقها بالشروط الآتية بنصّها في القرار:
1. «أن تستخلص الخلايا من حيوان مباح الأكل إذا كان حيًّا، أو من حيوان مذكى ذكاة شرعيَّة فيما تشترط له الذكاة».
2. «ألا تستزرع في وسط محرم كدمٍ مسفوح، وألّا يضاف لها ما هو محرم كالجلاتين المستخرج من الخنزير».
3. «أن تُجرى عملية الاستزراع في مراحلها كافة تحت إشراف جهة مختصة موثوقة».
4. «أن يكون المنتج النهائي صالحًا للأكل وغير مضر بالصحة، وفقًا للمعايير والإجراءات التي تضعها الجهات المختصة».
5. «ألّا تكون اللحوم المستزرعة بديلًا عن لحوم الحيوان، وتجوز الاستفادة منها إلى جانب اللحم الحيواني توسعة على المستهلكين».
6. «أن تُفصح الشركات عن المعلومات اللازمة للمستهلكين بما يحقق الضوابط الواردة في البند السابق، وعلى الجهات الإشرافية التحقق من التزامها بهذه الضوابط».`,
    ruling_text: "يجوز تناول اللحوم المستزرعة معملياً وتسويقها بالشروط الستة المذكورة في القرار.",
    type: "resolution",
    category: "الأطعمة والأشربة",
    session_number: "26",
    session_date: "2025-05-08",
    decision_number: "265 (10/26)",
    source_name: "مجمع الفقه الإسلامي الدولي",
    source_url: "https://www.iifa-aifi.org/ar/56053.html",
    council_name: "مجمع الفقه الإسلامي الدولي",
    evidence: [
      { type: "قاعدة فقهية", text: "الأصل في الأشياء الإباحة", source: "القواعد الفقهية" },
      { type: "مقصد شرعي", text: "حفظ النفس وتحقيق الأمن الغذائي", source: "مقاصد الشريعة" },
    ],
    tags: ["لحوم مستزرعة", "طعام", "تقنية حيوية", "أمن غذائي"],
    status: "published",
    confidence_level: "source_verified",
    documentation_level: "official_verified",
    views_count: 340,
    published_at: "2025-11-20T09:00:00Z",
    created_at: "2025-11-20T09:00:00Z",
  },
  {
    id: "seed-fiqh-gmo-animal-foods",
    slug: "items-gmo-animal-foods",
    external_id: "seed:items-gmo-animal-foods",
    title: "الأطعمة المعدَّلة وراثياً من أصل حيواني",
    summary: "قرار مجمع الفقه الإسلامي الدولي رقم 266 (11/26) في دورته السادسة والعشرين بالدوحة (4-8 مايو 2025م): إباحة استهلاك الأغذية المحوَّرة وراثياً من أصل حيواني بثلاثة شروط: سلامة طريقة التحوير، وكون التحوير بين حيوانين يباح أكلهما، والإفصاح عن المعلومات.",
    content: `**التعريف:**
منتجات غذائية تُستخلص من حيوانات جرى تحوير مادتها الوراثية باستخدام تقنيات الهندسة الوراثية.

**القرار:**
يباح استهلاك الأغذية المحوَّرة وراثياً من أصل حيواني بالشروط الآتية بنصّها في القرار:
1. «أن تتم عملية التحوير بطرق آمنة، غير مخالفة للشرع، وغير مضرة بالصحة».
2. «أن يكون التحوير بين حيوانين يباح أكلهما شرعًا».
3. «أن يفصح عن اللازم من معلومات الغذاء المحور وراثيًا وآلية إعداده».`,
    ruling_text: "يباح استهلاك الأغذية المحوَّرة وراثياً من أصل حيواني بالشروط الثلاثة المذكورة في القرار.",
    type: "resolution",
    category: "الأطعمة والأشربة",
    session_number: "26",
    session_date: "2025-05-08",
    decision_number: "266 (11/26)",
    source_name: "مجمع الفقه الإسلامي الدولي",
    source_url: "https://www.iifa-aifi.org/ar/56054.html",
    council_name: "مجمع الفقه الإسلامي الدولي",
    evidence: [
      { type: "قاعدة فقهية", text: "الأصل في الأشياء الإباحة", source: "القواعد الفقهية" },
    ],
    tags: ["هندسة وراثية", "طعام", "تعديل جيني"],
    status: "published",
    confidence_level: "source_verified",
    documentation_level: "official_verified",
    views_count: 290,
    published_at: "2025-11-20T09:00:00Z",
    created_at: "2025-11-20T09:00:00Z",
  },
  {
    id: "seed-fiqh-encrypted-digital-currencies",
    slug: "items-encrypted-digital-currencies",
    external_id: "seed:items-encrypted-digital-currencies",
    title: "العملات الرقمية المشفَّرة (كالبيتكوين)",
    summary: "قرار مجمع الفقه الإسلامي الدولي رقم 237 (24/8) في دورته الرابعة والعشرين بدبي (4-6 نوفمبر 2019م) بشأن العملات الإلكترونية: لم يصدر حكم قاطع، وأوصى المجلس بمزيد من البحث والدراسة للقضايا المؤثرة في الحكم.",
    content: `**التعريف:**
عرَّف القرار العملات الرقمية المرمَّزة (المشفَّرة) بأنها «أرقام مشفرة، وليس لها كيان مادي ملموس، أو وجود فيزيائي، ويتم تداولها بين أطراف التعامل بدون وسيط».
وفرَّق بينها وبين مفهوم العملات الإلكترونية العام: «حيث إن مفهوم العملات الإلكترونية عام يشمل بطاقات الائتمان، وبطاقات مسبقة الدفع، والشيكات الإلكترونية وغيرها، وبناء على ذلك انتهت المناقشات إلى استعمال مصطلح العملات الرقمية المرمزة (المشفرة)».

**موقف المجمع:**
لم يصدر المجمع حكماً قاطعاً في المسألة، ونصَّ قراره على أنه: «نظرًا لما سبق ولما يكتنف هذه العملات من مخاطر عظيمة وعدم استقرار التعامل بها؛ فإن المجلس يوصي بمزيد من البحث والدراسة للقضايا المؤثرة في الحكم».`,
    ruling_text: "لم يصدر حكم قاطع؛ أوصى المجمع بمزيد من البحث والدراسة للقضايا المؤثرة في الحكم.",
    type: "research",
    category: "النوازل المعاصرة",
    session_number: "24",
    session_date: "2019-11-06",
    decision_number: "237 (24/8)",
    source_name: "مجمع الفقه الإسلامي الدولي",
    source_url: "https://www.iifa-aifi.org/ar/5192.html",
    council_name: "مجمع الفقه الإسلامي الدولي",
    evidence: [
      { type: "ملاحظة", text: "ما يكتنف هذه العملات من مخاطر عظيمة وعدم استقرار التعامل بها", source: "قرار المجمع 237 (24/8)" },
    ],
    tags: ["عملات مشفرة", "بيتكوين", "اقتصاد رقمي", "نوازل"],
    status: "published",
    confidence_level: "source_verified",
    documentation_level: "official_verified",
    views_count: 410,
    published_at: "2019-11-06T09:00:00Z",
    created_at: "2019-11-06T09:00:00Z",
  },
  {
    id: "seed-fiqh-smart-contracts",
    slug: "items-smart-contracts",
    external_id: "seed:items-smart-contracts",
    title: "العقود الذكية (Smart Contracts)",
    summary: "قرار مجمع الفقه الإسلامي الدولي رقم 230 (24/1) في دورته الرابعة والعشرين بدبي (4-6 نوفمبر 2019م) بشأن العقود الذكية: تأجيل البتّ في الموضوع إلى حين عقد ندوة متخصصة، وبعد البتّ في موضوع العملات المرمزة (المشفرة).",
    content: `**التعريف:**
عرَّفها القرار بأنها «عقد بين طرفين ينفذ تلقائيًا يقوم على فكرة الند للند Peer to peer (بدون وسيط) من خلال شبكة توزيع لا مركزية (سلسة الكتل Block chain) ويتم بالعملات المرمزة (المشفرة) مثل البيتكوين وغيرها».

**موقف المجمع:**
نصَّ القرار على أنه: «قرر المجمع تأجيل البت في الموضوع إلى حين عقد ندوة متخصصة في العقود الذكية، وبعد البتّ في موضوع العملات المرمزة (المشفرة) وذلك لدراسة كافة جوانب العقود الذكية مع التركيز على ما ورد في الفقرة ثانيًا، ويستحسن دعوة متخصصين تقنيين في البلوك شين والعملات المرمزة (المشفرة)، وغيرها».`,
    ruling_text: "لم يصدر حكم قاطع؛ قرَّر المجمع تأجيل البتّ في الموضوع إلى حين عقد ندوة متخصصة في العقود الذكية، وبعد البتّ في موضوع العملات المرمزة (المشفرة).",
    type: "research",
    category: "النوازل المعاصرة",
    session_number: "24",
    session_date: "2019-11-06",
    decision_number: "230 (24/1)",
    source_name: "مجمع الفقه الإسلامي الدولي",
    source_url: "https://www.iifa-aifi.org/ar/5211.html",
    council_name: "مجمع الفقه الإسلامي الدولي",
    evidence: [
      { type: "ملاحظة", text: "التأجيل مرتبط بالبتّ في موضوع العملات المرمزة (المشفرة) وبعقد ندوة متخصصة", source: "قرار المجمع 230 (24/1)" },
    ],
    tags: ["عقود ذكية", "بلوك تشين", "اقتصاد رقمي", "نوازل"],
    status: "published",
    confidence_level: "source_verified",
    documentation_level: "official_verified",
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
    summary: "عنصر placeholder للوحة الإدارة فقط، لا يُعرض للجمهور — لا مصدر له بعد، ويحتاج نصّ قرار موثَّقاً برقمه ودورته وجهته قبل النشر.",
    type: "research",
    category: "الاقتصاد الإسلامي",
    status: "draft",
    tags: ["مسودة", "تمويل"],
    views_count: 0,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "seed-fiqh-review-fasting-travel",
    slug: "review-fasting-travel-placeholder",
    title: "[قيد المراجعة] أحكام الصيام للمسافر",
    summary: "عنصر placeholder للوحة الإدارة فقط، لا يُعرض للجمهور — بانتظار اعتماد المراجع، ولا مصدر موثَّقاً له بعد.",
    type: "fatwa",
    category: "العبادات",
    status: "needs_review",
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
