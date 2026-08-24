/**
 * بوابة تجاوب — مقاسات آيفون/آيباد/سطح المكتب.
 * يفشل عند scrollWidth > clientWidth أو تراكب شريط الحالة مع الترويسة.
 * المصحف مستثنى صراحة.
 */
import { test, expect, type Page } from "@playwright/test";
import { waitForContent } from "./helpers";

const VIEWPORTS = [
  { name: "iphone-se", width: 320, height: 568 },
  { name: "iphone-13", width: 375, height: 812 },
  { name: "iphone-14-pro", width: 390, height: 844 },
  { name: "iphone-15-pro-max", width: 430, height: 932 },
  { name: "ipad-portrait", width: 768, height: 1024 },
  { name: "ipad-landscape", width: 1024, height: 768 },
  { name: "ipad-split", width: 820, height: 1180 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "ultrawide", width: 1728, height: 1117 },
] as const;

const ROUTES = ["/", "/sections", "/fiqh", "/lessons", "/prayer-times", "/quran-hub", "/competitions", "/more"];

async function assertNoDocOverflow(page: Page, label: string) {
  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      scrollW: Math.max(doc.scrollWidth, body.scrollWidth),
      clientW: doc.clientWidth,
    };
  });
  expect(
    result.scrollW,
    `${label}: تجاوز أفقي (scroll=${result.scrollW} client=${result.clientW})`,
  ).toBeLessThanOrEqual(result.clientW + 1);
}

async function assertNoHeaderStatusOverlap(page: Page, label: string) {
  const overlap = await page.evaluate(() => {
    const header =
      document.querySelector("header.navbar-v3, header[role='banner'], .navbar-v3") as HTMLElement | null;
    if (!header) return null;
    const r = header.getBoundingClientRect();
    return { top: r.top, height: r.height };
  });
  if (!overlap) return;
  expect(overlap.top, `${label}: الترويسة تحت شريط الحالة`).toBeGreaterThanOrEqual(-1);
  expect(overlap.height, `${label}: ارتفاع ترويسة غير معقول`).toBeLessThan(220);
}

test.describe("responsive-overflow gate", () => {
  for (const vp of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`${vp.name} ${route}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await waitForContent(page);
        await page.waitForTimeout(250);
        const label = `${vp.name}@${route}`;
        await assertNoDocOverflow(page, label);
        await assertNoHeaderStatusOverlap(page, label);
        await expect(page.locator("body")).toBeVisible();
      });
    }
  }
});
