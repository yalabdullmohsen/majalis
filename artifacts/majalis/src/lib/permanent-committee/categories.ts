import type { PermanentCommitteeCategory } from "./types";

/** Main + sub categories for the Permanent Committee section */
export const PC_CATEGORIES: PermanentCommitteeCategory[] = [
  { slug: "aqeedah", name: "العقيدة", subcategories: [{ slug: "tawheed", name: "التوحيد" }] },
  { slug: "quran", name: "القرآن وعلومه", subcategories: [{ slug: "tafsir", name: "التفسير" }] },
  { slug: "hadith", name: "الحديث" },
  {
    slug: "fiqh",
    name: "الفقه",
    subcategories: [
      { slug: "ibadat", name: "العبادات" },
      { slug: "muamalat", name: "المعاملات" },
    ],
  },
  { slug: "family", name: "الأسرة" },
  { slug: "nawazil", name: "النوازل" },
  { slug: "dawah", name: "الدعوة" },
  { slug: "akhlaq", name: "الأخلاق" },
  { slug: "adab", name: "الآداب" },
  {
    slug: "ibadat-detail",
    name: "العبادات",
    subcategories: [
      { slug: "hajj", name: "الحج والعمرة" },
      { slug: "zakat", name: "الزكاة" },
      { slug: "siyam", name: "الصيام" },
      { slug: "salah", name: "الصلاة" },
      { slug: "janazah", name: "الجنائز" },
    ],
  },
  {
    slug: "muamalat-detail",
    name: "المعاملات",
    subcategories: [
      { slug: "buyu", name: "البيوت" },
      { slug: "qada", name: "القضاء" },
    ],
  },
];

export const PC_CATEGORY_NAMES = PC_CATEGORIES.flatMap((c) => [
  c.name,
  ...(c.subcategories?.map((s) => s.name) || []),
]);

export function findCategoryBySlug(slug: string): PermanentCommitteeCategory | undefined {
  for (const cat of PC_CATEGORIES) {
    if (cat.slug === slug) return cat;
    const sub = cat.subcategories?.find((s) => s.slug === slug);
    if (sub) return sub;
  }
  return undefined;
}

export function findCategoryByName(name: string): PermanentCommitteeCategory | undefined {
  for (const cat of PC_CATEGORIES) {
    if (cat.name === name) return cat;
    const sub = cat.subcategories?.find((s) => s.name === name);
    if (sub) return sub;
  }
  return undefined;
}
