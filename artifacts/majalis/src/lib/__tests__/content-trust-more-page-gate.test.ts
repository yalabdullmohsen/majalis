/**
 * بوابة: ContentTrustBox موجود ويحمل التنبيه الشرعي.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const box = readFileSync(resolve(root, "src/components/content-trust/ContentTrustBox.tsx"), "utf8");
const more = readFileSync(resolve(root, "src/pages/account/MorePage.tsx"), "utf8");
const sections = readFileSync(resolve(root, "src/features/more/moreSections.ts"), "utf8");

assert.match(box, /ContentTrustBox/);
assert.match(box, /لا تغني عن سؤال أهل العلم/);
assert.match(box, /contentType/);
assert.match(more, /MORE_FEATURED_SECTIONS/);
assert.match(more, /MORE_STANDARD_SECTIONS/);
assert.match(more, /MORE_ACCOUNT_SECTIONS/);
assert.match(more, /more-page-tile--\$\{size\}/);
assert.match(more, /size="lg"|size="sm"/);
assert.match(more, /الأقسام الأساسية/);
const moreCss = readFileSync(resolve(root, "src/styles/pages/more-page.css"), "utf8");
assert.match(moreCss, /\.more-page-tile--lg/);
assert.match(sections, /tier:\s*"standard"/);
assert.equal(MORE_FEATURED_COUNT(sections), 10);

function MORE_FEATURED_COUNT(src: string): number {
  const m = src.match(/MORE_FEATURED_SECTIONS[^=]*=\s*\[([\s\S]*?)\];/);
  assert.ok(m);
  return (m![1].match(/id:\s*"/g) || []).length;
}

console.log("content-trust-more-page-gate.test.ts: ok");
