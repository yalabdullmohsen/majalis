/**
 * بوابة: ثيم الإقلاع = اختيار المستخدم، والافتراضي نهاري (لا prefers-color-scheme عند الغياب).
 * تشغيل: node --import tsx src/lib/__tests__/theme-boot-light-default-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const html = read("index.html");
const theme = read("src/lib/theme-preference.ts");
const settings = read("src/pages/account/ui/SettingsView.tsx");
const versionHook = read("src/hooks/useVersionCheck.ts");
const purge = read("src/lib/runtime-cache-purge.ts");
const sw = read("public/sw.js");
const vercel = read("vercel.json");

assert.match(html, /v13-startup-shell-stable-2026-09|v14-release-fresh-2026-09/);
assert.match(html, /id="mj-version-boot"/);
assert.match(html, /ssunnah-refreshing-version/);
assert.match(html, /version\.json\?t=/);
assert.match(html, /cache:\s*"no-store"/);
assert.match(html, /classList\.add\("light"/);
assert.match(html, /classList\.remove\("dark"/);
assert.match(html, /storedTheme === "auto"/);
assert.match(html, /resolved = "light"/);
assert.match(html, /app-booting/);
assert.match(html, /majalis-user-settings-v1/);
assert.doesNotMatch(
  html,
  /media="\(prefers-color-scheme: dark\)"/,
  "لا theme-color يتبع الجهاز بمعزل عن اختيار المستخدم",
);

assert.match(theme, /return isThemePreference\(stored\) \? stored : "light"/);
assert.match(theme, /classList\.add\("light"/);

assert.match(settings, /تحديث التطبيق وحذف الكاش/);
assert.match(settings, /refreshAppAndPurgeCaches/);

assert.match(versionHook, /purgeStaleRuntimeCaches/);
assert.match(versionHook, /SKIP_WAITING/);
assert.match(versionHook, /ssunnah-refreshing-version/);
assert.match(versionHook, /BOOT_QUIET_MS/, "نافذة هدوء قبل شيت التحديث");
assert.match(
  versionHook,
  /shellReady \? 0 : BOOT_QUIET_MS/,
  "فحص النسخة فوري بعد استقرار الهيكل وإلا بعد نافذة الهدوء",
);
assert.doesNotMatch(versionHook, /silentBootPurgeThenReload/, "لا reload صامت مزدوج من الشيت");
assert.match(html, /location\.replace|location\.reload/);
assert.match(purge, /refreshAppAndPurgeCaches/);
assert.match(purge, /slice\(0,\s*8\)/);

assert.match(sw, /SKIP_WAITING/);
assert.match(sw, /clients\.claim/);
assert.match(sw, /networkFirstThenCache\(req, DATA_CACHE\)/);
assert.doesNotMatch(
  sw,
  /useSwr \? staleWhileRevalidate/,
  "APIs الداخلية ليست SWR (قديم أولًا)",
);
assert.match(vercel, /\/version\.json[\s\S]*?no-store/);
assert.match(vercel, /\/sw\.js[\s\S]*?no-store/);
assert.match(vercel, /\/assets\/\(\.\*\)[\s\S]*?immutable/);
assert.match(vercel, /\/index\.html[\s\S]*?max-age=0/);

const mindMap = read("src/styles/mind-map.css");
assert.doesNotMatch(
  mindMap,
  /@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)/,
  "خرائط ذهنية تتبع ثيم التطبيق لا نظام الجهاز",
);

console.log("theme-boot-light-default-gate.test.ts: ok");
