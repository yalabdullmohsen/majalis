/**
 * فهرس بحث قرآني محلي — بدون شبكة بعد التحميل الأول.
 * يتجاهل التشكيل والهمزات، ويدعم السورة/الآية/الجزء/جذر تقريبي.
 */
import { normalizeArabic } from "@/shared/arabic-normalize";
import { getSurahList, getSurahMeta, fetchSurahDetail, type SearchMatch } from "@/lib/quran-api";
import { yieldToMain } from "@/lib/yield-to-main";

export type QuranSearchHit = SearchMatch & {
  juz: number;
  page: number;
  /** مقاطع الاستعلام المطابقة داخل النص (بعد التطبيع) لتمييزها في الواجهة. */
  matchRanges: { start: number; end: number }[];
};

type IndexEntry = {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
  normalized: string;
  stem: string;
  juz: number;
  page: number;
};

let indexPromise: Promise<IndexEntry[]> | null = null;
let indexCache: IndexEntry[] | null = null;

/** جذر تقريبي خفيف: إسقاط أل التعريف والأحرف الزائدة الشائعة دون معجم صرفي كامل. */
export function approximateStem(normalized: string): string {
  let s = normalized.trim();
  if (!s) return "";
  s = s.replace(/^ال/, "");
  s = s.replace(/^[وفبكل]/, "");
  s = s.replace(/^(ال)/, "");
  s = s.replace(/(ات|ان|ين|ون|ة|ه|ي|ا)$/g, "");
  return s;
}

function rangesInNormalized(hay: string, needle: string): { start: number; end: number }[] {
  if (!needle || !hay) return [];
  const out: { start: number; end: number }[] = [];
  let from = 0;
  while (from < hay.length) {
    const i = hay.indexOf(needle, from);
    if (i < 0) break;
    out.push({ start: i, end: i + needle.length });
    from = i + Math.max(1, needle.length);
    if (out.length >= 8) break;
  }
  return out;
}

async function buildIndex(signal?: AbortSignal): Promise<IndexEntry[]> {
  if (indexCache) return indexCache;
  const entries: IndexEntry[] = [];
  const surahs = getSurahList();
  for (let i = 0; i < surahs.length; i++) {
    if (signal?.aborted) throw new DOMException("aborted", "AbortError");
    const meta = surahs[i]!;
    try {
      const detail = await fetchSurahDetail(meta.number);
      for (const a of detail.ayahs) {
        const normalized = normalizeArabic(a.text);
        entries.push({
          surahNumber: meta.number,
          surahName: meta.name,
          ayahNumber: a.numberInSurah,
          text: a.text,
          normalized,
          stem: approximateStem(normalized),
          juz: a.juz ?? 1,
          page: a.page ?? 1,
        });
      }
    } catch {
      /* سورة واحدة فاشلة لا تُسقط الفهرس كله */
    }
    if (i % 3 === 2) await yieldToMain();
  }
  indexCache = entries;
  return entries;
}

/** يبدأ بناء الفهرس في الخلفية دون حجب الواجهة. */
export function warmQuranSearchIndex(signal?: AbortSignal): Promise<IndexEntry[]> {
  if (!indexPromise) {
    indexPromise = buildIndex(signal).catch((err) => {
      indexPromise = null;
      throw err;
    });
  }
  return indexPromise;
}

export function isQuranSearchIndexReady(): boolean {
  return indexCache != null;
}

type ParsedQuery =
  | { kind: "ref"; surah: number; ayah?: number }
  | { kind: "juz"; juz: number }
  | { kind: "page"; page: number }
  | { kind: "text"; raw: string };

function parseStructuredQuery(q: string): ParsedQuery {
  const trimmed = q.trim();
  const pageM = trimmed.match(/^(?:صفحة|ص|page)\s*[:\s]?\s*(\d{1,3})$/i);
  if (pageM) return { kind: "page", page: Number(pageM[1]) };

  const juzM = trimmed.match(/^(?:جزء|جز|juz)\s*[:\s]?\s*(\d{1,2})$/i);
  if (juzM) return { kind: "juz", juz: Number(juzM[1]) };

  const colon = trimmed.match(/^(\d{1,3})\s*[:：]\s*(\d{1,3})$/);
  if (colon) return { kind: "ref", surah: Number(colon[1]), ayah: Number(colon[2]) };

  const numOnly = trimmed.match(/^(\d{1,3})$/);
  if (numOnly) {
    const n = Number(numOnly[1]);
    if (n >= 1 && n <= 114) return { kind: "ref", surah: n };
    if (n >= 1 && n <= 604) return { kind: "page", page: n };
  }

  // سورة البقرة 255 / البقرة:255
  const nameAyah = trimmed.match(/^(.+?)\s*[:：\s]\s*(\d{1,3})$/);
  if (nameAyah) {
    const nameN = normalizeArabic(nameAyah[1]!);
    const surah = getSurahList().find((s) => normalizeArabic(s.name).includes(nameN) || nameN.includes(normalizeArabic(s.name)));
    if (surah) return { kind: "ref", surah: surah.number, ayah: Number(nameAyah[2]) };
  }

  const nameOnly = normalizeArabic(trimmed);
  if (nameOnly.length >= 2) {
    const surah = getSurahList().find((s) => {
      const sn = normalizeArabic(s.name);
      return sn === nameOnly || sn.includes(nameOnly) || nameOnly.includes(sn);
    });
    if (surah && nameOnly.length >= 3) return { kind: "ref", surah: surah.number };
  }

  return { kind: "text", raw: trimmed };
}

function scoreHit(entry: IndexEntry, needles: string[], stemNeedles: string[]): number {
  let score = 0;
  for (const n of needles) {
    if (!n) continue;
    if (entry.normalized === n) score += 100;
    else if (entry.normalized.startsWith(n)) score += 40;
    else if (entry.normalized.includes(n)) score += 25;
  }
  for (const sn of stemNeedles) {
    if (sn.length >= 3 && entry.stem.includes(sn)) score += 15;
  }
  return score;
}

/**
 * بحث فوري محلّي. يبني الفهرس عند أول استدعاء ثم يعيد استخدامه.
 */
export async function searchQuranLocal(
  query: string,
  opts: { limit?: number; signal?: AbortSignal } = {},
): Promise<QuranSearchHit[]> {
  const limit = opts.limit ?? 40;
  const q = query.trim();
  if (!q) return [];

  const index = await warmQuranSearchIndex(opts.signal);
  if (opts.signal?.aborted) return [];

  const parsed = parseStructuredQuery(q);
  if (parsed.kind === "page") {
    return index
      .filter((e) => e.page === parsed.page)
      .slice(0, limit)
      .map((e) => ({
        surahNumber: e.surahNumber,
        surahName: e.surahName,
        ayahNumber: e.ayahNumber,
        text: e.text,
        juz: e.juz,
        page: e.page,
        matchRanges: [],
      }));
  }
  if (parsed.kind === "juz") {
    return index
      .filter((e) => e.juz === parsed.juz)
      .slice(0, limit)
      .map((e) => ({
        surahNumber: e.surahNumber,
        surahName: e.surahName,
        ayahNumber: e.ayahNumber,
        text: e.text,
        juz: e.juz,
        page: e.page,
        matchRanges: [],
      }));
  }
  if (parsed.kind === "ref") {
    const hits = index.filter((e) => {
      if (e.surahNumber !== parsed.surah) return false;
      return parsed.ayah == null || e.ayahNumber === parsed.ayah;
    });
    return hits.slice(0, limit).map((e) => ({
      surahNumber: e.surahNumber,
      surahName: e.surahName,
      ayahNumber: e.ayahNumber,
      text: e.text,
      juz: e.juz,
      page: e.page,
      matchRanges: [],
    }));
  }

  const needles = normalizeArabic(parsed.raw)
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (needles.length === 0) return [];
  const stemNeedles = needles.map(approximateStem).filter((t) => t.length >= 3);

  const scored: { entry: IndexEntry; score: number }[] = [];
  for (const entry of index) {
    const score = scoreHit(entry, needles, stemNeedles);
    if (score > 0) scored.push({ entry, score });
  }
  scored.sort((a, b) => b.score - a.score || a.entry.surahNumber - b.entry.surahNumber || a.entry.ayahNumber - b.entry.ayahNumber);

  return scored.slice(0, limit).map(({ entry }) => {
    const primary = needles.reduce((best, n) => (n.length > best.length ? n : best), "");
    return {
      surahNumber: entry.surahNumber,
      surahName: entry.surahName,
      ayahNumber: entry.ayahNumber,
      text: entry.text,
      juz: entry.juz,
      page: entry.page,
      matchRanges: rangesInNormalized(entry.normalized, primary),
    };
  });
}

/** تمييز كلمات مطابقة في النص المعروض (تقريبي عبر تطبيع كل كلمة). */
export function highlightSearchText(text: string, query: string): { text: string; hit: boolean }[] {
  const needles = normalizeArabic(query)
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (needles.length === 0) return [{ text, hit: false }];

  const parts = text.split(/(\s+)/);
  return parts.map((part) => {
    if (/^\s+$/.test(part)) return { text: part, hit: false };
    const n = normalizeArabic(part);
    const hit = needles.some((needle) => n.includes(needle) || approximateStem(n).includes(approximateStem(needle)));
    return { text: part, hit };
  });
}

export function describeSearchHint(surahNumber: number, ayahNumber: number): string {
  try {
    return `${getSurahMeta(surahNumber).name} ${ayahNumber}`;
  } catch {
    return `${surahNumber}:${ayahNumber}`;
  }
}
