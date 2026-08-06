#!/usr/bin/env node
/**
 * بوابة قياس المساحات (R4-7):
 * - عقد منطقة الإبهام وأهداف اللمس الأساسية.
 * - حجز ارتفاع شريط الإسناد (CLS).
 * - رفض فراغات زخرفية ضخمة (min-height/min-block-size ≥ 320px بلا مبرّر معروف).
 *
 * تشغيل: node scripts/verify-spacing-gate.mjs
 * تقرير: node scripts/verify-spacing-gate.mjs --report
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stylesRoot = join(appRoot, "src/styles");
const reportOnly = process.argv.includes("--report");
const issues = [];
const notes = [];

function read(rel) {
  const p = join(appRoot, rel);
  if (!existsSync(p)) {
    issues.push(`ملف مفقود: ${rel}`);
    return "";
  }
  return readFileSync(p, "utf8");
}

function walkCss(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) walkCss(p, out);
    else if (name.name.endsWith(".css")) out.push(p);
  }
  return out;
}

/* ── 1) عقد منطقة الإبهام ── */
const thumb = read("src/styles/components/thumb-zone.css");
if (thumb) {
  if (!/--mj-thumb-zone:\s*220px/.test(thumb)) {
    issues.push("thumb-zone.css: المتغير --mj-thumb-zone: 220px مطلوب");
  }
  if (!/\.mj-thumb-zone__actions[\s\S]{0,280}min-block-size:\s*48px/.test(thumb)) {
    issues.push("thumb-zone.css: أهداف اللمس في .mj-thumb-zone__actions يجب ≥ 48px");
  }
  if (!/@media\s*\(max-width:\s*879px\)[\s\S]{0,400}adhkar-focus-btn--count[\s\S]{0,120}min-block-size:\s*64px/.test(thumb)) {
    issues.push("thumb-zone.css: عدّاد الأذكار على الجوال يجب ≥ 64px");
  }
  notes.push("✓ عقد منطقة الإبهام");
}

/* ── 2) حجز ارتفاع شريط الإسناد ── */
const isnad = read("src/styles/components/isnad-attribution-bar.css");
if (isnad) {
  if (!/\.isnad-bar\b/.test(isnad) || !/min-block-size:\s*\d+px/.test(isnad)) {
    issues.push("isnad-attribution-bar.css: min-block-size محجوز لشريط الإسناد مطلوب");
  } else {
    notes.push("✓ حجز ارتفاع شريط الإسناد");
  }
}

/* ── 3) تذييل/صفحة: أهداف لمس لا تقل عن 44px في العقود الأساسية ── */
const footer = read("src/styles/components/site-footer-menu.css");
if (footer && !/min-block-size:\s*(4[4-9]|[5-9]\d)px/.test(footer)) {
  issues.push("site-footer-menu.css: يُتوقع هدف لمس ≥ 44px");
} else if (footer) {
  notes.push("✓ أهداف لمس التذييل");
}

const pageShell = read("src/styles/components/page-shell.css");
if (pageShell && !/min-block-size:\s*(4[4-9]|[5-9]\d)px/.test(pageShell)) {
  issues.push("page-shell.css: يُتوقع هدف لمس ≥ 44px لعناصر التنقل");
} else if (pageShell) {
  notes.push("✓ أهداف لمس PageShell");
}

/* ── 4) فراغات زخرفية ضخمة ── */
const ALLOW_LARGE = [
  /hero/i,
  /splash/i,
  /viewport/i,
  /100(?:dvh|vh|svh)/i,
  /mushaf/i,
  /reader/i,
  /map/i,
  /canvas/i,
  /video/i,
  /cover/i,
  /poster/i,
  /skeleton/i,
  /placeholder/i,
  /safe-area/i,
];

const largeRe =
  /(?:^|\{|;)\s*(?:min-(?:block-size|height)|height)\s*:\s*(\d+)(?:px)?\s*;/gim;

for (const file of walkCss(stylesRoot)) {
  const css = readFileSync(file, "utf8");
  const rel = relative(appRoot, file);
  // فحص بلوكات بسيطة: خاصية كبيرة داخل قاعدة لا تُستثنى
  const rules = css.split(/}/);
  for (const chunk of rules) {
    largeRe.lastIndex = 0;
    let m;
    while ((m = largeRe.exec(chunk))) {
      const px = Number(m[1]);
      if (!Number.isFinite(px) || px < 320) continue;
      const head = chunk.slice(0, 160);
      if (ALLOW_LARGE.some((re) => re.test(head) || re.test(chunk.slice(0, 400)))) {
        continue;
      }
      // فراغ زخرفي شائع: min-height كبير مع padding/margin فقط بلا محتوى بصري مسمّى
      if (/spacer|filler|gap-block|empty-space|decorative-space/i.test(chunk)) {
        issues.push(`${rel}: فراغ زخرفي كبير (${px}px) — ${head.replace(/\s+/g, " ").trim().slice(0, 80)}`);
        continue;
      }
      if (px >= 480 && /min-(?:block-size|height)/i.test(m[0]) && !/grid|flex|aspect|background-image|url\(/i.test(chunk)) {
        issues.push(
          `${rel}: min-size كبير بلا سياق بصري (${px}px) — راجع إن كان فراغًا زخرفيًا`,
        );
      }
    }
  }
}

if (reportOnly) {
  console.log("══ تقرير بوابة المساحات ══");
  notes.forEach((n) => console.log(n));
  if (issues.length) {
    console.log("\nملاحظات/مخالفات:");
    issues.forEach((i) => console.log(`  - ${i}`));
  } else {
    console.log("لا مخالفات.");
  }
  process.exit(0);
}

if (issues.length) {
  console.error("❌ بوابة قياس المساحات فشلت:\n");
  issues.forEach((i) => console.error(`  - ${i}`));
  process.exit(1);
}

notes.forEach((n) => console.log(n));
console.log("✓ بوابة قياس المساحات: عقود اللمس والفراغات سليمة");
