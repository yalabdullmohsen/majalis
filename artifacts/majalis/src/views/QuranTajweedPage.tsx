import { useEffect, useState, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
/* ══ بيانات قواعد التجويد ══ */
type TajweedRule = {
  id: string;
  category: string;
  title: string;
  definition: string;
  types?: { name: string; definition: string; example: string }[];
  example?: string;
  color: string;
};

const CATEGORIES = ["الكل", "النون الساكنة والتنوين", "الميم الساكنة", "المدود", "الأحكام العامة", "صفات الحروف", "مخارج الحروف"];

const RULES: TajweedRule[] = [
  /* ══ النون الساكنة والتنوين ══ */
  {
    id: "izhar-halqi", category: "النون الساكنة والتنوين", color: "#123F36",
    title: "الإظهار الحلقي",
    definition: "النطق بالنون الساكنة أو التنوين بدون غنة إذا جاء بعدهما أحد حروف الحلق الستة: الهمزة، الهاء، العين، الحاء، الغين، الخاء.",
    example: "مَنْ آمَنَ · عَلِيمٌ حَكِيمٌ · مِنْ هَادٍ",
  },
  {
    id: "idgham-bighunnah", category: "النون الساكنة والتنوين", color: "#123F36",
    title: "الإدغام بغنة",
    definition: "إدخال النون الساكنة أو التنوين في الحرف التالي مع الغنة إذا كان من حروف (ينمو): الياء، النون، الميم، الواو.",
    example: "مَنْ يَقُولُ · خَيْرٌ وَأَبْقَى · مِن نِّعْمَةٍ",
  },
  {
    id: "idgham-bila-ghunnah", category: "النون الساكنة والتنوين", color: "#123F36",
    title: "الإدغام بلا غنة",
    definition: "إدغام النون الساكنة أو التنوين في اللام أو الراء بدون غنة.",
    example: "مِن لَّدُنْهُ · مِن رَّبِّهِمْ · هُدًى لِّلْمُتَّقِينَ",
  },
  {
    id: "iqlab", category: "النون الساكنة والتنوين", color: "#123F36",
    title: "الإقلاب",
    definition: "قلب النون الساكنة أو التنوين ميماً مخفاةً بغنة عند حرف الباء.",
    example: "أَنبِئُونِي · سَمِيعٌ بَصِيرٌ · مِن بَعْدِ",
  },
  {
    id: "ikhfa-haqiqi", category: "النون الساكنة والتنوين", color: "#123F36",
    title: "الإخفاء الحقيقي",
    definition: "النطق بالنون الساكنة أو التنوين بصفة بين الإظهار والإدغام مع بقاء الغنة عند بقية الحروف الخمسة عشر.",
    example: "أَنتُمْ · جَنَّاتٍ تَجْرِي · مِن قَبْلِ",
  },

  /* ══ الميم الساكنة ══ */
  {
    id: "izhar-shafawi", category: "الميم الساكنة", color: "#155241",
    title: "الإظهار الشفوي",
    definition: "إظهار الميم الساكنة عند جميع الحروف ما عدا الباء والميم.",
    example: "وَهُمْ فِيهَا · كُنتُمْ خَيْرَ أُمَّةٍ",
  },
  {
    id: "idgham-shafawi", category: "الميم الساكنة", color: "#155241",
    title: "الإدغام الشفوي",
    definition: "إدغام الميم الساكنة في الميم المتحركة بعدها مع الغنة.",
    example: "كُنتُمْ مُسْلِمِينَ · هُمْ مُؤْمِنُونَ",
  },
  {
    id: "ikhfa-shafawi", category: "الميم الساكنة", color: "#155241",
    title: "الإخفاء الشفوي",
    definition: "إخفاء الميم الساكنة عند الباء مع الغنة.",
    example: "وَهُم بِالْآخِرَةِ · تَرْمِيهِم بِحِجَارَةٍ",
  },

  /* ══ المدود ══ */
  {
    id: "madd-tabii", category: "المدود", color: "#1A3A2E",
    title: "المد الطبيعي (الأصلي)",
    definition: "المد بمقدار حركتين وهو الأصل في المدود. يكون بحرف المد (ألف، واو، ياء) بدون سبب من همز أو سكون.",
    example: "قَالَ · يَقُولُ · فِي",
  },
  {
    id: "madd-muttasil", category: "المدود", color: "#1A3A2E",
    title: "المد المتصل (الواجب)",
    definition: "اجتماع حرف المد والهمزة في كلمة واحدة. يُمد ٤ أو ٥ حركات.",
    example: "جَاءَ · سَاءَ · شَيْءٍ · السَّمَاءِ",
  },
  {
    id: "madd-munfasil", category: "المدود", color: "#1A3A2E",
    title: "المد المنفصل (الجائز)",
    definition: "أن ينتهي حرف المد في كلمة وتبدأ كلمة تالية بهمزة. يُمد من ٢ إلى ٥ حركات.",
    example: "يَا أَيُّهَا · بِمَا أُنزِلَ · قُوا أَنفُسَكُمْ",
  },
  {
    id: "madd-lazim", category: "المدود", color: "#1A3A2E",
    title: "المد اللازم",
    definition: "حرف مد يعقبه سكون أصلي في كلمة أو حرف، يُمد ٦ حركات لزوماً.",
    types: [
      { name: "الكلمي المثقل", definition: "حرف المد ثم حرف مشدد", example: "الصَّاخَّةُ · الضَّالِّينَ · الدَّابَّةُ" },
      { name: "الكلمي المخفف", definition: "حرف المد ثم حرف ساكن غير مشدد", example: "آلْآنَ · آلذَّكَرَيْنِ" },
      { name: "الحرفي المثقل", definition: "في فواتح السور ذات ثلاثة أحرف مع التشديد", example: "الم · الر · حم" },
      { name: "الحرفي المخفف", definition: "في فواتح السور بدون تشديد", example: "ص · ق · ن" },
    ],
  },
  {
    id: "madd-arid", category: "المدود", color: "#1A3A2E",
    title: "المد العارض للسكون",
    definition: "حرف مد يعقبه سكون عارض بسبب الوقف. يجوز فيه القصر والتوسط والإشباع.",
    example: "نَسْتَعِينُ (وقفاً) · الرَّحِيمُ (وقفاً)",
  },
  {
    id: "madd-leen", category: "المدود", color: "#1A3A2E",
    title: "مد اللين",
    definition: "واو أو ياء ساكنة مفتوح ما قبلها يعقبها حرف ساكن بالوقف. يُمد ٢-٦ حركات وقفاً.",
    example: "خَوْفٌ (وقفاً) · بَيْتٌ (وقفاً)",
  },
  {
    id: "madd-badal", category: "المدود", color: "#1A3A2E",
    title: "مد البدل",
    definition: "همزة تسبق حرف المد في كلمة واحدة. يُمد حركتين.",
    example: "آمَنَ (أصلها أَأْمَنَ) · آدَمَ · إِيمَانٌ · أُوتُوا",
  },
  {
    id: "madd-sila", category: "المدود", color: "#1A3A2E",
    title: "مد الصلة الكبرى والصغرى",
    definition: "مد هاء الضمير المفردة الغائب إذا وقعت بين متحركين وكانت منفردة.",
    types: [
      { name: "مد الصلة الصغرى", definition: "هاء الضمير بين متحركين وما بعدها ليس همزة، يُمد حركتين وصلاً", example: "إِنَّهُ هُوَ · بِهِ عَلِيمٌ · لَهُ مَا فِي السَّمَاوَاتِ" },
      { name: "مد الصلة الكبرى", definition: "هاء الضمير بين متحركين وما بعدها همزة، يُمد ٤ أو ٥ حركات كالمنفصل", example: "وَمَا عِندَهُ إِلَّا · رَبَّهُ أَكْبَرَ · إِنَّهُ أَنَا" },
    ],
  },
  {
    id: "madd-tamkin", category: "المدود", color: "#1A3A2E",
    title: "مد التمكين",
    definition: "اجتماع يائين؛ الأولى مشددة مكسورة والثانية ساكنة حرف مد. يُمد مقدار حركتين لتمكين الياء المشددة.",
    example: "النَّبِيِّينَ · الْأُمِّيِّينَ · حُيِّيتُم · وَالَّذِينَ آمَنُوا فِي",
  },

  /* ══ الأحكام العامة ══ */
  {
    id: "qalqalah", category: "الأحكام العامة", color: "#0D2B22",
    title: "القلقلة",
    definition: "اضطراب الصوت عند النطق بحروف (قطب جد) ساكنة حتى يُسمع لها نبرة قوية. تكون كبرى عند الوقف وصغرى وسط الكلام.",
    example: "يَطْمَعُ · قَدْ أَفْلَحَ · اقْرَأ · نَحْنُ نَبْلُو · مِن بَعْدِ",
  },
  {
    id: "tafkhim-tarqiq", category: "الأحكام العامة", color: "#0D2B22",
    title: "التفخيم والترقيق",
    definition: "التفخيم: تفعيم المخرج وامتلاؤه. الترقيق: نحول المخرج وخلوه. أحرف الاستعلاء السبعة دائماً مفخمة (خص ضغط قظ). اللام في لفظ الجلالة تُفخم بعد فتح أو ضم.",
    example: "اللَّهُ (تفخيم) · بِسْمِ اللَّهِ (ترقيق بعد كسر)",
  },
  {
    id: "waqf", category: "الأحكام العامة", color: "#0D2B22",
    title: "أحكام الوقف والابتداء",
    definition: "الوقف: قطع القراءة لحظةً. أنواعه: التام، الكافي، الحسن، القبيح. الابتداء: الشروع في القراءة بعد وقف.",
    types: [
      { name: "الوقف التام", definition: "لا تعلق له بما بعده لفظاً ومعنى", example: "﴿وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ﴾" },
      { name: "الوقف الكافي", definition: "لا تعلق له بما بعده معنى وله تعلق لفظاً", example: "عند انتهاء الجملة المعنوية" },
      { name: "الوقف الحسن", definition: "يصح الوقف عليه لاستقامة المعنى لكن ما بعده أتم", example: "﴿الْحَمْدُ لِلَّهِ﴾ (يصح لكن الأتم: ربِّ العالمين)" },
      { name: "الوقف القبيح", definition: "يخلّ بالمعنى ولا يُستحسن", example: "الوقف على ﴿إِنَّ اللَّهَ﴾ دون تمام الجملة" },
    ],
  },
  {
    id: "ghunnah", category: "الأحكام العامة", color: "#0D2B22",
    title: "الغنة",
    definition: "صوت موسيقي يخرج من الخيشوم (الأنف). تكون في النون والميم المشددتين أو عند الإخفاء والإدغام. مقدارها حركتان.",
    example: "إِنَّ · أَمَّا · مَن يَقُولُ",
  },
  {
    id: "hamz-wasl", category: "الأحكام العامة", color: "#0D2B22",
    title: "همزة الوصل والقطع",
    definition: "همزة الوصل: تُنطق ابتداءً وتُسقط درجاً (في وسط الكلام). همزة القطع: تُنطق دائماً في كل حال.",
    example: "اقرأ (وصل) · أَفَلَمْ (قطع)",
  },
  {
    id: "ahkam-ra", category: "الأحكام العامة", color: "#0D2B22",
    title: "أحكام الراء (تفخيم وترقيق)",
    definition: "الراء من أكثر الحروف تنوعاً؛ تُفخَّم في أحوال وتُرقَّق في أخرى بحسب الحركة والسياق.",
    types: [
      { name: "مواضع التفخيم", definition: "الراء مفتوحة أو مضمومة، أو ساكنة ما قبلها فتح أو ضم، أو ما قبلها كسر عارض، أو بعدها حرف استعلاء في نفس الكلمة", example: "رَبِّ · رُزِقُوا · مِرْصَادًا · الْقِرْطَاسِ" },
      { name: "مواضع الترقيق", definition: "الراء مكسورة، أو ساكنة ما قبلها كسر أصلي، أو وقعت بعد ياء مدية في الوقف", example: "رِزْقٌ · مِرْيَةٍ · بَصِيرٌ (وقفاً) · خَبِيرٌ (وقفاً)" },
      { name: "مواضع الخلاف", definition: "مسائل اختلف فيها القراء: الراء الموقوف عليها بعد كسر والاستعلاء منفصل، وبعض كلمات بعينها", example: "فِرْقٍ · مِصْرَ · وِتْرٍ · سِحْرٌ" },
    ],
  },
  {
    id: "lam-shamsi-qamari", category: "الأحكام العامة", color: "#0D2B22",
    title: "اللام الشمسية واللام القمرية",
    definition: "لام أل التعريف إما شمسية تُدغَم في الحرف التالي مع تشديده، أو قمرية تُظهَر كاملاً.",
    types: [
      { name: "اللام الشمسية", definition: "تُدغَم في 14 حرفاً: ت ث د ذ ر ز س ش ص ض ط ظ ل ن، ويُشدَّد الحرف بعدها ويُبتدأ في النطق بهمزة وصل مكسورة", example: "الشَّمْسُ · الرَّحِيمُ · الدِّينُ · الصَّلَاةُ · النَّبِيُّ · الطَّرِيقُ" },
      { name: "اللام القمرية", definition: "تُظهَر مع 14 حرفاً: أ ب ج ح خ ع غ ف ق ك م و ه ي، والحكمة التنغيم والانسجام الصوتي", example: "الْقَمَرُ · الْكِتَابُ · الْحَمْدُ · الْبَيْتُ · الْعَالَمِينَ · الْغَيْبِ" },
    ],
  },
  {
    id: "tashdid", category: "الأحكام العامة", color: "#0D2B22",
    title: "التشديد والمشدد",
    definition: "المشدد: حرف مُكوَّن من ساكن مدغَم في متحرك مماثل فيُنطَق ضعفاً. النون والميم المشددتان لهما غنة واجبة حركتين.",
    types: [
      { name: "النون المشددة", definition: "نون مدغَم فيها نون قبلها مع غنة مقدارها حركتان تخرج من الخيشوم", example: "إِنَّ · مِنَّا · فَإِنَّهُمْ · إِنَّ رَبَّكَ" },
      { name: "الميم المشددة", definition: "ميم مدغَم فيها ميم قبلها مع غنة كاملة حركتين", example: "أَمَّا · مِمَّا · ثُمَّ · رَبِّهِمْ مِنْ" },
      { name: "تشديد غير النون والميم", definition: "حرف مشدد بلا غنة يُنطَق بقوة وتمكين مزدوج بلا امتداد صوتي إضافي", example: "الضَّالِّينَ · الصَّمَدُ · اللَّهُ · شَدِيدٌ" },
    ],
  },
  {
    id: "waqf-rasm", category: "الأحكام العامة", color: "#0D2B22",
    title: "رموز الوقف في المصحف",
    definition: "علامات الوقف المرسومة في المصحف ترشد القارئ إلى أفضل مواضع التوقف والوصل.",
    types: [
      { name: "م، وقف لازم", definition: "الوقف هنا لازم لمن أراد الوصل، إذ تركه يُوهم معنى فاسداً أو يُحيل المعنى كلياً", example: "﴿وَمَا يَعْلَمُ تَأْوِيلَهُ إِلَّا اللَّهُ ۗ﴾ م، للفصل عن ﴿وَالرَّاسِخُونَ﴾" },
      { name: "لا، وقف ممنوع", definition: "لا يُوقَف هنا، فإن اضطُرَّ القارئ وقف ثم أعاد من أول الجملة", example: "يقع وسط السياق المتصل المعنى حيث الوقف يُخل بالمراد" },
      { name: "ج، وقف جائز", definition: "يجوز الوقف والوصل على حدٍّ سواء", example: "عند اكتمال معنى جزئي مع تعلق بما بعده" },
      { name: "∴ ∴، المعانقة", definition: "يُوقَف على أحد الموضعين فقط ويُوصَل الآخر؛ كلا الوجهين جائز", example: "في الآيات ذوات الوجهين التفسيريين" },
    ],
  },

  /* ══ صفات الحروف ══ */
  {
    id: "sifat", category: "صفات الحروف", color: "#183020",
    title: "الجهر والهمس والشدة والرخاوة",
    definition: "أربع صفات أساسية متقابلة تحدد قوة الصوت وانحباسه عند خروج كل حرف.",
    types: [
      { name: "الجهر", definition: "اعتماد الحرف في مخرجه حتى يمتنع جري النفس معه، الصوت ملء الفم", example: "ب ج د ذ ر ز ض ع ظ غ ل م ن و ي هـ" },
      { name: "الهمس", definition: "جريان النفس مع الحرف لضعف اعتماده في المخرج، الصوت خفيف", example: "ت ث ح خ س ش ص ف ك هـ" },
      { name: "الشدة", definition: "انحباس الصوت عند النطق بالحرف واحتباسه في المخرج", example: "أ ب ت د ج ق ك ط" },
      { name: "التوسط (البينية)", definition: "اعتدال الصوت بين الشدة والرخاوة؛ لا ينحبس كلياً ولا يجري كلياً", example: "ر ل ع م ن" },
      { name: "الرخاوة", definition: "جريان الصوت مع الحرف بلا احتباس، عكس الشدة", example: "ث ح ذ خ ز س ش ص ظ غ ف هـ و ي" },
    ],
  },
  {
    id: "istila-istifal", category: "صفات الحروف", color: "#183020",
    title: "الاستعلاء والاستفال",
    definition: "الاستعلاء: ارتفاع اللسان نحو الحنك الأعلى عند النطق. الاستفال: انخفاضه. حروف الاستعلاء السبعة دائماً مفخمة.",
    types: [
      { name: "الاستعلاء", definition: "ارتفاع اللسان إلى الحنك الأعلى، يُنتج صوتاً مفخماً مستعلياً (خص ضغط قظ)", example: "خ ص ض غ ط ق ظ، خَصَّ ضَغْطٍ قِظْ" },
      { name: "الاستفال", definition: "انخفاض اللسان إلى قاع الفم، يُنتج صوتاً مرققاً رقيقاً في الغالب", example: "باقي الحروف، إلا الألف فمُستفِل دائماً وقد تُفخَّم بجوار المفخمات" },
    ],
  },
  {
    id: "itbaq-infitah", category: "صفات الحروف", color: "#183020",
    title: "الإطباق والانفتاح",
    definition: "الإطباق: انطباق اللسان على الحنك الأعلى عند النطق مما يُولِّد صوتاً مطبقاً قوياً. حروفه أربعة: ص ض ط ظ. الانفتاح: عكسه في سائر الحروف.",
    types: [
      { name: "الإطباق", definition: "ارتفاع اللسان وانطباقه على الحنك، يزيد تفخيم الحرف وقوته", example: "الصِّرَاطَ · الضَّالِّينَ · الطَّارِقُ · الظَّالِمِينَ" },
      { name: "الانفتاح", definition: "انفتاح الفم أثناء النطق دون انطباق اللسان، هو الأصل في جميع الحروف الأخرى", example: "جميع الحروف الأخرى: ب ت ث ج ح خ د ذ ر ز س ش ع غ ف ق ك ل م ن و ه ي ء" },
    ],
  },
  {
    id: "izlaq-ismat", category: "صفات الحروف", color: "#183020",
    title: "الإذلاق والإصمات والصفير",
    definition: "صفات دقيقة تحكم خفة الحرف وسهولة النطق به، ومنها الصفير الصوتي الحاد.",
    types: [
      { name: "الإذلاق", definition: "خفة الحرف وسرعة النطق به لخروجه من طرف اللسان أو الشفة (فِرَّ مِنْ لُبٍّ)", example: "ف ر م ن ل ب، فَرَّ مِنَّا · لَمْ يَلِدْ · بِالْبَرِّ" },
      { name: "الإصمات", definition: "ثقل الحرف نسبياً واستعصاؤه، ولهذا لا توجد في العربية كلمة رباعية أو خماسية مجردة من حروف الإذلاق", example: "ت ث ج ح خ د ذ ز س ش ص ض ط ظ ع غ ق ك ه ي و" },
      { name: "الصفير", definition: "صوت حاد شبيه بالصفارة يصاحب حروف الصين الثلاثة عند النطق بها بدقة", example: "الصَّادِقُونَ · الزَّكَاةَ · السَّبِيلَ" },
    ],
  },
  {
    id: "takrir-leen-inhiraf", category: "صفات الحروف", color: "#183020",
    title: "التكرير واللين والانحراف والتفشي",
    definition: "صفات عارضة تختص بحروف بعينها وتميز أصواتها النطقية.",
    types: [
      { name: "التكرير", definition: "اهتزاز طرف اللسان عند النطق بالراء. والقارئ يُخفف التكرير ولا يُبالغ فيه حتى لا يتولد راءان", example: "الرَّحْمَٰنِ · رَبِّ · قَدَّرَ" },
      { name: "اللين", definition: "خروج الحرف بيسر ولين دون كلفة. حروفه: واو وياء ساكنتان مفتوح ما قبلهما", example: "خَوْفٌ · بَيْتٌ · عَيْنٌ · قَوْلٌ" },
      { name: "الانحراف", definition: "ميل الحرف عند خروجه عن مخرجه الأصلي إلى مخرج مجاور. في اللام والراء", example: "لِلَّهِ · الرَّحِيمِ · كُلٌّ · نُرِيدُ" },
      { name: "التفشي", definition: "انتشار الهواء في الفم عند النطق بالشين حتى يملأه", example: "الشَّمْسُ · شَكُورٌ · شَجَرَةٍ · مِشْكَاةٍ" },
    ],
  },

  {
    id: "qalqala", category: "صفات الحروف", color: "#183020",
    title: "القلقلة",
    definition: "اضطراب الصوت واهتزازه عند النطق بالحرف الساكن من حروف (قطب جد)، فينشأ صوت قوي شبيه بالارتداد عند المخرج.",
    types: [
      { name: "القلقلة الصغرى", definition: "تحدث حين يكون حرف القلقلة ساكناً في وسط الكلمة، وتكون الاهتزازة خفيفة", example: "يَقْطَعُونَ · مُقْتَدِرٍ · اقْتَرَبَتْ" },
      { name: "القلقلة الكبرى", definition: "تحدث حين يكون حرف القلقلة ساكناً في آخر الكلمة عند الوقف، وتكون الاهتزازة أقوى وأوضح", example: "وَقْفاً على: الْحَقِّ · الْخَلْقِ · مُحِيطٌ" },
    ],
  },
  {
    id: "ghunna-sifat", category: "صفات الحروف", color: "#183020",
    title: "الغنة",
    definition: "صوت أنفي رنَّان يصدر من الخيشوم ويصاحب حرفَي النون والميم في حالات الإدغام والإخفاء والتشديد، مقداره حركتان.",
    types: [
      { name: "أقوى مراتب الغنة", definition: "الغنة في الحرف المشدَّد (مُدغَم فيه) مع تشديد النون أو الميم؛ أعلى مراتبها كيفاً ومداً", example: "إِنَّ · ثُمَّ · الْجَنَّةُ · الرَّحِيمِ (الميم المشددة في التشهد)" },
      { name: "غنة الإخفاء الحقيقي", definition: "تظهر عند إخفاء النون الساكنة والتنوين أو الميم الساكنة، وفيها غنة بلا مد كامل", example: "مِن قَبْلُ · أَنبِئُونِي · مَنبَعَثٍ" },
      { name: "غنة الإدغام بغنة", definition: "تبقى الغنة مع الإدغام في حرفَي الياء والواو عند اندراج النون الساكنة أو التنوين فيهما", example: "مَن يَعْمَلُ · هُدًى وَّرَحْمَةً" },
    ],
  },

  /* ══ المدود — توسعة ══ */
  {
    id: "madd-iwad", category: "المدود", color: "#1A3A2E",
    title: "مد العوض",
    definition: "مد ينشأ عند الوقف على التنوين المنصوب فيُعوَّض عن التنوين بألف مُمدَّة حركتين، إلا في التاء المربوطة فتُقلَب هاءً ساكنة دون مد.",
    example: "عَلِيمًا (وقفاً → عَلِيمَا) · سَمِيعًا (وقفاً → سَمِيعَا) · رَحْمَةً (وقفاً → رَحْمَةْ — تاء مربوطة لا مد)",
  },
  {
    id: "madd-farq", category: "المدود", color: "#1A3A2E",
    title: "مد الفرق",
    definition: "مد مقداره ست حركات يكون عند دخول همزة الاستفهام على كلمة تبدأ بهمزة وصل معها (ال) التعريف، فتُبدَل همزة الوصل مداً للتفريق بين الاستفهام والخبر.",
    example: "﴿آلذَّكَرَيْنِ حَرَّمَ أَمِ الْأُنثَيَيْنِ﴾ · ﴿قُلْ آللَّهُ أَذِنَ لَكُمْ﴾ · ﴿آلْآنَ وَقَدْ كُنتُم بِهِ تَسْتَعْجِلُونَ﴾",
  },

  /* ══ الأحكام العامة — توسعة ══ */
  {
    id: "idgham-mutamathl", category: "الأحكام العامة", color: "#0D2B22",
    title: "إدغام المتماثلين والمتجانسين والمتقاربين",
    definition: "باب الإدغام الكبير: إدغام حرف ساكن في مثله أو مجانسه أو مقاربه مخرجاً وصفةً عند الالتقاء بين كلمتين.",
    types: [
      { name: "المتماثلان", definition: "حرفان متطابقان أولهما ساكن فيُدغَم الأول في الثاني تاماً", example: "اضْرِب بِّعَصَاكَ · قَالَت تَّسْعَةٌ · مَن نَّار" },
      { name: "المتجانسان", definition: "حرفان اتحدا مخرجاً واختلفا صفةً: ط مع ت، ذ مع ظ، د مع ت، ث مع ذ", example: "قَد تَّبَيَّنَ (د+ت) · إِذ ظَّلَمُوا (ذ+ظ) · يَلْهَثْ ذَّلِكَ (ث+ذ)" },
      { name: "المتقاربان", definition: "حرفان تقاربا مخرجاً وصفةً: ق مع ك، ل مع ر في بعض الروايات", example: "أَلَمْ نَخْلُقكُّم (ق+ك) · بَل رَّفَعَهُ (ل+ر)" },
    ],
  },
  {
    id: "sakt-hafs", category: "الأحكام العامة", color: "#0D2B22",
    title: "السكت في رواية حفص عن عاصم",
    definition: "السكت: قطع الصوت على الحرف لحظةً يسيرة دون تنفس ثم متابعة القراءة. انفرد به حفص عن عاصم في أربعة مواضع بعينها في القرآن الكريم.",
    types: [
      { name: "﴿عِوَجًا ۜ قَيِّمًا﴾ الكهف: ١", definition: "السكت على ألف التنوين في (عِوَجًا) قبل (قَيِّمًا)", example: "﴿وَلَمْ يَجْعَل لَّهُ عِوَجًا ۜ قَيِّمًا﴾" },
      { name: "﴿مَرْقَدِنَا ۜ هَٰذَا﴾ يس: ٥٢", definition: "السكت على ألف (مَرْقَدِنَا) قبل (هَٰذَا)", example: "﴿مَن بَعَثَنَا مِن مَّرْقَدِنَا ۜ هَٰذَا مَا وَعَدَ الرَّحْمَٰنُ﴾" },
      { name: "﴿مَن ۜ رَاقٍ﴾ القيامة: ٢٧", definition: "السكت على نون (مَن) قبل (رَاقٍ) منعاً من الإدغام", example: "﴿وَقِيلَ مَن ۜ رَاقٍ﴾" },
      { name: "﴿بَلْ ۜ رَانَ﴾ المطففين: ١٤", definition: "السكت على لام (بَلْ) قبل (رَانَ) منعاً من الإدغام", example: "﴿كَلَّا ۜ بَلْ ۜ رَانَ عَلَىٰ قُلُوبِهِم﴾" },
    ],
  },

  /* ══ مخارج الحروف ══ */
  {
    id: "makharij", category: "مخارج الحروف", color: "#0F261E",
    title: "مخارج الحروف (أماكن خروجها)",
    definition: "المخارج خمسة رئيسية: الجوف (ا و ي المدية)، الحلق (ء هـ ع ح غ خ)، اللسان (18 حرفاً)، الشفتان (ب م و ف)، الخيشوم (الغنة في ن م).",
    types: [
      { name: "الجوف", definition: "تخرج منه حروف المد الثلاثة", example: "الألف المدية · الواو المدية · الياء المدية" },
      { name: "الحلق", definition: "أقصاه: الهمزة والهاء. وسطه: العين والحاء. أدناه: الغين والخاء", example: "ء هـ ع ح غ خ" },
      { name: "اللسان", definition: "يشمل: القاف، الكاف، الجيم والشين والياء، الضاد، اللام، النون، الراء، الطاء والدال والتاء، الثاء والذال والظاء، الصاد والزاي والسين", example: "ق ك ج ش ي ض ل ن ر ط د ت ث ذ ظ ص ز س" },
      { name: "الشفتان", definition: "الباء والميم من اجتماع الشفتين. الواو الحرفية من الشفتين. الفاء من الشفة السفلى وأطراف الثنايا العليا", example: "ب م و ف" },
      { name: "الخيشوم", definition: "يخرج منه صوت الغنة للنون والميم عند الإدغام والإخفاء", example: "غنة: إِنَّ · أَمَّا" },
    ],
  },
];

function RuleCard({ rule }: { rule: TajweedRule }) {
  const [open, setOpen] = useState(false);

  return (
    <article className={`tj-card tj-card--${rule.id}`}>
      <button
        type="button"
        className="tj-card__header"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="tj-card__title-wrap">
          <span className="tj-cat-badge">{rule.category}</span>
          <h3 className="tj-card__title">{rule.title}</h3>
        </div>
        <span className="tj-toggle" aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="tj-card__body">
          <p className="tj-definition">{rule.definition}</p>
          {rule.example && (
            <div className="tj-example">
              <span className="tj-example-label">مثال: </span>
              <span className="tj-example-text" lang="ar">{rule.example}</span>
            </div>
          )}
          {rule.types && rule.types.length > 0 && (
            <div className="tj-types">
              {rule.types.map(t => (
                <div key={t.name} className="tj-type">
                  <strong className="tj-type-name">{t.name}</strong>
                  <p className="tj-type-def">{t.definition}</p>
                  <span className="tj-type-ex" lang="ar">{t.example}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function QuranTajweedPage() {
  const todayRule = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const day = Math.floor((now.getTime() - start.getTime()) / 86400000);
    return RULES[(day - 1 + RULES.length) % RULES.length];
  }, []);
  const [category, setCategory] = useState("الكل");
  const [search, setSearch] = useState("");

  useEffect(() => {
    applyPageSeo({
      path: "/quran/tajweed",
      title: "علم التجويد | المجلس العلمي",
      description: "قواعد علم التجويد الكاملة، أحكام النون الساكنة والتنوين، الميم الساكنة، المدود، صفات الحروف ومخارجها.",
      keywords: ["تجويد", "قواعد التجويد", "أحكام التجويد", "النون الساكنة", "المدود", "مخارج الحروف"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Course",
          name: "علم التجويد",
          description: "قواعد تجويد القرآن الكريم من أحكام النون الساكنة إلى المدود وصفات الحروف",
          provider: { "@type": "Organization", name: "المجلس العلمي", url: "https://majlisilm.com" },
          url: "https://majlisilm.com/quran/tajweed",
          inLanguage: "ar",
          about: { "@type": "Thing", name: "تجويد القرآن الكريم" },
          hasCourseInstance: CATEGORIES.filter((c) => c !== "الكل").map((cat) => ({
            "@type": "CourseInstance",
            name: cat,
            url: `https://majlisilm.com/quran/tajweed?cat=${encodeURIComponent(cat)}`,
          })),
        },
      ],
    });
  }, []);

  const filtered = RULES.filter(r => {
    const catOk = category === "الكل" || r.category === category;
    const textOk = !search.trim() || arabicMatchAny([r.title, r.definition, r.example ?? "", r.category], search);
    return catOk && textOk;
  });

  return (
    <div className="page-shell ds-page tj-page">
      <div className="ds-hero tj-hero">
        <p className="ds-hero__eyebrow">القرآن الكريم</p>
        <h1 className="ds-hero__title">علم التجويد</h1>
        <p className="ds-hero__subtitle">
          قواعد تجويد القرآن الكريم، أحكام كاملة للنون والميم والمدود وصفات الحروف ومخارجها
        </p>
      </div>

      {/* تنقل أقسام القرآن */}
      <nav className="quran-subnav" aria-label="أقسام القرآن">
        <Link href="/quran"               className="quran-subnav__link">المصحف</Link>
        <Link href="/quran/tajweed"        className="quran-subnav__link is-active">التجويد</Link>
        <Link href="/quran/surah-stories"  className="quran-subnav__link">قصص القرآن</Link>
        <Link href="/quran-live"           className="quran-subnav__link">البث المباشر</Link>
        <Link href="/quran-radio"          className="quran-subnav__link">الإذاعات</Link>
      </nav>

      {/* مقدمة */}
      <div className="tj-intro-box">
        <p>
          التجويد لغةً: التحسين. واصطلاحاً: إعطاء كل حرف حقه ومستحقه من الصفات، والنطق به من
          مخرجه الصحيح. تعلّمه فرض كفاية وتطبيقه فرض عين على كل قارئ للقرآن الكريم.
        </p>
        <p className="tj-hadith" lang="ar">
          قال النبي ﷺ: «زَيِّنُوا الْقُرْآنَ بِأَصْوَاتِكُمْ»، رواه أبو داود وابن ماجه
        </p>
      </div>

      {/* حكم التجويد اليوم */}
      <div className="tjod-card">
        <div className="tjod-card__badge"><Sparkles size={11} aria-hidden="true" /> حكم التجويد اليوم</div>
        <div className="tjod-card__cat">{todayRule.category}</div>
        <h2 className="tjod-card__title">{todayRule.title}</h2>
        <p className="tjod-card__def">{todayRule.definition}</p>
        {todayRule.example && <p className="tjod-card__ex"><span className="tjod-card__ex-label">مثال: </span>{todayRule.example}</p>}
      </div>

      {/* فلتر الأحكام */}
      <div className="ds-filters-bar" role="tablist" aria-label="تصفية أحكام التجويد">
        {CATEGORIES.map(c => (
          <button
            key={c}
            role="tab"
            type="button"
            className={`ds-chip${category === c ? " ds-chip--active" : ""}`}
            onClick={() => setCategory(c)}
            aria-selected={category === c}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="tj-search-wrap">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث في قواعد التجويد..."
          className="page-search-input tj-search-input"
          aria-label="بحث في أحكام التجويد"
        />
      </div>

      {/* البطاقات */}
      <div className="tj-grid">
        {filtered.map(rule => (
          <RuleCard key={rule.id} rule={rule} />
        ))}
      </div>

      {/* روابط ذات صلة */}
      <div className="tj-related">
        <p className="tj-related-title">مراجع وكتب مقترحة</p>
        <div className="tj-related-list">
          <span className="tj-related-link tj-related-link--ref">متن الجزرية، ابن الجزري</span>
          <span className="tj-related-link tj-related-link--ref">التمهيد في علم التجويد، ابن الجزري</span>
          <span className="tj-related-link tj-related-link--ref">هداية القاري، عبد الفتاح المرصفي</span>
          <Link href="/quran" className="tj-related-link">ابدأ القراءة من المصحف ←</Link>
        </div>
      </div>

      <div className="twh-share">
        <ShareButtons title="أحكام التجويد — المجلس العلمي" url="https://majlisilm.com/quran-tajweed" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="quran" title="اختبر معلوماتك في علم التجويد" count={4} />
      </div>
    </div>
  );
}
