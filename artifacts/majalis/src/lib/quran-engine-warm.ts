/**
 * تدفئة كاش المصحف: فهارس IDB + صفحات QPC + خطوط + إشعار Service Worker.
 * يعمل على دفعات مع yieldToMain — لا يحجب INP.
 */
import { yieldToMain, afterNextPaint } from "@/lib/yield-to-main";
import { getQuranEngineState, patchQuranEngineState } from "@/lib/quran-engine-store";
import { registerQuranEngineDisposable } from "@/lib/quran-engine-teardown";
import { swChannelRequest } from "@/lib/sw-message-channel";
import { loadMutashabihatIndexCached } from "@/lib/mutashabihat-idb";
import { loadChapters, prefetchMushafPage } from "@/lib/mushaf-v2-data";
import { warmQuranSearchIndex } from "@/lib/quran-local-search";
import { loadPageJuzIndex } from "@/lib/recitation-ai/page-juz-lookup";
import { isQuranIndexingSuspended } from "@/lib/quran-offline/lifecycle-flags";

const TOTAL_PAGES = 604;
const PAGE_CHUNK = 6;
const FONT_NEAR = 4;

const INDEX_URLS = [
  "/data/quran-v2/chapters.json",
  "/data/quran/mutashabihat-index.json",
  "/data/quran/page-juz-index.json",
  "/data/quran/pages-manifest.json",
  "/data/quran/quran-position-index.json",
  "/data/quran/manifest.json",
];

function pageJsonUrl(n: number): string {
  return `/data/quran-v2/pages/page-${String(n).padStart(3, "0")}.json`;
}

function pageFontUrl(n: number): string {
  return `/fonts/qpc-v2/p${n}.woff2`;
}

function scheduleIdle(cb: () => void): number {
  if (typeof requestIdleCallback === "function") {
    return requestIdleCallback(() => cb(), { timeout: 2500 }) as unknown as number;
  }
  return window.setTimeout(cb, 120) as unknown as number;
}

function cancelIdle(id: number): void {
  if (typeof cancelIdleCallback === "function") {
    try {
      cancelIdleCallback(id);
      return;
    } catch {
      /* fall through */
    }
  }
  window.clearTimeout(id);
}

async function cacheUrlsViaSw(urls: string[], signal?: AbortSignal): Promise<number> {
  if (signal?.aborted) return 0;
  const res = await swChannelRequest(
    { type: "MAJALIS_QURAN_PRECACHE", payload: { urls, buildScope: "quran-engine" } },
    {
      timeoutMs: 60_000,
      fallback: { ok: false, type: "MAJALIS_QURAN_PRECACHE", id: "fallback", error: "no-sw" },
    },
  );
  if (!res.ok) {
    // احتياطي: تدفئة عبر fetch العادي (سيُخزَّن بسياسة SW cache-first إن وُجدت)
    let n = 0;
    for (const url of urls) {
      if (signal?.aborted) break;
      try {
        await fetch(url, { credentials: "same-origin", cache: "force-cache" });
        n += 1;
      } catch {
        /* skip */
      }
      if (n % 4 === 0) await yieldToMain();
    }
    return n;
  }
  const payload = res.payload as { cached?: number } | undefined;
  return payload?.cached ?? urls.length;
}

/**
 * تدفئة كاملة تدريجية لصفحات 1–604 (JSON) + خطوط حول الصفحة الحالية.
 * قابلة للإيقاف عبر AbortSignal.
 */
export async function warmQuranEngineCaches(
  signal: AbortSignal,
  opts?: { focusPage?: number; fullPages?: boolean },
): Promise<void> {
  const focus = Math.min(TOTAL_PAGES, Math.max(1, opts?.focusPage ?? 1));
  // Under memory pressure: skip full background indexing / page crawl
  const fullPages =
    opts?.fullPages !== false && !isQuranIndexingSuspended() && !signal.aborted;

  const idleHandles: number[] = [];
  const unreg = registerQuranEngineDisposable(() => {
    idleHandles.forEach(cancelIdle);
    idleHandles.length = 0;
  });

  try {
    patchQuranEngineState({ warmPhase: "indexes" });
    await afterNextPaint();
    if (signal.aborted) {
      patchQuranEngineState({ warmPhase: "aborted" });
      return;
    }

    await Promise.all([
      loadMutashabihatIndexCached().catch(() => null),
      loadChapters().catch(() => null),
      loadPageJuzIndex().catch(() => null),
      warmQuranSearchIndex(signal).catch(() => null),
    ]);
    await yieldToMain();
    await cacheUrlsViaSw(INDEX_URLS, signal);

    // مواضيع قرآنية — وحدة ثابتة في الحزمة؛ لا شبكة
    try {
      await import("@/lib/quran-topics-index");
    } catch {
      /* ignore */
    }

    patchQuranEngineState({ warmPhase: "pages", pagesCached: 0 });

    // أولوية: الصفحة الحالية والجوار
    const nearPages: number[] = [];
    for (let d = -FONT_NEAR; d <= FONT_NEAR; d++) {
      const p = focus + d;
      if (p >= 1 && p <= TOTAL_PAGES) nearPages.push(p);
    }
    for (const p of nearPages) {
      if (signal.aborted) break;
      prefetchMushafPage(p);
    }
    await cacheUrlsViaSw(
      [
        ...nearPages.map(pageJsonUrl),
        ...nearPages.map(pageFontUrl),
      ],
      signal,
    );
    patchQuranEngineState({
      pagesCached: nearPages.length,
      fontsCached: nearPages.length,
      warmPhase: "fonts",
    });

    if (!fullPages || signal.aborted) {
      patchQuranEngineState({ warmPhase: signal.aborted ? "aborted" : "done" });
      return;
    }

    // بقية الصفحات على دفعات في أوقات الخمول
    await new Promise<void>((resolve) => {
      let cursor = 1;
      const step = () => {
        if (signal.aborted || isQuranIndexingSuspended()) {
          patchQuranEngineState({ warmPhase: "aborted" });
          resolve();
          return;
        }
        const batch: number[] = [];
        while (batch.length < PAGE_CHUNK && cursor <= TOTAL_PAGES) {
          if (!nearPages.includes(cursor)) batch.push(cursor);
          cursor += 1;
        }
        if (batch.length === 0 && cursor > TOTAL_PAGES) {
          patchQuranEngineState({ warmPhase: "done" });
          resolve();
          return;
        }
        void (async () => {
          for (const p of batch) prefetchMushafPage(p);
          const cached = await cacheUrlsViaSw(
            [...batch.map(pageJsonUrl), ...batch.map(pageFontUrl)],
            signal,
          );
          const prev = getQuranEngineState();
          patchQuranEngineState({
            pagesCached: Math.min(TOTAL_PAGES, prev.pagesCached + batch.length),
            fontsCached: Math.min(TOTAL_PAGES, prev.fontsCached + Math.floor(cached / 2)),
            warmPhase: cursor > TOTAL_PAGES ? "done" : "pages",
          });
          await yieldToMain();
          if (cursor > TOTAL_PAGES || signal.aborted) {
            patchQuranEngineState({ warmPhase: signal.aborted ? "aborted" : "done" });
            resolve();
            return;
          }
          idleHandles.push(scheduleIdle(step));
        })();
      };
      idleHandles.push(scheduleIdle(step));
    });
  } catch {
    if (!signal.aborted) patchQuranEngineState({ warmPhase: "error" });
  } finally {
    unreg();
  }
}
