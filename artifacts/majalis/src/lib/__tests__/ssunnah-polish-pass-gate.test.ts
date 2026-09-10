/**
 * بوابة صقل: حارس النقر المزدوج + حالات فارغة سياقية + شريط دون اتصال.
 * تشغيل: node --import tsx src/lib/__tests__/ssunnah-polish-pass-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  __resetNavClickGuardForTests,
  shouldAllowNavigation,
} from "@/lib/nav-click-guard";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

__resetNavClickGuardForTests();
assert.equal(shouldAllowNavigation("/lessons"), true);
assert.equal(shouldAllowNavigation("/lessons"), false, "يمنع النقر المزدوج على نفس المسار");
assert.equal(shouldAllowNavigation("/prayer-times"), true, "يسمح بمسار مختلف فورًا");

const bottom = read("src/components/BottomNavBar.tsx");
assert.match(bottom, /shouldAllowNavigation/, "الشريط السفلي يستخدم حارس النقر");

const back = read("src/components/common/AppBackButton.tsx");
assert.match(back, /setTimeout/, "قفل رجوع زمني");
assert.match(back, /420/, "مدة قفل الرجوع 420ms");

const copy = read("src/lib/ui-copy.ts");
assert.match(copy, /bookmarks:\s*"/, "نص فارغ للمحفوظات");
assert.match(copy, /offline:\s*"/, "نص انقطاع الشبكة");
assert.match(copy, /clearSearch:/, "إجراء مسح البحث");
assert.match(copy, /browseContent:/, "إجراء استعرض المحتوى");

const offline = read("src/components/OfflineBanner.tsx");
assert.match(offline, /offline-banner__retry/, "زر إعادة محاولة دون اتصال");
assert.doesNotMatch(offline, /جارٍ التحميل|جاري التحميل/, "بلا نص تحميل قديم");

const fav = read("src/components/FavoriteButton.tsx");
assert.match(fav, /previous/, "تحديث تفاؤلي للمفضلة");
assert.match(fav, /setBookmarked\(!previous\)/, "قلب فوري للحالة");

const empty = read("src/components/ui/mj.tsx");
assert.match(empty, /actionHref/, "EmptyState يدعم إجراءً");

const search = read("src/pages/account/ui/SearchView.tsx");
assert.match(search, /replace\(\/\\s\+\/g/, "تطبيع مسافات البحث");
assert.match(search, /AbortController/, "إلغاء طلب البحث السابق");

const vault = read("src/views/VaultPage.tsx");
assert.match(vault, /EMPTY\.bookmarks/, "خزنة المحفوظات تستخدم النص الموحّد");
assert.match(vault, /ACTION\.browseContent/, "خزنة المحفوظات تعرض إجراءً");

console.log("ssunnah-polish-pass-gate.test.ts: ok");
