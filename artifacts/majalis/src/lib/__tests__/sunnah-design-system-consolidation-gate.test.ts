/**
 * Sunnah Design System consolidation gate — مصدر حقيقة واحد + بطاقات DS بلا hex.
 * تشغيل: node --import tsx src/lib/__tests__/sunnah-design-system-consolidation-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SS_COLOR } from "../ssunnah-theme.ts";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");

const theme = readFileSync(resolve(majalisRoot, "src/app/styles/theme.css"), "utf8");
const api = readFileSync(resolve(majalisRoot, "src/styles/ssunnah-theme-api.css"), "utf8");
const geometry = readFileSync(resolve(majalisRoot, "src/styles/sunnah-geometry-system.css"), "utf8");
const appCard = readFileSync(resolve(majalisRoot, "src/components/design-system/AppCard.tsx"), "utf8");
const feature = readFileSync(resolve(majalisRoot, "src/components/design-system/FeatureCard.tsx"), "utf8");
const content = readFileSync(resolve(majalisRoot, "src/components/design-system/ContentCard.tsx"), "utf8");

console.log("=== Quran Gold + Ivory + Emerald في المصدر ===");
assert.match(theme, /--sunnah-quran-gold:\s*#C9A82E/i);
assert.match(theme, /--sunnah-ivory:/);
assert.match(theme, /--sunnah-emerald:/);
assert.match(theme, /--sunnah-night-bg:/);
assert.match(theme, /--svl-accent-gold:\s*var\(--sunnah-quran-gold\)/);

console.log("=== جسر --ss-* بلا هكس جديد ===");
assert.match(api, /--ss-color-quran-gold:\s*var\(--sunnah-quran-gold\)/);
assert.match(api, /--ss-color-ivory:/);
assert.match(api, /--ss-color-emerald:/);
assert.doesNotMatch(api, /--ss-color-quran-gold:\s*#[0-9A-Fa-f]/);

console.log("=== SS_COLOR TS ===");
assert.equal(SS_COLOR.quranGold, "var(--ss-color-quran-gold)");
assert.equal(SS_COLOR.ivory, "var(--ss-color-ivory)");
assert.equal(SS_COLOR.emerald, "var(--ss-color-emerald)");

console.log("=== Geometry على Quran Gold ===");
assert.match(geometry, /--sunnah-quran-gold/);

console.log("=== بطاقات DS بلا شريط جانبي وبلا hex ===");
assert.doesNotMatch(appCard, /border-inline-start:\s*[34]px/);
assert.doesNotMatch(feature, /#[0-9A-Fa-f]{3,8}/);
assert.doesNotMatch(content, /#[0-9A-Fa-f]{3,8}/);

const dsDir = resolve(majalisRoot, "src/components/design-system");
function walkTsx(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) walkTsx(p, out);
    else if (/\.tsx?$/.test(name.name)) out.push(p);
  }
  return out;
}
for (const file of walkTsx(dsDir)) {
  const src = readFileSync(file, "utf8");
  assert.doesNotMatch(
    src,
    /#[0-9A-Fa-f]{3,8}(?![0-9A-Fa-f])/,
    `${file.replace(majalisRoot + "/", "")} بلا hex مباشر`,
  );
}

console.log("=== تقرير التصميم ===");
const reportPath = resolve(repoRoot, "docs/design/SUNNAH_DESIGN_SYSTEM_REPORT.md");
assert.ok(existsSync(reportPath), reportPath);
assert.match(readFileSync(reportPath, "utf8"), /Quran Gold|#C9A82E|مصدر الحقيقة/);

console.log("sunnah-design-system-consolidation-gate.test.ts: ok");
