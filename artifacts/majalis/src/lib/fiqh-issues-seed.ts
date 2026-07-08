import type { FiqhCouncilIssue, FiqhTimelineEvent } from "./fiqh-council-types";

export const FIQH_ISSUES_PUBLISHED_SEED: FiqhCouncilIssue[] = [
  {
    id: "seed-issue-crypto",
    slug: "crypto-currency",
    title: "التعامل بالعملات الرقمية (المشفّرة)",
    summary: "مسألة فقهية تجمع قرارات وبحوث المجمع حول العملات الرقمية والمعاملات المالية المعاصرة.",
    description:
      "تتناول هذه المسألة حكم التعامل بالعملات الرقمية من حيث كونها نقوداً شرعية، والتداول والاستثمار فيها، وما يترتب على ذلك من أحكام.",
    category: "الاقتصاد الإسلامي",
    subcategory: "الاقتصاد",
    ruling_summary:
      "لا تُعدّ العملات الرقمية غير المُغطّاة بأصول حقيقية نقوداً شرعية؛ والتداول المضاربي فيها فيه غرر وجهالة.",
    evidence_summary: "الاستدلال من نهي أكل المال بالباطل، وأحكام البيع والغرر في المعاملات.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 890,
    published_at: "2024-03-15T10:00:00Z",
    updated_at: "2024-03-15T10:00:00Z",
    created_at: "2024-03-15T10:00:00Z",
  },
  {
    id: "seed-issue-organ-donation",
    slug: "organ-donation",
    title: "التبرع بالأعضاء بعد الوفاة",
    summary: "مسألة فقهية حول جواز التبرع بالأعضاء لإنقاذ حياة المرضى وفق ضوابط شرعية وطبية.",
    category: "الطب والنوازل",
    subcategory: "الطب",
    ruling_summary: "يجوز التبرع بالأعضاء بعد الوفاة عند تحقق الشروط الشرعية والطبية.",
    evidence_summary: "الاستدلال بمقصد إحياء النفس وحفظ الكرامة الإنسانية.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 620,
    published_at: "2023-11-08T09:00:00Z",
    updated_at: "2023-11-08T09:00:00Z",
    created_at: "2023-11-08T09:00:00Z",
  },
  {
    id: "seed-issue-minorities",
    slug: "muslim-minorities-rights",
    title: "حقوق الأقليات المسلمة",
    summary: "مسألة فقهية حول حقوق المسلمين في البلدان غير الإسلامية وممارسة شعائرهم.",
    category: "الأقليات المسلمة",
    ruling_summary: "للمسلمين حق ممارسة العبادات مع الالتزام بعقودهم وعهودهم مع الدول التي يقيمون فيها.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 540,
    published_at: "2023-06-20T08:00:00Z",
    updated_at: "2023-06-20T08:00:00Z",
    created_at: "2023-06-20T08:00:00Z",
  },
  {
    id: "seed-issue-zakat-stocks",
    slug: "zakat-stocks",
    title: "زكاة الأسهم والصناديق الاستثمارية",
    summary: "مسألة فقهية في كيفية إخراج زكاة الأسهم والصناديق الاستثمارية.",
    category: "الزكاة والوقف",
    ruling_summary: "تُزكّى الأسهم التجارية بقيمتها السوقية؛ والاستثمارية أرباحها عند بلوغ النصاب.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 1100,
    published_at: "2022-12-05T06:00:00Z",
    updated_at: "2022-12-05T06:00:00Z",
    created_at: "2022-12-05T06:00:00Z",
  },
  {
    id: "seed-issue-hajj",
    slug: "hajj-delay",
    title: "تأخير الحج لمن استطاع مادياً",
    summary: "مسألة فقهية في وجوب الحج على الفور لمن توفرت شروطه.",
    category: "الحج والعمرة",
    ruling_summary: "الحج واجب على الفور لمن استطاع إليه سبيلاً بلا عذر شرعي.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 780,
    published_at: "2022-08-01T05:00:00Z",
    updated_at: "2022-08-01T05:00:00Z",
    created_at: "2022-08-01T05:00:00Z",
  },
  {
    id: "seed-issue-general-anesthesia",
    slug: "general-anesthesia",
    title: "التخدير الكلي في العمليات الجراحية",
    summary: "مسألة فقهية حول حكم استخدام التخدير الكلي الذي يُفقد الوعي أثناء العمليات الجراحية.",
    description:
      "تتناول هذه المسألة حكم التخدير الكلي من حيث كونه مُسكّراً أو مُخدّراً، وأثره على الصلاة والصيام، ومدى جوازه عند الضرورة الطبية.",
    category: "الطب والنوازل",
    subcategory: "الطب",
    ruling_summary:
      "يجوز التخدير الكلي عند الضرورة الطبية، ولا يُعدّ ناقضاً للإيمان لانعدام القصد والاختيار.",
    evidence_summary: "الاستدلال بقاعدة الضرورات تبيح المحظورات، وعدم التكليف مع رفع الحرج.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 430,
    published_at: "2025-01-10T08:00:00Z",
    updated_at: "2025-01-10T08:00:00Z",
    created_at: "2025-01-10T08:00:00Z",
  },
  {
    id: "seed-issue-artificial-organ-transplant",
    slug: "artificial-organ-transplant",
    title: "زراعة الأعضاء الاصطناعية",
    summary: "مسألة فقهية حول جواز استبدال الأعضاء البشرية بأعضاء اصطناعية مصنوعة من مواد غير عضوية.",
    description:
      "تشمل المسألة أحكام تركيب الأطراف الصناعية والأعضاء الميكانيكية كالقلب الاصطناعي والرئة الاصطناعية.",
    category: "الطب والنوازل",
    subcategory: "الطب",
    ruling_summary: "يجوز زراعة الأعضاء الاصطناعية بقصد العلاج وإعادة وظائف الجسم الحيوية.",
    evidence_summary: "قاعدة درء المفسدة وجلب المصلحة، والاستدلال بمشروعية التداوي.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 310,
    published_at: "2025-02-20T09:00:00Z",
    updated_at: "2025-02-20T09:00:00Z",
    created_at: "2025-02-20T09:00:00Z",
  },
  {
    id: "seed-issue-human-cloning",
    slug: "human-cloning",
    title: "الاستنساخ البشري",
    summary: "مسألة فقهية حول حكم الاستنساخ البشري التكاثري والعلاجي في ضوء المقاصد الشرعية.",
    description:
      "تتناول المسألة أنواع الاستنساخ وحكم كل نوع، والآثار الفقهية على النسب والإرث والعلاقات الأسرية.",
    category: "الطب والنوازل",
    subcategory: "الطب",
    ruling_summary:
      "يحرم الاستنساخ البشري التكاثري؛ ويُجيز بعض العلماء الاستنساخ العلاجي بضوابط صارمة.",
    evidence_summary:
      "مقصد حفظ النسل، وتحريم الاختلاط في الأنساب، وحرمة الكيان الإنساني.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 560,
    published_at: "2025-03-05T10:00:00Z",
    updated_at: "2025-03-05T10:00:00Z",
    created_at: "2025-03-05T10:00:00Z",
  },
  {
    id: "seed-issue-abortion-rape-cases",
    slug: "abortion-rape-cases",
    title: "الإجهاض في حالات الاغتصاب",
    summary: "مسألة فقهية معاصرة حول حكم إسقاط الحمل الناتج عن اغتصاب في المراحل الأولى.",
    description:
      "تستعرض المسألة الأقوال الفقهية المعتبرة وضوابط الإجهاض في الحالات الإكراهية الاستثنائية.",
    category: "الطب والنوازل",
    subcategory: "الطب",
    ruling_summary:
      "أجاز جمهور الفقهاء المعاصرين الإسقاط قبل نفخ الروح للضرورة القصوى في حالات الاغتصاب.",
    evidence_summary:
      "قاعدة الضرورات، وأحكام الجنين قبل نفخ الروح، ومقصد حفظ العقل والكرامة الإنسانية.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 740,
    published_at: "2025-04-12T08:00:00Z",
    updated_at: "2025-04-12T08:00:00Z",
    created_at: "2025-04-12T08:00:00Z",
  },
  {
    id: "seed-issue-misyar-marriage",
    slug: "misyar-marriage",
    title: "زواج المسيار",
    summary: "مسألة فقهية حول زواج المسيار وشروطه وما يترتب عليه من حقوق وواجبات.",
    description:
      "يُقصد بزواج المسيار عقد زواج يتنازل فيه أحد الطرفين عن بعض حقوقه الشرعية كالنفقة والمبيت.",
    category: "الأسرة والنكاح",
    subcategory: "الأسرة",
    ruling_summary:
      "يجيزه جمع من العلماء المعاصرين بتوافر أركان الزواج وشروطه مع استيفاء الولي والشهود.",
    evidence_summary: "أحكام شروط الزواج، وأن التنازل عن الحق الشخصي لصاحبه جائز.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 950,
    published_at: "2024-09-18T07:00:00Z",
    updated_at: "2024-09-18T07:00:00Z",
    created_at: "2024-09-18T07:00:00Z",
  },
  {
    id: "seed-issue-electronic-divorce",
    slug: "electronic-divorce",
    title: "الطلاق الإلكتروني",
    summary: "مسألة فقهية معاصرة حول وقوع الطلاق عبر الوسائل الرقمية كالرسائل النصية والبريد الإلكتروني.",
    description:
      "تتناول المسألة حكم الطلاق الواقع عبر الرسائل القصيرة والبريد الإلكتروني ووسائل التواصل الاجتماعي.",
    category: "الأسرة والنكاح",
    subcategory: "الأسرة",
    ruling_summary:
      "يقع الطلاق الإلكتروني الكتابي متى ثبتت صدوره من الزوج بقصد ونية الطلاق.",
    evidence_summary:
      "قياس الكتابة الإلكترونية على الكتابة الخطية في باب الطلاق عند الفقهاء.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 870,
    published_at: "2024-10-05T09:00:00Z",
    updated_at: "2024-10-05T09:00:00Z",
    created_at: "2024-10-05T09:00:00Z",
  },
  {
    id: "seed-issue-artificial-breastfeeding",
    slug: "artificial-breastfeeding",
    title: "الرضاعة الاصطناعية وعلاقة المحرمية",
    summary: "مسألة فقهية حول مدى ثبوت المحرمية من الرضاعة بطريق غير مباشر كالحليب المستخرج في قارورة.",
    description:
      "تستعرض المسألة آراء الفقهاء المعاصرين في اشتراط المص المباشر أو الاكتفاء بوصول لبن المرأة إلى الرضيع.",
    category: "الأسرة والنكاح",
    subcategory: "الأسرة",
    ruling_summary:
      "تثبت المحرمية بوصول اللبن إلى الرضيع بأي طريقة وفق الراجح عند جمهور العلماء المعاصرين.",
    evidence_summary:
      "الاستدلال بعلة تغذية الجسم بلبن المرأة وإنبات اللحم وإنشاز العظم.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 490,
    published_at: "2024-11-20T08:00:00Z",
    updated_at: "2024-11-20T08:00:00Z",
    created_at: "2024-11-20T08:00:00Z",
  },
  {
    id: "seed-issue-fasting-elderly-disabled",
    slug: "fasting-elderly-disabled",
    title: "صيام كبار السن العاجزين",
    summary: "مسألة فقهية حول حكم صيام رمضان لمن بلغ حداً من الكبر عجز معه عن الصيام كلياً.",
    category: "الصيام والعبادات",
    subcategory: "العبادات",
    ruling_summary:
      "يسقط الصيام عن العاجز بسبب الكبر ويُفدى عنه بإطعام مسكين عن كل يوم.",
    evidence_summary:
      "الاستدلال بآية الفدية وإجماع الفقهاء على سقوط الصوم بالعجز الدائم.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 680,
    published_at: "2024-12-01T07:00:00Z",
    updated_at: "2024-12-01T07:00:00Z",
    created_at: "2024-12-01T07:00:00Z",
  },
  {
    id: "seed-issue-astronaut-prayer",
    slug: "astronaut-prayer",
    title: "صلاة رواد الفضاء",
    summary: "مسألة فقهية متعلقة بأوقات الصلاة واتجاه القبلة لرواد الفضاء في المدار الأرضي.",
    description:
      "تتناول المسألة كيفية تحديد أوقات الصلاة والقبلة لمن يكون في مدار لا تُعرف فيه أوقات الشمس بصورة طبيعية.",
    category: "الصيام والعبادات",
    subcategory: "العبادات",
    ruling_summary:
      "يصلي رائد الفضاء بحسب توقيت أقرب بلد أُقلع منه أو توقيت مكة المكرمة، ويتوجه نحو الكعبة تقريباً.",
    evidence_summary:
      "مبدأ اليسر ورفع الحرج، وأحكام القبلة للعاجز عن التحقق منها.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 1200,
    published_at: "2025-05-15T10:00:00Z",
    updated_at: "2025-05-15T10:00:00Z",
    created_at: "2025-05-15T10:00:00Z",
  },
  {
    id: "seed-issue-zakat-crypto",
    slug: "zakat-crypto",
    title: "زكاة العملات الرقمية",
    summary: "مسألة فقهية حول وجوب الزكاة على ما يمتلكه الشخص من عملات رقمية وكيفية حسابها.",
    description:
      "تستعرض المسألة حكم إخراج زكاة البيتكوين والعملات الرقمية الأخرى ونسبتها ووقت وجوبها.",
    category: "الزكاة والوقف",
    subcategory: "الاقتصاد",
    ruling_summary:
      "تجب الزكاة على العملات الرقمية بنسبة ربع العشر (2.5%) بعد حولان الحول وبلوغ النصاب بقيمتها السوقية.",
    evidence_summary:
      "القياس على زكاة النقدين وعروض التجارة، وعموم النصوص الواردة في وجوب الزكاة في المال.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 820,
    published_at: "2025-06-01T08:00:00Z",
    updated_at: "2025-06-01T08:00:00Z",
    created_at: "2025-06-01T08:00:00Z",
  },
  {
    id: "seed-issue-health-insurance-ruling",
    slug: "health-insurance-ruling",
    title: "حكم التأمين الصحي",
    summary: "مسألة فقهية حول جواز الاشتراك في التأمين الصحي التجاري والتعاوني.",
    description:
      "تتناول المسألة الفرق بين التأمين التجاري والتعاوني والأثر الفقهي على مدى جوازهما.",
    category: "الاقتصاد الإسلامي",
    subcategory: "الاقتصاد",
    ruling_summary:
      "يجيز أكثر العلماء التأمين الصحي التعاوني، ورخّص كثيرون في التجاري للضرورة ورفع الحرج.",
    evidence_summary:
      "مبدأ التعاون على البر، وقاعدة الضرورة، وتفريق الفقهاء بين صور التأمين.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 760,
    published_at: "2025-07-10T07:00:00Z",
    updated_at: "2025-07-10T07:00:00Z",
    created_at: "2025-07-10T07:00:00Z",
  },
  {
    id: "seed-issue-stock-market-trading",
    slug: "stock-market-trading",
    title: "تداول الأسهم في البورصة",
    summary: "مسألة فقهية شاملة حول حكم شراء الأسهم وبيعها في الأسواق المالية.",
    description:
      "تستعرض المسألة شروط جواز التعامل في أسهم الشركات من حيث نشاطها وطريقة التداول وأثر الديون.",
    category: "الاقتصاد الإسلامي",
    subcategory: "الاقتصاد",
    ruling_summary:
      "يجوز تداول أسهم الشركات المباحة النشاط بضوابط تصفية الحرام وتجنب المحرمات.",
    evidence_summary:
      "أحكام الشركات في الفقه الإسلامي، وفتاوى المجامع الفقهية في المعايير الشرعية.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 1050,
    published_at: "2025-08-05T09:00:00Z",
    updated_at: "2025-08-05T09:00:00Z",
    created_at: "2025-08-05T09:00:00Z",
  },
  {
    id: "seed-issue-organ-donation-will",
    slug: "organ-donation-will",
    title: "وصايا التبرع بالأعضاء بعد الوفاة",
    summary: "مسألة فقهية حول مدى صحة الوصية بالتبرع بالأعضاء وأثرها الشرعي.",
    description:
      "تتناول المسألة صحة الوصية بالتبرع بالأعضاء من الناحية الشرعية ومدى إلزامها للورثة.",
    category: "الطب والنوازل",
    subcategory: "الطب",
    ruling_summary:
      "تصح الوصية بالتبرع بالأعضاء عند جمهور المعاصرين، ويُستحسن تنفيذها احتراماً لرغبة الميت.",
    evidence_summary:
      "أحكام الوصية في الفقه الإسلامي، وقاعدة إحياء النفس، وفتاوى المجامع الفقهية.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 390,
    published_at: "2025-09-12T08:00:00Z",
    updated_at: "2025-09-12T08:00:00Z",
    created_at: "2025-09-12T08:00:00Z",
  },
  {
    id: "seed-issue-milk-bank-breastfeeding",
    slug: "milk-bank-breastfeeding",
    title: "الإرضاع من بنك الحليب",
    summary: "مسألة فقهية حول ثبوت المحرمية بالرضاعة من بنك الحليب حيث يختلط حليب نساء متعددات.",
    description:
      "تستعرض المسألة خطورة اختلاط الأنساب وضوابط التحريم بالرضاعة عند استخدام بنوك الحليب.",
    category: "الأسرة والنكاح",
    subcategory: "الأسرة",
    ruling_summary:
      "يحذر أكثر الفقهاء المعاصرين من استخدام بنوك الحليب المختلط لما قد يُفضي إليه من الخلط في المحرمية.",
    evidence_summary:
      "أحكام الرضاعة المحرِّمة، وقاعدة سد الذرائع، والاحتياط في باب الأنساب.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 510,
    published_at: "2025-10-20T07:00:00Z",
    updated_at: "2025-10-20T07:00:00Z",
    created_at: "2025-10-20T07:00:00Z",
  },
  {
    id: "seed-issue-minorities-kitabiyya-marriage",
    slug: "minorities-kitabiyya-marriage",
    title: "زواج المسلم من الكتابية في بلاد الغرب",
    summary: "مسألة فقهية خاصة بالأقليات المسلمة حول جواز زواج المسلم من الكتابية في بلاد الغرب وضوابطه.",
    description:
      "تتناول المسألة الشروط والضوابط التي وضعها العلماء لتحقيق المصلحة الدينية والأسرية لدى المسلمين في الغرب.",
    category: "الأسرة والنكاح",
    subcategory: "الأسرة",
    ruling_summary:
      "يجيز العلماء زواج المسلم من الكتابية مع التحذير من مخاطره على دين الأبناء وثقافتهم في بيئة الأقليات.",
    evidence_summary:
      "نص القرآن الكريم على جواز نكاح الكتابيات، مع تقييده بأحكام المصلحة والضوابط الفقهية.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 670,
    published_at: "2025-11-08T09:00:00Z",
    updated_at: "2025-11-08T09:00:00Z",
    created_at: "2025-11-08T09:00:00Z",
  },
  {
    id: "seed-issue-ai-fatwa",
    slug: "ai-in-fatwa",
    title: "حكم الاستعانة بالذكاء الاصطناعي في الإفتاء",
    summary: "مسألة فقهية مستحدثة حول توظيف برامج الذكاء الاصطناعي في تقديم الفتاوى الشرعية.",
    description:
      "انتشر في العصر الحديث توظيف برامج الذكاء الاصطناعي في الإجابة عن الأسئلة الشرعية، مما أثار تساؤلات فقهية حول الاستناد إلى هذه البرامج وموقع المفتي منها.",
    category: "الاقتصاد الإسلامي",
    subcategory: "التقنية والفقه",
    ruling_summary:
      "لا يجوز الاعتماد على الذكاء الاصطناعي مستقلاً في الإفتاء؛ وقد يُستعان به أداةً مساعدة للمفتي المؤهل في جمع المعلومات وتنظيمها.",
    evidence_summary:
      "الفتوى ولاية دينية تستلزم أهلية العلم والعدالة والتيقظ الشرعي، وهي صفات لا تتوفر في برامج الحاسوب.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 1120,
    published_at: "2025-03-20T09:00:00Z",
    updated_at: "2025-03-20T09:00:00Z",
    created_at: "2025-03-20T09:00:00Z",
  },
  {
    id: "seed-issue-stem-cells",
    slug: "stem-cell-therapy",
    title: "حكم العلاج بخلايا الجذع",
    summary: "مسألة فقهية في الحكم الشرعي لاستخدام خلايا الجذع الجنينية والبالغة في العلاج الطبي.",
    description:
      "يُعدّ العلاج بخلايا الجذع من الثورات الطبية الحديثة، ويتشعب من حيث المصدر: خلايا جنينية (من أجنة مُستنبتة أو مُجهضة) أو خلايا بالغة (من صاحب العلاج). ولكل نوع حكمه الفقهي.",
    category: "الطب والنوازل",
    subcategory: "الطب",
    ruling_summary:
      "يجوز العلاج بخلايا الجذع البالغة المأخوذة من الشخص نفسه أو من متبرع بإذنه. أما الخلايا الجنينية المأخوذة من أجنة مُجهضة عمداً فمحرمة، ومن أجنة فائضة من التلقيح الصناعي محلّ خلاف معتبر.",
    evidence_summary:
      "أصل إباحة التداوي، وقاعدة الضرورة والحاجة، وحرمة الأجنة البشرية.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 760,
    published_at: "2024-09-10T09:00:00Z",
    updated_at: "2024-09-10T09:00:00Z",
    created_at: "2024-09-10T09:00:00Z",
  },
  {
    id: "seed-issue-digital-waqf",
    slug: "digital-waqf",
    title: "الوقف الرقمي وصكوك الوقف الإلكترونية",
    summary: "مسألة فقهية في مشروعية الوقف على المحتوى الرقمي والبنية التحتية الإلكترونية، وصكوك الوقف الرقمية.",
    description:
      "مع تطور الاقتصاد الرقمي نشأت صور جديدة للوقف تشمل وقف المواقع والتطبيقات والمحتوى العلمي الإلكتروني، وصكوك الوقف المبنية على تقنية سلسلة الكتل.",
    category: "الزكاة والوقف",
    subcategory: "الوقف",
    ruling_summary:
      "يصح الوقف على المحتوى الرقمي النافع إذا توفرت شروط الوقف من ديمومة المنفعة وتعيين الجهة. وصكوك الوقف الرقمية حكمها حكم الوقف عموماً بشرط الشفافية والضمان.",
    evidence_summary:
      "أصل جواز الوقف على كل ما فيه منفعة مستمرة مباحة، وعموم الأدلة على الصدقة الجارية.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 540,
    published_at: "2025-03-20T09:30:00Z",
    updated_at: "2025-03-20T09:30:00Z",
    created_at: "2025-03-20T09:30:00Z",
  },
  {
    id: "seed-issue-zakat-real-estate",
    slug: "zakat-real-estate",
    title: "زكاة العقارات التجارية وعروض الاستثمار العقاري",
    summary: "مسألة فقهية في كيفية إخراج زكاة العقارات المُعدّة للبيع أو الاستثمار والإيجار.",
    description:
      "تتعدد صور امتلاك العقارات بين: السكن الخاص (لا زكاة فيه)، والعقار للبيع (عروض تجارة تُزكّى)، والعقار للإيجار (زكاة الغلة لا العين)، وصناديق الاستثمار العقاري.",
    category: "الزكاة والوقف",
    subcategory: "الزكاة",
    ruling_summary:
      "العقار المعدّ للبيع تجب فيه زكاة عروض التجارة بقيمته السوقية. أما المعدّ للإيجار فتجب فيه زكاة الدخل (الغلة) إن بلغت نصاباً وحال عليها الحول.",
    evidence_summary:
      "حديث «في الإبل صدقتها» وأصل الزكاة في عروض التجارة، وقاعدة الزكاة في المال النامي.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 680,
    published_at: "2024-06-01T09:00:00Z",
    updated_at: "2024-06-01T09:00:00Z",
    created_at: "2024-06-01T09:00:00Z",
  },
  {
    id: "seed-issue-gender-reassignment",
    slug: "gender-reassignment-surgery",
    title: "حكم عمليات تغيير الجنس",
    summary: "مسألة فقهية في الحكم الشرعي للعمليات الجراحية الهادفة لتغيير الجنس أو تصحيحه.",
    description:
      "تنقسم هذه العمليات إلى قسمين: تصحيح الخنثى المشكل للغلبة الطبية (مسألة فقهية قديمة)، وتغيير جنس الشخص السليم تشريحياً بدافع نفسي (مستحدثة).",
    category: "الطب والنوازل",
    subcategory: "الطب",
    ruling_summary:
      "يجوز جراحياً تصحيح حالة الخنثى المشكل للغلبة الطبية وفق رأي الأطباء. أما تغيير جنس الشخص السليم تشريحياً رغبةً نفسية فمحرّم شرعاً ولا يُرتّب عليه أحكام الجنس الجديد.",
    evidence_summary:
      "النهي عن تغيير خلق الله، وقاعدة حرمة الإضرار بالجسم، وأحاديث لعن المتشبهين من الرجال بالنساء والعكس.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 910,
    published_at: "2023-11-08T09:00:00Z",
    updated_at: "2023-11-08T09:00:00Z",
    created_at: "2023-11-08T09:00:00Z",
  },
  // ─── مسائل فقهية جديدة ────────────────────────────────────────────
  {
    id: "seed-issue-surrogacy",
    slug: "surrogacy-mother",
    title: "حكم الأمومة البديلة (الرحم المستعارة)",
    summary: "مسألة فقهية في حكم الاستعانة برحم امرأة أخرى لحمل الجنين لزوجين عاجزين عن الإنجاب.",
    description:
      "تُعدّ الأمومة البديلة من أبرز إشكاليات الطب الحديث؛ إذ تتشعب إلى صور متعددة: زرع بويضة الزوجة في رحم امرأة أخرى بنطفة الزوج، أو استخدام بويضة المرأة الحاملة مع نطفة الزوج، أو غير ذلك.",
    category: "الطب والنوازل",
    subcategory: "الطب",
    ruling_summary:
      "تحرم الأمومة البديلة في جميع صورها وفق قرار مجمع الفقه الإسلامي؛ لما فيها من اختلاط الأنساب والإشكال في تحديد الأم الشرعية.",
    evidence_summary:
      "أحكام النسب في الإسلام، وقاعدة سد الذرائع، والنهي عن كل ما يُفضي إلى اختلاط الأنساب.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 830,
    published_at: "2024-02-10T09:00:00Z",
    updated_at: "2024-02-10T09:00:00Z",
    created_at: "2024-02-10T09:00:00Z",
  },
  {
    id: "seed-issue-euthanasia",
    slug: "euthanasia-mercy-killing",
    title: "حكم القتل الرحيم (الموت الرحيم)",
    summary: "مسألة فقهية في حكم إنهاء حياة المريض الميؤوس من شفائه أو إيقاف العلاج عنه.",
    description:
      "يُفرّق الفقهاء المعاصرون بين صورتين: القتل الرحيم الإيجابي (إعطاء جرعة مميتة للمريض)، والسلبي (إيقاف أجهزة الإنعاش أو الامتناع عن العلاج)؛ ولكل صورة حكمها.",
    category: "الطب والنوازل",
    subcategory: "الطب",
    ruling_summary:
      "يحرم القتل الرحيم الإيجابي إجماعاً. أما إيقاف الأجهزة عن الميت دماغياً فقد أجازه بعض العلماء بضوابط طبية وشرعية دقيقة.",
    evidence_summary:
      "حرمة الدم الإنساني، وقاعدة لا ضرر ولا ضرار، وفقه الضرورة الطبية.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 740,
    published_at: "2024-04-05T09:00:00Z",
    updated_at: "2024-04-05T09:00:00Z",
    created_at: "2024-04-05T09:00:00Z",
  },
  {
    id: "seed-issue-covid-vaccine",
    slug: "covid-vaccine-ruling",
    title: "حكم التطعيم الإجباري ضد الأوبئة",
    summary: "مسألة فقهية في حكم إجبار الدولة للمواطنين على التطعيم ضد الأوبئة.",
    description:
      "أثار انتشار وباء كوفيد-19 تساؤلات فقهية حول شرعية التطعيم الإجباري وما يترتب على الامتناع عنه من عقوبات أو قيود.",
    category: "الطب والنوازل",
    subcategory: "الطب",
    ruling_summary:
      "يجوز للدولة تشجيع التطعيم إلزاماً لدرء الضرر العام. أما اللقاحات المأمونة فيُستحسن أخذها تطبيقاً لقاعدة درء الضرر.",
    evidence_summary:
      "قاعدة المصلحة العامة تُقدَّم على المصلحة الخاصة، وأحكام الحجر الصحي في السنة النبوية.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 1050,
    published_at: "2021-03-15T09:00:00Z",
    updated_at: "2021-03-15T09:00:00Z",
    created_at: "2021-03-15T09:00:00Z",
  },
  {
    id: "seed-issue-nft-metaverse",
    slug: "nft-metaverse-transactions",
    title: "أحكام NFT والميتافيرس الرقمي",
    summary: "مسألة فقهية مستحدثة في حكم التعامل بالرموز غير القابلة للاستبدال (NFT) وعقود الفضاء الافتراضي.",
    description:
      "ظهرت في السنوات الأخيرة صور جديدة للملكية الرقمية تشمل NFT (رموز البلوكتشين المرتبطة بأصول رقمية) وعقارات الميتافيرس الافتراضية، مما استدعى بحثاً فقهياً معمّقاً.",
    category: "الاقتصاد الإسلامي",
    subcategory: "التقنية والفقه",
    ruling_summary:
      "قد تصح NFT المرتبطة بأصول حقيقية ومنافع مشروعة وفق ضوابط الشرع. أما ما كان منها مجرد مضاربة على الشهرة دون قيمة حقيقية ففيه غرر.",
    evidence_summary:
      "أحكام البيع والملكية في الفقه الإسلامي، ومنع الغرر والجهالة في المعاملات.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 890,
    published_at: "2024-07-01T09:00:00Z",
    updated_at: "2024-07-01T09:00:00Z",
    created_at: "2024-07-01T09:00:00Z",
  },
  {
    id: "seed-issue-social-media-dawah",
    slug: "social-media-dawah",
    title: "الدعوة عبر منصات التواصل الاجتماعي وضوابطها",
    summary: "مسألة فقهية في حكم استخدام منصات التواصل الاجتماعي للدعوة وما يترتب عليها من مسؤوليات.",
    description:
      "انتشرت ظاهرة الفتوى والدعوة عبر الإنترنت ومنصات التواصل، مما يستدعي تأصيلاً فقهياً لضوابط الداعية ومسؤولية الناشر والمؤثر الإسلامي.",
    category: "الدعوة والإعلام",
    subcategory: "الدعوة",
    ruling_summary:
      "يجوز الدعوة عبر منصات التواصل بشرط الضبط العلمي والأمانة والابتعاد عن التشهير والفتنة. والداعية مسؤول شرعاً عما ينشره.",
    evidence_summary:
      "وجوب الأمر بالمعروف والنهي عن المنكر، وأحكام الاجتهاد والإفتاء والمسؤولية الشرعية.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 680,
    published_at: "2025-01-15T09:00:00Z",
    updated_at: "2025-01-15T09:00:00Z",
    created_at: "2025-01-15T09:00:00Z",
  },
  {
    id: "seed-issue-hair-transplant",
    slug: "hair-transplant-cosmetic",
    title: "زراعة الشعر والعمليات التجميلية",
    summary: "مسألة فقهية في حكم زراعة الشعر وعمليات التجميل العلاجية والتحسينية.",
    description:
      "تتناول هذه المسألة الفرق بين التجميل العلاجي المبيح لإزالة العيوب والضرر، والتجميل التحسيني الذي فيه تغيير لخلق الله، مع بيان أحكام زراعة الشعر بالتفصيل.",
    category: "الطب والنوازل",
    subcategory: "الطب",
    ruling_summary:
      "زراعة الشعر جائزة إذا كانت من شعر الشخص نفسه أو مما يباح بطبيعته، وإزالة العيوب الخِلقية جائزة، أما التجميل التحسيني المحض فيه خلاف.",
    evidence_summary:
      "أحكام التداوي وتغيير خلق الله والقواعد الفقهية في الضرورة والحاجة.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 730,
    published_at: "2025-02-10T10:00:00Z",
    updated_at: "2025-02-10T10:00:00Z",
    created_at: "2025-02-10T10:00:00Z",
  },
  {
    id: "seed-issue-crowdfunding",
    slug: "crowdfunding-investment",
    title: "التمويل الجماعي وضوابطه الشرعية",
    summary: "مسألة فقهية في حكم منصات التمويل الجماعي (Crowdfunding) للمشاريع التجارية والخيرية.",
    description:
      "انتشر التمويل الجماعي عبر الإنترنت بصور متعددة: القرض، والمشاركة بالأرباح، والتبرع، والمكافأة. ولكل صورة حكم يختلف في الشريعة الإسلامية.",
    category: "الاقتصاد الإسلامي",
    subcategory: "الاقتصاد",
    ruling_summary:
      "التمويل الجماعي بصيغة المشاركة بالأرباح جائز، وبصيغة القرض بفائدة محرم ربا، وبصيغة التبرع جائز ومستحب.",
    evidence_summary:
      "أحكام الشركة والقرض والربا والهبة في الفقه الإسلامي.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 510,
    published_at: "2025-03-18T09:00:00Z",
    updated_at: "2025-03-18T09:00:00Z",
    created_at: "2025-03-18T09:00:00Z",
  },
  {
    id: "seed-issue-polar-fasting",
    slug: "polar-regions-fasting",
    title: "الصيام في البلاد القطبية والشمالية البعيدة",
    summary: "مسألة فقهية في كيفية الصيام وأوقات الصلاة في البلاد التي يطول فيها النهار أو الليل إلى أكثر من 18 ساعة.",
    description:
      "يُعاني المسلمون في الدول الإسكندنافية وكندا وأجزاء من روسيا من تحديات في ضبط أوقات العبادة، إذ قد يبلغ النهار 20-22 ساعة صيفاً.",
    category: "الأقليات المسلمة",
    subcategory: "الأقليات",
    ruling_summary:
      "يجوز للمسلم في البلاد التي يتعذر فيها تحديد وقت الفجر أو المغرب أن يعمل بأقرب بلد متعارف الأوقات، أو بالتقدير على مكة المكرمة.",
    evidence_summary:
      "حديث الدجال وطوله اليوم كسنة وما قياس الأوقات فيه، وأصول الاجتهاد في المسائل الفقهية المستحدثة.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 420,
    published_at: "2025-04-05T08:00:00Z",
    updated_at: "2025-04-05T08:00:00Z",
    created_at: "2025-04-05T08:00:00Z",
  },
  {
    id: "seed-issue-deception-marriage-annulment",
    slug: "deception-marriage-annulment",
    title: "فسخ النكاح بسبب الغش والتدليس",
    summary: "مسألة فقهية في أثر اكتشاف الغش أو إخفاء عيوب جوهرية قبل الزواج على صحة عقد النكاح.",
    description:
      "يتناول الفقهاء أثر التدليس في عقد الزواج كإخفاء مرض خطير، أو إخفاء السبق للزواج، أو ادعاء حرية من هو رقيق، وما يترتب على ذلك من فسخ أو خيار.",
    category: "الأسرة والنكاح",
    subcategory: "الأسرة",
    ruling_summary:
      "إذا وقع التدليس في صفة جوهرية يُؤثّر على الرضا فللمغرور حق فسخ النكاح، مع ثبوت المهر لحصول الدخول.",
    evidence_summary:
      "أحكام الخيار في العقود وشروط الرضا وعيوب النكاح في المذاهب الأربعة.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 860,
    published_at: "2025-05-20T10:00:00Z",
    updated_at: "2025-05-20T10:00:00Z",
    created_at: "2025-05-20T10:00:00Z",
  },
  {
    id: "seed-issue-medicinal-cannabis",
    slug: "medicinal-cannabis-cbd",
    title: "زيت CBD والقنب الطبي",
    summary: "مسألة فقهية معاصرة في حكم استخدام زيت الكانابيديول (CBD) المستخرج من القنب لأغراض طبية.",
    description:
      "انتشر استخدام مستخلصات القنب الطبية في كثير من دول العالم. والمسألة ذات أبعاد طبية وشرعية: هل خلوها من THC (المادة المسكرة) يُبيحها؟ وما ضوابط التداوي بالمحرم؟",
    category: "الطب والنوازل",
    subcategory: "الطب",
    ruling_summary:
      "ما خلا من المادة المسكرة (THC) وثبتت فائدته الطبية ولم يوجد بديل مباح فقد يُجاز للضرورة بشرط وصفة طبيب متخصص. وما احتوى على نسبة مُسكِرة فهو محرم.",
    evidence_summary:
      "قاعدة الضرورة تُبيح المحظورات، وأحكام التداوي بالمحرم، والحديث: «إن الله لم يجعل شفاءكم فيما حرّم عليكم».",
    documentation_level: "official_verified",
    status: "published",
    views_count: 940,
    published_at: "2025-06-12T09:00:00Z",
    updated_at: "2025-06-12T09:00:00Z",
    created_at: "2025-06-12T09:00:00Z",
  },
  {
    id: "seed-issue-bank-employment",
    slug: "employment-in-riba-banks",
    title: "العمل في البنوك الربوية",
    summary: "مسألة فقهية في حكم توظيف المسلم في البنوك والمؤسسات المالية التي تتعامل بالربا.",
    description:
      "تتضمن المسألة عدة فروع: العمل في قسم القروض الربوية مباشرةً، أم في إدارة موارد بشرية أو تقنية معلومات. هل يدخل العامل في وزر الربا؟ ومتى يجب على المسلم التخلي عن هذا العمل؟",
    category: "الاقتصاد الإسلامي",
    subcategory: "الاقتصاد",
    ruling_summary:
      "العمل في الأقسام المتعلقة مباشرة بالعقود الربوية محرم. أما الأعمال البعيدة التي لا تُعين على الربا فالمسألة فيها خلاف، والأحوط تركها مع وجود البديل الحلال.",
    evidence_summary:
      "حديث لعن آكل الربا وموكله وكاتبه وشاهديه، وقواعد درء المفسدة وسد الذريعة.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 1120,
    published_at: "2025-07-01T09:00:00Z",
    updated_at: "2025-07-01T09:00:00Z",
    created_at: "2025-07-01T09:00:00Z",
  },
  {
    id: "seed-issue-life-insurance",
    slug: "life-insurance-ruling",
    title: "التأمين على الحياة التجاري",
    summary: "مسألة فقهية في حكم التأمين التجاري على الحياة وما يشتمل عليه من غرر وربا.",
    description:
      "التأمين على الحياة من أكثر القضايا انتشاراً في العصر الحديث وأشدّها اشتباكاً مع أحكام المعاملات المالية الإسلامية. تشتمل المسألة على التأمين التعويضي والتأمين الادخاري والفرق بين التأمين التجاري والتكافلي.",
    category: "الاقتصاد الإسلامي",
    subcategory: "الاقتصاد",
    ruling_summary:
      "التأمين التجاري على الحياة محرم لما فيه من الغرر والميسر وأحياناً الربا. أما التأمين التكافلي المبني على التبرع فهو الجائز شرعاً.",
    evidence_summary:
      "النهي عن بيع الغرر، والأحاديث الواردة في الميسر، وقرارات مجمع الفقه الإسلامي الدولي.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 870,
    published_at: "2025-07-02T10:00:00Z",
    updated_at: "2025-07-02T10:00:00Z",
    created_at: "2025-07-02T10:00:00Z",
  },
  {
    id: "seed-issue-cosmetic-surgery",
    slug: "cosmetic-surgery-ruling",
    title: "العمليات التجميلية",
    summary: "مسألة فقهية في ضوابط الجراحة التجميلية ما بين الجائز لإزالة العيب والمحرم لتغيير الخلقة.",
    description:
      "تنقسم الجراحة التجميلية إلى قسمين: جراحة ترميمية (إصلاح عيب خلقي أو مكتسب) وجراحة تجميلية محضة (تعديل صحيح لأغراض تحسين المظهر). والضوابط الفقهية تختلف في الحكم تبعاً للقسم.",
    category: "الطب والنوازل",
    subcategory: "الطب",
    ruling_summary:
      "تجوز الجراحة الترميمية لإزالة العيب والتشوه. أما التجميلية المحضة لتغيير الخلقة الطبيعية فهي محرمة لأنها من تغيير خلق الله.",
    evidence_summary:
      "الحديث: «لعن الله الواشمات والمستوشمات والنامصات والمتنمصات والمتفلجات للحسن المغيرات خلق الله»، وقواعد الضرورة في الترميم.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 1340,
    published_at: "2025-07-03T09:00:00Z",
    updated_at: "2025-07-03T09:00:00Z",
    created_at: "2025-07-03T09:00:00Z",
  },
  {
    id: "seed-issue-etf-index-funds",
    slug: "etf-index-funds-investment",
    title: "الاستثمار في صناديق المؤشرات (ETF)",
    summary: "مسألة فقهية في حكم الاستثمار في صناديق المؤشرات المتداولة (ETF) وصناديق الاستثمار المشتركة.",
    description:
      "صناديق المؤشرات (ETFs) أصبحت من أشهر أدوات الاستثمار في العالم. المسألة الجوهرية هل اشتمالها على شركات غير ممتثلة شرعاً يُحرّم الاستثمار فيها كلياً؟ وما ضوابط الاستثمار في صناديق التقنية والطاقة المتجددة؟",
    category: "الاقتصاد الإسلامي",
    subcategory: "الاقتصاد",
    ruling_summary:
      "يجوز الاستثمار في صناديق المؤشرات التي تجتاز معايير التصفية الشرعية (أقل من 5% إيرادات محرمة) مع التطهير الواجب بالتصدق بنسبة الإيرادات المحرمة. أما الصناديق غير المصفّاة فلا يجوز.",
    evidence_summary:
      "قواعد الضرورة والحاجة في المعاملات، وقرارات مجلس الخدمات المالية الإسلامية (IFSB)، وفتاوى الهيئات الشرعية للبنوك الإسلامية.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 760,
    published_at: "2025-07-04T11:00:00Z",
    updated_at: "2025-07-04T11:00:00Z",
    created_at: "2025-07-04T11:00:00Z",
  },
];

/** ربط المسائل بعناصر البذور عبر slug */
export const FIQH_ISSUE_ITEM_LINKS: Record<string, string[]> = {
  "crypto-currency": ["fiqh-crypto-2024"],
  "organ-donation": ["fiqh-organ-donation"],
  "muslim-minorities-rights": ["fiqh-minorities-rights"],
  "zakat-stocks": ["fiqh-zakat-stocks"],
  "hajj-delay": ["fiqh-collective-fatwa-hajj"],
  "general-anesthesia": ["fiqh-general-anesthesia"],
  "artificial-organ-transplant": ["fiqh-artificial-organ-transplant"],
  "human-cloning": ["fiqh-human-cloning"],
  "abortion-rape-cases": ["fiqh-abortion-rape-cases"],
  "misyar-marriage": ["fiqh-misyar-marriage"],
  "electronic-divorce": ["fiqh-electronic-divorce"],
  "artificial-breastfeeding": ["fiqh-artificial-breastfeeding"],
  "fasting-elderly-disabled": ["fiqh-fasting-elderly-disabled"],
  "astronaut-prayer": ["fiqh-astronaut-prayer"],
  "zakat-crypto": ["fiqh-zakat-crypto"],
  "health-insurance-ruling": ["fiqh-health-insurance-ruling"],
  "stock-market-trading": ["fiqh-stock-market-trading"],
  "organ-donation-will": ["fiqh-organ-donation-will"],
  "milk-bank-breastfeeding": ["fiqh-milk-bank-breastfeeding"],
  "minorities-kitabiyya-marriage": ["fiqh-minorities-kitabiyya-marriage"],
  "ai-in-fatwa": ["fiqh-social-media-dawah", "fiqh-ai-fatwa-tools"],
  "stem-cell-therapy": ["fiqh-surrogacy", "fiqh-genetic-testing"],
  "digital-waqf": ["update-decision-waqf-digital", "fiqh-waqf-stocks"],
  "zakat-real-estate": ["fatwa-zakat-debt"],
  "gender-reassignment-surgery": [],
  "surrogacy-mother": ["fiqh-surrogacy"],
  "euthanasia-mercy-killing": [],
  "covid-vaccine-ruling": [],
  "nft-metaverse-transactions": ["fiqh-crypto-2024"],
  "social-media-dawah": ["fiqh-social-media-dawah", "fiqh-ai-fatwa-tools"],
  "hair-transplant-cosmetic": [],
  "crowdfunding-investment": [],
  "polar-regions-fasting": [],
  "deception-marriage-annulment": [],
  "medicinal-cannabis-cbd": [],
};

export const FIQH_ISSUE_TIMELINE_SEED: Record<string, Omit<FiqhTimelineEvent, "id" | "issue_id">[]> = {
  "crypto-currency": [
    {
      event_type: "first_resolution",
      title: "قرار المجمع في العملات الرقمية",
      description: "بيان حول حكم التعامل بالعملات الرقمية.",
      event_date: "2024-03-15",
      sort_order: 1,
    },
  ],
  "organ-donation": [
    {
      event_type: "recommendation",
      title: "توصية المجمع بالتبرع بالأعضاء",
      description: "توصية بشروط التبرع بعد الوفاة.",
      event_date: "2023-11-08",
      sort_order: 1,
    },
  ],
  "muslim-minorities-rights": [
    {
      event_type: "statement",
      title: "بيان حقوق الأقليات المسلمة",
      event_date: "2023-06-20",
      sort_order: 1,
    },
  ],
  "zakat-stocks": [
    {
      event_type: "first_resolution",
      title: "قرار زكاة الأسهم",
      event_date: "2022-12-05",
      sort_order: 1,
    },
  ],
  "hajj-delay": [
    {
      event_type: "first_resolution",
      title: "فتوى جماعية: وجوب الحج على الفور",
      event_date: "2022-08-01",
      sort_order: 1,
    },
  ],
  "general-anesthesia": [
    {
      event_type: "first_resolution",
      title: "قرار المجمع في حكم التخدير الكلي",
      description: "بيان جواز التخدير الكلي للضرورة الطبية.",
      event_date: "2025-01-10",
      sort_order: 1,
    },
  ],
  "artificial-organ-transplant": [
    {
      event_type: "first_resolution",
      title: "قرار المجمع في زراعة الأعضاء الاصطناعية",
      description: "بيان حكم تركيب الأعضاء الاصطناعية.",
      event_date: "2025-02-20",
      sort_order: 1,
    },
  ],
  "human-cloning": [
    {
      event_type: "first_resolution",
      title: "قرار المجمع في تحريم الاستنساخ البشري التكاثري",
      description: "بيان حكم أنواع الاستنساخ البشري.",
      event_date: "2025-03-05",
      sort_order: 1,
    },
  ],
  "abortion-rape-cases": [
    {
      event_type: "recommendation",
      title: "توصية فقهية في الإجهاض لحالات الاغتصاب",
      description: "ضوابط الإجهاض الاستثنائي قبل نفخ الروح.",
      event_date: "2025-04-12",
      sort_order: 1,
    },
  ],
  "misyar-marriage": [
    {
      event_type: "first_resolution",
      title: "قرار المجمع في زواج المسيار",
      description: "بيان أحكام وضوابط زواج المسيار.",
      event_date: "2024-09-18",
      sort_order: 1,
    },
  ],
  "electronic-divorce": [
    {
      event_type: "first_resolution",
      title: "قرار المجمع في الطلاق الإلكتروني",
      description: "بيان وقوع الطلاق عبر الوسائل الرقمية.",
      event_date: "2024-10-05",
      sort_order: 1,
    },
  ],
  "artificial-breastfeeding": [
    {
      event_type: "statement",
      title: "بيان المجمع في الرضاعة الاصطناعية والمحرمية",
      description: "توضيح ثبوت المحرمية بالرضاعة الاصطناعية.",
      event_date: "2024-11-20",
      sort_order: 1,
    },
  ],
  "fasting-elderly-disabled": [
    {
      event_type: "first_resolution",
      title: "قرار سقوط الصيام عن العاجز بسبب الكبر",
      description: "بيان حكم الفدية عن العاجز عن الصيام.",
      event_date: "2024-12-01",
      sort_order: 1,
    },
  ],
  "astronaut-prayer": [
    {
      event_type: "first_resolution",
      title: "قرار المجمع في صلاة رواد الفضاء",
      description: "بيان أوقات الصلاة والقبلة في المدار الأرضي.",
      event_date: "2025-05-15",
      sort_order: 1,
    },
  ],
  "zakat-crypto": [
    {
      event_type: "first_resolution",
      title: "قرار المجمع في زكاة العملات الرقمية",
      description: "بيان نسبة الزكاة وكيفية حسابها على العملات الرقمية.",
      event_date: "2025-06-01",
      sort_order: 1,
    },
  ],
  "health-insurance-ruling": [
    {
      event_type: "first_resolution",
      title: "قرار المجمع في حكم التأمين الصحي",
      description: "التفريق بين التأمين التعاوني والتجاري.",
      event_date: "2025-07-10",
      sort_order: 1,
    },
  ],
  "stock-market-trading": [
    {
      event_type: "first_resolution",
      title: "قرار المجمع في تداول الأسهم في البورصة",
      description: "ضوابط جواز التعامل في أسهم الشركات.",
      event_date: "2025-08-05",
      sort_order: 1,
    },
  ],
  "organ-donation-will": [
    {
      event_type: "recommendation",
      title: "توصية المجمع بصحة وصية التبرع بالأعضاء",
      description: "بيان الأثر الشرعي لوصية التبرع بالأعضاء.",
      event_date: "2025-09-12",
      sort_order: 1,
    },
  ],
  "milk-bank-breastfeeding": [
    {
      event_type: "statement",
      title: "بيان المجمع في حكم بنوك الحليب",
      description: "تحذير من استخدام بنوك الحليب المختلط.",
      event_date: "2025-10-20",
      sort_order: 1,
    },
  ],
  "minorities-kitabiyya-marriage": [
    {
      event_type: "first_resolution",
      title: "قرار المجمع في زواج المسلم من الكتابية في الغرب",
      description: "ضوابط وحكم زواج المسلم من الكتابية في بيئة الأقليات.",
      event_date: "2025-11-08",
      sort_order: 1,
    },
  ],
  "hair-transplant-cosmetic": [
    {
      event_type: "first_resolution",
      title: "قرار المجمع في حكم زراعة الشعر",
      description: "بيان جواز زراعة الشعر وضوابطها الشرعية.",
      event_date: "2025-02-10",
      sort_order: 1,
    },
  ],
  "crowdfunding-investment": [
    {
      event_type: "first_resolution",
      title: "قرار المجمع في التمويل الجماعي",
      description: "بيان أنواع التمويل الجماعي وأحكامها الشرعية.",
      event_date: "2025-03-18",
      sort_order: 1,
    },
  ],
  "polar-regions-fasting": [
    {
      event_type: "statement",
      title: "بيان المجمع في الصيام بالبلاد القطبية",
      description: "ضوابط تقدير أوقات الصلاة والصيام في البلاد الشمالية.",
      event_date: "2025-04-05",
      sort_order: 1,
    },
  ],
  "deception-marriage-annulment": [
    {
      event_type: "first_resolution",
      title: "قرار المجمع في الغش في عقد الزواج",
      description: "بيان أثر التدليس على عقد النكاح وحق الفسخ.",
      event_date: "2025-05-20",
      sort_order: 1,
    },
  ],
  "medicinal-cannabis-cbd": [
    {
      event_type: "statement",
      title: "بيان المجمع في زيت CBD الطبي",
      description: "بيان ضوابط استخدام مستخلصات القنب الطبية.",
      event_date: "2025-06-12",
      sort_order: 1,
    },
  ],
};

export function findFiqhIssueBySlug(slug: string) {
  return FIQH_ISSUES_PUBLISHED_SEED.find((i) => i.slug === slug) || null;
}
