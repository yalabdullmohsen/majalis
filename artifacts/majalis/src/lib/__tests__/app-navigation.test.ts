/**
 * مصدر التنقّل الموحّد: شريط + درج + رئيسية.
 * تشغيل: node --import tsx src/lib/__tests__/app-navigation.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { navFor, NAV_ITEMS } from "@/config/navigation";
import { BOTTOM_NAV_TABS } from "@/lib/nav-map";
import { SIDEBAR_FLAT_HREFS } from "@/lib/sidebar-nav";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const bottom = navFor("bottom");
assert.deepEqual(
  bottom.map((i) => i.href),
  ["/quran-hub", "/lessons", "/prayer-times", "/fiqh", "/sections"],
  "ترتيب الشريط السفلي",
);
assert.deepEqual(
  BOTTOM_NAV_TABS.map((t) => t.href),
  bottom.map((i) => i.href),
  "nav-map يستهلك navFor(bottom)",
);

const drawer = navFor("drawer");
assert.equal(drawer[0]?.href, "/mushaf", "المصحف أول الدرج");
assert.ok(drawer.some((i) => i.id === "quran"));
assert.ok(drawer.some((i) => i.id === "lessons"));
assert.ok(drawer.some((i) => i.id === "settings"));
assert.ok(SIDEBAR_FLAT_HREFS.includes("/mushaf"));

const home = navFor("home");
assert.ok(home.length >= 3, "بطاقات الرئيسية من المصدر الموحّد");
assert.ok(NAV_ITEMS.every((i) => i.href && i.label && i.icon));

const searchIdx = readFileSync(resolve(root, "scripts/generate-unified-search-index.mjs"), "utf8");
assert.match(searchIdx, /app:mushaf/, "المصحف مقصد مباشر في فهرس البحث");
const globalSearch = readFileSync(resolve(root, "src/components/GlobalSearchModal.tsx"), "utf8");
assert.match(globalSearch, /href: "\/mushaf"/, "المصحف في البحث العام");

const drawerSrc = readFileSync(resolve(root, "src/components/layout/DrawerFromRegistry.tsx"), "utf8");
assert.doesNotMatch(drawerSrc, /warmStaticQuranicFonts/, "الدرج لا يسخّن خطوط المصحف");

console.log("app-navigation.test.ts: ok");
