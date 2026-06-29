/** 17 main categories — Global Quality Edition taxonomy */

export type MainCategory = {
  slug: string;
  name_ar: string;
  icon: string;
  subcategories: { slug: string; name_ar: string }[];
};

export const MAIN_CATEGORIES: MainCategory[] = [
  {
    slug: "aqeeda",
    name_ar: "العقيدة",
    icon: "☪️",
    subcategories: [
      { slug: "tawheed", name_ar: "التوحيد" },
      { slug: "names-attributes", name_ar: "الأسماء والصفات" },
      { slug: "iman", name_ar: "الإيمان" },
    ],
  },
  {
    slug: "tawheed",
    name_ar: "التوحيد",
    icon: "1️⃣",
    subcategories: [{ slug: "rububiyya", name_ar: "ربوبية" }, { slug: "uluhiyya", name_ar: "ألوهية" }],
  },
  {
    slug: "quran",
    name_ar: "القرآن الكريم",
    icon: "📖",
    subcategories: [
      { slug: "quran-sciences", name_ar: "علوم القرآن" },
      { slug: "gharib", name_ar: "غريب القرآن" },
    ],
  },
  {
    slug: "tafsir",
    name_ar: "التفسير",
    icon: "📜",
    subcategories: [{ slug: "asbab-nuzul", name_ar: "أسباب النزول" }],
  },
  {
    slug: "hadith",
    name_ar: "الحديث",
    icon: "📿",
    subcategories: [
      { slug: "nawawi-40", name_ar: "الأربعون النووية" },
      { slug: "bukhari", name_ar: "صحيح البخاري" },
      { slug: "muslim", name_ar: "صحيح مسلم" },
    ],
  },
  {
    slug: "hadith-sciences",
    name_ar: "مصطلح الحديث",
    icon: "🔍",
    subcategories: [{ slug: "mustalah", name_ar: "المصطلح" }],
  },
  {
    slug: "fiqh",
    name_ar: "الفقه",
    icon: "⚖️",
    subcategories: [
      { slug: "tahara", name_ar: "الطهارة" },
      { slug: "salah", name_ar: "الصلاة" },
      { slug: "zakat", name_ar: "الزكاة" },
      { slug: "siyam", name_ar: "الصيام" },
      { slug: "hajj", name_ar: "الحج" },
    ],
  },
  {
    slug: "usool-fiqh",
    name_ar: "أصول الفقه",
    icon: "📐",
    subcategories: [{ slug: "qawaaid", name_ar: "القواعد" }],
  },
  {
    slug: "seera",
    name_ar: "السيرة",
    icon: "🕌",
    subcategories: [{ slug: "ghazwat", name_ar: "الغزوات" }, { slug: "hijra", name_ar: "الهجرة" }],
  },
  {
    slug: "adab",
    name_ar: "الآداب",
    icon: "🤝",
    subcategories: [],
  },
  {
    slug: "akhlaq",
    name_ar: "الأخلاق",
    icon: "💎",
    subcategories: [],
  },
  {
    slug: "adhkar",
    name_ar: "الأذكار",
    icon: "📿",
    subcategories: [{ slug: "morning-adhkar", name_ar: "أذكار الصباح" }],
  },
  {
    slug: "dawah",
    name_ar: "الدعوة",
    icon: "📢",
    subcategories: [],
  },
  {
    slug: "islamic-history",
    name_ar: "التاريخ الإسلامي",
    icon: "🏛️",
    subcategories: [{ slug: "rashidun-state", name_ar: "الدولة الراشدة" }],
  },
  {
    slug: "scholars",
    name_ar: "العلماء",
    icon: "🎓",
    subcategories: [],
  },
  {
    slug: "mutoon",
    name_ar: "المتون العلمية",
    icon: "📚",
    subcategories: [],
  },
  {
    slug: "arabic",
    name_ar: "اللغة العربية",
    icon: "✍️",
    subcategories: [{ slug: "nahw", name_ar: "النحو" }, { slug: "balagha", name_ar: "البلاغة" }],
  },
];

const SLUG_TO_MAIN: Record<string, string> = {};
for (const cat of MAIN_CATEGORIES) {
  SLUG_TO_MAIN[cat.slug] = cat.slug;
  for (const sub of cat.subcategories) {
    SLUG_TO_MAIN[sub.slug] = cat.slug;
  }
}

/** Map legacy sin-jeem slugs → main category */
const LEGACY_MAP: Record<string, string> = {
  "quran-sciences": "quran",
  gharib: "quran",
  "asbab-nuzul": "tafsir",
  "maki-madani": "quran",
  "nasikh-mansukh": "quran",
  "waqf-ibtida": "quran",
  tajweed: "quran",
  "tajweed-ahkam": "quran",
  makhraj: "quran",
  sifat: "quran",
  mudud: "quran",
  qalqala: "quran",
  "riyadh-salihin": "hadith",
  "hadith-sciences": "hadith-sciences",
  prophets: "seera",
  adam: "seera",
  nuh: "seera",
  ibrahim: "seera",
  musa: "seera",
  isa: "seera",
  muhammad: "seera",
  sahaba: "scholars",
  "sahaba-seera": "seera",
  "um-muminin": "scholars",
  tabiin: "scholars",
  "fiqh-rules": "fiqh",
  faraid: "fiqh",
  "khulafa-rashidun": "islamic-history",
  "ashara-mubashshara": "scholars",
  dua: "adhkar",
  "morning-adhkar": "adhkar",
  "kuwait-islamic": "islamic-history",
  mosques: "islamic-history",
  battles: "seera",
  mutoon: "mutoon",
  shirk: "aqeeda",
  bida: "aqeeda",
  nahw: "arabic",
  balagha: "arabic",
};

export function resolveMainCategory(slug?: string): string {
  if (!slug) return "quran";
  if (SLUG_TO_MAIN[slug]) return SLUG_TO_MAIN[slug];
  if (LEGACY_MAP[slug]) return LEGACY_MAP[slug];
  if (MAIN_CATEGORIES.some((c) => c.slug === slug)) return slug;
  return "quran";
}

export function getMainCategory(slug: string): MainCategory | undefined {
  return MAIN_CATEGORIES.find((c) => c.slug === slug);
}
