/**
 * بوابة شاشة البدء الواحدة + جولة المزايا من الإعدادات فقط.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, "../..");

const app = readFileSync(join(root, "App.tsx"), "utf8");
const settings = readFileSync(join(root, "pages/account/ui/SettingsView.tsx"), "utf8");
const gate = readFileSync(join(root, "components/onboarding/AppStartGate.tsx"), "utf8");
const view = readFileSync(join(root, "components/onboarding/AppStartView.tsx"), "utf8");
const tour = readFileSync(join(root, "components/onboarding/AppFeatureTour.tsx"), "utf8");
const state = readFileSync(join(root, "lib/onboarding-state.ts"), "utf8");

assert.match(app, /AppStartGate/);
assert.doesNotMatch(app, /AppFeatureTourGate/);
assert.match(app, /\/feature-tour/);
assert.match(app, /FeatureTourPage/);
assert.match(app, /FocusArrival/);

assert.match(settings, /جولة المزايا/);
assert.match(settings, /\/feature-tour/);
assert.doesNotMatch(settings, /requestFeatureTourReplay/);

assert.match(gate, /hasSeenOnboarding/);
assert.match(gate, /markOnboardingSeen/);
assert.doesNotMatch(gate, /requestPermission|Notification|LocalNotifications/);

assert.match(view, /المجلس العلمي/);
assert.match(view, /علم شرعي موثوق في مكان واحد/);
assert.match(view, /قرآن، فقه، دروس، أذكار/);
assert.match(view, /ابدأ الآن/);
assert.match(view, /تصفح مباشرة/);
assert.match(view, /القرآن/);
assert.match(view, /الفقه والدروس/);
assert.match(view, /البحث الشرعي/);
assert.match(view, /الأذكار والصلاة/);
assert.doesNotMatch(view, /requestPermission|Notification/);

assert.match(gate, /shouldSkipAppStartForPath/);
assert.doesNotMatch(gate, /markOnboardingSeen\(\);\s*\n\s*if \(shouldSkip/);

assert.match(state, /onboarding_seen/);
assert.match(state, /shouldSkipAppStartForPath/);
assert.match(state, /\/mushaf/);
assert.match(state, /\/fiqh/);
assert.match(state, /\/search/);
assert.match(state, /\/lessons/);

assert.equal(existsSync(join(root, "components/onboarding/AppFeatureTourGate.tsx")), false);

assert.match(tour, /FEATURE_TOUR_SLIDES/);
assert.doesNotMatch(tour, /فعّل التنبيهات/);
assert.doesNotMatch(tour, /requestNotificationPermission/);
assert.match(tour, /markFeatureTourCompleted/);

assert.match(state, /onboarding_seen/);
assert.doesNotMatch(state, /requestPermission|Notification\s*\.|LocalNotifications/);

console.log("app-start-gate.test.ts: ok");
