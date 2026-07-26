/**
 * ربط عناوين مؤلفات العلماء بصفحات المكتبة عند تطابق موثوق.
 * لا يغيّر بيانات العلماء — يطابق النص المعروض فقط مع فهرس المكتبة.
 */
import { LIBRARY_CATALOG, type LibraryBook } from "@/lib/library-catalog";

function normalizeTitle(value: string): string {
  return value
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const CATALOG_BY_NORM = new Map<string, LibraryBook>();
for (const book of LIBRARY_CATALOG) {
  const key = normalizeTitle(book.title);
  if (key && !CATALOG_BY_NORM.has(key)) CATALOG_BY_NORM.set(key, book);
  for (const kw of book.keywords) {
    const kk = normalizeTitle(kw);
    if (kk.length >= 4 && !CATALOG_BY_NORM.has(kk)) CATALOG_BY_NORM.set(kk, book);
  }
}

/** يزيل بادئات شائعة مثل «كتاب» أو أقواس الشرح. */
function workCore(work: string): string {
  return work
    .replace(/^\s*كتاب\s+/i, "")
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .replace(/\s*—\s*.*$/, "")
    .trim();
}

export type ScholarWorkLink = {
  label: string;
  bookId: string | null;
  href: string | null;
};

export function resolveScholarWorkLink(work: string): ScholarWorkLink {
  const label = work.trim();
  if (!label) return { label, bookId: null, href: null };

  const candidates = [label, workCore(label)];
  for (const raw of candidates) {
    const key = normalizeTitle(raw);
    const exact = CATALOG_BY_NORM.get(key);
    if (exact) {
      return { label, bookId: exact.id, href: `/library/${exact.id}` };
    }
  }

  // تطابق جزئي حذر: عنوان المكتبة ⊆ العمل أو العكس بطول كافٍ
  const coreKey = normalizeTitle(workCore(label));
  if (coreKey.length >= 4) {
    let best: LibraryBook | null = null;
    let bestScore = 0;
    for (const book of LIBRARY_CATALOG) {
      const titleKey = normalizeTitle(book.title);
      if (titleKey.length < 4) continue;
      if (coreKey.includes(titleKey) || titleKey.includes(coreKey)) {
        const score = Math.min(coreKey.length, titleKey.length);
        if (score > bestScore) {
          best = book;
          bestScore = score;
        }
        continue;
      }
      // كلمة جوهرية مشتركة طويلة (مثل «موطأ» داخل «موطا الامام مالك»)
      const coreTokens = coreKey.split(" ").filter((t) => t.length >= 4);
      const titleTokens = titleKey.split(" ").filter((t) => t.length >= 4);
      const hit = coreTokens.find((t) => titleTokens.some((tt) => tt.includes(t) || t.includes(tt)));
      if (hit && hit.length > bestScore) {
        best = book;
        bestScore = hit.length;
      }
    }
    if (best && bestScore >= 4) {
      return { label, bookId: best.id, href: `/library/${best.id}` };
    }
  }

  return { label, bookId: null, href: null };
}

export function resolveScholarWorks(works: string[]): ScholarWorkLink[] {
  return works.map(resolveScholarWorkLink);
}
