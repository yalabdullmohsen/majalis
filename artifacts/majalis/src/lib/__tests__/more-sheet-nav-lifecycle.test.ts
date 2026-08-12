/**
 * بوابة انحدار: شيت «المزيد» لا يعيد ربط قفل الجسم/التاريخ عند كل تصيير،
 * والتنقّل السفلي يغلق الشيت فور تغيّر المسار — يمنع تجميد التبويبات.
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

test("BottomNavBar يغلق المزيد عند تغيّر الموقع ويمرّر onClose مستقرًا", () => {
  assert.match(bottomNav, /useCallback\(\(\)\s*=>\s*setMoreOpen\(false\)/, "closeMore مستقر");
  assert.match(
    bottomNav,
    /useEffect\(\(\)\s*=>\s*\{\s*setMoreOpen\(false\);\s*\},\s*\[location\]\)/,
    "إغلاق عند تغيّر location",
  );
  assert.match(bottomNav, /onClose=\{closeMore\}/, "تمرير closeMore مستقر لـ MoreBottomSheet");
});

test("هيدر وبطل الرئيسية مبسّطان بلا شعار طويل مكرر", () => {
  assert.match(navBar, /المجلس العلمي/, "شعار الهيدر: المجلس العلمي");
  assert.doesNotMatch(navBar, /المعرفة الإسلامية الرقمية/, "أُزيل الشعار الطويل من الهيدر");
  assert.doesNotMatch(home, /heroCountdown|heroPrayers/, "لا شريط صلاة مكرر في أعلى الرئيسية");
  assert.doesNotMatch(home, /المسارات العلمية/, "زر ثانوي زائد أُزيل من هيرو الرئيسية");
});
