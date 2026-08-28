/**
 * بوابة: ContentTrustBox موجود ويحمل التنبيه الشرعي.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MORE_FEATURED_SECTIONS } from "@/features/more/moreSections";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const box = readFileSync(resolve(root, "src/components/content-trust/ContentTrustBox.tsx"), "utf8");
const sectionsPage = readFileSync(resolve(root, "src/pages/account/SectionsPage.tsx"), "utf8");
const sections = readFileSync(resolve(root, "src/features/more/moreSections.ts"), "utf8");

assert.match(box, /ContentTrustBox/);
assert.match(box, /لا تغني عن سؤال أهل العلم/);
assert.match(box, /contentType/);
assert.match(sectionsPage, /MoreHubFromRegistry|SectionsHubFromRegistry/);
assert.match(sectionsPage, /الأقسام/);
assert.match(sections, /sections\.registry/);
assert.equal(MORE_FEATURED_SECTIONS.length, 7);

console.log("content-trust-more-page-gate.test.ts: ok");
