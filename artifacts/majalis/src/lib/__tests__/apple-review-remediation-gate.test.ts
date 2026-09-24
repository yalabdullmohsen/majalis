/**
 * بوابة Apple Review Remediation — 2.1 demo session + 2.5.4 notes + build bump.
 * Run: node --import tsx src/lib/__tests__/apple-review-remediation-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  APP_STORE_REVIEW_EMAIL,
  APP_STORE_REVIEW_PASSWORD,
  matchesAppStoreReviewCredentials,
  buildAppStoreReviewUser,
} from "../app-store-review-auth";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

console.log("=== Review credentials + local user ===");
assert.equal(APP_STORE_REVIEW_EMAIL, "apple.review@ssunnah.com");
assert.ok(APP_STORE_REVIEW_PASSWORD.length >= 12);
assert.equal(matchesAppStoreReviewCredentials(APP_STORE_REVIEW_EMAIL, APP_STORE_REVIEW_PASSWORD), true);
assert.equal(matchesAppStoreReviewCredentials("x@y.com", APP_STORE_REVIEW_PASSWORD), false);
const u = buildAppStoreReviewUser();
assert.equal(u.profile.role, "user");
assert.equal(u.is_owner, false);
assert.equal(u.profile.is_admin, false);

console.log("=== AuthProvider + LoginView wire ===");
const auth = read("src/components/AuthProvider.tsx");
const login = read("src/pages/account/ui/LoginView.tsx");
assert.match(auth, /matchesAppStoreReviewCredentials/);
assert.match(auth, /persistAppStoreReviewSession/);
assert.match(auth, /clearAppStoreReviewSession/);
assert.match(auth, /hasAppStoreReviewSession/);
assert.match(login, /app-store-review-login/);
assert.match(login, /وضع مراجعة App Store/);
assert.match(login, /enterAppStoreReviewMode|APP_STORE_REVIEW_EMAIL/);

console.log("=== Review notes + ASC paste ===");
const notes = read("store/app-store/review-notes.md");
const paste = read("store/app-store/ASC_REVIEW_NOTES_PASTE.txt");
assert.match(notes, /apple\.review@ssunnah\.com/);
assert.match(notes, /SunnahReview-2026!/);
assert.match(notes, /وضع مراجعة App Store/);
assert.match(notes, /Guideline 2\.5\.4|Background Audio/i);
assert.match(notes, /\/mushaf/);
assert.match(notes, /Now Playing|Control Center/i);
assert.match(paste, /apple\.review@ssunnah\.com/);
assert.match(paste, /SunnahReview-2026!/);
assert.match(paste, /Build:\s*1\.0\s*\(54\)/);

console.log("=== iOS build number 54 ===");
const pbx = read("ios/App/App.xcodeproj/project.pbxproj");
assert.match(pbx, /CURRENT_PROJECT_VERSION = 54;/);
assert.doesNotMatch(pbx, /CURRENT_PROJECT_VERSION = 52;/);
assert.doesNotMatch(pbx, /CURRENT_PROJECT_VERSION = 53;/);

console.log("=== 2.5.4 audio mode still declared ===");
const plist = read("ios/App/App/Info.plist");
assert.match(plist, /UIBackgroundModes/);
assert.match(plist, /<string>audio<\/string>/);
assert.ok(existsSync(resolve(majalisRoot, "docs/AUDIO_BACKGROUND_DEVICE_RUNBOOK.md")));

console.log("apple-review-remediation-gate.test.ts: ok");
