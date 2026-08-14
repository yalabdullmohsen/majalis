/**
 * بوابة: نص قصص الأنبياء على الداكن أبيض صلب بلا opacity باهت.
 * node --import tsx src/lib/__tests__/prophet-stories-on-dark-text.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const css = readFileSync(resolve(root, "src/styles/pages/prophet-stories.css"), "utf8");
const aliases = readFileSync(resolve(root, "src/styles/theme-aliases.css"), "utf8");

let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) console.log(`  ✓ ${label}`);
  else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

console.log("\n=== قصص الأنبياء — نص على الداكن ===");
assert(/--text-on-dark:\s*#FFFFFF/.test(aliases), "توكن --text-on-dark أبيض صلب");
assert(aliases.includes("--text-on-dark-secondary"), "توكن ثانوي على الداكن");
assert(css.includes("--ps-text-primary: var(--text-on-dark"), "تفصيل الأنبياء يربط النص الأساسي بالتوكن");
assert(css.includes("--ps-text-body: var(--text-on-dark"), "نص القصة من التوكن");
assert(/\.prophet-section-lux__title\s*\{[^}]*color:\s*var\(--ps-text-primary/s.test(css), "عنوان القسم أبيض التوكن");
assert(/\.prophet-section-lux__title\s*\{[^}]*font-weight:\s*700/s.test(css), "عنوان القسم وزن 700");
assert(/\.prophet-section-lux__title\s*\{[^}]*opacity:\s*1/s.test(css), "عنوان القسم بلا شفافية");
assert(/\.prophet-section-lux__text[\s\S]*?opacity:\s*1/.test(css), "نص القصة opacity 1");
assert(/\.prophet-section-lux--reveal\s*\{[^}]*opacity:\s*1/s.test(css), "reveal بلا بهتان 0.45");
assert(!/\.prophet-section-lux--reveal\s*\{[^}]*opacity:\s*0\.45/s.test(css), "لا opacity 0.45 على reveal");
assert(!/\.prophet-section-lux__title\s*\{[^}]*color:\s*var\(--mj-bg\)/s.test(css), "العنوان لا يعتمد على --mj-bg");

if (failed) process.exit(1);
console.log("prophet-stories-on-dark-text: ok");
