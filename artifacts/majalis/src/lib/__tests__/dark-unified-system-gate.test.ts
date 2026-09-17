/**
 * بوابة: عقد الوضع الليلي الموحّد — مصدر دلالي واحد بلا أنظمة متوازية.
 * تشغيل: node --import tsx src/lib/__tests__/dark-unified-system-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const theme = read("src/app/styles/theme.css");
const ds = read("src/styles/dark-design-system.css");
const refine = read("src/styles/premium-dark-refine.css");
const recovery = read("src/styles/dark-mode-recovery.css");

for (const token of [
  "--dark-bg",
  "--dark-surface",
  "--dark-elevated",
  "--dark-card",
  "--dark-interactive",
  "--dark-overlay",
  "--dark-float",
  "--dark-elev-1",
  "--dark-elev-2",
  "--dark-elev-3",
]) {
  assert.match(theme, new RegExp(token.replace(/-/g, "\\-")), `theme defines ${token}`);
}

assert.match(theme, /--shadow-mj:\s*var\(--dark-elev-1\)/, "ليلي: ظلال حيّة لا none");
assert.doesNotMatch(
  theme.replace(/\/\*[\s\S]*?\*\//g, ""),
  /html\[data-theme="dark"\][\s\S]{0,2500}--shadow-mj:\s*none/,
  "لا تصفير ظل ليلي في عقد الثيم",
);

assert.match(ds, /background(?:-color)?:\s*var\(--dark-card/, "design-system بطاقات عبر التوكن");
assert.doesNotMatch(
  ds.match(/\/\* —— بطاقات[\s\S]*?\.soft-card[\s\S]{0,800}/)?.[0] ?? "",
  /background(?:-color)?:\s*#24302b/,
  "بلا هكس ثابت ينافس عقد البطاقة",
);

assert.match(refine, /Dark System Contract/, "عقد التطبيع في premium-refine");
assert.match(refine, /--dark-card:\s*var\(--pd-card\)/);
assert.match(refine, /بطاقة داخل بطاقة/);
assert.match(refine, /\.lessons-v3-sticky/);
assert.match(refine, /\.app-back-btn--bar/);
assert.match(refine, /\[class\*="__glow"\]/);

assert.match(recovery, /--dark-overlay:\s*var\(--dm-surface-overlay\)/);
assert.match(recovery, /--dark-float:\s*var\(--dm-surface-interactive\)/);

assert.doesNotMatch(ds, /filter:\s*invert/);
assert.doesNotMatch(refine, /filter:\s*invert/);

console.log("dark-unified-system-gate.test.ts: ok");
