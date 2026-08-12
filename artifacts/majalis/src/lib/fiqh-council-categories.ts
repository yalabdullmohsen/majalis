/** Hierarchical fiqh taxonomy — used in UI and seed fallback */

export type FiqhCategoryNode = {
  slug: string;
  name: string;
  children?: FiqhCategoryNode[];
};

export const FIQH_CATEGORY_TREE: FiqhCategoryNode[] = [
  {
    slug: "ibadat",
    name: "العبادات",
    children: [
      { slug: "tahara", name: "الطهارة" },
      { slug: "salah", name: "الصلاة" },
      { slug: "zakat", name: "الزكاة" },
      { slug: "siyam", name: "الصيام" },
      { slug: "hajj", name: "الحج" },
    ],
  },
  {
    slug: "muamalat",
    name: "المعاملات",
    children: [
      { slug: "buyu", name: "البيوع" },
      { slug: "banks", name: "البنوك" },
      { slug: "tamin", name: "التأمين" },
      { slug: "invest", name: "الاستثمار" },
      { slug: "companies", name: "الشركات" },
    ],
  },
  {
    slug: "usra",
    name: "الأسرة",
    children: [
      { slug: "nikah", name: "النكاح" },
      { slug: "talaq", name: "الطلاق" },
      { slug: "hadana", name: "الحضانة" },
      { slug: "mirath", name: "الميراث" },
    ],
  },
  {
    slug: "nawazil",
    name: "النوازل المعاصرة",
    children: [
      { slug: "medicine", name: "الطب" },
      { slug: "economy", name: "الاقتصاد" },
      { slug: "tech", name: "التقنية" },
      { slug: "ai", name: "الذكاء الاصطناعي" },
      { slug: "minorities", name: "الأقليات المسلمة" },
    ],
  },
];

/** Legacy flat categories mapped to main tree node */
export const LEGACY_CATEGORY_MAP: Record<string, { main: string; sub?: string }> = {
  "العبادات": { main: "العبادات" },
  "المعاملات": { main: "المعاملات" },
  "الأسرة": { main: "الأسرة" },
  "الطب والنوازل": { main: "النوازل المعاصرة", sub: "الطب" },
  "الاقتصاد الإسلامي": { main: "النوازل المعاصرة", sub: "الاقتصاد" },
  "الأقليات المسلمة": { main: "النوازل المعاصرة", sub: "الأقليات المسلمة" },
  "القضايا المعاصرة": { main: "النوازل المعاصرة", sub: "التقنية" },
  "الأطعمة والأشربة": { main: "المعاملات", sub: "البيوع" },
  "الزكاة والوقف": { main: "العبادات", sub: "الزكاة" },
  "الحج والعمرة": { main: "العبادات", sub: "الحج" },
};

export function getAllMainCategories(): string[] {
  return FIQH_CATEGORY_TREE.map((c) => c.name);
}

export function getSubcategories(mainName: string): string[] {
  const node = FIQH_CATEGORY_TREE.find((c) => c.name === mainName);
  return node?.children?.map((c) => c.name) || [];
}

export function flattenCategoryTree(): { main: string; sub: string; slug: string }[] {
  const out: { main: string; sub: string; slug: string }[] = [];
  for (const main of FIQH_CATEGORY_TREE) {
    for (const sub of main.children || []) {
      out.push({ main: main.name, sub: sub.name, slug: sub.slug });
    }
  }
  return out;
}
