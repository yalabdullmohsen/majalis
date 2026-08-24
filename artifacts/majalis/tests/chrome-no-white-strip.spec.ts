import { test, expect } from "@playwright/test";
import { WHITE_STRIP_MAX_RATIO } from "../src/lib/chrome-white-strip";

const VIEW = { width: 390, height: 844 };
const CLIP = { x: 0, y: 844 - 220, width: 390, height: 220 };
const ROUTES = ["/", "/prayer-times", "/mushaf", "/lessons", "/fiqh", "/sections"];

async function assertBottomNotWhite(page, label) {
  const shot = await page.screenshot({ clip: CLIP, type: "png" });
  const ratio = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d");
    if (!ctx) return 1;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, img.width, img.height).data;
    let white = 0;
    const n = img.width * img.height;
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      const luma = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
      if (data[o + 3] >= 10 && luma > 235) white += 1;
    }
    return white / n;
  }, shot.toString("base64"));
  expect(ratio, label).toBeLessThanOrEqual(WHITE_STRIP_MAX_RATIO);
}

async function assertNavFlushToBottom(page, label) {
  const gap = await page.evaluate(() => {
    const nav = document.querySelector(".bottom-nav");
    if (!nav) return Number.POSITIVE_INFINITY;
    const bottom = nav.getBoundingClientRect().bottom;
    return Math.max(0, window.innerHeight - bottom);
  });
  expect(gap, label).toBeLessThanOrEqual(1);
}

test.describe("لا شريط أبيض فوق التنقّل السفلي", () => {
  test.use({
    viewport: VIEW,
    deviceScaleFactor: 3,
    locale: "ar-KW",
    isMobile: true,
  });

  for (const route of ROUTES) {
    test(`${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
      await assertNavFlushToBottom(page, `${route} nav flush`);
      if (route === "/prayer-times") {
        await assertBottomNotWhite(page, route);
      }
    });
  }

  test("/prayer-times شبكة الأدوات ظاهرة", async ({ page }) => {
    await page.goto("/prayer-times", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await expect(page.locator(".pts-dock__item")).toHaveCount(4);
    await expect(page.locator(".pts-annual")).toHaveCount(0);
    await assertNavFlushToBottom(page, "prayer dock nav flush");
    await assertBottomNotWhite(page, "prayer dock bottom");
  });

  test("الدرج مفتوح من اليمين", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await page.locator(".navbar-menu-btn--drawer").click();
    await expect(page.locator("#drawer-root[data-open='true'] .drawer-panel")).toBeVisible();
    const box = await page.locator("#drawer-root[data-open='true'] .drawer-panel").boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.x + box.width).toBeGreaterThan(VIEW.width - 8);
    }
    await assertNavFlushToBottom(page, "drawer open nav flush");
  });
});
