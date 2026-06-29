import {
  MUSHAF_INDEX,
  getSurahMeta,
  getJuzStartPage,
  getHizbStartPage,
  getQuarterStartPage,
  clampPage,
} from "./kuwait-mushaf-data";

export type MushafSearchHit = {
  surah: number;
  surahName: string;
  ayah: number;
  page: number;
  text: string;
  highlight?: string;
};

export type LocalNavHit = {
  type: "page" | "surah" | "juz" | "hizb" | "quarter" | "ayah";
  label: string;
  page: number;
};

/** Instant local navigation — page, surah, juz, hizb, quarter, surah:ayah */
export function localMushafNavigate(query: string): LocalNavHit | null {
  const q = query.trim();
  if (!q) return null;

  const pageOnly = q.match(/^(?:صفحة|ص)?\s*(\d{1,3})$/i);
  if (pageOnly) {
    const page = clampPage(Number(pageOnly[1]));
    return { type: "page", label: `صفحة ${page}`, page };
  }

  const juzMatch = q.match(/^(?:جزء|ج)\s*(\d{1,2})$/i);
  if (juzMatch) {
    const n = Number(juzMatch[1]);
    if (n >= 1 && n <= 30) {
      const page = getJuzStartPage(n);
      return { type: "juz", label: `الجزء ${n}`, page };
    }
  }

  const hizbMatch = q.match(/^(?:حزب|ح)\s*(\d{1,2})$/i);
  if (hizbMatch) {
    const n = Number(hizbMatch[1]);
    if (n >= 1 && n <= 60) {
      const page = getHizbStartPage(n);
      return { type: "hizb", label: `الحزب ${n}`, page };
    }
  }

  const quarterMatch = q.match(/^(?:ربع|ر)\s*(\d{1,3})$/i);
  if (quarterMatch) {
    const n = Number(quarterMatch[1]);
    if (n >= 1 && n <= 240) {
      const page = getQuarterStartPage(n);
      return { type: "quarter", label: `الربع ${n}`, page };
    }
  }

  const ayahMatch = q.match(/^(\d{1,3})\s*[:\-]\s*(\d{1,3})$/);
  if (ayahMatch) {
    const surah = Number(ayahMatch[1]);
    const ayah = Number(ayahMatch[2]);
    const meta = getSurahMeta(surah);
    if (meta) {
      return { type: "ayah", label: `${meta.name} : ${ayah}`, page: meta.startPage };
    }
  }

  const surahNum = Number(q);
  if (Number.isFinite(surahNum) && surahNum >= 1 && surahNum <= 114) {
    const meta = getSurahMeta(surahNum);
    if (meta) return { type: "surah", label: meta.name, page: meta.startPage };
  }

  const byName = MUSHAF_INDEX.surahs.find((s) => s.name.includes(q) || s.englishName.toLowerCase().includes(q.toLowerCase()));
  if (byName) return { type: "surah", label: byName.name, page: byName.startPage };

  return null;
}

function highlightText(text: string, query: string): string {
  const q = query.trim();
  if (!q || q.length < 2) return text;
  const idx = text.indexOf(q);
  if (idx === -1) return text;
  return `${text.slice(0, idx)}【${text.slice(idx, idx + q.length)}】${text.slice(idx + q.length)}`;
}

export async function searchMushafQuran(query: string): Promise<MushafSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const local = localMushafNavigate(q);
  if (local && local.type !== "ayah") {
    return [{
      surah: MUSHAF_INDEX.pages.find((p) => p.page === local.page)?.surah ?? 1,
      surahName: local.label,
      ayah: 1,
      page: local.page,
      text: local.label,
    }];
  }

  const encoded = encodeURIComponent(q);
  const res = await fetch(`https://api.alquran.cloud/v1/search/${encoded}/all/ar`, {
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new Error("تعذّر البحث في القرآن");

  const data = (await res.json()) as {
    data?: {
      matches?: Array<{
        text: string;
        surah: { number: number; name: string };
        numberInSurah: number;
      }>;
    };
  };

  const matches = data.data?.matches ?? [];
  const hits: MushafSearchHit[] = [];

  for (const m of matches.slice(0, 40)) {
    const page = await resolveAyahPage(m.surah.number, m.numberInSurah);
    const plain = stripHtml(m.text);
    hits.push({
      surah: m.surah.number,
      surahName: m.surah.name.replace(/^سُورَةُ\s*/, "").replace(/\u0650/g, ""),
      ayah: m.numberInSurah,
      page,
      text: highlightText(plain, q),
    });
  }

  return hits;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

const pageCache = new Map<string, number>();

export async function resolveAyahPage(surah: number, ayah: number): Promise<number> {
  const key = `${surah}:${ayah}`;
  const cached = pageCache.get(key);
  if (cached) return cached;

  const res = await fetch(
    `https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?words=false&fields=page_number`,
    { signal: AbortSignal.timeout(12_000) },
  );
  if (!res.ok) return getSurahMeta(surah)?.startPage ?? 1;
  const data = (await res.json()) as { verse?: { page_number?: number } };
  const page = data.verse?.page_number ?? 1;
  pageCache.set(key, page);
  return page;
}

export function filterIndex<T extends { number?: number; name?: string; startPage?: number }>(
  items: T[],
  query: string,
  labelFn: (item: T) => string,
): T[] {
  const q = query.trim();
  if (!q) return items;
  return items.filter((item) => labelFn(item).includes(q) || String(item.number).includes(q));
}

export function getSurahForPage(index: typeof MUSHAF_INDEX, page: number) {
  return index.pages.find((p) => p.page === page) ?? index.pages[0];
}
