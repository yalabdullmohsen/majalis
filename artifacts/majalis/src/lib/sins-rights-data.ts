import type { SinTopic, SinCategoryDef } from "./sins-rights-types";

// ──────────────────────────────────────────────────────────────────────────────
// بيانات موضوعات الذنوب والحقوق
// المحتوى الشرعي مستند إلى القرآن الكريم والسنة النبوية الصحيحة وأقوال أهل العلم
// حالة المراجعة: reviewed = مراجع ومعتمد | pending = قيد المراجعة الشرعية
// ──────────────────────────────────────────────────────────────────────────────

export const SINS_TOPICS: SinTopic[] = [
  // ─── حقوق الله ──────────────────────────────────────────────────────────────
  {
    id: "tark-salah",
    slug: "tark-salah",
    title: "ترك الصلاة",
    shortDescription: "ترك ركن من أركان الإسلام الخمسة عمداً من غير عذر شرعي.",
    rightsCategory: "allah",
    sinSeverity: "kabira",
    sinType: "ibadi",
    quranEvidence: [
      {
        text: "فَخَلَفَ مِن بَعْدِهِمْ خَلْفٌ أَضَاعُوا الصَّلَاةَ وَاتَّبَعُوا الشَّهَوَاتِ فَسَوْفَ يَلْقَوْنَ غَيًّا",
        source: "سورة مريم: 59",
      },
    ],
    hadithEvidence: [
      {
        text: "بين الرجل وبين الشرك والكفر ترك الصلاة",
        source: "رواه مسلم",
        grade: "صحيح",
      },
      {
        text: "العهد الذي بيننا وبينهم الصلاة، فمن تركها فقد كفر",
        source: "رواه الترمذي والنسائي وابن ماجه",
        grade: "صحيح",
      },
    ],
    explanation: "الصلاة عمود الدين وأول ما يُحاسَب عليه العبد يوم القيامة. تركها عمداً كبيرة عظيمة، والعلماء متفقون على وجوبها وعلى أن تاركها إثمٌ عظيم.",
    effects: [
      "محرومية من بركة الوقت والرزق",
      "ضعف الصلة بالله وانكشاف الحجاب",
      "تعريض النفس لغضب الله وعقوبته",
      "إضاعة الركن الثاني من أركان الإسلام",
    ],
    repentanceConditions: {
      general: [
        "الإقلاع فوراً والمحافظة على الصلوات في أوقاتها",
        "الندم الصادق على ما فات",
        "العزم الجازم على عدم العودة إلى الترك",
        "الإكثار من التطوع جبراً لما فات — والصلوات الفائتة: اختلف العلماء في قضائها وينبغي سؤال أهل العلم",
      ],
      requiresRestitution: false,
      requiresForgiveness: false,
      hasExpiation: false,
    },
    commonMistakes: [
      "الاعتقاد بأن التوبة تكفي دون استئناف الصلاة فوراً",
      "تأجيل التوبة إلى وقت الشيخوخة",
    ],
    relatedSlugs: ["riyaa", "tark-sawm"],
    references: ["صحيح مسلم", "سنن الترمذي"],
    reviewStatus: "reviewed",
    reviewedAt: "2026-07",
  },
  {
    id: "riyaa",
    slug: "riyaa",
    title: "الرياء",
    shortDescription: "إظهار العبادة للناس ابتغاء المدح والثناء لا إخلاصاً لله.",
    rightsCategory: "allah",
    sinSeverity: "kabira",
    sinType: "qalbi",
    quranEvidence: [
      {
        text: "فَمَن كَانَ يَرْجُو لِقَاءَ رَبِّهِ فَلْيَعْمَلْ عَمَلًا صَالِحًا وَلَا يُشْرِكْ بِعِبَادَةِ رَبِّهِ أَحَدًا",
        source: "سورة الكهف: 110",
      },
    ],
    hadithEvidence: [
      {
        text: "إن أخوف ما أخاف عليكم الشرك الأصغر، قالوا: وما الشرك الأصغر يا رسول الله؟ قال: الرياء",
        source: "رواه أحمد، وصححه الألباني",
        grade: "صحيح",
      },
    ],
    explanation: "الرياء هو العمل لغير الله من الخلق، وهو من الشرك الأصغر المنافي لكمال التوحيد. يُبطل العمل ويُحبطه.",
    effects: [
      "إحباط العمل الصالح وعدم قبوله",
      "إفساد القلب وانتكاسه عن الله",
      "التعرض للفضيحة في الدنيا والآخرة",
    ],
    repentanceConditions: {
      general: [
        "مراقبة النية وتجديدها في كل عمل",
        "الندم الصادق على العمل الذي كان بالرياء",
        "الإخلاص لله في الأعمال المستقبلة",
        "الإكثار من الدعاء والتضرع بطلب الإخلاص",
      ],
      requiresRestitution: false,
      requiresForgiveness: false,
      hasExpiation: false,
    },
    commonMistakes: [
      "الخلط بين الرياء والسمعة — الرياء: العمل من أجل الناس، السمعة: التحدث بالعمل بعده",
      "الاعتقاد بأن الرياء الخفي لا يضر ما لم يُظهر",
    ],
    relatedSlugs: ["kibr", "ujb"],
    references: ["مسند أحمد", "فتح الباري لابن حجر"],
    reviewStatus: "reviewed",
    reviewedAt: "2026-07",
  },
  {
    id: "kibr",
    slug: "kibr",
    title: "الكبر",
    shortDescription: "احتقار الناس ورفض الحق بطراً وغروراً.",
    rightsCategory: "allah",
    sinSeverity: "kabira",
    sinType: "qalbi",
    quranEvidence: [
      {
        text: "إِنَّهُ لَا يُحِبُّ الْمُسْتَكْبِرِينَ",
        source: "سورة النحل: 23",
      },
    ],
    hadithEvidence: [
      {
        text: "لا يدخل الجنة من كان في قلبه مثقال ذرة من كبر، قالوا: يا رسول الله، إن الرجل يحب أن يكون ثوبه حسناً ونعله حسنة، قال: إن الله جميل يحب الجمال، الكبر بطر الحق وغمط الناس",
        source: "رواه مسلم",
        grade: "صحيح",
      },
    ],
    explanation: "الكبر من أشد أمراض القلب وأخطرها؛ وهو بطر الحق وغمط الناس: أي رفض الحق واحتقار الناس. وهو من الذنوب التي تتعلق بحق الله لأن الكبرياء رداء الله.",
    effects: [
      "الحرمان من الجنة إن مات عليه",
      "إفساد العلاقات وإيذاء الناس",
      "إغلاق القلب عن قبول الحق والهدى",
    ],
    repentanceConditions: {
      general: [
        "التواضع لله والخلق عملاً واعتقاداً",
        "الندم على ما مضى من التكبر",
        "التصالح مع من أُهين أو احتُقر إن أمكن",
        "الإكثار من ذكر الله والتأمل في ضعف النفس",
      ],
      requiresRestitution: false,
      requiresForgiveness: true,
      forgivenessDetails: "إن كان الكبر سبب إيذاء أحد بالقول أو الفعل وجب الاستحلال منه",
      hasExpiation: false,
    },
    commonMistakes: [
      "الخلط بين الكبر والاعتزاز بالنفس",
      "الاعتقاد بأن الكبر لا يكون إلا بالقول الصريح",
    ],
    relatedSlugs: ["riyaa", "hasad"],
    references: ["صحيح مسلم", "إحياء علوم الدين للغزالي"],
    reviewStatus: "reviewed",
    reviewedAt: "2026-07",
  },
  {
    id: "hasad",
    slug: "hasad",
    title: "الحسد",
    shortDescription: "تمني زوال النعمة عن الغير.",
    rightsCategory: "allah",
    sinSeverity: "kabira",
    sinType: "qalbi",
    quranEvidence: [
      {
        text: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
        source: "سورة الفلق: 5",
      },
    ],
    hadithEvidence: [
      {
        text: "إياكم والحسد فإن الحسد يأكل الحسنات كما تأكل النار الحطب",
        source: "رواه أبو داود",
        grade: "حسن",
      },
    ],
    explanation: "الحسد هو تمني زوال نعمة الغير، وهو محرم بالإجماع، ويختلف عن الغبطة التي هي تمني مثلها دون زوالها عن صاحبها.",
    effects: [
      "إحراق الحسنات وإذهابها",
      "إضعاف النفس وتعبيدها للشيطان",
      "الإيذاء المعنوي لصاحب النعمة",
    ],
    repentanceConditions: {
      general: [
        "الاعتراف بالذنب وكراهته",
        "الدعاء للمحسود ومحبة الخير له",
        "شكر الله على نعمه",
        "مقاومة الحسد بذكر الله واستحضار رحمته في توزيع الرزق",
      ],
      requiresRestitution: false,
      requiresForgiveness: false,
      hasExpiation: false,
    },
    commonMistakes: [
      "الخلط بين الحسد والغبطة — الغبطة مباحة بل محمودة في الخير",
      "الاعتقاد بأن مجرد الإحساس بالحسد لا يؤاخذ عليه — لا يؤاخذ عليه ما لم يعمل به",
    ],
    relatedSlugs: ["kibr", "ghibah"],
    references: ["سنن أبي داود", "شرح رياض الصالحين للعثيمين"],
    reviewStatus: "reviewed",
    reviewedAt: "2026-07",
  },

  // ─── حقوق العباد — الأموال ────────────────────────────────────────────────
  {
    id: "sariqa",
    slug: "sariqa",
    title: "السرقة",
    shortDescription: "أخذ مال الغير خفية من حرزه بغير حق.",
    rightsCategory: "shared",
    sinSeverity: "kabira",
    sinType: ["mali", "badani"],
    quranEvidence: [
      {
        text: "وَالسَّارِقُ وَالسَّارِقَةُ فَاقْطَعُوا أَيْدِيَهُمَا جَزَاءً بِمَا كَسَبَا نَكَالًا مِّنَ اللَّهِ",
        source: "سورة المائدة: 38",
      },
    ],
    hadithEvidence: [
      {
        text: "لعن الله السارق يسرق البيضة فتقطع يده، ويسرق الحبل فتقطع يده",
        source: "متفق عليه",
        grade: "صحيح",
      },
    ],
    explanation: "السرقة من كبائر الذنوب وتجتمع فيها جهتان: جهة مخالفة أمر الله، وجهة الاعتداء على حق العبد المالي. والتوبة منها لا تكتمل بالاستغفار وحده دون رد المسروق.",
    effects: [
      "حق صاحب المال الذي انتُهك",
      "إشاعة الخوف وانعدام الأمن في المجتمع",
      "العقوبة الشرعية للسارق إذا استوفت شروط إقامة الحد",
    ],
    repentanceConditions: {
      general: [
        "الإقلاع التام عن السرقة",
        "الندم الصادق",
        "العزم على عدم العودة",
        "رد المال المسروق إلى صاحبه أو ورثته",
      ],
      requiresRestitution: true,
      restitutionDetails: "يجب رد المال المسروق كله إلى صاحبه. فإن تعذر الوصول إليه أُعطي لورثته. فإن تعذر أيضاً تُصُدِّق به عنه بنية البراءة — وهذه مسألة يستحسن سؤال أهل العلم فيها.",
      requiresForgiveness: true,
      forgivenessDetails: "يستحسن طلب العفو من صاحب المال إذا أمكن دون مفسدة أكبر.",
      hasExpiation: false,
      ifOwnerUnreachable: "إن تعذر الوصول إلى صاحب المال أو ورثته، تُصُدِّق بالمبلغ بنية أنه عن صاحبه. وينبغي سؤال عالم موثوق في تفاصيل مسألته.",
    },
    commonMistakes: [
      "الاعتقاد بأن الاستغفار وحده يكفي مع بقاء المال مسروقاً",
      "الخلط بين رد المال وطلب العفو — هما أمران مستقلان",
    ],
    relatedSlugs: ["ghasb", "dain", "khiyana-amana"],
    references: ["صحيح البخاري", "صحيح مسلم", "المغني لابن قدامة"],
    reviewStatus: "reviewed",
    reviewedAt: "2026-07",
  },
  {
    id: "ghasb",
    slug: "ghasb",
    title: "الغصب",
    shortDescription: "أخذ مال الغير أو العقار قهراً وعلناً بغير حق.",
    rightsCategory: "shared",
    sinSeverity: "kabira",
    sinType: "mali",
    quranEvidence: [
      {
        text: "وَلَا تَأْكُلُوا أَمْوَالَكُم بَيْنَكُم بِالْبَاطِلِ",
        source: "سورة البقرة: 188",
      },
    ],
    hadithEvidence: [
      {
        text: "من أخذ شبراً من الأرض ظلماً طُوِّقَه من سبع أرضين",
        source: "متفق عليه",
        grade: "صحيح",
      },
    ],
    explanation: "الغصب أشد وضوحاً من السرقة لأنه علني قهري. وحكمه في رد الحق مثلها، بل ذكر العلماء أن الغاصب يضمن المال حتى في حالة هلاكه.",
    effects: [
      "تعريض النفس للعقوبة الإلهية الشديدة",
      "ظلم صاحب الحق والاعتداء عليه",
    ],
    repentanceConditions: {
      general: [
        "رد المغصوب إلى صاحبه بعينه إن كان موجوداً",
        "إن تلف المغصوب وجب رد مثله أو قيمته",
        "الندم والعزم على عدم العودة",
      ],
      requiresRestitution: true,
      restitutionDetails: "يجب رد العين المغصوبة أو مثلها أو قيمتها عند التلف. وهذا واجب شرعي لا تصح التوبة دون الوفاء به.",
      requiresForgiveness: true,
      forgivenessDetails: "يستحسن طلب عفو صاحب الحق بعد رد المال.",
      hasExpiation: false,
      ifOwnerUnreachable: "يُودَع المال لورثته، فإن تعذر تُصُدِّق به عنه.",
    },
    commonMistakes: [
      "الاعتقاد بمرور الزمن يسقط الحق المالي للمغصوب منه",
    ],
    relatedSlugs: ["sariqa", "dain"],
    references: ["صحيح البخاري", "صحيح مسلم"],
    reviewStatus: "reviewed",
    reviewedAt: "2026-07",
  },
  {
    id: "dain",
    slug: "dain",
    title: "الدَّيْن غير المُؤَدَّى",
    shortDescription: "التقصير في أداء الدين وتسويف سداده مع القدرة.",
    rightsCategory: "ibad",
    sinSeverity: "kabira",
    sinType: "mali",
    quranEvidence: [
      {
        text: "يَا أَيُّهَا الَّذِينَ آمَنُوا أَوْفُوا بِالْعُقُودِ",
        source: "سورة المائدة: 1",
      },
    ],
    hadithEvidence: [
      {
        text: "نفس المؤمن معلقة بدينه حتى يُقضى عنه",
        source: "رواه الترمذي",
        grade: "صحيح",
      },
      {
        text: "مطل الغني ظلم",
        source: "متفق عليه",
        grade: "صحيح",
      },
    ],
    explanation: "الدين أمانة في الذمة تستوجب السداد. والتقصير مع القدرة ظلم صريح. أما المعسر فله نظرة إلى الميسرة كما قال الله تعالى.",
    effects: [
      "تعليق نفس الميت بدينه حتى يُقضى عنه",
      "إيذاء صاحب الحق المالي",
      "إشاعة الخيانة وفقدان الثقة",
    ],
    repentanceConditions: {
      general: [
        "السعي في سداد الدين بأسرع وقت ممكن",
        "إخبار الدائن بالحال إن كان معسراً",
        "العزم على عدم الاستدانة فيما لا يُطاق",
      ],
      requiresRestitution: true,
      restitutionDetails: "يجب سداد الدين كاملاً. فإن مات قبله وجب سداده من التركة قبل توزيعها على الورثة.",
      requiresForgiveness: true,
      forgivenessDetails: "يُستحسن طلب إبراء ذمة من الدائن إن كان المدين عاجزاً عن السداد.",
      hasExpiation: false,
      ifOwnerUnreachable: "إن مات الدائن وجب سداد الدين لورثته.",
    },
    commonMistakes: [
      "الاعتقاد بأن الشهادة في سبيل الله تسقط الدين — الحديث الصحيح يستثني الدين",
    ],
    relatedSlugs: ["sariqa", "khiyana-amana"],
    references: ["صحيح البخاري", "سنن الترمذي"],
    reviewStatus: "reviewed",
    reviewedAt: "2026-07",
  },

  // ─── حقوق العباد — العرض والسمعة ────────────────────────────────────────
  {
    id: "ghibah",
    slug: "ghibah",
    title: "الغيبة",
    shortDescription: "ذكر الأخ بما يكره غائباً.",
    rightsCategory: "shared",
    sinSeverity: "kabira",
    sinType: "qawli",
    quranEvidence: [
      {
        text: "وَلَا يَغْتَب بَّعْضُكُم بَعْضًا أَيُحِبُّ أَحَدُكُمْ أَن يَأْكُلَ لَحْمَ أَخِيهِ مَيْتًا فَكَرِهْتُمُوهُ",
        source: "سورة الحجرات: 12",
      },
    ],
    hadithEvidence: [
      {
        text: "أتدرون ما الغيبة؟ قالوا: الله ورسوله أعلم، قال: ذكرك أخاك بما يكره، قيل: أفرأيت إن كان في أخي ما أقول؟ قال: إن كان فيه ما تقول فقد اغتبته، وإن لم يكن فيه فقد بهتَّه",
        source: "رواه مسلم",
        grade: "صحيح",
      },
    ],
    explanation: "الغيبة من أعظم الذنوب وأكثرها انتشاراً. وفيها جهتان: مخالفة نهي الله، والاعتداء على عرض الغير.",
    effects: [
      "انتهاك حرمة عرض المسلم",
      "نقل الحسنات من حساب صاحبها إلى حساب من اغتيب",
      "إفساد القلوب وتشويه العلاقات",
    ],
    repentanceConditions: {
      general: [
        "الإقلاع فوراً عن الغيبة",
        "الندم الصادق",
        "الاستغفار كثيراً للأخ الذي اغتيب",
        "ذكره بالخير حيث اغتيب قدر الإمكان",
      ],
      requiresRestitution: false,
      requiresForgiveness: true,
      forgivenessDetails: "اختلف العلماء: هل يجب الاستحلال؟ الأرجح عند أكثرهم أن يستغفر له ولا يُخبره إن كان في الإخبار مفسدة من إثارة عداوة أو أذى. وإن أمن المفسدة فالأفضل الاستحلال.",
      hasExpiation: false,
    },
    commonMistakes: [
      "الاعتقاد بأن الصدق يبرر الغيبة — الغيبة صادقة بالتعريف",
      "الخلط بين الغيبة المحرمة والنصيحة الواجبة والتحذير المشروع",
      "الاعتقاد بأن الاستغفار يكفي دون ترك الغيبة",
    ],
    relatedSlugs: ["namima", "qadhf", "kadhib"],
    references: ["صحيح مسلم", "رياض الصالحين للنووي"],
    reviewStatus: "reviewed",
    reviewedAt: "2026-07",
  },
  {
    id: "namima",
    slug: "namima",
    title: "النميمة",
    shortDescription: "نقل الكلام بين الناس بقصد الإفساد والإيقاع.",
    rightsCategory: "shared",
    sinSeverity: "kabira",
    sinType: "qawli",
    quranEvidence: [
      {
        text: "وَلَا تُطِعْ كُلَّ حَلَّافٍ مَّهِينٍ هَمَّازٍ مَّشَّاءٍ بِنَمِيمٍ",
        source: "سورة القلم: 10-11",
      },
    ],
    hadithEvidence: [
      {
        text: "لا يدخل الجنة نمام",
        source: "متفق عليه",
        grade: "صحيح",
      },
    ],
    explanation: "النميمة من أشد الذنوب التأثيراً على المجتمع لأنها تُوقع العداوة بين المسلمين وتفسد ذات البين.",
    effects: [
      "إشعال العداوة والبغضاء بين الناس",
      "تدمير العلاقات الأسرية والاجتماعية",
      "الحرمان من الجنة ابتداءً إن لم يتب",
    ],
    repentanceConditions: {
      general: [
        "الكف الفوري عن النميمة",
        "الندم على ما أوقعه من فساد",
        "السعي في الإصلاح بين من أوقع بينهم",
      ],
      requiresRestitution: false,
      requiresForgiveness: true,
      forgivenessDetails: "يسعى في إصلاح ما أفسده بين الناس بالكلام الطيب والحكمة.",
      hasExpiation: false,
    },
    commonMistakes: [
      "الخلط بين النميمة والتحذير المشروع من الشرير",
    ],
    relatedSlugs: ["ghibah", "kadhib"],
    references: ["صحيح البخاري", "صحيح مسلم"],
    reviewStatus: "reviewed",
    reviewedAt: "2026-07",
  },
  {
    id: "qadhf",
    slug: "qadhf",
    title: "القذف",
    shortDescription: "اتهام المحصنات العفيفات بالزنا بغير بيِّنة.",
    rightsCategory: "shared",
    sinSeverity: "kabira",
    sinType: "qawli",
    quranEvidence: [
      {
        text: "إِنَّ الَّذِينَ يَرْمُونَ الْمُحْصَنَاتِ الْغَافِلَاتِ الْمُؤْمِنَاتِ لُعِنُوا فِي الدُّنْيَا وَالْآخِرَةِ وَلَهُمْ عَذَابٌ عَظِيمٌ",
        source: "سورة النور: 23",
      },
    ],
    hadithEvidence: [
      {
        text: "اجتنبوا السبع الموبقات... وقذف المحصنات المؤمنات الغافلات",
        source: "متفق عليه",
        grade: "صحيح",
      },
    ],
    explanation: "القذف من أعظم الكبائر لأنه يهدم شرف الإنسان وعرضه ويتضمن فرية عظيمة. والحد المقرر له ثمانون جلدة في الشريعة الإسلامية.",
    effects: [
      "هدم شرف المقذوف وعرضه",
      "عقوبة القاذف الشرعية",
      "اللعنة الإلهية في الدنيا والآخرة",
    ],
    repentanceConditions: {
      general: [
        "الرجوع عن الادعاء الكاذب والإعلان بكذبه",
        "طلب العفو من المقذوف",
        "الندم الصادق والإقلاع",
      ],
      requiresRestitution: false,
      requiresForgiveness: true,
      forgivenessDetails: "يجب الاستحلال من المقذوف لأن هذا من حقه.",
      hasExpiation: false,
    },
    commonMistakes: [
      "الاعتقاد بأن التوبة بعد القذف تسقط حد القذف — الحد لحق الآدمي ولا يسقط إلا بعفوه",
    ],
    relatedSlugs: ["ghibah", "kadhib"],
    references: ["صحيح البخاري", "صحيح مسلم", "المغني لابن قدامة"],
    reviewStatus: "reviewed",
    reviewedAt: "2026-07",
  },
  {
    id: "kadhib",
    slug: "kadhib",
    title: "الكذب",
    shortDescription: "الإخبار بخلاف الواقع عمداً.",
    rightsCategory: "shared",
    sinSeverity: "depends",
    sinType: "qawli",
    quranEvidence: [
      {
        text: "يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَكُونُوا مَعَ الصَّادِقِينَ",
        source: "سورة التوبة: 119",
      },
    ],
    hadithEvidence: [
      {
        text: "إياكم والكذب فإن الكذب يهدي إلى الفجور، وإن الفجور يهدي إلى النار",
        source: "متفق عليه",
        grade: "صحيح",
      },
    ],
    explanation: "الكذب كبيرة إذا تعلق بإيذاء الناس أو أخذ الحقوق، وقد يكون صغيرة في غير ذلك. وهو مع ذلك ينبغي الحذر منه دائماً لأنه يُفضي إلى الفجور.",
    effects: [
      "فساد الثقة بين الناس",
      "إيذاء من كُذب عليه",
      "تعريض النفس لطريق الفجور",
    ],
    repentanceConditions: {
      general: [
        "الكف عن الكذب",
        "التراجع عن الكذبة والإصلاح حيث أمكن",
        "إن ترتب على الكذب حق لآخر وجب رده",
      ],
      requiresRestitution: true,
      restitutionDetails: "إن كان الكذب سبب أخذ مال أو حق فيجب رده.",
      requiresForgiveness: true,
      forgivenessDetails: "يستحسن الاعتذار لمن أُضر بالكذب.",
      hasExpiation: false,
    },
    commonMistakes: [
      "الاعتقاد بأن الكذبة الصغيرة لا تضر",
      "الخلط بين الكذب المحرم والتورية المباحة",
    ],
    relatedSlugs: ["ghibah", "namima", "shahada-zur"],
    references: ["صحيح البخاري", "صحيح مسلم"],
    reviewStatus: "reviewed",
    reviewedAt: "2026-07",
  },

  // ─── حقوق معنوية واجتماعية ────────────────────────────────────────────────
  {
    id: "uquq-walidayn",
    slug: "uquq-walidayn",
    title: "عقوق الوالدين",
    shortDescription: "إيذاء الوالدين أو إهمال حقهما الواجب.",
    rightsCategory: "shared",
    sinSeverity: "kabira",
    sinType: ["qawli", "badani", "ijtimaaei"],
    quranEvidence: [
      {
        text: "وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا إِمَّا يَبْلُغَنَّ عِندَكَ الْكِبَرَ أَحَدُهُمَا أَوْ كِلَاهُمَا فَلَا تَقُل لَّهُمَا أُفٍّ وَلَا تَنْهَرْهُمَا وَقُل لَّهُمَا قَوْلًا كَرِيمًا",
        source: "سورة الإسراء: 23",
      },
    ],
    hadithEvidence: [
      {
        text: "ألا أنبئكم بأكبر الكبائر؟ ثلاثاً: الإشراك بالله، وعقوق الوالدين، وشهادة الزور",
        source: "متفق عليه",
        grade: "صحيح",
      },
    ],
    explanation: "عقوق الوالدين من أعظم الكبائر لقرنه بالشرك بالله في الذكر. ويشمل كل إيذاء لهما بالقول أو الفعل أو الإهمال.",
    effects: [
      "سخط الله المعجَّل في الدنيا والآخرة",
      "تدمير الروابط الأسرية",
      "حرمان من دعاء الوالدين الصالحَين",
    ],
    repentanceConditions: {
      general: [
        "التوقف الفوري عن الإيذاء",
        "الاعتذار للوالدَين وطلب رضاهما",
        "المبادرة إلى الإحسان إليهما",
        "إن كانا قد ماتا: الدعاء لهما والاستغفار والصدقة عنهما وصلة رحمهما",
      ],
      requiresRestitution: false,
      requiresForgiveness: true,
      forgivenessDetails: "طلب الرضا والعفو من الوالدَين واجب ما داما حيَّين.",
      hasExpiation: false,
    },
    commonMistakes: [
      "الاعتقاد بأن طاعة الزوج أو الوظيفة تبرر التقصير في حق الوالدين",
      "حصر العقوق في الإيذاء الصريح دون إهمال الحقوق الواجبة",
    ],
    relatedSlugs: ["qat-rahim"],
    references: ["صحيح البخاري", "صحيح مسلم"],
    reviewStatus: "reviewed",
    reviewedAt: "2026-07",
  },
  {
    id: "qat-rahim",
    slug: "qat-rahim",
    title: "قطع الرحم",
    shortDescription: "الهجر والقطيعة مع الأقارب الذين تجب صلتهم.",
    rightsCategory: "shared",
    sinSeverity: "kabira",
    sinType: "ijtimaaei",
    quranEvidence: [
      {
        text: "وَالَّذِينَ يَنقُضُونَ عَهْدَ اللَّهِ مِن بَعْدِ مِيثَاقِهِ وَيَقْطَعُونَ مَا أَمَرَ اللَّهُ بِهِ أَن يُوصَلَ وَيُفْسِدُونَ فِي الْأَرْضِ أُولَٰئِكَ لَهُمُ اللَّعْنَةُ وَلَهُمْ سُوءُ الدَّارِ",
        source: "سورة الرعد: 25",
      },
    ],
    hadithEvidence: [
      {
        text: "لا يدخل الجنة قاطع",
        source: "متفق عليه",
        grade: "صحيح",
      },
    ],
    explanation: "قطع الرحم من الكبائر المنهي عنها وله عقوبة معجَّلة في الدنيا وعقوبة أُجِّلت في الآخرة.",
    effects: [
      "قطع البركة من العمر والرزق",
      "إفساد بنية الأسرة والمجتمع",
      "سخط الله على قاطع الرحم",
    ],
    repentanceConditions: {
      general: [
        "البادرة إلى الصلة والتواصل",
        "الاعتذار عما مضى من الهجر",
        "الاستمرار في الصلة وإن لم يُبادَل بالمثل",
      ],
      requiresRestitution: false,
      requiresForgiveness: true,
      forgivenessDetails: "الاعتذار وطلب العفو من الأقارب الذين هجرهم.",
      hasExpiation: false,
    },
    commonMistakes: [
      "الاعتقاد بأن قطع الرحم مباح إذا بدأ الأقارب بالأذى — الواصل من يَصِل من قطعه",
    ],
    relatedSlugs: ["uquq-walidayn", "kibr"],
    references: ["صحيح البخاري", "صحيح مسلم"],
    reviewStatus: "reviewed",
    reviewedAt: "2026-07",
  },
  {
    id: "khiyana-amana",
    slug: "khiyana-amana",
    title: "خيانة الأمانة",
    shortDescription: "التفريط في الأمانة المؤتَمَن عليها من مال أو سر أو وظيفة.",
    rightsCategory: "shared",
    sinSeverity: "kabira",
    sinType: ["mali", "ijtimaaei"],
    quranEvidence: [
      {
        text: "يَا أَيُّهَا الَّذِينَ آمَنُوا لَا تَخُونُوا اللَّهَ وَالرَّسُولَ وَتَخُونُوا أَمَانَاتِكُمْ وَأَنتُمْ تَعْلَمُونَ",
        source: "سورة الأنفال: 27",
      },
    ],
    hadithEvidence: [
      {
        text: "آية المنافق ثلاث: إذا حدَّث كذب، وإذا وعد أخلف، وإذا اؤتمن خان",
        source: "متفق عليه",
        grade: "صحيح",
      },
    ],
    explanation: "الأمانة شاملة: المال المودَع، والسر المحفوظ، والوظيفة والمسؤولية. وخيانة أي منها إثم كبير.",
    effects: [
      "نقض الثقة وإفساد العلاقات",
      "إيذاء صاحب الأمانة مالياً أو معنوياً",
      "اتصاف بصفة النفاق",
    ],
    repentanceConditions: {
      general: [
        "رد الأمانة إلى صاحبها بعينها أو بما يقوم مقامها",
        "الاعتذار لصاحب الأمانة",
        "الندم والعزم على الوفاء بالأمانات مستقبلاً",
      ],
      requiresRestitution: true,
      restitutionDetails: "يجب رد ما خان فيه إلى صاحبه.",
      requiresForgiveness: true,
      forgivenessDetails: "يُستحسن طلب العفو من صاحب الأمانة.",
      hasExpiation: false,
    },
    commonMistakes: [
      "الخلط بين الخيانة والنسيان — الخيانة عمدية بخلاف النسيان",
    ],
    relatedSlugs: ["sariqa", "dain", "kadhib"],
    references: ["صحيح البخاري", "صحيح مسلم"],
    reviewStatus: "reviewed",
    reviewedAt: "2026-07",
  },
  {
    id: "shahada-zur",
    slug: "shahada-zur",
    title: "شهادة الزور",
    shortDescription: "الشهادة الكاذبة أمام القضاء أو في حق الناس.",
    rightsCategory: "shared",
    sinSeverity: "kabira",
    sinType: "qawli",
    quranEvidence: [
      {
        text: "وَاجْتَنِبُوا قَوْلَ الزُّورِ",
        source: "سورة الحج: 30",
      },
    ],
    hadithEvidence: [
      {
        text: "ألا أنبئكم بأكبر الكبائر؟ ثلاثاً: الإشراك بالله، وعقوق الوالدين — وكان متكئاً فجلس — ألا وشهادة الزور، وزور اللسان، فما زال يكررها حتى قلنا: ليته سكت",
        source: "متفق عليه",
        grade: "صحيح",
      },
    ],
    explanation: "شهادة الزور من أعظم الكبائر لأنها تُفضي إلى ضياع الحقوق وإيذاء الأبرياء وتدمير القضاء والعدل.",
    effects: [
      "ضياع حقوق الأبرياء",
      "إفساد العدالة والقضاء",
      "تعريض المظلومين للظلم المركَّب",
    ],
    repentanceConditions: {
      general: [
        "الرجوع عن شهادة الزور فوراً",
        "إصلاح ما أفسدته من أحكام إن أمكن",
        "طلب العفو ممن أضر بهم",
      ],
      requiresRestitution: true,
      restitutionDetails: "إن ترتب على شهادة الزور ظلم بمال أو حق وجب السعي في رده.",
      requiresForgiveness: true,
      forgivenessDetails: "يجب طلب العفو ممن شهد زوراً عليه.",
      hasExpiation: false,
    },
    commonMistakes: [
      "الاعتقاد بأن الشهادة بنية مساعدة الصديق مباحة إذا كان في الأصل مظلوماً",
    ],
    relatedSlugs: ["kadhib", "qadhf"],
    references: ["صحيح البخاري", "صحيح مسلم"],
    reviewStatus: "reviewed",
    reviewedAt: "2026-07",
  },

  // ─── ذنوب رقمية ──────────────────────────────────────────────────────────
  {
    id: "sariqa-muhttawa",
    slug: "sariqa-muhtawa",
    title: "سرقة المحتوى الرقمي",
    shortDescription: "نسب محتوى الغير إلى النفس أو استخدامه دون إذن.",
    rightsCategory: "ibad",
    sinSeverity: "depends",
    sinType: "mali",
    quranEvidence: [
      {
        text: "وَلَا تَبْخَسُوا النَّاسَ أَشْيَاءَهُمْ",
        source: "سورة هود: 85",
      },
    ],
    hadithEvidence: [
      {
        text: "إن دماءكم وأموالكم وأعراضكم عليكم حرام",
        source: "متفق عليه",
        grade: "صحيح",
      },
    ],
    explanation: "ملكية الإنتاج الفكري والمحتوى الرقمي حق معتبر شرعاً. فنسبه إلى النفس أو استخدامه تجارياً دون إذن صاحبه اعتداء على حقه.",
    effects: [
      "ظلم صاحب المحتوى",
      "تشجيع السرقة الفكرية",
    ],
    repentanceConditions: {
      general: [
        "إزالة المحتوى المسروق أو نسبته لصاحبه",
        "طلب الإذن منه أو تعويضه إن كان استُخدم تجارياً",
        "العزم على عدم العودة",
      ],
      requiresRestitution: true,
      restitutionDetails: "تعويض صاحب المحتوى إن ترتب على استخدامه كسب مادي.",
      requiresForgiveness: true,
      forgivenessDetails: "طلب الإذن والاعتذار لصاحب المحتوى.",
      hasExpiation: false,
    },
    commonMistakes: [
      "الاعتقاد بأن المحتوى الإلكتروني المجاني يمكن استخدامه بلا قيود",
    ],
    relatedSlugs: ["sariqa", "khiyana-amana"],
    references: ["قرارات المجامع الفقهية في الملكية الفكرية — قيد المراجعة"],
    reviewStatus: "pending",
  },
  {
    id: "nashr-suwar-bidun-idhn",
    slug: "nashr-suwar-bidun-idhn",
    title: "نشر صور الآخرين دون إذن",
    shortDescription: "نشر صور أشخاص في حالات خاصة أو مُحرجة دون موافقتهم.",
    rightsCategory: "ibad",
    sinSeverity: "depends",
    sinType: ["qawli", "ijtimaaei"],
    quranEvidence: [
      {
        text: "وَلَا تَجَسَّسُوا",
        source: "سورة الحجرات: 12",
      },
    ],
    hadithEvidence: [
      {
        text: "كل المسلم على المسلم حرام؛ دمه وماله وعرضه",
        source: "رواه مسلم",
        grade: "صحيح",
      },
    ],
    explanation: "الخصوصية والعرض حق محمي شرعاً. ونشر صور شخص في موقف يكرهه يعدّ انتهاكاً لعرضه وخصوصيته.",
    effects: [
      "إيذاء الشخص في عرضه وسمعته",
      "إشاعة ثقافة انتهاك الخصوصية",
    ],
    repentanceConditions: {
      general: [
        "حذف الصور المنشورة فوراً",
        "الاعتذار لصاحبها",
        "عدم العودة لمثل هذا الفعل",
      ],
      requiresRestitution: false,
      requiresForgiveness: true,
      forgivenessDetails: "طلب العفو ممن نُشرت صوره.",
      hasExpiation: false,
    },
    commonMistakes: [
      "الاعتقاد بأن النشر في الفضاء العام لا يتطلب إذناً",
    ],
    relatedSlugs: ["ghibah", "qadhf"],
    references: ["قيد المراجعة الشرعية"],
    reviewStatus: "pending",
  },
];

export const SINS_CATEGORIES: SinCategoryDef[] = [
  {
    id: "allah",
    title: "حق الله تعالى",
    subtitle: "ذنوب يغلب فيها حق الله",
    description: "الذنوب المتعلقة بحق الله هي التي تمثل مخالفة أمره أو ارتكاب ما نهى عنه من العبادات والمحرمات. والتوبة منها بالإقلاع والندم والعزم، مع تدارك الواجبات إن أمكن.",
    rightsCategory: "allah",
    icon: "🕌",
    color: "#18362A",
    topicSlugs: ["tark-salah", "riyaa", "kibr", "hasad"],
  },
  {
    id: "ibad",
    title: "حق العباد",
    subtitle: "ذنوب تتعلق بحقوق الناس",
    description: "الذنوب التي تمس حقوق الآخرين، سواء كانت مالية أو معنوية أو اجتماعية. التوبة منها لا تكتمل بالاستغفار وحده، بل يجب رد الحقوق أو طلب العفو وفق التفصيل الشرعي.",
    rightsCategory: "ibad",
    icon: "🤝",
    color: "#1a4a7a",
    topicSlugs: ["dain", "namima", "qat-rahim", "sariqa-muhttawa", "nashr-suwar-bidun-idhn"],
  },
  {
    id: "shared",
    title: "حقوق مشتركة",
    subtitle: "تجتمع فيها جهتا الحق",
    description: "ذنوب تجمع بين مخالفة أمر الله وبين الاعتداء على حق العبد. تستوجب التوبة إلى الله ورد حق العبد وطلب عفوه في آنٍ واحد.",
    rightsCategory: "shared",
    icon: "⚖️",
    color: "#7a3a1a",
    topicSlugs: ["sariqa", "ghasb", "ghibah", "qadhf", "kadhib", "uquq-walidayn", "khiyana-amana", "shahada-zur"],
  },
];

export function getTopicBySlug(slug: string): SinTopic | undefined {
  return SINS_TOPICS.find((t) => t.slug === slug);
}

export function getTopicsByCategory(category: string): SinTopic[] {
  return SINS_TOPICS.filter((t) => t.rightsCategory === category);
}

export function getRelatedTopics(slug: string): SinTopic[] {
  const topic = getTopicBySlug(slug);
  if (!topic) return [];
  return SINS_TOPICS.filter((t) => topic.relatedSlugs.includes(t.slug));
}

export const RIGHTS_CATEGORY_LABELS: Record<string, string> = {
  allah: "حق الله",
  ibad: "حق العبد",
  shared: "حق مشترك",
};

export const SIN_SEVERITY_LABELS: Record<string, string> = {
  kabira: "كبيرة",
  saghira: "صغيرة",
  depends: "بحسب الحال",
};

export const SIN_TYPE_LABELS: Record<string, string> = {
  qalbi: "ذنب قلبي",
  qawli: "ذنب قولي",
  mali: "ذنب مالي",
  badani: "ذنب بدني",
  ijtimaaei: "ذنب اجتماعي",
  ibadi: "متعلق بالعبادة",
};

export const WHAT_IF_QA = [
  {
    q: "أخذت مالاً من شخص ولا أستطيع الوصول إليه",
    a: "إن تعذر الوصول إليه فابحث عن ورثته، فإن تعذر أيضاً تصدق بالمبلغ بنية أنه عن صاحبه. وهذه مسألة يُستحسن سؤال عالم موثوق فيها.",
  },
  {
    q: "ظلمت شخصاً ثم توفي",
    a: "الدعاء له والاستغفار له، والصدقة عنه، وسداد ما في ذمتك لورثته إن كان مالياً. وقد ورد أن العبد يُعطَى من حسنات الظالم يوم القيامة جبراً لمظلمته.",
  },
  {
    q: "اغتبت شخصاً، هل أخبره؟",
    a: "اختلف العلماء؛ والأرجح عند أكثرهم أن تستغفر له وتذكره بالخير ولا تُخبره إن كان في الإخبار مفسدة من إثارة عداوة أو أذى. وإن أمنت المفسدة فالاستحلال أفضل.",
  },
  {
    q: "لا أتذكر أصحاب الحقوق ولا أعرف مقدار المال",
    a: "اجتهد في التحري والتقدير بحسب ما يغلب على ظنك. فإن تعذر التقدير تصدق بما تراه مناسباً نية براءة الذمة. واستشر أهل العلم.",
  },
  {
    q: "صاحب الحق يرفض المسامحة",
    a: "أد ما عليك كاملاً وابق مصراً على طلب العفو برفق ومحبة. وإن رفض فالأمر بينك وبين الله؛ اجتهادك في رد الحق وطلب العفو لن يضيع عند الله.",
  },
  {
    q: "أريد رد المال دون كشف هويتي",
    a: "يجوز ذلك؛ يمكن إيصال المال بأي طريقة تضمن وصوله لصاحبه ولو دون الإفصاح عن هويتك.",
  },
  {
    q: "أتوب ثم أعود إلى الذنب",
    a: "تب من جديد. باب التوبة مفتوح. الله يقبل توبة عبده ما لم تُغرغر روحه. الإصرار لا يُسقط وجوب التوبة بل يزيدها إلحاحاً.",
  },
  {
    q: "لدي حقوق كثيرة ولا أعرف من أين أبدأ",
    a: "ابدأ بأعظمها وأثقلها في الذمة: حقوق الله أولاً ثم أعظم حقوق العباد. رتبها حسب الأهمية وابدأ واحداً واحداً.",
  },
  {
    q: "هل الصدقة تغني عن رد المال لصاحبه؟",
    a: "لا. الصدقة لا تُغني عن رد المال لصاحبه ما دام حياً أو له ورثة. الصدقة عنه تكون عند تعذر الوصول إليه أو إلى ورثته.",
  },
  {
    q: "أخشى أن يؤدي الاعتراف إلى مفسدة أكبر",
    a: "إن كان في الاعتراف مفسدة أعظم فلا تعترف، ولكن ابذل ما تستطيع من رد الحق بصورة لا تُفضي لتلك المفسدة، واستشر أهل العلم.",
  },
];
