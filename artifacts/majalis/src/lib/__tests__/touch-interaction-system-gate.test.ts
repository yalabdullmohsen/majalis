/**
 * بوابة Touch & Interaction System — مصحف + أهداف لمس.
 * node --import tsx src/lib/__tests__/touch-interaction-system-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

assert.ok(existsSync(resolve(repoRoot, "docs/qa/INTERACTION_AUDIT.md")));
assert.ok(existsSync(resolve(repoRoot, "docs/qa/interaction-touch-under44-static.json")));

const bp = read("src/styles/breakpoints.css");
assert.match(bp, /--touch-comfortable:\s*48px/);
assert.match(bp, /--ss-chrome-motion:\s*180ms/);
assert.match(bp, /\.ss-hit-expand/);

const css = read("src/features/mushaf-reader/mushaf-reader.css");
assert.match(css, /\.nm-controls__btn[\s\S]{0,320}min-height:\s*var\(--touch-comfortable/);
assert.match(css, /\.nm-controls__page[\s\S]{0,240}min-height:\s*var\(--touch-comfortable/);
assert.match(css, /\.nm-controls--compact \.nm-controls__btn[\s\S]{0,200}--touch-comfortable/);
assert.match(css, /\.nm-page-arrow[\s\S]{0,280}--touch-comfortable/);
assert.match(css, /transition:\s*opacity var\(--ss-chrome-motion/);
assert.doesNotMatch(css, /\.nm-controls--compact \.nm-controls__btn\s*\{[^}]*min-height:\s*2rem/s);

const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
assert.match(reader, /onTapEmpty/);
assert.match(reader, /setChromeOpen\(\(v\) => !v\)/);
assert.match(reader, /mushaf-ayah-hit/);

const cfp = read("src/styles/critical-first-paint.css");
assert.match(cfp, /\.bottom-nav__tab[\s\S]{0,200}--touch-comfortable/);

const audit = readRepo("docs/qa/INTERACTION_AUDIT.md");
assert.match(audit, /\*\*Status:\*\* `PARTIAL`|Status:\*\* `PARTIAL`/);
assert.match(audit, /لا يُعلن.*INTERACTION_SYSTEM_COMPLETE|ممنوع|قبل اختبار/);
assert.doesNotMatch(audit, /\*\*Status:\*\* `COMPLETE`/);

const findings = JSON.parse(readRepo("docs/qa/interaction-touch-under44-static.json")) as {
  mushafContracts: Record<string, boolean>;
};
assert.equal(findings.mushafContracts.controlsBtnUsesTouchComfortable, true);
assert.equal(findings.mushafContracts.pageArrow48, true);

console.log("touch-interaction-system-gate.test.ts: ok");
