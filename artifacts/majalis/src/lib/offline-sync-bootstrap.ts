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
    void syncCorePacks().then((ok) => {
      if (ok) heartbeat?.notifySuccess();
      else heartbeat?.notifyFailure();
    });
    // Quran outbox drain on reconnect (schema layer — no UI)
    void import("@/lib/quran-offline/outbox-sync")
      .then((m) => m.drainQuranOutbox())
      .catch(() => undefined);
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
