import { pooledFetch } from "@/lib/fetch-pool";
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
    const url = `/data/hadith/${collection}.json`;
    const res = await pooledFetch(url, {
      dedupeKey: `sahihayn:${collection}`,
      timeoutMs: 20_000,
    });
    if (!res.ok) throw new Error(`مرجع ${collection} غير متاح (${res.status})`);
    const text = await res.text();
    // Part 15: SHA-256 vs manifest — silent repair via one refetch on mismatch
    let expected: string | null = null;
    try {
      const man = await fetchSahihaynManifest();
      expected = man?.files.find((f) => f.collection === collection)?.sha256 ?? null;
    } catch {
      expected = null;
    }
    const { verifyOrRepairPayload } = await import("@/lib/offline-integrity");
    const verified = await verifyOrRepairPayload(text, {
      expectedSha256: expected,
      repair: async () => {
        const again = await pooledFetch(url, {
          dedupeKey: `sahihayn:${collection}:repair`,
          timeoutMs: 20_000,
          cache: "reload",
        } as RequestInit);
        if (!again.ok) return null;
        return again.text();
      },
    });
    if (!verified.ok && expected) {
      // Corrupt and unrepaired — fail soft (empty) rather than bad data
      return [];
    }
    const data = JSON.parse(verified.text) as SahihaynFile;
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
    const res = await pooledFetch("/data/hadith/manifest.json", {
      dedupeKey: "sahihayn:manifest",
      timeoutMs: 10_000,
    });
    if (!res.ok) return null;
    return (await res.json()) as SahihaynManifest;
  } catch {
    return null;
  }
}
