/**
 * اختيار قارئ/مجلد حسب تفضيل جودة التشغيل (64 | 128).
 */
import { RECITERS, getReciter } from "@/lib/quran-audio";
import { readPreferences, writePreferences } from "@/lib/user-preferences";

export type AudioQualityPref = "64" | "128";

export function readAudioQualityPref(): AudioQualityPref {
  const raw = String(readPreferences().playerQuality || "128");
  return raw.includes("64") ? "64" : "128";
}

export function saveAudioQualityPref(q: AudioQualityPref): void {
  writePreferences({ playerQuality: q });
}

/** إن كان القارئ الحالي لا يطابق الجودة المطلوبة، اختر بديلاً مميّزًا بنفس الجودة. */
export function resolveReciterForQuality(
  reciterId: string,
  quality: AudioQualityPref = readAudioQualityPref(),
): string {
  const current = getReciter(reciterId);
  if (current?.everyayahFolder && current.qualityLabel.includes(quality)) {
    return reciterId;
  }
  const match = RECITERS.find(
    (r) =>
      r.featured &&
      r.everyayahFolder &&
      r.qualityLabel.includes(quality),
  );
  return match?.id || reciterId;
}

export function listFeaturedRecitersByQuality(quality: AudioQualityPref) {
  return RECITERS.filter(
    (r) => r.featured && r.everyayahFolder && r.qualityLabel.includes(quality),
  );
}
