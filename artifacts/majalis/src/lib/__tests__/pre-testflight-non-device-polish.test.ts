/**
 * Regression — صقل ما قبل TestFlight (بدون جهاز): تنقّل آمن، Auth، غمر، قصّ نصوص.
 * تشغيل: npx tsx src/lib/__tests__/pre-testflight-non-device-polish.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeNavPath,
  sectionAwareFallback,
} from "../navigation-back";
import { isImmersiveChromePath } from "../immersive-chrome";
import { sanitizeAuthNext, getAuthEmailRedirectUrl } from "../auth-redirect";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const read = (rel: string) => readFileSync(resolve(appRoot, rel), "utf8");

assert.equal(normalizeNavPath("/mushaf/page/12?x=1#y"), "/mushaf/page/12");
assert.equal(normalizeNavPath("/mushaf/"), "/mushaf");
assert.equal(normalizeNavPath("/fiqh/topics/tahara"), "/fiqh/topics/tahara");

assert.equal(sectionAwareFallback("/quran/tajweed"), "/quran-hub");
assert.equal(sectionAwareFallback("/quran-memorization"), "/quran-memorization");
assert.equal(sectionAwareFallback("/quran-circles"), "/quran-circles");
assert.equal(sectionAwareFallback("/quran/recitation-test-ai"), "/quran-hub");
assert.equal(sectionAwareFallback("/search/foo"), "/search");
assert.equal(sectionAwareFallback("/mushaf/page/9"), "/quran-hub");

assert.equal(isImmersiveChromePath("/quran/recitation-test-ai"), true);
assert.equal(isImmersiveChromePath("/lessons"), false);

assert.equal(sanitizeAuthNext("/auth/update-password"), "/auth/update-password");
assert.equal(sanitizeAuthNext("//evil.com"), "/");
assert.match(
  getAuthEmailRedirectUrl("/auth/update-password"),
  /auth\/callback\?next=%2Fauth%2Fupdate-password$/,
);

const navSrc = read("src/lib/navigation-back.ts");
assert.match(navSrc, /SPA_PUSH_KEY|nav-spa-pushes/);
assert.match(navSrc, /canUseHistoryBack|spaPushes/);
assert.match(navSrc, /normalizeNavPath/);

const appSrc = read("src/App.tsx");
assert.match(appSrc, /SafeLazyRoute component=\{HomePage\}/);
assert.match(appSrc, /auth\/update-password/);
assert.match(appSrc, /!hideSiteChrome && <AdhanNotificationBar/);
assert.match(appSrc, /!hideSiteChrome && <PrayerRespectBanner/);
assert.match(appSrc, /!hideSiteChrome && <ScrollToTop/);

const loginSrc = read("src/pages/account/ui/LoginView.tsx");
assert.match(loginSrc, /sanitizeAuthNext/);
assert.match(loginSrc, /resetPasswordForEmail/);
assert.match(loginSrc, /نسيت كلمة المرور/);

const callbackSrc = read("src/views/AuthCallbackPage.tsx");
assert.match(callbackSrc, /PASSWORD_RECOVERY/);
assert.match(callbackSrc, /auth\/update-password/);

const updateSrc = read("src/views/UpdatePasswordPage.tsx");
assert.match(updateSrc, /updatePassword/);
assert.match(updateSrc, /new-password/);

const mushafSrc = read("src/pages/quran/ui/MushafPageView.tsx");
assert.match(mushafSrc, /إعادة المحاولة/);
assert.match(mushafSrc, /goBackOrFallback\(location\)/);

const raiSrc = read("src/pages/quran/ui/RecitationTestView.tsx");
assert.match(raiSrc, /goBackOrFallback\("\/quran\/recitation-test-ai"\)/);
assert.match(raiSrc, /rai-back-btn/);
assert.match(raiSrc, /aria-label="رجوع"/);

const prayerSrc = read("src/pages/worship/ui/PrayerTimesView.tsx");
assert.match(prayerSrc, /reload/);
assert.match(prayerSrc, /pts-retry/);

const globalBack = read("src/components/GlobalBackButton.tsx");
/* زر الرجوع ظاهر دائمًا (بلا بوابة تمرير) — أوضح للخروج من الأقسام */
assert.match(globalBack, /بدون شرط تمرير/);
assert.match(globalBack, /haptics\.selection/);
assert.doesNotMatch(globalBack, /pastThreshold/);

const finalCss = read("src/styles/final-release.css");
assert.equal(/html\s*\{\s*-webkit-text-size-adjust:\s*100%/.test(finalCss), false);
assert.equal(finalCss.includes("-webkit-line-clamp: 2"), false, "عنوان الدرس بلا line-clamp 2");

const memCss = read("src/styles/quran-memorization.css");
assert.equal(memCss.includes("-webkit-line-clamp: 1"), false, "آية المراجعة بلا قصّ سطر");

const supabaseSrc = read("src/lib/supabase.ts");
assert.match(supabaseSrc, /resetPasswordForEmail/);
assert.match(supabaseSrc, /updatePassword/);

console.log("pre-testflight-non-device-polish.test.ts: ok");
