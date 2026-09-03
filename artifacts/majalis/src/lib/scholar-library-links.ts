/**
 * ربط عناوين مؤلفات العلماء بالبحث عند تطابق موثوق مع فهرس المراجع.
 * لا يغيّر بيانات العلماء — يطابق النص المعروض فقط. المسار العلني `/library` محوَّل.
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

/** ألقابٌ وأدواتُ نَسَبٍ لا تحمل تمييزاً بين عالمٍ وآخر البتّة. */
const TITLE_TOKENS = new Set([
  "الامام", "الشيخ", "الحافظ", "العلامه", "القاضي", "شيخ", "الاسلام", "حجه",
  "الدكتور", "الشريف", "ابو", "ابي", "ابن", "بن", "بنت", "الدين", "الحرمين",
]);

/**
 * أجزاءُ أسماءٍ شائعة تشترك فيها مئاتُ التراجم («الإمام أحمد بن حنبل» و«الإمام
 * أحمد الدردير»)، فلا يُبنى عليها قبولُ نسبةٍ ما دام في الاسم جزءٌ أميز منها.
 */
const COMMON_NAME_TOKENS = new Set(["محمد", "احمد", "علي", "عبد", "الله", "حسن", "حسين"]);

function authorTokens(value: string): string[] {
  return normalizeTitle(value)
    .split(" ")
    .filter((t) => t.length >= 3 && !TITLE_TOKENS.has(t))
    // «ابن القيم» في ترجمة العالم و«ابن قيم الجوزية» في الفهرس اسمٌ واحد
    .map((t) => (t.startsWith("ال") && t.length > 4 ? t.slice(2) : t));
}

function shares(a: string[], b: string[]): boolean {
  return a.some((t) =>
    b.some((u) => u === t || (Math.min(t.length, u.length) >= 5 && (u.includes(t) || t.includes(u)))),
  );
}

/**
 * هل يشترك اسمُ صاحب العمل مع مؤلِّف الكتاب في جزءٍ مميِّز؟
 * تُستدعى عند وجود قرينةِ نسبةٍ فقط؛ فحيثُ لا قرينة (تخريجُ حديثٍ أو مصدرُ
 * دليل) يبقى الحكم على العنوان وحده. والنسبةُ الخاطئة أسوأ من غياب الرابط.
 * وتُقاس الموافقة على الأجزاء المميِّزة، فإن خلا أحدُ الطرفين منها (كـ«الإمام
 * أحمد») رُجع إلى الأجزاء كلِّها حتى لا يسقط رابطٌ صحيح.
 */
function authorAgrees(bookAuthor: string, hint?: string): boolean {
  if (!hint) return true;
  const wanted = authorTokens(hint);
  const actual = authorTokens(bookAuthor);
  if (wanted.length === 0 || actual.length === 0) return true;
  const wantedDistinct = wanted.filter((t) => !COMMON_NAME_TOKENS.has(t));
  const actualDistinct = actual.filter((t) => !COMMON_NAME_TOKENS.has(t));
  if (wantedDistinct.length > 0 && actualDistinct.length > 0) {
    return shares(wantedDistinct, actualDistinct);
  }
  return shares(wanted, actual);
}

/**
 * @param work عنوان العمل كما يُعرض.
 * @param authorHint اسم صاحب العمل إن كان معلوماً (صفحةُ عالمٍ مثلاً) —
 *   يمنع إحالةَ «السنن الكبرى» للنسائي إلى سنن البيهقي، و«الزهد» لأحمد إلى
 *   زهد ابن المبارك، وهي عناوين متجانسة لمؤلِّفين مختلفين في الفهرس نفسه.
 */
export function resolveScholarWorkLink(work: string, authorHint?: string): ScholarWorkLink {
  const label = work.trim();
  if (!label) return { label, bookId: null, href: null };

  const candidates = [label, workCore(label)];
  for (const raw of candidates) {
    const key = normalizeTitle(raw);
    const exact = CATALOG_BY_NORM.get(key);
    if (exact && authorAgrees(exact.author, authorHint)) {
      return { label, bookId: exact.id, href: `/search?q=${encodeURIComponent(exact.title)}` };
    }
  }

  // تطابق جزئي حذر: يُشترط أن يكون أحد العنوانين جزءاً متّصلاً من الآخر
  // وأن يبلغ الأقصرُ ٦٠٪ من الأطول — فبدون هذه النسبة تلتقط «الفوائد»
  // كلَّ «الفوائد في مشكل القرآن»، و«كتاب التوحيد» شرحَه لا أصلَه.
  const coreKey = normalizeTitle(workCore(label));
  if (coreKey.length >= 8) {
    let best: LibraryBook | null = null;
    let bestScore = 0;
    for (const book of LIBRARY_CATALOG) {
      const titleKey = normalizeTitle(book.title);
      if (titleKey.length < 8) continue;
      if (!coreKey.includes(titleKey) && !titleKey.includes(coreKey)) continue;
      const shorter = Math.min(coreKey.length, titleKey.length);
      const longer = Math.max(coreKey.length, titleKey.length);
      if (shorter / longer < 0.6) continue;
      if (!authorAgrees(book.author, authorHint)) continue;
      if (shorter > bestScore) {
        best = book;
        bestScore = shorter;
      }
    }
    if (best) {
      return { label, bookId: best.id, href: `/search?q=${encodeURIComponent(best.title)}` };
    }
  }

  return { label, bookId: null, href: null };
}

export function resolveScholarWorks(works: string[], authorHint?: string): ScholarWorkLink[] {
  return works.map((w) => resolveScholarWorkLink(w, authorHint));
}
