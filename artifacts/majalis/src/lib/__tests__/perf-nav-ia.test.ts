/**
 * بوابة: أداء خفيف + هيكل المزيد + محور المحتوى.
 * تشغيل: node --import tsx src/lib/__tests__/perf-nav-ia.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SERVICES_CENTER_GROUPS } from "@/lib/services-center-nav";
import { HOME_CONTENT_HUB } from "@/lib/home-content-hub";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const groupIds = SERVICES_CENTER_GROUPS.map((g) => g.id);
assert.deepEqual(groupIds, ["hubs", "features", "content", "settings"], "هيكل المزيد: أبواب ثم مميزات ثم محتوى ثم إعدادات");
assert.equal(SERVICES_CENTER_GROUPS[0]?.title, "الأبواب الرئيسية");
assert.equal(SERVICES_CENTER_GROUPS[0]?.layout, "featured");
assert.equal(SERVICES_CENTER_GROUPS[1]?.title, "مميزات التطبيق");
assert.equal(SERVICES_CENTER_GROUPS[2]?.title, "المحتوى والأقسام");
assert.equal(SERVICES_CENTER_GROUPS[3]?.title, "الإعدادات والمساعدة");

const hubLabels = SERVICES_CENTER_GROUPS[0]!.items.map((i) => i.label);
assert.deepEqual(
  hubLabels,
  [
    "سين جيم",
    "قصص الأنبياء",
    "الأمم السابقة",
    "الذين ذكروا في القرآن",
    "التفسير",
    "السيرة النبوية",
    "اكتشف الإسلام",
    "التاريخ الإسلامي",
  ],
  "ترتيب الأبواب المميزة ثابت",
);
const hubHrefs = SERVICES_CENTER_GROUPS[0]!.items
  .filter((i) => i.action.kind === "link")
  .map((i) => (i.action as { href: string }).href);
assert.deepEqual(hubHrefs, [
  "/quiz",
  "/prophets-stories",
  "/nations",
  "/quran/people",
  "/tafsir",
  "/seerah",
  "/discover-islam",
  "/tarikh-islami",
]);

const moreSections = readFileSync(resolve(root, "features/more/moreSections.ts"), "utf8");
assert.match(moreSections, /MORE_FEATURED_SECTIONS/, "مصدر واحد moreSections.ts");
assert.match(moreSections, /tier: "featured"/, "الأبواب tier=featured");

const app = readFileSync(resolve(root, "App.tsx"), "utf8");
for (const href of hubHrefs) {
  assert.ok(app.includes(`path="${href}"`), `مسار مسجّل في App: ${href}`);
}

const contentHrefs = SERVICES_CENTER_GROUPS[2]!.items
  .filter((i) => i.action.kind === "link")
  .map((i) => (i.action as { href: string }).href);
assert.ok(contentHrefs.indexOf("/prophets") < contentHrefs.indexOf("/nations"), "قصص الأنبياء قبل الأمم");
assert.ok(contentHrefs.includes("/quran/people"), "الذين ذكروا في القرآن في المحتوى");
assert.ok(contentHrefs.includes("/start-here") && contentHrefs.includes("/learning/paths"));

const settingsHrefs = SERVICES_CENTER_GROUPS[3]!.items
  .filter((i) => i.action.kind === "link")
  .map((i) => (i.action as { href: string }).href);
for (const href of ["/about-us", "/about", "/privacy", "/delete-account", "/support"]) {
  assert.ok(settingsHrefs.includes(href), `إعدادات تحتوي ${href}`);
}

assert.equal(HOME_CONTENT_HUB.length, 3);
assert.deepEqual(
  HOME_CONTENT_HUB.map((c) => c.href),
  ["/prophets", "/quran/people", "/nations"],
);

const home = readFileSync(resolve(root, "pages/account/ui/HomeView.tsx"), "utf8");
assert.match(home, /HomeContentHub/, "الرئيسية تعرض محور المحتوى");

const cookie = readFileSync(resolve(root, "components/CookieConsentBanner.tsx"), "utf8");
assert.match(cookie, /markStorageNoticeSeen/, "وسم إشعار التخزين مرة واحدة");
assert.match(cookie, /return null/, "بلا شريط خصوصية حاجب عند التشغيل");
assert.doesNotMatch(cookie, /قبول الكل/, "بلا نافذة موافقة ثقيلة");

const prefetch = readFileSync(resolve(root, "lib/prefetch-top-routes.ts"), "utf8");
assert.match(prefetch, /ProphetStoriesPage/);
assert.match(prefetch, /QuranPeoplePage/);
assert.match(prefetch, /NationsPage/);

const main = readFileSync(resolve(root, "main.tsx"), "utf8");
assert.match(main, /instant-interaction\.css/, "تفاعل فوري محمّل");

console.log("perf-nav-ia.test.ts: ok");
