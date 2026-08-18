/**
 * عند الدخول للرئيسية: لا تُعرض أعداد الأحكام/الذكر/الكتب كشريط إحصاءات للعامة.
 * node --import tsx src/lib/__tests__/home-hide-content-counts.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const home = readFileSync(resolve(root, "src/pages/account/ui/HomeView.tsx"), "utf8")
  + readFileSync(resolve(root, "src/pages/account/ui/HomeBelowFold.tsx"), "utf8");
const strip = readFileSync(resolve(root, "src/components/home/HomeLiveStatsStrip.tsx"), "utf8");
const nav = readFileSync(resolve(root, "src/lib/navigation.ts"), "utf8");

assert.doesNotMatch(home, /<HomeLiveStatsStrip\s*\/>/, "الصفحة الرئيسية بلا شريط الأعداد");
assert.match(strip, /return null/, "المكوّن معطّل للعامة");
assert.doesNotMatch(strip, /contentCounts\.rulings|contentCounts\.adhkar/, "لا أرقام أحكام/ذكر في الشريط");
assert.doesNotMatch(nav, /COUNTS\.scholars|COUNTS\.rulings|COUNTS\.adhkar/, "وصف التنقل بلا عدّادات محتوى");

console.log("home-hide-content-counts.test.ts: ok");
