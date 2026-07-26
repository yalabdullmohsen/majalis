#!/usr/bin/env node
/**
 * حارس ميزانية CSS المسار الحرج + منع إعادة highlighted-content إلى main.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

// سقف بعد موجة 2 (~768→722→708→627KB). ارفع فقط بمبرر.
const BUDGET = 660_000;
if (indexCss.size > BUDGET) {
  console.error(
    `✗ CSS الحرج ${indexCss.name} = ${indexCss.size} بايت > الميزانية ${BUDGET}.`,
  );
  process.exit(1);
}

console.log(
  `✓ CSS الحرج ${indexCss.name} = ${indexCss.size} بايت (≤ ${BUDGET})؛ highlighted خارج main.`,
);
