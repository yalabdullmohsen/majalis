/**
 * بذرة محلية لأحاديث الصحيح/الضعيف/الموضوع — JSON تحت /public/data/hadith-verified.
 * المرجع الصحيحان منفصل في public/data/hadith.
 */
import { loadAllSeedChunks, loadSeedChunksByKey, peekSeedCache } from "./json-seed-loader";

const HADITH_DATA_BASE = "/data/hadith-verified";

export type LocalHadithClass = "sahih" | "daif" | "mawdu";

export type LocalVerifiedHadith = {
  id: string;
  title: string | null;
  text: string;
  narrator: string | null;
  source_name: string | null;
  grade: string | null;
  collection: string | null;
  chapter: string | null;
  explanation: string | null;
  keywords: string[] | null;
  hadith_number: string | null;
  metadata: Record<string, string | number | boolean | null> | null;
  authenticity_class: LocalHadithClass;
  created_at: string;
};

export async function loadLocalVerifiedHadith(
  authenticityClass?: LocalHadithClass,
): Promise<LocalVerifiedHadith[]> {
  if (authenticityClass) {
    return loadSeedChunksByKey<LocalVerifiedHadith>(HADITH_DATA_BASE, authenticityClass);
  }
  return loadAllSeedChunks<LocalVerifiedHadith>(HADITH_DATA_BASE);
}

export function getLocalVerifiedHadithCached(authenticityClass?: LocalHadithClass): LocalVerifiedHadith[] {
  const all = peekSeedCache<LocalVerifiedHadith>(HADITH_DATA_BASE) ?? [];
  if (!authenticityClass) return all;
  return all.filter((h) => h.authenticity_class === authenticityClass);
}

/**
 * متوافق مع الاستدعاءات السابقة. في المتصفح يُفضَّل `loadLocalVerifiedHadith`.
 * إن لم تُحمَّل البيانات بعد يُرجع [] (أو يصفّي من الذاكرة إن وُجدت).
 */
export function getLocalVerifiedHadith(authenticityClass?: LocalHadithClass): LocalVerifiedHadith[] {
  return getLocalVerifiedHadithCached(authenticityClass);
}

/** @deprecated استخدم loadLocalVerifiedHadith */
export const LOCAL_VERIFIED_HADITHS: LocalVerifiedHadith[] = new Proxy([] as LocalVerifiedHadith[], {
  get(_target, prop, receiver) {
    const data = getLocalVerifiedHadithCached();
    const value = Reflect.get(data, prop, receiver);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(data) : value;
  },
  has(_target, prop) {
    return prop in getLocalVerifiedHadithCached();
  },
  ownKeys() {
    return Reflect.ownKeys(getLocalVerifiedHadithCached());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Object.getOwnPropertyDescriptor(getLocalVerifiedHadithCached(), prop);
  },
});
