/**
 * صيغة عرض مواقيت الصلاة 12 ساعة (ص/م)
 * تشغيل: npx tsx src/lib/__tests__/prayer-time-12h.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { formatTime12 } from "../prayer-times";

assert.equal(formatTime12("15:31"), "٣:٣١ م");
assert.equal(formatTime12("03:05"), "٣:٠٥ ص");
assert.equal(formatTime12("00:15"), "١٢:١٥ ص");
assert.equal(formatTime12("12:00"), "١٢:٠٠ م");
assert.equal(formatTime12("23:59"), "١١:٥٩ م");

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const page = readFileSync(join(root, "pages/worship/ui/PrayerTimesView.tsx"), "utf8");
assert.match(page, /displayTime12/);
assert.match(page, /handleBack/);
assert.match(page, /pts-back/);
assert.doesNotMatch(page, /displayTime24/);

const mushaf = readFileSync(join(root, "pages/quran/ui/MushafPageView.tsx"), "utf8");
// وضع الامتلاء المنفصل أُزيل — الصفحة دائمًا بكامل الشاشة؛ لمسة تبدّل الأدوات فقط
assert.equal(/pageFillMode/.test(mushaf), false, "بلا pageFillMode");
assert.equal(/togglePageFillMode/.test(mushaf), false, "بلا togglePageFillMode");
assert.equal(/quran-shell--page-fill/.test(mushaf), false, "بلا quran-shell--page-fill");
assert.equal(/mpv-fill-enter/.test(mushaf), false, "بلا mpv-fill-enter");
assert.match(mushaf, /quran-shell--ayah/);
assert.match(mushaf, /setTextChromeVisible/);

const more = readFileSync(join(root, "components/MoreBottomSheet.tsx"), "utf8");
assert.match(more, /services-center-nav|filterServicesCenterGroups/);
assert.match(more, /مركز الخدمات/);

const drawer = readFileSync(join(root, "components/SideNavDrawer.tsx"), "utf8");
assert.match(drawer, /SIDEBAR_NAV_GROUPS/);
assert.match(drawer, /sidebar-panel/);

const sidebarNav = readFileSync(join(root, "lib/sidebar-nav.ts"), "utf8");
assert.match(sidebarNav, /getSidebarGroupsFromNavMap|SIDEBAR_NAV_GROUPS/);

const navMap = readFileSync(join(root, "lib/nav-map.ts"), "utf8");
assert.match(navMap, /\/quran-hub/);
assert.match(navMap, /قرآن/);

const servicesNav = readFileSync(join(root, "lib/services-center-nav.ts"), "utf8");
assert.match(servicesNav, /\/quran-knowledge/);
assert.match(servicesNav, /القرآن وعلومه/);

const nav = readFileSync(join(root, "lib/navigation.ts"), "utf8");
assert.match(nav, /href: "\/nations"/);

console.log("prayer-time-12h.test.ts: ok");
