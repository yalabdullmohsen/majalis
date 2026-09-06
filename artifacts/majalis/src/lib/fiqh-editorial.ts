/**
 * طبقة عرض تحريرية لكتب/أبواب الفقه — لا تضيف أحكامًا جديدة.
 * تستخرج العنوان الفرعي والموضوعات من الحقول الموجودة مع إزالة تكرار العنوان.
 */
import {
  FIQH_CATEGORY_LABELS,
  fiqhBookBlurb,
  fiqhBookCounts,
  publishedChapters,
  publishedLessonsInChapter,
  type FiqhBook,
  type FiqhChapter,
} from "@/lib/fiqh-books";

const MADHHAB_BADGE = "حنبلي";

/** أزل تكرار العنوان في بداية النص دون حذف المعنى. */
export function stripLeadingTitle(text: string | undefined | null, title: string): string {
  let out = (text ?? "").trim();
  if (!out || !title.trim()) return out;

  const variants = [
    title.trim(),
    title.replace(/^باب\s+/u, "").trim(),
    title.replace(/^كتاب\s+/u, "").trim(),
  ].filter(Boolean);

  for (const v of variants) {
    if (!v) continue;
    const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out
      .replace(new RegExp(`^(?:باب\\s+)?${escaped}(?:\\s*[:：\\-–—،]?\\s*)+`, "u"), "")
      .replace(new RegExp(`^${escaped}(?=\\s+بابٌ|\\s+باب\\b)`, "u"), "")
      .trim();
  }

  // «باب المياه بابٌ من أبواب…» → ابدأ من «بابٌ» أو ما بعده إن بقي تكرار صريح.
  out = out.replace(/^(?:بابٌ|بابًا)\s+من\s+أبواب\s+/u, "بابٌ من أبواب ").trim();
  return out.replace(/^[\s:：\-–—،]+/u, "").trim();
}

function topicLabel(title: string): string {
  return title.replace(/^كتاب\s+/u, "").replace(/^باب\s+/u, "").trim() || title;
}

export type FiqhBookEditorial = {
  title: string;
  subtitle: string;
  description: string;
  keyTopics: string[];
  chaptersCount: number;
  lessonsCount: number;
  categoryLabel: string;
  madhhabBadge: string;
  orderReason?: string;
};

export function fiqhBookEditorial(book: FiqhBook): FiqhBookEditorial {
  const counts = fiqhBookCounts(book);
  const description = fiqhBookBlurb(book);
  const subtitle = `${FIQH_CATEGORY_LABELS[book.category]} · المذهب ${MADHHAB_BADGE}`;
  const keyTopics = publishedChapters(book)
    .slice(0, 6)
    .map((ch) => topicLabel(ch.title))
    .filter(Boolean);

  return {
    title: book.title,
    subtitle,
    description,
    keyTopics,
    chaptersCount: counts.chapters,
    lessonsCount: counts.lessons,
    categoryLabel: FIQH_CATEGORY_LABELS[book.category],
    madhhabBadge: MADHHAB_BADGE,
    orderReason: book.orderReason?.trim() || undefined,
  };
}

export type FiqhChapterEditorial = {
  title: string;
  bookTitle: string;
  bookBadge: string;
  definition: string;
  learnings: string[];
  topics: string[];
  summary: string;
  notes: string;
  evidence: string;
  lessonsCount: number;
  chapterIndex: number;
  chaptersTotal: number;
};

export function fiqhChapterEditorial(
  book: FiqhBook,
  chapter: FiqhChapter,
  chapterIndex = 0,
  chaptersTotal = 0,
): FiqhChapterEditorial {
  const definition = stripLeadingTitle(chapter.definition, chapter.title);
  const summary = stripLeadingTitle(chapter.summary, chapter.title);
  const notes = stripLeadingTitle(chapter.notes, chapter.title);
  const evidence = (chapter.evidence ?? "").trim();
  const topics = (chapter.topics ?? [])
    .map((t) => stripLeadingTitle(t, chapter.title))
    .map((t) => t.trim())
    .filter(Boolean);

  const learnings =
    topics.length > 0
      ? topics.slice(0, 5)
      : definition
        ? [`مدخل «${topicLabel(chapter.title)}» وحدود الباب باختصار.`]
        : [];

  return {
    title: chapter.title,
    bookTitle: book.title,
    bookBadge: book.title.replace(/^كتاب\s+/u, "") || book.title,
    definition:
      definition ||
      `مدخل موجز لباب «${topicLabel(chapter.title)}» ضمن ${book.title} على طريقة المذهب الحنبلي.`,
    learnings,
    topics,
    summary,
    notes,
    evidence,
    lessonsCount: publishedLessonsInChapter(chapter).length,
    chapterIndex,
    chaptersTotal,
  };
}

export function chapterPreviewText(chapter: FiqhChapter): string {
  const raw = stripLeadingTitle(chapter.summary || chapter.definition, chapter.title);
  if (!raw) return "اضغط لعرض مسائل الباب.";
  if (raw.length <= 110) return raw;
  const cut = raw.slice(0, 100);
  const at = Math.max(cut.lastIndexOf("،"), cut.lastIndexOf(" "));
  return `${(at > 40 ? cut.slice(0, at) : cut).trim()}…`;
}
