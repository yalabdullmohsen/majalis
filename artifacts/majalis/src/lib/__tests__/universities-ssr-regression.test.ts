/**
 * يمنع تراجع SSR الجامعات إلى H1 + وصف فقط، ويثبت أن العدد من البيانات.
 * node --import tsx src/lib/__tests__/universities-ssr-regression.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const catalog = JSON.parse(
  readFileSync(resolve(root, "src/data/universities-catalog.json"), "utf8"),
) as Array<{ slug?: string; name_ar?: string }>;

assert.ok(Array.isArray(catalog), "كتالوج الجامعات مصفوفة");
assert.ok(catalog.length >= 30, `عدد الجامعات من البيانات ≥30 (الفعلي ${catalog.length})`);

const seo = readFileSync(resolve(root, "scripts/generate-seo.mjs"), "utf8");
assert.match(seo, /universities-catalog\.json/, "SEO يقرأ الكتالوج");
assert.match(seo, /UNIVERSITY_ROWS\.length/, "SSR يعرض العدد من البيانات لا رقمًا ثابتًا");
assert.match(seo, /\/universities\/compare/);
assert.doesNotMatch(
  seo.replace(/UNIVERSITY_ROWS\.length/g, ""),
  /يضم الدليل حالياً <strong>37<\/strong>/,
  "لا رقم 37 ثابت في نص SSR",
);

const page = readFileSync(resolve(root, "src/views/UniversitiesPage.tsx"), "utf8");
assert.match(page, /fetchUniversities/, "الصفحة تجلب القائمة من الخدمة");
assert.doesNotMatch(
  page.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""),
  /["'`]37["'`]/,
  "لا رقم 37 ثابت في صفحة الجامعات",
);

const prerenderIndex = resolve(root, "seo-prerender/universities/index.html");
if (existsSync(prerenderIndex)) {
  const html = readFileSync(prerenderIndex, "utf8");
  assert.match(html, /<h1/i);
  assert.ok(
    html.includes(String(catalog.length)) || /جامعة|كلية/.test(html),
    "SSR الجامعات يحتوي فهرسًا",
  );
  assert.ok(html.length > 2500, "SSR الجامعات ليس رقيقًا");
}

console.log(JSON.stringify({ universitiesFromData: catalog.length }, null, 2));
console.log("universities-ssr-regression.test.ts: ok");
