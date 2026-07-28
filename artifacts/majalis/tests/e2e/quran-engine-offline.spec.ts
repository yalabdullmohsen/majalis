/**
 * E2E — Offline resilience for Quran reader after cache warm.
 */
import { test, expect } from "@playwright/test";
import { waitForContent } from "../helpers";

test.describe("Quran Engine — وضع عدم الاتصال", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "offline API على Chromium");

  test("بعد التحميل الأول تبقى فهارس المصحف قابلة للقراءة من الكاش دون شبكة", async ({ page, context }) => {
    await page.goto("/mushaf/page/1");
    await waitForContent(page);
    await page.waitForTimeout(2000);

    // دفّئ أصول محلية في كاش HTTP للمتصفح
    const warm = await page.evaluate(async () => {
      const urls = [
        "/data/quran-v2/chapters.json",
        "/data/quran/mutashabihat-index.json",
        "/data/quran/page-juz-index.json",
        "/data/quran-v2/pages/page-001.json",
      ];
      const out: Record<string, number> = {};
      for (const u of urls) {
        try {
          const r = await fetch(u);
          out[u] = r.status;
          // خزن في Cache Storage يدوياً لمحاكاة SW precache في بيئة التطوير
          const cache = await caches.open("majalis-qa-quran-warm");
          if (r.ok) await cache.put(u, r.clone());
        } catch {
          out[u] = 0;
        }
      }
      return out;
    });
    expect(Object.values(warm).some((s) => s === 200)).toBe(true);

    await context.setOffline(true);

    const offlineRead = await page.evaluate(async () => {
      const cache = await caches.open("majalis-qa-quran-warm");
      const urls = [
        "/data/quran-v2/chapters.json",
        "/data/quran/mutashabihat-index.json",
        "/data/quran-v2/pages/page-001.json",
      ];
      const result: Record<string, boolean> = {};
      for (const u of urls) {
        const hit = await cache.match(u);
        result[u] = Boolean(hit);
      }
      // الصفحة الحالية ما زالت في الذاكرة
      result["dom-alive"] = Boolean(document.body && document.body.innerText.length > 0);
      return result;
    });

    expect(offlineRead["dom-alive"]).toBe(true);
    expect(
      offlineRead["/data/quran-v2/chapters.json"] ||
        offlineRead["/data/quran/mutashabihat-index.json"] ||
        offlineRead["/data/quran-v2/pages/page-001.json"],
    ).toBe(true);

    await context.setOffline(false);
  });
});
