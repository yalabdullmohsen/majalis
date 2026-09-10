/**
 * بوابة منع رجوع التصميم القديم — رسائل واضحة عند المخالفة.
 * Run: node --import tsx src/lib/__tests__/ssunnah-anti-legacy-ui-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const src = resolve(root, "src");

const BANNED_BLUE = /#(?:1d4ed8|1e40af|2563eb|3b82f6|3D5A80|0284c7|4A5590)\b/i;

const SKIP_DIR = new Set(["node_modules", "__tests__", "admin", "mushaf-madinah"]);
const SKIP_FILE_RE = /(admin|prophet-stories-admin|ssunnah-anti-legacy|SectionAccordionLayout)/i;
const SCAN_EXT = new Set([".tsx", ".ts", ".css"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (SKIP_DIR.has(name) || /admin/i.test(name)) continue;
      if (p.includes(`${join("features", "mushaf")}`)) continue;
      walk(p, out);
    } else if (SCAN_EXT.has(name.slice(name.lastIndexOf(".")))) {
      if (SKIP_FILE_RE.test(p)) continue;
      out.push(p);
    }
  }
  return out;
}

const blueHits: string[] = [];
for (const file of walk(src)) {
  if (file.includes("__tests__")) continue;
  const lines = readFileSync(file, "utf8").split(/\n/);
  lines.forEach((line, idx) => {
    if (!BANNED_BLUE.test(line)) return;
    if (/banned|BANNED|محظور|legacy blue|أزرق قديم/i.test(line)) return;
    if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) return;
    blueHits.push(`${file.replace(`${src}/`, "src/")}:${idx + 1}`);
  });
}

assert.equal(
  blueHits.length,
  0,
  `ألوان زرقاء قديمة محظورة — استبدلها بـ --ss-primary-green / --ss-deep-green / --ss-soft-gold:\n${blueHits.slice(0, 25).join("\n")}`,
);

const hub = readFileSync(resolve(src, "styles/components/hub-card.css"), "utf8");
const sectionCards = readFileSync(resolve(src, "components/sections/section-cards.css"), "utf8");
const soft = readFileSync(resolve(src, "styles/soft-cards.css"), "utf8");
const polish = readFileSync(resolve(src, "styles/ssunnah-ux-polish.css"), "utf8");
const dsIndex = readFileSync(resolve(src, "components/design-system/index.ts"), "utf8");
const below = readFileSync(resolve(src, "pages/account/ui/HomeBelowFold.tsx"), "utf8");

assert.match(
  hub,
  /border-radius:\s*var\(--radius-card,\s*24px\)/,
  "HubCard يجب أن يستخدم --radius-card 24px (لا حواف حادة)",
);
assert.match(
  sectionCards,
  /border-radius:\s*var\(--radius-tile,\s*24px\)/,
  "Section .card يجب أن يبقى على --radius-tile 24px",
);
assert.match(soft, /--radius-card:\s*24px/, "soft-cards يثبت radius-card=24");
assert.match(polish, /\.ss-feature-grid/, "شبكة الميزات الموحدة مطلوبة");
assert.match(polish, /prefers-reduced-motion/, "يجب احترام تقليل الحركة");

for (const name of [
  "AppCard",
  "FeatureCard",
  "ContentCard",
  "PrimaryButton",
  "SecondaryButton",
  "IconButton",
  "LessonCard",
  "FloatingBackButton",
]) {
  assert.match(dsIndex, new RegExp(name), `المكوّن الموحّد ناقص من الفهرس: ${name}`);
}

assert.match(below, /HomePrimaryPortals|FeatureCard/, "الرئيسية تستخدم FeatureCard للبوابات");
const portals = readFileSync(resolve(src, "components/home/HomePrimaryPortals.tsx"), "utf8");
assert.match(portals, /FeatureCard/);
assert.match(portals, /home-primary-portals/, "بوابات العلم أعلى تحت الطية");

console.log("ssunnah-anti-legacy-ui-gate.test.ts: ok");
