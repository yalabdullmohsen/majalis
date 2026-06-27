/**
 * Canonical QA category taxonomy — single source of truth.
 */

export type QaCategorySlug =
  | "aqeedah"
  | "fiqh"
  | "taharah"
  | "salah"
  | "zakat"
  | "sawm"
  | "hajj"
  | "seerah"
  | "hadith"
  | "tafsir"
  | "quran"
  | "anbiya"
  | "sahabah"
  | "tabiin"
  | "adab"
  | "adhkar"
  | "family"
  | "muamalat"
  | "history"
  | "women"
  | "rulings"
  | "misc";

export type QaCategoryDef = {
  slug: QaCategorySlug;
  name: string;
  description: string;
  sortOrder: number;
  icon?: string;
};

export const QA_CANONICAL_CATEGORIES: QaCategoryDef[] = [
  { slug: "aqeedah", name: "العقيدة", description: "التوحيد والإيمان", sortOrder: 1 },
  { slug: "fiqh", name: "الفقه", description: "أحكام فقهية عامة", sortOrder: 2 },
  { slug: "taharah", name: "الطهارة", description: "الوضوء والغسل والطهارة", sortOrder: 3 },
  { slug: "salah", name: "الصلاة", description: "أحكام الصلاة", sortOrder: 4 },
  { slug: "zakat", name: "الزكاة", description: "أحكام الزكاة", sortOrder: 5 },
  { slug: "sawm", name: "الصيام", description: "رمضان والصيام", sortOrder: 6 },
  { slug: "hajj", name: "الحج", description: "الحج والعمرة", sortOrder: 7 },
  { slug: "seerah", name: "السيرة", description: "السيرة النبوية", sortOrder: 8 },
  { slug: "anbiya", name: "الأنبياء", description: "قصص الأنبياء والمرسلين", sortOrder: 9 },
  { slug: "sahabah", name: "الصحابة", description: "سيرة الصحابة رضي الله عنهم", sortOrder: 10 },
  { slug: "tabiin", name: "التابعون", description: "التابعون وأتباعهم", sortOrder: 11 },
  { slug: "hadith", name: "الحديث", description: "مصطلح الحديث والسنة", sortOrder: 12 },
  { slug: "tafsir", name: "التفسير", description: "تفسير القرآن", sortOrder: 13 },
  { slug: "quran", name: "علوم القرآن", description: "التلاوة وعلوم القرآن", sortOrder: 14 },
  { slug: "adab", name: "الآداب", description: "آداب شرعية", sortOrder: 15 },
  { slug: "adhkar", name: "الأذكار", description: "الأذكار والأدعية", sortOrder: 16 },
  { slug: "family", name: "الأسرة", description: "الزواج والتربية والأسرة", sortOrder: 17 },
  { slug: "women", name: "المرأة", description: "أحكام ومسائل المرأة", sortOrder: 18 },
  { slug: "muamalat", name: "المعاملات", description: "بيع ومعاملات مالية", sortOrder: 19 },
  { slug: "rulings", name: "الأحكام", description: "حلال وحرام ومسائل الأحكام", sortOrder: 20 },
  { slug: "history", name: "التاريخ الإسلامي", description: "تاريخ الأمة الإسلامية", sortOrder: 21 },
  { slug: "misc", name: "متفرقات", description: "أسئلة عامة متنوعة", sortOrder: 99 },
];

export const QA_CATEGORY_SLUGS = QA_CANONICAL_CATEGORIES.map((c) => c.slug);

/** Legacy slug → canonical slug */
export const QA_SLUG_ALIASES: Record<string, QaCategorySlug> = {
  tahara: "taharah",
  prophets: "anbiya",
  "prophets-stories": "anbiya",
  companions: "sahabah",
  "fiqh-puzzles": "fiqh",
  transactions: "muamalat",
  nikah: "family",
  talaq: "family",
  janaiz: "fiqh",
  akhlaq: "adab",
  dawah: "adab",
  ilm: "fiqh",
  tarbiyah: "family",
  qada: "fiqh",
  siyasah: "fiqh",
  ayman: "fiqh",
  nudhur: "fiqh",
  waqf: "muamalat",
  inheritance: "muamalat",
  wasaya: "muamalat",
  qawaid: "fiqh",
  maqasid: "aqeedah",
};

export function resolveCategorySlug(slug: string | null | undefined): QaCategorySlug {
  const s = String(slug || "misc").toLowerCase().trim();
  if (QA_CATEGORY_SLUGS.includes(s as QaCategorySlug)) return s as QaCategorySlug;
  if (QA_SLUG_ALIASES[s]) return QA_SLUG_ALIASES[s];
  return "misc";
}

export function getCategoryBySlug(slug: string): QaCategoryDef | undefined {
  const resolved = resolveCategorySlug(slug);
  return QA_CANONICAL_CATEGORIES.find((c) => c.slug === resolved);
}
