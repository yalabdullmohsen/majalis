import { useEffect, useState, useMemo } from "react";
import { BarChart3, Globe, Heart, Star, TrendingUp, Users } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import "@/styles/elite-2026.css";

/* ══════════════════════════════════════════════════════════════════
   §241، الإسلام في أرقام  (.is-*)
   ══════════════════════════════════════════════════════════════════ */

type TabId = "global" | "quran" | "history" | "science";

const TABS: { id: TabId; label: string; icon: typeof Globe }[] = [
  { id: "global",  label: "الإسلام في العالم",   icon: Globe },
  { id: "quran",   label: "القرآن الكريم",        icon: Star },
  { id: "history", label: "الحضارة الإسلامية",   icon: TrendingUp },
  { id: "science", label: "الإعجاز العلمي",       icon: BarChart3 },
];

interface StatCard {
  value: string;
  label: string;
  sub?: string;
  color?: string;
}

interface BarItem {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
}

interface TimelineItem {
  year: string;
  event: string;
  note?: string;
}

interface ScienceCard {
  topic: string;
  ayah: string;
  ref: string;
  discovery: string;
  discoveryYear: string;
}

const GLOBAL_STATS: StatCard[] = [
  { value: "١.٩ مليار", label: "مسلم في العالم", sub: "٢٤٪ من سكان الأرض", color: "#176B57" },
  { value: "٢٠٥٠", label: "أكبر ديانة متوقعة", sub: "وفق تقديرات مركز بيو", color: "#1a5a7a" },
  { value: "٤٩", label: "دولة ذات أغلبية مسلمة", sub: "من أصل ١٩٥ دولة في العالم", color: "#0E6E52" },
  { value: "٣٨٠٠", label: "لغة ينطق بها المسلمون", sub: "الإسلام يتجاوز الحدود اللغوية", color: "#312E81" },
  { value: "٢٢٠٠+", label: "مسجد في ألمانيا", sub: "مثال على انتشار الإسلام في أوروبا", color: "#065F46" },
  { value: "١ مليون+", label: "حاج سنوياً", sub: "أكبر تجمع سنوي منظم في العالم", color: "#9B1C1C" },
  { value: "٨٠ مليون", label: "مسلم في أوروبا", sub: "يمثلون حوالي ١١٪ من سكان القارة", color: "#312E81" },
  { value: "٧.٥ مليون", label: "مسلم في أمريكا الشمالية", sub: "الولايات المتحدة وكندا مجتمعتين", color: "#065F46" },
  { value: "٥٠٠+", label: "جامعة إسلامية في العالم", sub: "تنتشر في آسيا وأفريقيا والشرق الأوسط", color: "#9B1C1C" },
  { value: "٣٠٠٠+", label: "إذاعة إسلامية عالمية", sub: "تبث محتوى إسلامياً بعشرات اللغات", color: "#153025" },
  { value: "٣ مليون+", label: "حافظ للقرآن في العالم", sub: "تتزايد أعداد الحفاظ سنوياً بشكل ملحوظ", color: "#0E6E52" },
  { value: "٣ مليون+", label: "مسجد في العالم", sub: "بين جامع كبير ومصلى، في كل بقاع الأرض", color: "#1a5a7a" },
  { value: "٦٠٠ مليار$", label: "اقتصاد إسلامي", sub: "حجم التمويل الإسلامي العالمي المتوقع بحلول ٢٠٢٦", color: "#312E81" },
  { value: "٢٥٠ مليون", label: "مسلم في أفريقيا جنوب الصحراء", sub: "أسرع مناطق نمو الإسلام في العالم", color: "#9B1C1C" },
];

const POPULATION_BARS: BarItem[] = [
  { label: "إندونيسيا", value: 231, max: 270, unit: "م", color: "#176B57" },
  { label: "باكستان",   value: 212, max: 270, unit: "م", color: "#1a5a7a" },
  { label: "بنغلاديش",  value: 153, max: 270, unit: "م", color: "#0E6E52" },
  { label: "نيجيريا",   value: 99,  max: 270, unit: "م", color: "#312E81" },
  { label: "مصر",       value: 87,  max: 270, unit: "م", color: "#065F46" },
  { label: "إيران",      value: 83,  max: 270, unit: "م", color: "#9B1C1C" },
  { label: "تركيا",     value: 75,  max: 270, unit: "م", color: "#153025" },
  { label: "الجزائر",   value: 44,  max: 270, unit: "م", color: "#1E3A5F" },
  { label: "المغرب",    value: 36,  max: 270, unit: "م", color: "#065F46" },
  { label: "السودان",   value: 35,  max: 270, unit: "م", color: "#1a5a7a" },
  { label: "السعودية",  value: 33,  max: 270, unit: "م", color: "#176B57" },
  { label: "الكويت",    value: 4,   max: 270, unit: "م", color: "#312E81" },
  { label: "الهند",    value: 200, max: 270, unit: "م", color: "#176B57" },
  { label: "إثيوبيا", value: 40,  max: 270, unit: "م", color: "#065F46" },
  { label: "أوزبكستان", value: 29, max: 270, unit: "م", color: "#1a5a7a" },
];

const QURAN_STATS: StatCard[] = [
  { value: "١١٤",  label: "سورة",        sub: "منها ٨٦ مكية و٢٨ مدنية", color: "#176B57" },
  { value: "٦٢٣٦", label: "آية",          sub: "في الرواية الأكثر شيوعاً", color: "#1a5a7a" },
  { value: "٣٠",   label: "جزءاً",        sub: "موزعة على ٦٠ حزباً", color: "#0E6E52" },
  { value: "٧٧٤٣٩", label: "كلمة",       sub: "في المصحف الشريف", color: "#312E81" },
  { value: "٣٢٣٦٧١", label: "حرف",       sub: "المجموع الكلي للحروف", color: "#065F46" },
  { value: "٢٣",   label: "سنة للنزول",  sub: "بدأ في رمضان ٦١٠م", color: "#9B1C1C" },
  { value: "٥",    label: "حفاظ في عهده ﷺ أشهرهم", sub: "عثمان، علي، ابن مسعود، زيد، أبيّ", color: "#153025" },
  { value: "١",    label: "مصدر للتشريع", sub: "أولاً وقبل كل شيء", color: "#1E3A5F" },
  { value: "٧",    label: "أحرف أُنزل عليها", sub: "القراءات السبع المتواترة المعتمدة", color: "#176B57" },
  { value: "٥ آلاف+", label: "حافظ للقرآن يتولد يومياً", sub: "تشير الإحصاءات لنمو مستمر في عدد الحفاظ", color: "#065F46" },
  { value: "١٨٠٠+", label: "لغة تُرجم إليها القرآن", sub: "وهو يتلى بالعربية كما أُنزل في كل أنحاء الأرض", color: "#312E81" },
  { value: "٤٠٠٠+", label: "موضوع علمي في القرآن", sub: "يتناولها العلماء في التفسير الموضوعي", color: "#0E6E52" },
  { value: "٢٥",   label: "نبياً مذكوراً باسمه", sub: "أكثرهم ذكراً موسى ﵁ في نحو ١٣٦ موضعاً", color: "#1a5a7a" },
  { value: "١٥",   label: "سجدة تلاوة", sub: "موزَّعة على ١٤ سورة وفق قول الجمهور", color: "#153025" },
  { value: "٢٩",   label: "سورة بحروف مقطعة", sub: "مثل الم وحم وطس — والحروف المقطعة ١٤ حرفاً", color: "#312E81" },
  { value: "٣",    label: "مراحل للجمع والتدوين", sub: "عهد النبي ﷺ ثم أبي بكر ثم عثمان ﵃", color: "#065F46" },
];

const HISTORY_TIMELINE: TimelineItem[] = [
  { year: "٦١٠ م", event: "بدء نزول الوحي على النبي محمد ﷺ في غار حراء" },
  { year: "٦٢٢ م", event: "الهجرة النبوية، بداية التقويم الهجري" },
  { year: "٦٣٢ م", event: "وفاة النبي ﷺ وحفظ القرآن مكتوباً في عهد أبي بكر" },
  { year: "٧٥٠ م", event: "امتداد الدولة الإسلامية من الصين حتى إسبانيا" },
  { year: "٨٣٠ م", event: "تأسيس بيت الحكمة في بغداد، عصر الترجمة والعلم" },
  { year: "١٠٠٠ م", event: "ابن سينا يؤلف القانون في الطب، مرجع الطب لـ ٦٠٠ سنة" },
  { year: "١٢٥٨ م", event: "سقوط بغداد، وبقاء القرآن محفوظاً في الصدور" },
  { year: "١٤٥٣ م", event: "فتح القسطنطينية على يد محمد الفاتح" },
  { year: "١٦٠٠ م", event: "انتشار الإسلام في جنوب آسيا وأفريقيا جنوب الصحراء", note: "عبر التجارة والدعوة السلمية" },
  { year: "١٩٢٤ م", event: "سقوط الخلافة العثمانية وبداية مرحلة النهضة الإسلامية الجديدة" },
  { year: "١٩٤٨ م", event: "تأسيس منظمة المؤتمر الإسلامي لاحقاً في ١٩٦٩م، أكبر تكتل إسلامي دولي" },
  { year: "٢٠١٥ م", event: "تجاوز المسلمين ١.٨ مليار نسمة، ١ من كل ٤ على وجه الأرض مسلم" },
  { year: "٢٠٢٤ م", event: "الإسلام الدين الأسرع نمواً في العالم لعقود متتالية", note: "وفق مركز بيو للأبحاث" },
  { year: "٥٧٠ م", event: "ولادة النبي محمد ﷺ في مكة المكرمة عام الفيل", note: "أشرف مولود في تاريخ البشرية" },
  { year: "٦٣٧ م", event: "فتح بيت المقدس على يد عمر بن الخطاب بعهد أمان تاريخي للأديان" },
  { year: "٧٠٠ م", event: "تدوين علم الحديث وجمع السنة النبوية بمنهج الجرح والتعديل" },
  { year: "٩٠٠ م", event: "ذروة الحضارة العباسية وسيادة بغداد كأكبر مدن العالم آنذاك" },
  { year: "١١٨٧ م", event: "تحرير القدس على يد صلاح الدين الأيوبي بعد ٨٨ عاماً من الاحتلال" },
  { year: "١٣٥٠ م", event: "ابن بطوطة يُتمّ رحلته التي تجاوزت ١٢٠٠٠٠ كم، أوسع رحلة في التاريخ القديم" },
  { year: "١٥١٧ م", event: "الدولة العثمانية تحتضن الخلافة الإسلامية وتسيطر على معظم العالم العربي" },
  { year: "٧١١ م", event: "فتح الأندلس على يد طارق بن زياد، بداية ثمانية قرون من الحضارة الإسلامية في أوروبا" },
  { year: "٧٦٢ م", event: "تأسيس بغداد على يد الخليفة المنصور، لتصبح عاصمة العالم وقاعدة الحضارة العباسية" },
  { year: "١٤٩٢ م", event: "سقوط غرناطة ونهاية الحضارة الأندلسية في أوروبا بعد ثمانية قرون من التألق الحضاري" },
];

const HISTORY_ACHIEVEMENTS: StatCard[] = [
  { value: "٨٠٠+", label: "طبيب وعالم مسلم", sub: "في العصور الوسطى أسهموا في الطب والعلوم", color: "#176B57" },
  { value: "٤٠٠+", label: "كتاب لابن سينا", sub: "شاملة للطب والفلسفة والفلك", color: "#1a5a7a" },
  { value: "١٢٠٠+", label: "لفظ عربي في الإنجليزية", sub: "مثل: algebra, alcohol, coffee, sugar", color: "#0E6E52" },
  { value: "٦٠٠ سنة", label: "القانون مرجعاً طبياً", sub: "كتاب ابن سينا في جامعات أوروبا", color: "#312E81" },
  { value: "٨٠٠ م", label: "جبر الخوارزمي", sub: "مؤسس علم الجبر وأصل كلمة Algorithm", color: "#065F46" },
  { value: "٢٠٠٠+", label: "اختراع إسلامي وصل أوروبا", sub: "في الكيمياء والبصريات والهندسة والفلك", color: "#9B1C1C" },
  { value: "٨٣٦ م", label: "المستشفى الأول منظَّم", sub: "بيمارستان بغداد — أول مستشفى عام في التاريخ", color: "#1E3A5F" },
  { value: "١١٢١ م", label: "الغزالي يُجدد الفقه", sub: "أحيا الإمام الغزالي علوم الدين بمنهج متكامل", color: "#153025" },
  { value: "١٠٠٠+", label: "كتاب رياضيات ترجم عن العربية", sub: "وصلت إلى أوروبا والهند والصين وغيرهما", color: "#065F46" },
  { value: "٢٧٠ م", label: "أول مرصد فلكي عربي منظّم", sub: "مرصد الشماسية ببغداد في عهد المأمون", color: "#1a5a7a" },
  { value: "١٥٠+", label: "نجم يحمل اسماً عربياً حتى اليوم", sub: "مثل: أحمد (Achernar)، بيتلجوس، الدبران", color: "#312E81" },
  { value: "٩٠٠+", label: "مدرسة وجامعة في الأندلس", sub: "المدارس والمكتبات ودور العلم في الحضارة الأندلسية", color: "#153025" },
  { value: "١٠ آلاف", label: "مخطوطة في مكتبة بغداد", sub: "قبل حرقها: خزينة العلم الإسلامي في العصر الذهبي", color: "#176B57" },
  { value: "٣٢٠+", label: "عالم رياضيات مسلم بارز", sub: "في الجبر والهندسة والمثلثات وعلم الأعداد", color: "#312E81" },
  { value: "٧٠٠+", label: "لفظ عربي في الإسبانية", sub: "إرث الحضارة الأندلسية في اللغة الإسبانية الحديثة", color: "#065F46" },
  { value: "٩٦٥-١٠٤٠ م", label: "ابن الهيثم — أبو علم البصريات", sub: "أسس نظرية البصر الحديثة وكتب 'المناظر' المرجع الأوروبي لـ500 عام", color: "#1E3A5F" },
  { value: "١٢٠٠+", label: "نبات عشبي موثَّق طبياً", sub: "وثَّق ابن البيطار الأندلسي نحو 1400 دواء وعقار في موسوعته النباتية", color: "#0E6E52" },
  { value: "٨٥٩ م", label: "القرويين — أقدم جامعة في العالم", sub: "تأسست في فاس بالمغرب على يد فاطمة الفهرية، لا تزال تعمل حتى اليوم", color: "#153025" },
];

const SCIENCE_CARDS: ScienceCard[] = [
  {
    topic: "توسّع الكون",
    ayah: "وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ",
    ref: "سورة الذاريات: ٤٧",
    discovery: "اكتشاف توسع الكون على يد إدوين هابل",
    discoveryYear: "١٩٢٩ م",
  },
  {
    topic: "الحاجز بين البحرين",
    ayah: "مَرَجَ الْبَحْرَيْنِ يَلْتَقِيَانِ، بَيْنَهُمَا بَرْزَخٌ لَّا يَبْغِيَانِ",
    ref: "سورة الرحمن: ١٩-٢٠",
    discovery: "اكتشاف علم أوقيانوغرافيا الحاجز المائي بين البحار",
    discoveryYear: "القرن العشرين",
  },
  {
    topic: "دورة الماء في الطبيعة",
    ayah: "أَلَمْ تَرَ أَنَّ اللَّهَ يُزْجِي سَحَابًا ثُمَّ يُؤَلِّفُ بَيْنَهُ ثُمَّ يَجْعَلُهُ رُكَامًا فَتَرَى الْوَدْقَ يَخْرُجُ مِنْ خِلَالِهِ",
    ref: "سورة النور: ٤٣",
    discovery: "الفهم العلمي الكامل لدورة الماء وتكوّن السحب",
    discoveryYear: "القرن العشرين",
  },
  {
    topic: "مراحل خلق الإنسان",
    ayah: "وَلَقَدْ خَلَقْنَا الْإِنسَانَ مِن سُلَالَةٍ مِّن طِينٍ، ثُمَّ جَعَلْنَاهُ نُطْفَةً فِي قَرَارٍ مَّكِينٍ",
    ref: "سورة المؤمنون: ١٢-١٣",
    discovery: "علم الأجنة الحديث وتفاصيل مراحل تطور الجنين",
    discoveryYear: "القرن العشرين",
  },
  {
    topic: "حرارة الشمس وضوءها",
    ayah: "وَجَعَلَ الشَّمْسَ سِرَاجًا",
    ref: "سورة نوح: ١٦",
    discovery: "الفرق بين الجرم الضوئي (سراج) والجرم العاكس (نور للقمر)",
    discoveryYear: "القرن العشرين",
  },
  {
    topic: "غشاء الأصابع",
    ayah: "بَلَىٰ قَادِرِينَ عَلَىٰ أَن نُّسَوِّيَ بَنَانَهُ",
    ref: "سورة القيامة: ٤",
    discovery: "تميز بصمات الأصابع واستخدامها في التعريف البشري",
    discoveryYear: "١٨٨٠ م",
  },
  {
    topic: "الحديد من خارج الأرض",
    ayah: "وَأَنزَلْنَا الْحَدِيدَ فِيهِ بَأْسٌ شَدِيدٌ",
    ref: "سورة الحديد: ٢٥",
    discovery: "اكتشاف العلم أن الحديد نشأ في نجوم أخرى ووصل الأرض بالنيازك",
    discoveryYear: "القرن العشرون",
  },
  {
    topic: "ضغط الأعماق والظلام",
    ayah: "أَوْ كَظُلُمَاتٍ فِي بَحْرٍ لُّجِّيٍّ يَغْشَاهُ مَوْجٌ مِّن فَوْقِهِ مَوْجٌ مِّن فَوْقِهِ سَحَابٌ",
    ref: "سورة النور: ٤٠",
    discovery: "رصد طبقات الأمواج الداخلية والظلام المطبق في أعماق البحار",
    discoveryYear: "١٩٥٠ م",
  },
  {
    topic: "تكوين الكون من الدخان",
    ayah: "ثُمَّ اسْتَوَىٰ إِلَى السَّمَاءِ وَهِيَ دُخَانٌ",
    ref: "سورة فصلت: ١١",
    discovery: "نظرية الانفجار العظيم وأن الكون كان في بدايته سحابة غازية كثيفة",
    discoveryYear: "١٩٤٨ م",
  },
  {
    topic: "الحاجز البيولوجي في الرحم",
    ayah: "خَلَقَكُم مِّن نَّفْسٍ وَاحِدَةٍ ثُمَّ جَعَلَ مِنْهَا زَوْجَهَا",
    ref: "سورة الزمر: ٦",
    discovery: "المشيمة وآلية حماية الجنين، الحاجز المزدوج بين دم الأم ودم الجنين",
    discoveryYear: "القرن العشرون",
  },
  {
    topic: "الأزواج في كل شيء",
    ayah: "وَمِن كُلِّ شَيْءٍ خَلَقْنَا زَوْجَيْنِ لَعَلَّكُمْ تَذَكَّرُونَ",
    ref: "سورة الذاريات: ٤٩",
    discovery: "اكتشاف علم المادة ومضاد المادة، والأزواج في عالم الجسيمات الدون-ذرية",
    discoveryYear: "١٩٣٢ م",
  },
  {
    topic: "الكواكب تسبح في فلك",
    ayah: "كُلٌّ فِي فَلَكٍ يَسْبَحُونَ",
    ref: "سورة يس: ٤٠",
    discovery: "اكتشاف المدارات الإهليلجية للكواكب ودورانها حول الشمس بشكل متسق",
    discoveryYear: "١٦٠٩ م (كبلر)",
  },
  {
    topic: "الجبال كالأوتاد وجذور القشرة",
    ayah: "وَالْجِبَالَ أَوْتَادًا",
    ref: "سورة النبأ: ٧",
    discovery: "اكتشاف علم الجيولوجيا أن للجبال جذوراً عميقة تستقر بها القشرة الأرضية كما يُثبت الوتد الخيمة",
    discoveryYear: "القرن العشرون",
  },
  {
    topic: "الماء أصل كل حياة",
    ayah: "وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ",
    ref: "سورة الأنبياء: ٣٠",
    discovery: "إثبات علم الأحياء أن الخلية الحية تتألف أساساً من الماء وأن الحياة لا تقوم بدونه",
    discoveryYear: "القرن العشرون",
  },
  {
    topic: "الرياح الملقِّحة للنبات",
    ayah: "وَأَرْسَلْنَا الرِّيَاحَ لَوَاقِحَ",
    ref: "سورة الحجر: ٢٢",
    discovery: "إثبات علم النبات أن الرياح تنقل حبوب اللقاح وتُلقِّح أجيالاً واسعة من النباتات",
    discoveryYear: "القرن الثامن عشر",
  },
  {
    topic: "الجلد والإحساس بالألم",
    ayah: "كُلَّمَا نَضِجَتْ جُلُودُهُم بَدَّلْنَاهُمْ جُلُودًا غَيْرَهَا لِيَذُوقُوا الْعَذَابَ",
    ref: "سورة النساء: ٥٦",
    discovery: "اكتشاف علم التشريح أن مستقبلات الألم تتمركز في طبقات الجلد وليس العضلات أو العظام",
    discoveryYear: "القرن العشرون",
  },
  {
    topic: "الضوء والنور الكوني",
    ayah: "اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ",
    ref: "سورة النور: ٣٥",
    discovery: "اكتشاف الفيزياء الحديثة أن الضوء هو الأساس المادي لكل تفاعل وحياة في الكون",
    discoveryYear: "١٩٠٥ م (أينشتاين)",
  },
  {
    topic: "الجنين يسمع في الظلمات الثلاث",
    ayah: "يَخْلُقُكُمْ فِي بُطُونِ أُمَّهَاتِكُمْ خَلْقًا مِّن بَعْدِ خَلْقٍ فِي ظُلُمَاتٍ ثَلَاثٍ",
    ref: "سورة الزمر: ٦",
    discovery: "أثبت علم الأجنة وجود ثلاث طبقات تُحيط الجنين: البطن وجدار الرحم والكيس الأمنيوسي",
    discoveryYear: "القرن العشرون",
  },
  {
    topic: "الدماغ ناصية الكاذب",
    ayah: "نَاصِيَةٍ كَاذِبَةٍ خَاطِئَةٍ",
    ref: "سورة العلق: ١٦",
    discovery: "أثبت علم الأعصاب أن الفص الجبهي في أعلى مقدمة الرأس هو مركز التحكم في السلوك والصدق والكذب",
    discoveryYear: "القرن العشرون",
  },
];

function AnimatedBar({ item, delay }: { item: BarItem; delay: number }) {
  const [width, setWidth] = useState(0);
  const pct = (item.value / item.max) * 100;

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="is-bar">
      <div className="is-bar__label">{item.label}</div>
      <div className="is-bar__track">
        <div
          className="is-bar__fill"
          style={{ "--is-bar-w": `${width}%`, "--is-bar-color": item.color } as { [k: string]: string }}
        />
      </div>
      <div className="is-bar__val">{item.value}{item.unit}</div>
    </div>
  );
}

export default function IslamStatsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("global");
  const [search, setSearch] = useState("");

  const filteredTimeline = useMemo(() =>
    search.trim() ? HISTORY_TIMELINE.filter(i => arabicMatchAny([i.year, i.event, i.note ?? ""], search)) : HISTORY_TIMELINE,
  [search]);
  const filteredAchievements = useMemo(() =>
    search.trim() ? HISTORY_ACHIEVEMENTS.filter(s => arabicMatchAny([s.value, s.label, s.sub ?? ""], search)) : HISTORY_ACHIEVEMENTS,
  [search]);
  const filteredScience = useMemo(() =>
    search.trim() ? SCIENCE_CARDS.filter(c => arabicMatchAny([c.topic, c.ref, c.discovery], search)) : SCIENCE_CARDS,
  [search]);

  useEffect(() => {
    applyPageSeo({
      path: "/islam-stats",
      title: "الإسلام في أرقام | المجلس العلمي",
      description: "إحصاءات وأرقام مثيرة عن الإسلام في العالم: المسلمون، القرآن، الحضارة الإسلامية، والإعجاز العلمي.",
      keywords: ["الإسلام في أرقام", "إحصاءات المسلمين", "الإعجاز القرآني", "الحضارة الإسلامية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "إحصاءات الإسلام في العالم",
          description: "حقائق وإحصاءات موثقة عن الإسلام من انتشاره إلى إعجاز القرآن والحضارة الإسلامية",
          numberOfItems: TABS.length,
          itemListElement: TABS.map((tab, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: tab.label,
            url: `https://majlisilm.com/islam-stats#${tab.id}`,
          })),
        },
      ],
    });
  }, []);

  return (
    <div className="is-page" dir="rtl">
      {/* ══ Hero ══ */}
      <section className="is-hero">
        <div className="is-hero__inner">
          <div className="is-hero__badge">
            <Globe size={13} aria-hidden="true" />
            <span>إنفوجرافيك تفاعلي</span>
          </div>
          <h1 className="is-hero__title">الإسلام في أرقام</h1>
          <p className="is-hero__sub">
            حقائق وإحصاءات موثقة عن الإسلام، من انتشاره في العالم إلى إعجاز القرآن وإسهامات الحضارة الإسلامية
          </p>
          <div className="is-hero__kpis">
            <div className="is-kpi"><Users size={22} aria-hidden="true" /><span>١.٩ مليار مسلم</span></div>
            <div className="is-kpi"><Star size={22} aria-hidden="true" /><span>٦٢٣٦ آية قرآنية</span></div>
            <div className="is-kpi"><Heart size={22} aria-hidden="true" /><span>١٤٠٠+ سنة حضارة</span></div>
          </div>
        </div>
      </section>

      <div className="is-container">
        {/* ══ التبويبات ══ */}
        <div className="is-tabs" role="tablist" aria-label="تبويبات إحصائيات الإسلام">
          {TABS.map(t => (
            <button
              key={t.id}
              id={`is-tab-${t.id}`}
              type="button"
              role="tab"
              className={`is-tab${activeTab === t.id ? " is-tab--active" : ""}`}
              onClick={() => setActiveTab(t.id)}
              aria-selected={activeTab === t.id}
              aria-controls={`is-panel-${t.id}`}
            >
              <t.icon size={15} aria-hidden="true" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── الإسلام في العالم ── */}
        {activeTab === "global" && (
          <div className="is-section" role="tabpanel" id="is-panel-global" aria-labelledby="is-tab-global">
            <div className="is-stats-grid">
              {GLOBAL_STATS.map((s, i) => (
                <div key={i} className="is-stat-card" style={{ "--is-card-color": s.color } as { [k: string]: string }}>
                  <span className="is-stat-card__val">{s.value}</span>
                  <span className="is-stat-card__lbl">{s.label}</span>
                  {s.sub && <span className="is-stat-card__sub">{s.sub}</span>}
                </div>
              ))}
            </div>

            <div className="is-section-title">
              <Users size={16} aria-hidden="true" />
              <h2>أكبر الدول الإسلامية سكاناً (مليون نسمة)</h2>
            </div>
            <div className="is-bars">
              {POPULATION_BARS.map((item, i) => (
                <AnimatedBar key={item.label} item={item} delay={i * 80} />
              ))}
            </div>

            <div className="is-note">
              📊 المصدر: تقرير مركز بيو للأبحاث، «مستقبل الأديان العالمية ٢٠٢٣»
            </div>
          </div>
        )}

        {/* ── القرآن الكريم ── */}
        {activeTab === "quran" && (
          <div className="is-section" role="tabpanel" id="is-panel-quran" aria-labelledby="is-tab-quran">
            <div className="is-quran-highlight">
              <p className="is-quran-highlight__text">
                إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ
              </p>
              <p className="is-quran-highlight__ref">سورة الحجر: ٩</p>
            </div>
            <div className="is-stats-grid">
              {QURAN_STATS.map((s, i) => (
                <div key={i} className="is-stat-card" style={{ "--is-card-color": s.color } as { [k: string]: string }}>
                  <span className="is-stat-card__val">{s.value}</span>
                  <span className="is-stat-card__lbl">{s.label}</span>
                  {s.sub && <span className="is-stat-card__sub">{s.sub}</span>}
                </div>
              ))}
            </div>
            <div className="is-note">
              📖 الإحصاءات وفق رواية حفص عن عاصم، المعتمدة في معظم البلدان الإسلامية
            </div>
          </div>
        )}

        {/* ── الحضارة الإسلامية ── */}
        {activeTab === "history" && (
          <div className="is-section" role="tabpanel" id="is-panel-history" aria-labelledby="is-tab-history">
            <div className="is-search-wrap">
              <input
                type="search"
                className="ds-input is-search-input"
                placeholder="ابحث في الحضارة الإسلامية..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="بحث في الحضارة الإسلامية"
              />
            </div>
            <div className="is-stats-grid">
              {filteredAchievements.map((s, i) => (
                <div key={i} className="is-stat-card" style={{ "--is-card-color": s.color } as { [k: string]: string }}>
                  <span className="is-stat-card__val">{s.value}</span>
                  <span className="is-stat-card__lbl">{s.label}</span>
                  {s.sub && <span className="is-stat-card__sub">{s.sub}</span>}
                </div>
              ))}
            </div>

            <div className="is-section-title">
              <TrendingUp size={16} aria-hidden="true" />
              <h2>خط زمني للحضارة الإسلامية</h2>
            </div>
            <div className="is-timeline">
              {filteredTimeline.map((item, i) => (
                <div key={i} className="is-timeline-item">
                  <div className="is-timeline-item__year">{item.year}</div>
                  <div className="is-timeline-item__dot" aria-hidden="true" />
                  <div className="is-timeline-item__content">
                    <p className="is-timeline-item__event">{item.event}</p>
                    {item.note && <p className="is-timeline-item__note">{item.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── الإعجاز العلمي ── */}
        {activeTab === "science" && (
          <div className="is-section" role="tabpanel" id="is-panel-science" aria-labelledby="is-tab-science">
            <div className="is-science-intro">
              <BarChart3 size={20} aria-hidden="true" />
              <p>
                الإعجاز العلمي في القرآن الكريم: آيات تحمل دلالات علمية اكتشفها العلم الحديث بعد قرون من نزول القرآن.
              </p>
            </div>
            <div className="is-search-wrap">
              <input
                type="search"
                className="ds-input is-search-input"
                placeholder="ابحث في الإعجاز العلمي..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="بحث في الإعجاز العلمي"
              />
            </div>
            <div className="is-science-grid">
              {filteredScience.map((card, i) => (
                <div key={i} className="is-science-card">
                  <div className="is-science-card__topic">{card.topic}</div>
                  <p className="is-science-card__ayah" lang="ar">
                    ﴿{card.ayah}﴾
                  </p>
                  <p className="is-science-card__ref">{card.ref}</p>
                  <div className="is-science-card__discovery">
                    <span className="is-science-card__disc-label">الاكتشاف العلمي</span>
                    <span className="is-science-card__disc-text">{card.discovery}</span>
                    <span className="is-science-card__disc-year">{card.discoveryYear}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="is-note">
              ⚠️ تنبيه: الإعجاز العلمي يُقدَّم للاستدلال لا للتفسير، التفسير العلمي للقرآن يشترط شروطاً وضوابط علمية صارمة
            </div>
          </div>
        )}
      </div>

      <div className="twh-share">
        <ShareButtons title="الإسلام في أرقام — المجلس العلمي" url="https://majlisilm.com/islam-stats" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["tarikh", "aqeeda"]} title="اختبر معلوماتك في الإسلام والتاريخ" count={4} />
      </div>
    </div>
  );
}
