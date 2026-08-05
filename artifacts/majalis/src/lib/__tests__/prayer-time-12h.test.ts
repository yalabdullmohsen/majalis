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
assert.match(more, /SIDEBAR_NAV_GROUPS/);
assert.match(more, /مركز الخدمات/);

const drawer = readFileSync(join(root, "components/SideNavDrawer.tsx"), "utf8");
assert.match(drawer, /SIDEBAR_NAV_GROUPS/);
assert.match(drawer, /sidebar-panel/);

const sidebarNav = readFileSync(join(root, "lib/sidebar-nav.ts"), "utf8");
assert.match(sidebarNav, /\/quran-knowledge/);
assert.match(sidebarNav, /القرآن وعلومه/);

const nav = readFileSync(join(root, "lib/navigation.ts"), "utf8");
assert.match(nav, /href: "\/nations"/);

console.log("prayer-time-12h.test.ts: ok");
