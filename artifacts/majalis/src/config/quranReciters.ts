/**
 * إعداد قرّاء التلاوة المركزي — سُنّة / Ssunnah.com
 * يُستخدم لعرض القرّاء المفعّلين فقط ولتوليد روابط الصوت.
 */
import { RECITERS, type QuranReciter } from "@/lib/quran-audio";

export type ReciterRightsStatus = "unknown" | "licensed" | "public-domain";

export type QuranReciterConfig = {
  id: string;
  name: string;
  audioBaseUrl: string | null;
  localPath: string | null;
  format: "mp3";
  supportsAyah: boolean;
  supportsSurah: boolean;
  supportsPage: boolean;
  enabled: boolean;
  rightsStatus: ReciterRightsStatus;
  notes: string;
};

/** معرّفات القرّاء المُحقَّقين بعد QA — يُحدَّث مع audio-registry.json */
export const VERIFIED_RECITER_IDS = [
  "husary",
  "minshawi",
  "alafasy",
  "dosari",
  "shuraim",
] as const;

function toConfig(r: QuranReciter, verified: boolean): QuranReciterConfig {
  const supportsAyah = Boolean(r.everyayahFolder);
  const supportsSurah = Boolean(r.surahBaseUrl);
  return {
    id: r.id,
    name: r.nameAr,
    audioBaseUrl: supportsAyah
      ? `https://everyayah.com/data/${r.everyayahFolder}`
      : supportsSurah
        ? r.surahBaseUrl
        : null,
    localPath: null,
    format: "mp3",
    supportsAyah,
    supportsSurah,
    supportsPage: supportsAyah,
    enabled: verified && supportsAyah,
    rightsStatus: "unknown",
    notes: verified
      ? "مُحقَّق QA — everyayah"
      : supportsAyah
        ? "غير مُحقَّق بعد — مخفي عن المستخدم"
        : "سورة كاملة فقط — غير مدعوم في المصحف",
  };
}

const verifiedSet = new Set<string>(VERIFIED_RECITER_IDS);

/** كل القرّاء المعروفين (للتدقيق الداخلي). */
export const QURAN_RECITERS: QuranReciterConfig[] = RECITERS.map((r) =>
  toConfig(r, verifiedSet.has(r.id)),
);

/** قرّاء يظهرون للمستخدم — مفعّلون ويدعمون آية-بآية. */
export function getEnabledReciters(): QuranReciterConfig[] {
  return QURAN_RECITERS.filter((r) => r.enabled);
}

export function getReciterConfig(id: string): QuranReciterConfig | undefined {
  return QURAN_RECITERS.find((r) => r.id === id);
}

export function isReciterEnabled(id: string): boolean {
  return getReciterConfig(id)?.enabled === true;
}

export function defaultReciterId(): string {
  const preferred = ["dosari", "shuraim", "alafasy", "husary", "minshawi"];
  for (const id of preferred) {
    if (isReciterEnabled(id)) return id;
  }
  return getEnabledReciters()[0]?.id ?? "alafasy";
}
