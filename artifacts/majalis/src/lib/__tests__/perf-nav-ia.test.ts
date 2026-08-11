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
assert.deepEqual(groupIds, ["features", "content", "settings"], "هيكل المزيد ثلاثي");
assert.equal(SERVICES_CENTER_GROUPS[0]?.title, "مميزات التطبيق");
assert.equal(SERVICES_CENTER_GROUPS[1]?.title, "المحتوى والأقسام");
assert.equal(SERVICES_CENTER_GROUPS[2]?.title, "الإعدادات والمساعدة");

const contentHrefs = SERVICES_CENTER_GROUPS[1]!.items
  .filter((i) => i.action.kind === "link")
  .map((i) => (i.action as { href: string }).href);
assert.ok(contentHrefs.indexOf("/prophets") < contentHrefs.indexOf("/nations"), "قصص الأنبياء قبل الأمم");
assert.ok(contentHrefs.includes("/quran/people"), "الذين ذكروا في القرآن في المحتوى");
assert.ok(contentHrefs.includes("/start-here") && contentHrefs.includes("/learning/paths"));

const settingsHrefs = SERVICES_CENTER_GROUPS[2]!.items
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
assert.match(cookie, /cookie-consent--subtle/, "بانر خصوصية خفيف");
assert.doesNotMatch(cookie, /قبول الكل/, "بلا نافذة موافقة ثقيلة");
assert.match(cookie, /متابعة/, "زر متابعة غير حاجب");

const prefetch = readFileSync(resolve(root, "lib/prefetch-top-routes.ts"), "utf8");
assert.match(prefetch, /ProphetStoriesPage/);
assert.match(prefetch, /QuranPeoplePage/);
assert.match(prefetch, /NationsPage/);

const main = readFileSync(resolve(root, "main.tsx"), "utf8");
assert.match(main, /instant-interaction\.css/, "تفاعل فوري محمّل");

console.log("perf-nav-ia.test.ts: ok");
