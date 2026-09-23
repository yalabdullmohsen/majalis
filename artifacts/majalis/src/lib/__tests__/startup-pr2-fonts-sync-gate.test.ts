/**
 * بوابة Startup PR-2: خطوط أساسية محلية + إخفاء مزامنة عن المستخدم.
 * تشغيل: node --import tsx src/lib/__tests__/startup-pr2-fonts-sync-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const readPkg = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

const fontsUi = readPkg("src/styles/fonts-ui.css");
assert.match(fontsUi, /font-family:\s*"Amiri"/);
assert.match(fontsUi, /font-display:\s*optional/);
assert.doesNotMatch(fontsUi, /fonts\.googleapis|fonts\.gstatic/);

const indexHtml = readPkg("index.html");
assert.match(indexHtml, /preload[^>]+amiri-400-ar\.woff2/);
assert.match(indexHtml, /preload[^>]+amiri-700-ar\.woff2/);
assert.match(indexHtml, /font-display:optional/);

const boot = readPkg("src/lib/boot-readiness.ts");
assert.match(boot, /document\.fonts\.load/);
assert.match(boot, /"Amiri"/);
assert.doesNotMatch(boot, /createRoot\s*\(|location\.reload\s*\(/);

const banner = readPkg("src/components/OfflineBanner.tsx");
assert.match(banner, /isDevDiagnostics|import\.meta\.env\?\.DEV/);
assert.match(banner, /DEBUG_ONLY/);
assert.doesNotMatch(banner, /window\.location\.reload/);
/* النص التقني للمزامنة لا يُعرض بلا حارس DEV */
assert.match(banner, /diagnostics && status === "online"/);
assert.match(banner, /\[dev\].*محفوظ محليًا/);

const bg = readPkg("src/lib/background-ui-fonts.ts");
assert.match(bg, /scheduleBackgroundUiFontWarm/);
assert.match(bg, /isInteractive|subscribeAppStartup/);
assert.doesNotMatch(bg, /createRoot\s*\(|showToast|location\.reload\s*\(/);

const main = readPkg("src/main.tsx");
assert.match(main, /scheduleBackgroundUiFontWarm/);

const pkg = readPkg("package.json");
assert.match(pkg, /"test:startup-pr2"/);

assert.match(readRepo("docs/REPO_INDEX.md"), /startup-pr2|Startup PR-2|background-ui-fonts/);

console.log("startup-pr2-fonts-sync-gate.test.ts: ok");
