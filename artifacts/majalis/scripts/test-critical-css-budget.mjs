#!/usr/bin/env node
/**
 * حارس ميزانية CSS المسار الحرج + منع إعادة highlighted-content إلى main.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hasBlockingStylesheet, inlineStyleBytes, INLINE_CSS_BUDGET } from "./defer-entry-css.mjs";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const main = readFileSync(resolve(appRoot, "src/main.tsx"), "utf8");

if (/highlighted-content\.css/.test(main)) {
  console.error("✗ highlighted-content.css عاد إلى main.tsx — يجب أن يُحمَّل مع مكوّنات القراءة فقط.");
  process.exit(1);
}

const distCss = resolve(appRoot, "dist/assets");
let indexCss = null;
try {
  for (const name of readdirSync(distCss)) {
    if (/^index-.*\.css$/.test(name)) {
      const p = join(distCss, name);
      const sz = statSync(p).size;
      if (!indexCss || sz > indexCss.size) indexCss = { name, size: sz };
    }
  }
} catch {
  console.log("· لا dist بعد — تخطي فحص حجم CSS المُبنى.");
  process.exit(0);
}

if (!indexCss) {
  console.error("✗ لم يُعثر على dist/assets/index-*.css");
  process.exit(1);
}

const distHtml = readFileSync(resolve(appRoot, "dist/index.html"), "utf8");
if (hasBlockingStylesheet(distHtml)) {
  console.error("✗ dist/index.html ما زال يحمّل stylesheet حاجباً.");
  process.exit(1);
}
const inlineBytes = inlineStyleBytes(distHtml);
if (inlineBytes > INLINE_CSS_BUDGET) {
  console.error(`✗ CSS المضمّن ${inlineBytes} بايت > ${INLINE_CSS_BUDGET}.`);
  process.exit(1);
}
const cssText = readFileSync(join(distCss, indexCss.name), "utf8");
if (/@import/.test(cssText)) {
  console.error(`✗ @import في ${indexCss.name} — ممنوع في CSS المُسلَّم.`);
  process.exit(1);
}

// سقف بعد موجة ~495–500KB (2026-07-26): نقل hadith/qibla/occasions/miracles/fiqh-hub-strip
// من elite-2026 إلى CSS الصفحات + حذف btn-v2/badge-v2/dhikr-card/mzp-card الميتة.
// الهدف التالي: نحو 480KB عبر تأجيل ودجات الرئيسية / تنظيف تكرار brand/final.
const BUDGET = 505_000;
if (indexCss.size > BUDGET) {
  console.error(
    `✗ CSS الحرج ${indexCss.name} = ${indexCss.size} بايت > الميزانية ${BUDGET}.`,
  );
  process.exit(1);
}

console.log(
  `✓ CSS ${indexCss.name} = ${indexCss.size} بايت (≤ ${BUDGET}) · غير حاجب · مضمّن ${inlineBytes} بايت · highlighted خارج main.`,
);
