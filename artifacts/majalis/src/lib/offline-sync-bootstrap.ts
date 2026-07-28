/**
 * Offline pack sync bootstrap — warm IndexedDB when online / on reconnect.
 * Part 10: harmony lock + battery/power-saver aware polling + cleanup-safe interval.
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
import { withHarmonyLock, coalesceAsync } from "@/lib/system-harmony";
import { getPowerSaverState, scaleIntervalMs, scheduleNonCriticalWork } from "@/lib/power-saver-engine";
import { getBatteryThrottleState } from "@/lib/battery-throttle";

let started = false;
let syncBucket: { current: Promise<void> | null } = { current: null };
let pollTimer: number | null = null;

const CORE_SURAHS = [1, 18, 36, 55, 67, 112, 113, 114];

async function syncCorePacks(): Promise<void> {
  if (!isOnline()) return;
  return coalesceAsync(syncBucket, () =>
    withHarmonyLock("offline-pack", async () => {
      try {
        try {
          const { migrateLegacyOfflineDb } = await import("@/lib/offline-engine");
          await migrateLegacyOfflineDb();
        } catch {
          /* ignore */
        }

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

        const { ADHKAR_ITEMS } = await import("@/lib/adhkar-seed");
        await cacheAdhkarPack(ADHKAR_ITEMS, `adhkar:${ADHKAR_ITEMS.length}`);

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
        /* coalesceAsync clears bucket */
      }
    }),
  );
}

function schedulePollTick(): void {
  if (pollTimer != null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
  const battery = getBatteryThrottleState();
  const baseMs = battery.deferBackground ? 90 * 60 * 1000 : 30 * 60 * 1000;
  const ms = scaleIntervalMs(baseMs);
  pollTimer = window.setInterval(() => {
    const ps = getPowerSaverState();
    const bat = getBatteryThrottleState();
    if (ps.throttleBackground || bat.deferBackground) {
      scheduleNonCriticalWork(() => {
        void getLastContentSync().then((last) => {
          const age = last ? Date.now() - new Date(last.updatedAt).getTime() : Infinity;
          if (age > 6 * 60 * 60 * 1000) void syncCorePacks();
        });
      });
      return;
    }
    void getLastContentSync().then((last) => {
      const age = last ? Date.now() - new Date(last.updatedAt).getTime() : Infinity;
      if (age > 6 * 60 * 60 * 1000) void syncCorePacks();
    });
  }, ms);
}

/** Start listeners once from App shell — no UI / CSS. */
export function startOfflineSync(): void {
  if (typeof window === "undefined" || started) return;
  started = true;

  const kick = () => {
    const bat = getBatteryThrottleState();
    if (bat.deferBackground) {
      scheduleNonCriticalWork(() => {
        void syncCorePacks();
      });
    } else {
      void syncCorePacks();
    }
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(kick);
  } else {
    globalThis.setTimeout(kick, 2_500);
  }

  window.addEventListener("online", () => {
    void syncCorePacks();
  });

  schedulePollTick();
  window.addEventListener("majalis-battery-throttle", () => schedulePollTick());
  window.addEventListener("majalis-power-saver", () => schedulePollTick());
}

/** Manual sync trigger (settings / vault). */
export async function forceOfflineContentSync(): Promise<void> {
  await syncCorePacks();
}
