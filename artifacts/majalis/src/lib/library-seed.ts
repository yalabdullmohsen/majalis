/**
 * مكتبة علمية — مراجع أساسية موثقة (ترتيب العرض).
 */
export type LibrarySeedItem = {
  id: string;
  title: string;
  type: string;
  category: string;
  description: string;
  external_url?: string;
  status?: "approved";
};

/** ترتيب المراجع الأساسية — يُطبَّق على المكتبة من Supabase أو المحلي. */
export const LIBRARY_PRIMARY_TITLES = [
  "صحيح البخاري",
  "صحيح مسلم",
  "موطأ الإمام مالك",
  "سنن أبي داود",
  "سنن الترمذي",
  "سنن النسائي",
  "سنن ابن ماجه",
] as const;

const PRIMARY_RANK = new Map(
  LIBRARY_PRIMARY_TITLES.map((title, index) => [normalizeLibraryTitle(title), index]),
);

function normalizeLibraryTitle(title: string): string {
  return String(title || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^الموطأ\s*—\s*مالك$/, "موطأ الإمام مالك");
}

export function librarySortRank(title: string): number {
  const normalized = normalizeLibraryTitle(title);
  for (const [key, rank] of PRIMARY_RANK.entries()) {
    if (normalized.includes(key) || key.includes(normalized)) return rank;
  }
  return 100 + normalized.charCodeAt(0);
}

export function sortLibraryItems<T extends { title?: string; id?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ra = librarySortRank(a.title || "");
    const rb = librarySortRank(b.title || "");
    if (ra !== rb) return ra - rb;
    return String(a.title || "").localeCompare(String(b.title || ""), "ar");
  });
}

export const LIBRARY_SEED: LibrarySeedItem[] = sortLibraryItems([
  {
    id: "book-sahih-bukhari",
    title: "صحيح البخاري",
    type: "كتاب",
    category: "حديث",
    description: "أصح كتاب بعد القرآن؛ جمع أحاديث النبي ﷺ بأعلى معايير الجرح والتعديل.",
    external_url: "https://sunnah.com/bukhari",
    status: "approved",
  },
  {
    id: "book-sahih-muslim",
    title: "صحيح مسلم",
    type: "كتاب",
    category: "حديث",
    description: "ثاني أصح كتب الحديث؛ مرتب حسب الأبواب الفقهية.",
    external_url: "https://sunnah.com/muslim",
    status: "approved",
  },
  {
    id: "book-muwatta-malik",
    title: "موطأ الإمام مالك",
    type: "كتاب",
    category: "حديث",
    description: "أقدم كتاب حديث وصل إلينا؛ رواية الإمام مالك.",
    external_url: "https://sunnah.com/malik",
    status: "approved",
  },
  {
    id: "book-sunan-abu-dawud",
    title: "سنن أبي داود",
    type: "كتاب",
    category: "حديث",
    description: "من كتب السنن الستة؛ يشتهر بأحاديث الأحكام.",
    external_url: "https://sunnah.com/abudawud",
    status: "approved",
  },
  {
    id: "book-sunan-tirmidhi",
    title: "سنن الترمذي",
    type: "كتاب",
    category: "حديث",
    description: "من كتب السنن الستة؛ يذكر درجة الحديث وجماعة العلماء.",
    external_url: "https://sunnah.com/tirmidhi",
    status: "approved",
  },
  {
    id: "book-sunan-nasai",
    title: "سنن النسائي",
    type: "كتاب",
    category: "حديث",
    description: "من كتب السنن الستة؛ يشتهر بالتدقيق في الرواة.",
    external_url: "https://sunnah.com/nasai",
    status: "approved",
  },
  {
    id: "book-sunan-ibn-majah",
    title: "سنن ابن ماجه",
    type: "كتاب",
    category: "حديث",
    description: "من كتب السنن الستة؛ آخرها جمعاً في الاصطلاح الشائع.",
    external_url: "https://sunnah.com/ibnmajah",
    status: "approved",
  },
  {
    id: "book-tafsir-ibn-kathir",
    title: "تفسير ابن كثير",
    type: "كتاب",
    category: "تفسير",
    description: "تفسير بالمأثور؛ يعتمد على الآيات والأحاديث الصحيحة.",
    status: "approved",
  },
  {
    id: "book-riyadh-salihin",
    title: "رياض الصالحين",
    type: "كتاب",
    category: "حديث",
    description: "مختارات من الأحاديث في الأخلاق والآداب.",
    status: "approved",
  },
  {
    id: "book-sirah-ibn-hisham",
    title: "السيرة النبوية — ابن هشام",
    type: "كتاب",
    category: "سيرة",
    description: "من أشهر كتب السيرة؛ اعتمد على سيرة ابن إسحاق.",
    status: "approved",
  },
  {
    id: "book-bulogh-maram",
    title: "بلوغ المرام",
    type: "كتاب",
    category: "حديث",
    description: "جمع أحاديث الأحكام مع بيان درجة كل حديث.",
    status: "approved",
  },
  {
    id: "book-al-muntaqa",
    title: "المنتقى — ابن الجوزي",
    type: "كتاب",
    category: "فقه",
    description: "مختصر في الفقه الحنبلي.",
    status: "approved",
  },
  {
    id: "book-zad-al-maad",
    title: "زاد المعاد",
    type: "كتاب",
    category: "سيرة",
    description: "طب النبوي في السيرة والفقه والآداب.",
    status: "approved",
  },
  {
    id: "book-aqeedah-wasitiyyah",
    title: "العقيدة الواسطية",
    type: "كتاب",
    category: "عقيدة",
    description: "عقيدة أهل السنة والجماعة باختصار ووضوح.",
    status: "approved",
  },
  {
    id: "book-hisn-muslim",
    title: "\u062D\u0635\u0646 \u0627\u0644\u0645\u0633\u0644\u0645",
    type: "كتاب",
    category: "أذكار",
    description: "جمع أذكار النبي ﷺ من الكتاب والسنة.",
    status: "approved",
  },
  {
    id: "book-adhkar-nawawi",
    title: "الأذكار — النووي",
    type: "كتاب",
    category: "أذكار",
    description: "موسوعة الأذكار والأدعية المأثورة.",
    status: "approved",
  },
  {
    id: "book-fiqh-sunnah",
    title: "فقه السنة",
    type: "كتاب",
    category: "فقه",
    description: "فقه مقارن مبسّط للعبادات والمعاملات.",
    status: "approved",
  },
  {
    id: "book-jami-uloom",
    title: "جامع العلوم والحكم",
    type: "كتاب",
    category: "حديث",
    description: "شرح الأربعين النووية مع فوائد عقدية وفقهية.",
    status: "approved",
  },
  {
    id: "book-lulu-al-marjan",
    title: "اللؤلؤ والمرجان",
    type: "كتاب",
    category: "حديث",
    description: "متفق عليه من البخاري ومسلم.",
    status: "approved",
  },
  {
    id: "book-tahawiyyah-summary",
    title: "العقيدة الطحاوية — شرح مختصر",
    type: "ملخص",
    category: "عقيدة",
    description: "ملخص منظم لأهم مسائل العقيدة في متن الطحاوية.",
    status: "approved",
  },
  {
    id: "book-ajrumiyyah",
    title: "متن الآجرومية",
    type: "متن",
    category: "لغة",
    description: "متن كلاسيكي في النحو العربي مع شرح مبسّط.",
    status: "approved",
  },
]);
