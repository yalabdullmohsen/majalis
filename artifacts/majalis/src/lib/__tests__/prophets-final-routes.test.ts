/**
 * بوابة نهائية لقصص الأنبياء — العدد، الروابط، الـredirects، بلا حشو قديم.
 * تشغيل: node --import tsx src/lib/__tests__/prophets-final-routes.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PROPHETS,
  PROPHET_SLUG_ALIASES,
  getProphet,
  resolveProphetSlug,
} from "../prophets-data.ts";
import { PROPHETS_LINEAGE, QURAN_PROPHETS_ORDER, findNode, type LineageNode } from "../prophets-lineage.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const EXPECTED_SLUGS = [
  "adam",
  "idris",
  "nuh",
  "hud",
  "salih",
  "ibrahim",
  "lut",
  "ismail",
  "is-haq",
  "yaqub",
  "yusuf",
  "ayyub",
  "shuayb",
  "musa",
  "harun",
  "dhul-kifl",
  "dawud",
  "sulayman",
  "ilyas",
  "al-yasa",
  "yunus",
  "zakariyya",
  "yahya",
  "isa",
  "muhammad",
] as const;

const FORBIDDEN_IN_STORY = [
  "تُربط سيرته",
  "يُستحضر المآل",
  "الصبر على مقتضاه",
  "البلدفلسطين",
  "Esc للقائمة",
  "اختصارات:",
];

function collectLineageSlugs(node: LineageNode, out: string[] = []): string[] {
  if (node.slug) out.push(node.slug);
  for (const child of node.children ?? []) collectLineageSlugs(child, out);
  return out;
}

assert.equal(PROPHETS.length, 25, "يجب أن تعرض /prophets 25 قصة");
assert.deepEqual(
  PROPHETS.map((p) => p.slug),
  [...EXPECTED_SLUGS],
  "قائمة الـslugs الرسمية غير مطابقة",
);

const knowledgeDir = resolve(root, "public/data/knowledge/prophets");
assert.ok(existsSync(knowledgeDir), "مجلد قصص المعرفة ناقص");
const jsonFiles = readdirSync(knowledgeDir).filter((f) => f.endsWith(".json"));
assert.equal(jsonFiles.length, 25, `ملفات المعرفة يجب أن تكون 25 — وُجد ${jsonFiles.length}`);

for (const slug of EXPECTED_SLUGS) {
  const prophet = getProphet(slug);
  assert.ok(prophet, `قصة ناقصة من البيانات: ${slug}`);
  assert.equal(prophet.slug, slug);
  const jsonPath = resolve(knowledgeDir, `${slug}.json`);
  assert.ok(existsSync(jsonPath), `ملف معرفة ناقص: ${slug}.json`);
  const raw = readFileSync(jsonPath, "utf8");
  assert.ok(raw.length > 200, `${slug}.json قصير جداً`);
  for (const phrase of FORBIDDEN_IN_STORY) {
    assert.ok(!raw.includes(phrase), `${slug}.json يحتوي حشواً محظوراً: ${phrase}`);
  }
  const blob = [
    prophet.briefBio,
    prophet.peopleOrPlace,
    prophet.era,
    ...prophet.keyAttributes,
    ...prophet.lessons,
  ].join("\n");
  for (const phrase of FORBIDDEN_IN_STORY) {
    assert.ok(!blob.includes(phrase), `${slug} بيانات الحشو: ${phrase}`);
  }
}

assert.equal(resolveProphetSlug("zakariya"), "zakariyya");
assert.equal(resolveProphetSlug("zakaria"), "zakariyya");
assert.equal(getProphet("zakariya")?.slug, "zakariyya");
assert.equal(getProphet("zakaria")?.slug, "zakariyya");
assert.equal(PROPHET_SLUG_ALIASES.zakariya, "zakariyya");
assert.equal(PROPHET_SLUG_ALIASES.zakaria, "zakariyya");

assert.equal(QURAN_PROPHETS_ORDER.length, 25);
for (const slug of QURAN_PROPHETS_ORDER) {
  assert.ok(getProphet(slug), `ترتيب الشجرة يشير لـslug غير موجود: ${slug}`);
}

const lineageSlugs = [...new Set(collectLineageSlugs(PROPHETS_LINEAGE))];
for (const slug of lineageSlugs) {
  assert.ok(
    getProphet(slug),
    `عقدة شجرة بأنساب تشير لـslug غير رسمي بلا alias يعمل: ${slug}`,
  );
}
assert.ok(findNode(PROPHETS_LINEAGE, "zakariyya"), "عقدة زكريا في الشجرة يجب أن تكون zakariyya");
assert.equal(findNode(PROPHETS_LINEAGE, "zakariya"), null);

const app = readFileSync(resolve(root, "src/App.tsx"), "utf8") + "\n" + readFileSync(resolve(root, "src/AppRoutes.tsx"), "utf8");
assert.match(
  app,
  /path="\/prophets\/zakariya"><Redirect\s+to="\/prophets\/zakariyya"/,
  "App يجب أن يحوّل /prophets/zakariya → zakariyya",
);
assert.match(
  app,
  /path="\/prophets\/zakaria"><Redirect\s+to="\/prophets\/zakariyya"/,
  "App يجب أن يحوّل /prophets/zakaria → zakariyya",
);
assert.equal(
  /path="\/prophets\/:slug"[^>]*>\s*<Redirect\s+to=["']\/["']/.test(app),
  false,
  "مسار /prophets/:slug لا يجوز أن يحوّل للرئيسية",
);
assert.equal(
  /path="\/prophets"[^>]*>\s*<Redirect\s+to=["']\/["']/.test(app),
  false,
  "مسار /prophets لا يجوز أن يحوّل للرئيسية",
);

const vercel = readFileSync(resolve(root, "vercel.json"), "utf8");
assert.match(
  vercel,
  /"source"\s*:\s*"\/prophets\/zakariya"[\s\S]{0,160}"destination"\s*:\s*"\/prophets\/zakariyya"/,
  "vercel 301: zakariya → zakariyya",
);
assert.match(
  vercel,
  /"source"\s*:\s*"\/prophets\/zakaria"[\s\S]{0,160}"destination"\s*:\s*"\/prophets\/zakariyya"/,
  "vercel 301: zakaria → zakariyya",
);
assert.equal(
  /"source"\s*:\s*"\/prophets\/zakariya"[\s\S]{0,160}"destination"\s*:\s*"\/"/.test(vercel),
  false,
  "vercel لا يحوّل zakariya للرئيسية",
);

const pageSrc = readFileSync(resolve(root, "src/views/ProphetStoriesPage.tsx"), "utf8");
assert.match(pageSrc, /PROPHETS/);
assert.match(pageSrc, /getProphet/);
assert.match(pageSrc, /routeSlug/, "slug متزامن من المسار بلا انتظار effect");
assert.match(pageSrc, /topic-page--prophets/, "قائمة الأنبياء بامتداد full-bleed");
assert.match(pageSrc, /لم يتم العثور على هذا المحتوى/, "slug مفقود ≠ رسالة إنترنت");
assert.doesNotMatch(
  pageSrc,
  /setLocation\(\s*["']\/["']\s*\)|navigate\(\s*["']\/["']\s*\)|Redirect\s+to=["']\/["']/,
  "صفحة الأنبياء لا تُسقط للرئيسية",
);
assert.doesNotMatch(
  pageSrc,
  /تحقق من الاتصال بالإنترنت/,
  "صفحة الأنبياء لا تعرض رسالة offline مزيفة عند غياب slug",
);

const cssSrc = readFileSync(resolve(root, "src/styles/pages/prophet-stories.css"), "utf8");
assert.match(cssSrc, /\.topic-page\.topic-page--prophets/, "CSS full-bleed للقائمة");
assert.match(cssSrc, /min-height:\s*100dvh/, "امتداد ارتفاع الشاشة");
assert.match(cssSrc, /\.app-main:has\(\.prophet-detail-lux\)/, "طلاء app-main لتفاصيل النبي");
assert.match(cssSrc, /border-radius:\s*0/, "بلا زوايا حادة على إطار الصفحة");

console.log(`prophets-final-routes: OK — ${PROPHETS.length} قصة، aliases زكريا، بلا homepage fallback`);
