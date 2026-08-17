/**
 * مصدر واحد لوثائق البحث الآتية من السجل والتنقّل والفقه.
 * يستهلكه مولّد الفهرس وقت البناء وبوابة التغطية.
 */
import { SECTIONS } from "@/config/sections.registry";
import { PUBLIC_NAV_ITEMS } from "@/lib/navigation";
import {
  FIQH_SUPPORTING_TOPICS,
  publishedBooks,
  publishedChapters,
  publishedLessonsInChapter,
} from "@/lib/fiqh-books";

export type SearchIndexSeed = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  keywords: string[];
  route: string;
  sectionPath?: string;
  body?: string;
};

function cleanRoute(route: string): string {
  return String(route || "").split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
}

/** وثائق السجل + التنقّل العام + كتب/أبواب/مسائل الفقه. */
export function collectNavSearchDocs(): SearchIndexSeed[] {
  const out: SearchIndexSeed[] = [];
  const seen = new Set<string>();

  const push = (doc: SearchIndexSeed) => {
    const route = cleanRoute(doc.route);
    const id = doc.id;
    if (!doc.title || !route || seen.has(id)) return;
    seen.add(id);
    out.push({ ...doc, route });
  };

  for (const s of SECTIONS) {
    push({
      id: `section:${s.id}`,
      type: "section",
      title: s.label,
      subtitle: s.subtitle,
      keywords: [...s.keywords, ...(s.aliases ?? []), s.navLabel ?? ""].filter(Boolean),
      route: s.route,
      sectionPath: s.group,
      body: s.subtitle,
    });
  }

  for (const item of PUBLIC_NAV_ITEMS) {
    push({
      id: `nav:${cleanRoute(item.href)}`,
      type: "section",
      title: item.label,
      subtitle: item.description,
      keywords: [item.label, item.description ?? ""],
      route: item.href,
      body: item.description,
    });
  }

  for (const book of publishedBooks()) {
    push({
      id: `fiqh-book:${book.id}`,
      type: "book",
      title: book.title,
      keywords: ["فقه", "كتاب", book.category],
      route: `/fiqh/books/${book.id}`,
      sectionPath: "fiqh",
    });
    for (const chapter of publishedChapters(book)) {
      push({
        id: `fiqh-chapter:${book.id}:${chapter.id}`,
        type: "fiqh",
        title: chapter.title,
        subtitle: book.title,
        keywords: ["فقه", "باب", book.title],
        route: `/fiqh/books/${book.id}#${chapter.id}`,
        sectionPath: `fiqh/${book.id}`,
      });
      for (const lesson of publishedLessonsInChapter(chapter)) {
        push({
          id: `fiqh-masala:${lesson.id}`,
          type: "fiqh",
          title: lesson.title,
          subtitle: `${book.title} · ${chapter.title}`,
          keywords: ["فقه", "مسألة", book.title, chapter.title],
          route: `/fiqh/books/${book.id}/lessons/${lesson.id}`,
          sectionPath: `fiqh/${book.id}/${chapter.id}`,
          body: (lesson.summary || "").slice(0, 180),
        });
      }
    }
  }

  for (const t of FIQH_SUPPORTING_TOPICS) {
    push({
      id: `fiqh-support:${t.id}`,
      type: "fiqh",
      title: t.title,
      subtitle: t.desc,
      keywords: ["فقه", t.title],
      route: t.href,
      sectionPath: "fiqh",
      body: t.desc,
    });
  }

  return out;
}

export function requiredSearchRoutes(): string[] {
  const routes = new Set<string>();
  for (const s of SECTIONS) routes.add(cleanRoute(s.route));
  for (const item of PUBLIC_NAV_ITEMS) routes.add(cleanRoute(item.href));
  return [...routes].sort();
}

export { cleanRoute as cleanSearchRoute };
