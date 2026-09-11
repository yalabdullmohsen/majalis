/**
 * بوابة: بطاقة نتيجة البحث على soft-card بلا سطح مخصص منفصل.
 * node --import tsx src/lib/__tests__/search-result-card-soft-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const view = readFileSync(resolve(root, "src/pages/account/ui/SearchView.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/styles/pages/search.css"), "utf8");

assert.match(view, /srch-result-card soft-card soft-card--on-light/, "نتيجة البحث تستخدم soft-card على سطح فاتح");
assert.doesNotMatch(view, /\bui-card\b/, "SearchView بلا ui-card");
assert.doesNotMatch(view, /\bmj-card\b/, "SearchView بلا mj-card");
assert.match(css, /\.srch-result-card\.soft-card\s*\{/, "CSS التخطيط مربوط بـ soft-card");
assert.doesNotMatch(
  css,
  /(^|[^.\w-])\.srch-result-card\s*\{[^}]*\bbackground\s*:/m,
  "لا خلفية سطح مخصصة على .srch-result-card وحدها",
);
const mur = readFileSync(resolve(root, "src/styles/modern-ui-refresh.css"), "utf8");
assert.doesNotMatch(
  mur,
  /\.srch-result-card\s*,/,
  "modern-ui-refresh لا يفرض سطحًا منفصلًا على srch-result-card",
);
assert.match(mur, /\.srch-result-card\.soft-card/, "modern-ui-refresh يحترم soft-card لنتائج البحث");

console.log("search-result-card-soft-gate.test.ts: ok");
