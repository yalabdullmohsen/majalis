/**
 * بوابة تجاوب — مقاسات آيفون/آيباد/سطح المكتب + قبول الموجة ١.
 * يفشل عند scrollWidth > clientWidth أو تراكب شريط الحالة مع الترويسة.
 * المصحف مستثنى صراحة (هندسة مستقلة).
 */
import { test, expect, type Page } from "@playwright/test";
import { waitForContent } from "./helpers";

/** مقاسات القبول الإلزامية + تغطية أجهزة إضافية */
const VIEWPORTS = [
  { name: "iphone-se-320", width: 320, height: 568 },
  { name: "android-sm-360", width: 360, height: 740 },
  { name: "iphone-13-375", width: 375, height: 812 },
  { name: "iphone-14-pro-390", width: 390, height: 844 },
  { name: "iphone-15-pro-max-430", width: 430, height: 932 },
  { name: "ipad-portrait-768", width: 768, height: 1024 },
  { name: "ipad-air-834", width: 834, height: 1194 },
  { name: "ipad-landscape-1024", width: 1024, height: 768 },
  { name: "laptop-1366", width: 1366, height: 768 },
  { name: "ipad-split-820", width: 820, height: 1180 },
  { name: "laptop-1280", width: 1280, height: 800 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "phone-landscape-844x390", width: 844, height: 390 },
] as const;

const ROUTES = [
  "/",
  "/sections",
  "/fiqh",
  "/lessons",
  "/prayer-times",
  "/quran-hub",
  "/competitions",
  "/quiz",
  "/adhkar",
  "/search",
  "/settings",
  "/more",
];

/** مسارات أقسام كانت قديمة — فحص overflow فقط على جوال */
const LEGACY_SECTION_ROUTES = [
  "/islamic-sects",
  "/akhlaq",
  "/stories",
  "/search",
  "/tarikh-islami",
  "/tawhid",
] as const;
const MOBILE_VIEWPORTS = [
  { name: "android-sm", width: 360, height: 740 },
  { name: "iphone-14-pro", width: 390, height: 844 },
  { name: "iphone-15-pro-max", width: 430, height: 932 },
  { name: "phone-landscape", width: 844, height: 390 },
] as const;

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
    const header = document.querySelector(
      "header.navbar-v3, header[role='banner'], .navbar-v3",
    ) as HTMLElement | null;
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

test.describe("legacy-sections mobile overflow", () => {
  for (const vp of MOBILE_VIEWPORTS) {
    for (const route of LEGACY_SECTION_ROUTES) {
      test(`${vp.name} ${route}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await waitForContent(page);
        await page.waitForTimeout(250);
        const label = `${vp.name}@${route}`;
        await assertNoDocOverflow(page, label);
        await assertNoHeaderStatusOverlap(page, label);
      });
    }
  }
});
