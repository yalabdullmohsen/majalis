export type LibraryChapter = {
  id: string;
  title: string;
  paragraphs: string[];
  children?: LibraryChapter[];
  placeholder?: boolean;
};

export type LibrarySection = {
  id: string;
  title: string;
  chapters: LibraryChapter[];
};

export type LibraryBook = {
  id: string;
  slug: string;
  title: string;
  author: string;
  category: string;
  type: string;
  description: string;
  externalUrl?: string;
  coverHue: number;
  sections: LibrarySection[];
};

export type LibraryBookSummary = Pick<
  LibraryBook,
  "id" | "slug" | "title" | "author" | "category" | "type" | "description" | "coverHue"
> & { chapterCount: number };

export type LibrarySearchHit = {
  bookSlug: string;
  bookTitle: string;
  chapterId: string;
  chapterTitle: string;
  snippet: string;
};
