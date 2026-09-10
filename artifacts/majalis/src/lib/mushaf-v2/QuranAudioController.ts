/**
 * QuranAudioController — واجهة فوق محرّك التلاوة الحالي؛ تسجيلات مرخّصة فقط عبر المسار القائم.
 */

import {
  listAyahAudioUrls,
  loadReciterId,
  saveReciterId,
} from "@/lib/quran-audio";

export const QuranAudioController = {
  getReciterId(): string {
    return loadReciterId();
  },

  setReciterId(id: string): void {
    saveReciterId(id);
  },

  /** روابط الآية للقارئ الحالي — لا يُضاف قرّاء بلا توثيق حقوق */
  ayahUrls(surah: number, ayah: number, reciterId?: string): string[] {
    return listAyahAudioUrls(surah, ayah, reciterId ?? loadReciterId());
  },
} as const;
