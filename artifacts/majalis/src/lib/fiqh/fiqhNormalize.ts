/**
 * تطبيع أبواب الفقه الثمانية — مصدر واحد للحقيقة في البوابة والفلاتر والبحث.
 */
import {
  getAllFiqhBooks,
  isPublishedLesson,
  publishedChapters,
  publishedLessonsInChapter,
  type FiqhBook,
  type FiqhBookCategory,
  type FiqhLesson,
  type FiqhLessonHit,
  lessonHref,
  lessonPath,
} from "@/lib/fiqh-books";
import { normalizeArabic } from "@/shared/arabic-normalize";

export type FiqhCanonicalDoor =
  | "tahara"
  | "salah"
  | "zakat"
  | "sawm"
  | "hajj"
  | "muamalat"
  | "usrah"
  | "jinayat";

export type FiqhContentStatus = "complete" | "needs_completion" | "under_review";

export const FIQH_DOOR_ORDER: FiqhCanonicalDoor[] = [
  "tahara",
  "salah",
  "zakat",
  "sawm",
  "hajj",
  "muamalat",
  "usrah",
  "jinayat",
];

export type FiqhDoorMeta = {
  id: FiqhCanonicalDoor;
  label: string;
  desc: string;
  href: string;
  bookHref?: string;
};

export const FIQH_DOOR_META: Record<FiqhCanonicalDoor, FiqhDoorMeta> = {
  tahara: {
    id: "tahara",
    label: "الطهارة",
    desc: "الوضوء والغسل والتيمم ونواقض الطهارة بترتيب عملي.",
    href: "/tahara",
    bookHref: "/fiqh/books/taharah",
  },
  salah: {
    id: "salah",
    label: "الصلاة",
    desc: "أركان الصلاة وشروطها وواجباتها وسننها وأوقاتها.",
    href: "/salah-guide",
    bookHref: "/fiqh/books/salah",
  },
  zakat: {
    id: "zakat",
    label: "الزكاة",
    desc: "شروط وجوب الزكاة ونصابها وأنواعها ومصارفها.",
    href: "/zakat",
    bookHref: "/fiqh/books/zakat",
  },
  sawm: {
    id: "sawm",
    label: "الصيام",
    desc: "صيام رمضان والنوافل والقضاء والكفارة والرخص.",
    href: "/sawm",
    bookHref: "/fiqh/books/sawm",
  },
  hajj: {
    id: "hajj",
    label: "الحج",
    desc: "مناسك الحج والعمرة وأركانها وواجباتها ومحرمات الإحرام.",
    href: "/hajj",
    bookHref: "/fiqh/books/hajj",
  },
  muamalat: {
    id: "muamalat",
    label: "المعاملات",
    desc: "البيع والإجارة والشركات والغرر وضوابط الحلال في التجارة.",
    href: "/fiqh/books/buyu",
    bookHref: "/fiqh/books/buyu",
  },
  usrah: {
    id: "usrah",
    label: "الأسرة",
    desc: "النكاح والطلاق والعدة والميراث وحقوق الزوجين والأولاد.",
    href: "/nikah",
    bookHref: "/fiqh/books/nikah",
  },
  jinayat: {
    id: "jinayat",
    label: "الجنايات والحدود",
    desc: "الحدود والقصاص والديات وضوابط الجرائم في الشريعة.",
    href: "/fiqh/books/hudud",
    bookHref: "/fiqh/books/hudud",
  },
};

const BOOK_DOOR_MAP: Record<string, FiqhCanonicalDoor> = {
  taharah: "tahara",
  salah: "salah",
  janaza: "salah",
  zakat: "zakat",
  sawm: "sawm",
  itikaf: "sawm",
  hajj: "hajj",
  udhiya: "hajj",
  ayman: "salah",
  dhaka: "salah",
  libas: "tahara",
  atima: "muamalat",
  buyu: "muamalat",
  riba: "muamalat",
  khiyar: "muamalat",
  salam: "muamalat",
  ijara: "muamalat",
  sharika: "muamalat",
  rahn: "muamalat",
  daman: "muamalat",
  hawala: "muamalat",
  wakala: "muamalat",
  qard: "muamalat",
  shufa: "muamalat",
  musaqa: "muamalat",
  waqf: "muamalat",
  hiba: "muamalat",
  wasaya: "muamalat",
  faraid: "usrah",
  luqata: "muamalat",
  nikah: "usrah",
  sadaq: "usrah",
  ishra: "usrah",
  khul: "usrah",
  talaq: "usrah",
  raja: "usrah",
  ila: "usrah",
  iddah: "usrah",
  rida: "usrah",
  nafaqat: "usrah",
  jinayat: "jinayat",
  diyat: "jinayat",
  qasama: "jinayat",
  hudud: "jinayat",
  bughat: "jinayat",
  jihad: "jinayat",
  jizya: "jinayat",
  qada: "jinayat",
  shahadat: "jinayat",
  dawa: "jinayat",
  iqrar: "jinayat",
};

function categoryFallbackDoor(category: FiqhBookCategory): FiqhCanonicalDoor {
  switch (category) {
    case "muamalat":
      return "muamalat";
    case "usrah":
      return "usrah";
    case "jinayat":
    case "qada":
      return "jinayat";
    default:
      return "tahara";
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
};

function aggregateDoorStatus(statuses: FiqhContentStatus[]): FiqhContentStatus {
  if (statuses.length === 0) return "needs_completion";
  if (statuses.every((s) => s === "complete")) return "complete";
  if (statuses.some((s) => s === "under_review")) return "under_review";
  return "needs_completion";
}

export function buildFiqhDoorSummaries(): FiqhDoorSummary[] {
  const byDoor = new Map<FiqhCanonicalDoor, { issues: number; chapters: Set<string>; statuses: FiqhContentStatus[] }>();
  for (const door of FIQH_DOOR_ORDER) {
    byDoor.set(door, { issues: 0, chapters: new Set(), statuses: [] });
  }

  for (const book of getAllFiqhBooks()) {
    const door = resolveBookDoor(book);
    const bucket = byDoor.get(door)!;
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
    return {
      ...meta,
      issueCount: bucket.issues,
      chapterCount: bucket.chapters.size,
      status: aggregateDoorStatus(bucket.statuses),
    };
  });
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
