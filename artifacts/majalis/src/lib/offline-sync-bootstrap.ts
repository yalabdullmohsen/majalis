/**
 * Background sync: warm IndexedDB packs when online / on reconnect.
 * Safe to call multiple times — coalesces concurrent runs.
 * Interval + listeners are cleaned via stopOfflineSync (pagehide / tests).
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

let started = false;
let syncing: Promise<void> | null = null;
let intervalId: number | null = null;
let onlineHandler: (() => void) | null = null;

async function syncCorePacks(): Promise<void> {
  if (!isOnline()) return;
  if (syncing) return syncing;

  syncing = (async () => {
    try {
      // Migrate legacy raw-IDB packs into Dexie engine (best-effort, once)
      try {
        const { migrateLegacyOfflineDb, ensureOfflineSchema } = await import("@/lib/offline-engine");
        await ensureOfflineSchema();
        await migrateLegacyOfflineDb();
      } catch {
        /* ignore */
      }

      // Automated schema migrations (additive, ledgered)
      try {
        const { runSchemaMigrations } = await import("@/lib/idb-schema-migrate");
        await runSchemaMigrations();
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
    } finally {
      syncing = null;
    }
  })();

  return syncing;
}

const CORE_SURAHS = [1, 18, 36, 55, 67, 112, 113, 114];

/** Start listeners once from App shell — no UI / CSS. */
export function startOfflineSync(): void {
  if (typeof window === "undefined" || started) return;
  started = true;

  // Offline mutation queue (bookmarks / streaks) — flush on reconnect
  void import("@/lib/offline-action-queue").then((m) => {
    m.startOfflineActionQueue();
    // Register default handlers that re-apply local mutations (already applied optimistically)
    m.registerOfflineActionHandler("bookmark_toggle", async () => {
      /* local toggle already committed — queue entry is a sync beacon */
    });
    m.registerOfflineActionHandler("streak_record", async () => {
      /* local streak already committed */
    });
    m.registerOfflineActionHandler("progress_set", async () => {
      /* local progress already committed */
    });
  });

  // Initial warm after idle so first paint stays light
  const kick = () => {
    void syncCorePacks();
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(kick);
  } else {
    globalThis.setTimeout(kick, 2_500);
  }

  onlineHandler = () => {
    void syncCorePacks();
    void import("@/lib/offline-action-queue").then((m) => m.flushOfflineActionQueue());
  };
  window.addEventListener("online", onlineHandler);

  // Periodic soft refresh while tab is open (6h) — store id for teardown
  intervalId = window.setInterval(() => {
    void getLastContentSync().then((last) => {
      const age = last ? Date.now() - new Date(last.updatedAt).getTime() : Infinity;
      if (age > 6 * 60 * 60 * 1000) void syncCorePacks();
    });
  }, 30 * 60 * 1000);
}

/** Tear down interval + online listener (tests / HMR). */
export function stopOfflineSync(): void {
  if (intervalId != null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
  if (onlineHandler) {
    window.removeEventListener("online", onlineHandler);
    onlineHandler = null;
  }
  started = false;
}

/** Manual sync trigger (settings / vault). */
export async function forceOfflineContentSync(): Promise<void> {
  await syncCorePacks();
}
