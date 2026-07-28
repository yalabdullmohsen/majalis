/**
 * Storage quota inspector + proactive cache rotation.
 * Uses navigator.storage.estimate() and coordinates with SW + LRU eviction.
 */

import { inspectStorage, evictLruCache, maybeAutoEvictStorage, touchCacheAccess } from "@/lib/smart-cache-eviction";

export type QuotaSnapshot = {
  usage: number;
  quota: number;
  ratio: number;
  pressure: "ok" | "warn" | "critical";
  inspectedAt: string;
};

const WARN_RATIO = 0.7;
const CRITICAL_RATIO = 0.85;

export async function estimateStorageQuota(): Promise<QuotaSnapshot> {
  let usage = 0;
  let quota = 0;
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      usage = est.usage ?? 0;
      quota = est.quota ?? 0;
    }
  } catch {
    /* ignore */
  }

  if (!usage || !quota) {
    try {
      const report = await inspectStorage();
      usage = usage || report.estimatedUsage;
      quota = quota || report.estimatedQuota || report.estimatedUsage * 2;
    } catch {
      /* ignore */
    }
  }

  const ratio = quota > 0 ? usage / quota : 0;
  const pressure = ratio >= CRITICAL_RATIO ? "critical" : ratio >= WARN_RATIO ? "warn" : "ok";
  return {
    usage,
    quota,
    ratio,
    pressure,
    inspectedAt: new Date().toISOString(),
  };
}

/**
 * Purge redundant Cache API entries (old builds, oversized data caches)
 * and ephemeral LS/IDB when under pressure.
 */
export async function rotateCachesForQuota(): Promise<{
  quota: QuotaSnapshot;
  removedCaches: string[];
  evictionRemoved: string[];
}> {
  const removedCaches: string[] = [];
  const snap = await estimateStorageQuota();

  try {
    if (typeof caches !== "undefined") {
      const names = await caches.keys();
      const offline = names.filter((n) => n.startsWith("majalis-offline-")).sort();
      const data = names.filter((n) => n.startsWith("majalis-data-")).sort();
      // Keep only newest offline + data caches
      for (const group of [offline, data]) {
        if (group.length <= 1) continue;
        for (const old of group.slice(0, -1)) {
          await caches.delete(old);
          removedCaches.push(old);
        }
      }

      // Under pressure: trim entries inside current DATA cache (audio/text chunks)
      if (snap.pressure !== "ok") {
        const newestData = data[data.length - 1];
        if (newestData) {
          const trimmed = await trimDataCacheEntries(newestData, snap.pressure === "critical" ? 40 : 80);
          if (trimmed > 0) removedCaches.push(`${newestData}#trimmed:${trimmed}`);
        }
      }
    }
  } catch {
    /* ignore */
  }

  let evictionRemoved: string[] = [];
  if (snap.pressure === "warn" || snap.pressure === "critical") {
    const result = await evictLruCache({
      targetUsageRatio: snap.pressure === "critical" ? 0.6 : 0.7,
      maxRemovals: snap.pressure === "critical" ? 50 : 25,
      force: snap.pressure === "critical",
    });
    evictionRemoved = result.removed;
  } else {
    const soft = await maybeAutoEvictStorage();
    evictionRemoved = soft?.removed ?? [];
  }

  // Ask SW to self-trim if available
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    reg?.active?.postMessage({
      type: "MAJALIS_QUOTA_ROTATE",
      pressure: snap.pressure,
      usage: snap.usage,
      quota: snap.quota,
    });
  } catch {
    /* ignore */
  }

  return {
    quota: await estimateStorageQuota(),
    removedCaches,
    evictionRemoved,
  };
}

/** Drop oldest / audio-like entries from a Cache Storage bucket. */
async function trimDataCacheEntries(cacheName: string, keepMax: number): Promise<number> {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= keepMax) return 0;

    // Prefer deleting audio / large media first, then oldest by URL order
    const scored = keys.map((req) => {
      const u = req.url.toLowerCase();
      const isAudio = /\.(mp3|m4a|ogg|wav|webm)(\?|$)/.test(u) || u.includes("everyayah") || u.includes("mp3quran");
      const isChunk = u.includes("/data/quran-v2/pages/") || u.includes("ttl:") || u.includes("prefetch");
      return { req, score: (isAudio ? 0 : isChunk ? 1 : 2) };
    });
    scored.sort((a, b) => a.score - b.score);

    const toDelete = scored.slice(0, Math.max(0, keys.length - keepMax));
    await Promise.all(toDelete.map((x) => cache.delete(x.req)));
    return toDelete.length;
  } catch {
    return 0;
  }
}

/** Boot-safe: estimate + rotate when needed. */
export async function runQuotaSafeguardOnBoot(): Promise<void> {
  try {
    touchCacheAccess("quota-boot");
    const snap = await estimateStorageQuota();
    if (snap.pressure === "ok") {
      await maybeAutoEvictStorage();
      return;
    }
    await rotateCachesForQuota();
  } catch {
    /* never block boot */
  }
}
