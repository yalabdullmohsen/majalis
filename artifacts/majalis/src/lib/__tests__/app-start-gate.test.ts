/**
 * بوابة: شاشة البدء القديمة محذوفة — التعريف عند أول زيارة + جولة المزايا من الإعدادات.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, "../..");

const app = readFileSync(join(root, "App.tsx"), "utf8");
const settings = readFileSync(join(root, "pages/account/ui/SettingsView.tsx"), "utf8");
const state = readFileSync(join(root, "lib/onboarding-state.ts"), "utf8");
const tour = readFileSync(join(root, "components/onboarding/AppFeatureTour.tsx"), "utf8");
const intro = readFileSync(join(root, "components/onboarding/FirstVisitIntro.tsx"), "utf8");

assert.doesNotMatch(app, /AppStartGate/);
assert.doesNotMatch(app, /AppFeatureTourGate/);
assert.match(app, /FirstVisitIntro/);
assert.match(app, /shouldShowFirstVisitIntro/);
assert.match(app, /\/feature-tour/);
assert.match(app, /FeatureTourPage/);
assert.match(app, /FocusArrival/);

assert.match(settings, /جولة المزايا/);
assert.match(settings, /\/feature-tour/);
assert.doesNotMatch(settings, /requestFeatureTourReplay/);

assert.equal(existsSync(join(root, "components/onboarding/AppStartGate.tsx")), false);
assert.equal(existsSync(join(root, "components/onboarding/AppStartView.tsx")), false);
assert.equal(existsSync(join(root, "components/onboarding/AppFeatureTourGate.tsx")), false);
assert.equal(existsSync(join(root, "styles/components/app-start.css")), false);
assert.equal(existsSync(join(root, "config/first-visit-intro.ts")), true);

assert.doesNotMatch(state, /hasSeenOnboarding|markOnboardingSeen|shouldSkipAppStartForPath/);
assert.match(state, /storage_notice_seen/);
assert.match(state, /migrateLegacyFirstVisitIntroKeys/);
assert.doesNotMatch(state, /requestPermission|Notification\s*\.|LocalNotifications/);

assert.match(tour, /FEATURE_TOUR_SLIDES/);
assert.doesNotMatch(tour, /فعّل التنبيهات/);
assert.doesNotMatch(tour, /requestNotificationPermission/);
assert.match(tour, /markFeatureTourCompleted/);

assert.match(intro, /مرحبًا بك في سُنّة/);
assert.match(intro, /ابدأ الآن/);
assert.match(intro, /تصفح مباشرة/);
assert.doesNotMatch(intro, /requestPermission|Notification/);

console.log("app-start-gate.test.ts: ok");
