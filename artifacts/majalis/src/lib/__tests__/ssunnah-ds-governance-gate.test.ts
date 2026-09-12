/**
 * بوابة حوكمة Design System — تمنع عودة الأنماط القديمة.
 * Run: node --import tsx src/lib/__tests__/ssunnah-ds-governance-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const src = resolve(root, "src");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const main = read("src/main.tsx");
const canonical = read("src/styles/ssunnah-ds-canonical.css");
const mur = read("src/styles/modern-ui-refresh.css");
const index = read("src/components/design-system/index.ts");
const pkg = read("package.json");
const docs = read("docs/SSUNNAH_DS_ADOPTION.md");
const lockdownDoc = read("docs/SSUNNAH_DESIGN_SYSTEM.md");

assert.match(main, /ssunnah-ds-canonical\.css/, "canonical tokens محمّلة (حرج أو مؤجّل)");
assert.match(main, /modern-ui-refresh\.css/, "modern-ui-refresh محمّلة");
assert.match(canonical, /--ds-background:/, "token background");
assert.match(canonical, /--ds-textPrimary:/, "token textPrimary");
assert.match(canonical, /--ds-radiusLarge:/, "token radius");
assert.match(canonical, /--ds-durationFast:/, "token motion");
assert.ok(
  /Design System Adoption/.test(mur) || /Design System Adoption/.test(canonical),
  "طبقة التبني العالمي",
);
assert.match(index, /SettingsList/, "SettingsList مُصدَّر");
assert.match(index, /ActionButton/, "ActionButton مُصدَّر");
assert.match(pkg, /ssunnah-ds-governance-gate/, "البوابة مربوطة في package.json");
assert.match(docs, /Canonical tokens|ssunnah-ds-canonical/, "توثيق الترحيل موجود");
assert.match(lockdownDoc, /مستويات النظام|مستويات/, "توثيق المستويات المقفول موجود");
assert.match(lockdownDoc, /SsText|ScreenTitle/, "توثيق مكوّنات النص");
assert.match(lockdownDoc, /eslint-ds-legacy-allowlist/, "توثيق الـ allowlist");

/** منع FloatingBackButton جديد في صفحات أساسية (الاستخدام الحالي عبر CSS مُخفَّف) */
const CORE_PAGES = [
  "src/pages/account/ui/HomeView.tsx",
  "src/pages/account/ui/SettingsView.tsx",
  "src/pages/account/ui/SearchView.tsx",
];
for (const p of CORE_PAGES) {
  const body = read(p);
  assert.doesNotMatch(
    body,
    /FloatingBackButton/,
    `${p}: لا تستخدم FloatingBackButton — InternalHeader/AppBackButton فقط`,
  );
}

/** منع ألوان hex مباشرة في مكوّنات design-system (ما عدا ملفات توثيق/اختبار) */
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const dsDir = resolve(src, "components/design-system");
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(name) && !name.includes(".test.")) out.push(p);
  }
  return out;
}

const hexHits: string[] = [];
for (const file of walk(dsDir)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (!HEX.test(line)) return;
    const trimmed = line.trimStart();
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) return;
    if (/fallback|var\(--|#b54a4a|danger/i.test(line)) return;
    if (/className=|cn\(|style=\{\{/.test(line) && HEX.test(line)) {
      hexHits.push(`${relative(root, file)}:${i + 1}`);
    }
  });
}

assert.ok(
  hexHits.length <= 8,
  `hex مباشر في design-system يجب أن يقل — وُجد ${hexHits.length}:\n${hexHits.slice(0, 15).join("\n")}`,
);

/** منع عودة انهيار النص العربي في شبكات البطاقات */
const responsiveCard = read("src/styles/responsive-card-system.css");
assert.match(main, /responsive-card-system\.css/, "نظام البطاقات المتجاوب محمّل");
assert.match(responsiveCard, /repeat\(\s*auto-fit/, "auto-fit إلزامي");
assert.doesNotMatch(
  responsiveCard.replace(/\/\*[\s\S]*?\*\//g, ""),
  /overflow-wrap:\s*anywhere|word-break:\s*break-all/,
  "لا anywhere/break-all في نظام البطاقات",
);
assert.match(pkg, /responsive-card-grid-gate/, "بوابة الشبكة مربوطة في package.json");

console.log("ssunnah-ds-governance-gate.test.ts: ok");
