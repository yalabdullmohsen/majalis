/**
 * تحميل تنبؤي خفيف لصوت أول آية في الصفحات المجاورة — بدون لمس AudioEngine النشط.
 */
import { listAyahAudioUrls } from "@/lib/quran-audio";
import { getCachedMushafPage, loadMushafPage } from "@/lib/quran-data/qpc-page-data";
import { MUSHAF_PAGE_MAX, MUSHAF_PAGE_MIN } from "@/lib/quran-last-page";

const prefetched = new Set<string>();

function firstVerseKeyFromLayout(pageNumber: number): string | null {
  const layout = getCachedMushafPage(pageNumber);
  if (!layout) return null;
  for (const row of layout.rows) {
    if (row.kind !== "line" || row.words.length === 0) continue;
    const key = row.words[0]?.verseKey;
    if (key) return key;
  }
  return null;
}

function warmAudioUrl(url: string): void {
  if (typeof Audio === "undefined") return;
  try {
    const el = new Audio();
    el.preload = "auto";
    el.src = url;
    el.load();
  } catch {
    /* تجاهل فشل التحميل الخلفي */
  }
}

/** يحمّل أول مقطع صوتي للصفحتين N±1 إن توفّرتا في الكاش أو بعد جلب خفيف. */
export async function prefetchAdjacentPageAudio(
  pageNumber: number,
  reciterId: string,
): Promise<void> {
  const targets = [pageNumber - 1, pageNumber + 1].filter(
    (p) => p >= MUSHAF_PAGE_MIN && p <= MUSHAF_PAGE_MAX,
  );
  for (const p of targets) {
    const key = `p${p}:${reciterId}`;
    if (prefetched.has(key)) continue;
    try {
      if (!getCachedMushafPage(p)) {
        await loadMushafPage(p);
      }
      const verseKey = firstVerseKeyFromLayout(p);
      if (!verseKey) continue;
      const colon = verseKey.indexOf(":");
      if (colon < 0) continue;
      const surah = Number(verseKey.slice(0, colon));
      const ayah = Number(verseKey.slice(colon + 1));
      if (!Number.isFinite(surah) || !Number.isFinite(ayah)) continue;
      const urls = listAyahAudioUrls(surah, ayah, reciterId);
      const url = urls[0];
      if (!url) continue;
      warmAudioUrl(url);
      prefetched.add(key);
    } catch {
      /* لا يفشل المسار الرئيسي */
    }
  }
}
