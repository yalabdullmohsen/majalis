export type QuranSearchHit = {
  surah: number;
  ayah: number;
  text: string;
};

const SEARCH_CACHE = new Map<string, { hits: QuranSearchHit[]; at: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function searchQuranKeyword(keyword: string, limit = 40): Promise<QuranSearchHit[]> {
  const q = keyword.trim();
  if (q.length < 2) return [];

  const cached = SEARCH_CACHE.get(q);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.hits.slice(0, limit);

  const response = await fetch(
    `https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/ar`,
    { signal: AbortSignal.timeout(20_000) },
  );
  if (!response.ok) throw new Error("تعذر البحث في القرآن");
  const json = await response.json();
  const hits: QuranSearchHit[] = (json.data?.matches || []).map(
    (m: { surah: { number: number }; numberInSurah: number; text: string }) => ({
      surah: m.surah.number,
      ayah: m.numberInSurah,
      text: m.text,
    }),
  );
  SEARCH_CACHE.set(q, { hits, at: Date.now() });
  return hits.slice(0, limit);
}

export async function fetchJuzAyahs(juzNumber: number) {
  const response = await fetch(
    `https://api.alquran.cloud/v1/juz/${juzNumber}/quran-uthmani`,
    { signal: AbortSignal.timeout(20_000) },
  );
  if (!response.ok) throw new Error("تعذر تحميل الجزء");
  const json = await response.json();
  return (json.data?.ayahs || []) as { numberInSurah: number; text: string; surah: { number: number; name: string } }[];
}

export async function fetchHizbQuarterAyahs(quarterNumber: number) {
  const response = await fetch(
    `https://api.alquran.cloud/v1/hizbQuarter/${quarterNumber}/quran-uthmani`,
    { signal: AbortSignal.timeout(20_000) },
  );
  if (!response.ok) throw new Error("تعذر تحميل الحزب");
  const json = await response.json();
  return (json.data?.ayahs || []) as { numberInSurah: number; text: string; surah: { number: number; name: string } }[];
}

export function getAyahAudioUrl(surah: number, ayah: number, reciter = "ar.alafasy") {
  return `https://cdn.islamic.network/quran/audio/128/${reciter}/${surah}:${ayah}.mp3`;
}
