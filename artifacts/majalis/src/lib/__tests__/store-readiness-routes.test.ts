/**
 * مسارات متجر App Store / Play — aliases إلزامية.
 * npx tsx src/lib/__tests__/store-readiness-routes.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "../../..");
const appSrc = readFileSync(join(appRoot, "src/App.tsx"), "utf8");
const navSrc = readFileSync(join(appRoot, "src/lib/services-center-nav.ts"), "utf8");
const delSrc = readFileSync(join(appRoot, "src/pages/account/ui/AccountDeletionView.tsx"), "utf8");

assert.match(appSrc, /path="\/who-we-are"/, "who-we-are alias");
assert.match(appSrc, /path="\/delete-account"/, "delete-account alias");
assert.match(appSrc, /path="\/account\/delete"/, "account/delete alias");
assert.match(appSrc, /path="\/support"/, "support alias");
assert.match(appSrc, /Redirect to="\/about-us"/, "who-we-are → about-us");
assert.match(appSrc, /Redirect to="\/account-deletion"/, "delete-account → account-deletion");
assert.match(appSrc, /Redirect to="\/contact"/, "support → contact");

assert.match(navSrc, /title:\s*"الإعدادات والمساعدة"/, "settings/help group");
assert.match(navSrc, /href: "\/support"/, "support in services center");
assert.match(navSrc, /href: "\/delete-account"/, "delete-account in services center");
const featuresIdx = navSrc.indexOf('id: "features"');
const contentIdx = navSrc.indexOf('id: "content"');
const settingsIdx = navSrc.indexOf('id: "settings"');
assert.ok(featuresIdx > 0 && contentIdx > featuresIdx && settingsIdx > contentIdx, "features → content → settings");

assert.match(delSrc, /clearLocalBookmarks/, "clears local bookmarks on delete");
assert.match(delSrc, /clearUserLocalDataAndMedia/, "wipes local media + IndexedDB audio on delete");

console.log("store-readiness-routes: OK");
