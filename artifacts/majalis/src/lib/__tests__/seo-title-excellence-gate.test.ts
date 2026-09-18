/**
 * بوابة SEO Growth — عناوين/أوصاف عالية القيمة + فهرسة الفوائد.
 * node --import tsx src/lib/__tests__/seo-title-excellence-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const seo = JSON.parse(readFileSync(resolve(root, "src/lib/seo-routes.json"), "utf8")) as {
  routes: Array<{
    path: string;
    title: string;
    description: string;
    sitemap?: boolean;
    robots?: string;
  }>;
};

function route(path: string) {
  const row = seo.routes.find((r) => r.path === path);
  assert.ok(row, `مسار SEO مفقود: ${path}`);
  return row!;
}

{
  const home = route("/");
  assert.match(home.title, /قرآن/);
  assert.match(home.title, /دروس/);
  assert.match(home.title, /علماء|علوم/);
  assert.ok(home.description.length >= 80, "وصف الرئيسية كافٍ");
  assert.doesNotMatch(home.title, /أفضل|حصري|مذهل/u, "بلا clickbait");
}

{
  const fawaid = route("/fawaid");
  assert.match(fawaid.title, /فوائد علمية مختارة/);
  assert.equal(fawaid.sitemap, true, "الفوائد في sitemap");
  assert.ok(!String(fawaid.robots || "").includes("noindex"), "الفوائد قابلة للفهرسة");
}

{
  const hadith = route("/hadith");
  assert.match(hadith.title, /الحديث وعلومه/);
  assert.ok(hadith.title.length > 12, "عنوان الحديث أقوى من اسم قصير");
}

{
  const lessons = route("/lessons");
  assert.match(lessons.title, /دروس شرعية/);
  assert.match(lessons.description, /علماء|سلاسل/);
}

{
  const sections = route("/sections");
  assert.match(sections.title, /أقسام العلوم الشرعية/);
}

{
  const tawhid = route("/tawhid");
  assert.match(tawhid.title, /العقيدة الإسلامية/);
}

{
  const scholars = route("/scholars");
  assert.match(scholars.title, /علماء الأمة/);
  assert.match(scholars.description, /دروس|سلاسل/);
}

{
  const labels = readFileSync(resolve(root, "src/lib/seo-nav-labels.ts"), "utf8");
  assert.match(labels, /"\/fawaid":\s*"الفوائد"/, "تنقّل الفوائد يبقى قصيراً");
  assert.match(labels, /"\/hadith":\s*"الحديث"/, "تنقّل الحديث يبقى قصيراً");
}

console.log("seo-title-excellence-gate.test.ts: ok");
