import { SectionIcon } from "@/components/ui/SectionIcon";
import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import { HubCard } from "@/components/ui/HubCard";
import { topicThemeCssVars, getTopicTheme } from "@/config/topic-themes";
import "@/styles/pages/tawhid.css";
import "@/styles/pages/misc-page-legacy.css";

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
    href: "/tawhid", badge: "أنت هنا", color: "var(--mj-brand-deep)", isCurrent: true,
  },
  {
    emoji: "📘", title: "مدخل إلى العقيدة",
    desc: "تعريف العقيدة ومصدرها وأركانها الإجمالية على منهج السلف",
    href: "/learn/aqeedah-intro", badge: "درس", color: "#0B3D2E",
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
    desc: "أسماء الله الحسنى الثابتة، مع بيان منهج الإحصاء والتحفّظ من السرد الضعيف",
    href: "/asma-husna", badge: "أسماء", color: "var(--mj-brand)",
  },
  {
    emoji: "🌿", title: "الجنة والنار",
    desc: "صفة الجنة ونعيمها وصفة النار وعذابها",
    href: "/janna-naar", badge: "عقيدة", color: "var(--mj-brand-deep)",
  },
  {
    emoji: "⏳", title: "علامات الساعة",
    desc: "العلامات الصغرى والكبرى مرتبةً بالأدلة",
    href: "/alamat-saah", badge: "صغرى وكبرى", color: "var(--mj-brand)",
  },
  {
    emoji: "👼", title: "الملائكة في الإسلام",
    desc: "الإيمان بوجودهم وصفاتهم وما ثبت من أسمائهم ومهامهم في الوحي",
    href: "/malaika", badge: "غيبيات", color: "#5B21B6",
  },
  {
    emoji: "⚖️", title: "الولاء والبراء",
    desc: "موالاة أهل الإيمان والبراءة من الشرك بضابط البر والعدل مع المسالمين",
    href: "/learn/wala-bara", badge: "درس", color: "#92400E",
  },
  {
    emoji: "📖", title: "مسار تعلّم العقيدة",
    desc: "منهج متدرّج في أركان الإيمان والتوحيد من مصادر أهل السنة",
    href: "/lessons", badge: "مسار", color: "var(--mj-brand)",
  },
  {
    emoji: "🌟", title: "عقيدة أهل السنة والجماعة",
    desc: "معالم المنهج: التلقي، الإيمان، الصفات، الصحابة، القدر، والوسطية",
    href: "/learn/aqeedat-ahl-sunnah", badge: "١٠ دروس", color: "#0B3D2E",
  },
  {
    emoji: "📚", title: "الفرق والمذاهب",
    desc: "عرض تاريخي للفرق مع بيان موقف أهل السنة",
    href: "/islamic-sects", badge: "موسوعة", color: "#1E3A5F",
  },
];

// ─── أنواع التوحيد ────────────────────────────────────────────────────────

const TAWHEED_TYPES = [
  {
    num: "١", title: "توحيد الربوبية", subtitle: "توحيد الخلق والتدبير",
    desc: "الإقرار بأن الله وحده الخالق الرازق المدبّر؛ إقرار فطريّ لا يكفي وحده للنجاة بلا توحيد العبادة.",
    ayah: "قُلْ مَن يَرْزُقُكُم مِّنَ السَّمَاءِ وَالْأَرْضِ أَمَّن يَمْلِكُ السَّمْعَ وَالْأَبْصَارَ",
    ref: "يونس: ٣١", variant: "emerald",
  },
  {
    num: "٢", title: "توحيد الألوهية", subtitle: "توحيد العبادة والقصد",
    desc: "إفراد الله بالعبادة كلها؛ وهو مضمون لا إله إلا الله وأصل دعوة الرسل.",
    ayah: "وَمَا أَرْسَلْنَا مِن قَبْلِكَ مِن رَّسُولٍ إِلَّا نُوحِي إِلَيْهِ أَنَّهُ لَا إِلَٰهَ إِلَّا أَنَا فَاعْبُدُونِ",
    ref: "الأنبياء: ٢٥", variant: "emerald",
  },
  {
    num: "٣", title: "توحيد الأسماء والصفات", subtitle: "توحيد الإثبات والتنزيه",
    desc: "إثبات ما أثبته الله ورسوله من الأسماء والصفات بلا تحريف ولا تعطيل ولا تمثيل.",
    ayah: "لَيْسَ كَمِثْلِهِ شَيْءٌ وَهُوَ السَّمِيعُ الْبَصِيرُ",
    ref: "الشورى: ١١", variant: "purple",
  },
];

// ─── أركان الإيمان ────────────────────────────────────────────────────────

const IMAN_PILLARS = [
  { num: "١", title: "الإيمان بالله",          body: "الإيمان بوجود الله وربوبيته وألوهيته وأسمائه وصفاته الكاملة. وهو أصل الأصول وأساس الأركان", icon: "🌿" },
  { num: "٢", title: "الإيمان بالملائكة",       body: "الإيمان بوجودهم وأنهم عباد الله المكرمون، يُنفّذون أوامره ولا يعصونه، ومن أشهرهم جبريل وميكائيل وإسرافيل", icon: "👼" },
  { num: "٣", title: "الإيمان بالكتب",          body: "الإيمان بجميع الكتب التي أنزلها الله على رسله: التوراة والإنجيل والزبور وصحف إبراهيم والقرآن الكريم الذي نسخها", icon: "📖" },
  { num: "٤", title: "الإيمان بالرسل",          body: "الإيمان بجميع الأنبياء والمرسلين من آدم حتى محمد ﷺ خاتمهم، وأنهم بلّغوا الرسالة وأدّوا الأمانة", icon: "🌟" },
  { num: "٥", title: "الإيمان باليوم الآخر",    body: "الإيمان بكل ما أخبر الله ورسوله عن ما بعد الموت: من فتنة القبر وعذابه ونعيمه، والبعث والحشر والميزان والصراط والجنة والنار.", icon: "⏳" },
  { num: "٦", title: "الإيمان بالقدر",          body: "الإيمان بأن الله علم كل شيء وكتبه وشاءه وخلقه. وله أربع مراتب: العلم، والكتابة، والمشيئة، والخلق", icon: "✨" },
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
    body: "أعظم ما أمر الله به التوحيد، وأعظم ما نهى عنه الشرك. ﴿وَاعْبُدُوا اللَّهَ وَلَا تُشْرِكُوا بِهِ شَيْئًا﴾ [النساء: ٣٦]",
  },
  {
    title: "الشرك الأكبر",
    body: "صرف شيء من العبادة لغير الله كدعاء الأموات والذبح والنذر لغير الله. أعظم الذنوب ولا يغفره الله لمن مات عليه. ﴿إِنَّ اللَّهَ لَا يَغْفِرُ أَن يُشْرَكَ بِهِ﴾ [النساء: ٤٨].",
  },
  {
    title: "الشرك الأصغر",
    body: "ما أطلق عليه الشرعُ اسم الشرك ولم يبلغ حدّ الأكبر، كالرياء والسمعة والحلف بغير الله",
    hadith: {
      text: "إنَّ أخوف ما أخاف عليكم الشرك الأصغر: الرياء",
      source: "مسند أحمد ٢٣٦٣٠ — حسّنه الألباني في صحيح الترغيب", number: "٢٣٦٣٠", grade: "حسن",
      narrator: "محمود بن لبيد الأنصاري", extra: "صحّحه الألباني في السلسلة الصحيحة (٩٥١)",
    },
  },
  {
    title: "السنة والبدعة",
    body: "السنة: ما ثبت عن النبي ﷺ من قول أو فعل أو تقرير في أمور الدين. والبدعة: الإحداث في الدين بما لم يشرعه الله ورسوله. قال ﷺ: «من أحدث في أمرنا هذا ما ليس منه فهو رد» (متفق عليه). وكل بدعة ضلالة؛ ولا يُقال «بدعة حسنة» في تقرير العبادات. والحسن ما حسّنه الشرع، والقبيح ما قبّحه.",
    hadith: {
      text: "كل بدعة ضلالة، وكل ضلالة في النار",
      source: "صحيح مسلم", number: "٨٦٧", grade: "صحيح", narrator: "جابر بن عبدالله",
    },
  },
  {
    title: "التوسل المشروع",
    body: "يُشرع التوسل بأسماء الله وصفاته، وبالعمل الصالح، وبدعاء الرجل الصالح الحي. أما دعاء الأموات فهو الشرك الأكبر",
  },
  {
    title: "التعلق بالأسباب",
    body: "الأخذ بالأسباب المشروعة واجب مع صرف القلب لله وحده. أما اعتقاد تأثير السبب بذاته دون الله فهو قدح في التوحيد",
  },
  {
    title: "أصل دعوة الرسل",
    body: "بعث الله كل رسول بالدعوة إلى توحيد الألوهية أولاً. ﴿وَلَقَدْ بَعَثْنَا فِي كُلِّ أُمَّةٍ رَّسُولًا أَنِ اعْبُدُوا اللَّهَ وَاجْتَنِبُوا الطَّاغُوتَ﴾ [النحل: ٣٦].",
  },
  {
    title: "حقوق الله على العباد",
    body: "أعظم حق لله على العباد: عبادته وحده لا شريك له، وترك عبادة ما سواه. وحق العباد على الله — حق تفضّل لا إيجاب خلقٍ على الخالق — ألا يُعذِّب من لم يُشرك به شيئاً.",
    hadith: {
      text: "حقُّ الله على العباد أن يعبدوه ولا يشركوا به شيئاً، وحقُّ العباد على الله ألا يعذِّب من لا يشرك به شيئاً",
      source: "صحيح البخاري ومسلم", number: "٢٨٥٦ / ٤٨", grade: "صحيح",
      narrator: "معاذ بن جبل رضي الله عنه", extra: "متفق عليه",
    },
  },
  {
    title: "الخوف والرجاء والمحبة",
    body: "ثلاثة أصول في العبادة لا تتم إلا بها مجتمعةً: محبة الله تحرّك القلب إليه، والخوف يحجزه عن المعاصي، والرجاء يدفعه نحو الطاعة. من أُفرد أحدها اعوجّ.",
  },
  {
    title: "الإسلام والإيمان والإحسان",
    body: "ثلاث مراتب في الدين: الإسلام (الأعمال الظاهرة)، والإيمان (تصديق القلب)، والإحسان (أن تعبد الله كأنك تراه). وهي حديث جبريل الشهير.",
    hadith: { text: "الإحسان أن تعبد الله كأنك تراه، فإن لم تكن تراه فإنه يراك", source: "صحيح مسلم", number: "٨", grade: "صحيح", narrator: "عمر بن الخطاب رضي الله عنه" },
  },
  {
    title: "مقتضيات لا إله إلا الله",
    body: "مما قرره أهل العلم تعليمًا لمعنى شهادة التوحيد: العلم بها، واليقين، والقبول، والانقياد، والصدق، والإخلاص، والمحبة لها ولأهلها. فمن نطق بها دون علم بمعناها أو دون انقياد لمقتضاها لم ينتفع بها الانتفاع المطلوب.",
  },
  {
    title: "الولاء والبراء",
    body: "من مقتضيات التوحيد: محبة أهل الإيمان وموالاتهم، والبراءة من الكفر والشرك اعتقاداً. ﴿لَّا تَجِدُ قَوْمًا يُؤْمِنُونَ بِاللَّهِ وَالْيَوْمِ الْآخِرِ يُوَادُّونَ مَنْ حَادَّ اللَّهَ وَرَسُولَهُ﴾ [المجادلة: ٢٢]. والضابط: البر والعدل مع من لم يقاتل المسلمين ولم يخرجهم من ديارهم، كما في الممتحنة: ٨. ليست البراءة ذريعة لظلم المسالمين أو الغدر.",
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
      source: "الترمذي ٣٥٣٧ — حسّنه الألباني", number: "٣٥٣٧", grade: "حسن", narrator: "ابن عمر رضي الله عنه",
    },
  },
  {
    title: "الشفاعة المثبتة في الإسلام",
    body: "الشفاعة ثابتة لنبينا ﷺ وللملائكة والأنبياء والصالحين يوم القيامة، لكنها بإذن الله وحده لا بدونه. ﴿مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ﴾ [البقرة: ٢٥٥]. أما طلب الشفاعة من الأموات ودعاؤهم فهو من الشرك الأكبر المنهي عنه.",
  },
  {
    title: "الإيمان يزيد وينقص",
    body: "مذهب أهل السنة أن الإيمان قول وعمل واعتقاد، يزيد بالطاعات وينقص بالمعاصي. ﴿وَيَزْدَادَ الَّذِينَ آمَنُوا إِيمَانًا﴾ [المدثر: ٣١]. وهو أوسع ما بين مرتبة من في قلبه أدنى مثقال ذرة من إيمان إلى مرتبة النبيين والصديقين. خلافاً للمرجئة الذين جعلوه لا يتجزأ.",
    hadith: { text: "أكمل المؤمنين إيماناً أحسنهم خُلقاً", source: "الترمذي ١١٦٢ — حسّنه الألباني", number: "١١٦٢", grade: "حسن", narrator: "أبو هريرة" },
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

/** معاينة مختصرة لأسماء ثابتة في الكتاب أو السنة الصحيحة — لا يُعتمد هنا سرد الترمذي التفصيلي الضعيف. */
const ASMA_HUSNA = [
  { name: "الله", meaning: "الاسم الجامع لجميع صفات الكمال والجلال" },
  { name: "الرحمن", meaning: "ذو الرحمة الواسعة التي وسعت كل شيء" },
  { name: "الرحيم", meaning: "ذو الرحمة الخاصة بالمؤمنين" },
  { name: "الملك", meaning: "المالك لجميع الملك، الحاكم الذي لا حاكم سواه" },
  { name: "القدوس", meaning: "المنزّه عن كل نقص وعيب" },
  { name: "السلام", meaning: "السالم من كل عيب ونقص، ومصدر السلام لعباده" },
  { name: "العزيز", meaning: "الغالب الذي لا يُغلب، ذو العزة الكاملة" },
  { name: "الجبار", meaning: "القاهر لخلقه، الذي يجبر الكسير" },
  { name: "المتكبر", meaning: "المتعظِّم بكماله، والكبرياء رداؤه سبحانه" },
  { name: "الخالق", meaning: "الذي خلق كل شيء فقدّره تقديرًا" },
  { name: "الغفار", meaning: "الذي يغفر الذنوب مرة بعد مرة لمن تاب" },
  { name: "القهار", meaning: "الغالب على كل شيء بقدرته" },
  { name: "الوهاب", meaning: "كثير العطاء بلا عوض" },
  { name: "الرزاق", meaning: "المتكفّل بأرزاق الخلق" },
  { name: "الفتاح", meaning: "الذي يفتح أبواب الرحمة والرزق والحكم بالحق" },
  { name: "العليم", meaning: "المحيط علمه بكل شيء" },
  { name: "السميع", meaning: "الذي يسمع كل صوت سرًا وعلنًا" },
  { name: "البصير", meaning: "الذي يرى كل شيء دقيقه وجليله" },
  { name: "اللطيف", meaning: "العالم بدقائق الأمور، الرفيق بعباده" },
  { name: "الخبير", meaning: "المحيط ببواطن الأمور وظواهرها" },
  { name: "الحليم", meaning: "الذي لا يعجّل العقوبة مع القدرة" },
  { name: "العظيم", meaning: "ذو العظمة المطلقة" },
  { name: "الغفور", meaning: "واسع المغفرة لذنوب التائبين" },
  { name: "الشكور", meaning: "الذي يثيب على القليل بالكثير" },
  { name: "العلي", meaning: "العالي فوق خلقه بذاته وقدره وقهره" },
  { name: "الكبير", meaning: "الذي له الكبرياء في السموات والأرض" },
  { name: "الحفيظ", meaning: "الحافظ لخلقه ولما شاء حفظه من الأعمال" },
  { name: "الكريم", meaning: "الجواد العظيم العطاء" },
  { name: "الرقيب", meaning: "المطّلع على كل شيء فلا يغيب عنه شيء" },
  { name: "المجيب", meaning: "الذي يجيب دعاء الداعين" },
  { name: "الواسع", meaning: "واسع الرحمة والعلم والعطاء" },
  { name: "الحكيم", meaning: "الذي يضع كل شيء في موضعه" },
  { name: "الودود", meaning: "الذي يحب أولياءه ويتحبّب إليهم" },
  { name: "المجيد", meaning: "ذو المجد والعظمة" },
  { name: "الشهيد", meaning: "الحاضر المطلع الذي لا يغيب عنه شيء" },
  { name: "الحق", meaning: "الثابت الذي لا يزول" },
  { name: "الوكيل", meaning: "الكافي لمن توكّل عليه" },
  { name: "القوي", meaning: "كامل القوة لا يلحقه عجز" },
  { name: "المتين", meaning: "شديد القوة محكمها" },
  { name: "الولي", meaning: "الناصر المتولّي لأمور عباده المؤمنين" },
  { name: "الحميد", meaning: "المستحق للحمد كله" },
  { name: "الحي", meaning: "الذي له الحياة الكاملة فلا يموت" },
  { name: "القيوم", meaning: "القائم بنفسه المقيم لغيره" },
  { name: "الأحد", meaning: "المنفرد بالكمال الذي لا نظير له" },
  { name: "الصمد", meaning: "الذي يُصمد إليه في الحوائج، الغني عن كل أحد" },
  { name: "الأول", meaning: "الذي ليس قبله شيء" },
  { name: "الآخر", meaning: "الذي ليس بعده شيء" },
  { name: "الظاهر", meaning: "الظاهر بآياته ودلائله" },
  { name: "الباطن", meaning: "المحتجب عن إدراك كنه ذاته" },
  { name: "التواب", meaning: "الذي يقبل التوبة مرة بعد مرة" },
  { name: "العفو", meaning: "الذي يمحو الذنوب عن عباده" },
  { name: "الرؤوف", meaning: "شديد الرأفة بعباده" },
  { name: "الغني", meaning: "الغني المطلق عن جميع خلقه" },
  { name: "النور", meaning: "نور السموات والأرض" },
  { name: "الهادي", meaning: "الذي يهدي من يشاء إلى صراطه" },
  { name: "البديع", meaning: "مبدع الخلق على غير مثال سابق" },
  { name: "الوارث", meaning: "الذي يبقى ويرث الأرض ومن عليها" },
];

// ─── كتب مقترحة ──────────────────────────────────────────────────────────

const RECOMMENDED_BOOKS = [
  { title: "كتاب التوحيد",             author: "محمد بن عبد الوهاب",    level: "مبتدئ",  desc: "أصل متين في توحيد الألوهية مع الأدلة القرآنية والحديثية" },
  { title: "ثلاثة الأصول وأدلتها",    author: "محمد بن عبد الوهاب",    level: "مبتدئ",  desc: "متن مختصر: معرفة الله، ودينه، ونبيه ﷺ" },
  { title: "العقيدة الواسطية",         author: "شيخ الإسلام ابن تيمية", level: "متوسط",  desc: "أجمع متن في عقيدة أهل السنة في الأسماء والصفات" },
  { title: "لمعة الاعتقاد",           author: "ابن قدامة المقدسي",      level: "مبتدئ",  desc: "متن حنبلي موجز في عقيدة السلف، مشروح شروحاً متعددة" },
  { title: "شرح أصول اعتقاد أهل السنة", author: "الإمام اللالكائي",   level: "متقدم",  desc: "أوسع كتب توثيق أقوال السلف في العقيدة بالأسانيد" },
  { title: "الحموية والتدمرية",       author: "شيخ الإسلام ابن تيمية", level: "متوسط",  desc: "رسالتان في إثبات الصفات والرد على من عطّلها" },
  { title: "فتح المجيد شرح كتاب التوحيد", author: "عبد الرحمن بن حسن", level: "متوسط",  desc: "أوسع شروح كتاب التوحيد وأكثرها استيعاباً للأدلة" },
  { title: "إعانة المستفيد بشرح كتاب التوحيد", author: "صالح الفوزان", level: "متوسط",  desc: "شرح معاصر جامع لكتاب التوحيد بأسلوب واضح" },
  { title: "معارج القبول", author: "حافظ الحكمي",  level: "متقدم",  desc: "أجمع كتاب معاصر في أصول الدين والعقيدة على منهج السلف" },
  { title: "القول المفيد على كتاب التوحيد", author: "ابن عثيمين",    level: "متوسط",  desc: "شرح العلامة ابن عثيمين على كتاب التوحيد بفوائد وتنبيهات" },
  { title: "شرح العقيدة الطحاوية",         author: "ابن أبي العز الحنفي", level: "متقدم", desc: "أجمع شرح لمتن الطحاوية، يستوعب مسائل الاعتقاد مع الرد على المخالفين بالدليل" },
  { title: "قاعدة جليلة في التوسل والوسيلة", author: "شيخ الإسلام ابن تيمية", level: "متوسط", desc: "رسالة جامعة في بيان أنواع التوسل المشروعة والممنوعة بالأدلة والتحقيق العلمي" },
  { title: "شرح العقيدة الواسطية", author: "محمد بن صالح العثيمين", level: "متوسط", desc: "شرح نفيس على متن الواسطية لابن تيمية، واضح المنهج ومرتب الأفكار، جمع بين التقرير والرد على المخالفين" },
  { title: "تيسير العزيز الحميد في شرح كتاب التوحيد", author: "سليمان بن عبد الله آل الشيخ", level: "متقدم", desc: "شرح موسَّع يستوعب أقوال العلماء ويرد على شبهات المخالفين بالحجج العلمية المفصَّلة" },
  { title: "شفاء العليل في مسائل القضاء والقدر والحكمة والتعليل", author: "ابن قيم الجوزية", level: "متقدم", desc: "أوسع كتاب في مسائل القضاء والقدر مع الرد على المنكرين بالحجج الفلسفية والنقلية" },
  { title: "مختصر الصواعق المرسلة", author: "ابن القيم، اختصره ابن الموصلي", level: "متقدم", desc: "ردٌّ علمي على المؤولة والمعطلة في مسائل الصفات بالدليل العقلي والنقلي" },
  { title: "عقيدة السلف وأصحاب الحديث", author: "أبو عثمان الصابوني", level: "متوسط", desc: "متن قديم من القرن الخامس يُحكي فيه الصابوني اعتقاد أصحاب الحديث بلا تأويل ولا تعطيل" },
  { title: "كتاب السنة", author: "ابن أبي عاصم", level: "متقدم", desc: "من أقدم الكتب في الاعتقاد، يجمع آثار السلف بالأسانيد في مسائل الإيمان والصفات والقدر" },
  { title: "الإبانة عن أصول الديانة", author: "أبو الحسن الأشعري", level: "متقدم", desc: "كتاب الأشعري المهم الذي كتبه في آخر حياته ليُبيِّن فيه رجوعه لعقيدة أهل الحديث" },
  { title: "التدمرية", author: "شيخ الإسلام ابن تيمية", level: "متقدم", desc: "رسالة محكمة في منهج التوفيق بين العقل والنقل، وتقرير أن الصحيح من المنقول لا يُخالف الصريح من المعقول" },
  { title: "نواقض الإسلام شرح ابن عثيمين", author: "محمد بن صالح العثيمين", level: "متوسط", desc: "شرح الشيخ ابن عثيمين لنواقض الإسلام العشرة مع الأدلة والرد على الشبهات المعاصرة بأسلوب واضح" },
  { title: "الرسالة التبوكية (زاد المهاجر)", author: "ابن قيم الجوزية", level: "متوسط", desc: "رسالة ابن القيم في مسائل التوكل والإيمان والهجرة وعلاقتها بكمال التوحيد، تجمع بين العقيدة والسلوك" },
  { title: "شرح العقيدة السفارينية", author: "محمد بن صالح العثيمين", level: "متقدم", desc: "شرح موسَّع على منظومة السفاريني في العقيدة، يُعالج مسائل الأسماء والصفات والقضاء والقدر واليوم الآخر" },
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
      <span className="twh-section-label__emoji" aria-hidden="true"><SectionIcon name={emoji} size={20} /></span>
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
        "بوابة العقيدة والتوحيد على منهج أهل السنة: أنواع التوحيد، أركان الإيمان، الأسماء الحسنى الثابتة، الجنة والنار، علامات الساعة، والملائكة.",
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

      {/* رأس القسم — سمة العقيدة + on-dark */}
      <header
        className="twh-hub-hero on-dark"
        data-on-dark
        style={topicThemeCssVars(getTopicTheme("aqeedah"))}
      >
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
        <div className="hub-card-grid twh-hub-grid">
          {AQEEDA_SECTIONS.map((s) => (
            <HubCard
              key={s.href}
              href={s.href}
              title={s.title}
              description={s.desc}
              badge={s.badge}
              icon={<SectionIcon name={s.emoji} size={22} />}
              className={s.isCurrent ? "hub-card--featured" : undefined}
              footer={s.isCurrent ? <span className="twh-hub-card__current-tag">أنت هنا</span> : null}
            />
          ))}
        </div>
      </section>


      {/* ══ قفز سريع ══ */}
      <nav aria-label="انتقل إلى" className="twh-jumpnav">
        <a href="#tawhid-types"   className="twh-jumpnav__btn">أنواع التوحيد</a>
        <a href="#iman-pillars"   className="twh-jumpnav__btn">أركان الإيمان</a>
        <a href="#principles"     className="twh-jumpnav__btn">مسائل التوحيد</a>
        <a href="#asma-preview"   className="twh-jumpnav__btn">الأسماء الحسنى</a>
        <a href="#sources"        className="twh-jumpnav__btn">مصادر القسم</a>
        <a href="#recommended"    className="twh-jumpnav__btn">كتب مقترحة</a>
        <Link href="/learn/aqeedat-ahl-sunnah" className="twh-jumpnav__btn">دروس أهل السنة</Link>
        <Link href="/islamic-sects#ahl-al-sunna" className="twh-jumpnav__btn">أهل السنة في الفرق</Link>
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
                <span className="twh-pillar-icon" aria-hidden="true"><SectionIcon name={p.icon} size={22} /></span>
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
        <h2 id="asma-heading" className="tawheed-principles-heading">من الأسماء الحسنى الثابتة</h2>
        <p className="twh-section-intro">
          ﴿وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَى فَادْعُوهُ بِهَا﴾
          <span className="twh-source-ref">، الأعراف: ١٨٠</span>
          {""}معاينة لأسماء ثابتة في الوحي؛ أما سرد الترمذي التفصيلي لتسعة وتسعين اسمًا فضعيف عند المحققين، مع صحة أصل حديث الإحصاء بلا سرد في الصحيحين.
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
          <Link href="/asma-husna" className="twh-goto-btn">صفحة الأسماء الحسنى مع التنبيه المنهجي ←</Link>
        </div>
      </section>

      {/* ══ مصادر القسم ══ */}
      <section id="sources" aria-labelledby="sources-heading" className="twh-section">
        <SectionLabel emoji="📌" label="مصادر القسم" />
        <h2 id="sources-heading" className="tawheed-principles-heading">مصادر قسم العقيدة والتوحيد</h2>
        <p className="twh-section-intro">
          يُعتمد في هذا القسم على كتب أئمة السلف وشروحهم المعتمدة، لا على الرأي أو الذوق. أبرز المراجع:
        </p>
        <ul className="twh-section-intro" style={{ listStyle: "disc", paddingInlineStart: "1.5rem", lineHeight: 1.9 }}>
          <li>العقيدة الواسطية — ابن تيمية، وشرحها لابن عثيمين</li>
          <li>العقيدة الطحاوية مع شرح ابن أبي العز</li>
          <li>لمعة الاعتقاد — ابن قدامة</li>
          <li>كتاب التوحيد وشروحه (فتح المجيد، القول المفيد)</li>
          <li>معارج القبول — حافظ الحكمي</li>
        </ul>
        <div className="twh-subsection-link" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <Link href="/methodology" className="twh-goto-btn">منهج الموقع ومصادره ←</Link>
          <Link href="/learn/aqeedah-intro" className="twh-goto-btn">مدخل العقيدة ←</Link>
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

      {/* ══ مسار أهل السنة ══ */}
      <section aria-labelledby="aswj-heading" className="twh-section">
        <SectionLabel emoji="🌟" label="أهل السنة والجماعة" />
        <h2 id="aswj-heading" className="tawheed-principles-heading">أكمل دراسة منهج أهل السنة</h2>
        <p className="twh-section-intro">
          دروس منظّمة في معالم المنهج: مصدر التلقي، الإيمان، الأسماء والصفات، الصحابة، القدر، والوسطية بين الفرق — مع الإحالات إلى الواسطية والطحاوية.
        </p>
        <div className="twh-subsection-link" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <Link href="/learn/aqeedat-ahl-sunnah" className="twh-goto-btn">دروس عقيدة أهل السنة ←</Link>
          <Link href="/learn/aqeedah-intro" className="twh-goto-btn">مدخل إلى العقيدة ←</Link>
          <Link href="/learn/aqsam-tawheed" className="twh-goto-btn">أقسام التوحيد ←</Link>
          <Link href="/learn/nawaqid-islam" className="twh-goto-btn">نواقض الإسلام ←</Link>
          <Link href="/learn/wala-bara" className="twh-goto-btn">الولاء والبراء ←</Link>
          <Link href="/islamic-sects#ahl-al-sunna" className="twh-goto-btn">صفحة الفرق — أهل السنة ←</Link>
        </div>
      </section>

      <RelatedKnowledge kind="lesson" query="عقيدة توحيد" title="دروس ومواد ذات صلة بالتوحيد" limit={6} />

      <SectionQuiz sectionId="aqidah" title="اختبر معلوماتك في العقيدة والتوحيد" count={4} />

      <div className="twh-share">
        <ShareButtons title="العقيدة والتوحيد — المجلس العلمي" url="https://majlisilm.com/tawhid" />
      </div>
    </div>
  );
}
