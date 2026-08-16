/**
 * مسارات متجر App Store / Play — aliases إلزامية.
 * npx tsx src/lib/__tests__/store-readiness-routes.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SERVICES_CENTER_GROUPS } from "@/lib/services-center-nav";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "../../..");
const appSrc = readFileSync(join(appRoot, "src/App.tsx"), "utf8");
const delSrc = readFileSync(join(appRoot, "src/pages/account/ui/AccountDeletionView.tsx"), "utf8");

assert.match(appSrc, /path="\/who-we-are"/, "who-we-are alias");
assert.match(appSrc, /path="\/delete-account"/, "delete-account alias");
assert.match(appSrc, /path="\/account\/delete"/, "account/delete alias");
assert.match(appSrc, /path="\/support"/, "support alias");
assert.match(appSrc, /Redirect to="\/about-us"/, "who-we-are → about-us");
assert.match(appSrc, /Redirect to="\/account-deletion"/, "delete-account → account-deletion");
assert.match(appSrc, /Redirect to="\/contact"/, "support → contact");

const account =
  SERVICES_CENTER_GROUPS.find((g) => g.id === "account") ||
  SERVICES_CENTER_GROUPS.find((g) => g.id === "settings") ||
  SERVICES_CENTER_GROUPS.find((g) => g.title.includes("إعدادات") || g.title.includes("الحساب"));
assert.ok(account, "account group");
const hrefs = account!.items
  .filter((i) => i.action.kind === "link")
  .map((i) => (i.action as { href: string }).href);
assert.ok(hrefs.includes("/support"), "support in services center");
assert.ok(hrefs.includes("/delete-account"), "delete-account in services center");
assert.ok(SERVICES_CENTER_GROUPS.some((g) => g.id === "hubs"), "hubs group");

assert.match(delSrc, /clearLocalBookmarks/, "clears local bookmarks on delete");
assert.match(delSrc, /clearUserLocalDataAndMedia/, "wipes local media + IndexedDB audio on delete");

console.log("store-readiness-routes: OK");
