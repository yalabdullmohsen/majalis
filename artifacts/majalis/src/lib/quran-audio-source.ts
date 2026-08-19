/**
 * طبقة تجريد مصدر التلاوة — تخفي اختلاف everyayah (آية) وmp3quran (سورة)
 * عن بقية الكود. البث فقط؛ لا حزم ملفات في الثنائي.
 */
import {
  getAyahAudioUrl,
  getReciter,
  getSurahAudioUrl,
  listAyahAudioUrls,
  type QuranReciter,
} from "@/lib/quran-audio";
import {
  isAudioSourceDisabled,
  isReciterDisabled,
} from "@/lib/quran-audio-remote-config";

export type AudioSource =
  | { kind: "ayah"; surah: number; ayah: number; reciterId: string }
  | { kind: "surah"; surah: number; reciterId: string };

export type ResolvedAudioUrl = {
  primary: string;
  /** مرايا احتياطية بنفس المحتوى عند توفّرها */
  mirrors: string[];
  source: "everyayah" | "mp3quran";
  reciter: QuranReciter;
};

function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

/** مرايا everyayah المعروفة (نفس مجلد القارئ). */
function everyayahMirrors(folder: string, surah: number, ayah: number): string[] {
  const file = `${pad3(surah)}${pad3(ayah)}.mp3`;
  const path = `data/${folder}/${file}`;
  return [
    `https://everyayah.com/${path}`,
    `https://www.everyayah.com/${path}`,
  ];
}

export function canResolveAudioSource(source: AudioSource): boolean {
  if (isReciterDisabled(source.reciterId)) return false;
  const reciter = getReciter(source.reciterId);
  if (source.kind === "ayah") {
    if (isAudioSourceDisabled("everyayah")) return false;
    return Boolean(reciter.everyayahFolder);
  }
  if (isAudioSourceDisabled("mp3quran")) return false;
  return Boolean(reciter.surahBaseUrl);
}

/**
 * يحوّل الطلب إلى URL أساسي + مرايا. يعيد null إن كان المصدر/القارئ معطّلاً
 * أو غير متوفّر لهذا النوع (مثل قارئ سورة فقط بلا everyayah).
 */
export function resolveAudioSource(source: AudioSource): ResolvedAudioUrl | null {
  if (!canResolveAudioSource(source)) return null;
  const reciter = getReciter(source.reciterId);

  if (source.kind === "ayah") {
    const folder = reciter.everyayahFolder;
    if (!folder) return null;
    const mirrors = everyayahMirrors(folder, source.surah, source.ayah);
    const primary = getAyahAudioUrl(source.surah, source.ayah, source.reciterId);
    return {
      primary,
      mirrors: mirrors.filter((u) => u !== primary),
      source: "everyayah",
      reciter,
    };
  }

  const primary = getSurahAudioUrl(source.surah, source.reciterId);
  return {
    primary,
    mirrors: [],
    source: "mp3quran",
    reciter,
  };
}

/** قائمة URLs للتجربة بالترتيب — موحّدة مع listAyahAudioUrls (everyayah + islamic.network). */
export function audioSourceUrlQueue(source: AudioSource): string[] {
  if (source.kind === "ayah") {
    return listAyahAudioUrls(source.surah, source.ayah, source.reciterId);
  }
  const resolved = resolveAudioSource(source);
  if (!resolved) return [];
  return [resolved.primary, ...resolved.mirrors];
}
