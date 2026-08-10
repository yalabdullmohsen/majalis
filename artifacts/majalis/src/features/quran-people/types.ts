/**
 * أشخاص مذكورون في القرآن — أنواع وتحميل كسول.
 * لا تُعرض مادة status≠published. الوصفي/غير الموثّق → PEOPLE_REVIEW_QUEUE.
 */
export type PersonCategory =
  | "prophet"
  | "righteous"
  | "tyrant"
  | "king"
  | "companion"
  | "figure"
  | "other";

export type MentionType = "name" | "description";

export type PersonOccurrence = {
  surah: number;
  ayah: number;
  note?: string;
};

export type PersonRelatedLink = {
  href: string;
  label: string;
};

export type QuranPerson = {
  slug: string;
  nameAr: string;
  aliases: string[];
  category: PersonCategory;
  mentionType: MentionType;
  definition: string;
  whyMentioned: string;
  lessons: string[];
  occurrences: PersonOccurrence[];
  status: "published" | "needs_review";
  prophetSlug?: string;
  relatedLinks?: PersonRelatedLink[];
};

export type PeopleCatalog = {
  version: number;
  updatedAt: string;
  notes?: string;
  people: QuranPerson[];
};

export const PERSON_CATEGORY_LABEL: Record<PersonCategory, string> = {
  prophet: "نبي",
  righteous: "صالح",
  tyrant: "طاغية / مكذّب",
  king: "ملك",
  companion: "صحابي",
  figure: "شخصية",
  other: "أخرى",
};

export const MENTION_TYPE_LABEL: Record<MentionType, string> = {
  name: "ذُكر بالاسم",
  description: "ذُكر بالوصف",
};

let cache: QuranPerson[] | null = null;

export async function loadQuranPeople(): Promise<QuranPerson[]> {
  if (cache) return cache;
  const res = await fetch("/data/quran-people/people.json", { credentials: "omit" });
  if (!res.ok) {
    cache = [];
    return cache;
  }
  const json = (await res.json()) as PeopleCatalog;
  cache = (json.people ?? []).filter((p) => p.status === "published");
  return cache;
}

export async function getQuranPerson(slug: string): Promise<QuranPerson | null> {
  const all = await loadQuranPeople();
  return all.find((p) => p.slug === slug) ?? null;
}

export function peopleForAyah(
  people: QuranPerson[],
  surah: number,
  ayah: number,
): QuranPerson[] {
  return people.filter((p) =>
    p.occurrences.some((o) => o.surah === surah && o.ayah === ayah),
  );
}

export function mushafAyahHref(surah: number, ayah: number): string {
  return `/mushaf/${surah}?ayah=${ayah}`;
}

export function prophetStoryHref(prophetSlug: string): string {
  return `/prophets/${prophetSlug}`;
}
