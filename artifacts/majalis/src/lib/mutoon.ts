/** المتون العلمية — types, seed, filter/search */

export const MUTOON_CATEGORIES = [
  "العقيدة",
  "الفقه",
  "الحديث",
  "المصطلح",
  "النحو",
  "الأصول",
  "القواعد الفقهية",
  "التجويد",
  "السلوك",
  "اللغة",
] as const;

export type MutoonCategory = (typeof MUTOON_CATEGORIES)[number];

export type MutoonLevel = "مبتدئ" | "متوسط" | "متقدم" | "تخصص";

export type MutoonText = {
  id: string;
  external_key?: string;
  name: string;
  author: string;
  category: MutoonCategory;
  level: MutoonLevel;
  summary: string;
  text_excerpt: string;
  audio_url?: string;
  video_url?: string;
  pdf_url?: string;
  has_quiz: boolean;
  verses_count?: number;
};

export const MUTOON_SEED: MutoonText[] = [
  {
    id: "mutoon-aqeedah-zubad",
    external_key: "mutoon-aqeedah-zubad",
    name: "متن الزبدة في العقيدة",
    author: "ابن أبي زيد القيرواني",
    category: "العقيدة",
    level: "مبتدئ",
    summary: "من أشهر متون العقيدة على مذهب الإمام مالك، يجمع أصول الإيمان والتوحيد.",
    text_excerpt: "قال رحمه الله: علمنا أن كلمة الشهادة لا بد منها، وهي لا تُقبل إلا بما يقابلها من العمل...",
    has_quiz: true,
    verses_count: 45,
  },
  {
    id: "mutoon-nahw-ajrumiyyah",
    external_key: "mutoon-nahw-ajrumiyyah",
    name: "الآجرومية في النحو",
    author: "محمد بن محمد الصنهاجي",
    category: "النحو",
    level: "مبتدئ",
    summary: "أشهر متن في النحو العربي للمبتدئين، يُدرَّس في حلقات العلم الشرعي.",
    text_excerpt: "الكلام هو اللفظ المركب المفيد بالوضع...",
    has_quiz: true,
    verses_count: 130,
  },
  {
    id: "mutoon-nahw-alfiyyah",
    external_key: "mutoon-nahw-alfiyyah",
    name: "ألفية ابن مالك",
    author: "جمال الدين ابن مالك",
    category: "النحو",
    level: "متقدم",
    summary: "من أجلّ متون النحو، ألفها ابن مالك في ألف بيت نظم.",
    text_excerpt: "ذكر باب النحو وافتتحه باسم الله...",
    has_quiz: true,
    verses_count: 1000,
  },
  {
    id: "mutoon-hadith-nukhbah",
    external_key: "mutoon-hadith-nukhbah",
    name: "نخبة الفكر في مصطلحات أهل الأثر",
    author: "ابن حجر العسقلاني",
    category: "المصطلح",
    level: "متوسط",
    summary: "متن مختصر في مصطلح الحديث، يُعد مدخلاً لعلم الجرح والتعديل.",
    text_excerpt: "الحديث عند أهل المصطلح: ما أُضيف إلى النبي ﷺ من قول أو فعل...",
    has_quiz: true,
    verses_count: 60,
  },
  {
    id: "mutoon-fiqh-abu-shuja",
    external_key: "mutoon-fiqh-abu-shuja",
    name: "متن أبي شجاع",
    author: "أبو شجاع الأصفهاني",
    category: "الفقه",
    level: "مبتدئ",
    summary: "متن فقهي على مذهب الشافعي، يُدرَّس للمبتدئين في الفقه.",
    text_excerpt: "تعليق: الحمد لله رب العالمين...",
    has_quiz: true,
    verses_count: 80,
  },
  {
    id: "mutoon-usul-thalathah",
    external_key: "mutoon-usul-thalathah",
    name: "الثلاثة الأصول",
    author: "محمد بن عبد الوهاب",
    category: "العقيدة",
    level: "مبتدئ",
    summary: "رسالة مختصرة في التوحيد وأصول الإسلام الثلاثة.",
    text_excerpt: "اعلم رحمك الله أنه يجب علينا تعلم أربع مسائل...",
    has_quiz: true,
    verses_count: 30,
  },
  {
    id: "mutoon-qawaid-arba",
    external_key: "mutoon-qawaid-arba",
    name: "القواعد الأربع",
    author: "محمد بن عبد الوهاب",
    category: "العقيدة",
    level: "مبتدئ",
    summary: "بيان أصول التوحيد الأربعة: العلم، والعمل، والدعوة، والصبر.",
    text_excerpt: "القاعدة الأولى: العلم...",
    has_quiz: true,
    verses_count: 20,
  },
  {
    id: "mutoon-tajweed-jazariyyah",
    external_key: "mutoon-tajweed-jazariyyah",
    name: "الجزرية في التجويد",
    author: "ابن الجزري",
    category: "التجويد",
    level: "متوسط",
    summary: "من أشهر متون التجويد، يُعتمد في ضبط أحكام التلاوة.",
    text_excerpt: "بسم الله الرحمن الرحيم...",
    has_quiz: true,
    verses_count: 110,
  },
  {
    id: "mutoon-adab-arbaeen",
    external_key: "mutoon-adab-arbaeen",
    name: "الأربعون النووية",
    author: "الإمام النووي",
    category: "الحديث",
    level: "مبتدئ",
    summary: "أربعون حديثاً جامعة لأصول الدين، من أهم متون الحديث للعامة.",
    text_excerpt: "إنما الأعمال بالنيات...",
    has_quiz: true,
    verses_count: 42,
  },
  {
    id: "mutoon-usul-waraqat",
    external_key: "mutoon-usul-waraqat",
    name: "الورقات في أصول الفقه",
    author: "الإمام الجويني",
    category: "الأصول",
    level: "متوسط",
    summary: "مدخل مختصر في أصول الفقه على المذهب الشافعي.",
    text_excerpt: "الحمد لله رب العالمين...",
    has_quiz: true,
    verses_count: 50,
  },
];

export type MutoonFilters = {
  search: string;
  category: string;
  level: string;
};

export const DEFAULT_MUTOON_FILTERS: MutoonFilters = {
  search: "",
  category: "",
  level: "",
};

export function filterMutoon(texts: MutoonText[], filters: MutoonFilters): MutoonText[] {
  const q = filters.search.trim().toLowerCase();
  return texts.filter((m) => {
    if (filters.category && m.category !== filters.category) return false;
    if (filters.level && m.level !== filters.level) return false;
    if (!q) return true;
    const hay = [m.name, m.author, m.category, m.summary, m.text_excerpt].join(" ").toLowerCase();
    return hay.includes(q);
  });
}

export function getAllMutoon(): MutoonText[] {
  if (typeof window === "undefined") return MUTOON_SEED;
  try {
    const stored = JSON.parse(localStorage.getItem("majlis_admin_mutoon") || "[]");
    if (Array.isArray(stored) && stored.length > 0) return stored as MutoonText[];
  } catch {
    /* ignore */
  }
  return MUTOON_SEED;
}

export function getMutoonById(id: string): MutoonText | undefined {
  return getAllMutoon().find((m) => m.id === id);
}
