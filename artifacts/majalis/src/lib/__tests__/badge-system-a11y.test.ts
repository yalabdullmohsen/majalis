/**
 * بوابة نظام الشارات + تسميات عامة (بدون Playwright).
 * Run: node --import tsx src/lib/__tests__/badge-system-a11y.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { publicLabelText, toPublicLabel } from "../label-display.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const tokens = readFileSync(resolve(root, "src/styles/design-tokens.css"), "utf8");
const badgeCss = readFileSync(resolve(root, "src/styles/components/badge-system.css"), "utf8");
const main = readFileSync(resolve(root, "src/main.tsx"), "utf8");
const search = readFileSync(resolve(root, "src/styles/pages/search.css"), "utf8");
const ghCli = readFileSync(
  resolve(root, "../../.github/scripts/safe-auto-merge/cli.mjs"),
  "utf8",
);

for (const t of [
  "--badge-critical-bg",
  "--badge-critical-fg",
  "--badge-warning-bg",
  "--badge-warning-fg",
  "--badge-info-bg",
  "--badge-info-fg",
  "--badge-ui-bg",
  "--badge-ui-fg",
  "--badge-filter-active-bg",
  "--badge-accent-fg",
]) {
  assert.match(tokens, new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

assert.match(badgeCss, /\.mj-badge--critical/);
assert.match(badgeCss, /\.mj-badge--warning/);
assert.match(badgeCss, /\.mj-badge--info/);
assert.match(badgeCss, /\.mj-badge--ui/);
assert.match(badgeCss, /\.mj-filter/);
assert.match(badgeCss, /\.search-kind-badge--library/);
assert.match(main, /badge-system\.css/);

assert.doesNotMatch(
  search,
  /\.search-kind-badge--library[^{]*\{[^}]*color:\s*var\(--mj-accent,\s*#B08A3E\)/s,
);
assert.match(search, /--badge-accent-fg/);

assert.equal(publicLabelText("blocked:danger-path"), "يتطلب مراجعة");
assert.equal(publicLabelText("risky:manual-review"), "مراجعة مطلوبة");
assert.equal(toPublicLabel("ci").tone, "info");
assert.equal(toPublicLabel("ui").tone, "ui");
assert.equal(toPublicLabel("docs").publicLabel, "توثيق");
assert.equal(toPublicLabel("ios").publicLabel, "تطبيق iOS");

assert.match(ghCli, /\[BLOCKED_DANGER_PATH_LABEL\]:\s*"7F1D1D"/);
assert.match(ghCli, /\[RISKY_MANUAL_REVIEW_LABEL\]:\s*"9A3412"/);
assert.match(ghCli, /\bci:\s*"1E3A8A"/);
assert.match(ghCli, /\bdocs:\s*"1E3A8A"/);
assert.match(ghCli, /\bios:\s*"1E3A8A"/);
assert.match(ghCli, /\bui:\s*"5B21B6"/);
assert.match(ghCli, /يتطلب مراجعة/);
assert.match(ghCli, /مراجعة مطلوبة/);

console.log("badge-system-a11y: ok");
