/**
 * نطاقات صفحة البحث الرئيسية — مطابقة فعلية على الفهرس لا شرائح شكلية.
 */
export const SEARCH_SCOPE_IDS = [
  "all",
  "quran",
  "tafsir",
  "seerah",
  "history",
  "prophet",
  "fiqh",
  "hadith",
  "adhkar",
  "lesson",
  "fawaid",
] as const;

export type SearchScopeId = (typeof SEARCH_SCOPE_IDS)[number];

export type SearchScopeDef = {
  id: Exclude<SearchScopeId, "all">;
  title: string;
  desc: string;
  href: string;
};

/** البطاقات المقترحة بالترتيب المطلوب. */
export const SEARCH_SCOPE_DEFS: SearchScopeDef[] = [
  { id: "quran", title: "القرآن الكريم", desc: "المصحف والتلاوة", href: "/quran-hub" },
  { id: "tafsir", title: "التفسير", desc: "معاني الآيات وشرحها", href: "/tafsir" },
  { id: "seerah", title: "السيرة النبوية", desc: "حياة النبي ﷺ", href: "/seerah" },
  { id: "history", title: "التاريخ الإسلامي", desc: "أحداث وحضارة الأمة", href: "/tarikh-islami" },
  { id: "prophet", title: "قصص الأنبياء", desc: "قصص وعبر", href: "/prophets" },
  { id: "fiqh", title: "الفقه", desc: "أحكام العبادات والمعاملات", href: "/fiqh" },
  { id: "hadith", title: "الحديث", desc: "السنة والآثار", href: "/hadith" },
  { id: "adhkar", title: "الأذكار", desc: "أذكار وأدعية مأثورة", href: "/adhkar" },
  { id: "lesson", title: "الدروس", desc: "دروس علمية حية", href: "/lessons" },
  { id: "fawaid", title: "الفوائد", desc: "فوائد علمية مختصرة", href: "/fawaid" },
];

const KIND_SETS: Record<Exclude<SearchScopeId, "all">, ReadonlySet<string>> = {
  quran: new Set(["surah", "quran", "ayah", "page"]),
  tafsir: new Set(["tafsir", "tafsir-audio", "ulum"]),
  seerah: new Set(["seerah"]),
  history: new Set(["history"]),
  prophet: new Set(["prophet", "prophets", "nation", "nations"]),
  fiqh: new Set(["fiqh", "fatwa", "qa", "ruling", "fiqh_decision"]),
  hadith: new Set(["hadith"]),
  adhkar: new Set(["adhkar", "dua"]),
  lesson: new Set(["lesson", "course"]),
  fawaid: new Set(["fawaid"]),
};

export function isSearchScopeId(value: string | null | undefined): value is SearchScopeId {
  return Boolean(value && (SEARCH_SCOPE_IDS as readonly string[]).includes(value));
}

export type ScopeableDoc = {
  id: string;
  kind: string;
  href: string;
  titleAr?: string;
  norm?: string;
};

/**
 * هل الوثيقة داخل النطاق؟ التفسير/السيرة يطابقان النوع أو المسار/المعرّف
 * لأن مواد السيرة في الفهرس غالبًا kind=history.
 */
export function docMatchesScope(doc: ScopeableDoc, scope: SearchScopeId): boolean {
  if (scope === "all") return true;
  if (KIND_SETS[scope].has(doc.kind)) return true;

  const href = doc.href || "";
  const id = doc.id || "";

  switch (scope) {
    case "quran":
      return href.startsWith("/mushaf") || href.startsWith("/quran-hub") || href.startsWith("/quran/");
    case "tafsir":
      return href.startsWith("/tafsir") || href.includes("/tafsir");
    case "seerah":
      return /seerah/i.test(id) || /\/seerah(?:\/|$)/i.test(href) || /tarikh-islami\/seerah/i.test(href);
    case "history":
      return href.startsWith("/tarikh-islami");
    case "prophet":
      return href.startsWith("/prophets") || href.startsWith("/nations");
    case "fiqh":
      return href.startsWith("/fiqh") || href.startsWith("/quiz?qa=");
    case "hadith":
      return href.startsWith("/hadith") || href.startsWith("/arbaeen-nawawi");
    case "adhkar":
      return href.startsWith("/adhkar") || href.startsWith("/duas");
    case "lesson":
      return href.startsWith("/lessons") || href.startsWith("/courses");
    case "fawaid":
      return href.startsWith("/fawaid");
    default:
      return false;
  }
}

export function filterDocsByScope<T extends ScopeableDoc>(docs: T[], scope: SearchScopeId): T[] {
  if (scope === "all") return docs;
  return docs.filter((d) => docMatchesScope(d, scope));
}

export const SEARCH_SCOPE_LABELS: Record<SearchScopeId, string> = {
  all: "الكل",
  quran: "القرآن",
  tafsir: "تفسير",
  seerah: "السيرة",
  history: "التاريخ",
  prophet: "الأنبياء",
  fiqh: "الفقه",
  hadith: "الحديث",
  adhkar: "الأذكار",
  lesson: "الدروس",
  fawaid: "الفوائد",
};
