/**
 * بوابة ملفات جولة المزايا — lazy gate + route + settings button.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, "../..");

const app = readFileSync(join(root, "App.tsx"), "utf8");
const settings = readFileSync(join(root, "pages/account/ui/SettingsView.tsx"), "utf8");
const gate = readFileSync(join(root, "components/onboarding/AppFeatureTourGate.tsx"), "utf8");
const tour = readFileSync(join(root, "components/onboarding/AppFeatureTour.tsx"), "utf8");
const state = readFileSync(join(root, "lib/feature-tour-state.ts"), "utf8");

assert.match(app, /AppFeatureTourGate/);
assert.match(app, /\/feature-tour/);
assert.match(app, /FeatureTourPage/);

assert.match(settings, /جولة المزايا/);
assert.match(settings, /requestFeatureTourReplay/);

assert.match(gate, /hasCompletedFeatureTour/);
assert.match(gate, /MIN_VISIBLE_MS\s*=\s*900/);
assert.match(gate, /lazy/);

assert.match(tour, /FEATURE_TOUR_SLIDES/);
assert.match(tour, /فعّل التنبيهات/);
assert.match(tour, /markFeatureTourCompleted/);
assert.equal((tour.match(/id:\s*"/g) ?? []).length >= 7, true, "7 slides minimum");

assert.match(state, /onboarding\.completed\.v1/);
assert.match(state, /storageSetSync/);

console.log("feature-tour-gate.test.ts: ok");
