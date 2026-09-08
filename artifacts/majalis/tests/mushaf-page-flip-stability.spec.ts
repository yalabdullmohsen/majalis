/**
 * ثبات موضع أول سطر آيات عند قلب الصفحة — iPhone viewport.
 * يفشل إذا تحرّك الصندوق المحيط لمنطقة الآيات أكثر من 2px خلال 300ms بعد الظهور،
 * أو تغيّر ارتفاع السطر (تكبير/تصغير الخط).
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

async function flipNext(page: Page) {
  await page.locator(".mm-page-edge--next").click({ force: true });
}

async function assertStableFirstLine(page: Page, label: string) {
  const early = await firstLineBox(page);
  expect(early, `سطر أول — ${label}`).not.toBeNull();
  await page.waitForTimeout(300);
  const late = await firstLineBox(page);
  expect(late).not.toBeNull();
  const dy = Math.abs(late!.top - early!.top);
  const dh = Math.abs(late!.height - early!.height);
  const dfs = Math.abs(late!.fontSize - early!.fontSize);
  expect(dy, `قفزة رأسية ${dy}px — ${label}`).toBeLessThanOrEqual(MAX_JUMP_PX);
  expect(dh, `تغيّر ارتفاع السطر ${dh}px — ${label}`).toBeLessThanOrEqual(MAX_SIZE_DELTA_PX);
  expect(dfs, `تغيّر font-size ${dfs}px — ${label}`).toBeLessThanOrEqual(MAX_SIZE_DELTA_PX);
}

test("mushaf page flip — لا قفزة لأول سطر بعد الظهور", async ({ page }) => {
  await openMushaf(page, 1);

  for (const target of [2, 3, 4]) {
    await flipNext(page);
    await page.waitForSelector(`[data-testid="mushaf-page"][data-page="${target}"]`, {
      timeout: 20000,
    });
    await assertStableFirstLine(page, `صفحة ${target}`);
  }
});

test("mushaf page flip — صفحات ٦→٧ و٤٣→٤٤ بلا قفزة", async ({ page }) => {
  for (const [from, to] of [
    [6, 7],
    [43, 44],
  ] as const) {
    await openMushaf(page, from);
    await flipNext(page);
    await page.waitForSelector(`[data-testid="mushaf-page"][data-page="${to}"]`, {
      timeout: 20000,
    });
    await assertStableFirstLine(page, `${from}→${to}`);
  }
});

test("mushaf page flip — عشر قلبات متتالية بلا قفزة حجم", async ({ page }) => {
  await openMushaf(page, 20);

  for (const target of [21, 22]) {
    await flipNext(page);
    await page.waitForSelector(`[data-testid="mushaf-page"][data-page="${target}"]`, {
      timeout: 20000,
    });
    await assertStableFirstLine(page, `صفحة ${target}`);
  }

  let current = 22;
  for (let i = 0; i < 10; i++) {
    await flipNext(page);
    current += 1;
    await page.waitForSelector(`[data-testid="mushaf-page"][data-page="${current}"]`, {
      timeout: 20000,
    });
    await assertStableFirstLine(page, `قلبة ${i + 1} → ${current}`);
  }
});
