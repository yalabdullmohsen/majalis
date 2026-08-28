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
assert.match(page, /pts-back/);
assert.doesNotMatch(page, /displayTime24/);
assert.doesNotMatch(page, /SectionLobby/);

const mushaf = readFileSync(join(root, "pages/quran/MushafReaderPage.tsx"), "utf8");
assert.match(mushaf, /MushafViewport/);

const sectionsPage = readFileSync(join(root, "pages/account/SectionsPage.tsx"), "utf8");
assert.match(sectionsPage, /MoreHubFromRegistry|SectionsHubFromRegistry/);
assert.match(sectionsPage, /الأقسام/);

const drawer = readFileSync(join(root, "components/SideNavDrawer.tsx"), "utf8");
assert.match(drawer, /SIDEBAR_NAV_GROUPS/);
assert.match(drawer, /sidebar-panel/);

const sidebarNav = readFileSync(join(root, "lib/sidebar-nav.ts"), "utf8");
assert.match(sidebarNav, /getSidebarGroupsFromNavMap|SIDEBAR_NAV_GROUPS/);

const navMap = readFileSync(join(root, "lib/nav-map.ts"), "utf8");
assert.match(navMap, /navFor|bottomNavSections/);
assert.match(navMap, /مركز القرآن الكريم|الأقسام/);
const bottom = readFileSync(join(root, "components/BottomNavBar.tsx"), "utf8");
assert.doesNotMatch(bottom, /MoreBottomSheet|المزيد/);
assert.match(readFileSync(join(root, "config/sections.registry.ts"), "utf8"), /\/quran-hub/);
assert.match(readFileSync(join(root, "config/sections.registry.ts"), "utf8"), /مركز القرآن الكريم/);

const servicesNav = readFileSync(join(root, "lib/services-center-nav.ts"), "utf8");
assert.match(servicesNav, /sections\.registry|الأبواب المميّزة|MORE_FEATURED/);
const moreSections = readFileSync(join(root, "features/more/moreSections.ts"), "utf8");
assert.match(moreSections, /sections\.registry/);
assert.match(moreSections, /MORE_FEATURED_SECTIONS/);
const registry = readFileSync(join(root, "config/sections.registry.ts"), "utf8");
assert.match(registry, /\/hadith/);
assert.match(registry, /الحديث وعلومه/);
assert.match(registry, /سين جيم/);
assert.match(registry, /التاريخ الإسلامي/);

const nav = readFileSync(join(root, "lib/navigation.ts"), "utf8");
assert.match(nav, /href: "\/nations"/);

console.log("prayer-time-12h.test.ts: ok");
