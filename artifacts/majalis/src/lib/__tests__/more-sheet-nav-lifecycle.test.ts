/**
 * بوابة انحدار: شيت عام لا يعيد ربط قفل الجسم/التاريخ عند كل تصيير،
 * والتنقّل السفلي صفحة أقسام كاملة بلا شيت «المزيد».
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(APP_ROOT, p), "utf8");

const sheet = read("src/components/ui/AppBottomSheet.tsx");
const bottomNav = read("src/components/BottomNavBar.tsx");
const navBar = read("src/components/NavBar.tsx");
const home = read("src/pages/account/ui/HomeView.tsx");
const sectionsPage = read("src/pages/account/SectionsPage.tsx");

test("AppBottomSheet يحفظ onClose في ref ولا يعيد تشغيل الأثر بسببه", () => {
  assert.match(sheet, /onCloseRef/, "onClose في ref");
  assert.match(sheet, /useCallback\(\(\)\s*=>\s*\{[\s\S]*?onCloseRef\.current/, "requestClose مستقر");
  assert.match(sheet, /\}, \[open, requestClose\]\)/, "تبعيات الأثر: open + requestClose فقط");
  assert.doesNotMatch(
    sheet,
    /\}, \[open, onClose/,
    "onClose ليس في تبعيات الأثر",
  );
});

test("إغلاق الشيت يستبدل مدخل التاريخ بدل history.back", () => {
  assert.match(sheet, /history\.replaceState\(null,\s*""\)/, "replaceState عند التنظيف");
  assert.doesNotMatch(
    sheet,
    /history\.back\(\)/,
    "لا history.back في التنظيف — يتجنب سباق التنقّل",
  );
});

test("BottomNavBar بلا شيت المزيد — الأقسام تبويب صفحة كاملة", () => {
  assert.doesNotMatch(bottomNav, /MoreBottomSheet|setMoreOpen|closeMore/, "لا منطق شيت المزيد");
  assert.doesNotMatch(bottomNav, /المزيد/, "لا تسمية المزيد");
  assert.match(bottomNav, /BOTTOM_NAV_TABS/, "التبويبات من السجل");
  assert.match(sectionsPage, /الأقسام/, "صفحة الأقسام");
  assert.doesNotMatch(sectionsPage, /إغلاق|MoreBottomSheet|AppBottomSheet/, "بلا زر إغلاق/شيت");
});

test("هيدر وبطل الرئيسية مبسّطان بلا شعار طويل مكرر", () => {
  assert.match(navBar, /سُنّة/, "شعار الهيدر: سُنّة");
  assert.doesNotMatch(navBar, /المعرفة الإسلامية الرقمية/, "أُزيل الشعار الطويل من الهيدر");
  assert.doesNotMatch(home, /heroCountdown|heroPrayers/, "لا شريط صلاة مكرر في أعلى الرئيسية");
  assert.doesNotMatch(home, /المسارات العلمية/, "زر ثانوي زائد أُزيل من هيرو الرئيسية");
});
