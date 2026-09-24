/**
 * بوابة Discover للمؤسسات — مطابقة تجربة المشاهد.
 * Run: node --import tsx src/lib/__tests__/institutions-discover-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FEATURED_INSTITUTION_IDS,
  getFeaturedInstitutions,
  getInstitutionById,
} from "../../data/institutions-catalog";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const page = readFileSync(resolve(root, "src/views/InstitutionsPage.tsx"), "utf8");
const card = readFileSync(
  resolve(root, "src/components/institutions/InstitutionDiscoverCard.tsx"),
  "utf8",
);
const css = readFileSync(resolve(root, "src/styles/pages/institutions.css"), "utf8");

assert.equal(getFeaturedInstitutions().length, FEATURED_INSTITUTION_IDS.length);
for (const id of FEATURED_INSTITUTION_IDS) {
  assert.ok(getInstitutionById(id), `featured موجود: ${id}`);
}

assert.match(page, /ilm-discover|inst-discover/);
assert.match(page, /ilm-featured|مؤسسات مميزة/);
assert.match(page, /ilm-chip|TYPE_FILTERS/);
assert.match(page, /InstitutionDiscoverCard/);
assert.match(page, /AppPage/);
assert.doesNotMatch(page, /SectionTemplatePage/);
assert.doesNotMatch(page, /vault-tab|vault-search/);
assert.match(card, /ilm-card/);
assert.match(card, /soft-card/);
assert.match(card, /DirectoryMedia/);
assert.match(css, /html\.dark \.inst-card|html\[data-theme="dark"\] \.inst-card/);

console.log("institutions-discover-gate.test.ts: ok");
