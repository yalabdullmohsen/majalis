/**
 * لا Keyboard / لا focus على input عند ضغط آية أو فاصل الآية.
 */
import { test, expect, type Page } from "@playwright/test";

async function openMushaf(page: Page, n = 2) {
  await page.addInitScript(() => {
    try {
      window.sessionStorage.setItem("mj.launch-splash.session.v4", "1");
      window.localStorage.setItem("majalis-theme", "light");
    } catch {
      /* ignore */
    }
  });
  await page.goto(`/mushaf?page=${n}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="mushaf-viewport"]', { timeout: 30000 });
  await page.waitForSelector('[data-pane="current"] [data-testid="mushaf-ayah-hit"]', {
    timeout: 30000,
  });
  await page.waitForTimeout(400);
}

async function activeSnapshot(page: Page) {
  return page.evaluate(() => {
    const ae = document.activeElement;
    const tag = ae?.tagName ?? null;
    return {
      tag,
      testId: ae?.getAttribute?.("data-testid") ?? null,
      role: ae?.getAttribute?.("role") ?? null,
      type: ae?.getAttribute?.("type") ?? null,
      isTextField: tag === "INPUT" || tag === "TEXTAREA" || ae?.getAttribute?.("contenteditable") === "true",
      scale: window.visualViewport?.scale ?? 1,
      vvHeight: window.visualViewport?.height ?? window.innerHeight,
      innerHeight: window.innerHeight,
      scrollY: window.scrollY,
      menu: Boolean(document.querySelector('[data-testid="nm-verse-menu"]')),
      selected: document.querySelectorAll(".nm-word.is-selected, .nm-ayah-sel__band").length,
    };
  });
}

async function tapLocator(page: Page, locator: ReturnType<Page["locator"]>) {
  const box = await locator.boundingBox();
  expect(box, "hit target box").toBeTruthy();
  if (!box) return;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(250);
}

test.describe("mushaf ayah tap — no keyboard focus", () => {
  for (const device of [
    { name: "iPhone", width: 390, height: 844 },
    { name: "iPad", width: 768, height: 1024 },
  ] as const) {
    for (const chrome of ["hidden", "visible"] as const) {
      test(`${device.name} chrome=${chrome}: marker + ayah keep focus off inputs`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: device.width, height: device.height });
        await openMushaf(page, 2);

        if (chrome === "visible") {
          await page.evaluate(() => {
            document.querySelector<HTMLButtonElement>('[data-testid="mushaf-controls-more"]')?.click();
          });
          await page.waitForTimeout(120);
          // أغلق لوحة المزيد إن فُتحت — نريد الكروم ظاهرًا فقط
          const panel = page.getByTestId("mushaf-controls-more-panel");
          if (await panel.isVisible().catch(() => false)) {
            await page.evaluate(() => {
              document.querySelector<HTMLButtonElement>('[data-testid="mushaf-controls-more"]')?.click();
            });
          }
          // اضغط وسط الصفحة لفتح الكروم
          await page.locator('[data-testid="mushaf-viewport"]').click({
            position: { x: 40, y: 60 },
            force: true,
          });
          await page.waitForTimeout(150);
        }

        const before = await activeSnapshot(page);
        expect(before.isTextField).toBe(false);

        const marker = page.locator('[data-pane="current"] .nm-word--end[data-testid="mushaf-ayah-hit"]').first();
        await tapLocator(page, marker);
        const afterMarker = await activeSnapshot(page);
        expect(afterMarker.isTextField, "marker must not focus input/textarea").toBe(false);
        expect(afterMarker.tag === "INPUT" || afterMarker.tag === "TEXTAREA").toBe(false);
        expect(afterMarker.menu, "verse menu opens").toBe(true);
        expect(afterMarker.scale).toBe(1);
        expect(Math.abs(afterMarker.vvHeight - afterMarker.innerHeight)).toBeLessThan(8);

        // أغلق القائمة ثم اضغط كلمة آية
        await page.keyboard.press("Escape").catch(() => undefined);
        await page.evaluate(() => {
          document.querySelector<HTMLElement>('[data-testid="nm-verse-menu"] button')?.click();
        });
        await page.waitForTimeout(120);

        const word = page
          .locator('[data-pane="current"] [data-testid="mushaf-ayah-hit"]:not(.nm-word--end)')
          .first();
        await tapLocator(page, word);
        const afterWord = await activeSnapshot(page);
        expect(afterWord.isTextField, "ayah word must not focus input/textarea").toBe(false);
        expect(afterWord.tag === "INPUT" || afterWord.tag === "TEXTAREA").toBe(false);
        expect(afterWord.menu, "verse menu opens from word").toBe(true);
        expect(afterWord.scale).toBe(1);
        // لا حقل نصي مُركَّز (لوحة مفاتيح)
        expect(["INPUT", "TEXTAREA"]).not.toContain(afterWord.tag);
      });
    }
  }
});
