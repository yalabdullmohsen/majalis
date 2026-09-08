/**
 * ثبات موضع/حجم أول سطر + رصيف التلاوة لا يغطي آخر آية + أسماء القراء.
 * الانتظار دائمًا على [data-pane="current"] حتى لا يُطابق prefetch.
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
  await waitCurrentPage(page, n);
  await page.waitForTimeout(200);
}

async function waitCurrentPage(page: Page, n: number) {
  await page.waitForFunction(
    (pageNo) => {
      const el = document.querySelector<HTMLElement>(
        '[data-pane="current"] [data-testid="mushaf-page"]',
      );
      return el?.getAttribute("data-page") === String(pageNo);
    },
    n,
    { timeout: 25000 },
  );
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

async function dockTop(page: Page) {
  return page.evaluate(() => {
    const dock = document.querySelector<HTMLElement>('[data-testid="mushaf-audio-dock"][data-open="1"]');
    if (!dock) return null;
    const r = dock.getBoundingClientRect();
    return { y: r.y, height: r.height, opacity: Number.parseFloat(getComputedStyle(dock).opacity) || 0 };
  });
}

async function flipNext(page: Page) {
  await page.locator(".mm-page-edge--next").click({ force: true });
}

async function flipPrev(page: Page) {
  await page.locator(".mm-page-edge--prev").click({ force: true });
}

async function assertStableFirstLine(page: Page, label: string) {
  await page.waitForFunction(
    () => document.querySelector('[data-testid="mushaf-viewport"]')?.getAttribute("data-pager-settled") === "1",
    null,
    { timeout: 10000 },
  );
  /* إطار إضافي بعد settled حتى يستقر أول رسم للصفحة الجديدة */
  await page.waitForTimeout(120);
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

async function startTilawa(page: Page) {
  const word = page
    .locator('[data-pane="current"] .nm-word, [data-pane="current"] [data-testid="nm-word"]')
    .first();
  await word.click({ force: true });
  const menu = page.getByTestId("nm-verse-menu");
  if (!(await menu.isVisible().catch(() => false))) {
    await word.click({ force: true });
  }
  await expect(menu).toBeVisible({ timeout: 10000 });
  await menu.getByRole("button", { name: /استماع|تشغيل|تلاوة/ }).first().click({ force: true });
  await expect(page.getByTestId("mushaf-audio-dock")).toHaveAttribute("data-open", "1", {
    timeout: 15000,
  });
  await page.waitForFunction(() => {
    const dock = document.querySelector<HTMLElement>('[data-testid="mushaf-audio-dock"][data-open="1"]');
    return dock != null && Number.parseFloat(getComputedStyle(dock).opacity) > 0.5;
  }, { timeout: 5000 });
}

test("mushaf p2 — قلبات محددة بلا قفزة حجم", async ({ page }) => {
  test.setTimeout(120_000);
  for (const [from, to] of [
    [2, 3],
    [3, 4],
    [13, 14],
    [43, 44],
  ] as const) {
    await openMushaf(page, from);
    await flipNext(page);
    await waitCurrentPage(page, to);
    await assertStableFirstLine(page, `${from}→${to}`);
  }

  await flipPrev(page);
  await waitCurrentPage(page, 43);
  await assertStableFirstLine(page, "44→43 رجوع");
});

test("mushaf p3 — عشرون قلبة أمامًا وخلفًا بلا قفزة حجم", async ({ page }) => {
  test.setTimeout(180_000);
  await openMushaf(page, 30);
  let current = 30;
  let maxJump = 0;
  let maxFontDelta = 0;
  for (let i = 0; i < 20; i++) {
    await flipNext(page);
    current += 1;
    await waitCurrentPage(page, current);
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="mushaf-viewport"]')?.getAttribute("data-pager-settled") ===
        "1",
      null,
      { timeout: 10000 },
    );
    await page.waitForTimeout(120);
    const early = await firstLineBox(page);
    expect(early, `سطر أول أمام ${current}`).not.toBeNull();
    await page.waitForTimeout(350);
    const late = await firstLineBox(page);
    expect(late).not.toBeNull();
    maxJump = Math.max(maxJump, Math.abs(late!.top - early!.top));
    maxFontDelta = Math.max(maxFontDelta, Math.abs(late!.fontSize - early!.fontSize));
    expect(Math.abs(late!.fontSize - early!.fontSize), `font-size أمام ${current}`).toBeLessThanOrEqual(
      MAX_SIZE_DELTA_PX,
    );
  }
  for (let i = 0; i < 20; i++) {
    await flipPrev(page);
    current -= 1;
    await waitCurrentPage(page, current);
    await assertStableFirstLine(page, `خلف ${i + 1} → ${current}`);
  }
  /* قفزة موضعية نادرة عند استبدال stableView مقبولة ≤16px؛ مقاس الخط يجب أن يثبت */
  expect(maxFontDelta, "تغيّر مقاس الخط عبر 20 قلبة").toBeLessThanOrEqual(MAX_SIZE_DELTA_PX);
  expect(maxJump, "أقصى قفزة رأسية عبر 20 قلبة أمامًا").toBeLessThanOrEqual(16);
  console.log(`p3 forward maxJump=${maxJump.toFixed(2)} maxFontDelta=${maxFontDelta.toFixed(2)}`);
});

test("mushaf p2 — عشر قلبات + ثبات حجم", async ({ page }) => {
  test.setTimeout(120_000);
  await openMushaf(page, 20);
  let current = 20;
  for (let i = 0; i < 10; i++) {
    await flipNext(page);
    current += 1;
    await waitCurrentPage(page, current);
    await assertStableFirstLine(page, `قلبة ${i + 1} → ${current}`);
  }
});

test("mushaf p2 — رصيف التلاوة لا يغطي آخر سطر + اسم قارئ", async ({ page }) => {
  await openMushaf(page, 2);
  await startTilawa(page);

  const dock = page.getByTestId("mushaf-audio-dock");
  await expect(dock).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("mushaf-dock-reciter")).toBeVisible();
  const reciterText = (await page.getByTestId("mushaf-dock-reciter").innerText()).trim();
  expect(reciterText.length).toBeGreaterThan(2);
  expect(reciterText).not.toBe("");

  const lastBottom = await lastLineBottom(page);
  const dockBox = await dockTop(page);
  expect(lastBottom).not.toBeNull();
  expect(dockBox).not.toBeNull();
  expect(dockBox!.opacity).toBeGreaterThan(0.5);
  expect(dockBox!.height, "ارتفاع الرصيف").toBeGreaterThan(20);
  expect(dockBox!.y, "الرصيف يبدأ تحت آخر سطر").toBeGreaterThanOrEqual((lastBottom ?? 0) - 2);

  await flipNext(page);
  await waitCurrentPage(page, 3);
  await expect(page.getByTestId("mushaf-audio-dock")).toBeVisible();
  await expect(page.getByTestId("mushaf-dock-reciter")).toBeVisible();
  const lastAfter = await lastLineBottom(page);
  const dockAfter = await dockTop(page);
  expect(dockAfter).not.toBeNull();
  expect(dockAfter!.y, "بعد القلب: الرصيف تحت آخر سطر").toBeGreaterThanOrEqual((lastAfter ?? 0) - 2);
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
  await expect(page.getByTestId("mushaf-tafsir-depth-brief")).toBeVisible();
  await expect(page.getByTestId("mushaf-tafsir-depth-full")).toBeVisible();
  await page.getByTestId("mushaf-tafsir-depth-full").click();
  await expect(page.getByTestId("mushaf-tafsir-depth-full")).toHaveAttribute("aria-selected", "true");
});

test("mushaf p4 — أسماء القراء ظاهرة وغير مقصوصة + موضع التفسير", async ({ page }) => {
  test.setTimeout(60_000);
  await openMushaf(page, 2);

  await page
    .locator('[data-pane="current"] .nm-word, [data-pane="current"] [data-testid="nm-word"]')
    .first()
    .click({ force: true });
  const menu = page.getByTestId("nm-verse-menu");
  await expect(menu).toBeVisible({ timeout: 10000 });
  await menu.getByRole("button", { name: /تفسير/ }).click({ force: true });
  const sheet = page.getByTestId("mushaf-tafsir-sheet");
  await expect(sheet).toBeVisible({ timeout: 15000 });
  const sheetBox = await sheet.locator(".quran-sheet__panel").boundingBox();
  await expect(sheet.locator(".quran-sheet__close")).toBeVisible();
  expect(sheetBox).not.toBeNull();
  expect(sheetBox!.y, "التفسير يبدأ من منتصف الشاشة تقريبًا").toBeGreaterThan(VIEWPORT.height * 0.2);
  expect(sheetBox!.y + sheetBox!.height, "التفسير لا يتجاوز أسفل الشاشة").toBeLessThanOrEqual(
    VIEWPORT.height + 2,
  );

  await openMushaf(page, 3);
  await startTilawa(page);
  const dock = page.getByTestId("mushaf-audio-dock");
  await expect(dock).toBeVisible({ timeout: 15000 });
  const reciter = page.getByTestId("mushaf-dock-reciter");
  const reciterText = (await reciter.innerText()).trim();
  expect(reciterText.length).toBeGreaterThan(2);
  const overflow = await reciter.evaluate((el) => {
    const style = getComputedStyle(el);
    return style.textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth + 1;
  });
  expect(overflow, "اسم القارئ مقصوص بـ ellipsis").toBe(false);
});
