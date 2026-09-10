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

const BOILERPLATE_RE =
  /يُعرَض هنا|يُعرض تعريفًا مرجعيًا|يُعرَض تعريفًا مرجعيًا|سيتم إضافة|قريبًا\.\.\.|lorem ipsum/i;

console.log("=== أحجام الكتالوج ===");
assert.ok(ISLAMIC_LANDMARKS.length >= 40, `معالم متوقعة ≥40 وجدنا ${ISLAMIC_LANDMARKS.length}`);
assert.ok(INSTITUTIONS.length >= 45, `مؤسسات متوقعة ≥45 وجدنا ${INSTITUTIONS.length}`);
assert.ok(universities.length >= 35, `جامعات متوقعة ≥35 وجدنا ${universities.length}`);

console.log("=== جودة المعالم ===");
const landmarkIds = new Set<string>();
for (const L of ISLAMIC_LANDMARKS) {
  assert.ok(L.id && !landmarkIds.has(L.id), `id مكرر/فارغ: ${L.id}`);
  landmarkIds.add(L.id);
  assert.ok((L.description || "").length >= 220, `وصف قصير: ${L.id}`);
  assert.ok((L.significance || "").length >= 80, `أهمية قصيرة: ${L.id}`);
  assert.ok(Number.isFinite(L.lat) && Number.isFinite(L.lng), `إحداثيات: ${L.id}`);
  assert.doesNotMatch(L.description || "", BOILERPLATE_RE, `قالب معلم: ${L.id}`);
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
  assert.ok((I.description || "").length >= 200, `وصف قصير: ${I.id}`);
  assert.doesNotMatch(I.description || "", BOILERPLATE_RE, `وصف قالبي ممنوع: ${I.id}`);
}

console.log("=== جودة الجامعات ===");
for (const U of universities) {
  assert.ok(U.slug && U.name_ar, "slug/name");
  assert.ok((U.about || "").length >= 260, `about قصير: ${U.slug}`);
  assert.ok(Array.isArray(U.faqs) && U.faqs.length >= 2, `faqs ناقصة: ${U.slug}`);
  assert.ok(Array.isArray(U.programs) && U.programs.length >= 1, `programs ناقصة: ${U.slug}`);
  assert.doesNotMatch(U.about || "", BOILERPLATE_RE, `قالب جامعة: ${U.slug}`);
  for (const faq of U.faqs as Array<{ answer?: string }>) {
    assert.ok(
      ((faq?.answer || "").trim().length) >= 100,
      `إجابة FAQ قصيرة: ${U.slug}`,
    );
  }
}

console.log("=== هوية CSS للدليل ===");
const ilmCss = readFileSync(resolve(root, "src/styles/islamic-landmarks.css"), "utf8");
const instCss = readFileSync(resolve(root, "src/styles/pages/institutions.css"), "utf8");
const theme = readFileSync(resolve(root, "src/styles/section-cards-theme.css"), "utf8");
const instPage = readFileSync(resolve(root, "src/views/InstitutionsPage.tsx"), "utf8");
const ilmPage = readFileSync(resolve(root, "src/views/IslamicLandmarksPage.tsx"), "utf8");
const univCard = readFileSync(resolve(root, "src/components/universities/UniversityCard.tsx"), "utf8");
assert.doesNotMatch(ilmCss, /#5B21B6|#5B21B6/i, "لا بنفسجي صلب في المعالم");
assert.match(ilmCss, /\.ilm-card/, "ilm-card موجود");
assert.match(instCss, /html\.dark \.inst-card|html\[data-theme="dark"\] \.inst-card/);
assert.match(theme, /\.ilm-card/);
assert.match(theme, /\.inst-card/);
assert.match(instPage, /soft-card/, "بطاقات المؤسسات ضمن soft-card");
assert.match(ilmPage, /soft-card/, "بطاقات المعالم ضمن soft-card");
assert.match(instPage, /mj-pressable/, "مؤسسات قابلة للضغط بصريًا");
assert.match(ilmPage, /mj-pressable/, "معالم قابلة للضغط");
assert.match(instPage, /SectionTemplatePage/, "المؤسسات على قالب القسم الموحّد");
assert.match(univCard, /univ-card/, "بطاقة الجامعة موحّدة");
assert.match(univCard, /soft-card|mj-pressable/, "جامعة soft/pressable");

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
assert.match(theme, /border-radius:\s*var\(--radius-card,\s*24px\)/, "حواف الدليل ناعمة 24px");

console.log("✓ directory-catalogs-quality-gate");
