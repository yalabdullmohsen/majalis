/**
 * Lightweight guards for consent + preference defaults.
 * npx tsx src/lib/__tests__/privacy-offline-prefs.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "../../..");

const consentSrc = readFileSync(join(appRoot, "src/lib/cookie-consent.ts"), "utf8");
assert.match(consentSrc, /analytics:\s*false/, "analytics must default off");
assert.match(consentSrc, /majalis-cookie-consent-v1/, "stable storage key");

const prefsSrc = readFileSync(join(appRoot, "src/lib/user-preferences.ts"), "utf8");
assert.match(prefsSrc, /uiDensity/, "density preference present");
assert.match(prefsSrc, /dataSaver/, "data saver preference present");
assert.match(prefsSrc, /dataset\.dataSaver/, "applies dataSaver dataset");

const dispatchSrc = readFileSync(join(appRoot, "lib/api-dispatch.mjs"), "utf8");
assert.match(dispatchSrc, /\/api\/account\/export/, "export route registered");

const outboxSrc = readFileSync(join(appRoot, "src/lib/sync-outbox.ts"), "utf8");
assert.match(outboxSrc, /Last-Write-Wins|updatedAt/, "LWW / updatedAt strategy");
assert.match(outboxSrc, /shouldDeferHeavySync/, "data saver defer helper");

const appSrc = readFileSync(join(appRoot, "src/App.tsx"), "utf8");
assert.match(appSrc, /CookieConsentBanner/, "consent bootstrap mounted (silent)");
assert.match(appSrc, /privacy-center/, "privacy center route");

const bannerSrc = readFileSync(join(appRoot, "src/components/CookieConsentBanner.tsx"), "utf8");
assert.match(bannerSrc, /return null/, "no first-run privacy banner UI");
assert.match(bannerSrc, /markStorageNoticeSeen/, "storage notice marked once");

console.log("privacy-offline-prefs: OK");
