/**
 * جولة المزايا تبقى مسار إعدادات فقط — بلا صلاحيات.
 * تشغيل: node --import tsx src/lib/__tests__/feature-tour-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, "../..");

const app = readFileSync(join(root, "App.tsx"), "utf8");
const settings = readFileSync(join(root, "pages/account/ui/SettingsView.tsx"), "utf8");
const tour = readFileSync(join(root, "components/onboarding/AppFeatureTour.tsx"), "utf8");
const state = readFileSync(join(root, "lib/feature-tour-state.ts"), "utf8");

assert.doesNotMatch(app, /AppFeatureTourGate/);
assert.match(app, /\/feature-tour/);
assert.match(app, /FeatureTourPage/);
assert.equal(existsSync(join(root, "components/onboarding/AppFeatureTourGate.tsx")), false);

assert.match(settings, /جولة المزايا/);
assert.match(settings, /href="\/feature-tour"/);

assert.match(tour, /FEATURE_TOUR_SLIDES/);
assert.doesNotMatch(tour, /فعّل التنبيهات/);
assert.doesNotMatch(tour, /requestNotificationPermission/);
assert.match(tour, /markFeatureTourCompleted/);
assert.equal((tour.match(/id:\s*"/g) ?? []).length >= 6, true, "6 slides minimum");

assert.match(state, /onboarding\.completed\.v1/);
assert.match(state, /storageSetSync/);

console.log("feature-tour-gate.test.ts: ok");
