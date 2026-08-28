/**
 * Playwright — صفحة /sections: فصل النص · ترتيب · بطاقات · تباين · بلا إغلاق.
 * viewport 390×844 · نهاري وليلي.
 */
import { test, expect } from "@playwright/test";
import {
  SECTION_GROUP_ORDER,
  SECTION_GROUP_META,
  featuredSections,
  sectionsForSurface,
} from "../src/config/sections.registry";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const snapDir = path.join(__dirname, "snapshots", "more-hub");

function relativeLuminance(r: number, g: number, b: number): number {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrastRatio(fg: string, bg: string): number {
  const parse = (c: string) => {
    const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return [0, 0, 0] as const;
    return [Number(m[1]), Number(m[2]), Number(m[3])] as const;
  };
  const [fr, fg_, fb] = parse(fg);
  const [br, bg_, bb] = parse(bg);
  const L1 = relativeLuminance(fr, fg_, fb);
  const L2 = relativeLuminance(br, bg_, bb);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

test.describe("Sections page render contract", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const theme of ["light", "dark"] as const) {
    test(`الأقسام — ${theme}`, async ({ page }) => {
      await page.addInitScript((t) => {
        localStorage.setItem("majalis-theme", t);
      }, theme);

      await page.goto("/sections", { waitUntil: "domcontentloaded" });
      await page.waitForSelector("[data-sections-hub='1']", { timeout: 15_000 });

      const hub = page.locator("[data-sections-hub='1']");
      await expect(hub).toBeVisible();

      // صفر زر إغلاق / bottom sheet
      await expect(page.getByRole("button", { name: /إغلاق/ })).toHaveCount(0);
      await expect(page.locator("[data-bottom-sheet], .app-bottom-sheet")).toHaveCount(0);

      const cards = hub.locator("[data-section-card]");
      const cardCount = await cards.count();
      expect(cardCount, "صفر بطاقات مرسومة").toBeGreaterThan(0);

      const featuredN = featuredSections().length;
      expect(await hub.locator("[data-section-card='featured']").count()).toBe(featuredN);

      // صفر بطاقة فارغة: عنوان مرئي opacity > 0
      for (let i = 0; i < cardCount; i++) {
        const card = cards.nth(i);
        const label = card.locator(".card__label");
        await expect(label).toBeVisible();
        const text = (await label.innerText()).trim();
        expect(text.length, `بطاقة ${i} بلا عنوان`).toBeGreaterThan(0);
        const opacity = await label.evaluate((el) => Number(getComputedStyle(el).opacity));
        expect(opacity, `بطاقة ${i} عنوان شفاف`).toBeGreaterThan(0);
      }

      // تباين ≥ 4.5:1 لعينة من البطاقات
      const sampleN = Math.min(cardCount, 12);
      for (let i = 0; i < sampleN; i++) {
        const card = cards.nth(i);
        const ratio = await card.evaluate((el) => {
          const label = el.querySelector(".card__label") as HTMLElement | null;
          if (!label) return 0;
          const cs = getComputedStyle(label);
          const bg = getComputedStyle(el).backgroundColor;
          return { color: cs.color, bg };
        });
        const cr = contrastRatio(ratio.color, ratio.bg);
        expect(cr, `تباين بطاقة ${i} = ${cr}`).toBeGreaterThanOrEqual(4.5);
      }

      const expectedMore = sectionsForSurface("moreHub");
      for (const s of expectedMore.slice(0, 40)) {
        const glued = `${s.label}${s.subtitle}`;
        await expect(hub.getByText(glued, { exact: true })).toHaveCount(0);
      }

      const titles = hub.locator("[data-more-group-title]");
      const titleCount = await titles.count();
      const expectedTitles = SECTION_GROUP_ORDER.map((g) => SECTION_GROUP_META[g].label);
      const seen: string[] = [];
      for (let i = 0; i < titleCount; i++) {
        seen.push((await titles.nth(i).innerText()).trim());
      }
      expect(seen).toEqual(expectedTitles.filter((t) => seen.includes(t)));

      for (const g of SECTION_GROUP_ORDER) {
        const section = hub.locator(`[data-more-group='${g}']`);
        if ((await section.count()) === 0) continue;
        const html = await section.innerHTML();
        const titlePos = html.indexOf("sections-hub__group-title");
        const cardPos = html.search(/data-section-card|data-section-row/);
        expect(titlePos, `عنوان ${g} بعد العناصر`).toBeGreaterThanOrEqual(0);
        if (cardPos >= 0) expect(titlePos).toBeLessThan(cardPos);
      }

      const sample = cards.first();
      const styles = await sample.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { radius: parseFloat(cs.borderRadius), bg: cs.backgroundColor };
      });
      expect(styles.radius).toBeGreaterThanOrEqual(12);
      expect(styles.bg).not.toBe("rgba(0, 0, 0, 0)");

      await expect(hub.locator("svg.lucide-chevron-right")).toHaveCount(0);

      const firstCardBox = await sample.boundingBox();
      expect(firstCardBox?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(firstCardBox?.width ?? 0).toBeGreaterThanOrEqual(44);

      // الشريط السفلي: تسميات صحيحة
      const nav = page.locator("[data-bottom-nav='sections-ia']");
      await expect(nav.getByText("مركز القرآن الكريم", { exact: true })).toBeVisible();
      await expect(nav.getByText("الأقسام", { exact: true })).toBeVisible();
      await expect(nav.getByText("المزيد", { exact: true })).toHaveCount(0);
      await expect(nav.getByText("قرآن", { exact: true })).toHaveCount(0);

      // آخر بطاقة فوق الشريط (لا اقتطاع)
      const last = cards.last();
      const lastBox = await last.boundingBox();
      const navBox = await nav.boundingBox();
      if (lastBox && navBox) {
        // بعد التمرير لأسفل
        await last.scrollIntoViewIfNeeded();
        const lastAfter = await last.boundingBox();
        const navAfter = await nav.boundingBox();
        if (lastAfter && navAfter) {
          expect(lastAfter.y + lastAfter.height).toBeLessThanOrEqual(navAfter.y + 2);
        }
      }

      fs.mkdirSync(snapDir, { recursive: true });
      const shot = path.join(snapDir, `more-hub-${theme}.png`);
      await hub.screenshot({ path: shot });
      await expect(hub).toHaveScreenshot(`more-hub-${theme}.png`, {
        maxDiffPixelRatio: 0.08,
      });
    });

    test(`مركز القرآن — ${theme}`, async ({ page }) => {
      await page.addInitScript((t) => {
        localStorage.setItem("majalis-theme", t);
      }, theme);

      await page.goto("/quran-hub", { waitUntil: "domcontentloaded" });
      await page.waitForSelector("[data-quran-hub='1']", { timeout: 15_000 });

      const hub = page.locator("[data-quran-hub='1']");
      await expect(hub.getByText("فتح المصحف").first()).toBeVisible();
      await expect(hub.getByText(/٦٠٤|604\s*صفح|صفح[^\n]{0,8}604/)).toHaveCount(0);

      const cards = hub.locator("[data-section-card]");
      expect(await cards.count()).toBeGreaterThanOrEqual(7);

      for (let i = 0; i < Math.min(await cards.count(), 10); i++) {
        const label = cards.nth(i).locator(".card__label");
        const text = (await label.innerText()).trim();
        expect(text.length).toBeGreaterThan(0);
      }

      const qSnapDir = path.join(__dirname, "snapshots", "quran-hub");
      fs.mkdirSync(qSnapDir, { recursive: true });
      await hub.screenshot({ path: path.join(qSnapDir, `quran-hub-${theme}.png`) });
      await expect(hub).toHaveScreenshot(`quran-hub-${theme}.png`, {
        maxDiffPixelRatio: 0.08,
      });
    });

    test(`القرآن في أرقام — ${theme}`, async ({ page }) => {
      await page.addInitScript((t) => {
        localStorage.setItem("majalis-theme", t);
      }, theme);

      await page.goto("/quran-hub/numbers", { waitUntil: "domcontentloaded" });
      await page.waitForSelector("[data-quran-numbers='1']", { timeout: 15_000 });
      await page.waitForSelector("[data-stat-id]", { timeout: 15_000 });

      const pageRoot = page.locator("[data-quran-numbers='1']");
      await expect(pageRoot.getByRole("heading", { name: "القرآن في أرقام" })).toBeVisible();
      await expect(pageRoot.getByText(/لا تُعرض أرقام من مواقع الإعجاز العددي/)).toBeVisible();
      expect(await pageRoot.locator("[data-stat-id]").count()).toBeGreaterThanOrEqual(8);
      const sources = await pageRoot.locator(".quran-stat-card__source").allTextContents();
      expect(sources.some((s) => /الإعجاز العددي|التناسق الرقمي|numericmiracle|harunyahya/i.test(s))).toBe(
        false,
      );

      const nSnapDir = path.join(__dirname, "snapshots", "quran-numbers");
      fs.mkdirSync(nSnapDir, { recursive: true });
      await pageRoot.screenshot({ path: path.join(nSnapDir, `quran-numbers-${theme}.png`) });
      await expect(pageRoot).toHaveScreenshot(`quran-numbers-${theme}.png`, {
        maxDiffPixelRatio: 0.08,
      });
    });

    test(`التجويد — ${theme}`, async ({ page }) => {
      await page.addInitScript((t) => {
        localStorage.setItem("majalis-theme", t);
      }, theme);
      await page.goto("/quran-hub/tajweed", { waitUntil: "domcontentloaded" });
      await page.waitForSelector("[data-quran-tajweed='1']", { timeout: 15_000 });
      const root = page.locator("[data-quran-tajweed='1']");
      await expect(root.getByRole("heading", { name: /التجويد|مدخل/ })).toBeVisible();
      const tDir = path.join(__dirname, "snapshots", "quran-tajweed");
      fs.mkdirSync(tDir, { recursive: true });
      await root.screenshot({ path: path.join(tDir, `quran-tajweed-${theme}.png`) });
      await expect(root).toHaveScreenshot(`quran-tajweed-${theme}.png`, {
        maxDiffPixelRatio: 0.08,
      });
    });

    test(`القراءات العشر — ${theme}`, async ({ page }) => {
      await page.addInitScript((t) => {
        localStorage.setItem("majalis-theme", t);
      }, theme);
      await page.goto("/quran-hub/qiraat", { waitUntil: "domcontentloaded" });
      await page.waitForSelector("[data-quran-qiraat='1']", { timeout: 15_000 });
      const root = page.locator("[data-quran-qiraat='1']");
      await expect(root.getByRole("heading", { name: "القراءات العشر" })).toBeVisible();
      const qDir = path.join(__dirname, "snapshots", "quran-qiraat");
      fs.mkdirSync(qDir, { recursive: true });
      await root.screenshot({ path: path.join(qDir, `quran-qiraat-${theme}.png`) });
      await expect(root).toHaveScreenshot(`quran-qiraat-${theme}.png`, {
        maxDiffPixelRatio: 0.08,
      });
    });
  }
});
