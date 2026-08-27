/**
 * الذين ذكروا في القرآن — أنواع وتحميل كسول.
 * لا تُعرض مادة status≠published. الوصفي/غير الموثّق → PEOPLE_REVIEW_QUEUE.
 * الأنبياء (category=prophet) مستبعدون من هذا الفهرس — موجودون في /prophets.
 */

/** عنوان المنتج المعتمد للتنقّل والـSEO */
export const QURAN_PEOPLE_PAGE_TITLE = "الذين ذكروا في القرآن";

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
  other: "أماكن وأقوام وغيرها",
};

/** تصنيفات واجهة الفهرس — بلا أنبياء (قسم /prophets مستقل). */
export const LISTABLE_PERSON_CATEGORIES: PersonCategory[] = [
  "righteous",
  "tyrant",
  "king",
  "companion",
  "figure",
  "other",
];

export const MENTION_TYPE_LABEL: Record<MentionType, string> = {
  name: "ذُكر بالاسم",
  description: "ذُكر بالوصف",
};

let publishedCache: QuranPerson[] | null = null;
let listCache: QuranPerson[] | null = null;

async function loadPublishedPeople(): Promise<QuranPerson[]> {
  if (publishedCache) return publishedCache;
  const { fetchStaticJsonCached } = await import("@/lib/static-json-cache");
  const json = await fetchStaticJsonCached<PeopleCatalog>(
    "/data/quran-people/people.json",
    { version: 0, updatedAt: "", people: [] },
    { credentials: "omit" },
  );
  publishedCache = (json.people ?? []).filter((p) => p.status === "published");
  return publishedCache;
}

export function isProphetPerson(p: Pick<QuranPerson, "category">): boolean {
  return p.category === "prophet";
}

export async function loadQuranPeople(): Promise<QuranPerson[]> {
  if (listCache) return listCache;
  const all = await loadPublishedPeople();
  listCache = all.filter((p) => !isProphetPerson(p));
  return listCache;
}

export async function getQuranPerson(slug: string): Promise<QuranPerson | null> {
  const all = await loadPublishedPeople();
  const person = all.find((p) => p.slug === slug) ?? null;
  if (!person || isProphetPerson(person)) return null;
  return person;
}

/** إن كان الـslug لنبي في الفهرس القديم → مسار قصص الأنبياء. */
export async function getProphetPeopleRedirect(slug: string): Promise<string | null> {
  const all = await loadPublishedPeople();
  const person = all.find((p) => p.slug === slug);
  if (!person || !isProphetPerson(person)) return null;
  return prophetStoryHref(person.prophetSlug || person.slug);
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
