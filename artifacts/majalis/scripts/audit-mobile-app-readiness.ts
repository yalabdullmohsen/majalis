/**
 * بوابة جاهزية تطبيق Capacitor/iOS — فحص ثابت للعقود الحرجة.
 * التشغيل: pnpm --filter @workspace/majalis run audit:mobile-app
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const errors: string[] = [];
const warnings: string[] = [];
function fail(msg: string) {
  errors.push(msg);
}
function warn(msg: string) {
  warnings.push(msg);
}

function assertMatch(src: string, re: RegExp, msg: string) {
  if (!re.test(src)) fail(msg);
}
function assertNoMatch(src: string, re: RegExp, msg: string) {
  if (re.test(src)) fail(msg);
}

// 1) safe-area tokens في theme.css فقط كمصدر env()
const theme = read("src/app/styles/theme.css");
assertMatch(theme, /--inset-top:\s*env\(safe-area-inset-top/, "theme.css يعرّف --inset-top");
assertMatch(theme, /--inset-bottom:\s*env\(safe-area-inset-bottom/, "theme.css يعرّف --inset-bottom");

const capUx = read("src/styles/capacitor-native-ux.css");
assertMatch(capUx, /--safe-area-inset-top:\s*var\(--inset-top\)/, "capacitor-native-ux يربط safe-area بـ --inset-*");

// 2) bottom nav لا يستخدم display:none للإخفاء
const chromeCss = read("src/styles/components/app-chrome-scroll.css");
assertMatch(chromeCss, /bottom-nav--hidden/, "صنف إخفاء bottom-nav موجود");
assertNoMatch(
  chromeCss.replace(/\/\*[\s\S]*?\*\*/g, ""),
  /\.bottom-nav--hidden[^{]*\{[^}]*display\s*:\s*none/,
  "bottom-nav--hidden لا يعتمد display:none",
);

// 3) خلفية الإقلاع الأصلي = سطح الصفحة (لا أبيض) حتى يضبط PageChrome الصفحة
assertMatch(
  read("src/main.tsx"),
  /bootTheme === "dark" \? "#101614" : "#F2F4F3"/,
  "لون status عند الإقلاع الأصلي يطابق سطح الصفحة",
);
assertMatch(read("capacitor.config.ts"), /StatusBar:\s*\{[^}]*backgroundColor:\s*["']#F2F4F3/s, "StatusBar فاتح للصفحات العامة");
assertMatch(read("capacitor.config.ts"), /ios:\s*\{[\s\S]*?backgroundColor:\s*["']#F2F4F3/, "ios.backgroundColor فاتح لمنع فجوة بيضاء");
assertMatch(read("capacitor.config.ts"), /errorPath:\s*["']native-load-error\.html["']/, "errorPath عند فشل تحميل الإنتاج");
assertMatch(read("capacitor.config.ts"), /overlaysWebView:\s*true/, "StatusBar overlaysWebView");

// 4) احتواء الروابط الداخلية
assertMatch(read("src/lib/in-app-navigation.ts"), /installInAppNavigationGuard/, "حارس التنقل الداخلي موجود");
assertMatch(read("src/main.tsx"), /installInAppNavigationGuard/, "الحارس موصول في main");
assertMatch(read("src/lib/capacitor-utils.ts"), /Browser\.open/, "فتح خارجي عبر Browser plugin");

// بطاقة الدرس لا تستخدم target=_blank للخرائط/البث
const lessonCard = read("src/components/lessons/UnifiedLessonCard.tsx");
assertNoMatch(lessonCard, /mapsUrl[\s\S]{0,120}target="_blank"/, "خرائط الدرس بلا target=_blank");
assertMatch(lessonCard, /openLessonExternalUrl/, "خرائط/بث عبر openLessonExternalUrl");

// 5) لا طلب إشعارات تلقائي عند الإطلاق
const push = read("src/components/PushPrompt.tsx");
assertMatch(push, /if \(isNative\)/, "PushPrompt يُخفى على الأصلي");
const notifView = read("src/pages/account/ui/NotificationSettingsView.tsx");
assertMatch(notifView, /تنبيهات الصلاة/, "إعداد تنبيهات الصلاة");
assertMatch(notifView, /ورد اليوم/, "إعداد ورد اليوم");
assertMatch(notifView, /تذكير الأذكار/, "إعداد تذكير الأذكار");
assertMatch(read("src/lib/local-notifications.ts"), /adhkarReminder/, "تفضيل adhkarReminder");

// 6) تخزين التقدّم المحلي + Preferences adapter
assertMatch(read("src/lib/native-storage.ts"), /hydrateNativeStorage/, "hydrateNativeStorage");
assertMatch(read("src/lib/native-storage.ts"), /@capacitor\/preferences/, "Preferences fallback path");
assertMatch(read("src/main.tsx"), /hydrateNativeStorage/, "hydrate عند الإقلاع");
assertMatch(read("src/lib/quran-last-page.ts"), /storageSetSync|native-storage/, "حفظ صفحة المصحف عبر native-storage");
assertMatch(read("src/lib/continue-reading.ts"), /storageSetSync/, "متابعة القراءة تُزامَن");

// 7) اختيار الآية لا يغيّر route
const mushafVp = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
assertMatch(mushafVp, /onSelectVerse|setSelected/, "اختيار الآية محلي");
assertNoMatch(mushafVp, /setLocation\([^)]*ayah|navigate\([^)]*ayah/i, "لا تنقل route عند الآية");

// 8) المسارات الأساسية في App
const app = read("src/App.tsx");
for (const route of [
  "/mushaf",
  "/lessons",
  "/adhkar",
  "/library",
  "/tarikh-islami",
  "/prophets",
  "/fiqh",
  "/more",
  "/search",
  "/quiz",
  "/notification-settings",
]) {
  if (!app.includes(route)) fail(`مسار مفقود في App: ${route}`);
}
assertMatch(app, /isNativeApp|data-native-app/, "AppShell يعرف التطبيق الأصلي");

// 9) لا admin في التبويب العام (BottomNav)
const bottomNav = read("src/components/BottomNavBar.tsx");
assertNoMatch(bottomNav, /href=["']\/admin/, "BottomNav بلا رابط admin");

// 10) haptics أصلي للأذكار
const haptics = read("src/lib/haptics.ts");
assertMatch(haptics, /hapticTap|hapticNotify/, "haptics يستخدم Capacitor utils");
assertMatch(read("src/pages/worship/ui/AdhkarView.tsx"), /haptics\.(light|success)/, "الأذكار تستدعي haptics");

// 11) سين جيم أفضل نتيجة + haptics
const quiz = read("src/components/quiz-game/DailyChallengeQuiz.tsx");
assertMatch(quiz, /BEST_KEY|أفضل يوم/, "حفظ أفضل نتيجة");
assertMatch(quiz, /hapticNotify/, "haptic عند الإجابة");

// 12) لا console.log صاخب في production entry (تحذير فقط)
const main = read("src/main.tsx");
if (/console\.log\(/.test(main)) warn("main.tsx يحتوي console.log");

if (!existsSync(resolve(root, "capacitor.config.ts"))) {
  fail("capacitor.config.ts مفقود");
}

const result = {
  merge_ok: errors.length === 0,
  P0: errors.length,
  P1: warnings.length,
  errors,
  warnings,
};

if (errors.length) {
  console.error("audit:mobile-app FAILED");
  for (const e of errors) console.error(" -", e);
  console.log(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log("audit:mobile-app: OK");
for (const w of warnings) console.warn(" ·", w);
console.log(JSON.stringify(result));
