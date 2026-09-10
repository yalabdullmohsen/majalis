/**
 * QuranSearchEngine — بحث محلّي؛ التطبيع للمطابقة فقط دون تغيير النص الأصلي المعروض.
 */

import { normalizeArabic } from "@/lib/arabic-search";
import { getSurahMeta, JUZ_START_PAGES, SURAH_START_PAGES } from "@/lib/quran-api";
import {
  clampMushafPage,
  MUSHAF_PAGE_MAX,
  MUSHAF_PAGE_MIN,
  parseMushafPageQuery,
} from "@/lib/quran-last-page";
import {
  searchVersesInCorpus,
  type QuranVerseSearchItem,
} from "@/lib/quran-search-verses";
import { QuranDataSource } from "./QuranDataSource";

export type QuranSearchHit = {
  kind: "verse" | "surah" | "page" | "juz";
  surahId?: number;
  ayahNumber?: number;
  page: number;
  label: string;
  snippet?: string;
};

export type QuranSearchParse =
  | { type: "page"; page: number }
  | { type: "juz"; juz: number; page: number }
  | { type: "surahAyah"; surah: number; ayah: number }
  | { type: "text"; query: string };

let searchSeq = 0;

function toLatinDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

export function parseQuranSearchInput(raw: string): QuranSearchParse {
  const q = raw.trim();
  if (!q) return { type: "text", query: "" };

  const asPage = parseMushafPageQuery(q);
  if (asPage != null) {
    return { type: "page", page: clampMushafPage(asPage) };
  }

  const juzMatch = /^(?:جزء|juz)\s*([0-9٠-٩۰-۹]{1,2})$/i.exec(q);
  if (juzMatch) {
    const n = Number.parseInt(toLatinDigits(juzMatch[1]!), 10);
    if (n >= 1 && n <= 30) {
      return { type: "juz", juz: n, page: JUZ_START_PAGES[n - 1] ?? 1 };
    }
  }

  const sa = /^(\d{1,3})\s*[:：]\s*(\d{1,3})$/.exec(q);
  if (sa) {
    const surah = Number(sa[1]);
    const ayah = Number(sa[2]);
    if (surah >= 1 && surah <= 114 && ayah >= 1) {
      return { type: "surahAyah", surah, ayah };
    }
  }

  return { type: "text", query: q };
}

/** نسخة مشتقة للمطابقة فقط — لا تُكتب فوق النص العثماني. */
export function normalizeForSearch(text: string): string {
  return normalizeArabic(text);
}

export const QuranSearchEngine = {
  parse: parseQuranSearchInput,
  normalizeForSearch,

  async search(query: string, limit = 48): Promise<{ seq: number; hits: QuranSearchHit[] }> {
    const seq = ++searchSeq;
    const parsed = parseQuranSearchInput(query);
    const hits: QuranSearchHit[] = [];

    if (parsed.type === "page") {
      if (parsed.page >= MUSHAF_PAGE_MIN && parsed.page <= MUSHAF_PAGE_MAX) {
        const surahs = QuranDataSource.listSurahSummaries();
        let surahId = 1;
        for (const s of surahs) {
          if (s.startPage <= parsed.page) surahId = s.id;
          else break;
        }
        hits.push({
          kind: "page",
          page: parsed.page,
          label: `صفحة ${parsed.page} · ${getSurahMeta(surahId).name}`,
        });
      }
      return { seq, hits };
    }

    if (parsed.type === "juz") {
      hits.push({
        kind: "juz",
        page: parsed.page,
        label: `الجزء ${parsed.juz}`,
      });
      return { seq, hits };
    }

    if (parsed.type === "surahAyah") {
      hits.push({
        kind: "verse",
        surahId: parsed.surah,
        ayahNumber: parsed.ayah,
        page: SURAH_START_PAGES[parsed.surah - 1] ?? 1,
        label: `${getSurahMeta(parsed.surah).name} ${parsed.ayah}`,
      });
      return { seq, hits };
    }

    const q = parsed.query;
    if (!q) return { seq, hits };

    const needle = normalizeForSearch(q);
    for (const s of QuranDataSource.listSurahSummaries()) {
      if (normalizeForSearch(s.nameArabic).includes(needle) || String(s.id) === q) {
        hits.push({
          kind: "surah",
          surahId: s.id,
          page: s.startPage,
          label: `${s.id}. ${s.nameArabic}`,
        });
      }
    }

    let verses: QuranVerseSearchItem[];
    try {
      verses = await searchVersesInCorpus(q, limit);
    } catch {
      verses = [];
    }

    for (const v of verses) {
      hits.push({
        kind: "verse",
        surahId: v.surahNumber,
        ayahNumber: v.ayahNumber,
        page: v.page,
        label: `${v.surahName} ${v.ayahNumber}`,
        snippet: v.text,
      });
    }

    return { seq, hits: hits.slice(0, limit) };
  },

  isCurrent(seq: number): boolean {
    return seq === searchSeq;
  },
} as const;
