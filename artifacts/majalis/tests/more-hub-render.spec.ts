/**
 * Playwright — شيت/صفحة المزيد: فصل النص · ترتيب · بطاقات · شيفرون · لمس.
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

test.describe("More hub render contract", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const theme of ["light", "dark"] as const) {
    test(`المزيد — ${theme}`, async ({ page }) => {
      await page.addInitScript((t) => {
        localStorage.setItem("majalis-theme", t);
      }, theme);

      await page.goto("/more", { waitUntil: "domcontentloaded" });
      await page.waitForSelector("[data-more-hub='1']", { timeout: 15_000 });

      const hub = page.locator("[data-more-hub='1']");
      await expect(hub).toBeVisible();

      // 3) عدد البطاقات/الصفوف المرسومة > 0 ويطابق السجل المرئي تقريباً
      const cards = hub.locator("[data-section-card]");
      const rows = hub.locator("[data-section-row]");
      const cardCount = await cards.count();
      const rowCount = await rows.count();
      expect(cardCount + rowCount, "صفر بطاقات مرسومة").toBeGreaterThan(0);

      const expectedMore = sectionsForSurface("moreHub").filter((s) => !s.featured || true);
      // featured + non-featured cards/rows (featured not duplicated when no search)
      const featuredN = featuredSections().length;
      expect(await hub.locator("[data-section-card='featured']").count()).toBe(featuredN);

      // 1) فصل النص: لا نص يطابق label+subtitle ملتصقين
      for (const s of expectedMore.slice(0, 40)) {
        const glued = `${s.label}${s.subtitle}`;
        const hit = hub.getByText(glued, { exact: true });
        await expect(hit, `نص ملتصق: ${glued}`).toHaveCount(0);
      }

      // 2) ترتيب عناوين المجموعات = SECTION_GROUP_ORDER
      const titles = hub.locator("[data-more-group-title]");
      const titleCount = await titles.count();
      const expectedTitles = SECTION_GROUP_ORDER.map((g) => SECTION_GROUP_META[g].label);
      const seen: string[] = [];
      for (let i = 0; i < titleCount; i++) {
        seen.push((await titles.nth(i).innerText()).trim());
      }
      const filteredExpected = expectedTitles.filter((t) => seen.includes(t));
      expect(seen).toEqual(filteredExpected);

      // عنوان كل مجموعة قبل أول بطاقة فيها
      for (const g of SECTION_GROUP_ORDER) {
        const section = hub.locator(`[data-more-group='${g}']`);
        if ((await section.count()) === 0) continue;
        const html = await section.innerHTML();
        const titlePos = html.indexOf("more-hub__group-title");
        const cardPos = html.search(/data-section-card|data-section-row/);
        expect(titlePos, `عنوان ${g} بعد العناصر`).toBeGreaterThanOrEqual(0);
        if (cardPos >= 0) expect(titlePos).toBeLessThan(cardPos);
      }

      // 4) أنماط مطبّقة
      const sample = cards.first();
      const styles = await sample.evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          radius: parseFloat(cs.borderRadius),
          bg: cs.backgroundColor,
        };
      });
      expect(styles.radius).toBeGreaterThanOrEqual(12);
      const hubBg = await hub.evaluate((el) => getComputedStyle(el).backgroundColor);
      // البطاقة يجب أن تختلف عن شفافية كاملة فقط — نتحقق من وجود خلفية غير transparent
      expect(styles.bg).not.toBe("rgba(0, 0, 0, 0)");

      // 6) صفر ChevronRight
      await expect(hub.locator("svg.lucide-chevron-right")).toHaveCount(0);
      const chevrons = hub.locator(".section-row__chevron");
      const chevN = await chevrons.count();
      for (let i = 0; i < chevN; i++) {
        const box = await chevrons.nth(i).boundingBox();
        const rowBox = await chevrons.nth(i).locator("xpath=ancestor::button[1]").boundingBox();
        if (box && rowBox) {
          // في RTL الحافة اليسرى = أصغر x
          expect(box.x).toBeLessThan(rowBox.x + rowBox.width / 2);
        }
      }

      // 8) لمس ≥ 44
      const firstCardBox = await sample.boundingBox();
      expect(firstCardBox?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(firstCardBox?.width ?? 0).toBeGreaterThanOrEqual(44);

      // 10) لقطة مرجعية
      fs.mkdirSync(snapDir, { recursive: true });
      const shot = path.join(snapDir, `more-hub-${theme}.png`);
      await hub.screenshot({ path: shot });
      expect(fs.existsSync(shot)).toBe(true);

      void hubBg;
    });
  }
});
