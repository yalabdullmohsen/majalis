export type MasarStep = {
  id: string;
  title: string;
  href?: string;
  description?: string;
};

export type Masar = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  level: string;
  duration: string;
  steps: MasarStep[];
};

export const MASARAT: Masar[] = [
  {
    id: "tassis",
    title: "مسار التأسيس",
    subtitle: "للمسلم الذي يريد بناء أساس متين في دينه",
    icon: "🏗️",
    color: "#047857",
    level: "مبتدئ",
    duration: "3 أشهر",
    steps: [
      { id: "t1", title: "تصحيح العقيدة وأركان الإيمان", href: "/iman-topics" },
      { id: "t2", title: "أركان الإسلام وفقه العبادات الأساسية", href: "/rulings" },
      { id: "t3", title: "أذكار الصباح والمساء", href: "/adhkar?cat=morning" },
      { id: "t4", title: "الأربعون النووية", href: "/arbaeen-nawawi" },
      { id: "t5", title: "السنن اليومية وإحيائها", href: "/sunnah-studies" },
      { id: "t6", title: "تدبر سور قصيرة مختارة", href: "/quran-studies" },
      { id: "t7", title: "تصحيح المفاهيم الشائعة", href: "/tazkiya-topics" },
      { id: "t8", title: "بناء عادة قراءة القرآن يوميًا", href: "/daily-wird" },
    ],
  },
  {
    id: "islah-qalb",
    title: "مسار إصلاح القلب",
    subtitle: "رحلة علمية وعملية لتزكية النفس",
    icon: "💚",
    color: "#7c3aed",
    level: "متوسط",
    duration: "6 أشهر",
    steps: [
      { id: "q1", title: "أمراض القلوب وعلاجها", href: "/amrad-qalbiyya" },
      { id: "q2", title: "الدروس الإيمانية والتربوية", href: "/durus-imaniyya" },
      { id: "q3", title: "تزكية النفس: الأخلاق الخفية", href: "/tazkiya-topics" },
      { id: "q4", title: "أمراض اللسان وعلاجها", href: "/tazkiya-topics" },
      { id: "q5", title: "الورد اليومي وصلة القلب بالله", href: "/daily-wird" },
      { id: "q6", title: "التدبر في أسماء الله الحسنى", href: "/quran-studies" },
      { id: "q7", title: "دروس متنوعة: أسئلة للتفكر", href: "/durus-mutanawwia" },
      { id: "q8", title: "الخواطر الروحية", href: "/durus-mutanawwia" },
    ],
  },
  {
    id: "talib-ilm",
    title: "مسار طالب العلم",
    subtitle: "منهج منظم للارتقاء في العلم الشرعي",
    icon: "📚",
    color: "#1d4ed8",
    level: "متقدم",
    duration: "سنة فأكثر",
    steps: [
      { id: "e1", title: "مقدمات العلوم الشرعية", href: "/lessons" },
      { id: "e2", title: "أصول العقيدة وعلم الكلام", href: "/iman-topics" },
      { id: "e3", title: "علوم القرآن والتفسير", href: "/quran-studies" },
      { id: "e4", title: "علوم الحديث والسنة", href: "/sunnah-studies" },
      { id: "e5", title: "الفقه الإسلامي والأحكام", href: "/fiqh" },
      { id: "e6", title: "الأربعون النووية بالشرح", href: "/arbaeen-nawawi" },
      { id: "e7", title: "المجمع الفقهي والفتاوى", href: "/fiqh-council" },
      { id: "e8", title: "الباحث الشرعي المتقدم", href: "/scholarly-research" },
      { id: "e9", title: "خريطة المعرفة الإسلامية", href: "/knowledge-graph" },
    ],
  },
  {
    id: "usra",
    title: "مسار الأسرة",
    subtitle: "للمقبلين على الزواج وبناء الأسرة المسلمة",
    icon: "🏠",
    color: "#b45309",
    level: "عملي",
    duration: "شهران",
    steps: [
      { id: "f1", title: "معايير اختيار الشريك", href: "/usra-mujtama" },
      { id: "f2", title: "بناء الأسرة: من الخطوبة للزواج", href: "/usra-mujtama" },
      { id: "f3", title: "الحقوق والواجبات الزوجية", href: "/rulings" },
      { id: "f4", title: "تربية الأطفال على الإسلام", href: "/usra-mujtama" },
      { id: "f5", title: "العلاقات الإنسانية وأخلاقها", href: "/usra-mujtama" },
      { id: "f6", title: "البيت المسلم: دروس متنوعة", href: "/durus-mutanawwia" },
      { id: "f7", title: "المواطنة والمسؤولية الاجتماعية", href: "/usra-mujtama" },
    ],
  },
  {
    id: "shabab",
    title: "مسار الشاب المسلم",
    subtitle: "أدوات عملية للشاب في مواجهة تحديات العصر",
    icon: "⚡",
    color: "#0369a1",
    level: "عملي",
    duration: "3 أشهر",
    steps: [
      { id: "s1", title: "الهوية والانتماء الإسلامي", href: "/fikr-waqia" },
      { id: "s2", title: "الشباب والواقع: التحديات المعاصرة", href: "/fikr-waqia" },
      { id: "s3", title: "التفكير النقدي والإعلام", href: "/fikr-waqia" },
      { id: "s4", title: "الذكاء الاصطناعي والأخلاق", href: "/fikr-waqia" },
      { id: "s5", title: "العمل والمهنة بمنظور إسلامي", href: "/fikr-waqia" },
      { id: "s6", title: "صناعة الهدف وخطة التعلم", href: "/learning-plan" },
      { id: "s7", title: "النجاح والفشل: رؤية إيمانية", href: "/fikr-waqia" },
      { id: "s8", title: "قرارات مصيرية وكيف تتخذها", href: "/fikr-waqia" },
    ],
  },
  {
    id: "muslim-jadid",
    title: "مسار المسلم الجديد",
    subtitle: "خطوات مرحبة لمن أسلم حديثًا",
    icon: "🌅",
    color: "#c2410c",
    level: "مبتدئ",
    duration: "3 أشهر",
    steps: [
      { id: "n1", title: "كلمة الشهادة وما تعنيه", href: "/iman-topics" },
      { id: "n2", title: "أركان الإسلام الخمسة", href: "/rulings" },
      { id: "n3", title: "تعلم الصلاة خطوة بخطوة", href: "/sujood-sahw" },
      { id: "n4", title: "أذكار يومية أساسية", href: "/adhkar?cat=morning" },
      { id: "n5", title: "تعرف على النبي ﷺ وسيرته", href: "/seerah" },
      { id: "n6", title: "مدخل إلى القرآن الكريم", href: "/quran-studies" },
      { id: "n7", title: "تصحيح مفاهيم شائعة عن الإسلام", href: "/tazkiya-topics" },
      { id: "n8", title: "بناء مجتمعك المسلم", href: "/usra-mujtama" },
    ],
  },
];
