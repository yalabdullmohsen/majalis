/**
 * بوابة: إعادة تنظيم الأقسام — دمج/إلغاء التكرار.
 * تشغيل: node --import tsx src/lib/__tests__/sections-merge-reorg.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BOTTOM_NAV_TABS } from "@/lib/nav-map";
import { MORE_FEATURED_SECTIONS } from "@/features/more/moreSections";
import { SERVICES_CENTER_GROUPS } from "@/lib/services-center-nav";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

const FORBIDDEN = [/مسارات التعلم/, /المسارات العلمية/];

const SURFACES = [
  "src/features/more/moreSections.ts",
  "src/lib/services-center-nav.ts",
  "src/lib/site-footer-nav.ts",
  "src/components/home/HomeStartHereSection.tsx",
  "src/pages/account/ui/HomeView.tsx",
  "src/pages/fiqh/ui/FiqhView.tsx",
];

for (const rel of SURFACES) {
  if (!existsSync(resolve(root, rel))) continue;
  const src = read(rel);
  for (const re of FORBIDDEN) {
    assert.equal(re.test(src), false, `${rel} بلا «${re.source}»`);
  }
  assert.equal(src.includes("/learning/paths"), false, `${rel} بلا /learning/paths`);
}

const app = read("src/App.tsx");
assert.match(app, /path="\/start-here"[^>]*>\s*<Redirect\s+to="\/lessons"/);
assert.match(app, /path="\/qa"[^>]*>\s*<Redirect\s+to="\/quiz"/);
assert.equal(/path="\/start-here"[^>]*>\s*<Redirect\s+to=["']\/["']/.test(app), false);
assert.equal(/path="\/learning\/paths"[^>]*>\s*<Redirect\s+to=["']\/["']/.test(app), false);

const vercel = read("vercel.json");
assert.match(
  vercel,
  /"source"\s*:\s*"\/start-here"[\s\S]{0,180}"destination"\s*:\s*"\/lessons"/,
);
assert.equal(
  /"source"\s*:\s*"\/start-here"[\s\S]{0,180}"destination"\s*:\s*"\/"/.test(vercel),
  false,
);

assert.deepEqual(
  BOTTOM_NAV_TABS.map((t) => t.href),
  ["/quran-hub", "/lessons", "/prayer-times", "/fiqh"],
);

assert.deepEqual(
  MORE_FEATURED_SECTIONS.map((s) => s.title),
  [
    "المكتبة",
    "أعلام وتراجم",
    "الحديث وعلومه",
    "قصص الأنبياء",
    "الأمم السابقة",
    "السيرة النبوية",
    "الفوائد والبطاقات",
    "سين جيم",
    "البحث",
    "الإعدادات",
  ],
);

const hubSrc = SERVICES_CENTER_GROUPS[0]!.items.map((i) => i.label).join("|");
assert.equal(hubSrc.includes("موسوعة الأحكام"), false);
assert.equal(hubSrc.includes("المجامع"), false);
assert.equal(hubSrc.includes("ابدأ من هنا"), false);
assert.equal(hubSrc.includes("الأسئلة والأجوبة"), false);

const fiqh = read("src/pages/fiqh/ui/FiqhView.tsx");
assert.match(fiqh, /القواعد الفقهية/);
assert.match(fiqh, /المذاهب الأربعة/);
assert.match(fiqh, /النوازل المعاصرة/);
assert.match(fiqh, /قرارات المجامع/);
assert.match(fiqh, /العبادات/);
assert.doesNotMatch(fiqh, /الأسئلة والأجوبة الشرعية/);
assert.doesNotMatch(fiqh, /فتاوى.*\/quiz|\/quiz.*فتاوى/);

const seo = read("src/lib/seo-routes.json");
assert.equal(seo.includes('"/start-here"'), false);
assert.equal(seo.includes('"/learning/paths"'), false);

if (existsSync(resolve(root, "public/sitemap.xml"))) {
  const sm = read("public/sitemap.xml");
  assert.equal(sm.includes("/start-here"), false);
  assert.equal(sm.includes("/learning/paths"), false);
}

console.log("sections-merge-reorg.test.ts: ok");
