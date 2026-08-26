/**
 * توقيت الآيات على ملف سورة كاملة — تقدير محلي أو مقاطع quran.com عند التوفّر.
 */
import { getReciter } from "@/lib/quran-audio";

export type AyahTiming = {
  ayahNumber: number;
  startTime: number;
  endTime: number;
};

const timingCache = new Map<string, AyahTiming[]>();

function cacheKey(surah: number, reciterId: string): string {
  return `${reciterId}:${surah}`;
}

/** يُوزّع مدة السورة على الآيات بحسب طول النص (بدون تعديل النص). */
export function buildProportionalAyahTimings(
  ayahs: Array<{ numberInSurah: number; text: string }>,
  durationSec: number,
  introPadSec = 0.35,
): AyahTiming[] {
  const safeDuration = Math.max(durationSec, 1);
  const weights = ayahs.map((a) => Math.max(stripDiacriticsForWeight(a.text).length, 1));
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const usable = Math.max(safeDuration - introPadSec, 0.5);
  let cursor = introPadSec;

  return ayahs.map((ayah, idx) => {
    const slice = (weights[idx]! / totalWeight) * usable;
    const startTime = cursor;
    const endTime = idx === ayahs.length - 1 ? safeDuration : cursor + slice;
    cursor = endTime;
    return { ayahNumber: ayah.numberInSurah, startTime, endTime };
  });
}

function stripDiacriticsForWeight(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\s\uFEFF]/g, "");
}

export function findAyahAtTime(timings: AyahTiming[], currentTime: number): number | null {
  if (!timings.length) return null;
  const hit = timings.find((t) => currentTime >= t.startTime && currentTime < t.endTime);
  if (hit) return hit.ayahNumber;
  if (currentTime >= timings[timings.length - 1]!.endTime) {
    return timings[timings.length - 1]!.ayahNumber;
  }
  return timings[0]!.ayahNumber;
}

/** مقاطع quran.com عند الاتصال — يُخزَّن في الذاكرة للجلسة. */
export async function resolveSurahAyahTimings(
  surah: number,
  reciterId: string,
  durationSec: number,
  ayahs: Array<{ numberInSurah: number; text: string }>,
  signal?: AbortSignal,
): Promise<{ timings: AyahTiming[]; precise: boolean }> {
  const key = cacheKey(surah, reciterId);
  const cached = timingCache.get(key);
  if (cached) return { timings: cached, precise: true };

  const remote = await fetchQuranComSegmentTimings(surah, reciterId, signal);
  if (remote && remote.length > 0) {
    timingCache.set(key, remote);
    return { timings: remote, precise: true };
  }

  const proportional = buildProportionalAyahTimings(ayahs, durationSec);
  return { timings: proportional, precise: false };
}

async function fetchQuranComSegmentTimings(
  surah: number,
  reciterId: string,
  signal?: AbortSignal,
): Promise<AyahTiming[] | null> {
  const recitationId = mapReciterToQuranComRecitation(reciterId);
  if (!recitationId) return null;

  try {
    const res = await fetch(
      `https://api.quran.com/api/v4/chapter_recitations/${recitationId}/${surah}?segments=true`,
      { signal },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      audio_file?: { segments?: Array<[number, number, number]> };
    };
    const segments = json.audio_file?.segments;
    if (!segments?.length) return null;

    const byAyah = new Map<number, { start: number; end: number }>();
    for (const [ayahNum, startMs, endMs] of segments) {
      const start = startMs / 1000;
      const end = endMs / 1000;
      const prev = byAyah.get(ayahNum);
      if (!prev) {
        byAyah.set(ayahNum, { start, end });
      } else {
        prev.end = Math.max(prev.end, end);
      }
    }

    const timings = [...byAyah.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([ayahNumber, range]) => ({
        ayahNumber,
        startTime: range.start,
        endTime: range.end,
      }));

    return timings.length > 0 ? timings : null;
  } catch {
    return null;
  }
}

/** خريطة تقريبية — تُستخدم فقط لتحسين التزامن عند الاتصال. */
function mapReciterToQuranComRecitation(reciterId: string): number | null {
  const reciter = getReciter(reciterId);
  const map: Record<string, number> = {
    alafasy: 7,
    husary: 2,
    minshawi: 9,
    sudais: 3,
    shuraym: 12,
    ajamy: 10,
    dosari: 6,
  };
  if (map[reciterId]) return map[reciterId]!;
  if (reciter.featured) return 7;
  return null;
}

export function scaleTimingsToDuration(timings: AyahTiming[], durationSec: number): AyahTiming[] {
  if (!timings.length || durationSec <= 0) return timings;
  const srcEnd = timings[timings.length - 1]!.endTime;
  if (srcEnd <= 0 || Math.abs(srcEnd - durationSec) < 0.5) return timings;
  const ratio = durationSec / srcEnd;
  return timings.map((t) => ({
    ayahNumber: t.ayahNumber,
    startTime: t.startTime * ratio,
    endTime: t.endTime * ratio,
  }));
}
