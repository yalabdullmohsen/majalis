/**
 * بوابة check-sources-and-licenses + content-provenance.
 * تشغيل: node --import tsx src/lib/__tests__/sources-licenses-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hasPublicSource, shouldNoindexForSourceGap } from "../content-provenance.ts";
import { resolveLibraryProvenance } from "../library-provenance.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.ok(existsSync(resolve(root, "scripts/check-sources-and-licenses.js")));
assert.match(read("package.json"), /check:sources-and-licenses/);

assert.equal(hasPublicSource({ source: "صحيح البخاري" }), true);
assert.equal(hasPublicSource({ source: "السنة النبوية" }), false);
assert.equal(hasPublicSource({ documentation_status: "unsourced" }), false);
assert.equal(hasPublicSource({ documentation_status: "unsourced", reference: "البقرة: 255" }), true);

assert.equal(shouldNoindexForSourceGap({ needsSource: true }), true);

const prov = resolveLibraryProvenance({
  id: "book-test",
  title: "اختبار",
  author: "مؤلف",
  type: "كتاب",
  category: "حديث",
  description: "وصف",
  status: "approved",
  keywords: [],
  sort_order: 1,
});
assert.equal(prov.hostedBySsunnah, false);
assert.equal(prov.license, "bibliographic_reference");
assert.match(prov.sourceName, /مؤلف/);

assert.match(read("src/views/SourcesLicensesPage.tsx"), /الأحاديث/);
assert.match(read("src/views/SourcesLicensesPage.tsx"), /path: "\/data-licenses"/);
assert.match(read("src/lib/content-display-zones.ts"), /isUnsourcedForPublic/);

console.log("sources-licenses-gate.test.ts: ok");
