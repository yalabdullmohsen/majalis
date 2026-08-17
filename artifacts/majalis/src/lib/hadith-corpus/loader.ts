/**
 * تحميل كسول لشرائح الحديث + كاش ذاكرة خفيف.
 * النصوص الكاملة ليست في الحزمة الابتدائية — تُجلب من public/ عند الطلب.
 */
import type { HadithBookCode } from "./ids";
import { formatHadithId, parseHadithId } from "./ids";
import type { HadithRecord } from "./types";
import sample50 from "../../../content/hadith-corpus/sample-50.json";

const memory = new Map<string, HadithRecord>();

for (const row of sample50 as HadithRecord[]) {
  memory.set(row.id, row);
}

const BOOK_FILE: Partial<Record<HadithBookCode, string>> = {
  bukhari: "/data/hadith/bukhari.json",
  muslim: "/data/hadith/muslim.json",
};

const bookLoaded = new Set<HadithBookCode>();

function mapMirrorHadith(
  book: HadithBookCode,
  n: number,
  t: string,
  chapter?: string,
): HadithRecord {
  const id = formatHadithId(book, n);
  const numberingSystem =
    book === "bukhari" ? "ترقيم فتح الباري" : book === "muslim" ? "ترقيم محمد فؤاد عبد الباقي" : "ترقيم المصدر";
  const grade =
    book === "bukhari" || book === "muslim"
      ? {
          verdict: "صحيح",
          attributedTo: book === "bukhari" ? "البخاري" : "مسلم",
          quote: `صحيح — بإخراجه في صحيح ${book === "bukhari" ? "البخاري" : "مسلم"}`,
          source: numberingSystem,
        }
      : null;
  return {
    id,
    book,
    number: n,
    numberingSystem,
    matn: t,
    chapter: chapter ?? null,
    grade,
    takhrij: id,
    group: "kutub_tisaa",
    isMawdu: false,
  };
}

async function ensureBook(book: HadithBookCode): Promise<void> {
  if (bookLoaded.has(book)) return;
  const url = BOOK_FILE[book];
  if (!url) return;
  const res = await fetch(url);
  if (!res.ok) return;
  const data = (await res.json()) as {
    hadiths?: Array<{ n: number; t: string; chapter?: string }>;
  };
  for (const h of data.hadiths ?? []) {
    const rec = mapMirrorHadith(book, h.n, h.t, h.chapter);
    if (!memory.has(rec.id)) memory.set(rec.id, rec);
  }
  bookLoaded.add(book);
}

export function getHadithFromMemory(id: string): HadithRecord | null {
  return memory.get(id) ?? null;
}

export async function getHadithById(rawId: string): Promise<HadithRecord | null> {
  const parsed = parseHadithId(rawId);
  if (!parsed) return null;
  const id = formatHadithId(parsed.book, parsed.number);
  const cached = memory.get(id);
  if (cached) return cached;
  await ensureBook(parsed.book);
  return memory.get(id) ?? null;
}

export function listSampleHadithIds(): string[] {
  return (sample50 as HadithRecord[]).map((h) => h.id);
}
