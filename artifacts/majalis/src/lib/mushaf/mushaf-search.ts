import type { MushafPageIndex } from "./kuwait-mushaf-data";

export type MushafSearchHit = {
  surah: number;
  surahName: string;
  ayah: number;
  page: number;
  text: string;
};

export async function searchMushafQuran(query: string): Promise<MushafSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

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
    hits.push({
      surah: m.surah.number,
      surahName: m.surah.name.replace(/^سُورَةُ\s*/, "").replace(/\u0650/g, ""),
      ayah: m.numberInSurah,
      page,
      text: stripHtml(m.text),
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
  if (!res.ok) return 1;
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

export function getSurahForPage(index: MushafPageIndex, page: number) {
  return index.pages.find((p) => p.page === page) ?? index.pages[0];
}
