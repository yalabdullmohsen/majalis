/**
 * إخفاء تذييل الموقع داخل التطبيق الأصلي مع الإبقاء على الروابط القانونية.
 * تشغيل: node --import tsx src/lib/__tests__/native-hide-site-footer.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SERVICES_CENTER_GROUPS } from "@/lib/services-center-nav";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

const appSrc = readFileSync(resolve(appRoot, "src/App.tsx"), "utf8") + "\n" + readFileSync(resolve(appRoot, "src/AppRoutes.tsx"), "utf8");
const settingsSrc = readFileSync(resolve(appRoot, "src/pages/account/ui/SettingsView.tsx"), "utf8");
const servicesSrc = readFileSync(resolve(appRoot, "src/lib/services-center-nav.ts"), "utf8");
const nativeCss = readFileSync(resolve(appRoot, "src/styles/capacitor-native-ux.css"), "utf8");

assert.ok(appSrc.includes('from "@/lib/capacitor-utils"'), "يستورد isNative من capacitor-utils");
assert.ok(appSrc.includes("{!hideSiteChrome && !isNative && <SiteFooter />}"), "التذييل مخفي على الأصلي");
assert.match(nativeCss, /html\.capacitor-native \.site-footer/);
assert.match(settingsSrc, /عن التطبيق/);
assert.match(settingsSrc, /href="\/privacy"|to="\/privacy"|\/privacy/);
assert.match(settingsSrc, /\/terms/);
assert.match(settingsSrc, /\/contact/);
assert.match(servicesSrc, /sections\.registry|الإعدادات والمساعدة|الحساب والإعدادات/);
const account =
  SERVICES_CENTER_GROUPS.find((g) => g.id === "account") ||
  SERVICES_CENTER_GROUPS.find((g) => g.id === "settings") ||
  SERVICES_CENTER_GROUPS.find((g) => /إعدادات|الحساب/.test(g.title));
assert.ok(account);
const hrefs = account!.items
  .filter((i) => i.action.kind === "link")
  .map((i) => (i.action as { href: string }).href);
assert.ok(hrefs.includes("/privacy"));
assert.ok(hrefs.includes("/terms"));
assert.ok(hrefs.includes("/support"));

console.log("native-hide-site-footer.test.ts: ok");
