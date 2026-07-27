/**
 * مرجع الصحيحين المحلي (البخاري + مسلم) من public/data/hadith/.
 * الصحة = عضوية الكتاب؛ لا تُلصق درجة فردية ملفّقة.
 */
import type { CdnHadith } from "@/lib/hadith-cdn-service";

export type SahihaynCollection = "bukhari" | "muslim";

type LeanHadith = {
  n: number;
  t: string;
  a?: number;
  b?: number;
  h?: number;
};

type SahihaynFile = {
  source: string;
  edition: string;
  collection: SahihaynCollection;
  label: string;
  authenticity: string;
  count: number;
  hadiths: LeanHadith[];
};

export type SahihaynManifest = {
  source: string;
  authenticity: string;
  generatedAt: string;
  totalHadiths: number;
  files: Array<{
    file: string;
    collection: SahihaynCollection;
    edition: string;
    label: string;
    count: number;
    sha256: string;
  }>;
};

const cache = new Map<string, Promise<CdnHadith[]>>();

function leanToCdn(h: LeanHadith): CdnHadith {
  return {
    hadithnumber: h.n,
    text: h.t,
    grades: [],
    chapter: h.b != null ? `الكتاب ${h.b}` : undefined,
    book: h.b,
    inBook: h.h,
    arabicNumber: h.a,
  };
}

async function loadCollectionFile(collection: SahihaynCollection): Promise<CdnHadith[]> {
  const hit = cache.get(collection);
  if (hit) return hit;

  const promise = (async () => {
    const res = await fetch(`/data/hadith/${collection}.json`);
    if (!res.ok) throw new Error(`مرجع ${collection} غير متاح (${res.status})`);
    const data = (await res.json()) as SahihaynFile;
    if (!Array.isArray(data.hadiths)) return [];
    return data.hadiths.map(leanToCdn);
  })();

  cache.set(collection, promise);
  try {
    return await promise;
  } catch (err) {
    cache.delete(collection);
    throw err;
  }
}

/** البخاري + مسلم من المرآة المحلية (بعد تصفية الفارغ). */
export async function fetchSahihaynLocal(
  which: SahihaynCollection | "both" = "both",
): Promise<{ bukhari: CdnHadith[]; muslim: CdnHadith[] }> {
  if (which === "bukhari") {
    const bukhari = await loadCollectionFile("bukhari");
    return { bukhari, muslim: [] };
  }
  if (which === "muslim") {
    const muslim = await loadCollectionFile("muslim");
    return { bukhari: [], muslim };
  }
  const [bukhari, muslim] = await Promise.all([
    loadCollectionFile("bukhari"),
    loadCollectionFile("muslim"),
  ]);
  return { bukhari, muslim };
}

export async function fetchSahihaynManifest(): Promise<SahihaynManifest | null> {
  try {
    const res = await fetch("/data/hadith/manifest.json");
    if (!res.ok) return null;
    return (await res.json()) as SahihaynManifest;
  } catch {
    return null;
  }
}
