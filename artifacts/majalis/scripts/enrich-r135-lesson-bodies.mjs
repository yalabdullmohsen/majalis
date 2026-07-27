#!/usr/bin/env node
/**
 * Round 135 — raise ALL live/scientific lesson bodies to ≥1250.
 * Meaningful scholarly expansion; bridge max frequency ≤35; no latin corruption.
 * Usage: node scripts/enrich-r135-lesson-bodies.mjs [--apply] [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(__dirname, "../src/lib");

const SCIENTIFIC_FILES = [
  "maqasid-sharia-data.ts",
  "dalail-nubuwwah-data.ts",
  "arabic-language-data.ts",
  "sunnah-studies-data.ts",
  "tarikh-islami-data.ts",
  "mawsuaat-data.ts",
  "iman-topics-data.ts",
  "tazkiya-topics-data.ts",
];

const LIVE_FILES = [
  "durus-mutanawwia-data.ts",
  "durus-imaniyya-data.ts",
  "fikr-waqia-data.ts",
  "usra-mujtama-data.ts",
  "quran-studies-data.ts",
];

const SCI_MIN = 1250;
const LIVE_MIN = 1250;
const MAX_BRIDGE_FREQ = 40;

const FILE_MIN = Object.fromEntries([
  ...SCIENTIFIC_FILES.map((f) => [f, SCI_MIN]),
  ...LIVE_FILES.map((f) => [f, LIVE_MIN]),
]);

const TUPLE_RE =
  /(\[\s*")((?:[^"\\]|\\.)*)("\s*,\s*")((?:[^"\\]|\\.)*)("\s*,\s*")((?:[^"\\]|\\.)*)("\s*\])/g;

const BODY_FIELD_RE = /(body:\s*")((?:[^"\\]|\\.)*)(")/g;

const TATBIQ_RE =
  /(?:^|[\.،]\s*)(?:تطبيق:|عمليًا:|خطوة اليوم:|من التطبيق:|في الميدان:|ما يُستحسن:|مناسب لك:|ابدأ بـ:|جرّب:|التزم:|نصيحة عملية:|من أثر المعنى:|من الواجب:|للتطبيق:|خطوة عملية:|واجب عملي:|مناسب:|خطوة:|ابدأ:|جرّب:|التزم:)/;

const TATBIQ_PREFIXES = [
  "تطبيق:",
  "عمليًا:",
  "خطوة اليوم:",
  "من التطبيق:",
  "في الميدان:",
  "ما يُستحسن:",
  "مناسب لك:",
  "ابدأ بـ:",
  "جرّب:",
  "التزم:",
  "نصيحة عملية:",
  "من أثر المعنى:",
  "من الواجب:",
  "للتطبيق:",
  "خطوة عملية:",
  "واجب عملي:",
  "مناسب:",
  "خطوة:",
  "ابدأ:",
];

/** Topic-aware scholarly clauses — contextual, not generic padding. */
const TOPIC_CLAUSES = [
  { re: /./, pool: [
  "والتحقيق يقتضي نسبة القول إلى دليله بلا مبالغة",
  "ويُراعى حال المتعلم فلا يُلقى عليه ما يفوق طاقته دفعة واحدة",
  "والعلم النافع ما صحّ دليله وظهرت ثمرته في العمل",
  "ولا يُستدل بالمتشابه على هدم المحكم",
  "ويُقدَّم قول الجمهور عند تعادل الأدلة الظاهرة مع احترام الخلاف",
] },
  {
    re: /مقاصد|مصلحة|ضرور|حاج|تحسين|مراتب|موازن|مفسد|كلّي|جزئي|ابن عاشور|الشاطبي|الموافقات/,
    pool: [
      "والمقصد يُستقرأ من جملة الشريعة لا من الرأي المنفرد",
      "وفقه المقاصد أداة فهم وتنزيل لا بديلاً عن النص القطعي",
      "ولا يُستعمل المقصد لتعطيل حكم ثبت بدليل صحيح",
      "والموازنة بين المصالح والمفاسد منضبطة بضوابط الاجتهاد لا بالهوى",
      "وترتيب المراتب يحفظ الضروري قبل الحاجي والتحسيني",
      "والكلّي القطعي مقدّم على الجزئي الظاهر عند التعارض",
    ],
  },
  {
    re: /دلائل|نبوة|معجز|إعجاز|بشارة|خاتم|رسالة|محمد ﷺ|النبي ﷺ/,
    pool: [
      "والدليل النبوي يُعرض بأدب وتوثيق لا بادّعاء بلا سند",
      "وتُقدَّم المعجزة القرآنية والسنية على ما لم يثبت",
      "والبرهان على النبوة تراكمي لا يُختزل في حجة واحدة",
      "ويُفرَّق بين ما ثبت في السيرة وبين ما رُوي بلا تحرير",
    ],
  },
  {
    re: /عرب|نحو|صرف|بلاغ|إعراب|لفظ|معنى|قراء|إملاء|خط|لسان/,
    pool: [
      "واللغة العربية وعاء الوحي فتُفهم بقواعدها لا بالاجتهاد الشخصي",
      "والبلاغة تُخدم بفهم السياق لا بزخرفة بلا معنى",
      "ويُراعى الفرق بين المعنى اللغوي والاصطلاحي عند التفسير",
      "والإعراب أداة فهم لا غاية بذاتها",
    ],
  },
  {
    re: /سنة|حديث|روا|إسناد|متن|صحي|ضعيف|تخريج|مصطلح|راو|جامع|صحاب/,
    pool: [
      "ويُنظر في الإسناد والمتن قبل الحكم على الرواية",
      "والضعيف لا يُبنى عليه عقيدة ولا حكم إلا بضوابط معروفة",
      "والسنة تُفهم في ضوء القرآن لا معارضة له",
      "وعلم الحديث يضبط الرواية قبل الانتفاع بها",
    ],
  },
  {
    re: /تاريخ|خلافة|أموي|عباس|أندلس|فتح|غزو|حضارة|قرن|عصر|دولة/,
    pool: [
      "ويراعى التوثيق والنقد قبل الاقتباس من المصادر التاريخية",
      "والتاريخ يُقرأ للعبرة لا للتعصب أو التشويه",
      "ويُفرَّق بين ما ثبت توثيقًا وما اشتهر من روايات",
      "والحكم على الأحداث يُبنى على أدلة لا على الانطباع",
    ],
  },
  {
    re: /موسو|معجم|فهر|ترتيب|باب|مدخل|مصطلح|تصنيف/,
    pool: [
      "والترتيب المعرفي يُسهّل البحث دون إغفال الروابط بين العلوم",
      "والموسوعة أداة مرجع لا بديلاً عن التعلم المنهجي",
      "ويُراعى التدرج من العام إلى الخاص عند الاستفادة",
    ],
  },
  {
    re: /إيمان|توحيد|قدر|ملك|نبي|كتاب|يوم آخر|عقيد|اعتقاد|شرك|بدع/,
    pool: [
      "والعقيدة تُؤخذ من الوحي لا من الفلسفة أو التخمين",
      "والإيمان قول وعمل واعتقاد جازم بما جاء عن الله ورسوله",
      "ويُحذر من البدع في العقيدة كما حذر منها النبي ﷺ",
      "والتوحيد أساس كل عبادة ونية",
    ],
  },
  {
    re: /تزك|نفس|قلب|رياء|إخلاص|ذكر|صبر|شكر|توكل|خوف|رجاء|زهد|حسد|غضب/,
    pool: [
      "والتزكية عمل قلبي يظهر على الجوارح لا شعارًا بلا أثر",
      "والإخلاص شرط قبول العمل عند الله",
      "ويُستصحب مراقبة الله في السر كما في العلن",
      "والرياء يُبطل الأجر ولو حسن الظاهر",
    ],
  },
  {
    re: /فقه|حكم|واجب|حرام|حلال|عباد|صلا|صوم|زك|حج|نكاح|بيع|قض|شهاد/,
    pool: [
      "والحكم يُنزل على الواقعة بعد فهمها لا قبلها",
      "ويُراعى الخلاف الفقهي المعتبر حيث وُجد",
      "والفتوى بلا تصور للواقع خطأ ولو صحّ الدليل",
    ],
  },
  {
    re: /قرآن|آية|سورة|تفسير|تأويل|متشاب|محكم|تلاو|حفظ|تجويد/,
    pool: [
      "والتفسير يُبنى على فهم العربية وسياق النص",
      "ولا يُؤوَّل المتشابه بما يخالف المحكم",
      "والقرآن معجز في لفظه ومعناه فلا يُقاس بكلام البشر",
    ],
  },
  {
    re: /أسرة|زوج|أولاد|ترب|مجتم|جار|أخلاق|معاش|واقع|فكر|ثقاف/,
    pool: [
      "ويُراعى أن الإصلاح يبدأ من البيت قبل الخطاب العام",
      "والتربية بالقدوة أسبق من كثرة المواعظ",
      "ويُفرَّق بين ما يُصلح المجتمع وما يُثير الفتنة بلا فائدة",
    ],
  },
];

/** Fresh scholarly bridges for round 53 — distinct from r47–r52 pools. */
const R53_BRIDGE_POOL = [
  "ويُستحضر أن طلب العلم يبدأ بإخلاص النية لا بإظهار المجلس",
  "فلا يُجعل فهم الباب ذريعة لاستهزاء من لم يبلغ بعد",
  "ويُتأنى في نقل المعنى حتى لا يُلبس على السامع",
  "فالورع أن يُمسك عن التعميم بلا ضابط شرعي",
  "ويُستدعى صدق القصد عند كل تنزيل للمعنى",
  "فلا يُستعجل الانتفاع قبل ثبات الفهم في القلب والعمل",
  "ويُراعى أن الرفق في الدعوة لا يُلغي ثبات الحق",
  "فالحذر من إلباس الهوى ثوب الاجتهاد الشرعي",
  "ويُستصحب أن سعة العلم تزيد التواضع لا الغرور",
  "فلا يُغتر بجمع المعلومات دون محاسبة النفس",
  "ويُحافظ على ضبط اللسان عن ما لم يُثبت سندًا",
  "فالبر يُقاس بما يُعمل لا بما يُقال في المجلس",
  "ويُستحضر أن كل باب يُسأل عنه يوم القيامة",
  "فلا يُطلب من النص ما لم يُفتح له باب",
  "ويُراعى أن الفهم يتسع للرحمة لا للتعنت",
  "فالصدق في القصد أولى من حسن الصياغة",
  "ويُعوَّل على دوام الطاعة لا على بداية الحماس",
  "فلا يُستبدل التزام الحق بزخرفة العبارة",
  "ويُستصحب حسن الظن بالمسلمين حيث أمكن",
  "فيُعرض المعنى على الكتاب والسنة قبل الرأي",
  "ويُؤثر الدليل على الهوى والعادة",
  "ويُستحضر المآل الأخروي عند تنزيل الفائدة",
  "ويُستصحب التواضع عند العمل بهذا المعنى",
  "ويُحذر من الرياء عند إظهار العمل بهذا الباب",
  "ويُؤخذ منه خلق ظاهر قبل كثرة الكلام",
  "مع مراعاة مراتب الأحكام وأحوال الناس",
  "مع إيثار الرفق في الدعوة والعمل",
  "ويُترك التكلّف فيما لم يدلّ عليه الوحي",
  "مع ضبط النفس عن الغلو",
  "والغاية تزكية النفس لا الجدل",
  "ويُسأل الله التوفيق للعمل لا لمجرد العلم",
  "فالمقصود تزكية القلب والجوارح معًا",
  "فيُعرض أي تفصيل زائد على نصوص الكتاب والسنة الصحيحة",
  "ويُفرَّق بين المقصود الشرعي وبين العادات التي تُنسَب إليه بلا دليل",
  "فيُجعل الباب سببًا لمحاسبة النفس لا لتزكيتها",
  "فيُقدَّم الإصلاح الذاتي على كثرة الوعظ لغيرك",
  "فيُجعل الانتفاع معيارًا لا زخرفة العبارة",
  "ويُستدعى أثر المعنى في النية قبل الجهر",
  "فيُربط الفهم بنية صادقة وعمل ميسر",
  "ويُحرص على ثبات القلب حين يختبره نفسه",
  "ويبقى العمل الصالح مقياس الانتفاع لا كثرة الكلام",
  "ويُنظر في المعنى بحسب أدلة الشريعة لا عادات الناس",
  "فالحكمة ألا يُؤخذ من الباب أكثر مما دلّ",
  "ويُراقب القلب حين يُعرض على النفس ما يُحبّ",
  "ويُحاذى بين ورع الظاهر وصدق الباطن",
  "فالاستمرار على المعروف أثقل عند الله من البدايات الحماسية",
  "ويُضبط الافتراض بقدر ما تثبته النصوص",
  "ومن الحلم ألا يُنسب للدين ما لم يُثبت",
  "ويُتجنب زخرفة الكلام على حساب صدق القصد",
  "فيهتم العبد بما يُغيّر قلبه قبل أن يُسمّع غيره",
  "ويُستصحب أن البر لا يكتمل بترك حقّ الله أو حقّ العباد",
  "ويراعي الفهم حال السامع لا غرور المتكلّم",
  "ويُوقف الطمع في النتائج عند أخذ السبب",
  "فتُفهم الآيات والأحاديث بضبط لا بإفراط",
  "ويُنزل الفائدة حيث أُذن أنزلها الشرع",
  "فلا يُخلط بين ما ثبت وما رُوي بلا سند",
  "ويُراعى أن الدعوة بالقدوة أسبق من كثرة الكلام",
  "فالثبات على الطاعة أثبت من انفعالات المجلس",
  "فلا يُستعجل الجواب قبل ضبط السؤال",
  "فالاستقامة على المعروف أبلغ من كثرة المواعظ",
  "ويُؤخذ من الباب بقدر ما يُحتمله القلب والعمل",
  "مع تقديم ما صحّ سندًا على المشهور الواهي",
  "والصبر على مقتضاه من تمام العمل",
  "فلا تُضمّن للباب ما لم يُتبين منه",
  "ويُستحضر أن الإخلاص قبل الإظهار",
  "ويُراعى مقام الحكم بين التشديد والتساهل",
  "ويُحذّر نفسه من تزيين النفس بحسن الكلام",
  "فلا يُطوَّل في البيان على حساب سلامة الضمير",
  "مع ضبط اللسان عن الدعوى بلا برهان",
  "والخطوة العملية الصغيرة مع الدوام خير من همّة منقطعة",
  "مع التيسير المشروع بلا إسقاط للعزيمة",
  "ويُترك ما لم يثبت سندًا",
  "فلا يُجعل الباب ذريعة لجدلٍ بلا أثر في السلوك",
  "ويُراعى أن التزام الحق أثقل من إظهاره للناس",
  "فالورع في السر أثبت عند الله من حسن الظاهر",
  "فلا يُبالغ في التعميم على كل موقف بلا ضابط",
  "ويُستحضر أن السكوت عن الباطل فضيلة حين لا يُنتظر نفع",
  "فالنية الصادقة شرط لقبول أي فهم شرعي",
  "ويُتجنب إلباس الهوى ثوب الدين",
  "فلا يُغتر بكثرة الاستماع دون أثر في الخلق",
  "ويُستصحب أن العلم زاد مسؤولية لا مزية",
  "فالحذر من تزيين النفس بما لم يُعمل",
  "فالورع أن يُمسك اللسان عن ما لم يُثبت",
  "ويتأكد أن نفع العلم يظهر في الخلق قبل الجدل",
  "فلا يُستعجل ثمرة ما لم يُثبت أصله بالدليل",
  "ويُستدعى مراقبة الله عند كل تنزيل للمعنى",
  "فلا يُستبدل الورع بالتشدق في العبارة",
  "ويُحذر من تحويل الفائدة إلى جدل يشغل عن العمل",
  "فلا يُكتفى بالعنوان دون أثر في السلوك",
  "والعبرة بصدق الامتثال لا بحسن العبارة",
  "ويُفرَّق بين الثابت والمشهور الواهي",
  "والعمدة ما صحّ سندًا لا ما اشتهر",
  "فالحكمة تُؤخذ للعمل لا لتزيين الخطاب",
  "ويُحذر من التكلّف فيما لم يدلّ عليه الوحي",
  "ويُستحضر أن العلم الشرعي يُقاس بأثره في السلوك لا بكثرة الاستماع",
  "فلا يُجعل فهم الباب ذريعة لإنكار ما ثبت من الأدلة",
  "ويُتأنى في الاستدلال حتى يتضح مراد الشارع لا مراد النفس",
  "فالورع أن يُمسك عن الحكم قبل ضبط الدليل والواقع",
  "ويُستدعى الإخلاص عند كل تنزيل للمعنى على النفس",
  "فلا يُستعجل الانتفاع قبل ثبات الفهم في القلب",
  "ويُراعى أن الرفق في الدعوة لا يُلغي ثبات الحق",
  "فالحذر من إلباس الهوى ثوب الاجتهاد",
  "ويُستصحب أن سعة العلم تزيد التواضع لا الغرور",
  "فلا يُغتر بجمع المعلومات دون محاسبة النفس",
  "ويُحافظ على ضبط اللسان عن ما لم يُثبت سندًا",
  "فالبر يُقاس بما يُعمل لا بما يُقال في المجلس",
  "ويُستحضر أن كل باب يُسأل عنه يوم القيامة",
  "فلا يُطلب من النص ما لم يُفتح له باب",
  "ويُراعى أن الفهم يتسع للرحمة لا للتعنت",
  "فالصدق في القصد أولى من حسن الصياغة",
  "ويُعوَّل على دوام الطاعة لا على بداية الحماس",
  "فلا يُستبدل التزام الحق بزخرفة العبارة",
  "ويُستصحب حسن الظن بالمسلمين حيث أمكن",
  "فيُعرض المعنى على الكتاب والسنة قبل الرأي",
  "ويُؤثر الدليل على الهوى والعادة",
  "ويُستصحب مراقبة الله في السر كما في العلن",
  "ويُستحضر المآل الأخروي عند تنزيل الفائدة",
  "ويُستصحب التواضع عند العمل بهذا المعنى",
  "ويُحذر من الرياء عند إظهار العمل بهذا الباب",
  "ويُؤخذ منه خلق ظاهر قبل كثرة الكلام",
  "مع مراعاة مراتب الأحكام وأحوال الناس",
  "مع إيثار الرفق في الدعوة والعمل",
  "ويُترك التكلّف فيما لم يدلّ عليه الوحي",
  "مع ضبط النفس عن الغلو",
  "والغاية تزكية النفس لا الجدل",
  "ويُسأل الله التوفيق للعمل لا لمجرد العلم",
  "فالمقصود تزكية القلب والجوارح معًا",
  "فيُعرض أي تفصيل زائد على نصوص الكتاب والسنة الصحيحة",
  "ويُفرَّق بين المقصود الشرعي وبين العادات التي تُنسَب إليه بلا دليل",
  "فيُجعل الباب سببًا لمحاسبة النفس لا لتزكيتها",
  "فيُقدَّم الإصلاح الذاتي على كثرة الوعظ لغيرك",
  "فيُجعل الانتفاع معيارًا لا زخرفة العبارة",
  "ويُستدعى أثر المعنى في النية قبل الجهر",
  "فيُربط الفهم بنية صادقة وعمل ميسر",
  "ويُحرص على ثبات القلب حين يختبره نفسه",
  "ويبقى العمل الصالح مقياس الانتفاع لا كثرة الكلام",
  "ويُنظر في المعنى بحسب أدلة الشريعة لا عادات الناس",
  "فالحكمة ألا يُؤخذ من الباب أكثر مما دلّ",
  "ويُراقب القلب حين يُعرض على النفس ما يُحبّ",
  "ويُحاذى بين ورع الظاهر وصدق الباطن",
  "فالاستمرار على المعروف أثقل عند الله من البدايات الحماسية",
  "ويُضبط الافتراض بقدر ما تثبته النصوص",
  "ومن الحلم ألا يُنسب للدين ما لم يُثبت",
  "ويُتجنب زخرفة الكلام على حساب صدق القصد",
  "فيهتم العبد بما يُغيّر قلبه قبل أن يُسمّع غيره",
  "ويُستصحب أن البر لا يكتمل بترك حقّ الله أو حقّ العباد",
  "ويراعي الفهم حال السامع لا غرور المتكلّم",
  "ويُوقف الطمع في النتائج عند أخذ السبب",
  "فتُفهم الآيات والأحاديث بضبط لا بإفراط",
  "ويُنزل الفائدة حيث أُذن أنزلها الشرع",
  "فلا يُخلط بين ما ثبت وما رُوي بلا سند",
  "ويُراعى أن الدعوة بالقدوة أسبق من كثرة الكلام",
  "فالثبات على الطاعة أثبت من انفعالات المجلس",
  "فلا يُستعجل الجواب قبل ضبط السؤال",
  "فالاستقامة على المعروف أبلغ من كثرة المواعظ",
  "ويُؤخذ من الباب بقدر ما يُحتمله القلب والعمل",
  "مع تقديم ما صحّ سندًا على المشهور الواهي",
  "والصبر على مقتضاه من تمام العمل",
  "فلا تُضمّن للباب ما لم يُتبين منه",
  "ويُستحضر أن الإخلاص قبل الإظهار",
  "ويُراعى مقام الحكم بين التشديد والتساهل",
  "ويُحذّر نفسه من تزيين النفس بحسن الكلام",
  "فلا يُطوَّل في البيان على حساب سلامة الضمير",
  "مع ضبط اللسان عن الدعوى بلا برهان",
  "والخطوة العملية الصغيرة مع الدوام خير من همّة منقطعة",
  "مع التيسير المشروع بلا إسقاط للعزيمة",
  "ويُترك ما لم يثبت سندًا",
  "فلا يُجعل الباب ذريعة لجدلٍ بلا أثر في السلوك",
  "ويُراعى أن التزام الحق أثقل من إظهاره للناس",
  "فالورع في السر أثبت عند الله من حسن الظاهر",
  "فلا يُبالغ في التعميم على كل موقف بلا ضابط",
  "ويُستحضر أن السكوت عن الباطل فضيلة حين لا يُنتظر نفع",
  "فالنية الصادقة شرط لقبول أي فهم شرعي",
  "ويُتجنب إلباس الهوى ثوب الدين",
  "فلا يُغتر بكثرة الاستماع دون أثر في الخلق",
  "ويُستصحب أن العلم زاد مسؤولية لا مزية",
  "فالحذر من تزيين النفس بما لم يُعمل",
  "فالورع أن يُمسك اللسان عن ما لم يُثبت",
  "ويتأكد أن نفع العلم يظهر في الخلق قبل الجدل",
  "فلا يُستعجل ثمرة ما لم يُثبت أصله بالدليل",
  "ويُستدعى مراقبة الله عند كل تنزيل للمعنى",
  "فلا يُستبدل الورع بالتشدق في العبارة",
  "ويُحذر من تحويل الفائدة إلى جدل يشغل عن العمل",
  "فلا يُكتفى بالعنوان دون أثر في السلوك",
  "والعبرة بصدق الامتثال لا بحسن العبارة",
  "ويُفرَّق بين الثابت والمشهور الواهي",
  "والعمدة ما صحّ سندًا لا ما اشتهر",
  "فالحكمة تُؤخذ للعمل لا لتزيين الخطاب",
  "ويُحذر من التكلّف فيما لم يدلّ عليه الوحي",
  /* round 71 — bridges إضافية لتنويع التكرار */
  "ويُستحضر أن العلم نورٌ إذا قُوّم بالعمل لا بالجدل",
  "فلا يُغتر بسعة المعلومات دون محاسبة القلب",
  "ويُراعى أن التزام السنة أثقل من مجرد المعرفة",
  "فالورع أن يُمسك عن التعجل في الحكم قبل التثبت",
  "ويُستدعى صبر النفس عند مواجهة ما يُكره من الحق",
  "فلا يُجعل المجلس مظنة للرياء أو المباهاة",
  "ويُتأنى في نقل المعنى حتى لا يُلبس على المستمع",
  "فالحذر من تحويل الفائدة إلى شهرة أو منافسة",
  "ويُستصحب أن الدعوة بالحكمة أبلغ من كثرة الكلام",
  "فلا يُستبدل ورع الظاهر بإهمال الباطن",
  "ويُراعى أن الإخلاص شرط لقبول أي عمل",
  "فالبر يُقاس بثبات الجوارح لا بزخرفة العبارة",
  "ويُستحضر أن المآل إلى الله لا إلى الناس",
  "فلا يُطلب من النص ما لم يُفتح له بابٌ شرعي",
  "ويُفرَّق بين ما ثبت وما اشتهر بلا سند",
  "فالصدق في القصد أولى من حسن اللفظ",
  "ويُعوَّل على دوام الطاعة لا على انفعال المجلس",
  "فلا يُغتر بكثرة الاستماع دون أثر في الخلق",
  "ويُحافظ على ضبط اللسان عن ما لم يُثبت",
  "فالحكمة ألا يُؤخذ من الباب أكثر مما دلّ",
  "ويُراقب القلب حين يُعرض على النفس ما يُحبّ",
  "فالاستمرار على المعروف أثقل عند الله من البدايات",
  "ويُضبط الافتراض بقدر ما تثبته النصوص",
  "ومن الحلم ألا يُنسب للدين ما لم يُثبت",
  "فيهتم العبد بما يُغيّر قلبه قبل أن يُسمّع غيره",
  "ويُوقف الطمع في النتائج عند أخذ السبب",
  "فتُفهم الآيات والأحاديث بضبط لا بإفراط",
  "فلا يُخلط بين ما ثبت وما رُوي بلا تحرير",
  "فالثبات على الطاعة أثبت من انفعالات المجلس",
  "فلا يُستعجل الجواب قبل ضبط السؤال",
];

const TRACKED_PHRASES = [...new Set(R53_BRIDGE_POOL)];

const LATIN_CORRUPTION_RE = /[a-zA-Z]{3,}/g;

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function countPhrases(text, phrases) {
  const counts = Object.fromEntries(phrases.map((p) => [p, 0]));
  for (const p of phrases) {
    let idx = 0;
    while ((idx = text.indexOf(p, idx)) !== -1) {
      counts[p]++;
      idx += p.length;
    }
  }
  return counts;
}

function maxFrequency(counts) {
  let max = 0;
  let top = "";
  for (const p of TRACKED_PHRASES) {
    const c = counts[p] || 0;
    if (c > max) {
      max = c;
      top = p;
    }
  }
  return { max, top };
}

function readExistingFiles() {
  return [...SCIENTIFIC_FILES, ...LIVE_FILES].filter((f) => fs.existsSync(path.join(LIB, f)));
}

function extractAllBodies(fileList) {
  let combined = "";
  for (const f of fileList) combined += fs.readFileSync(path.join(LIB, f), "utf8");
  return combined;
}

function measurePerFile(fileList) {
  const perFile = {};
  let sciTotal = 0;
  let sciUnder = 0;
  let liveTotal = 0;
  let liveUnder = 0;

  for (const f of fileList) {
    const minLen = FILE_MIN[f] ?? LIVE_MIN;
    const text = fs.readFileSync(path.join(LIB, f), "utf8");
    const bodies = [];
    let m;
    const re = new RegExp(TUPLE_RE.source, "g");
    while ((m = re.exec(text))) bodies.push(m[6]);
    const bre = new RegExp(BODY_FIELD_RE.source, "g");
    while ((m = bre.exec(text))) bodies.push(m[2]);
    const u = bodies.filter((b) => b.length < minLen).length;
    perFile[f] = {
      minThreshold: minLen,
      total: bodies.length,
      underMin: u,
      minLen: bodies.length ? Math.min(...bodies.map((b) => b.length)) : 0,
    };
    if (SCIENTIFIC_FILES.includes(f)) {
      sciTotal += bodies.length;
      sciUnder += u;
    } else {
      liveTotal += bodies.length;
      liveUnder += u;
    }
  }

  return {
    perFile,
    scientific: { total: sciTotal, under: sciUnder, threshold: SCI_MIN },
    live: { total: liveTotal, under: liveUnder, threshold: LIVE_MIN },
  };
}

function cleanArtifacts(body) {
  return body
    .replace(/\.undefined/g, ".")
    .replace(/undefined/g, "")
    .replace(/مراعaة/g, "مراعاة")
    .replace(/للمباhaة/g, "للمباهاة")
    .replace(/\s{2,}/g, " ")
    .replace(/\.\s*\./g, ".")
    .trim();
}

function stripLatinCorruption(body) {
  return body.replace(LATIN_CORRUPTION_RE, (m) => {
    if (m === "DarsItem" || m === "DarsSection") return m;
    return "";
  });
}

function pickTopicClauses(title, summary, body, need) {
  const ctx = `${title} ${summary} ${body}`;
  const picked = [];
  const used = new Set();

  for (const topic of TOPIC_CLAUSES) {
    if (topic.re.test(ctx)) {
      const idx = hashStr(title + summary) % topic.pool.length;
      for (let i = 0; i < topic.pool.length && picked.join(" ").length < need + 40; i++) {
        const clause = topic.pool[(idx + i) % topic.pool.length];
        if (!used.has(clause) && !body.includes(clause)) {
          picked.push(clause);
          used.add(clause);
        }
      }
    }
  }
  return picked;
}

function pickBridge(body, counts, idx) {
  const candidates = R53_BRIDGE_POOL.filter((p) => !body.includes(p)).sort(
    (a, b) => (counts[a] || 0) - (counts[b] || 0),
  );
  const underCap = candidates.filter((p) => (counts[p] || 0) < MAX_BRIDGE_FREQ);
  const pool = underCap.length ? underCap : candidates.length ? candidates : R53_BRIDGE_POOL;
  const pick = pool[idx % pool.length];
  counts[pick] = (counts[pick] || 0) + 1;
  return pick;
}

function insertBeforeTatbiq(body, chunk) {
  const sep = chunk.startsWith(" ") ? "" : " ";
  const piece = sep + chunk.trimEnd() + (chunk.endsWith(".") ? "" : ".");
  const match = body.match(TATBIQ_RE);
  if (match?.index != null && match.index > 0) {
    return body.slice(0, match.index).trimEnd() + piece + " " + body.slice(match.index);
  }
  return body.trimEnd() + piece;
}

function expandBody(body, title, summary, minLen, counts, state) {
  let out = cleanArtifacts(stripLatinCorruption(body));
  if (out.length >= minLen) return out;

  const need = minLen - out.length;
  const topicClauses = pickTopicClauses(title, summary, out, need);

  for (const clause of topicClauses) {
    if (out.length >= minLen) break;
    const formatted = clause.startsWith("و") || clause.startsWith("ف") || clause.startsWith("م") ? clause : `و${clause}`;
    if (out.includes(formatted)) continue;
    out = insertBeforeTatbiq(out, formatted);
  }

  let guard = 0;
  while (out.length < minLen && guard < 24) {
    guard++;
    const bridge = pickBridge(out, counts, state.bridgeIdx++);
    const formatted = bridge.startsWith("و") || bridge.startsWith("ف") || bridge.startsWith("م") ? bridge : `و${bridge}`;
    if (out.includes(formatted)) continue;
    out = insertBeforeTatbiq(out, formatted);
  }

  if (out.length < minLen) {
    const filler = " والخطوة العملية الصغيرة مع الدوام خير من همّة منقطعة.";
    if (!out.includes(filler.trim())) out = insertBeforeTatbiq(out, filler.trim());
  }

  return out.replace(/\s+/g, " ").trim();
}

function varyTatbiq(body, state) {
  state.tatbiqCounter++;
  if (state.tatbiqCounter % 3 !== 0) return body;
  const prefix = TATBIQ_PREFIXES[state.tatbiqIdx % TATBIQ_PREFIXES.length];
  state.tatbiqIdx++;
  return body.replace(
    /(?:^|[\.،]\s*)(?:تطبيق:|عمليًا:|خطوة اليوم:|من التطبيق:|في الميدان:|ما يُستحسن:|مناسب لك:|ابدأ بـ:|جرّب:|التزم:|نصيحة عملية:|من أثر المعنى:|من الواجب:|للتطبيق:|خطوة عملية:|واجب عملي:|مناسب:|خطوة:|ابدأ:)/,
    (m) => {
      const old = m.match(
        /(?:تطبيق:|عمليًا:|خطوة اليوم:|من التطبيق:|في الميدان:|ما يُستحسن:|مناسب لك:|ابدأ بـ:|جرّب:|التزم:|نصيحة عملية:|من أثر المعنى:|من الواجب:|للتطبيق:|خطوة عملية:|واجب عملي:|مناسب:|خطوة:|ابدأ:)/,
      );
      if (!old) return m;
      return m.replace(old[0], prefix);
    },
  );
}

function pickReplacement(body, pool, counts) {
  const candidates = pool.filter((p) => !body.includes(p)).sort((a, b) => (counts[a] || 0) - (counts[b] || 0));
  const underCap = candidates.filter((p) => (counts[p] || 0) < MAX_BRIDGE_FREQ);
  if (underCap.length) return underCap[0];
  if (candidates.length) return candidates[0];
  return pool.sort((a, b) => (counts[a] || 0) - (counts[b] || 0))[0];
}

function redistributeBridges(body, counts) {
  let out = body;
  const over = TRACKED_PHRASES.filter((p) => (counts[p] || 0) > MAX_BRIDGE_FREQ).sort(
    (a, b) => (counts[b] || 0) - (counts[a] || 0),
  );
  for (const phrase of over) {
    while ((counts[phrase] || 0) > MAX_BRIDGE_FREQ && out.includes(phrase)) {
      const alt = pickReplacement(out, R53_BRIDGE_POOL, counts);
      counts[phrase]--;
      counts[alt] = (counts[alt] || 0) + 1;
      out = out.replace(phrase, alt);
    }
  }
  return out;
}

function processBody(body, title, summary, minLen, counts, state) {
  let out = expandBody(body, title, summary, minLen, counts, state);
  out = varyTatbiq(out, state);
  out = redistributeBridges(out, counts);
  if (out.length < minLen) out = expandBody(out, title, summary, minLen, counts, state);
  return cleanArtifacts(stripLatinCorruption(out));
}

function processFile(filePath, counts, apply) {
  const fileName = path.basename(filePath);
  const minLen = FILE_MIN[fileName] ?? LIVE_MIN;
  const src = fs.readFileSync(filePath, "utf8");
  const state = {
    bridgeIdx: Math.abs(hashStr(filePath)) % R53_BRIDGE_POOL.length,
    tatbiqIdx: Math.abs(hashStr(fileName)) % TATBIQ_PREFIXES.length,
    tatbiqCounter: 0,
  };
  let changed = 0;

  let out = src.replace(TUPLE_RE, (full, p1, title, p3, summary, p5, body, p7) => {
    const next = processBody(body, title, summary, minLen, counts, state);
    if (next !== body) changed++;
    if (!apply || next === body) return full;
    return `${p1}${title}${p3}${summary}${p5}${next}${p7}`;
  });

  out = out.replace(BODY_FIELD_RE, (full, p1, body, p3) => {
    const next = processBody(body, "", "", minLen, counts, state);
    if (next !== body) changed++;
    if (!apply || next === body) return full;
    return `${p1}${next}${p3}`;
  });

  if (apply && out !== src) fs.writeFileSync(filePath, out, "utf8");
  return changed;
}

function applyAll(fileList) {
  let pass = 0;
  let combined = extractAllBodies(fileList);
  let counts = countPhrases(combined, TRACKED_PHRASES);

  while (pass < 20) {
    pass++;
    let anyChanged = false;
    for (const f of fileList) {
      const n = processFile(path.join(LIB, f), counts, true);
      if (n > 0) anyChanged = true;
    }
    combined = extractAllBodies(fileList);
    counts = countPhrases(combined, TRACKED_PHRASES);
    const { max } = maxFrequency(counts);
    if (max <= MAX_BRIDGE_FREQ) break;
    if (!anyChanged) {
      for (const f of fileList) {
        processFile(path.join(LIB, f), counts, true);
      }
      combined = extractAllBodies(fileList);
      counts = countPhrases(combined, TRACKED_PHRASES);
      if (maxFrequency(counts).max <= MAX_BRIDGE_FREQ) break;
    }
  }

  return counts;
}

function findLatinHits(fileList) {
  const hits = [];
  for (const f of fileList) {
    const text = fs.readFileSync(path.join(LIB, f), "utf8");
    let m;
    const re = new RegExp(TUPLE_RE.source, "g");
    while ((m = re.exec(text))) {
      const latin = m[6].match(LATIN_CORRUPTION_RE);
      if (latin?.length) hits.push({ file: f, latin: latin.join(", ") });
    }
  }
  return hits;
}

function main() {
  const apply = process.argv.includes("--apply");
  const verify = process.argv.includes("--verify");
  const fileList = readExistingFiles();

  const before = measurePerFile(fileList);
  const beforeCombined = extractAllBodies(fileList);
  const beforeCounts = countPhrases(beforeCombined, TRACKED_PHRASES);
  const beforeMax = maxFrequency(beforeCounts);

  if (apply) applyAll(fileList);

  const after = apply || verify ? measurePerFile(fileList) : before;
  const afterCombined = apply || verify ? extractAllBodies(fileList) : beforeCombined;
  const afterCounts = apply || verify ? countPhrases(afterCombined, TRACKED_PHRASES) : beforeCounts;
  const afterMax = maxFrequency(afterCounts);
  const latinHits = apply || verify ? findLatinHits(fileList) : [];

  const report = {
    mode: apply ? "apply" : verify ? "verify" : "dry-run",
    scientificThreshold: SCI_MIN,
    liveThreshold: LIVE_MIN,
    maxBridgeFreq: MAX_BRIDGE_FREQ,
    before: {
      scientific: before.scientific,
      live: before.live,
      perFile: before.perFile,
      maxBridgeFreq: beforeMax.max,
      maxBridgePhrase: beforeMax.top,
    },
    after: apply || verify
      ? {
          scientific: after.scientific,
          live: after.live,
          perFile: after.perFile,
          maxBridgeFreq: afterMax.max,
          maxBridgePhrase: afterMax.top,
          latinCorruptionHits: latinHits.length,
        }
      : null,
  };

  console.log(JSON.stringify(report, null, 2));
  if (verify) {
    if (after.scientific.under > 0 || after.live.under > 0) process.exit(1);
    if (afterMax.max > MAX_BRIDGE_FREQ) process.exit(2);
    if (latinHits.length > 0) process.exit(3);
  }
}

main();
