import type { SinJeemCategory } from "./types";

/** All game categories — mirrors admin + DB seed */
export const SIN_JEEM_CATEGORIES: SinJeemCategory[] = [
  // القرآن
  { id: "cat-quran", slug: "quran", name_ar: "القرآن", icon: "📖", sort_order: 1 },
  { id: "cat-quran-sciences", slug: "quran-sciences", name_ar: "علوم القرآن", icon: "🔬", parent_slug: "quran", sort_order: 2 },
  { id: "cat-tafsir", slug: "tafsir", name_ar: "التفسير", icon: "📜", parent_slug: "quran", sort_order: 3 },
  { id: "cat-gharib", slug: "gharib", name_ar: "غريب القرآن", icon: "❓", parent_slug: "quran", sort_order: 4 },
  { id: "cat-asbab", slug: "asbab-nuzul", name_ar: "أسباب النزول", icon: "📌", parent_slug: "quran", sort_order: 5 },
  { id: "cat-maki-madani", slug: "maki-madani", name_ar: "المكي والمدني", icon: "🕋", parent_slug: "quran", sort_order: 6 },
  { id: "cat-nasikh", slug: "nasikh-mansukh", name_ar: "الناسخ والمنسوخ", icon: "🔄", parent_slug: "quran", sort_order: 7 },
  { id: "cat-waqf", slug: "waqf-ibtida", name_ar: "الوقف والابتداء", icon: "⏸", parent_slug: "quran", sort_order: 8 },
  // التجويد
  { id: "cat-tajweed", slug: "tajweed", name_ar: "التجويد", icon: "🎵", sort_order: 10 },
  { id: "cat-ahkam", slug: "tajweed-ahkam", name_ar: "الأحكام", icon: "📋", parent_slug: "tajweed", sort_order: 11 },
  { id: "cat-makhraj", slug: "makhraj", name_ar: "المخارج", icon: "👄", parent_slug: "tajweed", sort_order: 12 },
  { id: "cat-sifat", slug: "sifat", name_ar: "الصفات", icon: "✨", parent_slug: "tajweed", sort_order: 13 },
  { id: "cat-mudud", slug: "mudud", name_ar: "المدود", icon: "〰️", parent_slug: "tajweed", sort_order: 14 },
  { id: "cat-qalqala", slug: "qalqala", name_ar: "القلقلة", icon: "💫", parent_slug: "tajweed", sort_order: 15 },
  // العقيدة
  { id: "cat-aqeeda", slug: "aqeeda", name_ar: "العقيدة", icon: "☪️", sort_order: 20 },
  { id: "cat-tawheed", slug: "tawheed", name_ar: "التوحيد", icon: "1️⃣", parent_slug: "aqeeda", sort_order: 21 },
  { id: "cat-names", slug: "names-attributes", name_ar: "الأسماء والصفات", icon: "🏷️", parent_slug: "aqeeda", sort_order: 22 },
  { id: "cat-iman", slug: "iman", name_ar: "الإيمان", icon: "💚", parent_slug: "aqeeda", sort_order: 23 },
  { id: "cat-shirk", slug: "shirk", name_ar: "الشرك", icon: "⚠️", parent_slug: "aqeeda", sort_order: 24 },
  { id: "cat-bida", slug: "bida", name_ar: "البدع", icon: "🚫", parent_slug: "aqeeda", sort_order: 25 },
  // الحديث
  { id: "cat-hadith", slug: "hadith", name_ar: "الحديث", icon: "📿", sort_order: 30 },
  { id: "cat-nawawi40", slug: "nawawi-40", name_ar: "الأربعون النووية", icon: "4️⃣0️⃣", parent_slug: "hadith", sort_order: 31 },
  { id: "cat-riyadh", slug: "riyadh-salihin", name_ar: "رياض الصالحين", icon: "🌹", parent_slug: "hadith", sort_order: 32 },
  { id: "cat-bukhari", slug: "bukhari", name_ar: "صحيح البخاري", icon: "📚", parent_slug: "hadith", sort_order: 33 },
  { id: "cat-muslim", slug: "muslim", name_ar: "صحيح مسلم", icon: "📗", parent_slug: "hadith", sort_order: 34 },
  { id: "cat-hadith-sciences", slug: "hadith-sciences", name_ar: "علوم الحديث", icon: "🔍", parent_slug: "hadith", sort_order: 35 },
  // السيرة
  { id: "cat-seera", slug: "seera", name_ar: "السيرة", icon: "🕌", sort_order: 40 },
  { id: "cat-ghazwat", slug: "ghazwat", name_ar: "الغزوات", icon: "⚔️", parent_slug: "seera", sort_order: 41 },
  { id: "cat-hijra", slug: "hijra", name_ar: "الهجرة", icon: "🐪", parent_slug: "seera", sort_order: 42 },
  { id: "cat-sahaba-seera", slug: "sahaba-seera", name_ar: "الصحابة", icon: "🤝", parent_slug: "seera", sort_order: 43 },
  // قصص الأنبياء
  { id: "cat-prophets", slug: "prophets", name_ar: "قصص الأنبياء", icon: "🌟", sort_order: 50 },
  { id: "cat-adam", slug: "adam", name_ar: "آدم", icon: "🍃", parent_slug: "prophets", sort_order: 51 },
  { id: "cat-nuh", slug: "nuh", name_ar: "نوح", icon: "🚢", parent_slug: "prophets", sort_order: 52 },
  { id: "cat-ibrahim", slug: "ibrahim", name_ar: "إبراهيم", icon: "🔥", parent_slug: "prophets", sort_order: 53 },
  { id: "cat-musa", slug: "musa", name_ar: "موسى", icon: "🌊", parent_slug: "prophets", sort_order: 54 },
  { id: "cat-isa", slug: "isa", name_ar: "عيسى", icon: "✝️", parent_slug: "prophets", sort_order: 55 },
  { id: "cat-muhammad", slug: "muhammad", name_ar: "محمد ﷺ", icon: "🕋", parent_slug: "prophets", sort_order: 56 },
  // الصحابة
  { id: "cat-sahaba", slug: "sahaba", name_ar: "الصحابة", icon: "⭐", sort_order: 60 },
  { id: "cat-um-muminin", slug: "um-muminin", name_ar: "أمهات المؤمنين", icon: "👩", parent_slug: "sahaba", sort_order: 61 },
  { id: "cat-tabiin", slug: "tabiin", name_ar: "التابعون", icon: "📜", sort_order: 62 },
  { id: "cat-scholars", slug: "scholars", name_ar: "العلماء", icon: "🎓", sort_order: 63 },
  // الفقه
  { id: "cat-fiqh", slug: "fiqh", name_ar: "الفقه", icon: "⚖️", sort_order: 70 },
  { id: "cat-tahara", slug: "tahara", name_ar: "الطهارة", icon: "💧", parent_slug: "fiqh", sort_order: 71 },
  { id: "cat-salah", slug: "salah", name_ar: "الصلاة", icon: "🤲", parent_slug: "fiqh", sort_order: 72 },
  { id: "cat-zakat", slug: "zakat", name_ar: "الزكاة", icon: "💰", parent_slug: "fiqh", sort_order: 73 },
  { id: "cat-siyam", slug: "siyam", name_ar: "الصيام", icon: "🌙", parent_slug: "fiqh", sort_order: 74 },
  { id: "cat-hajj", slug: "hajj", name_ar: "الحج", icon: "🕋", parent_slug: "fiqh", sort_order: 75 },
  { id: "cat-fiqh-rules", slug: "fiqh-rules", name_ar: "القواعد الفقهية", icon: "📋", parent_slug: "fiqh", sort_order: 76 },
  { id: "cat-faraid", slug: "faraid", name_ar: "الفرائض", icon: "🧮", parent_slug: "fiqh", sort_order: 77 },
  { id: "cat-khulafa", slug: "khulafa-rashidun", name_ar: "الخلفاء الراشدون", icon: "👑", parent_slug: "sahaba", sort_order: 64 },
  { id: "cat-ashara", slug: "ashara-mubashshara", name_ar: "العشرة المبشرون", icon: "🔟", parent_slug: "sahaba", sort_order: 65 },
  // أصول الفقه
  { id: "cat-usool", slug: "usool-fiqh", name_ar: "أصول الفقه", icon: "📐", sort_order: 80 },
  // اللغة
  { id: "cat-arabic", slug: "arabic", name_ar: "اللغة العربية", icon: "✍️", sort_order: 90 },
  { id: "cat-nahw", slug: "nahw", name_ar: "النحو", icon: "📝", parent_slug: "arabic", sort_order: 91 },
  { id: "cat-balagha", slug: "balagha", name_ar: "البلاغة", icon: "🎭", parent_slug: "arabic", sort_order: 92 },
  // الأدعية
  { id: "cat-dua", slug: "dua", name_ar: "الأدعية", icon: "🤲", sort_order: 100 },
  { id: "cat-morning-adhkar", slug: "morning-adhkar", name_ar: "أذكار الصباح", icon: "🌅", parent_slug: "dua", sort_order: 101 },
  // الأخلاق
  { id: "cat-akhlaq", slug: "akhlaq", name_ar: "الأخلاق", icon: "💎", sort_order: 110 },
  // التاريخ
  { id: "cat-history", slug: "islamic-history", name_ar: "التاريخ الإسلامي", icon: "🏛️", sort_order: 120 },
  { id: "cat-rashidun-state", slug: "rashidun-state", name_ar: "الدولة الراشدة", icon: "🕌", parent_slug: "islamic-history", sort_order: 121 },
  { id: "cat-andalus", slug: "andalus", name_ar: "الأندلس", icon: "🏰", parent_slug: "islamic-history", sort_order: 122 },
  // الكويت
  { id: "cat-kuwait", slug: "kuwait-islamic", name_ar: "الكويت الإسلامية", icon: "🇰🇼", sort_order: 130 },
  { id: "cat-mosques", slug: "mosques", name_ar: "المساجد", icon: "🕌", sort_order: 131 },
  { id: "cat-mutoon", slug: "mutoon", name_ar: "المتون العلمية", icon: "📚", sort_order: 132 },
  { id: "cat-scientific", slug: "scientific-miracles", name_ar: "الإعجاز العلمي", icon: "🔬", sort_order: 133 },
  // الألغاز
  { id: "cat-puzzles", slug: "islamic-puzzles", name_ar: "الألغاز الإسلامية", icon: "🧩", sort_order: 140 },
  { id: "cat-fiqh-puzzle", slug: "fiqh-puzzles", name_ar: "ألغاز فقهية", icon: "⚖️", parent_slug: "islamic-puzzles", sort_order: 141 },
  { id: "cat-quran-puzzle", slug: "quran-puzzles", name_ar: "ألغاز قرآنية", icon: "📖", parent_slug: "islamic-puzzles", sort_order: 142 },
];

export function getTopLevelCategories(): SinJeemCategory[] {
  return SIN_JEEM_CATEGORIES.filter((c) => !c.parent_slug).sort((a, b) => a.sort_order - b.sort_order);
}

export function getSubcategories(parentSlug: string): SinJeemCategory[] {
  return SIN_JEEM_CATEGORIES.filter((c) => c.parent_slug === parentSlug).sort((a, b) => a.sort_order - b.sort_order);
}

export function getCategoryBySlug(slug: string): SinJeemCategory | undefined {
  return SIN_JEEM_CATEGORIES.find((c) => c.slug === slug);
}
