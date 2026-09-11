/**
 * بوابة تثبيت نظام التصميم: تغطية + allowlist + لقطات الشاشات الأساسية.
 * node --import tsx src/lib/__tests__/ssunnah-design-system-lockdown-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const eslintCfg = read("eslint.config.js");
assert.match(eslintCfg, /designSystemLockRules/, "قواعد DS في eslint");
assert.match(eslintCfg, /eslint-ds-legacy-allowlist\.json/, "allowlist مربوط");
assert.ok(eslintCfg.includes("text-\\\\[[0-9]"), "حظر text-[N…]");
assert.match(eslintCfg, /fontSize/, "حظر fontSize حرفي");
assert.match(eslintCfg, /JSXOpeningElement\[name\.name=\/\^h\[1-3\]\$\//, "حظر عناوين خام في القوالب المقفلة");
assert.match(eslintCfg, /text-black\|text-white/, "حظر ألوان Tailwind المباشرة");

const allow = JSON.parse(read("eslint-ds-legacy-allowlist.json")) as string[];
assert.ok(Array.isArray(allow), "allowlist مصفوفة");
assert.ok(allow.length <= 40, `allowlist كبير جدًا (${allow.length}) — قلّصه بهجرة الشاشات`);
for (const rel of allow) {
  assert.ok(existsSync(resolve(root, rel)), `ملف allowlist مفقود: ${rel}`);
}

const contentCard = read("src/components/design-system/ContentCard.tsx");
assert.match(contentCard, /CardTitle/, "ContentCard يستخدم CardTitle");
assert.doesNotMatch(contentCard, /<h3[\s>]/, "ContentCard بلا h3 خام");

const report = spawnSync(process.execPath, ["scripts/ds-coverage-report.mjs", "--assert"], {
  cwd: root,
  encoding: "utf8",
});
assert.equal(report.status, 0, report.stderr || report.stdout);
const cov = JSON.parse(read("docs/ds-coverage-report.json")) as {
  coveragePct: number;
  total: number;
  clean: number;
  allowlistSize: number;
};
assert.ok(cov.coveragePct >= 90, `تغطية منخفضة: ${cov.coveragePct}%`);
assert.equal(cov.allowlistSize, allow.length);

const snapDir = resolve(root, "tests/snapshots/ui-regression");
const core = ["home", "hadith", "fiqh", "search", "quran", "prayer", "lessons"];
for (const id of core) {
  for (const theme of ["light", "dark"] as const) {
    const png = resolve(snapDir, `${id}-${theme}.png`);
    assert.ok(existsSync(png), `لقطة مفقودة: ${id}-${theme}.png`);
    const buf = readFileSync(png);
    assert.ok(buf.length > 800, `لقطة ضعيفة: ${id}-${theme}`);
  }
}

const structureSnap = resolve(root, "tests/snapshots/ds-core-screens.structure.json");
assert.ok(existsSync(structureSnap), "لقطة بنية الشاشات الأساسية");
const expected = JSON.parse(readFileSync(structureSnap, "utf8")) as {
  screens: Record<string, { mustImport?: string[]; mustMatch?: string[]; mustNotMatch?: string[] }>;
};
for (const [rel, rules] of Object.entries(expected.screens)) {
  const src = read(rel);
  for (const m of rules.mustImport ?? []) assert.match(src, new RegExp(m), `${rel} import ${m}`);
  for (const m of rules.mustMatch ?? []) assert.match(src, new RegExp(m), `${rel} match ${m}`);
  for (const m of rules.mustNotMatch ?? []) assert.doesNotMatch(src, new RegExp(m), `${rel} not ${m}`);
}

const doc = read("docs/SSUNNAH_DESIGN_SYSTEM.md");
assert.match(doc, /مستويات النظام|مستويات/, "توثيق المستويات");
assert.match(doc, /SsText|ScreenTitle/, "توثيق مكوّنات النص");
assert.match(doc, /eslint-ds-legacy-allowlist/, "توثيق الـ allowlist");

console.log(
  `ssunnah-design-system-lockdown-gate.test.ts: ok · تغطية ${cov.coveragePct}% (${cov.clean}/${cov.total}) · دين ${cov.allowlistSize}`,
);
