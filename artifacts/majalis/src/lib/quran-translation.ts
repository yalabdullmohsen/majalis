/**
 * ترجمات الآية عبر AlQuran Cloud — إنجليزي / فرنسي / أردو وغيرها.
 * نفس مسار التخزين المؤقت المستخدم للتفسير.
 */
import { pooledFetch } from "@/lib/fetch-pool";

const BASE = "https://api.alquran.cloud/v1";
const CACHE_PREFIX = "mj-quran-tr-";

export type TranslationEdition = {
  id: string;
  label: string;
  lang: string;
};

export const QURAN_TRANSLATION_EDITIONS: TranslationEdition[] = [
  { id: "en.sahih", label: "English — Sahih International", lang: "en" },
  { id: "en.pickthall", label: "English — Pickthall", lang: "en" },
  { id: "fr.hamidullah", label: "Français — Hamidullah", lang: "fr" },
  { id: "ur.jalandhry", label: "اردو — جالندھری", lang: "ur" },
  { id: "tr.diyanet", label: "Türkçe — Diyanet", lang: "tr" },
  { id: "id.indonesian", label: "Bahasa Indonesia", lang: "id" },
];

export type TranslationAyah = { numberInSurah: number; text: string };

const memory = new Map<string, TranslationAyah[]>();

function readCache(key: string): TranslationAyah[] | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as TranslationAyah[];
  } catch {
    return null;
  }
}

function writeCache(key: string, data: TranslationAyah[]) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

export async function fetchTranslationAyahs(
  surahNumber: number,
  edition: string,
): Promise<TranslationAyah[]> {
  const key = `${edition}-${surahNumber}`;
  const mem = memory.get(key);
  if (mem) return mem;
  const cached = readCache(key);
  if (cached) {
    memory.set(key, cached);
    return cached;
  }

  const res = await pooledFetch(`${BASE}/surah/${surahNumber}/${edition}`, {
    timeoutMs: 20_000,
  });
  if (!res.ok) throw new Error(`translation HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 200 || !json.data?.ayahs) return [];
  const result: TranslationAyah[] = json.data.ayahs.map((a: { numberInSurah: number; text: string }) => ({
    numberInSurah: a.numberInSurah,
    text: a.text,
  }));
  memory.set(key, result);
  writeCache(key, result);
  return result;
}

export async function fetchAyahTranslation(
  surahNumber: number,
  ayahNumber: number,
  edition: string,
): Promise<string | null> {
  const all = await fetchTranslationAyahs(surahNumber, edition);
  return all.find((a) => a.numberInSurah === ayahNumber)?.text ?? null;
}
