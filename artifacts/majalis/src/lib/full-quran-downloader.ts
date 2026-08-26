/**
 * تنزيل المصحف كامل — واجهة Capacitor (IndexedDB / iOS Application Support).
 * بديل react-native-fs — نفس السلوك: إيقاف، استئناف، حذف.
 */
import {
  TOTAL_SURAHS,
  deleteReciterDownloads,
  downloadReciter,
  getReciterDownloadStatus,
  pauseReciterDownload,
  type DownloadProgress,
} from "./quran-audio-downloads";
import { getReciter } from "./quran-audio";

export type { DownloadProgress };

export class FullQuranDownloader {
  static SURAH_COUNT = TOTAL_SURAHS;

  /** مسار منطقي — التخزين الفعلي عبر IndexedDB أو MajlisOfflineAudio على iOS */
  static getReciterDirectory(reciterId: string): string {
    return `quran_audio/${reciterId}`;
  }

  static async downloadFullQuran(
    reciterId: string,
    onProgress: (progress: DownloadProgress) => void,
  ): Promise<"completed" | "paused" | "cancelled"> {
    void getReciter(reciterId);
    return downloadReciter(reciterId, onProgress);
  }

  static pauseDownload(): void {
    pauseReciterDownload();
  }

  static async deleteReciterAudio(reciterId: string): Promise<boolean> {
    const before = await getReciterDownloadStatus(reciterId);
    if (before.downloadedSurahs === 0) return false;
    await deleteReciterDownloads(reciterId);
    return true;
  }
}
