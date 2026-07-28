/**
 * V8 monomorphic hot-path helpers — stable object shapes for verse/search loops.
 * Avoids hidden-class transitions by always writing the same property set in order.
 * Logic-only — no UI.
 */

export type CharType = "word" | "end" | "pause" | "other";

/** Normalize open string char types to a closed union (stable hidden class). */
export function normalizeCharType(raw: unknown): CharType {
  const s = typeof raw === "string" ? raw.toLowerCase() : "";
  if (s === "word" || s === "end" || s === "pause") return s;
  return "other";
}

/**
 * Factory that always returns objects with identical property order/keys.
 * Call sites must not add ad-hoc fields afterward in hot loops.
 */
export function makeQpcWordShape(input: {
  id: number;
  position: number;
  lineNumber: number;
  charType: CharType;
  textUthmani: string;
  textQpcHafs: string;
  glyphText: string;
  audioUrl: string | null;
  verseKey: string;
  sajdahNumber: number | null;
}): {
  id: number;
  position: number;
  lineNumber: number;
  charType: CharType;
  textUthmani: string;
  textQpcHafs: string;
  glyphText: string;
  audioUrl: string | null;
  verseKey: string;
  sajdahNumber: number | null;
} {
  // Property order fixed — V8 monomorphic
  return {
    id: input.id | 0,
    position: input.position | 0,
    lineNumber: input.lineNumber | 0,
    charType: input.charType,
    textUthmani: input.textUthmani || "",
    textQpcHafs: input.textQpcHafs || "",
    glyphText: input.glyphText || "",
    audioUrl: input.audioUrl,
    verseKey: input.verseKey || "",
    sajdahNumber: input.sajdahNumber,
  };
}

export function makeQpcVerseShape(input: {
  verseKey: string;
  surahNumber: number;
  ayahNumber: number;
  pageNumber: number;
  juzNumber: number;
  hizbNumber: number;
  rubElHizbNumber: number;
  sajdahNumber: number | null;
  words: ReturnType<typeof makeQpcWordShape>[];
}): {
  verseKey: string;
  surahNumber: number;
  ayahNumber: number;
  pageNumber: number;
  juzNumber: number;
  hizbNumber: number;
  rubElHizbNumber: number;
  sajdahNumber: number | null;
  words: ReturnType<typeof makeQpcWordShape>[];
} {
  return {
    verseKey: input.verseKey || "",
    surahNumber: input.surahNumber | 0,
    ayahNumber: input.ayahNumber | 0,
    pageNumber: input.pageNumber | 0,
    juzNumber: input.juzNumber | 0,
    hizbNumber: input.hizbNumber | 0,
    rubElHizbNumber: input.rubElHizbNumber | 0,
    sajdahNumber: input.sajdahNumber,
    words: input.words,
  };
}

/** Stable bookmark lookup key — avoids polymorphic string concat shapes in loops. */
export function bookmarkLookupKey(contentType: string, contentId: string): string {
  return contentType + "\0" + contentId;
}

/**
 * Build a Map index once; O(1) lookups stay monomorphic on Map.get.
 */
export function indexByKey<T>(
  items: readonly T[],
  getKey: (item: T) => string,
): Map<string, T> {
  const map = new Map<string, T>();
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    map.set(getKey(item), item);
  }
  return map;
}
