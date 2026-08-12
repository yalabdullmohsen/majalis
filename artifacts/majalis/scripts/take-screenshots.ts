/**
 * take-screenshots.ts
 * -------------------
 * سكربت Playwright لالتقاط لقطات متجر App Store
 * يلتقط الصفحات الرئيسية بأبعاد iPhone الرسمية
 *
 * الاستخدام:
 *   npx ts-node scripts/take-screenshots.ts
 *   # أو
 *   npx tsx scripts/take-screenshots.ts
 *
 * المتطلبات:
 *   - التطبيق يعمل على http://localhost:5173 (pnpm dev)
 *   - npx playwright install chromium
 */

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const BASE_URL = process.env.APP_URL || "http://localhost:5173";
const OUT_DIR = join(process.cwd(), "store-assets", "screenshots");

// أبعاد App Store الرسمية
const DEVICES = [
  {
    name: "iPhone-6.9",
    width: 1320,
    height: 2868,
    scale: 3,
    label: "iPhone 16 Pro Max (6.9\")",
  },
  {
    name: "iPhone-6.5",
    width: 1242,
    height: 2688,
    scale: 3,
    label: "iPhone 11 Pro Max (6.5\")",
  },
];

// الصفحات المطلوب تصويرها
const PAGES = [
  { path: "/", slug: "01-home", title: "الصفحة الرئيسية" },
  { path: "/quran-hub", slug: "02-quran-hub", title: "مركز القرآن" },
  { path: "/adhkar", slug: "03-adhkar", title: "الأذكار والعداد" },
  { path: "/prayer-times", slug: "04-prayer-times", title: "مواقيت الصلاة" },
  { path: "/lessons", slug: "05-lessons", title: "الدروس العلمية" },
  { path: "/hadith", slug: "06-hadith", title: "الأحاديث النبوية" },
  { path: "/learning/paths", slug: "07-learning-path", title: "المسارات العلمية" },
  { path: "/qibla", slug: "08-qibla", title: "بوصلة القبلة" },
  { path: "/search", slug: "09-search", title: "البحث الشامل" },
];

async function captureScreenshot(page: Page, path: string, out: string) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle", timeout: 30000 });
  // انتظر اختفاء Skeleton loaders
  await page.waitForTimeout(2000);
  await page.screenshot({ path: out, fullPage: false });
  console.log(`  ✓ ${out}`);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const browser: Browser = await chromium.launch();

  for (const device of DEVICES) {
    console.log(`\n📱 ${device.label} (${device.width}×${device.height})`);

    const context: BrowserContext = await browser.newContext({
      viewport: {
        width: Math.round(device.width / device.scale),
        height: Math.round(device.height / device.scale),
      },
      deviceScaleFactor: device.scale,
      locale: "ar-KW",
      timezoneId: "Asia/Kuwait",
    });

    const page: Page = await context.newPage();

    // تعيين اتجاه RTL
    await page.addInitScript(() => {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ar";
    });

    for (const pg of PAGES) {
      const filename = join(OUT_DIR, `${device.name}_${pg.slug}.png`);
      try {
        await captureScreenshot(page, pg.path, filename);
      } catch (err) {
        console.warn(`  ⚠️ فشل تصوير ${pg.path}:`, err);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log(`\n✅ تمّ حفظ ${PAGES.length * DEVICES.length} لقطة في:\n   ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("❌ خطأ:", err);
  process.exit(1);
});
