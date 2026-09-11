/**
 * تدقيق قبول بصري نهائي — Route الحقيقي `/mushaf` (ليس Storybook).
 * الصفحات 27 / 29 / 30 × iPhone صغير / قياسي / كبير.
 * يرفض: صفحتان، peek مجاور، overflow، قفز مقياس، تحريك نص مع المشغّل، رقم صفحة خاطئ.
 */
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const PAGES = [27, 29, 30] as const;
const DEVICES = [
  { id: "iphone-se", label: "iPhone SE", width: 375, height: 667 },
  { id: "iphone-14", label: "iPhone 14", width: 390, height: 844 },
  { id: "iphone-14-max", label: "iPhone 14 Pro Max", width: 430, height: 932 },
] as const;

const SHOT_DIR = resolve(
  process.env.MUSHAF_AUDIT_SHOT_DIR ||
    "/Users/alabdullmohsen/majlis-app/artifacts/majalis/artifacts/mushaf-p0-audit",
);

mkdirSync(SHOT_DIR, { recursive: true });

async function openMushaf(page: Page, n: number) {
  await page.addInitScript(() => {
    try {
      window.sessionStorage.setItem("mj.launch-splash.session.v3", "1");
      window.localStorage.setItem("majalis-theme", "light");
      window.localStorage.setItem("ssunnah-mushaf-appearance-v1", "light");
    } catch {
      /* ignore */
    }
  });
  await page.goto(`/mushaf?page=${n}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    (pageNo) => {
      const el = document.querySelector<HTMLElement>(
        '[data-pane="current"] [data-testid="mushaf-page"]',
      );
      return el?.getAttribute("data-page") === String(pageNo);
    },
    n,
    { timeout: 30000 },
  );
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="mushaf-viewport"]')?.getAttribute("data-pager-settled") ===
      "1",
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(180);
}

async function measureSettle(page: Page) {
  return page.evaluate(() => {
    const scroller = document.querySelector<HTMLElement>(".nm-pager-scroller, .mm-pager-scroller");
    const track = document.querySelector<HTMLElement>(".nm-pager-track, .mm-pager-track");
    const current = document.querySelector<HTMLElement>(
      '.nm-pager__sheet[data-pane="current"], .mm-pager__sheet[data-pane="current"]',
    );
    const next = document.querySelector<HTMLElement>(
      '.nm-pager__sheet[data-pane="next"], .mm-pager__sheet[data-pane="next"]',
    );
    const prev = document.querySelector<HTMLElement>(
      '.nm-pager__sheet[data-pane="prev"], .mm-pager__sheet[data-pane="prev"]',
    );
    const pageEl = document.querySelector<HTMLElement>(
      '[data-pane="current"] [data-testid="mushaf-page"]',
    );
    if (!scroller || !track || !current || !pageEl) {
      return { ok: false as const, reason: "missing-dom" };
    }
    const vw = scroller.getBoundingClientRect().width;
    const pagerW = Number.parseFloat(scroller.getAttribute("data-pager-w") || "0");
    const sheetW = current.getBoundingClientRect().width;
    const style = getComputedStyle(track);
    const transform = style.transform;
    let tx = 0;
    const m = /matrix\(([^)]+)\)/.exec(transform);
    if (m) {
      const parts = m[1]!.split(",").map((s) => Number.parseFloat(s.trim()));
      tx = parts[4] ?? 0;
    } else if (transform.includes("translate3d") || transform.includes("translateX")) {
      const t =
        /translate3d\(([-0-9.]+)px/.exec(transform) || /translateX\(([-0-9.]+)px/.exec(transform);
      tx = t ? Number.parseFloat(t[1]!) : 0;
    }
    const viewport = scroller.getBoundingClientRect();
    const overlap = (el: HTMLElement | null) => {
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      return Math.max(0, Math.min(r.right, viewport.right) - Math.max(r.left, viewport.left));
    };
    const peekNext = overlap(next);
    const peekPrev = overlap(prev);
    const body =
      pageEl.querySelector<HTMLElement>(
        ".nm-page__body, .nm-page-body, [data-testid='mushaf-page-body']",
      ) || pageEl;
    const bodyRect = body.getBoundingClientRect();
    const lines = Array.from(
      pageEl.querySelectorAll<HTMLElement>("[data-testid='nm-verse-line'], .nm-line"),
    );
    let overflowX = 0;
    for (const line of lines) {
      const r = line.getBoundingClientRect();
      if (r.width < 1) continue;
      overflowX = Math.max(
        overflowX,
        Math.max(0, viewport.left - r.left),
        Math.max(0, r.right - viewport.right),
      );
    }
    const first = lines[0]?.getBoundingClientRect();
    const fontSize = first
      ? Number.parseFloat(getComputedStyle(lines[0]!).fontSize) || 0
      : Number.parseFloat(getComputedStyle(body).fontSize) || 0;
    const pageNum = pageEl.getAttribute("data-page");
    const footer = pageEl.querySelector<HTMLElement>('[data-testid="mushaf-page-number"]');
    return {
      ok: true as const,
      vw,
      pagerW,
      sheetW,
      tx,
      expectedTx: -vw,
      peekNext,
      peekPrev,
      overflowX,
      fontSize,
      firstTop: first?.top ?? null,
      firstHeight: first?.height ?? null,
      bodyTop: bodyRect.top,
      bodyHeight: bodyRect.height,
      pageNum,
      footerText: footer?.textContent?.trim() || "",
    };
  });
}

async function shot(page: Page, name: string) {
  const path = resolve(SHOT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: false, animations: "disabled" });
  return path;
}

async function openAudioDock(page: Page) {
  const word = page
    .locator('[data-pane="current"] .nm-word, [data-pane="current"] [data-testid="mushaf-ayah-hit"]')
    .first();
  await word.click({ force: true });
  const menu = page.getByTestId("nm-verse-menu");
  if (!(await menu.isVisible().catch(() => false))) {
    await word.click({ force: true });
  }
  await expect(menu).toBeVisible({ timeout: 12000 });
  await menu.getByRole("button", { name: /استماع/ }).first().click({ force: true });
  await expect(page.getByTestId("mushaf-audio-dock")).toHaveAttribute("data-open", "1", {
    timeout: 15000,
  });
  await page.waitForTimeout(200);
}

for (const device of DEVICES) {
  test.describe(`مصحف P0 — ${device.label}`, () => {
    test.use({
      viewport: { width: device.width, height: device.height },
      isMobile: true,
      hasTouch: true,
    });

    for (const n of PAGES) {
      test(`صفحة ${n} مستقرة — صفحة واحدة بلا peek/overflow`, async ({ page }) => {
        await openMushaf(page, n);
        const m = await measureSettle(page);
        expect(m.ok, "DOM المصحف").toBe(true);
        if (!m.ok) return;

        expect(Math.abs(m.sheetW - m.vw), "عرض اللوحة = viewport").toBeLessThanOrEqual(1.5);
        expect(Math.abs(m.pagerW - m.vw), "data-pager-w = viewport").toBeLessThanOrEqual(1.5);
        expect(Math.abs(m.tx - m.expectedTx), "translate مستقر على اللوحة الحالية").toBeLessThanOrEqual(
          2,
        );
        expect(m.peekNext, "لا peek للصفحة التالية").toBeLessThanOrEqual(1);
        expect(m.peekPrev, "لا peek للصفحة السابقة").toBeLessThanOrEqual(1);
        expect(m.overflowX, "لا قص أفقي للنص").toBeLessThanOrEqual(1);
        expect(m.pageNum, "data-page").toBe(String(n));
        /* الرقم المعروض بأرقام عربية — نتحقق من aria-label الغربي */
        const footerLabel = await page
          .locator('[data-pane="current"] [data-testid="mushaf-page-number"]')
          .getAttribute("aria-label");
        expect(footerLabel || "", "aria رقم الصفحة").toMatch(new RegExp(`الصفحة\\s*${n}`));

        await shot(page, `${device.id}-p${n}-settled`);
      });
    }

    test("تقليب 27→28→29→30 بلا تغيّر مقياس", async ({ page }) => {
      await openMushaf(page, 27);
      const before = await measureSettle(page);
      expect(before.ok).toBe(true);
      if (!before.ok) return;
      const font0 = before.fontSize;
      const bodyH0 = before.bodyHeight;

      for (const target of [28, 29, 30]) {
        /* ArrowRight = الصفحة التالية في useMushafPager (موثوق أكثر من زر شفاف opacity:0) */
        await page.keyboard.press("ArrowRight");
        await page.waitForFunction(
          (pageNo) => {
            const el = document.querySelector<HTMLElement>(
              '[data-pane="current"] [data-testid="mushaf-page"]',
            );
            const settled =
              document.querySelector('[data-testid="mushaf-viewport"]')?.getAttribute(
                "data-pager-settled",
              ) === "1";
            return settled && el?.getAttribute("data-page") === String(pageNo);
          },
          target,
          { timeout: 20000 },
        );
        await page.waitForTimeout(120);
        const mid = await measureSettle(page);
        expect(mid.ok).toBe(true);
        if (!mid.ok) return;
        expect(Math.abs(mid.fontSize - font0), `font ${target}`).toBeLessThanOrEqual(1);
        expect(Math.abs(mid.bodyHeight - bodyH0), `bodyH ${target}`).toBeLessThanOrEqual(2);
        expect(mid.peekNext).toBeLessThanOrEqual(1);
        expect(mid.peekPrev).toBeLessThanOrEqual(1);
        expect(mid.pageNum).toBe(String(target));
      }
      await shot(page, `${device.id}-after-flip-p30`);
    });

    test("فتح المشغّل لا يحرّك النص ولا يقص الرصيف — صفحة 27", async ({ page }) => {
      await openMushaf(page, 27);
      const before = await measureSettle(page);
      expect(before.ok).toBe(true);
      if (!before.ok) return;

      await openAudioDock(page);
      const after = await measureSettle(page);
      expect(after.ok).toBe(true);
      if (!after.ok) return;

      expect(Math.abs(after.fontSize - before.fontSize), "font مع المشغّل").toBeLessThanOrEqual(1);
      expect(
        Math.abs((after.firstTop ?? 0) - (before.firstTop ?? 0)),
        "قفزة أول سطر",
      ).toBeLessThanOrEqual(2);
      expect(Math.abs(after.bodyHeight - before.bodyHeight), "ارتفاع المتن").toBeLessThanOrEqual(2);
      expect(after.sheetW).toBeCloseTo(before.sheetW, 0);

      const dock = await page.evaluate(() => {
        const el = document.querySelector<HTMLElement>(
          '[data-testid="mushaf-audio-dock"][data-open="1"]',
        );
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        return {
          top: r.top,
          bottom: r.bottom,
          height: r.height,
          clippedBottom: Math.max(0, r.bottom - vh),
          opacity: Number.parseFloat(getComputedStyle(el).opacity) || 0,
        };
      });
      expect(dock, "وجود المشغّل").not.toBeNull();
      expect(dock!.opacity).toBeGreaterThan(0.5);
      expect(dock!.clippedBottom, "لا قص أسفل الشاشة").toBeLessThanOrEqual(1);
      expect(dock!.height, "ارتفاع مرئي").toBeGreaterThan(40);

      await shot(page, `${device.id}-p27-audio-dock`);
    });
  });
}
