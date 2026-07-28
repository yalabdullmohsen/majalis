/**
 * تقدير/تحميل طوابع زمنية للكلمات — يفضّل ملف timestamps إن وُجد، وإلا تقسيم متساوٍ.
 */
import { pooledFetch } from "@/lib/fetch-pool";

const mem = new Map<string, number[]>();

function key(reciter: string, surah: number, ayah: number) {
  return `${reciter}:${surah}:${ayah}`;
}

/**
 * يحاول `/data/quran/timestamps/{reciter}/{surah}.json` بالشكل:
 * { "1": [0, 0.4, 0.9], "2": [...] } — ثوانٍ من بداية الآية لكل كلمة.
 */
export async function loadWordTimestamps(
  surah: number,
  ayah: number,
  wordCount: number,
  reciterId: string,
  durationSec?: number,
): Promise<number[] | null> {
  if (wordCount <= 0) return null;
  const k = key(reciterId, surah, ayah);
  const hit = mem.get(k);
  if (hit && hit.length === wordCount) return hit;

  try {
    const res = await pooledFetch(`/data/quran/timestamps/${encodeURIComponent(reciterId)}/${surah}.json`, {
      timeoutMs: 4000,
      dedupeKey: `ts:${reciterId}:${surah}`,
    });
    if (res.ok) {
      const json = await res.json() as Record<string, number[]>;
      const arr = json[String(ayah)];
      if (Array.isArray(arr) && arr.length > 0) {
        mem.set(k, arr);
        return arr;
      }
    }
  } catch {
    /* لا ملف — نُقدِّر */
  }

  if (durationSec && durationSec > 0 && Number.isFinite(durationSec)) {
    const step = durationSec / wordCount;
    const est = Array.from({ length: wordCount }, (_, i) => i * step);
    mem.set(k, est);
    return est;
  }
  return null;
}

/** طوابع نسبية 0..1 للاستخدام مع currentTime/duration دون انتظار duration. */
export function proportionalWordIndex(currentTime: number, duration: number, wordCount: number): number {
  if (wordCount <= 0 || !duration || duration <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, currentTime / duration));
  return Math.min(wordCount - 1, Math.floor(ratio * wordCount));
}
