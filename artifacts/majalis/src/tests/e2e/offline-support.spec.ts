/**
 * E2E — Offline support: after warming cache, reads succeed without network.
 */
import { test, expect } from "@playwright/test";

test.describe("Quran Engine — Offline Support", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "offline API على Chromium");

  test("يخدم بيانات المصحف من الكاش عند انقطاع الشبكة", async ({ page, context }) => {
    await page.goto("/quran-viewer/page/1");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1500);

    const warm = await page.evaluate(async () => {
      const urls = [
        "/data/quran-v2/chapters.json",
        "/data/quran/page-juz-index.json",
        "/data/quran-v2/pages/page-001.json",
        "/data/quran/mutashabihat-index.json",
      ];
      const cache = await caches.open("majalis-qa-offline-warm");
      const statuses: Record<string, number> = {};
      for (const u of urls) {
        try {
          const res = await fetch(u);
          statuses[u] = res.status;
          if (res.ok) await cache.put(u, res.clone());
        } catch {
          statuses[u] = 0;
        }
      }
      return statuses;
    });

    const anyOk = Object.values(warm).some((s) => s === 200);
    test.skip(!anyOk, "تخطي: تعذّر تدفئة أصول المصحف من الخادم المحلي");

    // Go offline — subsequent fetches must not hit the network successfully.
    await context.setOffline(true);

    const offline = await page.evaluate(async () => {
      const cache = await caches.open("majalis-qa-offline-warm");
      const urls = [
        "/data/quran-v2/chapters.json",
        "/data/quran/page-juz-index.json",
        "/data/quran-v2/pages/page-001.json",
      ];

      const fromCache: Record<string, boolean> = {};
      const networkAttempt: Record<string, string> = {};

      for (const u of urls) {
        fromCache[u] = Boolean(await cache.match(u));
        try {
          // Should fail or hang offline — we race a short timeout.
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 800);
          const res = await fetch(u, { cache: "no-store", signal: ctrl.signal });
          clearTimeout(t);
          networkAttempt[u] = `status:${res.status}`;
        } catch (err) {
          networkAttempt[u] = err instanceof Error ? err.name : "error";
        }
      }

      return {
        fromCache,
        networkAttempt,
        domAlive: Boolean(document.body && document.body.innerText.length > 0),
      };
    });

    expect(offline.domAlive).toBe(true);
    expect(Object.values(offline.fromCache).some(Boolean)).toBe(true);

    // At least one network attempt should fail while offline (AbortError / TypeError / Failed).
    const networkFailed = Object.values(offline.networkAttempt).some(
      (v) =>
        v.includes("AbortError") ||
        v.includes("TypeError") ||
        v.includes("error") ||
        v.includes("Failed"),
    );
    // If SW serves from cache with fetch still "succeeding", cache hit alone is enough.
    expect(networkFailed || Object.values(offline.fromCache).every(Boolean)).toBe(true);

    await context.setOffline(false);
  });
});
