/** معرّفات الحديث الثابتة: `<رمز الكتاب>:<رقم>` مثل bukhari:1 */

export const HADITH_BOOK_CODES = [
  "bukhari",
  "muslim",
  "abudawud",
  "tirmidhi",
  "nasai",
  "ibnmajah",
  "malik",
  "ahmad",
  "darimi",
  "mawdu",
  "daif",
] as const;

export type HadithBookCode = (typeof HADITH_BOOK_CODES)[number];

const BOOK_SET = new Set<string>(HADITH_BOOK_CODES);

export function isHadithBookCode(v: string): v is HadithBookCode {
  return BOOK_SET.has(v);
}

/** يفكّ `bukhari:1` أو `BUKHARI:1` أو مسار مرمّز */
export function parseHadithId(raw: string): { book: HadithBookCode; number: number } | null {
  const decoded = decodeURIComponent(String(raw || "").trim());
  const m = decoded.match(/^([a-zA-Z]+)\s*:\s*(\d{1,5})$/);
  if (!m) return null;
  const book = m[1].toLowerCase();
  if (!isHadithBookCode(book)) return null;
  const number = Number(m[2]);
  if (!Number.isFinite(number) || number < 1) return null;
  return { book, number };
}

export function formatHadithId(book: HadithBookCode, number: number): string {
  return `${book}:${number}`;
}

export function hadithHref(id: string): string {
  return `/hadith/${id}`;
}
