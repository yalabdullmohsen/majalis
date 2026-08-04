/**
 * صيغة عرض مواقيت الصلاة 12 ساعة (ص/م)
 * تشغيل: npx tsx src/lib/__tests__/prayer-time-12h.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { formatTime12 } from "../prayer-times";

assert.equal(formatTime12("15:31"), "3:31 م");
assert.equal(formatTime12("03:05"), "3:05 ص");
assert.equal(formatTime12("00:15"), "12:15 ص");
assert.equal(formatTime12("12:00"), "12:00 م");
assert.equal(formatTime12("23:59"), "11:59 م");

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const page = readFileSync(join(root, "views/PrayerTimesPage.tsx"), "utf8");
assert.match(page, /displayTime12/);
assert.match(page, /handleBack/);
assert.match(page, /pts-back/);
assert.doesNotMatch(page, /displayTime24/);

const mushaf = readFileSync(join(root, "views/MushafPageView.tsx"), "utf8");
assert.match(mushaf, /pageFillMode/);
assert.match(mushaf, /togglePageFillMode/);
assert.match(mushaf, /quran-shell--page-fill/);
assert.match(mushaf, /mpv-fill-enter/);
assert.match(mushaf, /تكبير صفحة المصحف/);

const more = readFileSync(join(root, "components/MoreBottomSheet.tsx"), "utf8");
assert.match(more, /\/nations/);
assert.match(more, /الأمم السابقة/);
assert.match(more, /href: "\/qa"/);

const drawer = readFileSync(join(root, "components/SideNavDrawer.tsx"), "utf8");
assert.match(drawer, /\/nations/);
assert.match(drawer, /الأمم السابقة/);

const nav = readFileSync(join(root, "lib/navigation.ts"), "utf8");
assert.match(nav, /href: "\/nations"/);

console.log("prayer-time-12h.test.ts: ok");
