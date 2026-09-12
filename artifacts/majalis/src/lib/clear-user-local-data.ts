/**
 * مسح أفضل-جهد لبيانات المستخدم المحلية بعد حذف الحساب من الخادم.
 * لا يمس موافقة الكوكيز العامة (يمكن للمستخدم إعادة ضبطها من مركز الخصوصية).
 */

const EXACT_KEYS = [
  "majalis-user-settings-v1",
  "majalis-reading-progress-v1",
  "majalis-daily-progress-v1",
  "majalis-user-streak-v1",
  "majalis-search-analytics",
  "majalis-governorate-v1",
  "majalis_apns_device_token_v1",
  "majalis-theme",
  "userFontSize",
  "myBookmarks",
  "lastPage",
  "userNotes",
  "prophet-bookmarks",
  "ah-favs",
  "hikam_fav",
  "majalis:hadith-saved",
  "sunan_checked",
  "an_read",
  "quranReaderShowTranslation",
  "quranReaderTranslationEdition",
  "majalis-mushaf-tafsir-edition-v1",
  "majalis-mushaf-tafsir-font-scale-v1",
  "majalis-mushaf-translation-on-v1",
  "majalis-mushaf-translation-edition-v1",
  "majalis-kp-personalization-v1",
  "majalis-kp-search-history-v1",
  "majalis-kp-activity-v1",
  "majalis-guest-merge-done-v1",
  "majalis-guest-merge-pending-v1",
  "majalis-sync-last-flush",
  "majalis-sync-schema-v",
] as const;

const PREFIXES = [
  "majalis-",
  "sunnah-widget-",
  "mj-quran-",
  "mj-",
  "sb-", // بعض مفاتيح supabase المحلية القديمة إن وُجدت
  "majalis-sync-queue:",
  "majalis-sync-clock:",
] as const;

const KEEP_EXACT = new Set([
  "majalis-cookie-consent-v1",
]);

function shouldClearKey(key: string): boolean {
  if (KEEP_EXACT.has(key)) return false;
  if ((EXACT_KEYS as readonly string[]).includes(key)) return true;
  return PREFIXES.some((p) => key.startsWith(p));
}

/** يمسح مفاتيح localStorage المرتبطة بالمستخدم/التقدّم الشخصي. */
export function clearUserLocalData(): { removed: number } {
  if (typeof localStorage === "undefined") return { removed: 0 };

  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && shouldClearKey(key)) toRemove.push(key);
  }
  for (const key of toRemove) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  return { removed: toRemove.length };
}

/**
 * مسح محلي شامل عند حذف الحساب أو «مسح البيانات»:
 * localStorage + تلاوات IndexedDB + حالة استئناف الصوت.
 */
export async function clearUserLocalDataAndMedia(): Promise<{ removed: number }> {
  const { removed } = clearUserLocalData();
  try {
    const { invalidateWidgetsForAccountChange } = await import("@/lib/widgets");
    invalidateWidgetsForAccountChange();
  } catch {
    /* أفضل جهد */
  }
  try {
    const { clearAllOfflineAudioDownloads } = await import("@/lib/quran-audio-downloads");
    await clearAllOfflineAudioDownloads();
  } catch {
    /* أفضل جهد */
  }
  try {
    const { clearAdhanFullDownloads } = await import("@/lib/adhan-downloads");
    await clearAdhanFullDownloads();
  } catch {
    /* أفضل جهد */
  }
  try {
    if (typeof indexedDB !== "undefined") {
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase("majalis-quran-audio-resume");
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
    }
  } catch {
    /* أفضل جهد */
  }
  return { removed };
}
