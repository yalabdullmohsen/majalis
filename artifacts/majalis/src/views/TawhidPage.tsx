import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

// ─── أقسام العقيدة والتوحيد ──────────────────────────────────────────────────

type AqeedaSection = {
  emoji: string;
  title: string;
  desc: string;
  href: string;
  badge: string;
  color: string;
  isCurrent?: boolean;
};

const AQEEDA_SECTIONS: AqeedaSection[] = [
  {
    emoji: "🕌", title: "التوحيد ومسائله",
    desc: "أنواع التوحيد، الشرك، البدعة، والمسائل العقدية",
    href: "/tawhid", badge: "٨ مسائل", color: "#1F4D3A", isCurrent: true,
  },
  {
    emoji: "🌟", title: "أركان الإسلام",
    desc: "الشهادتان والصلاة والزكاة والصيام والحج",
    href: "/arkan", badge: "٥ أركان", color: "#0F5132",
  },
  {
    emoji: "✨", title: "أركان الإيمان",
    desc: "الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر",
    href: "/arkan-iman", badge: "٦ أركان", color: "#7C3AED",
  },
  {
    emoji: "💎", title: "الأسماء الحسنى",
    desc: "التسعة والتسعون اسماً بمعانيها وأدلتها",
    href: "/asma-husna", badge: "٩٩ اسماً", color: "#0F766E",
  },
  {
    emoji: "🌿", title: "الجنة والنار",
    desc: "صفة الجنة ونعيمها وصفة النار وعذابها",
    href: "/janna-naar", badge: "عقيدة", color: "#1F4D3A",
  },
  {
    emoji: "⏳", title: "علامات الساعة",
    desc: "العلامات الصغرى والكبرى مرتبةً بالأدلة",
    href: "/alamat-saah", badge: "صغرى وكبرى", color: "#0E6E52",
  },
  {
    emoji: "👼", title: "الملائكة في الإسلام",
    desc: "أسماؤهم ومهامهم وصفاتهم",
    href: "/malaika", badge: "غيبيات", color: "#5B21B6",
  },
  {
    emoji: "🔬", title: "الإعجاز العلمي",
    desc: "إعجاز القرآن والسنة في العلوم الحديثة",
    href: "/miracles", badge: "إعجاز", color: "#065F46",
  },
];

// ─── أنواع التوحيد ────────────────────────────────────────────────────────

const TAWHEED_TYPES = [
  {
    num: "١", title: "توحيد الربوبية", subtitle: "توحيد الخلق والتدبير",
    desc: "الإقرار بأن الله وحده هو الخالق الرازق المحيي المميت المدبّر لجميع الأمور، لا شريك له في ملكه. وهذا النوع فطريٌّ يُقرّ به أكثر الناس، لكنه وحده لا يكفي للنجاة.",
    ayah: "قُلْ مَن يَرْزُقُكُم مِّنَ السَّمَاءِ وَالْأَرْضِ أَمَّن يَمْلِكُ السَّمْعَ وَالْأَبْصَارَ",
    ref: "يونس: ٣١", variant: "emerald",
  },
  {
    num: "٢", title: "توحيد الألوهية", subtitle: "توحيد العبادة والقصد",
    desc: "إفراد الله بجميع أنواع العبادة: صلاةً وصوماً ودعاءً وخوفاً ورجاءً وذبحاً ونذراً ومحبةً وتوكلاً. وهو مضمون شهادة أن لا إله إلا الله، وهو أصل الدعوة النبوية.",
    ayah: "وَمَا أَرْسَلْنَا مِن قَبْلِكَ مِن رَّسُولٍ إِلَّا نُوحِي إِلَيْهِ أَنَّهُ لَا إِلَٰهَ إِلَّا أَنَا فَاعْبُدُونِ",
    ref: "الأنبياء: ٢٥", variant: "emerald",
  },
  {
    num: "٣", title: "توحيد الأسماء والصفات", subtitle: "توحيد الإثبات والتنزيه",
    desc: "الإيمان بما أثبته الله لنفسه وأثبته له رسوله ﷺ من الأسماء الحسنى والصفات العليا، على وجه يليق بجلاله سبحانه، بلا تحريف ولا تعطيل ولا تكييف ولا تمثيل.",
    ayah: "لَيْسَ كَمِثْلِهِ شَيْءٌ وَهُوَ السَّمِيعُ الْبَصِيرُ",
    ref: "الشورى: ١١", variant: "purple",
  },
];

// ─── أركان الإيمان ────────────────────────────────────────────────────────

const IMAN_PILLARS = [
  { num: "١", title: "الإيمان بالله",          body: "الإيمان بوجود الله وربوبيته وألوهيته وأسمائه وصفاته الكاملة. وهو أصل الأصول وأساس الأركان.", icon: "🌿" },
  { num: "٢", title: "الإيمان بالملائكة",       body: "الإيمان بوجودهم وأنهم عباد الله المكرمون، يُنفّذون أوامره ولا يعصونه، ومن أشهرهم جبريل وميكائيل وإسرافيل.", icon: "👼" },
  { num: "٣", title: "الإيمان بالكتب",          body: "الإيمان بجميع الكتب التي أنزلها الله على رسله: التوراة والإنجيل والزبور وصحف إبراهيم والقرآن الكريم الذي نسخها.", icon: "📖" },
  { num: "٤", title: "الإيمان بالرسل",          body: "الإيمان بجميع الأنبياء والمرسلين من آدم حتى محمد ﷺ خاتمهم، وأنهم بلّغوا الرسالة وأدّوا الأمانة.", icon: "🌟" },
  { num: "٥", title: "الإيمان باليوم الآخر",    body: "الإيمان بكل ما أخبر الله ورسوله عن ما بعد الموت: من فتنة القبر وعذابه ونعيمه، والبعث والحشر والميزان والصراط والجنة والنار.", icon: "⏳" },
  { num: "٦", title: "الإيمان بالقدر",          body: "الإيمان بأن الله علم كل شيء وكتبه وشاءه وخلقه. وله أربع مراتب: العلم، والكتابة، والمشيئة، والخلق.", icon: "✨" },
];

// ─── مسائل التوحيد ───────────────────────────────────────────────────────

type HadithRef = {
  text: string; source: string; number: string;
  grade: "صحيح" | "حسن" | "ضعيف" | "موضوع";
  narrator: string; extra?: string;
};

const GRADE_MOD: Record<HadithRef["grade"], string> = {
  صحيح: "tawheed-hadith-badge--sahih", حسن: "tawheed-hadith-badge--hasan",
  ضعيف: "tawheed-hadith-badge--daif",  موضوع: "tawheed-hadith-badge--mawdu",
};

type Principle = { title: string; body: string; hadith?: HadithRef };

const PRINCIPLES: Principle[] = [
  {
    title: "شهادة لا إله إلا الله",
    body: "لها ركنان: نفي الإلهية عن كل ما سوى الله (لا إله)، وإثباتها لله وحده (إلا الله). ومن أقرّ بالربوبية دون الألوهية لم يكن موحداً.",
  },
  {
    title: "أعظم الأوامر والنواهي",
    body: "أعظم ما أمر الله به التوحيد، وأعظم ما نهى عنه الشرك. ﴿وَاعْبُدُوا اللَّهَ وَلَا تُشْرِكُوا بِهِ شَيْئًا﴾ [النساء: ٣٦].",
  },
  {
    title: "الشرك الأكبر",
    body: "صرف شيء من العبادة لغير الله كدعاء الأموات والذبح والنذر لغير الله. أعظم الذنوب ولا يغفره الله لمن مات عليه. ﴿إِنَّ اللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِ﴾ [النساء: ٤٨].",
  },
  {
    title: "الشرك الأصغر",
    body: "ما أطلق عليه الشرعُ اسم الشرك ولم يبلغ حدّ الأكبر، كالرياء والسمعة والحلف بغير الله.",
    hadith: {
      text: "إنَّ أخوف ما أخاف عليكم الشرك الأصغر: الرياء",
      source: "مسند أحمد", number: "٢٣٦٣٠", grade: "صحيح",
      narrator: "محمود بن لبيد الأنصاري", extra: "صحّحه الألباني في السلسلة الصحيحة (٩٥١)",
    },
  },
  {
    title: "البدعة في الدين",
    body: "كل عبادة لم يشرعها الله ورسوله مردودة وإن حسنت نية صاحبها.",
    hadith: {
      text: "كل بدعة ضلالة، وكل ضلالة في النار",
      source: "صحيح مسلم", number: "٨٦٧", grade: "صحيح", narrator: "جابر بن عبدالله",
    },
  },
  {
    title: "التوسل المشروع",
    body: "يُشرع التوسل بأسماء الله وصفاته، وبالعمل الصالح، وبدعاء الرجل الصالح الحي. أما دعاء الأموات فهو الشرك الأكبر.",
  },
  {
    title: "التعلق بالأسباب",
    body: "الأخذ بالأسباب المشروعة واجب مع صرف القلب لله وحده. أما اعتقاد تأثير السبب بذاته دون الله فهو قدح في التوحيد.",
  },
  {
    title: "أصل دعوة الرسل",
    body: "بعث الله كل رسول بالدعوة إلى توحيد الألوهية أولاً. ﴿وَلَقَدْ بَعَثْنَا فِي كُلِّ أُمَّةٍ رَّسُولًا أَنِ اعْبُدُوا اللَّهَ وَاجْتَنِبُوا الطَّاغُوتَ﴾ [النحل: ٣٦].",
  },
  {
    title: "حقوق الله على العباد",
    body: "أعظم حق لله على العباد: عبادته وحده لا شريك له، وترك عبادة ما سواه. وحق العباد على الله ألا يُعذِّب من لم يُشرك به شيئاً. (من حديث معاذ رضي الله عنه).",
  },
  {
    title: "الخوف والرجاء والمحبة",
    body: "ثلاثة أصول في العبادة لا تتم إلا بها مجتمعةً: محبة الله تحرّك القلب إليه، والخوف يحجزه عن المعاصي، والرجاء يدفعه نحو الطاعة. من أُفرد أحدها اعوجّ.",
  },
  {
    title: "الإسلام والإيمان والإحسان",
    body: "ثلاث مراتب في الدين: الإسلام (الأعمال الظاهرة)، والإيمان (تصديق القلب)، والإحسان (أن تعبد الله كأنك تراه). وهي حديث جبريل الشهير.",
    hadith: { text: "الإحسان أن تعبد الله كأنك تراه، فإن لم تكن تراه فإنه يراك", source: "صحيح مسلم", number: "٨", grade: "صحيح", narrator: "عمر بن الخطاب" },
  },
  {
    title: "مقتضيات لا إله إلا الله",
    body: "لكلمة التوحيد سبعة شروط: العلم بها، واليقين، والقبول، والانقياد، والصدق، والإخلاص، والمحبة لها ولأهلها. ومن أتى بها دون مقتضياتها لم تنفعه.",
  },
  {
    title: "الولاء والبراء",
    body: "من مقتضيات التوحيد: محبة ما يحبه الله وبغض ما يبغضه، وموالاة أهل الإيمان ومعاداة الكفر والشرك. ﴿لَّا تَجِدُ قَوْمًا يُؤْمِنُونَ بِاللَّهِ وَالْيَوْمِ الْآخِرِ يُوَادُّونَ مَنْ حَادَّ اللَّهَ وَرَسُولَهُ﴾ [المجادلة: ٢٢].",
  },
  {
    title: "الطاغوت وأنواعه",
    body: "الطاغوت: كل ما عُبد أو أُطيع من دون الله ورضي بذلك. وأعظم الطواغيت خمسة: إبليس، ومن عُبد من البشر وهو راضٍ، ومن دعا الناس لعبادة نفسه، ومن ادّعى علم الغيب، ومن حكم بغير ما أنزل الله. والكفر بالطاغوت شرط في صحة الإيمان.",
  },
  {
    title: "التوسط بين التعطيل والتمثيل",
    body: "أهل السنة وسط في باب الأسماء والصفات: يُثبتون ما أثبته الله لنفسه دون تعطيل أو إنكار، ودون تكييف أو تمثيل بخلقه. ﴿لَيْسَ كَمِثْلِهِ شَيْءٌ وَهُوَ السَّمِيعُ الْبَصِيرُ﴾ [الشورى: ١١]. فالجهمية عطّلوا، والمشبّهة مثّلوا، وأهل السنة نزّهوا وأثبتوا.",
  },
  {
    title: "التوبة وشروطها",
    body: "التوبة واجبة من كل ذنب فوراً. وشروطها ثلاثة: الإقلاع عن الذنب، والندم عليه، والعزم على عدم العودة. فإن كان الذنب تعلّق بحق آدمي زيد شرط رابع: ردّ الحق أو استحلال صاحبه.",
    hadith: {
      text: "إنّ الله يقبل توبة العبد ما لم يغرغر",
      source: "جامع الترمذي", number: "٣٥٣٧", grade: "صحيح", narrator: "ابن عمر رضي الله عنه",
    },
  },
  {
    title: "الشفاعة المثبتة في الإسلام",
    body: "الشفاعة ثابتة لنبينا ﷺ وللملائكة والأنبياء والصالحين يوم القيامة، لكنها بإذن الله وحده لا بدونه. ﴿مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ﴾ [البقرة: ٢٥٥]. أما طلب الشفاعة من الأموات ودعاؤهم فهو من الشرك الأكبر المنهي عنه.",
  },
  {
    title: "الإيمان يزيد وينقص",
    body: "مذهب أهل السنة أن الإيمان قول وعمل واعتقاد، يزيد بالطاعات وينقص بالمعاصي. ﴿وَيَزْدَادَ الَّذِينَ آمَنُوا إِيمَانًا﴾ [المدثر: ٣١]. وهو أوسع ما بين مرتبة من في قلبه أدنى مثقال ذرة من إيمان إلى مرتبة النبيين والصديقين. خلافاً للمرجئة الذين جعلوه لا يتجزأ.",
    hadith: { text: "أكمل المؤمنين إيماناً أحسنهم خُلقاً", source: "جامع الترمذي", number: "١١٦٢", grade: "صحيح", narrator: "أبو هريرة" },
  },
  {
    title: "التكفير وضوابطه",
    body: "الحكم بالكفر على المعيَّن من أعظم الأمور خطراً؛ له شروط وموانع. فلا يُكفَّر بالمعصية ولو عظمت ما لم تكن جاحدةً أو مستحِلّة. والتكفير بالإجمال غير التكفير المعيَّن. وأهل السنة توسّطوا بين الخوارج الذين كفّروا بالذنب وبين المرجئة الذين أهدروا أثر العمل.",
  },
  {
    title: "الحكم بغير ما أنزل الله",
    body: "الحكم بغير ما أنزل الله قد يكون كفراً أكبر أو أصغر باختلاف حال الحاكم: من جحد حكم الله أو استحله فهو الكفر الأكبر. أما من حكم بغير ما أنزل الله مع اعترافه بأنه مخطئ وأن حكم الله هو الحق فهو كفر أصغر لا يُخرج من الملة.",
  },
];

// ─── من الأسماء الحسنى ───────────────────────────────────────────────────

const ASMA_HUSNA = [
  { name: "الله",     meaning: "اسمه الجامع لجميع صفات الكمال والجلال" },
  { name: "الرحمن",  meaning: "ذو الرحمة الواسعة التي وسعت كل شيء" },
  { name: "الرحيم",  meaning: "دائم الرحمة بعباده المؤمنين في الدنيا والآخرة" },
  { name: "الملك",   meaning: "المالك لجميع الكون، الحاكم الذي لا حاكم سواه" },
  { name: "القدوس",  meaning: "المنزّه عن كل نقص وعيب، البالغ في الطهارة والكمال" },
  { name: "السلام",  meaning: "ذو السلامة من كل نقص، مصدر السلام لعباده" },
  { name: "الغفّار", meaning: "الذي يغفر الذنوب مرةً بعد مرة لمن تاب واستغفر" },
  { name: "الرزّاق", meaning: "الذي يتولى رزق جميع الخلق ويوسّع ويضيّق بحكمته" },
  { name: "العليم",  meaning: "المحيط علمه بكل شيء في الأزل وإلى الأبد" },
  { name: "القدير",  meaning: "الكامل القدرة على كل شيء، لا يعجزه شيء" },
  { name: "الحكيم",  meaning: "الذي يضع كل شيء في موضعه اللائق به بالغاً في الحكمة" },
  { name: "السميع",  meaning: "الذي يسمع كل صوت سرّاً وعلناً، لا يخفى عليه خافية" },
  { name: "البصير",  meaning: "الذي يرى كل شيء دقيقه وجليله، خفيّه وظاهره" },
  { name: "اللطيف",  meaning: "العالم بخفايا الأمور، الرفيق بعباده في إيصال الخير إليهم" },
  { name: "الخبير",  meaning: "الذي أحاط علمه بباطن الأمور وخفاياها كظاهرها" },
  { name: "الحليم",  meaning: "الذي لا يُعجل بالعقوبة بل يُمهل ويستر ويغفر" },
  { name: "العظيم",  meaning: "الجامع لصفات العظمة والكبرياء والجلال والسلطان" },
  { name: "الشكور", meaning: "الذي يُثيب على القليل من العمل بالجزيل من الثواب" },
  { name: "الكريم",  meaning: "الجواد العظيم الذي يُعطي الكثير ابتداءً بغير سؤال" },
  { name: "الوكيل",  meaning: "الكافي بعباده الذي تكفّل بأرزاقهم ومصالحهم" },
  { name: "الودود",  meaning: "الذي يحب عباده الصالحين ويتودد إليهم برحمته" },
  { name: "المجيد",  meaning: "الجامع بين عظمة الذات وسعة صفات الكمال" },
  { name: "الحق",    meaning: "الثابت الوجود الذي لا يجوز عليه العدم بوجه من الوجوه" },
  { name: "المبين",  meaning: "الظاهر الذي دلت على وجوده وكماله آياته وشواهده" },
  { name: "القهار",  meaning: "الغالب على كل شيء القاهر لكل خلقه بقدرته وسلطانه" },
  { name: "الوهاب",  meaning: "الذي يُعطي العطاء الجزيل بلا عوض ولا منّة، ويهب ما يشاء لمن يشاء" },
  { name: "الفتاح",  meaning: "الذي يفتح أبواب الرزق والرحمة، ويحكم بين عباده بالحق" },
  { name: "المتكبر", meaning: "المتعظِّم بكماله وجلاله، الذي لا ينبغي الكبرياء إلا له سبحانه" },
  { name: "الجبار",  meaning: "الذي يجبر الكسير ويُعلي شأنه، القاهر لمن طغى وتكبّر" },
  { name: "الغني",   meaning: "الذي لا يحتاج إلى أحد من خلقه وجميع الخلق محتاجون إليه في كل شيء" },
  { name: "الباسط",  meaning: "الذي يبسط الرزق لمن يشاء ويقدر على التوسعة بلا حساب ويضيّق بحكمته" },
  { name: "المجيب",  meaning: "الذي يجيب دعاء كل داعٍ ويستجيب لمن ناداه قريباً كان أم بعيداً" },
  { name: "الحسيب",  meaning: "الكافي لعباده الذي يُحاسب الخلق يوم القيامة على ما قدّموا وما أخّروا" },
  { name: "الشهيد",  meaning: "الذي يشهد على كل شيء لا يغيب عنه شيء في الأرض ولا في السماء" },
  { name: "الأول",   meaning: "الذي ليس قبله شيء، السابق لكل موجود بلا ابتداء" },
  { name: "الآخر",   meaning: "الذي ليس بعده شيء، الباقي بعد فناء كل شيء" },
  { name: "الظاهر",  meaning: "الذي ظهر للعقول بدلائل كمال صفاته وعظيم خلقه" },
  { name: "الباطن",  meaning: "المحتجب عن إدراك الأبصار والعقول بكنه ذاته" },
  { name: "الوالي",  meaning: "الذي يتولى أمور الخلق بالتدبير والعناية والرحمة" },
  { name: "المتعال", meaning: "الذي تعالى وتنزّه عن كل صفة نقص ومشابهة للخلق" },
  { name: "التواب",  meaning: "الذي يقبل التوبة مرةً بعد مرة ويُكثر العفو والمغفرة" },
  { name: "المنتقم", meaning: "الذي ينتقم من المجرمين ويعاقب الظالمين بعدله المطلق" },
  { name: "العفو",   meaning: "الذي يمحو الذنوب ويُسقطها عن عباده التائبين" },
  { name: "الرءوف",  meaning: "ذو الرأفة الشديدة الكاملة التي تعلو كل رحمة" },
  { name: "المقسط",  meaning: "الذي يُقيم العدل بين خلقه فلا يظلم أحداً" },
  { name: "الجامع",  meaning: "الذي يجمع الخلائق ليوم الحساب وفق وعده الحق" },
  { name: "الغني",   meaning: "الكامل الغنى المطلق عن جميع خلقه وهم الفقراء إليه" },
  { name: "المغني",  meaning: "الذي يُغني من يشاء من عباده بفضله وجوده" },
  { name: "المانع",  meaning: "الذي يمنع ما يشاء ويُمسك ما يشاء بحكمته الكاملة" },
  { name: "الضار",   meaning: "الذي له وحده القدرة على إيصال الضر بمن يشاء بعدله" },
  { name: "النافع",  meaning: "الذي يُنفع من يشاء بما يشاء فالنفع كله بيده" },
  { name: "النور",   meaning: "نور السموات والأرض؛ هاديهم إلى الحق بوحيه ونوره" },
  { name: "الهادي",  meaning: "الذي يهدي من يشاء إلى الصراط المستقيم بتوفيقه" },
  { name: "البديع",  meaning: "الذي ابتدع الخلق لا على مثال سابق بقدرته الفائقة" },
  { name: "الباقي",  meaning: "الذي لا يزول ولا يفنى، الباقي بعد فناء خلقه" },
  { name: "الوارث",  meaning: "الذي يرث الأرض ومن عليها بعد فناء الخلق جميعاً" },
  { name: "الرشيد",  meaning: "الذي أرشد خلقه إلى مصالحهم ودلّهم على طريق النجاة" },
  { name: "الصبور",  meaning: "الذي لا يُعجّل بالعقوبة بل يُمهل ويصبر على المذنبين" },
];

// ─── كتب مقترحة ──────────────────────────────────────────────────────────

const RECOMMENDED_BOOKS = [
  { title: "كتاب التوحيد",             author: "محمد بن عبد الوهاب",    level: "مبتدئ",  desc: "أصل متين في توحيد الألوهية مع الأدلة القرآنية والحديثية." },
  { title: "ثلاثة الأصول وأدلتها",    author: "محمد بن عبد الوهاب",    level: "مبتدئ",  desc: "متن مختصر: معرفة الله، ودينه، ونبيه ﷺ." },
  { title: "العقيدة الواسطية",         author: "شيخ الإسلام ابن تيمية", level: "متوسط",  desc: "أجمع متن في عقيدة أهل السنة في الأسماء والصفات." },
  { title: "لمعة الاعتقاد",           author: "ابن قدامة المقدسي",      level: "مبتدئ",  desc: "متن حنبلي موجز في عقيدة السلف، مشروح شروحاً متعددة." },
  { title: "شرح أصول اعتقاد أهل السنة", author: "الإمام اللالكائي",   level: "متقدم",  desc: "أوسع كتب توثيق أقوال السلف في العقيدة بالأسانيد." },
  { title: "الحموية والتدمرية",       author: "شيخ الإسلام ابن تيمية", level: "متوسط",  desc: "رسالتان في إثبات الصفات والرد على من عطّلها." },
  { title: "فتح المجيد شرح كتاب التوحيد", author: "عبد الرحمن بن حسن", level: "متوسط",  desc: "أوسع شروح كتاب التوحيد وأكثرها استيعاباً للأدلة." },
  { title: "إعانة المستفيد بشرح كتاب التوحيد", author: "صالح الفوزان", level: "متوسط",  desc: "شرح معاصر جامع لكتاب التوحيد بأسلوب واضح." },
  { title: "معارج القبول", author: "حافظ الحكمي",  level: "متقدم",  desc: "أجمع كتاب معاصر في أصول الدين والعقيدة على منهج السلف." },
  { title: "القول المفيد على كتاب التوحيد", author: "ابن عثيمين",    level: "متوسط",  desc: "شرح العلامة ابن عثيمين على كتاب التوحيد بفوائد وتنبيهات." },
  { title: "شرح العقيدة الطحاوية",         author: "ابن أبي العز الحنفي", level: "متقدم", desc: "أجمع شرح لمتن الطحاوية، يستوعب مسائل الاعتقاد مع الرد على المخالفين بالدليل." },
  { title: "قاعدة جليلة في التوسل والوسيلة", author: "شيخ الإسلام ابن تيمية", level: "متوسط", desc: "رسالة جامعة في بيان أنواع التوسل المشروعة والممنوعة بالأدلة والتحقيق العلمي." },
  { title: "شرح العقيدة الواسطية", author: "محمد بن صالح العثيمين", level: "متوسط", desc: "شرح نفيس على متن الواسطية لابن تيمية، واضح المنهج ومرتب الأفكار، جمع بين التقرير والرد على المخالفين." },
  { title: "تيسير العزيز الحميد في شرح كتاب التوحيد", author: "سليمان بن عبد الله آل الشيخ", level: "متقدم", desc: "شرح موسَّع يستوعب أقوال العلماء ويرد على شبهات المخالفين بالحجج العلمية المفصَّلة." },
  { title: "شفاء العليل في مسائل القضاء والقدر والحكمة والتعليل", author: "ابن القيم الجوزية", level: "متقدم", desc: "أوسع كتاب في مسائل القضاء والقدر مع الرد على المنكرين بالحجج الفلسفية والنقلية." },
  { title: "مختصر الصواعق المرسلة", author: "ابن القيم، اختصره ابن الموصلي", level: "متقدم", desc: "ردٌّ علمي على المؤولة والمعطلة في مسائل الصفات بالدليل العقلي والنقلي." },
  { title: "عقيدة السلف وأصحاب الحديث", author: "أبو عثمان الصابوني", level: "متوسط", desc: "متن قديم من القرن الخامس يُحكي فيه الصابوني اعتقاد أصحاب الحديث بلا تأويل ولا تعطيل." },
  { title: "كتاب السنة", author: "ابن أبي عاصم", level: "متقدم", desc: "من أقدم الكتب في الاعتقاد، يجمع آثار السلف بالأسانيد في مسائل الإيمان والصفات والقدر." },
  { title: "الإبانة عن أصول الديانة", author: "أبو الحسن الأشعري", level: "متقدم", desc: "كتاب الأشعري المهم الذي كتبه في آخر حياته ليُبيِّن فيه رجوعه لعقيدة أهل الحديث." },
  { title: "التدمرية", author: "شيخ الإسلام ابن تيمية", level: "متقدم", desc: "رسالة محكمة في منهج التوفيق بين العقل والنقل، وتقرير أن الصحيح من المنقول لا يُخالف الصريح من المعقول." },
  { title: "نواقض الإسلام شرح ابن عثيمين", author: "محمد بن صالح العثيمين", level: "متوسط", desc: "شرح الشيخ ابن عثيمين لنواقض الإسلام العشرة مع الأدلة والرد على الشبهات المعاصرة بأسلوب واضح." },
  { title: "الرسالة التبوكية (زاد المهاجر)", author: "ابن القيم الجوزية", level: "متوسط", desc: "رسالة ابن القيم في مسائل التوكل والإيمان والهجرة وعلاقتها بكمال التوحيد، تجمع بين العقيدة والسلوك." },
  { title: "شرح العقيدة السفارينية", author: "محمد بن صالح العثيمين", level: "متقدم", desc: "شرح موسَّع على منظومة السفاريني في العقيدة، يُعالج مسائل الأسماء والصفات والقضاء والقدر واليوم الآخر." },
];

// ─── مكوّنات مساعدة ─────────────────────────────────────────────────────────

function HadithBadge({ h }: { h: HadithRef }) {
  return (
    <span className={`tawheed-hadith-badge ${GRADE_MOD[h.grade]}`} title={h.extra}>
      <span className="tawheed-hadith-badge__grade">{h.grade}</span>
      <span>·</span>
      <span>{h.source} ({h.number})</span>
      <span>·</span>
      <span>رواه {h.narrator}</span>
    </span>
  );
}

function SectionLabel({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="twh-section-label">
      <span className="twh-section-label__emoji" aria-hidden="true">{emoji}</span>
      <span>{label}</span>
    </div>
  );
}

// ─── الصفحة ────────────────────────────────────────────────────────────────

export default function TawhidPage() {
  const [search, setSearch] = useState("");
  const filteredPrinciples = useMemo(() =>
    search.trim() ? PRINCIPLES.filter(p => arabicMatchAny([p.title, p.body, p.hadith?.text ?? "", p.hadith?.source ?? ""], search)) : PRINCIPLES,
  [search]);
  const filteredAsma = useMemo(() =>
    search.trim() ? ASMA_HUSNA.filter(a => arabicMatchAny([a.name, a.meaning], search)) : ASMA_HUSNA,
  [search]);
  const filteredBooks = useMemo(() =>
    search.trim() ? RECOMMENDED_BOOKS.filter(b => arabicMatchAny([b.title, b.author, b.desc, b.level], search)) : RECOMMENDED_BOOKS,
  [search]);

  useEffect(() => {
    applyPageSeo({
      path: "/tawhid",
      title: "العقيدة والتوحيد، أقسام وموضوعات كاملة | المجلس العلمي",
      description:
        "بوابة العقيدة والتوحيد: أنواع التوحيد، أركان الإيمان، الأسماء الحسنى، الجنة والنار، علامات الساعة، الملائكة، والإعجاز العلمي، منهج أهل السنة والجماعة.",
      ogType: "article",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "موضوعات العقيدة والتوحيد",
          description: "بوابة العقيدة والتوحيد: أنواع التوحيد وأركان الإيمان والأسماء الحسنى والجنة والنار",
          itemListElement: AQEEDA_SECTIONS.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.title,
            url: `https://majlisilm.com${s.href}`,
          })),
        },
      ],
    });
  }, []);

  return (
    <div className="page-shell" dir="rtl">
      {/* مسار التنقل */}
      <nav className="tawheed-breadcrumb" aria-label="مسار التنقل">
        <Link href="/">الرئيسية</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">العقيدة والتوحيد</span>
      </nav>

      {/* رأس القسم */}
      <header className="twh-hub-hero">
        <div className="twh-hub-hero__inner">
          <p className="home-eyebrow">عقيدة أهل السنة والجماعة</p>
          <h1 className="twh-hub-hero__title">العقيدة والتوحيد</h1>
          <p className="twh-hub-hero__sub">
            أقسام العقيدة كاملةً، من التوحيد وأركان الإيمان حتى الغيبيات وعلامات الساعة
          </p>
          <blockquote className="twh-hub-hero__ayah">
            ﴿وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ﴾
            <cite>، الذاريات: ٥٦</cite>
          </blockquote>
        </div>
      </header>

      {/* ══ شبكة أقسام العقيدة ══ */}
      <section aria-labelledby="hub-sections-heading" className="twh-section">
        <h2 id="hub-sections-heading" className="tawheed-principles-heading">أقسام العقيدة والتوحيد</h2>
        <div className="twh-hub-grid">
          {AQEEDA_SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`twh-hub-card${s.isCurrent ? " twh-hub-card--current" : ""}`}
              style={{ "--twh-hub-clr": s.color } as React.CSSProperties}
              aria-current={s.isCurrent ? "page" : undefined}
            >
              <span className="twh-hub-card__emoji" aria-hidden="true">{s.emoji}</span>
              <div className="twh-hub-card__body">
                <p className="twh-hub-card__title">{s.title}</p>
                <p className="twh-hub-card__desc">{s.desc}</p>
              </div>
              <span className="twh-hub-card__badge">{s.badge}</span>
              {s.isCurrent && <span className="twh-hub-card__current-tag">أنت هنا</span>}
            </Link>
          ))}
        </div>
      </section>

      {/* ══ قفز سريع ══ */}
      <nav aria-label="انتقل إلى" className="twh-jumpnav">
        <a href="#tawhid-types"   className="twh-jumpnav__btn">أنواع التوحيد</a>
        <a href="#iman-pillars"   className="twh-jumpnav__btn">أركان الإيمان</a>
        <a href="#principles"     className="twh-jumpnav__btn">مسائل التوحيد</a>
        <a href="#asma-preview"   className="twh-jumpnav__btn">الأسماء الحسنى</a>
        <a href="#recommended"    className="twh-jumpnav__btn">كتب مقترحة</a>
      </nav>

      <div className="twh-search-wrap">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث في مسائل التوحيد والأسماء الحسنى والكتب..."
          className="page-search-input twh-search-input"
          aria-label="بحث في صفحة التوحيد"
        />
      </div>

      {/* ══ أنواع التوحيد الثلاثة ══ */}
      <section id="tawhid-types" aria-labelledby="types-heading" className="twh-section">
        <SectionLabel emoji="🕌" label="أنواع التوحيد الثلاثة" />
        <h2 id="types-heading" className="tawheed-principles-heading">أنواع التوحيد الثلاثة</h2>
        <div className="tawheed-types-grid">
          {TAWHEED_TYPES.map((t, idx) => (
            <div key={t.num} className={`tawheed-type-card tawheed-type-card--${idx === 2 ? "purple" : "emerald"}`}>
              <div className="tawheed-type-card__num">{t.num}</div>
              <p className="tawheed-type-card__title">{t.title}</p>
              <p className="tawheed-type-card__subtitle">{t.subtitle}</p>
              <p className="tawheed-type-card__desc">{t.desc}</p>
              <blockquote className="tawheed-type-card__ayah">﴿{t.ayah}﴾<cite>{t.ref}</cite></blockquote>
            </div>
          ))}
        </div>
      </section>

      {/* ══ أركان الإيمان الستة ══ */}
      <section id="iman-pillars" aria-labelledby="iman-heading" className="twh-section">
        <SectionLabel emoji="✨" label="أركان الإيمان" />
        <h2 id="iman-heading" className="tawheed-principles-heading">أركان الإيمان الستة</h2>
        <p className="twh-section-intro">
          قال ﷺ: «الإيمان أن تؤمن بالله وملائكته وكتبه ورسله واليوم الآخر وتؤمن بالقدر خيره وشرّه»
          <span className="twh-source-ref">، صحيح مسلم (٨)</span>
        </p>
        <div className="twh-pillars-grid twh-pillars-grid--6">
          {IMAN_PILLARS.map((p) => (
            <div key={p.num} className="twh-pillar-card">
              <div className="twh-pillar-num">{p.num}</div>
              <div className="twh-pillar-body">
                <span className="twh-pillar-icon" aria-hidden="true">{p.icon}</span>
                <p className="twh-pillar-title">{p.title}</p>
                <p className="twh-pillar-desc">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="twh-subsection-link">
          <Link href="/arkan-iman" className="twh-goto-btn">صفحة أركان الإيمان كاملةً ←</Link>
        </div>
      </section>

      {/* ══ مسائل التوحيد ══ */}
      <section id="principles" aria-labelledby="principles-heading" className="twh-section">
        <SectionLabel emoji="📐" label="مسائل التوحيد" />
        <h2 id="principles-heading" className="tawheed-principles-heading">مسائل مهمة في التوحيد</h2>
        <div className="tawheed-principles-grid">
          {filteredPrinciples.map((p) => (
            <div key={p.title} className="tawheed-principle-card">
              <p className="tawheed-principle-card__title">{p.title}</p>
              <p className="tawheed-principle-card__body">{p.body}</p>
              {p.hadith && (
                <div className="twh-hadith-wrap">
                  <p className="twh-hadith-text">«{p.hadith.text}»</p>
                  <HadithBadge h={p.hadith} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══ من الأسماء الحسنى (عينة) ══ */}
      <section id="asma-preview" aria-labelledby="asma-heading" className="twh-section">
        <SectionLabel emoji="💎" label="الأسماء الحسنى" />
        <h2 id="asma-heading" className="tawheed-principles-heading">من الأسماء الحسنى</h2>
        <p className="twh-section-intro">
          ﴿وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَى فَادْعُوهُ بِهَا﴾
          <span className="twh-source-ref">، الأعراف: ١٨٠</span>
        </p>
        <div className="twh-asma-grid">
          {filteredAsma.map((a) => (
            <div key={a.name} className="twh-asma-card">
              <p className="twh-asma-name">{a.name}</p>
              <p className="twh-asma-meaning">{a.meaning}</p>
            </div>
          ))}
        </div>
        <div className="twh-subsection-link">
          <Link href="/asma-husna" className="twh-goto-btn">الصفحة الكاملة للأسماء الحسنى (٩٩ اسماً) ←</Link>
        </div>
      </section>

      {/* ══ كتب مقترحة ══ */}
      <section id="recommended" aria-labelledby="books-heading" className="twh-section">
        <SectionLabel emoji="📚" label="كتب مقترحة" />
        <h2 id="books-heading" className="tawheed-principles-heading">كتب مقترحة في العقيدة</h2>
        <div className="twh-books-grid">
          {filteredBooks.map((b) => (
            <div key={b.title} className="twh-book-card">
              <span className={`twh-book-level twh-book-level--${b.level === "مبتدئ" ? "beginner" : b.level === "متوسط" ? "mid" : "adv"}`}>{b.level}</span>
              <p className="twh-book-title">{b.title}</p>
              <p className="twh-book-author">{b.author}</p>
              <p className="twh-book-desc">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <SectionQuiz
        categoryId="aqeeda"
        title="اختبر معلوماتك في العقيدة والتوحيد"
        count={4}
      />

      <div className="twh-share">
        <ShareButtons title="العقيدة والتوحيد — المجلس العلمي" url="https://majlisilm.com/tawhid" />
      </div>
    </div>
  );
}
