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
  | "usrah"
  | "nikah"
  | "talaq"
  | "iddah_rida"
  | "nafaqat"
  | "jinayat"
  | "qada"
  | "nawazil"
  | "qawaid"
  | "usul"
  | "other";

export type FiqhContentStatus = "complete" | "needs_completion" | "under_review";

export type FiqhDoorMeta = {
  id: FiqhCanonicalDoor;
  label: string;
  desc: string;
  href: string;
  bookHref?: string;
  sortOrder: number;
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
  "qada",
  "nawazil",
  "qawaid",
  "usul",
  "other",
];

export const FIQH_DOOR_META: Record<FiqhCanonicalDoor, FiqhDoorMeta> = {
  tahara: {
    id: "tahara",
    label: "الطهارة",
    desc: "الوضوء والغسل والتيمم ونواقض الطهارة.",
    href: "/tahara",
    bookHref: "/fiqh/books/taharah",
    sortOrder: 10,
  },
  salah: {
    id: "salah",
    label: "الصلاة",
    desc: "أركان الصلاة وشروطها وسننها وأوقاتها.",
    href: "/salah-guide",
    bookHref: "/fiqh/books/salah",
    sortOrder: 20,
  },
  zakat: {
    id: "zakat",
    label: "الزكاة",
    desc: "شروط الوجوب والنصاب والأنواع والمصارف.",
    href: "/zakat",
    bookHref: "/fiqh/books/zakat",
    sortOrder: 30,
  },
  sawm: {
    id: "sawm",
    label: "الصيام",
    desc: "رمضان والنوافل والقضاء والكفارة والرخص.",
    href: "/sawm",
    bookHref: "/fiqh/books/sawm",
    sortOrder: 40,
  },
  hajj: {
    id: "hajj",
    label: "الحج والعمرة",
    desc: "مناسك الحج والعمرة ومحرمات الإحرام.",
    href: "/hajj",
    bookHref: "/fiqh/books/hajj",
    sortOrder: 50,
  },
  janaza: {
    id: "janaza",
    label: "الجنائز",
    desc: "تغسيل الميت والصلاة عليه والدفن والتعزية.",
    href: "/janaza",
    bookHref: "/fiqh/books/janaza",
    sortOrder: 60,
  },
  ayman: {
    id: "ayman",
    label: "الأيمان والنذور",
    desc: "أحكام اليمين والنذر والكفارة.",
    href: "/fiqh/books/ayman",
    bookHref: "/fiqh/books/ayman",
    sortOrder: 70,
  },
  atima: {
    id: "atima",
    label: "الأطعمة والأشربة",
    desc: "الحلال والحرام في المطعومات والمشروبات والذكاة.",
    href: "/fiqh/books/atima",
    bookHref: "/fiqh/books/atima",
    sortOrder: 80,
  },
  libas: {
    id: "libas",
    label: "اللباس والزينة",
    desc: "أحكام اللباس والزينة للرجل والمرأة.",
    href: "/fiqh/books/libas",
    bookHref: "/fiqh/books/libas",
    sortOrder: 90,
  },
  muamalat: {
    id: "muamalat",
    label: "المعاملات",
    desc: "ضوابط العقود والمعاملات المالية العامة.",
    href: "/fiqh/books/buyu",
    bookHref: "/fiqh/books/buyu",
    sortOrder: 100,
  },
  buyu: {
    id: "buyu",
    label: "البيوع",
    desc: "عقد البيع وشروطه وأنواعه والخيارات.",
    href: "/fiqh/books/buyu",
    bookHref: "/fiqh/books/buyu",
    sortOrder: 110,
  },
  riba: {
    id: "riba",
    label: "الربا والصرف",
    desc: "الربا والصرف وصورهما المعاصرة.",
    href: "/fiqh/books/riba",
    bookHref: "/fiqh/books/riba",
    sortOrder: 120,
  },
  ijara: {
    id: "ijara",
    label: "الإجارة",
    desc: "إجارة الأعيان والمنافع وأحكامها.",
    href: "/fiqh/books/ijara",
    bookHref: "/fiqh/books/ijara",
    sortOrder: 130,
  },
  sharika: {
    id: "sharika",
    label: "الشركة والمضاربة",
    desc: "الشركات والمضاربة وضوابط الشراكة.",
    href: "/fiqh/books/sharika",
    bookHref: "/fiqh/books/sharika",
    sortOrder: 140,
  },
  qard: {
    id: "qard",
    label: "القرض والدين",
    desc: "القرض الحسن والدين والوفاء.",
    href: "/fiqh/books/qard",
    bookHref: "/fiqh/books/qard",
    sortOrder: 150,
  },
  waqf_hiba: {
    id: "waqf_hiba",
    label: "الوقف والهبة والوصايا",
    desc: "الوقف والهبة والوصية وأحكامها.",
    href: "/fiqh/books/waqf",
    bookHref: "/fiqh/books/waqf",
    sortOrder: 160,
  },
  usrah: {
    id: "usrah",
    label: "الأسرة",
    desc: "أحكام الأسرة العامة والميراث والعشرة.",
    href: "/nikah",
    bookHref: "/fiqh/books/nikah",
    sortOrder: 170,
  },
  nikah: {
    id: "nikah",
    label: "النكاح",
    desc: "عقد النكاح وشروطه والصداق.",
    href: "/nikah",
    bookHref: "/fiqh/books/nikah",
    sortOrder: 180,
  },
  talaq: {
    id: "talaq",
    label: "الطلاق",
    desc: "الطلاق والخلع والرجعة وما يلحق بها.",
    href: "/fiqh/books/talaq",
    bookHref: "/fiqh/books/talaq",
    sortOrder: 190,
  },
  iddah_rida: {
    id: "iddah_rida",
    label: "العِدد والرضاع",
    desc: "العدّة والرضاع وآثارهما.",
    href: "/fiqh/books/iddah",
    bookHref: "/fiqh/books/iddah",
    sortOrder: 200,
  },
  nafaqat: {
    id: "nafaqat",
    label: "النفقات والحضانة",
    desc: "النفقة والحضانة وحقوق الأولاد.",
    href: "/fiqh/books/nafaqat",
    bookHref: "/fiqh/books/nafaqat",
    sortOrder: 210,
  },
  jinayat: {
    id: "jinayat",
    label: "الجنايات والحدود",
    desc: "الحدود والقصاص والديات.",
    href: "/fiqh/books/hudud",
    bookHref: "/fiqh/books/hudud",
    sortOrder: 220,
  },
  qada: {
    id: "qada",
    label: "القضاء والشهادات",
    desc: "القضاء والشهادات والدعوى والإقرار.",
    href: "/fiqh/books/qada",
    bookHref: "/fiqh/books/qada",
    sortOrder: 230,
  },
  nawazil: {
    id: "nawazil",
    label: "النوازل المعاصرة",
    desc: "نوازل العصر عبر قرارات المجامع المعتمدة.",
    href: "/fiqh-council/nawazil",
    sortOrder: 240,
  },
  qawaid: {
    id: "qawaid",
    label: "القواعد الفقهية",
    desc: "القواعد الخمس الكبرى وما يتفرع عنها.",
    href: "/fiqh-qawaid",
    sortOrder: 250,
  },
  usul: {
    id: "usul",
    label: "أصول الفقه",
    desc: "أدلة الأحكام وطرق الاستنباط.",
    href: "/fiqh/usul",
    sortOrder: 260,
  },
  other: {
    id: "other",
    label: "أبواب أخرى",
    desc: "مباحث فقهية لم تُصنَّف ضمن الأبواب السابقة.",
    href: "/fiqh",
    sortOrder: 900,
  },
};

export const FIQH_HUB_DOOR_ORDER: FiqhCanonicalDoor[] = [
  "tahara",
  "salah",
  "zakat",
  "sawm",
  "hajj",
  "muamalat",
  "usrah",
  "jinayat",
];

/** فلاتر الشريط الأفقي — ترتيب العرض المطلوب. */
export const FIQH_FILTER_CHIP_ORDER: Array<FiqhCanonicalDoor | "all"> = [
  "all",
  ...FIQH_HUB_DOOR_ORDER,
];

const FILTER_LABEL_OVERRIDE: Partial<Record<FiqhCanonicalDoor, string>> = {
  hajj: "الحج",
  jinayat: "الجنايات والحدود",
  qada: "القضاء",
};

export function fiqhFilterChipLabel(id: FiqhCanonicalDoor | "all"): string {
  if (id === "all") return "كل الأبواب";
  return FILTER_LABEL_OVERRIDE[id] ?? FIQH_DOOR_META[id].label;
}

/** عند اختيار فلتر تجميعي: يوسّع إلى الأبواب الفرعية. */
const FILTER_DOOR_EXPAND: Partial<Record<FiqhCanonicalDoor, FiqhCanonicalDoor[]>> = {
  muamalat: ["muamalat", "buyu", "riba", "ijara", "sharika", "qard", "waqf_hiba"],
  usrah: ["usrah", "nikah", "talaq", "iddah_rida", "nafaqat"],
  jinayat: ["jinayat"],
  qada: ["qada"],
};

export function expandFiqhFilterDoors(door: FiqhCanonicalDoor | "all"): FiqhCanonicalDoor[] | "all" {
  if (door === "all") return "all";
  return FILTER_DOOR_EXPAND[door] ?? [door];
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
  faraid: "usrah",
  luqata: "muamalat",
  ghasb: "muamalat",
  mawat: "muamalat",
  nikah: "nikah",
  sadaq: "nikah",
  ishra: "usrah",
  khul: "talaq",
  talaq: "talaq",
  raja: "talaq",
  ila: "talaq",
  iddah: "iddah_rida",
  rida: "iddah_rida",
  nafaqat: "nafaqat",
  jinayat: "jinayat",
  diyat: "jinayat",
  qasama: "jinayat",
  hudud: "jinayat",
  bughat: "jinayat",
  jihad: "jinayat",
  jizya: "jinayat",
  qada: "qada",
  shahadat: "qada",
  dawa: "qada",
  iqrar: "qada",
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
