/**
 * ثبات موضع أول سطر آيات عند قلب الصفحة — iPhone viewport.
 * يفشل إذا تحرّك الصندوق المحيط لمنطقة الآيات أكثر من 2px خلال 300ms بعد الظهور.
 */
import { test, expect, type Page } from "@playwright/test";

const VIEWPORT = { width: 390, height: 844 };
const MAX_JUMP_PX = 2;

test.use({ viewport: VIEWPORT });

async function openMushaf(page: Page, n: number) {
  await page.addInitScript(() => {
    try {
      window.sessionStorage.setItem("mj.launch-splash.session.v3", "1");
    } catch {
      /* ignore */
    }
  });
  await page.goto(`/mushaf?page=${n}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(`[data-testid="mushaf-page"][data-page="${n}"]`, {
    timeout: 25000,
  });
  await page.waitForTimeout(200);
}

async function firstLineBox(page: Page) {
  return page.evaluate(() => {
    const line =
      document.querySelector<HTMLElement>('[data-pane="current"] [data-testid="nm-verse-line"]') ||
      document.querySelector<HTMLElement>('[data-pane="current"] .nm-line');
    if (!line) return null;
    const r = line.getBoundingClientRect();
    return { top: r.top, left: r.left, height: r.height };
  });
}

async function flipNext(page: Page) {
  await page.locator(".mm-page-edge--next").click({ force: true });
}

test("mushaf page flip — لا قفزة لأول سطر بعد الظهور", async ({ page }) => {
  await openMushaf(page, 1);

  for (const target of [2, 3, 4]) {
    await flipNext(page);
    await page.waitForSelector(`[data-testid="mushaf-page"][data-page="${target}"]`, {
      timeout: 20000,
    });
    const early = await firstLineBox(page);
    expect(early, `سطر أول على صفحة ${target}`).not.toBeNull();
    await page.waitForTimeout(300);
    const late = await firstLineBox(page);
    expect(late).not.toBeNull();
    const dy = Math.abs((late!.top) - (early!.top));
    expect(dy, `قفزة رأسية ${dy}px على صفحة ${target}`).toBeLessThanOrEqual(MAX_JUMP_PX);
  }
});

test("mushaf page flip — صفحات وسطية سريعة", async ({ page }) => {
  await openMushaf(page, 20);

  for (const target of [21, 22]) {
    await flipNext(page);
    await page.waitForSelector(`[data-testid="mushaf-page"][data-page="${target}"]`, {
      timeout: 20000,
    });
    const early = await firstLineBox(page);
    expect(early).not.toBeNull();
    await page.waitForTimeout(300);
    const late = await firstLineBox(page);
    expect(late).not.toBeNull();
    expect(Math.abs(late!.top - early!.top)).toBeLessThanOrEqual(MAX_JUMP_PX);
  }

  /* عشر قلبات متتالية — لا انهيار ولا قفزة كبيرة على آخر ظهور */
  for (let i = 0; i < 10; i++) {
    await flipNext(page);
    await page.waitForTimeout(80);
  }
  await page.waitForSelector('[data-testid="mushaf-page"]', { timeout: 20000 });
  const early = await firstLineBox(page);
  expect(early).not.toBeNull();
  await page.waitForTimeout(300);
  const late = await firstLineBox(page);
  expect(late).not.toBeNull();
  expect(Math.abs(late!.top - early!.top)).toBeLessThanOrEqual(MAX_JUMP_PX);
});
