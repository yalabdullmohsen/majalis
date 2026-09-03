/**
 * تطبيع أبواب الفقه — ترتيب شرعي ثابت (sortOrder) مصدر واحد للبوابة والفلاتر والبحث.
 */
import {
  getAllFiqhBooks,
  publishedChapters,
  publishedLessonsInChapter,
  FIQH_SUPPORTING_TOPICS,
  type FiqhBook,
  type FiqhBookCategory,
  type FiqhLesson,
  type FiqhLessonHit,
  lessonHref,
  lessonPath,
} from "@/lib/fiqh-books";
import { normalizeArabic } from "@/shared/arabic-normalize";

/** أبواب فقهية قانونية بالترتيب الشرعي المطلوب في الواجهة. */
export type FiqhCanonicalDoor =
  | "tahara"
  | "salah"
  | "zakat"
  | "sawm"
  | "hajj"
  | "janaza"
  | "jihad"
  | "ayman"
  | "atima"
  | "libas"
  | "muamalat"
  | "buyu"
  | "riba"
  | "ijara"
  | "sharika"
  | "qard"
  | "waqf_hiba"
  | "faraid"
  | "usrah"
  | "nikah"
  | "talaq"
  | "iddah_rida"
  | "nafaqat"
  | "jinayat"
  | "diyat"
  | "hudud"
  | "qada"
  | "shahadat"
  | "iqrar"
  | "nawazil"
  | "qawaid"
  | "usul"
  | "other";

/** مجموعات لونية وفلاتر الواجهة. */
export type FiqhDoorGroup = "ibadat" | "muamalat" | "usrah" | "qada_jinayat";

export type FiqhContentStatus = "complete" | "needs_completion" | "under_review";

export type FiqhDoorMeta = {
  id: FiqhCanonicalDoor;
  label: string;
  desc: string;
  href: string;
  bookHref?: string;
  sortOrder: number;
  group: FiqhDoorGroup;
};

/** ترتيب ثابت — لا تعتمد على ترتيب المصفوفة في البيانات. */
export const FIQH_DOOR_ORDER: FiqhCanonicalDoor[] = [
  "tahara",
  "salah",
  "zakat",
  "sawm",
  "hajj",
  "janaza",
  "ayman",
  "atima",
  "libas",
  "muamalat",
  "buyu",
  "riba",
  "ijara",
  "sharika",
  "qard",
  "waqf_hiba",
  "usrah",
  "nikah",
  "talaq",
  "iddah_rida",
  "nafaqat",
  "jinayat",
  "hudud",
  "qada",
  "shahadat",
  "nawazil",
  "qawaid",
  "usul",
  // أبواب مساندة — خارج القائمة العلنية المختصرة
  "jihad",
  "faraid",
  "diyat",
  "iqrar",
  "other",
];

export const FIQH_DOOR_META: Record<FiqhCanonicalDoor, FiqhDoorMeta> = {
  tahara: {
    id: "tahara",
    label: "الطهارة",
    desc: "الوضوء والغسل والتيمم ونواقضها.",
    href: "/tahara",
    bookHref: "/fiqh/books/taharah",
    sortOrder: 10,
    group: "ibadat",
  },
  salah: {
    id: "salah",
    label: "الصلاة",
    desc: "أركانها وشروطها وسننها وأوقاتها.",
    href: "/salah-guide",
    bookHref: "/fiqh/books/salah",
    sortOrder: 20,
    group: "ibadat",
  },
  zakat: {
    id: "zakat",
    label: "الزكاة",
    desc: "النصاب والأنواع والمصارف.",
    href: "/zakat",
    bookHref: "/fiqh/books/zakat",
    sortOrder: 30,
    group: "ibadat",
  },
  sawm: {
    id: "sawm",
    label: "الصيام",
    desc: "رمضان والقضاء والكفارة والرخص.",
    href: "/sawm",
    bookHref: "/fiqh/books/sawm",
    sortOrder: 40,
    group: "ibadat",
  },
  hajj: {
    id: "hajj",
    label: "الحج والعمرة",
    desc: "المناسك ومحرمات الإحرام.",
    href: "/hajj",
    bookHref: "/fiqh/books/hajj",
    sortOrder: 50,
    group: "ibadat",
  },
  janaza: {
    id: "janaza",
    label: "الجنائز",
    desc: "تغسيل الميت والصلاة عليه والدفن.",
    href: "/janaza",
    bookHref: "/fiqh/books/janaza",
    sortOrder: 60,
    group: "ibadat",
  },
  ayman: {
    id: "ayman",
    label: "الأيمان والنذور",
    desc: "اليمين والنذر والكفارة.",
    href: "/fiqh/books/ayman",
    bookHref: "/fiqh/books/ayman",
    sortOrder: 70,
    group: "ibadat",
  },
  atima: {
    id: "atima",
    label: "الأطعمة والأشربة",
    desc: "الحلال والحرام في المطعومات والمشروبات.",
    href: "/fiqh/books/atima",
    bookHref: "/fiqh/books/atima",
    sortOrder: 80,
    group: "ibadat",
  },
  libas: {
    id: "libas",
    label: "اللباس والزينة",
    desc: "أحكام اللباس والزينة.",
    href: "/fiqh/books/libas",
    bookHref: "/fiqh/books/libas",
    sortOrder: 90,
    group: "ibadat",
  },
  muamalat: {
    id: "muamalat",
    label: "المعاملات",
    desc: "ضوابط العقود المالية العامة.",
    href: "/fiqh/books/buyu",
    bookHref: "/fiqh/books/buyu",
    sortOrder: 100,
    group: "muamalat",
  },
  buyu: {
    id: "buyu",
    label: "البيوع",
    desc: "عقد البيع وشروطه والخيارات.",
    href: "/fiqh/books/buyu",
    bookHref: "/fiqh/books/buyu",
    sortOrder: 110,
    group: "muamalat",
  },
  riba: {
    id: "riba",
    label: "الربا والصرف",
    desc: "الربا والصرف وصورهما.",
    href: "/fiqh/books/riba",
    bookHref: "/fiqh/books/riba",
    sortOrder: 120,
    group: "muamalat",
  },
  ijara: {
    id: "ijara",
    label: "الإجارة",
    desc: "إجارة الأعيان والمنافع.",
    href: "/fiqh/books/ijara",
    bookHref: "/fiqh/books/ijara",
    sortOrder: 130,
    group: "muamalat",
  },
  sharika: {
    id: "sharika",
    label: "الشركة والمضاربة",
    desc: "الشركات والمضاربة.",
    href: "/fiqh/books/sharika",
    bookHref: "/fiqh/books/sharika",
    sortOrder: 140,
    group: "muamalat",
  },
  qard: {
    id: "qard",
    label: "القرض والدين",
    desc: "القرض الحسن والوفاء.",
    href: "/fiqh/books/qard",
    bookHref: "/fiqh/books/qard",
    sortOrder: 150,
    group: "muamalat",
  },
  waqf_hiba: {
    id: "waqf_hiba",
    label: "الوقف والهبة والوصايا",
    desc: "الوقف والهبة والوصية.",
    href: "/fiqh/books/waqf",
    bookHref: "/fiqh/books/waqf",
    sortOrder: 160,
    group: "muamalat",
  },
  usrah: {
    id: "usrah",
    label: "الأسرة",
    desc: "أحكام الأسرة العامة.",
    href: "/nikah",
    bookHref: "/fiqh/books/nikah",
    sortOrder: 170,
    group: "usrah",
  },
  nikah: {
    id: "nikah",
    label: "النكاح",
    desc: "عقد النكاح وشروطه والصداق.",
    href: "/nikah",
    bookHref: "/fiqh/books/nikah",
    sortOrder: 180,
    group: "usrah",
  },
  talaq: {
    id: "talaq",
    label: "الطلاق",
    desc: "الطلاق والخلع وما يلحق بهما.",
    href: "/fiqh/books/talaq",
    bookHref: "/fiqh/books/talaq",
    sortOrder: 190,
    group: "usrah",
  },
  iddah_rida: {
    id: "iddah_rida",
    label: "العِدد والرضاع",
    desc: "العدّة والرضاع والرجعة.",
    href: "/fiqh/books/iddah",
    bookHref: "/fiqh/books/iddah",
    sortOrder: 200,
    group: "usrah",
  },
  nafaqat: {
    id: "nafaqat",
    label: "النفقات والحضانة",
    desc: "النفقة والحضانة وحقوق الأولاد.",
    href: "/fiqh/books/nafaqat",
    bookHref: "/fiqh/books/nafaqat",
    sortOrder: 210,
    group: "usrah",
  },
  jinayat: {
    id: "jinayat",
    label: "الجنايات والحدود",
    desc: "القصاص والجنايات والحدود بإيجاز.",
    href: "/fiqh/books/jinayat",
    bookHref: "/fiqh/books/jinayat",
    sortOrder: 220,
    group: "qada_jinayat",
  },
  hudud: {
    id: "hudud",
    label: "الحدود",
    desc: "حدود الزنا والسرقة والقذف.",
    href: "/fiqh/books/hudud",
    bookHref: "/fiqh/books/hudud",
    sortOrder: 225,
    group: "qada_jinayat",
  },
  qada: {
    id: "qada",
    label: "القضاء والشهادات",
    desc: "آداب القاضي والدعوى والشهادة.",
    href: "/fiqh/books/qada",
    bookHref: "/fiqh/books/qada",
    sortOrder: 230,
    group: "qada_jinayat",
  },
  shahadat: {
    id: "shahadat",
    label: "الشهادات",
    desc: "شروط الشاهد وأنواع الشهادة.",
    href: "/fiqh/books/shahadat",
    bookHref: "/fiqh/books/shahadat",
    sortOrder: 235,
    group: "qada_jinayat",
  },
  nawazil: {
    id: "nawazil",
    label: "النوازل المعاصرة",
    desc: "نوازل العصر عبر قرارات المجامع.",
    href: "/fiqh-council/nawazil",
    sortOrder: 240,
    group: "muamalat",
  },
  qawaid: {
    id: "qawaid",
    label: "القواعد الفقهية",
    desc: "القواعد الخمس الكبرى وما يتفرع عنها.",
    href: "/fiqh-qawaid",
    sortOrder: 250,
    group: "ibadat",
  },
  usul: {
    id: "usul",
    label: "أصول الفقه",
    desc: "أدلة الأحكام وطرق الاستنباط.",
    href: "/fiqh/usul",
    sortOrder: 260,
    group: "ibadat",
  },
  jihad: {
    id: "jihad",
    label: "الجهاد والسير",
    desc: "أحكام الجهاد والسِّيَر بإيجاز.",
    href: "/fiqh/books/jihad",
    bookHref: "/fiqh/books/jihad",
    sortOrder: 270,
    group: "ibadat",
  },
  faraid: {
    id: "faraid",
    label: "الفرائض والمواريث",
    desc: "أنصبة الورثة وأحكام التركة.",
    href: "/fiqh/books/faraid",
    bookHref: "/fiqh/books/faraid",
    sortOrder: 280,
    group: "muamalat",
  },
  diyat: {
    id: "diyat",
    label: "الديات",
    desc: "دية النفس والجراحات.",
    href: "/fiqh/books/diyat",
    bookHref: "/fiqh/books/diyat",
    sortOrder: 290,
    group: "qada_jinayat",
  },
  iqrar: {
    id: "iqrar",
    label: "الإقرار",
    desc: "الإقرار وآثاره في الخصومات.",
    href: "/fiqh/books/iqrar",
    bookHref: "/fiqh/books/iqrar",
    sortOrder: 300,
    group: "qada_jinayat",
  },
  other: {
    id: "other",
    label: "أبواب أخرى",
    desc: "مباحث فقهية لم تُصنَّف ضمن الأبواب السابقة.",
    href: "/fiqh",
    sortOrder: 900,
    group: "ibadat",
  },
};

/**
 * أبواب بوابة الفقه العلنية — مرتبة بـ sortOrder الثابت لا بترتيب المصفوفة وحده.
 */
export const FIQH_HUB_DOOR_ORDER: FiqhCanonicalDoor[] = [
  "tahara",
  "salah",
  "zakat",
  "sawm",
  "hajj",
  "janaza",
  "ayman",
  "atima",
  "libas",
  "muamalat",
  "buyu",
  "riba",
  "ijara",
  "sharika",
  "qard",
  "waqf_hiba",
  "usrah",
  "nikah",
  "talaq",
  "iddah_rida",
  "nafaqat",
  "jinayat",
  "qada",
  "nawazil",
  "qawaid",
  "usul",
];

/** أبواب «ابدأ من هنا» للمبتدئ. */
export const FIQH_START_HERE_DOORS: FiqhCanonicalDoor[] = [
  "tahara",
  "salah",
  "zakat",
  "sawm",
  "hajj",
];

export type FiqhHubGroupFilter = "all" | FiqhDoorGroup;

export const FIQH_GROUP_FILTER_CHIPS: Array<{ id: FiqhHubGroupFilter; label: string }> = [
  { id: "all", label: "الكل" },
  { id: "ibadat", label: "العبادات" },
  { id: "muamalat", label: "المعاملات" },
  { id: "usrah", label: "الأسرة" },
  { id: "qada_jinayat", label: "القضاء والجنايات" },
];

/** توافق: فلاتر الشريط القديمة كانت أبوابًا؛ الواجهة الجديدة تستخدم المجموعات. */
export const FIQH_FILTER_CHIP_ORDER: Array<FiqhCanonicalDoor | "all"> = [
  "all",
  ...FIQH_HUB_DOOR_ORDER,
];

const FILTER_LABEL_OVERRIDE: Partial<Record<FiqhCanonicalDoor, string>> = {};

export function fiqhFilterChipLabel(id: FiqhCanonicalDoor | "all"): string {
  if (id === "all") return "كل الأبواب";
  return FILTER_LABEL_OVERRIDE[id] ?? FIQH_DOOR_META[id].label;
}

export function fiqhDoorGroup(door: FiqhCanonicalDoor): FiqhDoorGroup {
  return FIQH_DOOR_META[door].group;
}

/** عند اختيار فلتر تجميعي قديم (باب واحد): يوسّع إلى الأبواب الفرعية. */
const FILTER_DOOR_EXPAND: Partial<Record<FiqhCanonicalDoor, FiqhCanonicalDoor[]>> = {
  muamalat: ["muamalat", "buyu", "riba", "ijara", "sharika", "qard", "waqf_hiba", "faraid"],
  buyu: ["buyu", "muamalat", "riba", "ijara", "sharika", "qard", "waqf_hiba"],
  usrah: ["usrah", "nikah", "talaq", "iddah_rida", "nafaqat"],
  jinayat: ["jinayat", "diyat", "hudud"],
  qada: ["qada", "shahadat", "iqrar"],
};

const GROUP_DOOR_EXPAND: Record<FiqhDoorGroup, FiqhCanonicalDoor[]> = {
  ibadat: ["tahara", "salah", "janaza", "zakat", "sawm", "hajj", "jihad", "atima", "ayman", "libas"],
  muamalat: ["buyu", "muamalat", "riba", "ijara", "sharika", "qard", "waqf_hiba", "faraid"],
  usrah: ["usrah", "nikah", "talaq", "iddah_rida", "nafaqat"],
  qada_jinayat: ["jinayat", "diyat", "hudud", "qada", "shahadat", "iqrar"],
};

export function expandFiqhFilterDoors(door: FiqhCanonicalDoor | "all"): FiqhCanonicalDoor[] | "all" {
  if (door === "all") return "all";
  return FILTER_DOOR_EXPAND[door] ?? [door];
}

export function expandFiqhGroupFilter(group: FiqhHubGroupFilter): FiqhCanonicalDoor[] | "all" {
  if (group === "all") return "all";
  return GROUP_DOOR_EXPAND[group];
}

const BOOK_DOOR_MAP: Record<string, FiqhCanonicalDoor> = {
  taharah: "tahara",
  salah: "salah",
  janaza: "janaza",
  zakat: "zakat",
  sawm: "sawm",
  itikaf: "sawm",
  hajj: "hajj",
  udhiya: "hajj",
  ayman: "ayman",
  dhaka: "atima",
  atima: "atima",
  libas: "libas",
  buyu: "buyu",
  riba: "riba",
  khiyar: "buyu",
  salam: "buyu",
  ijara: "ijara",
  sharika: "sharika",
  rahn: "muamalat",
  daman: "muamalat",
  hawala: "muamalat",
  wakala: "muamalat",
  qard: "qard",
  shufa: "muamalat",
  musaqa: "muamalat",
  waqf: "waqf_hiba",
  hiba: "waqf_hiba",
  wasaya: "waqf_hiba",
  faraid: "faraid",
  luqata: "muamalat",
  ghasb: "muamalat",
  mawat: "muamalat",
  nikah: "nikah",
  sadaq: "nikah",
  ishra: "usrah",
  khul: "talaq",
  talaq: "talaq",
  raja: "iddah_rida",
  ila: "talaq",
  iddah: "iddah_rida",
  rida: "iddah_rida",
  nafaqat: "nafaqat",
  jinayat: "jinayat",
  diyat: "diyat",
  qasama: "jinayat",
  hudud: "hudud",
  bughat: "hudud",
  jihad: "jihad",
  jizya: "jihad",
  qada: "qada",
  shahadat: "shahadat",
  dawa: "qada",
  iqrar: "iqrar",
};

function categoryFallbackDoor(category: FiqhBookCategory): FiqhCanonicalDoor {
  switch (category) {
    case "muamalat":
      return "muamalat";
    case "usrah":
      return "usrah";
    case "jinayat":
      return "jinayat";
    case "qada":
      return "qada";
    default:
      return "other";
  }
}

export function resolveBookDoor(book: FiqhBook): FiqhCanonicalDoor {
  return BOOK_DOOR_MAP[book.id] ?? categoryFallbackDoor(book.category);
}

export function resolveLessonDoor(hit: FiqhLessonHit): FiqhCanonicalDoor {
  return resolveBookDoor(hit.book);
}

export function normalizeFiqhText(text: string): string {
  return normalizeArabic(text);
}

export function hasCompleteSources(lesson: FiqhLesson): boolean {
  return (
    Array.isArray(lesson.sources) &&
    lesson.sources.length > 0 &&
    lesson.sources.every((s) => s.book?.trim() && s.author?.trim() && s.ref?.trim())
  );
}

export function getLessonContentStatus(lesson: FiqhLesson): FiqhContentStatus {
  if (!lesson.title?.trim()) return "needs_completion";
  if (lesson.status !== "published") return "under_review";
  if (!hasCompleteSources(lesson)) return "under_review";
  if (!lesson.summary?.trim() || !lesson.evidence?.trim() || !lesson.preferred?.trim()) {
    return "needs_completion";
  }
  return "complete";
}

export function isSeverelyIncompleteLesson(lesson: FiqhLesson): boolean {
  const status = getLessonContentStatus(lesson);
  return status === "under_review" || !lesson.title?.trim();
}

export const FIQH_STATUS_LABELS: Record<FiqhContentStatus, string> = {
  complete: "مكتمل",
  needs_completion: "بحاجة إلى استكمال",
  under_review: "قيد التدقيق",
};

export function listAllLessonHits(): FiqhLessonHit[] {
  const hits: FiqhLessonHit[] = [];
  for (const book of getAllFiqhBooks()) {
    for (const chapter of book.chapters) {
      for (const lesson of chapter.lessons) {
        hits.push({
          lesson,
          book,
          chapter,
          path: lessonPath(book, chapter, lesson),
          href: lessonHref(book, lesson),
        });
      }
    }
  }
  return hits;
}

export function listVisibleLessonHits(): FiqhLessonHit[] {
  return listAllLessonHits().filter((hit) => {
    const status = getLessonContentStatus(hit.lesson);
    return status !== "under_review" || hit.lesson.title?.trim();
  });
}

export function listPublishedLessonHits(): FiqhLessonHit[] {
  const hits: FiqhLessonHit[] = [];
  for (const book of getAllFiqhBooks()) {
    for (const chapter of publishedChapters(book)) {
      for (const lesson of publishedLessonsInChapter(chapter)) {
        hits.push({
          lesson,
          book,
          chapter,
          path: lessonPath(book, chapter, lesson),
          href: lessonHref(book, lesson),
        });
      }
    }
  }
  return hits;
}

export type FiqhDoorSummary = FiqhDoorMeta & {
  issueCount: number;
  chapterCount: number;
  status: FiqhContentStatus;
  /** true إن وُجدت مسائل محسوبة من البيانات */
  hasVerifiedIssueCount: boolean;
};

function aggregateDoorStatus(statuses: FiqhContentStatus[]): FiqhContentStatus {
  if (statuses.length === 0) return "needs_completion";
  if (statuses.every((s) => s === "complete")) return "complete";
  if (statuses.some((s) => s === "under_review")) return "under_review";
  return "needs_completion";
}

function supportingTopicStatus(id: "nawazil" | "qawaid" | "usul"): FiqhContentStatus {
  const topic = FIQH_SUPPORTING_TOPICS.find((t) => t.id === id);
  return topic ? "complete" : "needs_completion";
}

export function buildFiqhDoorSummaries(): FiqhDoorSummary[] {
  const byDoor = new Map<
    FiqhCanonicalDoor,
    { issues: number; chapters: Set<string>; statuses: FiqhContentStatus[] }
  >();
  for (const door of FIQH_DOOR_ORDER) {
    byDoor.set(door, { issues: 0, chapters: new Set(), statuses: [] });
  }

  for (const book of getAllFiqhBooks()) {
    const door = resolveBookDoor(book);
    const bucket = byDoor.get(door) ?? byDoor.get("other")!;
    for (const chapter of book.chapters) {
      const lessons = chapter.lessons;
      if (lessons.length > 0) bucket.chapters.add(`${book.id}:${chapter.id}`);
      for (const lesson of lessons) {
        bucket.issues += 1;
        bucket.statuses.push(getLessonContentStatus(lesson));
      }
    }
  }

  return FIQH_DOOR_ORDER.map((door) => {
    const meta = FIQH_DOOR_META[door];
    const bucket = byDoor.get(door)!;
    const isSupporting = door === "nawazil" || door === "qawaid" || door === "usul";
    const status = isSupporting
      ? supportingTopicStatus(door)
      : aggregateDoorStatus(bucket.statuses);
    const hasVerifiedIssueCount = bucket.issues > 0;

    return {
      ...meta,
      issueCount: bucket.issues,
      chapterCount: bucket.chapters.size,
      status: hasVerifiedIssueCount || isSupporting ? status : "needs_completion",
      hasVerifiedIssueCount,
    };
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function dedupeLessonHits(hits: FiqhLessonHit[]): FiqhLessonHit[] {
  const seen = new Set<string>();
  const out: FiqhLessonHit[] = [];
  for (const hit of hits) {
    const key = hit.lesson.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
  }
  return out;
}

export function sortLessonsByCompleteness(hits: FiqhLessonHit[]): FiqhLessonHit[] {
  const rank: Record<FiqhContentStatus, number> = {
    complete: 0,
    needs_completion: 1,
    under_review: 2,
  };
  return hits.slice().sort((a, b) => {
    const sa = rank[getLessonContentStatus(a.lesson)];
    const sb = rank[getLessonContentStatus(b.lesson)];
    if (sa !== sb) return sa - sb;
    return a.lesson.title.localeCompare(b.lesson.title, "ar");
  });
}
