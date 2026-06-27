import type { LibraryBook, LibraryChapter, LibrarySection } from "./types";

const PLACEHOLDER_TEXT =
  "سيتم إضافة المحتوى الكامل لهذا الباب قريباً إن شاء الله. يمكنك حالياً الاطلاع على المقدمة والفهرس، أو زيارة المصدر الخارجي إن وُجد.";

export function placeholderParagraphs(intro?: string): string[] {
  return [intro || PLACEHOLDER_TEXT];
}

export function chapter(
  id: string,
  title: string,
  paragraphs?: string[],
  opts?: { placeholder?: boolean; children?: LibraryChapter[] },
): LibraryChapter {
  return {
    id,
    title,
    paragraphs: paragraphs?.length ? paragraphs : placeholderParagraphs(),
    placeholder: opts?.placeholder ?? !paragraphs?.length,
    children: opts?.children,
  };
}

export function section(id: string, title: string, chapters: LibraryChapter[]): LibrarySection {
  return { id, title, chapters };
}

export function introSection(intro: string[]): LibrarySection {
  return section("intro", "المقدمة", [
    chapter("intro-main", "مقدمة الكتاب", intro),
  ]);
}

export function babSection(
  sectionId: string,
  sectionTitle: string,
  babs: { id: string; title: string; content?: string[] }[],
): LibrarySection {
  return section(
    sectionId,
    sectionTitle,
    babs.map((b) => chapter(b.id, b.title, b.content, { placeholder: !b.content?.length })),
  );
}

export function flattenChapters(sections: LibrarySection[]): LibraryChapter[] {
  const out: LibraryChapter[] = [];
  const walk = (nodes: LibraryChapter[]) => {
    for (const n of nodes) {
      out.push(n);
      if (n.children?.length) walk(n.children);
    }
  };
  for (const s of sections) walk(s.chapters);
  return out;
}

export function countChapters(book: LibraryBook): number {
  return flattenChapters(book.sections).length;
}

export function createBook(input: {
  id: string;
  slug: string;
  title: string;
  author: string;
  category: string;
  type?: string;
  description: string;
  externalUrl?: string;
  coverHue?: number;
  sections: LibrarySection[];
}): LibraryBook {
  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    author: input.author,
    category: input.category,
    type: input.type || "كتاب",
    description: input.description,
    externalUrl: input.externalUrl,
    coverHue: input.coverHue ?? hashHue(input.slug),
    sections: input.sections,
  };
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export function findChapter(book: LibraryBook, chapterId: string): LibraryChapter | undefined {
  let found: LibraryChapter | undefined;
  const walk = (nodes: LibraryChapter[]) => {
    for (const n of nodes) {
      if (n.id === chapterId) found = n;
      if (n.children?.length) walk(n.children);
    }
  };
  for (const s of book.sections) walk(s.chapters);
  return found;
}

export function findChapterPath(book: LibraryBook, chapterId: string): string[] {
  const path: string[] = [];
  const walk = (nodes: LibraryChapter[], trail: string[]): boolean => {
    for (const n of nodes) {
      const next = [...trail, n.title];
      if (n.id === chapterId) {
        path.push(...next);
        return true;
      }
      if (n.children?.length && walk(n.children, next)) return true;
    }
    return false;
  };
  for (const s of book.sections) {
    if (walk(s.chapters, [s.title])) break;
  }
  return path;
}
