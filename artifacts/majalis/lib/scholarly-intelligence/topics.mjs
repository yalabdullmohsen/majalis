/**
 * Islamic scholarly topics — seed data for topic pages and auto-linking.
 */

export const ISLAMIC_TOPICS = [
  {
    slug: "tahara",
    title: "الطهارة",
    title_en: "Purification",
    keywords: ["طهارة", "وضوء", "غسل", "تيمم", "نجاسة", "طهار", "purification"],
    synonyms: ["الطهارة", "الوضوء", "الغسل"],
    category: "fiqh",
  },
  {
    slug: "salah",
    title: "الصلاة",
    title_en: "Prayer",
    keywords: ["صلاة", "صلوات", "الجماعة", "الفريضة", "ركوع", "سجود", "prayer"],
    synonyms: ["الصلاة", "فضل صلاة الجماعة", "الصلوات"],
    category: "fiqh",
  },
  {
    slug: "zakat",
    title: "الزكاة",
    title_en: "Zakat",
    keywords: ["زكاة", "زكوات", "صدقة", "نصاب", "zakat"],
    synonyms: ["الزكاة", "زكاة المال"],
    category: "fiqh",
  },
  {
    slug: "siyam",
    title: "الصيام",
    title_en: "Fasting",
    keywords: ["صيام", "صوم", "رمضان", "فطر", "fasting"],
    synonyms: ["الصيام", "صيام رمضان"],
    category: "fiqh",
  },
  {
    slug: "hajj",
    title: "الحج",
    title_en: "Hajj",
    keywords: ["حج", "عمرة", "مناسك", "مكة", "hajj", "umrah"],
    synonyms: ["الحج", "العمرة", "مناسك الحج"],
    category: "fiqh",
  },
  {
    slug: "aqeedah",
    title: "العقيدة",
    title_en: "Aqeedah",
    keywords: ["عقيدة", "عقائد", "إيمان", "aqeedah", "creed"],
    synonyms: ["العقيدة", "مسائل العقيدة"],
    category: "aqeedah",
  },
  {
    slug: "tawheed",
    title: "التوحيد",
    title_en: "Tawheed",
    keywords: ["توحيد", "الإلهية", "الربوبية", "الأسماء", "tawheed"],
    synonyms: ["التوحيد", "أقسام التوحيد"],
    category: "aqeedah",
  },
  {
    slug: "bay",
    title: "البيع",
    title_en: "Trade",
    keywords: ["بيع", "تجارة", "معاملات", "عقد", "trade", "commerce"],
    synonyms: ["البيع", "أحكام البيع"],
    category: "fiqh",
  },
  {
    slug: "riba",
    title: "الربا",
    title_en: "Riba",
    keywords: ["ربا", "فائدة", "usury", "riba"],
    synonyms: ["الربا", "أحكام الربا"],
    category: "fiqh",
  },
  {
    slug: "nikah",
    title: "النكاح",
    title_en: "Marriage",
    keywords: ["نكاح", "زواج", "طلاق", "مهر", "marriage"],
    synonyms: ["النكاح", "أحكام الزواج"],
    category: "fiqh",
  },
  {
    slug: "birr-walidayn",
    title: "بر الوالدين",
    title_en: "Kindness to Parents",
    keywords: ["بر", "والدين", "أب", "أم", "parents"],
    synonyms: ["بر الوالدين", "حق الوالدين"],
    category: "akhlaq",
  },
  {
    slug: "akhlaq",
    title: "الأخلاق",
    title_en: "Ethics",
    keywords: ["أخلاق", "آداب", "خلق", "ethics", "manners"],
    synonyms: ["الأخلاق", "حسن الخلق"],
    category: "akhlaq",
  },
  {
    slug: "quran",
    title: "القرآن",
    title_en: "Quran",
    keywords: ["قرآن", "آيات", "سور", "تفسير", "quran"],
    synonyms: ["القرآن", "كتاب الله"],
    category: "quran",
  },
  {
    slug: "hadith",
    title: "الحديث",
    title_en: "Hadith",
    keywords: ["حديث", "سنة", "أحاديث", "hadith", "sunna"],
    synonyms: ["الحديث", "السنة النبوية"],
    category: "hadith",
  },
  {
    slug: "fatwa",
    title: "الفتاوى",
    title_en: "Fatwas",
    keywords: ["فتوى", "فتاوى", "استفتاء", "fatwa"],
    synonyms: ["الفتاوى", "الاستفتاء"],
    category: "fiqh",
  },
];

export function getTopicBySlug(slug) {
  return ISLAMIC_TOPICS.find((t) => t.slug === slug) || null;
}

export function getAllTopics() {
  return ISLAMIC_TOPICS;
}

export function matchTopicsToQuery(query) {
  const q = String(query || "").toLowerCase();
  return ISLAMIC_TOPICS.filter((topic) => {
    const terms = [...topic.keywords, ...topic.synonyms, topic.title];
    return terms.some((term) => q.includes(term.toLowerCase()) || term.toLowerCase().includes(q));
  });
}

export function matchTopicsToContent(text, keywords = []) {
  const hay = [text, ...keywords].join(" ").toLowerCase();
  const matches = [];

  for (const topic of ISLAMIC_TOPICS) {
    let score = 0;
    for (const kw of [...topic.keywords, ...topic.synonyms]) {
      if (hay.includes(kw.toLowerCase())) score += 10;
    }
    if (score > 0) matches.push({ topic, score });
  }

  return matches.sort((a, b) => b.score - a.score);
}
