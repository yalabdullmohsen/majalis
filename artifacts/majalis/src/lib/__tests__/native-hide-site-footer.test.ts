/**
 * إخفاء تذييل الموقع داخل التطبيق الأصلي مع الإبقاء على الروابط القانونية.
 * تشغيل: node --import tsx src/lib/__tests__/native-hide-site-footer.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

const appSrc = readFileSync(resolve(appRoot, "src/App.tsx"), "utf8");
const settingsSrc = readFileSync(resolve(appRoot, "src/pages/account/ui/SettingsView.tsx"), "utf8");
const servicesSrc = readFileSync(resolve(appRoot, "src/lib/services-center-nav.ts"), "utf8");
const nativeCss = readFileSync(resolve(appRoot, "src/styles/capacitor-native-ux.css"), "utf8");

assert.ok(appSrc.includes('from "@/lib/capacitor-utils"'), "يستورد isNative من capacitor-utils");
assert.ok(appSrc.includes("{!hideSiteChrome && !isNative && <SiteFooter />}"), "التذييل مخفي على الأصلي");
assert.match(nativeCss, /html\.capacitor-native \.site-footer/);
assert.match(settingsSrc, /title="عن التطبيق"/);
assert.match(settingsSrc, /href="\/privacy"/);
assert.match(settingsSrc, /href="\/terms"/);
assert.match(settingsSrc, /href="\/support"/);
assert.match(servicesSrc, /title:\s*"عن التطبيق"/);
assert.match(servicesSrc, /href: "\/privacy"/);
assert.match(servicesSrc, /href: "\/terms"/);
assert.match(servicesSrc, /href: "\/support"/);

console.log("native-hide-site-footer.test.ts: ok");
