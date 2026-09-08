/**
 * ثبات موضع/حجم أول سطر + رصيف التلاوة لا يغطي آخر آية + أسماء القراء.
 */
import { test, expect, type Page } from "@playwright/test";

const VIEWPORT = { width: 390, height: 844 };
const MAX_JUMP_PX = 2;
const MAX_SIZE_DELTA_PX = 1;

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
    const fs = Number.parseFloat(getComputedStyle(line).fontSize) || 0;
    return { top: r.top, left: r.left, height: r.height, fontSize: fs };
  });
}

async function lastLineBottom(page: Page) {
  return page.evaluate(() => {
    const lines = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-pane="current"] [data-testid="nm-verse-line"], [data-pane="current"] .nm-line',
      ),
    );
    const last = lines[lines.length - 1];
    return last ? last.getBoundingClientRect().bottom : null;
  });
}

async function flipNext(page: Page) {
  await page.locator(".mm-page-edge--next").click({ force: true });
}

async function flipPrev(page: Page) {
  await page.locator(".mm-page-edge--prev").click({ force: true });
}

async function assertStableFirstLine(page: Page, label: string) {
  const early = await firstLineBox(page);
  expect(early, `سطر أول — ${label}`).not.toBeNull();
  await page.waitForTimeout(300);
  const late = await firstLineBox(page);
  expect(late).not.toBeNull();
  expect(Math.abs(late!.top - early!.top), `قفزة رأسية — ${label}`).toBeLessThanOrEqual(MAX_JUMP_PX);
  expect(Math.abs(late!.height - early!.height), `ارتفاع السطر — ${label}`).toBeLessThanOrEqual(
    MAX_SIZE_DELTA_PX,
  );
  expect(Math.abs(late!.fontSize - early!.fontSize), `font-size — ${label}`).toBeLessThanOrEqual(
    MAX_SIZE_DELTA_PX,
  );
}

test("mushaf p2 — قلبات محددة بلا قفزة حجم", async ({ page }) => {
  for (const [from, to] of [
    [2, 3],
    [3, 4],
    [13, 14],
    [43, 44],
  ] as const) {
    await openMushaf(page, from);
    await flipNext(page);
    await page.waitForSelector(`[data-testid="mushaf-page"][data-page="${to}"]`, {
      timeout: 20000,
    });
    await assertStableFirstLine(page, `${from}→${to}`);
  }

  await flipPrev(page);
  await page.waitForSelector(`[data-testid="mushaf-page"][data-page="43"]`, { timeout: 20000 });
  await assertStableFirstLine(page, "44→43 رجوع");
});

test("mushaf p2 — عشر قلبات + ثبات حجم", async ({ page }) => {
  await openMushaf(page, 20);
  let current = 20;
  for (let i = 0; i < 10; i++) {
    await flipNext(page);
    current += 1;
    await page.waitForSelector(`[data-testid="mushaf-page"][data-page="${current}"]`, {
      timeout: 20000,
    });
    await assertStableFirstLine(page, `قلبة ${i + 1} → ${current}`);
  }
});

test("mushaf p2 — رصيف التلاوة لا يغطي آخر سطر + اسم قارئ", async ({ page }) => {
  await openMushaf(page, 2);
  await page.locator('[data-pane="current"] .nm-word, [data-pane="current"] [data-testid="nm-word"]').first().click({
    force: true,
  });
  await page.waitForTimeout(200);
  const playBtn = page.getByRole("button", { name: /تشغيل|تلاوة|ابدأ/ }).first();
  if (await playBtn.isVisible().catch(() => false)) {
    await playBtn.click({ force: true });
  }

  const dock = page.getByTestId("mushaf-audio-dock");
  await expect(dock).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("mushaf-dock-reciter")).toBeVisible();
  const reciterText = (await page.getByTestId("mushaf-dock-reciter").innerText()).trim();
  expect(reciterText.length).toBeGreaterThan(2);
  expect(reciterText).not.toBe("");

  const lastBottom = await lastLineBottom(page);
  const dockBox = await dock.boundingBox();
  expect(lastBottom).not.toBeNull();
  expect(dockBox).not.toBeNull();
  expect(dockBox!.y, "الرصيف يبدأ تحت آخر سطر").toBeGreaterThanOrEqual((lastBottom ?? 0) - 2);
});

test("mushaf p2 — التفسير يفتح بعنوان واضح", async ({ page }) => {
  await openMushaf(page, 2);
  await page.locator('[data-pane="current"] .nm-word, [data-pane="current"] [data-testid="nm-word"]').first().click({
    force: true,
  });
  const tafsirBtn = page.getByRole("button", { name: /تفسير/ }).first();
  await expect(tafsirBtn).toBeVisible({ timeout: 10000 });
  await tafsirBtn.click();
  const sheet = page.getByTestId("mushaf-tafsir-sheet");
  await expect(sheet).toBeVisible({ timeout: 15000 });
  await expect(sheet.getByRole("heading")).toContainText(/تفسير/);
  await expect(sheet.getByRole("heading")).toContainText(/آية/);
});
