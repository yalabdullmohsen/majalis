/**
 * بوابة: نص قصص الأنبياء مقروء في النهاري والليلي بعد إزالة الكحلي.
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

console.log("\n=== قصص الأنبياء — تباين النص ===");
assert(
  /--text-on-dark:\s*var\(--on-dark-strong\)/.test(aliases) || /--text-on-dark:\s*#FFFFFF/.test(aliases),
  "توكن --text-on-dark أبيض صلب",
);
assert(aliases.includes("--text-on-dark-secondary"), "توكن ثانوي على الداكن");
assert(/--prophets-ink\s*:/.test(css), "تفصيل الأنبياء يربط النص بـ --prophets-ink");
assert(/--ps-text-primary:\s*var\(--prophets-ink\)/.test(css), "النص الأساسي من prophets-ink");
assert(/--ps-text-body:\s*var\(--prophets-ink\)/.test(css), "نص القصة من prophets-ink");
assert(/\.prophet-section-lux__title\s*\{[^}]*color:\s*var\(--prophets-ink/s.test(css), "عنوان القسم بلون الحبر");
assert(/\.prophet-section-lux__title\s*\{[^}]*font-weight:\s*700/s.test(css), "عنوان القسم وزن 700");
assert(/\.prophet-section-lux__title\s*\{[^}]*opacity:\s*1/s.test(css), "عنوان القسم بلا شفافية");
assert(/\.prophet-section-lux__text[\s\S]*?opacity:\s*1/.test(css), "نص القصة opacity 1");
assert(/\.prophet-section-lux--reveal\s*\{[^}]*opacity:\s*1/s.test(css), "reveal بلا بهتان 0.45");
assert(!/\.prophet-section-lux--reveal\s*\{[^}]*opacity:\s*0\.45/s.test(css), "لا opacity 0.45 على reveal");
assert(!/#0[Bb]1[Aa]2[Ee]/.test(css), "لا كحلي قديم في CSS");
assert(
  /html\.dark \.prophet-detail-lux[\s\S]{0,400}?--prophets-ink:\s*var\(--text-primary/s.test(css),
  "ليلي: نص عاجي عبر text-primary",
);

if (failed) process.exit(1);
console.log("prophet-stories-on-dark-text: ok");
