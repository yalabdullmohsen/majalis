/**
 * بوابة P0 — هوية سُنّة البصرية الموحّدة.
 * node --import tsx src/lib/__tests__/ssunnah-visual-identity-p0-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const api = read("src/styles/ssunnah-theme-api.css");
const themeTs = read("src/lib/ssunnah-theme.ts");
const calm = read("src/styles/sections-calm-polish.css");
const main = read("src/main.tsx");
const board = read("docs/SSUNNAH_VISUAL_IDENTITY_BOARD.md");
const baseline = JSON.parse(read("docs/ssunnah-page-hex-debt-baseline.json")) as {
  maxPageHex: number;
  brand: string;
};

assert.match(board, /سُنّة/);
assert.doesNotMatch(board, /مجالس العلم|منصة مجالس/);
assert.equal(baseline.brand, "سُنّة");

for (const tok of [
  "--ss-color-surface-feature",
  "--ss-color-surface-knowledge",
  "--ss-color-surface-selected",
  "--ss-color-primary-container",
  "--ss-color-focus",
  "--ss-color-skeleton",
  "--ss-type-display",
  "--ss-type-hadith",
  "--ss-space-section",
  "--ss-elev-low",
  "--ss-motion-standard",
]) {
  assert.match(api, new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

assert.match(themeTs, /surfaceFeature/);
assert.match(themeTs, /hadithText/);
assert.match(themeTs, /display:/);

/* لا يُسمح لـ calm-polish بإعادة تعريف هوية --mj-* بهكس */
assert.doesNotMatch(calm, /--mj-bg:\s*#/);
assert.doesNotMatch(calm, /--mj-brand:\s*#/);
assert.doesNotMatch(calm, /--mj-surface:\s*#/);
assert.match(calm, /--background:\s*var\(--mj-bg\)/);
assert.match(calm, /المصدر: app\/styles\/theme\.css/);

assert.match(main, /ssunnah-theme-api\.css/);
assert.match(main, /visual-identity-unify\.css/);
assert.match(main, /sections-calm-polish\.css/);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith(".css")) out.push(p);
  }
  return out;
}

const hexRe = /#[0-9a-fA-F]{3,8}\b/g;
let pageHex = 0;
for (const f of walk(resolve(root, "src/styles/pages"))) {
  const body = readFileSync(f, "utf8");
  pageHex += body.match(hexRe)?.length ?? 0;
}

assert.ok(
  pageHex <= baseline.maxPageHex,
  `دين هكس الصفحات ارتفع: ${pageHex} > سقف ${baseline.maxPageHex}`,
);
assert.ok(pageHex < 1800, `دين هكس الصفحات ما زال مرتفعًا جدًا بلا ترحيل: ${pageHex}`);

const fab = read("src/components/FloatingBackButton.tsx");
assert.match(fab, /FLOATING_BACK_DISABLED\s*=\s*true/);

console.log(
  `ssunnah-visual-identity-p0-gate: ok · pageHex=${pageHex}/${baseline.maxPageHex}`,
);
