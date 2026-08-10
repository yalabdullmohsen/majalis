/**
 * Background sync: warm IndexedDB packs when online / on reconnect.
 * Safe to call multiple times — coalesces concurrent runs.
 * Part 21: adaptive heartbeat + jitter suppressor (no fixed setInterval storms).
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
import {
  createAdaptiveHeartbeat,
  type AdaptiveHeartbeatHandle,
} from "@/lib/adaptive-heartbeat";

let started = false;
let syncing: Promise<void> | null = null;
let heartbeat: AdaptiveHeartbeatHandle | null = null;

const CORE_SURAHS = [1, 18, 36, 55, 67, 112, 113, 114];

async function syncCorePacks(): Promise<boolean> {
  if (!isOnline()) return false;

  // Data Saver / weak network: skip heavy warm; still allow outbox flush elsewhere
  try {
    const { shouldDeferHeavySync } = await import("@/lib/sync-outbox");
    if (shouldDeferHeavySync()) {
      const last = await getLastContentSync();
      if (last) return true;
      // First-time: still warm a minimal core (list + Fatiha only) below via CORE_SURAHS slice
    }
  } catch {
    /* optional */
  }

  if (syncing) {
    await syncing;
    return true;
  }

  let ok = true;
  syncing = (async () => {
    try {
      // Migrate legacy raw-IDB packs into Dexie engine (best-effort, once)
      try {
        const { migrateLegacyOfflineDb } = await import("@/lib/offline-engine");
        await migrateLegacyOfflineDb();
      } catch {
        /* ignore */
      }

      const { shouldDeferHeavySync } = await import("@/lib/sync-outbox");
      const light = shouldDeferHeavySync();
      const surahsToWarm = light ? CORE_SURAHS.slice(0, 3) : CORE_SURAHS;

      // Quran list + core surahs (local-first fetchSurahDetail already prefers /data/quran)
      const { fetchSurahList, fetchSurahDetail } = await import("@/lib/quran-api");
      const list = await fetchSurahList();
      await cacheQuranSurahList(list, `surah-list:${list.length}`);

      await Promise.all(
        surahsToWarm.map(async (n) => {
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

      // ترحيل المفضّلات من localStorage → Dexie (مرة عند الدفء)
      try {
        const { listLocalBookmarks } = await import("@/lib/local-bookmarks");
        const { migrateLocalBookmarksToIdb } = await import("@/lib/offline-bookmarks");
        await migrateLocalBookmarksToIdb(listLocalBookmarks());
      } catch {
        /* optional */
      }

      // Curated fawaid excerpts (articles/books-style content) — skip on data saver
      if (!light) {
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
      }

      await markContentSynced();
      // Part 19: confirm sync receipt with SW via MessageChannel (timeout-safe)
      try {
        const { swNotifyOfflineSync } = await import("@/lib/sw-message-channel");
        void swNotifyOfflineSync({ at: Date.now(), packs: "core" });
      } catch {
        /* SW optional */
      }
    } catch {
      ok = false;
    } finally {
      syncing = null;
    }
  })();

  await syncing;
  return ok;
}

async function maybeSoftRefresh(): Promise<boolean> {
  if (!isOnline()) return false;
  try {
    const last = await getLastContentSync();
    const age = last ? Date.now() - new Date(last.updatedAt).getTime() : Infinity;
    if (age > 6 * 60 * 60 * 1000) {
      return await syncCorePacks();
    }
    return true;
  } catch {
    return false;
  }
}

/** Start listeners once from App shell — no UI / CSS. */
export function startOfflineSync(): void {
  if (typeof window === "undefined" || started) return;
  started = true;

  try {
    void import("@/lib/flashcard-service").then((m) => m.ensureFlashcardOutboxHandler());
  } catch {
    /* optional */
  }

  // Initial warm after idle so first paint stays light
  const kick = () => {
    void syncCorePacks().then((ok) => {
      if (ok) heartbeat?.notifySuccess();
      else heartbeat?.notifyFailure();
    });
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(kick);
  } else {
    globalThis.setTimeout(kick, 2_500);
  }

  window.addEventListener("online", () => {
    // Part 21: reconnect burst → exponential jitter, not an immediate herd
    heartbeat?.notifyReconnect();
    void (async () => {
      try {
        const { flushOutbox } = await import("@/lib/sync-outbox");
        await flushOutbox();
      } catch {
        /* optional */
      }
      try {
        const { syncDirtyFlashcardReviews } = await import("@/lib/flashcard-service");
        const { getSupabaseClient } = await import("@/lib/supabase-bootstrap");
        const client = getSupabaseClient();
        const {
          data: { user },
        } = await client.auth.getUser();
        if (user?.id) await syncDirtyFlashcardReviews(user.id);
      } catch {
        /* optional */
      }
      const ok = await syncCorePacks();
      if (ok) heartbeat?.notifySuccess();
      else heartbeat?.notifyFailure();
    })();
  });

  heartbeat = createAdaptiveHeartbeat({
    baseIntervalMs: 30 * 60 * 1000,
    minIntervalMs: 2 * 60 * 1000,
    maxIntervalMs: 6 * 60 * 60 * 1000,
    onTick: () => maybeSoftRefresh(),
  });
  heartbeat.start();
}

/** Manual sync trigger (settings / vault). */
export async function forceOfflineContentSync(): Promise<void> {
  const ok = await syncCorePacks();
  if (ok) heartbeat?.notifySuccess();
  else heartbeat?.notifyFailure();
}

/** Test / diagnostics */
export function getOfflineSyncHeartbeat(): AdaptiveHeartbeatHandle | null {
  return heartbeat;
}
