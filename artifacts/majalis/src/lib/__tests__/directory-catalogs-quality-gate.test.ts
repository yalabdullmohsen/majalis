/**
 * بوابة جودة كتالوجات الدليل الإسلامي (معالم / مؤسسات / جامعات).
 * تشغيل: node --import tsx src/lib/__tests__/directory-catalogs-quality-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ISLAMIC_LANDMARKS } from "../islamic-landmarks-data";
import { INSTITUTIONS } from "../../data/institutions-catalog";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const universities = JSON.parse(
  readFileSync(resolve(root, "src/data/universities-catalog.json"), "utf8"),
) as Array<{
  slug: string;
  name_ar: string;
  about?: string;
  faqs?: unknown[];
  programs?: unknown[];
}>;

console.log("=== أحجام الكتالوج ===");
assert.ok(ISLAMIC_LANDMARKS.length >= 38, `معالم متوقعة ≥38 وجدنا ${ISLAMIC_LANDMARKS.length}`);
assert.ok(INSTITUTIONS.length >= 42, `مؤسسات متوقعة ≥42 وجدنا ${INSTITUTIONS.length}`);
assert.ok(universities.length >= 35, `جامعات متوقعة ≥35 وجدنا ${universities.length}`);

console.log("=== جودة المعالم ===");
const landmarkIds = new Set<string>();
for (const L of ISLAMIC_LANDMARKS) {
  assert.ok(L.id && !landmarkIds.has(L.id), `id مكرر/فارغ: ${L.id}`);
  landmarkIds.add(L.id);
  assert.ok((L.description || "").length >= 90, `وصف قصير: ${L.id}`);
  assert.ok((L.significance || "").length >= 40, `أهمية قصيرة: ${L.id}`);
  assert.ok(Number.isFinite(L.lat) && Number.isFinite(L.lng), `إحداثيات: ${L.id}`);
}

console.log("=== جودة المؤسسات ===");
const instIds = new Set<string>();
const instNames = new Set<string>();
for (const I of INSTITUTIONS) {
  assert.ok(I.id && !instIds.has(I.id), `id مكرر: ${I.id}`);
  instIds.add(I.id);
  const nameKey = I.name.replace(/\s+/g, " ").trim();
  assert.ok(!instNames.has(nameKey), `اسم مكرر: ${nameKey}`);
  instNames.add(nameKey);
  assert.ok((I.description || "").length >= 80, `وصف قصير: ${I.id}`);
}

console.log("=== جودة الجامعات ===");
for (const U of universities) {
  assert.ok(U.slug && U.name_ar, "slug/name");
  assert.ok((U.about || "").length >= 180, `about قصير: ${U.slug}`);
  assert.ok(Array.isArray(U.faqs) && U.faqs.length >= 2, `faqs ناقصة: ${U.slug}`);
  assert.ok(Array.isArray(U.programs) && U.programs.length >= 1, `programs ناقصة: ${U.slug}`);
}

console.log("=== هوية CSS للدليل ===");
const ilmCss = readFileSync(resolve(root, "src/styles/islamic-landmarks.css"), "utf8");
const instCss = readFileSync(resolve(root, "src/styles/pages/institutions.css"), "utf8");
const theme = readFileSync(resolve(root, "src/styles/section-cards-theme.css"), "utf8");
assert.doesNotMatch(ilmCss, /#5B21B6|#5B21B6/i, "لا بنفسجي صلب في المعالم");
assert.match(ilmCss, /\.ilm-card/, "ilm-card موجود");
assert.match(instCss, /html\.dark \.inst-card|html\[data-theme="dark"\] \.inst-card/);
assert.match(theme, /\.ilm-card/);
assert.match(theme, /\.inst-card/);


console.log("=== روابط المؤسسات والمسافات ===");
for (const I of INSTITUTIONS) {
  assert.ok(I.website || I.mapQuery, `رابط/خريطة ناقص: ${I.id}`);
  assert.equal(I.name, I.name.replace(/\s+/g, " ").trim(), `مسافات الاسم: ${I.id}`);
  assert.equal(I.description, I.description.replace(/\s+/g, " ").trim(), `مسافات الوصف: ${I.id}`);
}
for (const L of ISLAMIC_LANDMARKS) {
  assert.equal(L.name, L.name.replace(/\s+/g, " ").trim(), `مسافات معلم: ${L.id}`);
  assert.equal(L.description, L.description.replace(/\s+/g, " ").trim(), `مسافات وصف معلم: ${L.id}`);
}

console.log("=== بطاقة الجامعة في الثيم ===");
assert.match(theme, /\.univ-card/);
assert.match(theme, /html\.dark \.univ-card|html\[data-theme="dark"\] \.univ-card/);

console.log("✓ directory-catalogs-quality-gate");
