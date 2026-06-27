/** موسوعة الأحكام — التصنيف الهرمي الشامل */

export type RulingCategoryNode = {
  slug: string;
  name: string;
  icon?: string;
  children?: RulingCategoryNode[];
};

export const RULINGS_CATEGORY_TREE: RulingCategoryNode[] = [
  {
    slug: "aqeedah",
    name: "العقيدة",
    icon: "🕌",
    children: [
      { slug: "tawhid", name: "التوحيد" },
      { slug: "names", name: "أسماء الله وصفاته" },
      { slug: "iman", name: "الإيمان" },
      { slug: "shirk", name: "الشرك وأنواعه" },
      { slug: "bidah", name: "البدع" },
    ],
  },
  {
    slug: "tahara",
    name: "الطهارة",
    icon: "💧",
    children: [
      { slug: "wudu", name: "الوضوء" },
      { slug: "ghusl", name: "الغسل" },
      { slug: "tayammum", name: "التيمم" },
      { slug: "najasat", name: "النجاسات" },
      { slug: "hukm-tahara", name: "أحكام الطهارة" },
    ],
  },
  {
    slug: "salah",
    name: "الصلاة",
    icon: "🕋",
    children: [
      { slug: "salah-ahkam", name: "أحكام الصلاة" },
      { slug: "salah-arkan", name: "أركان الصلاة" },
      { slug: "salah-sunan", name: "السنن الرواتب" },
      { slug: "jumuah", name: "الجمعة" },
      { slug: "eid", name: "العيد" },
      { slug: "janazah", name: "صلاة الجنازة" },
      { slug: "qada", name: "قضاء الصلاة" },
    ],
  },
  {
    slug: "zakat",
    name: "الزكاة",
    icon: "🪙",
    children: [
      { slug: "zakat-mal", name: "زكاة المال" },
      { slug: "zakat-fitr", name: "زكاة الفطر" },
      { slug: "zakat-conditions", name: "شروط الزكاة" },
      { slug: "zakat-recipients", name: "مصارف الزكاة" },
    ],
  },
  {
    slug: "sawm",
    name: "الصيام",
    icon: "🌙",
    children: [
      { slug: "ramadan", name: "صيام رمضان" },
      { slug: "qiyam", name: "قيام الليل" },
      { slug: "itikaf", name: "الاعتكاف" },
      { slug: "sawm-nullifiers", name: "مفطرات الصيام" },
    ],
  },
  {
    slug: "hajj",
    name: "الحج والعمرة",
    icon: "🕋",
    children: [
      { slug: "hajj-ahkam", name: "أحكام الحج" },
      { slug: "umrah", name: "العمرة" },
      { slug: "udhiyah", name: "الأضحية" },
      { slug: "hady", name: "الهدي والفدية" },
    ],
  },
  {
    slug: "transactions",
    name: "المعاملات",
    icon: "🤝",
    children: [
      { slug: "bay", name: "البيع" },
      { slug: "shira", name: "الشراء" },
      { slug: "riba", name: "الربا" },
      { slug: "ijara", name: "الإجارة" },
      { slug: "sharikat", name: "الشركات" },
      { slug: "qard", name: "القرض" },
      { slug: "wakalah", name: "الوكالة" },
    ],
  },
  {
    slug: "food-drink",
    name: "الأطعمة والأشربة",
    icon: "🍽️",
    children: [
      { slug: "halal", name: "الحلال" },
      { slug: "haram", name: "الحرام" },
      { slug: "slaughter", name: "الذبح" },
      { slug: "drinks", name: "الأشربة" },
    ],
  },
  {
    slug: "clothing",
    name: "اللباس والزينة",
    icon: "👔",
    children: [
      { slug: "hijab", name: "الحجاب" },
      { slug: "sitr", name: "الستر" },
      { slug: "gold-silver", name: "الذهب والفضة" },
      { slug: "images", name: "التصاوير" },
    ],
  },
  {
    slug: "family",
    name: "الأسرة",
    icon: "👨‍👩‍👧",
    children: [
      { slug: "nikah", name: "النكاح" },
      { slug: "talaq", name: "الطلاق" },
      { slug: "rida", name: "الرضاع" },
      { slug: "iddah", name: "العدة" },
      { slug: "children", name: "الأطفال" },
      { slug: "women", name: "المرأة" },
    ],
  },
  {
    slug: "inheritance",
    name: "المواريث والوصايا",
    icon: "📜",
    children: [
      { slug: "mirath", name: "الميراث" },
      { slug: "wasaya", name: "الوصايا" },
      { slug: "heirs", name: "الورثة" },
    ],
  },
  {
    slug: "judiciary",
    name: "القضاء والحدود",
    icon: "⚖️",
    children: [
      { slug: "qada-judiciary", name: "القضاء" },
      { slug: "hudud", name: "الحدود" },
      { slug: "diyat", name: "الديات" },
      { slug: "shahada", name: "الشهادة" },
    ],
  },
  {
    slug: "oaths",
    name: "الأيمان والنذور",
    icon: "✋",
    children: [
      { slug: "ayman", name: "الأيمان" },
      { slug: "nudhur", name: "النذور" },
      { slug: "kaffarat", name: "الكفارات" },
    ],
  },
  {
    slug: "jihad",
    name: "الجهاد والسياسة الشرعية",
    icon: "🛡️",
    children: [
      { slug: "jihad-rules", name: "أحكام الجهاد" },
      { slug: "siyasa", name: "السياسة الشرعية" },
      { slug: "dhimmah", name: "أهل الذمة" },
    ],
  },
  {
    slug: "ethics",
    name: "الأخلاق والآداب",
    icon: "💚",
    children: [
      { slug: "akhlaq", name: "الأخلاق" },
      { slug: "adab", name: "الآداب" },
      { slug: "rights", name: "حقوق الآدمي" },
      { slug: "neighbors", name: "حق الجار" },
    ],
  },
  {
    slug: "dhikr",
    name: "الأذكار والدعاء",
    icon: "📿",
    children: [
      { slug: "adhkar", name: "الأذكار" },
      { slug: "dua", name: "الدعاء" },
      { slug: "ruqyah", name: "الرقية" },
    ],
  },
  {
    slug: "quran-hadith",
    name: "القرآن والحديث",
    icon: "📖",
    children: [
      { slug: "quran-ahkam", name: "أحكام القرآن" },
      { slug: "hadith-ahkam", name: "أحكام الحديث" },
      { slug: "mustalah", name: "مصطلح الحديث" },
    ],
  },
  {
    slug: "knowledge",
    name: "طلب العلم والدعوة",
    icon: "🎓",
    children: [
      { slug: "talab-ilm", name: "طلب العلم" },
      { slug: "dawah", name: "الدعوة" },
      { slug: "fatwa-etiquette", name: "آداب الفتوى" },
    ],
  },
  {
    slug: "nawazil",
    name: "النوازل المعاصرة",
    icon: "🔬",
    children: [
      { slug: "medicine", name: "الطب" },
      { slug: "economy", name: "الاقتصاد" },
      { slug: "tech", name: "التقنية" },
      { slug: "ai", name: "الذكاء الاصطناعي" },
      { slug: "media", name: "الإعلام" },
    ],
  },
  {
    slug: "funerals",
    name: "الجنائز",
    icon: "🕯️",
    children: [
      { slug: "taharah-mayyit", name: "تغسيل الميت" },
      { slug: "burial", name: "الدفن" },
      { slug: "condolence", name: "التعزية" },
    ],
  },
];

/** تصنيفات مسطّحة للتوافق مع المخطط القديم */
export const LEGACY_RULING_CATEGORIES = [
  "العبادات",
  "الطهارة",
  "الصلاة",
  "الزكاة",
  "الصيام",
  "الحج",
  "الأسرة",
  "البيوت",
  "المعاملات",
  "القضاء",
  "المواريث",
  "النوازل",
  "السياسة الشرعية",
] as const;

export type LegacyRulingCategory = (typeof LEGACY_RULING_CATEGORIES)[number];

/** ربط التصنيف الجديد بالتصنيف القديم في قاعدة البيانات */
export const CATEGORY_TO_LEGACY: Record<string, LegacyRulingCategory> = {
  العقيدة: "العبادات",
  الطهارة: "الطهارة",
  الصلاة: "الصلاة",
  الزكاة: "الزكاة",
  الصيام: "الصيام",
  "الحج والعمرة": "الحج",
  المعاملات: "المعاملات",
  "الأطعمة والأشربة": "المعاملات",
  "اللباس والزينة": "البيوت",
  الأسرة: "الأسرة",
  "المواريث والوصايا": "المواريث",
  "القضاء والحدود": "القضاء",
  "الأيمان والنذور": "العبادات",
  "الجهاد والسياسة الشرعية": "السياسة الشرعية",
  "الأخلاق والآداب": "البيوت",
  "الأذكار والدعاء": "العبادات",
  "القرآن والحديث": "العبادات",
  "طلب العلم والدعوة": "العبادات",
  "النوازل المعاصرة": "النوازل",
  الجنائز: "العبادات",
};

export function getMainCategories(): RulingCategoryNode[] {
  return RULINGS_CATEGORY_TREE;
}

export function getSubcategories(mainName: string): RulingCategoryNode[] {
  return RULINGS_CATEGORY_TREE.find((c) => c.name === mainName)?.children ?? [];
}

export function flattenCategories(): { main: string; sub: string; slug: string; icon?: string }[] {
  const out: { main: string; sub: string; slug: string; icon?: string }[] = [];
  for (const main of RULINGS_CATEGORY_TREE) {
    for (const sub of main.children ?? []) {
      out.push({ main: main.name, sub: sub.name, slug: sub.slug, icon: main.icon });
    }
  }
  return out;
}

export function toLegacyCategory(category: string): LegacyRulingCategory {
  return CATEGORY_TO_LEGACY[category] ?? "العبادات";
}

export function mapQaSlugToCategory(slug: string): { category: string; subcategory?: string } {
  const map: Record<string, { category: string; subcategory: string }> = {
    tahara: { category: "الطهارة", subcategory: "أحكام الطهارة" },
    salah: { category: "الصلاة", subcategory: "أحكام الصلاة" },
    zakat: { category: "الزكاة", subcategory: "زكاة المال" },
    sawm: { category: "الصيام", subcategory: "صيام رمضان" },
    hajj: { category: "الحج والعمرة", subcategory: "أحكام الحج" },
    aqeedah: { category: "العقيدة", subcategory: "الإيمان" },
    quran: { category: "القرآن والحديث", subcategory: "أحكام القرآن" },
    hadith: { category: "القرآن والحديث", subcategory: "أحكام الحديث" },
    adhkar: { category: "الأذكار والدعاء", subcategory: "الأذكار" },
    adab: { category: "الأخلاق والآداب", subcategory: "الآداب" },
  };
  return map[slug] ?? { category: "طلب العلم والدعوة", subcategory: "طلب العلم" };
}
