/**
 * Background sync: warm IndexedDB packs when online / on reconnect.
 * Safe to call multiple times — coalesces concurrent runs.
 * Part 17: exponential backoff + jitter on failure (no retry storms).
 */
import { isOnline } from "@/lib/offline-db";
import {
  cacheAdhkarPack,
  cacheArticle,
  cacheQuranSurah,
  cacheQuranSurahList,
  getLastContentSync,
  markContentSynced,
} from "@/lib/offline-content-store";
import { scheduleBackgroundSync } from "@/lib/sync-backoff";
import { withJourneyMark } from "@/lib/journey-perf";

let started = false;
let syncing: Promise<void> | null = null;

const CORE_SURAHS = [1, 18, 36, 55, 67, 112, 113, 114];

async function syncCorePacksOnce(): Promise<{ ok: boolean; error?: string }> {
  if (!isOnline()) return { ok: true };
  if (syncing) {
    await syncing;
    return { ok: true };
  }

  syncing = (async () => {
    await withJourneyMark("offline-sync", async () => {
      // Migrate legacy raw-IDB packs into Dexie engine (best-effort, once)
      try {
        const { migrateLegacyOfflineDb } = await import("@/lib/offline-engine");
        await migrateLegacyOfflineDb();
      } catch {
        /* ignore */
      }

      // Quran list + core surahs (local-first fetchSurahDetail already prefers /data/quran)
      const { fetchSurahList, fetchSurahDetail } = await import("@/lib/quran-api");
      const list = await fetchSurahList();
      await cacheQuranSurahList(list, `surah-list:${list.length}`);

      await Promise.all(
        CORE_SURAHS.map(async (n) => {
          try {
            const detail = await fetchSurahDetail(n);
            await cacheQuranSurah(detail, `surah-${n}:${detail.numberOfAyahs}`);
          } catch {
            /* skip individual surah */
          }
        }),
      );

      // Adhkar seed snapshot for offline reading
      const { ADHKAR_ITEMS } = await import("@/lib/adhkar-seed");
      await cacheAdhkarPack(ADHKAR_ITEMS, `adhkar:${ADHKAR_ITEMS.length}`);

      // Curated fawaid excerpts (articles/books-style content)
      try {
        const { FAWAID_CURATED_SEED } = await import("@/lib/fawaid-curated-seed");
        const slice = FAWAID_CURATED_SEED.slice(0, 60);
        for (const item of slice) {
          if (!item.id || !item.text) continue;
          await cacheArticle({
            id: `fawaid:${item.id}`,
            title: item.category || "فائدة",
            href: `/fawaid#${item.id}`,
            text: item.text.slice(0, 8_000),
            contentType: "fawaid",
          });
        }
      } catch {
        /* optional pack */
      }

      await markContentSynced();
    });
  })();

  try {
    await syncing;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String((err as Error)?.message || err) };
  } finally {
    syncing = null;
  }
}

async function syncCorePacks(): Promise<void> {
  await syncCorePacksOnce();
}

function enqueueOfflineSync(): void {
  scheduleBackgroundSync(
    "offline-core-packs",
    () => syncCorePacksOnce(),
    { baseMs: 1_500, maxMs: 90_000, minIntervalMs: 5_000 },
  );
}

/** Start listeners once from App shell — no UI / CSS. */
export function startOfflineSync(): void {
  if (typeof window === "undefined" || started) return;
  started = true;

  // Initial warm after idle so first paint stays light
  const kick = () => {
    enqueueOfflineSync();
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(kick);
  } else {
    globalThis.setTimeout(kick, 2_500);
  }

  window.addEventListener("online", () => {
    enqueueOfflineSync();
  });

  // Periodic soft refresh while tab is open (6h)
  window.setInterval(() => {
    void getLastContentSync().then((last) => {
      const age = last ? Date.now() - new Date(last.updatedAt).getTime() : Infinity;
      if (age > 6 * 60 * 60 * 1000) enqueueOfflineSync();
    });
  }, 30 * 60 * 1000);
}

/** Manual sync trigger (settings / vault). */
export async function forceOfflineContentSync(): Promise<void> {
  await syncCorePacks();
}
