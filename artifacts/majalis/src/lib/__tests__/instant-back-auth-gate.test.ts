/**
 * بوابة — رجوع فوري (إلغاء inflight) + خروج فوري بلا انتظار signOut.
 * تشغيل: npx tsx src/lib/__tests__/instant-back-auth-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");
const read = (rel: string) => readFileSync(resolve(appRoot, rel), "utf8");

const navBack = read("src/lib/navigation-back.ts");
assert.match(navBack, /export function prepareInstantBackNavigation/);
assert.match(navBack, /abortScope\(`route:\$\{normalized\}`\)/);
assert.match(navBack, /RequestManager\.cancelAllInflight\(\)/);
assert.match(navBack, /prepareInstantBackNavigation\(currentPath\)/);

const reqMgr = read("src/lib/request-manager.ts");
assert.match(reqMgr, /static cancelAllInflight\(\)/);

const navBar = read("src/components/NavBar.tsx");
assert.match(navBar, /navigate\("\/login"\)/);
assert.match(navBar, /void logout\(\)/);
assert.doesNotMatch(
  navBar,
  /await logout\(\);\s*\n\s*navigate\("\/login"\)/,
  "NavBar: navigate قبل signOut async",
);

const adminShell = read("src/views/admin/AdminShell.tsx");
assert.match(adminShell, /void logout\(\)/);
assert.doesNotMatch(
  adminShell,
  /await logout\(\);\s*\n\s*navigate\("\/login"\)/,
  "AdminShell: navigate قبل signOut async",
);

const authProvider = read("src/components/AuthProvider.tsx");
assert.match(authProvider, /setUser\(null\)/, "AuthProvider يفرغ user فور logout");

console.log("instant-back-auth-gate: ok");
